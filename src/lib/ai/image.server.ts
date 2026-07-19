// Server-only image generation helper. Calls OpenAI's native image endpoint
// directly using OPENAI_API_KEY. No Lovable AI gateway.
//
// Consumers should keep calling `generateImageBase64(prompt)` — the underlying
// provider is configurable here without touching callers.

const OPENAI_IMAGES_URL =
  (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1") + "/images/generations";

export const DEFAULT_IMAGE_MODEL = process.env.IMAGE_MODEL ?? "gpt-image-1";

export type ImageGenOptions = {
  model?: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
};

export function isImageProviderAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function generateImageBase64(
  prompt: string,
  opts: ImageGenOptions = {},
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Image provider not configured (OPENAI_API_KEY missing)");
  const res = await fetch(OPENAI_IMAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_IMAGE_MODEL,
      prompt,
      size: opts.size ?? "1024x1024",
      quality: opts.quality ?? "medium",
      n: 1,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Image generation failed (${res.status}): ${t.slice(0, 240)}`);
  }
  const data = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generator returned no data");
  return b64;
}

export async function generateImageDataUrl(
  prompt: string,
  opts: ImageGenOptions = {},
): Promise<string> {
  const b64 = await generateImageBase64(prompt, opts);
  return `data:image/png;base64,${b64}`;
}
