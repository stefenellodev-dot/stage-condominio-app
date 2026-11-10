# Estado del Sistema: Mac (Código) vs Piave (Despliegue e Infraestructura)
**Fecha de levantamiento:** 2026-11-10 16:29:34
**Servidor Remoto (Infraestructura y Producción):** piave (100.126.211.117)
**Host Local (Desarrollo):** dstefene1-mac

---

## 1. Servidor Físico Piave (Host y Recursos)
- **HOSTNAME:** `piave`
- **KERNEL:** `6.8.0-139-generic`
- **UPTIME:** `up 7 weeks, 2 hours, 47 minutes`
- **DISK_USAGE:** `58G/232G (27% en uso)`
- **RAM_USAGE:** `2907MB / 7829MB (37.1%)`
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
| **Último Inicio / Reinicio** | `2026-11-10 19:29:34.518210066 +0000 UTC` |
| **Veces Reiniciado (Crash count)** | `0` |
| **Directorio Servido (Web Root)** | `/app/dist` |
| **Fecha de Compilación en Piave** | `2026-11-10 19:29:14.000000000 +0000` |
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
| `stage-demo-app` | `Up 7 days
10.89.3.24` | Up 7 days | `127.0.0.1:3000->3000/tcp, 100.126.211.117:3000->3000/tcp` |
| `fin-engine-redis` | `Up 7 days
10.89.0.83` | Up 7 days | `` |
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
| `concierge-test` | `Up 2 days` | Up 2 days | `0.0.0.0:3003->3000/tcp` |
| `stage-new` | `Up 2 days` | Up 2 days | `0.0.0.0:3005->3000/tcp` |
| `concierge-test2` | `Up 2 days` | Up 2 days | `0.0.0.0:3006->3000/tcp` |
| `stage-condominio-app-v2` | `Created` | Created | `100.126.211.117:3002->3000/tcp` |
| `condo-sb-db` | `Up 17 hours (healthy)
10.89.5.2` | Up 17 hours (healthy) | `` |
| `condo-sb-studio` | `Up 17 hours
10.89.5.3` | Up 17 hours | `127.0.0.1:8280->3000/tcp` |
| `condo-sb-inbucket` | `Up 17 hours
10.89.5.5` | Up 17 hours | `100.126.211.117:9100->9000/tcp` |
| `condo-sb-rest` | `Up 6 hours
10.89.5.24` | Up 6 hours | `` |
| `condo-sb-auth` | `Up 17 hours
10.89.5.7` | Up 17 hours | `` |
| `condo-sb-storage` | `Up 17 hours
10.89.5.8` | Up 17 hours | `` |
| `condo-sb-meta` | `Up 17 hours
10.89.5.9` | Up 17 hours | `` |
| `condo-sb-kong` | `Up 6 hours (healthy)
10.89.5.34` | Up 6 hours (healthy) | `100.126.211.117:8200->8000/tcp` |
| `vaultwarden` | `Up 2 hours (healthy)
10.89.4.5` | Up 2 hours (healthy) | `100.126.211.117:8222->80/tcp` |
| `stage-stage-condominio-app` | `Up 3 seconds (starting)
10.89.5.66` | Up 3 seconds (starting) | `127.0.0.1:3002->3000/tcp, 100.126.211.117:3002->3000/tcp` |

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
- **Último Commit:** `61703c7 - fix(users): handle expired signed avatar URLs by extracting path (2026-11-10 16:29:09 -0300)`
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
10.89.1.44 - - [10/Nov/2026:19:29:58 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "7861393ded141f660670a761758c6e6e"
10.89.1.44 - - [10/Nov/2026:19:30:13 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "bcbcd17addb17863b5f5d42b32a7cc7e"
10.89.1.44 - - [10/Nov/2026:19:30:28 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "dbac3529cb409163f9c6804cd806a055"
---LOG_ERROR:stage-sb-db---
[local] 2026-11-10 02:04:16.307 UTC [436250] postgres@postgres ERROR:  relation "public.condominiums" does not exist at character 60
[local] 2026-11-10 02:04:57.450 UTC [436286] postgres@postgres ERROR:  relation "public.condominiums" does not exist at character 22
---LOG_ERROR:stage-sb-auth---
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.92","request_id":"324e0edc-adbc-49f4-a399-a6cf7adb0ae4","time":"2026-11-10T02:01:48Z"}
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.92","request_id":"f36091de-056a-4623-8258-64904ff048fb","time":"2026-11-10T02:03:29Z"}
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.92","request_id":"3698211f-a562-4037-b099-d98587b1b47d","time":"2026-11-10T13:25:09Z"}
---LOG_ERROR:condo-sb-db---
10.89.5.24 2026-11-10 18:26:59.687 UTC [49121] postgres@postgres ERROR:  No autorizado para modificar campos protegidos del perfil
10.89.5.24 2026-11-10 18:27:44.440 UTC [49165] postgres@postgres ERROR:  No autorizado para modificar campos protegidos del perfil
[local] 2026-11-10 18:28:26.298 UTC [49220] postgres@postgres ERROR:  function "public.tr_protect_profile_sensitive_fields" does not exist at character 27
---LOG_ERROR:condo-sb-inbucket---
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:44092","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-10T14:12:50Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:59688","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-10T15:32:10Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:37752","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-10T17:20:51Z","message":"Socket error"}
---LOG_ERROR:condo-sb-rest---
10/Nov/2026:19:29:33 +0000: {"code":"PGRST000","details":"could not translate host name \"condo-sb-db\" to address: Try again\n","hint":null,"message":"Database connection error. Retrying the connection."}
10/Nov/2026:19:29:39 +0000: {"code":"PGRST000","details":"could not translate host name \"condo-sb-db\" to address: Try again\n","hint":null,"message":"Database connection error. Retrying the connection."}
10/Nov/2026:19:29:39 +0000: {"code":"PGRST000","details":"could not translate host name \"condo-sb-db\" to address: Try again\n","hint":null,"message":"Database connection error. Retrying the connection."}
---LOG_ERROR:condo-sb-storage---
{"level":40,"time":"2026-11-10T19:27:22.898Z","pid":1,"hostname":"9da06a17fc8f","region":"not-specified","reqId":"req-2c","tenantId":"default","project":"default","reqId":"req-2c","type":"request","req":{"region":"not-specified","traceId":"req-2c","method":"GET","url":"/object/sign/avatars/f57fb39b-d83c-4af5-bcce-05c33e1bf09d/avatar_1794336367418.jpg?token=redacted","headers":{"host":"condo-sb-storage:5000","x_forwarded_proto":"http","x_forwarded_host":"api.ecomunity.cl","x_forwarded_port":"8000","x_real_ip":"10.89.5.34","user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36","accept":"image/jxl,image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8","cf_connecting_ip":"204.119.24.225","cf_ipcountry":"CL","cf_ray":"a58774478b62f2a3-MIA","referer":"https://www.ecomunity.cl/"},"hostname":"condo-sb-storage:5000","remoteAddress":"10.89.5.34","remotePort":56982},"res":{"statusCode":400,"headers":{"content_type":"application/json; charset=utf-8","content_length":"65"}},"responseTime":9.341790199279785,"error":{"raw":"{\"metadata\":{},\"code\":\"InvalidJWT\",\"httpStatusCode\":400,\"userStatusCode\":400}","name":"Error","message":"jwt expired","stack":"Error: jwt expired\n    at Object.InvalidJWT (/app/dist/internal/errors/codes.js:110:22)\n    at Object.<anonymous> (/app/dist/http/routes/object/getSignedObject.js:77:36)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"},"resources":["/avatars/f57fb39b-d83c-4af5-bcce-05c33e1bf09d/avatar_1794336367418.jpg"],"operation":"storage.object.get_signed","msg":"default | GET | 400 | 10.89.5.34 | req-2c | /object/sign/avatars/f57fb39b-d83c-4af5-bcce-05c33e1bf09d/avatar_1794336367418.jpg?token=redacted | Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36"}
{"level":40,"time":"2026-11-10T19:28:14.963Z","pid":1,"hostname":"9da06a17fc8f","region":"not-specified","reqId":"req-2h","tenantId":"default","project":"default","reqId":"req-2h","type":"request","req":{"region":"not-specified","traceId":"req-2h","method":"GET","url":"/object/sign/avatars/f57fb39b-d83c-4af5-bcce-05c33e1bf09d/avatar_1794336367418.jpg?token=redacted","headers":{"host":"condo-sb-storage:5000","x_forwarded_proto":"http","x_forwarded_host":"api.ecomunity.cl","x_forwarded_port":"8000","x_real_ip":"10.89.5.34","user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36","accept":"image/jxl,image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8","cf_connecting_ip":"204.119.24.225","cf_ipcountry":"CL","cf_ray":"a587758c9fdab0a8-MIA","referer":"https://www.ecomunity.cl/"},"hostname":"condo-sb-storage:5000","remoteAddress":"10.89.5.34","remotePort":60090},"res":{"statusCode":400,"headers":{"content_type":"application/json; charset=utf-8","content_length":"65"}},"responseTime":14.08160924911499,"error":{"raw":"{\"metadata\":{},\"code\":\"InvalidJWT\",\"httpStatusCode\":400,\"userStatusCode\":400}","name":"Error","message":"jwt expired","stack":"Error: jwt expired\n    at Object.InvalidJWT (/app/dist/internal/errors/codes.js:110:22)\n    at Object.<anonymous> (/app/dist/http/routes/object/getSignedObject.js:77:36)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"},"resources":["/avatars/f57fb39b-d83c-4af5-bcce-05c33e1bf09d/avatar_1794336367418.jpg"],"operation":"storage.object.get_signed","msg":"default | GET | 400 | 10.89.5.34 | req-2h | /object/sign/avatars/f57fb39b-d83c-4af5-bcce-05c33e1bf09d/avatar_1794336367418.jpg?token=redacted | Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36"}
{"level":40,"time":"2026-11-10T19:28:14.978Z","pid":1,"hostname":"9da06a17fc8f","region":"not-specified","reqId":"req-2i","tenantId":"default","project":"default","reqId":"req-2i","type":"request","req":{"region":"not-specified","traceId":"req-2i","method":"GET","url":"/object/sign/avatars/6d4872c7-16e1-41ad-8c1b-b274846a7eeb/avatar_1794337475984.jpeg?token=redacted","headers":{"host":"condo-sb-storage:5000","x_forwarded_proto":"http","x_forwarded_host":"api.ecomunity.cl","x_forwarded_port":"8000","x_real_ip":"10.89.5.34","user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36","accept":"image/jxl,image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8","cf_connecting_ip":"204.119.24.225","cf_ipcountry":"CL","cf_ray":"a587758c9fd9b0a8-MIA","referer":"https://www.ecomunity.cl/"},"hostname":"condo-sb-storage:5000","remoteAddress":"10.89.5.34","remotePort":56982},"res":{"statusCode":400,"headers":{"content_type":"application/json; charset=utf-8","content_length":"65"}},"responseTime":11.466261863708496,"error":{"raw":"{\"metadata\":{},\"code\":\"InvalidJWT\",\"httpStatusCode\":400,\"userStatusCode\":400}","name":"Error","message":"jwt expired","stack":"Error: jwt expired\n    at Object.InvalidJWT (/app/dist/internal/errors/codes.js:110:22)\n    at Object.<anonymous> (/app/dist/http/routes/object/getSignedObject.js:77:36)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"},"resources":["/avatars/6d4872c7-16e1-41ad-8c1b-b274846a7eeb/avatar_1794337475984.jpeg"],"operation":"storage.object.get_signed","msg":"default | GET | 400 | 10.89.5.34 | req-2i | /object/sign/avatars/6d4872c7-16e1-41ad-8c1b-b274846a7eeb/avatar_1794337475984.jpeg?token=redacted | Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36"}
```
