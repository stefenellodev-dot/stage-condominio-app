\set ON_ERROR_STOP on

BEGIN;

-- Superadmin
SELECT set_config('request.jwt.claims', '{"sub":"e64b00b9-8630-4f0b-98fa-ba18bf3c06fc","role":"authenticated"}', true);
SET ROLE authenticated;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.management_companies) <> 10 THEN
    RAISE EXCEPTION 'superadmin companies expected 10, got %', (SELECT count(*) FROM public.management_companies);
  END IF;
  IF (SELECT count(*) FROM public.condominiums) <> 3 THEN
    RAISE EXCEPTION 'superadmin condominiums expected 3, got %', (SELECT count(*) FROM public.condominiums);
  END IF;
  IF (SELECT count(*) FROM public.units) <> 292 THEN
    RAISE EXCEPTION 'superadmin units expected 292, got %', (SELECT count(*) FROM public.units);
  END IF;
  IF (SELECT count(*) FROM public.common_areas) <> 15 THEN
    RAISE EXCEPTION 'superadmin common areas expected 15, got %', (SELECT count(*) FROM public.common_areas);
  END IF;
  IF (SELECT count(*) FROM public.common_area_bookings) <> 4 THEN
    RAISE EXCEPTION 'superadmin bookings expected 4, got %', (SELECT count(*) FROM public.common_area_bookings);
  END IF;
END $$;

RESET ROLE;

-- Admin (Javier, Los Andes)
SELECT set_config('request.jwt.claims', '{"sub":"c11fb63c-e55d-4cd3-8cdc-68f7d5b6e21b","role":"authenticated"}', true);
SET ROLE authenticated;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.management_companies) <> 1 THEN
    RAISE EXCEPTION 'admin companies expected 1, got %', (SELECT count(*) FROM public.management_companies);
  END IF;
  IF (SELECT count(*) FROM public.condominiums) <> 3 THEN
    RAISE EXCEPTION 'admin condominiums expected 3, got %', (SELECT count(*) FROM public.condominiums);
  END IF;
  IF (SELECT count(*) FROM public.units) <> 292 THEN
    RAISE EXCEPTION 'admin units expected 292, got %', (SELECT count(*) FROM public.units);
  END IF;
  IF (SELECT count(*) FROM public.common_areas) <> 15 THEN
    RAISE EXCEPTION 'admin common areas expected 15, got %', (SELECT count(*) FROM public.common_areas);
  END IF;
  IF (SELECT count(*) FROM public.common_area_bookings) <> 4 THEN
    RAISE EXCEPTION 'admin bookings expected 4, got %', (SELECT count(*) FROM public.common_area_bookings);
  END IF;
  IF (SELECT count(*) FROM public.management_companies WHERE id <> 'b660307d-bcbb-4bd8-a4f7-d5340e338e38') <> 0 THEN
    RAISE EXCEPTION 'admin can see companies outside Los Andes';
  END IF;
END $$;

-- Admin cannot create a booking for another user.
DO $$
BEGIN
  BEGIN
    INSERT INTO public.common_area_bookings (
      condominium_id, common_area_id, unit_id, user_id, booking_date, start_time, end_time
    )
    SELECT c.id, a.id, u.id, '0b7879bb-6ded-403d-9853-a004c5f5edf5'::uuid,
           CURRENT_DATE + 10, '10:00'::time, '11:00'::time
    FROM public.condominiums c
    JOIN public.common_areas a ON a.condominium_id = c.id
    JOIN public.units u ON u.condominium_id = c.id
    WHERE c.rut = '65.102.345-8'
      AND a.area_type = 'piscina'
      AND u.unit_number = '101'
    LIMIT 1;
    RAISE EXCEPTION 'admin created a booking for another user';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT ILIKE '%row-level security%' AND SQLERRM NOT ILIKE '%policy%' THEN
      RAISE;
    END IF;
  END;
END $$;

-- Admin can approve a pending booking of its company.
DO $$
DECLARE v_booking uuid;
BEGIN
  SELECT id INTO v_booking
  FROM public.common_area_bookings
  WHERE status = 'pending'
  LIMIT 1;

  UPDATE public.common_area_bookings
  SET status = 'confirmed', deposit_status = 'deposited'
  WHERE id = v_booking;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin could not approve pending booking';
  END IF;
END $$;

RESET ROLE;

-- User (owner of unit 102)
SELECT set_config('request.jwt.claims', '{"sub":"59bc5f3f-a825-43a9-92c5-f3b0c1ff20a0","role":"authenticated"}', true);
SET ROLE authenticated;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.units) <> 1 THEN
    RAISE EXCEPTION 'user units expected 1, got %', (SELECT count(*) FROM public.units);
  END IF;
  IF (SELECT count(*) FROM public.condominiums) <> 1 THEN
    RAISE EXCEPTION 'user condominiums expected 1, got %', (SELECT count(*) FROM public.condominiums);
  END IF;
  IF (SELECT count(*) FROM public.management_companies) <> 1 THEN
    RAISE EXCEPTION 'user companies expected 1, got %', (SELECT count(*) FROM public.management_companies);
  END IF;
  IF (SELECT count(*) FROM public.common_areas) <> 5 THEN
    RAISE EXCEPTION 'user common areas expected 5, got %', (SELECT count(*) FROM public.common_areas);
  END IF;
  IF (SELECT count(*) FROM public.common_area_bookings) <> 2 THEN
    RAISE EXCEPTION 'user bookings expected 2, got %', (SELECT count(*) FROM public.common_area_bookings);
  END IF;
END $$;

-- User cannot update a unit that is not theirs.
DO $$
DECLARE v_other_unit uuid;
BEGIN
  SELECT id INTO v_other_unit
  FROM public.units
  WHERE owner_id <> auth.uid()
  LIMIT 1;

  UPDATE public.units
  SET status = 'inactive'
  WHERE id = v_other_unit;

  IF FOUND THEN
    RAISE EXCEPTION 'user updated another unit';
  END IF;
END $$;

-- User cannot update their own unit (read-only at DB level).
DO $$
BEGIN
  UPDATE public.units
  SET status = 'inactive'
  WHERE owner_id = auth.uid();

  IF FOUND THEN
    RAISE EXCEPTION 'user updated own unit';
  END IF;
END $$;

-- User cannot escalate their profile role.
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles
    SET role = 'superadmin'
    WHERE id = auth.uid();
    RAISE EXCEPTION 'user escalated role';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT ILIKE '%No autorizado%' THEN
      RAISE;
    END IF;
  END;
END $$;

-- User can create a booking for their own unit.
DO $$
DECLARE
  v_area uuid;
  v_unit uuid;
  v_booking uuid;
BEGIN
  SELECT id INTO v_area
  FROM public.common_areas
  WHERE area_type = 'piscina'
  LIMIT 1;

  SELECT id INTO v_unit
  FROM public.units
  WHERE owner_id = auth.uid()
  LIMIT 1;

  INSERT INTO public.common_area_bookings (
    condominium_id, common_area_id, unit_id, user_id,
    booking_date, start_time, end_time, guest_count, purpose
  )
  SELECT c.id, v_area, v_unit, auth.uid(),
         CURRENT_DATE + 30, '10:00'::time, '11:00'::time, 2, 'Prueba RLS'
  FROM public.condominiums c
  WHERE c.id = (SELECT condominium_id FROM public.units WHERE id = v_unit)
  RETURNING id INTO v_booking;
  -- RESULT_OID is not row id; verify by count instead.
  IF (SELECT count(*) FROM public.common_area_bookings WHERE user_id = auth.uid() AND purpose = 'Prueba RLS') <> 1 THEN
    RAISE EXCEPTION 'user booking was not created';
  END IF;

  -- User can cancel their own booking.
  UPDATE public.common_area_bookings
  SET status = 'cancelled', cancellation_reason = 'Prueba RLS'
  WHERE user_id = auth.uid()
    AND purpose = 'Prueba RLS';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user could not cancel own booking';
  END IF;
END $$;

RESET ROLE;

-- Anon has no access to business tables.
SET ROLE anon;

DO $$
BEGIN
  BEGIN
    PERFORM count(*) FROM public.management_companies;
    RAISE EXCEPTION 'anon can read management_companies';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM count(*) FROM public.condominiums;
    RAISE EXCEPTION 'anon can read condominiums';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM count(*) FROM public.units;
    RAISE EXCEPTION 'anon can read units';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM count(*) FROM public.common_areas;
    RAISE EXCEPTION 'anon can read common_areas';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM count(*) FROM public.common_area_bookings;
    RAISE EXCEPTION 'anon can read common_area_bookings';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END $$;

RESET ROLE;

ROLLBACK;
