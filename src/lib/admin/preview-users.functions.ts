import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  partner_manager: "Partner Manager",
  partner: "Sales Partner",
  wl_owner: "Brand Owner",
  student: "Student",
  instructor: "Instructor",
};

const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 100,
  admin: 90,
  partner_manager: 80,
  wl_owner: 70,
  partner: 60,
  instructor: 55,
  student: 50,
};

function pickPrimary(roles: string[]): string | null {
  if (!roles.length) return null;
  return [...roles].sort(
    (a, b) => (ROLE_PRIORITY[b] ?? 0) - (ROLE_PRIORITY[a] ?? 0),
  )[0];
}

function dashboardFor(role: string | null): string {
  switch (role) {
    case "super_admin":
    case "admin":
    case "partner_manager":
      return "/admin/dashboard";
    case "partner":
      return "/partner/dashboard";
    case "wl_owner":
      return "/brand/dashboard";
    case "instructor":
    case "student":
      return "/student/dashboard";
    default:
      return "/";
  }
}

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_active_admin", {
    _user_id: context.userId,
  });
  if (error) throw new Error("Permission check failed");
  if (!data) throw new Error("Only administrators can start a preview session");
}

export type PreviewUser = {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  primaryRole: string | null;
  roleLabel: string;
  dashboardPath: string;
  lastSignInAt: string | null;
};

function toPreviewUser(
  authUser: { id: string; email?: string | null; phone?: string | null; last_sign_in_at?: string | null; user_metadata?: any },
  roles: string[],
): PreviewUser {
  const meta = authUser.user_metadata ?? {};
  const name =
    (meta.full_name as string) ||
    (meta.name as string) ||
    (meta.display_name as string) ||
    (authUser.email ? authUser.email.split("@")[0] : null) ||
    "Unnamed user";
  const primary = pickPrimary(roles);
  return {
    userId: authUser.id,
    name,
    email: authUser.email ?? null,
    phone: authUser.phone ?? null,
    roles,
    primaryRole: primary,
    roleLabel: primary ? ROLE_LABEL[primary] ?? primary : "No role",
    dashboardPath: dashboardFor(primary),
    lastSignInAt: authUser.last_sign_in_at ?? null,
  };
}

export const searchPreviewUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { q?: string; role?: string; limit?: number }) =>
    z
      .object({
        q: z.string().max(120).optional(),
        role: z.string().max(40).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const limit = data.limit ?? 20;
    const query = (data.q ?? "").trim().toLowerCase();

    // Pull a page of users and filter client-side (Supabase admin API has no
    // direct search across email/name/phone in one call).
    const { data: page, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw new Error(error.message);

    let users = page.users;
    if (query) {
      users = users.filter((u) => {
        const meta = (u.user_metadata ?? {}) as Record<string, any>;
        const hay = [
          u.email ?? "",
          u.phone ?? "",
          meta.full_name ?? "",
          meta.name ?? "",
          meta.display_name ?? "",
          u.id,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
    }

    users = users.slice(0, limit);

    // Fetch roles in one batch
    const ids = users.map((u) => u.id);
    let rolesByUser = new Map<string, string[]>();
    if (ids.length) {
      const { data: roleRows } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      for (const r of roleRows ?? []) {
        const list = rolesByUser.get((r as any).user_id) ?? [];
        list.push((r as any).role as string);
        rolesByUser.set((r as any).user_id, list);
      }
    }

    let results: PreviewUser[] = users.map((u) =>
      toPreviewUser(u as any, rolesByUser.get(u.id) ?? []),
    );

    if (data.role) {
      results = results.filter((r) => r.roles.includes(data.role!));
    }

    // Sort by primary role priority then name
    results.sort((a, b) => {
      const pa = a.primaryRole ? ROLE_PRIORITY[a.primaryRole] ?? 0 : 0;
      const pb = b.primaryRole ? ROLE_PRIORITY[b.primaryRole] ?? 0 : 0;
      if (pa !== pb) return pb - pa;
      return a.name.localeCompare(b.name);
    });

    return { users: results };
  });

export const startUserPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: userRes, error } = await supabaseAdmin.auth.admin.getUserById(
      data.userId,
    );
    if (error || !userRes?.user) throw new Error("User not found");

    const { data: roleRows } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);

    const roles = (roleRows ?? []).map((r: any) => r.role as string);
    const preview = toPreviewUser(userRes.user as any, roles);

    // Best-effort audit trail
    try {
      await supabaseAdmin.from("admin_activity_log").insert({
        actor_id: context.userId,
        action: "preview_as_user.start",
        target_type: "user",
        target_id: data.userId,
        metadata: {
          target_role: preview.primaryRole,
          target_email: preview.email,
        },
      } as any);
    } catch {
      // audit table shape may differ across environments; ignore
    }

    return preview;
  });
