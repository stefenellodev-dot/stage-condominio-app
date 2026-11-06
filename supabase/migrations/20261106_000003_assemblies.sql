-- 20261106_000003_assemblies.sql
-- Módulo de Asambleas, Quórums y Votaciones Digitales (Ley N° 21.442).
-- Adaptado: triggers con quórum/aprobación según assembly_type y required_majority;
-- RLS SELECT (spec) + INSERT/UPDATE para admin/superadmin scoped por empresa;
-- INSERT de voto para el asistente acreditado de la unidad.

BEGIN;

-- 1. Cabecera de la Asamblea
CREATE TABLE IF NOT EXISTS public.assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assembly_type TEXT NOT NULL CHECK (assembly_type IN ('ordinaria', 'extraordinaria_absoluta', 'extraordinaria_reforzada')),
  modality TEXT NOT NULL DEFAULT 'hybrid' CHECK (modality IN ('presencial', 'telemática', 'hybrid')),
  scheduled_date DATE NOT NULL,
  first_call_time TIME NOT NULL DEFAULT '19:00',
  second_call_time TIME NOT NULL DEFAULT '19:30',
  video_conference_url TEXT,
  location TEXT,
  current_attendance_aliquot NUMERIC(8, 5) DEFAULT 0.00000,
  is_quorum_reached BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'voting', 'closed')),
  minutes_text TEXT,
  minutes_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 2. Asistencia y Representación de Unidades
CREATE TABLE IF NOT EXISTS public.assembly_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID NOT NULL REFERENCES public.assemblies(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendee_type TEXT NOT NULL DEFAULT 'owner' CHECK (attendee_type IN ('owner', 'proxy', 'tenant')),
  proxy_document_url TEXT,
  aliquot_represented NUMERIC(8, 5) NOT NULL,
  check_in_time TIMESTAMPTZ DEFAULT timezone('utc', now()),
  is_verified BOOLEAN DEFAULT true,
  UNIQUE(assembly_id, unit_id)
);

-- 3. Puntos de la Tabla y Mociones
CREATE TABLE IF NOT EXISTS public.assembly_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID NOT NULL REFERENCES public.assemblies(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  required_majority TEXT NOT NULL DEFAULT 'absolute'
    CHECK (required_majority IN ('absolute', 'reforced_66')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'closed')),
  votes_in_favor_aliquot NUMERIC(8, 5) DEFAULT 0.00000,
  votes_against_aliquot NUMERIC(8, 5) DEFAULT 0.00000,
  votes_abstention_aliquot NUMERIC(8, 5) DEFAULT 0.00000,
  is_approved BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 4. Registro de Votos Emitidos
CREATE TABLE IF NOT EXISTS public.assembly_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.assembly_topics(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('in_favor', 'against', 'abstention')),
  aliquot_weight NUMERIC(8, 5) NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  UNIQUE(topic_id, unit_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_assemblies_condo ON public.assemblies(condominium_id);
CREATE INDEX IF NOT EXISTS idx_assembly_attendees_assembly ON public.assembly_attendees(assembly_id);
CREATE INDEX IF NOT EXISTS idx_assembly_attendees_unit ON public.assembly_attendees(unit_id);
CREATE INDEX IF NOT EXISTS idx_assembly_topics_assembly ON public.assembly_topics(assembly_id);
CREATE INDEX IF NOT EXISTS idx_assembly_votes_topic ON public.assembly_votes(topic_id);
CREATE INDEX IF NOT EXISTS idx_assembly_votes_unit ON public.assembly_votes(unit_id);

-- Trigger: recalcular quórum de asistencia (según assembly_type)
CREATE OR REPLACE FUNCTION public.recalculate_assembly_quorum()
RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC(8, 5);
  v_type TEXT;
  v_threshold NUMERIC(8, 5);
BEGIN
  SELECT COALESCE(SUM(aliquot_represented), 0.00000)
  INTO v_total
  FROM public.assembly_attendees
  WHERE assembly_id = COALESCE(NEW.assembly_id, OLD.assembly_id);

  SELECT assembly_type INTO v_type
  FROM public.assemblies
  WHERE id = COALESCE(NEW.assembly_id, OLD.assembly_id);

  -- Quórum de constitución según tipo (Art. 15, 17, 18 Ley 21.442)
  IF v_type = 'extraordinaria_reforzada' THEN
    v_threshold := 66.00000;
  ELSE
    v_threshold := 50.00000;  -- ordinaria y extraordinaria_absoluta
  END IF;

  UPDATE public.assemblies
  SET current_attendance_aliquot = v_total,
      is_quorum_reached = (v_total >= v_threshold),
      updated_at = timezone('utc', now())
  WHERE id = COALESCE(NEW.assembly_id, OLD.assembly_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_recalc_quorum ON public.assembly_attendees;
CREATE TRIGGER tr_recalc_quorum
  AFTER INSERT OR UPDATE OR DELETE ON public.assembly_attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_assembly_quorum();

-- Trigger: recalcular escrutinio de votos (según assembly_type y required_majority)
CREATE OR REPLACE FUNCTION public.recalculate_topic_votes()
RETURNS TRIGGER AS $$
DECLARE
  v_favor NUMERIC(8, 5);
  v_against NUMERIC(8, 5);
  v_abstain NUMERIC(8, 5);
  v_req TEXT;
  v_type TEXT;
  v_condo_id UUID;
  v_total_condo NUMERIC(8, 5);
  v_approved BOOLEAN;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN vote = 'in_favor' THEN aliquot_weight ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN vote = 'against' THEN aliquot_weight ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN vote = 'abstention' THEN aliquot_weight ELSE 0 END), 0)
  INTO v_favor, v_against, v_abstain
  FROM public.assembly_votes
  WHERE topic_id = COALESCE(NEW.topic_id, OLD.topic_id);

  SELECT t.required_majority, a.assembly_type, a.condominium_id
  INTO v_req, v_type, v_condo_id
  FROM public.assembly_topics t
  JOIN public.assemblies a ON a.id = t.assembly_id
  WHERE t.id = COALESCE(NEW.topic_id, OLD.topic_id);

  -- Total de alícuotas del condominio (para mayorías sobre derechos totales)
  SELECT COALESCE(SUM(aliquot), 0.00000) INTO v_total_condo
  FROM public.units
  WHERE condominium_id = v_condo_id AND deleted_at IS NULL;

  IF v_req = 'reforced_66' OR v_type = 'extraordinaria_reforzada' THEN
    -- Mayoría reforzada: >= 66% de los derechos totales del condominio
    v_approved := (v_favor >= v_total_condo * 0.66);
  ELSIF v_type = 'extraordinaria_absoluta' THEN
    -- Mayoría absoluta sobre derechos totales del condominio
    v_approved := (v_favor > v_total_condo * 0.5);
  ELSE
    -- Ordinaria: mayoría absoluta de los derechos representados en la sesión
    v_approved := (v_favor > (v_favor + v_against + v_abstain) * 0.5 AND v_favor > 0);
  END IF;

  UPDATE public.assembly_topics
  SET votes_in_favor_aliquot = v_favor,
      votes_against_aliquot = v_against,
      votes_abstention_aliquot = v_abstain,
      is_approved = v_approved
  WHERE id = COALESCE(NEW.topic_id, OLD.topic_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_recalc_votes ON public.assembly_votes;
CREATE TRIGGER tr_recalc_votes
  AFTER INSERT OR UPDATE OR DELETE ON public.assembly_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_topic_votes();

-- RLS
ALTER TABLE public.assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_votes ENABLE ROW LEVEL SECURITY;

-- assemblies: lectura para autenticados, escritura para admin/superadmin de la empresa
DROP POLICY IF EXISTS "Lectura asambleas autenticados" ON public.assemblies;
CREATE POLICY "Lectura asambleas autenticados" ON public.assemblies
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Escritura asambleas admin" ON public.assemblies;
CREATE POLICY "Escritura asambleas admin" ON public.assemblies
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

DROP POLICY IF EXISTS "Edicion asambleas admin" ON public.assemblies;
CREATE POLICY "Edicion asambleas admin" ON public.assemblies
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

-- assembly_attendees: lectura para admin/superadmin de la empresa; check-in propio o admin
DROP POLICY IF EXISTS "Lectura asistentes admin" ON public.assembly_attendees;
CREATE POLICY "Lectura asistentes admin" ON public.assembly_attendees
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Check-in asistentes" ON public.assembly_attendees;
CREATE POLICY "Check-in asistentes" ON public.assembly_attendees
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR public.is_admin()
  );

-- assembly_topics: lectura para autenticados; escritura para admin/superadmin de la empresa
DROP POLICY IF EXISTS "Lectura mociones autenticados" ON public.assembly_topics;
CREATE POLICY "Lectura mociones autenticados" ON public.assembly_topics
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Escritura mociones admin" ON public.assembly_topics;
CREATE POLICY "Escritura mociones admin" ON public.assembly_topics
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.assemblies a
        JOIN public.condominiums c ON c.id = a.condominium_id
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE a.id = assembly_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS "Edicion mociones admin" ON public.assembly_topics;
CREATE POLICY "Edicion mociones admin" ON public.assembly_topics
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.assemblies a
        JOIN public.condominiums c ON c.id = a.condominium_id
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE a.id = assembly_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  )
  WITH CHECK (
    public.is_admin() AND (
      public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.assemblies a
        JOIN public.condominiums c ON c.id = a.condominium_id
        JOIN public.management_company_members m ON m.management_company_id = c.management_company_id
        WHERE a.id = assembly_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

-- assembly_votes: lectura privada (solo votante o superadmin); voto solo si asistente acreditado
DROP POLICY IF EXISTS "Lectura votos propios o superadmin" ON public.assembly_votes;
CREATE POLICY "Lectura votos propios o superadmin" ON public.assembly_votes
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR public.is_superadmin()
  );

DROP POLICY IF EXISTS "Emision de voto" ON public.assembly_votes;
CREATE POLICY "Emision de voto" ON public.assembly_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.assembly_attendees att
      WHERE att.assembly_id = (SELECT assembly_id FROM public.assembly_topics WHERE id = topic_id)
        AND att.unit_id = unit_id
        AND att.user_id = auth.uid()
        AND att.is_verified = true
    )
  );

-- Grants
GRANT ALL ON public.assemblies TO authenticated, service_role;
GRANT ALL ON public.assembly_attendees TO authenticated, service_role;
GRANT ALL ON public.assembly_topics TO authenticated, service_role;
GRANT ALL ON public.assembly_votes TO authenticated, service_role;

COMMIT;
