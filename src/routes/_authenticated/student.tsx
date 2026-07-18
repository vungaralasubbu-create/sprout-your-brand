import { createFileRoute, redirect } from "@tanstack/react-router";
import { StudentShell } from "@/components/student/student-shell";
import { allowedGroups, dashboardPathForRole, fetchUserRoles, primaryRole } from "@/lib/auth/role-redirect";

export const Route = createFileRoute("/_authenticated/student")({
  beforeLoad: async ({ context }) => {
    const user = (context as any).user;
    if (!user) throw redirect({ to: "/auth" });
    const roles = await fetchUserRoles(user.id);
    const groups = allowedGroups(roles);
    if (groups.has("student")) return;
    // Not permitted — send them to their own dashboard with an Access Denied notice.
    const target = dashboardPathForRole(primaryRole(roles));
    throw redirect({ to: "/access-denied" as any, search: { from: "student", to: target } as any });
  },
  component: StudentShell,
});
