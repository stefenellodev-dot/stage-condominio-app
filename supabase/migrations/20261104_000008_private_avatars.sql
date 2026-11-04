BEGIN;

UPDATE storage.buckets
SET public = false
WHERE id = 'avatars';

UPDATE public.profiles
SET avatar_url = regexp_replace(avatar_url, '^.*\/storage\/v1\/object\/public\/avatars\/', '')
WHERE avatar_url LIKE '%/storage/v1/object/public/avatars/%';

DROP POLICY IF EXISTS "Acceso publico lectura avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados suben avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios actualizan avatares" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin gestion total storage" ON storage.objects;

CREATE POLICY "avatars_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_superadmin()
    )
  );

CREATE POLICY "avatars_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_superadmin()
    )
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_superadmin()
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_superadmin()
    )
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_superadmin()
    )
  );

CREATE POLICY "avatars_superadmin_all"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

COMMIT;
