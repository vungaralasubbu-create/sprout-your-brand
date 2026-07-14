/**
 * Student Assignments — server functions.
 * All reads/writes go through requireSupabaseAuth so RLS enforces isolation.
 * Reviewer-controlled statuses (under_review / approved / completed) are never
 * settable by students.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const UuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UuidRe.test(s);

export type AssignmentStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "needs_revision"
  | "completed"
  | "overdue";

export type FileAtt = { name: string; path: string; size?: number; type?: string };

/* ------------- helpers ------------- */

async function getEnrollments(context: any, userId: string) {
  const { data } = await context.supabase
    .from("enrollments")
    .select("id, course_id, lms_status, start_date")
    .eq("student_user_id", userId)
    .in("lms_status", ["active", "completed", "paused"]);
  return (data ?? []) as Array<{ id: string; course_id: string | null; lms_status: string; start_date: string | null }>;
}

async function logActivity(context: any, courseId: string | null, type: string, desc: string, entityId?: string | null) {
  try {
    await context.supabase.from("student_activity").insert({
      student_user_id: context.userId,
      course_id: courseId,
      activity_type: type,
      description: desc,
      entity_id: entityId ?? null,
    });
  } catch {
    /* non-fatal */
  }
}

type UnlockSets = {
  completedLessons: Set<string>;
  completedModules: Set<string>;
  completedAssignments: Set<string>;
};

async function loadUnlockSets(context: any, userId: string, courseIds: string[]): Promise<UnlockSets> {
  if (!courseIds.length) {
    return { completedLessons: new Set(), completedModules: new Set(), completedAssignments: new Set() };
  }
  const [{ data: lp }, { data: mc }, { data: sa }] = await Promise.all([
    context.supabase
      .from("lesson_progress")
      .select("lesson_id, status")
      .eq("student_user_id", userId)
      .in("course_id", courseIds)
      .eq("status", "completed"),
    context.supabase
      .from("module_completions")
      .select("module_id")
      .eq("student_user_id", userId)
      .in("course_id", courseIds),
    context.supabase
      .from("student_assignments")
      .select("assignment_id, status")
      .eq("student_user_id", userId)
      .in("course_id", courseIds)
      .eq("status", "completed"),
  ]);
  return {
    completedLessons: new Set((lp ?? []).map((r: any) => r.lesson_id)),
    completedModules: new Set((mc ?? []).map((r: any) => r.module_id)),
    completedAssignments: new Set((sa ?? []).map((r: any) => r.assignment_id)),
  };
}

function evaluateUnlock(a: any, sets: UnlockSets): { unlocked: boolean; reason: string } {
  const rule = a.unlock_rule ?? "module_available";
  switch (rule) {
    case "program_enrollment":
    case "module_available":
      return { unlocked: true, reason: "" };
    case "module_completed":
      if (!a.unlock_module_id) return { unlocked: true, reason: "" };
      return sets.completedModules.has(a.unlock_module_id)
        ? { unlocked: true, reason: "" }
        : { unlocked: false, reason: "Complete the required module first" };
    case "lesson_completed":
      if (!a.unlock_lesson_id) return { unlocked: true, reason: "" };
      return sets.completedLessons.has(a.unlock_lesson_id)
        ? { unlocked: true, reason: "" }
        : { unlocked: false, reason: "Complete the required lesson first" };
    case "assignment_completed":
      if (!a.unlock_assignment_id) return { unlocked: true, reason: "" };
      return sets.completedAssignments.has(a.unlock_assignment_id)
        ? { unlocked: true, reason: "" }
        : { unlocked: false, reason: "Complete the previous assignment first" };
    case "manual":
      return { unlocked: false, reason: "Manual access required — contact your mentor" };
    default:
      return { unlocked: true, reason: "" };
  }
}

function computeDueAt(assignment: any, enrollmentStart: string | null): string | null {
  if (assignment.due_at) return assignment.due_at;
  if (assignment.due_days && enrollmentStart) {
    const d = new Date(enrollmentStart);
    d.setDate(d.getDate() + Number(assignment.due_days));
    return d.toISOString();
  }
  return null;
}

function deriveStatus(
  a: any,
  sa: any,
  unlocked: boolean,
  dueAt: string | null,
): AssignmentStatus {
  if (sa?.status === "completed") return "completed";
  if (sa?.status === "under_review") return "under_review";
  if (sa?.status === "needs_revision") return "needs_revision";
  if (sa?.status === "submitted") return "submitted";
  if (!unlocked && !sa) return "locked";
  if (sa?.status === "in_progress") {
    if (dueAt && new Date(dueAt) < new Date()) return "overdue";
    return "in_progress";
  }
  if (dueAt && new Date(dueAt) < new Date()) return "overdue";
  return "available";
}

/* ------------- LIST ------------- */

export const listStudentAssignmentsV2 = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const enrollments = await getEnrollments(context, context.userId);
    const courseIds = Array.from(
      new Set(enrollments.map((e) => e.course_id).filter((v): v is string => Boolean(v))),
    );
    if (!courseIds.length) return { assignments: [], summary: emptySummary() };

    const [{ data: assigns }, { data: sa }, { data: courses }, { data: modules }] = await Promise.all([
      context.supabase
        .from("course_assignments")
        .select(
          "id, course_id, module_id, name, description, assignment_type, due_at, due_days, max_score, passing_score, is_required, allow_text, allow_file, allow_link, allow_repo, allow_multiple_files, block_late, unlock_rule, unlock_lesson_id, unlock_module_id, unlock_assignment_id, is_published, display_order",
        )
        .in("course_id", courseIds)
        .eq("is_published", true)
        .order("display_order"),
      context.supabase
        .from("student_assignments")
        .select("*")
        .eq("student_user_id", context.userId),
      context.supabase.from("courses").select("id, name, slug").in("id", courseIds),
      context.supabase.from("course_modules").select("id, name, course_id").in("course_id", courseIds),
    ]);

    const sets = await loadUnlockSets(context, context.userId, courseIds);
    const courseMap = new Map((courses ?? []).map((c: any) => [c.id, c]));
    const modMap = new Map((modules ?? []).map((m: any) => [m.id, m]));
    const saMap = new Map<string, any>();
    for (const r of sa ?? []) saMap.set((r as any).assignment_id, r);
    const enrByCourse = new Map(enrollments.map((e) => [e.course_id, e]));

    // latest submissions per assignment for score display
    const assignIds = (assigns ?? []).map((a: any) => a.id);
    let latestByAssignment = new Map<string, any>();
    if (assignIds.length) {
      const { data: latest } = await context.supabase
        .from("assignment_submissions")
        .select("assignment_id, version, score, result, status, submitted_at, is_late")
        .eq("student_user_id", context.userId)
        .in("assignment_id", assignIds)
        .order("version", { ascending: false });
      for (const s of latest ?? []) {
        const key = (s as any).assignment_id;
        if (!latestByAssignment.has(key)) latestByAssignment.set(key, s);
      }
    }

    const rows = (assigns ?? []).map((a: any) => {
      const enr = enrByCourse.get(a.course_id);
      const dueAt = computeDueAt(a, enr?.start_date ?? null);
      const unlock = evaluateUnlock(a, sets);
      const saRow = saMap.get(a.id);
      const derived = deriveStatus(a, saRow, unlock.unlocked, dueAt);
      const latest = latestByAssignment.get(a.id);
      return {
        id: a.id,
        name: a.name,
        description: a.description,
        assignment_type: a.assignment_type,
        module_id: a.module_id,
        module: a.module_id ? modMap.get(a.module_id) ?? null : null,
        course: courseMap.get(a.course_id) ?? null,
        due_at: dueAt,
        is_required: a.is_required,
        max_score: a.max_score,
        passing_score: a.passing_score,
        status: derived,
        unlock_reason: unlock.reason,
        score: latest?.score ?? null,
        result: latest?.result ?? null,
        last_submitted_at: saRow?.last_submitted_at ?? null,
        current_version: saRow?.current_version ?? 0,
      };
    });

    const summary = {
      total: rows.length,
      pending: rows.filter((r) => r.status === "available").length,
      in_progress: rows.filter((r) => r.status === "in_progress").length,
      submitted: rows.filter((r) => r.status === "submitted").length,
      under_review: rows.filter((r) => r.status === "under_review").length,
      needs_revision: rows.filter((r) => r.status === "needs_revision").length,
      completed: rows.filter((r) => r.status === "completed").length,
      overdue: rows.filter((r) => r.status === "overdue").length,
    };

    return { assignments: rows, summary };
  });

function emptySummary() {
  return {
    total: 0, pending: 0, in_progress: 0, submitted: 0,
    under_review: 0, needs_revision: 0, completed: 0, overdue: 0,
  };
}

/* ------------- DETAILS ------------- */

export const getStudentAssignmentDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ assignmentId: z.string().refine(isUuid) }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: a, error } = await context.supabase
      .from("course_assignments")
      .select("*")
      .eq("id", data.assignmentId)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (!a) throw new Error("Assignment not found");

    const enrollments = await getEnrollments(context, context.userId);
    const enr = enrollments.find((e) => e.course_id === (a as any).course_id);
    if (!enr) throw new Error("You are not enrolled in this program");

    const [{ data: course }, { data: mod }, { data: sa }, { data: subs }] = await Promise.all([
      context.supabase.from("courses").select("id, name, slug").eq("id", (a as any).course_id).maybeSingle(),
      (a as any).module_id
        ? context.supabase.from("course_modules").select("id, name").eq("id", (a as any).module_id).maybeSingle()
        : Promise.resolve({ data: null }),
      context.supabase
        .from("student_assignments")
        .select("*")
        .eq("student_user_id", context.userId)
        .eq("assignment_id", data.assignmentId)
        .maybeSingle(),
      context.supabase
        .from("assignment_submissions")
        .select("*")
        .eq("student_user_id", context.userId)
        .eq("assignment_id", data.assignmentId)
        .order("version", { ascending: false }),
    ]);

    const sets = await loadUnlockSets(context, context.userId, [(a as any).course_id]);
    const unlock = evaluateUnlock(a, sets);
    const dueAt = computeDueAt(a, enr.start_date ?? null);
    const status = deriveStatus(a, sa, unlock.unlocked, dueAt);

    // Signed URLs for file attachments across versions
    const allPaths: string[] = [];
    for (const s of (subs ?? []) as any[]) {
      for (const f of (s.files as FileAtt[]) ?? []) {
        if (f?.path) allPaths.push(f.path);
      }
    }
    const signed: Record<string, string> = {};
    if (allPaths.length) {
      const { data: urls } = await context.supabase
        .storage.from("student-submissions")
        .createSignedUrls(allPaths, 3600);
      for (const u of urls ?? []) if (u.path && u.signedUrl) signed[u.path] = u.signedUrl;
    }

    await logActivity(
      context,
      (a as any).course_id,
      "assignment_opened",
      `Opened assignment: ${(a as any).name}`,
      (a as any).id,
    );

    return {
      assignment: a,
      course,
      module: mod,
      studentAssignment: sa,
      submissions: subs ?? [],
      signedUrls: signed,
      unlocked: unlock.unlocked || Boolean(sa),
      unlockReason: unlock.reason,
      due_at: dueAt,
      status,
    };
  });

/* ------------- START ------------- */

export const startAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ assignmentId: z.string().refine(isUuid) }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: a } = await context.supabase
      .from("course_assignments")
      .select("id, course_id, name, unlock_rule, unlock_lesson_id, unlock_module_id, unlock_assignment_id, is_published")
      .eq("id", data.assignmentId)
      .maybeSingle();
    if (!a || (a as any).is_published === false) throw new Error("Assignment not available");
    const enrollments = await getEnrollments(context, context.userId);
    const enr = enrollments.find((e) => e.course_id === (a as any).course_id);
    if (!enr) throw new Error("Not enrolled");
    const sets = await loadUnlockSets(context, context.userId, [(a as any).course_id]);
    const unlock = evaluateUnlock(a, sets);
    if (!unlock.unlocked) throw new Error(unlock.reason || "Assignment is locked");

    const { data: existing } = await context.supabase
      .from("student_assignments")
      .select("*")
      .eq("student_user_id", context.userId)
      .eq("assignment_id", data.assignmentId)
      .maybeSingle();
    if (existing) return { studentAssignment: existing };

    const { data: row, error } = await (context.supabase.from("student_assignments") as any)
      .insert({
        student_user_id: context.userId,
        assignment_id: data.assignmentId,
        course_id: (a as any).course_id,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    await logActivity(context, (a as any).course_id, "assignment_started", `Started assignment: ${(a as any).name}`, (a as any).id);
    return { studentAssignment: row };
  });

/* ------------- SAVE / SUBMIT ------------- */

const AttachmentSchema = z.object({
  name: z.string().max(255),
  path: z.string().max(500),
  size: z.number().nonnegative().optional(),
  type: z.string().max(120).optional(),
});

const SubmissionInput = z.object({
  assignmentId: z.string().refine(isUuid),
  submissionText: z.string().max(20000).optional().nullable(),
  submissionLink: z.string().max(500).optional().nullable(),
  repositoryLink: z.string().max(500).optional().nullable(),
  files: z.array(AttachmentSchema).max(20).optional().default([]),
  asDraft: z.boolean().optional().default(false),
});

function validUrl(u?: string | null) {
  if (!u) return true;
  try { new URL(u); return true; } catch { return false; }
}

async function loadAssignmentForWrite(context: any, assignmentId: string) {
  const { data: a } = await context.supabase
    .from("course_assignments")
    .select("*")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!a || (a as any).is_published === false) throw new Error("Assignment not available");
  return a as any;
}

export const submitAssignmentVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => SubmissionInput.parse(v))
  .handler(async ({ data, context }) => {
    const a = await loadAssignmentForWrite(context, data.assignmentId);
    const enrollments = await getEnrollments(context, context.userId);
    const enr = enrollments.find((e) => e.course_id === a.course_id);
    if (!enr) throw new Error("Not enrolled");
    const sets = await loadUnlockSets(context, context.userId, [a.course_id]);
    const unlock = evaluateUnlock(a, sets);
    if (!unlock.unlocked) throw new Error(unlock.reason || "Locked");

    if (!validUrl(data.submissionLink)) throw new Error("Submission link is not a valid URL");
    if (!validUrl(data.repositoryLink)) throw new Error("Repository link is not a valid URL");
    if (data.submissionLink && !a.allow_link) throw new Error("Link submissions are not enabled");
    if (data.repositoryLink && !a.allow_repo) throw new Error("Repository links are not enabled");
    if ((data.files?.length ?? 0) > 0 && !a.allow_file) throw new Error("File uploads are not enabled");
    if ((data.files?.length ?? 0) > 1 && !a.allow_multiple_files) throw new Error("Only one file is allowed");
    if (data.submissionText && !a.allow_text) throw new Error("Text responses are not enabled");

    // Ensure student_assignments row exists
    let saRow: any;
    {
      const { data: existing } = await context.supabase
        .from("student_assignments")
        .select("*")
        .eq("student_user_id", context.userId)
        .eq("assignment_id", data.assignmentId)
        .maybeSingle();
      saRow = existing;
      if (!saRow) {
        const { data: created, error: e2 } = await (context.supabase.from("student_assignments") as any)
          .insert({
            student_user_id: context.userId,
            assignment_id: data.assignmentId,
            course_id: a.course_id,
            status: "in_progress",
            started_at: new Date().toISOString(),
          })
          .select("*").single();
        if (e2) throw e2;
        saRow = created;
      }
    }

    // Lock: cannot resubmit once completed / under_review (unless needs_revision)
    if (saRow.status === "completed" || saRow.status === "under_review") {
      throw new Error("This assignment is locked from resubmission");
    }

    // Late handling
    const dueAt = computeDueAt(a, enr.start_date ?? null);
    const now = new Date();
    const isLate = dueAt ? new Date(dueAt) < now : false;
    if (!data.asDraft && isLate && a.block_late) throw new Error("Submission deadline has passed");

    if (!data.asDraft) {
      // final validation: not empty
      const hasContent =
        (data.submissionText && data.submissionText.trim().length > 0) ||
        (data.submissionLink && data.submissionLink.trim().length > 0) ||
        (data.repositoryLink && data.repositoryLink.trim().length > 0) ||
        (data.files && data.files.length > 0);
      if (!hasContent) throw new Error("Submission cannot be empty");
    }

    // Determine next version. Drafts are stored on their own version too, but
    // the same draft row is upserted rather than creating a new version each save.
    let insertedId: string;
    if (data.asDraft) {
      // find current draft
      const { data: draft } = await context.supabase
        .from("assignment_submissions")
        .select("id, version")
        .eq("student_user_id", context.userId)
        .eq("assignment_id", data.assignmentId)
        .eq("is_draft", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (draft) {
        const { error: uerr } = await context.supabase
          .from("assignment_submissions")
          .update({
            submission_text: data.submissionText ?? null,
            submission_link: data.submissionLink ?? null,
            repository_link: data.repositoryLink ?? null,
            files: data.files ?? [],
            is_late: isLate,
            status: "draft",
            submitted_at: new Date().toISOString(),
          })
          .eq("id", (draft as any).id);
        if (uerr) throw uerr;
        insertedId = (draft as any).id;
      } else {
        const { data: latest } = await context.supabase
          .from("assignment_submissions")
          .select("version")
          .eq("student_user_id", context.userId)
          .eq("assignment_id", data.assignmentId)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();
        const nextV = ((latest as any)?.version ?? 0) + 1;
        const { data: inserted, error: ierr } = await (context.supabase.from("assignment_submissions") as any)
          .insert({
            student_user_id: context.userId,
            assignment_id: data.assignmentId,
            course_id: a.course_id,
            enrollment_id: enr.id,
            submission_text: data.submissionText ?? null,
            submission_link: data.submissionLink ?? null,
            repository_link: data.repositoryLink ?? null,
            files: data.files ?? [],
            is_draft: true,
            is_late: isLate,
            status: "draft",
            version: nextV,
            submitted_at: new Date().toISOString(),
          })
          .select("id").single();
        if (ierr) throw ierr;
        insertedId = inserted.id;
      }

      await context.supabase
        .from("student_assignments")
        .update({ status: "in_progress" })
        .eq("id", saRow.id);
      await logActivity(context, a.course_id, "assignment_draft_saved", `Saved draft: ${a.name}`, a.id);
      return { ok: true, submissionId: insertedId, draft: true };
    }

    // Final: promote/replace current draft (if any) into a submitted version
    const { data: currentDraft } = await context.supabase
      .from("assignment_submissions")
      .select("id, version")
      .eq("student_user_id", context.userId)
      .eq("assignment_id", data.assignmentId)
      .eq("is_draft", true)
      .maybeSingle();

    let version: number;
    if (currentDraft) {
      version = (currentDraft as any).version;
      const { error: uerr } = await context.supabase
        .from("assignment_submissions")
        .update({
          submission_text: data.submissionText ?? null,
          submission_link: data.submissionLink ?? null,
          repository_link: data.repositoryLink ?? null,
          files: data.files ?? [],
          is_draft: false,
          is_late: isLate,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", (currentDraft as any).id);
      if (uerr) throw uerr;
      insertedId = (currentDraft as any).id;
    } else {
      const { data: latest } = await context.supabase
        .from("assignment_submissions")
        .select("version")
        .eq("student_user_id", context.userId)
        .eq("assignment_id", data.assignmentId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      version = ((latest as any)?.version ?? 0) + 1;
      const { data: inserted, error: ierr } = await (context.supabase.from("assignment_submissions") as any)
        .insert({
          student_user_id: context.userId,
          assignment_id: data.assignmentId,
          course_id: a.course_id,
          enrollment_id: enr.id,
          submission_text: data.submissionText ?? null,
          submission_link: data.submissionLink ?? null,
          repository_link: data.repositoryLink ?? null,
          files: data.files ?? [],
          is_draft: false,
          is_late: isLate,
          status: "submitted",
          version,
          submitted_at: new Date().toISOString(),
        })
        .select("id").single();
      if (ierr) throw ierr;
      insertedId = inserted.id;
    }

    await context.supabase
      .from("student_assignments")
      .update({
        status: "submitted",
        last_submitted_at: new Date().toISOString(),
        current_version: version,
      })
      .eq("id", saRow.id);

    await logActivity(
      context,
      a.course_id,
      isLate ? "assignment_submitted_late" : "assignment_submitted",
      `Submitted assignment: ${a.name} (v${version})`,
      a.id,
    );

    return { ok: true, submissionId: insertedId, version, late: isLate };
  });
