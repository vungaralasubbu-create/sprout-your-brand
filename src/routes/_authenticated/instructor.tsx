import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { allowedGroups, dashboardPathForRole, fetchUserRoles, primaryRole } from "@/lib/auth/role-redirect";

export const Route = createFileRoute("/_authenticated/instructor")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = (context as any).user;
    if (!user) throw redirect({ to: "/auth" });
    const roles = await fetchUserRoles(user.id);
    const groups = allowedGroups(roles);
    if (groups.has("instructor")) return;
    const target = dashboardPathForRole(primaryRole(roles));
    throw redirect({ to: "/access-denied" as any, search: { from: "instructor", to: target } as any });
  },
  component: () => <Outlet />,
});
