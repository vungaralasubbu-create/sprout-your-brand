// Server-only image generation helper. Calls OpenAI's native image endpoint
// directly using OPENAI_API_KEY. No Lovable AI gateway.
//
// Additive: if the primary image model returns a 400/403 (typical for
// unverified orgs on `gpt-image-1`), we automatically fall back to the next
// model in IMAGE_MODEL_FALLBACKS. Callers do not change.

const OPENAI_IMAGES_URL =
  (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1") + "/images/generations";

export const DEFAULT_IMAGE_MODEL = process.env.IMAGE_MODEL ?? "gpt-image-1";

// Ordered list of models to try. First is DEFAULT_IMAGE_MODEL; then a safe
// broadly-available fallback so image generation keeps working when the
// preferred model is blocked (org verification, quota, etc.).
const IMAGE_MODEL_FALLBACKS = Array.from(
  new Set(
    [
      DEFAULT_IMAGE_MODEL,
      ...(process.env.IMAGE_MODEL_FALLBACKS?.split(",").map((s) => s.trim()).filter(Boolean) ?? []),
      "dall-e-3",
    ].filter(Boolean),
  ),
);

export type ImageGenOptions = {
  model?: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
};

export function isImageProviderAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

type ImageResp = { data?: Array<{ b64_json?: string; url?: string }> };

async function callOnce(
  key: string,
  model: string,
  prompt: string,
  opts: ImageGenOptions,
): Promise<{ ok: true; b64: string } | { ok: false; status: number; body: string }> {
  // DALL-E 3 does not accept the gpt-image-1 `quality` values.
  const body: Record<string, unknown> = {
    model,
    prompt,
    size: opts.size ?? "1024x1024",
    n: 1,
    response_format: "b64_json",
  };
  if (model.startsWith("gpt-image")) {
    body.quality = opts.quality ?? "medium";
    delete body.response_format; // gpt-image-1 always returns b64_json
  } else if (model === "dall-e-3") {
    // dall-e-3 quality is "standard" | "hd"
    body.quality = opts.quality === "high" ? "hd" : "standard";
  }
  const res = await fetch(OPENAI_IMAGES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return { ok: false, status: res.status, body: t.slice(0, 400) };
  }
  const data = (await res.json()) as ImageResp;
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) return { ok: false, status: 502, body: "Image generator returned no data" };
  return { ok: true, b64 };
}

export async function generateImageBase64(
  prompt: string,
  opts: ImageGenOptions = {},
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Image provider not configured (OPENAI_API_KEY missing)");

  const preferred = opts.model ?? DEFAULT_IMAGE_MODEL;
  const chain = [preferred, ...IMAGE_MODEL_FALLBACKS.filter((m) => m !== preferred)];
  const failures: string[] = [];
  for (const model of chain) {
    const attempt = await callOnce(key, model, prompt, opts);
    if (attempt.ok) {
      if (failures.length) console.log(`[image] recovered via fallback model=${model}`);
      return attempt.b64;
    }
    const msg = `model=${model} status=${attempt.status} body=${attempt.body}`;
    console.error(`[image] attempt failed ${msg}`);
    failures.push(msg);
    // Only fall back for typical unavailable/verification/quota errors.
    if (![400, 401, 403, 404, 429].includes(attempt.status)) break;
  }
  throw new Error(`Image generation failed. ${failures.join(" | ")}`);
}

export async function generateImageDataUrl(
  prompt: string,
  opts: ImageGenOptions = {},
): Promise<string> {
  const b64 = await generateImageBase64(prompt, opts);
  return `data:image/png;base64,${b64}`;
}
