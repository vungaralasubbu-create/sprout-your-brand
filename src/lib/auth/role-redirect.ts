import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "super_admin"
  | "admin"
  | "partner_manager"
  | "partner"
  | "wl_owner"
  | "brand_owner"
  | "instructor"
  | "counsellor"
  | "campus_ambassador"
  | "student";

// Higher number = higher priority when a user has multiple roles.
// This governs where a user lands after login when they have multiple roles.
const PRIORITY: Record<AppRole, number> = {
  super_admin: 100,
  admin: 90,
  partner_manager: 80,
  wl_owner: 75,
  brand_owner: 72,
  instructor: 68,
  counsellor: 65,
  partner: 60,
  campus_ambassador: 55,
  student: 50,
};

export async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return ((data ?? []).map((r: any) => r.role) as AppRole[]).filter(Boolean);
}

export function primaryRole(roles: AppRole[]): AppRole | null {
  if (!roles.length) return null;
  return [...roles].sort((a, b) => (PRIORITY[b] ?? 0) - (PRIORITY[a] ?? 0))[0];
}

export function dashboardPathForRole(role: AppRole | null): string {
  switch (role) {
    case "super_admin":
    case "admin":
    case "partner_manager":
      return "/admin/dashboard";
    case "partner":
      return "/partner/dashboard";
    case "wl_owner":
    case "brand_owner":
      return "/brand/dashboard";
    case "instructor":
      return "/instructor/dashboard";
    case "counsellor":
      return "/counsellor/copilot";
    case "campus_ambassador":
      return "/ambassador";
    case "student":
      return "/student/dashboard";
    default:
      return "/";
  }
}

/** Group used for RBAC gates. */
export type WorkspaceGroup = "admin" | "partner" | "brand" | "instructor" | "counsellor" | "ambassador" | "student";

export function workspaceGroupsForRole(role: AppRole): WorkspaceGroup[] {
  switch (role) {
    case "super_admin":
    case "admin":
      // Admins can inspect every workspace (used by the Preview As feature).
      return ["admin", "partner", "brand", "instructor", "counsellor", "ambassador", "student"];
    case "partner_manager":
      return ["admin", "partner"];
    case "partner":
      return ["partner"];
    case "wl_owner":
    case "brand_owner":
      return ["brand"];
    case "instructor":
      return ["instructor"];
    case "counsellor":
      return ["counsellor"];
    case "campus_ambassador":
      return ["ambassador"];
    case "student":
      return ["student"];
  }
}

/**
 * Given all roles a user holds, return the set of workspace groups they may access.
 * A user is allowed into a workspace only if AT LEAST ONE of their roles grants that group.
 */
export function allowedGroups(roles: AppRole[]): Set<WorkspaceGroup> {
  const out = new Set<WorkspaceGroup>();
  for (const r of roles) for (const g of workspaceGroupsForRole(r)) out.add(g);
  return out;
}

export async function resolveRedirectForUser(userId: string): Promise<{ path: string; role: AppRole | null }> {
  const roles = await fetchUserRoles(userId);
  const role = primaryRole(roles);
  return { path: dashboardPathForRole(role), role };
}
