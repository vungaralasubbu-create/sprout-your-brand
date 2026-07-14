import { createFileRoute, redirect } from "@tanstack/react-router";
import { PartnerShell } from "@/components/partner/partner-shell";
import { fetchUserRoles, primaryRole, dashboardPathForRole } from "@/lib/auth/role-redirect";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/partner")({
  beforeLoad: async ({ context, location }) => {
    const user = (context as any).user;
    if (!user) throw redirect({ to: "/auth" });
    const roles = await fetchUserRoles(user.id);
    const isPrivileged = roles.some(
      (r) => r === "super_admin" || r === "admin" || r === "partner_manager",
    );
    if (!roles.includes("partner") && !isPrivileged) {
      throw redirect({ to: dashboardPathForRole(primaryRole(roles)) as any });
    }

    // Privileged admins can inspect the partner workspace unrestricted.
    if (isPrivileged) return;

    // Gate partners by account_status. Allow these paths through so users
    // aren't trapped in a redirect loop while onboarding / awaiting review.
    const path = location.pathname;
    const allowAlways = ["/partner/quick-start", "/partner/application-status"];
    if (allowAlways.some((p) => path.startsWith(p))) return;

    const { data: partner } = await supabase
      .from("partners")
      .select("account_status, onboarding_status")
      .eq("user_id", user.id)
      .maybeSingle();

    const status = partner?.account_status ?? null;
    const onboarding = partner?.onboarding_status ?? null;

    if (!partner || onboarding !== "completed") {
      throw redirect({ to: "/partner/quick-start" as any });
    }
    if (
      status === "pending_review" ||
      status === "needs_information" ||
      status === "rejected" ||
      status === "suspended"
    ) {
      throw redirect({ to: "/partner/application-status" as any });
    }
  },
  component: PartnerShell,
});

