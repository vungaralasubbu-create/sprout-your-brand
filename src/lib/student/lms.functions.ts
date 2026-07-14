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
    const { data: course } = await context.supabase
      .from("courses")
      .select("id, name, slug, short_description, thumbnail_url, unlock_mode")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!course) throw new Error("Course not found");

    const { data: enrollment } = await context.supabase
      .from("enrollments")
      .select("id, lms_status, current_lesson_id")
      .eq("student_user_id", context.userId)
      .eq("course_id", course.id)
      .maybeSingle();
    if (!enrollment) throw new Error("Not enrolled");

    const [{ data: reqs }, snap] = await Promise.all([
      context.supabase
        .from("course_completion_requirements")
        .select("min_lesson_completion_pct")
        .eq("course_id", course.id)
        .maybeSingle(),
      computeCourseProgress(context, course.id, context.userId),
    ]);

    // Flat list of unlocked lessons (curriculum order) for prev/next
    const flat = snap.modules.flatMap((m) => m.lessons);

    // Determine current lesson:
    // 1) explicit lessonId (only if unlocked)
    // 2) enrollment.current_lesson_id (if unlocked)
    // 3) nextLesson (first unlocked incomplete)
    // 4) first unlocked lesson
    function pick(id: string | null | undefined) {
      if (!id) return null;
      const l = flat.find((x) => x.id === id);
      return l && l.unlocked ? l : null;
    }
    const explicit = pick(data.lessonId);
    if (data.lessonId && !explicit) {
      // Requested a locked/unknown lesson → tell the client so it can redirect
      const target = snap.nextLesson ?? flat.find((l) => l.unlocked) ?? null;
      if (target && target.id !== data.lessonId) {
        throw new Error("LESSON_LOCKED");
      }
    }
    const current =
      explicit ??
      pick((enrollment as any).current_lesson_id) ??
      snap.nextLesson ??
      flat.find((l) => l.unlocked) ??
      null;

    const currentIndex = current ? flat.findIndex((l) => l.id === current.id) : -1;
    const prev = currentIndex > 0 ? flat[currentIndex - 1] : null;
    const next = currentIndex >= 0 && currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null;
    const currentModule = current ? snap.modules.find((m) => m.id === current.moduleId) : null;

    // Curriculum with lesson unlock/status/isRequired baked in
    const modules = snap.modules.map((m) => ({
      id: m.id,
      number: m.number,
      name: m.name,
      description: m.description,
      isRequired: m.isRequired,
      unlocked: m.unlocked,
      status: m.status,
      totalLessons: m.totalLessons,
      completedLessons: m.completedLessons,
      totalRequired: m.totalRequired,
      completedRequired: m.completedRequired,
      progressPct: m.progressPct,
      completedAt: m.completedAt,
      topics: m.topics.map((t) => ({
        id: t.id,
        name: t.name,
        lessons: t.lessons.map((l) => ({
          id: l.id,
          name: l.name,
          type: l.type,
          duration: l.duration,
          resource_url: l.resource_url,
          isRequired: l.isRequired,
          unlocked: l.unlocked,
          status: l.status,
          completed_at: l.completed_at,
          video_progress_pct: l.video_progress_pct,
        })),
      })),
    }));

    return {
      course: {
        id: (course as any).id,
        name: (course as any).name,
        slug: (course as any).slug,
        short_description: (course as any).short_description,
        thumbnail_url: (course as any).thumbnail_url,
      },
      enrollmentId: enrollment.id,
      lmsStatus: enrollment.lms_status,
      unlockMode: snap.unlockMode,
      videoCompletionThresholdPct: Math.max(1, Math.min(100, Number(reqs?.min_lesson_completion_pct ?? 90))),
      modules,
      current: current
        ? {
            id: current.id,
            moduleId: current.moduleId,
            moduleName: currentModule?.name ?? "",
            moduleNumber: currentModule?.number ?? 1,
            topicId: current.topicId,
            name: current.name,
            type: current.type,
            description: current.description,
            content: current.content,
            resource_url: current.resource_url,
            duration: current.duration,
            isRequired: current.isRequired,
            unlocked: current.unlocked,
            status: current.status,
            video_progress_pct: current.video_progress_pct,
            last_position_seconds: current.last_position_seconds,
            position: currentIndex + 1,
          }
        : null,
      prev: prev ? { id: prev.id, name: prev.name, unlocked: prev.unlocked } : null,
      next: next ? { id: next.id, name: next.name, unlocked: next.unlocked } : null,
      totalLessons: snap.totals.totalLessons,
      completedLessons: snap.totals.completedLessons,
      totalRequiredLessons: snap.totals.totalRequiredLessons,
      completedRequiredLessons: snap.totals.completedRequiredLessons,
      progressPct: snap.totals.progressPct,
      isContentCompleted: snap.totals.isContentCompleted,
      contentCompletedAt: snap.totals.contentCompletedAt,
    };
  });



/* ============================================================
 * CANONICAL PROGRESS + UNLOCK ENGINE
 * ============================================================ */

/**
 * The single source of truth for module / lesson / program progress.
 * Every LMS surface (dashboard, my programs, program details, player,
 * curriculum sidebar) MUST route through this helper so they display the
 * same numbers.
 */
async function computeCourseProgress(
  context: any,
  courseId: string,
  userId: string,
) {
  const [{ data: course }, { data: modules }, { data: progress }, { data: modCompletions }, { data: contentCompletion }] =
    await Promise.all([
      context.supabase
        .from("courses")
        .select("id, unlock_mode")
        .eq("id", courseId)
        .maybeSingle(),
      context.supabase
        .from("course_modules")
        .select(
          "id, name, description, display_order, is_published, is_required, course_topics(id, name, display_order, course_lessons(id, name, lesson_type, duration, is_published, is_required, resource_url, description, content, display_order, is_free_preview))",
        )
        .eq("course_id", courseId)
        .eq("is_published", true)
        .order("display_order"),
      context.supabase
        .from("lesson_progress")
        .select("lesson_id, status, completed_at, last_accessed_at, video_progress_pct, last_position_seconds")
        .eq("student_user_id", userId)
        .eq("course_id", courseId),
      context.supabase
        .from("module_completions")
        .select("module_id, completed_at")
        .eq("student_user_id", userId)
        .eq("course_id", courseId),
      context.supabase
        .from("program_content_completions")
        .select("completed_at")
        .eq("student_user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle(),
    ]);

  const unlockMode: "sequential" | "open" =
    ((course as any)?.unlock_mode as "sequential" | "open") ?? "sequential";
  const progressMap = new Map((progress ?? []).map((p: any) => [p.lesson_id, p]));
  const moduleCompletionMap = new Map(
    (modCompletions ?? []).map((m: any) => [m.module_id, m.completed_at]),
  );

  type Lesson = {
    id: string;
    moduleId: string;
    topicId: string;
    topicName: string | null;
    name: string;
    type: string;
    duration: string | null;
    resource_url: string | null;
    description: string | null;
    content: string | null;
    isRequired: boolean;
    isFreePreview: boolean;
    status: "not_started" | "in_progress" | "completed";
    completed_at: string | null;
    last_accessed_at: string | null;
    video_progress_pct: number;
    last_position_seconds: number;
    unlocked: boolean;
    position: number;
  };
  type Module = {
    id: string;
    number: number;
    name: string;
    description: string | null;
    isRequired: boolean;
    unlocked: boolean;
    status: "locked" | "available" | "in_progress" | "completed";
    lessons: Lesson[];
    topics: Array<{ id: string; name: string | null; lessons: Lesson[] }>;
    totalLessons: number;
    completedLessons: number;
    totalRequired: number;
    completedRequired: number;
    progressPct: number;
    completedAt: string | null;
  };

  const cleaned: Module[] = ((modules ?? []) as any[]).map((m, mi) => {
    const topicsSorted = ((m.course_topics ?? []) as any[]).sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
    );
    const flat: Lesson[] = [];
    const topics: Module["topics"] = topicsSorted.map((t: any) => {
      const ls: Lesson[] = ((t.course_lessons ?? []) as any[])
        .filter((l: any) => l.is_published)
        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((l: any) => {
          const p: any = progressMap.get(l.id);
          const lesson: Lesson = {
            id: l.id,
            moduleId: m.id,
            topicId: t.id,
            topicName: t.name ?? null,
            name: l.name,
            type: l.lesson_type,
            duration: l.duration ?? null,
            resource_url: l.resource_url ?? null,
            description: l.description ?? null,
            content: l.content ?? null,
            isRequired: l.is_required ?? true,
            isFreePreview: l.is_free_preview ?? false,
            status: (p?.status as any) ?? "not_started",
            completed_at: p?.completed_at ?? null,
            last_accessed_at: p?.last_accessed_at ?? null,
            video_progress_pct: Number(p?.video_progress_pct ?? 0),
            last_position_seconds: Number(p?.last_position_seconds ?? 0),
            unlocked: true, // filled in later
            position: 0, // filled in later
          };
          flat.push(lesson);
          return lesson;
        });
      return { id: t.id, name: t.name ?? null, lessons: ls };
    });

    flat.forEach((l, i) => (l.position = i + 1));

    const totalLessons = flat.length;
    const completedLessons = flat.filter((l) => l.status === "completed").length;
    const totalRequired = flat.filter((l) => l.isRequired).length;
    const completedRequired = flat.filter((l) => l.isRequired && l.status === "completed").length;
    const progressPct = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const persistedCompletion = (moduleCompletionMap.get(m.id) as string | undefined) ?? null;
    const isRequired = m.is_required ?? true;

    return {
      id: m.id,
      number: m.number ?? mi + 1,
      name: m.name,
      description: m.description ?? null,
      isRequired,
      unlocked: true, // computed next
      status: "available", // computed next
      lessons: flat,
      topics,
      totalLessons,
      completedLessons,
      totalRequired,
      completedRequired,
      progressPct,
      completedAt: persistedCompletion,
    };
  });

  // Sequential module unlock: a module is unlocked iff all preceding REQUIRED
  // modules are fully completed. Optional modules never gate later modules.
  if (unlockMode === "sequential") {
    let blocked = false;
    for (const m of cleaned) {
      m.unlocked = !blocked;
      const isComplete =
        !!m.completedAt ||
        (m.totalRequired > 0 ? m.completedRequired >= m.totalRequired : m.completedLessons >= m.totalLessons && m.totalLessons > 0);
      if (m.isRequired && !isComplete) blocked = true;
    }
  } else {
    for (const m of cleaned) m.unlocked = true;
  }

  // Lesson unlock within a module (sequential): each lesson unlocked once
  // every previous REQUIRED lesson in the same module is completed.
  for (const m of cleaned) {
    if (!m.unlocked) {
      for (const l of m.lessons) l.unlocked = false;
      continue;
    }
    if (unlockMode === "sequential") {
      let lessonBlocked = false;
      for (const l of m.lessons) {
        l.unlocked = !lessonBlocked;
        if (l.isRequired && l.status !== "completed") lessonBlocked = true;
      }
    } else {
      for (const l of m.lessons) l.unlocked = true;
    }
  }

  // Module status
  for (const m of cleaned) {
    if (!m.unlocked) {
      m.status = "locked";
    } else if (m.completedAt || (m.totalRequired > 0 && m.completedRequired >= m.totalRequired && m.totalRequired > 0)) {
      m.status = "completed";
    } else if (m.completedLessons > 0 || m.lessons.some((l) => l.status === "in_progress")) {
      m.status = "in_progress";
    } else {
      m.status = "available";
    }
  }

  // Program totals — REQUIRED lessons in REQUIRED modules
  let totalRequired = 0;
  let completedRequired = 0;
  let totalLessons = 0;
  let completedLessons = 0;
  for (const m of cleaned) {
    totalLessons += m.totalLessons;
    completedLessons += m.completedLessons;
    if (!m.isRequired) continue;
    totalRequired += m.totalRequired;
    completedRequired += m.completedRequired;
  }
  const progressPct = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isContentCompleted = !!contentCompletion?.completed_at || (totalRequired > 0 && completedRequired >= totalRequired);

  // Determine "next lesson to open" — next unlocked, incomplete required
  // lesson; fall back to first unlocked incomplete lesson; then first lesson.
  let nextLesson: Lesson | null = null;
  for (const m of cleaned) {
    if (!m.unlocked) continue;
    for (const l of m.lessons) {
      if (!l.unlocked) continue;
      if (l.status === "completed") continue;
      if (l.isRequired) { nextLesson = l; break; }
      if (!nextLesson) nextLesson = l;
    }
    if (nextLesson && nextLesson.isRequired) break;
  }
  const firstUnlocked = cleaned.find((m) => m.unlocked)?.lessons.find((l) => l.unlocked) ?? null;
  const fallbackLesson = nextLesson ?? firstUnlocked ?? cleaned[0]?.lessons[0] ?? null;

  return {
    unlockMode,
    modules: cleaned,
    totals: {
      totalLessons,
      completedLessons,
      totalRequiredLessons: totalRequired,
      completedRequiredLessons: completedRequired,
      totalModules: cleaned.length,
      completedModules: cleaned.filter((m) => m.status === "completed").length,
      progressPct,
      isContentCompleted,
      contentCompletedAt: contentCompletion?.completed_at ?? null,
    },
    nextLesson: fallbackLesson,
  };
}

async function isLessonAuthorized(
  context: any,
  userId: string,
  courseId: string,
  lessonId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const snap = await computeCourseProgress(context, courseId, userId);
  for (const m of snap.modules) {
    for (const l of m.lessons) {
      if (l.id !== lessonId) continue;
      if (!m.unlocked) return { ok: false, reason: "This module is locked. Complete the previous required module to unlock it." };
      if (!l.unlocked) return { ok: false, reason: "Complete the previous required lesson to unlock this one." };
      return { ok: true };
    }
  }
  return { ok: false, reason: "This lesson isn't part of your program curriculum." };
}

/* ============================================================
 * OPEN / COMPLETE LESSON
 * ============================================================ */

export const openLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lessonId: string; courseId: string; enrollmentId: string }) => data)
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();

    // Confirm enrollment belongs to this student
    const { data: enrollment } = await context.supabase
      .from("enrollments")
      .select("id, course_id")
      .eq("id", data.enrollmentId)
      .eq("student_user_id", context.userId)
      .eq("course_id", data.courseId)
      .maybeSingle();
    if (!enrollment) throw new Error("You are not enrolled in this program");

    // Authorization: unlock check
    const auth = await isLessonAuthorized(context, context.userId, data.courseId, data.lessonId);
    if (!auth.ok) throw new Error(auth.reason ?? "Lesson locked");

    // Upsert lesson_progress
    const { data: existing } = await context.supabase
      .from("lesson_progress")
      .select("id, status")
      .eq("student_user_id", context.userId)
      .eq("lesson_id", data.lessonId)
      .maybeSingle();
    if (existing) {
      await context.supabase
        .from("lesson_progress")
        .update({ last_accessed_at: now })
        .eq("id", existing.id);
    } else {
      await context.supabase.from("lesson_progress").insert({
        student_user_id: context.userId,
        enrollment_id: data.enrollmentId,
        course_id: data.courseId,
        lesson_id: data.lessonId,
        status: "in_progress",
      });
    }

    // Lookup module for current-position tracking
    const { data: lessonRow } = await context.supabase
      .from("course_lessons")
      .select("id, topic_id, course_topics(module_id)")
      .eq("id", data.lessonId)
      .maybeSingle();
    const moduleId =
      (lessonRow as any)?.course_topics?.module_id ?? null;

    // Record "Module Started" once
    if (moduleId) {
      const { data: modStarted } = await context.supabase
        .from("student_activity")
        .select("id")
        .eq("student_user_id", context.userId)
        .eq("course_id", data.courseId)
        .eq("activity_type", "module_started")
        .eq("entity_id", moduleId)
        .maybeSingle();
      if (!modStarted) {
        await context.supabase.from("student_activity").insert({
          student_user_id: context.userId,
          course_id: data.courseId,
          activity_type: "module_started",
          description: "Started module",
          entity_id: moduleId,
        });
      }
    }

    await context.supabase
      .from("enrollments")
      .update({
        last_accessed_at: now,
        current_lesson_id: data.lessonId,
        current_module_id: moduleId,
      })
      .eq("id", data.enrollmentId)
      .eq("student_user_id", context.userId);

    return { ok: true };
  });

export const completeLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lessonId: string; courseId: string; enrollmentId: string; lessonName?: string }) => data)
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();

    // Enrollment authorization
    const { data: enrollment } = await context.supabase
      .from("enrollments")
      .select("id, course_id, lms_status")
      .eq("id", data.enrollmentId)
      .eq("student_user_id", context.userId)
      .eq("course_id", data.courseId)
      .maybeSingle();
    if (!enrollment) throw new Error("You are not enrolled in this program");

    // Lesson unlock check
    const auth = await isLessonAuthorized(context, context.userId, data.courseId, data.lessonId);
    if (!auth.ok) throw new Error(auth.reason ?? "Lesson locked");

    // Confirm the lesson is published & fetch its module
    const { data: lessonRow } = await context.supabase
      .from("course_lessons")
      .select("id, is_published, name, course_topics(module_id)")
      .eq("id", data.lessonId)
      .maybeSingle();
    if (!lessonRow || !(lessonRow as any).is_published) throw new Error("Lesson unavailable");
    const moduleId = (lessonRow as any).course_topics?.module_id ?? null;

    const { data: existing } = await context.supabase
      .from("lesson_progress")
      .select("id, status")
      .eq("student_user_id", context.userId)
      .eq("lesson_id", data.lessonId)
      .maybeSingle();

    if (existing?.status !== "completed") {
      if (existing) {
        await context.supabase.from("lesson_progress").update({
          status: "completed",
          completed_at: now,
          last_accessed_at: now,
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
        description: `Completed lesson: ${data.lessonName ?? (lessonRow as any).name ?? "Lesson"}`,
        entity_id: data.lessonId,
      });
    }

    // Reconcile module + program state from authoritative completion data
    await reconcileProgress(context, {
      userId: context.userId,
      enrollmentId: data.enrollmentId,
      courseId: data.courseId,
      justCompletedModuleId: moduleId,
    });

    return { ok: true };
  });

/**
 * Rebuild module/program completion state from lesson_progress. Idempotent —
 * safe to run any time completion data changes.
 */
async function reconcileProgress(
  context: any,
  input: { userId: string; enrollmentId: string; courseId: string; justCompletedModuleId?: string | null },
) {
  const { userId, enrollmentId, courseId } = input;
  const snap = await computeCourseProgress(context, courseId, userId);
  const now = new Date().toISOString();

  // Persist module completions + emit unlock events
  for (let i = 0; i < snap.modules.length; i++) {
    const m = snap.modules[i];
    const shouldBeCompleted = m.totalRequired > 0
      ? m.completedRequired >= m.totalRequired
      : m.completedLessons >= m.totalLessons && m.totalLessons > 0;
    if (!shouldBeCompleted) continue;
    if (m.completedAt) continue;
    const { error: insErr } = await context.supabase.from("module_completions").insert({
      student_user_id: userId,
      enrollment_id: enrollmentId,
      course_id: courseId,
      module_id: m.id,
      completed_at: now,
    });
    // Insert may fail on unique conflict — treat as already done
    if (!insErr) {
      await context.supabase.from("student_activity").insert({
        student_user_id: userId,
        course_id: courseId,
        activity_type: "module_completed",
        description: `Completed module: ${m.name}`,
        entity_id: m.id,
      });
    }
    // In sequential mode, emit a "module_unlocked" event for the next required module
    if (snap.unlockMode === "sequential") {
      const next = snap.modules
        .slice(i + 1)
        .find((n) => n.isRequired);
      if (next) {
        const { data: already } = await context.supabase
          .from("student_activity")
          .select("id")
          .eq("student_user_id", userId)
          .eq("course_id", courseId)
          .eq("activity_type", "module_unlocked")
          .eq("entity_id", next.id)
          .maybeSingle();
        if (!already) {
          await context.supabase.from("student_activity").insert({
            student_user_id: userId,
            course_id: courseId,
            activity_type: "module_unlocked",
            description: `Unlocked module: ${next.name}`,
            entity_id: next.id,
          });
        }
      }
    }
  }

  // Program learning-content completion
  const requiredCovered =
    snap.totals.totalRequiredLessons > 0 &&
    snap.totals.completedRequiredLessons >= snap.totals.totalRequiredLessons;
  if (requiredCovered && !snap.totals.contentCompletedAt) {
    const { error: pccErr } = await context.supabase.from("program_content_completions").insert({
      student_user_id: userId,
      enrollment_id: enrollmentId,
      course_id: courseId,
      completed_at: now,
    });
    if (!pccErr) {
      await context.supabase
        .from("enrollments")
        .update({ content_completed_at: now })
        .eq("id", enrollmentId)
        .eq("student_user_id", userId);
      await context.supabase.from("student_activity").insert({
        student_user_id: userId,
        course_id: courseId,
        activity_type: "program_content_completed",
        description: "Program learning content completed",
        entity_id: courseId,
      });
    }
  }

  // Course completion (legacy): keep updating enrollment.lms_status once
  // required content is done, but DO NOT issue certificates here — certificate
  // eligibility is handled by a separate task.
  await tryCompleteCourse(context, enrollmentId, courseId);
}

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

  if (require_lessons) {
    const snap = await computeCourseProgress(context, courseId, enr.student_user_id);
    if (snap.totals.totalRequiredLessons === 0) return;
    const pct = (snap.totals.completedRequiredLessons / snap.totals.totalRequiredLessons) * 100;
    if (pct < minPct) return;
  }
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
        .eq("student_user_id", enr.student_user_id)
        .in("assignment_id", ids);
      const approved = new Set(
        (subs ?? []).filter((s: any) => s.status === "approved").map((s: any) => s.assignment_id),
      );
      if (approved.size < ids.length) return;
    }
  }
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
        .eq("student_user_id", enr.student_user_id)
        .in("assessment_id", ids);
      const passed = new Set(
        (attempts ?? []).filter((a: any) => a.passed).map((a: any) => a.assessment_id),
      );
      if (passed.size < ids.length) return;
    }
  }

  await context.supabase
    .from("enrollments")
    .update({ lms_status: "completed", completed_at: new Date().toISOString() })
    .eq("id", enrollmentId);
}

/* ============================================================
 * PROGRAM PROGRESS + CONTINUE LEARNING (canonical endpoints)
 * ============================================================ */

export const getProgramProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { courseId?: string; slug?: string }) => d)
  .handler(async ({ data, context }) => {
    let courseId = data.courseId ?? null;
    if (!courseId && data.slug) {
      const { data: c } = await context.supabase
        .from("courses").select("id").eq("slug", data.slug).eq("is_published", true).maybeSingle();
      courseId = c?.id ?? null;
    }
    if (!courseId) throw new Error("Program not found");
    const { data: enr } = await context.supabase
      .from("enrollments")
      .select("id")
      .eq("student_user_id", context.userId)
      .eq("course_id", courseId)
      .maybeSingle();
    if (!enr) throw new Error("You are not enrolled in this program");
    const snap = await computeCourseProgress(context, courseId, context.userId);
    return {
      courseId,
      enrollmentId: enr.id,
      unlockMode: snap.unlockMode,
      modules: snap.modules.map((m) => ({
        id: m.id, number: m.number, name: m.name,
        isRequired: m.isRequired, unlocked: m.unlocked, status: m.status,
        totalLessons: m.totalLessons, completedLessons: m.completedLessons,
        totalRequired: m.totalRequired, completedRequired: m.completedRequired,
        progressPct: m.progressPct, completedAt: m.completedAt,
      })),
      totals: snap.totals,
    };
  });

export const getContinueLearning = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { courseId?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    // If a course is specified, get its next lesson. Otherwise find the most
    // recently accessed enrollment.
    let courseId = (data as any)?.courseId ?? null;
    let enrollmentId: string | null = null;

    if (!courseId) {
      const { data: enr } = await context.supabase
        .from("enrollments")
        .select("id, course_id, last_accessed_at, enrolled_at")
        .eq("student_user_id", context.userId)
        .not("course_id", "is", null)
        .order("last_accessed_at", { ascending: false, nullsFirst: false })
        .order("enrolled_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!enr) return { hasProgram: false as const };
      courseId = enr.course_id;
      enrollmentId = enr.id;
    } else {
      const { data: enr } = await context.supabase
        .from("enrollments").select("id").eq("student_user_id", context.userId).eq("course_id", courseId).maybeSingle();
      if (!enr) throw new Error("You are not enrolled in this program");
      enrollmentId = enr.id;
    }

    const { data: course } = await context.supabase
      .from("courses").select("id, name, slug").eq("id", courseId).maybeSingle();
    if (!course) return { hasProgram: false as const };

    const snap = await computeCourseProgress(context, courseId, context.userId);
    const next = snap.nextLesson;
    return {
      hasProgram: true as const,
      course: { id: course.id, name: course.name, slug: course.slug },
      enrollmentId,
      progressPct: snap.totals.progressPct,
      isContentCompleted: snap.totals.isContentCompleted,
      lesson: next
        ? {
            id: next.id,
            name: next.name,
            moduleId: next.moduleId,
            type: next.type,
            status: next.status,
          }
        : null,
    };
  });


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
      .select("id, course_id, program_title, lms_status, enrolled_at, last_accessed_at, completed_at, content_completed_at, current_module_id")
      .eq("student_user_id", context.userId)
      .order("enrolled_at", { ascending: false });

    const ids = Array.from(new Set((enrs ?? []).map((e) => e.course_id).filter(Boolean))) as string[];
    if (!ids.length) return [] as any[];

    const [{ data: courses }, { data: certs }] = await Promise.all([
      context.supabase
        .from("courses")
        .select("id, name, slug, thumbnail_url, short_description, level, duration, learning_mode, course_categories(name, slug)")
        .in("id", ids),
      context.supabase
        .from("certificates")
        .select("id, course_id, issued_at, revoked_at")
        .eq("student_user_id", context.userId)
        .in("course_id", ids),
    ]);

    const certMap = new Map(
      (certs ?? []).filter((c: any) => !c.revoked_at).map((c: any) => [c.course_id, c]),
    );
    const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));

    // Compute canonical progress for each enrolled course
    const snaps = await Promise.all(
      (enrs ?? []).map(async (e) =>
        e.course_id
          ? { enrollment: e, snap: await computeCourseProgress(context, e.course_id, context.userId) }
          : { enrollment: e, snap: null },
      ),
    );

    return snaps.map(({ enrollment: e, snap }) => {
      const c: any = e.course_id ? courseMap.get(e.course_id) : null;
      const totals = snap?.totals;
      const currentModule = snap
        ? snap.modules.find((m) => m.status === "in_progress") ??
          snap.modules.find((m) => m.status === "available") ??
          snap.modules[snap.modules.length - 1] ??
          null
        : null;
      const status = deriveProgramStatus(
        e.lms_status,
        totals?.completedRequiredLessons ?? 0,
        totals?.totalRequiredLessons ?? 0,
      );
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
        contentCompletedAt: e.content_completed_at ?? totals?.contentCompletedAt ?? null,
        progress: totals?.progressPct ?? 0,
        totalLessons: totals?.totalLessons ?? 0,
        completedLessons: totals?.completedLessons ?? 0,
        totalRequiredLessons: totals?.totalRequiredLessons ?? 0,
        completedRequiredLessons: totals?.completedRequiredLessons ?? 0,
        totalModules: totals?.totalModules ?? 0,
        completedModules: totals?.completedModules ?? 0,
        currentModule: currentModule ? { id: currentModule.id, name: currentModule.name, status: currentModule.status } : null,
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
      .select("id, name, slug, short_description, thumbnail_url, level, duration, learning_mode, unlock_mode, course_categories(name)")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!course) throw new Error("Program not found");
    const courseRow = course as any;

    const { data: enrollment } = await context.supabase
      .from("enrollments")
      .select("id, lms_status, enrolled_at, completed_at, last_accessed_at, content_completed_at, current_module_id, current_lesson_id")
      .eq("student_user_id", context.userId)
      .eq("course_id", course.id)
      .maybeSingle();
    if (!enrollment) throw new Error("You are not enrolled in this program");

    const [snap, { data: assignSubs }, { data: projSubs }, { data: cert }] = await Promise.all([
      computeCourseProgress(context, courseRow.id, context.userId),
      context.supabase
        .from("assignment_submissions")
        .select("id, status, assignment_id")
        .eq("student_user_id", context.userId)
        .eq("course_id", course.id),
      context.supabase
        .from("course_projects").select("id").eq("course_id", course.id),
      context.supabase
        .from("certificates")
        .select("id, issued_at, revoked_at")
        .eq("student_user_id", context.userId)
        .eq("course_id", course.id)
        .maybeSingle(),
    ]);

    const cleanedModules = snap.modules.map((m) => ({
      id: m.id,
      number: m.number,
      name: m.name,
      description: m.description,
      isRequired: m.isRequired,
      unlocked: m.unlocked,
      status: m.status,
      totalLessons: m.totalLessons,
      completedLessons: m.completedLessons,
      totalRequired: m.totalRequired,
      completedRequired: m.completedRequired,
      progressPct: m.progressPct,
      completedAt: m.completedAt,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        name: l.name,
        type: l.type,
        duration: l.duration,
        topic: l.topicName,
        isRequired: l.isRequired,
        unlocked: l.unlocked,
        status: l.status,
      })),
    }));

    const status = deriveProgramStatus(
      enrollment.lms_status,
      snap.totals.completedRequiredLessons,
      snap.totals.totalRequiredLessons,
    );
    const accessBlocked = status === "access_suspended" || status === "access_expired";
    const assignmentsCompleted = ((assignSubs ?? []) as any[]).filter((s) =>
      ["submitted", "reviewed", "approved", "graded", "accepted"].includes((s.status ?? "").toLowerCase()),
    ).length;

    return {
      program: {
        id: courseRow.id,
        name: courseRow.name,
        slug: courseRow.slug,
        description: courseRow.short_description,
        thumbnail: courseRow.thumbnail_url,
        level: courseRow.level,
        duration: courseRow.duration,
        learningMode: courseRow.learning_mode,
        unlockMode: snap.unlockMode,
        category: courseRow.course_categories?.name ?? null,
      },
      enrollment: {
        id: enrollment.id,
        enrolledAt: enrollment.enrolled_at,
        completedAt: enrollment.completed_at,
        contentCompletedAt: enrollment.content_completed_at ?? snap.totals.contentCompletedAt ?? null,
        lastAccessedAt: enrollment.last_accessed_at,
        currentModuleId: (enrollment as any).current_module_id ?? null,
        currentLessonId: (enrollment as any).current_lesson_id ?? null,
      },
      status,
      accessBlocked,
      unlockMode: snap.unlockMode,
      progress: snap.totals.progressPct,
      totalLessons: snap.totals.totalLessons,
      completedLessons: snap.totals.completedLessons,
      totalRequiredLessons: snap.totals.totalRequiredLessons,
      completedRequiredLessons: snap.totals.completedRequiredLessons,
      totalModules: snap.totals.totalModules,
      completedModules: snap.totals.completedModules,
      isContentCompleted: snap.totals.isContentCompleted,
      assignmentsCompleted,
      projectsAvailable: (projSubs ?? []).length,
      modules: cleanedModules,
      nextLesson: snap.nextLesson
        ? { id: snap.nextLesson.id, name: snap.nextLesson.name, moduleId: snap.nextLesson.moduleId }
        : null,
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
      description: data.description ?? data.activity,
      entity_id: data.entityId ?? null,
    });
    return { ok: true };
  });

/* ============================================================
 * LESSON PLAYER v2 (video progress, notes, resume)
 * ============================================================ */

export const saveVideoProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    lessonId: string;
    courseId: string;
    enrollmentId: string;
    positionSeconds: number;
    progressPct: number;
  }) => d)
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const clampedPct = Math.max(0, Math.min(100, Math.round(data.progressPct)));
    const posSec = Math.max(0, Number(data.positionSeconds ?? 0));

    // Verify enrollment (RLS also enforces, but fail fast with a clean message)
    const { data: enr } = await context.supabase
      .from("enrollments")
      .select("id")
      .eq("id", data.enrollmentId)
      .eq("student_user_id", context.userId)
      .eq("course_id", data.courseId)
      .maybeSingle();
    if (!enr) throw new Error("Not enrolled");

    const { data: existing } = await context.supabase
      .from("lesson_progress")
      .select("id, status, video_progress_pct, last_position_seconds")
      .eq("student_user_id", context.userId)
      .eq("lesson_id", data.lessonId)
      .maybeSingle();

    if (existing) {
      // Never regress the highest watched pct; always update last position
      const nextPct = Math.max(clampedPct, Number(existing.video_progress_pct ?? 0));
      const patch = {
        last_position_seconds: posSec,
        video_progress_pct: nextPct,
        last_accessed_at: now,
        ...(existing.status !== "completed" && nextPct > 0 ? { status: "in_progress" } : {}),
      };
      await context.supabase.from("lesson_progress").update(patch).eq("id", existing.id);
    } else {
      await context.supabase.from("lesson_progress").insert({
        student_user_id: context.userId,
        enrollment_id: data.enrollmentId,
        course_id: data.courseId,
        lesson_id: data.lessonId,
        status: clampedPct > 0 ? "in_progress" : "not_started",
        started_at: now,
        last_accessed_at: now,
        video_progress_pct: clampedPct,
        last_position_seconds: posSec,
      });
    }
    return { ok: true, progressPct: clampedPct };
  });

export const getLessonProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lessonId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("lesson_progress")
      .select("status, video_progress_pct, last_position_seconds, last_accessed_at")
      .eq("student_user_id", context.userId)
      .eq("lesson_id", data.lessonId)
      .maybeSingle();
    return row ?? { status: "not_started", video_progress_pct: 0, last_position_seconds: 0, last_accessed_at: null };
  });

export const getLessonNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lessonId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("lesson_notes")
      .select("id, notes, updated_at")
      .eq("student_user_id", context.userId)
      .eq("lesson_id", data.lessonId)
      .maybeSingle();
    return row ?? { id: null, notes: "", updated_at: null };
  });

export const saveLessonNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lessonId: string; courseId: string; notes: string }) => d)
  .handler(async ({ data, context }) => {
    const notes = String(data.notes ?? "").slice(0, 20000);

    // Ensure enrollment before writing
    const { data: enr } = await context.supabase
      .from("enrollments")
      .select("id")
      .eq("student_user_id", context.userId)
      .eq("course_id", data.courseId)
      .maybeSingle();
    if (!enr) throw new Error("Not enrolled");

    const { data: existing } = await context.supabase
      .from("lesson_notes")
      .select("id")
      .eq("student_user_id", context.userId)
      .eq("lesson_id", data.lessonId)
      .maybeSingle();

    if (existing) {
      await context.supabase.from("lesson_notes").update({ notes }).eq("id", existing.id);
    } else {
      await context.supabase.from("lesson_notes").insert({
        student_user_id: context.userId,
        lesson_id: data.lessonId,
        course_id: data.courseId,
        notes,
      });
    }

    // Log activity (deduped per 5 min via caller — we just insert once per save)
    await context.supabase.from("student_activity").insert({
      student_user_id: context.userId,
      course_id: data.courseId,
      activity_type: "notes_saved",
      description: "Saved lesson notes",
      entity_id: data.lessonId,
    });
    return { ok: true };
  });

export const logLessonEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    courseId: string;
    lessonId: string;
    event: "lesson_opened" | "video_started" | "resource_opened";
    description?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    // Verify enrollment
    const { data: enr } = await context.supabase
      .from("enrollments")
      .select("id")
      .eq("student_user_id", context.userId)
      .eq("course_id", data.courseId)
      .maybeSingle();
    if (!enr) throw new Error("Not enrolled");

    // Dedupe within 10 min for the same (event, lesson) so page refreshes don't flood
    const tenMin = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recent } = await context.supabase
      .from("student_activity")
      .select("id")
      .eq("student_user_id", context.userId)
      .eq("activity_type", data.event)
      .eq("entity_id", data.lessonId)
      .gte("created_at", tenMin)
      .limit(1);
    if (recent && recent.length) return { ok: true, deduped: true };

    await context.supabase.from("student_activity").insert({
      student_user_id: context.userId,
      course_id: data.courseId,
      activity_type: data.event,
      description: data.description ?? data.event,
      entity_id: data.lessonId,
    });
    return { ok: true };
  });
