import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ─────────────────────────── helpers ───────────────────────────

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Forbidden");
}

function normalizePhone(v: string) {
  const digits = (v ?? "").toString().replace(/\D/g, "");
  // Normalise Indian numbers: strip 91 country code and any leading 0.
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

const LEAD_SOURCES = [
  "personal_network","referral","social_media","whatsapp","instagram","linkedin",
  "website","event","college_network","assigned","other","website_counsellor",
] as const;

// ─────────────────────────── metrics + list ───────────────────────────

export const getAdminLeadMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const base = supabase.from("partner_leads")
      .select("*", { count: "exact", head: true })
      .eq("lead_ownership_type", "glintr_provided");

    async function count(builder: any) {
      const { count } = await builder;
      return count ?? 0;
    }

    const [total, unassigned, assigned, s_new, contacted, no_answer, follow_up, interested, payment_pending, converted] = await Promise.all([
      count(base),
      count(supabase.from("partner_leads").select("*",{count:"exact",head:true}).eq("lead_ownership_type","glintr_provided").is("assigned_partner_id", null)),
      count(supabase.from("partner_leads").select("*",{count:"exact",head:true}).eq("lead_ownership_type","glintr_provided").not("assigned_partner_id","is", null)),
      count(supabase.from("partner_leads").select("*",{count:"exact",head:true}).eq("lead_ownership_type","glintr_provided").eq("status","new")),
      count(supabase.from("partner_leads").select("*",{count:"exact",head:true}).eq("lead_ownership_type","glintr_provided").eq("status","contacted")),
      count(supabase.from("partner_leads").select("*",{count:"exact",head:true}).eq("lead_ownership_type","glintr_provided").eq("status","no_answer")),
      count(supabase.from("partner_leads").select("*",{count:"exact",head:true}).eq("lead_ownership_type","glintr_provided").eq("status","follow_up")),
      count(supabase.from("partner_leads").select("*",{count:"exact",head:true}).eq("lead_ownership_type","glintr_provided").eq("status","interested")),
      count(supabase.from("partner_leads").select("*",{count:"exact",head:true}).eq("lead_ownership_type","glintr_provided").eq("status","payment_pending")),
      count(supabase.from("partner_leads").select("*",{count:"exact",head:true}).eq("lead_ownership_type","glintr_provided").eq("status","enrolled")),
    ]);

    return {
      total, unassigned, assigned,
      new: s_new, contacted, no_answer, follow_up, interested, payment_pending, converted,
    };
  });

const listInput = z.object({
  filter: z.enum(["all","unassigned","assigned","new","contacted","no_answer","follow_up","interested","payment_pending","converted"]).default("all"),
  search: z.string().trim().max(120).optional().nullable(),
  campaign_source: z.string().trim().max(120).optional().nullable(),
  program_id: z.string().uuid().optional().nullable(),
  partner_id: z.string().uuid().optional().nullable(),
  limit: z.number().min(1).max(500).default(200),
});

export const listAdminGlintrLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    let q = supabase
      .from("partner_leads")
      .select(`
        id, full_name, mobile, email, program_interest, source, campaign_source, notes,
        status, assigned_partner_id, assigned_at, assignment_method, created_at, last_activity_at,
        course:course_id ( id, name, slug ),
        assigned:assigned_partner_id ( id, display_name, referral_code, work_model )
      `)
      .eq("lead_ownership_type", "glintr_provided")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    const f = data.filter;
    if (f === "unassigned") q = q.is("assigned_partner_id", null);
    else if (f === "assigned") q = q.not("assigned_partner_id","is",null);
    else if (f === "converted") q = q.eq("status", "enrolled");
    else if (f !== "all") q = q.eq("status", f);

    if (data.program_id) q = q.eq("course_id", data.program_id);
    if (data.partner_id) q = q.eq("assigned_partner_id", data.partner_id);
    if (data.campaign_source) q = q.ilike("campaign_source", `%${data.campaign_source}%`);

    if (data.search) {
      const s = data.search.trim();
      const norm = normalizePhone(s);
      const parts = [
        `full_name.ilike.%${s}%`,
        `email.ilike.%${s}%`,
        `program_interest.ilike.%${s}%`,
      ];
      if (norm) parts.push(`mobile_normalized.ilike.%${norm}%`);
      q = q.or(parts.join(","));
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Optional: filter by partner referral_code (Sales Partner ID) via search
    let final = rows ?? [];
    if (data.search) {
      const s = data.search.trim().toUpperCase();
      // include rows where assigned partner referral_code contains query
      const referralMatch = final.filter((r: any) => r.assigned?.referral_code?.toUpperCase()?.includes(s));
      // Only replace if search was clearly a partner id (starts with GLINTR)
      if (s.startsWith("GLINTR") && referralMatch.length > 0) final = referralMatch;
    }
    return final;
  });

// ─────────────────────────── manual add ───────────────────────────

const manualAddInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  mobile: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  course_id: z.string().uuid().optional().nullable(),
  program_interest: z.string().trim().max(200).optional().nullable().or(z.literal("")),
  source: z.enum(LEAD_SOURCES).optional().default("other"),
  campaign_source: z.string().trim().max(120).optional().nullable().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().nullable().or(z.literal("")),
});

export const addAdminLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => manualAddInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const mobileNorm = normalizePhone(data.mobile);
    if (mobileNorm.length < 6) return { status: "invalid" as const, message: "Invalid mobile number." };

    const { data: dup } = await supabase.from("partner_leads")
      .select("id, lead_ownership_type, assigned_partner_id")
      .eq("mobile_normalized", mobileNorm)
      .limit(1).maybeSingle();

    if (dup) {
      return { status: "duplicate" as const, message: "This mobile already exists in the system.", existing_id: dup.id };
    }

    const { data: inserted, error } = await supabase.from("partner_leads").insert({
      lead_model: "own_leads",
      lead_ownership_type: "glintr_provided",
      owner_partner_id: null,
      full_name: data.full_name,
      mobile: data.mobile,
      email: data.email || null,
      course_id: data.course_id || null,
      program_interest: data.program_interest || null,
      source: (data.source ?? "other") as any,
      campaign_source: data.campaign_source || null,
      notes: data.notes || null,
      status: "new",
      assigned_by_user_id: userId,
    }).select("id").single();
    if (error) throw new Error(error.message);

    await supabase.from("lead_assignment_history").insert({
      lead_id: inserted.id, action: "imported", method: "manual_add",
      actor_user_id: userId,
    });
    return { status: "created" as const, id: inserted.id as string };
  });

// ─────────────────────────── bulk import ───────────────────────────

const bulkRow = z.object({
  full_name: z.string().trim().max(120).optional().nullable(),
  mobile: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().max(255).optional().nullable(),
  program_interest: z.string().trim().max(200).optional().nullable(),
  source: z.string().trim().max(50).optional().nullable(),
  campaign_source: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});
const bulkInput = z.object({ leads: z.array(bulkRow).min(1).max(5000) });

export const bulkImportAdminLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => bulkInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const rows = data.leads.map((r) => ({ ...r, _norm: normalizePhone(r.mobile ?? "") }));
    const valid = rows.filter((r) => (r.full_name?.trim().length ?? 0) >= 2 && r._norm.length >= 6);
    const invalidCount = rows.length - valid.length;

    const uniq = Array.from(new Set(valid.map((r) => r._norm)));
    let existingSet = new Set<string>();
    if (uniq.length) {
      const { data: ex } = await supabase.from("partner_leads")
        .select("mobile_normalized").in("mobile_normalized", uniq);
      existingSet = new Set((ex ?? []).map((e: any) => e.mobile_normalized).filter(Boolean));
    }

    const seen = new Set<string>();
    const toInsert: any[] = [];
    let duplicates = 0;
    for (const r of valid) {
      if (existingSet.has(r._norm) || seen.has(r._norm)) { duplicates++; continue; }
      seen.add(r._norm);
      const src = (r.source ?? "").toLowerCase().replace(/[\s-]+/g, "_");
      const source = (LEAD_SOURCES as readonly string[]).includes(src) ? src : "other";
      toInsert.push({
        lead_model: "own_leads",
        lead_ownership_type: "glintr_provided",
        owner_partner_id: null,
        full_name: r.full_name!.trim(),
        mobile: r.mobile!.trim(),
        email: r.email?.trim() || null,
        program_interest: r.program_interest?.trim() || null,
        source: source as any,
        campaign_source: r.campaign_source?.trim() || null,
        notes: r.notes?.trim() || null,
        status: "new",
        assigned_by_user_id: userId,
      });
    }

    let added = 0;
    const insertedIds: string[] = [];
    for (let i = 0; i < toInsert.length; i += 500) {
      const chunk = toInsert.slice(i, i + 500);
      const { data: ins, error } = await supabase.from("partner_leads").insert(chunk).select("id");
      if (error) throw new Error(error.message);
      added += ins?.length ?? 0;
      (ins ?? []).forEach((x: any) => insertedIds.push(x.id));
    }

    if (insertedIds.length) {
      await supabase.from("lead_assignment_history").insert(
        insertedIds.map((id) => ({ lead_id: id, action: "imported", method: "bulk_import", actor_user_id: userId })),
      );
    }

    return {
      total: rows.length,
      valid: valid.length,
      invalid: invalidCount,
      duplicates,
      added,
      inserted_ids: insertedIds,
    };
  });

// ─────────────────────────── partners for assignment ───────────────────────────

const partnerSearchInput = z.object({
  search: z.string().trim().max(120).optional().nullable(),
  work_model: z.enum(["flexible","full_time","any"]).optional().default("any"),
  verified_brand_only: z.boolean().optional().default(false),
});

export const listAssignablePartners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => partnerSearchInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    let q = supabase.from("partners")
      .select("id, display_name, referral_code, work_model, work_model_status, status, account_status")
      .eq("status", "active")
      .eq("account_status", "active")
      .order("display_name", { ascending: true })
      .limit(500);

    if (data.work_model && data.work_model !== "any") q = q.eq("work_model", data.work_model);
    if (data.search) {
      const s = data.search.trim();
      q = q.or(`display_name.ilike.%${s}%,referral_code.ilike.%${s}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    let final = rows ?? [];
    if (data.verified_brand_only) {
      const ids = final.map((p: any) => p.id);
      if (ids.length) {
        const { data: bp } = await supabase.from("partner_brand_profiles")
          .select("partner_id, verification_status").in("partner_id", ids);
        const okSet = new Set((bp ?? []).filter((b: any) => b.verification_status === "verified").map((b: any) => b.partner_id));
        final = final.filter((p: any) => okSet.has(p.id));
      } else final = [];
    }
    return final;
  });

// ─────────────────────────── assignments ───────────────────────────

async function performAssign(
  supabase: any,
  userId: string,
  leadIds: string[],
  assignments: { leadId: string; partnerId: string; method: string; reason?: string | null }[],
) {
  // Fetch current owners for history
  const { data: current } = await supabase.from("partner_leads")
    .select("id, assigned_partner_id, lead_ownership_type")
    .in("id", leadIds);
  const curMap = new Map((current ?? []).map((r: any) => [r.id, r]));

  // Update each in parallel batches
  const now = new Date().toISOString();
  const historyRows: any[] = [];
  for (const a of assignments) {
    const cur: any = curMap.get(a.leadId);
    if (!cur) continue;
    if (cur.lead_ownership_type !== "glintr_provided") continue;
    const isReassign = !!cur.assigned_partner_id && cur.assigned_partner_id !== a.partnerId;
    const action = isReassign ? "reassigned" : "assigned";

    const { error } = await supabase.from("partner_leads")
      .update({
        assigned_partner_id: a.partnerId,
        assigned_at: now,
        assignment_method: isReassign ? "reassignment" : a.method,
        assigned_by_user_id: userId,
      })
      .eq("id", a.leadId);
    if (error) throw new Error(error.message);

    historyRows.push({
      lead_id: a.leadId,
      from_partner_id: cur.assigned_partner_id ?? null,
      to_partner_id: a.partnerId,
      action,
      method: isReassign ? "reassignment" : a.method,
      reason: a.reason ?? null,
      actor_user_id: userId,
    });
  }
  if (historyRows.length) {
    const { error } = await supabase.from("lead_assignment_history").insert(historyRows);
    if (error) throw new Error(error.message);
  }
  return historyRows.length;
}

const manualAssignInput = z.object({
  lead_ids: z.array(z.string().uuid()).min(1).max(2000),
  partner_id: z.string().uuid(),
});
export const assignLeadsManual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => manualAssignInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const method = data.lead_ids.length > 1 ? "bulk_manual" : "manual";
    const assignments = data.lead_ids.map((id) => ({ leadId: id, partnerId: data.partner_id, method }));
    const count = await performAssign(supabase, userId, data.lead_ids, assignments);
    return { assigned: count };
  });

const equalDistInput = z.object({
  lead_ids: z.array(z.string().uuid()).min(1).max(2000),
  partner_ids: z.array(z.string().uuid()).min(1).max(200),
});
export const assignLeadsEqualDistribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => equalDistInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    // Chunk leads roughly evenly by shuffled interleave
    const assignments = data.lead_ids.map((id, i) => ({
      leadId: id,
      partnerId: data.partner_ids[i % data.partner_ids.length],
      method: "equal_distribution",
    }));
    const count = await performAssign(supabase, userId, data.lead_ids, assignments);
    return { assigned: count };
  });

const roundRobinInput = z.object({
  lead_ids: z.array(z.string().uuid()).min(1).max(2000),
});
export const assignLeadsRoundRobin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => roundRobinInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: settings, error: sErr } = await supabase.from("round_robin_settings").select("*").eq("id", 1).maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!settings || !settings.is_active) throw new Error("Round-robin is not active.");

    let partnerIds: string[] = settings.selected_partner_ids ?? [];
    if (!partnerIds.length) {
      // fallback to eligible work-model based active partners
      const { data: ps } = await supabase.from("partners")
        .select("id, work_model")
        .eq("status","active").eq("account_status","active")
        .in("work_model", settings.eligible_work_models ?? ["flexible","full_time"])
        .order("id", { ascending: true });
      partnerIds = (ps ?? []).map((p: any) => p.id);
    }
    if (!partnerIds.length) throw new Error("No eligible partners configured for round-robin.");

    // Start from position after last_partner_id
    let start = 0;
    if (settings.last_partner_id) {
      const idx = partnerIds.indexOf(settings.last_partner_id);
      if (idx >= 0) start = (idx + 1) % partnerIds.length;
    }
    const assignments = data.lead_ids.map((leadId, i) => ({
      leadId,
      partnerId: partnerIds[(start + i) % partnerIds.length],
      method: "round_robin",
    }));

    const count = await performAssign(supabase, userId, data.lead_ids, assignments);

    const lastIdx = (start + data.lead_ids.length - 1) % partnerIds.length;
    await supabase.from("round_robin_settings").update({ last_partner_id: partnerIds[lastIdx], updated_at: new Date().toISOString() }).eq("id", 1);

    return { assigned: count, cursor_partner_id: partnerIds[lastIdx] };
  });

const reassignInput = z.object({
  lead_id: z.string().uuid(),
  new_partner_id: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
});
export const reassignLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reassignInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    await performAssign(supabase, userId, [data.lead_id], [{
      leadId: data.lead_id, partnerId: data.new_partner_id, method: "reassignment", reason: data.reason,
    }]);
    return { ok: true };
  });

const unassignInput = z.object({
  lead_id: z.string().uuid(),
  reason: z.string().trim().max(500).optional().nullable(),
});
export const unassignLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => unassignInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: cur } = await supabase.from("partner_leads")
      .select("assigned_partner_id, lead_ownership_type").eq("id", data.lead_id).maybeSingle();
    if (!cur) throw new Error("Lead not found.");
    if (cur.lead_ownership_type !== "glintr_provided") throw new Error("Not a Glintr-provided lead.");

    const { error } = await supabase.from("partner_leads").update({
      assigned_partner_id: null, assigned_at: null, assignment_method: null,
    }).eq("id", data.lead_id);
    if (error) throw new Error(error.message);

    await supabase.from("lead_assignment_history").insert({
      lead_id: data.lead_id,
      from_partner_id: cur.assigned_partner_id,
      to_partner_id: null,
      action: "unassigned",
      reason: data.reason ?? null,
      actor_user_id: userId,
    });
    return { ok: true };
  });

// ─────────────────────────── history ───────────────────────────

export const getLeadAssignmentHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lead_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: rows, error } = await supabase
      .from("lead_assignment_history")
      .select(`
        id, action, method, reason, created_at,
        from_partner:from_partner_id ( id, display_name, referral_code ),
        to_partner:to_partner_id ( id, display_name, referral_code ),
        actor_user_id
      `)
      .eq("lead_id", data.lead_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ─────────────────────────── round-robin settings ───────────────────────────

export const getRoundRobinSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase.from("round_robin_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const rrSaveInput = z.object({
  is_active: z.boolean(),
  eligible_work_models: z.array(z.enum(["flexible","full_time"])).min(1),
  require_verified_brand: z.boolean(),
  selected_partner_ids: z.array(z.string().uuid()).max(500),
});
export const saveRoundRobinSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => rrSaveInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("round_robin_settings").update({
      is_active: data.is_active,
      eligible_work_models: data.eligible_work_models,
      require_verified_brand: data.require_verified_brand,
      selected_partner_ids: data.selected_partner_ids,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────── analytics ───────────────────────────

export const getAllocationAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: leads, error } = await supabase.from("partner_leads")
      .select("id, assigned_partner_id, assignment_method, status, assigned:assigned_partner_id ( display_name, referral_code )")
      .eq("lead_ownership_type", "glintr_provided");
    if (error) throw new Error(error.message);

    const rows = leads ?? [];
    const totalGlintr = rows.length;
    const unassigned = rows.filter((r: any) => !r.assigned_partner_id).length;
    const assigned = totalGlintr - unassigned;
    const converted = rows.filter((r: any) => r.status === "enrolled").length;

    // Per-partner counts
    const perPartner = new Map<string, { name: string; ref: string; total: number; converted: number }>();
    for (const r of rows as any[]) {
      if (!r.assigned_partner_id) continue;
      const key = r.assigned_partner_id;
      const rec = perPartner.get(key) ?? { name: r.assigned?.display_name ?? "—", ref: r.assigned?.referral_code ?? "—", total: 0, converted: 0 };
      rec.total += 1;
      if (r.status === "enrolled") rec.converted += 1;
      perPartner.set(key, rec);
    }
    const perPartnerArr = Array.from(perPartner.entries()).map(([id, v]) => ({ id, ...v })).sort((a,b) => b.total - a.total);
    const avgPerActive = perPartnerArr.length ? assigned / perPartnerArr.length : 0;

    // Method distribution
    const methods: Record<string, number> = {};
    for (const r of rows as any[]) {
      const m = r.assignment_method ?? "unassigned";
      methods[m] = (methods[m] ?? 0) + 1;
    }

    return {
      total: totalGlintr,
      unassigned, assigned, converted,
      conversion_rate: totalGlintr ? converted / totalGlintr : 0,
      avg_leads_per_active_partner: avgPerActive,
      per_partner: perPartnerArr.slice(0, 20),
      method_distribution: methods,
    };
  });

// programs list re-exported convenience (admin)
export const listPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.from("courses")
      .select("id, name, slug")
      .eq("status","published").eq("is_published", true)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
