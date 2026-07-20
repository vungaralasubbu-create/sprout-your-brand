CREATE POLICY "kn_storage read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'knowledge' AND EXISTS (
  SELECT 1 FROM public.mc_workspace_members m
  WHERE m.user_id = auth.uid() AND m.workspace_id::text = (storage.foldername(name))[1]
));
CREATE POLICY "kn_storage write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'knowledge' AND EXISTS (
  SELECT 1 FROM public.mc_workspace_members m
  WHERE m.user_id = auth.uid() AND m.workspace_id::text = (storage.foldername(name))[1]
    AND m.role IN ('owner','admin','editor')
));
CREATE POLICY "kn_storage delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'knowledge' AND EXISTS (
  SELECT 1 FROM public.mc_workspace_members m
  WHERE m.user_id = auth.uid() AND m.workspace_id::text = (storage.foldername(name))[1]
    AND m.role IN ('owner','admin')
));