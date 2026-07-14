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

    // Find an approved partner application for this email (linked or not)
    const { data: app } = await supabaseAdmin
      .from("partner_applications")
      .select("id, full_name, mobile, city, state, user_id, status")
      .ilike("email", email)
      .eq("status", "approved")
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
      const { data: existingPartner } = await supabaseAdmin
        .from("partners")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!existingPartner) {
        await supabaseAdmin.from("partners").insert({
          user_id: userId,
          application_id: app.id,
          display_name: app.full_name,
          email,
          mobile: app.mobile,
          city: app.city,
          state: app.state,
          status: "active",
        });
      }
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "partner" as any }, { onConflict: "user_id,role" });
      granted.push("partner");
    }

    return { granted };
  });
