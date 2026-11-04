BEGIN;

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.units FROM anon;
REVOKE ALL ON TABLE public.units FROM authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.units TO authenticated;
GRANT ALL ON TABLE public.units TO service_role;

DROP POLICY IF EXISTS "Lectura unidades autenticados" ON public.units;
DROP POLICY IF EXISTS "Gestion total unidades superadmin" ON public.units;
DROP POLICY IF EXISTS "Alta unidades" ON public.units;
DROP POLICY IF EXISTS "Edición unidades" ON public.units;

CREATE POLICY "Lectura unidades"
  ON public.units
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_superadmin()
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

CREATE POLICY "Alta unidades"
  ON public.units
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_superadmin()
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
  );

CREATE POLICY "Edición unidades"
  ON public.units
  FOR UPDATE
  TO authenticated
  USING (
    public.is_superadmin()
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
  WITH CHECK (
    public.is_superadmin()
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
  );

COMMIT;
