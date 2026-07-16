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
 * Call the AI Gateway and return the raw string content (no JSON parse).
 * Use this when the payload is prose/markdown so no JSON escaping applies —
 * the root fix for "Bad escaped character in JSON" when markdown contains
 * regex-like tokens (\d, \w, \s), LaTeX (\alpha), or Windows paths.
 */
export async function callLovableAiText(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}): Promise<string> {
  return rawChat({ ...opts, jsonMode: false });
}

/**
 * Call the AI Gateway and parse its response as JSON.
 *
 * Diagnostics: on parse failure the RAW response is logged (developer only,
 * never surfaced to end users) along with the offset and offending field.
 * A single automatic retry is issued with a strict "escape everything"
 * reminder before failing with a friendly error.
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
      // Developer log — full raw payload for diagnosis, NEVER shown to users.
      console.error("[callLovableAiJson] JSON.parse failed (attempt 1)", {
        parseError: err.message,
        offset: err.offset,
        field: err.field,
        truncated: err.truncated,
        rawResponse: err.raw,
      });
    } else {
      console.error("[callLovableAiJson] non-parse failure (attempt 1)", err);
    }
    // Retry once with a strict reminder.
    raw = await attempt(
      "Your previous response was not valid JSON. Return ONLY a single JSON object. " +
        "Escape every backslash, newline, tab, and double-quote inside string values " +
        "(\\\\ for a literal backslash, \\n for newline, \\t for tab, \\\" for a quote). " +
        "Do not wrap the JSON in markdown code fences.",
    );
    try {
      return parseAiJson<T>(raw);
    } catch (err2) {
      if (err2 instanceof AiJsonParseError) {
        console.error("[callLovableAiJson] JSON.parse failed (attempt 2 / final)", {
          parseError: err2.message,
          offset: err2.offset,
          field: err2.field,
          truncated: err2.truncated,
          rawResponse: err2.raw,
        });
        throw new Error(
          `AI returned an unreadable response${err2.field ? ` (near "${err2.field}")` : ""}. Please retry.`,
        );
      }
      throw err2;
    }
  }
}
