BEGIN;

CREATE OR REPLACE FUNCTION public.owns_unit_in_condominium(target_condominium uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.units u
    WHERE u.condominium_id = target_condominium
      AND u.owner_id = auth.uid()
      AND u.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_unit_in_company(target_company uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.units u
    JOIN public.condominiums c ON c.id = u.condominium_id
    WHERE c.management_company_id = target_company
      AND u.owner_id = auth.uid()
      AND u.deleted_at IS NULL
      AND c.deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.owns_unit_in_condominium(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_unit_in_company(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_unit_in_condominium(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_unit_in_company(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Lectura condominios" ON public.condominiums;
CREATE POLICY "Lectura condominios"
  ON public.condominiums
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_superadmin()
      OR public.is_company_member(management_company_id)
      OR public.owns_unit_in_condominium(id)
    )
  );

DROP POLICY IF EXISTS "Lectura administradoras" ON public.management_companies;
CREATE POLICY "Lectura administradoras"
  ON public.management_companies
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_superadmin()
      OR public.is_company_member(id)
      OR public.owns_unit_in_company(id)
    )
  );

COMMIT;
