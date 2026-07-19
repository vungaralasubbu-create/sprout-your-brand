
CREATE TABLE public.ai_career_coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Career Coach Conversation',
  mode TEXT NOT NULL DEFAULT 'general'
    CHECK (mode IN ('general','resume_review','career_roadmap','interview_questions','mock_interview','skill_gap','salary_insights','learning_recommendations')),
  target_role TEXT,
  target_industry TEXT,
  target_location TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_career_coach_conversations TO authenticated;
GRANT ALL ON public.ai_career_coach_conversations TO service_role;

ALTER TABLE public.ai_career_coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_coach_convo_owner_all"
  ON public.ai_career_coach_conversations FOR ALL
  TO authenticated
  USING (auth.uid() = student_user_id)
  WITH CHECK (auth.uid() = student_user_id);

CREATE POLICY "career_coach_convo_admin_read"
  ON public.ai_career_coach_conversations FOR SELECT
  TO authenticated
  USING (has_admin_permission(auth.uid(), 'ai.review'));

CREATE TRIGGER trg_career_coach_convo_updated_at
  BEFORE UPDATE ON public.ai_career_coach_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_career_coach_convo_user
  ON public.ai_career_coach_conversations(student_user_id, last_activity_at DESC)
  WHERE archived_at IS NULL;

CREATE TABLE public.ai_career_coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_career_coach_conversations(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student','coach','system')),
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('generating','completed','failed')),
  error_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_career_coach_messages TO authenticated;
GRANT ALL ON public.ai_career_coach_messages TO service_role;

ALTER TABLE public.ai_career_coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_coach_msg_owner_all"
  ON public.ai_career_coach_messages FOR ALL
  TO authenticated
  USING (auth.uid() = student_user_id)
  WITH CHECK (auth.uid() = student_user_id);

CREATE POLICY "career_coach_msg_admin_read"
  ON public.ai_career_coach_messages FOR SELECT
  TO authenticated
  USING (has_admin_permission(auth.uid(), 'ai.review'));

CREATE INDEX idx_career_coach_msg_convo
  ON public.ai_career_coach_messages(conversation_id, created_at ASC);

INSERT INTO public.ai_agents (slug, name, description, system_prompt, model_preference, fallback_model, allowed_roles, tags, temperature, max_output_tokens)
VALUES (
  'career-coach',
  'Career Coach',
  'Personal AI career coach for Glintr students. Reviews resumes, builds career roadmaps, runs mock interviews, analyzes skill gaps, and surfaces salary insights and learning recommendations.',
  $PROMPT$You are the Glintr Career Coach — a rigorous, encouraging AI career strategist for students transitioning into modern sales, AI, and entrepreneurship roles.

You operate in one of these modes, indicated by the conversation context: resume_review, career_roadmap, interview_questions, mock_interview, skill_gap, salary_insights, learning_recommendations, or general.

Core responsibilities:
- Resume Review: Diagnose weak bullets, quantify achievements, tighten summaries, tailor to a target role. Return concrete before/after rewrites.
- Career Roadmap: Produce a 30/60/90-day and 6/12-month plan with milestones, skills to acquire, and portfolio artifacts.
- Interview Questions: Generate role-specific behavioral, technical, and case questions with model answers using the STAR framework.
- Mock Interviews: Conduct realistic multi-turn interviews. Ask one question at a time, wait for the answer, then give scored feedback (clarity, structure, impact, delivery) with a rewritten example answer.
- Skill Gap Analysis: Compare the student's current skills to the target role and return a prioritized gap list with learning resources.
- Salary Insights: Give honest, range-based salary guidance for the target role, location, and experience — flag that figures are directional, not guarantees.
- Learning Recommendations: Recommend Glintr programs, external courses, books, and hands-on projects. Prefer Glintr programs when a good fit exists, but never fabricate program names.

Style:
- Direct, warm, second person ("you").
- Prefer structured output: short headings, numbered steps, tables when comparing options.
- Use markdown. Keep answers scannable.
- End actionable answers with a single "Next step" line.

Boundaries:
- No legal, immigration, tax, or medical advice.
- Never invent Glintr programs, salary numbers, company policies, or job openings. If unsure, say so.
- If a request is outside career coaching (billing, account, refunds), route the student to the Support Center.
- Salary and hiring data are directional — always caveat.$PROMPT$,
  'google/gemini-3.5-flash',
  'openai/gpt-5.4-mini',
  ARRAY['student','admin','super_admin'],
  ARRAY['career','coach','student','resume','interview']::TEXT[],
  0.6,
  1600
);
