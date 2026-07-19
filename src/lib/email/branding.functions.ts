/**
 * Server functions for managing email branding: partner logos library and
 * per-brand email settings. Super admins manage everything; brand owners
 * scope to their own brand via RLS.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Logos ----------

export const listPartnerLogos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { brandId?: string | null } | undefined) => v ?? {})
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("email_partner_logos")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data.brandId) q = q.eq("brand_id", data.brandId);
    else q = q.is("brand_id", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertPartnerLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: {
    id?: string;
    brand_id?: string | null;
    name: string;
    logo_url: string;
    logo_url_dark?: string | null;
    link_url?: string | null;
    category?: string;
    enabled?: boolean;
    sort_order?: number;
  }) => v)
  .handler(async ({ data, context }) => {
    const payload = {
      brand_id: data.brand_id ?? null,
      name: data.name,
      logo_url: data.logo_url,
      logo_url_dark: data.logo_url_dark ?? null,
      link_url: data.link_url ?? null,
      category: data.category ?? "partner",
      enabled: data.enabled ?? true,
      sort_order: data.sort_order ?? 0,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("email_partner_logos")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("email_partner_logos")
      .insert({ ...payload, created_by: context.userId })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { id: inserted?.id as string };
  });

export const deletePartnerLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string }) => v)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("email_partner_logos")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderPartnerLogos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { orders: Array<{ id: string; sort_order: number }> }) => v)
  .handler(async ({ data, context }) => {
    for (const o of data.orders) {
      await context.supabase
        .from("email_partner_logos")
        .update({ sort_order: o.sort_order })
        .eq("id", o.id);
    }
    return { ok: true };
  });

// ---------- Brand settings ----------

export const getEmailBrandSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { brandId?: string | null } | undefined) => v ?? {})
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("email_brand_settings").select("*");
    if (data.brandId) q = q.eq("brand_id", data.brandId);
    else q = q.eq("is_platform", true);
    const { data: row } = await q.maybeSingle();
    return row;
  });

export const upsertEmailBrandSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: Record<string, unknown> & {
    brand_id?: string | null;
    is_platform?: boolean;
  }) => v)
  .handler(async ({ data, context }) => {
    const payload = { ...data };
    // Idempotent upsert on the appropriate unique key.
    if (payload.is_platform) {
      const { data: existing } = await context.supabase
        .from("email_brand_settings")
        .select("id")
        .eq("is_platform", true)
        .maybeSingle();
      if (existing) {
        const { error } = await context.supabase
          .from("email_brand_settings")
          .update(payload as never)
          .eq("id", existing.id as string);
        if (error) throw new Error(error.message);
        return { id: existing.id as string };
      }
    } else if (payload.brand_id) {
      const { data: existing } = await context.supabase
        .from("email_brand_settings")
        .select("id")
        .eq("brand_id", payload.brand_id as string)
        .maybeSingle();
      if (existing) {
        const { error } = await context.supabase
          .from("email_brand_settings")
          .update(payload as never)
          .eq("id", existing.id as string);
        if (error) throw new Error(error.message);
        return { id: existing.id as string };
      }
    }
    const { data: inserted, error } = await context.supabase
      .from("email_brand_settings")
      .insert(payload as never)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { id: inserted?.id as string };
  });

// ---------- Preview ----------

export const previewBrandedEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { brandId?: string | null; headline?: string; body?: string; ctaLabel?: string; ctaUrl?: string }) => v)
  .handler(async ({ data }) => {
    const { resolveEmailBrand, resolvePartnerLogos, wrapWithBrandedShell } =
      await import("./branding.server");
    const brand = await resolveEmailBrand(data.brandId ?? null);
    const logos = await resolvePartnerLogos(data.brandId ?? null);
    const headline = data.headline ?? `Welcome to ${brand.brand_name}`;
    const body = data.body ?? "This is a preview of how professional, branded emails will look when sent from your platform. Every template automatically gets the header, footer, partner logos, and social links.";
    const cta = data.ctaLabel && data.ctaUrl
      ? `<div style="margin-top:24px"><a href="${data.ctaUrl}" style="display:inline-block;padding:14px 26px;background:${brand.primary_color};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px">${data.ctaLabel}</a></div>`
      : "";
    const inner = `<h1 style="margin:0 0 16px 0;color:#0f172a;font-size:26px;font-weight:700;line-height:1.25;letter-spacing:-0.01em">${headline}</h1>
      <p style="margin:0 0 16px 0;color:#334155;font-size:15px;line-height:1.7">${body}</p>${cta}`;
    return { html: wrapWithBrandedShell(inner, brand, logos, headline) };
  });
