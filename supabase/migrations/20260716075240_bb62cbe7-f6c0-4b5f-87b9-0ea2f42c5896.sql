
CREATE POLICY "admins read content-media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'content-media' AND public.is_admin(auth.uid()));
CREATE POLICY "admins upload content-media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-media' AND public.is_admin(auth.uid()));
CREATE POLICY "admins update content-media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'content-media' AND public.is_admin(auth.uid())) WITH CHECK (bucket_id = 'content-media' AND public.is_admin(auth.uid()));
CREATE POLICY "admins delete content-media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'content-media' AND public.is_admin(auth.uid()));
