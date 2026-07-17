
-- ============================================================
-- brain_decisions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.brain_decisions (
  lead_id UUID PRIMARY KEY REFERENCES public.platform_leads(id) ON DELETE CASCADE,
  priority TEXT NOT NULL DEFAULT 'medium',
  urgency TEXT NOT NULL DEFAULT 'normal',
  best_channel TEXT,
  best_time_window TEXT,
  best_time_reason TEXT,
  recommended_course TEXT,
  secondary_course TEXT,
  expected_close_date DATE,
  expected_revenue NUMERIC(12,2) DEFAULT 0,
  scholarship_pct INT DEFAULT 0,
  scholarship_type TEXT,
  scholarship_reason TEXT,
  health_score INT DEFAULT 0,
  engagement_score INT DEFAULT 0,
  buying_intent TEXT,
  probability_pct INT DEFAULT 0,
  assigned_counsellor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignment_reason TEXT,
  reasoning TEXT,
  drop_off_reason TEXT,
  needs_parent_mode BOOLEAN DEFAULT false,
  model TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brain_decisions_priority_idx ON public.brain_decisions(priority, computed_at DESC);
CREATE INDEX IF NOT EXISTS brain_decisions_assigned_idx ON public.brain_decisions(assigned_counsellor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_decisions TO authenticated;
GRANT ALL ON public.brain_decisions TO service_role;
ALTER TABLE public.brain_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Copilot users read brain_decisions" ON public.brain_decisions
  FOR SELECT TO authenticated USING (public.is_copilot_user(auth.uid()));
CREATE POLICY "Copilot users write brain_decisions" ON public.brain_decisions
  FOR ALL TO authenticated
  USING (public.is_copilot_user(auth.uid()))
  WITH CHECK (public.is_copilot_user(auth.uid()));

-- ============================================================
-- brain_alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.brain_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.platform_leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brain_alerts_open_idx ON public.brain_alerts(acknowledged, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_alerts TO authenticated;
GRANT ALL ON public.brain_alerts TO service_role;
ALTER TABLE public.brain_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Copilot users read brain_alerts" ON public.brain_alerts
  FOR SELECT TO authenticated USING (public.is_copilot_user(auth.uid()));
CREATE POLICY "Copilot users write brain_alerts" ON public.brain_alerts
  FOR ALL TO authenticated
  USING (public.is_copilot_user(auth.uid()))
  WITH CHECK (public.is_copilot_user(auth.uid()));

-- ============================================================
-- brain_forecasts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.brain_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL,               -- today | week | month | quarter
  expected_revenue NUMERIC(14,2) DEFAULT 0,
  expected_admissions INT DEFAULT 0,
  avg_ticket_size NUMERIC(12,2) DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  hot_leads INT DEFAULT 0,
  warm_leads INT DEFAULT 0,
  breakdown JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brain_forecasts_scope_idx ON public.brain_forecasts(scope, generated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_forecasts TO authenticated;
GRANT ALL ON public.brain_forecasts TO service_role;
ALTER TABLE public.brain_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Copilot users read forecasts" ON public.brain_forecasts
  FOR SELECT TO authenticated USING (public.is_copilot_user(auth.uid()));
CREATE POLICY "Copilot users write forecasts" ON public.brain_forecasts
  FOR ALL TO authenticated
  USING (public.is_copilot_user(auth.uid()))
  WITH CHECK (public.is_copilot_user(auth.uid()));

-- ============================================================
-- brain_dropoffs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.brain_dropoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.platform_leads(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence TEXT,
  page_path TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brain_dropoffs_reason_idx ON public.brain_dropoffs(reason, detected_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_dropoffs TO authenticated;
GRANT ALL ON public.brain_dropoffs TO service_role;
ALTER TABLE public.brain_dropoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Copilot users read dropoffs" ON public.brain_dropoffs
  FOR SELECT TO authenticated USING (public.is_copilot_user(auth.uid()));
CREATE POLICY "Copilot users write dropoffs" ON public.brain_dropoffs
  FOR ALL TO authenticated
  USING (public.is_copilot_user(auth.uid()))
  WITH CHECK (public.is_copilot_user(auth.uid()));

-- ============================================================
-- brain_nurture_deliveries
-- ============================================================
CREATE TABLE IF NOT EXISTS public.brain_nurture_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.platform_leads(id) ON DELETE CASCADE,
  campaign TEXT NOT NULL,
  channel TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'queued',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brain_nurture_lead_idx ON public.brain_nurture_deliveries(lead_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_nurture_deliveries TO authenticated;
GRANT ALL ON public.brain_nurture_deliveries TO service_role;
ALTER TABLE public.brain_nurture_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Copilot users read nurture" ON public.brain_nurture_deliveries
  FOR SELECT TO authenticated USING (public.is_copilot_user(auth.uid()));
CREATE POLICY "Copilot users write nurture" ON public.brain_nurture_deliveries
  FOR ALL TO authenticated
  USING (public.is_copilot_user(auth.uid()))
  WITH CHECK (public.is_copilot_user(auth.uid()));

-- ============================================================
-- counsellor_profiles (routing metadata)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.counsellor_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  languages TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  region TEXT,
  capacity INT DEFAULT 25,
  current_workload INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  avg_response_seconds INT DEFAULT 0,
  is_senior BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.counsellor_profiles TO authenticated;
GRANT ALL ON public.counsellor_profiles TO service_role;
ALTER TABLE public.counsellor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Copilot users read counsellor_profiles" ON public.counsellor_profiles
  FOR SELECT TO authenticated USING (public.is_copilot_user(auth.uid()));
CREATE POLICY "Counsellors edit own profile" ON public.counsellor_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins insert counsellor_profiles" ON public.counsellor_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR user_id = auth.uid());
CREATE POLICY "Admins delete counsellor_profiles" ON public.counsellor_profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
