
-- Developer Platform tables
CREATE TABLE IF NOT EXISTS public.dev_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  created_by uuid NOT NULL,
  name text NOT NULL,
  environment text NOT NULL DEFAULT 'development' CHECK (environment IN ('development','production')),
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  ip_allowlist text[] NOT NULL DEFAULT '{}',
  rate_limit_per_min integer NOT NULL DEFAULT 60,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_api_keys TO authenticated;
GRANT ALL ON public.dev_api_keys TO service_role;
ALTER TABLE public.dev_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_api_keys owner manage" ON public.dev_api_keys FOR ALL TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.dev_api_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  api_key_id uuid REFERENCES public.dev_api_keys(id) ON DELETE SET NULL,
  user_id uuid,
  endpoint text NOT NULL,
  method text NOT NULL,
  status integer NOT NULL,
  latency_ms integer NOT NULL DEFAULT 0,
  response_size integer NOT NULL DEFAULT 0,
  tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(10,4) NOT NULL DEFAULT 0,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.dev_api_requests TO authenticated;
GRANT ALL ON public.dev_api_requests TO service_role;
ALTER TABLE public.dev_api_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_api_requests user read" ON public.dev_api_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.dev_oauth_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  created_by uuid NOT NULL,
  name text NOT NULL,
  description text,
  homepage_url text,
  redirect_uris text[] NOT NULL DEFAULT '{}',
  scopes text[] NOT NULL DEFAULT '{}',
  client_id text NOT NULL UNIQUE,
  client_secret_hash text NOT NULL,
  app_type text NOT NULL DEFAULT 'public' CHECK (app_type IN ('public','private','internal')),
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_oauth_apps TO authenticated;
GRANT ALL ON public.dev_oauth_apps TO service_role;
ALTER TABLE public.dev_oauth_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_oauth_apps owner manage" ON public.dev_oauth_apps FOR ALL TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.dev_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  created_by uuid NOT NULL,
  url text NOT NULL,
  description text,
  events text[] NOT NULL DEFAULT '{}',
  secret text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_webhooks TO authenticated;
GRANT ALL ON public.dev_webhooks TO service_role;
ALTER TABLE public.dev_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_webhooks owner manage" ON public.dev_webhooks FOR ALL TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.dev_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.dev_webhooks(id) ON DELETE CASCADE,
  event text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  http_status integer,
  latency_ms integer,
  attempts integer NOT NULL DEFAULT 0,
  payload jsonb,
  response text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.dev_webhook_deliveries TO authenticated;
GRANT ALL ON public.dev_webhook_deliveries TO service_role;
ALTER TABLE public.dev_webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_webhook_deliveries owner read" ON public.dev_webhook_deliveries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dev_webhooks w WHERE w.id = webhook_id AND w.created_by = auth.uid()));

CREATE TABLE IF NOT EXISTS public.dev_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  created_by uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category text,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private','internal','marketplace')),
  icon_url text,
  downloads integer NOT NULL DEFAULT 0,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_apps TO authenticated;
GRANT ALL ON public.dev_apps TO service_role;
ALTER TABLE public.dev_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_apps owner manage" ON public.dev_apps FOR ALL TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "dev_apps public read" ON public.dev_apps FOR SELECT TO authenticated
  USING (visibility IN ('public','marketplace'));

CREATE INDEX IF NOT EXISTS dev_api_keys_workspace_idx ON public.dev_api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS dev_api_requests_workspace_idx ON public.dev_api_requests(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dev_webhooks_workspace_idx ON public.dev_webhooks(workspace_id);
