
CREATE POLICY "support_attach_partner_rw" ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'support-attachments' AND (
    is_admin(auth.uid())
    OR (storage.foldername(name))[1] = partner_id_for(auth.uid())::text
  )
)
WITH CHECK (
  bucket_id = 'support-attachments' AND (
    is_admin(auth.uid())
    OR (storage.foldername(name))[1] = partner_id_for(auth.uid())::text
  )
);
