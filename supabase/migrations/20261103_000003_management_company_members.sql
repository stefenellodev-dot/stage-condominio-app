BEGIN;

CREATE TABLE IF NOT EXISTS public.management_company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  management_company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('admin', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_management_company_members_company_id
  ON public.management_company_members(management_company_id);

CREATE INDEX IF NOT EXISTS idx_management_company_members_user_id
  ON public.management_company_members(user_id);

CREATE INDEX IF NOT EXISTS idx_management_company_members_deleted_at
  ON public.management_company_members(deleted_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_management_company_members_active
  ON public.management_company_members(management_company_id, user_id)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_management_company_members_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_management_company_members_updated_at
  ON public.management_company_members;

CREATE TRIGGER tr_management_company_members_updated_at
  BEFORE UPDATE ON public.management_company_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_management_company_members_updated_at();

ALTER TABLE public.management_company_members ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.management_company_members FROM anon;
REVOKE ALL ON TABLE public.management_company_members FROM authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.management_company_members
  TO authenticated;
GRANT ALL ON TABLE public.management_company_members TO service_role;

DROP POLICY IF EXISTS "Lectura membresías" ON public.management_company_members;
DROP POLICY IF EXISTS "Alta membresías" ON public.management_company_members;
DROP POLICY IF EXISTS "Edición membresías" ON public.management_company_members;

CREATE POLICY "Lectura membresías"
  ON public.management_company_members
  FOR SELECT
  TO authenticated
  USING (
    public.is_superadmin()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.management_company_members m
      WHERE m.management_company_id = management_company_members.management_company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.deleted_at IS NULL
    )
  );

CREATE POLICY "Alta membresías"
  ON public.management_company_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Edición membresías"
  ON public.management_company_members
  FOR UPDATE
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "Lectura administradoras" ON public.management_companies;

CREATE POLICY "Lectura administradoras"
  ON public.management_companies
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_superadmin()
      OR EXISTS (
        SELECT 1
        FROM public.management_company_members m
        WHERE m.management_company_id = management_companies.id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

COMMIT;
