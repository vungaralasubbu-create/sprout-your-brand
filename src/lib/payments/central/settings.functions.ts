import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const SETTINGS_COLS =
  "id, version, qr_image_url, logo_url, upi_id, merchant_name, support_email, support_phone, instructions, success_message, is_active, is_enabled, maintenance_mode, updated_at, created_at";

/** Latest active + enabled config — used by students on the payment page. */
export const getActivePaymentSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("payment_settings")
      .select(SETTINGS_COLS)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

/** Full version history — admin only. */
export const listPaymentSettingsVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("payment_settings")
      .select(SETTINGS_COLS + ", updated_by, created_by")
      .order("version", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const settingsInput = z.object({
  id: z.string().uuid().optional().nullable(),
  qr_image_url: z.string().max(1000).optional().nullable(),
  logo_url: z.string().max(1000).optional().nullable(),
  upi_id: z.string().trim().min(3).max(120).optional().nullable(),
  merchant_name: z.string().trim().max(120).optional().nullable(),
  support_email: z.string().trim().max(255).optional().nullable(),
  support_phone: z.string().trim().max(30).optional().nullable(),
  instructions: z.string().trim().max(2000).optional().nullable(),
  success_message: z.string().trim().max(2000).optional().nullable(),
  is_active: z.boolean().optional(),
  is_enabled: z.boolean().optional(),
  maintenance_mode: z.boolean().optional(),
  /**
   * When true, publishes as a new version row (used when QR image is
   * replaced). When false, edits the row in place.
   */
  publishAsNewVersion: z.boolean().optional(),
});

export const updatePaymentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => settingsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const payload = {
      qr_image_url: data.qr_image_url ?? null,
      logo_url: data.logo_url ?? null,
      upi_id: data.upi_id ?? null,
      merchant_name: data.merchant_name ?? null,
      support_email: data.support_email ?? null,
      support_phone: data.support_phone ?? null,
      instructions: data.instructions ?? null,
      success_message: data.success_message ?? null,
      is_active: data.is_active ?? true,
      is_enabled: data.is_enabled ?? true,
      maintenance_mode: data.maintenance_mode ?? false,
      updated_by: userId,
    };

    // Update in place when we have an id and caller didn't request a new version.
    if (data.id && !data.publishAsNewVersion) {
      const { data: row, error } = await supabase
        .from("payment_settings")
        .update(payload)
        .eq("id", data.id)
        .select(SETTINGS_COLS)
        .single();
      if (error) throw new Error(error.message);
      // If this row was activated, deactivate other versions to keep a single active.
      if (payload.is_active) {
        await supabase
          .from("payment_settings")
          .update({ is_active: false })
          .neq("id", data.id);
      }
      return row;
    }

    // Publish as a new version — compute version = max+1 and deactivate previous.
    const { data: maxRow } = await supabase
      .from("payment_settings")
      .select("version")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (maxRow?.version ?? 0) + 1;

    if (payload.is_active) {
      await supabase.from("payment_settings").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    }

    const { data: row, error } = await supabase
      .from("payment_settings")
      .insert({ ...payload, version: nextVersion, created_by: userId })
      .select(SETTINGS_COLS)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/** Activate a specific historical version (deactivates all others). */
export const activatePaymentSettingsVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { error: e1 } = await supabase
      .from("payment_settings")
      .update({ is_active: false })
      .neq("id", data.id);
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await supabase
      .from("payment_settings")
      .update({ is_active: true, updated_by: userId })
      .eq("id", data.id);
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });

/** Returns a short-lived signed URL for reading an image from payment-config. */
export const getPaymentConfigSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: signed, error } = await supabase.storage
      .from("payment-config")
      .createSignedUrl(data.path, 60 * 15);
    if (error) throw new Error(error.message);
    return { url: signed?.signedUrl ?? null };
  });
