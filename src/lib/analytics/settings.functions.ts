import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { AnalyticsSettings } from "./client";

const KEYS = [
  "analytics.ga4_id",
  "analytics.gtm_id",
  "analytics.meta_pixel_id",
  "analytics.google_ads_id",
] as const;

function toShape(rows: { key: string; value: string | null }[]): AnalyticsSettings {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    ga4_id: map.get("analytics.ga4_id") ?? null,
    gtm_id: map.get("analytics.gtm_id") ?? null,
    meta_pixel_id: map.get("analytics.meta_pixel_id") ?? null,
    google_ads_id: map.get("analytics.google_ads_id") ?? null,
  };
}

export const getAnalyticsSettings = createServerFn({ method: "GET" }).handler(async () => {
  const supabasePublic = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabasePublic
    .from("platform_settings")
    .select("key,value")
    .in("key", KEYS as unknown as string[]);
  if (error) return { ga4_id: null, gtm_id: null, meta_pixel_id: null, google_ads_id: null };
  return toShape(data ?? []);
});

const upsertSchema = z.object({
  ga4_id: z.string().trim().max(64).nullable(),
  gtm_id: z.string().trim().max(64).nullable(),
  meta_pixel_id: z.string().trim().max(64).nullable(),
  google_ads_id: z.string().trim().max(64).nullable(),
});

export const updateAnalyticsSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });
    if (!isAdmin) throw new Error("Forbidden");

    const rows = [
      { key: "analytics.ga4_id", value: data.ga4_id || null },
      { key: "analytics.gtm_id", value: data.gtm_id || null },
      { key: "analytics.meta_pixel_id", value: data.meta_pixel_id || null },
      { key: "analytics.google_ads_id", value: data.google_ads_id || null },
    ].map((r) => ({ ...r, updated_by: userId, updated_at: new Date().toISOString() }));

    const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
