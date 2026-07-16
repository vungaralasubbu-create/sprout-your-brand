import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchUserRoles, primaryRole, dashboardPathForRole } from "@/lib/auth/role-redirect";
import { BrandShell } from "@/components/brand-os/brand-shell";

export const Route = createFileRoute("/_authenticated/brand")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = (context as any).user;
    if (!user) throw redirect({ to: "/auth" });
    const roles = await fetchUserRoles(user.id);
    if (roles.includes("wl_owner") || roles.includes("super_admin") || roles.includes("admin")) return;
    throw redirect({ to: dashboardPathForRole(primaryRole(roles)) as any });
  },
  component: BrandShell,
});
