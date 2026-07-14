import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Fetch account, work model, and payout profile for the current partner. */
export const getPartnerAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select(
        "id, display_name, first_name, email, mobile, partner_code, status, account_status, work_model, work_model_status, work_model_selected_at, work_model_approved_at, city, state, date_of_birth, profile_photo_url, created_at, brand_selling_model, lead_model, default_revenue_share, payout_profile_status",
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (!partner) return null;

    const { data: payout } = await supabase
      .from("partner_payout_details")
      .select(
        "account_holder_name, bank_name, ifsc_code, account_type, account_last4, upi_id, legal_name, pan_masked, gstin, bank_details_completed, pan_details_completed, updated_at",
      )
      .eq("partner_id", partner.id)
      .maybeSingle();

    const { data: pendingApp } = await supabase
      .from("partner_full_time_applications")
      .select("id, status, applied_at, reviewed_at, admin_notes")
      .eq("partner_id", partner.id)
      .order("applied_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return { partner, payout: payout ?? null, latestFullTimeApp: pendingApp ?? null };
  });

/** Update editable profile fields. */
export const updatePartnerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    first_name?: string;
    display_name?: string;
    mobile?: string;
    email?: string;
    date_of_birth?: string | null;
    city?: string;
    state?: string;
    profile_photo_url?: string | null;
  }) =>
    z
      .object({
        first_name: z.string().trim().max(80).optional(),
        display_name: z.string().trim().max(120).optional(),
        mobile: z
          .string()
          .trim()
          .regex(/^[0-9+\-\s()]{6,20}$/)
          .optional(),
        email: z.string().trim().email().max(255).optional(),
        date_of_birth: z.string().nullable().optional(),
        city: z.string().trim().max(80).optional(),
        state: z.string().trim().max(80).optional(),
        profile_photo_url: z.string().url().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) if (v !== undefined) patch[k] = v;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabase.from("partners").update(patch as never).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Save/replace secure bank & tax payout details. */
export const savePayoutDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    account_holder_name?: string;
    bank_name?: string;
    bank_account_number?: string;
    confirm_account_number?: string;
    ifsc_code?: string;
    account_type?: "savings" | "current";
    upi_id?: string;
    legal_name?: string;
    pan?: string;
    gstin?: string;
  }) =>
    z
      .object({
        account_holder_name: z.string().trim().min(2).max(120).optional(),
        bank_name: z.string().trim().min(2).max(120).optional(),
        bank_account_number: z
          .string()
          .trim()
          .regex(/^[0-9]{6,25}$/, "Invalid account number")
          .optional(),
        confirm_account_number: z.string().trim().optional(),
        ifsc_code: z
          .string()
          .trim()
          .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC")
          .optional(),
        account_type: z.enum(["savings", "current"]).optional(),
        upi_id: z
          .string()
          .trim()
          .regex(/^[\w.\-]{2,}@[a-zA-Z]{2,}$/, "Invalid UPI ID")
          .optional()
          .or(z.literal("")),
        legal_name: z.string().trim().min(2).max(120).optional(),
        pan: z
          .string()
          .trim()
          .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN")
          .optional(),
        gstin: z
          .string()
          .trim()
          .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Invalid GSTIN")
          .optional()
          .or(z.literal("")),
      })
      .refine(
        (v) =>
          !v.bank_account_number ||
          !v.confirm_account_number ||
          v.bank_account_number === v.confirm_account_number,
        { message: "Account numbers do not match", path: ["confirm_account_number"] },
      )
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!partner) throw new Error("Partner not found");

    const patch: Record<string, unknown> = { partner_id: partner.id };
    if (data.account_holder_name !== undefined) patch.account_holder_name = data.account_holder_name;
    if (data.bank_name !== undefined) patch.bank_name = data.bank_name;
    if (data.bank_account_number !== undefined) patch.bank_account_number = data.bank_account_number;
    if (data.ifsc_code !== undefined) patch.ifsc_code = data.ifsc_code.toUpperCase();
    if (data.account_type !== undefined) patch.account_type = data.account_type;
    if (data.upi_id !== undefined) patch.upi_id = data.upi_id || null;
    if (data.legal_name !== undefined) patch.legal_name = data.legal_name;
    if (data.pan !== undefined) patch.pan = data.pan.toUpperCase();
    if (data.gstin !== undefined) patch.gstin = (data.gstin || "").toUpperCase() || null;

    const { error } = await supabase
      .from("partner_payout_details")
      .upsert(patch as never, { onConflict: "partner_id" });
    if (error) throw new Error(error.message);

    // Mirror last4/bank name to partners for quick display + payout_profile_status flag.
    const { data: updated } = await supabase
      .from("partner_payout_details")
      .select("account_last4, bank_name, bank_details_completed, pan_details_completed")
      .eq("partner_id", partner.id)
      .maybeSingle();
    if (updated) {
      await supabase
        .from("partners")
        .update({
          bank_account_last4: updated.account_last4,
          bank_name: updated.bank_name,
          payout_profile_status:
            updated.bank_details_completed && updated.pan_details_completed
              ? "ready_for_review"
              : "in_progress",
        })
        .eq("id", partner.id);
    }
    return { ok: true };
  });

/** Submit a Full-Time Sales Professional application (creates row + flips status to pending). */
export const applyFullTime = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { notes?: string }) =>
    z.object({ notes: z.string().trim().max(1000).optional() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select("id, work_model, work_model_status")
      .eq("user_id", userId)
      .maybeSingle();
    if (!partner) throw new Error("Partner not found");
    if (partner.work_model === "full_time") {
      throw new Error("You are already on the Full-Time model");
    }
    if (partner.work_model_status === "full_time_pending") {
      throw new Error("Your full-time application is already under review");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: insErr } = await supabaseAdmin
      .from("partner_full_time_applications")
      .insert({ partner_id: partner.id, applicant_notes: data.notes ?? null });
    if (insErr) throw new Error(insErr.message);

    const { error: upErr } = await supabaseAdmin
      .from("partners")
      .update({ work_model_status: "full_time_pending" })
      .eq("id", partner.id);
    if (upErr) throw new Error(upErr.message);

    return { ok: true };
  });

/** Confirm the flexible model (user-initiated) — records selection timestamp. */
export const chooseFlexibleModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select("id, work_model")
      .eq("user_id", userId)
      .maybeSingle();
    if (!partner) throw new Error("Partner not found");
    if (partner.work_model === "full_time") {
      throw new Error("Contact admin to switch back from Full-Time to Flexible");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("partners")
      .update({
        work_model: "flexible",
        work_model_status: "flexible_active",
        work_model_selected_at: new Date().toISOString(),
      })
      .eq("id", partner.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
