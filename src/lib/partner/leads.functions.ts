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
      return {
        status: "duplicate" as const,
        message:
          "This mobile number already exists in the system and requires review.",
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

    return { status: "created" as const, id: inserted.id as string };
  });

const bulkInput = z.object({
  leads: z.array(leadInput.partial({ source: true })).min(1).max(2000),
});

/** Bulk upload of parsed CSV/XLSX rows. Dedup by mobile_normalized. */
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

    // Collect unique mobiles to check duplicates in a single query.
    const uniqueMobiles = Array.from(new Set(validRows.map((r) => r._mobile_norm)));
    let existingSet = new Set<string>();
    if (uniqueMobiles.length) {
      const { data: existing } = await supabase
        .from("partner_leads")
        .select("mobile_normalized")
        .in("mobile_normalized", uniqueMobiles);
      existingSet = new Set(
        (existing ?? []).map((e: any) => e.mobile_normalized).filter(Boolean),
      );
    }

    // Also dedup within-file (first occurrence wins).
    const seenInFile = new Set<string>();
    const toInsert: any[] = [];
    let duplicates = 0;
    for (const r of validRows) {
      if (existingSet.has(r._mobile_norm) || seenInFile.has(r._mobile_norm)) {
        duplicates++;
        continue;
      }
      seenInFile.add(r._mobile_norm);
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

    let added = 0;
    if (toInsert.length) {
      // Insert in chunks of 500 to stay under payload limits.
      for (let i = 0; i < toInsert.length; i += 500) {
        const chunk = toInsert.slice(i, i + 500);
        const { error, count } = await supabase
          .from("partner_leads")
          .insert(chunk, { count: "exact" });
        if (error) throw new Error(error.message);
        added += count ?? chunk.length;
      }
    }

    return {
      total: rows.length,
      valid: validRows.length,
      duplicates,
      invalid: invalidCount,
      added,
    };
  });
