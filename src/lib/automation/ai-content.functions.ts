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
  const { callAiChatCompletions } = await import("@/lib/ai-gateway.server");
  const content = await callAiChatCompletions({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an elite lifecycle marketer for an EdTech platform (Glintr). Return ONLY valid JSON with the requested keys — no prose, no markdown." },
      { role: "user", content: prompt },
    ],
    temperature: 0.75,
    response_format: { type: "json_object" },
  });
  return content.replace(/```json|```/g, "").trim();
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
