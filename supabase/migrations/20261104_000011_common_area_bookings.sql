BEGIN;

CREATE TABLE IF NOT EXISTS public.common_area_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  common_area_id UUID NOT NULL REFERENCES public.common_areas(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  guest_count INTEGER NOT NULL DEFAULT 1 CHECK (guest_count > 0),
  purpose TEXT,

  fee_amount INTEGER NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  deposit_amount INTEGER NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  charge_to_expenses BOOLEAN NOT NULL DEFAULT true,
  expense_billed BOOLEAN NOT NULL DEFAULT false,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
  deposit_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (deposit_status IN ('pending', 'deposited', 'refunded', 'retained_partial', 'retained_total')),
  rejection_reason TEXT,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ,

  CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_common_area_bookings_condominium
  ON public.common_area_bookings(condominium_id);

CREATE INDEX IF NOT EXISTS idx_common_area_bookings_area_date
  ON public.common_area_bookings(common_area_id, booking_date);

CREATE INDEX IF NOT EXISTS idx_common_area_bookings_unit
  ON public.common_area_bookings(unit_id);

CREATE INDEX IF NOT EXISTS idx_common_area_bookings_status
  ON public.common_area_bookings(status);

CREATE INDEX IF NOT EXISTS idx_common_area_bookings_deleted
  ON public.common_area_bookings(deleted_at);

CREATE OR REPLACE FUNCTION public.set_common_area_bookings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_common_area_bookings_updated_at
  ON public.common_area_bookings;

CREATE TRIGGER tr_common_area_bookings_updated_at
  BEFORE UPDATE ON public.common_area_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_common_area_bookings_updated_at();

CREATE OR REPLACE FUNCTION public.check_common_area_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.deleted_at IS NULL AND NEW.status IN ('pending', 'confirmed') THEN
    IF EXISTS (
      SELECT 1
      FROM public.common_area_bookings b
      WHERE b.common_area_id = NEW.common_area_id
        AND b.booking_date = NEW.booking_date
        AND b.deleted_at IS NULL
        AND b.status IN ('pending', 'confirmed')
        AND b.id IS DISTINCT FROM NEW.id
        AND (
          (NEW.start_time >= b.start_time AND NEW.start_time < b.end_time)
          OR (NEW.end_time > b.start_time AND NEW.end_time <= b.end_time)
          OR (NEW.start_time <= b.start_time AND NEW.end_time >= b.end_time)
        )
    ) THEN
      RAISE EXCEPTION 'El horario seleccionado colisiona con otra reserva activa para este espacio.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_check_common_area_booking_overlap
  ON public.common_area_bookings;

CREATE TRIGGER tr_check_common_area_booking_overlap
  BEFORE INSERT OR UPDATE ON public.common_area_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_common_area_booking_overlap();

CREATE OR REPLACE FUNCTION public.prepare_common_area_booking()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT c.management_company_id
  INTO v_company_id
  FROM public.condominiums c
  WHERE c.id = NEW.condominium_id;

  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_superadmin() THEN
      NEW.user_id := auth.uid();
    END IF;

    SELECT ca.fee_amount, ca.deposit_amount
    INTO NEW.fee_amount, NEW.deposit_amount
    FROM public.common_areas ca
    WHERE ca.id = NEW.common_area_id;

    NEW.status := 'pending';
    NEW.deposit_status := 'pending';
    NEW.expense_billed := false;
    NEW.charge_to_expenses := true;
  END IF;

  IF TG_OP = 'UPDATE' AND NOT public.is_superadmin() THEN
    IF public.is_company_member(v_company_id) THEN
      IF NEW.common_area_id IS DISTINCT FROM OLD.common_area_id
        OR NEW.condominium_id IS DISTINCT FROM OLD.condominium_id
        OR NEW.unit_id IS DISTINCT FROM OLD.unit_id
        OR NEW.user_id IS DISTINCT FROM OLD.user_id
        OR NEW.booking_date IS DISTINCT FROM OLD.booking_date
        OR NEW.start_time IS DISTINCT FROM OLD.start_time
        OR NEW.end_time IS DISTINCT FROM OLD.end_time
        OR NEW.guest_count IS DISTINCT FROM OLD.guest_count
        OR NEW.purpose IS DISTINCT FROM OLD.purpose
        OR NEW.fee_amount IS DISTINCT FROM OLD.fee_amount
        OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
        OR NEW.charge_to_expenses IS DISTINCT FROM OLD.charge_to_expenses
        OR NEW.expense_billed IS DISTINCT FROM OLD.expense_billed
        OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
      THEN
        RAISE EXCEPTION 'No autorizado para modificar campos protegidos de la reserva.';
      END IF;
    ELSIF OLD.user_id = auth.uid() THEN
      IF NEW.status NOT IN ('cancelled')
        OR NEW.common_area_id IS DISTINCT FROM OLD.common_area_id
        OR NEW.condominium_id IS DISTINCT FROM OLD.condominium_id
        OR NEW.unit_id IS DISTINCT FROM OLD.unit_id
        OR NEW.user_id IS DISTINCT FROM OLD.user_id
        OR NEW.booking_date IS DISTINCT FROM OLD.booking_date
        OR NEW.start_time IS DISTINCT FROM OLD.start_time
        OR NEW.end_time IS DISTINCT FROM OLD.end_time
        OR NEW.guest_count IS DISTINCT FROM OLD.guest_count
        OR NEW.purpose IS DISTINCT FROM OLD.purpose
        OR NEW.fee_amount IS DISTINCT FROM OLD.fee_amount
        OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
        OR NEW.charge_to_expenses IS DISTINCT FROM OLD.charge_to_expenses
        OR NEW.expense_billed IS DISTINCT FROM OLD.expense_billed
        OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
      THEN
        RAISE EXCEPTION 'No autorizado para modificar esta reserva.';
      END IF;
    ELSE
      RAISE EXCEPTION 'No autorizado para modificar esta reserva.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_prepare_common_area_booking
  ON public.common_area_bookings;

CREATE TRIGGER tr_prepare_common_area_booking
  BEFORE INSERT OR UPDATE ON public.common_area_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prepare_common_area_booking();

ALTER TABLE public.common_area_bookings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.common_area_bookings FROM anon;
REVOKE ALL ON TABLE public.common_area_bookings FROM authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.common_area_bookings
  TO authenticated;
GRANT ALL ON TABLE public.common_area_bookings TO service_role;

DROP POLICY IF EXISTS "Lectura reservas" ON public.common_area_bookings;
DROP POLICY IF EXISTS "Alta reservas" ON public.common_area_bookings;
DROP POLICY IF EXISTS "Edición reservas" ON public.common_area_bookings;

CREATE POLICY "Lectura reservas"
  ON public.common_area_bookings
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_superadmin()
      OR public.is_company_member((
        SELECT c.management_company_id
        FROM public.condominiums c
        WHERE c.id = common_area_bookings.condominium_id
      ))
      OR user_id = auth.uid()
      OR public.owns_unit_in_condominium(condominium_id)
    )
  );

CREATE POLICY "Alta reservas"
  ON public.common_area_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_superadmin()
    OR (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.units u
        JOIN public.condominiums c ON c.id = u.condominium_id
        WHERE u.id = common_area_bookings.unit_id
          AND u.owner_id = auth.uid()
          AND u.deleted_at IS NULL
          AND c.id = common_area_bookings.condominium_id
          AND c.deleted_at IS NULL
          AND (
            public.is_company_member(c.management_company_id)
            OR public.owns_unit_in_condominium(c.id)
          )
      )
      AND EXISTS (
        SELECT 1
        FROM public.common_areas a
        WHERE a.id = common_area_bookings.common_area_id
          AND a.condominium_id = common_area_bookings.condominium_id
          AND a.deleted_at IS NULL
          AND a.status = 'available'
      )
    )
  );

CREATE POLICY "Edición reservas"
  ON public.common_area_bookings
  FOR UPDATE
  TO authenticated
  USING (
    public.is_superadmin()
    OR public.is_company_member((
      SELECT c.management_company_id
      FROM public.condominiums c
      WHERE c.id = common_area_bookings.condominium_id
    ))
    OR user_id = auth.uid()
  )
  WITH CHECK (
    public.is_superadmin()
    OR public.is_company_member((
      SELECT c.management_company_id
      FROM public.condominiums c
      WHERE c.id = common_area_bookings.condominium_id
    ))
    OR user_id = auth.uid()
  );

COMMIT;
