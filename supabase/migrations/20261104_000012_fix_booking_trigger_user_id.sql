BEGIN;

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
    IF NOT public.is_superadmin() AND NEW.user_id IS NULL THEN
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

COMMIT;
