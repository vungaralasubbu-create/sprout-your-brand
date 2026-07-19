/**
 * Permission Engine & Role Validation
 * -----------------------------------
 * `hasPermission(userId, permission)` resolves the caller's roles via
 * `user_roles` and checks the `permission_registry`. Backed by an
 * in-memory TTL cache keyed by role+permission to avoid repeat lookups.
 *
 * `requirePermission` throws a typed error the caller should surface as
 * 403 Forbidden.
 */

import type { AppRole } from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const permCache = new Map<string, { at: number; allowed: boolean }>();
const CACHE_TTL_MS = 60_000;

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const supabaseAdmin = await admin();
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as AppRole);
}

async function permissionAllowedForRole(role: AppRole, permission: string): Promise<boolean> {
  const key = `${role}:${permission}`;
  const hit = permCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.allowed;
  const supabaseAdmin = await admin();
  const { data } = await supabaseAdmin
    .from("permission_registry")
    .select("allowed")
    .eq("role", role)
    .eq("permission", permission)
    .maybeSingle();
  const allowed = !!data?.allowed;
  permCache.set(key, { at: Date.now(), allowed });
  return allowed;
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  if (!roles.length) return false;
  if (roles.includes("super_admin")) return true;
  for (const role of roles) {
    if (await permissionAllowedForRole(role, permission)) return true;
  }
  return false;
}

export class ForbiddenError extends Error {
  code = "forbidden" as const;
  status = 403;
  constructor(message = "Forbidden") { super(message); this.name = "ForbiddenError"; }
}

export async function requirePermission(userId: string, permission: string): Promise<void> {
  const ok = await hasPermission(userId, permission);
  if (!ok) throw new ForbiddenError(`Missing permission: ${permission}`);
}

export function invalidatePermissionCache() { permCache.clear(); }
