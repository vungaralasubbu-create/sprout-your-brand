/**
 * Student Projects — server functions.
 * All reads/writes go through requireSupabaseAuth so RLS enforces per-student
 * isolation. Reviewer-controlled statuses (under_review / completed) are never
 * settable by students; they can only move rows to in_progress, submitted, or
 * needs_revision.
 *
 * NOTE: `course_projects` uses a composite primary key
 * (course_id, project_id). We expose an opaque `linkId` string of the form
 * `"<course_id>:<project_id>"` to callers.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */

export type ProjectStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "needs_revision"
  | "completed";

export type ProjectAttachment = {
  name: string;
  path: string;
  size?: number;
  type?: string;
};

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

const UuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function parseLinkId(linkId: string): { courseId: string; projectId: string } {
  const [courseId, projectId] = linkId.split(":");
  if (!courseId || !projectId || !UuidRe.test(courseId) || !UuidRe.test(projectId)) {
    throw new Error("Invalid project reference");
  }
  return { courseId, projectId };
}
function makeLinkId(courseId: string, projectId: string) {
  return `${courseId}:${projectId}`;
}

async function getEnrolledCourseIds(context: any, userId: string) {
  const { data, error } = await context.supabase
    .from("enrollments")
    .select("course_id, id, lms_status, start_date")
    .eq("student_user_id", userId)
    .in("lms_status", ["active", "completed", "paused"]);
  if (error) throw error;
  return (data ?? []) as Array<{
    course_id: string;
    id: string;
    lms_status: string;
    start_date: string | null;
  }>;
}

async function computeUnlockMap(
  context: any,
  userId: string,
  courseIds: string[],
) {
  if (!courseIds.length) {
    return {
      completedLessonIds: new Set<string>(),
      completedModuleIds: new Set<string>(),
      completedProjectIds: new Set<string>(),
    };
  }
  const [lp, mc, sp] = await Promise.all([
    context.supabase
      .from("lesson_progress")
      .select("lesson_id, status")
      .eq("student_user_id", userId)
      .eq("status", "completed"),
    context.supabase
      .from("module_completions")
      .select("module_id")
      .eq("student_user_id", userId),
    context.supabase
      .from("student_projects")
      .select("project_id, status")
      .eq("student_user_id", userId)
      .eq("status", "completed"),
  ]);
  return {
    completedLessonIds: new Set<string>((lp.data ?? []).map((r: any) => r.lesson_id)),
    completedModuleIds: new Set<string>((mc.data ?? []).map((r: any) => r.module_id)),
    completedProjectIds: new Set<string>((sp.data ?? []).map((r: any) => r.project_id)),
  };
}

function evaluateUnlock(link: any, sets: {
  completedLessonIds: Set<string>;
  completedModuleIds: Set<string>;
  completedProjectIds: Set<string>;
}): { unlocked: boolean; reason: string } {
  switch (link.unlock_rule) {
    case "enrollment":
      return { unlocked: true, reason: "Available from day one" };
    case "module_available":
      return { unlocked: true, reason: "Available in this module" };
    case "module_completed":
      if (!link.module_id) return { unlocked: true, reason: "Available" };
      return sets.completedModuleIds.has(link.module_id)
        ? { unlocked: true, reason: "Unlocked after module completion" }
        : { unlocked: false, reason: "Complete the linked module to unlock" };
    case "lesson_completed":
      if (!link.required_lesson_id) return { unlocked: true, reason: "Available" };
      return sets.completedLessonIds.has(link.required_lesson_id)
        ? { unlocked: true, reason: "Unlocked after required lesson" }
        : { unlocked: false, reason: "Complete the required lesson to unlock" };
    case "previous_project_completed":
      if (!link.required_project_id) return { unlocked: true, reason: "Available" };
      return sets.completedProjectIds.has(link.required_project_id)
        ? { unlocked: true, reason: "Unlocked after previous project" }
        : { unlocked: false, reason: "Complete the previous project to unlock" };
    case "manual":
      return { unlocked: false, reason: "Unlocks after admin approval" };
    default:
      return { unlocked: true, reason: "Available" };
  }
}

function computeDueAt(startDate: string | null, dueDays: number | null): string | null {
  if (!startDate || !dueDays) return null;
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + dueDays);
  return d.toISOString();
}

async function logActivity(
  context: any,
  courseId: string | null,
  activity: string,
  description: string,
  entityId?: string | null,
) {
  await (context.supabase.from("student_activity") as any).insert({
    student_user_id: context.userId,
    course_id: courseId,
    activity_type: activity,
    description,
    entity_id: entityId ?? null,
  });
}

/* ------------------------------------------------------------------
 * LIST
 * ------------------------------------------------------------------ */

export const listStudentProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const enrollments = await getEnrolledCourseIds(context, context.userId);
    const courseIds = enrollments.map((e) => e.course_id);
    if (!courseIds.length) {
      return {
        projects: [] as any[],
        summary: {
          total: 0, notStarted: 0, locked: 0, inProgress: 0,
          submitted: 0, underReview: 0, needsRevision: 0, completed: 0,
        },
      };
    }

    const { data: links, error: linksErr } = await context.supabase
      .from("course_projects")
      .select(`
        course_id, project_id, display_order, module_id, unlock_rule,
        required_lesson_id, required_project_id, due_days_from_start, is_published,
        template:course_project_templates!inner (
          id, name, slug, description, difficulty, duration, project_type,
          estimated_duration_hours, portfolio_eligible, requires_repo_link,
          requires_live_link, requires_attachment, is_published, objective
        ),
        course:courses!inner (id, name, slug),
        module:course_modules (id, title)
      `)
      .in("course_id", courseIds);
    if (linksErr) throw linksErr;

    const published = ((links ?? []) as any[]).filter(
      (l) => l.is_published !== false && l.template?.is_published !== false,
    );

    const sets = await computeUnlockMap(context, context.userId, courseIds);

    const projectIds = published.map((l) => l.project_id);
    const spResult = projectIds.length
      ? await context.supabase
          .from("student_projects")
          .select("*")
          .eq("student_user_id", context.userId)
          .in("project_id", projectIds)
      : { data: [] as any[] };
    const spMap = new Map<string, any>();
    for (const row of (spResult.data ?? []) as any[]) {
      spMap.set(`${row.course_id}:${row.project_id}`, row);
    }
    const enrByCourse = new Map(enrollments.map((e) => [e.course_id, e]));

    const rows = published.map((l) => {
      const key = makeLinkId(l.course_id, l.project_id);
      const student = spMap.get(key);
      const unlock = evaluateUnlock(l, sets);
      const status: ProjectStatus = student
        ? (student.status as ProjectStatus)
        : (unlock.unlocked ? "available" : "locked");
      const enr = enrByCourse.get(l.course_id);
      const due_at = computeDueAt(enr?.start_date ?? null, l.due_days_from_start);
      return {
        link_id: key,
        course: l.course,
        module: l.module,
        project: l.template,
        unlock_rule: l.unlock_rule,
        unlocked: unlock.unlocked || Boolean(student),
        unlock_reason: unlock.reason,
        display_order: l.display_order ?? 0,
        due_at,
        student_project: student ?? null,
        status,
      };
    });

    rows.sort((a: any, b: any) => {
      if (a.course.name !== b.course.name) return a.course.name.localeCompare(b.course.name);
      return a.display_order - b.display_order;
    });

    const summary = {
      total: rows.length,
      notStarted: rows.filter((r) => r.status === "available").length,
      locked: rows.filter((r) => r.status === "locked").length,
      inProgress: rows.filter((r) => r.status === "in_progress").length,
      submitted: rows.filter((r) => r.status === "submitted").length,
      underReview: rows.filter((r) => r.status === "under_review").length,
      needsRevision: rows.filter((r) => r.status === "needs_revision").length,
      completed: rows.filter((r) => r.status === "completed").length,
    };

    return { projects: rows, summary };
  });

/* ------------------------------------------------------------------
 * DETAILS
 * ------------------------------------------------------------------ */

export const getStudentProjectDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ linkId: z.string() }).parse(v))
  .handler(async ({ data, context }) => {
    const { courseId, projectId } = parseLinkId(data.linkId);

    const { data: link, error: linkErr } = await context.supabase
      .from("course_projects")
      .select(`
        course_id, project_id, display_order, module_id, unlock_rule,
        required_lesson_id, required_project_id, due_days_from_start, is_published,
        template:course_project_templates!inner (
          id, name, slug, description, objective, requirements, expected_outcome,
          submission_instructions, evaluation_criteria, difficulty, duration,
          project_type, estimated_duration_hours, portfolio_eligible,
          requires_repo_link, requires_live_link, requires_attachment, is_published,
          learning_outcomes, tools_required, deliverables, resources
        ),
        course:courses!inner (id, name, slug),
        module:course_modules (id, title)
      `)
      .eq("course_id", courseId)
      .eq("project_id", projectId)
      .maybeSingle();
    if (linkErr) throw linkErr;
    const l = link as any;
    if (!l || l.is_published === false || l.template?.is_published === false) {
      throw new Error("Project not found");
    }

    const enrollments = await getEnrolledCourseIds(context, context.userId);
    const enr = enrollments.find((e) => e.course_id === courseId);
    if (!enr) throw new Error("You are not enrolled in this program");

    const sets = await computeUnlockMap(context, context.userId, [courseId]);
    const unlock = evaluateUnlock(l, sets);

    const [tasksRes, spRes, subsRes] = await Promise.all([
      context.supabase
        .from("project_tasks")
        .select("id, title, description, display_order, is_required")
        .eq("project_id", projectId)
        .order("display_order", { ascending: true }),
      context.supabase
        .from("student_projects")
        .select("*")
        .eq("student_user_id", context.userId)
        .eq("project_id", projectId)
        .eq("course_id", courseId)
        .maybeSingle(),
      context.supabase
        .from("student_project_submissions")
        .select("*")
        .eq("student_user_id", context.userId)
        .eq("project_id", projectId)
        .eq("course_id", courseId)
        .order("version", { ascending: false }),
    ]);

    const student = spRes.data as any;
    const submissions = (subsRes.data ?? []) as any[];

    const allPaths: string[] = [];
    for (const sub of submissions) {
      for (const att of (sub.attachments as ProjectAttachment[]) ?? []) {
        if (att?.path) allPaths.push(att.path);
      }
    }
    const signed: Record<string, string> = {};
    if (allPaths.length) {
      const { data: urls } = await context.supabase
        .storage.from("student-submissions")
        .createSignedUrls(allPaths, 3600);
      for (const u of urls ?? []) {
        if (u.path && u.signedUrl) signed[u.path] = u.signedUrl;
      }
    }

    const status: ProjectStatus = student
      ? (student.status as ProjectStatus)
      : (unlock.unlocked ? "available" : "locked");

    const due_at = computeDueAt(enr.start_date, l.due_days_from_start);

    await logActivity(
      context, courseId, "project_opened",
      `Opened project: ${l.template.name}`, projectId,
    );

    return {
      link: { ...l, link_id: makeLinkId(courseId, projectId) },
      tasks: tasksRes.data ?? [],
      studentProject: student,
      submissions,
      signedUrls: signed,
      status,
      unlocked: unlock.unlocked || Boolean(student),
      unlockReason: unlock.reason,
      due_at,
    };
  });

/* ------------------------------------------------------------------
 * START
 * ------------------------------------------------------------------ */

export const startProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ linkId: z.string() }).parse(v))
  .handler(async ({ data, context }) => {
    const { courseId, projectId } = parseLinkId(data.linkId);

    const { data: link, error: linkErr } = await context.supabase
      .from("course_projects")
      .select("course_id, project_id, unlock_rule, required_lesson_id, required_project_id, module_id, is_published, template:course_project_templates!inner(is_published, name)")
      .eq("course_id", courseId)
      .eq("project_id", projectId)
      .maybeSingle();
    if (linkErr) throw linkErr;
    const l = link as any;
    if (!l || l.is_published === false || l.template?.is_published === false) {
      throw new Error("Project not available");
    }
    const enrollments = await getEnrolledCourseIds(context, context.userId);
    const enr = enrollments.find((e) => e.course_id === courseId);
    if (!enr) throw new Error("Not enrolled");

    const sets = await computeUnlockMap(context, context.userId, [courseId]);
    const unlock = evaluateUnlock(l, sets);
    if (!unlock.unlocked) throw new Error(unlock.reason);

    const { data: existing } = await context.supabase
      .from("student_projects")
      .select("*")
      .eq("student_user_id", context.userId)
      .eq("project_id", projectId)
      .eq("course_id", courseId)
      .maybeSingle();
    if (existing) return { studentProject: existing };

    const { data: row, error: insErr } = await (context.supabase
      .from("student_projects") as any)
      .insert({
        student_user_id: context.userId,
        course_id: courseId,
        project_id: projectId,
        enrollment_id: enr.id,
        status: "in_progress",
      })
      .select("*")
      .single();
    if (insErr) throw insErr;

    await logActivity(
      context, courseId, "project_started",
      `Started project: ${l.template.name}`, projectId,
    );

    return { studentProject: row };
  });

/* ------------------------------------------------------------------
 * SUBMIT / RESUBMIT
 * ------------------------------------------------------------------ */

const SubmitSchema = z.object({
  linkId: z.string(),
  title: z.string().trim().max(200).optional().nullable(),
  summary: z.string().trim().max(5000).optional().nullable(),
  submission_notes: z.string().trim().max(5000).optional().nullable(),
  repository_url: z.string().trim().max(500).optional().nullable(),
  live_url: z.string().trim().max(500).optional().nullable(),
  reference_url: z.string().trim().max(500).optional().nullable(),
  attachments: z
    .array(
      z.object({
        name: z.string().max(255),
        path: z.string().max(500),
        size: z.number().nonnegative().optional(),
        type: z.string().max(120).optional(),
      }),
    )
    .max(20)
    .optional()
    .default([]),
});

export const submitProjectVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => SubmitSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { courseId, projectId } = parseLinkId(data.linkId);

    const { data: link, error: linkErr } = await context.supabase
      .from("course_projects")
      .select(`
        course_id, project_id, is_published,
        template:course_project_templates!inner(
          id, name, is_published, requires_repo_link, requires_live_link, requires_attachment
        )
      `)
      .eq("course_id", courseId)
      .eq("project_id", projectId)
      .maybeSingle();
    if (linkErr) throw linkErr;
    const l = link as any;
    if (!l || l.is_published === false || l.template?.is_published === false) {
      throw new Error("Project not available");
    }

    const t = l.template;
    if (t.requires_repo_link && !data.repository_url) throw new Error("Repository URL is required");
    if (t.requires_live_link && !data.live_url) throw new Error("Live URL is required");
    if (t.requires_attachment && (!data.attachments || data.attachments.length === 0)) {
      throw new Error("At least one attachment is required");
    }

    let { data: student, error: spErr } = await context.supabase
      .from("student_projects")
      .select("*")
      .eq("student_user_id", context.userId)
      .eq("project_id", projectId)
      .eq("course_id", courseId)
      .maybeSingle();
    if (spErr) throw spErr;

    if (!student) {
      const enrollments = await getEnrolledCourseIds(context, context.userId);
      const enr = enrollments.find((e) => e.course_id === courseId);
      if (!enr) throw new Error("Not enrolled");
      const { data: created, error: cErr } = await (context.supabase
        .from("student_projects") as any)
        .insert({
          student_user_id: context.userId,
          course_id: courseId,
          project_id: projectId,
          enrollment_id: enr.id,
          status: "in_progress",
        })
        .select("*")
        .single();
      if (cErr) throw cErr;
      student = created;
    }

    const s = student as any;
    if (s.status === "completed" || s.status === "under_review") {
      throw new Error("Cannot submit while the project is under review or completed");
    }

    const nextVersion = (s.current_version ?? 0) + 1;
    const isResubmit = nextVersion > 1;

    const { data: sub, error: subErr } = await (context.supabase
      .from("student_project_submissions") as any)
      .insert({
        student_project_id: s.id,
        student_user_id: context.userId,
        course_id: courseId,
        project_id: projectId,
        version: nextVersion,
        title: data.title ?? null,
        summary: data.summary ?? null,
        submission_notes: data.submission_notes ?? null,
        repository_url: data.repository_url || null,
        live_url: data.live_url || null,
        reference_url: data.reference_url || null,
        attachments: data.attachments ?? [],
        status: "submitted",
      })
      .select("*")
      .single();
    if (subErr) throw subErr;

    const { data: updated, error: upErr } = await (context.supabase
      .from("student_projects") as any)
      .update({
        status: "submitted",
        last_submitted_at: new Date().toISOString(),
        current_version: nextVersion,
      })
      .eq("id", s.id)
      .select("*")
      .single();
    if (upErr) throw upErr;

    await logActivity(
      context, courseId,
      isResubmit ? "project_resubmitted" : "project_submitted",
      `${isResubmit ? "Resubmitted" : "Submitted"} project: ${t.name} (v${nextVersion})`,
      projectId,
    );

    return { submission: sub, studentProject: updated };
  });

/* ------------------------------------------------------------------
 * PORTFOLIO
 * ------------------------------------------------------------------ */

export const setProjectPortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ studentProjectId: z.string().uuid(), included: z.boolean() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: sp, error } = await context.supabase
      .from("student_projects")
      .select("id, status, project_id, course_id, project:course_project_templates!inner(id, name, portfolio_eligible)")
      .eq("id", data.studentProjectId)
      .maybeSingle();
    if (error) throw error;
    const row = sp as any;
    if (!row) throw new Error("Project not found");
    if (!row.project.portfolio_eligible) throw new Error("This project is not portfolio-eligible");
    if (row.status !== "completed") throw new Error("Only completed projects can be added to your portfolio");

    const { data: updated, error: upErr } = await (context.supabase
      .from("student_projects") as any)
      .update({
        portfolio_added: data.included,
        portfolio_selected_at: data.included ? new Date().toISOString() : null,
      })
      .eq("id", data.studentProjectId)
      .select("*")
      .single();
    if (upErr) throw upErr;

    await logActivity(
      context, row.course_id, "project_portfolio_updated",
      `${data.included ? "Added to" : "Removed from"} portfolio: ${row.project.name}`,
      row.project_id,
    );

    return { studentProject: updated };
  });

/* ------------------------------------------------------------------
 * SIGN URLS (refresh)
 * ------------------------------------------------------------------ */

export const signProjectAttachments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ paths: z.array(z.string()).max(50) }).parse(v),
  )
  .handler(async ({ data, context }) => {
    if (!data.paths.length) return { urls: {} as Record<string, string> };
    const prefix = `${context.userId}/`;
    const own = data.paths.filter((p) => p.startsWith(prefix));
    if (!own.length) return { urls: {} as Record<string, string> };
    const { data: signed, error } = await context.supabase
      .storage.from("student-submissions")
      .createSignedUrls(own, 3600);
    if (error) throw error;
    const out: Record<string, string> = {};
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) out[s.path] = s.signedUrl;
    }
    return { urls: out };
  });
