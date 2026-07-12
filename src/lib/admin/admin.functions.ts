import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;

    const [
      publishedPrograms,
      activePartners,
      partnerApplications,
      brandApplications,
      pendingCommissions,
      pendingPayouts,
      partnersUnderReview,
      attributionConflicts,
      overdueLaunchTasks,
    ] = await Promise.all([
      s.from("courses").select("id", { count: "exact", head: true }).eq("status", "published"),
      s.from("partners").select("id", { count: "exact", head: true }).eq("status", "active"),
      s.from("partner_applications").select("id", { count: "exact", head: true })
        .in("status", ["submitted", "under_review", "information_required"]),
      s.from("brand_applications").select("id", { count: "exact", head: true })
        .in("status", ["submitted", "under_review", "information_required"]),
      s.from("commissions").select("commission_amount")
        .in("status", ["pending", "verified"]),
      s.from("payouts").select("id", { count: "exact", head: true })
        .in("status", ["pending", "processing"]),
      s.from("partners").select("id", { count: "exact", head: true })
        .eq("sales_model_approval_status", "under_review"),
      s.from("partner_lead_attribution_reviews").select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      s.from("brand_launch_tasks").select("id", { count: "exact", head: true })
        .lt("due_date", new Date().toISOString())
        .not("status", "in", "(completed,cancelled)"),
    ]);

    const pendingRevenue = (pendingCommissions.data ?? [])
      .reduce((sum: number, r: any) => sum + Number(r.commission_amount ?? 0), 0);

    return {
      kpis: {
        publishedPrograms: publishedPrograms.count ?? 0,
        activePartners: activePartners.count ?? 0,
        partnerApplications: partnerApplications.count ?? 0,
        brandApplications: brandApplications.count ?? 0,
        pendingRevenue,
        pendingPayouts: pendingPayouts.count ?? 0,
      },
      attention: {
        partnerApplications: partnerApplications.count ?? 0,
        modelsAwaitingApproval: partnersUnderReview.count ?? 0,
        attributionConflicts: attributionConflicts.count ?? 0,
        revenueAwaitingVerification: (pendingCommissions.data ?? []).length,
        payoutsAwaitingReview: pendingPayouts.count ?? 0,
        brandApplications: brandApplications.count ?? 0,
        overdueLaunchTasks: overdueLaunchTasks.count ?? 0,
      },
    };
  });

export const getAdminActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const [logs, apps, brands, coursesPub, partnersApproved] = await Promise.all([
      s.from("admin_activity_log").select("*").order("created_at", { ascending: false }).limit(15),
      s.from("partner_applications").select("id, full_name, status, created_at").order("created_at", { ascending: false }).limit(6),
      s.from("brand_applications").select("id, preferred_brand_name, status, created_at").order("created_at", { ascending: false }).limit(6),
      s.from("courses").select("id, name, updated_at").eq("status", "published").order("updated_at", { ascending: false }).limit(6),
      s.from("partners").select("id, display_name, status, created_at").eq("status", "active").order("created_at", { ascending: false }).limit(6),
    ]);

    const feed: Array<{ id: string; icon: string; title: string; summary: string; at: string }> = [];
    (logs.data ?? []).forEach((l: any) =>
      feed.push({ id: `log-${l.id}`, icon: l.event_type, title: l.title, summary: l.summary ?? "", at: l.created_at })
    );
    (apps.data ?? []).forEach((a: any) =>
      feed.push({
        id: `pa-${a.id}`,
        icon: "partner_application",
        title: "Partner application " + a.status,
        summary: a.full_name ?? "New application submitted",
        at: a.created_at,
      }),
    );
    (brands.data ?? []).forEach((a: any) =>
      feed.push({
        id: `ba-${a.id}`,
        icon: "brand_application",
        title: "Brand application " + a.status,
        summary: a.preferred_brand_name ?? "New brand application",
        at: a.created_at,
      }),
    );
    (coursesPub.data ?? []).forEach((c: any) =>
      feed.push({ id: `c-${c.id}`, icon: "course_published", title: "Course updated", summary: c.name, at: c.updated_at }),
    );
    (partnersApproved.data ?? []).forEach((p: any) =>
      feed.push({ id: `p-${p.id}`, icon: "partner_approved", title: "Partner active", summary: p.display_name ?? "Partner", at: p.created_at }),
    );

    feed.sort((a, b) => (a.at < b.at ? 1 : -1));
    return feed.slice(0, 20);
  });

// ============ PARTNERS ============
export const listAdminPartners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    q?: string; status?: string; selected?: string; approved?: string;
    onboarding?: string; payout?: string; limit?: number;
  }) => d ?? {})
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    let q = context.supabase
      .from("partners")
      .select(
        "id, partner_code, display_name, first_name, email, mobile, city, state, role_title, status, sales_model_selection, approved_sales_model, sales_model_approval_status, onboarding_status, payout_profile_status, agreement_status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);

    if (data.q) {
      const like = `%${data.q}%`;
      q = q.or(`display_name.ilike.${like},first_name.ilike.${like},email.ilike.${like},mobile.ilike.${like},partner_code.ilike.${like}`);
    }
    if (data.status && data.status !== "all") q = q.eq("status", data.status as any);
    if (data.selected && data.selected !== "all") q = q.eq("sales_model_selection", data.selected);
    if (data.approved && data.approved !== "all") q = q.eq("approved_sales_model", data.approved);
    if (data.onboarding && data.onboarding !== "all") q = q.eq("onboarding_status", data.onboarding);
    if (data.payout && data.payout !== "all") q = q.eq("payout_profile_status", data.payout);

    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const getAdminPartnerDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const [partner, interests, modelHistory, agreements] = await Promise.all([
      s.from("partners").select("*").eq("id", data.id).maybeSingle(),
      s.from("partner_program_interests").select("id, course_id, category_id, courses:course_id(name,slug), course_categories:category_id(name,slug)").eq("partner_id", data.id),
      s.from("partner_model_approval_history").select("*").eq("partner_id", data.id).order("created_at", { ascending: false }),
      s.from("partner_agreement_acceptances").select("*").eq("partner_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (partner.error) throw partner.error;
    if (!partner.data) throw new Error("Partner not found");

    const p: any = partner.data;
    // Sanitize sensitive
    const safePartner = {
      ...p,
      bank_account_last4: p.bank_account_last4 ?? null,
    };
    return {
      partner: safePartner,
      interests: interests.data ?? [],
      modelHistory: modelHistory.data ?? [],
      agreements: agreements.data ?? [],
    };
  });

export const updatePartnerStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "active" | "suspended" | "revoked" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["active", "suspended", "revoked"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.from("partners").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    await context.supabase.from("admin_activity_log").insert({
      actor_user_id: context.userId,
      event_type: "partner_status_changed",
      entity_type: "partner",
      entity_id: data.id,
      title: `Partner ${data.status}`,
      summary: `Status changed to ${data.status}`,
    });
    return { ok: true };
  });

// ============ PARTNER APPLICATIONS ============
export const listPartnerApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; q?: string }) => d ?? {})
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    let q = context.supabase
      .from("partner_applications")
      .select("id, full_name, email, mobile, city, state, status, current_role_title, preferred_model, years_experience, created_at, reviewed_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as any);
    if (data.q) {
      const like = `%${data.q}%`;
      q = q.or(`full_name.ilike.${like},email.ilike.${like},mobile.ilike.${like}`);
    }
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const getPartnerApplicationDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const [app, history] = await Promise.all([
      s.from("partner_applications").select("*").eq("id", data.id).maybeSingle(),
      s.from("partner_application_status_history").select("*").eq("application_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (app.error) throw app.error;
    return { application: app.data, history: history.data ?? [] };
  });

export const reviewPartnerApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    status: "under_review" | "information_required" | "approved" | "rejected" | "on_hold";
    note?: string;
  }) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["under_review", "information_required", "approved", "rejected", "on_hold"]),
      note: z.string().max(1000).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data: current } = await s.from("partner_applications").select("status,user_id,full_name,email,mobile,city,state").eq("id", data.id).maybeSingle();
    if (!current) throw new Error("Application not found");

    const patch: any = {
      status: data.status,
      admin_notes: data.note ?? undefined,
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
    };
    const { error } = await s.from("partner_applications").update(patch).eq("id", data.id);
    if (error) throw error;

    await s.from("partner_application_status_history").insert({
      application_id: data.id,
      from_status: (current as any).status,
      to_status: data.status,
      note: data.note ?? null,
      changed_by: context.userId,
    });

    // Auto-provision partner on approval
    if (data.status === "approved" && (current as any).user_id) {
      const { data: existing } = await s.from("partners").select("id").eq("user_id", (current as any).user_id).maybeSingle();
      if (!existing) {
        await s.from("partners").insert({
          user_id: (current as any).user_id,
          application_id: data.id,
          display_name: (current as any).full_name,
          email: (current as any).email,
          mobile: (current as any).mobile,
          city: (current as any).city,
          state: (current as any).state,
          status: "active",
        });
      }
      await s.from("user_roles").upsert(
        { user_id: (current as any).user_id, role: "partner" as any },
        { onConflict: "user_id,role" },
      );
    }

    await s.from("admin_activity_log").insert({
      actor_user_id: context.userId,
      event_type: "partner_application_" + data.status,
      entity_type: "partner_application",
      entity_id: data.id,
      title: `Partner application ${data.status.replace(/_/g, " ")}`,
      summary: (current as any).full_name ?? null,
    });
    return { ok: true };
  });

// ============ MODEL APPROVALS ============
export const listModelApprovals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string }) => d ?? {})
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    let q = context.supabase
      .from("partners")
      .select("id, partner_code, display_name, email, sales_model_selection, approved_sales_model, sales_model_approval_status, sales_model_selected_at, sales_model_approved_at")
      .not("sales_model_selection", "is", null)
      .order("sales_model_selected_at", { ascending: false })
      .limit(200);
    if (data.status && data.status !== "all") q = q.eq("sales_model_approval_status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const approvePartnerModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    partner_id: string;
    decision: "approved" | "partially_approved" | "information_required" | "rejected" | "suspended";
    approved_model?: "own_leads" | "supported_sales" | "dual_model" | null;
    reason?: string;
  }) =>
    z.object({
      partner_id: z.string().uuid(),
      decision: z.enum(["approved", "partially_approved", "information_required", "rejected", "suspended"]),
      approved_model: z.enum(["own_leads", "supported_sales", "dual_model"]).nullable().optional(),
      reason: z.string().max(1000).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data: current } = await s.from("partners")
      .select("sales_model_selection, sales_model_approval_status, approved_sales_model")
      .eq("id", data.partner_id).maybeSingle();
    if (!current) throw new Error("Partner not found");

    const patch: any = {
      sales_model_approval_status: data.decision,
      sales_model_approved_by: context.userId,
      sales_model_approved_at: new Date().toISOString(),
    };
    if (data.decision === "approved" || data.decision === "partially_approved") {
      patch.approved_sales_model = data.approved_model ?? (current as any).sales_model_selection;
    }
    if (data.decision === "rejected" || data.decision === "suspended") {
      patch.approved_sales_model = null;
    }

    const { error } = await s.from("partners").update(patch).eq("id", data.partner_id);
    if (error) throw error;

    await s.from("partner_model_approval_history").insert({
      partner_id: data.partner_id,
      from_status: (current as any).sales_model_approval_status,
      to_status: data.decision,
      selected_model: (current as any).sales_model_selection,
      approved_model: patch.approved_sales_model ?? null,
      reason: data.reason ?? null,
      changed_by: context.userId,
    });

    await s.from("admin_activity_log").insert({
      actor_user_id: context.userId,
      event_type: "model_" + data.decision,
      entity_type: "partner",
      entity_id: data.partner_id,
      title: `Sales model ${data.decision.replace(/_/g, " ")}`,
      summary: patch.approved_sales_model ?? null,
    });
    return { ok: true };
  });

// ============ PROGRAM ELIGIBILITY ============
export const getPartnerProgramMatrix = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { partner_id: string }) => z.object({ partner_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const [partner, categories, courses, eligibility, interests] = await Promise.all([
      s.from("partners").select("id, display_name, partner_code, email, approved_sales_model, sales_model_approval_status").eq("id", data.partner_id).maybeSingle(),
      s.from("course_categories").select("id, name, slug, status").eq("status", "published").order("display_order"),
      s.from("courses").select("id, name, slug, category_id, status, partner_sale_eligible, supported_sales_eligible").eq("is_published", true).order("display_order"),
      s.from("partner_program_eligibility").select("*").eq("partner_id", data.partner_id),
      s.from("partner_program_interests").select("course_id, category_id").eq("partner_id", data.partner_id),
    ]);
    return {
      partner: partner.data,
      categories: categories.data ?? [],
      courses: (courses.data ?? []).filter((c: any) => c.partner_sale_eligible || c.supported_sales_eligible),
      eligibility: eligibility.data ?? [],
      interests: interests.data ?? [],
    };
  });

export const listPartnersLite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string }) => d ?? {})
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    let q = context.supabase.from("partners").select("id, display_name, partner_code, email").order("created_at", { ascending: false }).limit(50);
    if (data.q) {
      const like = `%${data.q}%`;
      q = q.or(`display_name.ilike.${like},email.ilike.${like},partner_code.ilike.${like}`);
    }
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const setPartnerEligibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    partner_id: string;
    course_ids: string[];
    status: "eligible" | "restricted" | "suspended" | "pending_review";
    reason?: string;
  }) =>
    z.object({
      partner_id: z.string().uuid(),
      course_ids: z.array(z.string().uuid()).min(1).max(500),
      status: z.enum(["eligible", "restricted", "suspended", "pending_review"]),
      reason: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const rows = data.course_ids.map((cid) => ({
      partner_id: data.partner_id,
      course_id: cid,
      status: data.status,
      assigned_by: context.userId,
      reason: data.reason ?? null,
    }));
    const { error } = await context.supabase
      .from("partner_program_eligibility")
      .upsert(rows, { onConflict: "partner_id,course_id" });
    if (error) throw error;
    return { ok: true, count: rows.length };
  });

export const removePartnerEligibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { partner_id: string; course_ids: string[] }) =>
    z.object({ partner_id: z.string().uuid(), course_ids: z.array(z.string().uuid()).min(1) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase
      .from("partner_program_eligibility")
      .delete()
      .eq("partner_id", data.partner_id)
      .in("course_id", data.course_ids);
    if (error) throw error;
    return { ok: true };
  });
