
-- 1. HANDLERS registry
CREATE TABLE public.automation_handlers (
  code text PRIMARY KEY,
  category text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT true,
  requires_approval boolean NOT NULL DEFAULT false,
  default_priority int NOT NULL DEFAULT 100,
  default_max_attempts int NOT NULL DEFAULT 5,
  default_timeout_seconds int NOT NULL DEFAULT 60,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.automation_handlers TO authenticated;
GRANT ALL ON public.automation_handlers TO service_role;
ALTER TABLE public.automation_handlers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Handlers readable to authenticated" ON public.automation_handlers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin manages handlers" ON public.automation_handlers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'::app_role));

-- 2. JOBS priority queue
CREATE TABLE public.automation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handler text NOT NULL REFERENCES public.automation_handlers(code) ON DELETE RESTRICT,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_job_id uuid REFERENCES public.automation_jobs(id) ON DELETE SET NULL,
  approval_id uuid,
  idempotency_key text,
  priority int NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','waiting_approval','succeeded','failed','cancelled','dead_letter')),
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  backoff_seconds int NOT NULL DEFAULT 30,
  timeout_seconds int NOT NULL DEFAULT 60,
  run_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  started_at timestamptz,
  completed_at timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  last_error text,
  correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (handler, idempotency_key)
);
CREATE INDEX idx_jobs_ready ON public.automation_jobs (priority DESC, run_at ASC)
  WHERE status = 'queued';
CREATE INDEX idx_jobs_owner ON public.automation_jobs (owner_id);
CREATE INDEX idx_jobs_status ON public.automation_jobs (status);
CREATE INDEX idx_jobs_locked ON public.automation_jobs (locked_at)
  WHERE status = 'running';
GRANT SELECT ON public.automation_jobs TO authenticated;
GRANT ALL ON public.automation_jobs TO service_role;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own jobs" ON public.automation_jobs
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Super admin manages jobs" ON public.automation_jobs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'::app_role));

-- 3. TRIGGERS (cron / event / one-shot)
CREATE TABLE public.automation_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  handler text NOT NULL REFERENCES public.automation_handlers(code) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('cron','event','once')),
  cron_expression text,
  event_name text,
  match jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_template jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  next_run_at timestamptz,
  last_run_at timestamptz,
  last_status text,
  priority int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_triggers_due ON public.automation_triggers (next_run_at)
  WHERE is_enabled AND kind IN ('cron','once');
CREATE INDEX idx_triggers_event ON public.automation_triggers (event_name)
  WHERE is_enabled AND kind = 'event';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_triggers TO authenticated;
GRANT ALL ON public.automation_triggers TO service_role;
ALTER TABLE public.automation_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own triggers" ON public.automation_triggers
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Super admin manages triggers" ON public.automation_triggers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'::app_role));

-- 4. EVENTS inbound queue (matched against event triggers)
CREATE TABLE public.automation_events_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text,
  processed_at timestamptz,
  jobs_created int,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_unprocessed ON public.automation_events_queue (created_at)
  WHERE processed_at IS NULL;
GRANT SELECT ON public.automation_events_queue TO authenticated;
GRANT ALL ON public.automation_events_queue TO service_role;
ALTER TABLE public.automation_events_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin reads events" ON public.automation_events_queue
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'::app_role));

-- 5. APPROVALS (human gate)
CREATE TABLE public.automation_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.automation_jobs(id) ON DELETE CASCADE,
  handler text NOT NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_role text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','expired')),
  reason text,
  summary text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_approvals_pending ON public.automation_approvals (status, created_at)
  WHERE status = 'pending';
CREATE INDEX idx_approvals_approver ON public.automation_approvals (approver_id);
GRANT SELECT, UPDATE ON public.automation_approvals TO authenticated;
GRANT ALL ON public.automation_approvals TO service_role;
ALTER TABLE public.automation_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approvers read their queue" ON public.automation_approvals
  FOR SELECT TO authenticated
  USING (auth.uid() = approver_id OR auth.uid() = requested_by
      OR (approver_role IS NOT NULL AND public.has_role(auth.uid(), approver_role::app_role)));
CREATE POLICY "Approvers decide" ON public.automation_approvals
  FOR UPDATE TO authenticated
  USING (auth.uid() = approver_id
      OR (approver_role IS NOT NULL AND public.has_role(auth.uid(), approver_role::app_role)));
CREATE POLICY "Super admin manages approvals" ON public.automation_approvals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'::app_role));

-- FK job → approval (added after approvals exists)
ALTER TABLE public.automation_jobs
  ADD CONSTRAINT automation_jobs_approval_fk
  FOREIGN KEY (approval_id) REFERENCES public.automation_approvals(id) ON DELETE SET NULL;

-- 6. NOTIFICATIONS emitted by workflows
CREATE TABLE public.automation_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.automation_jobs(id) ON DELETE SET NULL,
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role text,
  channel text NOT NULL CHECK (channel IN ('in_app','email','webhook','sms')),
  title text NOT NULL,
  body text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','read')),
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifs_recipient ON public.automation_notifications (recipient_user_id, created_at DESC);
CREATE INDEX idx_notifs_pending ON public.automation_notifications (status, created_at) WHERE status = 'pending';
GRANT SELECT, UPDATE ON public.automation_notifications TO authenticated;
GRANT ALL ON public.automation_notifications TO service_role;
ALTER TABLE public.automation_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.automation_notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = recipient_user_id
      OR (recipient_role IS NOT NULL AND public.has_role(auth.uid(), recipient_role::app_role)));
CREATE POLICY "Users mark own notifications read" ON public.automation_notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_user_id)
  WITH CHECK (auth.uid() = recipient_user_id);
CREATE POLICY "Super admin manages notifications" ON public.automation_notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'::app_role));

-- 7. METRICS daily rollup
CREATE TABLE public.automation_metrics_daily (
  day date NOT NULL,
  handler text NOT NULL,
  jobs_total int NOT NULL DEFAULT 0,
  jobs_succeeded int NOT NULL DEFAULT 0,
  jobs_failed int NOT NULL DEFAULT 0,
  jobs_dead_letter int NOT NULL DEFAULT 0,
  retries int NOT NULL DEFAULT 0,
  avg_duration_ms int NOT NULL DEFAULT 0,
  p95_duration_ms int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (day, handler)
);
GRANT SELECT ON public.automation_metrics_daily TO authenticated;
GRANT ALL ON public.automation_metrics_daily TO service_role;
ALTER TABLE public.automation_metrics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin reads metrics" ON public.automation_metrics_daily
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'::app_role));

-- Reuse existing timestamp trigger fn
CREATE TRIGGER trg_auto_handlers_updated BEFORE UPDATE ON public.automation_handlers
  FOR EACH ROW EXECUTE FUNCTION public.automation_touch_updated_at();
CREATE TRIGGER trg_auto_jobs_updated BEFORE UPDATE ON public.automation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.automation_touch_updated_at();
CREATE TRIGGER trg_auto_triggers_updated BEFORE UPDATE ON public.automation_triggers
  FOR EACH ROW EXECUTE FUNCTION public.automation_touch_updated_at();
CREATE TRIGGER trg_auto_approvals_updated BEFORE UPDATE ON public.automation_approvals
  FOR EACH ROW EXECUTE FUNCTION public.automation_touch_updated_at();
CREATE TRIGGER trg_auto_notifs_updated BEFORE UPDATE ON public.automation_notifications
  FOR EACH ROW EXECUTE FUNCTION public.automation_touch_updated_at();
CREATE TRIGGER trg_auto_metrics_updated BEFORE UPDATE ON public.automation_metrics_daily
  FOR EACH ROW EXECUTE FUNCTION public.automation_touch_updated_at();

-- Atomic claim function for the priority queue.
CREATE OR REPLACE FUNCTION public.automation_claim_jobs(
  _worker_id text,
  _limit int DEFAULT 10,
  _lock_seconds int DEFAULT 120
) RETURNS SETOF public.automation_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.automation_jobs j
     SET status = 'running',
         locked_at = now(),
         locked_by = _worker_id,
         started_at = coalesce(j.started_at, now()),
         attempts = j.attempts + 1
   WHERE j.id IN (
     SELECT id FROM public.automation_jobs
      WHERE status = 'queued' AND run_at <= now()
      ORDER BY priority DESC, run_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT _limit
   )
  RETURNING *;
END $$;
REVOKE ALL ON FUNCTION public.automation_claim_jobs(text,int,int) FROM public;
GRANT EXECUTE ON FUNCTION public.automation_claim_jobs(text,int,int) TO service_role;

-- Requeue stuck 'running' jobs whose lock expired.
CREATE OR REPLACE FUNCTION public.automation_requeue_stuck(_lock_ttl_seconds int DEFAULT 300)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n int;
BEGIN
  UPDATE public.automation_jobs
     SET status = 'queued', locked_at = null, locked_by = null,
         run_at = now() + interval '5 seconds'
   WHERE status = 'running'
     AND locked_at IS NOT NULL
     AND locked_at < now() - make_interval(secs => _lock_ttl_seconds)
     AND attempts < max_attempts;
  GET DIAGNOSTICS n = ROW_COUNT;

  -- Move truly stuck ones past max_attempts to dead_letter
  UPDATE public.automation_jobs
     SET status = 'dead_letter', completed_at = now()
   WHERE status = 'running'
     AND locked_at < now() - make_interval(secs => _lock_ttl_seconds)
     AND attempts >= max_attempts;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.automation_requeue_stuck(int) FROM public;
GRANT EXECUTE ON FUNCTION public.automation_requeue_stuck(int) TO service_role;

-- Seed the built-in handler registry (16 workflow families).
INSERT INTO public.automation_handlers (code, category, description, requires_approval, default_priority, default_max_attempts) VALUES
  ('marketing.run_campaign', 'marketing', 'Generate + schedule a multi-channel marketing campaign', true, 120, 3),
  ('sales.nurture_lead', 'sales', 'Auto-nurture a lead across email/whatsapp', false, 140, 5),
  ('student.success_checkin', 'student_success', 'Detect at-risk students and trigger interventions', false, 110, 3),
  ('content.generate_blog', 'content', 'Draft, SEO-optimize and queue a blog post', true, 100, 3),
  ('seo.audit_site', 'seo', 'Crawl + score + emit fix tasks', false, 80, 3),
  ('course.publish', 'course', 'Validate + publish a course draft', true, 130, 3),
  ('email.send_campaign', 'email', 'Deliver an email campaign via Resend', true, 150, 5),
  ('social.post_scheduled', 'social', 'Publish a scheduled social post', false, 130, 5),
  ('lead.nurture_sequence', 'lead', 'Advance a lead through a nurture sequence', false, 140, 5),
  ('partner.onboarding', 'onboarding', 'Guided partner onboarding pipeline', false, 120, 5),
  ('student.onboarding', 'onboarding', 'Guided student onboarding pipeline', false, 120, 5),
  ('certificate.issue', 'certificate', 'Generate + email a course completion certificate', false, 160, 5),
  ('reports.build_daily', 'reports', 'Assemble the daily operations report', false, 90, 3),
  ('analytics.rollup_daily', 'analytics', 'Compute daily analytics rollups', false, 90, 3),
  ('scheduler.dispatch_due', 'scheduler', 'Fire triggers whose cron/one-shot is due', false, 200, 3),
  ('notify.dispatch_pending', 'notifications', 'Deliver pending notifications', false, 180, 5)
ON CONFLICT (code) DO NOTHING;

-- Seed system triggers: scheduler dispatcher (every minute) + daily reports/analytics + hourly notifier
INSERT INTO public.automation_triggers (name, handler, kind, cron_expression, next_run_at, priority, is_enabled) VALUES
  ('sys.scheduler.dispatch',   'scheduler.dispatch_due', 'cron', '* * * * *',   now(), 200, true),
  ('sys.notify.dispatch',      'notify.dispatch_pending','cron', '*/5 * * * *', now(), 180, true),
  ('sys.reports.daily',        'reports.build_daily',    'cron', '0 6 * * *',   now() + interval '1 minute', 90, true),
  ('sys.analytics.rollup',     'analytics.rollup_daily', 'cron', '30 0 * * *',  now() + interval '1 minute', 90, true),
  ('sys.student.success',      'student.success_checkin','cron', '0 */6 * * *', now() + interval '1 minute', 110, true),
  ('sys.seo.audit',            'seo.audit_site',         'cron', '0 4 * * *',   now() + interval '1 minute', 80, true)
ON CONFLICT DO NOTHING;
