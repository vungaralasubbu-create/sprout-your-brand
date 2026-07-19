/**
 * AI content generator for automation nodes.
 * Generates subject lines, email/SMS/WhatsApp/push copy, captions.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const genSchema = z.object({
  channel: z.enum(["email", "sms", "whatsapp", "push", "inapp", "caption"]).default("email"),
  goal: z.string().min(1).max(1000),
  audience: z.string().max(300).optional(),
  tone: z.enum(["friendly", "professional", "urgent", "playful", "authoritative"]).default("friendly"),
  brand_name: z.string().max(120).optional(),
});

async function callLovableAI(prompt: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: "You are an elite lifecycle marketer for an EdTech platform (Glintr). Return ONLY valid JSON with the requested keys — no prose, no markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.75,
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("AI is rate-limited. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    throw new Error(`AI Gateway error: HTTP ${res.status}`);
  }
  const body = await res.json();
  return (body?.choices?.[0]?.message?.content ?? "").replace(/```json|```/g, "").trim();
}

export const generateAutomationContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => genSchema.parse(data))
  .handler(async ({ data }) => {
    const constraints: Record<string, string> = {
      email: "Return { subject: string, preview: string, html: string } — html should be a self-contained email body with 1 strong CTA and headings.",
      sms: "Return { body: string } — under 160 chars, no links longer than 30 chars.",
      whatsapp: "Return { body: string } — WhatsApp-friendly, use line breaks and 1 emoji max.",
      push: "Return { title: string, body: string } — title ≤ 40 chars, body ≤ 90 chars.",
      inapp: "Return { title: string, body: string } — punchy, action-oriented.",
      caption: "Return { caption: string, hashtags: string[] } — for social media.",
    };
    const prompt = `Channel: ${data.channel}\nGoal: ${data.goal}\nAudience: ${data.audience ?? "Glintr learners and partners"}\nTone: ${data.tone}\nBrand: ${data.brand_name ?? "Glintr"}\n\n${constraints[data.channel]}`;
    try {
      const raw = await callLovableAI(prompt);
      const parsed = JSON.parse(raw);
      return { ok: true as const, content: parsed };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "AI generation failed" };
    }
  });
