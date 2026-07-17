
-- =============== platform_leads ===============
CREATE TABLE public.platform_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  interested_course TEXT,
  qualification TEXT,
  current_status TEXT,           -- 'student' | 'working' | 'job_seeker' | other
  source TEXT NOT NULL DEFAULT 'unknown', -- homepage | ai | popup | brochure | consultation | exit_intent | scroll | returning_visitor | demo | roadmap | cta
  source_detail TEXT,
  campaign TEXT,
  page_path TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new', -- new | contacted | qualified | converted | lost
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_leads_created_at ON public.platform_leads (created_at DESC);
CREATE INDEX idx_platform_leads_source ON public.platform_leads (source);
CREATE INDEX idx_platform_leads_status ON public.platform_leads (status);
CREATE INDEX idx_platform_leads_email ON public.platform_leads (lower(email));
CREATE INDEX idx_platform_leads_phone ON public.platform_leads (phone);

GRANT INSERT ON public.platform_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.platform_leads TO authenticated;
GRANT ALL ON public.platform_leads TO service_role;

ALTER TABLE public.platform_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
ON public.platform_leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read all leads"
ON public.platform_leads FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update leads"
ON public.platform_leads FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete leads"
ON public.platform_leads FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.platform_leads_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_platform_leads_updated_at
BEFORE UPDATE ON public.platform_leads
FOR EACH ROW EXECUTE FUNCTION public.platform_leads_touch_updated_at();

-- =============== platform_lead_events ===============
CREATE TABLE public.platform_lead_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,   -- popup_view | popup_close | popup_submit | ai_convert | brochure_download | consultation_book | roadmap_request | cta_click
  source TEXT,
  page_path TEXT,
  variant TEXT,               -- A/B variant
  lead_id UUID REFERENCES public.platform_leads(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_lead_events_created_at ON public.platform_lead_events (created_at DESC);
CREATE INDEX idx_platform_lead_events_type ON public.platform_lead_events (event_type);

GRANT INSERT ON public.platform_lead_events TO anon, authenticated;
GRANT SELECT ON public.platform_lead_events TO authenticated;
GRANT ALL ON public.platform_lead_events TO service_role;

ALTER TABLE public.platform_lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log lead events"
ON public.platform_lead_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read lead events"
ON public.platform_lead_events FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
