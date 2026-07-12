
-- Partner program selling eligibility (separate from interests)
CREATE TABLE IF NOT EXISTS public.partner_program_eligibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'eligible' CHECK (status IN ('eligible','restricted','suspended','pending_review')),
  assigned_by UUID REFERENCES auth.users(id),
  reason TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, course_id)
);
GRANT SELECT ON public.partner_program_eligibility TO authenticated;
GRANT ALL ON public.partner_program_eligibility TO service_role;
ALTER TABLE public.partner_program_eligibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner reads own eligibility"
  ON public.partner_program_eligibility FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_program_eligibility.partner_id AND p.user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Admin manages eligibility"
  ON public.partner_program_eligibility FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_ppe_updated_at BEFORE UPDATE ON public.partner_program_eligibility
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Partner application status history
CREATE TABLE IF NOT EXISTS public.partner_application_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.partner_applications(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_application_status_history TO authenticated;
GRANT ALL ON public.partner_application_status_history TO service_role;
ALTER TABLE public.partner_application_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads app history" ON public.partner_application_status_history
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin writes app history" ON public.partner_application_status_history
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- Partner sales model approval history
CREATE TABLE IF NOT EXISTS public.partner_model_approval_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  selected_model TEXT,
  approved_model TEXT,
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_model_approval_history TO authenticated;
GRANT ALL ON public.partner_model_approval_history TO service_role;
ALTER TABLE public.partner_model_approval_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partner reads own model history" ON public.partner_model_approval_history
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_model_approval_history.partner_id AND p.user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Admin writes model history" ON public.partner_model_approval_history
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- Admin activity log (generic append-only feed for the admin dashboard)
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id UUID REFERENCES auth.users(id),
  actor_label TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_activity_log TO authenticated;
GRANT ALL ON public.admin_activity_log TO service_role;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads activity" ON public.admin_activity_log
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin writes activity" ON public.admin_activity_log
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON public.admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ppe_partner ON public.partner_program_eligibility(partner_id);
CREATE INDEX IF NOT EXISTS idx_ppe_course ON public.partner_program_eligibility(course_id);
CREATE INDEX IF NOT EXISTS idx_pash_app ON public.partner_application_status_history(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pmah_partner ON public.partner_model_approval_history(partner_id, created_at DESC);
