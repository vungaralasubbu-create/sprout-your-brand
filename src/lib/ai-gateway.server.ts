// Server-only Lovable AI Gateway helper. Do not import from client code.
import { AiJsonParseError, parseAiJson } from "./ai-json";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const BASE_URL = "https://ai.gateway.lovable.dev/v1";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

export function isAiAvailable(): boolean {
  return !!process.env.LOVABLE_API_KEY;
}

async function rawChat(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  jsonMode: boolean;
}): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI service not configured");

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.6,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (res.status === 429) throw new Error("AI service rate limit reached. Please retry shortly.");
  if (res.status === 402) throw new Error("AI service credits exhausted.");
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI service error (${res.status}): ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI service returned no content");
  return String(content);
}

/**
 * Call the AI Gateway and parse its response as JSON. Uses a robust parser
 * that repairs common defects (code fences, control chars in strings, stray
 * backslashes, trailing commas). Retries ONCE on parse failure with a strict
 * reminder, then throws with the invalid payload logged for developers only.
 */
export async function callLovableAiJson<T = unknown>(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}): Promise<T> {
  const attempt = async (extraSystem?: string) => {
    const messages = extraSystem
      ? [{ role: "system" as const, content: extraSystem }, ...opts.messages]
      : opts.messages;
    return rawChat({ ...opts, messages, jsonMode: true });
  };

  let raw = await attempt();
  try {
    return parseAiJson<T>(raw);
  } catch (err) {
    if (err instanceof AiJsonParseError) {
      // Developer log — never surfaced to end users.
      console.error("[callLovableAiJson] parse failed on first attempt", {
        field: err.field,
        offset: err.offset,
        truncated: err.truncated,
        message: err.message,
        preview: err.raw.slice(0, 400),
      });
    } else {
      console.error("[callLovableAiJson] parse failed on first attempt", err);
    }
    // Retry once with a strict reminder.
    raw = await attempt(
      "Your previous response was not valid JSON. Return ONLY a single JSON object. " +
        "Escape every newline, tab, and backslash inside string values. " +
        "Do not wrap the JSON in markdown code fences.",
    );
    try {
      return parseAiJson<T>(raw);
    } catch (err2) {
      if (err2 instanceof AiJsonParseError) {
        console.error("[callLovableAiJson] parse failed on retry", {
          field: err2.field,
          offset: err2.offset,
          truncated: err2.truncated,
          message: err2.message,
          preview: err2.raw.slice(0, 800),
        });
        // Friendly user-facing message; developer detail stays in logs.
        throw new Error(
          `AI returned an unreadable response${err2.field ? ` (near "${err2.field}")` : ""}. Please retry.`,
        );
      }
      throw err2;
    }
  }
}
