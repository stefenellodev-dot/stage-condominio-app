# Roadmap y brechas — Condominio App

> **Estado:** actualizado 2026-11-04. Aplicados P0-1, P0-2, P1-1 (perfiles/CORS), P1-2 (puerto), P1-5 y parte de P3-1. P1-4 tiene backup local; off-host pendiente. P0-3 Inbucket sigue abierto temporalmente por pruebas. **Regla:** no producción mientras quede un P0 abierto.
>
> Los IDs coinciden con la [auditoría profunda](../auditoria_profunda_condominio_2026-11-03.md).

---

## 1. Fases

| Fase | Ventana | Objetivo | Criterio de salida |
|---|---|---|---|
| 0 | 0–24 h | Cerrar exposición y escalada | P0-1 a P0-4 cerrados y verificados |
| 1 | 1–7 días | Reducir lectura/escritura indebida y asegurar recuperación | P1-1 a P1-6 cerrados |
| 2 | 7–30 días | Endurecer operación y calidad | P2-1 a P2-7 cerrados |
| 3 | 30–90 días | Producto y observabilidad | P3-1 a P3-3 y dominio mínimo |

---

## 2. Backlog priorizado

| ID | Prioridad | Brecha | Acción mínima | Aceptación |
|---|---|---|---|---|
| P0-1 | Crítica | Autoascenso a `superadmin` | Revocar UPDATE de `role`; `WITH CHECK`; trigger de rol | PATCH a `role` falla para no-superadmin |
| P0-2 | Crítica | Rol inyectable en signup | Forzar `'user'` en `handle_new_user`; cerrar signup | Signup con metadata `role` crea `user` |
| P0-3 | Crítica | Inbucket sin auth | Quitar `:9100`; SMTP real; auth si se mantiene | `:9100` no accesible desde otro nodo |
| P0-4 | Crítica | Studio sin auth | Quitar `:8280`; auth/proxy si se necesita | `:8280` no accesible o exige login |
| P1-1 | Alta | Lectura anónima de perfiles y CORS `*` | RLS por usuario/admin; revocar `anon`; CORS exacto | Anon recibe 0 filas/401; origen no permitido falla |
| P1-2 | Alta | PostgreSQL expuesto y contraseña compartida | Cerrar `:54322`; TLS si hay remoto; secretos | Puerto cerrado; credencial rotada |
| P1-3 | Alta | Avatares públicos/sobrescribibles | Bucket privado; políticas por `auth.uid()` | Usuario A no lee/escribe avatar de B |
| P1-4 | Alta | Sin backups | Timer + `pg_dump` + checksum + off-host | Backup diario y restore de prueba |
| P1-5 | Alta | Build no reproducible | `npm ci`, lockfile, digests, non-root, healthcheck | Build idéntico y auditado |
| P1-6 | Alta | Dominio ausente | Migraciones versionadas + RLS + reemplazar placeholder | Modelo mínimo con pruebas |
| P2-1 | Media | `SuperAdminTabla` solo cubre `superadmin`; falta alcance `admin` | RPC administrativa, membresía por comunidad, auditoría | Cambios de rol/estado funcionan solo para el admin de su comunidad |
| P2-2 | Media | Sin cabeceras de seguridad | CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` | Cabeceras presentes en respuestas |
| P2-3 | Media | GoTrue débil | URI allow list, rate limits, captcha, password policy, SMTP real | Configuración verificada |
| P2-4 | Media | Dependencias e imágenes | Actualizar Vite/esbuild; fijar versiones | `npm audit` sin high/critical |
| P2-5 | Media | Sin tests/lint/CI | ESLint, tests mínimos, pipeline | CI verde en PR |
| P2-6 | Media | Manual/runbook erróneos | Reemplazar por estos docs; validar deploy | Deploy documentado y verificado |
| P2-7 | Media | Logs con PII y artefactos | Redacción, retención, `.gitignore`/`.dockerignore` | Sin secretos/PII en repo ni logs |
| P3-1 | Baja | Branding, `.env.example`, i18n | Título, nombre, placeholders, strings | Sin IP interna ni “Staging Auth Test” |
| P3-2 | Baja | Código muerto/RBAC inconsistente | Eliminar `operator`, unificar `roles.js` | Un solo modelo de roles |
| P3-3 | Baja | Observabilidad/tuning | Healthchecks, alertas, slow queries | Panel y alertas básicas |

---

## 3. Plan inmediato (0–24 h)

1. Backup manual antes de tocar RLS.
2. Corregir P0-1 y P0-2 en una migración revisada.
3. Cerrar `8280` y `54322`; `9100` queda temporal por pruebas.
4. Rotar service key/JWT si hay sospecha de acceso.
5. Verificar con las pruebas de aceptación.
6. Recién entonces permitir usuarios de prueba.

## 4. Corto plazo (1–7 días)

1. P1-1 hecho para `profiles`/CORS; storage sigue en P1-3.
2. P1-2: puerto cerrado; rotación de secretos pendiente.
3. Cerrar P1-3: bucket privado y políticas por propietario.
4. Backup local implementado; off-host y restore automatizado pendientes.
5. `npm ci`, non-root y healthcheck hechos; digests y Node ≥22 pendientes.
6. Definir migraciones del dominio.

## 5. Medio plazo (7–30 días)

1. RPC administrativa para roles/estado con auditoría.
2. Cabeceras de seguridad y endurecimiento de GoTrue.
3. Tests, lint y CI.
4. Actualizar dependencias y escaneo de contenedores.
5. Redacción de logs y limpieza de artefactos.

---

## 6. Criterios de aceptación globales

- Ningún P0/P1 abierto.
- `anon` no lee `profiles` ni `storage.objects`.
- Un usuario no puede cambiar su `role`.
- Studio, Inbucket y PostgreSQL no accesibles desde la tailnet.
- Backup reciente y restore probado.
- Build reproducible y auditado.
- Deploy verificado por imagen/asset, no solo por `podman restart`.
- Documentación y runbook alineados con el código.

---

## 7. Enlaces

- [security.md](security.md)
- [operations.md](operations.md)
- [runbook.md](runbook.md)
- [domain.md](domain.md)
- [Auditoría profunda](../auditoria_profunda_condominio_2026-11-03.md)
