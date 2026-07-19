-- Provider health snapshot (one row per provider)
CREATE TABLE public.ai_provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'healthy',
  latency_ms_p50 INTEGER,
  latency_ms_p95 INTEGER,
  success_rate NUMERIC(5,4),
  error_rate NUMERIC(5,4),
  requests_today INTEGER NOT NULL DEFAULT 0,
  errors_today INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_provider_health TO authenticated;
GRANT ALL ON public.ai_provider_health TO service_role;
ALTER TABLE public.ai_provider_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view provider health"
  ON public.ai_provider_health FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages provider health"
  ON public.ai_provider_health FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Per-request events (append-only log for analytics)
CREATE TABLE public.ai_provider_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT,
  task TEXT,
  latency_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_code TEXT,
  error_message TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_credits NUMERIC(10,4),
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_provider_events TO authenticated;
GRANT ALL ON public.ai_provider_events TO service_role;
ALTER TABLE public.ai_provider_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view provider events"
  ON public.ai_provider_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role writes provider events"
  ON public.ai_provider_events FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX idx_ai_provider_events_provider_time ON public.ai_provider_events(provider, created_at DESC);
CREATE INDEX idx_ai_provider_events_success ON public.ai_provider_events(success, created_at DESC);

-- updated_at trigger
CREATE TRIGGER update_ai_provider_health_updated_at
  BEFORE UPDATE ON public.ai_provider_health
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed rows for the three providers
INSERT INTO public.ai_provider_health (provider, status) VALUES
  ('openai', 'healthy'),
  ('anthropic', 'healthy'),
  ('google', 'healthy')
ON CONFLICT (provider) DO NOTHING;