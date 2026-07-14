import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin — per-partner lead work monitoring. */
export const getPartnerLeadWorkStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;

    // Ensure caller is admin
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: context.userId });
    if (!isAdmin) throw new Error("Forbidden");

    const nowISO = new Date().toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartISO = todayStart.toISOString();

    const [partnersRes, leadsRes, followUpsRes, activityRes] = await Promise.all([
      supabase
        .from("partners")
        .select("id, display_name, partner_code, work_model, status")
        .eq("status", "active"),
      supabase
        .from("partner_leads")
        .select("id, assigned_partner_id, owner_partner_id, status, last_activity_at"),
      supabase
        .from("partner_follow_ups")
        .select("id, partner_id, due_at, status"),
      supabase
        .from("partner_lead_activities")
        .select("id, partner_id, created_at")
        .gte("created_at", todayStartISO),
    ]);

    const partners = partnersRes.data ?? [];
    const leads = leadsRes.data ?? [];
    const fus = followUpsRes.data ?? [];
    const acts = activityRes.data ?? [];

    return partners.map((p: any) => {
      const myLeads = leads.filter(
        (l: any) => l.assigned_partner_id === p.id || l.owner_partner_id === p.id,
      );
      const notContacted = myLeads.filter((l: any) => l.status === "new").length;
      const noAnswer = myLeads.filter((l: any) => l.status === "no_answer").length;
      const partnerFus = fus.filter((f: any) => f.partner_id === p.id);
      const todayFus = partnerFus.filter(
        (f: any) =>
          f.status === "scheduled" &&
          f.due_at >= todayStartISO &&
          f.due_at <= new Date(todayStart.getTime() + 86400000).toISOString(),
      ).length;
      const overdueFus = partnerFus.filter(
        (f: any) => f.status === "scheduled" && f.due_at < nowISO,
      ).length;
      const missedFus = partnerFus.filter((f: any) => f.status === "missed").length;
      const activityToday = acts.filter((a: any) => a.partner_id === p.id).length;
      const lastActivity = myLeads
        .map((l: any) => l.last_activity_at)
        .filter(Boolean)
        .sort()
        .pop();

      return {
        partner_id: p.id,
        display_name: p.display_name,
        partner_code: p.partner_code,
        work_model: p.work_model,
        assigned_leads: myLeads.length,
        not_contacted: notContacted,
        today_follow_ups: todayFus,
        overdue_follow_ups: overdueFus,
        no_answer_leads: noAnswer,
        missed_follow_ups: missedFus,
        activity_today: activityToday,
        last_activity_at: lastActivity ?? null,
        // Flags
        flag_no_activity_today: activityToday === 0 && myLeads.length > 0,
        flag_high_overdue: overdueFus >= 5,
        flag_not_contacted: notContacted >= 5,
        flag_repeated_missed: missedFus >= 3,
      };
    });
  });
