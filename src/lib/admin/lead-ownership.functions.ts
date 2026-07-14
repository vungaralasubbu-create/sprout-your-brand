import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

const filterSchema = z.object({
  status: z
    .enum([
      "all",
      "pending_review",
      "under_review",
      "possible_duplicate",
      "disputed",
      "resolved_keep_existing",
      "resolved_partner_own",
      "resolved_glintr_provided",
      "resolved_merged",
      "rejected",
    ])
    .default("pending_review"),
});

export const listOwnershipReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;

    let q = s
      .from("lead_ownership_reviews")
      .select(
        "id, claiming_partner_id, submitted_full_name, submitted_mobile_normalized, submitted_program_interest, submitted_source, submitted_course_id, existing_lead_id, status, created_at, decided_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (data.status !== "all") q = q.eq("status", data.status);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const partnerIds = [...new Set((rows ?? []).map((r: any) => r.claiming_partner_id))];
    const leadIds = [...new Set((rows ?? []).map((r: any) => r.existing_lead_id).filter(Boolean))];
    const courseIds = [...new Set((rows ?? []).map((r: any) => r.submitted_course_id).filter(Boolean))];

    const [partners, leads, courses, counts] = await Promise.all([
      partnerIds.length
        ? s.from("partners").select("id, display_name, partner_code").in("id", partnerIds)
        : Promise.resolve({ data: [] } as any),
      leadIds.length
        ? s
            .from("partner_leads")
            .select(
              "id, lead_ownership_type, owner_partner_id, assigned_partner_id, created_at, status",
            )
            .in("id", leadIds)
        : Promise.resolve({ data: [] } as any),
      courseIds.length
        ? s.from("courses").select("id, name").in("id", courseIds)
        : Promise.resolve({ data: [] } as any),
      Promise.all(
        [
          "pending_review",
          "under_review",
          "possible_duplicate",
          "disputed",
          "resolved_keep_existing",
          "resolved_partner_own",
          "resolved_glintr_provided",
          "resolved_merged",
          "rejected",
        ].map((st) =>
          s
            .from("lead_ownership_reviews")
            .select("id", { count: "exact", head: true })
            .eq("status", st as any),
        ),
      ),
    ]);

    const partnerMap = new Map((partners.data ?? []).map((p: any) => [p.id, p]));
    const leadMap = new Map((leads.data ?? []).map((l: any) => [l.id, l]));
    const courseMap = new Map((courses.data ?? []).map((c: any) => [c.id, c.name]));

    const statusKeys = [
      "pending_review",
      "under_review",
      "possible_duplicate",
      "disputed",
      "resolved_keep_existing",
      "resolved_partner_own",
      "resolved_glintr_provided",
      "resolved_merged",
      "rejected",
    ] as const;
    const statusCounts: Record<string, number> = {};
    counts.forEach((c: any, i: number) => (statusCounts[statusKeys[i]!] = c.count ?? 0));

    return {
      reviews: (rows ?? []).map((r: any) => {
        const p = partnerMap.get(r.claiming_partner_id) as any;
        const l = leadMap.get(r.existing_lead_id) as any;
        return {
          id: r.id,
          submitted_name: r.submitted_full_name,
          submitted_mobile: r.submitted_mobile_normalized,
          submitted_source: r.submitted_source,
          submitted_program: courseMap.get(r.submitted_course_id) ?? r.submitted_program_interest ?? "—",
          claiming_partner_id: r.claiming_partner_id,
          claiming_partner_name: p?.display_name ?? "—",
          claiming_partner_code: p?.partner_code ?? "—",
          existing_lead_id: r.existing_lead_id,
          existing_ownership_type: l?.lead_ownership_type ?? null,
          existing_created_at: l?.created_at ?? null,
          existing_assigned_partner_id: l?.assigned_partner_id ?? null,
          status: r.status,
          created_at: r.created_at,
          decided_at: r.decided_at,
        };
      }),
      statusCounts,
    };
  });

export const getOwnershipReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;

    const { data: r, error } = await s
      .from("lead_ownership_reviews")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!r) throw new Error("Ownership review not found.");

    const [partner, course, existing] = await Promise.all([
      s
        .from("partners")
        .select("id, display_name, partner_code, user_id")
        .eq("id", (r as any).claiming_partner_id)
        .maybeSingle(),
      (r as any).submitted_course_id
        ? s.from("courses").select("id, name").eq("id", (r as any).submitted_course_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
      (r as any).existing_lead_id
        ? s
            .from("partner_leads")
            .select(
              "id, full_name, mobile, lead_ownership_type, owner_partner_id, assigned_partner_id, source, status, created_at",
            )
            .eq("id", (r as any).existing_lead_id)
            .maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);

    let assignedPartner: any = null;
    let ownerPartner: any = null;
    const existingLead = existing.data as any;
    if (existingLead?.assigned_partner_id) {
      const { data: ap } = await s
        .from("partners")
        .select("id, display_name, partner_code")
        .eq("id", existingLead.assigned_partner_id)
        .maybeSingle();
      assignedPartner = ap;
    }
    if (existingLead?.owner_partner_id) {
      const { data: op } = await s
        .from("partners")
        .select("id, display_name, partner_code")
        .eq("id", existingLead.owner_partner_id)
        .maybeSingle();
      ownerPartner = op;
    }

    // Payment / commission status for the existing lead (informational).
    let paymentStatus: string | null = null;
    if (existingLead?.id) {
      const { data: pay } = await s
        .from("partner_payment_submissions")
        .select("status")
        .eq("lead_id", existingLead.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      paymentStatus = (pay as any)?.status ?? null;
    }

    return {
      review: r,
      claiming_partner: partner.data,
      submitted_course: course.data,
      existing_lead: existingLead,
      existing_assigned_partner: assignedPartner,
      existing_owner_partner: ownerPartner,
      existing_payment_status: paymentStatus,
    };
  });

const decisionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum([
    "keep_existing",
    "approve_partner_own",
    "mark_glintr_provided",
    "merge",
    "reject",
  ]),
  reason: z.string().trim().min(3).max(2000),
});

export const decideOwnershipReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => decisionSchema.parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { userId } = context;

    const { data: r, error } = await s
      .from("lead_ownership_reviews")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!r) throw new Error("Ownership review not found.");
    if ((r as any).decided_at) throw new Error("Ownership review already resolved.");

    const nowISO = new Date().toISOString();
    const existingLeadId = (r as any).existing_lead_id as string | null;
    const claimingPartnerId = (r as any).claiming_partner_id as string;

    let approvedLeadId: string | null = null;
    let mergedIntoLeadId: string | null = null;
    let newStatus: string = "resolved_keep_existing";

    async function closeOpenHistory(leadId: string) {
      await s
        .from("lead_ownership_history")
        .update({ ended_at: nowISO })
        .eq("lead_id", leadId)
        .is("ended_at", null);
    }

    if (data.action === "keep_existing") {
      newStatus = "resolved_keep_existing";
    } else if (data.action === "approve_partner_own") {
      if (!existingLeadId) throw new Error("Existing lead not found for approval.");
      await closeOpenHistory(existingLeadId);
      const { error: uErr } = await s
        .from("partner_leads")
        .update({
          owner_partner_id: claimingPartnerId,
          lead_ownership_type: "partner_own",
        })
        .eq("id", existingLeadId);
      if (uErr) throw new Error(uErr.message);
      await s.from("lead_ownership_history").insert({
        lead_id: existingLeadId,
        ownership_type: "partner_own",
        owner_partner_id: claimingPartnerId,
        changed_by: userId,
        reason: `Admin approved as Sales Partner Own Lead. ${data.reason}`,
      });
      approvedLeadId = existingLeadId;
      newStatus = "resolved_partner_own";
    } else if (data.action === "mark_glintr_provided") {
      if (!existingLeadId) throw new Error("Existing lead not found.");
      await closeOpenHistory(existingLeadId);
      const { error: uErr } = await s
        .from("partner_leads")
        .update({ lead_ownership_type: "glintr_provided" })
        .eq("id", existingLeadId);
      if (uErr) throw new Error(uErr.message);
      await s.from("lead_ownership_history").insert({
        lead_id: existingLeadId,
        ownership_type: "glintr_provided",
        owner_partner_id: null,
        changed_by: userId,
        reason: `Admin marked as Glintr Provided Lead. ${data.reason}`,
      });
      newStatus = "resolved_glintr_provided";
    } else if (data.action === "merge") {
      if (!existingLeadId) throw new Error("Existing lead not found for merge.");
      // Preserve submission as an activity note on the existing lead.
      await s.from("partner_lead_activities").insert({
        lead_id: existingLeadId,
        partner_id: claimingPartnerId,
        activity_type: "note" as any,
        content:
          `Merged ownership review submission by claiming partner. ` +
          `Submitted name: ${(r as any).submitted_full_name}. ` +
          `Notes: ${(r as any).submitted_notes ?? ""}. ` +
          `Admin reason: ${data.reason}`,
      }).then(() => {}, () => {});
      await s.from("lead_ownership_history").insert({
        lead_id: existingLeadId,
        ownership_type: (r as any).existing_lead_id ? "partner_own" : "partner_own",
        owner_partner_id: null,
        changed_by: userId,
        reason: `Merged with review ${(r as any).id}. ${data.reason}`,
      });
      mergedIntoLeadId = existingLeadId;
      newStatus = "resolved_merged";
    } else if (data.action === "reject") {
      newStatus = "rejected";
    }

    const { error: rErr } = await s
      .from("lead_ownership_reviews")
      .update({
        status: newStatus as any,
        admin_decision: data.action,
        admin_reason: data.reason,
        decided_by: userId,
        decided_at: nowISO,
        approved_lead_id: approvedLeadId,
        merged_into_lead_id: mergedIntoLeadId,
      })
      .eq("id", data.id);
    if (rErr) throw new Error(rErr.message);

    // Release earnings held for this review — the next verification step
    // or an admin recalculation can then apply the resolved 70% / 50% rule.
    await s
      .from("commissions")
      .update({ ownership_pending: false })
      .eq("ownership_review_id", data.id)
      .then(() => {}, () => {});

    return { ok: true, status: newStatus };
  });

export const getOwnershipHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lead_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data: rows, error } = await s
      .from("lead_ownership_history")
      .select(
        "id, ownership_type, owner_partner_id, reason, started_at, ended_at, changed_by, partners:owner_partner_id(display_name, partner_code)",
      )
      .eq("lead_id", data.lead_id)
      .order("started_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { history: rows ?? [] };
  });

export const getPendingOwnershipReviewCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { count } = await context.supabase
      .from("lead_ownership_reviews")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending_review", "under_review", "possible_duplicate", "disputed"]);
    return { pending: count ?? 0 };
  });
