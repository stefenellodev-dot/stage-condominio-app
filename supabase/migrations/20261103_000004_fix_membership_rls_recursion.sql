BEGIN;

CREATE OR REPLACE FUNCTION public.is_company_member(target_company uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.management_company_members m
    WHERE m.management_company_id = target_company
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_company_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Lectura membresías" ON public.management_company_members;
CREATE POLICY "Lectura membresías"
  ON public.management_company_members
  FOR SELECT
  TO authenticated
  USING (
    public.is_superadmin()
    OR user_id = auth.uid()
    OR public.is_company_member(management_company_id)
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
    )
  );

COMMIT;
