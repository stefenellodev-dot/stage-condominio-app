# Documentación — Condominio App

> **Estado:** staging / no producción. **Última verificación:** 2026-11-03.
>
> **No usar con datos reales** hasta cerrar los hallazgos P0 de la [auditoría profunda](../auditoria_profunda_condominio_2026-11-03.md): autoascenso a `superadmin`, inyección de rol en signup, Inbucket sin autenticación y Studio expuesto.

---

## 1. Qué es este set

Esta carpeta es la referencia técnica y operativa de `stage-condominio-app`. Reemplaza al manual histórico y separa la documentación por audiencia para evitar mezclar estado real, modelo objetivo y runbooks.

| Documento | Audiencia | Qué responde |
|---|---|---|
| [architecture.md](architecture.md) | Desarrollo / arquitectura | Cómo está compuesto el sistema, flujo de auth, límites de confianza y estado actual vs objetivo. |
| [security.md](security.md) | Desarrollo / seguridad | Modelo de amenazas, RLS actual y objetivo, storage, secretos, CORS y criterios de aceptación. |
| [operations.md](operations.md) | Operación / DevOps | Contenedores, puertos, despliegue correcto, backups, healthchecks y rotación de secretos. |
| [runbook.md](runbook.md) | Operación / guardia | Procedimientos para 502, recarga de esquema, superadmin, restore y rollback. |
| [domain.md](domain.md) | Producto / datos | Esquema implementado y modelo de dominio propuesto para condominios. |
| [frontend.md](frontend.md) | Frontend | Componentes, auth, roles, módulos, i18n y deuda técnica. |
| [modules.md](modules.md) | Módulos | Flujos, permisos y acciones por rol. |
| [roadmap.md](roadmap.md) | Todos | Brechas priorizadas P0/P1/P2/P3 y criterios de aceptación. |
| [audits/README.md](audits/README.md) | Todos | Índice de auditorías y documentos históricos obsoletos. |

---

## 2. Estado actual en una línea

La app autentica y carga perfiles, pero el esquema real solo tiene `profiles`, `regions` y `communes`; no existe el dominio de condominio. La seguridad de autorización está rota y varios servicios de administración están expuestos en la tailnet.

### Hallazgos que bloquean producción

| ID | Hallazgo | Estado |
|---|---|---|
| P0-1 | Un usuario autenticado puede ascender a `superadmin` actualizando `profiles.role`. | Corregido |
| P0-2 | `handle_new_user` toma `role` desde `raw_user_meta_data`. | Corregido |
| P0-3 | Inbucket sin autenticación permite leer confirmaciones y OTP de recuperación. | Abierto temporalmente; aceptado en pruebas |
| P0-4 | Supabase Studio expuesto sin autenticación, con service key. | Mitigado: solo localhost |
| P1-1 | `anon` puede leer todos los perfiles (email, RUT, teléfono) y CORS es `*`. | Corregido para perfiles/CORS |
| P1-2 | PostgreSQL expuesto en la tailnet, sin TLS y con contraseña compartida en texto plano. | Parcial: puerto cerrado; rotación pendiente |
| P1-3 | Avatares públicos y sobrescribibles por cualquier usuario autenticado. | Abierto |
| P1-4 | Sin respaldos de la base de Condominio. | Parcial: timer local; off-host pendiente |
| P1-5 | Build no reproducible y cadena de suministro débil. | Parcial: `npm ci`, non-root y healthcheck; digests/Node pendientes |
| P1-6 | Esquema de dominio ausente y módulo principal vacío. | Abierto |

El detalle, evidencia y remediación están en la [auditoría profunda](../auditoria_profunda_condominio_2026-11-03.md).

---

## 3. Fuente de verdad y convenciones

### 3.1 Orden de prioridad

1. **Código, configuración y catálogo real de PostgreSQL** para el estado actual.
2. **Auditoría profunda** para evidencia, fechas y hallazgos.
3. **Estos documentos** para interpretación, operación y objetivos.

Si hay conflicto, gana el código/configuración verificada; hay que corregir la documentación.

### 3.2 Etiquetas

- **Verificado:** comprobado en el repositorio, el servidor o la base al 2026-11-03.
- **Propuesto:** diseño objetivo, todavía no implementado.
- **Obsoleto:** documento histórico; no usar para operar.

### 3.3 Reglas de redacción

- Sin tokens, contraseñas, claves, correos, UUID ni IPs completas.
- Usar placeholders: `<tailscale-ip>`, `<anon-key>`, `<service-role-key>`, `<db-password>`, `<jwt-secret>`, `<uuid>`.
- Las IPs internas de contenedores son dinámicas: no documentarlas como fijas.
- Los ejemplos SQL son ilustrativos; aplicar cambios con migraciones revisadas.

---

## 4. Lectura recomendada

### Si vas a desarrollar

1. [frontend.md](frontend.md)
2. [architecture.md](architecture.md)
3. [security.md](security.md)
4. [domain.md](domain.md)

### Si vas a operar o desplegar

1. [operations.md](operations.md)
2. [runbook.md](runbook.md)
3. [audits/README.md](audits/README.md) para contexto histórico

### Si vas a revisar seguridad

1. [security.md](security.md)
2. [auditoría profunda](../auditoria_profunda_condominio_2026-11-03.md)
3. [roadmap.md](roadmap.md)

---

## 5. Mantenimiento

Actualizar estos documentos cuando cambie:

- Una política RLS, trigger o función de autorización.
- Un puerto, contenedor, imagen o procedimiento de despliegue.
- El esquema de base de datos o una migración.
- Un rol, módulo o flujo de autenticación.
- Un backup, healthcheck o procedimiento de incidente.

Al cerrar un hallazgo P0/P1, actualizar [roadmap.md](roadmap.md) y la matriz de estado de este índice. La fecha de “última verificación” debe reflejar la última revisión real, no la última edición cosmética.

---

## 6. Auditoría canónica e histórico

- **Auditoría canónica:** [auditoria_profunda_condominio_2026-11-03.md](../auditoria_profunda_condominio_2026-11-03.md).
- **Documentos históricos:** [audits/README.md](audits/README.md). El manual técnico anterior está marcado como obsoleto y no debe usarse para operar.
