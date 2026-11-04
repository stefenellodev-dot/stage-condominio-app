# Auditoría profunda — Condominio App

> **Fecha:** 2026-11-04. **Entorno:** Piave, preproducción de prueba. **Rama:** `hardening/preprod-condominio`. **Estado:** no producción.

## 1. Alcance y método

Se revisó el código, las migraciones, la base de datos, la configuración de contenedores, los puertos, el despliegue y la documentación. Se verificó con `npm run build`, `npm audit`, consultas SQL, healthchecks y pruebas manuales de RLS.

## 2. Resumen ejecutivo

El proyecto pasó de una exposición crítica a un estado de preproducción controlada: RLS de perfiles corregida, signup seguro, puertos administrativos cerrados o restringidos, CORS exacto, build reproducible y backup automatizado. Además se implementaron módulos de empresas administradoras, asociación de admins y condominios con RLS por membresía.

Quedan abiertos, por decisión o por alcance: Inbucket temporal, avatares públicos, ausencia de TLS, ausencia de tests/CI, copia off-host de backups y observabilidad.

## 3. Evidencia verificada

| Control | Resultado |
|---|---|
| `npm run build` | OK, 94-95 módulos transformados |
| `npm audit --omit=dev` | 0 vulnerabilidades |
| App HTTP `:3002` | 200 |
| Auth health `:8200/auth/v1/health` | 200 |
| Contenedor app | `healthy` |
| `profiles` RLS | `true` |
| `anon` sobre `profiles` | sin acceso |
| `anon` sobre `management_companies` | sin acceso |
| `condominiums` RLS | `true` |
| Backup timer | `active` |
| Último backup | `condo-sb-db-20261104-033203.dump`, checksum OK |
| Permisos de backup | `600` |

## 4. Base de datos y RLS

Tablas con RLS habilitado:

- `profiles`
- `management_companies`
- `management_company_members`
- `condominiums`
- `regions`
- `communes`

Modelo implementado:

- `profiles`: `anon` sin acceso; usuario autenticado lee/actualiza su perfil; `superadmin` lee/actualiza todos; admins leen perfiles de usuarios de su empresa.
- `handle_new_user`: fuerza `role='user'`.
- Trigger `tr_protect_profile_sensitive_fields`: bloquea cambios de `id`, `email`, `role`, `status`, `deleted_at`, `created_at` y `updated_at` fuera de superadmin.
- `management_companies`: solo superadmin crea/edita; admins leen su empresa por membresía activa.
- `management_company_members`: superadmin administra; miembros activos leen miembros de su empresa; índice único parcial garantiza una empresa activa por usuario.
- `condominiums`: superadmin y admins activos de la empresa pueden leer, crear, editar y desactivar lógicamente los condominios de esa empresa.
- `regions` y `communes`: lectura pública.

Conteos actuales:

- `profiles`: 5
- `regions`: 16
- `communes`: 104
- `management_companies`: 10
- `management_company_members`: 3
- `condominiums`: 3

## 5. Hallazgos resueltos

| ID | Hallazgo | Estado |
|---|---|---|
| P0-1 | Autoascenso a `superadmin` | Corregido |
| P0-2 | Rol inyectable en signup | Corregido |
| P0-4 | Studio expuesto sin autenticación | Mitigado: solo `127.0.0.1:8280` |
| P1-1 | Lectura anónima de perfiles y CORS `*` | Corregido para `profiles` y CORS |
| P1-2 | PostgreSQL expuesto | Corregido: `54322` cerrado |
| P1-4 | Sin backups | Parcial: timer local y restore de datos verificado |
| P1-5 | Build no reproducible | Parcial: `npm ci`, non-root, healthcheck y `.dockerignore` |
| P2-1 | Administración de usuarios no alineada con RLS | Corregido: `SuperAdminTabla`, solo superadmin |
| Nuevo | Empresas administradoras | Implementado |
| Nuevo | Asociación admin-empresa | Implementado |
| Nuevo | Condominios por empresa | Implementado |

## 6. Hallazgos abiertos

| Prioridad | Hallazgo | Detalle |
|---|---|---|
| P0 temporal | Inbucket sin autenticación | `:9100` abierto por decisión de pruebas; cerrar al terminar |
| P1 | Avatares públicos y sobrescribibles | Bucket `avatars` sigue público |
| P1 | Sin copia off-host de backups | Solo backup local en Piave |
| P1 | Secretos y exposición residual | Contraseña compartida de PostgreSQL sin rotar |
| P2 | Sin tests, lint ni CI | No existe infraestructura de tests |
| P2 | Node 20 en build | Supabase exige Node >=22; build funciona con advertencia |
| P2 | Grants amplios en `regions` y `communes` | `anon` y `authenticated` tienen ALL; RLS bloquea escrituras, pero conviene revocar |
| P2 | Observabilidad | Sin alertas, métricas ni slow query log |
| P3 | Branding | Título sigue siendo “Staging Auth Test” |
| P3 | `init.sql` desalineado | No usar como fuente de verdad |

## 7. Red y puertos

| Puerto | Servicio | Estado actual |
|---|---|---|
| `3002` | App | Tailscale, activo |
| `8200` | Kong | Tailscale, CORS restringido |
| `8280` | Studio | Solo `127.0.0.1`, sin auth |
| `9100` | Inbucket | Tailscale, sin auth, temporal |
| `54322` | PostgreSQL | Cerrado |

## 8. Módulos implementados

- `management_companies`: CRUD completo para superadmin; vista completa estilo `ProfileSection`.
- Asociación admin-empresa: lista de admins, asignación y baja lógica.
- `condominiums`: CRUD por empresa; superadmin gestiona todas, admin solo las suyas.
- `SuperAdminTabla`: gestión global de usuarios, solo superadmin.

## 9. Verificación realizada

- Build local y remoto OK.
- Migraciones aplicadas en Piave.
- RLS verificada con superadmin, admin y usuario normal.
- Anon sin acceso a `profiles`, `management_companies` y `condominiums`.
- Backup manual y automático verificados con checksum.
- Contenedor app en estado `healthy`.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## 10. Recomendaciones para producción futura

1. Cerrar Inbucket o reemplazarlo por SMTP real.
2. Privatizar bucket `avatars` y políticas por propietario.
3. Implementar copia off-host cifrada de backups.
4. Agregar tests mínimos de RLS y CI.
5. Actualizar Node a 22 en el Dockerfile.
6. Revocar grants de escritura sobre `regions` y `communes`.
7. Agregar cabeceras de seguridad y observabilidad.
8. Separar formalmente producción de preproducción.
