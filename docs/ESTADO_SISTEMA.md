# Estado del Sistema: Mac (Código) vs Piave (Despliegue e Infraestructura)
**Fecha de levantamiento:** 2026-11-11 17:23:40
**Servidor Remoto (Infraestructura y Producción):** piave (100.126.211.117)
**Host Local (Desarrollo):** dstefene1-mac

---

## 1. Servidor Físico Piave (Host y Recursos)
- **HOSTNAME:** `piave`
- **KERNEL:** `6.8.0-139-generic`
- **UPTIME:** `up 7 weeks, 1 day, 3 hours, 41 minutes`
- **DISK_USAGE:** `59G/232G (27% en uso)`
- **RAM_USAGE:** `2512MB / 7829MB (32.1%)`
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
| **Último Inicio / Reinicio** | `2026-11-11 20:23:19.20789211 +0000 UTC` |
| **Veces Reiniciado (Crash count)** | `0` |
| **Directorio Servido (Web Root)** | `/app/dist` |
| **Fecha de Compilación en Piave** | `2026-11-11 20:23:00.000000000 +0000` |
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
| `agent-orchestrator` | `Up 6 weeks
10.89.2.37` | Up 6 weeks | `127.0.0.1:18080->8080/tcp, 100.126.211.117:18080->8080/tcp` |
| `svc-rest` | `Up 5 weeks
10.89.1.15` | Up 5 weeks | `` |
| `rollback-test-db` | `Up 5 weeks` | Up 5 weeks | `` |
| `svc-push` | `Up 4 weeks
10.89.1.26` | Up 4 weeks | `` |
| `stage-demo-app` | `Up 8 days
10.89.3.24` | Up 8 days | `127.0.0.1:3000->3000/tcp, 100.126.211.117:3000->3000/tcp` |
| `fin-engine-redis` | `Up 8 days
10.89.0.83` | Up 8 days | `` |
| `fin-engine-notifier` | `Up 8 days
10.89.0.98` | Up 8 days | `` |
| `fin-engine-dashboard` | `Up 8 days
10.89.0.99` | Up 8 days | `0.0.0.0:8080->8080/tcp` |
| `svc-kong` | `Up 8 days
10.89.1.46` | Up 8 days | `127.0.0.1:8000->8000/tcp` |
| `svc-auth` | `Up 8 days
10.89.1.45` | Up 8 days | `` |
| `svc-email` | `Up 8 days
10.89.1.44` | Up 8 days | `127.0.0.1:8091->8091/tcp` |
| `stage-sb-db` | `Up 8 days (healthy)
10.89.3.90` | Up 8 days (healthy) | `100.126.211.117:54321->5432/tcp` |
| `stage-sb-studio` | `Up 8 days
10.89.3.91` | Up 8 days | `100.126.211.117:8180->3000/tcp` |
| `stage-sb-kong` | `Up 8 days (healthy)
10.89.3.92` | Up 8 days (healthy) | `100.126.211.117:8100->8000/tcp` |
| `stage-sb-inbucket` | `Up 8 days
10.89.3.93` | Up 8 days | `100.126.211.117:9000->9000/tcp` |
| `stage-sb-rest` | `Up 8 days
10.89.3.94` | Up 8 days | `` |
| `stage-sb-auth` | `Up 8 days
10.89.3.95` | Up 8 days | `` |
| `stage-sb-storage` | `Up 8 days
10.89.3.96` | Up 8 days | `` |
| `stage-sb-meta` | `Up 8 days
10.89.3.97` | Up 8 days | `` |
| `fin-engine-agent-pablo` | `Up 4 days
10.89.0.41` | Up 4 days | `` |
| `fin-engine-agent-marcos` | `Up 4 days
10.89.0.42` | Up 4 days | `` |
| `fin-engine-agent-pedro` | `Up 4 days
10.89.0.43` | Up 4 days | `` |
| `concierge-test` | `Up 3 days` | Up 3 days | `0.0.0.0:3003->3000/tcp` |
| `stage-new` | `Up 3 days` | Up 3 days | `0.0.0.0:3005->3000/tcp` |
| `concierge-test2` | `Up 3 days` | Up 3 days | `0.0.0.0:3006->3000/tcp` |
| `stage-condominio-app-v2` | `Created` | Created | `100.126.211.117:3002->3000/tcp` |
| `condo-sb-db` | `Up 42 hours (healthy)
10.89.5.2` | Up 42 hours (healthy) | `` |
| `condo-sb-studio` | `Up 42 hours
10.89.5.3` | Up 42 hours | `127.0.0.1:8280->3000/tcp` |
| `condo-sb-inbucket` | `Up 42 hours
10.89.5.5` | Up 42 hours | `100.126.211.117:9100->9000/tcp` |
| `condo-sb-rest` | `Up 31 hours
10.89.5.24` | Up 31 hours | `` |
| `condo-sb-auth` | `Up 42 hours
10.89.5.7` | Up 42 hours | `` |
| `condo-sb-storage` | `Up 42 hours
10.89.5.8` | Up 42 hours | `` |
| `condo-sb-meta` | `Up 42 hours
10.89.5.9` | Up 42 hours | `` |
| `condo-sb-kong` | `Up 31 hours (healthy)
10.89.5.34` | Up 31 hours (healthy) | `100.126.211.117:8200->8000/tcp` |
| `vaultwarden` | `Up 27 hours (healthy)
10.89.4.5` | Up 27 hours (healthy) | `100.126.211.117:8222->80/tcp` |
| `fin-engine-brain` | `Up 3 hours
10.89.0.205` | Up 3 hours | `` |
| `stage-stage-condominio-app` | `Up 22 seconds (starting)
10.89.5.137` | Up 22 seconds (starting) | `127.0.0.1:3002->3000/tcp, 100.126.211.117:3002->3000/tcp` |

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
- **Último Commit:** `eba56d7 - style: remove read-only notice and wrap status in card (ManagementCompanies) (2026-11-11 17:23:00 -0300)`
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
10.89.1.44 - - [11/Nov/2026:20:23:43 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "0f995d51227ac34d5892d914ef14f176"
10.89.1.44 - - [11/Nov/2026:20:23:59 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "c48af121bf8eb70edbf0ab6990cd8703"
10.89.1.44 - - [11/Nov/2026:20:24:14 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "2fa57a0b41b01158b5e97a6af64cb871"
---LOG_ERROR:stage-sb-db---
[local] 2026-11-10 02:04:16.307 UTC [436250] postgres@postgres ERROR:  relation "public.condominiums" does not exist at character 60
[local] 2026-11-10 02:04:57.450 UTC [436286] postgres@postgres ERROR:  relation "public.condominiums" does not exist at character 22
---LOG_ERROR:stage-sb-auth---
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.92","request_id":"324e0edc-adbc-49f4-a399-a6cf7adb0ae4","time":"2026-11-10T02:01:48Z"}
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.92","request_id":"f36091de-056a-4623-8258-64904ff048fb","time":"2026-11-10T02:03:29Z"}
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.92","request_id":"3698211f-a562-4037-b099-d98587b1b47d","time":"2026-11-10T13:25:09Z"}
---LOG_ERROR:condo-sb-inbucket---
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:44092","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-10T14:12:50Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:59688","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-10T15:32:10Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:37752","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-10T17:20:51Z","message":"Socket error"}
---LOG_ERROR:condo-sb-auth---
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"191.112.211.218","request_id":"a76c0499-2b23-43d9-a9ff-8944a1ff04b2","time":"2026-11-11T12:16:26Z"}
{"component":"api","error":"invalid_grant: Invalid Refresh Token: Refresh Token Not Found","level":"info","method":"POST","msg":"invalid_grant: Invalid Refresh Token: Refresh Token Not Found","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"191.112.211.218","request_id":"75742f42-dc91-43c7-b8f3-9df7d45b7780","time":"2026-11-11T20:15:47Z"}
```
