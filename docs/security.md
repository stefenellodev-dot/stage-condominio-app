# Seguridad — Condominio App

> **Estado:** verificado 2026-11-03. **No producción.** Hay cuatro rutas P0 abiertas.
>
> Este documento resume el modelo de seguridad y las correcciones objetivo. La evidencia completa está en la [auditoría profunda](../auditoria_profunda_condominio_2026-11-03.md).

---

## 1. Modelo de amenazas

| Actor | Capacidad | Riesgo principal |
|---|---|---|
| Visitante con la anon key | La key es pública y está en el bundle | Lee perfiles y avatares si RLS lo permite |
| Usuario autenticado | Cuenta válida, incluso creada por signup abierto | Escala a `superadmin` y administra todo |
| Nodo de la tailnet | Alcanza la IP de Tailscale | Entra a Studio, Inbucket y PostgreSQL |
| Origen web malicioso | Puede llamar a la API desde el navegador | Exfiltra datos por CORS `*` |
| Operador con acceso al home | Lee archivos de configuración | Obtiene la contraseña compartida de la DB |

No se verificaron las ACL de Tailscale. Si existen, reducen el alcance, pero no eliminan la necesidad de cerrar puertos y autenticar servicios.

---

## 2. Autenticación y autorización

- **Autenticación:** GoTrue, JWT firmado, confirmación de correo obligatoria.
- **Autorización:** RLS en PostgreSQL, con `auth.uid()` y `profiles.role`.
- **Roles reales:** `user`, `admin`, `superadmin`.
- **Funciones:** `is_admin()` devuelve verdadero para `admin` y `superadmin`; `is_superadmin()` solo para `superadmin`.
- **Fuente del rol:** `public.profiles.role`. No se usa `raw_app_meta_data` ni el claim del JWT para RLS.

Esto significa que un cambio en `profiles.role` surte efecto inmediatamente en la siguiente consulta. Es potente para administrar, pero también es el punto que hoy permite la escalada.

---

## 3. RLS actual

| Tabla | Política | Comando | Roles | Regla | Riesgo |
|---|---|---|---|---|---|
| `public.profiles` | `Lectura de perfiles` | SELECT | `public` | `true` | **P0/P1:** `anon` lee todo |
| `public.profiles` | `Actualización de propio perfil` | UPDATE | `public` | `auth.uid() = id`, sin `WITH CHECK` ni columnas | **P0:** autoascenso a `superadmin` |
| `public.profiles` | `Superadmin gestion total perfiles` | ALL | `public` | `is_superadmin()` | Correcto |
| `storage.objects` | `Acceso publico lectura avatares` | SELECT | `public` | `bucket_id = 'avatars'` | **P1:** enumeración pública |
| `storage.objects` | `Usuarios autenticados suben avatares` | INSERT | `authenticated` | `bucket_id = 'avatars'` | **P1:** subida en cualquier ruta |
| `storage.objects` | `Usuarios actualizan avatares` | UPDATE | `authenticated` | `bucket_id = 'avatars'`, sin `WITH CHECK` | **P1:** sobrescritura de otros |
| `storage.objects` | `Superadmin gestion total storage` | ALL | `public` | `is_superadmin()` | Correcto |

El bucket `avatars` es público y permite `image/jpeg`, `image/png`, `image/webp` e `image/gif`, con límite de 5 MB.

Además, `anon` y `authenticated` tienen `GRANT` de tabla amplios sobre `profiles` (`SELECT`, `UPDATE`, etc.). Hoy la única barrera es RLS; por eso las políticas y los grants de columna deben corregirse juntos.

---

## 4. Rutas P0

### P0-1 — Autoascenso a `superadmin`

Un usuario autenticado puede actualizar su propio `profiles.role` a `superadmin` porque la política UPDATE no restringe columnas y el trigger solo protege a un superadmin existente frente a terceros. La evidencia y el flujo están en la auditoría.

### P0-2 — Rol desde metadata en signup

`handle_new_user` inserta `COALESCE(new.raw_user_meta_data->>'role', 'user')`. La API de GoTrue acepta metadata arbitraria en el signup; el formulario de la app no la envía, pero un atacante puede llamar la API directamente. El registro está abierto.

### P0-3 — Inbucket sin autenticación

Inbucket publica `:9100` en Tailscale y no exige credenciales. Esto permite leer confirmaciones y OTP de recuperación, y convierte la recuperación de contraseña en una vía de toma de cuentas. Se combina con la lectura anónima de emails.

### P0-4 — Studio sin autenticación

Studio publica `:8280` en Tailscale. Las rutas `/api/platform/projects` y `/api/platform/profile` responden 200 sin credenciales. El contenedor recibe la service key; la consola puede administrar la base. Es compromiso total si un nodo de la tailnet accede.

---

## 5. Controles objetivo

### 5.1 Perfiles

```sql
-- 1. Quitar lectura anónima y el UPDATE de tabla; otorgar solo columnas editables.
REVOKE ALL ON public.profiles FROM anon;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (
  first_name, second_name, last_name, second_last_name, full_name,
  rut, phone, birth_date, gender, nationality,
  street, street_number, dept_or_unit, region_id, commune_id,
  region, commune, avatar_url
) ON public.profiles TO authenticated;

-- 2. Reemplazar la política de lectura.
DROP POLICY IF EXISTS "Lectura de perfiles" ON public.profiles;
CREATE POLICY "Lectura de perfiles"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_admin());

-- 3. Reemplazar la política de actualización.
DROP POLICY IF EXISTS "Actualización de propio perfil" ON public.profiles;
CREATE POLICY "Actualización de propio perfil"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Impedir cambios de rol fuera de un superadmin.
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'role change not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_superadmin_role ON public.profiles;
DROP TRIGGER IF EXISTS tr_prevent_role_change ON public.profiles;
CREATE TRIGGER tr_prevent_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();
```

`anon` no debe tener `SELECT` directo sobre `profiles`. Verificar además que no exista un `GRANT` a `PUBLIC` sobre la tabla; si existe, revocarlo. Si se necesita un directorio público, crear una vista con columnas mínimas y exponer solo esa vista.

### 5.2 Signup

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

Además: deshabilitar signup abierto o pasar a invitaciones, y no confiar en metadata para autorización.

### 5.3 Storage

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
- **Puertos:** `8280`, `9100` y `54322` no deben estar en la tailnet. La app solo necesita `3002` y `8200`.

---

## 7. CORS, cabeceras y GoTrue

### CORS

Kong responde `Access-Control-Allow-Origin: *`. Restringir a los orígenes reales de la app y limitar métodos/cabeceras. El CORS abierto no es solo cosmético: con la anon key pública y RLS mal configurada, cualquier sitio puede leer datos desde el navegador.

### Cabeceras del frontend

La app no envía CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` ni `Permissions-Policy`. Añadirlas en el proxy o en Kong. HSTS solo tiene sentido con HTTPS.

### GoTrue

- `GOTRUE_URI_ALLOW_LIST=*`: restringir a la URL exacta.
- Sin rate limits/captcha/política de contraseñas explícitos: configurarlos.
- Signup abierto: deshabilitar o pasar a invitación.
- SMTP hacia Inbucket: usar un SMTP real y proteger el buzón.
- `GOTRUE_JWT_EXP=3600`: revisar refresh y rotación.

---

## 8. Verificación y criterios de aceptación

| Prueba | Resultado esperado |
|---|---|
| `GET /rest/v1/profiles?select=email&limit=0` con anon key | 401/403 o 0 filas |
| `PATCH /rest/v1/profiles?id=eq.<uuid>` con `{"role":"superadmin"}` como usuario | Error o 0 filas modificadas |
| Signup con `data.role=superadmin` | Perfil creado como `user` |
| `GET :8280`, `:9100`, `:54322` desde otro nodo | No accesible o requiere autenticación |
| `GET /storage/v1/object/list/avatars` con anon key | 401/403 |
| Usuario A intenta sobrescribir avatar de B | Error de RLS |
| Backup reciente + restore de prueba | Restauración exitosa |

Los comandos concretos están en el [Anexo A de la auditoría](../auditoria_profunda_condominio_2026-11-03.md).

---

## 9. Enlaces

- [architecture.md](architecture.md)
- [operations.md](operations.md)
- [runbook.md](runbook.md)
- [roadmap.md](roadmap.md)
- [Auditoría profunda](../auditoria_profunda_condominio_2026-11-03.md)
