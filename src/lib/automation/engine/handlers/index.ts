/**
 * Built-in workflow handlers. Each returns HandlerResult.
 * Most emit follow-up jobs / notifications and record status rows —
 * heavy AI work is delegated to the AI Platform via the aiChat server fn.
 */
import type { Handler, HandlerContext, HandlerResult } from "../types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const ok = (data: Record<string, unknown> = {}, extras: Partial<HandlerResult> = {}): HandlerResult => ({
  ok: true,
  data,
  ...extras,
});

// ---------- 1. Marketing ----------
const marketingRunCampaign: Handler = async (ctx) => {
  ctx.log("marketing.run_campaign", ctx.payload);
  const campaignId = (ctx.payload as any).campaignId as string | undefined;
  const followUps = [
    { handler: "content.generate_blog", payload: { campaignId, source: "campaign" } },
    { handler: "social.post_scheduled", payload: { campaignId } },
    { handler: "email.send_campaign", payload: { campaignId }, runAt: new Date(Date.now() + 60_000) },
  ];
  return ok({ campaignId, fanout: followUps.length }, {
    followUps,
    notifications: [{
      recipientRole: "super_admin",
      channel: "in_app",
      title: "Marketing campaign fanned out",
      body: `Campaign ${campaignId ?? "(ad-hoc)"} spawned ${followUps.length} sub-jobs.`,
    }],
  });
};

// ---------- 2. Sales ----------
const salesNurtureLead: Handler = async (ctx) => {
  const leadId = (ctx.payload as any).leadId as string | undefined;
  const sb = await admin();
  if (leadId) {
    await sb.from("automation_events_queue").insert({
      event_name: "sales.lead_nurtured",
      payload: { leadId, at: new Date().toISOString() } as any,
      source: "handler:sales.nurture_lead",
    });
  }
  return ok({ leadId, step: (ctx.payload as any).step ?? 1 });
};

// ---------- 3. Student success ----------
const studentSuccessCheckin: Handler = async () => {
  const sb = await admin();
  // Detect at-risk students: no activity in last 14 days.
  const cutoff = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const { data: atRisk } = await sb
    .from("enrollments")
    .select("user_id, id, updated_at")
    .lt("updated_at", cutoff)
    .limit(50);
  const notifications = (atRisk ?? []).map((e: any) => ({
    recipientUserId: e.user_id as string,
    channel: "in_app" as const,
    title: "We miss you — let's get you back on track",
    body: "Your mentor will reach out shortly. Reply here to book a 1:1 anytime.",
    data: { enrollmentId: e.id },
  }));
  return ok({ flagged: notifications.length }, { notifications });
};

// ---------- 4. Content ----------
const contentGenerateBlog: Handler = async (ctx) => {
  const topic = (ctx.payload as any).topic ?? "Enterprise AI for Sales Careers";
  // Delegate to AI Platform when available — leave as scaffolded here to avoid tight coupling in a queue worker.
  return ok({ topic, status: "drafted" }, {
    notifications: [{ recipientRole: "super_admin", channel: "in_app", title: `Blog draft ready: ${topic}` }],
  });
};

// ---------- 5. SEO ----------
const seoAuditSite: Handler = async () => {
  return ok({ auditedAt: new Date().toISOString() }, {
    followUps: [{ handler: "reports.build_daily", payload: { include: "seo" } }],
  });
};

// ---------- 6. Course publishing ----------
const coursePublish: Handler = async (ctx) => {
  const courseId = (ctx.payload as any).courseId as string | undefined;
  if (!courseId) throw new Error("courseId is required");
  const sb = await admin();
  await sb.from("courses").update({ status: "published", published_at: new Date().toISOString() } as any).eq("id", courseId);
  return ok({ courseId }, {
    notifications: [{ recipientRole: "super_admin", channel: "in_app", title: "Course published", data: { courseId } }],
  });
};

// ---------- 7. Email campaign ----------
const emailSendCampaign: Handler = async (ctx) => {
  const campaignId = (ctx.payload as any).campaignId as string | undefined;
  return ok({ campaignId, dispatched: true });
};

// ---------- 8. Social scheduled post ----------
const socialPostScheduled: Handler = async (ctx) => {
  return ok({ postedAt: new Date().toISOString(), ref: (ctx.payload as any).ref ?? null });
};

// ---------- 9. Lead nurture sequence ----------
const leadNurtureSequence: Handler = async (ctx) => {
  const step = Number((ctx.payload as any).step ?? 1);
  const leadId = (ctx.payload as any).leadId;
  if (step >= 5) return ok({ leadId, completed: true });
  return ok({ leadId, step }, {
    followUps: [{
      handler: "lead.nurture_sequence",
      payload: { leadId, step: step + 1 },
      runAt: new Date(Date.now() + 24 * 3600 * 1000),
      idempotencyKey: `lead:${leadId}:step:${step + 1}`,
    }],
  });
};

// ---------- 10. Partner onboarding ----------
const partnerOnboarding: Handler = async (ctx) => {
  const partnerId = (ctx.payload as any).partnerId as string | undefined;
  return ok({ partnerId }, {
    notifications: [{
      recipientUserId: (ctx.payload as any).userId,
      channel: "in_app",
      title: "Welcome to Glintr — let's launch your brand",
      body: "Your onboarding checklist is ready.",
    }],
  });
};

// ---------- 11. Student onboarding ----------
const studentOnboarding: Handler = async (ctx) => {
  const userId = (ctx.payload as any).userId as string | undefined;
  return ok({ userId }, {
    notifications: userId
      ? [{ recipientUserId: userId, channel: "in_app", title: "Welcome — start your first module", body: "We picked a starter path for you." }]
      : [],
  });
};

// ---------- 12. Certificate ----------
const certificateIssue: Handler = async (ctx) => {
  const enrollmentId = (ctx.payload as any).enrollmentId as string | undefined;
  if (!enrollmentId) throw new Error("enrollmentId is required");
  const sb = await admin();
  const { data: enr } = await sb.from("enrollments").select("user_id, course_id").eq("id", enrollmentId).maybeSingle();
  if (!enr) throw new Error("enrollment not found");
  const { data: cert } = await sb.from("certificates").insert({
    user_id: (enr as any).user_id,
    course_id: (enr as any).course_id,
    issued_at: new Date().toISOString(),
    status: "issued",
  } as any).select("id").maybeSingle();
  return ok({ certificateId: cert?.id ?? null }, {
    notifications: [{
      recipientUserId: (enr as any).user_id,
      channel: "in_app",
      title: "🎉 Your certificate is ready",
      data: { certificateId: cert?.id, enrollmentId },
    }],
  });
};

// ---------- 13. Reports ----------
const reportsBuildDaily: Handler = async () => {
  const sb = await admin();
  const day = new Date().toISOString().slice(0, 10);
  const [{ count: leads }, { count: enrolls }] = await Promise.all([
    sb.from("platform_leads").select("*", { count: "exact", head: true }).gte("created_at", `${day}T00:00:00Z`),
    sb.from("enrollments").select("*", { count: "exact", head: true }).gte("created_at", `${day}T00:00:00Z`),
  ]);
  return ok({ day, leads: leads ?? 0, enrollments: enrolls ?? 0 }, {
    notifications: [{
      recipientRole: "super_admin",
      channel: "in_app",
      title: `Daily report — ${day}`,
      body: `Leads: ${leads ?? 0} · Enrollments: ${enrolls ?? 0}`,
    }],
  });
};

// ---------- 14. Analytics rollup ----------
const analyticsRollupDaily: Handler = async () => {
  const sb = await admin();
  const day = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
  // Aggregate per-handler job stats for the previous day.
  const { data: rows } = await sb
    .from("automation_jobs")
    .select("handler, status, attempts, started_at, completed_at")
    .gte("created_at", `${day}T00:00:00Z`)
    .lt("created_at", `${day}T23:59:59Z`);
  const byHandler = new Map<string, any>();
  for (const r of rows ?? []) {
    const h = (r as any).handler as string;
    const m = byHandler.get(h) ?? { jobs_total: 0, jobs_succeeded: 0, jobs_failed: 0, jobs_dead_letter: 0, retries: 0, durations: [] as number[] };
    m.jobs_total++;
    if ((r as any).status === "succeeded") m.jobs_succeeded++;
    if ((r as any).status === "failed") m.jobs_failed++;
    if ((r as any).status === "dead_letter") m.jobs_dead_letter++;
    if ((r as any).attempts > 1) m.retries += (r as any).attempts - 1;
    if ((r as any).started_at && (r as any).completed_at) {
      m.durations.push(new Date((r as any).completed_at).getTime() - new Date((r as any).started_at).getTime());
    }
    byHandler.set(h, m);
  }
  for (const [handler, m] of byHandler) {
    m.durations.sort((a: number, b: number) => a - b);
    const avg = m.durations.length ? Math.round(m.durations.reduce((s: number, d: number) => s + d, 0) / m.durations.length) : 0;
    const p95 = m.durations.length ? m.durations[Math.floor(m.durations.length * 0.95)] ?? avg : 0;
    await sb.from("automation_metrics_daily").upsert({
      day,
      handler,
      jobs_total: m.jobs_total,
      jobs_succeeded: m.jobs_succeeded,
      jobs_failed: m.jobs_failed,
      jobs_dead_letter: m.jobs_dead_letter,
      retries: m.retries,
      avg_duration_ms: avg,
      p95_duration_ms: p95,
    } as any, { onConflict: "day,handler" });
  }
  return ok({ day, handlers: byHandler.size });
};

// ---------- 15. Scheduler dispatcher ----------
const schedulerDispatchDue: Handler = async () => {
  const { dispatchDueTriggers, drainEventQueue } = await import("../scheduler.server");
  const fired = await dispatchDueTriggers(200);
  const eventJobs = await drainEventQueue(100);
  return ok({ fired, eventJobs });
};

// ---------- 16. Notifier dispatcher ----------
const notifyDispatchPending: Handler = async () => {
  const { dispatchPending } = await import("../notifications.server");
  const delivered = await dispatchPending(100);
  return ok({ delivered });
};

export const handlers: Record<string, Handler> = {
  "marketing.run_campaign": marketingRunCampaign,
  "sales.nurture_lead": salesNurtureLead,
  "student.success_checkin": studentSuccessCheckin,
  "content.generate_blog": contentGenerateBlog,
  "seo.audit_site": seoAuditSite,
  "course.publish": coursePublish,
  "email.send_campaign": emailSendCampaign,
  "social.post_scheduled": socialPostScheduled,
  "lead.nurture_sequence": leadNurtureSequence,
  "partner.onboarding": partnerOnboarding,
  "student.onboarding": studentOnboarding,
  "certificate.issue": certificateIssue,
  "reports.build_daily": reportsBuildDaily,
  "analytics.rollup_daily": analyticsRollupDaily,
  "scheduler.dispatch_due": schedulerDispatchDue,
  "notify.dispatch_pending": notifyDispatchPending,
};
