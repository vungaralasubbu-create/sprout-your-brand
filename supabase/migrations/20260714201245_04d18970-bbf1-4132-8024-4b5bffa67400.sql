
CREATE POLICY "ca_docs_owner_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'campus-ambassador-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ca_docs_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'campus-ambassador-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ca_docs_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'campus-ambassador-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ca_docs_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'campus-ambassador-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ca_docs_admin_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'campus-ambassador-docs'
    AND public.has_admin_permission(auth.uid(),'campus_ambassador.review'));
