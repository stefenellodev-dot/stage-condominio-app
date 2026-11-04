BEGIN;

CREATE TABLE IF NOT EXISTS public.management_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  rut VARCHAR(12) NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  fantasy_name TEXT,
  business_line TEXT,

  legal_rep_name TEXT NOT NULL,
  legal_rep_rut VARCHAR(12) NOT NULL,
  legal_rep_email TEXT,

  minvu_registry_number TEXT UNIQUE,
  minvu_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (minvu_status IN ('active', 'pending', 'suspended', 'expired')),
  minvu_registered_at DATE,
  has_guarantee_insurance BOOLEAN NOT NULL DEFAULT false,

  email TEXT NOT NULL,
  phone TEXT,
  emergency_phone TEXT,
  website TEXT,

  street TEXT,
  street_number TEXT,
  dept_or_unit TEXT,
  region_id INTEGER REFERENCES public.regions(id) ON DELETE SET NULL,
  commune_id INTEGER REFERENCES public.communes(id) ON DELETE SET NULL,
  region TEXT,
  commune TEXT,

  bank_name TEXT,
  account_type TEXT CHECK (account_type IN ('corriente', 'vista', 'ahorro')),
  account_number TEXT,
  bank_recipient_rut VARCHAR(12),

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_management_companies_commune_id
  ON public.management_companies(commune_id);

CREATE INDEX IF NOT EXISTS idx_management_companies_deleted_at
  ON public.management_companies(deleted_at);

CREATE OR REPLACE FUNCTION public.set_management_companies_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_management_companies_updated_at
  ON public.management_companies;

CREATE TRIGGER tr_management_companies_updated_at
  BEFORE UPDATE ON public.management_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_management_companies_updated_at();

ALTER TABLE public.management_companies ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.management_companies FROM anon;
REVOKE ALL ON TABLE public.management_companies FROM authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.management_companies
  TO authenticated;
GRANT ALL ON TABLE public.management_companies TO service_role;

DROP POLICY IF EXISTS "Lectura administradoras" ON public.management_companies;
DROP POLICY IF EXISTS "Alta administradoras" ON public.management_companies;
DROP POLICY IF EXISTS "Edición administradoras" ON public.management_companies;

CREATE POLICY "Lectura administradoras"
  ON public.management_companies
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL AND public.is_superadmin());

CREATE POLICY "Alta administradoras"
  ON public.management_companies
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Edición administradoras"
  ON public.management_companies
  FOR UPDATE
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

COMMIT;
