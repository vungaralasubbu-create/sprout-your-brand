/**
 * Email Marketing OS aggregator.
 *
 * READ-ONLY over engage_* tables. NEVER duplicates Engage; the Marketing OS UI is a
 * re-branded front-door onto the existing Engage system with the taxonomy the spec
 * requires. All mutations continue to flow through src/lib/engage/*. All sending
 * continues through Lovable's managed email API.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CAMPAIGN_TAXONOMY = [
  { key: "newsletter", label: "Newsletter" },
  { key: "admissions", label: "Admissions" },
  { key: "course", label: "Course Promotion" },
  { key: "workshop", label: "Workshop" },
  { key: "webinar", label: "Webinar" },
  { key: "referral", label: "Referral" },
  { key: "placement", label: "Placement" },
  { key: "scholarship", label: "Scholarship" },
  { key: "hiring", label: "Hiring" },
  { key: "launch", label: "Product Launch" },
  { key: "custom", label: "Custom" },
] as const;

type MetaCampaign = { metadata?: Record<string, unknown> | null; status: string; channel: string };
function categoryOf(row: MetaCampaign): string {
  const m = row.metadata ?? {};
  const c = typeof m.category === "string" ? m.category : "custom";
  return c.toLowerCase();
}

export const getEmailOsDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = context.supabase;
    const [campaigns, events, subs, templates, sequences] = await Promise.all([
      s.from("engage_campaigns").select("id, status, channel, metadata, sent_count, delivered_count, opened_count, clicked_count, bounced_count, unsubscribed_count, revenue_amount, total_recipients").limit(5000),
      s.from("engage_events").select("event").limit(20000),
      s.from("engage_subscriptions").select("id, is_subscribed").limit(20000),
      s.from("engage_templates").select("id, category").limit(500),
      s.from("engage_sequences").select("id, status").limit(200),
    ]);

    const camp = (campaigns.data ?? []).filter((c) => c.channel === "email");
    const emailsSent = camp.reduce((a, r) => a + (r.sent_count ?? 0), 0);
    const delivered = camp.reduce((a, r) => a + (r.delivered_count ?? 0), 0);
    const opens = camp.reduce((a, r) => a + (r.opened_count ?? 0), 0);
    const clicks = camp.reduce((a, r) => a + (r.clicked_count ?? 0), 0);
    const bounced = camp.reduce((a, r) => a + (r.bounced_count ?? 0), 0);
    const unsubs = camp.reduce((a, r) => a + (r.unsubscribed_count ?? 0), 0);
    const revenue = camp.reduce((a, r) => a + Number(r.revenue_amount ?? 0), 0);
    const evRows = events.data ?? [];
    const spam = evRows.filter((e) => e.event === "complained" || e.event === "spam").length;
    const replies = evRows.filter((e) => e.event === "replied" || e.event === "reply").length;
    const activeSubs = (subs.data ?? []).filter((r) => r.is_subscribed).length;

    const byCategory = new Map<string, number>();
    for (const c of camp) byCategory.set(categoryOf(c as MetaCampaign), (byCategory.get(categoryOf(c as MetaCampaign)) ?? 0) + 1);

    return {
      campaigns: camp.length,
      activeCampaigns: camp.filter((c) => c.status === "running" || c.status === "scheduled" || c.status === "sending").length,
      emailsSent,
      openRate: delivered ? Math.round((opens / delivered) * 100) : 0,
      clickRate: delivered ? Math.round((clicks / delivered) * 100) : 0,
      replies,
      conversions: 0,
      revenue,
      bounceRate: emailsSent ? Math.round((bounced / emailsSent) * 100) : 0,
      spamRate: emailsSent ? Math.round((spam / Math.max(emailsSent, 1)) * 100) : 0,
      subscribers: activeSubs,
      unsubscribes: unsubs,
      totalTemplates: templates.data?.length ?? 0,
      totalSequences: sequences.data?.length ?? 0,
      taxonomyCounts: CAMPAIGN_TAXONOMY.map((t) => ({ key: t.key, label: t.label, count: byCategory.get(t.key) ?? 0 })),
    };
  });

export const listEmailCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("engage_campaigns")
      .select("id, name, status, channel, metadata, updated_at, scheduled_at, sent_count, opened_count, clicked_count")
      .eq("channel", "email")
      .order("updated_at", { ascending: false })
      .limit(200);
    return {
      campaigns: (data ?? []).map((c) => ({
        ...c,
        category: categoryOf(c as MetaCampaign),
      })),
    };
  });

export const listEmailTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("engage_templates")
      .select("id, name, category, updated_at, is_active")
      .order("updated_at", { ascending: false })
      .limit(200);
    return { templates: data ?? [] };
  });

export const listEmailSequences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("engage_sequences")
      .select("id, name, is_active, trigger_event, audience, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    return { sequences: data ?? [] };
  });
