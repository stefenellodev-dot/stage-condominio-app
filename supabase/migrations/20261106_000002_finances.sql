-- 20261106_000002_finances.sql
-- Módulo de Gastos Comunes y Finanzas (Ley 21.442).
-- Adaptado al esquema existente: tablas + índices + RLS (SELECT del spec + INSERT/UPDATE
-- para admin/superadmin scoped por empresa administradora) + grants.

BEGIN;

-- 0. Validación de reserve_fund_percentage en condominiums
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'condominiums_reserve_fund_percentage_check'
  ) THEN
    ALTER TABLE public.condominiums
      ADD CONSTRAINT condominiums_reserve_fund_percentage_check
      CHECK (reserve_fund_percentage BETWEEN 0 AND 100);
  END IF;
END $$;

-- 1. Periodos contables mensuales
CREATE TABLE IF NOT EXISTS public.expense_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  period_name TEXT NOT NULL,
  period_date DATE NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_expenses INTEGER NOT NULL DEFAULT 0,
  total_reserve_fund INTEGER NOT NULL DEFAULT 0,
  total_billed INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'closed', 'notified')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(condominium_id, period_date)
);

-- 2. Egresos / facturas
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES public.expense_periods(id) ON DELETE CASCADE,
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('administracion', 'mantencion', 'reparacion', 'uso_consumo', 'extraordinario')),
  description TEXT NOT NULL,
  supplier_name TEXT,
  supplier_rut VARCHAR(12),
  invoice_number TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. Colillas por unidad
CREATE TABLE IF NOT EXISTS public.unit_expense_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES public.expense_periods(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  base_aliquot_amount INTEGER NOT NULL DEFAULT 0,
  reserve_fund_amount INTEGER NOT NULL DEFAULT 0,
  individual_charges_amount INTEGER NOT NULL DEFAULT 0,
  previous_debt_amount INTEGER NOT NULL DEFAULT 0,
  interest_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  paid_amount INTEGER NOT NULL DEFAULT 0,
  balance INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(period_id, unit_id)
);

-- 4. Pagos / transferencias
CREATE TABLE IF NOT EXISTS public.bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.unit_expense_bills(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('transferencia', 'deposito', 'webpay', 'tarjeta')),
  transaction_number TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  voucher_url TEXT,
  status TEXT DEFAULT 'verified' CHECK (status IN ('pending_review', 'verified', 'rejected')),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_expense_periods_condo ON public.expense_periods(condominium_id);
CREATE INDEX IF NOT EXISTS idx_expenses_period ON public.expenses(period_id);
CREATE INDEX IF NOT EXISTS idx_expenses_condo ON public.expenses(condominium_id);
CREATE INDEX IF NOT EXISTS idx_unit_expense_bills_period ON public.unit_expense_bills(period_id);
CREATE INDEX IF NOT EXISTS idx_unit_expense_bills_unit ON public.unit_expense_bills(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_expense_bills_owner ON public.unit_expense_bills(owner_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill ON public.bill_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_unit ON public.bill_payments(unit_id);

-- RLS
ALTER TABLE public.expense_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_expense_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;

-- Helper: ¿el usuario autenticado es admin/superadmin de la empresa del condominio?
-- (reutiliza management_company_members; superadmin pasa siempre)

-- expense_periods
DROP POLICY IF EXISTS "Lectura general periodos" ON public.expense_periods;
CREATE POLICY "Lectura general periodos" ON public.expense_periods
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Escritura periodos admin" ON public.expense_periods;
CREATE POLICY "Escritura periodos admin" ON public.expense_periods
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

DROP POLICY IF EXISTS "Edicion periodos admin" ON public.expense_periods;
CREATE POLICY "Edicion periodos admin" ON public.expense_periods
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

-- expenses
DROP POLICY IF EXISTS "Lectura general egresos" ON public.expenses;
CREATE POLICY "Lectura general egresos" ON public.expenses
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Escritura egresos admin" ON public.expenses;
CREATE POLICY "Escritura egresos admin" ON public.expenses
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

DROP POLICY IF EXISTS "Edicion egresos admin" ON public.expenses;
CREATE POLICY "Edicion egresos admin" ON public.expenses
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

-- unit_expense_bills
DROP POLICY IF EXISTS "Lectura colillas propias o superadmin" ON public.unit_expense_bills;
CREATE POLICY "Lectura colillas propias o superadmin" ON public.unit_expense_bills
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid() OR public.is_superadmin() OR public.is_admin()
  );

DROP POLICY IF EXISTS "Escritura colillas admin" ON public.unit_expense_bills;
CREATE POLICY "Escritura colillas admin" ON public.unit_expense_bills
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Edicion colillas admin" ON public.unit_expense_bills;
CREATE POLICY "Edicion colillas admin" ON public.unit_expense_bills
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- bill_payments
DROP POLICY IF EXISTS "Lectura pagos propios o superadmin" ON public.bill_payments;
CREATE POLICY "Lectura pagos propios o superadmin" ON public.bill_payments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR public.is_superadmin() OR public.is_admin()
  );

DROP POLICY IF EXISTS "Alta pagos propios" ON public.bill_payments;
CREATE POLICY "Alta pagos propios" ON public.bill_payments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS "Edicion pagos admin" ON public.bill_payments;
CREATE POLICY "Edicion pagos admin" ON public.bill_payments
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grants
GRANT ALL ON public.expense_periods TO authenticated, service_role;
GRANT ALL ON public.expenses TO authenticated, service_role;
GRANT ALL ON public.unit_expense_bills TO authenticated, service_role;
GRANT ALL ON public.bill_payments TO authenticated, service_role;

COMMIT;
