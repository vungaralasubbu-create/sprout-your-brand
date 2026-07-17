// Server functions for the Zoom / Live Classes integration.
// Provider-agnostic — swap in Google Meet / Teams later without changing routes.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// --- Provider status ---------------------------------------------------------

export const getProviderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("live_class_providers")
      .select("provider,is_connected,account_email,account_name,connected_at,expires_at,last_error")
      .order("provider");
    const zoomConfigured = Boolean(
      process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET,
    );
    return {
      providers: data ?? [],
      env: { zoomConfigured },
    };
  });

// --- Connect / disconnect (marks provider row) -------------------------------

const ConnectInput = z.object({
  provider: z.enum(["zoom", "google_meet", "ms_teams", "webex"]),
  accountEmail: z.string().email().optional(),
  accountName: z.string().max(200).optional(),
});

export const connectProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ConnectInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("live_class_providers")
      .update({
        is_connected: true,
        account_email: data.accountEmail ?? null,
        account_name: data.accountName ?? null,
        connected_by: context.userId,
        connected_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("provider", data.provider);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const disconnectProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ provider: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("live_class_providers")
      .update({ is_connected: false, connected_at: null, expires_at: null })
      .eq("provider", data.provider);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Batches -----------------------------------------------------------------

const BatchInput = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(160),
  courseId: z.string().uuid().nullish(),
  cohortStart: z.string().nullish(),
  cohortEnd: z.string().nullish(),
  scheduleSummary: z.string().max(400).nullish(),
  capacity: z.number().int().positive().nullish(),
});

export const createBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BatchInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("batches")
      .insert({
        name: data.name,
        slug: data.slug,
        course_id: data.courseId ?? null,
        cohort_start_date: data.cohortStart ?? null,
        cohort_end_date: data.cohortEnd ?? null,
        schedule_summary: data.scheduleSummary ?? null,
        capacity: data.capacity ?? null,
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("batches")
      .select("id,name,slug,course_id,cohort_start_date,cohort_end_date,schedule_summary,status,capacity")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

// --- Live sessions -----------------------------------------------------------

const CreateSessionInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  agenda: z.string().max(2000).nullish(),
  courseId: z.string().uuid().nullish(),
  batchId: z.string().uuid().nullish(),
  mentorId: z.string().uuid().nullish(),
  scheduledAt: z.string(), // ISO
  durationMinutes: z.number().int().min(5).max(600),
  timezone: z.string().max(60).default("Asia/Kolkata"),
  provider: z.enum(["zoom", "google_meet", "ms_teams", "webex", "manual"]).default("zoom"),
  isWebinar: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  waitingRoom: z.boolean().default(true),
  requireRegistration: z.boolean().default(false),
  recordingEnabled: z.boolean().default(true),
  breakoutRooms: z.boolean().default(false),
  chatEnabled: z.boolean().default(true),
  maxParticipants: z.number().int().positive().nullish(),
  manualMeetingUrl: z.string().url().nullish(),
  manualPasscode: z.string().max(60).nullish(),
});

export const createLiveSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateSessionInput.parse(d))
  .handler(async ({ data, context }) => {
    let joinUrl: string | null = data.manualMeetingUrl ?? null;
    let hostUrl: string | null = null;
    let passcode: string | null = data.manualPasscode ?? null;
    let providerMeetingId: string | null = null;
    let providerUsed = data.provider;

    // Attempt live Zoom API call if the provider is Zoom + configured.
    if (data.provider === "zoom") {
      const zoomConfigured = Boolean(
        process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET,
      );
      if (zoomConfigured) {
        try {
          const { zoomProvider } = await import("./providers/zoom.server");
          const res = await zoomProvider.createMeeting({
            topic: data.title,
            agenda: data.agenda ?? undefined,
            startAt: data.scheduledAt,
            durationMinutes: data.durationMinutes,
            timezone: data.timezone,
            isWebinar: data.isWebinar,
            isRecurring: data.isRecurring,
            waitingRoom: data.waitingRoom,
            requireRegistration: data.requireRegistration,
            recordingEnabled: data.recordingEnabled,
            breakoutRooms: data.breakoutRooms,
            chatEnabled: data.chatEnabled,
            maxParticipants: data.maxParticipants ?? undefined,
          });
          joinUrl = res.joinUrl;
          hostUrl = res.hostUrl;
          passcode = res.passcode ?? null;
          providerMeetingId = res.providerMeetingId;
        } catch (e) {
          // Fall back to manual so the class still gets scheduled.
          providerUsed = "manual";
        }
      } else {
        providerUsed = "manual";
      }
    }

    const { data: row, error } = await context.supabase
      .from("live_sessions")
      .insert({
        title: data.title,
        description: data.description ?? null,
        agenda: data.agenda ?? null,
        course_id: data.courseId ?? null,
        batch_id: data.batchId ?? null,
        mentor_id: data.mentorId ?? null,
        scheduled_at: data.scheduledAt,
        duration_minutes: data.durationMinutes,
        timezone: data.timezone,
        provider: providerUsed,
        provider_meeting_id: providerMeetingId,
        meeting_url: joinUrl,
        host_url: hostUrl,
        passcode,
        is_webinar: data.isWebinar,
        is_recurring: data.isRecurring,
        waiting_room: data.waitingRoom,
        require_registration: data.requireRegistration,
        recording_enabled: data.recordingEnabled,
        breakout_rooms: data.breakoutRooms,
        chat_enabled: data.chatEnabled,
        max_participants: data.maxParticipants ?? null,
        is_published: true,
        status: "scheduled",
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Queue reminders (in-app for now; SMS/WhatsApp future channels).
    await queueReminders(context.supabase, row.id, data.scheduledAt, data.batchId);
    return row;
  });

async function queueReminders(supabase: any, sessionId: string, scheduledAt: string, batchId: string | null | undefined) {
  if (!batchId) return;
  const { data: students } = await supabase
    .from("batch_enrollments")
    .select("student_user_id")
    .eq("batch_id", batchId)
    .eq("active", true);
  if (!students?.length) return;
  const start = new Date(scheduledAt).getTime();
  const events: Array<{ event: string; offset: number }> = [
    { event: "reminder_24h", offset: -24 * 60 * 60 * 1000 },
    { event: "reminder_1h", offset: -60 * 60 * 1000 },
    { event: "reminder_15m", offset: -15 * 60 * 1000 },
    { event: "started", offset: 0 },
  ];
  const rows = students.flatMap((s: { student_user_id: string }) =>
    events.map((e) => ({
      session_id: sessionId,
      student_user_id: s.student_user_id,
      channel: "in_app",
      event: e.event,
      scheduled_for: new Date(start + e.offset).toISOString(),
    })),
  );
  if (rows.length) await supabase.from("live_class_notifications").insert(rows);
}

export const listAdminSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("live_sessions")
      .select("id,title,description,scheduled_at,duration_minutes,provider,meeting_url,host_url,provider_meeting_id,passcode,status,batch_id,course_id,mentor_id,is_webinar,recording_url,recording_enabled,waiting_room,max_participants")
      .order("scheduled_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const cancelLiveSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), note: z.string().max(400).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("live_sessions")
      .update({ status: "cancelled", cancellation_note: data.note ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Student view ------------------------------------------------------------

export const listMyLiveSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: myBatches } = await context.supabase
      .from("batch_enrollments")
      .select("batch_id")
      .eq("student_user_id", context.userId)
      .eq("active", true);
    const batchIds = (myBatches ?? []).map((b: { batch_id: string }) => b.batch_id);

    let query = context.supabase
      .from("live_sessions")
      .select("id,title,description,scheduled_at,duration_minutes,provider,meeting_url,status,batch_id,course_id,is_webinar,recording_url,recording_enabled,agenda,passcode")
      .eq("is_published", true)
      .order("scheduled_at", { ascending: true });

    if (batchIds.length) {
      query = query.in("batch_id", batchIds);
    } else {
      // Show global (no-batch) published sessions as a fallback so newly-added
      // students still see something until they're placed in a batch.
      query = query.is("batch_id", null);
    }

    const { data } = await query.limit(200);
    return data ?? [];
  });

// --- Analytics ---------------------------------------------------------------

export const getLiveAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ count: total }, { count: completed }, { count: cancelled }] = await Promise.all([
      context.supabase.from("live_sessions").select("id", { count: "exact", head: true }),
      context.supabase.from("live_sessions").select("id", { count: "exact", head: true }).eq("status", "completed"),
      context.supabase.from("live_sessions").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
    ]);
    const { data: attendance } = await context.supabase
      .from("session_attendance")
      .select("status,minutes_attended")
      .limit(2000);
    const present = (attendance ?? []).filter((a: { status: string }) => a.status === "present").length;
    const totalAtt = (attendance ?? []).length || 1;
    const avgWatch = Math.round(
      (attendance ?? []).reduce((s: number, a: { minutes_attended: number | null }) => s + (a.minutes_attended ?? 0), 0) /
        totalAtt,
    );
    return {
      totalClasses: total ?? 0,
      completed: completed ?? 0,
      cancelled: cancelled ?? 0,
      attendancePct: Math.round((present / totalAtt) * 100),
      avgWatchMinutes: avgWatch,
    };
  });
