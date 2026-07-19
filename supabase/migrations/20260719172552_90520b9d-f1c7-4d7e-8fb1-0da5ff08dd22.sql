
-- ============================================================
-- AI Agents Registry
-- ============================================================
CREATE TABLE public.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  system_prompt TEXT NOT NULL,
  model_preference TEXT NOT NULL DEFAULT 'google/gemini-3.5-flash',
  fallback_model TEXT,
  allowed_roles TEXT[] NOT NULL DEFAULT ARRAY['student','partner','admin','super_admin'],
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  temperature NUMERIC(3,2),
  max_output_tokens INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_agents TO authenticated;
GRANT ALL ON public.ai_agents TO service_role;

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_agents_read_active"
  ON public.ai_agents FOR SELECT
  TO authenticated
  USING (is_active = true OR has_admin_permission(auth.uid(), 'ai.manage'));

CREATE POLICY "ai_agents_admin_write"
  ON public.ai_agents FOR ALL
  TO authenticated
  USING (has_admin_permission(auth.uid(), 'ai.manage'))
  WITH CHECK (has_admin_permission(auth.uid(), 'ai.manage'));

CREATE TRIGGER trg_ai_agents_updated_at
  BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ai_agents_active ON public.ai_agents(is_active) WHERE is_active = true;

-- ============================================================
-- AI Agent Runs (observability)
-- ============================================================
CREATE TABLE public.ai_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  agent_slug TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT,
  conversation_id UUID,
  message_id UUID,
  model TEXT NOT NULL,
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'success',
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_credits NUMERIC(12,6),
  duration_ms INTEGER,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_agent_runs TO authenticated;
GRANT ALL ON public.ai_agent_runs TO service_role;

ALTER TABLE public.ai_agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_agent_runs_self_read"
  ON public.ai_agent_runs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ai_agent_runs_admin_read"
  ON public.ai_agent_runs FOR SELECT
  TO authenticated
  USING (has_admin_permission(auth.uid(), 'ai.review'));

CREATE INDEX idx_ai_agent_runs_user ON public.ai_agent_runs(user_id, created_at DESC);
CREATE INDEX idx_ai_agent_runs_agent ON public.ai_agent_runs(agent_slug, created_at DESC);
CREATE INDEX idx_ai_agent_runs_status ON public.ai_agent_runs(status, created_at DESC) WHERE status <> 'success';

-- ============================================================
-- Seed: Student Mentor
-- ============================================================
INSERT INTO public.ai_agents (slug, name, description, system_prompt, model_preference, fallback_model, allowed_roles, tags, temperature, max_output_tokens)
VALUES (
  'student-mentor',
  'Student Mentor',
  'Personal AI mentor for Glintr students. Answers course questions, explains concepts, recommends next lessons, generates quizzes, and coaches learners through mistakes.',
  $PROMPT$You are the Glintr Student Mentor — a warm, patient, and rigorous AI teacher for learners on the Glintr platform.

Core responsibilities:
- Answer student questions clearly, with worked examples.
- Explain lessons and concepts step-by-step, checking for understanding.
- Recommend the next lesson, module, or practice activity when appropriate.
- Generate short quizzes (3–5 questions) on request; include answers and brief explanations.
- When a student shares a wrong answer or mistake, diagnose the misconception, explain it kindly, and give a corrected worked example.
- Track and reference the student's stated progress within the conversation.

Style:
- Encouraging, plain-language, second person ("you").
- Prefer short paragraphs and numbered steps over walls of text.
- Use markdown (headings, lists, code blocks) when it helps clarity.
- Never invent Glintr policies, prices, refunds, or platform features. If asked, say you'll route them to Support.

Boundaries:
- No medical, legal, or financial advice.
- If a request is outside learning support (billing, account, payments), acknowledge and suggest the Support Center.
- If you don't know, say so — do not fabricate citations or lesson names.$PROMPT$,
  'google/gemini-3.5-flash',
  'openai/gpt-5.4-mini',
  ARRAY['student','admin','super_admin'],
  ARRAY['learning','tutor','student']::TEXT[],
  0.7,
  1200
);
