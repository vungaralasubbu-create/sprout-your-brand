/**
 * AI Platform Server Functions
 * ----------------------------
 * Unified callable interface for the Multi-Provider AI Platform.
 * Callers pass a routing profile + payload; the platform picks the best
 * (provider, model), retries on transient errors, and fails over across
 * providers automatically. Every attempt is recorded to health telemetry.
 *
 * These are additive: existing `student-mentor`, `career-coach`, and
 * `marketing-strategist` functions continue to work unchanged.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RoutingProfileSchema = z.object({
  quality: z.enum(["fast", "balanced", "premium"]).optional(),
  needsTools: z.boolean().optional(),
  needsStructured: z.boolean().optional(),
  needsStreaming: z.boolean().optional(),
  estimatedInputTokens: z.number().int().positive().optional(),
  latencyBudgetMs: z.number().int().positive().optional(),
  preferredProvider: z.enum(["openai", "anthropic", "google"]).optional(),
  preferredModel: z.string().optional(),
});

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string(),
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
});

const ChatInput = z.object({
  profile: RoutingProfileSchema.default({}),
  messages: z.array(MessageSchema).min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(8192).optional(),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.any(),
  })).optional(),
  responseSchema: z.any().optional(),
});

export const aiChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const { executeChat } = await import("./router/failover.server");
    const res = await executeChat(
      { ...data.profile, kind: "chat", needsTools: !!data.tools?.length, needsStructured: !!data.responseSchema },
      {
        messages: data.messages,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        tools: data.tools,
        responseSchema: data.responseSchema,
      },
    );
    // Project to a JSON-serializable envelope for the RPC boundary.
    return {
      ok: res.ok,
      chosen: res.chosen ?? null,
      attempts: res.attempts,
      error: res.error ?? null,
      result: res.result
        ? {
            content: res.result.content,
            toolCalls: (res.result.toolCalls ?? []).map((t) => ({
              name: t.name,
              argumentsJson: JSON.stringify(t.arguments),
            })),
            structuredJson: res.result.structured != null ? JSON.stringify(res.result.structured) : null,
            usage: res.result.usage,
            finishReason: res.result.finishReason,
          }
        : null,
    };
  });

const EmbedInput = z.object({
  profile: RoutingProfileSchema.default({}),
  input: z.union([z.string(), z.array(z.string())]),
});

export const aiEmbed = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmbedInput.parse(input))
  .handler(async ({ data }) => {
    const { executeEmbedding } = await import("./router/failover.server");
    return executeEmbedding({ ...data.profile, kind: "embedding" }, { input: data.input });
  });

const ImageInput = z.object({
  profile: RoutingProfileSchema.default({}),
  prompt: z.string().min(1),
  size: z.string().optional(),
  quality: z.enum(["low", "medium", "high"]).optional(),
});

export const aiImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ImageInput.parse(input))
  .handler(async ({ data }) => {
    const { executeImage } = await import("./router/failover.server");
    return executeImage(
      { ...data.profile, kind: "image" },
      { prompt: data.prompt, size: data.size, quality: data.quality },
    );
  });

export const aiHealthCheck = createServerFn({ method: "POST" })
  .handler(async () => {
    const { pingAll, getHealthSnapshot } = await import("./router/health.server");
    const [pings, snapshot] = await Promise.all([pingAll(), getHealthSnapshot()]);
    return { pings, snapshot };
  });

export const aiHealthSnapshot = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getHealthSnapshot } = await import("./router/health.server");
    return { snapshot: await getHealthSnapshot() };
  });
