import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Admin only.");
}

export const adminListBrandProfiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z
          .enum(["all", "pending_review", "verified", "needs_information", "rejected", "suspended", "draft"])
          .default("all"),
        search: z.string().trim().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    let query = supabase
      .from("partner_brand_profiles")
      .select(
        "id, partner_id, user_id, brand_type, selling_model, brand_name, company_name, website, social_link, business_email, business_phone, brand_description, relationship_to_brand, authorized_contact_name, authorized_contact_email, notes, logo_bucket, logo_path, status, admin_message, rejection_reason, submitted_at, reviewed_at, created_at, updated_at",
      )
      .order("submitted_at", { ascending: false })
      .limit(500);

    if (data.status !== "all") query = query.eq("status", data.status);
    const s = data.search?.trim();
    if (s) {
      query = query.or(
        `brand_name.ilike.%${s}%,company_name.ilike.%${s}%`,
      );
    }
    const { data: rows, error } = await query;
    if (error) throw error;

    const partnerIds = Array.from(new Set((rows ?? []).map((r: any) => r.partner_id)));
    const { data: partners } = partnerIds.length
      ? await supabase
          .from("partners")
          .select("id, display_name, partner_code, email, mobile")
          .in("id", partnerIds)
      : { data: [] as any[] };
    const pmap = new Map((partners ?? []).map((p: any) => [p.id, p]));

    // Post-filter by partner name / code if search doesn't match brand fields
    let filtered = rows ?? [];
    if (s) {
      const needle = s.toLowerCase();
      filtered = filtered.filter((r: any) => {
        const p = pmap.get(r.partner_id);
        return (
          (r.brand_name ?? "").toLowerCase().includes(needle) ||
          (r.company_name ?? "").toLowerCase().includes(needle) ||
          (p?.display_name ?? "").toLowerCase().includes(needle) ||
          (p?.partner_code ?? "").toLowerCase().includes(needle)
        );
      });
    }

    return filtered.map((r: any) => ({
      ...r,
      partner: pmap.get(r.partner_id) ?? null,
    }));
  });

export const adminGetBrandProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: profile, error } = await supabase
      .from("partner_brand_profiles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!profile) throw new Error("Not found.");
    const { data: partner } = await supabase
      .from("partners")
      .select("id, display_name, partner_code, email, mobile, brand_selling_model")
      .eq("id", profile.partner_id)
      .maybeSingle();
    const { data: history } = await supabase
      .from("partner_brand_review_actions")
      .select("*")
      .eq("profile_id", data.id)
      .order("created_at", { ascending: false });
    return { profile, partner, history: history ?? [] };
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

    const { data: existing } = await supabase
      .from("partner_brand_profiles")
      .select("id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!existing) throw new Error("Not found.");

    const nextStatus =
      data.action === "verify"
        ? "verified"
        : data.action === "request_info"
        ? "needs_information"
        : data.action === "reject"
        ? "rejected"
        : "suspended";

    const patch: any = {
      status: nextStatus,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    };
    if (data.action === "request_info") patch.admin_message = data.message ?? null;
    if (data.action === "reject") patch.rejection_reason = data.message ?? null;
    if (data.action === "verify") {
      patch.admin_message = null;
      patch.rejection_reason = null;
    }

    const { error } = await supabase.from("partner_brand_profiles").update(patch).eq("id", data.id);
    if (error) throw error;

    await supabase.from("partner_brand_review_actions").insert({
      profile_id: data.id,
      actor_user_id: userId,
      actor_role: "admin",
      action:
        data.action === "verify"
          ? "verified"
          : data.action === "request_info"
          ? "request_info"
          : data.action === "reject"
          ? "rejected"
          : "suspended",
      from_status: existing.status,
      to_status: nextStatus,
      message: data.message ?? null,
    });

    return { ok: true, status: nextStatus };
  });

export const adminGetBrandLogoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: p } = await supabase
      .from("partner_brand_profiles")
      .select("logo_bucket, logo_path")
      .eq("id", data.id)
      .maybeSingle();
    if (!p?.logo_bucket || !p?.logo_path) return { url: null as string | null };
    const { data: sig, error } = await supabase.storage
      .from(p.logo_bucket)
      .createSignedUrl(p.logo_path, 60 * 30);
    if (error) throw error;
    return { url: sig?.signedUrl ?? null };
  });
