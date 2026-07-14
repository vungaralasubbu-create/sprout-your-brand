import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * After sign-in, ensure the user has the correct workspace role.
 * Currently handles: partner applicants whose application was approved
 * BEFORE they signed up (or without user_id linked) — links their auth
 * user, creates the partners record, and grants the 'partner' role.
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

    // Find the most recent partner application for this email (any status
    // except rejected). Sales partners should land on the sales dashboard
    // whether their application is approved, pending, or under review.
    const { data: app } = await supabaseAdmin
      .from("partner_applications")
      .select("id, full_name, mobile, city, state, user_id, status")
      .ilike("email", email)
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (app) {
      if (!app.user_id) {
        await supabaseAdmin
          .from("partner_applications")
          .update({ user_id: userId })
          .eq("id", app.id);
      }
      // Only auto-provision a partners row once the application is approved.
      // Pending / under-review applicants still get the 'partner' role so they
      // land on the Sales Workspace, but their partners record is created
      // upon approval by the admin flow.
      if (app.status === "approved") {
        const { data: existingPartner } = await supabaseAdmin
          .from("partners")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (!existingPartner) {
          const { data: inserted } = await supabaseAdmin.from("partners").insert({
            user_id: userId,
            application_id: app.id,
            display_name: app.full_name,
            email,
            mobile: app.mobile,
            city: app.city,
            state: app.state,
            status: "active",
          }).select("id").maybeSingle();

          // Link partner referral if application had a referred_by_code
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

      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "partner" as any }, { onConflict: "user_id,role" });
      granted.push("partner");
    }

    // If the user already has a partners row (e.g. via onboarding), ensure partner role.
    const { data: partnerRow } = await supabaseAdmin
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (partnerRow) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "partner" as any }, { onConflict: "user_id,role" });
      if (!granted.includes("partner")) granted.push("partner");
    }


    // Default fallback: every signed-in user gets at least the student role
    // so they always land on a workspace dashboard instead of the homepage.
    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!existingRoles || existingRoles.length === 0) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "student" as any }, { onConflict: "user_id,role" });
      granted.push("student");
    }

    return { granted };
  });
