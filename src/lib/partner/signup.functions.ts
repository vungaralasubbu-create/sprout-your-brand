import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Validate a referral code and return the referring partner's display name. */
export const validateReferralCode = createServerFn({ method: "POST" })
  .inputValidator((raw: { code: string }) => raw)
  .handler(async ({ data }) => {
    const code = (data.code || "").trim().toUpperCase();
    if (!code) return { valid: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: partner } = await supabaseAdmin
      .from("partners")
      .select("id, display_name, referral_code")
      .eq("referral_code", code)
      .maybeSingle();
    if (!partner) return { valid: false as const };
    return { valid: true as const, referrerName: partner.display_name as string };
  });

/** Check if an email or mobile already exists in auth.users / partners / applications. */
export const checkExistingAccount = createServerFn({ method: "POST" })
  .inputValidator((raw: { email: string; mobile: string }) => raw)
  .handler(async ({ data }) => {
    const email = (data.email || "").trim().toLowerCase();
    const mobile = (data.mobile || "").replace(/\D/g, "");
    if (!email && !mobile) return { exists: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // partners table
    const [{ data: byEmail }, { data: byMobile }] = await Promise.all([
      email
        ? supabaseAdmin.from("partners").select("id").ilike("email", email).limit(1).maybeSingle()
        : Promise.resolve({ data: null }),
      mobile
        ? supabaseAdmin.from("partners").select("id").eq("mobile", mobile).limit(1).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (byEmail || byMobile) return { exists: true as const, reason: "partner" };

    // auth.users (via admin list). Best-effort — do not block if API fails.
    if (email) {
      try {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (list?.users?.some((u) => (u.email || "").toLowerCase() === email)) {
          return { exists: true as const, reason: "auth" };
        }
      } catch {}
    }
    return { exists: false as const };
  });

/**
 * Called after the auth signUp completes and the user is signed in.
 * Creates the partner_applications row, provisions a `partners` row in
 * "onboarding" state, links a valid referral (if any), and grants the
 * `partner` role so the user lands on the sales partner workspace.
 */
export const finalizePartnerSignup = createServerFn({ method: "POST" })
  .inputValidator(
    (raw: {
      full_name: string;
      mobile: string;
      city: string;
      state: string;
      referralCode?: string | null;
    }) => raw,
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { userId, claims } = context;
    const email = ((claims as { email?: string })?.email ?? "").toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const fullName = data.full_name.trim();
    const mobile = data.mobile.replace(/\s+/g, "");
    const city = data.city.trim();
    const state = data.state.trim();
    const rawCode = (data.referralCode || "").trim().toUpperCase();

    // Validate referral (cannot refer yourself — check after partner row exists)
    let referrerPartnerId: string | null = null;
    if (rawCode) {
      const { data: ref } = await supabaseAdmin
        .from("partners")
        .select("id, user_id")
        .eq("referral_code", rawCode)
        .maybeSingle();
      if (ref && ref.user_id !== userId) referrerPartnerId = ref.id as string;
    }

    // Read approval setting
    const { data: setting } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "partner_signup_require_approval")
      .maybeSingle();
    const requireApproval = (setting?.value || "false").toLowerCase() === "true";

    const applicationStatus = requireApproval ? "under_review" : "approved";
    const accountStatus = requireApproval ? "onboarding" : "onboarding"; // start onboarding regardless
    const partnerStatus = "active"; // partner_status enum has no 'pending' value

    // Create partner_applications record (lightweight signup application)
    const { data: appRow, error: appErr } = await supabaseAdmin
      .from("partner_applications")
      .insert({
        user_id: userId,
        full_name: fullName,
        email,
        mobile,
        city,
        state,
        country: "India",
        referred_by_code: rawCode || null,
        status: applicationStatus as any,
      } as never)
      .select("id")
      .single();
    if (appErr) throw new Error(appErr.message);

    // Provision partners row (idempotent)
    const { data: existingPartner } = await supabaseAdmin
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let partnerId = existingPartner?.id as string | undefined;
    if (!partnerId) {
      const { data: created, error: pErr } = await supabaseAdmin
        .from("partners")
        .insert({
          user_id: userId,
          application_id: appRow.id,
          display_name: fullName,
          email,
          mobile,
          city,
          state,
          country: "India",
          status: partnerStatus,
          account_status: accountStatus,
          onboarding_status: "in_progress",
          onboarding_current_step: 1,
          lead_model: "not_sure",
        } as never)
        .select("id")
        .single();
      if (pErr) throw new Error(pErr.message);
      partnerId = created!.id as string;
    } else {
      await supabaseAdmin
        .from("partners")
        .update({
          display_name: fullName,
          mobile,
          city,
          state,
          account_status: accountStatus,
          application_id: appRow.id,
        } as never)
        .eq("id", partnerId);
    }

    // Record referral link once
    if (referrerPartnerId && partnerId && referrerPartnerId !== partnerId) {
      const { data: dupe } = await supabaseAdmin
        .from("partner_referrals")
        .select("id")
        .eq("referred_partner_id", partnerId)
        .maybeSingle();
      if (!dupe) {
        const { data: settings } = await supabaseAdmin
          .from("referral_program_settings")
          .select("qualification_period_days")
          .eq("id", 1)
          .maybeSingle();
        const days = Number((settings as any)?.qualification_period_days ?? 30);
        const deadline = new Date(Date.now() + days * 86400000).toISOString();
        await supabaseAdmin.from("partner_referrals").insert({
          referrer_partner_id: referrerPartnerId,
          referred_partner_id: partnerId,
          referred_application_id: appRow.id,
          referral_code: rawCode,
          status: "signed_up",
          qualification_deadline: deadline,
        } as never);
      }
    }

    // Grant partner role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "partner" as any }, { onConflict: "user_id,role" });

    return {
      ok: true as const,
      requireApproval,
      partnerId,
    };
  });

/** Save the quick-start onboarding (profile edits + work model + selling identity). */
export const saveQuickStartOnboarding = createServerFn({ method: "POST" })
  .inputValidator(
    (raw: {
      full_name: string;
      mobile: string;
      city: string;
      state: string;
      work_model: "flexible" | "full_time";
      selling_model: "glintr" | "own" | "partnered" | "multiple";
    }) => raw,
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: partner } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!partner) throw new Error("Partner profile missing. Complete signup first.");

    const now = new Date().toISOString();
    const workModelStatus =
      data.work_model === "full_time" ? "full_time_application_pending" : "flexible_active";

    // Update partner profile
    const { error: uErr } = await supabaseAdmin
      .from("partners")
      .update({
        display_name: data.full_name.trim(),
        mobile: data.mobile.replace(/\s+/g, ""),
        city: data.city.trim(),
        state: data.state.trim(),
        work_model: data.work_model,
        work_model_status: workModelStatus,
        work_model_selected_at: now,
        brand_selling_model: data.selling_model as any,
        onboarding_status: "completed",
        onboarding_completed_at: now,
        onboarding_current_step: 7,
      } as never)
      .eq("id", partner.id);
    if (uErr) throw new Error(uErr.message);

    // Full-time application record
    if (data.work_model === "full_time") {
      const { data: existingFt } = await supabaseAdmin
        .from("partner_full_time_applications")
        .select("id")
        .eq("partner_id", partner.id)
        .maybeSingle();
      if (!existingFt) {
        await supabaseAdmin
          .from("partner_full_time_applications")
          .insert({ partner_id: partner.id, status: "pending" } as never);
      }
    }

    // Read approval setting to decide account_status
    const { data: setting } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "partner_signup_require_approval")
      .maybeSingle();
    const requireApproval = (setting?.value || "false").toLowerCase() === "true";

    const finalStatus = requireApproval ? "pending_review" : "active";
    await supabaseAdmin
      .from("partners")
      .update({ account_status: finalStatus } as never)
      .eq("id", partner.id);

    return { ok: true as const, accountStatus: finalStatus };
  });

/** Read the current partner's signup / onboarding state for gating. */
export const getPartnerSignupState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select(
        "id, display_name, email, mobile, city, state, account_status, work_model, work_model_status, brand_selling_model, onboarding_status, onboarding_completed_at, application_id",
      )
      .eq("user_id", userId)
      .maybeSingle();

    let application: any = null;
    if (partner?.application_id) {
      const { data: app } = await supabase
        .from("partner_applications")
        .select("id, status, admin_notes, referred_by_code, reviewed_at, created_at")
        .eq("id", partner.application_id)
        .maybeSingle();
      application = app;
    }
    return { partner, application };
  });
