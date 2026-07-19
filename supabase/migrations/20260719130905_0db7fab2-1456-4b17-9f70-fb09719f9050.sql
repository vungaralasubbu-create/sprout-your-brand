
-- =========================================================
-- AI Marketing Automation Engine
-- =========================================================

-- automation_events: unified behavior stream
CREATE TABLE public.automation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID,
  event_name TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  session_id TEXT,
  device TEXT,
  location TEXT,
  utm JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_automation_events_user ON public.automation_events (user_id, occurred_at DESC);
CREATE INDEX idx_automation_events_brand ON public.automation_events (brand_id, occurred_at DESC);
CREATE INDEX idx_automation_events_name ON public.automation_events (event_name, occurred_at DESC);
GRANT SELECT, INSERT ON public.automation_events TO authenticated;
GRANT ALL ON public.automation_events TO service_role;
ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own events" ON public.automation_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own events" ON public.automation_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admin read all events" ON public.automation_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- automation_user_profiles
CREATE TABLE public.automation_user_profiles (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID,
  last_active_at TIMESTAMP WITH TIME ZONE,
  total_course_views INTEGER NOT NULL DEFAULT 0,
  total_page_views INTEGER NOT NULL DEFAULT 0,
  total_logins INTEGER NOT NULL DEFAULT 0,
  top_interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  lead_source TEXT,
  referral_source TEXT,
  lifetime_revenue NUMERIC NOT NULL DEFAULT 0,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  ai_segment_labels TEXT[] NOT NULL DEFAULT '{}',
  next_best_action JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT ON public.automation_user_profiles TO authenticated;
GRANT ALL ON public.automation_user_profiles TO service_role;
ALTER TABLE public.automation_user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.automation_user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admin read all profiles" ON public.automation_user_profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- automation_workflows
CREATE TABLE public.automation_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  trigger JSONB NOT NULL DEFAULT '{}'::jsonb,
  graph JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  goal JSONB,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_workflows TO authenticated;
GRANT ALL ON public.automation_workflows TO service_role;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages workflows" ON public.automation_workflows
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Owners manage their workflows" ON public.automation_workflows
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- automation_workflow_runs
CREATE TABLE public.automation_workflow_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.automation_workflows(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID,
  current_node_id TEXT,
  wait_until TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_workflow_runs_wait ON public.automation_workflow_runs (wait_until) WHERE status = 'running';
CREATE INDEX idx_workflow_runs_user ON public.automation_workflow_runs (user_id);
GRANT SELECT ON public.automation_workflow_runs TO authenticated;
GRANT ALL ON public.automation_workflow_runs TO service_role;
ALTER TABLE public.automation_workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own workflow runs" ON public.automation_workflow_runs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admin reads all workflow runs" ON public.automation_workflow_runs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- automation_recommendations
CREATE TABLE public.automation_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID,
  kind TEXT NOT NULL,
  target_id UUID,
  target_slug TEXT,
  title TEXT NOT NULL,
  reason TEXT,
  score NUMERIC NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_recs_user ON public.automation_recommendations (user_id, score DESC);
GRANT SELECT, UPDATE ON public.automation_recommendations TO authenticated;
GRANT ALL ON public.automation_recommendations TO service_role;
ALTER TABLE public.automation_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own recs" ON public.automation_recommendations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users dismiss own recs" ON public.automation_recommendations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admin reads all recs" ON public.automation_recommendations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- automation_channel_messages
CREATE TABLE public.automation_channel_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  brand_id UUID,
  workflow_run_id UUID REFERENCES public.automation_workflow_runs(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  provider TEXT,
  provider_message_id TEXT,
  error TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_channel_msg_user ON public.automation_channel_messages (user_id, created_at DESC);
GRANT SELECT ON public.automation_channel_messages TO authenticated;
GRANT ALL ON public.automation_channel_messages TO service_role;
ALTER TABLE public.automation_channel_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own channel messages" ON public.automation_channel_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admin reads all channel messages" ON public.automation_channel_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- automation_attribution
CREATE TABLE public.automation_attribution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  brand_id UUID,
  workflow_id UUID REFERENCES public.automation_workflows(id) ON DELETE SET NULL,
  workflow_run_id UUID REFERENCES public.automation_workflow_runs(id) ON DELETE SET NULL,
  campaign_id UUID,
  event_id UUID REFERENCES public.automation_events(id) ON DELETE SET NULL,
  revenue NUMERIC NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_attr_workflow ON public.automation_attribution (workflow_id);
GRANT SELECT ON public.automation_attribution TO authenticated;
GRANT ALL ON public.automation_attribution TO service_role;
ALTER TABLE public.automation_attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin reads attribution" ON public.automation_attribution
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- Update trigger
CREATE OR REPLACE FUNCTION public.automation_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_workflows_updated BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW EXECUTE FUNCTION public.automation_touch_updated_at();
CREATE TRIGGER trg_workflow_runs_updated BEFORE UPDATE ON public.automation_workflow_runs
  FOR EACH ROW EXECUTE FUNCTION public.automation_touch_updated_at();
CREATE TRIGGER trg_user_profiles_updated BEFORE UPDATE ON public.automation_user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.automation_touch_updated_at();
