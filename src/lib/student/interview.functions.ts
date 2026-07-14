import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ============================================================
// Types
// ============================================================
type SetupInput = {
  interview_type: "technical" | "hr" | "behavioural" | "project" | "internship" | "mixed";
  course_id?: string | null;
  target_role?: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  mode: "text" | "voice";
  question_count: 5 | 10 | 15;
  project_id?: string | null;
  internship_id?: string | null;
  use_resume?: boolean;
};

// ============================================================
// Setup context: eligible programs, projects, internships, roles, AI availability
// ============================================================
export const getInterviewSetupContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const sb = context.supabase;

    const [enrollmentsRes, projectsRes, internshipsRes, profileRes, prefsRes] = await Promise.all([
      sb
        .from("enrollments")
        .select("course_id, courses(id, title, slug)")
        .eq("student_user_id", uid)
        .in("lms_status", ["active", "completed", "paused"]),
      sb
        .from("student_projects")
        .select("id, title, status, course_id, courses(title)")
        .eq("student_user_id", uid)
        .in("status", ["completed", "approved", "submitted", "in_review"]),
      sb
        .from("student_internships")
        .select("id, course_id, status, courses(title)")
        .eq("student_user_id", uid),
      sb.from("career_profiles").select("headline, current_student_status").eq("student_user_id", uid).maybeSingle(),
      sb
        .from("student_career_preferences")
        .select("preferred_role, preferred_industries")
        .eq("student_user_id", uid)
        .maybeSingle(),
    ]);

    const programs = (enrollmentsRes.data ?? [])
      .map((r: any) => r.courses)
      .filter(Boolean)
      .map((c: any) => ({ id: c.id, title: c.title, slug: c.slug }));

    const projects = (projectsRes.data ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      course_title: p.courses?.title ?? null,
      status: p.status,
    }));

    const internships = (internshipsRes.data ?? []).map((i: any) => ({
      id: i.id,
      status: i.status,
      course_title: i.courses?.title ?? null,
    }));

    const suggestedRoles: string[] = [];
    if (prefsRes.data?.preferred_role) suggestedRoles.push(prefsRes.data.preferred_role);
    if (profileRes.data?.headline) suggestedRoles.push(profileRes.data.headline);

    const hasResume = !!profileRes.data;

    return {
      programs,
      projects,
      internships,
      suggestedRoles: Array.from(new Set(suggestedRoles.filter(Boolean))),
      hasResume,
      aiAvailable: !!process.env.LOVABLE_API_KEY,
    };
  });

// ============================================================
// Overview: metrics, latest, trend
// ============================================================
export const getInterviewOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const sb = context.supabase;

    const { data: sessions } = await sb
      .from("interview_sessions")
      .select(
        "id, interview_type, target_role, difficulty, mode, status, question_count, answered_count, skipped_count, avg_practice_score, started_at, completed_at, course_id, courses(title)",
      )
      .eq("student_user_id", uid)
      .order("started_at", { ascending: false })
      .limit(50);

    const list = (sessions ?? []) as any[];
    const completed = list.filter((s) => s.status === "completed");
    const totalQuestions = list.reduce((n, s) => n + (s.answered_count ?? 0), 0);
    const scored = completed.filter((s) => s.avg_practice_score != null);
    const avgScore = scored.length
      ? Math.round(
          (scored.reduce((n, s) => n + Number(s.avg_practice_score), 0) / scored.length) * 10,
        ) / 10
      : null;
    const latest = completed[0] ?? null;

    // Improvement trend: compare last completed vs previous completed of same type + role
    let trend: { key: string; direction: "up" | "down" | "flat"; delta: number; count: number } | null = null;
    if (completed.length >= 2 && latest) {
      const comparable = completed.filter(
        (s) => s.interview_type === latest.interview_type && s.target_role === latest.target_role,
      );
      if (comparable.length >= 2) {
        const prev = comparable[1];
        const dLatest = Number(latest.avg_practice_score ?? 0);
        const dPrev = Number(prev.avg_practice_score ?? 0);
        const delta = Math.round((dLatest - dPrev) * 10) / 10;
        trend = {
          key: `${latest.interview_type}:${latest.target_role ?? ""}`,
          direction: delta > 0.5 ? "up" : delta < -0.5 ? "down" : "flat",
          delta,
          count: comparable.length,
        };
      }
    }

    return {
      metrics: {
        totalSessions: list.length,
        completedSessions: completed.length,
        questionsPracticed: totalQuestions,
        avgPracticeScore: avgScore,
        latestScore: latest?.avg_practice_score != null ? Number(latest.avg_practice_score) : null,
        latestDate: latest?.completed_at ?? null,
      },
      trend,
      history: list.map((s) => ({
        id: s.id,
        started_at: s.started_at,
        completed_at: s.completed_at,
        interview_type: s.interview_type,
        target_role: s.target_role,
        difficulty: s.difficulty,
        mode: s.mode,
        status: s.status,
        program: s.courses?.title ?? null,
        question_count: s.question_count,
        answered_count: s.answered_count,
        avg_practice_score: s.avg_practice_score != null ? Number(s.avg_practice_score) : null,
      })),
    };
  });

// ============================================================
// Start interview: create session + generate questions
// ============================================================
const SetupSchema = z.object({
  interview_type: z.enum(["technical", "hr", "behavioural", "project", "internship", "mixed"]),
  course_id: z.string().uuid().nullable().optional(),
  target_role: z.string().max(120).nullable().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  mode: z.enum(["text", "voice"]),
  question_count: z.union([z.literal(5), z.literal(10), z.literal(15)]),
  project_id: z.string().uuid().nullable().optional(),
  internship_id: z.string().uuid().nullable().optional(),
  use_resume: z.boolean().optional(),
});

export const startInterviewSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SetupSchema.parse(data))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    const sb = context.supabase;
    const setup = data as SetupInput;
    const aiAvailable = !!process.env.LOVABLE_API_KEY;

    // Authorise project/internship ownership
    if (setup.project_id) {
      const { data: proj } = await sb
        .from("student_projects")
        .select("id")
        .eq("id", setup.project_id)
        .eq("student_user_id", uid)
        .maybeSingle();
      if (!proj) throw new Error("Project not accessible");
    }
    if (setup.internship_id) {
      const { data: intn } = await sb
        .from("student_internships")
        .select("id")
        .eq("id", setup.internship_id)
        .eq("student_user_id", uid)
        .maybeSingle();
      if (!intn) throw new Error("Internship not accessible");
    }
    if (setup.course_id) {
      const { data: enr } = await sb
        .from("enrollments")
        .select("id")
        .eq("course_id", setup.course_id)
        .eq("student_user_id", uid)
        .maybeSingle();
      if (!enr) throw new Error("Program not accessible");
    }

    // Create session
    const { data: session, error } = await sb
      .from("interview_sessions")
      .insert({
        student_user_id: uid,
        interview_type: setup.interview_type,
        course_id: setup.course_id ?? null,
        target_role: setup.target_role?.trim() || null,
        difficulty: setup.difficulty,
        mode: setup.mode,
        question_count: setup.question_count,
        project_id: setup.project_id ?? null,
        internship_id: setup.internship_id ?? null,
        use_resume: !!setup.use_resume,
        ai_available: aiAvailable,
        status: "in_progress",
      })
      .select("*")
      .single();
    if (error) throw error;

    // Log activity
    await sb.from("interview_activity").insert({
      student_user_id: uid,
      session_id: session.id,
      event_type: "interview_started",
      meta: { interview_type: setup.interview_type, difficulty: setup.difficulty },
    });

    // Generate questions
    if (aiAvailable) {
      try {
        await generateAndSaveQuestions(sb, session);
      } catch (e: any) {
        // Mark AI as unavailable for this session; UI will handle empty state
        await sb.from("interview_sessions").update({ ai_available: false }).eq("id", session.id);
      }
    }

    return { session_id: session.id };
  });

async function generateAndSaveQuestions(sb: any, session: any) {
  const { callLovableAiJson } = await import("@/lib/ai-gateway.server");

  // Build learning context (only career-relevant fields)
  let contextBlock = "";
  if (session.course_id) {
    const { data: course } = await sb
      .from("courses")
      .select("title, subtitle, description, career_roles:course_career_roles(role:career_roles(title))")
      .eq("id", session.course_id)
      .maybeSingle();
    if (course) {
      contextBlock += `Program: ${course.title}\n${course.subtitle ?? ""}\n`;
      const roles = (course.career_roles ?? [])
        .map((r: any) => r.role?.title)
        .filter(Boolean);
      if (roles.length) contextBlock += `Related roles: ${roles.join(", ")}\n`;
    }
    const { data: skills } = await sb
      .from("course_skills")
      .select("skills(name)")
      .eq("course_id", session.course_id)
      .limit(15);
    const skillNames = (skills ?? []).map((s: any) => s.skills?.name).filter(Boolean);
    if (skillNames.length) contextBlock += `Program skills: ${skillNames.join(", ")}\n`;
  }

  if (session.project_id) {
    const { data: proj } = await sb
      .from("student_projects")
      .select("title, description, project_type, tech_stack, learning_outcomes")
      .eq("id", session.project_id)
      .maybeSingle();
    if (proj) {
      contextBlock += `\nProject: ${proj.title}\n${proj.description ?? ""}\n`;
      if (proj.project_type) contextBlock += `Project type: ${proj.project_type}\n`;
      if (proj.tech_stack) contextBlock += `Tech stack: ${JSON.stringify(proj.tech_stack)}\n`;
    }
  }

  if (session.internship_id) {
    const { data: intn } = await sb
      .from("student_internships")
      .select("status, courses(title)")
      .eq("id", session.internship_id)
      .maybeSingle();
    if (intn) {
      contextBlock += `\nInternship: ${intn.courses?.title ?? ""} (status ${intn.status})\n`;
    }
  }

  if (session.use_resume) {
    const { data: profile } = await sb
      .from("career_profiles")
      .select("headline, objective, education_level, degree, specialisation, years_of_experience")
      .eq("student_user_id", session.student_user_id)
      .maybeSingle();
    if (profile) {
      contextBlock += `\nResume: ${profile.headline ?? ""}\n${profile.objective ?? ""}\n`;
      if (profile.degree) contextBlock += `Education: ${profile.degree} ${profile.specialisation ?? ""}\n`;
    }
    const { data: skills } = await sb
      .from("student_skills")
      .select("skill_name, skill_level")
      .eq("student_user_id", session.student_user_id)
      .eq("show_in_profile", true)
      .limit(20);
    if (skills?.length) {
      contextBlock += `Resume skills: ${skills
        .map((s: any) => `${s.skill_name}${s.skill_level ? ` (${s.skill_level})` : ""}`)
        .join(", ")}\n`;
    }
  }

  const systemPrompt = `You are an interview coach for a student practicing mock interviews. Generate high-quality practice questions that are respectful, professional, and free of protected-characteristic bias (do not reference race, religion, gender, disability, sexual orientation, or political views). Output strict JSON.`;

  const userPrompt = `Generate ${session.question_count} distinct mock interview questions.
Interview type: ${session.interview_type}
Target role: ${session.target_role ?? "General"}
Difficulty: ${session.difficulty} (calibrate complexity accordingly)
Mode: ${session.mode} interview

Context:
${contextBlock || "(No specific program/project context. Use general questions for the role and interview type.)"}

Return JSON with this exact shape:
{
  "questions": [
    { "question": "text of question", "category": "Technical Knowledge | Communication | Answer Structure | Project Explanation | Problem Solving | Behavioural Responses", "expected_topics": ["topic 1", "topic 2"] }
  ]
}
Ensure exactly ${session.question_count} questions. Keep each question a single clear question.`;

  const result = await callLovableAiJson<{ questions: any[] }>({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });

  const items = Array.isArray(result?.questions) ? result.questions.slice(0, session.question_count) : [];
  if (!items.length) throw new Error("No questions generated");

  const rows = items.map((q: any, idx: number) => ({
    session_id: session.id,
    position: idx + 1,
    question_text: String(q.question ?? "").slice(0, 2000),
    category: q.category ?? null,
    expected_topics: Array.isArray(q.expected_topics) ? q.expected_topics.slice(0, 8) : [],
  }));

  const { error } = await sb.from("interview_questions").insert(rows);
  if (error) throw error;
}

// ============================================================
// Retry question generation
// ============================================================
export const regenerateInterviewQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ session_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const uid = context.userId;
    const { data: session } = await sb
      .from("interview_sessions")
      .select("*")
      .eq("id", data.session_id)
      .eq("student_user_id", uid)
      .maybeSingle();
    if (!session) throw new Error("Session not found");
    if (session.status !== "in_progress") throw new Error("Session not in progress");
    const { count } = await sb
      .from("interview_questions")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id);
    if ((count ?? 0) > 0) return { ok: true };
    if (!process.env.LOVABLE_API_KEY) throw new Error("AI service not configured");
    await generateAndSaveQuestions(sb, session);
    await sb.from("interview_sessions").update({ ai_available: true }).eq("id", session.id);
    return { ok: true };
  });

// ============================================================
// Session detail (for in-progress player and report)
// ============================================================
export const getInterviewSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const uid = context.userId;
    const { data: session } = await sb
      .from("interview_sessions")
      .select("*, courses(title, slug)")
      .eq("id", data.id)
      .eq("student_user_id", uid)
      .maybeSingle();
    if (!session) throw new Error("Session not found");

    const [questionsRes, answersRes] = await Promise.all([
      sb
        .from("interview_questions")
        .select("*")
        .eq("session_id", session.id)
        .order("position"),
      sb
        .from("interview_answers")
        .select("*")
        .eq("session_id", session.id),
    ]);

    const answers = new Map((answersRes.data ?? []).map((a: any) => [a.question_id, a]));
    const questions = (questionsRes.data ?? []).map((q: any) => ({
      ...q,
      answer: answers.get(q.id) ?? null,
    }));

    const nextIndex = questions.findIndex((q: any) => !q.answer);

    return {
      session: {
        ...session,
        program_title: (session as any).courses?.title ?? null,
      },
      questions,
      nextIndex: nextIndex === -1 ? questions.length : nextIndex,
    };
  });

// ============================================================
// Submit answer + evaluate
// ============================================================
const SubmitAnswerSchema = z.object({
  session_id: z.string().uuid(),
  question_id: z.string().uuid(),
  answer_text: z.string().max(15000).optional(),
  transcript: z.string().max(15000).optional(),
});

export const submitInterviewAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SubmitAnswerSchema.parse(data))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const uid = context.userId;

    // Verify ownership + in_progress
    const { data: session } = await sb
      .from("interview_sessions")
      .select("id, status, student_user_id, ai_available")
      .eq("id", data.session_id)
      .eq("student_user_id", uid)
      .maybeSingle();
    if (!session) throw new Error("Session not found");
    if (session.status !== "in_progress") throw new Error("Session already finished");

    const answerText = (data.answer_text ?? data.transcript ?? "").trim();
    if (!answerText) throw new Error("Answer cannot be empty");

    const { data: question } = await sb
      .from("interview_questions")
      .select("*")
      .eq("id", data.question_id)
      .eq("session_id", data.session_id)
      .maybeSingle();
    if (!question) throw new Error("Question not found");

    // Upsert answer as pending, keeping submitted content safe
    const { data: answer, error: upErr } = await sb
      .from("interview_answers")
      .upsert(
        {
          session_id: data.session_id,
          question_id: data.question_id,
          answer_text: data.answer_text ?? null,
          transcript: data.transcript ?? null,
          is_skipped: false,
          evaluation_status: "pending",
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "session_id,question_id" },
      )
      .select("*")
      .single();
    if (upErr) throw upErr;

    await sb.from("interview_activity").insert({
      student_user_id: uid,
      session_id: data.session_id,
      event_type: "answer_submitted",
      meta: { question_id: data.question_id },
    });

    // Evaluate if AI available
    if (process.env.LOVABLE_API_KEY) {
      try {
        const { callLovableAiJson } = await import("@/lib/ai-gateway.server");
        const evalResult = await callLovableAiJson<{
          practice_score: number;
          what_went_well: string[];
          what_could_improve: string[];
          suggested_structure: string;
          key_points_missed: string[];
          example_answer: string;
          category_scores: Record<string, number>;
        }>({
          messages: [
            {
              role: "system",
              content:
                "You are a fair, constructive interview coach. Evaluate the student's practice answer. Do not judge based on any protected characteristic. Score 0-100. Return strict JSON only.",
            },
            {
              role: "user",
              content: `Question: ${question.question_text}
Expected topics: ${JSON.stringify(question.expected_topics ?? [])}
Category: ${question.category ?? "general"}
Student answer: """${answerText.slice(0, 8000)}"""

Return JSON:
{
  "practice_score": 0-100,
  "what_went_well": ["..."],
  "what_could_improve": ["..."],
  "suggested_structure": "1-3 sentences on how to structure the answer",
  "key_points_missed": ["..."],
  "example_answer": "A concise example answer (150-250 words). If based on a specific project, only reference information provided; do NOT invent metrics or technologies.",
  "category_scores": { "Technical Knowledge": 0-100, "Communication": 0-100, "Answer Structure": 0-100 }
}`,
            },
          ],
          temperature: 0.4,
        });

        const score = Math.max(0, Math.min(100, Math.round(Number(evalResult.practice_score) || 0)));
        await sb
          .from("interview_answers")
          .update({
            practice_score: score,
            feedback: {
              well: evalResult.what_went_well ?? [],
              improve: evalResult.what_could_improve ?? [],
              structure: evalResult.suggested_structure ?? "",
              missed: evalResult.key_points_missed ?? [],
              example: evalResult.example_answer ?? "",
            },
            category_scores: evalResult.category_scores ?? {},
            evaluation_status: "evaluated",
            evaluated_at: new Date().toISOString(),
          })
          .eq("id", answer.id);
      } catch (e: any) {
        await sb
          .from("interview_answers")
          .update({ evaluation_status: "failed" })
          .eq("id", answer.id);
        return { ok: true, evaluation_status: "failed", answer_id: answer.id };
      }
    } else {
      await sb
        .from("interview_answers")
        .update({ evaluation_status: "no_ai" })
        .eq("id", answer.id);
    }

    return { ok: true, answer_id: answer.id };
  });

// ============================================================
// Skip question
// ============================================================
export const skipInterviewQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ session_id: z.string().uuid(), question_id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const uid = context.userId;
    const { data: session } = await sb
      .from("interview_sessions")
      .select("id, status")
      .eq("id", data.session_id)
      .eq("student_user_id", uid)
      .maybeSingle();
    if (!session) throw new Error("Session not found");
    if (session.status !== "in_progress") throw new Error("Session already finished");

    await sb.from("interview_answers").upsert(
      {
        session_id: data.session_id,
        question_id: data.question_id,
        is_skipped: true,
        evaluation_status: "skipped",
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "session_id,question_id" },
    );

    await sb.from("interview_activity").insert({
      student_user_id: uid,
      session_id: data.session_id,
      event_type: "question_skipped",
      meta: { question_id: data.question_id },
    });

    return { ok: true };
  });

// ============================================================
// Finalise session (complete / incomplete)
// ============================================================
export const finaliseInterviewSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ session_id: z.string().uuid(), end_early: z.boolean().optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const uid = context.userId;
    const { data: session } = await sb
      .from("interview_sessions")
      .select("*")
      .eq("id", data.session_id)
      .eq("student_user_id", uid)
      .maybeSingle();
    if (!session) throw new Error("Session not found");
    if (session.status !== "in_progress") return { ok: true, status: session.status };

    const { data: answers } = await sb
      .from("interview_answers")
      .select("practice_score, is_skipped")
      .eq("session_id", session.id);

    const answered = (answers ?? []).filter((a: any) => !a.is_skipped);
    const skipped = (answers ?? []).filter((a: any) => a.is_skipped);
    const scored = answered.filter((a: any) => a.practice_score != null);
    const avg = scored.length
      ? Math.round(
          (scored.reduce((n: number, a: any) => n + Number(a.practice_score), 0) / scored.length) *
            10,
        ) / 10
      : null;

    const answeredCount = answered.length;
    const targetCount = session.question_count;
    const allDone = answered.length + skipped.length >= targetCount;
    const status = data.end_early ? "incomplete" : allDone ? "completed" : "incomplete";

    await sb
      .from("interview_sessions")
      .update({
        status,
        completed_at: new Date().toISOString(),
        answered_count: answeredCount,
        skipped_count: skipped.length,
        avg_practice_score: avg,
      })
      .eq("id", session.id);

    await sb.from("interview_activity").insert({
      student_user_id: uid,
      session_id: session.id,
      event_type: status === "completed" ? "interview_completed" : "interview_ended_early",
      meta: { answered: answeredCount, skipped: skipped.length, avg_practice_score: avg },
    });

    return { ok: true, status };
  });

// ============================================================
// Activity helper (report viewed)
// ============================================================
export const logInterviewEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        session_id: z.string().uuid().optional(),
        event_type: z.string().max(60),
        meta: z.record(z.any()).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    await sb.from("interview_activity").insert({
      student_user_id: context.userId,
      session_id: data.session_id ?? null,
      event_type: data.event_type,
      meta: data.meta ?? {},
    });
    return { ok: true };
  });
