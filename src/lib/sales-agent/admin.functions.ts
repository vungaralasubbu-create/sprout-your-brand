import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(ctx: any, userId: string) {
  const [a, b] = await Promise.all([
    ctx.supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ctx.supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" }),
  ]);
  if (!a.data && !b.data) throw new Error("Forbidden");
}

export const salesAgentMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since24 = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const [convToday, hot, qualified, handovers, enrollments, unanswered, followups, recent] = await Promise.all([
      supabaseAdmin.from("ai_sales_conversations").select("id", { count: "exact", head: true }).gte("created_at", since24),
      supabaseAdmin.from("ai_sales_leads").select("id", { count: "exact", head: true }).eq("score", "hot"),
      supabaseAdmin.from("ai_sales_leads").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("ai_sales_conversations").select("id", { count: "exact", head: true }).eq("status", "handover"),
      supabaseAdmin.from("ai_sales_conversations").select("id", { count: "exact", head: true }).eq("status", "enrolled"),
      supabaseAdmin.from("ai_sales_unanswered").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabaseAdmin.from("ai_sales_followups").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
      supabaseAdmin
        .from("ai_sales_conversations")
        .select("id,channel,lead_score,status,contact_name,contact_email,contact_phone,language,last_message_at,handover_reason")
        .order("last_message_at", { ascending: false })
        .limit(20),
    ]);

    return {
      metrics: {
        conversationsToday: convToday.count ?? 0,
        hotLeads: hot.count ?? 0,
        qualifiedLeads: qualified.count ?? 0,
        handovers: handovers.count ?? 0,
        enrollments: enrollments.count ?? 0,
        openUnanswered: unanswered.count ?? 0,
        scheduledFollowups: followups.count ?? 0,
        conversionRate: qualified.count ? Math.round(((enrollments.count ?? 0) / qualified.count) * 100) : 0,
      },
      recent: recent.data ?? [],
    };
  });

export const salesAgentLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    score: z.enum(["hot", "warm", "cold", "dormant", "all"]).default("all"),
    limit: z.number().min(1).max(200).default(50),
  }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("ai_sales_leads")
      .select("id,conversation_id,name,email,phone,country,city,career_goal,preferred_tech,budget,score,status,created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.score !== "all") q = q.eq("score", data.score);
    const { data: leads } = await q;
    return { leads: leads ?? [] };
  });

export const salesAgentConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [conv, msgs] = await Promise.all([
      supabaseAdmin.from("ai_sales_conversations").select("*").eq("id", data.id).single(),
      supabaseAdmin
        .from("ai_sales_messages")
        .select("role,content,quick_replies,cards,created_at")
        .eq("conversation_id", data.id)
        .order("created_at", { ascending: true }),
    ]);
    return { conversation: conv.data, messages: msgs.data ?? [] };
  });

export const listUnanswered = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("ai_sales_unanswered")
      .select("id,question,ai_response,admin_answer,status,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    return { items: data ?? [] };
  });

export const teachAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    unansweredId: z.string().uuid().optional(),
    topic: z.string().min(1).max(80),
    question: z.string().min(3).max(500),
    answer: z.string().min(3).max(4000),
    keywords: z.array(z.string().max(40)).max(20).default([]),
  }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ai_sales_knowledge").insert({
      topic: data.topic,
      question: data.question,
      answer: data.answer,
      keywords: data.keywords,
      created_by: context.userId,
      priority: 10,
    });
    if (data.unansweredId) {
      await supabaseAdmin
        .from("ai_sales_unanswered")
        .update({ admin_answer: data.answer, status: "answered", answered_by: context.userId, answered_at: new Date().toISOString() })
        .eq("id", data.unansweredId);
    }
    return { ok: true };
  });
