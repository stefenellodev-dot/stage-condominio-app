-- 20261106_000001_profiles_rut_unique.sql
-- Garantiza unicidad de RUT en profiles (antes solo se manejaba el error 23505 en UI).
-- Idempotente: no se recrea si ya existe; no se aplica si hay duplicados (aviso).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_rut_unique'
  ) THEN
    IF EXISTS (
      SELECT rut FROM public.profiles
      WHERE rut IS NOT NULL
      GROUP BY rut HAVING count(*) > 1
    ) THEN
      RAISE NOTICE 'profiles.rut has duplicates; skipping UNIQUE constraint';
    ELSE
      ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_rut_unique UNIQUE (rut);
    END IF;
  END IF;
END $$;
