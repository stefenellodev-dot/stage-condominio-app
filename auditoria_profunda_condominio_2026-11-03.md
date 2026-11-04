# Auditoría profunda — Condominio App (staging Piave)

**Fecha:** 2026-11-03  
**Alcance:** repositorio local, build, configuración, despliegue en Piave y Supabase self-hosted (Kong, PostgREST, GoTrue, Storage, Studio, Inbucket, PostgreSQL).  
**Modo:** solo lectura. No se modificó código, base de datos, contenedores ni servicios. No se ejecutaron exploits con escritura; las escaladas se confirman por definiciones de RLS/triggers y por respuestas HTTP de solo lectura.  
**Resultado global:** **NO APTO para producción ni para datos reales**. Hay cuatro rutas críticas de compromiso y varias deficiencias de operación, respaldo y reproducibilidad.

**Documentación derivada:** [docs/README.md](docs/README.md). Este informe sigue siendo la fuente canónica de evidencia y hallazgos.

---

## 1. Resumen ejecutivo

La aplicación es un frontend React/Vite con Supabase self-hosted. El esquema real solo contiene `profiles`, `regions` y `communes`; no existen las tablas de dominio de condominio. El stack está expuesto en la IP de Tailscale con varios servicios sin autenticación (Studio, Inbucket y PostgreSQL), y las políticas RLS permiten que un usuario autenticado se ascienda a `superadmin`, que un registro nuevo inyecte el rol desde metadatos y que cualquiera lea todos los perfiles.

### Matriz de hallazgos

| ID | Severidad | Hallazgo | Impacto | Plazo |
|---|---|---|---|---|
| P0-1 | Crítica | Autoascenso a `superadmin` actualizando `profiles.role` | Control total de datos y administración | Inmediato |
| P0-2 | Crítica | `handle_new_user` toma `role` de `raw_user_meta_data` | Un registro puede nacer como `superadmin` | Inmediato |
| P0-3 | Crítica | Inbucket sin autenticación + recuperación por OTP | Interceptación de códigos y toma de cuentas | Inmediato |
| P0-4 | Crítica | Supabase Studio expuesto sin autenticación | Consola de administración y service key accesibles | Inmediato |
| P1-1 | Alta | Lectura anónima de todos los perfiles (email, RUT, teléfono) + CORS `*` | Exfiltración masiva de PII desde cualquier origen | < 7 días |
| P1-2 | Alta | PostgreSQL expuesto en Tailscale, SSL off y contraseña compartida en texto plano | Acceso directo a la base y movimiento lateral | < 7 días |
| P1-3 | Alta | Avatares: listado público y sobrescritura por cualquier autenticado | Enumeración y reemplazo de imágenes de otros usuarios | < 7 días |
| P1-4 | Alta | Sin respaldos de la base de Condominio | Pérdida de datos irreversible | < 7 días |
| P1-5 | Alta | Build no reproducible y cadena de suministro débil | Deriva, dependencias no fijadas, riesgo de supply chain | < 30 días |
| P1-6 | Alta | Esquema de dominio ausente; módulo principal es un placeholder | El producto no cumple la función de condominio | < 30 días |
| P2-1 | Media | `AdminTable` permite acciones que RLS niega; renderizado no valida rol | UI engañosa y falsos positivos de seguridad | < 30 días |
| P2-2 | Media | Sin cabeceras de seguridad en el frontend | Mayor impacto de XSS/clickjacking | < 30 días |
| P2-3 | Media | Configuración de GoTrue débil (`URI_ALLOW_LIST=*`, sin límites explícitos) | Abuso de auth, redirects y fuerza bruta | < 30 días |
| P2-4 | Media | Vulnerabilidades npm y imágenes `latest` sin fijar | Riesgo de build y de cambios no controlados | < 30 días |
| P2-5 | Media | Sin tests, lint ni CI | Regresiones y RLS sin verificación automática | < 30 días |
| P2-6 | Media | Manual con puertos incompletos, RLS ausente y despliegue incorrecto | Operación insegura y despliegues que no aplican cambios | < 7 días |
| P2-7 | Media | Logs con PII, scripts de auditoría con credenciales y redacción flaws | Exposición de datos y credenciales | < 7 días |
| P3-1 | Baja | Branding, `.env.example` e i18n inconsistentes | Confusión operativa y de usuario | < 90 días |
| P3-2 | Baja | Código muerto y roles/módulos inconsistentes | Mantenibilidad y RBAC confuso | < 90 días |
| P3-3 | Baja | Observabilidad y tuning de DB limitados | Diagnóstico más lento | < 90 días |

### Top 5 para acción inmediata

1. Corregir la política UPDATE de `profiles` y revocar la columna `role` (P0-1).
2. Forzar `role = 'user'` en `handle_new_user` y deshabilitar registro abierto o pasarlo a invitación (P0-2).
3. Sacar Inbucket, Studio y el puerto 54322 de la tailnet o ponerlos detrás de autenticación (P0-3, P0-4, P1-2).
4. Corregir la política SELECT de `profiles` y restringir CORS (P1-1).
5. Tomar un respaldo inmediato antes de tocar nada y automatizarlo (P1-4).

---

## 2. Método y límites

### 2.1 Qué se revisó

- Estado de Git, archivos versionados, `.env`, `Dockerfile`, `vite.config.js`, `index.html`, `package.json`, scripts de auditoría y documentación.
- Build local a un directorio temporal, hash de assets y `npm audit`.
- Inspección de contenedores Podman en Piave: estado, reinicios, puertos, redes, límites, healthchecks y configuración segura.
- Catálogo de PostgreSQL: tablas, columnas, políticas RLS, triggers, funciones, grants, `pg_hba.conf`, `ssl`, `listen_addresses`.
- Pruebas HTTP de solo lectura contra Kong, PostgREST, GoTrue, Storage, Studio e Inbucket.
- Comparación sección por sección contra `manual_tecnico_condominio_2026-11-03_19-42-06.md`.

### 2.2 Qué no se hizo

- No se ejecutaron `PATCH`, `UPDATE`, `INSERT`, `DELETE` ni se crearon usuarios.
- No se enviaron correos de recuperación ni se confirmaron cuentas.
- No se probaron credenciales de base de datos ni se usó la service key.
- No se hizo DAST, prueba de carga, análisis de malware ni revisión de la tailnet ACL.
- No se probó restauración de respaldos porque no existe respaldo de esta base.
- Las verificaciones de Studio se limitaron a rutas HTTP y tamaños; no se ejecutó SQL desde Studio.

### 2.3 Verificaciones descartadas para no generar falsos positivos

- **Source maps:** `/assets/<archivo>.js.map` responde 200, pero es el fallback SPA de `serve -s`; devuelve `index.html` (text/html, 448 bytes). **No hay source maps expuestos.**
- **Rutas meta de Studio:** `/api/pg-meta/...` devolvió 404; no se usó como evidencia de ejecución SQL. La evidencia es que `/api/platform/projects` y `/api/platform/profile` responden 200 sin credenciales.
- **Listado de Storage:** el endpoint correcto es `POST /storage/v1/object/list/avatars`; respondió 200 con un objeto. No se descargó ni mostró contenido.
- **Tailscale ACL:** los puertos fueron alcanzables desde un nodo de la tailnet; no se verificó si alguna ACL limita el acceso a dispositivos concretos. Si existe segmentación, el impacto de P0-3/P0-4/P1-2 baja, pero la exposición sigue siendo innecesaria.

---

## 3. Arquitectura verificada y diferencias con el manual

### 3.1 Estado real

| Capa | Realidad verificada |
|---|---|
| Frontend | React 18.3.1 + Vite 5.4.21, build estático servido con `serve -s` en el contenedor; no Nginx |
| URL pública | `http://<tailscale-ip>:3002` |
| API Gateway | Kong 2.8.1 en `:8200`, rutas `/auth/v1`, `/rest/v1`, `/storage/v1` |
| Auth | GoTrue v2.158.1, confirmación de correo obligatoria, SMTP hacia Inbucket |
| DB | PostgreSQL 15.6.1.139, 3 tablas públicas, `ssl=off`, puerto `54322` publicado en Tailscale |
| Studio | `supabase/studio:latest` en `:8280`, sin autenticación |
| Inbucket | `inbucket:latest` en `:9100`, sin autenticación |
| App | `stage-stage-condominio-app`, límite 768 MB, `Restart=always` |
| Despliegue | Tarea VS Code -> `rsync` -> `stage-cli deploy` -> `podman build` -> `systemctl --user restart` |

### 3.2 Tablas y datos reales

- `public.profiles`: 26 columnas; 4 filas (1 `superadmin`, 3 `user`).
- `public.regions`: 16 filas.
- `public.communes`: 104 filas.
- No existen `communities`, `buildings`, `units`, `expenses_period` ni `unit_expenses`.
- `supabase/init.sql` solo crea `regions`, `communes` y `profiles`; no hay migraciones ni historial de esquema.

### 3.3 Comparación con el manual

| Tema | Manual | Realidad | Veredicto |
|---|---|---|---|
| Frontend | “Vite / React / Nginx” | `serve -s` sobre Node | Incorrecto |
| Puertos | Lista 3002, 8200, 54322, 54321, 55432 | Faltan 8280 (Studio) y 9100 (Inbucket); 54321/55432 son de otro stack | Incompleto y mezclado |
| IPs internas | Las presenta como fijas | Son dinámicas; cambiaron tras reinicios | Engañoso |
| Esquema | Solo documenta `profiles` | Existen `regions` y `communes`; faltan tablas de dominio | Incompleto |
| RLS | Solo muestra un trigger | Hay 3 políticas en `profiles` y 4 en `storage.objects`, varias inseguras | Crítico |
| Pruebas API | 6.2 sin token/claims; 6.3 vacío | No reproducible | Insuficiente |
| 502 | Reiniciar Kong por caché DNS | Hubo 502 con PostgREST caído/DB apagándose; Kong y rest se reiniciaron después | Plausible pero no verificado |
| Superadmin | Actualiza `profiles` y metadatos de GoTrue | RLS se basa en `profiles.role`; el procedimiento no corrige la causa y no advierte la escalada | Incompleto |
| Despliegue | `npm run build` + `podman restart` | `stage-cli deploy` hace `podman build` + `systemctl --user restart`; `podman restart` reutiliza la imagen vieja | **Incorrecto** |
| Seguridad | No evalúa exposición de Studio/Inbucket/DB | Es el riesgo principal | Omisión crítica |

---

## 4. Hallazgos P0 (críticos)

### P0-1 — Cualquier usuario autenticado puede ascender a `superadmin`

**Evidencia**

- Política `public.profiles`:
  - `Actualización de propio perfil`: `UPDATE`, rol `{public}`, `USING (auth.uid() = id)`, sin `WITH CHECK` y sin restricción de columnas.
  - `Superadmin gestion total perfiles`: `ALL`, `is_superadmin()`.
- Trigger `protect_superadmin_role`:
  - Solo revierte el cambio si `OLD.role = 'superadmin' AND NEW.role <> 'superadmin' AND NOT public.is_superadmin()`.
  - Para un usuario normal (`OLD.role = 'user'`), no impide cambiar `role` a `superadmin`; además, un superadmin puede autodemoverse porque `is_superadmin()` todavía ve la fila anterior.
- `is_superadmin()` lee `public.profiles.role`; no depende del JWT. El cambio surte efecto en la siguiente consulta.
- `is_admin()` considera `role IN ('superadmin','admin')`; tras el ascenso, también aplican las políticas de admin.

**Impacto**

Un usuario autenticado puede ejecutar directamente contra PostgREST:

```http
PATCH /rest/v1/profiles?id=eq.<su-propio-id>
Content-Type: application/json

{"role":"superadmin"}
```

No se ejecutó el PATCH por la restricción de solo lectura, pero la política y el trigger permiten la operación. El resultado es control total de perfiles y storage, y acceso a la consola de administración.

**Remediación**

1. Revocar `UPDATE` de columna sobre `role`, `status`, `deleted_at` y `email` para `authenticated` y `anon`; otorgar solo columnas de perfil editables.
2. Reemplazar la política por una que use `WITH CHECK (auth.uid() = id)` y, si se permiten cambios de rol, una función `SECURITY DEFINER` con verificación explícita de `is_superadmin()`.
3. Añadir trigger que rechace `NEW.role IS DISTINCT FROM OLD.role` salvo que `is_superadmin()` sea verdadero.
4. Añadir restricción `CHECK (role IN ('user','admin','superadmin'))` (defensa en profundidad; no sustituye el control de autorización).
5. Auditar los roles actuales y rotar sesiones/JWT después de corregir.

---

### P0-2 — El registro puede inyectar `role` desde metadatos

**Evidencia**

```sql
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
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$function$;
```

- El trigger se ejecuta sobre `auth.users` y es `SECURITY DEFINER`, por lo que evita RLS.
- GoTrue no tiene `GOTRUE_DISABLE_SIGNUP`; el registro está habilitado.
- La confirmación de correo es obligatoria (`GOTRUE_MAILER_AUTOCONFIRM=false`), pero Inbucket está expuesto (P0-3).
- El formulario `SignUpForm` no envía metadata, pero la API de GoTrue acepta `data` arbitraria en `/auth/v1/signup`; un atacante puede llamar la API directamente.

**Impacto**

Un atacante puede registrarse con `data: { "role": "superadmin" }`, confirmar su correo y obtener un perfil `superadmin` sin pasar por ningún administrador. No se creó el usuario en esta auditoría.

**Remediación**

1. Forzar `'user'` en `handle_new_user`; eliminar por completo la lectura de `role` desde metadata.
2. Deshabilitar el registro abierto (`GOTRUE_DISABLE_SIGNUP=true`) o usar invitaciones/altas administrativas.
3. Validar y sanear `raw_user_meta_data`; no confiar en metadata para autorización.
4. Añadir pruebas de integración que verifiquen que un signup con `role` en metadata termina como `user`.

---

### P0-3 — Inbucket sin autenticación permite interceptar confirmaciones y recuperaciones

**Evidencia**

- `condo-sb-inbucket` publica `:9100` en la IP de Tailscale.
- `GET /monitor` responde 200 sin credenciales.
- `GET /api/v1/mailbox/nonexistent@example.invalid` responde 200 con `[]`; otra ruta de buzón también respondió 200. No se volcó contenido de correos.
- GoTrue usa `GOTRUE_SMTP_HOST=condo-sb-inbucket` y `GOTRUE_MAILER_AUTOCONFIRM=false`.
- `ResetForm` usa `verifyOtp` de tipo `recovery`; `SignUpForm` usa confirmación por correo.
- La política `Lectura de perfiles` permite a `anon` leer todos los emails (P1-1).

**Impacto**

Cadena de toma de cuenta:

1. Un atacante en la tailnet lee todos los emails desde `/rest/v1/profiles`.
2. Solicita recuperación de contraseña para la víctima.
3. Lee el OTP en Inbucket sin autenticación.
4. Ejecuta `verifyOtp` y `updateUser` para fijar una nueva contraseña.

También puede confirmar su propio registro para explotar P0-2. El resultado puede incluir la cuenta `superadmin`.

**Remediación**

1. Quitar el puerto 9100 de la tailnet; dejar Inbucket solo en la red interna.
2. Si se necesita interfaz, ponerla detrás de autenticación (OAuth/basic auth) y restringir por ACL.
3. Para staging, usar un SMTP real con credenciales restringidas o Mailpit con autenticación.
4. Limpiar buzones y deshabilitar el monitor público.
5. Endurecer recuperación: rate limit, captcha, tokens de un solo uso con expiración corta y notificación al usuario.
6. Rotar JWT/sesiones tras corregir.

---

### P0-4 — Supabase Studio expuesto sin autenticación

**Evidencia**

- `condo-sb-studio` publica `:8280` en la IP de Tailscale.
- `GET /api/platform/projects` responde 200, `application/json`, 182 bytes, con metadatos del proyecto.
- `GET /api/platform/profile` responde 200, `application/json`, 441 bytes, con un perfil de usuario por defecto.
- `/project/default` responde 200.
- El contenedor recibe `SUPABASE_SERVICE_KEY`; Studio puede operar con privilegios de servicio.

**Impacto**

Cualquier dispositivo con acceso a la tailnet puede abrir Studio y, desde la consola, administrar el proyecto y ejecutar SQL con la service key. Esto equivale a compromiso total de la base, sin necesidad de la contraseña de PostgreSQL.

**Remediación**

1. Quitar el `ports:` de Studio; acceder solo por túnel SSH (`ssh -L 8280:...`).
2. Si debe quedar accesible, ponerlo detrás de un proxy con autenticación (Cloudflare Access, OAuth2 Proxy) y ACL de Tailscale.
3. No exponer la service key a la red; rotarla después de cerrar el acceso.
4. Fijar la imagen por digest y actualizarla de forma controlada.

---

## 5. Hallazgos P1 (altos)

### P1-1 — Lectura anónima de todos los perfiles y CORS abierto

**Evidencia**

- Política `Lectura de perfiles`: `SELECT`, rol `{public}`, `USING (true)`.
- Con la anon key pública:
  - `GET /rest/v1/profiles?select=id` -> `206`, `Content-Range: 0-0/4`.
  - `GET /rest/v1/profiles?select=email&limit=0` -> `200`.
  - `GET /rest/v1/profiles?select=rut&limit=0` -> `200`.
  - `GET /rest/v1/profiles?select=phone&limit=0` -> `200`.
- Kong responde `Access-Control-Allow-Origin: *`.
- La anon key está en el bundle público; es pública por diseño.

**Impacto**

Cualquier persona con la anon key (que está en el JavaScript) puede leer emails, nombres, RUT, teléfonos, roles y estado de todos los perfiles, incluso sin autenticarse. Con CORS `*`, una página maliciosa puede hacer la consulta desde el navegador de un usuario y exfiltrar los datos. Los perfiles con `deleted_at` también son legibles porque la política no filtra.

**Remediación**

1. Reemplazar la política por `auth.uid() = id OR public.is_admin()` (o `is_superadmin()` si solo el superadmin debe ver todo).
2. Revocar `SELECT` de `public.profiles` a `anon`; si se necesita un directorio público, crear una vista con columnas mínimas y exponer solo esa vista.
3. Restringir CORS en Kong a los orígenes reales de la app; no usar `*`.
4. Excluir `deleted_at IS NOT NULL` de las vistas de administración.
5. Considerar cifrado de RUT/teléfono y minimización de datos.

---

### P1-2 — PostgreSQL expuesto, sin TLS y con credencial compartida en texto plano

**Evidencia**

- `condo-sb-db` publica `54322` en la IP de Tailscale; el puerto responde.
- `SHOW ssl` -> `off`; `SHOW listen_addresses` -> `*`.
- `pg_hba.conf`: `host all all all scram-sha-256`, además de `trust` para localhost.
- `docker-compose.yml` y `init/roles.sql` contienen una contraseña estática compartida por `postgres`, `authenticator`, `supabase_auth_admin`, `supabase_storage_admin` y `supabase_admin`. No se reproduce el valor en este informe.
- El archivo se encuentra en el home del servidor, no en un gestor de secretos.

**Impacto**

Cualquier dispositivo de la tailnet que obtenga la credencial puede conectarse directamente a la base sin TLS. La contraseña compartida permite movimiento lateral entre roles y aumenta el impacto de una lectura del home o de un backup de configuración. La exposición del puerto no es necesaria para el funcionamiento de la app.

**Remediación**

1. Eliminar el `ports:` de `condo-sb-db`; usar la red interna y `podman exec` para operaciones.
2. Si se necesita acceso remoto, usar túnel SSH y TLS; no publicar 54322.
3. Rotar la contraseña en una ventana de mantenimiento; usar secretos distintos y fuertes por rol.
4. Mover secretos a Podman/Docker secrets o a un gestor; eliminar el texto plano de `docker-compose.yml` y `roles.sql`.
5. Restringir `pg_hba.conf` a la subred de contenedores; mantener `scram-sha-256`.
6. Revisar si la misma contraseña se reutiliza en otros stacks y rotarla allí también.

---

### P1-3 — Avatares: enumeración pública y sobrescritura por cualquier autenticado

**Evidencia**

- Bucket `avatars`: `public = true`, límite 5 MB, MIME `image/jpeg,image/png,image/webp,image/gif`.
- Políticas en `storage.objects`:
  - `Acceso publico lectura avatares`: `SELECT`, `{public}`, `bucket_id = 'avatars'`.
  - `Usuarios autenticados suben avatares`: `INSERT`, `{authenticated}`, `WITH CHECK (bucket_id = 'avatars')`.
  - `Usuarios actualizan avatares`: `UPDATE`, `{authenticated}`, `USING (bucket_id = 'avatars')`, sin `WITH CHECK`.
- `POST /storage/v1/object/list/avatars` con anon key respondió 200 y devolvió una entrada; el nombre de la carpeta coincide con un UUID de usuario.
- `ProfileSection` sube a `${session.user.id}/avatar_<timestamp>.<ext>` con `upsert: true`.

**Impacto**

Cualquiera puede listar los objetos del bucket y acceder a las imágenes públicas. Cualquier usuario autenticado puede subir o sobrescribir objetos en cualquier ruta del bucket, no solo en la suya; con el listado público, puede enumerar rutas y reemplazar avatares de otros usuarios. El MIME permite GIF, lo que facilita contenido animado no deseado.

**Remediación**

1. Hacer el bucket privado y servir avatares con URLs firmadas.
2. Cambiar las políticas a `auth.uid() = owner` o a prefijo de ruta `((storage.foldername(name))[1] = auth.uid()::text)`.
3. Añadir `WITH CHECK` en UPDATE e INSERT.
4. Añadir política de DELETE solo para el propietario.
5. Validar MIME y dimensiones en servidor; quitar GIF si no es necesario.
6. Limpiar avatares antiguos y no usar el UUID como nombre público sin necesidad.

---

### P1-4 — Sin respaldos de la base de Condominio

**Evidencia**

- No existe timer/servicio de respaldo para `condo-sb-db`.
- El único respaldo encontrado es `condosmart-db-backup.service` y su script, que apuntan al proyecto CondoSmart, no a `condo-sb-db`.
- El script de CondoSmart es un buen patrón (`pg_dump -Fc`, checksum, retención 30, publicación atómica), pero no está aplicado a esta base.

**Impacto**

Un error de operación, corrupción o borrado deja la base sin recuperación. La base tiene datos personales (perfiles) y no hay evidencia de respaldo ni de prueba de restauración.

**Remediación**

1. Tomar un respaldo inmediato antes de cualquier cambio.
2. Adaptar el script de CondoSmart para `condo-sb-db` y `postgres` (o el usuario de backup de mínimo privilegio).
3. Guardar fuera del servidor (restic/rclone a almacenamiento cifrado), con checksum y retención.
4. Programar timer systemd y alertas de fallo.
5. Probar restauración mensual en un entorno aislado y documentar el RTO/RPO.

---

### P1-5 — Build no reproducible y cadena de suministro débil

**Evidencia**

- `Dockerfile`:
  - `COPY package.json ./` y `RUN npm install`; no copia `package-lock.json` ni usa `npm ci`.
  - `FROM node:20-alpine` sin digest.
  - `RUN npm install -g serve` sin versión.
  - Corre como root; sin `HEALTHCHECK`; `COPY . ./` sin `.dockerignore`.
- No existe `.gitignore` ni `.dockerignore`.
- `git ls-files` incluye `.env`, `node_modules/` y `dist/`.
- El asset desplegado (`index-DAduFS6z.js`) no coincide con el build local (`index-u_3DtlYb.js`); el árbol de trabajo está sucio.
- `package.json` declara rangos `^`; el instalado local es `@supabase/supabase-js@2.118.0`, muy por encima del mínimo declarado.

**Impacto**

Dos builds de la misma rama pueden producir artefactos distintos. No hay garantía de que la imagen corresponda a un commit. `.env`, `node_modules` y `dist` en Git aumentan el tamaño, filtran configuración y permiten manipulación de dependencias. La imagen corre como root y no tiene verificación de salud.

**Remediación**

1. Añadir `.gitignore` y `.dockerignore`; sacar `.env`, `node_modules`, `dist` y reportes del índice (`git rm -r --cached ...`).
2. Usar `npm ci`, copiar `package-lock.json` y fijar versiones exactas.
3. Fijar imágenes por digest (`node:20-alpine@sha256:...`, `serve@<versión>`), usar usuario no root y `HEALTHCHECK`.
4. Añadir escaneo de dependencias, secretos y contenedores en CI.
5. Versionar el artefacto con el SHA del commit y verificar el hash del asset desplegado.

---

### P1-6 — Esquema de dominio ausente y módulo principal vacío

**Evidencia**

- Solo existen `profiles`, `regions` y `communes` en `public`.
- No existen `communities`, `buildings`, `units`, `expenses_period` ni `unit_expenses`.
- `src/components/business/InventoryModule.jsx` devuelve un `<div>` con texto placeholder.
- `src/config/modules.js` solo registra `inventory`, con roles `['admin','operator']`; `operator` no existe en `roles.js` ni en la base.
- `HomeOverview.jsx` no está referenciado.
- `supabase/init.sql` no incluye tablas de dominio; no hay migraciones.

**Impacto**

La aplicación no puede gestionar condominios, unidades, gastos ni inventario. El tab por defecto es el placeholder de inventario. El manual y la UI sugieren funcionalidad que no existe.

**Remediación**

1. Definir el modelo de dominio y migraciones versionadas (Supabase CLI).
2. Implementar RLS por comunidad/rol para cada tabla.
3. Reemplazar el placeholder o retirarlo hasta que exista funcionalidad.
4. Alinear roles (`user`, `admin`, `superadmin`) y eliminar `operator` o definirlo formalmente.
5. Añadir seeds y pruebas de integración.

---

## 6. Hallazgos P2 (medios)

### P2-1 — `AdminTable` no coincide con RLS y el renderizado no valida rol

**Evidencia**

- `Dashboard.jsx` renderiza `AdminTable` cuando `activeTab === 'admin_users'` sin comprobar `isSuperadmin`.
- `AppLayout` solo oculta el botón de navegación para no admin; no protege el contenido.
- `AdminTable` permite cambiar rol (`user`/`admin`), estado y borrado lógico.
- RLS solo permite modificar otros perfiles a `is_superadmin()`; un `admin` que intente actualizar otro perfil afectará 0 filas y PostgREST puede responder 204, mientras la UI muestra “éxito”.
- `Dashboard` calcula el módulo por defecto desde `businessModules`, no desde `availableModules`; un `user` puede terminar renderizando un módulo que no ve en el menú.

**Impacto**

La UI promete capacidades que el servidor niega (falsos positivos) y el control de acceso efectivo depende solo de RLS. Si en el futuro un módulo maneja datos en cliente, el renderizado sin guardia puede exponerlo.

**Remediación**

1. Mostrar `AdminTable` solo a `isSuperadmin`; para `admin`, modo lectura.
2. Añadir un guard de ruta/estado y una verificación de rol en el servidor (RPC) para cada acción.
3. Manejar explícitamente actualizaciones de 0 filas y no mostrar éxito.
4. Renderizar módulos desde `availableModules` y añadir pruebas de RBAC.

---

### P2-2 — Sin cabeceras de seguridad en el frontend

**Evidencia**

`curl -I http://<host>:3002/` devuelve solo `Content-Length`, `Content-Disposition`, `Accept-Ranges`, `ETag`, `Content-Type`, `Vary`, `Date`, `Connection`, `Keep-Alive`. No hay:

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security` (no aplica sin HTTPS)

**Impacto**

Mayor impacto de XSS/clickjacking y menos defensa en profundidad. La app maneja sesiones en `localStorage` (comportamiento por defecto de Supabase JS), por lo que un XSS podría robar tokens.

**Remediación**

1. Terminar TLS en un proxy y añadir HSTS.
2. Añadir CSP estricta, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` y `Permissions-Policy`.
3. Configurar las cabeceras en Kong (`response-transformer`) o en el proxy, no solo en el HTML.

---

### P2-3 — Configuración de GoTrue débil

**Evidencia**

- `GOTRUE_URI_ALLOW_LIST=*`.
- No se observaron variables explícitas de rate limit, captcha ni política de contraseñas.
- `GOTRUE_JWT_EXP=3600` (razonable, pero sin rotación de refresh visible).
- SMTP apunta a Inbucket; confirmación obligatoria.
- No hay `GOTRUE_DISABLE_SIGNUP`.

**Impacto**

Redirects abiertos, abuso de registro/recuperación y fuerza bruta si los valores por defecto no son suficientes. La combinación con Inbucket expuesto agrava el riesgo.

**Remediación**

1. Fijar `GOTRUE_URI_ALLOW_LIST` a la URL exacta de la app.
2. Configurar rate limits, captcha y política de contraseñas.
3. Deshabilitar registro abierto o usar invitaciones.
4. Usar SMTP real y proteger el buzón.
5. Rotar el secreto JWT y las claves después de corregir; coordinar el rebuild del frontend.

---

### P2-4 — Vulnerabilidades npm e imágenes sin fijar

**Evidencia**

- `npm audit`: 1 high (`vite <=6.4.3`; instalado 5.4.21) y 1 moderate (`esbuild <=0.24.2`).
- El high incluye path traversal en el servidor de desarrollo y problemas de `launch-editor`; el moderate permite que un sitio envíe requests al dev server.
- Imágenes `supabase/studio:latest`, `inbucket/inbucket:latest`, `node:20-alpine` y `serve` global sin versión.
- No hay auto-update de Podman.

**Impacto**

El riesgo del high de Vite es principalmente de desarrollo/build, no del bundle estático de producción, pero el entorno de desarrollo y la cadena de build no están sanos. Las imágenes `latest` pueden cambiar sin control.

**Remediación**

1. Actualizar Vite a una versión soportada (la corrección sugerida es un salto mayor; probar el plugin de React).
2. Ejecutar `npm audit` en CI y usar Renovate/Dependabot.
3. Fijar todas las imágenes por digest y documentar el proceso de actualización.
4. Evaluar `serve` con versión fija o reemplazarlo por un servidor estático con cabeceras.

---

### P2-5 — Sin tests, lint ni CI

**Evidencia**

- `package.json` solo tiene `dev`, `build`, `preview`.
- No hay tests, ESLint, Prettier, typecheck ni workflows de CI.
- No hay pruebas de RLS.

**Impacto**

Las regresiones de autorización (como P0-1/P0-2) no se detectan. No hay verificación automática de build ni de políticas.

**Remediación**

1. Añadir Vitest + React Testing Library para componentes y auth.
2. Añadir ESLint y un chequeo de tipos (TS o JSDoc).
3. Añadir pgTAP o tests de integración que prueben anon/user/admin/superadmin contra PostgREST.
4. CI con build, tests, audit y secret scanning.

---

### P2-6 — Manual y runbook con errores operativos

**Evidencia**

- Sección 7.4: `npm run build` + `podman restart stage-stage-condominio-app`. `podman restart` reutiliza la imagen existente; no aplica el nuevo build. El flujo real es `npm run build` -> `rsync` -> `stage-cli deploy` -> `podman build` -> `systemctl --user restart`.
- Sección 3.3 omite 8280 y 9100; incluye 54321 y 55432 de otro stack.
- Sección 5 solo documenta un trigger; omite las políticas RLS.
- Sección 6.2 no muestra token/claims; 6.3 está vacía.
- Sección 7.1 atribuye el 502 a caché DNS de Kong; los logs muestran 502 mientras PostgREST estaba caído y la DB se apagaba. Es plausible, pero falta verificación y orden de reinicio.
- Sección 7.3 actualiza metadatos de GoTrue; RLS usa `profiles.role`, y el procedimiento no advierte la vulnerabilidad de autoascenso.
- El manual incluye un JWT anon parcial; la anon key es pública, pero no debe estar en documentación.

**Impacto**

Despliegues que parecen exitosos pero no actualizan la app; diagnóstico incorrecto; falsa sensación de seguridad.

**Remediación**

1. Reescribir el runbook con el flujo real y verificación de imagen/hash.
2. Documentar todas las políticas RLS y los riesgos.
3. Añadir healthchecks y un procedimiento de 502 con verificación de upstream.
4. Eliminar tokens y credenciales de la documentación.
5. Marcar las IPs internas como dinámicas.

---

### P2-7 — Logs con PII, scripts con credenciales y artefactos versionados

**Evidencia**

- Los logs de auth/Kong contienen correos y eventos de login; no se reproducen valores.
- `audit_condominio.sh` y `audit_condominio_full.sh` contienen credenciales de prueba hardcodeadas.
- La redacción de JWT en `audit_condominio_full.sh:57` solo oculta el encabezado del token y deja la mayor parte del valor.
- `.env` está versionado; `dist/` y `node_modules/` también.
- El manual y los reportes de auditoría quedan en el repo sin control de acceso.

**Impacto**

Exposición de PII en logs, credenciales en scripts y riesgo de filtrar tokens/artefactos en el repositorio.

**Remediación**

1. Rotar las credenciales de prueba y eliminarlas de los scripts; usar variables de entorno.
2. Implementar redacción robusta (token completo, no prefijo) y revisar logs antes de compartirlos.
3. Sacar `.env`, `dist`, `node_modules` y reportes del control de versiones.
4. Restringir acceso a `journalctl` y definir retención de logs.
5. Evitar correos en logs de aplicación; usar IDs internos.

---

## 7. Hallazgos P3 (bajos)

### P3-1 — Branding, `.env.example` e i18n

- `index.html` mantiene `<title>Staging Auth Test</title>`.
- `.env.example` apunta a `http://<tailscale-ip>:8000`; el real es `:8200`.
- `appConfig.roles` no incluye `superadmin`.
- Hay mensajes hardcodeados en español (“Código OTP enviado a Inbucket”, “Contraseña restablecida exitosamente”, mensajes de admin) aunque existe i18n.
- `VITE_APP_NAME`/tagline del ejemplo (“Stage App”) no coinciden con “Condominio”.

**Remediación:** corregir título, ejemplo y claves; mover textos a locales; alinear nombres.

### P3-2 — Código muerto y RBAC inconsistente

- `HomeOverview.jsx` no se usa.
- `roles.js` no se importa.
- `modules.js` usa `operator`, rol inexistente.
- `Dashboard` renderiza el módulo por defecto sin filtrar por `availableModules`.

**Remediación:** eliminar código muerto, unificar roles y usar una única función de autorización.

### P3-3 — Observabilidad y tuning

- `log_min_duration_statement = -1`; no hay slow query log.
- No hay `pg_stat_statements` visible.
- La mayoría de servicios no tiene healthcheck de imagen.
- No hay alertas de backup, errores 5xx ni saturación.
- `serve -s` devuelve 200 para rutas inexistentes (fallback SPA), lo que oculta enlaces rotos.

**Remediación:** habilitar slow queries, healthchecks, métricas y alertas; documentar el fallback SPA.

---

## 8. Plan de acción

### 8.1 Inmediato (0–24 h), en ventana de mantenimiento

1. **Respaldo manual** de `condo-sb-db` antes de cambiar nada.
2. **Cerrar exposición**: quitar `ports:` de Studio, Inbucket y PostgreSQL; dejar solo Kong y la app. Verificar desde otro nodo de la tailnet que 8280, 9100 y 54322 ya no responden.
3. **Corregir P0-1**: revocar update de `role`/`status`/`deleted_at`/`email`; reemplazar política; añadir trigger de protección.
4. **Corregir P0-2**: forzar `'user'` en `handle_new_user`; deshabilitar signup o pasarlo a invitación.
5. **Corregir P0-3**: limpiar Inbucket; si se mantiene, autenticación y ACL; rotar JWT/sesiones.
6. **Corregir P0-4**: rotar service key después de cerrar Studio; revisar accesos.
7. **Auditar roles**: confirmar que solo el superadmin legítimo tiene `superadmin`; revisar `auth.users` y logs.

### 8.2 Corto plazo (1–7 días)

1. Corregir RLS de `profiles` (SELECT) y CORS de Kong.
2. Corregir políticas de Storage y hacer privado el bucket.
3. Implementar respaldo automático con checksum, retención y copia fuera del servidor.
4. Añadir cabeceras de seguridad y TLS en el proxy.
5. Endurecer GoTrue (`URI_ALLOW_LIST`, rate limits, captcha, política de contraseñas).
6. Actualizar el manual y el runbook de despliegue/502.
7. Rotar la contraseña compartida de PostgreSQL y eliminar el texto plano.

### 8.3 Medio plazo (7–30 días)

1. Migraciones de dominio y pruebas de RLS.
2. `npm ci`, `.dockerignore`, imágenes fijas, usuario no root, healthchecks.
3. Actualizar Vite y dependencias; CI con tests, lint, audit y secret scanning.
4. Gate de `AdminTable` por `isSuperadmin`; RPC para acciones administrativas.
5. Observabilidad: healthchecks, alertas de 5xx, backups y saturación.
6. Limpieza de código muerto, roles y textos i18n.

---

## 9. Criterios de aceptación

La corrección se puede considerar verificada cuando:

- `GET /rest/v1/profiles?select=email&limit=0` con anon key devuelve 401/403 o 0 filas.
- Un usuario autenticado no puede cambiar su `role`; el intento devuelve error o no modifica la fila.
- Un signup con `data.role = superadmin` crea un perfil `user`.
- 8280, 9100 y 54322 no son alcanzables desde la tailnet (o requieren autenticación).
- Studio e Inbucket no responden sin credenciales.
- Existe un respaldo reciente, con checksum, y una restauración de prueba exitosa.
- `npm ci && npm run build` produce un artefacto reproducible y el hash desplegado coincide.
- Las pruebas de RLS para anon/user/admin/superadmin pasan en CI.
- El manual no contiene tokens, credenciales ni IPs internas presentadas como fijas.

---

## 10. Anexo A — Evidencia reproducible (sanitizada)

> Usar variables de entorno. No pegar claves reales en la terminal ni en documentos.

### 10.1 Lectura anónima de perfiles

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  "$SUPABASE_URL/rest/v1/profiles?select=email&limit=0"
```

Resultado observado: `200`. También `200` para `rut` y `phone`; `206` para `select=id` con `Content-Range: 0-0/4`.

### 10.2 Listado anónimo de avatares

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"prefix":"","limit":1}' \
  "$SUPABASE_URL/storage/v1/object/list/avatars"
```

Resultado observado: `200`; un objeto. No se descargó contenido.

### 10.3 Studio sin autenticación

```bash
curl -s -o /dev/null -w '%{http_code}\n' "http://piave:8280/api/platform/projects"
curl -s -o /dev/null -w '%{http_code}\n' "http://piave:8280/api/platform/profile"
```

Resultado observado: `200` en ambas; JSON de 182 y 441 bytes.

### 10.4 Inbucket sin autenticación

```bash
curl -s -o /dev/null -w '%{http_code}\n' "http://piave:9100/monitor"
curl -s -o /dev/null -w '%{http_code}\n' "http://piave:9100/api/v1/mailbox/nonexistent@example.invalid"
```

Resultado observado: `200` en ambas; la segunda devolvió `[]` (3 bytes).

### 10.5 PostgreSQL expuesto

```bash
pg_isready -h piave -p 54322
podman exec condo-sb-db psql -U postgres -d postgres -c 'SHOW ssl;'
podman exec condo-sb-db psql -U postgres -d postgres -c 'SHOW listen_addresses;'
```

Resultado observado: puerto abierto; `ssl = off`; `listen_addresses = *`.

### 10.6 RLS y triggers

```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

SELECT pg_get_functiondef('public.handle_new_user'::regproc);
SELECT pg_get_functiondef('public.protect_superadmin_role'::regproc);
SELECT pg_get_functiondef('public.is_superadmin'::regproc);
SELECT pg_get_functiondef('public.is_admin'::regproc);
```

### 10.7 Dependencias

```bash
npm audit
npm ls vite esbuild @supabase/supabase-js --depth=0
```

Resultado observado: 1 high (`vite`), 1 moderate (`esbuild`); `vite@5.4.21`, `esbuild` transitivo, `@supabase/supabase-js@2.118.0`.

### 10.8 Cabeceras del frontend

```bash
curl -s -D - -o /dev/null "http://piave:3002/"
```

Resultado observado: sin CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` ni `Permissions-Policy`.

---

## 11. Anexo B — Archivos y rutas relevantes

### Repositorio local

- `src/context/AuthContext.jsx`
- `src/components/dashboard/AdminTable.jsx`
- `src/components/dashboard/Dashboard.jsx`
- `src/components/dashboard/ProfileSection.jsx`
- `src/components/auth/SignUpForm.jsx`
- `src/components/auth/ResetForm.jsx`
- `src/components/layout/AppLayout.jsx`
- `src/config/modules.js`
- `src/config/appConfig.js`
- `src/lib/roles.js`
- `src/components/business/InventoryModule.jsx`
- `src/components/business/HomeOverview.jsx`
- `supabase/init.sql`
- `Dockerfile`
- `vite.config.js`
- `index.html`
- `.env.example`
- `package.json`
- `.vscode/tasks.json`
- `audit_condominio.sh`
- `audit_condominio_full.sh`
- `manual_tecnico_condominio_2026-11-03_19-42-06.md`

### Servidor Piave

- `~/stage-platform/core/supabase-condominio/docker-compose.yml`
- `~/stage-platform/core/supabase-condominio/init/roles.sql`
- `~/stage-platform/core/supabase-condominio/kong/kong.yml`
- `~/stage-platform/apps/stage-condominio-app/src/`
- `~/stage-platform/apps/stage-condominio-app/.env.stage`
- `~/stage-platform/bin/stage-cli`
- `~/.config/containers/systemd/stage-stage-condominio-app.container`
- `~/condosmart/backup-db.sh` (patrón de respaldo, no aplicado a Condominio)

---

## 12. Conclusión

El despliegue funciona y la app puede autenticar usuarios, pero la seguridad de autorización está rota en el punto más importante: cualquier usuario puede convertirse en `superadmin`, cualquier visitante puede leer todos los perfiles y cualquier dispositivo de la tailnet puede entrar a Studio, Inbucket o PostgreSQL. Además, no hay respaldos de la base y el build no es reproducible.

La prioridad no es añadir funcionalidad de condominio, sino **cerrar las cuatro rutas P0 y la exposición de servicios**, tomar un respaldo y recién después continuar con el desarrollo. Mientras esas condiciones no se cumplan, este entorno no debe usarse con datos reales ni presentarse como listo para producción.

---

**Fin del informe.** No se realizaron cambios en el repositorio, la base de datos, los contenedores ni los servicios durante esta auditoría.
