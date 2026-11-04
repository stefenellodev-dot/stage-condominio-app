BEGIN;

CREATE TABLE IF NOT EXISTS public.common_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  area_type TEXT NOT NULL CHECK (area_type IN (
    'quincho', 'piscina', 'gimnasio', 'salon_eventos',
    'cowork_reunion', 'cancha', 'lavanderia', 'terraza_lounge', 'juegos_infantiles'
  )),
  description TEXT,

  capacity INTEGER NOT NULL DEFAULT 10 CHECK (capacity > 0),
  requires_booking BOOLEAN NOT NULL DEFAULT true,

  fee_amount INTEGER NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  deposit_amount INTEGER NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),

  opening_time TIME NOT NULL DEFAULT '08:00',
  closing_time TIME NOT NULL DEFAULT '22:00',
  rules TEXT,

  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'maintenance', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_common_areas_condominium
  ON public.common_areas(condominium_id);

CREATE INDEX IF NOT EXISTS idx_common_areas_type
  ON public.common_areas(area_type);

CREATE INDEX IF NOT EXISTS idx_common_areas_deleted
  ON public.common_areas(deleted_at);

CREATE OR REPLACE FUNCTION public.set_common_areas_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_common_areas_updated_at ON public.common_areas;

CREATE TRIGGER tr_common_areas_updated_at
  BEFORE UPDATE ON public.common_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_common_areas_updated_at();

ALTER TABLE public.common_areas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.common_areas FROM anon;
REVOKE ALL ON TABLE public.common_areas FROM authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.common_areas TO authenticated;
GRANT ALL ON TABLE public.common_areas TO service_role;

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
