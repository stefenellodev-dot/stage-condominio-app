# Estado del Sistema: Mac (Código) vs Piave (Despliegue e Infraestructura)
**Fecha de levantamiento:** 2026-11-10 21:14:19
**Servidor Remoto (Infraestructura y Producción):** piave (100.126.211.117)
**Host Local (Desarrollo):** dstefene1-mac

---

## 1. Servidor Físico Piave (Host y Recursos)
- **HOSTNAME:** `piave`
- **KERNEL:** `6.8.0-139-generic`
- **UPTIME:** `up 7 weeks, 7 hours, 32 minutes`
- **DISK_USAGE:** `58G/232G (27% en uso)`
- **RAM_USAGE:** `2890MB / 7829MB (36.9%)`
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
- **Tamaño en Disco:** `16 MB`
- **Conexiones Activas:** `6`

---

## 2. Auditoría del Frontend Desplegado en Piave (Runtime)

| Parámetro Evaluado | Valor Detectado en Piave |
| :--- | :--- |
| **Contenedor Web** | `stage-stage-condominio-app` |
| **Estado del Contenedor** | `running` |
| **Último Inicio / Reinicio** | `2026-11-11 00:14:17.189810091 +0000 UTC` |
| **Veces Reiniciado (Crash count)** | `0` |
| **Directorio Servido (Web Root)** | `/app/dist` |
| **Fecha de Compilación en Piave** | `2026-11-11 00:13:58.000000000 +0000` |
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
| `svc-db` | `Up 7 weeks
10.89.1.13` | Up 7 weeks | `` |
| `svc-storage` | `Up 7 weeks
10.89.1.16` | Up 7 weeks | `` |
| `svc-gateway` | `Up 6 weeks
10.89.1.6` | Up 6 weeks | `` |
| `svc-mailhog` | `Up 6 weeks
10.89.1.17` | Up 6 weeks | `127.0.0.1:8025->8025/tcp` |
| `svc-pg-meta` | `Up 6 weeks
10.89.1.18` | Up 6 weeks | `127.0.0.1:8090->8080/tcp` |
| `agent-orchestrator-postgres` | `Up 6 weeks (healthy)
10.89.2.2` | Up 6 weeks (healthy) | `127.0.0.1:55432->5432/tcp` |
| `agent-orchestrator` | `Up 5 weeks
10.89.2.37` | Up 5 weeks | `127.0.0.1:18080->8080/tcp, 100.126.211.117:18080->8080/tcp` |
| `svc-rest` | `Up 5 weeks
10.89.1.15` | Up 5 weeks | `` |
| `rollback-test-db` | `Up 5 weeks` | Up 5 weeks | `` |
| `svc-push` | `Up 4 weeks
10.89.1.26` | Up 4 weeks | `` |
| `stage-demo-app` | `Up 8 days
10.89.3.24` | Up 8 days | `127.0.0.1:3000->3000/tcp, 100.126.211.117:3000->3000/tcp` |
| `fin-engine-redis` | `Up 8 days
10.89.0.83` | Up 8 days | `` |
| `fin-engine-notifier` | `Up 7 days
10.89.0.98` | Up 7 days | `` |
| `fin-engine-brain` | `Up 7 days
10.89.0.100` | Up 7 days | `` |
| `fin-engine-dashboard` | `Up 7 days
10.89.0.99` | Up 7 days | `0.0.0.0:8080->8080/tcp` |
| `svc-kong` | `Up 7 days
10.89.1.46` | Up 7 days | `127.0.0.1:8000->8000/tcp` |
| `svc-auth` | `Up 7 days
10.89.1.45` | Up 7 days | `` |
| `svc-email` | `Up 7 days
10.89.1.44` | Up 7 days | `127.0.0.1:8091->8091/tcp` |
| `stage-sb-db` | `Up 7 days (healthy)
10.89.3.90` | Up 7 days (healthy) | `100.126.211.117:54321->5432/tcp` |
| `stage-sb-studio` | `Up 7 days
10.89.3.91` | Up 7 days | `100.126.211.117:8180->3000/tcp` |
| `stage-sb-kong` | `Up 7 days (healthy)
10.89.3.92` | Up 7 days (healthy) | `100.126.211.117:8100->8000/tcp` |
| `stage-sb-inbucket` | `Up 7 days
10.89.3.93` | Up 7 days | `100.126.211.117:9000->9000/tcp` |
| `stage-sb-rest` | `Up 7 days
10.89.3.94` | Up 7 days | `` |
| `stage-sb-auth` | `Up 7 days
10.89.3.95` | Up 7 days | `` |
| `stage-sb-storage` | `Up 7 days
10.89.3.96` | Up 7 days | `` |
| `stage-sb-meta` | `Up 7 days
10.89.3.97` | Up 7 days | `` |
| `fin-engine-agent-pablo` | `Up 3 days
10.89.0.41` | Up 3 days | `` |
| `fin-engine-agent-marcos` | `Up 3 days
10.89.0.42` | Up 3 days | `` |
| `fin-engine-agent-pedro` | `Up 3 days
10.89.0.43` | Up 3 days | `` |
| `concierge-test` | `Up 3 days` | Up 3 days | `0.0.0.0:3003->3000/tcp` |
| `stage-new` | `Up 3 days` | Up 3 days | `0.0.0.0:3005->3000/tcp` |
| `concierge-test2` | `Up 3 days` | Up 3 days | `0.0.0.0:3006->3000/tcp` |
| `stage-condominio-app-v2` | `Created` | Created | `100.126.211.117:3002->3000/tcp` |
| `condo-sb-db` | `Up 22 hours (healthy)
10.89.5.2` | Up 22 hours (healthy) | `` |
| `condo-sb-studio` | `Up 22 hours
10.89.5.3` | Up 22 hours | `127.0.0.1:8280->3000/tcp` |
| `condo-sb-inbucket` | `Up 22 hours
10.89.5.5` | Up 22 hours | `100.126.211.117:9100->9000/tcp` |
| `condo-sb-rest` | `Up 11 hours
10.89.5.24` | Up 11 hours | `` |
| `condo-sb-auth` | `Up 22 hours
10.89.5.7` | Up 22 hours | `` |
| `condo-sb-storage` | `Up 22 hours
10.89.5.8` | Up 22 hours | `` |
| `condo-sb-meta` | `Up 22 hours
10.89.5.9` | Up 22 hours | `` |
| `condo-sb-kong` | `Up 10 hours (healthy)
10.89.5.34` | Up 10 hours (healthy) | `100.126.211.117:8200->8000/tcp` |
| `vaultwarden` | `Up 7 hours (healthy)
10.89.4.5` | Up 7 hours (healthy) | `100.126.211.117:8222->80/tcp` |
| `stage-stage-condominio-app` | `Up 4 seconds (starting)
10.89.5.86` | Up 4 seconds (starting) | `127.0.0.1:3002->3000/tcp, 100.126.211.117:3002->3000/tcp` |

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
- **Último Commit:** `b58830b - fix(dashboard): improve text contrast with CSS variables (2026-11-10 21:13:50 -0300)`
- **Archivos Pendientes de Commit:**
```text

```

---

## 7. Errores Detectados en Logs de Contenedores en Piave
```text
---LOG_ERROR:svc-push---
poll error getaddrinfo EAI_AGAIN svc-db
poll error getaddrinfo EAI_AGAIN svc-db
---LOG_ERROR:svc-kong---
10.89.1.44 - - [11/Nov/2026:00:14:47 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "426d4275b887a90844b5575fc662a112"
10.89.1.44 - - [11/Nov/2026:00:15:02 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "c014a55ba0221e7e746b1113ce5cc160"
10.89.1.44 - - [11/Nov/2026:00:15:17 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "2b3d9f79ae5ff43cb3976a6675bf1914"
---LOG_ERROR:stage-sb-db---
[local] 2026-11-10 02:04:16.307 UTC [436250] postgres@postgres ERROR:  relation "public.condominiums" does not exist at character 60
[local] 2026-11-10 02:04:57.450 UTC [436286] postgres@postgres ERROR:  relation "public.condominiums" does not exist at character 22
---LOG_ERROR:stage-sb-auth---
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.92","request_id":"324e0edc-adbc-49f4-a399-a6cf7adb0ae4","time":"2026-11-10T02:01:48Z"}
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.92","request_id":"f36091de-056a-4623-8258-64904ff048fb","time":"2026-11-10T02:03:29Z"}
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.92","request_id":"3698211f-a562-4037-b099-d98587b1b47d","time":"2026-11-10T13:25:09Z"}
---LOG_ERROR:condo-sb-db---
10.89.5.24 2026-11-10 19:56:12.008 UTC [54526] postgres@postgres ERROR:  new row for relation "condominiums" violates check constraint "condominiums_destination_check"
---LOG_ERROR:condo-sb-inbucket---
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:44092","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-10T14:12:50Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:59688","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-10T15:32:10Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:37752","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-10T17:20:51Z","message":"Socket error"}
---LOG_ERROR:condo-sb-auth---
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002","remote_addr":"186.11.74.235","request_id":"f194ed8e-72c7-4465-9aef-d50716f16101","time":"2026-11-10T21:00:04Z"}
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002","remote_addr":"186.11.74.235","request_id":"ca3f8d1f-feac-4919-bbfc-dcb04035e684","time":"2026-11-10T21:04:15Z"}
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002","remote_addr":"191.112.211.218","request_id":"1af2f5a4-7e17-4462-95bd-51d99a28667a","time":"2026-11-11T00:09:13Z"}
---LOG_ERROR:condo-sb-storage---
{"level":50,"time":"2026-11-10T23:53:53.916Z","pid":1,"hostname":"9da06a17fc8f","region":"not-specified","reqId":"req-3q","tenantId":"default","project":"default","reqId":"req-3q","type":"request","req":{"region":"not-specified","traceId":"req-3q","method":"POST","url":"/object/sign/avatars/e64b00b9-8630-4f0b-98fa-ba18bf3c06fc/avatar_1793734891800.jpg","headers":{"host":"condo-sb-storage:5000","x_forwarded_proto":"http","x_forwarded_host":"api.ecomunity.cl","x_forwarded_port":"8000","x_real_ip":"10.89.5.34","content_length":"17","user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36","accept":"*/*","cf_connecting_ip":"191.112.211.218","cf_ipcountry":"CL","cf_ray":"a588fa9c9d3f97cc-GIG","content_type":"application/json","referer":"https://www.ecomunity.cl/","x_client_info":"supabase-js/2.118.0; runtime=web"},"hostname":"condo-sb-storage:5000","remoteAddress":"10.89.5.34","remotePort":43168},"res":{"statusCode":544,"headers":{"content_type":"application/json; charset=utf-8","content_length":"124"}},"responseTime":3002.0100531578064,"error":{"raw":"{\"metadata\":{},\"code\":\"DatabaseTimeout\",\"httpStatusCode\":544,\"userStatusCode\":544,\"originalError\":{\"name\":\"KnexTimeoutError\"}}","name":"Error","message":"The connection to the database timed out","stack":"Error: The connection to the database timed out\n    at StorageBackendError.withStatusCode (/app/dist/internal/errors/storage-error.js:42:19)\n    at Object.DatabaseTimeout (/app/dist/internal/errors/codes.js:265:68)\n    at TenantConnection.transaction (/app/dist/internal/database/connection.js:186:36)\n    at runNextTicks (node:internal/process/task_queues:60:5)\n    at listOnTimeout (node:internal/timers:545:9)\n    at process.processTimers (node:internal/timers:519:7)\n    at async StorageKnexDB.runQuery (/app/dist/storage/database/knex.js:505:13)\n    at async StorageKnexDB.findObject (/app/dist/storage/database/knex.js:325:20)\n    at async ObjectStorage.signObjectUrl (/app/dist/storage/object.js:451:5)\n    at async Object.<anonymous> (/app/dist/http/routes/object/getSignedURL.js:89:25)"},"owner":"e64b00b9-8630-4f0b-98fa-ba18bf3c06fc","resources":["/avatars/e64b00b9-8630-4f0b-98fa-ba18bf3c06fc/avatar_1793734891800.jpg"],"operation":"storage.object.sign","msg":"default | POST | 544 | 10.89.5.34 | req-3q | /object/sign/avatars/e64b00b9-8630-4f0b-98fa-ba18bf3c06fc/avatar_1793734891800.jpg | Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36"}
```
