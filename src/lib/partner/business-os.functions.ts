import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableAiJson, isAiAvailable } from "@/lib/ai-gateway.server";

export type BusinessBriefing = {
  headline: string;
  summary: string;
  wins: string[];
  risks: string[];
  priorityTasks: { title: string; why: string; impact: "high" | "medium" | "low" }[];
  sections: {
    business: string;
    sales: string;
    marketing: string;
    seo: string;
    finance: string;
    students: string;
  };
};

export type SalesCoachOutput = {
  hotLeads: { name: string; reason: string; probability: number; nextAction: string; bestTime: string }[];
  followUps: { name: string; message: string; channel: "email" | "whatsapp" | "call" }[];
  insights: string[];
};

export type MarketingIdeas = {
  blog: string[];
  linkedin: string[];
  instagram: string[];
  facebook: string[];
  twitter: string[];
  email: string[];
  youtube: string[];
  shorts: string[];
  googleAds: string[];
  metaAds: string[];
  push: string[];
  whatsapp: string[];
};

const briefingPrompt = (ctx: Record<string, unknown>) =>
  `You are an AI CEO for an education business partner on Glintr. Analyse this context and return JSON with keys: headline (short punchy), summary (2 sentences), wins (3 bullet strings), risks (3 bullet strings), priorityTasks (array of {title, why, impact}), sections {business, sales, marketing, seo, finance, students}. Context: ${JSON.stringify(ctx)}`;

export const getBusinessBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { context?: Record<string, unknown> } | undefined) => i ?? {})
  .handler(async ({ data, context }): Promise<BusinessBriefing> => {
    const ctx = data.context ?? {};
    // Enrich with some real stats
    const { supabase, userId } = context;
    const [{ count: leads }, { count: enrollments }] = await Promise.all([
      supabase.from("partner_leads").select("id", { count: "exact", head: true }).eq("partner_user_id", userId),
      supabase.from("enrollments").select("id", { count: "exact", head: true }),
    ]);
    const enriched = { ...ctx, leads: leads ?? 0, enrollments: enrollments ?? 0 };

    if (!isAiAvailable()) {
      return {
        headline: "AI briefing offline — configure Lovable AI to enable.",
        summary: "Live AI insights unavailable. Showing baseline metrics only.",
        wins: [`${leads ?? 0} leads captured`, `${enrollments ?? 0} enrollments`, "Systems nominal"],
        risks: ["AI advisor disabled", "No coaching signal", "Manual review required"],
        priorityTasks: [
          { title: "Enable AI advisor", why: "Unlock proactive coaching", impact: "high" },
          { title: "Review pending leads", why: "Convert warm prospects", impact: "high" },
          { title: "Publish 2 blogs this week", why: "SEO freshness", impact: "medium" },
        ],
        sections: {
          business: "Baseline mode active.",
          sales: `${leads ?? 0} leads in pipeline.`,
          marketing: "No campaign data.",
          seo: "Freshness check needed.",
          finance: "Payouts on schedule.",
          students: "Track completion weekly.",
        },
      };
    }
    return await callLovableAiJson<BusinessBriefing>({
      messages: [
        { role: "system", content: "You output only strict JSON matching the requested schema." },
        { role: "user", content: briefingPrompt(enriched) },
      ],
      temperature: 0.5,
    });
  });

export const getSalesCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }): Promise<SalesCoachOutput> => {
    const { supabase, userId } = context;
    const { data: leads } = await supabase
      .from("partner_leads")
      .select("id, name, status, created_at, follow_up_at, notes")
      .eq("partner_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!isAiAvailable() || !leads || leads.length === 0) {
      return {
        hotLeads: (leads ?? []).slice(0, 3).map((l) => ({
          name: (l.name as string) ?? "Lead",
          reason: "Recent activity",
          probability: 55,
          nextAction: "Call within 24h",
          bestTime: "11am–1pm",
        })),
        followUps: [],
        insights: ["Enable AI for smart coaching."],
      };
    }
    return await callLovableAiJson<SalesCoachOutput>({
      messages: [
        { role: "system", content: "You are an AI Sales Coach. Return strict JSON." },
        {
          role: "user",
          content: `Analyse these leads and return JSON {hotLeads:[{name,reason,probability(0-100),nextAction,bestTime}], followUps:[{name,message,channel}], insights:[...]} Leads: ${JSON.stringify(leads.slice(0, 15))}`,
        },
      ],
    });
  });

export const getMarketingIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { topic?: string } | undefined) => ({ topic: i?.topic ?? "AI courses for sales professionals" }))
  .handler(async ({ data }): Promise<MarketingIdeas> => {
    if (!isAiAvailable()) {
      const stub = (n: number, kind: string) =>
        Array.from({ length: n }, (_, i) => `${kind} idea ${i + 1} for ${data.topic}`);
      return {
        blog: stub(5, "Blog"),
        linkedin: stub(3, "LinkedIn"),
        instagram: stub(3, "Instagram"),
        facebook: stub(3, "Facebook"),
        twitter: stub(3, "Twitter"),
        email: stub(2, "Email"),
        youtube: stub(2, "YouTube"),
        shorts: stub(3, "Short"),
        googleAds: stub(3, "Google Ads"),
        metaAds: stub(3, "Meta Ads"),
        push: stub(2, "Push"),
        whatsapp: stub(2, "WhatsApp"),
      };
    }
    return await callLovableAiJson<MarketingIdeas>({
      messages: [
        { role: "system", content: "Return strict JSON only." },
        {
          role: "user",
          content: `Generate marketing ideas for an edtech partner. Topic: ${data.topic}. JSON keys: blog(5), linkedin(3), instagram(3), facebook(3), twitter(3), email(2), youtube(2), shorts(3), googleAds(3), metaAds(3), push(2), whatsapp(2). Each value is an array of short strings.`,
        },
      ],
    });
  });

export const getPartnerKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [leadsToday, leadsMonth, followUps, unreadMsgs] = await Promise.all([
      supabase
        .from("partner_leads")
        .select("id", { count: "exact", head: true })
        .eq("partner_user_id", userId)
        .gte("created_at", today.toISOString()),
      supabase
        .from("partner_leads")
        .select("id", { count: "exact", head: true })
        .eq("partner_user_id", userId)
        .gte("created_at", monthStart.toISOString()),
      supabase
        .from("partner_follow_ups")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", userId),
      supabase
        .from("partner_support_messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false),
    ]);

    return {
      leadsToday: leadsToday.count ?? 0,
      leadsMonth: leadsMonth.count ?? 0,
      followUpsPending: followUps.count ?? 0,
      unreadMessages: unreadMsgs.count ?? 0,
    };
  });
