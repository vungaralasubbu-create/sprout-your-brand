import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const getActivePaymentSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("payment_settings")
      .select(
        "id, qr_image_url, upi_id, merchant_name, support_email, support_phone, instructions, is_active, updated_at",
      )
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const settingsInput = z.object({
  id: z.string().uuid().optional().nullable(),
  qr_image_url: z.string().url().max(1000).optional().nullable(),
  upi_id: z.string().trim().min(3).max(120).optional().nullable(),
  merchant_name: z.string().trim().max(120).optional().nullable(),
  support_email: z.string().trim().email().max(255).optional().nullable(),
  support_phone: z.string().trim().max(30).optional().nullable(),
  instructions: z.string().trim().max(2000).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const updatePaymentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => settingsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const payload = {
      qr_image_url: data.qr_image_url ?? null,
      upi_id: data.upi_id ?? null,
      merchant_name: data.merchant_name ?? null,
      support_email: data.support_email ?? null,
      support_phone: data.support_phone ?? null,
      instructions: data.instructions ?? null,
      is_active: data.is_active ?? true,
      updated_by: userId,
    };

    if (data.id) {
      const { data: row, error } = await supabase
        .from("payment_settings")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await supabase
      .from("payment_settings")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/** Returns a short-lived signed URL for reading the QR image from the private bucket. */
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
