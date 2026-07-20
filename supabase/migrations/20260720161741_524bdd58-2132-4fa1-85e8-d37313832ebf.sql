
-- 1. publishing_jobs
CREATE TABLE public.publishing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  content_id uuid REFERENCES public.approval_queue(id) ON DELETE SET NULL,
  campaign_id text,
  campaign text,
  platform text NOT NULL,
  account_id uuid REFERENCES public.soc_accounts(id) ON DELETE SET NULL,
  account_label text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  mode text NOT NULL DEFAULT 'schedule',
  recurrence jsonb,
  evergreen boolean NOT NULL DEFAULT false,
  evergreen_interval_days integer,
  last_evergreen_at timestamptz,
  timezone text NOT NULL DEFAULT 'UTC',
  priority integer NOT NULL DEFAULT 5,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  published_at timestamptz,
  cancelled_at timestamptz,
  status text NOT NULL DEFAULT 'queued',
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 4,
  next_retry_at timestamptz,
  platform_post_id text,
  platform_url text,
  error_code text,
  error_message text,
  response_payload jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT publishing_jobs_status_ck CHECK (status IN
    ('draft','approved','queued','publishing','published','failed','cancelled','retrying','skipped')),
  CONSTRAINT publishing_jobs_mode_ck CHECK (mode IN
    ('publish_now','schedule','recurring','evergreen','campaign'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.publishing_jobs TO authenticated;
GRANT ALL ON public.publishing_jobs TO service_role;
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pj_owner_or_admin_rw" ON public.publishing_jobs
  FOR ALL TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE INDEX idx_pj_owner ON public.publishing_jobs(owner_id);
CREATE INDEX idx_pj_status_sched ON public.publishing_jobs(status, scheduled_at);
CREATE INDEX idx_pj_content ON public.publishing_jobs(content_id);
CREATE INDEX idx_pj_platform ON public.publishing_jobs(platform);
CREATE INDEX idx_pj_campaign ON public.publishing_jobs(campaign);
CREATE INDEX idx_pj_worker ON public.publishing_jobs(status, scheduled_at) WHERE status IN ('queued','retrying');

CREATE OR REPLACE FUNCTION public.publishing_jobs_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_publishing_jobs_touch BEFORE UPDATE ON public.publishing_jobs
FOR EACH ROW EXECUTE FUNCTION public.publishing_jobs_touch();

-- 2. publishing_history (append-only)
CREATE TABLE public.publishing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  job_id uuid REFERENCES public.publishing_jobs(id) ON DELETE CASCADE,
  content_id uuid,
  platform text NOT NULL,
  account_id uuid,
  attempt integer NOT NULL DEFAULT 1,
  status text NOT NULL,
  platform_post_id text,
  platform_url text,
  duration_ms integer,
  actor uuid,
  request_payload jsonb,
  response_payload jsonb,
  error_code text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.publishing_history TO authenticated;
GRANT ALL ON public.publishing_history TO service_role;
ALTER TABLE public.publishing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ph_owner_or_admin_read" ON public.publishing_history
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );
CREATE POLICY "ph_owner_or_admin_write" ON public.publishing_history
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE INDEX idx_ph_owner_created ON public.publishing_history(owner_id, created_at DESC);
CREATE INDEX idx_ph_job ON public.publishing_history(job_id);

-- 3. publishing_notifications
CREATE TABLE public.publishing_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  job_id uuid REFERENCES public.publishing_jobs(id) ON DELETE CASCADE,
  event text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.publishing_notifications TO authenticated;
GRANT ALL ON public.publishing_notifications TO service_role;
ALTER TABLE public.publishing_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pn_owner_rw" ON public.publishing_notifications
  FOR ALL TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE INDEX idx_pn_owner_created ON public.publishing_notifications(owner_id, created_at DESC);
