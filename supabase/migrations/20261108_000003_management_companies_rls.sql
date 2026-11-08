-- ============================================================================
-- MIGRACIÓN: RLS para management_companies (lectura por rol)
-- ============================================================================

-- Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Lectura administradoras" ON management_companies;
DROP POLICY IF EXISTS "Alta administradoras" ON management_companies;
DROP POLICY IF EXISTS "Edición administradoras" ON management_companies;

-- Lectura: superadmin ve todas, admin/concierge/user ven las asignadas a su condominio
CREATE POLICY "Lectura administradoras" ON management_companies
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_superadmin() OR
    id IN (
      SELECT management_company_id FROM condominiums
      WHERE id = get_user_condominium_id()
    )
  )
);

-- Alta: solo superadmin
CREATE POLICY "Alta administradoras" ON management_companies
FOR INSERT WITH CHECK (is_superadmin());

-- Edición: superadmin o admin asignado
CREATE POLICY "Edición administradoras" ON management_companies
FOR UPDATE USING (
  is_superadmin() OR
  (is_admin() AND id IN (
    SELECT management_company_id FROM condominiums
    WHERE id = get_user_condominium_id()
  ))
);
