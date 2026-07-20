import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Enterprise Brand Kit — data layer.
 *
 * Owner/staff-scoped. All AI modules across Glintr (Marketing OS, SEO,
 * Blogs, Emails, Notifications, future Image/Video/Ad/Chat) call
 * `getBrandContext` and inject the resulting system prompt via the
 * centralized AI Router. No module hardcodes tone, colors, or CTAs.
 */

// ---------- Types ----------
export type BrandKit = {
  id: string;
  owner_id: string;
  brand_id: string | null;
  name: string;
  slug: string | null;
  is_default: boolean;
  business_name: string | null;
  tagline: string | null;
  description: string | null;
  mission: string | null;
  vision: string | null;
  core_values: string[];
  industry: string | null;
  website: string | null;
  support_email: string | null;
  phone: string | null;
  address: string | null;
  social_links: Record<string, string>;
  personality: string[];
  tone_of_voice: string[];
  writing_style: string[];
  reading_level: string | null;
  // JSONB blobs — kept loose to survive TanStack serialization
  target_audience: any;
  colors: any;
  typography: any;
  logos: any;
  guidelines: any;
  writing_rules: any;
  content_rules: any;
  compliance: any;
  approval_policy: any;
  ai_rules: any;
  keywords: any;
  metadata: any;
  created_at: string;
  updated_at: string;
};

// ---------- listBrandKits ----------
export const listBrandKits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mkt_brand_kits")
      .select("*")
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { kits: (data ?? []) as BrandKit[] };
  });

// ---------- getBrandKit ----------
export const getBrandKit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: kit, error } = await context.supabase
      .from("mkt_brand_kits")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!kit) throw new Error("Brand Kit not found");
    const [{ data: assets }, { data: templates }, { data: versions }] =
      await Promise.all([
        context.supabase.from("mkt_brand_kit_assets").select("*").eq("brand_kit_id", data.id).order("created_at", { ascending: false }),
        context.supabase.from("mkt_brand_kit_templates").select("*").eq("brand_kit_id", data.id).order("channel"),
        context.supabase.from("mkt_brand_kit_versions").select("id,version,note,created_at,created_by").eq("brand_kit_id", data.id).order("version", { ascending: false }).limit(50),
      ]);
    return {
      kit: kit as BrandKit,
      assets: assets ?? [],
      templates: templates ?? [],
      versions: versions ?? [],
    };
  });

// ---------- getDefaultBrandKit (used by AI modules) ----------
export const getDefaultBrandKit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Prefer explicit default; fall back to most recently updated
    const { data: def } = await context.supabase
      .from("mkt_brand_kits")
      .select("*")
      .eq("is_default", true)
      .maybeSingle();
    if (def) return { kit: def as BrandKit | null };
    const { data } = await context.supabase
      .from("mkt_brand_kits")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { kit: (data ?? null) as BrandKit | null };
  });

// ---------- saveBrandKit (upsert) ----------
const BrandKitInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).optional().nullable(),
  brand_id: z.string().uuid().optional().nullable(),
  is_default: z.boolean().optional(),
  business_name: z.string().max(200).optional().nullable(),
  tagline: z.string().max(300).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  mission: z.string().max(2000).optional().nullable(),
  vision: z.string().max(2000).optional().nullable(),
  core_values: z.array(z.string()).optional(),
  industry: z.string().max(120).optional().nullable(),
  website: z.string().max(300).optional().nullable(),
  support_email: z.string().max(200).optional().nullable(),
  phone: z.string().max(60).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  social_links: z.record(z.string()).optional(),
  personality: z.array(z.string()).optional(),
  tone_of_voice: z.array(z.string()).optional(),
  writing_style: z.array(z.string()).optional(),
  reading_level: z.string().optional().nullable(),
  target_audience: z.record(z.unknown()).optional(),
  colors: z.record(z.string()).optional(),
  typography: z.record(z.string()).optional(),
  logos: z.record(z.string()).optional(),
  guidelines: z.record(z.string()).optional(),
  writing_rules: z.record(z.unknown()).optional(),
  content_rules: z.record(z.unknown()).optional(),
  compliance: z.record(z.string()).optional(),
  approval_policy: z.record(z.boolean()).optional(),
  ai_rules: z.record(z.unknown()).optional(),
  keywords: z.record(z.array(z.string())).optional(),
  note: z.string().optional(),
});

export const saveBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => BrandKitInput.parse(v))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { id, note, ...fields } = data;

    // If setting default, clear other defaults for this owner
    if (fields.is_default) {
      await supabase
        .from("mkt_brand_kits")
        .update({ is_default: false })
        .eq("owner_id", userId)
        .neq("id", id ?? "00000000-0000-0000-0000-000000000000");
    }

    let kitId = id;
    if (id) {
      const { error } = await supabase.from("mkt_brand_kits").update(fields as any).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data: inserted, error } = await supabase
        .from("mkt_brand_kits")
        .insert({ ...fields, owner_id: userId } as any)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      kitId = inserted.id as string;
    }

    // Snapshot version
    const { data: snap } = await supabase.from("mkt_brand_kits").select("*").eq("id", kitId!).single();
    if (snap) {
      const { data: last } = await supabase
        .from("mkt_brand_kit_versions")
        .select("version")
        .eq("brand_kit_id", kitId!)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextVersion = (last?.version ?? 0) + 1;
      await supabase.from("mkt_brand_kit_versions").insert({
        brand_kit_id: kitId!,
        owner_id: userId,
        version: nextVersion,
        snapshot: snap,
        note: note ?? null,
        created_by: userId,
      });
    }

    return { id: kitId! };
  });

// ---------- deleteBrandKit ----------
export const deleteBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mkt_brand_kits").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Assets ----------
const AssetInput = z.object({
  brand_kit_id: z.string().uuid(),
  folder: z.string().max(80).default("general"),
  kind: z.enum(["image", "video", "document", "logo", "icon", "illustration"]),
  title: z.string().max(200).optional().nullable(),
  url: z.string().url().max(1200),
  thumbnail_url: z.string().url().max(1200).optional().nullable(),
  mime_type: z.string().max(120).optional().nullable(),
  size_bytes: z.number().int().nonnegative().optional().nullable(),
});

export const addBrandAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => AssetInput.parse(v))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("mkt_brand_kit_assets")
      .insert({ ...data, owner_id: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { asset: row };
  });

export const deleteBrandAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mkt_brand_kit_assets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Templates ----------
const TemplateInput = z.object({
  id: z.string().uuid().optional(),
  brand_kit_id: z.string().uuid(),
  channel: z.string().min(1).max(40),
  name: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
  variables: z.record(z.unknown()).optional(),
  is_default: z.boolean().optional(),
});

export const saveBrandTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => TemplateInput.parse(v))
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase.from("mkt_brand_kit_templates").update(fields as any).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await context.supabase
      .from("mkt_brand_kit_templates")
      .insert({ ...fields, owner_id: context.userId } as any)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const deleteBrandTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mkt_brand_kit_templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Versions ----------
export const restoreBrandVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ brand_kit_id: z.string().uuid(), version_id: z.string().uuid() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: v, error } = await context.supabase
      .from("mkt_brand_kit_versions")
      .select("snapshot")
      .eq("id", data.version_id)
      .single();
    if (error) throw new Error(error.message);
    const snap = v.snapshot as Record<string, unknown>;
    // Only restore mutable fields
    const {
      id: _id,
      owner_id: _owner,
      created_at: _ca,
      updated_at: _ua,
      ...restore
    } = snap as Record<string, unknown>;
    const { error: uerr } = await context.supabase
      .from("mkt_brand_kits")
      .update(restore as any)
      .eq("id", data.brand_kit_id);
    if (uerr) throw new Error(uerr.message);
    return { ok: true };
  });
