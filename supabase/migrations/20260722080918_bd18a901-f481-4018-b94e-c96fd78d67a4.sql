
-- Tighten career-resumes upload policy: restrict path + mime type; still allow anonymous applicants.
DROP POLICY IF EXISTS "career-resumes public upload" ON storage.objects;

CREATE POLICY "career-resumes restricted upload"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'career-resumes'
  AND (storage.foldername(name))[1] = 'submissions'
  AND lower(coalesce(metadata->>'mimetype','')) IN (
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
  AND coalesce((metadata->>'size')::bigint, 0) <= 10485760
);

-- Restrict payment-config bucket reads to admins only.
DROP POLICY IF EXISTS "payment_config_read_authenticated" ON storage.objects;

CREATE POLICY "payment_config_read_admin"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-config'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
