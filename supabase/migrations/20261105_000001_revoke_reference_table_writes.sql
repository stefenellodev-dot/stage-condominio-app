BEGIN;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.regions, public.communes
  FROM anon, authenticated;

GRANT SELECT ON TABLE public.regions, public.communes
  TO anon, authenticated;

COMMIT;
