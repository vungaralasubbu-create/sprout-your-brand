
CREATE TABLE IF NOT EXISTS public.counsellor_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.platform_leads(id) ON DELETE CASCADE,
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lead_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counsellor_ai_analyses TO authenticated;
GRANT ALL ON public.counsellor_ai_analyses TO service_role;
ALTER TABLE public.counsellor_ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.counsellor_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.platform_leads(id) ON DELETE CASCADE,
  counsellor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'call',
  raw_notes TEXT,
  ai_summary TEXT,
  ai_tasks JSONB DEFAULT '[]'::jsonb,
  duration_seconds INTEGER,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counsellor_call_logs TO authenticated;
GRANT ALL ON public.counsellor_call_logs TO service_role;
ALTER TABLE public.counsellor_call_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.counsellor_generated_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.platform_leads(id) ON DELETE CASCADE,
  counsellor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counsellor_generated_messages TO authenticated;
GRANT ALL ON public.counsellor_generated_messages TO service_role;
ALTER TABLE public.counsellor_generated_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.counsellor_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.platform_leads(id) ON DELETE CASCADE,
  counsellor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  source TEXT DEFAULT 'ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counsellor_tasks TO authenticated;
GRANT ALL ON public.counsellor_tasks TO service_role;
ALTER TABLE public.counsellor_tasks ENABLE ROW LEVEL SECURITY;

-- Analyses policies
CREATE POLICY "Copilot users read analyses"
  ON public.counsellor_ai_analyses FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'counsellor')
    OR public.has_role(auth.uid(), 'brand_owner')
  );
CREATE POLICY "Copilot users write analyses"
  ON public.counsellor_ai_analyses FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'counsellor')
    OR public.has_role(auth.uid(), 'brand_owner')
  );
CREATE POLICY "Copilot users update analyses"
  ON public.counsellor_ai_analyses FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'counsellor')
    OR public.has_role(auth.uid(), 'brand_owner')
  );

-- Call logs policies
CREATE POLICY "Copilot users read call logs"
  ON public.counsellor_call_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'brand_owner')
    OR (public.has_role(auth.uid(), 'counsellor') AND counsellor_id = auth.uid())
  );
CREATE POLICY "Counsellors insert call logs"
  ON public.counsellor_call_logs FOR INSERT TO authenticated
  WITH CHECK (
    counsellor_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'counsellor')
      OR public.has_role(auth.uid(), 'brand_owner')
    )
  );
CREATE POLICY "Counsellors update call logs"
  ON public.counsellor_call_logs FOR UPDATE TO authenticated
  USING (
    counsellor_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Generated messages policies
CREATE POLICY "Copilot users read messages"
  ON public.counsellor_generated_messages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'brand_owner')
    OR (public.has_role(auth.uid(), 'counsellor') AND counsellor_id = auth.uid())
  );
CREATE POLICY "Counsellors insert messages"
  ON public.counsellor_generated_messages FOR INSERT TO authenticated
  WITH CHECK (
    counsellor_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'counsellor')
      OR public.has_role(auth.uid(), 'brand_owner')
    )
  );
CREATE POLICY "Counsellors update messages"
  ON public.counsellor_generated_messages FOR UPDATE TO authenticated
  USING (
    counsellor_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Tasks policies
CREATE POLICY "Copilot users read tasks"
  ON public.counsellor_tasks FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'brand_owner')
    OR (public.has_role(auth.uid(), 'counsellor') AND counsellor_id = auth.uid())
  );
CREATE POLICY "Counsellors insert tasks"
  ON public.counsellor_tasks FOR INSERT TO authenticated
  WITH CHECK (
    counsellor_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'counsellor')
      OR public.has_role(auth.uid(), 'brand_owner')
    )
  );
CREATE POLICY "Counsellors update tasks"
  ON public.counsellor_tasks FOR UPDATE TO authenticated
  USING (
    counsellor_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE OR REPLACE FUNCTION public.is_copilot_user(_uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role IN ('super_admin','admin','counsellor','brand_owner')
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_copilot_user(UUID) TO authenticated;
