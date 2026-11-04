BEGIN;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS "Lectura de perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Actualización de propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin gestion total perfiles" ON public.profiles;

CREATE POLICY "Lectura de perfiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_superadmin());

CREATE POLICY "Actualización de perfiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_superadmin())
WITH CHECK (auth.uid() = id OR public.is_superadmin());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_superadmin() AND (
    NEW.id IS DISTINCT FROM OLD.id OR
    NEW.email IS DISTINCT FROM OLD.email OR
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.status IS DISTINCT FROM OLD.status OR
    NEW.deleted_at IS DISTINCT FROM OLD.deleted_at OR
    NEW.created_at IS DISTINCT FROM OLD.created_at OR
    NEW.updated_at IS DISTINCT FROM OLD.updated_at
  ) THEN
    RAISE EXCEPTION 'No autorizado para modificar campos protegidos del perfil';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tr_protect_superadmin ON public.profiles;
DROP TRIGGER IF EXISTS tr_protect_profile_sensitive_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_sensitive_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_sensitive_fields();

DROP FUNCTION IF EXISTS public.protect_superadmin_role();

COMMIT;
