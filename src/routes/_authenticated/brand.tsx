import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { fetchUserRoles, primaryRole, dashboardPathForRole } from "@/lib/auth/role-redirect";

export const Route = createFileRoute("/_authenticated/brand")({
  beforeLoad: async ({ context }) => {
    const user = (context as any).user;
    if (!user) throw redirect({ to: "/auth" });
    const roles = await fetchUserRoles(user.id);
    if (roles.includes("wl_owner") || roles.includes("super_admin") || roles.includes("admin")) return;
    throw redirect({ to: dashboardPathForRole(primaryRole(roles)) as any });
  },
  component: () => <Outlet />,
});
