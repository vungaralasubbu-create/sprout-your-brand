import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const SELLING_MODELS = ["glintr", "own", "partnered", "multiple"] as const;
export type SellingModel = (typeof SELLING_MODELS)[number];
export const SELLING_MODEL_LABELS: Record<SellingModel, string> = {
  glintr: "Using Glintr Brand",
  own: "Using My Own Brand",
  partnered: "Using a Partnered Brand",
  multiple: "Using Multiple Brands",
};

export const BRAND_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  verified: "Verified",
  needs_information: "Needs Information",
  rejected: "Rejected",
  suspended: "Suspended",
};

const urlOpt = z.string().trim().max(500).optional().or(z.literal(""));
const strOpt = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const BrandCore = z.object({
  brand_type: z.enum(["own", "partnered"]),
  brand_name: z.string().trim().min(1).max(160),
  company_name: strOpt(200),
  website: urlOpt,
  social_link: urlOpt,
  business_email: strOpt(255),
  business_phone: strOpt(40),
  brand_description: strOpt(2000),
  relationship_to_brand: strOpt(200),
  authorized_contact_name: strOpt(160),
  authorized_contact_email: strOpt(255),
  notes: strOpt(2000),
  logo_bucket: strOpt(100),
  logo_path: strOpt(500),
  logo_mime: strOpt(80),
});

async function resolvePartnerId(supabase: any, userId: string) {
  const { data } = await supabase.from("partners").select("id").eq("user_id", userId).maybeSingle();
  return data?.id as string | undefined;
}

export const getPartnerBrandContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) return { partner_id: null, selling_model: null, profiles: [] as any[] };
    const { data: p } = await supabase
      .from("partners")
      .select("id, brand_selling_model")
      .eq("id", partnerId)
      .maybeSingle();
    const { data: profiles } = await supabase
      .from("partner_brand_profiles")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });
    return {
      partner_id: partnerId,
      selling_model: (p?.brand_selling_model as SellingModel | null) ?? null,
      profiles: profiles ?? [],
    };
  });

export const setSellingModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ selling_model: z.enum(SELLING_MODELS) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) throw new Error("Partner profile not found.");
    const { error } = await supabase
      .from("partners")
      .update({ brand_selling_model: data.selling_model })
      .eq("id", partnerId);
    if (error) throw error;
    return { ok: true };
  });

export const upsertBrandProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    BrandCore.extend({
      id: z.string().uuid().optional(),
      selling_model: z.enum(SELLING_MODELS),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) throw new Error("Partner profile not found.");

    const payload = {
      partner_id: partnerId,
      user_id: userId,
      brand_type: data.brand_type,
      selling_model: data.selling_model,
      brand_name: data.brand_name,
      company_name: data.company_name || null,
      website: data.website || null,
      social_link: data.social_link || null,
      business_email: data.business_email || null,
      business_phone: data.business_phone || null,
      brand_description: data.brand_description || null,
      relationship_to_brand: data.relationship_to_brand || null,
      authorized_contact_name: data.authorized_contact_name || null,
      authorized_contact_email: data.authorized_contact_email || null,
      notes: data.notes || null,
      logo_bucket: data.logo_bucket || null,
      logo_path: data.logo_path || null,
      logo_mime: data.logo_mime || null,
      status: "pending_review" as const,
      admin_message: null,
      rejection_reason: null,
      submitted_at: new Date().toISOString(),
    };

    if (data.id) {
      // Ensure ownership and editable status
      const { data: existing, error: exErr } = await supabase
        .from("partner_brand_profiles")
        .select("id, user_id, status")
        .eq("id", data.id)
        .maybeSingle();
      if (exErr) throw exErr;
      if (!existing || existing.user_id !== userId) throw new Error("Not authorized.");
      if (!["draft", "needs_information", "pending_review"].includes(existing.status)) {
        throw new Error("This brand profile is locked and cannot be edited.");
      }
      const { error } = await supabase
        .from("partner_brand_profiles")
        .update(payload)
        .eq("id", data.id);
      if (error) throw error;
      await supabase.from("partner_brand_review_actions").insert({
        profile_id: data.id,
        actor_user_id: userId,
        actor_role: "partner",
        action: existing.status === "needs_information" ? "resubmitted" : "updated",
        from_status: existing.status,
        to_status: "pending_review",
      });
      return { id: data.id };
    }

    const { data: inserted, error } = await supabase
      .from("partner_brand_profiles")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    await supabase.from("partner_brand_review_actions").insert({
      profile_id: inserted.id,
      actor_user_id: userId,
      actor_role: "partner",
      action: "submitted",
      to_status: "pending_review",
    });
    return { id: inserted.id };
  });

export const getBrandLogoSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ profile_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p } = await supabase
      .from("partner_brand_profiles")
      .select("user_id, logo_bucket, logo_path")
      .eq("id", data.profile_id)
      .maybeSingle();
    if (!p) throw new Error("Not found");
    // Admin OR owner
    const { data: adminOk } = await supabase.rpc("is_admin", { _user_id: userId });
    if (!adminOk && p.user_id !== userId) throw new Error("Not authorized.");
    if (!p.logo_bucket || !p.logo_path) return { url: null as string | null };
    const { data: sig, error } = await supabase.storage
      .from(p.logo_bucket)
      .createSignedUrl(p.logo_path, 60 * 30);
    if (error) throw error;
    return { url: sig?.signedUrl ?? null };
  });

/** Verified brands the partner may use when tagging a lead/payment. */
export const listSellingBrands = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) return { selling_model: null as SellingModel | null, brands: [] as any[] };
    const { data: p } = await supabase
      .from("partners")
      .select("brand_selling_model")
      .eq("id", partnerId)
      .maybeSingle();
    const { data: brands } = await supabase
      .from("partner_brand_profiles")
      .select("id, brand_name, brand_type, status")
      .eq("partner_id", partnerId)
      .eq("status", "verified")
      .order("brand_name");
    return {
      selling_model: (p?.brand_selling_model as SellingModel | null) ?? null,
      brands: brands ?? [],
    };
  });
