DROP POLICY IF EXISTS "authenticated read active rules" ON public.revenue_share_rules;
CREATE POLICY "admins read active rules"
  ON public.revenue_share_rules
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));