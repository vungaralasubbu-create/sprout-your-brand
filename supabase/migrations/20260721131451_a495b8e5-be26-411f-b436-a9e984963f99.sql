
-- payment-screenshots (private): owner-scoped by first folder = auth.uid()
CREATE POLICY "payment_shots_owner_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "payment_shots_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "payment_shots_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND ((storage.foldername(name))[1] = auth.uid()::text
         OR public.has_role(auth.uid(), 'admin'))
  );

-- payment-config (private, admin-write, authenticated-read)
CREATE POLICY "payment_config_read_authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-config');

CREATE POLICY "payment_config_admin_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-config' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "payment_config_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-config' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "payment_config_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-config' AND public.has_role(auth.uid(), 'admin'));
