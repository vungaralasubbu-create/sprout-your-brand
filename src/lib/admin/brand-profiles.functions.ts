import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Backend for the Admin Brand Management page.
 *
 * Source of truth: `brand_applications` (this is what the Launch-Your-Brand
 * wizard writes to, and what the admin dashboard counter reads). The
 * previous implementation queried an empty `partner_brand_profiles`
 * table, which is why Brand Management appeared blank while the counter
 * showed submissions.
 *
 * The UI expects rows shaped like the old profile row. This module maps
 * brand_applications columns into that shape and translates the wider
 * `brand_application_status` enum onto the smaller UI vocabulary
 * (pending_review / verified / needs_information / rejected / suspended /
 * draft). On approval it also materialises a `partner_brand_profiles`
 * record so downstream publishing / lead attribution keeps working.
 */

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Admin only.");
}

// db status -> UI bucket
function toUiStatus(db: string | null | undefined): string {
  switch (db) {
    case "submitted":
    case "under_review":
      return "pending_review";
    case "information_required":
      return "needs_information";
    case "rejected":
      return "rejected";
    case "suspended":
    case "on_hold":
      return "suspended";
    case "draft":
      return "draft";
    case "approved":
    case "configuration_started":
    case "brand_design":
    case "website_setup":
    case "lms_setup":
    case "program_configuration":
    case "quality_review":
    case "launch_ready":
    case "launched":
      return "verified";
    default:
      return db ?? "pending_review";
  }
}

const UI_TO_DB: Record<string, string[]> = {
  pending_review: ["submitted", "under_review"],
  verified: [
    "approved",
    "configuration_started",
    "brand_design",
    "website_setup",
    "lms_setup",
    "program_configuration",
    "quality_review",
    "launch_ready",
    "launched",
  ],
  needs_information: ["information_required"],
  rejected: ["rejected"],
  suspended: ["suspended", "on_hold"],
  draft: ["draft"],
};

function pickFirstSocial(social: any): string | null {
  if (!social) return null;
  if (typeof social === "string") return social || null;
  if (Array.isArray(social)) {
    const first = social.find((v) => typeof v === "string" && v);
    return first ?? null;
  }
  if (typeof social === "object") {
    const first = Object.values(social).find((v) => typeof v === "string" && v);
    return (first as string) ?? null;
  }
  return null;
}

function mapRow(app: any) {
  return {
    id: app.id,
    partner_id: app.user_id, // no partner_id on the row; carry user_id for lookup
    user_id: app.user_id,
    brand_type: app.brand_type ?? "own",
    selling_model: app.setup_type ?? null,
    brand_name: app.preferred_brand_name ?? "(Untitled brand)",
    company_name: app.business_type ?? null,
    website:
      app.has_domain === "yes" && app.domain_name
        ? app.domain_name
        : null,
    social_link: pickFirstSocial(app.social_profiles),
    business_email: app.business_email ?? null,
    business_phone: app.business_mobile ?? null,
    brand_description: app.brand_vision ?? null,
    logo_bucket: null,
    logo_path: app.logo_url ?? null, // signals "has a logo"
    logo_url: app.logo_url ?? null,
    relationship_to_brand: null,
    authorized_contact_name: null,
    authorized_contact_email: null,
    notes: app.admin_notes ?? null,
    status: toUiStatus(app.status),
    _db_status: app.status,
    admin_message:
      app.status === "information_required" ? app.admin_notes ?? null : null,
    rejection_reason: app.status === "rejected" ? app.admin_notes ?? null : null,
    submitted_at: app.submitted_at ?? app.created_at,
    reviewed_at: app.reviewed_at,
    created_at: app.created_at,
    updated_at: app.updated_at,
    tagline: app.tagline ?? null,
    has_domain: app.has_domain ?? null,
    domain_name: app.domain_name ?? null,
    social_profiles: app.social_profiles ?? null,
    target_audience: app.target_audience ?? null,
    brand_personality: app.brand_personality ?? null,
    country: app.country ?? null,
    state: app.state ?? null,
    city: app.city ?? null,
  };
}

export const adminListBrandProfiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z
          .enum([
            "all",
            "pending_review",
            "verified",
            "needs_information",
            "rejected",
            "suspended",
            "draft",
          ])
          .default("all"),
        search: z.string().trim().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    let query = supabase
      .from("brand_applications")
      .select("*")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(500);

    if (data.status === "all") {
      // exclude drafts on the default view (matches dashboard counter intent)
      query = query.neq("status", "draft");
    } else {
      const dbStatuses = (UI_TO_DB[data.status] ?? []) as any[];
      if (dbStatuses.length === 1) query = query.eq("status", dbStatuses[0]);
      else if (dbStatuses.length > 1) query = query.in("status", dbStatuses as any);
    }

    const s = data.search?.trim();
    if (s) {
      query = query.or(
        `preferred_brand_name.ilike.%${s}%,business_type.ilike.%${s}%,domain_name.ilike.%${s}%`,
      );
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    const userIds = Array.from(
      new Set((rows ?? []).map((r: any) => r.user_id).filter(Boolean)),
    );
    const { data: partners } = userIds.length
      ? await supabase
          .from("partners")
          .select("id, user_id, display_name, partner_code, email, mobile")
          .in("user_id", userIds)
      : { data: [] as any[] };
    const pmap = new Map(
      (partners ?? []).map((p: any) => [p.user_id, p]),
    );

    let mapped = (rows ?? []).map(mapRow);

    // Broaden the search to partner name / code, which we can only match
    // after joining, mirroring the previous helper's semantics.
    if (s) {
      const needle = s.toLowerCase();
      mapped = mapped.filter((r: any) => {
        const p = pmap.get(r.user_id);
        return (
          (r.brand_name ?? "").toLowerCase().includes(needle) ||
          (r.company_name ?? "").toLowerCase().includes(needle) ||
          (r.domain_name ?? "").toLowerCase().includes(needle) ||
          (p?.display_name ?? "").toLowerCase().includes(needle) ||
          (p?.partner_code ?? "").toLowerCase().includes(needle) ||
          (p?.email ?? "").toLowerCase().includes(needle)
        );
      });
    }

    return mapped.map((r: any) => {
      const p = pmap.get(r.user_id);
      return {
        ...r,
        partner: p
          ? {
              id: p.id,
              display_name: p.display_name ?? p.email ?? null,
              partner_code: p.partner_code ?? null,
              email: p.email ?? null,
              mobile: p.mobile ?? null,
            }
          : {
              id: r.user_id,
              display_name: null,
              partner_code: null,
              email: null,
              mobile: null,
            },
      };
    });
  });

export const adminGetBrandProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: app, error } = await supabase
      .from("brand_applications")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!app) throw new Error("Not found.");

    const profile = mapRow(app);

    const { data: partnerRow } = await supabase
      .from("partners")
      .select(
        "id, user_id, display_name, partner_code, email, mobile, brand_selling_model",
      )
      .eq("user_id", app.user_id)
      .maybeSingle();

    const partner = partnerRow
      ? {
          id: partnerRow.id,
          display_name: partnerRow.display_name ?? partnerRow.email ?? null,
          partner_code: partnerRow.partner_code ?? null,
          email: partnerRow.email ?? null,
          mobile: partnerRow.mobile ?? null,
          brand_selling_model: partnerRow.brand_selling_model ?? null,
        }
      : {
          id: app.user_id,
          display_name: null,
          partner_code: null,
          email: null,
          mobile: null,
          brand_selling_model: null,
        };

    // History: best-effort from admin_activity_log tagged with this app id.
    const { data: logs } = await supabase
      .from("admin_activity_log")
      .select("id, event_type, title, summary, actor_role, created_at, entity_id")
      .eq("entity_type", "brand_application")
      .eq("entity_id", data.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const history = (logs ?? []).map((l: any) => ({
      id: l.id,
      action: l.event_type ?? "updated",
      actor_role: l.actor_role ?? "admin",
      message: l.summary ?? l.title ?? null,
      created_at: l.created_at,
    }));

    return { profile, partner, history };
  });

export const adminActOnBrandProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["verify", "request_info", "reject", "suspend"]),
        message: z.string().trim().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    if ((data.action === "request_info" || data.action === "reject") && !data.message) {
      throw new Error("A message/reason is required for this action.");
    }

    const { data: existing, error: exErr } = await supabase
      .from("brand_applications")
      .select("id, user_id, status, preferred_brand_name, business_type, business_email, business_mobile, brand_vision, logo_url, has_domain, domain_name, social_profiles, admin_notes")
      .eq("id", data.id)
      .maybeSingle();
    if (exErr) throw exErr;
    if (!existing) throw new Error("Not found.");

    const nextDbStatus =
      data.action === "verify"
        ? "approved"
        : data.action === "request_info"
        ? "information_required"
        : data.action === "reject"
        ? "rejected"
        : "suspended";

    const patch: any = {
      status: nextDbStatus,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    };
    if (data.message) patch.admin_notes = data.message;
    if (data.action === "verify") patch.admin_notes = null;

    const { error: upErr } = await supabase
      .from("brand_applications")
      .update(patch)
      .eq("id", data.id);
    if (upErr) throw upErr;

    // On approval, materialise a partner_brand_profiles record so the
    // Partner Brand becomes available for publishing / lead attribution.
    if (data.action === "verify") {
      const { data: partnerRow } = await supabase
        .from("partners")
        .select("id, user_id, brand_selling_model")
        .eq("user_id", existing.user_id)
        .maybeSingle();

      if (partnerRow) {
        const { data: dupe } = await supabase
          .from("partner_brand_profiles")
          .select("id")
          .eq("partner_id", partnerRow.id)
          .eq("brand_name", existing.preferred_brand_name ?? "Brand")
          .maybeSingle();

        if (!dupe) {
          const website =
            existing.has_domain === "yes" && existing.domain_name
              ? existing.domain_name
              : null;
          const socialLink = pickFirstSocial(existing.social_profiles);
          const sellingModelRaw = partnerRow.brand_selling_model;
          const sellingModel =
            sellingModelRaw && ["glintr", "own", "partnered", "multiple"].includes(sellingModelRaw)
              ? sellingModelRaw
              : "glintr";

          await supabase.from("partner_brand_profiles").insert({
            partner_id: partnerRow.id,
            user_id: existing.user_id,
            brand_type: "own",
            selling_model: sellingModel,
            brand_name: existing.preferred_brand_name ?? "Brand",
            company_name: existing.business_type ?? null,
            website,
            social_link: socialLink,
            business_email: existing.business_email ?? null,
            business_phone: existing.business_mobile ?? null,
            brand_description: existing.brand_vision ?? null,
            status: "verified",
            reviewed_by: userId,
            reviewed_at: new Date().toISOString(),
            submitted_at: new Date().toISOString(),
          });
        }
      }
    }

    // Activity log (best-effort — table may not exist in all envs)
    try {
      await supabase.from("admin_activity_log").insert({
        event_type:
          data.action === "verify"
            ? "brand_approved"
            : data.action === "request_info"
            ? "brand_request_info"
            : data.action === "reject"
            ? "brand_rejected"
            : "brand_suspended",
        entity_type: "brand_application",
        entity_id: data.id,
        actor_user_id: userId,
        actor_role: "admin",
        title: `Brand ${existing.preferred_brand_name ?? ""} ${nextDbStatus}`,
        summary: data.message ?? null,
      });
    } catch {
      // ignore
    }

    return { ok: true, status: toUiStatus(nextDbStatus) };
  });

export const adminGetBrandLogoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: app } = await supabase
      .from("brand_applications")
      .select("logo_url")
      .eq("id", data.id)
      .maybeSingle();
    return { url: (app?.logo_url as string | null) ?? null };
  });
