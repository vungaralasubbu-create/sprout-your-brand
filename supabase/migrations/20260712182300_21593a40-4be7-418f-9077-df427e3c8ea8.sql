
-- Lock down internal SECURITY DEFINER helpers
REVOKE ALL ON FUNCTION public.is_student(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_student(UUID) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.student_enrolled_in_course(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_enrolled_in_course(UUID, UUID) TO authenticated, service_role;

-- Storage policies (files organized by user id prefix)
CREATE POLICY "students upload own submissions"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-submissions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "students read own submissions"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-submissions'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR is_admin(auth.uid()))
  );
CREATE POLICY "students update own submissions"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'student-submissions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "students delete own submissions"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-submissions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
