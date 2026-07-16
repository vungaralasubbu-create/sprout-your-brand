import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableAiJson, isAiAvailable } from "@/lib/ai-gateway.server";

const ContextType = z.enum([
  "general",
  "current_lesson",
  "current_module",
  "program",
  "project",
  "assignment",
  "live_session",
  "internship",
  "career",
]);
export type MentorContextType = z.infer<typeof ContextType>;

// ============================================================
// Overview
// ============================================================
export const getMentorOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const uid = context.userId;

    const [enrRes, projRes, asgRes, intRes, sesRes, careerRes] = await Promise.all([
      sb
        .from("enrollments")
        .select("course_id, current_lesson_id, last_accessed_at, lms_status, courses(id, title, slug)")
        .eq("student_user_id", uid)
        .order("last_accessed_at", { ascending: false, nullsFirst: false }),
      sb
        .from("student_projects")
        .select("id, status")
        .eq("student_user_id", uid)
        .limit(5),
      sb
        .from("student_assignments")
        .select("id, status")
        .eq("student_user_id", uid)
        .limit(5),
      sb
        .from("student_internships")
        .select("id, status")
        .eq("student_user_id", uid)
        .limit(5),
      sb
        .from("session_attendance")
        .select("session_id")
        .eq("student_user_id", uid)
        .limit(5),
      sb
        .from("career_profiles")
        .select("id")
        .eq("student_user_id", uid)
        .maybeSingle(),
    ]);

    const programs = ((enrRes.data ?? []) as any[])
      .map((r) => r.courses)
      .filter(Boolean)
      .map((c: any) => ({ id: c.id, title: c.title, slug: c.slug }));

    const currentEnrollment =
      ((enrRes.data ?? []) as any[]).find((e) => e.lms_status === "active") ??
      ((enrRes.data ?? []) as any[])[0] ??
      null;

    let currentLesson: any = null;
    if (currentEnrollment?.current_lesson_id) {
      const { data } = await sb
        .from("course_lessons")
        .select("id, name, topic_id, course_topics(id, name, module_id, course_modules(id, name, course_id, courses(id, title)))")
        .eq("id", currentEnrollment.current_lesson_id)
        .maybeSingle();
      currentLesson = data;
    }

    return {
      aiAvailable: isAiAvailable(),
      programs,
      defaultProgramId: currentEnrollment?.course_id ?? programs[0]?.id ?? null,
      currentLesson: currentLesson
        ? {
            id: currentLesson.id,
            title: currentLesson.name,
            module_title:
              currentLesson.course_topics?.course_modules?.name ?? null,
            program_id:
              currentLesson.course_topics?.course_modules?.course_id ?? null,
            program_title:
              currentLesson.course_topics?.course_modules?.courses?.title ?? null,
          }
        : null,
      hasActiveInternship: (intRes.data ?? []).length > 0,
      hasProjects: (projRes.data ?? []).length > 0,
      hasAssignments: (asgRes.data ?? []).length > 0,
      hasUpcomingSessions: (sesRes.data ?? []).length > 0,
      hasCareerProfile: !!careerRes.data,
    };
  });

// ============================================================
// Conversations
// ============================================================
export const listMentorConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const { data } = await sb
      .from("ai_mentor_conversations")
      .select("id, title, program_id, context_type, context_record_id, message_count, last_activity_at, courses(title)")
      .eq("student_user_id", context.userId)
      .is("archived_at", null)
      .order("last_activity_at", { ascending: false })
      .limit(50);
    return ((data ?? []) as any[]).map((c) => ({
      id: c.id,
      title: c.title,
      program_id: c.program_id,
      program_title: c.courses?.title ?? null,
      context_type: c.context_type,
      context_record_id: c.context_record_id,
      message_count: c.message_count,
      last_activity_at: c.last_activity_at,
    }));
  });

const CreateConvoSchema = z.object({
  program_id: z.string().uuid().nullable().optional(),
  context_type: ContextType.default("general"),
  context_record_id: z.string().uuid().nullable().optional(),
  title: z.string().max(120).nullable().optional(),
});
export const createMentorConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CreateConvoSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const { data: conv, error } = await sb
      .from("ai_mentor_conversations")
      .insert({
        student_user_id: uid,
        title: data.title || "New GlintrAI Conversation",
        program_id: data.program_id ?? null,
        context_type: data.context_type,
        context_record_id: data.context_record_id ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;

    await sb.from("ai_mentor_activity").insert({
      student_user_id: uid,
      conversation_id: conv.id,
      event_type: "conversation_started",
      meta: { context_type: data.context_type },
    });
    return { id: conv.id };
  });

export const renameMentorConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(120) }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    await sb
      .from("ai_mentor_conversations")
      .update({ title: data.title })
      .eq("id", data.id)
      .eq("student_user_id", context.userId);
    return { ok: true };
  });

export const archiveMentorConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    await sb
      .from("ai_mentor_conversations")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("student_user_id", context.userId);
    return { ok: true };
  });

export const getMentorConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const { data: conv } = await sb
      .from("ai_mentor_conversations")
      .select("*, courses(id, title, slug)")
      .eq("id", data.id)
      .eq("student_user_id", uid)
      .maybeSingle();
    if (!conv) throw new Error("Conversation not found");

    const { data: msgs } = await sb
      .from("ai_mentor_messages")
      .select("id, role, content, status, error_reason, created_at")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true });

    const messageIds = ((msgs ?? []) as any[]).map((m) => m.id);
    let feedbackMap = new Map<string, string>();
    if (messageIds.length) {
      const { data: fb } = await sb
        .from("ai_mentor_feedback")
        .select("message_id, feedback_type")
        .in("message_id", messageIds)
        .eq("student_user_id", uid);
      feedbackMap = new Map(((fb ?? []) as any[]).map((f) => [f.message_id, f.feedback_type]));
    }

    return {
      conversation: {
        ...conv,
        program_title: (conv as any).courses?.title ?? null,
      },
      messages: ((msgs ?? []) as any[]).map((m) => ({
        ...m,
        feedback: feedbackMap.get(m.id) ?? null,
      })),
    };
  });

export const setConversationContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        program_id: z.string().uuid().nullable().optional(),
        context_type: ContextType.optional(),
        context_record_id: z.string().uuid().nullable().optional(),
        include_notes: z.boolean().optional(),
        include_submission: z.boolean().optional(),
        include_draft: z.boolean().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const patch: any = {};
    if (data.program_id !== undefined) patch.program_id = data.program_id;
    if (data.context_type !== undefined) patch.context_type = data.context_type;
    if (data.context_record_id !== undefined) patch.context_record_id = data.context_record_id;
    if (data.include_notes !== undefined) patch.include_notes = data.include_notes;
    if (data.include_submission !== undefined) patch.include_submission = data.include_submission;
    if (data.include_draft !== undefined) patch.include_draft = data.include_draft;
    await sb
      .from("ai_mentor_conversations")
      .update(patch)
      .eq("id", data.id)
      .eq("student_user_id", uid);
    await sb.from("ai_mentor_activity").insert({
      student_user_id: uid,
      conversation_id: data.id,
      event_type: "context_changed",
      meta: { context_type: data.context_type ?? null },
    });
    return { ok: true };
  });

// ============================================================
// Context options
// ============================================================
export const getContextOptions = createServerFn({ method: "GET" })
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
    const type = data.context_type;

    if (type === "current_module") {
      if (!data.program_id) return { options: [] };
      const { data: modules } = await sb
        .from("course_modules")
        .select("id, name, display_order")
        .eq("course_id", data.program_id)
        .order("display_order");
      return { options: ((modules ?? []) as any[]).map((m) => ({ id: m.id, label: `Module: ${m.name}` })) };
    }
    if (type === "current_lesson") {
      if (!data.program_id) return { options: [] };
      const { data: rows } = await sb
        .from("course_lessons")
        .select("id, name, display_order, course_topics!inner(name, module_id, course_modules!inner(name, course_id))")
        .eq("course_topics.course_modules.course_id", data.program_id)
        .order("display_order");
      return {
        options: ((rows ?? []) as any[]).map((l) => ({
          id: l.id,
          label: `${l.course_topics?.course_modules?.name ?? "Module"} — ${l.name}`,
        })),
      };
    }
    if (type === "project") {
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
    if (type === "assignment") {
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
    if (type === "live_session") {
      const { data: rows } = await sb
        .from("session_attendance")
        .select("session_id, live_sessions(id, title, scheduled_at)")
        .eq("student_user_id", uid);
      return {
        options: ((rows ?? []) as any[])
          .map((r) => r.live_sessions)
          .filter(Boolean)
          .map((s: any) => ({
            id: s.id,
            label: `${s.title}${s.scheduled_at ? ` — ${new Date(s.scheduled_at).toLocaleDateString()}` : ""}`,
          })),
      };
    }
    if (type === "internship") {
      const { data: rows } = await sb
        .from("student_internship_tasks")
        .select("id, status, internship_tasks(title), student_internships!inner(student_user_id)")
        .eq("student_internships.student_user_id", uid);
      return {
        options: ((rows ?? []) as any[]).map((r) => ({
          id: r.id,
          label: `${r.internship_tasks?.title ?? "Internship task"} — ${String(r.status).replace(/_/g, " ")}`,
        })),
      };
    }
    return { options: [] };
  });

// ============================================================
// Context builder (server-side, authorised)
// ============================================================
async function fetchContext(sb: any, uid: string, conv: any) {
  const parts: string[] = [];
  const summary: Record<string, string> = {};

  if (conv.program_id) {
    const { data: c } = await sb
      .from("courses")
      .select("id, title, tagline, description")
      .eq("id", conv.program_id)
      .maybeSingle();
    if (c) {
      const { data: enr } = await sb
        .from("enrollments")
        .select("id")
        .eq("student_user_id", uid)
        .eq("course_id", conv.program_id)
        .maybeSingle();
      if (enr) {
        parts.push(`Program: ${c.title}${c.tagline ? ` — ${c.tagline}` : ""}`);
        summary.program = c.title;
      }
    }
  }

  const type = conv.context_type as string;
  const recId = conv.context_record_id as string | null;

  if (type === "current_lesson" && recId) {
    const { data: l } = await sb
      .from("course_lessons")
      .select("id, name, description, content, course_topics!inner(name, module_id, course_modules!inner(name, course_id, courses(title)))")
      .eq("id", recId)
      .maybeSingle();
    if (l) {
      const courseId = (l as any).course_topics?.course_modules?.course_id;
      const { data: enr } = await sb
        .from("enrollments")
        .select("id")
        .eq("student_user_id", uid)
        .eq("course_id", courseId)
        .maybeSingle();
      if (enr) {
        parts.push(
          `Current Lesson: ${(l as any).name}\nModule: ${(l as any).course_topics?.course_modules?.name ?? "-"}\nProgram: ${(l as any).course_topics?.course_modules?.courses?.title ?? "-"}\nDescription: ${(l as any).description ?? "-"}`,
        );
        if ((l as any).content && typeof (l as any).content === "string") {
          parts.push(`Lesson content (excerpt):\n${String((l as any).content).slice(0, 4000)}`);
        }
        summary.lesson = (l as any).name;
      }
    }
  }

  if (type === "current_module" && recId) {
    const { data: m } = await sb
      .from("course_modules")
      .select("id, name, description, course_id, courses(title)")
      .eq("id", recId)
      .maybeSingle();
    if (m) {
      const { data: enr } = await sb
        .from("enrollments")
        .select("id")
        .eq("student_user_id", uid)
        .eq("course_id", (m as any).course_id)
        .maybeSingle();
      if (enr) {
        parts.push(`Module: ${(m as any).name}\nDescription: ${(m as any).description ?? "-"}`);
        summary.module = (m as any).name;
      }
    }
  }

  if (type === "project" && recId) {
    const { data: p } = await sb
      .from("student_projects")
      .select("id, status, course_project_templates(name, short_description, full_description, learning_outcomes)")
      .eq("id", recId)
      .eq("student_user_id", uid)
      .maybeSingle();
    if (p) {
      const t = (p as any).course_project_templates;
      parts.push(
        `Project: ${t?.name ?? "Project"}\nStatus: ${(p as any).status}\nSummary: ${t?.short_description ?? "-"}\nDescription: ${t?.full_description ?? "-"}\nLearning outcomes: ${JSON.stringify(t?.learning_outcomes ?? [])}`,
      );
      summary.project = t?.name ?? "Project";
    }
  }

  if (type === "assignment" && recId) {
    const { data: a } = await sb
      .from("student_assignments")
      .select("id, status, course_assignments(name, description, instructions, learning_objective, evaluation_criteria)")
      .eq("id", recId)
      .eq("student_user_id", uid)
      .maybeSingle();
    if (a) {
      const ca = (a as any).course_assignments;
      parts.push(
        `Assignment: ${ca?.name}\nStatus: ${(a as any).status}\nInstructions: ${ca?.instructions ?? ca?.description ?? "-"}\nLearning objective: ${ca?.learning_objective ?? "-"}\nEvaluation criteria: ${JSON.stringify(ca?.evaluation_criteria ?? [])}`,
      );
      summary.assignment = ca?.name ?? "Assignment";
    }
  }

  if (type === "live_session" && recId) {
    const { data: att } = await sb
      .from("session_attendance")
      .select("session_id, live_sessions(id, title, description, scheduled_at)")
      .eq("session_id", recId)
      .eq("student_user_id", uid)
      .maybeSingle();
    const s = (att as any)?.live_sessions;
    if (s) {
      parts.push(
        `Live Session: ${s.title}\nWhen: ${s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : "-"}\nDescription: ${s.description ?? "-"}`,
      );
      summary.live_session = s.title;
    }
  }

  if (type === "internship" && recId) {
    const { data: st } = await sb
      .from("student_internship_tasks")
      .select("id, status, internship_tasks(title, task_type, instructions), student_internships!inner(student_user_id)")
      .eq("id", recId)
      .eq("student_internships.student_user_id", uid)
      .maybeSingle();
    if (st) {
      const it = (st as any).internship_tasks;
      parts.push(
        `Internship Task: ${it?.title}\nType: ${it?.task_type ?? "-"}\nInstructions: ${it?.instructions ?? "-"}`,
      );
      summary.internship_task = it?.title ?? "Task";
    }
  }

  if (type === "career") {
    const [profile, prefs, skills] = await Promise.all([
      sb.from("career_profiles").select("headline, objective, current_student_status").eq("student_user_id", uid).maybeSingle(),
      sb.from("student_career_preferences").select("*").eq("student_user_id", uid).maybeSingle(),
      sb.from("student_skills").select("*").eq("student_user_id", uid).limit(20),
    ]);
    const p = (profile as any).data;
    const pr = (prefs as any).data;
    parts.push(
      `Career context: headline=${p?.headline ?? "-"}; objective=${p?.objective ?? "-"}; preferences=${JSON.stringify(pr ?? {})}; skills=${JSON.stringify((skills as any).data ?? [])}`,
    );
    summary.career = p?.headline ?? "Career";
  }

  return { text: parts.join("\n\n"), summary };
}

async function fetchProgressSnapshot(sb: any, uid: string, programId: string | null) {
  if (!programId) return "";
  const { data: enr } = await sb
    .from("enrollments")
    .select("progress_percent, content_completed_at")
    .eq("student_user_id", uid)
    .eq("course_id", programId)
    .maybeSingle();
  if (!enr) return "";
  return `Learning progress: ${(enr as any).progress_percent ?? 0}% complete${(enr as any).content_completed_at ? " (content completed)" : ""}.`;
}

// ============================================================
// Send message
// ============================================================
const SendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(6000),
  quick_action: z.string().max(80).nullable().optional(),
});

export const sendMentorMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => SendMessageSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;

    const { data: conv } = await sb
      .from("ai_mentor_conversations")
      .select("*")
      .eq("id", data.conversation_id)
      .eq("student_user_id", uid)
      .maybeSingle();
    if (!conv) throw new Error("Conversation not found");

    const { data: userMsg, error: userErr } = await sb
      .from("ai_mentor_messages")
      .insert({
        conversation_id: (conv as any).id,
        student_user_id: uid,
        role: "student",
        content: data.content,
        status: "sent",
      })
      .select("*")
      .single();
    if (userErr) throw userErr;

    await sb.from("ai_mentor_activity").insert({
      student_user_id: uid,
      conversation_id: (conv as any).id,
      event_type: data.quick_action ? "quick_action_used" : "question_asked",
      meta: { quick_action: data.quick_action ?? null },
    });

    if (!isAiAvailable()) {
      const { data: mm } = await sb
        .from("ai_mentor_messages")
        .insert({
          conversation_id: (conv as any).id,
          student_user_id: uid,
          role: "mentor",
          content: "",
          status: "failed",
          error_reason: "AI service not configured",
        })
        .select("*")
        .single();
      await sb
        .from("ai_mentor_conversations")
        .update({
          message_count: ((conv as any).message_count ?? 0) + 1,
          last_activity_at: new Date().toISOString(),
        } as any)
        .eq("id", (conv as any).id);
      return { user_message: userMsg, mentor_message: mm, ai_available: false };
    }

    const ctx = await fetchContext(sb, uid, conv);
    const progress = await fetchProgressSnapshot(sb, uid, (conv as any).program_id);

    const { data: prior } = await sb
      .from("ai_mentor_messages")
      .select("role, content")
      .eq("conversation_id", (conv as any).id)
      .in("role", ["student", "mentor"])
      .order("created_at", { ascending: true })
      .limit(20);

    const systemPrompt = `You are GlintrAI — a personalised learning support assistant for Glintr LMS students.
Rules:
- Identify yourself as "GlintrAI" (not a human mentor).
- Help the student understand and organise their learning. Explain concepts clearly, use examples, and connect to their program when relevant.
- Never approve, mark, or submit any project, assignment, or internship task. Never issue certificates or change scores.
- Do not fabricate lesson content that is not in the provided context.
- If the student asks for the entire project/assignment/task to be done for them, explain your role is guidance and help them plan it in learning steps.
- Keep answers concise, structured with short paragraphs and bullet points when helpful.
- Do not include private mobile/email/address/payment details.

Return strict JSON with keys:
{
  "reply_markdown": "...",
  "suggested_title": "short 3-6 word title or null"
}`;

    const contextBlock = `Learning Context:
${ctx.text || "(no specific record selected)"}

${progress}`.trim();

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "system" as const, content: contextBlock },
      ...(((prior ?? []) as any[]).map((m) => ({
        role: (m.role === "mentor" ? "assistant" : "user") as "assistant" | "user",
        content: String(m.content ?? ""),
      }))),
      { role: "user" as const, content: data.content },
    ];

    const startedAt = Date.now();
    let mentorMsg: any = null;
    let aiStatus = "ok";
    let errorReason: string | null = null;
    let replyText = "";
    let suggestedTitle: string | null = null;

    try {
      const result = await callLovableAiJson<{
        reply_markdown: string;
        suggested_title: string | null;
      }>({
        messages,
        model: "google/gemini-2.5-flash",
        temperature: 0.5,
      });
      replyText = String(result.reply_markdown ?? "").trim();
      suggestedTitle = result.suggested_title?.trim() || null;
      if (!replyText) throw new Error("Empty AI response");
    } catch (e: any) {
      aiStatus = "error";
      errorReason = e?.message ?? "AI service error";
    }

    if (aiStatus === "ok") {
      const { data: mm } = await sb
        .from("ai_mentor_messages")
        .insert({
          conversation_id: (conv as any).id,
          student_user_id: uid,
          role: "mentor",
          content: replyText,
          status: "completed",
          context_snapshot: ctx.summary as any,
        })
        .select("*")
        .single();
      mentorMsg = mm;
    } else {
      const { data: mm } = await sb
        .from("ai_mentor_messages")
        .insert({
          conversation_id: (conv as any).id,
          student_user_id: uid,
          role: "mentor",
          content: "",
          status: "failed",
          error_reason: errorReason,
        })
        .select("*")
        .single();
      mentorMsg = mm;
    }

    await sb.from("ai_mentor_usage").insert({
      student_user_id: uid,
      conversation_id: (conv as any).id,
      message_id: mentorMsg?.id ?? null,
      model: "google/gemini-2.5-flash",
      ai_service_status: aiStatus,
      duration_ms: Date.now() - startedAt,
    });

    const patch: any = {
      message_count: ((conv as any).message_count ?? 0) + 2,
      last_activity_at: new Date().toISOString(),
    };
    if (
      suggestedTitle &&
      (!(conv as any).title || (conv as any).title === "New GlintrAI Conversation") &&
      suggestedTitle.length <= 80
    ) {
      patch.title = suggestedTitle;
    }
    await sb.from("ai_mentor_conversations").update(patch).eq("id", (conv as any).id);

    return { user_message: userMsg, mentor_message: mentorMsg, ai_available: true };
  });

// ============================================================
// Feedback
// ============================================================
export const submitMessageFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        conversation_id: z.string().uuid(),
        message_id: z.string().uuid(),
        feedback_type: z.enum(["helpful", "not_helpful"]),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    await sb
      .from("ai_mentor_feedback")
      .upsert(
        {
          conversation_id: data.conversation_id,
          message_id: data.message_id,
          student_user_id: uid,
          feedback_type: data.feedback_type,
        },
        { onConflict: "message_id,student_user_id" },
      );
    await sb.from("ai_mentor_activity").insert({
      student_user_id: uid,
      conversation_id: data.conversation_id,
      event_type: "feedback_submitted",
      meta: { feedback: data.feedback_type },
    });
    return { ok: true };
  });
