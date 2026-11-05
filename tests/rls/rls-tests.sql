-- Pruebas automatizadas de RLS para stage-condominio-app
-- Ejecutar con:
--   ssh piave "podman exec -i condo-sb-db psql -U postgres -d postgres -v ON_ERROR_STOP=0 -At" < tests/rls/rls-tests.sql
--
-- Emula el rol `authenticated` de Supabase usando request.jwt.claims.
-- Los IDs corresponden a los datos de escenario:
--   superadmin     e64b00b9-8630-4f0b-98fa-ba18bf3c06fc
--   javier (admin) c11fb63c-e55d-4cd3-8cdc-68f7d5b6e21b  (empresa b660307d)
--   almagro.101    f0750053-6996-420d-8f63-31c7ae18fa42  (unidad c6181dc3)
--   almagro.402    92076747-aca1-442d-8c23-9bb6f1ee400f
--   encinas.c1     f1fc95dd-962e-4b7c-8c2c-6dda7f664888
--   empresa b660307d-bcbb-4bd8-a4f7-d5340e338e38
--   condominio Almagro e8372d2e-0e16-46ca-a535-f44372b3cf9d
--   unidad almagro.101 c6181dc3-caf9-436f-9dfb-593604f8bd9e
--   reserva pendiente de almagro.402 acd0ca65-82e3-448b-b11d-12a7819595fe
--   reserva confirmada de almagro.101 0f5b1935-50e9-4ec8-893c-97dec6294267

-- ===== 0. Harness =====
DROP SCHEMA IF EXISTS rls_tests CASCADE;
CREATE SCHEMA rls_tests;

CREATE OR REPLACE FUNCTION rls_tests.check(
  claims jsonb,
  label text,
  kind text,      -- 'bool' | 'rows' | 'affects' | 'error'
  expected bigint,
  stmt text
) RETURNS text
LANGUAGE plpgsql
AS $fn$
DECLARE
  cnt bigint;
  ok boolean;
  pass boolean;
  err_state text;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', claims::text, true);

  BEGIN
    IF kind = 'bool' THEN
      EXECUTE stmt INTO ok;
      pass := (ok = (expected = 1));
      cnt := CASE WHEN ok THEN 1 ELSE 0 END;
    ELSIF kind = 'rows' THEN
      EXECUTE stmt INTO cnt;
    ELSIF kind = 'affects' THEN
      EXECUTE stmt;
      GET DIAGNOSTICS cnt = ROW_COUNT;
    ELSIF kind = 'error' THEN
      EXECUTE stmt; -- no debe llegar aquí
      RETURN 'FAIL|' || label || '|se esperaba error y se ejecutó sin fallo';
    END IF;

    IF kind <> 'bool' THEN
      pass := (cnt = expected);
    END IF;

    IF pass THEN
      RETURN 'PASS|' || label;
    ELSE
      RETURN 'FAIL|' || label || '|Esperado=' || expected || ' obtenido=' || cnt;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    err_state := SQLSTATE;
    IF kind = 'error' THEN
      RETURN 'PASS|' || label || '|err=' || err_state;
    ELSE
      RETURN 'FAIL|' || label || '|error inesperado=' || err_state;
    END IF;
  END;
END;
$fn$;

-- ===== 1. Fixtures (transacción aparte, se limpian al final) =====
BEGIN;
INSERT INTO public.management_companies
  (rut, legal_name, legal_rep_name, legal_rep_rut, status, has_guarantee_insurance, email, minvu_status)
VALUES
  ('99.999.999-9', 'ZZZ RLS Test Company SA', 'RLS Test SA', '99.999.999-9',
   'active', false, 'rlsfix@test.com', 'active');
INSERT INTO public.condominiums
  (management_company_id, name, rut, sii_property_role, type, destination, total_units,
   street, street_number, bank_name, account_type, account_number, status)
SELECT mc.id,
       'ZZZ RLS Other Condominio', '99.999.999-8', '9999-99', 'tipo_a', 'habitacional', 1,
       'Calle ZZZ', '1', 'Banco ZZZ', 'corriente', '99999999', 'active'
FROM public.management_companies mc
WHERE mc.email = 'rlsfix@test.com';
INSERT INTO public.units
  (condominium_id, unit_number, unit_type, aliquot, status)
SELECT c.id, 'ZZZ-01', 'departamento', 1.0, 'active'
FROM public.condominiums c
WHERE c.name = 'ZZZ RLS Other Condominio';
INSERT INTO public.common_areas
  (condominium_id, name, area_type, capacity, requires_booking, fee_amount, deposit_amount, status)
SELECT c.id, 'ZZZ Quincho', 'quincho', 10, true, 0, 0, 'available'
FROM public.condominiums c
WHERE c.name = 'ZZZ RLS Other Condominio';
COMMIT;

-- ===== 2. Casos =====
-- 2.1 Perfiles
BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '01 user ve solo su propio perfil', 'rows', 1,
  $q$SELECT count(*) FROM public.profiles$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '02 user NO ve el perfil de otro usuario', 'bool', 1,
  $q$SELECT count(*) = 0 FROM public.profiles WHERE email = 'superadmin@test.com'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"c11fb63c-e55d-4cd3-8cdc-68f7d5b6e21b"}',
  '03 admin ve los perfiles de su empresa', 'bool', 1,
  $q$SELECT count(*) >= 100 FROM public.profiles$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '04 user no puede escalar rol a superadmin en su perfil', 'error', 0,
  $q$UPDATE public.profiles SET role = 'superadmin' WHERE id = 'f0750053-6996-420d-8f63-31c7ae18fa42'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '05 user puede editar su propio teléfono', 'affects', 1,
  $q$UPDATE public.profiles SET phone = '+56999999999' WHERE id = 'f0750053-6996-420d-8f63-31c7ae18fa42'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '06 user no puede editar el perfil de otro (0 filas)', 'affects', 0,
  $q$UPDATE public.profiles SET phone = '+56999999999' WHERE email = 'encinas.c1@test.com'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"c11fb63c-e55d-4cd3-8cdc-68f7d5b6e21b"}',
  '07 admin no puede editar el perfil de otro (0 filas)', 'affects', 0,
  $q$UPDATE public.profiles SET phone = '+56999999999' WHERE email = 'encinas.c1@test.com'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"e64b00b9-8630-4f0b-98fa-ba18bf3c06fc"}',
  '08 superadmin puede editar el perfil de un user', 'affects', 1,
  $q$UPDATE public.profiles SET phone = '+56988888888' WHERE email = 'encinas.c1@test.com'$q$);
ROLLBACK;

-- 2.2 Unidades
BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '09 user ve su propia unidad', 'bool', 1,
  $q$SELECT count(*) = 1 FROM public.units WHERE owner_id = 'f0750053-6996-420d-8f63-31c7ae18fa42'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '10 user ve solo 1 unidad (no unidades de terceros ni cross-condominio)', 'rows', 1,
  $q$SELECT count(*) FROM public.units$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"c11fb63c-e55d-4cd3-8cdc-68f7d5b6e21b"}',
  '11 admin ve las unidades de su empresa', 'bool', 1,
  $q$SELECT count(*) >= 250 FROM public.units$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"c11fb63c-e55d-4cd3-8cdc-68f7d5b6e21b"}',
  '12 admin NO ve la unidad de la otra empresa (cross-company)', 'bool', 1,
  $q$SELECT count(*) = 0 FROM public.units WHERE unit_number = 'ZZZ-01'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"c11fb63c-e55d-4cd3-8cdc-68f7d5b6e21b"}',
  '13 admin no puede editar unidad de otra empresa (0 filas)', 'affects', 0,
  $q$UPDATE public.units SET aliquot = 2.0 WHERE unit_number = 'ZZZ-01'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '14 user no puede crear unidades', 'error', 0,
  $q$INSERT INTO public.units (condominium_id, unit_number, unit_type, aliquot, status)
      VALUES ('e8372d2e-0e16-46ca-a535-f44372b3cf9d', 'ZZZ-USER', 'departamento', 1.0, 'available')$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '15 user no puede editar su propia unidad (0 filas)', 'affects', 0,
  $q$UPDATE public.units SET aliquot = 5.0 WHERE id = 'c6181dc3-caf9-436f-9dfb-593604f8bd9e'$q$);
ROLLBACK;

-- 2.3 Reservas de espacio común
BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '16 user ve sus propias reservas', 'bool', 1,
  $q$SELECT count(*) >= 1 FROM public.common_area_bookings WHERE user_id = 'f0750053-6996-420d-8f63-31c7ae18fa42'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '17 user dueño de unidad ve el calendario de reservas de su condominio', 'bool', 1,
  $q$SELECT count(*) >= 1 FROM public.common_area_bookings WHERE user_id = '92076747-aca1-442d-8c23-9bb6f1ee400f'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"c11fb63c-e55d-4cd3-8cdc-68f7d5b6e21b"}',
  '18 admin ve las reservas de su empresa', 'bool', 1,
  $q$SELECT count(*) >= 4 FROM public.common_area_bookings$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f1fc95dd-962e-4b7c-8c2c-6dda7f664888"}',
  '19 user de Encinas ve las reservas de su condominio', 'bool', 1,
  $q$SELECT count(*) >= 1 FROM public.common_area_bookings WHERE condominium_id = 'a117da72-2f54-4d7a-8f08-9dc4aff1afed'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f1fc95dd-962e-4b7c-8c2c-6dda7f664888"}',
  '19b user de Encinas NO ve reservas de otro condominio (cross-condominio)', 'bool', 1,
  $q$SELECT count(*) = 0 FROM public.common_area_bookings WHERE condominium_id IS DISTINCT FROM 'a117da72-2f54-4d7a-8f08-9dc4aff1afed'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '20 user no puede aprobar su propia reserva', 'error', 0,
  $q$UPDATE public.common_area_bookings SET status = 'confirmed' WHERE id = '0f5b1935-50e9-4ec8-893c-97dec6294267'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '21 user puede cancelar su propia reserva', 'affects', 1,
  $q$UPDATE public.common_area_bookings SET status = 'cancelled' WHERE id = '0f5b1935-50e9-4ec8-893c-97dec6294267'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"c11fb63c-e55d-4cd3-8cdc-68f7d5b6e21b"}',
  '22 admin puede aprobar reserva de su empresa', 'affects', 1,
  $q$UPDATE public.common_area_bookings SET status = 'confirmed' WHERE id = 'acd0ca65-82e3-448b-b11d-12a7819595fe'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"c11fb63c-e55d-4cd3-8cdc-68f7d5b6e21b"}',
  '23 admin no puede cambiar campos protegidos de la reserva', 'error', 0,
  $q$UPDATE public.common_area_bookings SET booking_date = CURRENT_DATE + 90 WHERE id = 'acd0ca65-82e3-448b-b11d-12a7819595fe'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '24 user no puede aprobar reserva de otro (0 filas)', 'affects', 0,
  $q$UPDATE public.common_area_bookings SET status = 'confirmed' WHERE id = 'acd0ca65-82e3-448b-b11d-12a7819595fe'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '25 user puede crear su propia reserva', 'affects', 1,
  $q$INSERT INTO public.common_area_bookings
      (condominium_id, common_area_id, unit_id, booking_date, start_time, end_time, guest_count, purpose)
      VALUES ('e8372d2e-0e16-46ca-a535-f44372b3cf9d', '7272e93d-0047-4b0e-a41f-bed83e0b2c5c',
              'c6181dc3-caf9-436f-9dfb-593604f8bd9e', CURRENT_DATE + 45, '12:00', '13:00', 2, 'RLS TEST')$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '26 user no puede crear reserva a nombre de otro usuario', 'error', 0,
  $q$INSERT INTO public.common_area_bookings
      (condominium_id, common_area_id, unit_id, user_id, booking_date, start_time, end_time, guest_count, purpose)
      VALUES ('e8372d2e-0e16-46ca-a535-f44372b3cf9d', '7272e93d-0047-4b0e-a41f-bed83e0b2c5c',
              'c6181dc3-caf9-436f-9dfb-593604f8bd9e', '92076747-aca1-442d-8c23-9bb6f1ee400f',
              CURRENT_DATE + 46, '12:00', '13:00', 2, 'RLS TEST')$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '27 user no crea reservas en condominio ajeno (0 filas: RLS oculta la zona)', 'affects', 0,
  $q$INSERT INTO public.common_area_bookings
      (condominium_id, common_area_id, unit_id, booking_date, start_time, end_time, guest_count, purpose)
      SELECT c.id, ca.id, 'c6181dc3-caf9-436f-9dfb-593604f8bd9e', CURRENT_DATE + 47, '12:00', '13:00', 2, 'RLS TEST'
      FROM public.common_areas ca JOIN public.condominiums c ON c.id = ca.condominium_id
      WHERE c.name = 'ZZZ RLS Other Condominio' LIMIT 1$q$);
ROLLBACK;

-- 2.4 Avatares privados (storage)
BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '28 user NO ve objetos de avatar de otro usuario', 'bool', 1,
  $q$SELECT count(*) = 0 FROM storage.objects
      WHERE bucket_id = 'avatars' AND (storage.foldername(name))[1] IS DISTINCT FROM 'f0750053-6996-420d-8f63-31c7ae18fa42'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f1fc95dd-962e-4b7c-8c2c-6dda7f664888"}',
  '29 user del otro condominio solo ve objetos de su carpeta de avatares', 'bool', 1,
  $q$SELECT count(*) = 0 FROM storage.objects
      WHERE bucket_id = 'avatars' AND (storage.foldername(name))[1] IS DISTINCT FROM 'f1fc95dd-962e-4b7c-8c2c-6dda7f664888'$q$);
ROLLBACK;

-- 2.5 Tablas de referencia (grants revocados)
BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"f0750053-6996-420d-8f63-31c7ae18fa42"}',
  '30 user no puede escribir en regions', 'error', 0,
  $q$INSERT INTO public.regions (name) VALUES ('ZZZ')$q$);
ROLLBACK;

-- 2.6 Superadmin: acceso completo
BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"e64b00b9-8630-4f0b-98fa-ba18bf3c06fc"}',
  '31 superadmin ve la empresa del fixture', 'bool', 1,
  $q$SELECT count(*) = 1 FROM public.management_companies WHERE email = 'rlsfix@test.com'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"e64b00b9-8630-4f0b-98fa-ba18bf3c06fc"}',
  '32 superadmin ve la unidad de la otra empresa', 'bool', 1,
  $q$SELECT count(*) = 1 FROM public.units WHERE unit_number = 'ZZZ-01'$q$);
ROLLBACK;

BEGIN;
SELECT rls_tests.check(
  '{"role":"authenticated","sub":"e64b00b9-8630-4f0b-98fa-ba18bf3c06fc"}',
  '33 superadmin ve todas las reservas', 'bool', 1,
  $q$SELECT count(*) >= 4 FROM public.common_area_bookings$q$);
ROLLBACK;

-- ===== 3. Limpieza de fixtures =====
BEGIN;
DELETE FROM public.units WHERE unit_number = 'ZZZ-01';
DELETE FROM public.condominiums WHERE name = 'ZZZ RLS Other Condominio';
DELETE FROM public.management_companies WHERE email = 'rlsfix@test.com';
DROP SCHEMA IF EXISTS rls_tests CASCADE;
COMMIT;
