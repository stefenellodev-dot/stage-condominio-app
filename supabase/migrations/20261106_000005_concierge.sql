-- 20261106_000005_concierge.sql
-- Módulo de Conserjería, Control de Accesos y Paquetería.
-- Adaptado: RLS scoped por condominium_id para concierge; vista de mínimo privilegio
-- para datos de propietarios; CHECK constraints en campos clave.

BEGIN;

-- 1. Ampliar rol en profiles para incluir 'concierge'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('superadmin', 'admin', 'user', 'concierge'));

-- 2. Vincular perfil a condominio (para concierge y usuarios)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS condominium_id UUID REFERENCES public.condominiums(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_condominium ON public.profiles(condominium_id);

-- 3. Tablas de conserjería
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_rut VARCHAR(12),
  vehicle_plate VARCHAR(10),
  parking_spot TEXT,
  entry_time TIMESTAMPTZ DEFAULT timezone('utc', now()),
  exit_time TIMESTAMPTZ,
  registered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'inside' CHECK (status IN ('inside', 'exited')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL CHECK (carrier IN (
    'chilexpress', 'starken', 'blue_express', 'mercado_libre',
    'correos_chile', 'pedidos_ya', 'otro'
  )),
  tracking_number TEXT,
  package_type TEXT DEFAULT 'caja' CHECK (package_type IN ('sobre', 'caja', 'bulto_grande')),
  pickup_pin VARCHAR(6) NOT NULL,
  received_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  picked_up_at TIMESTAMPTZ,
  picked_up_by_name TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'notified', 'delivered', 'returned')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.concierge_logbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'afternoon', 'night')),
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'rutina', 'incidente', 'inspeccion_ronda', 'ruidos_molestos', 'visita_tecnica'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'escalated_admin')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_visitors_condo_status ON public.visitor_logs(condominium_id, status);
CREATE INDEX IF NOT EXISTS idx_visitors_unit ON public.visitor_logs(unit_id);
CREATE INDEX IF NOT EXISTS idx_parcels_condo_unit ON public.parcels(condominium_id, unit_id, status);
CREATE INDEX IF NOT EXISTS idx_logbook_condo ON public.concierge_logbook(condominium_id, created_at);

-- Vista de mínimo privilegio: propietarios de unidades (solo nombre + teléfono + unidad)
CREATE OR REPLACE VIEW public.concierge_unit_owners AS
SELECT
  p.id AS profile_id,
  p.full_name,
  p.phone,
  u.id AS unit_id,
  u.unit_number,
  u.condominium_id
FROM public.profiles p
JOIN public.units u ON u.owner_id = p.id
WHERE u.deleted_at IS NULL;

-- RLS
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_logbook ENABLE ROW LEVEL SECURITY;

-- visitor_logs: lectura para autenticados del mismo condominio (concierge) o admin/superadmin
DROP POLICY IF EXISTS "Lectura visitas autenticados" ON public.visitor_logs;
CREATE POLICY "Lectura visitas autenticados" ON public.visitor_logs
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'concierge'
        AND pr.condominium_id = visitor_logs.condominium_id
    )
  );

DROP POLICY IF EXISTS "Gestion visitas concierge" ON public.visitor_logs;
CREATE POLICY "Gestion visitas concierge" ON public.visitor_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'concierge'
        AND pr.condominium_id = visitor_logs.condominium_id
    )
  );

DROP POLICY IF EXISTS "Edicion visitas concierge" ON public.visitor_logs;
CREATE POLICY "Edicion visitas concierge" ON public.visitor_logs
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'concierge'
        AND pr.condominium_id = visitor_logs.condominium_id
    )
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'concierge'
        AND pr.condominium_id = visitor_logs.condominium_id
    )
  );

-- parcels: misma lógica
DROP POLICY IF EXISTS "Lectura encomiendas autenticados" ON public.parcels;
CREATE POLICY "Lectura encomiendas autenticados" ON public.parcels
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'concierge'
        AND pr.condominium_id = parcels.condominium_id
    ) OR
    unit_id IN (SELECT id FROM public.units WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Gestion paquetes concierge" ON public.parcels;
CREATE POLICY "Gestion paquetes concierge" ON public.parcels
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'concierge'
        AND pr.condominium_id = parcels.condominium_id
    )
  );

DROP POLICY IF EXISTS "Edicion paquetes concierge" ON public.parcels;
CREATE POLICY "Edicion paquetes concierge" ON public.parcels
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'concierge'
        AND pr.condominium_id = parcels.condominium_id
    )
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'concierge'
        AND pr.condominium_id = parcels.condominium_id
    )
  );

-- concierge_logbook: lectura para admin/superadmin del condo o concierge del mismo condo
DROP POLICY IF EXISTS "Lectura libro novedades autenticados" ON public.concierge_logbook;
CREATE POLICY "Lectura libro novedades autenticados" ON public.concierge_logbook
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'concierge'
        AND pr.condominium_id = concierge_logbook.condominium_id
    )
  );

DROP POLICY IF EXISTS "Gestion logbook concierge" ON public.concierge_logbook;
CREATE POLICY "Gestion logbook concierge" ON public.concierge_logbook
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'concierge'
        AND pr.condominium_id = concierge_logbook.condominium_id
    )
  );

DROP POLICY IF EXISTS "Edicion logbook concierge" ON public.concierge_logbook;
CREATE POLICY "Edicion logbook concierge" ON public.concierge_logbook
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'concierge'
        AND pr.condominium_id = concierge_logbook.condominium_id
    )
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'concierge'
        AND pr.condominium_id = concierge_logbook.condominium_id
    )
  );

-- Grants
GRANT ALL ON public.visitor_logs TO authenticated, service_role;
GRANT ALL ON public.parcels TO authenticated, service_role;
GRANT ALL ON public.concierge_logbook TO authenticated, service_role;
GRANT SELECT ON public.concierge_unit_owners TO authenticated, service_role;

COMMIT;
