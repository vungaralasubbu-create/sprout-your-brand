
-- ============ Marketing Agent schema ============

CREATE TABLE IF NOT EXISTS public.ma_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  brand_id UUID NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',           -- active|paused|archived
  approval_level TEXT NOT NULL DEFAULT 'ai_plus_human',  -- suggest_only|ai_plus_human|fully_auto
  auto_publish BOOLEAN NOT NULL DEFAULT false,
  auto_optimize BOOLEAN NOT NULL DEFAULT true,
  auto_email BOOLEAN NOT NULL DEFAULT false,
  auto_blog BOOLEAN NOT NULL DEFAULT false,
  auto_video BOOLEAN NOT NULL DEFAULT false,
  auto_landing BOOLEAN NOT NULL DEFAULT false,
  auto_social BOOLEAN NOT NULL DEFAULT false,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  language TEXT NOT NULL DEFAULT 'en',
  goals JSONB NOT NULL DEFAULT '{}'::jsonb,
  channels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  budget_monthly NUMERIC(14,2) NULL,
  last_tick_at TIMESTAMPTZ NULL,
  next_tick_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ma_agents_owner_idx ON public.ma_agents(owner_id);
CREATE INDEX IF NOT EXISTS ma_agents_next_tick_idx ON public.ma_agents(next_tick_at) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.ma_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ma_agents(id) ON DELETE CASCADE,
  horizon TEXT NOT NULL,       -- daily|weekly|monthly|quarterly|annual|campaign|content|seo|email|social|video|blog|brand|growth|referral|placement
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft|approved|active|completed|archived
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL DEFAULT 'ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ma_plans_agent_horizon_idx ON public.ma_plans(agent_id, horizon, period_start DESC);

CREATE TABLE IF NOT EXISTS public.ma_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ma_agents(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,           -- pause|scale|budget_up|budget_down|create_ab|generate_asset|generate_video|generate_landing|generate_email|other
  target_kind TEXT NULL,        -- campaign|asset|post|blog|email|landing
  target_id TEXT NULL,
  action JSONB NOT NULL DEFAULT '{}'::jsonb,
  rationale TEXT NULL,
  confidence NUMERIC(4,3) NULL,
  state TEXT NOT NULL DEFAULT 'proposed', -- proposed|approved|rejected|executed|rolled_back|failed
  executed_at TIMESTAMPTZ NULL,
  rolled_back_at TIMESTAMPTZ NULL,
  reviewer_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ma_decisions_agent_state_idx ON public.ma_decisions(agent_id, state, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ma_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ma_agents(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,           -- course|content|blog|video|email|budget|creative|seo|growth|referral|placement
  title TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 3,
  state TEXT NOT NULL DEFAULT 'pending', -- pending|approved|dismissed|actioned
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actioned_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS ma_reco_agent_state_idx ON public.ma_recommendations(agent_id, state, priority);

CREATE TABLE IF NOT EXISTS public.ma_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ma_agents(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,           -- winning_creative|winning_cta|winning_subject|winning_landing|winning_video|winning_keyword|campaign_history|pattern
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC(10,4) NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, kind, key)
);
CREATE INDEX IF NOT EXISTS ma_knowledge_agent_kind_idx ON public.ma_knowledge(agent_id, kind, score DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.ma_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ma_agents(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,           -- morning_brief|weekly|monthly|quarterly|annual|campaign_summary|executive|seo|social|email
  title TEXT NOT NULL,
  summary TEXT NULL,
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  period_start DATE NULL,
  period_end DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ma_reports_agent_kind_idx ON public.ma_reports(agent_id, kind, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ma_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ma_agents(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, day)
);
CREATE INDEX IF NOT EXISTS ma_metrics_agent_day_idx ON public.ma_metrics_snapshots(agent_id, day DESC);

-- ============ Grants ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_agents            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_plans             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_decisions         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_recommendations   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_knowledge         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_reports           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_metrics_snapshots TO authenticated;
GRANT ALL ON public.ma_agents, public.ma_plans, public.ma_decisions, public.ma_recommendations, public.ma_knowledge, public.ma_reports, public.ma_metrics_snapshots TO service_role;

-- ============ RLS ============
ALTER TABLE public.ma_agents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_decisions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_recommendations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_knowledge         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_metrics_snapshots ENABLE ROW LEVEL SECURITY;

-- Agents: owner or admin/super_admin
CREATE POLICY "ma_agents_owner_rw" ON public.ma_agents
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Helper predicate for child tables via agent ownership
CREATE OR REPLACE FUNCTION public.ma_agent_accessible(_agent_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ma_agents a
    WHERE a.id = _agent_id
      AND (a.owner_id = auth.uid()
           OR public.has_role(auth.uid(), 'admin')
           OR public.has_role(auth.uid(), 'super_admin'))
  )
$$;

CREATE POLICY "ma_plans_scope"       ON public.ma_plans             FOR ALL TO authenticated USING (public.ma_agent_accessible(agent_id)) WITH CHECK (public.ma_agent_accessible(agent_id));
CREATE POLICY "ma_decisions_scope"   ON public.ma_decisions         FOR ALL TO authenticated USING (public.ma_agent_accessible(agent_id)) WITH CHECK (public.ma_agent_accessible(agent_id));
CREATE POLICY "ma_reco_scope"        ON public.ma_recommendations   FOR ALL TO authenticated USING (public.ma_agent_accessible(agent_id)) WITH CHECK (public.ma_agent_accessible(agent_id));
CREATE POLICY "ma_knowledge_scope"   ON public.ma_knowledge         FOR ALL TO authenticated USING (public.ma_agent_accessible(agent_id)) WITH CHECK (public.ma_agent_accessible(agent_id));
CREATE POLICY "ma_reports_scope"     ON public.ma_reports           FOR ALL TO authenticated USING (public.ma_agent_accessible(agent_id)) WITH CHECK (public.ma_agent_accessible(agent_id));
CREATE POLICY "ma_metrics_scope"     ON public.ma_metrics_snapshots FOR ALL TO authenticated USING (public.ma_agent_accessible(agent_id)) WITH CHECK (public.ma_agent_accessible(agent_id));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.ma_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS ma_agents_touch ON public.ma_agents;
CREATE TRIGGER ma_agents_touch BEFORE UPDATE ON public.ma_agents FOR EACH ROW EXECUTE FUNCTION public.ma_touch_updated_at();
DROP TRIGGER IF EXISTS ma_plans_touch ON public.ma_plans;
CREATE TRIGGER ma_plans_touch BEFORE UPDATE ON public.ma_plans FOR EACH ROW EXECUTE FUNCTION public.ma_touch_updated_at();
