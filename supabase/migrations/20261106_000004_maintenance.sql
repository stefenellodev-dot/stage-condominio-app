-- 20261106_000004_maintenance.sql
-- Módulo de Mantenciones Preventivas, Equipamiento Crítico y Certificaciones Oficiales (Ley 21.442).
-- Adaptado: RLS SELECT (spec) + INSERT/UPDATE/DELETE para admin/superadmin scoped por empresa;
-- CHECK constraints en maintenance_frequency_days y cost_amount.

BEGIN;

-- 1. Catálogo de Activos y Equipamiento Crítico
CREATE TABLE IF NOT EXISTS public.equipment_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'transporte_vertical', 'gas_calderas', 'red_humeda_seca',
    'sala_bombas', 'grupo_electrogeno', 'portones_accesos', 'seguridad_cctv'
  )),
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  location TEXT NOT NULL,
  installation_date DATE,
  maintenance_frequency_days INTEGER NOT NULL DEFAULT 30 CHECK (maintenance_frequency_days > 0),
  criticality_level TEXT DEFAULT 'alta' CHECK (criticality_level IN ('critica', 'alta', 'media', 'baja')),
  status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'warning', 'out_of_service')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 2. Certificaciones y Sellos Oficiales (MINVU / SEC / Salud)
CREATE TABLE IF NOT EXISTS public.official_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.equipment_assets(id) ON DELETE SET NULL,
  certification_type TEXT NOT NULL CHECK (certification_type IN (
    'sello_minvu_ascensores', 'sello_verde_sec_gas', 'certificado_estanques_salud',
    'red_incendio_bomberos', 'certificacion_extintores'
  )),
  certificate_number TEXT NOT NULL,
  issuing_entity TEXT NOT NULL,
  certifying_company_name TEXT NOT NULL,
  certifying_company_rut VARCHAR(12) NOT NULL,
  inspector_name TEXT,
  inspection_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  seal_result TEXT NOT NULL CHECK (seal_result IN ('verde_aprobado', 'amarillo_observado', 'rojo_rechazado')),
  observations TEXT,
  document_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'warning_expiring', 'expired', 'superseded')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. Bitácora de Mantenciones Ejecutadas
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.equipment_assets(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventiva', 'correctiva', 'emergencia', 'inspeccion_legal')),
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  technician_name TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_rut VARCHAR(12),
  work_order_number TEXT,
  cost_amount INTEGER NOT NULL DEFAULT 0 CHECK (cost_amount >= 0),
  tasks_performed TEXT NOT NULL,
  parts_replaced TEXT,
  operational_status_after TEXT NOT NULL CHECK (operational_status_after IN ('operativo', 'operativo_observado', 'fuera_servicio')),
  report_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_assets_condominium ON public.equipment_assets(condominium_id);
CREATE INDEX IF NOT EXISTS idx_certifications_condominium ON public.official_certifications(condominium_id);
CREATE INDEX IF NOT EXISTS idx_certifications_expiration ON public.official_certifications(expiration_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_asset ON public.maintenance_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_condo ON public.maintenance_logs(condominium_id);

-- Trigger: Semáforo de estado de certificaciones según fecha de vencimiento
CREATE OR REPLACE FUNCTION public.check_certification_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiration_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.expiration_date <= (CURRENT_DATE + INTERVAL '60 days') THEN
    NEW.status := 'warning_expiring';
  ELSE
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_cert_status ON public.official_certifications;
CREATE TRIGGER tr_check_cert_status
  BEFORE INSERT OR UPDATE ON public.official_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.check_certification_expiration();

-- RLS
ALTER TABLE public.equipment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- equipment_assets: SELECT para autenticados, escritura para admin/superadmin scoped por empresa
DROP POLICY IF EXISTS "Lectura activos autenticados" ON public.equipment_assets;
CREATE POLICY "Lectura activos autenticados" ON public.equipment_assets
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Gestion activos admin" ON public.equipment_assets;
CREATE POLICY "Gestion activos admin" ON public.equipment_assets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.condominiums c
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE c.id = condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS "Edicion activos admin" ON public.equipment_assets;
CREATE POLICY "Edicion activos admin" ON public.equipment_assets
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.condominiums c
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE c.id = condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  )
  WITH CHECK (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.condominiums c
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE c.id = condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS "Borrado activos admin" ON public.equipment_assets;
CREATE POLICY "Borrado activos admin" ON public.equipment_assets
  FOR DELETE TO authenticated
  USING (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.condominiums c
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE c.id = condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

-- official_certifications
DROP POLICY IF EXISTS "Lectura certificaciones autenticados" ON public.official_certifications;
CREATE POLICY "Lectura certificaciones autenticados" ON public.official_certifications
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Gestion certificaciones admin" ON public.official_certifications;
CREATE POLICY "Gestion certificaciones admin" ON public.official_certifications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.condominiums c
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE c.id = condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS "Edicion certificaciones admin" ON public.official_certifications;
CREATE POLICY "Edicion certificaciones admin" ON public.official_certifications
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.condominiums c
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE c.id = condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  )
  WITH CHECK (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.condominiums c
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE c.id = condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS "Borrado certificaciones admin" ON public.official_certifications;
CREATE POLICY "Borrado certificaciones admin" ON public.official_certifications
  FOR DELETE TO authenticated
  USING (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.condominiums c
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE c.id = condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

-- maintenance_logs
DROP POLICY IF EXISTS "Lectura bitacora autenticados" ON public.maintenance_logs;
CREATE POLICY "Lectura bitacora autenticados" ON public.maintenance_logs
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Gestion bitacora admin" ON public.maintenance_logs;
CREATE POLICY "Gestion bitacora admin" ON public.maintenance_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.condominiums c
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE c.id = condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS "Edicion bitacora admin" ON public.maintenance_logs;
CREATE POLICY "Edicion bitacora admin" ON public.maintenance_logs
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.condominiums c
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE c.id = condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  )
  WITH CHECK (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.condominiums c
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE c.id = condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS "Borrado bitacora admin" ON public.maintenance_logs;
CREATE POLICY "Borrado bitacora admin" ON public.maintenance_logs
  FOR DELETE TO authenticated
  USING (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.condominiums c
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE c.id = condominium_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

-- Grants
GRANT ALL ON public.equipment_assets TO authenticated, service_role;
GRANT ALL ON public.official_certifications TO authenticated, service_role;
GRANT ALL ON public.maintenance_logs TO authenticated, service_role;

COMMIT;
