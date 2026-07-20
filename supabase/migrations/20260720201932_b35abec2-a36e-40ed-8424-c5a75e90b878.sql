
-- workspaces
CREATE TABLE public.mc_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text UNIQUE,
  business_name text,
  industry text,
  website text,
  country text,
  timezone text,
  language text,
  logo_url text,
  brand_colors jsonb NOT NULL DEFAULT '{}'::jsonb,
  brand_fonts jsonb NOT NULL DEFAULT '{}'::jsonb,
  brand_voice text,
  onboarding_complete boolean NOT NULL DEFAULT false,
  plan text NOT NULL DEFAULT 'free',
  plan_period text NOT NULL DEFAULT 'monthly',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mc_workspaces TO authenticated;
GRANT ALL ON public.mc_workspaces TO service_role;

ALTER TABLE public.mc_workspaces ENABLE ROW LEVEL SECURITY;

-- members
CREATE TABLE public.mc_workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner','admin','editor','viewer')),
  invited_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mc_workspace_members TO authenticated;
GRANT ALL ON public.mc_workspace_members TO service_role;

ALTER TABLE public.mc_workspace_members ENABLE ROW LEVEL SECURITY;

-- Membership check (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.mc_is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mc_workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.mc_workspaces
    WHERE id = _workspace_id AND owner_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.mc_workspace_role(_workspace_id uuid, _user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 'owner' FROM public.mc_workspaces WHERE id = _workspace_id AND owner_id = _user_id LIMIT 1),
    (SELECT role FROM public.mc_workspace_members WHERE workspace_id = _workspace_id AND user_id = _user_id LIMIT 1)
  )
$$;

-- Workspace policies
CREATE POLICY "mc_workspaces_owner_all" ON public.mc_workspaces
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "mc_workspaces_member_select" ON public.mc_workspaces
  FOR SELECT TO authenticated
  USING (public.mc_is_workspace_member(id, auth.uid()));

-- Members policies
CREATE POLICY "mc_members_self_select" ON public.mc_workspace_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.mc_is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "mc_members_owner_admin_manage" ON public.mc_workspace_members
  FOR ALL TO authenticated
  USING (public.mc_workspace_role(workspace_id, auth.uid()) IN ('owner','admin'))
  WITH CHECK (public.mc_workspace_role(workspace_id, auth.uid()) IN ('owner','admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.mc_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER mc_workspaces_updated_at
  BEFORE UPDATE ON public.mc_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.mc_touch_updated_at();

-- Auto-add owner as a member on workspace creation
CREATE OR REPLACE FUNCTION public.mc_add_owner_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.mc_workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER mc_workspaces_add_owner
  AFTER INSERT ON public.mc_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.mc_add_owner_as_member();

CREATE INDEX mc_workspaces_owner_idx ON public.mc_workspaces(owner_id);
CREATE INDEX mc_workspace_members_user_idx ON public.mc_workspace_members(user_id);
