BEGIN;

CREATE TABLE IF NOT EXISTS public.condominiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  management_company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE RESTRICT,

  name TEXT NOT NULL,
  rut VARCHAR(12) NOT NULL UNIQUE,
  sii_property_role TEXT NOT NULL,

  type TEXT NOT NULL CHECK (type IN ('tipo_a', 'tipo_b')),
  destination TEXT NOT NULL CHECK (destination IN ('habitacional', 'comercial', 'mixto')),
  total_units INTEGER NOT NULL DEFAULT 1 CHECK (total_units > 0),

  dom_certificate_number TEXT,
  dom_approval_date DATE,
  reserve_fund_percentage NUMERIC(5,2) NOT NULL DEFAULT 5.00
    CHECK (reserve_fund_percentage >= 0 AND reserve_fund_percentage <= 100),

  street TEXT NOT NULL,
  street_number TEXT NOT NULL,
  region_id INTEGER REFERENCES public.regions(id) ON DELETE SET NULL,
  commune_id INTEGER REFERENCES public.communes(id) ON DELETE SET NULL,
  region TEXT,
  commune TEXT,

  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('corriente', 'vista')),
  account_number TEXT NOT NULL,

  concierge_phone TEXT,
  administration_email TEXT,

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_condominiums_management_company_id
  ON public.condominiums(management_company_id);

CREATE INDEX IF NOT EXISTS idx_condominiums_rut
  ON public.condominiums(rut);

CREATE INDEX IF NOT EXISTS idx_condominiums_commune_id
  ON public.condominiums(commune_id);

CREATE INDEX IF NOT EXISTS idx_condominiums_deleted_at
  ON public.condominiums(deleted_at);

CREATE OR REPLACE FUNCTION public.set_condominiums_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_condominiums_updated_at ON public.condominiums;

CREATE TRIGGER tr_condominiums_updated_at
  BEFORE UPDATE ON public.condominiums
  FOR EACH ROW
  EXECUTE FUNCTION public.set_condominiums_updated_at();

ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.condominiums FROM anon;
REVOKE ALL ON TABLE public.condominiums FROM authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.condominiums
  TO authenticated;
GRANT ALL ON TABLE public.condominiums TO service_role;

DROP POLICY IF EXISTS "Lectura condominios" ON public.condominiums;
DROP POLICY IF EXISTS "Alta condominios" ON public.condominiums;
DROP POLICY IF EXISTS "Edición condominios" ON public.condominiums;

CREATE POLICY "Lectura condominios"
  ON public.condominiums
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_superadmin()
      OR public.is_company_member(management_company_id)
    )
  );

CREATE POLICY "Alta condominios"
  ON public.condominiums
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_superadmin()
    OR public.is_company_member(management_company_id)
  );

CREATE POLICY "Edición condominios"
  ON public.condominiums
  FOR UPDATE
  TO authenticated
  USING (
    public.is_superadmin()
    OR public.is_company_member(management_company_id)
  )
  WITH CHECK (
    public.is_superadmin()
    OR public.is_company_member(management_company_id)
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_management_company_members_one_active_company
  ON public.management_company_members (user_id)
  WHERE deleted_at IS NULL AND status = 'active';

COMMIT;
