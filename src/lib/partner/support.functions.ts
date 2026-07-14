import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function getPartnerId(ctx: any): Promise<string> {
  const { data, error } = await ctx.supabase
    .from("partners")
    .select("id")
    .eq("user_id", ctx.userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Partner profile not found.");
  return data.id as string;
}

const createSchema = z.object({
  category: z.string().min(1),
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(5).max(4000),
  priority: z.enum(["medium", "high", "urgent"]).default("medium"),
  related_lead_id: z.string().uuid().nullable().optional(),
  related_payment_submission_id: z.string().uuid().nullable().optional(),
  related_payout_id: z.string().uuid().nullable().optional(),
  related_referral_id: z.string().uuid().nullable().optional(),
  related_brand_profile_id: z.string().uuid().nullable().optional(),
  related_program_id: z.string().uuid().nullable().optional(),
  related_payment_link_id: z.string().uuid().nullable().optional(),
  attachment_url: z.string().nullable().optional(),
});

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ context, data }) => {
    const partnerId = await getPartnerId(context);
    const s = context.supabase as any;

    // Verify authorized ownership of any related records
    const checks: Array<Promise<any>> = [];
    if (data.related_lead_id) {
      checks.push(
        s.from("partner_leads").select("id")
          .eq("id", data.related_lead_id)
          .or(`owner_partner_id.eq.${partnerId},assigned_partner_id.eq.${partnerId}`)
          .maybeSingle().then((r: any) => ({ k: "lead", r })),
      );
    }
    if (data.related_payment_submission_id) {
      checks.push(
        s.from("partner_payment_submissions").select("id")
          .eq("id", data.related_payment_submission_id).eq("partner_id", partnerId)
          .maybeSingle().then((r: any) => ({ k: "payment", r })),
      );
    }
    if (data.related_payout_id) {
      checks.push(
        s.from("payouts").select("id").eq("id", data.related_payout_id).eq("partner_id", partnerId)
          .maybeSingle().then((r: any) => ({ k: "payout", r })),
      );
    }
    if (data.related_referral_id) {
      checks.push(
        s.from("partner_referrals").select("id").eq("id", data.related_referral_id)
          .or(`referrer_partner_id.eq.${partnerId},referred_partner_id.eq.${partnerId}`)
          .maybeSingle().then((r: any) => ({ k: "referral", r })),
      );
    }
    if (data.related_brand_profile_id) {
      checks.push(
        s.from("partner_brand_profiles").select("id")
          .eq("id", data.related_brand_profile_id).eq("partner_id", partnerId)
          .maybeSingle().then((r: any) => ({ k: "brand", r })),
      );
    }
    if (data.related_payment_link_id) {
      checks.push(
        s.from("payment_links").select("id").eq("id", data.related_payment_link_id).eq("is_active", true)
          .maybeSingle().then((r: any) => ({ k: "link", r })),
      );
    }
    const results = await Promise.all(checks);
    for (const res of results) {
      if (res.r.error) throw res.r.error;
      if (!res.r.data) throw new Error(`Related ${res.k} not accessible.`);
    }

    const insert = {
      partner_id: partnerId,
      category: data.category,
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      status: "open",
      related_lead_id: data.related_lead_id ?? null,
      related_payment_submission_id: data.related_payment_submission_id ?? null,
      related_payout_id: data.related_payout_id ?? null,
      related_referral_id: data.related_referral_id ?? null,
      related_brand_profile_id: data.related_brand_profile_id ?? null,
      related_program_id: data.related_program_id ?? null,
      related_payment_link_id: data.related_payment_link_id ?? null,
      attachment_url: data.attachment_url ?? null,
      last_activity_at: new Date().toISOString(),
    };

    const { data: ticket, error } = await s
      .from("partner_support_tickets")
      .insert(insert)
      .select("id, ticket_code")
      .single();
    if (error) throw error;

    await s.from("partner_support_activity").insert({
      ticket_id: ticket.id,
      action: "ticket_created",
      actor_user_id: context.userId,
      actor_role: "partner",
    });

    return { id: ticket.id, ticket_code: ticket.ticket_code };
  });

export const listMySupportTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      status: z.string().optional(),
      search: z.string().optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    const partnerId = await getPartnerId(context);
    const s = context.supabase as any;

    let q = s
      .from("partner_support_tickets")
      .select("id, ticket_code, category, subject, priority, status, created_at, updated_at, last_activity_at")
      .eq("partner_id", partnerId)
      .order("last_activity_at", { ascending: false });

    if (data.status && data.status !== "all") {
      if (data.status === "waiting_me") q = q.eq("status", "waiting_partner");
      else q = q.eq("status", data.status);
    }
    if (data.search) {
      q = q.or(`ticket_code.ilike.%${data.search}%,subject.ilike.%${data.search}%`);
    }

    const { data: rows, error } = await q;
    if (error) throw error;

    // Summary counts
    const { data: allRows } = await s
      .from("partner_support_tickets")
      .select("status")
      .eq("partner_id", partnerId);
    const counts: Record<string, number> = {};
    for (const r of allRows ?? []) counts[(r as any).status] = (counts[(r as any).status] ?? 0) + 1;

    return {
      tickets: rows ?? [],
      summary: {
        open: (counts.open ?? 0) + (counts.under_review ?? 0),
        waitingForResponse: counts.open ?? 0,
        adminReplied: counts.admin_replied ?? 0,
        waitingForMe: counts.waiting_partner ?? 0,
        resolved: (counts.resolved ?? 0) + (counts.closed ?? 0),
        needsAttention: (counts.admin_replied ?? 0) + (counts.waiting_partner ?? 0),
      },
    };
  });

export const getMySupportTicket = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const partnerId = await getPartnerId(context);
    const s = context.supabase as any;

    const { data: ticket, error } = await s
      .from("partner_support_tickets")
      .select("*")
      .eq("id", data.id)
      .eq("partner_id", partnerId)
      .maybeSingle();
    if (error) throw error;
    if (!ticket) throw new Error("Ticket not found.");

    // Public messages only — internal notes are hidden by RLS but be explicit
    const { data: messages } = await s
      .from("partner_support_messages")
      .select("id, is_admin, is_internal, body, attachment_url, created_at, author_user_id")
      .eq("ticket_id", data.id)
      .eq("is_internal", false)
      .order("created_at", { ascending: true });

    // Related records (only ones we're allowed to see)
    const related: Record<string, any> = {};
    if (ticket.related_lead_id) {
      const { data: l } = await s.from("partner_leads")
        .select("id, full_name, mobile, program_interest").eq("id", ticket.related_lead_id).maybeSingle();
      related.lead = l;
    }
    if (ticket.related_payment_submission_id) {
      const { data: p } = await s.from("partner_payment_submissions")
        .select("id, amount, plan, utr, status").eq("id", ticket.related_payment_submission_id).maybeSingle();
      related.payment = p;
    }
    if (ticket.related_payout_id) {
      const { data: p } = await s.from("payouts")
        .select("id, amount, approved_amount, status, scheduled_for").eq("id", ticket.related_payout_id).maybeSingle();
      related.payout = p;
    }
    if (ticket.related_referral_id) {
      const { data: r } = await s.from("partner_referrals")
        .select("id, status, bonus_amount").eq("id", ticket.related_referral_id).maybeSingle();
      related.referral = r;
    }
    if (ticket.related_brand_profile_id) {
      const { data: b } = await s.from("partner_brand_profiles")
        .select("id, brand_name, status").eq("id", ticket.related_brand_profile_id).maybeSingle();
      related.brand = b;
    }
    if (ticket.related_program_id) {
      const { data: c } = await s.from("courses")
        .select("id, name, slug").eq("id", ticket.related_program_id).maybeSingle();
      related.program = c;
    }
    if (ticket.related_payment_link_id) {
      const { data: l } = await s.from("payment_links")
        .select("id, code, name").eq("id", ticket.related_payment_link_id).maybeSingle();
      related.paymentLink = l;
    }

    return { ticket, messages: messages ?? [], related };
  });

const replySchema = z.object({
  ticket_id: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
  attachment_url: z.string().nullable().optional(),
});

export const replyMySupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => replySchema.parse(d))
  .handler(async ({ context, data }) => {
    const partnerId = await getPartnerId(context);
    const s = context.supabase as any;

    const { data: ticket, error: tErr } = await s
      .from("partner_support_tickets")
      .select("id, status")
      .eq("id", data.ticket_id)
      .eq("partner_id", partnerId)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!ticket) throw new Error("Ticket not found.");
    if (ticket.status === "closed") throw new Error("Ticket is closed.");

    const { error: msgErr } = await s.from("partner_support_messages").insert({
      ticket_id: data.ticket_id,
      body: data.body,
      is_admin: false,
      is_internal: false,
      attachment_url: data.attachment_url ?? null,
      author_user_id: context.userId,
    });
    if (msgErr) throw msgErr;

    // Sales partner reply resets status to "open" from waiting_partner or admin_replied
    const newStatus =
      ticket.status === "waiting_partner" || ticket.status === "admin_replied"
        ? "open"
        : ticket.status;

    await s.from("partner_support_tickets")
      .update({ status: newStatus, last_activity_at: new Date().toISOString() })
      .eq("id", data.ticket_id);

    await s.from("partner_support_activity").insert({
      ticket_id: data.ticket_id,
      action: "partner_replied",
      actor_user_id: context.userId,
      actor_role: "partner",
    });

    return { ok: true };
  });

// Prefilled selectors for the ticket form
export const getSupportSelectorOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const partnerId = await getPartnerId(context);
    const s = context.supabase as any;

    const [leads, payments, payouts, referrals, brands, programs, links] = await Promise.all([
      s.from("partner_leads")
        .select("id, full_name, mobile")
        .or(`owner_partner_id.eq.${partnerId},assigned_partner_id.eq.${partnerId}`)
        .order("created_at", { ascending: false }).limit(200),
      s.from("partner_payment_submissions")
        .select("id, amount, utr, status, submitted_at")
        .eq("partner_id", partnerId)
        .order("submitted_at", { ascending: false }).limit(100),
      s.from("payouts")
        .select("id, amount, approved_amount, status, scheduled_for")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false }).limit(60),
      s.from("partner_referrals")
        .select("id, status, bonus_amount, created_at")
        .or(`referrer_partner_id.eq.${partnerId},referred_partner_id.eq.${partnerId}`)
        .order("created_at", { ascending: false }).limit(60),
      s.from("partner_brand_profiles")
        .select("id, brand_name, status")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false }).limit(30),
      s.from("courses")
        .select("id, name, slug")
        .eq("published", true)
        .order("name", { ascending: true }).limit(300),
      s.from("payment_links")
        .select("id, code, name")
        .eq("is_active", true)
        .order("created_at", { ascending: false }).limit(100),
    ]);

    return {
      leads: leads.data ?? [],
      payments: payments.data ?? [],
      payouts: payouts.data ?? [],
      referrals: referrals.data ?? [],
      brands: brands.data ?? [],
      programs: programs.data ?? [],
      paymentLinks: links.data ?? [],
    };
  });
