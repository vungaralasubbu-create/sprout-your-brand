// Thin wrapper around the centralized AI router for the social-automation module.
// Returns either a string (default) or parsed JSON when responseFormat === "json".

import { executeChat } from "@/lib/ai/router/failover.server";

export type AIChatArgs = {
  system?: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  responseFormat?: "text" | "json";
  temperature?: number;
  maxTokens?: number;
};

export async function aiChat(args: AIChatArgs): Promise<string | Record<string, unknown>> {
  const messages = [
    ...(args.system ? [{ role: "system" as const, content: args.system }] : []),
    ...args.messages,
  ];
  const result = await executeChat(
    { kind: "chat", quality: "balanced" },
    {
      messages,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      responseFormat: args.responseFormat === "json" ? { type: "json_object" } : undefined,
    } as Parameters<typeof executeChat>[1],
  );
  if (!result.ok) return args.responseFormat === "json" ? {} : "";
  const text = (result.result as { content?: string; text?: string }).content ??
    (result.result as { text?: string }).text ??
    "";
  if (args.responseFormat === "json") {
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return text;
}
