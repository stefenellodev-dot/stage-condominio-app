-- ============================================================================
-- MIGRACIÓN: RBAC Granular RLS (Fase 1)
-- ============================================================================

-- ============================================================================
-- 1. Función helper: is_concierge()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_concierge()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'concierge'
  );
END;
$function$;

-- ============================================================================
-- 2. Función helper: get_user_condominium_id()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_condominium_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (SELECT condominium_id FROM public.profiles WHERE id = auth.uid());
END;
$function$;

-- ============================================================================
-- 3. Función helper: owns_unit_in_condominium(condo_id)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.owns_unit_in_condominium(target_condo uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.units u
    WHERE u.condominium_id = target_condo
      AND u.owner_id = auth.uid()
      AND u.deleted_at IS NULL
  );
$function$;

-- ============================================================================
-- 4. Actualizar políticas RLS para tablas clave
-- ============================================================================

-- 4.1 condominiums
DROP POLICY IF EXISTS "Lectura condominios" ON condominiums;
CREATE POLICY "Lectura condominios" ON condominiums
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_superadmin() OR
    is_company_member(management_company_id) OR
    id = get_user_condominium_id() OR
    owns_unit_in_condominium(id)
  )
);

-- 4.2 common_areas
DROP POLICY IF EXISTS "Lectura espacios comunes" ON common_areas;
CREATE POLICY "Lectura espacios comunes" ON common_areas
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_superadmin() OR
    is_company_member((SELECT management_company_id FROM condominiums WHERE id = common_areas.condominium_id)) OR
    condominium_id = get_user_condominium_id() OR
    owns_unit_in_condominium(condominium_id)
  )
);

-- 4.3 visitor_logs (no tiene deleted_at)
DROP POLICY IF EXISTS "Lectura visitas autenticados" ON visitor_logs;
CREATE POLICY "Lectura visitas autenticados" ON visitor_logs
FOR SELECT USING (
  is_superadmin() OR
  (is_admin() AND condominium_id = get_user_condominium_id()) OR
  (is_concierge() AND condominium_id = get_user_condominium_id()) OR
  unit_id IN (SELECT id FROM units WHERE owner_id = auth.uid())
);

-- 4.4 parcels (no tiene deleted_at)
DROP POLICY IF EXISTS "Lectura paquetes autenticados" ON parcels;
CREATE POLICY "Lectura paquetes autenticados" ON parcels
FOR SELECT USING (
  is_superadmin() OR
  (is_admin() AND condominium_id = get_user_condominium_id()) OR
  (is_concierge() AND condominium_id = get_user_condominium_id()) OR
  unit_id IN (SELECT id FROM units WHERE owner_id = auth.uid())
);

-- 4.5 concierge_logbook
DROP POLICY IF EXISTS "Lectura libro novedades autenticados" ON concierge_logbook;
CREATE POLICY "Lectura libro novedades autenticados" ON concierge_logbook
FOR SELECT USING (
  is_superadmin() OR
  (is_admin() AND condominium_id = get_user_condominium_id()) OR
  (is_concierge() AND condominium_id = get_user_condominium_id())
);

-- 4.6 equipment_assets
DROP POLICY IF EXISTS "Lectura activos autenticados" ON equipment_assets;
CREATE POLICY "Lectura activos autenticados" ON equipment_assets
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_superadmin() OR
    (is_admin() AND condominium_id = get_user_condominium_id()) OR
    (is_concierge() AND condominium_id = get_user_condominium_id()) OR
    owns_unit_in_condominium(condominium_id)
  )
);

-- 4.7 maintenance_logs
DROP POLICY IF EXISTS "Lectura bitacora autenticados" ON maintenance_logs;
CREATE POLICY "Lectura bitacora autenticados" ON maintenance_logs
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_superadmin() OR
    (is_admin() AND condominium_id = get_user_condominium_id()) OR
    (is_concierge() AND condominium_id = get_user_condominium_id()) OR
    owns_unit_in_condominium(condominium_id)
  )
);

-- 4.8 official_certifications
DROP POLICY IF EXISTS "Lectura certificaciones autenticados" ON official_certifications;
CREATE POLICY "Lectura certificaciones autenticados" ON official_certifications
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_superadmin() OR
    (is_admin() AND condominium_id = get_user_condominium_id()) OR
    (is_concierge() AND condominium_id = get_user_condominium_id()) OR
    owns_unit_in_condominium(condominium_id)
  )
);

-- 4.9 assemblies
DROP POLICY IF EXISTS "Lectura asambleas autenticados" ON assemblies;
CREATE POLICY "Lectura asambleas autenticados" ON assemblies
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_superadmin() OR
    (is_admin() AND condominium_id = get_user_condominium_id()) OR
    owns_unit_in_condominium(condominium_id)
  )
);

-- 4.10 expenses
DROP POLICY IF EXISTS "Lectura general egresos" ON expenses;
CREATE POLICY "Lectura general egresos" ON expenses
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_superadmin() OR
    (is_admin() AND condominium_id = get_user_condominium_id()) OR
    owns_unit_in_condominium(condominium_id)
  )
);

-- 4.11 expense_periods
DROP POLICY IF EXISTS "Lectura general periodos" ON expense_periods;
CREATE POLICY "Lectura general periodos" ON expense_periods
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_superadmin() OR
    (is_admin() AND condominium_id = get_user_condominium_id()) OR
    owns_unit_in_condominium(condominium_id)
  )
);

-- 4.12 unit_expense_bills
DROP POLICY IF EXISTS "Lectura colillas autenticados" ON unit_expense_bills;
CREATE POLICY "Lectura colillas autenticados" ON unit_expense_bills
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_superadmin() OR
    (is_admin() AND unit_id IN (SELECT id FROM units WHERE condominium_id = get_user_condominium_id())) OR
    owner_id = auth.uid()
  )
);

-- 4.13 units
DROP POLICY IF EXISTS "Lectura unidades autenticados" ON units;
CREATE POLICY "Lectura unidades autenticados" ON units
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_superadmin() OR
    (is_admin() AND condominium_id = get_user_condominium_id()) OR
    (is_concierge() AND condominium_id = get_user_condominium_id()) OR
    owner_id = auth.uid() OR
    owns_unit_in_condominium(condominium_id)
  )
);

-- 4.14 common_area_bookings
DROP POLICY IF EXISTS "Lectura reservas" ON common_area_bookings;
CREATE POLICY "Lectura reservas" ON common_area_bookings
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_superadmin() OR
    (is_admin() AND condominium_id = get_user_condominium_id()) OR
    (is_concierge() AND condominium_id = get_user_condominium_id()) OR
    user_id = auth.uid() OR
    owns_unit_in_condominium(condominium_id)
  )
);

-- 4.15 profiles
DROP POLICY IF EXISTS "Lectura de perfiles" ON profiles;
CREATE POLICY "Lectura de perfiles" ON profiles
FOR SELECT USING (
  deleted_at IS NULL AND (
    id = auth.uid() OR
    is_superadmin() OR
    (is_admin() AND EXISTS (
      SELECT 1 FROM units u
      WHERE u.owner_id = profiles.id
        AND u.condominium_id = get_user_condominium_id()
    ))
  )
);
