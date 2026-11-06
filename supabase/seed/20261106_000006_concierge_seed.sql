DO $$
DECLARE
  c1_id UUID; c2_id UUID; c3_id UUID;
  u_concierge1 UUID; u_concierge2 UUID; u_concierge3 UUID;
  v_pw_hash TEXT;
  unit_almagro UUID; owner_almagro UUID;
  unit_encinas UUID; owner_encinas UUID;
  unit_poniente UUID; owner_poniente UUID;
BEGIN
  SELECT id INTO c1_id FROM public.condominiums WHERE rut = '65.102.345-8';
  SELECT id INTO c2_id FROM public.condominiums WHERE rut = '65.340.912-1';
  SELECT id INTO c3_id FROM public.condominiums WHERE rut = '65.980.114-K';

  IF c1_id IS NULL OR c2_id IS NULL OR c3_id IS NULL THEN
    RAISE NOTICE 'Uno o más condominios no encontrados';
    RETURN;
  END IF;

  SELECT id, owner_id INTO unit_almagro, owner_almagro FROM public.units WHERE condominium_id = c1_id AND unit_number = '502' LIMIT 1;
  SELECT id, owner_id INTO unit_encinas, owner_encinas FROM public.units WHERE condominium_id = c2_id AND unit_number = 'Casa 10' LIMIT 1;
  SELECT id, owner_id INTO unit_poniente, owner_poniente FROM public.units WHERE condominium_id = c3_id AND unit_number = 'Oficina 304' LIMIT 1;

  IF unit_almagro IS NULL OR unit_encinas IS NULL OR unit_poniente IS NULL THEN
    RAISE NOTICE 'Una o más unidades no encontradas';
    RETURN;
  END IF;

  v_pw_hash := crypt('Test1234$', gen_salt('bf'));

  -- Eliminar datos previos para idempotencia
  DELETE FROM public.concierge_logbook WHERE condominium_id IN (c1_id, c2_id, c3_id);
  DELETE FROM public.parcels WHERE condominium_id IN (c1_id, c2_id, c3_id);
  DELETE FROM public.visitor_logs WHERE condominium_id IN (c1_id, c2_id, c3_id);
  DELETE FROM public.profiles WHERE email LIKE 'conserje.%@condominio-stage.cl';
  DELETE FROM auth.users WHERE email LIKE 'conserje.%@condominio-stage.cl';

  -- Desactivar trigger de protección de perfiles temporalmente
  ALTER TABLE public.profiles DISABLE TRIGGER tr_protect_profile_sensitive_fields;

  -- ================================================================
  -- 1. CREAR 3 USUARIOS CONSERJE en auth.users
  -- ================================================================

  u_concierge1 := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at)
  VALUES (u_concierge1, '00000000-0000-0000-0000-000000000000', 'conserje.almagro@condominio-stage.cl', v_pw_hash, '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos Valenzuela Ríos","role":"concierge"}', 'authenticated', 'authenticated', now(), now());

  u_concierge2 := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at)
  VALUES (u_concierge2, '00000000-0000-0000-0000-000000000000', 'conserje.encinas@condominio-stage.cl', v_pw_hash, '{"provider":"email","providers":["email"]}', '{"full_name":"Manuel Bustamante Vera","role":"concierge"}', 'authenticated', 'authenticated', now(), now());

  u_concierge3 := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at)
  VALUES (u_concierge3, '00000000-0000-0000-0000-000000000000', 'conserje.poniente@condominio-stage.cl', v_pw_hash, '{"provider":"email","providers":["email"]}', '{"full_name":"Esteban Morales Fuentes","role":"concierge"}', 'authenticated', 'authenticated', now(), now());

  -- Configurar request.jwt.claims para que el trigger de RLS de perfiles permita la operación
  PERFORM set_config('request.jwt.claims', '{"role":"authenticated","sub":"' || u_concierge1 || '"}', true);

  -- 2. Crear perfiles en public.profiles (usar ON CONFLICT porque el trigger on_auth_user_created ya creó el perfil)
  INSERT INTO public.profiles (id, email, first_name, last_name, full_name, rut, role, status, condominium_id)
  VALUES (u_concierge1, 'conserje.almagro@condominio-stage.cl', 'Carlos', 'Valenzuela', 'Carlos Valenzuela Ríos', '13.441.209-4', 'concierge', 'active', c1_id)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name,
    rut = EXCLUDED.rut,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    condominium_id = EXCLUDED.condominium_id;

  INSERT INTO public.profiles (id, email, first_name, last_name, full_name, rut, role, status, condominium_id)
  VALUES (u_concierge2, 'conserje.encinas@condominio-stage.cl', 'Manuel', 'Bustamante', 'Manuel Bustamante Vera', '14.210.883-2', 'concierge', 'active', c2_id)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name,
    rut = EXCLUDED.rut,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    condominium_id = EXCLUDED.condominium_id;

  INSERT INTO public.profiles (id, email, first_name, last_name, full_name, rut, role, status, condominium_id)
  VALUES (u_concierge3, 'conserje.poniente@condominio-stage.cl', 'Esteban', 'Morales', 'Esteban Morales Fuentes', '15.902.114-K', 'concierge', 'active', c3_id)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name,
    rut = EXCLUDED.rut,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    condominium_id = EXCLUDED.condominium_id;

  -- 3. Poblar Visitas Activas
  IF unit_almagro IS NOT NULL THEN
    INSERT INTO public.visitor_logs (condominium_id, unit_id, visitor_name, visitor_rut, vehicle_plate, parking_spot, entry_time, registered_by, status, notes)
    VALUES (c1_id, unit_almagro, 'Andrés Palacios Tapia', '16.782.110-3', 'LH-99-42', 'V-04', now() - INTERVAL '1 hour 20 minutes', u_concierge1, 'inside', 'Visita autorizada por citófono.'),
           (c1_id, unit_almagro, 'Mariana Vergara Silva', '18.452.901-7', NULL, NULL, now() - INTERVAL '3 hours', u_concierge1, 'exited', 'Salida registrada 12:45.');
  END IF;

  IF unit_encinas IS NOT NULL THEN
    INSERT INTO public.visitor_logs (condominium_id, unit_id, visitor_name, visitor_rut, vehicle_plate, parking_spot, entry_time, registered_by, status, notes)
    VALUES (c2_id, unit_encinas, 'Javier Carrasco Pinto', '15.223.119-8', 'PR-88-21', 'V-02', now() - INTERVAL '45 minutes', u_concierge2, 'inside', 'Jardinero particular.');
  END IF;

  -- 4. Poblar Paquetes
  IF unit_almagro IS NOT NULL THEN
    INSERT INTO public.parcels (condominium_id, unit_id, carrier, tracking_number, package_type, pickup_pin, received_at, received_by, status)
    VALUES (c1_id, unit_almagro, 'chilexpress', 'CHX-994102941', 'caja', '4821', now() - INTERVAL '2 hours', u_concierge1, 'received'),
           (c1_id, unit_almagro, 'mercado_libre', 'MELI-CL-88102', 'sobre', '7109', now() - INTERVAL '4 hours', u_concierge1, 'notified');
  END IF;

  IF unit_encinas IS NOT NULL THEN
    INSERT INTO public.parcels (condominium_id, unit_id, carrier, tracking_number, package_type, pickup_pin, received_at, received_by, picked_up_at, picked_up_by_name, status)
    VALUES (c2_id, unit_encinas, 'blue_express', 'BLU-882103', 'bulto_grande', '9032', now() - INTERVAL '1 day', u_concierge2, now() - INTERVAL '18 hours', 'Valentina Muñoz', 'delivered');
  END IF;

  -- 5. Novedades de Turno (Libro Digital)
  INSERT INTO public.concierge_logbook (condominium_id, shift, entry_type, title, description, author_id, status)
  VALUES (c1_id, 'morning', 'inspeccion_ronda', 'Ronda perimetral y revisión de portón San Diego', 'Se completa ronda a las 09:30. Portón vehicular oriente responde sin anomalías. Iluminación operativa.', u_concierge1, 'resolved'),
         (c1_id, 'afternoon', 'ruidos_molestos', 'Reclamo por música en terraza común piso 14', 'Residente de depto 1301 informa volumen excesivo. Conserjería concurre y se advierte al usuario del quincho.', u_concierge1, 'open'),
         (c2_id, 'morning', 'visita_tecnica', 'Ingreso empresa mantenedora de bombas', 'Ingresan dos técnicos de HidroChicureo a sala de presurización central. Concluyen sin novedad.', u_concierge2, 'resolved');

  -- Reactivar trigger
  ALTER TABLE public.profiles ENABLE TRIGGER tr_protect_profile_sensitive_fields;

  RAISE NOTICE 'Conexión completada: usuario y perfil creados con éxito.';
END $$;
