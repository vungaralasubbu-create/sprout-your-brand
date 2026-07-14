import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PLANS = ["self_paced_edge", "career_launch", "career_pro"] as const;
export type PaymentPlan = (typeof PLANS)[number];

export const PLAN_LABELS: Record<PaymentPlan, string> = {
  self_paced_edge: "Self-Paced Edge",
  career_launch: "Career Launch",
  career_pro: "Career Pro",
};

async function resolvePartnerId(supabase: any, userId: string) {
  const { data } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id as string | undefined;
}

/** List active master payment links visible to this partner. */
export const listActivePaymentLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("payment_links")
      .select("id, course_id, plan, amount, url, is_active, courses:course_id(id, name, slug, status, is_published)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? [])
      .filter((r: any) => r.courses?.status === "published" && r.courses?.is_published)
      .map((r: any) => ({
        id: r.id as string,
        course_id: r.course_id as string,
        course_name: r.courses?.name as string,
        plan: r.plan as PaymentPlan,
        plan_label: PLAN_LABELS[r.plan as PaymentPlan],
        amount: Number(r.amount),
        url: r.url as string,
        is_active: !!r.is_active,
      }));
  });

/** Compact analytics for the partner's assigned links. */
export const getPaymentLinkAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) {
      return { assigned: 0, pending: 0, verified: 0, verifiedAmount: 0 };
    }
    const { data, error } = await supabase
      .from("partner_lead_payment_links")
      .select("status, amount")
      .eq("partner_id", partnerId);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    let pending = 0;
    let verified = 0;
    let verifiedAmount = 0;
    for (const r of rows as any[]) {
      if (r.status === "verified") {
        verified++;
        verifiedAmount += Number(r.amount || 0);
      } else if (r.status === "assigned" || r.status === "payment_pending") {
        pending++;
      }
    }
    return {
      assigned: rows.length,
      pending,
      verified,
      verifiedAmount,
    };
  });

/** Search partner's own/assigned leads by name or mobile. */
export const searchMyLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ q: z.string().trim().max(120).optional().default("") }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) return [];
    let query = supabase
      .from("partner_leads")
      .select("id, full_name, mobile, program_interest")
      .or(`owner_partner_id.eq.${partnerId},assigned_partner_id.eq.${partnerId}`)
      .order("created_at", { ascending: false })
      .limit(25);
    const q = data.q.trim();
    if (q) {
      const safe = q.replace(/[,()]/g, " ");
      query = query.or(`full_name.ilike.%${safe}%,mobile.ilike.%${safe}%`);
    }
    const { data: leads, error } = await query;
    if (error) throw new Error(error.message);
    return (leads ?? []).map((l: any) => ({
      id: l.id as string,
      full_name: l.full_name as string,
      mobile: l.mobile as string,
      program_interest: l.program_interest ?? null,
    }));
  });

const assignInput = z.object({
  lead_id: z.string().uuid(),
  payment_link_id: z.string().uuid(),
});

/** Assign a master payment link to one of the partner's leads. */
export const assignPaymentLinkToLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => assignInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) throw new Error("Partner profile not found.");

    // Verify lead belongs to this partner
    const { data: lead, error: leadErr } = await supabase
      .from("partner_leads")
      .select("id, full_name, owner_partner_id, assigned_partner_id")
      .eq("id", data.lead_id)
      .maybeSingle();
    if (leadErr) throw new Error(leadErr.message);
    if (!lead) throw new Error("Lead not found.");
    if (lead.owner_partner_id !== partnerId && lead.assigned_partner_id !== partnerId) {
      throw new Error("You are not authorised to assign links to this lead.");
    }

    // Load active link + course validation
    const { data: link, error: linkErr } = await supabase
      .from("payment_links")
      .select("id, course_id, plan, amount, url, is_active, courses:course_id(status, is_published, name)")
      .eq("id", data.payment_link_id)
      .maybeSingle();
    if (linkErr) throw new Error(linkErr.message);
    if (!link || !link.is_active) throw new Error("Payment link is not available.");
    if (link.courses?.status !== "published" || !link.courses?.is_published) {
      throw new Error("Program is not currently available.");
    }

    const { data: inserted, error: insErr } = await supabase
      .from("partner_lead_payment_links")
      .insert({
        partner_id: partnerId,
        lead_id: data.lead_id,
        payment_link_id: link.id,
        course_id: link.course_id,
        plan: link.plan,
        amount: link.amount,
        url: link.url,
      })
      .select("id, url, amount, plan, assigned_at")
      .single();
    if (insErr) throw new Error(insErr.message);

    // Timeline activity
    await supabase.from("partner_lead_activities").insert({
      lead_id: data.lead_id,
      partner_id: partnerId,
      activity_type: "link_shared",
      content: `${PLAN_LABELS[link.plan as PaymentPlan]} payment link assigned`,
      metadata: {
        kind: "payment_link_assigned",
        payment_link_id: link.id,
        assignment_id: inserted.id,
        course_id: link.course_id,
        course_name: link.courses?.name ?? null,
        plan: link.plan,
        plan_label: PLAN_LABELS[link.plan as PaymentPlan],
        amount: Number(link.amount),
        url: link.url,
      },
    });

    // Nudge lead last_activity_at
    await supabase
      .from("partner_leads")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", data.lead_id);

    return {
      id: inserted.id as string,
      url: inserted.url as string,
      amount: Number(inserted.amount),
      plan: inserted.plan as PaymentPlan,
      plan_label: PLAN_LABELS[inserted.plan as PaymentPlan],
      lead_name: lead.full_name as string,
      course_name: link.courses?.name as string,
    };
  });
