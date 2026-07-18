import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * After sign-in, ensure the user has the correct workspace role(s).
 *
 * Detection order (a user can hold multiple roles):
 *  1. Partner    — partner_applications (any non-rejected) OR partners row
 *  2. Brand owner — brands.owner_user_id OR partner_brand_profiles.user_id
 *  3. Counsellor — counsellor_profiles.user_id
 *  4. Student (fallback) — only if the user has no other workspace role AND
 *     no evidence of any partner/brand/counsellor relationship.
 *
 * This is the SINGLE source of truth for role provisioning after login.
 * Never grant `student` as a blanket fallback when the user is actually a
 * sales partner / brand owner / counsellor — that mis-routes them into the
 * Student LMS on every login.
 */
export const reconcileRolesForCurrentUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Resolve current user's email
    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = userRes?.user?.email;
    if (!email) return { granted: [] as string[] };

    const granted: string[] = [];

    async function grant(role: string) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: role as any }, { onConflict: "user_id,role" });
      if (!granted.includes(role)) granted.push(role);
    }

    // -------- Partner detection --------
    const { data: app } = await supabaseAdmin
      .from("partner_applications")
      .select("id, full_name, mobile, city, state, user_id, status")
      .ilike("email", email)
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let hasPartner = false;
    if (app) {
      hasPartner = true;
      if (!app.user_id) {
        await supabaseAdmin.from("partner_applications").update({ user_id: userId }).eq("id", app.id);
      }
      if (app.status === "approved") {
        const { data: existingPartner } = await supabaseAdmin
          .from("partners")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (!existingPartner) {
          const { data: inserted } = await supabaseAdmin
            .from("partners")
            .insert({
              user_id: userId,
              application_id: app.id,
              display_name: app.full_name,
              email,
              mobile: app.mobile,
              city: app.city,
              state: app.state,
              status: "active",
            })
            .select("id")
            .maybeSingle();

          const { data: appFull } = await supabaseAdmin
            .from("partner_applications")
            .select("referred_by_code")
            .eq("id", app.id)
            .maybeSingle();
          const refCode = (appFull as any)?.referred_by_code as string | null | undefined;
          if (inserted?.id && refCode) {
            const { data: referrer } = await supabaseAdmin
              .from("partners")
              .select("id")
              .eq("referral_code", refCode)
              .maybeSingle();
            if (referrer?.id && referrer.id !== inserted.id) {
              const { data: settings } = await supabaseAdmin
                .from("referral_program_settings")
                .select("qualification_period_days")
                .eq("id", 1)
                .maybeSingle();
              const days = Number((settings as any)?.qualification_period_days ?? 30);
              const deadline = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
              await supabaseAdmin.from("partner_referrals").insert({
                referrer_partner_id: referrer.id,
                referred_partner_id: inserted.id,
                referred_application_id: app.id,
                referral_code: refCode,
                status: "active",
                qualification_deadline: deadline,
              });
            }
          }
        }
      }
      await grant("partner");
    } else {
      const { data: partnerRow } = await supabaseAdmin
        .from("partners")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (partnerRow) {
        hasPartner = true;
        await grant("partner");
      }
    }

    // -------- Brand owner detection --------
    let hasBrand = false;
    const { data: ownedBrand } = await supabaseAdmin
      .from("brands")
      .select("id")
      .eq("owner_user_id", userId)
      .limit(1)
      .maybeSingle();
    if (ownedBrand) {
      hasBrand = true;
      await grant("wl_owner");
    } else {
      const { data: brandProfile } = await supabaseAdmin
        .from("partner_brand_profiles")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (brandProfile) {
        hasBrand = true;
        await grant("brand_owner");
      }
    }

    // -------- Counsellor detection --------
    let hasCounsellor = false;
    const { data: counsellor } = await supabaseAdmin
      .from("counsellor_profiles")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (counsellor) {
      hasCounsellor = true;
      await grant("counsellor");
    }

    // -------- Student fallback --------
    // Only grant `student` when the user has NO existing role AND no evidence
    // of being a partner / brand owner / counsellor. This prevents sales
    // partners from being mis-routed into the Student LMS.
    if (!hasPartner && !hasBrand && !hasCounsellor) {
      const { data: existingRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (!existingRoles || existingRoles.length === 0) {
        await grant("student");
      }
    }

    return { granted };
  });
