
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  cc TEXT[],
  bcc TEXT[],
  from_email TEXT NOT NULL,
  from_name TEXT,
  reply_to TEXT,
  subject TEXT NOT NULL,
  html TEXT,
  text TEXT,
  template_key TEXT,
  variables JSONB,
  attachments JSONB,
  tags JSONB,
  headers JSONB,
  status TEXT NOT NULL DEFAULT 'queued',
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  error_code TEXT,
  error_message TEXT,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  scheduled_for TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  brand_id UUID,
  user_id UUID,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_logs_status_idx ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS email_logs_scheduled_idx ON public.email_logs(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS email_logs_next_attempt_idx ON public.email_logs(next_attempt_at) WHERE status = 'retry';
CREATE INDEX IF NOT EXISTS email_logs_created_idx ON public.email_logs(created_at DESC);

GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins read all email logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users read own email logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_email_logs_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_email_logs_updated_at ON public.email_logs;
CREATE TRIGGER trg_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_email_logs_updated_at();
