import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Fetch or lazily create the current user's partner row + onboarding state. */
export const getOnboarding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims as { email?: string })?.email ?? "";

    // Ensure a partner row exists for this user.
    let { data: partner } = await supabase
      .from("partners")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!partner) {
      const { data: created, error } = await supabase
        .from("partners")
        .insert({
          user_id: userId,
          email,
          display_name: email || "New Partner",
          status: "active",
          lead_model: "not_sure",
          onboarding_status: "in_progress",
          onboarding_current_step: 1,
        } as never)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      partner = created;

      // Grant the partner role so /partner/* routes become accessible.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "partner" as any }, { onConflict: "user_id,role" });
    }

    const partnerId = partner!.id;

    const [{ data: categories }, { data: courses }, { data: agreements }, { data: acceptances }, { data: interests }, { data: payout }] =
      await Promise.all([
        supabase
          .from("course_categories")
          .select("id, name, slug, short_description")
          .eq("is_active", true)
          .eq("status", "published")
          .order("display_order", { ascending: true }),
        supabase
          .from("courses")
          .select("id, category_id, name, slug, short_description, duration, level")
          .eq("is_published", true)
          .eq("status", "published")
          .eq("partner_sale_eligible", true)
          .order("display_order", { ascending: true }),
        supabase
          .from("partner_agreements")
          .select("id, kind, version, title, body_markdown, effective_from")
          .eq("is_active", true)
          .order("kind"),
        supabase
          .from("partner_agreement_acceptances")
          .select("agreement_id, accepted_at")
          .eq("partner_id", partnerId),
        supabase
          .from("partner_program_interests")
          .select("id, course_id, category_id")
          .eq("partner_id", partnerId),
        supabase
          .from("partner_payout_details")
          .select("legal_name, account_holder_name, ifsc_code, bank_name, upi_id, tax_status, updated_at, bank_account_number")
          .eq("partner_id", partnerId)
          .maybeSingle(),
      ]);

    // Mask account number
    const payoutMasked = payout
      ? {
          legal_name: payout.legal_name,
          account_holder_name: payout.account_holder_name,
          ifsc_code: payout.ifsc_code,
          bank_name: payout.bank_name,
          upi_id: payout.upi_id,
          tax_status: payout.tax_status,
          account_last4: payout.bank_account_number
            ? payout.bank_account_number.slice(-4)
            : null,
        }
      : null;

    return {
      partner,
      categories: categories ?? [],
      courses: courses ?? [],
      agreements: agreements ?? [],
      acceptedAgreementIds: (acceptances ?? []).map((a) => a.agreement_id),
      interests: interests ?? [],
      payout: payoutMasked,
    };
  });

type OnboardingPatch = Record<string, unknown>;

/** Save step 1 or 2 form data + advance the current step marker. */
export const saveOnboardingStep = createServerFn({ method: "POST" })
  .inputValidator((raw: { step: number; patch: OnboardingPatch }) => raw)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const allowedKeys = new Set([
      "first_name",
      "display_name",
      "mobile",
      "city",
      "state",
      "country",
      "role_title",
      "role_title_other",
      "sales_experience",
      "sold_education_before",
      "sales_domains",
      "monthly_sales_target",
      "income_situation",
      "lead_sources",
      "lead_reach_range",
    ]);
    const patch: OnboardingPatch = {};
    for (const [k, v] of Object.entries(data.patch)) {
      if (allowedKeys.has(k)) patch[k] = v;
    }
    patch.onboarding_current_step = Math.max(1, Math.min(7, data.step + 1));
    patch.onboarding_status = "in_progress";
    patch.onboarding_last_saved_at = new Date().toISOString();

    const { error } = await supabase
      .from("partners")
      .update(patch as never)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Step 3 — sales model selection. Model requires admin approval unless auto-activated. */
export const selectSalesModel = createServerFn({ method: "POST" })
  .inputValidator((raw: { model: "own_leads" | "supported_sales" | "dual_model" }) => raw)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const leadModel =
      data.model === "own_leads" ? "own_leads" : data.model === "supported_sales" ? "supported" : "not_sure";

    const { error } = await supabase
      .from("partners")
      .update({
        sales_model_selection: data.model,
        lead_model: leadModel,
        sales_model_selected_at: new Date().toISOString(),
        sales_model_approval_status: "under_review",
        onboarding_current_step: 4,
        onboarding_status: "in_progress",
        onboarding_last_saved_at: new Date().toISOString(),
      } as never)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Step 4 — program interests (replace-all). */
export const saveProgramInterests = createServerFn({ method: "POST" })
  .inputValidator((raw: { categoryIds: string[]; courseIds: string[] }) => raw)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!partner) throw new Error("Partner profile missing");

    await supabase.from("partner_program_interests").delete().eq("partner_id", partner.id);

    const rows = [
      ...data.categoryIds.map((cid) => ({ partner_id: partner.id, category_id: cid })),
      ...data.courseIds.map((cid) => ({ partner_id: partner.id, course_id: cid })),
    ];
    if (rows.length) {
      const { error } = await supabase.from("partner_program_interests").insert(rows as never);
      if (error) throw new Error(error.message);
    }

    await supabase
      .from("partners")
      .update({
        onboarding_current_step: 5,
        onboarding_last_saved_at: new Date().toISOString(),
      } as never)
      .eq("id", partner.id);

    return { ok: true };
  });

/** Step 5 — payout setup (upsert). */
export const savePayoutDetails = createServerFn({ method: "POST" })
  .inputValidator(
    (raw: {
      legal_name: string;
      account_holder_name: string;
      bank_account_number: string;
      ifsc_code: string;
      bank_name: string;
      upi_id?: string | null;
      pan?: string | null;
    }) => raw,
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!partner) throw new Error("Partner profile missing");

    const payload = {
      partner_id: partner.id,
      legal_name: data.legal_name.trim(),
      account_holder_name: data.account_holder_name.trim(),
      bank_account_number: data.bank_account_number.replace(/\s+/g, ""),
      ifsc_code: data.ifsc_code.trim().toUpperCase(),
      bank_name: data.bank_name.trim(),
      upi_id: data.upi_id?.trim() || null,
      pan: data.pan?.trim().toUpperCase() || null,
      tax_status: data.pan ? "submitted" : "not_provided",
    };
    const { error } = await supabase
      .from("partner_payout_details")
      .upsert(payload as never, { onConflict: "partner_id" });
    if (error) throw new Error(error.message);

    const last4 = payload.bank_account_number.slice(-4);
    await supabase
      .from("partners")
      .update({
        bank_account_last4: last4,
        bank_name: payload.bank_name,
        payout_profile_status: "submitted",
        onboarding_current_step: 6,
        onboarding_last_saved_at: new Date().toISOString(),
      } as never)
      .eq("id", partner.id);

    return { ok: true };
  });

/** Step 5 — skip payout, advance to step 6. */
export const skipPayoutDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("partners")
      .update({
        payout_profile_status: "incomplete",
        onboarding_current_step: 6,
        onboarding_last_saved_at: new Date().toISOString(),
      } as never)
      .eq("user_id", userId);
    return { ok: true };
  });

/** Step 6 — record immutable acceptance rows for the given agreement ids. */
export const acceptAgreements = createServerFn({ method: "POST" })
  .inputValidator((raw: { agreementIds: string[] }) => raw)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!partner) throw new Error("Partner profile missing");

    const { data: existing } = await supabase
      .from("partner_agreement_acceptances")
      .select("agreement_id")
      .eq("partner_id", partner.id);
    const already = new Set((existing ?? []).map((r) => r.agreement_id));
    const rows = data.agreementIds
      .filter((id) => !already.has(id))
      .map((id) => ({ partner_id: partner.id, agreement_id: id }));
    if (rows.length) {
      const { error } = await supabase.from("partner_agreement_acceptances").insert(rows as never);
      if (error) throw new Error(error.message);
    }

    await supabase
      .from("partners")
      .update({
        agreement_status: "accepted",
        onboarding_current_step: 7,
        onboarding_last_saved_at: new Date().toISOString(),
      } as never)
      .eq("id", partner.id);
    return { ok: true };
  });

/** Step 7 — finalise onboarding. */
export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("partners")
      .update({
        onboarding_status: "completed",
        onboarding_completed_at: new Date().toISOString(),
        onboarding_current_step: 7,
        onboarding_last_saved_at: new Date().toISOString(),
      } as never)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
