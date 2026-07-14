/**
 * Student Internship — server functions.
 *
 * All access is scoped via requireSupabaseAuth so RLS enforces per-student
 * isolation. Students can only:
 *   - view internship configuration for programs they are enrolled in and
 *     that are published
 *   - view / start / progress their own student_internships, stage progress,
 *     task progress, submissions and activity
 * Reviewer-controlled statuses (under_review, approved, completed) can only
 * be set by an authorised review workflow (admin / service role), never by
 * this module.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type InternshipStatus =
  | "locked"
  | "eligible"
  | "active"
  | "in_progress"
  | "completion_review"
  | "completed"
  | "suspended"
  | "cancelled";

export type StageStatus = "locked" | "available" | "in_progress" | "completed";

export type TaskStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "needs_revision"
  | "completed";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

async function getEnrolledCourses(context: any) {
  const { data, error } = await context.supabase
    .from("enrollments")
    .select("course_id, id, lms_status, start_date")
    .eq("student_user_id", context.userId)
    .in("lms_status", ["active", "completed", "paused"]);
  if (error) throw error;
  return (data ?? []) as Array<{
    course_id: string;
    id: string;
    lms_status: string;
    start_date: string | null;
  }>;
}

async function logActivity(
  context: any,
  studentInternshipId: string | null,
  event: string,
  metadata: Record<string, unknown> = {},
) {
  await (context.supabase.from("student_internship_activity") as any).insert({
    student_user_id: context.userId,
    student_internship_id: studentInternshipId,
    event,
    metadata,
  });
}

/**
 * Compute whether a student meets internship eligibility rules for a course.
 * Uses `eligibility` jsonb config on the internship if present, else defaults
 * to (active enrollment + learning content completed >= threshold, if any).
 */
async function computeEligibility(
  context: any,
  internship: any,
  enrollment: any,
): Promise<{
  eligible: boolean;
  progress: {
    learningPercent: number;
    requiredModulesCompleted: number;
    requiredModulesTotal: number;
    projectsCompleted: number;
    projectsRequired: number;
    assignmentsCompleted: number;
    assignmentsRequired: number;
  };
  reason: string;
}> {
  const rules = (internship.eligibility ?? {}) as Record<string, any>;
  const courseId = internship.course_id;

  // Learning percent — from enrollments.progress_percent if column exists,
  // else compute from lesson_progress.
  const enrProg = await context.supabase
    .from("enrollments")
    .select("progress_percent")
    .eq("id", enrollment.id)
    .maybeSingle();
  const learningPercent = Number(enrProg.data?.progress_percent ?? 0) || 0;

  // Modules
  const [{ data: modules }, { data: modComps }] = await Promise.all([
    context.supabase.from("course_modules").select("id").eq("course_id", courseId),
    context.supabase.from("module_completions").select("module_id").eq("student_user_id", context.userId),
  ]);
  const moduleIds = new Set((modules ?? []).map((m: any) => m.id));
  const completedModules = (modComps ?? [])
    .map((m: any) => m.module_id)
    .filter((id: string) => moduleIds.has(id));

  // Projects — required course_projects
  const [{ data: courseProjects }, { data: spData }] = await Promise.all([
    context.supabase
      .from("course_projects")
      .select("project_id, is_published")
      .eq("course_id", courseId),
    context.supabase
      .from("student_projects")
      .select("project_id, status")
      .eq("student_user_id", context.userId),
  ]);
  const requiredProjects = ((courseProjects ?? []) as any[]).filter((p) => p.is_published !== false);
  const completedProjectIds = new Set(
    ((spData ?? []) as any[]).filter((s) => s.status === "completed").map((s) => s.project_id),
  );
  const projectsCompleted = requiredProjects.filter((p) => completedProjectIds.has(p.project_id)).length;

  // Assignments
  const [{ data: assignments }, { data: sasg }] = await Promise.all([
    context.supabase
      .from("course_assignments")
      .select("id, publish_status")
      .eq("course_id", courseId),
    context.supabase
      .from("student_assignments")
      .select("assignment_id, status")
      .eq("student_user_id", context.userId),
  ]);
  const totalAssignments = ((assignments ?? []) as any[]).filter(
    (a) => (a.publish_status ?? "published") === "published",
  ).length;
  const completedAssignments = ((sasg ?? []) as any[]).filter((a) => a.status === "completed").length;

  const progress = {
    learningPercent,
    requiredModulesCompleted: completedModules.length,
    requiredModulesTotal: moduleIds.size,
    projectsCompleted,
    projectsRequired: requiredProjects.length,
    assignmentsCompleted: completedAssignments,
    assignmentsRequired: totalAssignments,
  };

  const minLearning = Number(rules.min_learning_percent ?? 0) || 0;
  const requireLearningComplete = rules.learning_content_completed === true;
  const requireProjects = rules.required_projects_completed === true;
  const requireAssignments = rules.required_assignments_completed === true;
  const requireModuleId = typeof rules.required_module_id === "string" ? rules.required_module_id : null;
  const manual = rules.manual_access === true;

  if (manual) return { eligible: false, progress, reason: "Manual admin approval required" };

  const learningOk = requireLearningComplete
    ? learningPercent >= 100
    : learningPercent >= minLearning;
  const modulesOk = !requireModuleId || completedModules.includes(requireModuleId);
  const projectsOk = !requireProjects || (projectsCompleted >= requiredProjects.length && requiredProjects.length > 0);
  const assignmentsOk = !requireAssignments || (completedAssignments >= totalAssignments && totalAssignments > 0);

  // If nothing configured, fall back to default: active enrollment + learning completed
  const nothingConfigured =
    !requireLearningComplete && !requireProjects && !requireAssignments && !requireModuleId && !minLearning;
  const eligible = nothingConfigured
    ? learningPercent >= 100
    : learningOk && modulesOk && projectsOk && assignmentsOk;

  return {
    eligible,
    progress,
    reason: eligible ? "All internship prerequisites met" : "Complete required learning milestones",
  };
}

/* ------------------------------------------------------------------ */
/* LIST — Internships across enrolled programs                        */
/* ------------------------------------------------------------------ */

export const listStudentInternships = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const enrollments = await getEnrolledCourses(context);
    if (!enrollments.length) {
      return { internships: [], summary: emptySummary() };
    }
    const courseIds = enrollments.map((e) => e.course_id);

    const { data: internshipRows, error: intErr } = await context.supabase
      .from("internships")
      .select("id, course_id, title, description, duration_weeks, sequential, publish_status, eligibility, completion_requirements")
      .in("course_id", courseIds)
      .eq("publish_status", "published");
    if (intErr) throw intErr;

    const internshipIds = (internshipRows ?? []).map((i: any) => i.id);

    // Courses meta
    const { data: courses } = await context.supabase
      .from("courses")
      .select("id, name, slug")
      .in("id", courseIds);
    const courseById = new Map<string, any>((courses ?? []).map((c: any) => [c.id, c]));

    // Existing student_internships
    const { data: myInternships } = internshipIds.length
      ? await context.supabase
          .from("student_internships")
          .select("*")
          .eq("student_user_id", context.userId)
          .in("internship_id", internshipIds)
      : { data: [] as any[] };
    const myById = new Map<string, any>((myInternships ?? []).map((r: any) => [r.internship_id, r]));

    // Aggregate task/stage counts for progress
    const stagesRes = internshipIds.length
      ? await context.supabase
          .from("internship_stages")
          .select("id, internship_id")
          .in("internship_id", internshipIds)
      : { data: [] as any[] };
    const stagesByInternship = new Map<string, string[]>();
    ((stagesRes.data ?? []) as any[]).forEach((s) => {
      const arr = stagesByInternship.get(s.internship_id) ?? [];
      arr.push(s.id);
      stagesByInternship.set(s.internship_id, arr);
    });

    const allStageIds = ((stagesRes.data ?? []) as any[]).map((s) => s.id);
    const tasksRes = allStageIds.length
      ? await context.supabase
          .from("internship_tasks")
          .select("id, stage_id, is_required")
          .in("stage_id", allStageIds)
          .eq("publish_status", "published")
      : { data: [] as any[] };

    const taskIdToInternship = new Map<string, string>();
    ((tasksRes.data ?? []) as any[]).forEach((t) => {
      // find internship for stage
      for (const [iid, sids] of stagesByInternship.entries()) {
        if (sids.includes(t.stage_id)) taskIdToInternship.set(t.id, iid);
      }
    });

    const siIds = (myInternships ?? []).map((s: any) => s.id);
    const [sitRes, projectsRes] = await Promise.all([
      siIds.length
        ? context.supabase
            .from("student_internship_tasks")
            .select("id, student_internship_id, task_id, status")
            .in("student_internship_id", siIds)
        : Promise.resolve({ data: [] as any[] }),
      internshipIds.length
        ? context.supabase
            .from("internship_projects")
            .select("id, internship_id, is_final, is_required")
            .in("internship_id", internshipIds)
            .eq("publish_status", "published")
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const items: any[] = [];
    let summary = emptySummary();

    for (const internship of internshipRows ?? []) {
      const course = courseById.get(internship.course_id);
      const enrollment = enrollments.find((e) => e.course_id === internship.course_id);
      if (!enrollment) continue;
      const mine = myById.get(internship.id);

      let status: InternshipStatus = "locked";
      let progressPercent = 0;
      let tasksCompleted = 0;
      let tasksTotal = 0;
      let projectsCompleted = 0;
      let projectsTotal = ((projectsRes.data ?? []) as any[]).filter((p) => p.internship_id === internship.id && p.is_required).length;

      const myTasks = ((sitRes.data ?? []) as any[]).filter((t) => t.student_internship_id === mine?.id);
      const internshipTaskIds = Array.from(taskIdToInternship.entries())
        .filter(([, iid]) => iid === internship.id)
        .map(([tid]) => tid);
      tasksTotal = internshipTaskIds.length;
      tasksCompleted = myTasks.filter((t) => t.status === "completed").length;

      if (mine) {
        status = mine.status;
        progressPercent = Number(mine.progress_percent ?? 0);
      } else {
        const elig = await computeEligibility(context, internship, enrollment);
        status = elig.eligible ? "eligible" : "locked";
      }

      const item = {
        internshipId: internship.id,
        studentInternshipId: mine?.id ?? null,
        courseId: internship.course_id,
        courseName: course?.name ?? "Program",
        courseSlug: course?.slug ?? null,
        title: internship.title,
        description: internship.description,
        durationWeeks: internship.duration_weeks,
        sequential: internship.sequential,
        status,
        progressPercent,
        startedAt: mine?.started_at ?? null,
        completedAt: mine?.completed_at ?? null,
        tasksCompleted,
        tasksTotal,
        projectsCompleted,
        projectsTotal,
      };
      items.push(item);

      // summary
      summary.total += 1;
      if (["active", "in_progress"].includes(status)) summary.active += 1;
      if (status === "completed") summary.completed += 1;
      if (status === "completion_review") summary.pendingReview += 1;
      summary.tasksCompleted += tasksCompleted;
    }

    return { internships: items, summary };
  });

function emptySummary() {
  return {
    total: 0,
    active: 0,
    completed: 0,
    pendingReview: 0,
    tasksCompleted: 0,
    projectsCompleted: 0,
    certificateEligible: 0,
  };
}

/* ------------------------------------------------------------------ */
/* DETAILS — one internship with stages / tasks / projects            */
/* ------------------------------------------------------------------ */

export const getInternshipDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ internshipId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { data: internship, error } = await context.supabase
      .from("internships")
      .select("*")
      .eq("id", data.internshipId)
      .eq("publish_status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!internship) throw new Error("Internship not found or not accessible");

    const { data: course } = await context.supabase
      .from("courses")
      .select("id, name, slug")
      .eq("id", internship.course_id)
      .maybeSingle();

    // Verify enrollment
    const enrollments = await getEnrolledCourses(context);
    const enrollment = enrollments.find((e) => e.course_id === internship.course_id);
    if (!enrollment) throw new Error("You are not enrolled in this program");

    // Student internship
    const { data: mine } = await context.supabase
      .from("student_internships")
      .select("*")
      .eq("student_user_id", context.userId)
      .eq("internship_id", internship.id)
      .maybeSingle();

    // Stages + tasks + projects
    const [{ data: stages }, { data: projects }] = await Promise.all([
      context.supabase
        .from("internship_stages")
        .select("*")
        .eq("internship_id", internship.id)
        .eq("publish_status", "published")
        .order("order_index", { ascending: true }),
      context.supabase
        .from("internship_projects")
        .select("*")
        .eq("internship_id", internship.id)
        .eq("publish_status", "published")
        .order("order_index", { ascending: true }),
    ]);

    const stageIds = (stages ?? []).map((s: any) => s.id);
    const [{ data: tasks }, { data: myTasks }, { data: myStages }] = await Promise.all([
      stageIds.length
        ? context.supabase
            .from("internship_tasks")
            .select("*")
            .in("stage_id", stageIds)
            .eq("publish_status", "published")
            .order("order_index", { ascending: true })
        : Promise.resolve({ data: [] as any[] }),
      mine
        ? context.supabase
            .from("student_internship_tasks")
            .select("*")
            .eq("student_internship_id", mine.id)
        : Promise.resolve({ data: [] as any[] }),
      mine
        ? context.supabase
            .from("student_internship_stage_progress")
            .select("*")
            .eq("student_internship_id", mine.id)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const myTaskByTaskId = new Map<string, any>(((myTasks ?? []) as any[]).map((t) => [t.task_id, t]));
    const myStageById = new Map<string, any>(((myStages ?? []) as any[]).map((s) => [s.stage_id, s]));

    // Compute stage/task status w/ sequential unlock
    const stagesEnriched: any[] = [];
    let previousStageComplete = true;
    let requiredTasksCompleted = 0;
    let requiredTasksTotal = 0;

    for (const stage of stages ?? []) {
      const stageTasks = ((tasks ?? []) as any[]).filter((t) => t.stage_id === stage.id);
      const myStage = myStageById.get(stage.id);

      let stageStatus: StageStatus = "locked";
      if (mine) {
        if (myStage?.status === "completed") stageStatus = "completed";
        else if (internship.sequential ? previousStageComplete : true) {
          const anyInProgress = stageTasks.some(
            (t) => ["in_progress", "submitted", "under_review", "needs_revision"].includes(
              myTaskByTaskId.get(t.id)?.status ?? "available",
            ),
          );
          stageStatus = anyInProgress ? "in_progress" : "available";
        }
      }

      const stageTasksEnriched = stageTasks.map((t) => {
        const mt = myTaskByTaskId.get(t.id);
        let taskStatus: TaskStatus;
        if (stageStatus === "locked") taskStatus = "locked";
        else if (mt) taskStatus = mt.status;
        else taskStatus = "available";
        if (t.is_required) {
          requiredTasksTotal += 1;
          if (taskStatus === "completed") requiredTasksCompleted += 1;
        }
        return {
          id: t.id,
          title: t.title,
          taskType: t.task_type,
          description: t.description,
          isRequired: t.is_required,
          estimatedHours: t.estimated_hours,
          dueOffsetDays: t.due_offset_days,
          status: taskStatus,
          currentVersion: mt?.current_version ?? 0,
        };
      });

      const stageCompleted =
        stageTasks.length > 0 &&
        stageTasks
          .filter((t) => t.is_required)
          .every((t) => (myTaskByTaskId.get(t.id)?.status ?? "available") === "completed");

      stagesEnriched.push({
        id: stage.id,
        name: stage.name,
        description: stage.description,
        orderIndex: stage.order_index,
        isRequired: stage.is_required,
        status: stageStatus,
        tasks: stageTasksEnriched,
        tasksCompleted: stageTasksEnriched.filter((t) => t.status === "completed").length,
        tasksTotal: stageTasksEnriched.length,
      });

      if (internship.sequential) previousStageComplete = stageCompleted && stageStatus === "completed";
    }

    // Eligibility snapshot for locked screen
    const eligibility = mine
      ? { eligible: true, progress: null as any, reason: "Internship active" }
      : await computeEligibility(context, internship, enrollment);

    const progressPercent = requiredTasksTotal
      ? Math.round((requiredTasksCompleted / requiredTasksTotal) * 100)
      : 0;

    return {
      internship: {
        id: internship.id,
        title: internship.title,
        description: internship.description,
        durationWeeks: internship.duration_weeks,
        sequential: internship.sequential,
        courseId: internship.course_id,
        courseName: course?.name ?? "Program",
        courseSlug: course?.slug ?? null,
      },
      student: mine
        ? {
            id: mine.id,
            status: mine.status as InternshipStatus,
            startedAt: mine.started_at,
            completedAt: mine.completed_at,
            reviewStartedAt: mine.review_started_at,
            progressPercent,
            currentStageId: mine.current_stage_id,
          }
        : null,
      eligibility,
      stages: stagesEnriched,
      projects: (projects ?? []).map((p: any) => ({
        id: p.id,
        projectType: p.project_type,
        title: p.title,
        description: p.description,
        requirements: p.requirements,
        expectedOutcome: p.expected_outcome,
        submissionInstructions: p.submission_instructions,
        isFinal: p.is_final,
        isRequired: p.is_required,
        courseProjectTemplateId: p.course_project_template_id,
      })),
      requiredTasksCompleted,
      requiredTasksTotal,
    };
  });

/* ------------------------------------------------------------------ */
/* START Internship                                                   */
/* ------------------------------------------------------------------ */

export const startInternship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ internshipId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { data: internship, error } = await context.supabase
      .from("internships")
      .select("id, course_id, publish_status, eligibility")
      .eq("id", data.internshipId)
      .maybeSingle();
    if (error) throw error;
    if (!internship || internship.publish_status !== "published") {
      throw new Error("Internship not available");
    }
    const enrollments = await getEnrolledCourses(context);
    const enrollment = enrollments.find((e) => e.course_id === internship.course_id);
    if (!enrollment) throw new Error("You are not enrolled in this program");

    const elig = await computeEligibility(context, internship, enrollment);
    if (!elig.eligible) throw new Error(`Not eligible yet: ${elig.reason}`);

    // Upsert student_internship
    const { data: existing } = await context.supabase
      .from("student_internships")
      .select("*")
      .eq("student_user_id", context.userId)
      .eq("internship_id", internship.id)
      .maybeSingle();

    let row = existing;
    if (!existing) {
      const { data: inserted, error: insErr } = await context.supabase
        .from("student_internships")
        .insert({
          student_user_id: context.userId,
          course_id: internship.course_id,
          internship_id: internship.id,
          status: "active",
          started_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (insErr) throw insErr;
      row = inserted;
      await logActivity(context, row.id, "internship_started", { internship_id: internship.id });
    } else if (["eligible", "locked"].includes(existing.status)) {
      const { data: updated } = await context.supabase
        .from("student_internships")
        .update({ status: "active", started_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("*")
        .single();
      row = updated ?? existing;
      await logActivity(context, row.id, "internship_started", { internship_id: internship.id });
    }

    return { studentInternshipId: row!.id, status: row!.status };
  });

/* ------------------------------------------------------------------ */
/* START task                                                         */
/* ------------------------------------------------------------------ */

export const startInternshipTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ studentInternshipId: z.string().uuid(), taskId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    // Verify ownership + task belongs to internship
    const { data: si } = await context.supabase
      .from("student_internships")
      .select("id, internship_id, student_user_id, status")
      .eq("id", data.studentInternshipId)
      .maybeSingle();
    if (!si || si.student_user_id !== context.userId) throw new Error("Not authorised");
    if (!["active", "in_progress"].includes(si.status)) throw new Error("Internship not active");

    const { data: task } = await context.supabase
      .from("internship_tasks")
      .select("id, stage_id, publish_status, stage:internship_stages!inner(internship_id)")
      .eq("id", data.taskId)
      .maybeSingle();
    if (!task || task.publish_status !== "published" || (task as any).stage.internship_id !== si.internship_id) {
      throw new Error("Task not available");
    }

    const { data: existing } = await context.supabase
      .from("student_internship_tasks")
      .select("*")
      .eq("student_internship_id", si.id)
      .eq("task_id", data.taskId)
      .maybeSingle();
    if (existing) {
      if (existing.status === "available") {
        await context.supabase
          .from("student_internship_tasks")
          .update({ status: "in_progress", started_at: new Date().toISOString() })
          .eq("id", existing.id);
      }
      await logActivity(context, si.id, "internship_task_started", { task_id: data.taskId });
      return { ok: true };
    }
    await context.supabase.from("student_internship_tasks").insert({
      student_internship_id: si.id,
      task_id: data.taskId,
      status: "in_progress",
      started_at: new Date().toISOString(),
    });
    await context.supabase
      .from("student_internships")
      .update({ status: "in_progress" })
      .eq("id", si.id)
      .in("status", ["active"]);
    await logActivity(context, si.id, "internship_task_started", { task_id: data.taskId });
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Task Details                                                       */
/* ------------------------------------------------------------------ */

export const getInternshipTaskDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ studentInternshipId: z.string().uuid(), taskId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { data: si } = await context.supabase
      .from("student_internships")
      .select("id, internship_id, student_user_id, course_id, status")
      .eq("id", data.studentInternshipId)
      .maybeSingle();
    if (!si || si.student_user_id !== context.userId) throw new Error("Not authorised");

    const { data: task } = await context.supabase
      .from("internship_tasks")
      .select("*, stage:internship_stages!inner(id, name, internship_id)")
      .eq("id", data.taskId)
      .maybeSingle();
    if (!task || (task as any).stage.internship_id !== si.internship_id) throw new Error("Task not accessible");

    const { data: internship } = await context.supabase
      .from("internships")
      .select("title, course_id")
      .eq("id", si.internship_id)
      .maybeSingle();
    const { data: course } = await context.supabase
      .from("courses")
      .select("name, slug")
      .eq("id", si.course_id)
      .maybeSingle();

    const { data: myTask } = await context.supabase
      .from("student_internship_tasks")
      .select("*")
      .eq("student_internship_id", si.id)
      .eq("task_id", data.taskId)
      .maybeSingle();

    const { data: submissions } = myTask
      ? await context.supabase
          .from("student_internship_task_submissions")
          .select("*")
          .eq("student_internship_task_id", myTask.id)
          .order("version", { ascending: false })
      : { data: [] as any[] };

    return {
      task: {
        id: task.id,
        title: task.title,
        taskType: task.task_type,
        description: task.description,
        objective: task.objective,
        instructions: task.instructions,
        requirements: task.requirements,
        expectedOutcome: task.expected_outcome,
        submissionInstructions: task.submission_instructions,
        evaluationCriteria: task.evaluation_criteria,
        submissionTypes: task.submission_types ?? [],
        allowMultipleFiles: task.allow_multiple_files,
        dueOffsetDays: task.due_offset_days,
        estimatedHours: task.estimated_hours,
        isRequired: task.is_required,
        stageName: (task as any).stage?.name,
      },
      internship: { title: internship?.title, courseName: course?.name, courseSlug: course?.slug },
      studentTask: myTask
        ? {
            id: myTask.id,
            status: myTask.status as TaskStatus,
            currentVersion: myTask.current_version,
            startedAt: myTask.started_at,
            completedAt: myTask.completed_at,
          }
        : null,
      submissions: (submissions ?? []).map((s: any) => ({
        id: s.id,
        version: s.version,
        textResponse: s.text_response,
        submissionLink: s.submission_link,
        repositoryLink: s.repository_link,
        liveProjectLink: s.live_project_link,
        files: s.files ?? [],
        submissionNotes: s.submission_notes,
        isLate: s.is_late,
        submittedAt: s.submitted_at,
        reviewStatus: s.review_status,
        reviewNotes: s.review_notes,
        reviewedAt: s.reviewed_at,
        score: s.score,
        maxScore: s.max_score,
        result: s.result,
      })),
    };
  });

/* ------------------------------------------------------------------ */
/* Submit task                                                        */
/* ------------------------------------------------------------------ */

const FileSchema = z.object({
  name: z.string().max(200),
  path: z.string().max(500),
  size: z.number().optional(),
  type: z.string().optional(),
});

export const submitInternshipTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        studentInternshipTaskId: z.string().uuid(),
        textResponse: z.string().max(20000).optional().nullable(),
        submissionLink: z.string().url().max(1000).optional().nullable(),
        repositoryLink: z.string().url().max(1000).optional().nullable(),
        liveProjectLink: z.string().url().max(1000).optional().nullable(),
        submissionNotes: z.string().max(4000).optional().nullable(),
        files: z.array(FileSchema).max(20).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    // Verify ownership
    const { data: sit } = await context.supabase
      .from("student_internship_tasks")
      .select("id, task_id, student_internship_id, current_version, status, si:student_internships!inner(student_user_id, id)")
      .eq("id", data.studentInternshipTaskId)
      .maybeSingle();
    if (!sit || (sit as any).si.student_user_id !== context.userId) throw new Error("Not authorised");
    if (!["in_progress", "needs_revision"].includes(sit.status)) throw new Error("Task not open for submission");

    const anyContent =
      (data.textResponse && data.textResponse.trim()) ||
      data.submissionLink ||
      data.repositoryLink ||
      data.liveProjectLink ||
      (data.files && data.files.length);
    if (!anyContent) throw new Error("Empty submission is not allowed");

    const version = (sit.current_version ?? 0) + 1;

    const { error: subErr } = await context.supabase
      .from("student_internship_task_submissions")
      .insert({
        student_internship_task_id: sit.id,
        version,
        text_response: data.textResponse ?? null,
        submission_link: data.submissionLink ?? null,
        repository_link: data.repositoryLink ?? null,
        live_project_link: data.liveProjectLink ?? null,
        files: data.files ?? [],
        submission_notes: data.submissionNotes ?? null,
        review_status: "pending",
      });
    if (subErr) throw subErr;

    await context.supabase
      .from("student_internship_tasks")
      .update({ status: "submitted", current_version: version })
      .eq("id", sit.id);

    await logActivity(context, (sit as any).si.id, "internship_task_submitted", {
      task_id: sit.task_id,
      version,
    });

    return { ok: true, version };
  });

/* ------------------------------------------------------------------ */
/* Signed upload URL for private storage                              */
/* ------------------------------------------------------------------ */

export const createInternshipUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        studentInternshipTaskId: z.string().uuid(),
        filename: z.string().min(1).max(200),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    // Ownership check
    const { data: sit } = await context.supabase
      .from("student_internship_tasks")
      .select("id, si:student_internships!inner(student_user_id)")
      .eq("id", data.studentInternshipTaskId)
      .maybeSingle();
    if (!sit || (sit as any).si.student_user_id !== context.userId) throw new Error("Not authorised");

    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `internships/${context.userId}/${sit.id}/${Date.now()}-${safe}`;
    const { data: signed, error } = await context.supabase.storage
      .from("student-submissions")
      .createSignedUploadUrl(path);
    if (error) throw error;
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

export const getInternshipFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ path: z.string() }).parse(raw))
  .handler(async ({ context, data }) => {
    if (!data.path.startsWith(`internships/${context.userId}/`)) {
      throw new Error("Not authorised");
    }
    const { data: signed, error } = await context.supabase.storage
      .from("student-submissions")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw error;
    return { url: signed.signedUrl };
  });

export const lookupStudentInternship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ internshipId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("student_internships")
      .select("id")
      .eq("internship_id", data.internshipId)
      .eq("student_user_id", context.userId)
      .maybeSingle();
    return { studentInternshipId: row?.id ?? null };
  });
