import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensurePermission(context: any, permission: string) {
  const { data, error } = await context.supabase.rpc("has_admin_permission", {
    _user_id: context.userId,
    _permission: permission,
  });
  if (error) throw new Error("Permission check failed");
  if (!data) throw new Error("Access restricted");
}

// -------- Summary --------

export const getRiskSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensurePermission(context, "risk_review.view");
    const s = context.supabase;
    const types = [
      "duplicate_utr",
      "possible_duplicate_proof",
      "unexpected_payment_amount",
      "lead_multi_partner",
      "lead_ownership_conflict",
      "repeated_payment_submission",
      "unusual_sales_activity",
      "suspicious_referral_pattern",
    ] as const;

    const [openR, resolvedR, ...byTypeR] = await Promise.all([
      s.from("risk_flags").select("id", { count: "exact", head: true }).eq("status", "open"),
      s
        .from("risk_flags")
        .select("id", { count: "exact", head: true })
        .in("status", ["resolved", "dismissed"]),
      ...types.map((t) =>
        s
          .from("risk_flags")
          .select("id", { count: "exact", head: true })
          .eq("flag_type", t)
          .eq("status", "open"),
      ),
    ]);
    const byType: Record<string, number> = {};
    types.forEach((t, i) => (byType[t] = byTypeR[i].count ?? 0));
    return { open: openR.count ?? 0, resolved: resolvedR.count ?? 0, byType };
  });

// -------- Queue --------

export const listRiskFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { status?: string; flag_type?: string; limit?: number } | undefined) => v ?? {})
  .handler(async ({ context, data }) => {
    await ensurePermission(context, "risk_review.view");
    const s = context.supabase;
    let q = s
      .from("risk_flags")
      .select(
        `id, flag_type, severity, status, reason, partner_id, lead_id, submission_id, referral_id,
         utr_normalized, amount_expected, amount_submitted, amount_delta, metadata, detected_at, created_at,
         partners:partner_id(id, display_name, referral_code),
         partner_leads:lead_id(id, full_name, mobile),
         partner_payment_submissions:submission_id(id, amount, utr_reference)`,
      )
      .order("created_at", { ascending: false })
      .limit(Math.min(data?.limit ?? 200, 500));
    if (data?.status) q = q.eq("status", data.status as any);
    if (data?.flag_type) q = q.eq("flag_type", data.flag_type as any);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// -------- Detail --------

export const getRiskFlag = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string }) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    await ensurePermission(context, "risk_review.view");
    const s = context.supabase;
    const { data: flag, error } = await s
      .from("risk_flags")
      .select(
        `*, partners:partner_id(id, display_name, referral_code, mobile, email),
         partner_leads:lead_id(id, full_name, mobile, email, status, owner_partner_id, assigned_partner_id),
         partner_payment_submissions:submission_id(id, amount, plan, utr_reference, payment_date, status, proof_path, payment_link_id),
         partner_referrals:referral_id(id, referral_code, status, bonus_amount)`,
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!flag) throw new Error("Not found");

    // related duplicates
    let related: any[] = [];
    if (flag.flag_type === "duplicate_utr" && flag.utr_normalized) {
      const { data: r } = await s
        .from("partner_payment_submissions")
        .select("id, partner_id, lead_id, amount, plan, payment_date, status, utr_reference, submitted_at")
        .eq("utr_normalized", flag.utr_normalized)
        .order("submitted_at", { ascending: false });
      related = r ?? [];
    } else if (flag.flag_type === "possible_duplicate_proof" && flag.submission_id) {
      const { data: cur } = await s
        .from("partner_payment_submissions")
        .select("proof_hash")
        .eq("id", flag.submission_id)
        .maybeSingle();
      if (cur?.proof_hash) {
        const { data: r } = await s
          .from("partner_payment_submissions")
          .select("id, partner_id, lead_id, amount, plan, payment_date, status, utr_reference, submitted_at")
          .eq("proof_hash", cur.proof_hash)
          .order("submitted_at", { ascending: false });
        related = r ?? [];
      }
    }

    const [{ data: notes }, { data: activity }] = await Promise.all([
      s
        .from("risk_flag_notes")
        .select("id, note, author_user_id, created_at")
        .eq("flag_id", data.id)
        .order("created_at", { ascending: false }),
      s
        .from("risk_flag_activity")
        .select("id, action, from_status, to_status, actor_user_id, detail, created_at")
        .eq("flag_id", data.id)
        .order("created_at", { ascending: false }),
    ]);

    return { flag, related, notes: notes ?? [], activity: activity ?? [] };
  });

// -------- Actions --------

const StatusEnum = z.enum(["open", "under_review", "needs_information", "resolved", "dismissed"]);

export const updateRiskFlagStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string; status: string; note?: string }) =>
    z
      .object({ id: z.string().uuid(), status: StatusEnum, note: z.string().max(4000).optional() })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    await ensurePermission(context, "risk_review.review");
    if (data.status === "resolved") await ensurePermission(context, "risk_review.resolve");
    if (data.status === "dismissed") await ensurePermission(context, "risk_review.dismiss");
    if ((data.status === "resolved" || data.status === "dismissed") && !data.note?.trim()) {
      throw new Error("A review note is required to resolve or dismiss a flag.");
    }
    const s = context.supabase;

    const { data: prev, error: rErr } = await s
      .from("risk_flags")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();
    if (rErr || !prev) throw new Error("Flag not found");

    const patch: any = { status: data.status };
    if (data.status === "resolved" || data.status === "dismissed") {
      patch.reviewed_by = context.userId;
      patch.reviewed_at = new Date().toISOString();
      patch.resolution_note = data.note ?? null;
    }
    const { error } = await s.from("risk_flags").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    if (data.note?.trim()) {
      await s
        .from("risk_flag_notes")
        .insert({ flag_id: data.id, author_user_id: context.userId, note: data.note.trim() });
    }
    await s.from("risk_flag_activity").insert({
      flag_id: data.id,
      actor_user_id: context.userId,
      action: `status_${data.status}`,
      from_status: prev.status,
      to_status: data.status,
      detail: data.note ? { note_preview: data.note.slice(0, 200) } : {},
    });
    return { ok: true };
  });

export const addRiskFlagNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string; note: string }) =>
    z.object({ id: z.string().uuid(), note: z.string().min(1).max(4000) }).parse(v),
  )
  .handler(async ({ context, data }) => {
    await ensurePermission(context, "risk_review.review");
    const s = context.supabase;
    const { error } = await s
      .from("risk_flag_notes")
      .insert({ flag_id: data.id, author_user_id: context.userId, note: data.note.trim() });
    if (error) throw new Error(error.message);
    await s.from("risk_flag_activity").insert({
      flag_id: data.id,
      actor_user_id: context.userId,
      action: "note_added",
      detail: {},
    });
    return { ok: true };
  });

// -------- Settings --------

export const getRiskSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensurePermission(context, "risk_review.view");
    const { data, error } = await context.supabase
      .from("risk_review_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateRiskSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: any) =>
    z
      .object({
        submissions_per_hour_threshold: z.number().int().min(1).max(1000),
        verified_sales_per_day_threshold: z.number().int().min(1).max(1000),
        duplicate_utr_threshold: z.number().int().min(1).max(50),
        duplicate_lead_upload_threshold: z.number().int().min(1).max(100),
        amount_delta_min: z.number().min(0),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
    if (!isSuper) throw new Error("Only Super Admin can change risk thresholds.");
    const { error } = await context.supabase
      .from("risk_review_settings")
      .update({ ...data, updated_by: context.userId, updated_at: new Date().toISOString() })
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- On-demand scans --------

export const runReferralPatternScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensurePermission(context, "risk_review.review");
    const { data, error } = await context.supabase.rpc("scan_referral_patterns");
    if (error) throw new Error(error.message);
    return { created: data ?? 0 };
  });
