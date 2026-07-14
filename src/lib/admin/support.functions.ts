import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(ctx: any) {
  const { data, error } = await ctx.supabase.rpc("is_admin", { _user_id: ctx.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

export const adminListSupportTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      status: z.string().optional(),
      priority: z.string().optional(),
      search: z.string().optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase as any;

    let q = s
      .from("partner_support_tickets")
      .select(
        `id, ticket_code, category, subject, priority, status, created_at, updated_at, last_activity_at,
         assigned_admin_id, partner_id,
         partners:partner_id ( id, partner_code, display_name, first_name, work_model )`,
      )
      .order("last_activity_at", { ascending: false });

    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.priority && data.priority !== "all") {
      if (data.priority === "high_priority") q = q.in("priority", ["high", "urgent"]);
      else q = q.eq("priority", data.priority);
    }
    if (data.search) {
      q = q.or(`ticket_code.ilike.%${data.search}%,subject.ilike.%${data.search}%`);
    }

    const { data: rows, error } = await q.limit(500);
    if (error) throw error;

    // Optional additional partner-name search by joining after
    let filtered = rows ?? [];
    if (data.search) {
      const term = data.search.toLowerCase();
      const nameMatch = (filtered as any[]).filter((r) => {
        const n = (r.partners?.display_name ?? r.partners?.first_name ?? "").toLowerCase();
        const c = (r.partners?.partner_code ?? "").toLowerCase();
        return n.includes(term) || c.includes(term);
      });
      if (nameMatch.length > filtered.length) filtered = nameMatch;
    }

    // Summary metrics
    const { data: allRows } = await s
      .from("partner_support_tickets")
      .select("status, priority, assigned_admin_id, resolved_at");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const summary = {
      open: 0,
      urgent: 0,
      underReview: 0,
      waitingForSalesPartner: 0,
      unassigned: 0,
      resolvedToday: 0,
      waitingForAdmin: 0,
    };
    for (const r of allRows ?? []) {
      const st = (r as any).status;
      const pr = (r as any).priority;
      const assigned = (r as any).assigned_admin_id;
      const resolvedAt = (r as any).resolved_at;
      if (st === "open" || st === "under_review" || st === "admin_replied") summary.open++;
      if (pr === "urgent") summary.urgent++;
      if (st === "under_review") summary.underReview++;
      if (st === "waiting_partner") summary.waitingForSalesPartner++;
      if (!assigned && (st === "open" || st === "under_review")) summary.unassigned++;
      if (resolvedAt && new Date(resolvedAt) >= today) summary.resolvedToday++;
      if (st === "open" || st === "assigned") summary.waitingForAdmin++;
    }

    return { tickets: filtered, summary };
  });

export const adminGetSupportTicket = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase as any;

    const { data: ticket, error } = await s
      .from("partner_support_tickets")
      .select(
        `*, partners:partner_id ( id, partner_code, display_name, first_name, mobile, work_model )`,
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!ticket) throw new Error("Ticket not found.");

    const [{ data: messages }, { data: activity }, { data: assignments }] = await Promise.all([
      s.from("partner_support_messages")
        .select("id, is_admin, is_internal, body, attachment_url, created_at, author_user_id")
        .eq("ticket_id", data.id).order("created_at", { ascending: true }),
      s.from("partner_support_activity")
        .select("id, action, actor_user_id, actor_role, detail, created_at")
        .eq("ticket_id", data.id).order("created_at", { ascending: false }).limit(50),
      s.from("partner_support_assignments")
        .select("id, assigned_admin_id, assigned_by, assigned_at, unassigned_at")
        .eq("ticket_id", data.id).order("assigned_at", { ascending: false }),
    ]);

    const related: Record<string, any> = {};
    if (ticket.related_lead_id) {
      const { data: l } = await s.from("partner_leads").select("id, full_name, mobile, program_interest, status").eq("id", ticket.related_lead_id).maybeSingle();
      related.lead = l;
    }
    if (ticket.related_payment_submission_id) {
      const { data: p } = await s.from("partner_payment_submissions").select("id, amount, utr, status, plan").eq("id", ticket.related_payment_submission_id).maybeSingle();
      related.payment = p;
    }
    if (ticket.related_payout_id) {
      const { data: p } = await s.from("payouts").select("id, amount, approved_amount, status, scheduled_for").eq("id", ticket.related_payout_id).maybeSingle();
      related.payout = p;
    }
    if (ticket.related_referral_id) {
      const { data: r } = await s.from("partner_referrals").select("id, status, bonus_amount").eq("id", ticket.related_referral_id).maybeSingle();
      related.referral = r;
    }
    if (ticket.related_brand_profile_id) {
      const { data: b } = await s.from("partner_brand_profiles").select("id, brand_name, status").eq("id", ticket.related_brand_profile_id).maybeSingle();
      related.brand = b;
    }
    if (ticket.related_program_id) {
      const { data: c } = await s.from("courses").select("id, name, slug").eq("id", ticket.related_program_id).maybeSingle();
      related.program = c;
    }
    if (ticket.related_payment_link_id) {
      const { data: pl } = await s.from("payment_links").select("id, code, name").eq("id", ticket.related_payment_link_id).maybeSingle();
      related.paymentLink = pl;
    }

    return {
      ticket,
      messages: messages ?? [],
      activity: activity ?? [],
      assignments: assignments ?? [],
      related,
    };
  });

const replySchema = z.object({
  ticket_id: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
  is_internal: z.boolean().default(false),
  request_info: z.boolean().default(false),
  attachment_url: z.string().nullable().optional(),
});

export const adminReplySupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => replySchema.parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase as any;

    if (data.request_info && data.is_internal) throw new Error("Cannot request information via internal note.");

    const { error } = await s.from("partner_support_messages").insert({
      ticket_id: data.ticket_id,
      body: data.body,
      is_admin: true,
      is_internal: data.is_internal,
      attachment_url: data.attachment_url ?? null,
      author_user_id: context.userId,
    });
    if (error) throw error;

    if (!data.is_internal) {
      const newStatus = data.request_info ? "waiting_partner" : "admin_replied";
      await s.from("partner_support_tickets").update({
        status: newStatus,
        last_activity_at: new Date().toISOString(),
      }).eq("id", data.ticket_id);
    }

    await s.from("partner_support_activity").insert({
      ticket_id: data.ticket_id,
      action: data.is_internal ? "internal_note_added" : data.request_info ? "information_requested" : "admin_replied",
      actor_user_id: context.userId,
      actor_role: "admin",
    });

    return { ok: true };
  });

const decisionSchema = z.object({
  ticket_id: z.string().uuid(),
  action: z.enum(["mark_under_review", "mark_resolved", "close", "reopen"]),
  note: z.string().optional(),
});

export const adminUpdateSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => decisionSchema.parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase as any;
    const now = new Date().toISOString();
    const patch: any = { last_activity_at: now };

    if (data.action === "mark_under_review") patch.status = "under_review";
    if (data.action === "mark_resolved") {
      patch.status = "resolved";
      patch.resolved_at = now;
      if (data.note) patch.resolution_note = data.note;
    }
    if (data.action === "close") {
      patch.status = "closed";
      patch.closed_at = now;
    }
    if (data.action === "reopen") {
      patch.status = "open";
      patch.resolved_at = null;
      patch.closed_at = null;
    }

    const { error } = await s.from("partner_support_tickets").update(patch).eq("id", data.ticket_id);
    if (error) throw error;

    await s.from("partner_support_activity").insert({
      ticket_id: data.ticket_id,
      action: data.action,
      actor_user_id: context.userId,
      actor_role: "admin",
      detail: data.note ?? null,
    });
    return { ok: true };
  });

export const adminAssignSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ticket_id: z.string().uuid(), admin_user_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase as any;
    const now = new Date().toISOString();

    // Close previous open assignment
    await s.from("partner_support_assignments")
      .update({ unassigned_at: now })
      .eq("ticket_id", data.ticket_id)
      .is("unassigned_at", null);

    await s.from("partner_support_assignments").insert({
      ticket_id: data.ticket_id,
      assigned_admin_id: data.admin_user_id,
      assigned_by: context.userId,
    });

    const { error } = await s.from("partner_support_tickets").update({
      assigned_admin_id: data.admin_user_id,
      assigned_at: now,
      last_activity_at: now,
    }).eq("id", data.ticket_id);
    if (error) throw error;

    await s.from("partner_support_activity").insert({
      ticket_id: data.ticket_id,
      action: "ticket_assigned",
      actor_user_id: context.userId,
      actor_role: "admin",
      detail: data.admin_user_id,
    });
    return { ok: true };
  });

export const adminListSupportAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase as any;
    const { data } = await s
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["super_admin", "admin", "partner_manager"]);
    return { admins: data ?? [] };
  });

// Command center summary
export const adminSupportSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase as any;
    const [
      { count: openTickets },
      { count: urgentTickets },
      { count: waitingForAdmin },
    ] = await Promise.all([
      s.from("partner_support_tickets").select("id", { count: "exact", head: true })
        .in("status", ["open", "under_review", "admin_replied"]),
      s.from("partner_support_tickets").select("id", { count: "exact", head: true })
        .eq("priority", "urgent").not("status", "in", "(resolved,closed)"),
      s.from("partner_support_tickets").select("id", { count: "exact", head: true })
        .in("status", ["open", "assigned"]),
    ]);
    return {
      openTickets: openTickets ?? 0,
      urgentTickets: urgentTickets ?? 0,
      waitingForAdmin: waitingForAdmin ?? 0,
    };
  });
