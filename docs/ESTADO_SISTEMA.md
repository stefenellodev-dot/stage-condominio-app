# Estado del Sistema: Mac (Código) vs Piave (Despliegue e Infraestructura)
**Fecha de levantamiento:** 2026-11-09 12:26:14
**Servidor Remoto (Infraestructura y Producción):** piave (100.126.211.117)
**Host Local (Desarrollo):** dstefene1-mac

---

## 1. Servidor Físico Piave (Host y Recursos)
- **HOSTNAME:** `piave`
- **KERNEL:** `6.8.0-139-generic`
- **UPTIME:** `up 6 weeks, 5 days, 22 hours, 44 minutes`
- **DISK_USAGE:** `56G/232G (26% en uso)`
- **RAM_USAGE:** `2817MB / 7829MB (36.0%)`
- **PODMAN_VER:** `podman version 4.9.3`

# Verificar buckets de storage
echo "### 1.2 Storage Buckets (condo-sb-storage)" >> ""
echo "" >> ""
for bucket in colillas comprobantes-pago certificaciones evidencias-infracciones actas-asambleas; do
  count=
  if [ "" = "1" ]; then
    echo "- Bucket ``: ✅ registrado" >> ""
  else
    echo "- Bucket ``: ❌ no encontrado" >> ""
  fi
done
echo "" >> ""
- **Base de Datos:** `postgres`
- **Tamaño en Disco:** `15 MB`
- **Conexiones Activas:** `7`

---

## 2. Auditoría del Frontend Desplegado en Piave (Runtime)

| Parámetro Evaluado | Valor Detectado en Piave |
| :--- | :--- |
| **Contenedor Web** | `stage-stage-condominio-app` |
| **Estado del Contenedor** | `running` |
| **Último Inicio / Reinicio** | `2026-11-09 15:25:47.153531106 +0000 UTC` |
| **Veces Reiniciado (Crash count)** | `0` |
| **Directorio Servido (Web Root)** | `/app/dist` |
| **Fecha de Compilación en Piave** | `2026-11-09 15:25:05.000000000 +0000` |
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
| `svc-gateway` | `Up 6 weeks
10.89.1.6` | Up 6 weeks | `` |
| `svc-mailhog` | `Up 6 weeks
10.89.1.17` | Up 6 weeks | `127.0.0.1:8025->8025/tcp` |
| `svc-pg-meta` | `Up 6 weeks
10.89.1.18` | Up 6 weeks | `127.0.0.1:8090->8080/tcp` |
| `agent-orchestrator-postgres` | `Up 5 weeks (healthy)
10.89.2.2` | Up 5 weeks (healthy) | `127.0.0.1:55432->5432/tcp` |
| `agent-orchestrator` | `Up 5 weeks
10.89.2.37` | Up 5 weeks | `127.0.0.1:18080->8080/tcp, 100.126.211.117:18080->8080/tcp` |
| `svc-rest` | `Up 5 weeks
10.89.1.15` | Up 5 weeks | `` |
| `rollback-test-db` | `Up 4 weeks` | Up 4 weeks | `` |
| `svc-push` | `Up 4 weeks
10.89.1.26` | Up 4 weeks | `` |
| `stage-demo-app` | `Up 6 days
10.89.3.24` | Up 6 days | `127.0.0.1:3000->3000/tcp, 100.126.211.117:3000->3000/tcp` |
| `fin-engine-redis` | `Up 6 days
10.89.0.83` | Up 6 days | `` |
| `fin-engine-notifier` | `Up 6 days
10.89.0.98` | Up 6 days | `` |
| `fin-engine-brain` | `Up 6 days
10.89.0.100` | Up 6 days | `` |
| `fin-engine-dashboard` | `Up 6 days
10.89.0.99` | Up 6 days | `0.0.0.0:8080->8080/tcp` |
| `svc-kong` | `Up 6 days
10.89.1.46` | Up 6 days | `127.0.0.1:8000->8000/tcp` |
| `svc-auth` | `Up 6 days
10.89.1.45` | Up 6 days | `` |
| `svc-email` | `Up 6 days
10.89.1.44` | Up 6 days | `127.0.0.1:8091->8091/tcp` |
| `cs-web` | `Up 6 days
10.89.1.47` | Up 6 days | `127.0.0.1:8082->80/tcp` |
| `stage-sb-db` | `Up 6 days (healthy)
10.89.3.90` | Up 6 days (healthy) | `100.126.211.117:54321->5432/tcp` |
| `stage-sb-studio` | `Up 6 days
10.89.3.91` | Up 6 days | `100.126.211.117:8180->3000/tcp` |
| `stage-sb-kong` | `Up 6 days (healthy)
10.89.3.92` | Up 6 days (healthy) | `100.126.211.117:8100->8000/tcp` |
| `stage-sb-inbucket` | `Up 6 days
10.89.3.93` | Up 6 days | `100.126.211.117:9000->9000/tcp` |
| `stage-sb-rest` | `Up 6 days
10.89.3.94` | Up 6 days | `` |
| `stage-sb-auth` | `Up 6 days
10.89.3.95` | Up 6 days | `` |
| `stage-sb-storage` | `Up 6 days
10.89.3.96` | Up 6 days | `` |
| `stage-sb-meta` | `Up 6 days
10.89.3.97` | Up 6 days | `` |
| `stage-stage-auth-app` | `Up 6 days
10.89.3.116` | Up 6 days | `127.0.0.1:3001->3000/tcp, 100.126.211.117:3001->3000/tcp` |
| `condo-sb-inbucket` | `Up 3 days
10.89.3.19` | Up 3 days | `100.126.211.117:9100->9000/tcp` |
| `condo-sb-kong` | `Up 45 hours (healthy)
10.89.3.115` | Up 45 hours (healthy) | `100.126.211.117:8200->8000/tcp` |
| `vaultwarden` | `Up 3 days (unhealthy)
10.89.4.4` | Up 3 days (unhealthy) | `100.126.211.117:8222->80/tcp` |
| `condo-sb-db` | `Up 3 days (healthy)
10.89.3.5` | Up 3 days (healthy) | `` |
| `condo-sb-studio` | `Up 3 days
10.89.3.6` | Up 3 days | `127.0.0.1:8280->3000/tcp` |
| `condo-sb-rest` | `Up 2 days
10.89.3.77` | Up 2 days | `` |
| `condo-sb-auth` | `Up 45 hours
10.89.3.114` | Up 45 hours | `` |
| `condo-sb-storage` | `Up 3 days
10.89.3.9` | Up 3 days | `` |
| `condo-sb-meta` | `Up 3 days
10.89.3.10` | Up 3 days | `` |
| `fin-engine-agent-pablo` | `Up 2 days
10.89.0.41` | Up 2 days | `` |
| `fin-engine-agent-marcos` | `Up 2 days
10.89.0.42` | Up 2 days | `` |
| `fin-engine-agent-pedro` | `Up 2 days
10.89.0.43` | Up 2 days | `` |
| `concierge-test` | `Up 40 hours` | Up 40 hours | `0.0.0.0:3003->3000/tcp` |
| `stage-new` | `Up 40 hours` | Up 40 hours | `0.0.0.0:3005->3000/tcp` |
| `concierge-test2` | `Up 39 hours` | Up 39 hours | `0.0.0.0:3006->3000/tcp` |
| `stage-stage-condominio-app` | `Up 30 seconds (starting)
10.89.3.129` | Up 30 seconds (starting) | `127.0.0.1:3002->3000/tcp, 100.126.211.117:3002->3000/tcp` |

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


---

## 6. Código Local en Mac
- **Ruta:** `/Users/stefenello/development/stage-condominio-app`
- **Branch Git:** `main`
- **Último Commit:** `9289bed - feat(announcements): standardize company/condo selectors + load test data (2026-11-09 12:23:04 -0300)`
- **Archivos Pendientes de Commit:**
```text

```

---

## 7. Errores Detectados en Logs de Contenedores en Piave
```text
---LOG_ERROR:svc-kong---
10.89.1.44 - - [09/Nov/2026:15:26:33 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "50bcc303ddca9970163ba82f20a88535"
10.89.1.44 - - [09/Nov/2026:15:26:48 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "f09fb27a53daba6f1027ca38eb47e72a"
10.89.1.44 - - [09/Nov/2026:15:27:03 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "75eac06c4c29a8171add7742d86d9964"
---LOG_ERROR:svc-auth---
{"component":"api","error":"400: Could not parse request body as JSON: unexpected end of JSON input","level":"info","method":"POST","msg":"400: Could not parse request body as JSON: unexpected end of JSON input","path":"/token","referer":"https://www.ecomunity.cl","remote_addr":"10.89.1.46","request_id":"6fd6746c-de67-4330-a5d4-8089d4519f5f","time":"2026-11-07T00:31:12Z"}
{"component":"api","duration":43057563,"error_code":"bad_json","level":"info","method":"POST","msg":"request completed","path":"/token","referer":"https://www.ecomunity.cl","remote_addr":"10.89.1.46","request_id":"6fd6746c-de67-4330-a5d4-8089d4519f5f","status":400,"time":"2026-11-07T00:31:12Z"}
---LOG_ERROR:condo-sb-inbucket---
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.3.19:46948","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-08T00:38:35Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.3.19:48648","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-08T14:25:54Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.3.19:47558","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-09T02:42:57Z","message":"Socket error"}
---LOG_ERROR:condo-sb-db---
10.89.3.77 2026-11-09 14:03:29.816 UTC [225012] postgres@postgres ERROR:  column unit_expense_bills.condominium_id does not exist at character 190
10.89.3.77 2026-11-09 14:03:33.378 UTC [225001] postgres@postgres ERROR:  column unit_expense_bills.condominium_id does not exist at character 190
10.89.3.77 2026-11-09 14:11:52.953 UTC [225392] postgres@postgres ERROR:  column unit_expense_bills.condominium_id does not exist at character 190
---LOG_ERROR:condo-sb-auth---
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.115","request_id":"e8aa53da-cb5b-4ba5-a306-783659dd12a9","time":"2026-11-09T13:36:08Z"}
{"component":"api","error":"invalid_grant: Invalid Refresh Token: Refresh Token Not Found","level":"info","method":"POST","msg":"invalid_grant: Invalid Refresh Token: Refresh Token Not Found","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.115","request_id":"5d33ecdb-0b38-4294-a7aa-cec7aa6eb22f","time":"2026-11-09T14:04:17Z"}
```
