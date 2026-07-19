/**
 * Template CRUD for the Admin & Brand Engage Template Studio.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { defaultHtml } from "./render.server";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  brand_id: z.string().uuid().optional().nullable(),
  template_key: z.string().min(1).max(120),
  channel: z.enum(["email", "push", "inapp"]).default("email"),
  category: z.string().max(64).optional().nullable(),
  name: z.string().min(1).max(200),
  subject: z.string().max(300).optional().nullable(),
  preview_text: z.string().max(300).optional().nullable(),
  body_html: z.string().max(500_000).optional().nullable(),
  body_text: z.string().max(200_000).optional().nullable(),
  body_json: z.unknown().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const listEngageTemplates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      brand_id: z.string().uuid().optional().nullable(),
      channel: z.enum(["email", "push", "inapp"]).optional(),
      search: z.string().optional().nullable(),
    }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("engage_templates")
      .select("id, template_key, name, subject, preview_text, category, channel, is_active, is_system, brand_id, tenant_scope, updated_at")
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    if (data.brand_id) {
      query = query.or(`brand_id.eq.${data.brand_id},tenant_scope.eq.platform`);
    } else {
      query = query.eq("tenant_scope", "platform");
    }
    if (data.channel) query = query.eq("channel", data.channel);
    if (data.search) query = query.ilike("name", `%${data.search}%`);
    const { data: rows, error } = await query.limit(500);
    if (error) return { ok: false as const, error: error.message, templates: [] };
    return { ok: true as const, templates: rows ?? [] };
  });

export const getEngageTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("engage_templates")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, template: row };
  });

export const upsertEngageTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const tenant_scope = data.brand_id ? `brand:${data.brand_id}` : "platform";
    // If the caller only sent subject/text but no html, auto-render a default.
    let body_html = data.body_html ?? null;
    if (!body_html && data.body_text) {
      body_html = defaultHtml({
        headline: data.name,
        body: data.body_text,
        preview: data.preview_text ?? "",
      });
    }

    if (data.id) {
      const { error } = await context.supabase
        .from("engage_templates")
        .update({
          name: data.name,
          subject: data.subject ?? null,
          preview_text: data.preview_text ?? null,
          body_html,
          body_text: data.body_text ?? null,
          body_json: data.body_json ?? null,
          category: data.category ?? null,
          is_active: data.is_active ?? true,
        })
        .eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, id: data.id };
    }

    const { data: row, error } = await context.supabase
      .from("engage_templates")
      .insert({
        tenant_scope,
        brand_id: data.brand_id ?? null,
        template_key: data.template_key,
        channel: data.channel,
        category: data.category ?? null,
        name: data.name,
        subject: data.subject ?? null,
        preview_text: data.preview_text ?? null,
        body_html,
        body_text: data.body_text ?? null,
        body_json: data.body_json ?? null,
        is_active: data.is_active ?? true,
        created_by: context.userId,
      })
      .select("id")
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, id: row?.id };
  });

export const deleteEngageTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("engage_templates").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const sendEngageTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      template_key: z.string().min(1),
      to: z.string().email(),
      brand_id: z.string().uuid().optional().nullable(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { sendViaEngage } = await import("./send.server");
    const result = await sendViaEngage({
      templateKey: data.template_key,
      recipient: data.to,
      userId: context.userId,
      brandId: data.brand_id ?? null,
      category: "system",
      context: {
        recipient: data.to,
        first_name: "there",
        brand_name: "Glintr",
        app_url: process.env.APP_URL ?? "https://glintr.com",
        verify_url: "https://glintr.com/verify",
      },
    });
    return result;
  });
