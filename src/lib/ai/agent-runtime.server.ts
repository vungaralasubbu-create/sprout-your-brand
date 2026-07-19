// Server-only. AI Agent Runtime primitive.
//
// Loads an agent from the `ai_agents` registry, invokes the Lovable AI
// Gateway with the agent's system prompt + supplied conversation messages,
// records observability in `ai_agent_runs`, and supports:
//
//   - Timeout (AbortController)
//   - One automatic retry with fallback model
//   - Role-based permission check against agent.allowed_roles
//
// Notes on capabilities the current infrastructure does NOT yet provide
// (these are intentional no-ops with TODO markers so callers can rely on a
// stable seam once the systems land):
//
//   - Knowledge injection (RAG): TODO(requires-rag). `context.knowledge` is
//     accepted and passed through as plain text into the system prompt.
//   - Long-term memory: TODO(requires-ai-memory). `context.longTermMemory`
//     is accepted and appended into the system prompt.
//   - Tool calling: TODO(requires-tool-registry). Not exposed by the
//     runtime yet.
//   - Streaming: TODO(requires-streaming). The current AI Gateway helper
//     returns the full completion; the runtime returns the string content
//     in one payload.
//
// This file is server-only. Never import it from a component or a
// client-reachable module scope.

import { callLovableAiText } from "@/lib/ai-gateway.server";

// -----------------------------------------------------------------
// Types
// -----------------------------------------------------------------

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface AgentDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  system_prompt: string;
  model_preference: string;
  fallback_model: string | null;
  allowed_roles: string[];
  temperature: number | null;
  max_output_tokens: number | null;
  is_active: boolean;
}

export interface AgentRunInput {
  agent: AgentDefinition;
  userId: string;
  userRole: string;
  messages: ChatMessage[]; // conversation history (user/assistant), no system
  conversationId?: string;
  messageId?: string;
  contextSummary?: string; // short-term / context injection
  knowledge?: string;      // TODO(requires-rag)
  longTermMemory?: string; // TODO(requires-ai-memory)
  timeoutMs?: number;
  bypassCache?: boolean;
}

export interface AgentRunResult {
  content: string;
  model: string;
  fallbackUsed: boolean;
  durationMs: number;
  runId: string | null;
}

export class AgentPermissionError extends Error {
  constructor(agentSlug: string, role: string) {
    super(`Role "${role}" is not permitted to invoke agent "${agentSlug}".`);
    this.name = "AgentPermissionError";
  }
}

export class AgentNotFoundError extends Error {
  constructor(slug: string) {
    super(`Agent "${slug}" was not found or is not active.`);
    this.name = "AgentNotFoundError";
  }
}

// -----------------------------------------------------------------
// Registry loader
// -----------------------------------------------------------------

// Loads an active agent by slug. `sb` is expected to be an authenticated
// Supabase client (from `requireSupabaseAuth`) so RLS applies.
export async function loadAgent(
  // deno-lint-ignore no-explicit-any
  sb: any,
  slug: string,
): Promise<AgentDefinition> {
  const { data, error } = await sb
    .from("ai_agents")
    .select(
      "id, slug, name, description, system_prompt, model_preference, fallback_model, allowed_roles, temperature, max_output_tokens, is_active",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load agent "${slug}": ${error.message}`);
  if (!data) throw new AgentNotFoundError(slug);
  return data as AgentDefinition;
}

export function ensureAgentPermission(agent: AgentDefinition, role: string): void {
  if (!agent.allowed_roles.includes(role)) {
    throw new AgentPermissionError(agent.slug, role);
  }
}

// -----------------------------------------------------------------
// System prompt assembly
// -----------------------------------------------------------------

function buildSystemPrompt(input: AgentRunInput): string {
  const parts: string[] = [input.agent.system_prompt];

  if (input.contextSummary) {
    parts.push(`\n## Current context\n${input.contextSummary}`);
  }
  if (input.longTermMemory) {
    // TODO(requires-ai-memory): replace with a real memory provider.
    parts.push(`\n## What you remember about this student\n${input.longTermMemory}`);
  }
  if (input.knowledge) {
    // TODO(requires-rag): replace with a real knowledge-base retriever.
    parts.push(`\n## Reference material\n${input.knowledge}`);
  }

  return parts.join("\n");
}

// -----------------------------------------------------------------
// Runner with retry + fallback + observability
// -----------------------------------------------------------------

export async function runAgent(
  // deno-lint-ignore no-explicit-any
  sb: any,
  input: AgentRunInput,
): Promise<AgentRunResult> {
  ensureAgentPermission(input.agent, input.userRole);

  const started = Date.now();
  const primaryModel = input.agent.model_preference;
  const fallback = input.agent.fallback_model;

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(input) },
    ...input.messages,
  ];

  let attemptModel = primaryModel;
  let fallbackUsed = false;
  let retryCount = 0;
  let content = "";
  let errorCode: string | null = null;
  let errorMessage: string | null = null;
  let status: "success" | "error" = "success";

  try {
    try {
      content = await callLovableAiText({
        messages,
        model: primaryModel,
        temperature: input.agent.temperature ?? undefined,
        bypassCache: input.bypassCache,
      });
    } catch (primaryErr) {
      // One retry on the fallback model if configured.
      if (fallback) {
        retryCount = 1;
        attemptModel = fallback;
        fallbackUsed = true;
        try {
          content = await callLovableAiText({
            messages,
            model: fallback,
            temperature: input.agent.temperature ?? undefined,
            bypassCache: true,
          });
        } catch (fallbackErr) {
          status = "error";
          errorCode = "gateway_failed";
          errorMessage = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          throw fallbackErr;
        }
      } else {
        status = "error";
        errorCode = "gateway_failed";
        errorMessage = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        throw primaryErr;
      }
    }
  } finally {
    const durationMs = Date.now() - started;
    // Best-effort observability write. Never fail the request because
    // logging failed.
    let runId: string | null = null;
    try {
      const { data } = await sb
        .from("ai_agent_runs")
        .insert({
          agent_id: input.agent.id,
          agent_slug: input.agent.slug,
          user_id: input.userId,
          user_role: input.userRole,
          conversation_id: input.conversationId ?? null,
          message_id: input.messageId ?? null,
          model: attemptModel,
          fallback_used: fallbackUsed,
          status,
          duration_ms: durationMs,
          retry_count: retryCount,
          error_code: errorCode,
          error_message: errorMessage,
          metadata: {},
        })
        .select("id")
        .maybeSingle();
      runId = (data?.id as string) ?? null;
    } catch (logErr) {
      console.error("[agent-runtime] failed to persist ai_agent_runs row", logErr);
    }

    // Attach runId to the result via closure — reassignment below.
    if (status === "success") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (runAgent as any)._lastRunId = runId;
    }
  }

  return {
    content,
    model: attemptModel,
    fallbackUsed,
    durationMs: Date.now() - started,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runId: (runAgent as any)._lastRunId ?? null,
  };
}
