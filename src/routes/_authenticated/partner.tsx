import { createFileRoute, redirect } from "@tanstack/react-router";
import { PartnerShell } from "@/components/partner/partner-shell";
import { fetchUserRoles, primaryRole, dashboardPathForRole } from "@/lib/auth/role-redirect";

export const Route = createFileRoute("/_authenticated/partner")({
  beforeLoad: async ({ context }) => {
    const user = (context as any).user;
    if (!user) throw redirect({ to: "/auth" });
    const roles = await fetchUserRoles(user.id);
    // Admins may inspect partner workspace; partners can access their own.
    if (roles.some((r) => r === "partner" || r === "super_admin" || r === "admin" || r === "partner_manager")) return;
    throw redirect({ to: dashboardPathForRole(primaryRole(roles)) as any });
  },
  component: PartnerShell,
});
