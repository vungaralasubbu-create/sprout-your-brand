
-- Restrict partner-role RLS to their assigned leads only

DROP POLICY IF EXISTS admins_manage_leads ON public.ai_sales_leads;

CREATE POLICY admins_manage_leads_admin ON public.ai_sales_leads
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY partners_manage_assigned_leads ON public.ai_sales_leads
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'partner'::app_role) AND assigned_partner_id = public.partner_id_for(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'partner'::app_role) AND assigned_partner_id = public.partner_id_for(auth.uid()));

DROP POLICY IF EXISTS admins_manage_followups ON public.ai_sales_followups;

CREATE POLICY admins_manage_followups_admin ON public.ai_sales_followups
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY partners_manage_assigned_followups ON public.ai_sales_followups
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'partner'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.ai_sales_leads l
    WHERE l.id = ai_sales_followups.lead_id
      AND l.assigned_partner_id = public.partner_id_for(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'partner'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.ai_sales_leads l
    WHERE l.id = ai_sales_followups.lead_id
      AND l.assigned_partner_id = public.partner_id_for(auth.uid())
  )
);
