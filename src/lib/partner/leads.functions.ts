import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LEAD_SOURCES = [
  "personal_network",
  "referral",
  "social_media",
  "whatsapp",
  "instagram",
  "linkedin",
  "website",
  "event",
  "college_network",
  "other",
] as const;

const leadInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  mobile: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  program_interest: z.string().trim().max(200).optional().nullable().or(z.literal("")),
  course_id: z.string().uuid().optional().nullable(),
  source: z.enum(LEAD_SOURCES).optional().default("other"),
  notes: z.string().trim().max(2000).optional().nullable().or(z.literal("")),
});

function normalizePhone(v: string) {
  return (v ?? "").replace(/\D/g, "");
}

/** List partner (auth user) partner_id */
async function resolvePartnerId(supabase: any, userId: string) {
  const { data } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id as string | undefined;
}

/** Published programs for the "Interested Program" dropdown. */
export const listPartnerPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("courses")
      .select("id, name, slug, category_id, course_categories:category_id(name)")
      .eq("status", "published")
      .eq("is_published", true)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((c: any) => ({
      id: c.id as string,
      name: c.name as string,
      slug: c.slug as string,
      category: c.course_categories?.name ?? null,
    }));
  });

/** Add a single manual lead with duplicate detection by mobile. */
export const addManualLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => leadInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) throw new Error("Partner profile not found.");

    const mobileNorm = normalizePhone(data.mobile);
    if (mobileNorm.length < 6) {
      return { status: "invalid" as const, message: "Invalid mobile number." };
    }

    // Duplicate check: any existing lead with same normalized mobile.
    const { data: existing } = await supabase
      .from("partner_leads")
      .select("id")
      .eq("mobile_normalized", mobileNorm)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Do NOT create a duplicate active lead. File an ownership review request.
      // The submitting partner never sees any private details of the existing lead.
      const { data: review, error: revErr } = await supabase
        .from("lead_ownership_reviews")
        .insert({
          claiming_partner_id: partnerId,
          submitted_full_name: data.full_name,
          submitted_mobile: data.mobile,
          submitted_mobile_normalized: mobileNorm,
          submitted_email: data.email || null,
          submitted_program_interest: data.program_interest || null,
          submitted_course_id: data.course_id || null,
          submitted_source: (data.source as any) ?? "other",
          submitted_notes: data.notes || null,
          existing_lead_id: existing.id,
          status: "pending_review",
        })
        .select("id")
        .single();
      if (revErr) throw new Error(revErr.message);
      return {
        status: "review_created" as const,
        review_id: review.id as string,
        message:
          "This mobile number already exists in the system. Your lead submission has been sent for review.",
      };
    }

    const insertRow = {
      owner_partner_id: partnerId,
      lead_model: "own_leads" as const,
      full_name: data.full_name,
      mobile: data.mobile,
      email: data.email || null,
      program_interest: data.program_interest || null,
      course_id: data.course_id || null,
      source: data.source ?? "other",
      notes: data.notes || null,
      status: "new" as const,
    };

    const { data: inserted, error } = await supabase
      .from("partner_leads")
      .insert(insertRow)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Seed ownership history for the new own-lead.
    await supabase.from("lead_ownership_history").insert({
      lead_id: inserted.id,
      ownership_type: "partner_own",
      owner_partner_id: partnerId,
      changed_by: userId,
      reason: "Initial submission (unique mobile).",
    }).then(() => {}, () => {});

    return { status: "created" as const, id: inserted.id as string };
  });

const bulkInput = z.object({
  leads: z.array(leadInput.partial({ source: true })).min(1).max(2000),
});

/** Bulk upload of parsed CSV/XLSX rows. Duplicates create ownership reviews. */
export const bulkUploadLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bulkInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) throw new Error("Partner profile not found.");

    const rows = data.leads.map((r) => ({
      ...r,
      _mobile_norm: normalizePhone(r.mobile ?? ""),
    }));

    const validRows = rows.filter(
      (r) => r.full_name && r._mobile_norm.length >= 6,
    );
    const invalidCount = rows.length - validRows.length;

    // Existing lead lookup keyed by normalized mobile.
    const uniqueMobiles = Array.from(new Set(validRows.map((r) => r._mobile_norm)));
    const existingMap = new Map<string, string>();
    if (uniqueMobiles.length) {
      const { data: existing } = await supabase
        .from("partner_leads")
        .select("id, mobile_normalized")
        .in("mobile_normalized", uniqueMobiles);
      for (const e of existing ?? []) {
        if ((e as any).mobile_normalized) existingMap.set((e as any).mobile_normalized, (e as any).id);
      }
    }

    const seenInFile = new Set<string>();
    const toInsert: any[] = [];
    const toReview: any[] = [];
    for (const r of validRows) {
      if (seenInFile.has(r._mobile_norm)) continue;
      seenInFile.add(r._mobile_norm);
      const existingId = existingMap.get(r._mobile_norm);
      if (existingId) {
        toReview.push({
          claiming_partner_id: partnerId,
          submitted_full_name: r.full_name,
          submitted_mobile: r.mobile,
          submitted_mobile_normalized: r._mobile_norm,
          submitted_email: r.email || null,
          submitted_program_interest: r.program_interest || null,
          submitted_source: (r.source as any) ?? "other",
          submitted_notes: r.notes || null,
          existing_lead_id: existingId,
          status: "pending_review",
        });
      } else {
        toInsert.push({
          owner_partner_id: partnerId,
          lead_model: "own_leads",
          full_name: r.full_name,
          mobile: r.mobile,
          email: r.email || null,
          program_interest: r.program_interest || null,
          source: (r.source as any) ?? "other",
          notes: r.notes || null,
          status: "new",
        });
      }
    }

    let added = 0;
    const insertedIds: string[] = [];
    for (let i = 0; i < toInsert.length; i += 500) {
      const chunk = toInsert.slice(i, i + 500);
      const { data: ins, error } = await supabase
        .from("partner_leads")
        .insert(chunk)
        .select("id");
      if (error) throw new Error(error.message);
      added += ins?.length ?? 0;
      for (const row of ins ?? []) insertedIds.push((row as any).id);
    }

    // Seed ownership history for freshly created own-leads.
    if (insertedIds.length) {
      const historyRows = insertedIds.map((lead_id) => ({
        lead_id,
        ownership_type: "partner_own" as const,
        owner_partner_id: partnerId,
        changed_by: userId,
        reason: "Bulk upload (unique mobile).",
      }));
      await supabase.from("lead_ownership_history").insert(historyRows).then(() => {}, () => {});
    }

    let reviews = 0;
    for (let i = 0; i < toReview.length; i += 500) {
      const chunk = toReview.slice(i, i + 500);
      const { error, count } = await supabase
        .from("lead_ownership_reviews")
        .insert(chunk, { count: "exact" });
      if (error) throw new Error(error.message);
      reviews += count ?? chunk.length;
    }

    return {
      total: rows.length,
      valid: validRows.length,
      duplicates: toReview.length,
      reviews_created: reviews,
      invalid: invalidCount,
      added,
    };
  });

