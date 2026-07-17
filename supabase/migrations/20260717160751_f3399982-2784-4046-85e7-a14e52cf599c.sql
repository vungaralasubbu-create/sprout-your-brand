
-- 1. Extend platform_leads
ALTER TABLE public.platform_leads
  ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_category TEXT NOT NULL DEFAULT 'cold',
  ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS probability NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS predicted_course TEXT,
  ADD COLUMN IF NOT EXISTS predicted_revenue NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS predicted_enrollment_date DATE,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_next_action TEXT,
  ADD COLUMN IF NOT EXISTS buying_intent TEXT,
  ADD COLUMN IF NOT EXISTS career_interest TEXT,
  ADD COLUMN IF NOT EXISTS budget_range TEXT,
  ADD COLUMN IF NOT EXISTS preferred_timing TEXT,
  ADD COLUMN IF NOT EXISTS skill_level TEXT,
  ADD COLUMN IF NOT EXISTS device TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS event_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_platform_leads_score ON public.platform_leads (score DESC);
CREATE INDEX IF NOT EXISTS idx_platform_leads_category ON public.platform_leads (score_category);
CREATE INDEX IF NOT EXISTS idx_platform_leads_last_activity ON public.platform_leads (last_activity_at DESC);

-- 2. Extend platform_lead_events
ALTER TABLE public.platform_lead_events
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS weight INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

CREATE INDEX IF NOT EXISTS idx_platform_lead_events_lead ON public.platform_lead_events (lead_id, created_at DESC);

-- 3. lead_score_snapshots (audit / training data)
CREATE TABLE IF NOT EXISTS public.lead_score_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.platform_leads(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  category TEXT NOT NULL,
  probability NUMERIC(5,2) NOT NULL DEFAULT 0,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.lead_score_snapshots TO authenticated;
GRANT ALL ON public.lead_score_snapshots TO service_role;
ALTER TABLE public.lead_score_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read lead snapshots"
  ON public.lead_score_snapshots FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone inserts snapshots"
  ON public.lead_score_snapshots FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_lead_snapshots_lead ON public.lead_score_snapshots (lead_id, created_at DESC);

-- 4. lead_scoring_config
CREATE TABLE IF NOT EXISTS public.lead_scoring_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT true,
  weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  thresholds JSONB NOT NULL DEFAULT '{"hot":90,"warm":70,"nurture":40}'::jsonb,
  automation JSONB NOT NULL DEFAULT '{"auto_assign_hot":true,"auto_assign_warm":true,"nurture_campaign":true}'::jsonb,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lead_scoring_config TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.lead_scoring_config TO authenticated;
GRANT ALL ON public.lead_scoring_config TO service_role;
ALTER TABLE public.lead_scoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read active scoring config"
  ON public.lead_scoring_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage scoring config"
  ON public.lead_scoring_config FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_lead_scoring_config_touch
  BEFORE UPDATE ON public.lead_scoring_config
  FOR EACH ROW
  EXECUTE FUNCTION public.platform_leads_touch_updated_at();

-- Seed default config
INSERT INTO public.lead_scoring_config (weights)
SELECT '{
  "page_view": 2,
  "course_view": 8,
  "programs_view": 4,
  "long_session": 6,
  "scroll_deep": 5,
  "video_watch": 6,
  "brochure_download": 15,
  "curriculum_download": 12,
  "career_roadmap": 10,
  "demo_request": 20,
  "consultation_booked": 25,
  "ai_conversation": 4,
  "ai_message": 2,
  "ai_qualified": 12,
  "phone_captured": 20,
  "otp_verified": 10,
  "returning_visitor": 8,
  "utm_paid": 5,
  "utm_organic": 3,
  "short_session_penalty": -6,
  "bounce_penalty": -10
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.lead_scoring_config);
