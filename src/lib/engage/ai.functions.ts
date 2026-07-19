/**
 * AI email generator — drafts subject lines, previews, body copy, CTAs, and
 * A/B variants using Lovable AI Gateway (google/gemini-3.5-flash by default).
 * All generations are audited in engage_ai_generations.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const draftSchema = z.object({
  goal: z.string().min(1).max(2000),
  audience: z.string().max(200).optional(),
  tone: z.enum(["friendly", "professional", "urgent", "playful", "authoritative"]).default("friendly"),
  brand_name: z.string().max(120).optional(),
  variants: z.number().min(1).max(4).default(1),
});

async function callLovableAI(prompt: string, model = "google/gemini-3.5-flash"): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are an expert email marketer for an EdTech platform. Return only valid JSON with the requested fields." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit — try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    throw new Error(`AI Gateway error: HTTP ${res.status}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json?.choices?.[0]?.message?.content ?? "";
}

function parseJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return null;
  }
}

export const aiDraftEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => draftSchema.parse(data))
  .handler(async ({ data, context }) => {
    const prompt = `Draft ${data.variants} email variant${data.variants > 1 ? "s" : ""} for the goal below. Tone: ${data.tone}. Audience: ${data.audience ?? "learners"}. Brand: ${data.brand_name ?? "Glintr"}.\n\nGoal: ${data.goal}\n\nReturn JSON: {"variants":[{"subject":"...","preview":"...","headline":"...","body":"...","cta_label":"..."}]}`;
    let raw = "";
    try {
      raw = await callLovableAI(prompt);
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "AI failed" };
    }
    const parsed = parseJson(raw);
    if (!parsed) return { ok: false as const, error: "AI returned unstructured output. Please retry." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("engage_ai_generations").insert({
      user_id: context.userId,
      kind: "body",
      model: "google/gemini-3.5-flash",
      prompt,
      input: data as never,
      output: parsed as never,
    });
    return { ok: true as const, variants: (parsed.variants as unknown) ?? [parsed] };
  });

export const aiDraftSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ topic: z.string().min(1).max(500), count: z.number().min(1).max(10).default(5) }).parse(data),
  )
  .handler(async ({ data }) => {
    const prompt = `Write ${data.count} short, high-open-rate email subject lines about: "${data.topic}". Return JSON: {"subjects":["...","..."]}. Keep each under 50 chars.`;
    try {
      const raw = await callLovableAI(prompt);
      const parsed = parseJson(raw);
      const subjects = (parsed?.subjects as string[]) ?? [];
      return { ok: true as const, subjects };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "AI failed", subjects: [] };
    }
  });
