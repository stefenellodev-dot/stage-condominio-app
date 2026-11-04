# Seguridad — Condominio App

> **Estado:** preproducción de prueba. Hardening de perfiles aplicado 2026-11-04; Inbucket sigue expuesto temporalmente en Tailscale por decisión de pruebas.
>
> Este documento resume el modelo de seguridad y el estado real. La evidencia histórica está en la [auditoría profunda](../auditoria_profunda_condominio_2026-11-03.md).

---

## 1. Modelo de amenazas

| Actor | Capacidad | Riesgo principal |
|---|---|---|
| Visitante con la anon key | La key es pública y está en el bundle | No lee `profiles`; los avatares siguen siendo públicos |
| Usuario autenticado | Cuenta válida, incluso creada por signup abierto | No puede escalar rol; el trigger bloquea campos sensibles |
| Nodo de la tailnet | Alcanza la IP de Tailscale | Inbucket sigue accesible durante pruebas; Studio y PostgreSQL están cerrados |
| Origen web malicioso | Puede llamar a la API desde el navegador | CORS restringido a los orígenes de la app |
| Operador con acceso al home | Lee archivos de configuración | Obtiene la contraseña compartida de la DB |

No se verificaron las ACL de Tailscale. Si existen, reducen el alcance, pero no eliminan la necesidad de cerrar puertos y autenticar servicios.

---

## 2. Autenticación y autorización

- **Autenticación:** GoTrue, JWT firmado, confirmación de correo obligatoria.
- **Autorización:** RLS en PostgreSQL, con `auth.uid()` y `profiles.role`.
- **Roles reales:** `user`, `admin`, `superadmin`.
- **Funciones:** `is_admin()` devuelve verdadero para `admin` y `superadmin`; `is_superadmin()` solo para `superadmin`.
- **Fuente del rol:** `public.profiles.role`. No se usa `raw_app_meta_data` ni el claim del JWT para RLS.

Esto significa que un cambio en `profiles.role` surte efecto inmediatamente en la siguiente consulta. La migración `20261103_000001_profiles_security.sql` bloquea la escalada: solo `is_superadmin()` puede cambiar `role`, `status`, `email`, `deleted_at` y campos de control.

---

## 3. RLS actual

| Tabla | Acceso implementado |
|---|---|
| `profiles` | Usuario propio; superadmin; miembros activos de la misma empresa; propietarios de unidades de la empresa |
| `management_companies` | Superadmin; miembro activo de la empresa; propietario de unidad de la empresa |
| `management_company_members` | Superadmin administra; miembro activo lee miembros de su empresa |
| `condominiums` | Superadmin; miembro activo de la empresa; propietario de unidad del condominio |
| `units` | Superadmin y miembros activos de la empresa; propietario lee su unidad |
| `regions`, `communes` | Lectura pública |
| `storage.objects` (`avatars`) | Pendiente: bucket público |

`anon` no tiene acceso a `profiles`, `management_companies`, `management_company_members`, `condominiums` ni `units`.

| Tabla | Política | Comando | Roles | Regla | Estado |
|---|---|---|---|---|---|
| `public.profiles` | `Lectura de perfiles` | SELECT | `authenticated` | `auth.uid() = id OR is_superadmin()` | Correcto |
| `public.profiles` | `Actualización de perfiles` | UPDATE | `authenticated` | `auth.uid() = id OR is_superadmin()`, con `WITH CHECK` | Correcto |
| `public.profiles` | Trigger `tr_protect_profile_sensitive_fields` | UPDATE | `authenticated` | Bloquea `id`, `email`, `role`, `status`, `deleted_at`, `created_at`, `updated_at` salvo superadmin | Correcto |
| `storage.objects` | `Acceso publico lectura avatares` | SELECT | `public` | `bucket_id = 'avatars'` | **P1:** enumeración pública |
| `storage.objects` | `Usuarios autenticados suben avatares` | INSERT | `authenticated` | `bucket_id = 'avatars'` | **P1:** subida en cualquier ruta |
| `storage.objects` | `Usuarios actualizan avatares` | UPDATE | `authenticated` | `bucket_id = 'avatars'`, sin `WITH CHECK` | **P1:** sobrescritura de otros |
| `storage.objects` | `Superadmin gestion total storage` | ALL | `public` | `is_superadmin()` | Correcto |

`anon` no tiene `SELECT` ni `UPDATE` sobre `profiles`; `authenticated` tiene `SELECT, UPDATE` de tabla y la protección de columnas queda en el trigger. El bucket `avatars` sigue público y permite `image/jpeg`, `image/png`, `image/webp` e `image/gif`, con límite de 5 MB: es el control P1 pendiente.

---

## 4. Rutas P0

### P0-1 — Autoascenso a `superadmin` — corregido

La política UPDATE usa `WITH CHECK` y el trigger `tr_protect_profile_sensitive_fields` rechaza cambios de `role`, `status`, `email`, `deleted_at` y campos de control fuera de un superadmin. Verificado: un usuario normal recibe `No autorizado para modificar campos protegidos del perfil`.

### P0-2 — Rol desde metadata en signup — corregido

`handle_new_user` inserta siempre `'user'` e ignora `raw_user_meta_data.role`. Verificado en transacción: un signup con metadata `role=superadmin` crea perfil `user`. El registro sigue abierto; cerrarlo o pasarlo a invitación es una decisión de producto pendiente.

### P0-3 — Inbucket sin autenticación — aceptado temporalmente

Inbucket sigue publicando `:9100` en Tailscale sin credenciales. Se mantiene durante las pruebas porque la app necesita verificar correos/OTP en este momento; debe cerrarse al terminar. Riesgo aceptado solo para preproducción.

### P0-4 — Studio sin autenticación — mitigado

Studio ahora publica `127.0.0.1:8280:3000`, no la IP de Tailscale; requiere túnel SSH para acceder. Las rutas siguen sin auth, por lo que el túnel debe limitarse a operadores y no dejarse abierto.

---

## 5. Controles aplicados y pendientes

### 5.1 Perfiles (aplicado)

```sql
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS "Lectura de perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Actualización de propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin gestion total perfiles" ON public.profiles;
CREATE POLICY "Lectura de perfiles"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_superadmin());

CREATE POLICY "Actualización de perfiles"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_superadmin())
WITH CHECK (auth.uid() = id OR public.is_superadmin());

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
$$;

CREATE TRIGGER tr_protect_profile_sensitive_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_fields();
```

La implementación real está en `supabase/migrations/20261103_000001_profiles_security.sql`. `anon` no tiene acceso directo a `profiles`; `authenticated` tiene `SELECT, UPDATE` de tabla y la protección de columnas queda en el trigger. Si se necesita un directorio público, crear una vista con columnas mínimas y exponer solo esa vista.

### 5.2 Signup (aplicado)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
```

Pendiente: deshabilitar signup abierto o pasar a invitaciones; no confiar en metadata para autorización.

### 5.3 Storage (pendiente)

```sql
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

DROP POLICY IF EXISTS "Acceso publico lectura avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados suben avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios actualizan avatares" ON storage.objects;

CREATE POLICY "avatars_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

Validar MIME y dimensiones en servidor; quitar GIF si no es necesario. Servir avatares con URLs firmadas o un proxy autenticado. Al pasar el bucket a privado, `profiles.avatar_url` debe guardar la ruta interna y generar una URL firmada al mostrarla; las URLs públicas existentes dejarán de funcionar.

---

## 6. Secretos y exposición

- **Contraseña de PostgreSQL:** estática y compartida por varios roles en `docker-compose.yml` y `roles.sql`. No se reproduce aquí. Rotar y mover a Podman/Docker secrets.
- **Service key:** solo debe vivir en el servidor. Studio la recibe; si Studio se expone, la key queda a un clic.
- **JWT secret:** firma los tokens y deriva las claves. Rotarlo invalida sesiones y exige actualizar anon/service keys y rebuild del frontend.
- **Anon key:** es pública por diseño, pero no debe incluirse en documentación ni logs.
- **Puertos:** `54322` está cerrado; `8280` solo escucha en localhost; `9100` sigue en Tailscale temporalmente. La app solo necesita `3002` y `8200`.

---

## 7. CORS, cabeceras y GoTrue

### CORS

Kong restringe CORS a `http://<piave-tailscale-ip>:3002`, `http://localhost:5173` y `http://127.0.0.1:5173`. El CORS abierto no es solo cosmético: con la anon key pública y RLS mal configurada, cualquier sitio puede leer datos desde el navegador.

### Cabeceras del frontend

La app no envía CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` ni `Permissions-Policy`. Añadirlas en el proxy o en Kong. HSTS solo tiene sentido con HTTPS.

### GoTrue

- `GOTRUE_URI_ALLOW_LIST` restringido al origen de la app y a Vite local.
- Sin rate limits/captcha/política de contraseñas explícitos: configurarlos.
- Signup abierto: deshabilitar o pasar a invitación.
- SMTP hacia Inbucket: usar un SMTP real y proteger el buzón al terminar las pruebas.
- `GOTRUE_JWT_EXP=3600`: revisar refresh y rotación.

---

## 8. Verificación y criterios de aceptación

Verificado 2026-11-04 salvo lo indicado como pendiente o riesgo aceptado.

| Prueba | Resultado esperado |
|---|---|
| `GET /rest/v1/profiles?select=email&limit=0` con anon key | 401/403 o 0 filas |
| `PATCH /rest/v1/profiles?id=eq.<uuid>` con `{"role":"superadmin"}` como usuario | Error o 0 filas modificadas |
| Signup con `data.role=superadmin` | Perfil creado como `user` |
| `GET :8280`, `:54322` desde otro nodo | No accesible |
| `GET :9100` desde otro nodo | Accesible temporalmente; riesgo aceptado en preproducción |
| `GET /storage/v1/object/list/avatars` con anon key | 401/403 (pendiente) |
| Usuario A intenta sobrescribir avatar de B | Error de RLS (pendiente) |
| Backup reciente + restore de datos | Checksum OK; conteos `profiles=4`, `regions=16` |

Los comandos concretos están en el [Anexo A de la auditoría](../auditoria_profunda_condominio_2026-11-03.md).

---

## 9. Enlaces

- [architecture.md](architecture.md)
- [operations.md](operations.md)
- [runbook.md](runbook.md)
- [roadmap.md](roadmap.md)
- [Auditoría profunda](../auditoria_profunda_condominio_2026-11-03.md)
