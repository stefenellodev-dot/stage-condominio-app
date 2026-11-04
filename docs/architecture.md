# Arquitectura — Condominio App

> **Estado:** verificado 2026-11-03. **Ámbito:** staging en Piave. **No producción.**

---

## 1. Vista general

La aplicación es un frontend estático React/Vite servido por un contenedor Node (`serve -s`). El backend es Supabase self-hosted: Kong como gateway, GoTrue para autenticación, PostgREST para la API de datos, Storage para archivos y PostgreSQL como base. Studio, Inbucket y Meta son servicios auxiliares de administración.

```text
Navegador
   |
   +--> http://<tailscale-ip>:3002   app estática (serve -s)
   |
   +--> http://<tailscale-ip>:8200   Kong
             |
             +-- /auth/v1/     --> GoTrue
             +-- /rest/v1/     --> PostgREST --> PostgreSQL
             +-- /storage/v1/  --> Storage API --> PostgreSQL + volumen de archivos
             |
             +-- Studio :8280  (administración, sin auth)
             +-- Inbucket :9100 (buzón SMTP, sin auth)
             +-- PostgreSQL :54322 (acceso directo, sin TLS)
             +-- Meta :8080 interno (solo red de contenedores)
```

---

## 2. Componentes verificados

| Componente | Imagen / versión | Puerto host | Exposición actual | Estado deseado |
|---|---|---|---|---|
| Frontend | `localhost/stage-stage-condominio-app:latest` | `3002` | Tailscale | Mantener detrás de TLS/proxy |
| Kong | `kong:2.8.1-alpine` | `8200` | Tailscale | Mantener; restringir CORS |
| PostgREST | `postgrest:v12.0.2` | interno | Solo red de contenedores | Mantener |
| GoTrue | `gotrue:v2.158.1` | interno | Solo red de contenedores | Mantener; endurecer |
| Storage API | `storage-api:v1.11.1` | interno | Solo red de contenedores | Mantener; bucket privado |
| PostgreSQL | `supabase/postgres:15.6.1.139` | `54322` | Tailscale, `ssl=off` | **Quitar exposición**; TLS si hay acceso remoto |
| Studio | `supabase/studio:latest` | `8280` | Tailscale, sin auth | **Quitar exposición** o poner auth |
| Inbucket | `inbucket:latest` | `9100` | Tailscale, sin auth | **Quitar exposición** o poner auth |
| Meta | `postgres-meta:v0.84.2` | interno | Solo red de contenedores | Mantener |

Los contenedores `condo-sb-*` viven en la red `net-stage-platform`. Las IPs internas son dinámicas; no deben hardcodearse en documentación ni configuración.

---

## 3. Flujo de autenticación

1. El navegador llama a `supabase.auth.signUp` o `signInWithPassword` contra Kong/GoTrue.
2. GoTrue valida credenciales y emite un JWT firmado con el secreto compartido.
3. Si el registro requiere confirmación, GoTrue envía un correo a Inbucket.
4. El usuario confirma el código/OTP; GoTrue activa la cuenta.
5. El frontend guarda la sesión (comportamiento por defecto de Supabase JS) y carga el perfil desde `public.profiles`.
6. Cada request a PostgREST lleva el JWT; PostgreSQL evalúa RLS con `auth.uid()` y el rol `authenticated`/`anon`.
7. `profiles.role` alimenta la UI (`isAdmin`, `isSuperadmin`) y las funciones `is_admin()`/`is_superadmin()`.
8. Storage usa el mismo JWT y políticas RLS sobre `storage.objects`.

### Puntos críticos del flujo actual

- El rol se toma de `profiles.role`, no del JWT. Un cambio en la tabla surte efecto en la siguiente consulta.
- `handle_new_user` copia `raw_user_meta_data.role` a `profiles.role`; esto permite inyección de rol.
- Inbucket está expuesto y no tiene autenticación; confirmaciones y recuperaciones son legibles por la tailnet.
- La app no tiene un backend propio que valide reglas de negocio; la autorización depende de RLS.

---

## 4. Límites de confianza

| Límite | Qué hay de cada lado | Riesgo actual |
|---|---|---|
| Tailnet ↔ servicios | La app, Studio, Inbucket y PostgreSQL comparten la IP de Tailscale | Cualquier nodo puede intentar administrar la base o leer correos |
| Navegador ↔ API | La anon key es pública y está en el bundle | Sin RLS correcta, cualquiera lee datos |
| App ↔ Storage | El bucket `avatars` es público y las políticas solo validan `bucket_id` | Enumeración y sobrescritura de avatares |
| Contenedores ↔ DB | Contraseña estática compartida en `docker-compose.yml`/`roles.sql` | Movimiento lateral si se lee el home o un backup de configuración |
| Operador ↔ producción | El manual anterior describía un despliegue incorrecto | Cambios que no llegan a la imagen desplegada |

No se verificaron las ACL de Tailscale. Si existen, reducen el alcance de los servicios expuestos, pero no sustituyen el cierre de puertos y la autenticación.

---

## 5. Datos

### Implementado

- `public.profiles`: 26 columnas, 4 filas (1 `superadmin`, 3 `user`).
- `public.regions`: 16 filas.
- `public.communes`: 104 filas.

### Propuesto, no implementado

- `communities`, `buildings`, `units`, `expenses_period`, `unit_expenses`.
- Un modelo de membresía por comunidad para RLS multi-tenant.

Ver [domain.md](domain.md) para el detalle y las diferencias entre estado real y objetivo.

---

## 6. Estado actual vs objetivo

| Área | Actual | Objetivo |
|---|---|---|
| Frontend | HTTP en `:3002`, sin cabeceras de seguridad | HTTPS en proxy, CSP y cabeceras |
| API | Kong con CORS `*` | Orígenes exactos y métodos mínimos |
| Auth | Signup abierto, rol desde metadata | Signup cerrado/invitación, rol forzado a `user` |
| RLS | `profiles` legible por `anon`; UPDATE de rol permitido | RLS por usuario/admin, columnas restringidas |
| Storage | Bucket público, políticas por bucket | Bucket privado, políticas por propietario/ruta |
| Servicios admin | Studio/Inbucket/DB en Tailscale | Solo red interna o túnel autenticado |
| Backups | Sin backup de Condominio | Backup automático, checksum y restore probado |
| Build | `npm install`, imágenes `latest` | `npm ci`, lockfile, digests, usuario no root |

---

## 7. Restricciones y decisiones

- **IPs de contenedores dinámicas:** no documentar ni configurar IPs fijas; usar nombres DNS de la red.
- **Variables Vite:** se incorporan en build; cambiar `VITE_*` exige rebuild y redeploy.
- **App estática:** no hay SSR ni backend propio; cualquier regla de negocio debe vivir en PostgreSQL/PostgREST o en un servicio aparte.
- **Despliegue:** la tarea de VS Code usa `rsync` + `stage-cli deploy` (`podman build` + `systemctl --user restart`). `podman restart` no aplica una imagen nueva.
- **Servicios auxiliares:** Studio e Inbucket son de administración; no deben quedar accesibles a los usuarios de la app.

---

## 8. Enlaces

- [security.md](security.md)
- [operations.md](operations.md)
- [runbook.md](runbook.md)
- [domain.md](domain.md)
- [frontend.md](frontend.md)
- [Auditoría profunda](../auditoria_profunda_condominio_2026-11-03.md)
