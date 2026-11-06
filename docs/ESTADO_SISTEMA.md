# Estado del Sistema: Mac (Código) vs Piave (Despliegue e Infraestructura)
**Fecha de levantamiento:** 2026-11-06 15:08:35
**Servidor Remoto (Infraestructura y Producción):** piave (100.126.211.117)
**Host Local (Desarrollo):** dstefene1-mac

---

## 1. Servidor Físico Piave (Host y Recursos)
- **HOSTNAME:** `piave`
- **KERNEL:** `6.8.0-139-generic`
- **UPTIME:** `up 6 weeks, 3 days, 1 hour, 26 minutes`
- **DISK_USAGE:** `43G/232G (20% en uso)`
- **RAM_USAGE:** `3429MB / 7829MB (43.8%)`
- **PODMAN_VER:** `podman version 4.9.3`

### 1.1 Base de Datos Central (`condo-sb-db`)
- **Base de Datos:** `postgres`
- **Tamaño en Disco:** `14 MB`
- **Conexiones Activas:** `6`

---

## 2. Auditoría del Frontend Desplegado en Piave (Runtime)

| Parámetro Evaluado | Valor Detectado en Piave |
| :--- | :--- |
| **Contenedor Web** | `stage-stage-condominio-app` |
| **Estado del Contenedor** | `running` |
| **Último Inicio / Reinicio** | `2026-11-06 17:56:05.096965085 +0000 UTC` |
| **Veces Reiniciado (Crash count)** | `0` |
| **Directorio Servido (Web Root)** | `/app/dist` |
| **Fecha de Compilación en Piave** | `2026-11-06 17:55:32.000000000 +0000` |
| **Título HTML Desplegado** | `<title>Sistema de Administración de Condominios</title>` |
| **Respuesta HTTP Puerto :3002** | `200` |
| **Servidor Web Interno** | `` |

### 2.1 Verificación de Código Compilado en Piave vs Fuente Mac
| Funcionalidad | En Código Local (Mac) | En Bundle JS Desplegado (Piave) | Estado de Despliegue |
| :--- | :--- | :--- | :--- |
| **Toggle Ver Contraseña** | ✅ En código fuente | `NO ENCONTRADO EN BUNDLE` | ⚠️ Requiere nuevo build en Piave |
| **Badge y Reglas Superadmin** | ✅ En código fuente | `PRESENTE EN BUNDLE` | ✅ Desplegado y Activo |

### 2.2 Archivos Estáticos Servidos por Nginx en Piave
```text

```

---

## 3. Estado de la Pila de Contenedores e IP Internas
| Contenedor | IP Interna Podman | Estado / Uptime | Puertos Expuestos |
| :--- | :--- | :--- | :--- |
| `svc-db` | `Up 6 weeks
10.89.1.13` | Up 6 weeks | `` |
| `svc-storage` | `Up 6 weeks
10.89.1.16` | Up 6 weeks | `` |
| `svc-gateway` | `Up 5 weeks
10.89.1.6` | Up 5 weeks | `` |
| `svc-mailhog` | `Up 5 weeks
10.89.1.17` | Up 5 weeks | `127.0.0.1:8025->8025/tcp` |
| `svc-pg-meta` | `Up 5 weeks
10.89.1.18` | Up 5 weeks | `127.0.0.1:8090->8080/tcp` |
| `agent-orchestrator-postgres` | `Up 5 weeks (healthy)
10.89.2.2` | Up 5 weeks (healthy) | `127.0.0.1:55432->5432/tcp` |
| `agent-orchestrator` | `Up 5 weeks
10.89.2.37` | Up 5 weeks | `127.0.0.1:18080->8080/tcp, 100.126.211.117:18080->8080/tcp` |
| `svc-rest` | `Up 5 weeks
10.89.1.15` | Up 5 weeks | `` |
| `rollback-test-db` | `Up 4 weeks` | Up 4 weeks | `` |
| `svc-push` | `Up 4 weeks
10.89.1.26` | Up 4 weeks | `` |
| `stage-demo-app` | `Up 3 days
10.89.3.24` | Up 3 days | `127.0.0.1:3000->3000/tcp, 100.126.211.117:3000->3000/tcp` |
| `fin-engine-redis` | `Up 3 days
10.89.0.83` | Up 3 days | `` |
| `fin-engine-notifier` | `Up 3 days
10.89.0.98` | Up 3 days | `` |
| `fin-engine-brain` | `Up 3 days
10.89.0.100` | Up 3 days | `` |
| `fin-engine-dashboard` | `Up 3 days
10.89.0.99` | Up 3 days | `0.0.0.0:8080->8080/tcp` |
| `fin-engine-agent-pedro` | `Up 3 days
10.89.0.102` | Up 3 days | `` |
| `fin-engine-agent-pablo` | `Up 3 days
10.89.0.103` | Up 3 days | `` |
| `fin-engine-agent-marcos` | `Up 3 days
10.89.0.104` | Up 3 days | `` |
| `svc-kong` | `Up 3 days
10.89.1.46` | Up 3 days | `127.0.0.1:8000->8000/tcp` |
| `svc-auth` | `Up 3 days
10.89.1.45` | Up 3 days | `` |
| `svc-email` | `Up 3 days
10.89.1.44` | Up 3 days | `127.0.0.1:8091->8091/tcp` |
| `cs-web` | `Up 3 days
10.89.1.47` | Up 3 days | `127.0.0.1:8082->80/tcp` |
| `stage-sb-db` | `Up 3 days (healthy)
10.89.3.90` | Up 3 days (healthy) | `100.126.211.117:54321->5432/tcp` |
| `stage-sb-studio` | `Up 3 days
10.89.3.91` | Up 3 days | `100.126.211.117:8180->3000/tcp` |
| `stage-sb-kong` | `Up 3 days (healthy)
10.89.3.92` | Up 3 days (healthy) | `100.126.211.117:8100->8000/tcp` |
| `stage-sb-inbucket` | `Up 3 days
10.89.3.93` | Up 3 days | `100.126.211.117:9000->9000/tcp` |
| `stage-sb-rest` | `Up 3 days
10.89.3.94` | Up 3 days | `` |
| `stage-sb-auth` | `Up 3 days
10.89.3.95` | Up 3 days | `` |
| `stage-sb-storage` | `Up 3 days
10.89.3.96` | Up 3 days | `` |
| `stage-sb-meta` | `Up 3 days
10.89.3.97` | Up 3 days | `` |
| `stage-stage-auth-app` | `Up 3 days
10.89.3.116` | Up 3 days | `127.0.0.1:3001->3000/tcp, 100.126.211.117:3001->3000/tcp` |
| `condo-sb-inbucket` | `Up 16 hours
10.89.3.19` | Up 16 hours | `100.126.211.117:9100->9000/tcp` |
| `condo-sb-kong` | `Up 18 hours (healthy)
10.89.3.246` | Up 18 hours (healthy) | `100.126.211.117:8200->8000/tcp` |
| `vaultwarden` | `Up 17 hours (unhealthy)
10.89.4.4` | Up 17 hours (unhealthy) | `100.126.211.117:8222->80/tcp` |
| `condo-sb-db` | `Up 17 hours (healthy)
10.89.3.5` | Up 17 hours (healthy) | `` |
| `condo-sb-studio` | `Up 17 hours
10.89.3.6` | Up 17 hours | `127.0.0.1:8280->3000/tcp` |
| `condo-sb-rest` | `Up 17 hours
10.89.3.7` | Up 17 hours | `` |
| `condo-sb-auth` | `Up 17 hours
10.89.3.8` | Up 17 hours | `` |
| `condo-sb-storage` | `Up 17 hours
10.89.3.9` | Up 17 hours | `` |
| `condo-sb-meta` | `Up 17 hours
10.89.3.10` | Up 17 hours | `` |
| `stage-stage-condominio-app` | `Up 12 minutes (healthy)
10.89.3.69` | Up 12 minutes (healthy) | `127.0.0.1:3002->3000/tcp, 100.126.211.117:3002->3000/tcp` |

---

## 4. Base de Datos en Piave: Tablas y Registros Reales
| Esquema | Tabla | Total Registros |
| :--- | :--- | :--- |


### Cuadre de Alícuotas por Condominio (Ley N° 21.442)
| Condominio | RUT | Unidades Reales | Suma de Alícuota | Estado Legal |
| :--- | :--- | :--- | :--- | :--- |


---

## 5. Pruebas de Integración Kong API Gateway (:8200)
| Tabla / Recurso | Código HTTP Real | Estado de la API |
| :--- | :--- | :--- |
| `/rest/v1/assemblies` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/assembly_attendees` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/assembly_topics` | `502` | ❌ Falla Upstream (502) |
| `/rest/v1/assembly_votes` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/bill_payments` | `502` | ❌ Falla Upstream (502) |
| `/rest/v1/common_area_bookings` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/common_areas` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/communes` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/condominiums` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/equipment_assets` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/expense_periods` | `502` | ❌ Falla Upstream (502) |
| `/rest/v1/expenses` | `502` | ❌ Falla Upstream (502) |
| `/rest/v1/maintenance_logs` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/management_companies` | `502` | ❌ Falla Upstream (502) |
| `/rest/v1/management_company_members` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/official_certifications` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/profiles` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/regions` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/unit_expense_bills` | `200` | ✅ Operativo (200 OK) |
| `/rest/v1/units` | `200` | ✅ Operativo (200 OK) |

---

## 6. Código Local en Mac
- **Ruta:** `/Users/stefenello/development/stage-condominio-app`
- **Branch Git:** `main`
- **Último Commit:** `d1e5399 - feat(maintenance): add maintenance module (assets, certs, logs) + DB migration + RLS (2026-11-06 14:54:09 -0300)`
- **Archivos Pendientes de Commit:**
```text
?? docs/ARQUITECTURA.md
?? docs/ESTADO_SISTEMA.md
?? run_live_audit.sh
```

---

## 7. Errores Detectados en Logs de Contenedores en Piave
```text
---LOG_ERROR:svc-kong---
10.89.1.44 - - [06/Nov/2026:18:08:48 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "696c6a5590539b3e66f36d2ea103282d"
10.89.1.44 - - [06/Nov/2026:18:09:04 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "38ae515c690dbf031c826a133d529347"
10.89.1.44 - - [06/Nov/2026:18:09:19 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "fce27b3f1aab65753059d173bd4e0938"
---LOG_ERROR:condo-sb-inbucket---
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.3.209:41588","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-05T20:36:28Z","message":"Socket error"}
{"level":"info","module":"lua","phase":"startup","path":"inbucket.lua","time":"2026-11-06T01:54:55Z","message":"Lua script file not found (this is not an error)"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.3.19:55848","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-06T02:55:24Z","message":"Socket error"}
---LOG_ERROR:condo-sb-kong---
2026/11/06 18:06:41 [error] 1135#0: *524766 connect() failed (113: Host is unreachable) while connecting to upstream, client: 10.89.3.246, server: kong, request: "POST /auth/v1/token?grant_type=password HTTP/1.1", upstream: "http://10.89.3.211:9999/token?grant_type=password", host: "100.126.211.117:8200"
2026/11/06 18:08:16 [error] 1135#0: *525662 connect() failed (113: Host is unreachable) while connecting to upstream, client: 10.89.3.246, server: kong, request: "POST /auth/v1/token?grant_type=password HTTP/1.1", upstream: "http://10.89.3.211:9999/token?grant_type=password", host: "100.126.211.117:8200"
2026/11/06 18:08:19 [error] 1135#0: *525662 connect() failed (113: Host is unreachable) while connecting to upstream, client: 10.89.3.246, server: kong, request: "POST /auth/v1/token?grant_type=password HTTP/1.1", upstream: "http://10.89.3.211:9999/token?grant_type=password", host: "100.126.211.117:8200"
---LOG_ERROR:condo-sb-db---
10.89.3.7 2026-11-06 18:06:09.530 UTC [44257] postgres@postgres ERROR:  permission denied for table profiles
10.89.3.7 2026-11-06 18:08:21.388 UTC [44356] postgres@postgres ERROR:  permission denied for table profiles
10.89.3.7 2026-11-06 18:08:21.413 UTC [44356] postgres@postgres ERROR:  permission denied for table units
---LOG_ERROR:condo-sb-auth---
{"component":"api","error":"400: Could not parse request body as JSON: invalid character 'e' looking for beginning of object key string","level":"info","method":"POST","msg":"400: Could not parse request body as JSON: invalid character 'e' looking for beginning of object key string","path":"/token","referer":"http://100.126.211.117:3002","remote_addr":"10.89.3.246","request_id":"9d91f337-7de2-4324-b66a-23166cfd9490","time":"2026-11-06T18:07:35Z"}
{"component":"api","error":"400: Could not parse request body as JSON: invalid character 'e' looking for beginning of object key string","level":"info","method":"POST","msg":"400: Could not parse request body as JSON: invalid character 'e' looking for beginning of object key string","path":"/token","referer":"http://100.126.211.117:3002","remote_addr":"10.89.3.246","request_id":"61f90ad4-9576-4745-830b-2db71b167c29","time":"2026-11-06T18:07:51Z"}
{"component":"api","error":"400: Could not parse request body as JSON: invalid character 'e' looking for beginning of object key string","level":"info","method":"POST","msg":"400: Could not parse request body as JSON: invalid character 'e' looking for beginning of object key string","path":"/token","referer":"http://100.126.211.117:3002","remote_addr":"10.89.3.246","request_id":"fc70187b-9a45-4a37-960d-a0e5d8e5d132","time":"2026-11-06T18:08:04Z"}
```
