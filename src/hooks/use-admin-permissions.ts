import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAdminSession } from "@/lib/admin/admin-team.functions";

export type AdminSession = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: string[];
  adminUser: any | null;
};

export function useAdminSession() {
  const fn = useServerFn(getMyAdminSession);
  return useQuery<AdminSession>({
    queryKey: ["admin-session"],
    queryFn: () => fn() as any,
    staleTime: 60_000,
  });
}

export function hasPermission(session: AdminSession | undefined | null, permission: string): boolean {
  if (!session?.isAdmin) return false;
  if (session.isSuperAdmin) return true;
  if (session.permissions.includes("*")) return true;
  return session.permissions.includes(permission);
}

export function hasAnyPermission(session: AdminSession | undefined | null, keys: string[]): boolean {
  if (!keys.length) return true;
  return keys.some((k) => hasPermission(session, k));
}
