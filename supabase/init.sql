-- ==============================================================================
-- BOILERPLATE MAESTRO: ESQUEMA DE BASE DE DATOS Y AUTENTICACIÓN
-- Compatible con: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLAS DE LOCALIZACIÓN (CHILE)
CREATE TABLE IF NOT EXISTS public.regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roman_numeral VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.communes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region_id INT REFERENCES public.regions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. TABLA DE PERFILES DE USUARIOS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    second_name VARCHAR(100),
    last_name VARCHAR(100),
    second_last_name VARCHAR(100),
    full_name VARCHAR(255),
    rut VARCHAR(20) UNIQUE,
    phone VARCHAR(30),
    birth_date DATE,
    street VARCHAR(150),
    street_number VARCHAR(30),
    dept_unit VARCHAR(50),
    region_id INT REFERENCES public.regions(id) ON DELETE SET NULL,
    commune_id INT REFERENCES public.communes(id) ON DELETE SET NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_profiles_rut ON public.profiles(rut);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_communes_region ON public.communes(region_id);

-- 5. FUNCIONES DE SEGURIDAD Y CONTROL (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$SELECT EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'active' );$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ BEGIN NEW.updated_at = TIMEZONE('utc', NOW()); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ BEGIN INSERT INTO public.profiles (id, full_name, role, status) VALUES ( NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), COALESCE(NEW.raw_user_meta_data->>'role', 'user'), 'active' ); RETURN NEW; END; $$;

-- 6. TRIGGERS
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Regiones y Comunas: Lectura pública
CREATE POLICY "Public read regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Public read communes" ON public.communes FOR SELECT USING (true);

-- Perfiles: Lectura propia o administrador
CREATE POLICY "Users and admins can view profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Perfiles: Modificación propia o administrador
CREATE POLICY "Users update own profile or admin updates any" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 8. CONFIGURACIÓN DE STORAGE (BUCKET AVATARS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatar authenticated insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Avatar authenticated update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 9. SIEMBRA BASE DE REGIONES (CHILE)
INSERT INTO public.regions (id, name, roman_numeral) VALUES
(1, 'Arica y Parinacota', 'XV'),
(2, 'Tarapacá', 'I'),
(3, 'Antofagasta', 'II'),
(4, 'Atacama', 'III'),
(5, 'Coquimbo', 'IV'),
(6, 'Valparaíso', 'V'),
(7, 'Metropolitana de Santiago', 'RM'),
(8, 'Libertador General Bernardo O''Higgins', 'VI'),
(9, 'Maule', 'VII'),
(10, 'Ñuble', 'XVI'),
(11, 'Biobío', 'VIII'),
(12, 'La Araucanía', 'IX'),
(13, 'Los Ríos', 'XIV'),
(14, 'Los Lagos', 'X'),
(15, 'Aysén del General Carlos Ibáñez del Campo', 'XI'),
(16, 'Magallanes y de la Antártica Chilena', 'XII')
ON CONFLICT (id) DO NOTHING;
SELECT setval('regions_id_seq', (SELECT MAX(id) FROM public.regions));
