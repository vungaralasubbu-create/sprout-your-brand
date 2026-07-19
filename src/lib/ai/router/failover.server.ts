/**
 * Failover Executor
 * -----------------
 * Given a routing chain (from `planRoute`), execute the request against
 * providers in order. Fall through on retryable / non-terminal errors,
 * record every attempt to health telemetry, and return the first success
 * or a `GracefulFailure` describing every attempted provider.
 */

import { GatewayError } from "../providers/base-adapter";
import { getProvider } from "../providers/registry.server";
import type {
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ImageRequest,
  ImageResponse,
  ProviderId,
  TaskKind,
} from "../providers/types";
import { recordProviderEvent } from "./health.server";
import { getHealthSnapshot } from "./health.server";
import { planRoute, type RoutingChoice, type RoutingProfile } from "./smart-router";

export interface AttemptRecord {
  provider: ProviderId;
  model: string;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  reason: string;
}

export interface ExecutionResult<T> {
  ok: boolean;
  result?: T;
  attempts: AttemptRecord[];
  chosen?: RoutingChoice;
  error?: { code: string; message: string };
}

function isTerminal(err: unknown): boolean {
  if (err instanceof GatewayError) {
    // 402 credits, 401/403 auth, 400 bad request are terminal.
    return !err.retryable;
  }
  return false;
}

async function runOne<T>(
  choice: RoutingChoice,
  task: TaskKind,
  invoke: (choice: RoutingChoice) => Promise<{ value: T; tokensIn?: number; tokensOut?: number }>,
  userId?: string,
): Promise<{ value?: T; record: AttemptRecord; terminal: boolean }> {
  const t0 = Date.now();
  try {
    const { value, tokensIn, tokensOut } = await invoke(choice);
    const latencyMs = Date.now() - t0;
    await recordProviderEvent({
      provider: choice.provider,
      model: choice.model,
      task,
      latencyMs,
      success: true,
      tokensIn,
      tokensOut,
      userId,
    });
    return {
      value,
      record: { provider: choice.provider, model: choice.model, latencyMs, success: true, reason: choice.reason },
      terminal: false,
    };
  } catch (err) {
    const latencyMs = Date.now() - t0;
    const gwErr = err instanceof GatewayError ? err : new GatewayError(String(err), 0, "network", true);
    await recordProviderEvent({
      provider: choice.provider,
      model: choice.model,
      task,
      latencyMs,
      success: false,
      errorCode: gwErr.code,
      errorMessage: gwErr.message,
      userId,
    });
    return {
      record: {
        provider: choice.provider,
        model: choice.model,
        latencyMs,
        success: false,
        errorCode: gwErr.code,
        errorMessage: gwErr.message,
        reason: choice.reason,
      },
      terminal: isTerminal(gwErr),
    };
  }
}

async function planFor(profile: RoutingProfile): Promise<RoutingChoice[]> {
  const health = await getHealthSnapshot();
  return planRoute(profile, health);
}

export async function executeChat(
  profile: RoutingProfile,
  req: Omit<ChatRequest, "model">,
  userId?: string,
): Promise<ExecutionResult<ChatResponse>> {
  const chain = await planFor({ ...profile, kind: "chat" });
  const attempts: AttemptRecord[] = [];
  for (const choice of chain) {
    const { value, record, terminal } = await runOne<ChatResponse>(
      choice,
      "chat",
      (c) => {
        const adapter = getProvider(c.provider);
        return adapter.chat({ ...req, model: c.model }).then((r) => ({
          value: r,
          tokensIn: r.usage.promptTokens,
          tokensOut: r.usage.completionTokens,
        }));
      },
      userId,
    );
    attempts.push(record);
    if (value) return { ok: true, result: value, attempts, chosen: choice };
    if (terminal) {
      return {
        ok: false,
        attempts,
        error: { code: record.errorCode ?? "terminal", message: record.errorMessage ?? "Terminal error" },
      };
    }
  }
  return {
    ok: false,
    attempts,
    error: { code: "all_providers_failed", message: "Every provider in the failover chain failed." },
  };
}

export async function executeEmbedding(
  profile: RoutingProfile,
  req: Omit<EmbeddingRequest, "model">,
  userId?: string,
): Promise<ExecutionResult<EmbeddingResponse>> {
  const chain = await planFor({ ...profile, kind: "embedding" });
  const attempts: AttemptRecord[] = [];
  for (const choice of chain) {
    const { value, record, terminal } = await runOne<EmbeddingResponse>(
      choice,
      "embedding",
      (c) => {
        const adapter = getProvider(c.provider);
        return adapter.embed({ ...req, model: c.model }).then((r) => ({ value: r, tokensIn: r.usage.promptTokens }));
      },
      userId,
    );
    attempts.push(record);
    if (value) return { ok: true, result: value, attempts, chosen: choice };
    if (terminal) return { ok: false, attempts, error: { code: record.errorCode ?? "terminal", message: record.errorMessage ?? "Terminal" } };
  }
  return { ok: false, attempts, error: { code: "all_providers_failed", message: "Every embedding provider failed." } };
}

export async function executeImage(
  profile: RoutingProfile,
  req: Omit<ImageRequest, "model">,
  userId?: string,
): Promise<ExecutionResult<ImageResponse>> {
  const chain = await planFor({ ...profile, kind: "image" });
  const attempts: AttemptRecord[] = [];
  for (const choice of chain) {
    const { value, record, terminal } = await runOne<ImageResponse>(
      choice,
      "image",
      (c) => getProvider(c.provider).image({ ...req, model: c.model }).then((r) => ({ value: r })),
      userId,
    );
    attempts.push(record);
    if (value) return { ok: true, result: value, attempts, chosen: choice };
    if (terminal) return { ok: false, attempts, error: { code: record.errorCode ?? "terminal", message: record.errorMessage ?? "Terminal" } };
  }
  return { ok: false, attempts, error: { code: "all_providers_failed", message: "Every image provider failed." } };
}

/**
 * Streaming failover is bounded to the primary + one fallback to preserve
 * time-to-first-byte. If the primary emits any chunk, we commit; otherwise
 * fall through to the fallback once.
 */
export async function *executeChatStream(
  profile: RoutingProfile,
  req: Omit<ChatRequest, "model">,
  userId?: string,
): AsyncGenerator<{ chunk?: string; done?: boolean; chosen?: RoutingChoice; error?: { code: string; message: string } }> {
  const chain = (await planFor({ ...profile, kind: "chat", needsStreaming: true })).slice(0, 2);
  for (const choice of chain) {
    const t0 = Date.now();
    let received = 0;
    try {
      const adapter = getProvider(choice.provider);
      for await (const c of adapter.stream({ ...req, model: choice.model })) {
        if (received === 0) yield { chosen: choice };
        if (c.delta) {
          received++;
          yield { chunk: c.delta };
        }
        if (c.done) {
          const latencyMs = Date.now() - t0;
          await recordProviderEvent({ provider: choice.provider, model: choice.model, task: "streaming", latencyMs, success: true, userId });
          yield { done: true };
          return;
        }
      }
      // Stream ended without done marker — treat as success.
      await recordProviderEvent({ provider: choice.provider, model: choice.model, task: "streaming", latencyMs: Date.now() - t0, success: true, userId });
      yield { done: true };
      return;
    } catch (err) {
      const gwErr = err instanceof GatewayError ? err : new GatewayError(String(err), 0, "network", true);
      await recordProviderEvent({
        provider: choice.provider, model: choice.model, task: "streaming",
        latencyMs: Date.now() - t0, success: false, errorCode: gwErr.code, errorMessage: gwErr.message, userId,
      });
      // If we already emitted chunks, we cannot restart mid-stream.
      if (received > 0 || isTerminal(gwErr)) {
        yield { error: { code: gwErr.code, message: gwErr.message } };
        return;
      }
      // else loop to next provider
    }
  }
  yield { error: { code: "all_providers_failed", message: "Streaming failover exhausted." } };
}
