-- Integration Hub tables (namespaced intg_* to avoid collisions)

CREATE TABLE IF NOT EXISTS public.intg_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  provider text NOT NULL,
  category text NOT NULL,
  display_name text,
  external_account text,
  status text NOT NULL DEFAULT 'connected',
  health text NOT NULL DEFAULT 'healthy',
  scopes text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  sync_frequency text NOT NULL DEFAULT 'manual',
  last_synced_at timestamptz,
  connected_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, provider, external_account)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intg_accounts TO authenticated;
GRANT ALL ON public.intg_accounts TO service_role;
ALTER TABLE public.intg_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intg_accounts wsp members"
  ON public.intg_accounts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m
    WHERE m.workspace_id = intg_accounts.workspace_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m
    WHERE m.workspace_id = intg_accounts.workspace_id AND m.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.intg_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  account_id uuid REFERENCES public.intg_accounts(id) ON DELETE CASCADE,
  provider text NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'info',
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS intg_logs_ws_idx ON public.intg_logs (workspace_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intg_logs TO authenticated;
GRANT ALL ON public.intg_logs TO service_role;
ALTER TABLE public.intg_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intg_logs wsp members"
  ON public.intg_logs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m
    WHERE m.workspace_id = intg_logs.workspace_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m
    WHERE m.workspace_id = intg_logs.workspace_id AND m.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.intg_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  account_id uuid REFERENCES public.intg_accounts(id) ON DELETE CASCADE,
  provider text NOT NULL,
  direction text NOT NULL DEFAULT 'incoming',
  endpoint text,
  event text,
  status text NOT NULL DEFAULT 'active',
  last_delivery_at timestamptz,
  failure_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intg_webhooks TO authenticated;
GRANT ALL ON public.intg_webhooks TO service_role;
ALTER TABLE public.intg_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intg_webhooks wsp members"
  ON public.intg_webhooks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m
    WHERE m.workspace_id = intg_webhooks.workspace_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m
    WHERE m.workspace_id = intg_webhooks.workspace_id AND m.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.intg_api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  name text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  token_prefix text NOT NULL,
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intg_api_tokens TO authenticated;
GRANT ALL ON public.intg_api_tokens TO service_role;
ALTER TABLE public.intg_api_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intg_api_tokens wsp members"
  ON public.intg_api_tokens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m
    WHERE m.workspace_id = intg_api_tokens.workspace_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m
    WHERE m.workspace_id = intg_api_tokens.workspace_id AND m.user_id = auth.uid()));