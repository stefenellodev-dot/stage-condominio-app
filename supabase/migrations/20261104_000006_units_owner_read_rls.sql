BEGIN;

DROP POLICY IF EXISTS "Lectura unidades" ON public.units;

CREATE POLICY "Lectura unidades"
  ON public.units
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_superadmin()
      OR owner_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.condominiums c
        JOIN public.management_company_members m
          ON m.management_company_id = c.management_company_id
        WHERE c.id = units.condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

COMMIT;
