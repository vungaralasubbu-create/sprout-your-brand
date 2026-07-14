import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ============================================================
 * STUDENT LIVE SESSIONS
 * Every read is scoped by RLS: students only see sessions for
 * programs they are enrolled in with active access.
 * ============================================================ */

type SessionRow = {
  id: string;
  course_id: string;
  module_id: string | null;
  mentor_id: string | null;
  title: string;
  description: string | null;
  learning_topics: string[] | null;
  scheduled_at: string;
  duration_minutes: number;
  join_window_minutes: number;
  status: string;
  previous_scheduled_at: string | null;
  cancellation_note: string | null;
  recording_url: string | null;
};

type AttendanceRow = {
  session_id: string;
  status: string;
  minutes_attended: number | null;
  confirmed_at: string | null;
};

type ShapedSession = ReturnType<typeof shapeSession>;

function computeDisplayStatus(row: SessionRow, now: Date) {
  const stored = row.status;
  if (stored === "cancelled" || stored === "rescheduled" || stored === "completed") return stored;
  const start = new Date(row.scheduled_at).getTime();
  const end = start + row.duration_minutes * 60_000;
  const joinOpens = start - row.join_window_minutes * 60_000;
  const t = now.getTime();
  if (t >= end) return "completed";
  if (t >= start) return "live";
  if (t >= joinOpens) return "starting_soon";
  return "scheduled";
}

function shapeSession(
  row: SessionRow,
  mentor: any | null,
  course: { id: string; name: string; slug: string | null } | null,
  moduleName: string | null,
  attendance: AttendanceRow | null,
  resourcesCount: number,
  now: Date,
) {
  const displayStatus = computeDisplayStatus(row, now);
  const start = new Date(row.scheduled_at);
  const end = new Date(start.getTime() + row.duration_minutes * 60_000);
  const joinOpens = new Date(start.getTime() - row.join_window_minutes * 60_000);
  const canJoin =
    (displayStatus === "starting_soon" || displayStatus === "live") &&
    row.status !== "cancelled";
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    learningTopics: row.learning_topics ?? [],
    scheduledAt: row.scheduled_at,
    endAt: end.toISOString(),
    durationMinutes: row.duration_minutes,
    joinWindowMinutes: row.join_window_minutes,
    joinOpensAt: joinOpens.toISOString(),
    storedStatus: row.status,
    displayStatus,
    canJoin,
    previousScheduledAt: row.previous_scheduled_at,
    cancellationNote: row.cancellation_note,
    hasRecording: !!row.recording_url,
    course: course
      ? { id: course.id, name: course.name, slug: course.slug }
      : { id: row.course_id, name: "Program", slug: null },
    module: row.module_id ? { id: row.module_id, name: moduleName } : null,
    mentor: mentor
      ? {
          id: mentor.id,
          name: mentor.name,
          photoUrl: mentor.photo_url,
          title: mentor.title,
        }
      : null,
    resourcesCount,
    attendance: attendance
      ? {
          status: attendance.status,
          minutesAttended: attendance.minutes_attended,
          confirmedAt: attendance.confirmed_at,
        }
      : null,
  };
}

async function fetchEnrolledCourseIds(context: any): Promise<string[]> {
  const { data } = await context.supabase
    .from("enrollments")
    .select("course_id, lms_status")
    .eq("student_user_id", context.userId);
  return Array.from(
    new Set(
      ((data ?? []) as any[])
        .filter((e) => ["active", "completed", "paused"].includes((e.lms_status ?? "").toLowerCase()))
        .map((e) => e.course_id)
        .filter(Boolean),
    ),
  );
}

async function hydrateSessions(context: any, rows: SessionRow[]): Promise<ShapedSession[]> {
  if (!rows.length) return [];
  const now = new Date();
  const courseIds = Array.from(new Set(rows.map((r) => r.course_id)));
  const mentorIds = Array.from(new Set(rows.map((r) => r.mentor_id).filter(Boolean))) as string[];
  const moduleIds = Array.from(new Set(rows.map((r) => r.module_id).filter(Boolean))) as string[];
  const sessionIds = rows.map((r) => r.id);

  const [{ data: courses }, { data: mentors }, { data: modules }, { data: attendance }, { data: resources }] =
    await Promise.all([
      context.supabase.from("courses").select("id, name, slug").in("id", courseIds),
      mentorIds.length
        ? context.supabase
            .from("session_mentors")
            .select("id, name, photo_url, title")
            .in("id", mentorIds)
        : Promise.resolve({ data: [] as any[] }),
      moduleIds.length
        ? context.supabase.from("course_modules").select("id, name").in("id", moduleIds)
        : Promise.resolve({ data: [] as any[] }),
      context.supabase
        .from("session_attendance")
        .select("session_id, status, minutes_attended, confirmed_at")
        .eq("student_user_id", context.userId)
        .in("session_id", sessionIds),
      context.supabase
        .from("session_resources")
        .select("session_id")
        .eq("is_published", true)
        .in("session_id", sessionIds),
    ]);

  const courseMap = new Map((courses ?? []).map((c: any) => [c.id, c]));
  const mentorMap = new Map((mentors ?? []).map((m: any) => [m.id, m]));
  const moduleMap = new Map<string, string>((modules ?? []).map((m: any) => [m.id as string, m.name as string]));
  const attMap = new Map((attendance ?? []).map((a: any) => [a.session_id, a]));
  const resCount: Record<string, number> = {};
  for (const r of (resources ?? []) as any[]) resCount[r.session_id] = (resCount[r.session_id] ?? 0) + 1;

  return rows.map((row) =>
    shapeSession(
      row,
      row.mentor_id ? mentorMap.get(row.mentor_id) ?? null : null,
      row.course_id ? (courseMap.get(row.course_id) as any) ?? null : null,
      row.module_id ? moduleMap.get(row.module_id) ?? null : null,
      attMap.get(row.id) ?? null,
      resCount[row.id] ?? 0,
      now,
    ),
  );
}

/* ============================================================
 * LIST — Live Sessions page
 * ============================================================ */

export const listStudentLiveSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { courseId?: string | null } = {}) => d)
  .handler(async ({ data, context }) => {
    const enrolledIds = await fetchEnrolledCourseIds(context);
    if (!enrolledIds.length) {
      return {
        sessions: [] as ShapedSession[],
        summary: { upcoming: 0, today: 0, completed: 0, attended: 0 },
        courses: [] as Array<{ id: string; name: string }>,
      };
    }
    const courseFilter =
      data?.courseId && enrolledIds.includes(data.courseId) ? [data.courseId] : enrolledIds;

    const { data: rows } = await context.supabase
      .from("live_sessions")
      .select(
        "id, course_id, module_id, mentor_id, title, description, learning_topics, scheduled_at, duration_minutes, join_window_minutes, status, previous_scheduled_at, cancellation_note, recording_url",
      )
      .in("course_id", courseFilter)
      .eq("is_published", true)
      .order("scheduled_at", { ascending: true });

    const sessions = await hydrateSessions(context, (rows ?? []) as SessionRow[]);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    let upcoming = 0,
      today = 0,
      completed = 0,
      attended = 0;
    for (const s of sessions) {
      const t = new Date(s.scheduledAt).getTime();
      if (s.storedStatus === "cancelled") continue;
      if (s.displayStatus === "completed") {
        completed += 1;
        if (s.attendance?.status === "attended" || s.attendance?.status === "partially_attended") {
          attended += 1;
        }
      } else {
        upcoming += 1;
        if (t >= startOfDay && t < endOfDay) today += 1;
      }
    }

    // Courses the student is enrolled in (for the filter dropdown)
    const { data: courses } = await context.supabase
      .from("courses")
      .select("id, name")
      .in("id", enrolledIds);

    return {
      sessions,
      summary: { upcoming, today, completed, attended },
      courses: (courses ?? []) as Array<{ id: string; name: string }>,
    };
  });

/* ============================================================
 * NEXT SESSIONS — LMS Dashboard connection
 * ============================================================ */

export const listUpcomingSessionsForDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const enrolledIds = await fetchEnrolledCourseIds(context);
    if (!enrolledIds.length) return [] as ShapedSession[];
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 60_000).toISOString();
    const { data: rows } = await context.supabase
      .from("live_sessions")
      .select(
        "id, course_id, module_id, mentor_id, title, description, learning_topics, scheduled_at, duration_minutes, join_window_minutes, status, previous_scheduled_at, cancellation_note, recording_url",
      )
      .in("course_id", enrolledIds)
      .eq("is_published", true)
      .neq("status", "cancelled")
      .gte("scheduled_at", cutoff)
      .order("scheduled_at", { ascending: true })
      .limit(3);
    return await hydrateSessions(context, (rows ?? []) as SessionRow[]);
  });

/* ============================================================
 * PROGRAM CONNECTION — compact summary + list for one program
 * ============================================================ */

export const getProgramLiveSessionsSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { courseId: string }) => d)
  .handler(async ({ data, context }) => {
    // RLS ensures enrolment; if the student isn't enrolled, no rows come back.
    const { data: rows } = await context.supabase
      .from("live_sessions")
      .select(
        "id, course_id, module_id, mentor_id, title, description, learning_topics, scheduled_at, duration_minutes, join_window_minutes, status, previous_scheduled_at, cancellation_note, recording_url",
      )
      .eq("course_id", data.courseId)
      .eq("is_published", true)
      .order("scheduled_at", { ascending: true });

    const sessions = await hydrateSessions(context, (rows ?? []) as SessionRow[]);
    const now = new Date();
    let upcomingCount = 0;
    let completedCount = 0;
    let next: ShapedSession | null = null;
    for (const s of sessions) {
      if (s.storedStatus === "cancelled") continue;
      if (s.displayStatus === "completed") completedCount += 1;
      else {
        upcomingCount += 1;
        if (!next && new Date(s.scheduledAt).getTime() >= now.getTime() - 30 * 60_000) next = s;
      }
    }
    return { next, upcomingCount, completedCount };
  });

/* ============================================================
 * SESSION DETAILS
 * ============================================================ */

export const getLiveSessionDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("live_sessions")
      .select(
        "id, course_id, module_id, mentor_id, title, description, learning_topics, scheduled_at, duration_minutes, join_window_minutes, status, previous_scheduled_at, cancellation_note, recording_url",
      )
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!row) throw new Error("Session not found or you do not have access");

    const [shaped] = await hydrateSessions(context, [row as SessionRow]);
    const [{ data: mentor }, { data: resources }] = await Promise.all([
      row.mentor_id
        ? context.supabase
            .from("session_mentors")
            .select("id, name, photo_url, title, bio, expertise")
            .eq("id", row.mentor_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      context.supabase
        .from("session_resources")
        .select("id, name, resource_type, url, display_order")
        .eq("session_id", row.id)
        .eq("is_published", true)
        .order("display_order", { ascending: true }),
    ]);

    return {
      ...shaped,
      mentorProfile: mentor
        ? {
            id: (mentor as any).id,
            name: (mentor as any).name,
            photoUrl: (mentor as any).photo_url,
            title: (mentor as any).title,
            bio: (mentor as any).bio,
            expertise: ((mentor as any).expertise ?? []) as string[],
          }
        : null,
      resources: ((resources ?? []) as any[]).map((r) => ({
        id: r.id,
        name: r.name,
        type: r.resource_type,
        url: r.url,
      })),
    };
  });

/* ============================================================
 * JOIN SESSION — returns the private meeting URL only when
 * the join window is open, the student is enrolled, and the
 * session is joinable. Also records a join attempt event and
 * a "session_join_attempt" activity (deduped).
 * ============================================================ */

export const joinLiveSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("live_sessions")
      .select(
        "id, course_id, title, scheduled_at, duration_minutes, join_window_minutes, status, meeting_url, is_published",
      )
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!row || !(row as any).is_published) throw new Error("Session not found");
    const r = row as any;

    if (r.status === "cancelled") throw new Error("This session has been cancelled");
    if (!r.meeting_url) throw new Error("A meeting link has not been configured yet");

    const now = Date.now();
    const start = new Date(r.scheduled_at).getTime();
    const end = start + r.duration_minutes * 60_000;
    const joinOpens = start - r.join_window_minutes * 60_000;
    if (now < joinOpens) {
      const mins = Math.ceil((joinOpens - now) / 60_000);
      throw new Error(`Join opens ${r.join_window_minutes} minutes before the session starts (in ${mins} min)`);
    }
    if (now >= end && r.status !== "live") throw new Error("This session has ended");

    // Record the join attempt (INSERT policy re-verifies enrolment)
    await context.supabase.from("session_join_events").insert({
      session_id: r.id,
      student_user_id: context.userId,
      course_id: r.course_id,
    });

    // Dedup activity within 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recent } = await context.supabase
      .from("student_activity")
      .select("id")
      .eq("student_user_id", context.userId)
      .eq("course_id", r.course_id)
      .eq("activity_type", "session_join_attempt")
      .eq("entity_id", r.id)
      .gte("created_at", fiveMinAgo)
      .limit(1);
    if (!(recent && recent.length)) {
      await context.supabase.from("student_activity").insert({
        student_user_id: context.userId,
        course_id: r.course_id,
        activity_type: "session_join_attempt",
        entity_id: r.id,
        description: `Joined ${r.title}`,
      });
    }

    return { meetingUrl: r.meeting_url as string };
  });

/* ============================================================
 * SESSION ACTIVITY EVENTS — non-mutating events for the
 * Recent Learning Activity feed. Deduped within a 5-minute window.
 * ============================================================ */

export const recordSessionActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    sessionId: string;
    activity:
      | "session_details_opened"
      | "session_recording_opened"
      | "session_resource_opened";
    description?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("live_sessions")
      .select("id, course_id, title")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!row) throw new Error("Session not found");

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recent } = await context.supabase
      .from("student_activity")
      .select("id")
      .eq("student_user_id", context.userId)
      .eq("course_id", (row as any).course_id)
      .eq("activity_type", data.activity)
      .eq("entity_id", (row as any).id)
      .gte("created_at", fiveMinAgo)
      .limit(1);
    if (recent && recent.length) return { ok: true, deduped: true };

    await context.supabase.from("student_activity").insert({
      student_user_id: context.userId,
      course_id: (row as any).course_id,
      activity_type: data.activity,
      entity_id: (row as any).id,
      description: data.description ?? `${(row as any).title}`,
    });
    return { ok: true };
  });

/* ============================================================
 * RECORDING — returns URL only for completed authorised sessions
 * with a configured recording. Also logs a "recording opened" event.
 * ============================================================ */

export const openSessionRecording = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("live_sessions")
      .select("id, course_id, title, recording_url, scheduled_at, duration_minutes, status")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!row) throw new Error("Session not found");
    const r = row as any;
    if (!r.recording_url) throw new Error("Recording not available");

    // Ensure the session is actually completed (stored or by time)
    const end = new Date(r.scheduled_at).getTime() + r.duration_minutes * 60_000;
    const isCompleted = r.status === "completed" || Date.now() >= end;
    if (!isCompleted) throw new Error("Recording is not available yet");

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recent } = await context.supabase
      .from("student_activity")
      .select("id")
      .eq("student_user_id", context.userId)
      .eq("course_id", r.course_id)
      .eq("activity_type", "session_recording_opened")
      .eq("entity_id", r.id)
      .gte("created_at", fiveMinAgo)
      .limit(1);
    if (!(recent && recent.length)) {
      await context.supabase.from("student_activity").insert({
        student_user_id: context.userId,
        course_id: r.course_id,
        activity_type: "session_recording_opened",
        entity_id: r.id,
        description: `Watched recording · ${r.title}`,
      });
    }
    return { recordingUrl: r.recording_url as string };
  });
