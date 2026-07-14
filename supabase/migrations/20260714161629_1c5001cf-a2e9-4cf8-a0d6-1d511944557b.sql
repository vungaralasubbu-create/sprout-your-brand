CREATE TABLE public.admin_partner_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_partner_notes TO authenticated;
GRANT ALL ON public.admin_partner_notes TO service_role;
ALTER TABLE public.admin_partner_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_partner_notes_admin_read" ON public.admin_partner_notes
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admin_partner_notes_admin_insert" ON public.admin_partner_notes
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) AND admin_user_id = auth.uid());
CREATE INDEX idx_admin_partner_notes_partner ON public.admin_partner_notes(partner_id, created_at DESC);