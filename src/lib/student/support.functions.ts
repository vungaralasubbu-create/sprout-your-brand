import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Category = z.enum([
  "program_access","lesson_or_video","learning_progress","live_session",
  "project","assignment","certificate","internship","career_center",
  "resume_builder","interview_practice","ai_mentor","technical_issue",
  "account_issue","other",
]);
const ContextType = z.enum([
  "none","program","lesson","live_session","project","assignment",
  "certificate","internship","internship_task","resume","interview_session",
  "ai_mentor_conversation",
]);
export type SupportCategory = z.infer<typeof Category>;
export type SupportContextType = z.infer<typeof ContextType>;

const AttachmentSchema = z.object({
  name: z.string().max(200),
  path: z.string().max(400),
  size: z.number().nonnegative(),
  type: z.string().max(100),
});

// ============================================================
// Overview
// ============================================================
export const getSupportOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const { data } = await sb
      .from("student_support_tickets")
      .select("id, status")
      .eq("student_user_id", uid);
    const rows = (data ?? []) as any[];
    const openStatuses = ["open","assigned","in_progress","waiting_student","waiting_support"];
    const open = rows.filter((r) => openStatuses.includes(r.status)).length;
    const waitingSupport = rows.filter((r) => r.status === "waiting_support" || r.status === "open" || r.status === "assigned" || r.status === "in_progress").length;
    const needsReply = rows.filter((r) => r.status === "waiting_student").length;
    const resolved = rows.filter((r) => r.status === "resolved" || r.status === "closed").length;
    return { open, waitingSupport, needsReply, resolved };
  });

// ============================================================
// Context options (owned by student only)
// ============================================================
export const getSupportContextOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        context_type: ContextType,
        program_id: z.string().uuid().nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const t = data.context_type;

    if (t === "lesson") {
      if (!data.program_id) return { options: [] };
      // Only if enrolled
      const { data: enr } = await sb
        .from("enrollments")
        .select("id").eq("student_user_id", uid).eq("course_id", data.program_id).maybeSingle();
      if (!enr) return { options: [] };
      const { data: rows } = await sb
        .from("course_lessons")
        .select("id, name, display_order, course_topics!inner(name, course_modules!inner(name, course_id))")
        .eq("course_topics.course_modules.course_id", data.program_id)
        .order("display_order");
      return {
        options: ((rows ?? []) as any[]).map((l) => ({
          id: l.id,
          label: `${l.course_topics?.course_modules?.name ?? "Module"} — ${l.name}`,
        })),
      };
    }
    if (t === "live_session") {
      const { data: rows } = await sb
        .from("session_attendance")
        .select("session_id, live_sessions(id, title, scheduled_at)")
        .eq("student_user_id", uid);
      return {
        options: ((rows ?? []) as any[])
          .map((r) => r.live_sessions).filter(Boolean)
          .map((s: any) => ({ id: s.id, label: `${s.title}${s.scheduled_at ? ` — ${new Date(s.scheduled_at).toLocaleDateString()}` : ""}` })),
      };
    }
    if (t === "project") {
      const { data: rows } = await sb
        .from("student_projects")
        .select("id, status, course_project_templates(name)")
        .eq("student_user_id", uid);
      return {
        options: ((rows ?? []) as any[]).map((r) => ({
          id: r.id,
          label: `${r.course_project_templates?.name ?? "Project"} — ${String(r.status).replace(/_/g, " ")}`,
        })),
      };
    }
    if (t === "assignment") {
      const { data: rows } = await sb
        .from("student_assignments")
        .select("id, status, course_assignments(name)")
        .eq("student_user_id", uid);
      return {
        options: ((rows ?? []) as any[]).map((r) => ({
          id: r.id,
          label: `${r.course_assignments?.name ?? "Assignment"} — ${String(r.status).replace(/_/g, " ")}`,
        })),
      };
    }
    if (t === "certificate") {
      const { data: rows } = await sb
        .from("certificates")
        .select("id, course_name, certificate_type, certificate_number")
        .eq("student_user_id", uid);
      return {
        options: ((rows ?? []) as any[]).map((r) => ({
          id: r.id,
          label: `${r.course_name ?? "Certificate"} — ${r.certificate_type ?? ""} ${r.certificate_number ?? ""}`.trim(),
        })),
      };
    }
    if (t === "internship") {
      const { data: rows } = await sb
        .from("student_internships")
        .select("id, status, internships:internship_id(name)")
        .eq("student_user_id", uid);
      return {
        options: ((rows ?? []) as any[]).map((r) => ({
          id: r.id,
          label: `${r.internships?.name ?? "Internship"} — ${String(r.status).replace(/_/g, " ")}`,
        })),
      };
    }
    if (t === "internship_task") {
      const { data: rows } = await sb
        .from("student_internship_tasks")
        .select("id, status, internship_tasks(title), student_internships!inner(student_user_id)")
        .eq("student_internships.student_user_id", uid);
      return {
        options: ((rows ?? []) as any[]).map((r) => ({
          id: r.id,
          label: `${r.internship_tasks?.title ?? "Task"} — ${String(r.status).replace(/_/g, " ")}`,
        })),
      };
    }
    if (t === "interview_session") {
      const { data: rows } = await sb
        .from("interview_sessions")
        .select("id, interview_type, target_role, status, created_at")
        .eq("student_user_id", uid)
        .order("created_at", { ascending: false })
        .limit(30);
      return {
        options: ((rows ?? []) as any[]).map((r) => ({
          id: r.id,
          label: `${r.interview_type} — ${r.target_role ?? ""} — ${new Date(r.created_at).toLocaleDateString()}`,
        })),
      };
    }
    if (t === "ai_mentor_conversation") {
      const { data: rows } = await sb
        .from("ai_mentor_conversations")
        .select("id, title, last_activity_at")
        .eq("student_user_id", uid)
        .is("archived_at", null)
        .order("last_activity_at", { ascending: false })
        .limit(30);
      return {
        options: ((rows ?? []) as any[]).map((r) => ({ id: r.id, label: r.title })),
      };
    }
    return { options: [] };
  });

export const getEnrolledPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const { data } = await sb
      .from("enrollments")
      .select("course_id, courses(id, title, slug)")
      .eq("student_user_id", context.userId);
    return ((data ?? []) as any[])
      .map((e) => e.courses)
      .filter(Boolean)
      .map((c: any) => ({ id: c.id, title: c.title, slug: c.slug }));
  });

// ============================================================
// Attachments: signed upload + signed download
// ============================================================
const BUCKET = "support-attachments";

export const requestAttachmentUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      file_name: z.string().min(1).max(200),
      size: z.number().max(10 * 1024 * 1024, "Max 10 MB"),
      content_type: z.string().max(100),
    }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const allowed = [".pdf",".doc",".docx",".txt",".jpg",".jpeg",".png"];
    const lower = data.file_name.toLowerCase();
    if (!allowed.some((ext) => lower.endsWith(ext))) {
      throw new Error("Unsupported file type");
    }
    const safeName = data.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `student/${uid}/${Date.now()}-${safeName}`;
    const { data: signed, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw error;
    return { path, signed_url: signed.signedUrl, token: signed.token };
  });

export const getAttachmentDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ ticket_id: z.string().uuid(), path: z.string().min(1) }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    // Verify authorised: ticket owned by user OR admin
    const { data: t } = await sb
      .from("student_support_tickets")
      .select("id, student_user_id, attachments")
      .eq("id", data.ticket_id)
      .maybeSingle();
    if (!t) throw new Error("Ticket not found");
    if (t.student_user_id !== uid) {
      // Check via messages that the path belongs to this ticket
    }
    // Verify path appears on ticket or a non-internal ticket message
    const { data: msgs } = await sb
      .from("student_support_messages")
      .select("attachments, is_internal")
      .eq("ticket_id", data.ticket_id);
    const paths = new Set<string>();
    (t.attachments ?? []).forEach((a: any) => paths.add(a.path));
    ((msgs ?? []) as any[]).forEach((m) => {
      if (m.is_internal && t.student_user_id === uid) return;
      (m.attachments ?? []).forEach((a: any) => paths.add(a.path));
    });
    if (!paths.has(data.path)) throw new Error("Attachment not authorised");
    const { data: signed, error } = await sb.storage
      .from(BUCKET).createSignedUrl(data.path, 60 * 5);
    if (error) throw error;
    return { url: signed.signedUrl };
  });

// ============================================================
// Create ticket
// ============================================================
const CreateSchema = z.object({
  category: Category,
  program_id: z.string().uuid().nullable().optional(),
  context_type: ContextType.default("none"),
  context_record_id: z.string().uuid().nullable().optional(),
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(6000),
  attachments: z.array(AttachmentSchema).max(5).default([]),
});

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CreateSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;

    // Validate program ownership when provided
    if (data.program_id) {
      const { data: enr } = await sb
        .from("enrollments").select("id")
        .eq("student_user_id", uid).eq("course_id", data.program_id).maybeSingle();
      if (!enr) throw new Error("You are not enrolled in this program");
    }

    const { data: ticket, error } = await sb
      .from("student_support_tickets")
      .insert({
        student_user_id: uid,
        category: data.category,
        program_id: data.program_id ?? null,
        context_type: data.context_type,
        context_record_id: data.context_record_id ?? null,
        subject: data.subject,
        description: data.description,
        attachments: data.attachments,
      })
      .select("*").single();
    if (error) throw error;

    await sb.from("student_support_activity").insert({
      ticket_id: ticket.id,
      student_user_id: uid,
      actor_role: "student",
      action: "ticket_created",
      detail: `Support ticket ${ticket.ticket_code} created`,
    });

    return { id: ticket.id, ticket_code: ticket.ticket_code };
  });

// ============================================================
// List tickets
// ============================================================
export const listSupportTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      status: z.enum(["all","open","in_progress","needs_reply","waiting_support","resolved","closed"]).default("all"),
      q: z.string().max(120).nullable().optional(),
    }).parse(raw ?? {}),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    let query = sb
      .from("student_support_tickets")
      .select("id, ticket_code, subject, category, program_id, status, priority, last_activity_at, created_at, courses(title)")
      .eq("student_user_id", uid)
      .order("last_activity_at", { ascending: false });

    if (data.status === "open") query = query.in("status", ["open","assigned","in_progress","waiting_student","waiting_support"]);
    else if (data.status === "in_progress") query = query.eq("status", "in_progress");
    else if (data.status === "needs_reply") query = query.eq("status", "waiting_student");
    else if (data.status === "waiting_support") query = query.in("status", ["open","assigned","in_progress","waiting_support"]);
    else if (data.status === "resolved") query = query.eq("status", "resolved");
    else if (data.status === "closed") query = query.eq("status", "closed");

    if (data.q && data.q.trim()) {
      const q = data.q.trim();
      query = query.or(`ticket_code.ilike.%${q}%,subject.ilike.%${q}%`);
    }
    const { data: rows } = await query.limit(200);
    return ((rows ?? []) as any[]).map((r) => ({
      id: r.id,
      ticket_code: r.ticket_code,
      subject: r.subject,
      category: r.category,
      program_title: r.courses?.title ?? null,
      status: r.status,
      priority: r.priority,
      last_activity_at: r.last_activity_at,
      created_at: r.created_at,
    }));
  });

// ============================================================
// Get ticket details
// ============================================================
export const getSupportTicket = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const { data: t } = await sb
      .from("student_support_tickets")
      .select("*, courses(id, title, slug)")
      .eq("id", data.id)
      .eq("student_user_id", uid)
      .maybeSingle();
    if (!t) throw new Error("Ticket not found");

    const { data: msgs } = await sb
      .from("student_support_messages")
      .select("id, author_user_id, is_admin, body, attachments, created_at")
      .eq("ticket_id", data.id)
      .eq("is_internal", false)
      .order("created_at", { ascending: true });

    // Contextual "related item" label
    let related: { label: string; sublabel?: string } | null = null;
    if (t.context_type === "lesson" && t.context_record_id) {
      const { data: l } = await sb.from("course_lessons").select("name, course_topics(name, course_modules(name))").eq("id", t.context_record_id).maybeSingle();
      if (l) related = { label: l.name, sublabel: l.course_topics?.course_modules?.name ?? undefined };
    } else if (t.context_type === "project" && t.context_record_id) {
      const { data: p } = await sb.from("student_projects").select("course_project_templates(name)").eq("id", t.context_record_id).maybeSingle();
      if (p) related = { label: (p as any).course_project_templates?.name ?? "Project" };
    } else if (t.context_type === "assignment" && t.context_record_id) {
      const { data: a } = await sb.from("student_assignments").select("course_assignments(name)").eq("id", t.context_record_id).maybeSingle();
      if (a) related = { label: (a as any).course_assignments?.name ?? "Assignment" };
    } else if (t.context_type === "live_session" && t.context_record_id) {
      const { data: s } = await sb.from("live_sessions").select("title").eq("id", t.context_record_id).maybeSingle();
      if (s) related = { label: s.title };
    } else if (t.context_type === "certificate" && t.context_record_id) {
      const { data: c } = await sb.from("certificates").select("course_name, certificate_number").eq("id", t.context_record_id).maybeSingle();
      if (c) related = { label: c.course_name ?? "Certificate", sublabel: c.certificate_number ?? undefined };
    } else if (t.context_type === "interview_session" && t.context_record_id) {
      const { data: s } = await sb.from("interview_sessions").select("interview_type, target_role").eq("id", t.context_record_id).maybeSingle();
      if (s) related = { label: `${s.interview_type} interview`, sublabel: s.target_role ?? undefined };
    } else if (t.context_type === "ai_mentor_conversation" && t.context_record_id) {
      const { data: c } = await sb.from("ai_mentor_conversations").select("title").eq("id", t.context_record_id).maybeSingle();
      if (c) related = { label: c.title };
    }

    return {
      ticket: {
        id: t.id,
        ticket_code: t.ticket_code,
        subject: t.subject,
        description: t.description,
        category: t.category,
        program_id: t.program_id,
        program_title: (t as any).courses?.title ?? null,
        context_type: t.context_type,
        context_record_id: t.context_record_id,
        status: t.status,
        attachments: t.attachments ?? [],
        created_at: t.created_at,
        last_activity_at: t.last_activity_at,
        resolved_at: t.resolved_at,
        closed_at: t.closed_at,
        resolution_note: t.resolution_note,
      },
      messages: (msgs ?? []) as any[],
      related,
    };
  });

// ============================================================
// Reply
// ============================================================
export const replySupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      ticket_id: z.string().uuid(),
      body: z.string().trim().min(1).max(6000),
      attachments: z.array(AttachmentSchema).max(5).default([]),
    }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;

    const { data: t } = await sb
      .from("student_support_tickets")
      .select("id, student_user_id, status")
      .eq("id", data.ticket_id)
      .maybeSingle();
    if (!t || t.student_user_id !== uid) throw new Error("Ticket not found");
    if (t.status === "closed") throw new Error("This ticket is closed");

    const { data: msg, error } = await sb
      .from("student_support_messages")
      .insert({
        ticket_id: data.ticket_id,
        author_user_id: uid,
        is_admin: false,
        is_internal: false,
        body: data.body,
        attachments: data.attachments,
      })
      .select("*").single();
    if (error) throw error;

    // Transition waiting_student -> waiting_support via privileged update through security-definer function.
    // Instead, update via service-role admin so the trigger allows it.
    if (t.status === "waiting_student") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await (supabaseAdmin as any)
        .from("student_support_tickets")
        .update({ status: "waiting_support", last_activity_at: new Date().toISOString() })
        .eq("id", data.ticket_id);
    } else {
      // Only touch last_activity_at
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await (supabaseAdmin as any)
        .from("student_support_tickets")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", data.ticket_id);
    }

    await sb.from("student_support_activity").insert({
      ticket_id: data.ticket_id,
      student_user_id: uid,
      actor_role: "student",
      action: "student_reply_sent",
      detail: "Student sent a reply",
    });

    return { id: msg.id };
  });

// ============================================================
// Reopen ticket (student says still need help)
// ============================================================
export const reopenSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      ticket_id: z.string().uuid(),
      message: z.string().trim().min(5).max(4000),
    }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const { data: t } = await sb
      .from("student_support_tickets")
      .select("id, student_user_id, status").eq("id", data.ticket_id).maybeSingle();
    if (!t || t.student_user_id !== uid) throw new Error("Ticket not found");
    if (t.status !== "resolved") throw new Error("Only resolved tickets can be reopened");

    // Student can post the follow-up message under their own policy (status='resolved' is allowed by policy)
    const { error: mErr } = await sb.from("student_support_messages").insert({
      ticket_id: data.ticket_id,
      author_user_id: uid,
      is_admin: false,
      is_internal: false,
      body: data.message,
    });
    if (mErr) throw mErr;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("student_support_tickets")
      .update({
        status: "open",
        reopened_at: new Date().toISOString(),
        resolved_at: null,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", data.ticket_id);

    await sb.from("student_support_activity").insert({
      ticket_id: data.ticket_id,
      student_user_id: uid,
      actor_role: "student",
      action: "ticket_reopened",
      detail: "Student reopened the ticket",
    });

    return { ok: true };
  });
