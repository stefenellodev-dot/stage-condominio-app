-- ============================================================================
-- MIGRACIÓN: Supabase Storage - Buckets y RLS Granular (Fase Storage)
-- Implementa almacenamiento de archivos binarios con RBAC según Ley N° 21.442
-- ============================================================================

-- ============================================================================
-- 1. REGISTRAR LOS 5 BUCKETS OFICIALES EN storage.buckets
-- Todos con public=false para que RLS controle el acceso
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('colillas', 'colillas', false, 10485760, ARRAY['application/pdf']::text[]),
  ('comprobantes-pago', 'comprobantes-pago', false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]),
  ('certificaciones', 'certificaciones', false, 15728640, ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]),
  ('evidencias-infracciones', 'evidencias-infracciones', false, 26214400, ARRAY['image/jpeg', 'image/png', 'application/pdf', 'audio/mpeg']::text[]),
  ('actas-asambleas', 'actas-asambleas', false, 20971520, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. FUNCIONES AUXILIARES PARA RESOLVER PERMISOS SOBRE EL PATH
-- ============================================================================

-- Extrae el primer segmento del path (UUID del condominio)
CREATE OR REPLACE FUNCTION public.storage_extract_condo_id(path text)
RETURNS uuid AS $$
BEGIN
  RETURN split_part(path, '/', 1)::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Valida si el usuario tiene privilegios sobre el condominio según su rol
CREATE OR REPLACE FUNCTION public.can_manage_condo_files(condo_id uuid)
RETURNS boolean AS $$
BEGIN
  IF condo_id IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role = 'superadmin' OR
        (p.role = 'admin' AND p.condominium_id = condo_id)
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. HABILITACIÓN DE RLS EN storage.objects
-- ============================================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. LIMPIEZA DE POLÍTICAS PREVIAS
-- ============================================================================
DROP POLICY IF EXISTS "storage_superadmin_full_access" ON storage.objects;
DROP POLICY IF EXISTS "storage_admin_condo_manage" ON storage.objects;
DROP POLICY IF EXISTS "storage_concierge_evidence_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_concierge_evidence_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_user_voucher_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_user_own_voucher_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_condo_members_read_public_docs" ON storage.objects;
DROP POLICY IF EXISTS "storage_user_own_colilla_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "storage_admin_update" ON storage.objects;

-- ============================================================================
-- 5. POLÍTICAS DE ACCESO
-- ============================================================================

-- A) ACCESO TOTAL SUPERADMIN (ALL operations)
CREATE POLICY "storage_superadmin_full_access"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- B) GESTIÓN COMPLETA PARA ADMINISTRADORES EN SU CONDOMINIO (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "storage_admin_condo_manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    public.can_manage_condo_files(public.storage_extract_condo_id(name))
  )
  WITH CHECK (
    public.can_manage_condo_files(public.storage_extract_condo_id(name))
  );

-- C) LECTURA DE DOCUMENTOS PÚBLICOS/AUTENTICADOS (Certificaciones y Actas)
CREATE POLICY "storage_condo_members_read_public_docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('certificaciones', 'actas-asambleas') AND (
      EXISTS (
        SELECT 1 FROM public.units u
        WHERE u.condominium_id = public.storage_extract_condo_id(name)
          AND u.owner_id = auth.uid()
          AND u.deleted_at IS NULL
      ) OR
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.condominium_id = public.storage_extract_condo_id(name)
      )
    )
  );

-- D) CONSERJERÍA: CARGA Y CONSULTA DE EVIDENCIAS
CREATE POLICY "storage_concierge_evidence_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'evidencias-infracciones' AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'concierge'
        AND p.condominium_id = public.storage_extract_condo_id(name)
    )
  );

CREATE POLICY "storage_concierge_evidence_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'evidencias-infracciones' AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'concierge'
        AND p.condominium_id = public.storage_extract_condo_id(name)
    )
  );

-- E) RESIDENTES: SUBIR COMPROBANTE DE PAGO
CREATE POLICY "storage_user_voucher_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'comprobantes-pago' AND
    EXISTS (
      SELECT 1 FROM public.units u
      WHERE u.condominium_id = public.storage_extract_condo_id(name)
        AND u.owner_id = auth.uid()
        AND u.deleted_at IS NULL
    )
  );

-- F) RESIDENTES: LEER SUS PROPIOS COMPROBANTES
CREATE POLICY "storage_user_own_voucher_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'comprobantes-pago' AND owner = auth.uid()
  );

-- G) RESIDENTES: LEER SUS COLILLAS DE GASTO COMÚN
CREATE POLICY "storage_user_own_colilla_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'colillas' AND
    EXISTS (
      SELECT 1 FROM public.unit_expense_bills b
      JOIN public.units u ON u.id = b.unit_id
      WHERE u.condominium_id = public.storage_extract_condo_id(name)
        AND b.owner_id = auth.uid()
    )
  );

-- H) RESIDENTES: LEER ACTAS DE SU CONDOMINIO
CREATE POLICY "storage_user_actas_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'actas-asambleas' AND
    EXISTS (
      SELECT 1 FROM public.units u
      WHERE u.condominium_id = public.storage_extract_condo_id(name)
        AND u.owner_id = auth.uid()
        AND u.deleted_at IS NULL
    )
  );

-- ============================================================================
-- 6. TRIGGER DE AUDITORÍA PARA OPERACIONES DE STORAGE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.storage_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  bucket_id text NOT NULL,
  object_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.audit_storage_operation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.storage_audit_log (user_id, action, bucket_id, object_path)
  VALUES (auth.uid(), TG_OP, COALESCE(NEW.bucket_id, OLD.bucket_id), COALESCE(NEW.name, OLD.name));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_storage ON storage.objects;
CREATE TRIGGER trg_audit_storage
  AFTER INSERT OR UPDATE OR DELETE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_storage_operation();
