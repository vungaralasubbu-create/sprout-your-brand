
-- Conversion Intelligence: sessions
CREATE TABLE public.ci_sessions (
  session_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_channel TEXT,
  first_source TEXT,
  first_medium TEXT,
  first_campaign TEXT,
  first_referrer TEXT,
  first_landing_path TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_channel TEXT,
  last_source TEXT,
  last_medium TEXT,
  last_campaign TEXT,
  last_referrer TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device TEXT,
  country TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ci_sessions_first_channel_idx ON public.ci_sessions(first_channel);
CREATE INDEX ci_sessions_last_channel_idx ON public.ci_sessions(last_channel);
CREATE INDEX ci_sessions_first_seen_idx ON public.ci_sessions(first_seen_at DESC);
CREATE INDEX ci_sessions_user_idx ON public.ci_sessions(user_id);

GRANT SELECT, INSERT, UPDATE ON public.ci_sessions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.ci_sessions TO authenticated;
GRANT ALL ON public.ci_sessions TO service_role;

ALTER TABLE public.ci_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon insert ci_sessions"
  ON public.ci_sessions FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "anon update ci_sessions last-touch"
  ON public.ci_sessions FOR UPDATE TO anon
  USING (true) WITH CHECK (true);
CREATE POLICY "auth insert ci_sessions"
  ON public.ci_sessions FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "auth update ci_sessions last-touch"
  ON public.ci_sessions FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
CREATE POLICY "admins read ci_sessions"
  ON public.ci_sessions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Conversion Intelligence: funnel events
CREATE TABLE public.ci_funnel_events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id UUID,
  stage TEXT NOT NULL CHECK (stage IN (
    'homepage','program','course','blog','landing',
    'form_start','form_submit','payment','enrollment',
    'course_start','course_complete'
  )),
  page_path TEXT,
  entity_id TEXT,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  channel TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ci_funnel_events_session_idx ON public.ci_funnel_events(session_id);
CREATE INDEX ci_funnel_events_stage_idx ON public.ci_funnel_events(stage);
CREATE INDEX ci_funnel_events_occurred_idx ON public.ci_funnel_events(occurred_at DESC);
CREATE INDEX ci_funnel_events_lead_idx ON public.ci_funnel_events(lead_id);
CREATE INDEX ci_funnel_events_user_idx ON public.ci_funnel_events(user_id);
CREATE INDEX ci_funnel_events_channel_idx ON public.ci_funnel_events(channel);
-- de-dup guard: at most one row per (session, stage, entity)
CREATE UNIQUE INDEX ci_funnel_events_unique_stage
  ON public.ci_funnel_events(session_id, stage, COALESCE(entity_id, ''));

GRANT SELECT, INSERT ON public.ci_funnel_events TO anon;
GRANT SELECT, INSERT ON public.ci_funnel_events TO authenticated;
GRANT USAGE ON SEQUENCE public.ci_funnel_events_id_seq TO anon, authenticated;
GRANT ALL ON public.ci_funnel_events TO service_role;

ALTER TABLE public.ci_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon insert ci_funnel_events"
  ON public.ci_funnel_events FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "auth insert ci_funnel_events"
  ON public.ci_funnel_events FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "admins read ci_funnel_events"
  ON public.ci_funnel_events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER ci_sessions_touch_updated_at
  BEFORE UPDATE ON public.ci_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
