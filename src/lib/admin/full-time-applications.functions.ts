import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Forbidden");
}

/** List all full-time applications with partner stats snapshot. */
export const listFullTimeApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: apps, error } = await supabaseAdmin
      .from("partner_full_time_applications")
      .select(
        "id, partner_id, status, applied_at, reviewed_at, admin_notes, applicant_notes, reviewed_by",
      )
      .order("applied_at", { ascending: false });
    if (error) throw new Error(error.message);
    if (!apps || apps.length === 0) return [];

    const partnerIds = Array.from(new Set(apps.map((a) => a.partner_id)));
    const [{ data: partners }, { data: leads }, { data: enrolls }] = await Promise.all([
      supabaseAdmin
        .from("partners")
        .select(
          "id, display_name, partner_code, created_at, work_model, work_model_status, brand_selling_model",
        )
        .in("id", partnerIds),
      supabaseAdmin
        .from("partner_leads")
        .select("id, owner_partner_id, assigned_partner_id, status")
        .or(
          `owner_partner_id.in.(${partnerIds.join(",")}),assigned_partner_id.in.(${partnerIds.join(",")})`,
        ),
      supabaseAdmin
        .from("enrollments")
        .select("partner_id, gross_revenue, status, verified_at")
        .in("partner_id", partnerIds),
    ]);

    const partnerMap = new Map((partners ?? []).map((p) => [p.id, p]));
    const leadStats = new Map<string, { total: number }>();
    for (const l of leads ?? []) {
      for (const pid of [l.owner_partner_id, l.assigned_partner_id]) {
        if (!pid || !partnerIds.includes(pid)) continue;
        const cur = leadStats.get(pid) ?? { total: 0 };
        cur.total += 1;
        leadStats.set(pid, cur);
      }
    }
    const saleStats = new Map<string, { verifiedSales: number; verifiedRevenue: number }>();
    for (const e of enrolls ?? []) {
      if (!e.partner_id) continue;
      const cur = saleStats.get(e.partner_id) ?? { verifiedSales: 0, verifiedRevenue: 0 };
      if (e.status === "verified" || e.verified_at) {
        cur.verifiedSales += 1;
        cur.verifiedRevenue += Number(e.gross_revenue ?? 0);
      }
      saleStats.set(e.partner_id, cur);
    }

    return apps.map((a) => {
      const p = partnerMap.get(a.partner_id) as any;
      const ls = leadStats.get(a.partner_id) ?? { total: 0 };
      const ss = saleStats.get(a.partner_id) ?? { verifiedSales: 0, verifiedRevenue: 0 };
      const cr = ls.total > 0 ? (ss.verifiedSales / ls.total) * 100 : 0;
      return {
        ...a,
        partner: p ?? null,
        stats: {
          totalLeads: ls.total,
          verifiedSales: ss.verifiedSales,
          verifiedRevenue: ss.verifiedRevenue,
          conversionRate: cr,
        },
      };
    });
  });

/** Approve, reject, or request more info on a full-time application. */
export const reviewFullTimeApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    id: string;
    action: "approve" | "reject" | "more_info";
    notes?: string;
  }) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["approve", "reject", "more_info"]),
        notes: z.string().trim().max(1000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app, error: findErr } = await supabaseAdmin
      .from("partner_full_time_applications")
      .select("id, partner_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (findErr || !app) throw new Error("Application not found");

    const nowIso = new Date().toISOString();
    const nextStatus =
      data.action === "approve" ? "approved" : data.action === "reject" ? "rejected" : "more_info";

    const { error: upAppErr } = await supabaseAdmin
      .from("partner_full_time_applications")
      .update({
        status: nextStatus,
        reviewed_at: nowIso,
        reviewed_by: userId,
        admin_notes: data.notes ?? null,
      })
      .eq("id", data.id);
    if (upAppErr) throw new Error(upAppErr.message);

    if (data.action === "approve") {
      await supabaseAdmin
        .from("partners")
        .update({
          work_model: "full_time",
          work_model_status: "full_time_active",
          work_model_approved_at: nowIso,
          work_model_approved_by: userId,
        })
        .eq("id", app.partner_id);
    } else if (data.action === "reject") {
      await supabaseAdmin
        .from("partners")
        .update({ work_model_status: "flexible_active" })
        .eq("id", app.partner_id);
    }
    // more_info leaves work_model_status untouched (still pending)
    return { ok: true };
  });

/** Update an individual partner's account status (admin only). */
export const updatePartnerAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { partner_id: string; account_status: string }) =>
    z
      .object({
        partner_id: z.string().uuid(),
        account_status: z.enum(["active", "under_review", "suspended", "inactive"]),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("partners")
      .update({ account_status: data.account_status })
      .eq("id", data.partner_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
