# Auditoría profunda — Condominio App

> **Fecha:** 2026-11-04. **Entorno:** Piave, preproducción de prueba. **Rama:** `hardening/preprod-condominio`. **Estado:** no producción.

## 1. Alcance y método

Se revisó código, migraciones, base de datos, RLS, grants, contenedores, puertos, despliegue, backups y documentación. Se verificó con `npm run build`, `npm audit --omit=dev`, consultas SQL, healthchecks y pruebas manuales con JWT para `superadmin`, `admin` y `user`.

## 2. Resumen ejecutivo

La aplicación quedó en preproducción controlada. Perfiles, empresas administradoras, membresías y condominios tienen RLS por rol y por empresa. Los condominios y unidades están aislados por membresía. El build es reproducible, los secretos no están en el repositorio y el backup automático funciona.

Quedan pendientes, por decisión o alcance: Inbucket temporal, avatares públicos, copia off-host de backups, ausencia de tests/CI, Node 20, grants amplios en tablas de referencia y observabilidad.

## 3. Evidencia verificada

| Control | Resultado |
|---|---|
| `npm run build` | OK |
| `npm audit --omit=dev` | 0 vulnerabilidades |
| App HTTP `:3002` | 200 |
| Auth health `:8200/auth/v1/health` | 200 |
| Contenedor app | `healthy` |
| `profiles` RLS | `true` |
| `management_companies` RLS | `true` |
| `management_company_members` RLS | `true` |
| `condominiums` RLS | `true` |
| `units` RLS | `true` |
| Backup timer | `active` |
| Último backup | `condo-sb-db-20261104-033203.dump`, checksum OK |
| Permisos de backup | `600` |

## 4. Base de datos

Tablas con RLS habilitado:

- `profiles`
- `management_companies`
- `management_company_members`
- `condominiums`
- `units`
- `regions`
- `communes`

Modelo implementado:

- `profiles`: `anon` sin acceso; usuario autenticado lee/actualiza su perfil; `superadmin` administra todo; admins leen perfiles de su empresa y propietarios de sus unidades.
- `handle_new_user`: fuerza `role='user'`.
- Trigger `tr_protect_profile_sensitive_fields`: bloquea cambios sensibles fuera de superadmin.
- `management_companies`: superadmin administra; admins leen su empresa por membresía activa.
- `management_company_members`: superadmin administra; miembros activos leen miembros de su empresa; un usuario activo pertenece a una sola empresa.
- `condominiums`: superadmin y admins activos de la empresa pueden leer, crear, editar y desactivar lógicamente.
- `units`: superadmin y admins activos de la empresa pueden leer, crear, editar y desactivar lógicamente; usuarios leen solo sus unidades.
- `regions` y `communes`: lectura pública.

Conteos actuales:

- `profiles`: 299
- `regions`: 16
- `communes`: 104
- `management_companies`: 10
- `management_company_members`: 3
- `condominiums`: 3
- `units`: 292

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
| P2-1 | Administración de usuarios no alineada con RLS | Corregido |
| Nuevo | Empresas administradoras | Implementado |
| Nuevo | Asociación admin-empresa | Implementado |
| Nuevo | Condominios por empresa | Implementado |
| Nuevo | Unidades por condominio | Implementado |

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
| P3 | Branding | Título ya corregido, pero puede requerir ajustes finales |
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
- `units`: listado y CRUD por empresa; admin/superadmin gestionan, user solo consulta su unidad en modo solo lectura.
- `SuperAdminTabla`: gestión global de usuarios, solo superadmin.

## 9. Verificación realizada

- Build local y remoto OK.
- Migraciones aplicadas en Piave.
- RLS verificada con superadmin, admin y usuario normal.
- Anon sin acceso a `profiles`, `management_companies`, `condominiums` y `units`.
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


## 11. Ejecución del plan de endurecimiento

| Fase | Estado | Evidencia |
|---|---|---|
| 1. Avatares privados | Cerrada | Bucket `avatars` privado; URLs firmadas de 15 minutos; código desplegado |
| 2. Campos limitados de perfil | Cerrada | Trigger y UI restringen edición para `user`; prueba SQL de escalada falla |
| 3. Backup off-host en Mac | Cerrada | Copia en `~/Backups/condo-sb-db`, checksum verificado |
| 4. Pruebas RLS | Cerrada | `supabase/tests/rls_authorization.sql` ejecutado con `ON_ERROR_STOP=1` |
| 5. Responsive | Implementada, verificación visual pendiente | CSS con media queries; build OK |
| 6. CI | Implementada | `.github/workflows/ci.yml` con build, audit y prueba RLS condicional |
| 7. Cabeceras y observabilidad | Parcial | CSP y `Referrer-Policy` en `index.html`; alertas pendientes |

Resultado: no se detectaron regresiones en build ni en RLS. Pendientes de producción: Inbucket temporal, backup off-host automatizado, TLS, alertas y pruebas visuales responsive.
