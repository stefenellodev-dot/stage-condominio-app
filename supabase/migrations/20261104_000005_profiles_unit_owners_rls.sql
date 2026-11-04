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
    OR EXISTS (
      SELECT 1
      FROM public.units u
      JOIN public.condominiums c ON c.id = u.condominium_id
      JOIN public.management_company_members m
        ON m.management_company_id = c.management_company_id
      WHERE u.owner_id = profiles.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.deleted_at IS NULL
        AND u.deleted_at IS NULL
        AND c.deleted_at IS NULL
    )
  );

COMMIT;
