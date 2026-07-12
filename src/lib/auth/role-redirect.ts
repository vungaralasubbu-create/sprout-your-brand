import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "partner_manager" | "partner" | "wl_owner" | "student";

// Higher number = higher priority when a user has multiple roles.
const PRIORITY: Record<AppRole, number> = {
  super_admin: 100,
  admin: 90,
  partner_manager: 80,
  wl_owner: 70,
  partner: 60,
  student: 50,
};

export async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return ((data ?? []).map((r: any) => r.role) as AppRole[]);
}

export function primaryRole(roles: AppRole[]): AppRole | null {
  if (!roles.length) return null;
  return [...roles].sort((a, b) => PRIORITY[b] - PRIORITY[a])[0];
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
      return "/brand/dashboard";
    case "student":
      return "/student/dashboard";
    default:
      return "/";
  }
}

export async function resolveRedirectForUser(userId: string): Promise<{ path: string; role: AppRole | null }> {
  const roles = await fetchUserRoles(userId);
  const role = primaryRole(roles);
  return { path: dashboardPathForRole(role), role };
}
