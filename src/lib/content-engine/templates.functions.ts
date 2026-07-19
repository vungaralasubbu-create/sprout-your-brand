/**
 * AI Content Engine — Templates.
 * Reusable campaign presets (goal/audience/tone/platforms/language).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TemplateInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().max(60).optional().nullable(),
  isPublic: z.boolean().default(false),
  payload: z.record(z.any()).default({}),
});

export const upsertTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TemplateInput.parse(input))
  .handler(async ({ data, context }) => {
    const row = {
      owner_id: context.userId,
      name: data.name,
      description: data.description ?? null,
      category: data.category ?? null,
      is_public: data.isPublic,
      payload: data.payload,
    };
    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("ce_templates").update(row).eq("id", data.id).select().single();
      if (error) throw error;
      return { template: updated };
    }
    const { data: created, error } = await context.supabase
      .from("ce_templates").insert(row).select().single();
    if (error) throw error;
    return { template: created };
  });

export const listTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ce_templates")
      .select("id, name, description, category, is_public, payload, updated_at, owner_id")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return { templates: data ?? [] };
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ce_templates").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Instantiate a campaign from a template payload. */
export const instantiateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    templateId: z.string().uuid(),
    overrides: z.record(z.any()).default({}),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: tpl, error } = await context.supabase
      .from("ce_templates").select("*").eq("id", data.templateId).single();
    if (error) throw error;
    const payload = { ...(tpl.payload as Record<string, unknown>), ...data.overrides };
    const { data: campaign, error: e2 } = await context.supabase
      .from("ce_campaigns")
      .insert({
        owner_id: context.userId,
        title: (payload.title as string) ?? tpl.name,
        description: (payload.description as string) ?? null,
        goal: (payload.goal as string) ?? null,
        audience: (payload.audience as string) ?? null,
        platforms: (payload.platforms as string[]) ?? [],
        language: (payload.language as string) ?? "en",
        tone: (payload.tone as string) ?? null,
        brand_id: (payload.brandId as string) ?? null,
        status: "draft",
        meta: { fromTemplateId: tpl.id },
      })
      .select().single();
    if (e2) throw e2;
    return { campaign };
  });
