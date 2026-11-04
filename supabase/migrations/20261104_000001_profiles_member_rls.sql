BEGIN;

DROP POLICY IF EXISTS "Lectura de perfiles" ON public.profiles;

CREATE POLICY "Lectura de perfiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.is_superadmin()
    OR EXISTS (
      SELECT 1
      FROM public.management_company_members m1
      JOIN public.management_company_members m2
        ON m1.management_company_id = m2.management_company_id
      WHERE m1.user_id = auth.uid()
        AND m1.status = 'active'
        AND m1.deleted_at IS NULL
        AND m2.user_id = profiles.id
        AND m2.deleted_at IS NULL
    )
  );

COMMIT;
