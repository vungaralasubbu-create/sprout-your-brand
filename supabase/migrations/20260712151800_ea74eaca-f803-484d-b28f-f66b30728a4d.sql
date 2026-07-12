
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "anyone can submit application" ON public.partner_applications;
CREATE POLICY "anyone can submit application" ON public.partner_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'submitted'
    AND length(full_name) BETWEEN 2 AND 120
    AND length(email) BETWEEN 5 AND 200
    AND length(mobile) BETWEEN 5 AND 30
    AND (user_id IS NULL OR user_id = auth.uid())
  );
