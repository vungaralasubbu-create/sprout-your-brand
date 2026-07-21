// Dynamic Glintr Managed Payment Gateway — account management + routing.
// Purely additive: falls back to legacy `payment_settings` when no account
// is configured, so existing checkouts keep working.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const ACCOUNT_COLS =
  "id, account_name, merchant_name, upi_id, qr_image_url, bank_name, account_holder, status, priority, weight, notes, version, created_by, updated_by, created_at, updated_at";

const accountInput = z.object({
  id: z.string().uuid().optional().nullable(),
  account_name: z.string().trim().min(1).max(160),
  merchant_name: z.string().trim().min(1).max(160),
  upi_id: z.string().trim().min(3).max(160),
  qr_image_url: z.string().max(1000).optional().nullable(),
  bank_name: z.string().trim().max(160).optional().nullable(),
  account_holder: z.string().trim().max(160).optional().nullable(),
  status: z.enum(["active", "inactive", "maintenance", "archived"]).default("active"),
  priority: z.number().int().min(0).max(10000).default(100),
  weight: z.number().int().min(1).max(1000).default(1),
  notes: z.string().max(2000).optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
});

// ---------- Admin: accounts ----------

export const listPaymentAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("payment_accounts")
      .select(ACCOUNT_COLS)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPaymentAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { data: row, error } = await supabase
      .from("payment_accounts")
      .select(ACCOUNT_COLS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");
    return row;
  });

export const upsertPaymentAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => accountInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const payload = {
      account_name: data.account_name,
      merchant_name: data.merchant_name,
      upi_id: data.upi_id,
      qr_image_url: data.qr_image_url ?? null,
      bank_name: data.bank_name ?? null,
      account_holder: data.account_holder ?? null,
      status: data.status,
      priority: data.priority,
      weight: data.weight,
      notes: data.notes ?? null,
    };

    if (data.id) {
      // Load previous row so we can detect QR/UPI/merchant changes and version them.
      const { data: prev, error: prevErr } = await supabase
        .from("payment_accounts")
        .select("id, version, qr_image_url, upi_id, merchant_name")
        .eq("id", data.id)
        .maybeSingle();
      if (prevErr) throw new Error(prevErr.message);
      if (!prev) throw new Error("Account not found");

      const materialChange =
        prev.qr_image_url !== payload.qr_image_url ||
        prev.upi_id !== payload.upi_id ||
        prev.merchant_name !== payload.merchant_name;

      const nextVersion = materialChange ? (prev.version ?? 1) + 1 : prev.version;

      const { data: row, error } = await supabase
        .from("payment_accounts")
        .update({
          ...payload,
          version: nextVersion,
          updated_by: userId,
        })
        .eq("id", data.id)
        .select(ACCOUNT_COLS)
        .single();
      if (error) throw new Error(error.message);

      if (materialChange) {
        await supabase.from("payment_account_versions").insert({
          account_id: data.id,
          version_number: nextVersion,
          previous_qr_url: prev.qr_image_url,
          qr_image_url: payload.qr_image_url,
          upi_id: payload.upi_id,
          merchant_name: payload.merchant_name,
          reason: data.reason ?? null,
          uploaded_by: userId,
        });
      }
      return row;
    }

    // New account — version 1.
    const { data: row, error } = await supabase
      .from("payment_accounts")
      .insert({ ...payload, version: 1, created_by: userId, updated_by: userId })
      .select(ACCOUNT_COLS)
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("payment_account_versions").insert({
      account_id: row.id,
      version_number: 1,
      previous_qr_url: null,
      qr_image_url: payload.qr_image_url,
      upi_id: payload.upi_id,
      merchant_name: payload.merchant_name,
      reason: data.reason ?? "Initial version",
      uploaded_by: userId,
    });

    return row;
  });

export const setPaymentAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["active", "inactive", "maintenance", "archived"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { error } = await supabase
      .from("payment_accounts")
      .update({ status: data.status, updated_by: userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePaymentAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    // Soft delete via archived to preserve historical payment references.
    const { error } = await supabase
      .from("payment_accounts")
      .update({ status: "archived", updated_by: userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin: version history ----------

export const listPaymentAccountVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ accountId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { data: rows, error } = await supabase
      .from("payment_account_versions")
      .select("id, account_id, version_number, previous_qr_url, qr_image_url, upi_id, merchant_name, reason, uploaded_by, created_at")
      .eq("account_id", data.accountId)
      .order("version_number", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const restorePaymentAccountVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ accountId: z.string().uuid(), versionId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { data: ver, error: vErr } = await supabase
      .from("payment_account_versions")
      .select("qr_image_url, upi_id, merchant_name")
      .eq("id", data.versionId)
      .eq("account_id", data.accountId)
      .maybeSingle();
    if (vErr) throw new Error(vErr.message);
    if (!ver) throw new Error("Version not found");

    const { data: prev } = await supabase
      .from("payment_accounts")
      .select("version, qr_image_url")
      .eq("id", data.accountId)
      .maybeSingle();

    const nextVersion = (prev?.version ?? 1) + 1;

    const { error: uErr } = await supabase
      .from("payment_accounts")
      .update({
        qr_image_url: ver.qr_image_url,
        upi_id: ver.upi_id ?? undefined,
        merchant_name: ver.merchant_name ?? undefined,
        version: nextVersion,
        updated_by: userId,
      })
      .eq("id", data.accountId);
    if (uErr) throw new Error(uErr.message);

    await supabase.from("payment_account_versions").insert({
      account_id: data.accountId,
      version_number: nextVersion,
      previous_qr_url: prev?.qr_image_url ?? null,
      qr_image_url: ver.qr_image_url,
      upi_id: ver.upi_id,
      merchant_name: ver.merchant_name,
      reason: "Restored from earlier version",
      uploaded_by: userId,
    });
    return { ok: true };
  });

// ---------- Admin: gateway settings & routing ----------

export const getGatewaySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("payment_gateway_settings")
      .select("id, routing_mode, active_account_id, round_robin_cursor, updated_at")
      .eq("singleton", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateGatewaySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        routing_mode: z.enum(["manual", "round_robin", "weighted", "course_specific"]),
        active_account_id: z.string().uuid().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { data: row, error } = await supabase
      .from("payment_gateway_settings")
      .update({
        routing_mode: data.routing_mode,
        active_account_id: data.active_account_id ?? null,
        updated_by: userId,
      })
      .eq("singleton", true)
      .select("id, routing_mode, active_account_id, round_robin_cursor, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Admin: course assignment ----------

export const listCourseAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("payment_account_course_assignments")
      .select("id, course_id, account_id, created_at, courses:course_id(name, slug), payment_accounts:account_id(account_name, merchant_name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCourseAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ course_id: z.string().uuid(), account_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { error } = await supabase
      .from("payment_account_course_assignments")
      .upsert(
        { course_id: data.course_id, account_id: data.account_id, created_by: userId },
        { onConflict: "course_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeCourseAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ course_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { error } = await supabase
      .from("payment_account_course_assignments")
      .delete()
      .eq("course_id", data.course_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin: signed uploads to payment-config bucket ----------

export const createPaymentAccountUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        kind: z.enum(["qr", "logo"]),
        mime: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const ext =
      data.mime === "image/png"
        ? "png"
        : data.mime === "image/webp"
          ? "webp"
          : data.mime === "image/svg+xml"
            ? "svg"
            : "jpg";
    const path = `accounts/${data.kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data: signed, error } = await supabase.storage
      .from("payment-config")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed?.token ?? null, uploadUrl: signed?.signedUrl ?? null };
  });

// ---------- Server-side resolver (used by checkout) ----------
// Not a server function — internal helper called from other server code.
export async function resolveActiveAccountForCourse(
  supabase: any,
  courseId: string,
): Promise<{
  id: string;
  version: number;
  merchant_name: string;
  upi_id: string;
  qr_image_url: string | null;
  status: string;
} | null> {
  // 1. Course-specific override wins whenever the assigned account is usable.
  const { data: assign } = await supabase
    .from("payment_account_course_assignments")
    .select("account_id, payment_accounts:account_id(id, version, merchant_name, upi_id, qr_image_url, status)")
    .eq("course_id", courseId)
    .maybeSingle();
  const assigned = assign?.payment_accounts as any;
  if (assigned && assigned.status === "active") return assigned;

  // 2. Gateway settings drive routing across all courses.
  const { data: gw } = await supabase
    .from("payment_gateway_settings")
    .select("routing_mode, active_account_id, round_robin_cursor, id")
    .eq("singleton", true)
    .maybeSingle();

  const mode = gw?.routing_mode ?? "manual";

  if (mode === "manual" && gw?.active_account_id) {
    const { data: acc } = await supabase
      .from("payment_accounts")
      .select("id, version, merchant_name, upi_id, qr_image_url, status")
      .eq("id", gw.active_account_id)
      .maybeSingle();
    if (acc && acc.status === "active") return acc;
  }

  // 3. Round robin / weighted / course_specific fallback → next active by priority.
  const { data: pool } = await supabase
    .from("payment_accounts")
    .select("id, version, merchant_name, upi_id, qr_image_url, status, priority, weight")
    .eq("status", "active")
    .order("priority", { ascending: true });

  const list = (pool ?? []) as any[];
  if (list.length === 0) return null;

  if (mode === "round_robin") {
    const cursor = (gw?.round_robin_cursor ?? 0) % list.length;
    const chosen = list[cursor];
    // Advance cursor best-effort; ignore failures.
    await supabase
      .from("payment_gateway_settings")
      .update({ round_robin_cursor: (cursor + 1) % list.length })
      .eq("singleton", true);
    return chosen;
  }

  if (mode === "weighted") {
    const total = list.reduce((s, a) => s + Math.max(1, a.weight ?? 1), 0);
    let r = Math.random() * total;
    for (const a of list) {
      r -= Math.max(1, a.weight ?? 1);
      if (r <= 0) return a;
    }
    return list[0];
  }

  // course_specific without an assignment or manual without a selection → first active
  return list[0];
}
