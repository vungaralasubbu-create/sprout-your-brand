import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureSuperAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify");
  if (!data) throw new Error("Only Super Admin can perform this action");
}

async function ensureActiveAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_active_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify");
  if (!data) throw new Error("Not an admin");
}

async function ensurePermission(context: any, permission: string) {
  const { data, error } = await context.supabase.rpc("has_admin_permission", {
    _user_id: context.userId,
    _permission: permission,
  });
  if (error) throw new Error("Permission check failed");
  if (!data) throw new Error("Access restricted");
}

// -------- Current admin session --------

export const getMyAdminSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = context.supabase;
    const [{ data: isAdmin }, { data: isSuper }, { data: adminUser }, { data: roles }] = await Promise.all([
      s.rpc("is_active_admin", { _user_id: context.userId }),
      s.rpc("is_super_admin", { _user_id: context.userId }),
      s.from("admin_users").select("*").eq("user_id", context.userId).maybeSingle(),
      s.from("user_roles").select("role").eq("user_id", context.userId),
    ]);

    if (!isAdmin) return { isAdmin: false, isSuperAdmin: false, permissions: [] as string[], adminUser: null };

    // Resolve effective permissions
    let permissions: string[] = [];
    if (isSuper) {
      permissions = ["*"];
    } else if (adminUser?.admin_role) {
      const { data: rolePerms } = await s
        .from("admin_role_permissions")
        .select("permission_key")
        .eq("admin_role", adminUser.admin_role);
      const base = new Set((rolePerms ?? []).map((r: any) => r.permission_key as string));
      const { data: overrides } = await s
        .from("admin_permission_overrides")
        .select("permission_key,allowed")
        .eq("user_id", context.userId);
      for (const o of overrides ?? []) {
        if ((o as any).allowed) base.add((o as any).permission_key);
        else base.delete((o as any).permission_key);
      }
      permissions = Array.from(base);
    } else {
      // Legacy admin/partner_manager users with no admin_users row: all permissions.
      const legacy = (roles ?? []).some((r: any) => ["admin", "partner_manager"].includes(r.role));
      if (legacy) permissions = ["*"];
    }

    return {
      isAdmin: true,
      isSuperAdmin: !!isSuper,
      permissions,
      adminUser,
    };
  });

// -------- List admin team --------

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureActiveAdmin(context);
    const { data, error } = await context.supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAdminUser = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureActiveAdmin(context);
    const s = context.supabase;
    const [{ data: adminUser }, { data: rolePerms }, { data: overrides }] = await Promise.all([
      s.from("admin_users").select("*").eq("user_id", data.userId).maybeSingle(),
      s.from("admin_role_permissions").select("permission_key, admin_role"),
      s.from("admin_permission_overrides").select("permission_key, allowed").eq("user_id", data.userId),
    ]);
    if (!adminUser) throw new Error("Admin user not found");
    const rolePermList = (rolePerms ?? [])
      .filter((r: any) => r.admin_role === adminUser.admin_role)
      .map((r: any) => r.permission_key as string);
    return {
      adminUser,
      rolePermissions: rolePermList,
      overrides: (overrides ?? []) as { permission_key: string; allowed: boolean }[],
    };
  });

// -------- Create admin user --------

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  mobile: z.string().trim().max(20).optional(),
  adminRole: z.enum([
    "super_admin","sales_admin","lead_manager","payment_verifier","payout_manager",
    "referral_manager","brand_manager","support_agent","employment_admin","payroll_admin",
  ]),
});

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Try find existing auth user by email
    let userId: string | null = null;
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const match = existing?.users?.find((u: any) => (u.email ?? "").toLowerCase() === data.email);
    if (match) {
      userId = match.id;
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        phone: data.mobile || undefined,
        email_confirm: true,
        phone_confirm: !!data.mobile,
        user_metadata: { full_name: data.fullName },
      });
      if (createErr || !created?.user) throw new Error(createErr?.message ?? "Failed to create user");
      userId = created.user.id;
    }

    if (!userId) throw new Error("Unable to resolve user");

    // Upsert into admin_users
    const { error: upErr } = await supabaseAdmin
      .from("admin_users")
      .upsert({
        user_id: userId,
        full_name: data.fullName,
        email: data.email,
        mobile: data.mobile || null,
        admin_role: data.adminRole,
        account_status: "active",
        created_by: context.userId,
        admin_code: "", // auto-generated by trigger
      } as any, { onConflict: "user_id" });
    if (upErr) throw new Error(upErr.message);

    // Ensure user_roles has 'admin' entry (or 'super_admin')
    const targetRole = data.adminRole === "super_admin" ? "super_admin" : "admin";
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: targetRole }, { onConflict: "user_id,role" });

    await supabaseAdmin.from("admin_activity_log").insert({
      actor_user_id: context.userId,
      event_type: "admin_user_created",
      entity_type: "admin_user",
      entity_id: userId,
      title: `Created admin ${data.fullName}`,
      summary: `Role: ${data.adminRole}`,
    });

    return { userId };
  });

// -------- Update admin user role/status --------

const updateSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(100).optional(),
  mobile: z.string().trim().max(20).nullable().optional(),
  adminRole: z.enum([
    "super_admin","sales_admin","lead_manager","payment_verifier","payout_manager",
    "referral_manager","brand_manager","support_agent","employment_admin","payroll_admin",
  ]).optional(),
  accountStatus: z.enum(["active","suspended","inactive"]).optional(),
});

export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context);
    if (data.userId === context.userId && data.accountStatus && data.accountStatus !== "active") {
      throw new Error("You cannot suspend your own account");
    }
    const patch: any = {};
    if (data.fullName !== undefined) patch.full_name = data.fullName;
    if (data.mobile !== undefined) patch.mobile = data.mobile;
    if (data.adminRole) patch.admin_role = data.adminRole;
    if (data.accountStatus) patch.account_status = data.accountStatus;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_users").update(patch).eq("user_id", data.userId);
    if (error) throw new Error(error.message);

    // Keep user_roles synced with super_admin/admin
    if (data.adminRole) {
      const target = data.adminRole === "super_admin" ? "super_admin" : "admin";
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: data.userId, role: target },
        { onConflict: "user_id,role" }
      );
    }

    await supabaseAdmin.from("admin_activity_log").insert({
      actor_user_id: context.userId,
      event_type: data.accountStatus === "suspended" ? "admin_suspended" :
                  data.adminRole ? "admin_role_changed" : "admin_updated",
      entity_type: "admin_user",
      entity_id: data.userId,
      title: "Admin user updated",
      metadata: patch,
    });
    return { ok: true };
  });

// -------- Permission overrides --------

const overrideSchema = z.object({
  userId: z.string().uuid(),
  overrides: z.array(z.object({
    permissionKey: z.string().min(1).max(80),
    allowed: z.boolean().nullable(), // null = remove override
  })),
});

export const setPermissionOverrides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => overrideSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const removals = data.overrides.filter((o) => o.allowed === null).map((o) => o.permissionKey);
    const upserts = data.overrides.filter((o) => o.allowed !== null).map((o) => ({
      user_id: data.userId,
      permission_key: o.permissionKey,
      allowed: o.allowed as boolean,
      created_by: context.userId,
    }));

    if (removals.length) {
      await supabaseAdmin
        .from("admin_permission_overrides")
        .delete()
        .eq("user_id", data.userId)
        .in("permission_key", removals);
    }
    if (upserts.length) {
      await supabaseAdmin
        .from("admin_permission_overrides")
        .upsert(upserts, { onConflict: "user_id,permission_key" });
    }

    await supabaseAdmin.from("admin_activity_log").insert({
      actor_user_id: context.userId,
      event_type: "admin_permissions_changed",
      entity_type: "admin_user",
      entity_id: data.userId,
      title: "Permissions updated",
      metadata: { changes: data.overrides },
    });
    return { ok: true };
  });

// -------- Activity log --------

export const listAdminActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number } | undefined) =>
    z.object({ limit: z.number().min(1).max(500).default(200) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await ensureActiveAdmin(context);
    const s = context.supabase;
    const { data: rows, error } = await s
      .from("admin_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    if (!rows?.length) return [];

    // Enrich actor names from admin_users
    const ids = Array.from(new Set(rows.map((r: any) => r.actor_user_id).filter(Boolean)));
    const { data: admins } = ids.length
      ? await s.from("admin_users").select("user_id, full_name, admin_code, admin_role").in("user_id", ids)
      : { data: [] as any[] };
    const byId = new Map<string, any>();
    for (const a of admins ?? []) byId.set((a as any).user_id, a);
    return rows.map((r: any) => ({
      ...r,
      actor_name: byId.get(r.actor_user_id)?.full_name ?? r.actor_label ?? "System",
      actor_admin_code: byId.get(r.actor_user_id)?.admin_code ?? null,
      actor_role: byId.get(r.actor_user_id)?.admin_role ?? null,
    }));
  });

export { ensurePermission };
