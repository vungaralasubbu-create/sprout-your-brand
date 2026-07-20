
-- Roles enum for agency members
DO $$ BEGIN
  CREATE TYPE public.agency_member_role AS ENUM ('owner','admin','manager','support','sales','developer','finance','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.agency_plan AS ENUM ('starter','growth','professional','enterprise','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.agency_client_status AS ENUM ('active','trial','suspended','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- agencies
-- =========================================================
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan public.agency_plan NOT NULL DEFAULT 'starter',
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#06B6D4',
  secondary_color TEXT DEFAULT '#3B82F6',
  accent_color TEXT DEFAULT '#84CC16',
  typography TEXT DEFAULT 'Inter',
  button_style TEXT DEFAULT 'rounded',
  border_radius TEXT DEFAULT 'md',
  support_email TEXT,
  notification_email TEXT,
  sender_name TEXT,
  email_footer TEXT,
  smtp_provider TEXT DEFAULT 'resend',
  billing_mode TEXT DEFAULT 'agency_pays',
  invoice_frequency TEXT DEFAULT 'monthly',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agencies TO authenticated;
GRANT ALL ON public.agencies TO service_role;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- agency_members
-- =========================================================
CREATE TABLE IF NOT EXISTS public.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.agency_member_role NOT NULL DEFAULT 'viewer',
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agency_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_members TO authenticated;
GRANT ALL ON public.agency_members TO service_role;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

-- Security definer helper
CREATE OR REPLACE FUNCTION public.is_agency_member(_agency_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id = _agency_id AND user_id = _user_id AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.agencies WHERE id = _agency_id AND owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.agency_member_role(_agency_id UUID, _user_id UUID)
RETURNS public.agency_member_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.agencies WHERE id = _agency_id AND owner_id = _user_id)
      THEN 'owner'::public.agency_member_role
    ELSE (SELECT role FROM public.agency_members WHERE agency_id = _agency_id AND user_id = _user_id LIMIT 1)
  END;
$$;

-- =========================================================
-- agency_clients (each links to an mc_workspace)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.agency_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.mc_workspaces(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  workspace_name TEXT,
  industry TEXT,
  website TEXT,
  owner_name TEXT,
  owner_email TEXT,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.agency_client_status NOT NULL DEFAULT 'active',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_clients TO authenticated;
GRANT ALL ON public.agency_clients TO service_role;
ALTER TABLE public.agency_clients ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- client_branding
-- =========================================================
CREATE TABLE IF NOT EXISTS public.client_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.agency_clients(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#06B6D4',
  secondary_color TEXT DEFAULT '#3B82F6',
  accent_color TEXT DEFAULT '#84CC16',
  typography TEXT DEFAULT 'Inter',
  button_style TEXT DEFAULT 'rounded',
  border_radius TEXT DEFAULT 'md',
  loading_screen JSONB DEFAULT '{}'::jsonb,
  email_header JSONB DEFAULT '{}'::jsonb,
  dashboard_theme TEXT DEFAULT 'light',
  login_screen JSONB DEFAULT '{}'::jsonb,
  welcome_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_branding TO authenticated;
GRANT ALL ON public.client_branding TO service_role;
ALTER TABLE public.client_branding ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- client_domains
-- =========================================================
CREATE TABLE IF NOT EXISTS public.client_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.agency_clients(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verification_token TEXT,
  ssl_status TEXT NOT NULL DEFAULT 'pending',
  dns_records JSONB DEFAULT '[]'::jsonb,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_domains TO authenticated;
GRANT ALL ON public.client_domains TO service_role;
ALTER TABLE public.client_domains ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- client_subscriptions
-- =========================================================
CREATE TABLE IF NOT EXISTS public.client_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.agency_clients(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL DEFAULT 'monthly',
  ai_credits INTEGER NOT NULL DEFAULT 0,
  storage_gb INTEGER NOT NULL DEFAULT 0,
  users_limit INTEGER NOT NULL DEFAULT 5,
  projects_limit INTEGER NOT NULL DEFAULT 10,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_template BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_subscriptions TO authenticated;
GRANT ALL ON public.client_subscriptions TO service_role;
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- client_settings
-- =========================================================
CREATE TABLE IF NOT EXISTS public.client_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.agency_clients(id) ON DELETE CASCADE UNIQUE,
  support_email TEXT,
  notification_email TEXT,
  sender_name TEXT,
  smtp_provider TEXT DEFAULT 'resend',
  email_footer TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  locale TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_settings TO authenticated;
GRANT ALL ON public.client_settings TO service_role;
ALTER TABLE public.client_settings ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- client_ai_profiles
-- =========================================================
CREATE TABLE IF NOT EXISTS public.client_ai_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.agency_clients(id) ON DELETE CASCADE UNIQUE,
  ai_name TEXT DEFAULT 'Assistant',
  personality TEXT,
  tone TEXT,
  instructions TEXT,
  brand_voice TEXT,
  prompt_rules JSONB DEFAULT '[]'::jsonb,
  restricted_topics JSONB DEFAULT '[]'::jsonb,
  preferred_models JSONB DEFAULT '[]'::jsonb,
  knowledge_scope JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_ai_profiles TO authenticated;
GRANT ALL ON public.client_ai_profiles TO service_role;
ALTER TABLE public.client_ai_profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- client_templates
-- =========================================================
CREATE TABLE IF NOT EXISTS public.client_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.agency_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  scope TEXT NOT NULL DEFAULT 'agency',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_templates TO authenticated;
GRANT ALL ON public.client_templates TO service_role;
ALTER TABLE public.client_templates ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- client_usage (rollup metrics)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.client_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.agency_clients(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  projects_count INTEGER NOT NULL DEFAULT 0,
  ai_credits_used INTEGER NOT NULL DEFAULT 0,
  storage_mb INTEGER NOT NULL DEFAULT 0,
  users_count INTEGER NOT NULL DEFAULT 0,
  campaigns_count INTEGER NOT NULL DEFAULT 0,
  leads_count INTEGER NOT NULL DEFAULT 0,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, period_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_usage TO authenticated;
GRANT ALL ON public.client_usage TO service_role;
ALTER TABLE public.client_usage ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- impersonation_logs
-- =========================================================
CREATE TABLE IF NOT EXISTS public.impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.agency_clients(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE ON public.impersonation_logs TO authenticated;
GRANT ALL ON public.impersonation_logs TO service_role;
ALTER TABLE public.impersonation_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- Policies
-- =========================================================
CREATE POLICY "Agencies visible to owner or members"
  ON public.agencies FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_agency_member(id, auth.uid()));
CREATE POLICY "Agencies insertable by owner"
  ON public.agencies FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Agencies updatable by owner"
  ON public.agencies FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Agencies deletable by owner"
  ON public.agencies FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Agency members visible to members"
  ON public.agency_members FOR ALL TO authenticated
  USING (public.is_agency_member(agency_id, auth.uid()))
  WITH CHECK (public.is_agency_member(agency_id, auth.uid()));

CREATE POLICY "Agency clients manageable by members"
  ON public.agency_clients FOR ALL TO authenticated
  USING (public.is_agency_member(agency_id, auth.uid()) OR owner_user_id = auth.uid())
  WITH CHECK (public.is_agency_member(agency_id, auth.uid()));

CREATE POLICY "Client branding visible to agency & owner"
  ON public.client_branding FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agency_clients c WHERE c.id = client_id AND (public.is_agency_member(c.agency_id, auth.uid()) OR c.owner_user_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agency_clients c WHERE c.id = client_id AND public.is_agency_member(c.agency_id, auth.uid())));

CREATE POLICY "Client domains manageable by agency"
  ON public.client_domains FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agency_clients c WHERE c.id = client_id AND public.is_agency_member(c.agency_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agency_clients c WHERE c.id = client_id AND public.is_agency_member(c.agency_id, auth.uid())));

CREATE POLICY "Client subscriptions manageable by agency"
  ON public.client_subscriptions FOR ALL TO authenticated
  USING (public.is_agency_member(agency_id, auth.uid()))
  WITH CHECK (public.is_agency_member(agency_id, auth.uid()));

CREATE POLICY "Client settings visible to agency & owner"
  ON public.client_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agency_clients c WHERE c.id = client_id AND (public.is_agency_member(c.agency_id, auth.uid()) OR c.owner_user_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agency_clients c WHERE c.id = client_id AND public.is_agency_member(c.agency_id, auth.uid())));

CREATE POLICY "Client AI profiles visible to agency & owner"
  ON public.client_ai_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agency_clients c WHERE c.id = client_id AND (public.is_agency_member(c.agency_id, auth.uid()) OR c.owner_user_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agency_clients c WHERE c.id = client_id AND public.is_agency_member(c.agency_id, auth.uid())));

CREATE POLICY "Client templates manageable by agency"
  ON public.client_templates FOR ALL TO authenticated
  USING (public.is_agency_member(agency_id, auth.uid()))
  WITH CHECK (public.is_agency_member(agency_id, auth.uid()));

CREATE POLICY "Client usage visible to agency & owner"
  ON public.client_usage FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agency_clients c WHERE c.id = client_id AND (public.is_agency_member(c.agency_id, auth.uid()) OR c.owner_user_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agency_clients c WHERE c.id = client_id AND public.is_agency_member(c.agency_id, auth.uid())));

CREATE POLICY "Impersonation logs visible to owner/admin"
  ON public.impersonation_logs FOR SELECT TO authenticated
  USING (public.agency_member_role(agency_id, auth.uid()) IN ('owner','admin'));
CREATE POLICY "Impersonation logs insertable by members"
  ON public.impersonation_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_agency_member(agency_id, auth.uid()) AND actor_user_id = auth.uid());
CREATE POLICY "Impersonation logs updatable by actor"
  ON public.impersonation_logs FOR UPDATE TO authenticated
  USING (actor_user_id = auth.uid()) WITH CHECK (actor_user_id = auth.uid());

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.wl_update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

DO $$ BEGIN
  CREATE TRIGGER trg_agencies_updated BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION public.wl_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_agency_members_updated BEFORE UPDATE ON public.agency_members FOR EACH ROW EXECUTE FUNCTION public.wl_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_agency_clients_updated BEFORE UPDATE ON public.agency_clients FOR EACH ROW EXECUTE FUNCTION public.wl_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_client_branding_updated BEFORE UPDATE ON public.client_branding FOR EACH ROW EXECUTE FUNCTION public.wl_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_client_domains_updated BEFORE UPDATE ON public.client_domains FOR EACH ROW EXECUTE FUNCTION public.wl_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_client_subscriptions_updated BEFORE UPDATE ON public.client_subscriptions FOR EACH ROW EXECUTE FUNCTION public.wl_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_client_settings_updated BEFORE UPDATE ON public.client_settings FOR EACH ROW EXECUTE FUNCTION public.wl_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_client_ai_profiles_updated BEFORE UPDATE ON public.client_ai_profiles FOR EACH ROW EXECUTE FUNCTION public.wl_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_client_templates_updated BEFORE UPDATE ON public.client_templates FOR EACH ROW EXECUTE FUNCTION public.wl_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON public.agency_members(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_user ON public.agency_members(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_clients_agency ON public.agency_clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_clients_status ON public.agency_clients(status);
CREATE INDEX IF NOT EXISTS idx_client_domains_client ON public.client_domains(client_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_client ON public.client_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_usage_client_period ON public.client_usage(client_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_agency ON public.impersonation_logs(agency_id, started_at DESC);
