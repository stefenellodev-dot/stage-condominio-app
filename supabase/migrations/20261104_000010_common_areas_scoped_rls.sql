BEGIN;

DROP POLICY IF EXISTS "Lectura espacios comunes" ON public.common_areas;
DROP POLICY IF EXISTS "Alta espacios comunes" ON public.common_areas;
DROP POLICY IF EXISTS "Edición espacios comunes" ON public.common_areas;

CREATE POLICY "Lectura espacios comunes"
  ON public.common_areas
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_superadmin()
      OR public.is_company_member((
        SELECT c.management_company_id
        FROM public.condominiums c
        WHERE c.id = common_areas.condominium_id
      ))
      OR public.owns_unit_in_condominium(condominium_id)
    )
  );

CREATE POLICY "Alta espacios comunes"
  ON public.common_areas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_superadmin()
    OR public.is_company_member((
      SELECT c.management_company_id
      FROM public.condominiums c
      WHERE c.id = common_areas.condominium_id
    ))
  );

CREATE POLICY "Edición espacios comunes"
  ON public.common_areas
  FOR UPDATE
  TO authenticated
  USING (
    public.is_superadmin()
    OR public.is_company_member((
      SELECT c.management_company_id
      FROM public.condominiums c
      WHERE c.id = common_areas.condominium_id
    ))
  )
  WITH CHECK (
    public.is_superadmin()
    OR public.is_company_member((
      SELECT c.management_company_id
      FROM public.condominiums c
      WHERE c.id = common_areas.condominium_id
    ))
  );

COMMIT;
