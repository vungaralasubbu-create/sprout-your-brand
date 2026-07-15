
CREATE POLICY "career-resumes public upload"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'career-resumes');

CREATE POLICY "career-resumes admin read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'career-resumes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "career-resumes admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'career-resumes' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'career-resumes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "career-resumes admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'career-resumes' AND public.has_role(auth.uid(), 'admin'));
