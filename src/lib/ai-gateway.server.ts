// Server-only Lovable AI Gateway helper. Do not import from client code.
type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const BASE_URL = "https://ai.gateway.lovable.dev/v1";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

export function isAiAvailable(): boolean {
  return !!process.env.LOVABLE_API_KEY;
}

export async function callLovableAiJson<T = unknown>(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}): Promise<T> {
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
      response_format: { type: "json_object" },
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
  try {
    return JSON.parse(content) as T;
  } catch {
    // Attempt to extract JSON block
    const m = String(content).match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as T;
    throw new Error("AI service returned invalid JSON");
  }
}
