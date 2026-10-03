
CREATE POLICY "Studio photos are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'studio-photos');
CREATE POLICY "Authenticated users can upload studio photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'studio-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own studio photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'studio-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own studio photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'studio-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
