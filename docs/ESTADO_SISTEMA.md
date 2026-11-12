# Estado del Sistema: Mac (Código) vs Piave (Despliegue e Infraestructura)
**Fecha de levantamiento:** 2026-11-12 20:43:39
**Servidor Remoto (Infraestructura y Producción):** piave (100.126.211.117)
**Host Local (Desarrollo):** dstefene1-mac

---

## 1. Servidor Físico Piave (Host y Recursos)
- **HOSTNAME:** `piave`
- **KERNEL:** `6.8.0-139-generic`
- **UPTIME:** `up 7 weeks, 2 days, 7 hours, 1 minute`
- **DISK_USAGE:** `59G/232G (27% en uso)`
- **RAM_USAGE:** `2653MB / 7829MB (33.9%)`
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
- **Conexiones Activas:** `7`

---

## 2. Auditoría del Frontend Desplegado en Piave (Runtime)

| Parámetro Evaluado | Valor Detectado en Piave |
| :--- | :--- |
| **Contenedor Web** | `stage-stage-condominio-app` |
| **Estado del Contenedor** | `running` |
| **Último Inicio / Reinicio** | `2026-11-12 23:43:14.069491396 +0000 UTC` |
| **Veces Reiniciado (Crash count)** | `0` |
| **Directorio Servido (Web Root)** | `/app/dist` |
| **Fecha de Compilación en Piave** | `2026-11-12 23:42:43.000000000 +0000` |
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
| `svc-rest` | `Up 6 weeks
10.89.1.15` | Up 6 weeks | `` |
| `rollback-test-db` | `Up 5 weeks` | Up 5 weeks | `` |
| `svc-push` | `Up 5 weeks
10.89.1.26` | Up 5 weeks | `` |
| `stage-demo-app` | `Up 10 days
10.89.3.24` | Up 10 days | `127.0.0.1:3000->3000/tcp, 100.126.211.117:3000->3000/tcp` |
| `fin-engine-redis` | `Up 9 days
10.89.0.83` | Up 9 days | `` |
| `fin-engine-notifier` | `Up 9 days
10.89.0.98` | Up 9 days | `` |
| `fin-engine-dashboard` | `Up 9 days
10.89.0.99` | Up 9 days | `0.0.0.0:8080->8080/tcp` |
| `svc-kong` | `Up 9 days
10.89.1.46` | Up 9 days | `127.0.0.1:8000->8000/tcp` |
| `svc-auth` | `Up 9 days
10.89.1.45` | Up 9 days | `` |
| `svc-email` | `Up 9 days
10.89.1.44` | Up 9 days | `127.0.0.1:8091->8091/tcp` |
| `stage-sb-db` | `Up 9 days (healthy)
10.89.3.90` | Up 9 days (healthy) | `100.126.211.117:54321->5432/tcp` |
| `stage-sb-studio` | `Up 9 days
10.89.3.91` | Up 9 days | `100.126.211.117:8180->3000/tcp` |
| `stage-sb-kong` | `Up 9 days (healthy)
10.89.3.92` | Up 9 days (healthy) | `100.126.211.117:8100->8000/tcp` |
| `stage-sb-inbucket` | `Up 9 days
10.89.3.93` | Up 9 days | `100.126.211.117:9000->9000/tcp` |
| `stage-sb-rest` | `Up 9 days
10.89.3.94` | Up 9 days | `` |
| `stage-sb-auth` | `Up 9 days
10.89.3.95` | Up 9 days | `` |
| `stage-sb-storage` | `Up 9 days
10.89.3.96` | Up 9 days | `` |
| `stage-sb-meta` | `Up 9 days
10.89.3.97` | Up 9 days | `` |
| `fin-engine-agent-pablo` | `Up 5 days
10.89.0.41` | Up 5 days | `` |
| `fin-engine-agent-marcos` | `Up 5 days
10.89.0.42` | Up 5 days | `` |
| `fin-engine-agent-pedro` | `Up 5 days
10.89.0.43` | Up 5 days | `` |
| `concierge-test` | `Up 5 days` | Up 5 days | `0.0.0.0:3003->3000/tcp` |
| `stage-new` | `Up 5 days` | Up 5 days | `0.0.0.0:3005->3000/tcp` |
| `concierge-test2` | `Up 5 days` | Up 5 days | `0.0.0.0:3006->3000/tcp` |
| `stage-condominio-app-v2` | `Created` | Created | `100.126.211.117:3002->3000/tcp` |
| `condo-sb-db` | `Up 2 days (healthy)
10.89.5.2` | Up 2 days (healthy) | `` |
| `condo-sb-studio` | `Up 2 days
10.89.5.3` | Up 2 days | `127.0.0.1:8280->3000/tcp` |
| `condo-sb-inbucket` | `Up 2 days
10.89.5.5` | Up 2 days | `100.126.211.117:9100->9000/tcp` |
| `condo-sb-rest` | `Up 2 days
10.89.5.24` | Up 2 days | `` |
| `condo-sb-auth` | `Up 2 days
10.89.5.7` | Up 2 days | `` |
| `condo-sb-storage` | `Up 2 days
10.89.5.8` | Up 2 days | `` |
| `condo-sb-meta` | `Up 2 days
10.89.5.9` | Up 2 days | `` |
| `condo-sb-kong` | `Up 2 days (healthy)
10.89.5.34` | Up 2 days (healthy) | `100.126.211.117:8200->8000/tcp` |
| `vaultwarden` | `Up 2 days (healthy)
10.89.4.5` | Up 2 days (healthy) | `100.126.211.117:8222->80/tcp` |
| `fin-engine-brain` | `Up 30 hours
10.89.0.205` | Up 30 hours | `` |
| `stage-stage-condominio-app` | `Up 28 seconds (starting)
10.89.5.14` | Up 28 seconds (starting) | `127.0.0.1:3002->3000/tcp, 100.126.211.117:3002->3000/tcp` |

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
- **Último Commit:** `0b9ae05 - style: only show assemblies table when data exists (2026-11-12 20:42:46 -0300)`
- **Archivos Pendientes de Commit:**
```text

```

---

## 7. Errores Detectados en Logs de Contenedores en Piave
```text
---LOG_ERROR:svc-db---
2026-11-12 18:05:33.239 UTC [1450355] ERROR:  syntax error at or near "public" at character 87
2026-11-12 18:05:38.563 UTC [1450358] ERROR:  syntax error at or near "public" at character 67
2026-11-12 18:06:41.946 UTC [1450400] FATAL:  database "template0" is not currently accepting connections
---LOG_ERROR:svc-kong---
10.89.1.44 - - [12/Nov/2026:23:43:56 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "9339837bfc780d09468e87507e974730"
10.89.1.44 - - [12/Nov/2026:23:44:11 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "8d46b601366cc0675bab17080a40822c"
10.89.1.44 - - [12/Nov/2026:23:44:27 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "a8188c76a46fab5b607a20711ed8e520"
---LOG_ERROR:stage-sb-db---
[local] 2026-11-12 17:45:47.753 UTC [596633] postgres@postgres ERROR:  relation "assembly_motions" does not exist at character 22
[local] 2026-11-12 17:46:17.432 UTC [596664] postgres@condosmart FATAL:  database "condosmart" does not exist
[local] 2026-11-12 18:06:44.839 UTC [597531] postgres@template0 FATAL:  database "template0" is not currently accepting connections
---LOG_ERROR:stage-sb-auth---
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.92","request_id":"3698211f-a562-4037-b099-d98587b1b47d","time":"2026-11-10T13:25:09Z"}
---LOG_ERROR:condo-sb-inbucket---
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:45258","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-12T01:21:12Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:41276","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-12T18:07:46Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:53164","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-12T19:15:16Z","message":"Socket error"}
---LOG_ERROR:condo-sb-auth---
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002","remote_addr":"191.112.211.218","request_id":"9e9e2f42-f9d3-4aeb-a1a6-f642826cc0f6","time":"2026-11-12T22:46:14Z"}
```
