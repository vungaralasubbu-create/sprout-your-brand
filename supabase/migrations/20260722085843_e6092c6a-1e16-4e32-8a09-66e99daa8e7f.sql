DROP POLICY IF EXISTS "mkt_posters_owner_read" ON storage.objects;
CREATE POLICY "mkt_posters_owner_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'marketing-posters' AND owner = auth.uid());

DROP POLICY IF EXISTS "mkt_posters_owner_insert" ON storage.objects;
CREATE POLICY "mkt_posters_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marketing-posters' AND owner = auth.uid());

DROP POLICY IF EXISTS "mkt_posters_owner_update" ON storage.objects;
CREATE POLICY "mkt_posters_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'marketing-posters' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'marketing-posters' AND owner = auth.uid());

DROP POLICY IF EXISTS "mkt_posters_owner_delete" ON storage.objects;
CREATE POLICY "mkt_posters_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'marketing-posters' AND owner = auth.uid());