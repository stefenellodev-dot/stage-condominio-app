BEGIN;

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_superadmin() THEN
    RETURN NEW;
  ELSIF public.is_admin() THEN
    IF (to_jsonb(NEW) - ARRAY['id', 'email', 'role', 'status', 'deleted_at', 'created_at', 'updated_at']) IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['id', 'email', 'role', 'status', 'deleted_at', 'created_at', 'updated_at']) THEN
      RAISE EXCEPTION 'No autorizado para modificar campos protegidos del perfil';
    END IF;
  ELSE
    IF (to_jsonb(NEW) - ARRAY['phone', 'emergency_phone', 'website', 'avatar_url']) IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['phone', 'emergency_phone', 'website', 'avatar_url']) THEN
      RAISE EXCEPTION 'No autorizado para modificar campos protegidos del perfil';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
