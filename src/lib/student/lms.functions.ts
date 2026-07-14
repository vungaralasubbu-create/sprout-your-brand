/**
 * Student LMS — server functions.
 * All reads/writes go through requireSupabaseAuth, so RLS scopes results
 * to the authenticated student (or admin) automatically.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ============================================================
 * CONTEXT / OVERVIEW
 * ============================================================ */

export const getStudentContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: authUser } = await context.supabase.auth.getUser();
    const email = authUser.user?.email ?? null;
    const meta = (authUser.user?.user_metadata ?? {}) as Record<string, any>;
    const displayName = meta.full_name || meta.name || (email ? email.split("@")[0] : "Student");

    // Ensure student role (self-service). Idempotent thanks to unique(user_id, role).
    await context.supabase
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "student" as any }, { onConflict: "user_id,role" });

    return { userId: context.userId, email, displayName };
  });

export const getStudentOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: enrollments }, { data: certificates }, { data: activity }] = await Promise.all([
      context.supabase
        .from("enrollments")
        .select("id, course_id, program_title, lms_status, enrolled_at, completed_at, last_accessed_at")
        .eq("student_user_id", context.userId)
        .order("last_accessed_at", { ascending: false, nullsFirst: false }),
      context.supabase
        .from("certificates")
        .select("id, course_id, course_name, certificate_number, verification_code, issued_at")
        .eq("student_user_id", context.userId),
      context.supabase
        .from("student_activity")
        .select("id, activity_type, description, course_id, created_at")
        .eq("student_user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const enrs = enrollments ?? [];
    const courseIds = Array.from(new Set(enrs.map((e) => e.course_id).filter(Boolean))) as string[];
    let progressPct: Record<string, number> = {};
    let courseMeta: Record<string, { name: string; slug: string; thumbnail_url: string | null }> = {};

    if (courseIds.length) {
      const [{ data: totals }, { data: done }, { data: courses }] = await Promise.all([
        context.supabase
          .from("course_lessons")
          .select("id, topic_id, course_modules!inner(course_id)")
          .eq("is_published", true)
          .in("course_modules.course_id" as any, courseIds),
        context.supabase
          .from("lesson_progress")
          .select("course_id, lesson_id, status")
          .eq("student_user_id", context.userId)
          .eq("status", "completed")
          .in("course_id", courseIds),
        context.supabase.from("courses").select("id, name, slug, thumbnail_url").in("id", courseIds),
      ]);
      // total lessons per course (best-effort via nested)
      const totalPerCourse: Record<string, number> = {};
      for (const c of courseIds) totalPerCourse[c] = 0;
      // fallback: count via a plain grouped query
      const { data: modLessons } = await context.supabase
        .from("course_modules")
        .select("course_id, course_topics(course_lessons(id, is_published))")
        .in("course_id", courseIds);
      for (const m of modLessons ?? []) {
        const cid = (m as any).course_id;
        for (const t of ((m as any).course_topics ?? []) as any[]) {
          for (const l of (t.course_lessons ?? []) as any[]) {
            if (l.is_published) totalPerCourse[cid] = (totalPerCourse[cid] ?? 0) + 1;
          }
        }
      }
      const donePerCourse: Record<string, number> = {};
      for (const d of done ?? []) donePerCourse[d.course_id] = (donePerCourse[d.course_id] ?? 0) + 1;
      for (const cid of courseIds) {
        const t = totalPerCourse[cid] || 0;
        progressPct[cid] = t > 0 ? Math.round(((donePerCourse[cid] ?? 0) / t) * 100) : 0;
      }
      for (const c of courses ?? []) courseMeta[c.id] = { name: c.name, slug: c.slug, thumbnail_url: c.thumbnail_url };
    }

    const active = enrs.filter((e) => e.lms_status === "active").length;
    const completed = enrs.filter((e) => e.lms_status === "completed").length;
    const avgProgress =
      enrs.length === 0
        ? 0
        : Math.round(
            enrs.reduce((s, e) => s + (progressPct[e.course_id ?? ""] ?? 0), 0) / enrs.length,
          );

    // Continue learning: last accessed active enrollment; if none, first active
    const cont = enrs.find((e) => e.lms_status === "active" && e.last_accessed_at) ??
      enrs.find((e) => e.lms_status === "active") ?? null;
    const continueCourse = cont && cont.course_id ? courseMeta[cont.course_id] ?? null : null;

    return {
      kpis: {
        active,
        completed,
        avgProgress,
        certificates: (certificates ?? []).length,
      },
      enrollments: enrs.map((e) => ({
        ...e,
        course: e.course_id ? courseMeta[e.course_id] ?? null : null,
        progress: progressPct[e.course_id ?? ""] ?? 0,
      })),
      recentActivity: activity ?? [],
      continueLearning: continueCourse ? { ...continueCourse, enrollmentId: cont!.id } : null,
    };
  });

/* ============================================================
 * MY COURSES
 * ============================================================ */

export const listMyCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: enrs } = await context.supabase
      .from("enrollments")
      .select("id, course_id, program_title, lms_status, enrolled_at, last_accessed_at, completed_at")
      .eq("student_user_id", context.userId)
      .order("enrolled_at", { ascending: false });

    const ids = Array.from(new Set((enrs ?? []).map((e) => e.course_id).filter(Boolean))) as string[];
    if (!ids.length) return [] as any[];

    const [{ data: courses }, { data: mods }, { data: done }] = await Promise.all([
      context.supabase
        .from("courses")
        .select("id, name, slug, thumbnail_url, short_description, level, duration, course_categories(name, slug)")
        .in("id", ids),
      context.supabase
        .from("course_modules")
        .select("course_id, course_topics(course_lessons(id, is_published))")
        .in("course_id", ids),
      context.supabase
        .from("lesson_progress")
        .select("course_id, lesson_id, status")
        .eq("student_user_id", context.userId)
        .eq("status", "completed")
        .in("course_id", ids),
    ]);

    const totalMap: Record<string, number> = {};
    for (const m of mods ?? []) {
      const cid = (m as any).course_id;
      for (const t of ((m as any).course_topics ?? []) as any[])
        for (const l of ((t.course_lessons ?? []) as any[]))
          if (l.is_published) totalMap[cid] = (totalMap[cid] ?? 0) + 1;
    }
    const doneMap: Record<string, number> = {};
    for (const d of done ?? []) doneMap[d.course_id] = (doneMap[d.course_id] ?? 0) + 1;
    const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));

    return (enrs ?? []).map((e) => {
      const c = e.course_id ? courseMap.get(e.course_id) : null;
      const total = totalMap[e.course_id ?? ""] ?? 0;
      const doneCt = doneMap[e.course_id ?? ""] ?? 0;
      return {
        enrollmentId: e.id,
        courseId: e.course_id,
        title: c?.name ?? e.program_title,
        slug: c?.slug ?? null,
        thumbnail: c?.thumbnail_url ?? null,
        description: c?.short_description ?? null,
        level: c?.level ?? null,
        duration: c?.duration ?? null,
        category: (c as any)?.course_categories?.name ?? null,
        status: e.lms_status as "active" | "completed" | "paused",
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at,
        progress: total > 0 ? Math.round((doneCt / total) * 100) : 0,
        totalLessons: total,
        completedLessons: doneCt,
      };
    });
  });

/* ============================================================
 * LMS PLAYER — curriculum + progress for a specific course
 * ============================================================ */

export const getCoursePlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { slug: string; lessonId?: string }) => data)
  .handler(async ({ data, context }) => {
    // Course must exist & be published
    const { data: course } = await context.supabase
      .from("courses")
      .select("id, name, slug, short_description, thumbnail_url")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!course) throw new Error("Course not found");

    // Enrollment check
    const { data: enrollment } = await context.supabase
      .from("enrollments")
      .select("id, lms_status")
      .eq("student_user_id", context.userId)
      .eq("course_id", course.id)
      .maybeSingle();
    if (!enrollment) throw new Error("Not enrolled");

    const [{ data: modules }, { data: progress }] = await Promise.all([
      context.supabase
        .from("course_modules")
        .select("id, name, display_order, course_topics(id, name, display_order, course_lessons(id, name, lesson_type, duration, is_free_preview, is_published, resource_url, display_order))")
        .eq("course_id", course.id)
        .eq("is_published", true)
        .order("display_order"),
      context.supabase
        .from("lesson_progress")
        .select("lesson_id, status, completed_at, last_accessed_at")
        .eq("student_user_id", context.userId)
        .eq("course_id", course.id),
    ]);

    const progressMap = new Map((progress ?? []).map((p) => [p.lesson_id, p]));
    const flatLessons: { id: string; moduleId: string; moduleName: string; topicId: string; name: string; type: string; content: any; resource_url: string | null; duration: string | null }[] = [];

    const cleaned = (modules ?? []).map((m: any) => {
      const topics = (m.course_topics ?? [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((t: any) => {
          const lessons = (t.course_lessons ?? [])
            .filter((l: any) => l.is_published)
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((l: any) => {
              flatLessons.push({
                id: l.id, moduleId: m.id, moduleName: m.name,
                topicId: t.id, name: l.name, type: l.lesson_type, content: null,
                resource_url: l.resource_url, duration: l.duration,
              });
              const p = progressMap.get(l.id);
              return {
                id: l.id,
                name: l.name,
                type: l.lesson_type,
                duration: l.duration,
                resource_url: l.resource_url,
                status: p?.status ?? "not_started",
                completed_at: p?.completed_at ?? null,
              };
            });
          return { id: t.id, name: t.name, lessons };
        });
      return { id: m.id, name: m.name, topics };
    });

    // Determine current lesson
    let currentIndex = 0;
    if (data.lessonId) {
      const i = flatLessons.findIndex((l) => l.id === data.lessonId);
      if (i >= 0) currentIndex = i;
    } else {
      // last accessed incomplete, else first
      const lastAccessed = (progress ?? [])
        .filter((p) => p.status !== "completed")
        .sort((a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime())[0];
      const target = lastAccessed?.lesson_id ?? flatLessons[0]?.id;
      const i = flatLessons.findIndex((l) => l.id === target);
      if (i >= 0) currentIndex = i;
    }

    const current = flatLessons[currentIndex] ?? null;
    const prev = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
    const next = currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;
    const currentStatus = current ? progressMap.get(current.id)?.status ?? "not_started" : "not_started";

    const total = flatLessons.length;
    const completed = (progress ?? []).filter((p) => p.status === "completed").length;

    return {
      course,
      enrollmentId: enrollment.id,
      lmsStatus: enrollment.lms_status,
      modules: cleaned,
      current: current ? { ...current, status: currentStatus } : null,
      prev,
      next,
      totalLessons: total,
      completedLessons: completed,
      progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

/* ============================================================
 * LESSON PROGRESS
 * ============================================================ */

export const openLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lessonId: string; courseId: string; enrollmentId: string }) => data)
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    // Upsert lesson_progress
    const { data: existing } = await context.supabase
      .from("lesson_progress")
      .select("id, status")
      .eq("student_user_id", context.userId)
      .eq("lesson_id", data.lessonId)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("lesson_progress").update({ last_accessed_at: now }).eq("id", existing.id);
    } else {
      await context.supabase.from("lesson_progress").insert({
        student_user_id: context.userId,
        enrollment_id: data.enrollmentId,
        course_id: data.courseId,
        lesson_id: data.lessonId,
        status: "in_progress",
      });
    }
    await context.supabase
      .from("enrollments")
      .update({ last_accessed_at: now })
      .eq("id", data.enrollmentId)
      .eq("student_user_id", context.userId);
    return { ok: true };
  });

export const completeLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lessonId: string; courseId: string; enrollmentId: string; lessonName?: string }) => data)
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const { data: existing } = await context.supabase
      .from("lesson_progress")
      .select("id, status")
      .eq("student_user_id", context.userId)
      .eq("lesson_id", data.lessonId)
      .maybeSingle();
    if (existing && existing.status === "completed") return { ok: true, alreadyDone: true };
    if (existing) {
      await context.supabase.from("lesson_progress").update({
        status: "completed", completed_at: now, last_accessed_at: now,
      }).eq("id", existing.id);
    } else {
      await context.supabase.from("lesson_progress").insert({
        student_user_id: context.userId,
        enrollment_id: data.enrollmentId,
        course_id: data.courseId,
        lesson_id: data.lessonId,
        status: "completed",
        completed_at: now,
      });
    }
    await context.supabase.from("student_activity").insert({
      student_user_id: context.userId,
      course_id: data.courseId,
      activity_type: "lesson_completed",
      description: `Completed lesson: ${data.lessonName ?? "Lesson"}`,
      entity_id: data.lessonId,
    });
    // Try to auto-complete the course
    await tryCompleteCourse(context, data.enrollmentId, data.courseId);
    return { ok: true };
  });

async function tryCompleteCourse(context: any, enrollmentId: string, courseId: string) {
  const { data: enr } = await context.supabase
    .from("enrollments")
    .select("id, lms_status, student_user_id")
    .eq("id", enrollmentId)
    .maybeSingle();
  if (!enr || enr.lms_status === "completed") return;

  const { data: reqs } = await context.supabase
    .from("course_completion_requirements")
    .select("*")
    .eq("course_id", courseId)
    .maybeSingle();
  const require_lessons = reqs?.require_lessons ?? true;
  const require_assignments = reqs?.require_assignments ?? false;
  const require_assessments = reqs?.require_assessments ?? false;
  const minPct = Number(reqs?.min_lesson_completion_pct ?? 100);

  // Lessons
  if (require_lessons) {
    const { data: mods } = await context.supabase
      .from("course_modules")
      .select("id, course_topics(course_lessons(id, is_published))")
      .eq("course_id", courseId)
      .eq("is_published", true);
    let total = 0;
    for (const m of mods ?? [])
      for (const t of ((m as any).course_topics ?? []) as any[])
        for (const l of (t.course_lessons ?? []) as any[])
          if (l.is_published) total++;
    const { count: doneCount } = await context.supabase
      .from("lesson_progress")
      .select("*", { count: "exact", head: true })
      .eq("student_user_id", context.userId)
      .eq("course_id", courseId)
      .eq("status", "completed");
    const pct = total > 0 ? ((doneCount ?? 0) / total) * 100 : 0;
    if (total === 0 || pct < minPct) return;
  }
  // Assignments
  if (require_assignments) {
    const { data: assigns } = await context.supabase
      .from("course_assignments")
      .select("id")
      .eq("course_id", courseId)
      .eq("is_required", true)
      .eq("is_published", true);
    const ids = (assigns ?? []).map((a: any) => a.id);
    if (ids.length) {
      const { data: subs } = await context.supabase
        .from("assignment_submissions")
        .select("assignment_id, status")
        .eq("student_user_id", context.userId)
        .in("assignment_id", ids);
      const approved = new Set((subs ?? []).filter((s: any) => s.status === "approved").map((s: any) => s.assignment_id));
      if (approved.size < ids.length) return;
    }
  }
  // Assessments
  if (require_assessments) {
    const { data: asx } = await context.supabase
      .from("course_assessments")
      .select("id")
      .eq("course_id", courseId)
      .eq("is_required", true)
      .eq("is_published", true);
    const ids = (asx ?? []).map((a: any) => a.id);
    if (ids.length) {
      const { data: attempts } = await context.supabase
        .from("assessment_attempts")
        .select("assessment_id, passed")
        .eq("student_user_id", context.userId)
        .in("assessment_id", ids);
      const passed = new Set((attempts ?? []).filter((a: any) => a.passed).map((a: any) => a.assessment_id));
      if (passed.size < ids.length) return;
    }
  }

  // Mark completed
  await context.supabase
    .from("enrollments")
    .update({ lms_status: "completed", completed_at: new Date().toISOString() })
    .eq("id", enrollmentId);

  // Course info for cert
  const { data: course } = await context.supabase
    .from("courses").select("id, name").eq("id", courseId).maybeSingle();
  const { data: user } = await context.supabase.auth.getUser();
  const studentName =
    (user.user?.user_metadata as any)?.full_name ||
    (user.user?.user_metadata as any)?.name ||
    (user.user?.email?.split("@")[0]) || "Student";

  await context.supabase.from("student_activity").insert({
    student_user_id: context.userId,
    course_id: courseId,
    activity_type: "course_completed",
    description: `Completed course: ${course?.name ?? ""}`,
    entity_id: enrollmentId,
  });

  // Issue certificate if not already present
  const { data: existingCert } = await context.supabase
    .from("certificates").select("id")
    .eq("student_user_id", context.userId).eq("course_id", courseId).maybeSingle();
  if (!existingCert) {
    const rand = () => Math.random().toString(36).slice(2, 8).toUpperCase();
    const certNum = `GLNT-${new Date().getFullYear()}-${rand()}-${rand()}`;
    const verify = `${rand()}${rand()}${rand()}`;
    const type = reqs?.certificate_type ?? "Course Completion Certificate";
    const { data: cert } = await context.supabase.from("certificates").insert({
      student_user_id: context.userId,
      enrollment_id: enrollmentId,
      course_id: courseId,
      student_name: studentName,
      course_name: course?.name ?? "Course",
      certificate_number: certNum,
      verification_code: verify,
      certificate_type: type,
    }).select("id").maybeSingle();
    await context.supabase.from("student_activity").insert({
      student_user_id: context.userId,
      course_id: courseId,
      activity_type: "certificate_issued",
      description: `Certificate issued: ${certNum}`,
      entity_id: cert?.id,
    });
  }
}

/* ============================================================
 * ASSIGNMENTS
 * ============================================================ */

export const listStudentAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Fetch published assignments across courses the student is enrolled in
    const { data: enrs } = await context.supabase
      .from("enrollments")
      .select("id, course_id")
      .eq("student_user_id", context.userId)
      .not("course_id", "is", null);
    const courseIds = Array.from(new Set((enrs ?? []).map((e) => e.course_id!).filter(Boolean)));
    if (!courseIds.length) return [];

    const [{ data: assigns }, { data: subs }, { data: courses }] = await Promise.all([
      context.supabase
        .from("course_assignments")
        .select("id, course_id, name, description, due_days, allow_text, allow_file, is_required, display_order")
        .in("course_id", courseIds)
        .eq("is_published", true)
        .order("display_order"),
      context.supabase
        .from("assignment_submissions")
        .select("id, assignment_id, status, submitted_at, reviewer_feedback, submission_text, file_url, submission_notes")
        .eq("student_user_id", context.userId),
      context.supabase.from("courses").select("id, name, slug").in("id", courseIds),
    ]);

    const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
    const subMap = new Map<string, any>();
    for (const s of subs ?? []) subMap.set(s.assignment_id, s);

    return (assigns ?? []).map((a: any) => ({
      ...a,
      course: courseMap.get(a.course_id) ?? null,
      submission: subMap.get(a.id) ?? null,
      status: subMap.get(a.id)?.status ?? "not_started",
    }));
  });

export const submitAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { assignmentId: string; text?: string; fileUrl?: string; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: a } = await context.supabase
      .from("course_assignments").select("id, name, course_id").eq("id", data.assignmentId).maybeSingle();
    if (!a) throw new Error("Assignment not found");

    const { data: existing } = await context.supabase
      .from("assignment_submissions")
      .select("id, status")
      .eq("student_user_id", context.userId)
      .eq("assignment_id", data.assignmentId)
      .maybeSingle();

    const payload = {
      submission_text: data.text ?? null,
      file_url: data.fileUrl ?? null,
      submission_notes: data.notes ?? null,
      status: "submitted" as const,
      submitted_at: new Date().toISOString(),
    };

    if (existing) {
      if (existing.status === "approved" || existing.status === "under_review") throw new Error("Cannot edit locked submission");
      await context.supabase.from("assignment_submissions").update(payload).eq("id", existing.id);
    } else {
      const { data: enr } = await context.supabase
        .from("enrollments").select("id").eq("student_user_id", context.userId).eq("course_id", a.course_id).maybeSingle();
      await context.supabase.from("assignment_submissions").insert({
        ...payload,
        student_user_id: context.userId,
        assignment_id: data.assignmentId,
        course_id: a.course_id,
        enrollment_id: enr?.id ?? null,
      });
    }
    await context.supabase.from("student_activity").insert({
      student_user_id: context.userId,
      course_id: a.course_id,
      activity_type: "assignment_submitted",
      description: `Submitted assignment: ${a.name}`,
      entity_id: data.assignmentId,
    });
    return { ok: true };
  });

/* ============================================================
 * ASSESSMENTS
 * ============================================================ */

export const listStudentAssessments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: enrs } = await context.supabase
      .from("enrollments").select("course_id").eq("student_user_id", context.userId).not("course_id", "is", null);
    const cids = Array.from(new Set((enrs ?? []).map((e) => e.course_id!).filter(Boolean)));
    if (!cids.length) return [];
    const [{ data: asx }, { data: attempts }, { data: courses }] = await Promise.all([
      context.supabase
        .from("course_assessments")
        .select("id, course_id, name, description, pass_percentage, is_required")
        .in("course_id", cids).eq("is_published", true).order("display_order"),
      context.supabase
        .from("assessment_attempts")
        .select("id, assessment_id, status, score, max_score, percentage, passed, submitted_at")
        .eq("student_user_id", context.userId),
      context.supabase.from("courses").select("id, name, slug").in("id", cids),
    ]);
    const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
    const bestAttempt = new Map<string, any>();
    for (const a of attempts ?? []) {
      if (a.status !== "submitted") continue;
      const prev = bestAttempt.get(a.assessment_id);
      if (!prev || (a.percentage ?? 0) > (prev.percentage ?? 0)) bestAttempt.set(a.assessment_id, a);
    }
    return (asx ?? []).map((a: any) => ({
      ...a,
      course: courseMap.get(a.course_id) ?? null,
      bestAttempt: bestAttempt.get(a.id) ?? null,
    }));
  });

export const startAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { assessmentId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: a } = await context.supabase
      .from("course_assessments").select("id, name, course_id, pass_percentage, time_limit_minutes")
      .eq("id", data.assessmentId).maybeSingle();
    if (!a) throw new Error("Assessment not found");
    const { data: qs } = await context.supabase
      .from("assessment_questions")
      .select("id, question_type, question_text, options, points, display_order")
      .eq("assessment_id", data.assessmentId)
      .order("display_order");
    const { data: enr } = await context.supabase
      .from("enrollments").select("id").eq("student_user_id", context.userId).eq("course_id", a.course_id).maybeSingle();
    const { data: attempt } = await context.supabase.from("assessment_attempts").insert({
      assessment_id: data.assessmentId,
      student_user_id: context.userId,
      course_id: a.course_id,
      enrollment_id: enr?.id ?? null,
      status: "in_progress",
    }).select("id, started_at").maybeSingle();
    return { assessment: a, questions: qs ?? [], attempt };
  });

export const submitAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { attemptId: string; answers: Record<string, string[]> }) => d)
  .handler(async ({ data, context }) => {
    const { data: attempt } = await context.supabase
      .from("assessment_attempts")
      .select("id, assessment_id, course_id, enrollment_id, student_user_id, status")
      .eq("id", data.attemptId).maybeSingle();
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.student_user_id !== context.userId) throw new Error("Forbidden");
    if (attempt.status === "submitted") throw new Error("Already submitted");

    const { data: a } = await context.supabase
      .from("course_assessments").select("id, name, pass_percentage").eq("id", attempt.assessment_id).maybeSingle();
    const { data: qs } = await context.supabase
      .from("assessment_questions").select("id, question_type, correct_answers, points")
      .eq("assessment_id", attempt.assessment_id);

    let score = 0;
    let max = 0;
    for (const q of qs ?? []) {
      const pts = Number(q.points ?? 1);
      max += pts;
      const correct = ((q.correct_answers ?? []) as string[]).map(String).sort();
      const given = (data.answers[q.id] ?? []).map(String).sort();
      const eq = correct.length === given.length && correct.every((v, i) => v === given[i]);
      if (eq) score += pts;
    }
    const pct = max > 0 ? Math.round((score / max) * 10000) / 100 : 0;
    const passed = pct >= Number(a?.pass_percentage ?? 60);

    await context.supabase.from("assessment_attempts").update({
      answers: data.answers,
      score, max_score: max, percentage: pct, passed,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    }).eq("id", data.attemptId);

    await context.supabase.from("student_activity").insert({
      student_user_id: context.userId,
      course_id: attempt.course_id,
      activity_type: "assessment_completed",
      description: `${passed ? "Passed" : "Attempted"} assessment: ${a?.name ?? ""} (${pct}%)`,
      entity_id: attempt.assessment_id,
    });

    if (passed) await tryCompleteCourse(context, attempt.enrollment_id!, attempt.course_id);

    return { score, max, percentage: pct, passed };
  });

/* ============================================================
 * CERTIFICATES
 * ============================================================ */

export const listMyCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("certificates")
      .select("id, course_id, course_name, student_name, certificate_number, verification_code, certificate_type, completion_date, issued_at")
      .eq("student_user_id", context.userId)
      .order("issued_at", { ascending: false });
    return data ?? [];
  });

export const getMyCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: cert } = await context.supabase
      .from("certificates")
      .select("*")
      .eq("id", data.id)
      .eq("student_user_id", context.userId)
      .maybeSingle();
    if (!cert) throw new Error("Certificate not found");
    return cert;
  });

/* ============================================================
 * MY PROGRAMS (LMS student-facing)
 * ============================================================ */

function deriveProgramStatus(lmsStatus: string | null, completedLessons: number, totalLessons: number):
  "not_started" | "in_progress" | "completed" | "access_suspended" | "access_expired" {
  const s = (lmsStatus ?? "").toLowerCase();
  if (s === "completed") return "completed";
  if (s === "suspended" || s === "paused") return "access_suspended";
  if (s === "expired" || s === "revoked" || s === "cancelled") return "access_expired";
  if (totalLessons > 0 && completedLessons >= totalLessons) return "completed";
  if (completedLessons > 0) return "in_progress";
  return "not_started";
}

export const listMyPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: enrs } = await context.supabase
      .from("enrollments")
      .select("id, course_id, program_title, lms_status, enrolled_at, last_accessed_at, completed_at")
      .eq("student_user_id", context.userId)
      .order("enrolled_at", { ascending: false });

    const ids = Array.from(new Set((enrs ?? []).map((e) => e.course_id).filter(Boolean))) as string[];
    if (!ids.length) return [] as any[];

    const [{ data: courses }, { data: mods }, { data: done }, { data: certs }] = await Promise.all([
      context.supabase
        .from("courses")
        .select("id, name, slug, thumbnail_url, short_description, level, duration, learning_mode, course_categories(name, slug)")
        .in("id", ids),
      context.supabase
        .from("course_modules")
        .select("id, course_id, name, display_order, course_topics(course_lessons(id, is_published))")
        .in("course_id", ids)
        .eq("is_published", true)
        .order("display_order"),
      context.supabase
        .from("lesson_progress")
        .select("course_id, lesson_id, status, last_accessed_at")
        .eq("student_user_id", context.userId)
        .in("course_id", ids),
      context.supabase
        .from("certificates")
        .select("id, course_id, issued_at, revoked_at")
        .eq("student_user_id", context.userId)
        .in("course_id", ids),
    ]);

    // total lessons & module count per course, and current module (first module with incomplete lessons)
    const totalMap: Record<string, number> = {};
    const modulesByCourse: Record<string, Array<{ id: string; name: string; order: number; lessonIds: string[] }>> = {};
    for (const m of mods ?? []) {
      const cid = (m as any).course_id;
      const lessonIds: string[] = [];
      for (const t of ((m as any).course_topics ?? []) as any[])
        for (const l of (t.course_lessons ?? []) as any[])
          if (l.is_published) { totalMap[cid] = (totalMap[cid] ?? 0) + 1; lessonIds.push(l.id); }
      (modulesByCourse[cid] ??= []).push({ id: (m as any).id, name: (m as any).name, order: (m as any).display_order ?? 0, lessonIds });
    }
    const doneMap: Record<string, Set<string>> = {};
    for (const d of done ?? []) {
      if (d.status !== "completed") continue;
      (doneMap[d.course_id] ??= new Set()).add(d.lesson_id);
    }
    const certMap = new Map(
      (certs ?? []).filter((c: any) => !c.revoked_at).map((c: any) => [c.course_id, c])
    );
    const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));

    return (enrs ?? []).map((e) => {
      const c: any = e.course_id ? courseMap.get(e.course_id) : null;
      const total = totalMap[e.course_id ?? ""] ?? 0;
      const completedSet = doneMap[e.course_id ?? ""] ?? new Set<string>();
      const completedLessons = completedSet.size;
      const mods = modulesByCourse[e.course_id ?? ""] ?? [];
      mods.sort((a, b) => a.order - b.order);
      const currentModule =
        mods.find((m) => m.lessonIds.some((id) => !completedSet.has(id))) ?? mods[mods.length - 1] ?? null;
      const status = deriveProgramStatus(e.lms_status, completedLessons, total);
      const cert = e.course_id ? certMap.get(e.course_id) : null;
      return {
        enrollmentId: e.id,
        courseId: e.course_id,
        title: c?.name ?? e.program_title ?? "Program",
        slug: c?.slug ?? null,
        thumbnail: c?.thumbnail_url ?? null,
        description: c?.short_description ?? null,
        level: c?.level ?? null,
        duration: c?.duration ?? null,
        learningMode: c?.learning_mode ?? null,
        category: c?.course_categories?.name ?? null,
        rawLmsStatus: e.lms_status,
        status,
        enrolledAt: e.enrolled_at,
        lastAccessedAt: e.last_accessed_at,
        completedAt: e.completed_at,
        progress: total > 0 ? Math.round((completedLessons / total) * 100) : 0,
        totalLessons: total,
        completedLessons,
        totalModules: mods.length,
        currentModule: currentModule ? { id: currentModule.id, name: currentModule.name } : null,
        certificate: cert ? { id: cert.id, issuedAt: cert.issued_at } : null,
      };
    });
  });

export const getMyProgramDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: course } = await context.supabase
      .from("courses")
      .select("id, name, slug, description, short_description, thumbnail_url, level, duration, learning_mode, course_categories(name)")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!course) throw new Error("Program not found");

    const { data: enrollment } = await context.supabase
      .from("enrollments")
      .select("id, lms_status, enrolled_at, completed_at, last_accessed_at")
      .eq("student_user_id", context.userId)
      .eq("course_id", course.id)
      .maybeSingle();
    if (!enrollment) throw new Error("You are not enrolled in this program");

    const [{ data: modules }, { data: progress }, { data: assignSubs }, { data: projSubs }, { data: cert }] = await Promise.all([
      context.supabase
        .from("course_modules")
        .select("id, name, description, display_order, course_topics(id, name, display_order, course_lessons(id, name, lesson_type, duration, is_published, display_order))")
        .eq("course_id", course.id)
        .eq("is_published", true)
        .order("display_order"),
      context.supabase
        .from("lesson_progress")
        .select("lesson_id, status, last_accessed_at")
        .eq("student_user_id", context.userId)
        .eq("course_id", course.id),
      context.supabase
        .from("assignment_submissions")
        .select("id, status, assignment_id")
        .eq("student_user_id", context.userId)
        .eq("course_id", course.id),
      context.supabase
        .from("course_projects")
        .select("id")
        .eq("course_id", course.id),
      context.supabase
        .from("certificates")
        .select("id, issued_at, revoked_at")
        .eq("student_user_id", context.userId)
        .eq("course_id", course.id)
        .maybeSingle(),
    ]);

    const progressMap = new Map((progress ?? []).map((p: any) => [p.lesson_id, p.status]));
    let totalLessons = 0;
    let completedLessons = 0;
    const cleanedModules = ((modules ?? []) as any[]).map((m, mi) => {
      const topics = (m.course_topics ?? [])
        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
      const lessons: any[] = [];
      for (const t of topics) {
        const ls = (t.course_lessons ?? [])
          .filter((l: any) => l.is_published)
          .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
        for (const l of ls) {
          totalLessons++;
          const st = progressMap.get(l.id) ?? "not_started";
          if (st === "completed") completedLessons++;
          lessons.push({
            id: l.id,
            name: l.name,
            type: l.lesson_type,
            duration: l.duration,
            topic: t.name,
            status: st, // not_started | in_progress | completed
          });
        }
      }
      const moduleCompleted = lessons.filter((l) => l.status === "completed").length;
      return {
        id: m.id,
        number: mi + 1,
        name: m.name,
        description: m.description,
        totalLessons: lessons.length,
        completedLessons: moduleCompleted,
        lessons,
      };
    });

    const completedModules = cleanedModules.filter((m) => m.totalLessons > 0 && m.completedLessons === m.totalLessons).length;
    const assignmentsCompleted = ((assignSubs ?? []) as any[]).filter((s) => ["submitted", "reviewed", "approved", "graded", "accepted"].includes((s.status ?? "").toLowerCase())).length;

    const status = deriveProgramStatus(enrollment.lms_status, completedLessons, totalLessons);
    const accessBlocked = status === "access_suspended" || status === "access_expired";

    return {
      program: {
        id: course.id,
        name: course.name,
        slug: course.slug,
        description: course.description ?? course.short_description,
        thumbnail: course.thumbnail_url,
        level: (course as any).level,
        duration: (course as any).duration,
        learningMode: (course as any).learning_mode,
        category: (course as any).course_categories?.name ?? null,
      },
      enrollment: {
        id: enrollment.id,
        enrolledAt: enrollment.enrolled_at,
        completedAt: enrollment.completed_at,
        lastAccessedAt: enrollment.last_accessed_at,
      },
      status,
      accessBlocked,
      progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      totalLessons,
      completedLessons,
      totalModules: cleanedModules.length,
      completedModules,
      assignmentsCompleted,
      projectsAvailable: (projSubs ?? []).length,
      modules: cleanedModules,
      certificate: cert && !cert.revoked_at ? { id: cert.id, issuedAt: cert.issued_at } : null,
    };
  });

export const recordProgramActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    courseId: string;
    activity: "program_started" | "program_opened" | "module_opened" | "lesson_opened";
    entityId?: string;
    description?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    // Verify enrollment before writing activity
    const { data: enr } = await context.supabase
      .from("enrollments")
      .select("id")
      .eq("student_user_id", context.userId)
      .eq("course_id", data.courseId)
      .maybeSingle();
    if (!enr) throw new Error("Not enrolled");

    // Deduplicate: don't log identical activity within a 5-minute window
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recent } = await context.supabase
      .from("student_activity")
      .select("id")
      .eq("student_user_id", context.userId)
      .eq("course_id", data.courseId)
      .eq("activity_type", data.activity)
      .gte("created_at", fiveMinAgo)
      .limit(1);
    if (recent && recent.length) return { ok: true, deduped: true };

    await context.supabase.from("student_activity").insert({
      student_user_id: context.userId,
      course_id: data.courseId,
      activity_type: data.activity,
      description: data.description ?? null,
      entity_id: data.entityId ?? null,
    });
    return { ok: true };
  });
