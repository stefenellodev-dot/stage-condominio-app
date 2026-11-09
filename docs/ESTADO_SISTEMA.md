# Estado del Sistema: Mac (Código) vs Piave (Despliegue e Infraestructura)
**Fecha de levantamiento:** 2026-11-09 20:34:50
**Servidor Remoto (Infraestructura y Producción):** piave (100.126.211.117)
**Host Local (Desarrollo):** dstefene1-mac

---

## 1. Servidor Físico Piave (Host y Recursos)
- **HOSTNAME:** `piave`
- **KERNEL:** `6.8.0-139-generic`
- **UPTIME:** `up 6 weeks, 6 days, 6 hours, 52 minutes`
- **DISK_USAGE:** `58G/232G (27% en uso)`
- **RAM_USAGE:** `2812MB / 7829MB (35.9%)`
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
- **Conexiones Activas:** `8`

---

## 2. Auditoría del Frontend Desplegado en Piave (Runtime)

| Parámetro Evaluado | Valor Detectado en Piave |
| :--- | :--- |
| **Contenedor Web** | `stage-stage-condominio-app` |
| **Estado del Contenedor** | `running` |
| **Último Inicio / Reinicio** | `2026-11-09 23:18:21.743541536 +0000 UTC` |
| **Veces Reiniciado (Crash count)** | `0` |
| **Directorio Servido (Web Root)** | `/app/dist` |
| **Fecha de Compilación en Piave** | `2026-11-09 23:16:18.000000000 +0000` |
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
| `condo-sb-kong` | `Up 2 days (healthy)
10.89.3.115` | Up 2 days (healthy) | `100.126.211.117:8200->8000/tcp` |
| `vaultwarden` | `Up 3 days (unhealthy)
10.89.4.4` | Up 3 days (unhealthy) | `100.126.211.117:8222->80/tcp` |
| `condo-sb-db` | `Up 3 days (healthy)
10.89.3.5` | Up 3 days (healthy) | `` |
| `condo-sb-studio` | `Up 3 days
10.89.3.6` | Up 3 days | `127.0.0.1:8280->3000/tcp` |
| `condo-sb-rest` | `Up 3 days
10.89.3.77` | Up 3 days | `` |
| `condo-sb-auth` | `Up 2 days
10.89.3.114` | Up 2 days | `` |
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
| `concierge-test` | `Up 2 days` | Up 2 days | `0.0.0.0:3003->3000/tcp` |
| `stage-new` | `Up 2 days` | Up 2 days | `0.0.0.0:3005->3000/tcp` |
| `concierge-test2` | `Up 2 days` | Up 2 days | `0.0.0.0:3006->3000/tcp` |
| `stage-stage-condominio-app` | `Up 16 minutes (healthy)
10.89.3.138` | Up 16 minutes (healthy) | `127.0.0.1:3002->3000/tcp, 100.126.211.117:3002->3000/tcp` |

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
- **Último Commit:** `ffd4ad7 - docs: live audit after OS-10 security module deployment (2026-11-09 20:20:25 -0300)`
- **Archivos Pendientes de Commit:**
```text

```

---

## 7. Errores Detectados en Logs de Contenedores en Piave
```text
---LOG_ERROR:svc-kong---
10.89.1.44 - - [09/Nov/2026:23:35:05 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "ae6cd37ce4f4295f58ffeb394d051c2b"
10.89.1.44 - - [09/Nov/2026:23:35:20 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "f975594d3aa07b014bb0f451e69fd733"
10.89.1.44 - - [09/Nov/2026:23:35:35 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "747db8548c1a551977c79c52e2f9ca18"
---LOG_ERROR:condo-sb-inbucket---
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.3.19:47558","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-09T02:42:57Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.3.19:42256","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-09T15:32:54Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.3.19:45274","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-09T19:33:39Z","message":"Socket error"}
---LOG_ERROR:condo-sb-db---
10.89.3.77 2026-11-09 22:45:11.943 UTC [248041] postgres@postgres ERROR:  invalid input syntax for type uuid: "undefined"
10.89.3.77 2026-11-09 22:45:12.290 UTC [248036] postgres@postgres ERROR:  invalid input syntax for type uuid: "undefined"
[local] 2026-11-09 23:33:43.648 UTC [250772] postgres@postgres ERROR:  trigger functions can only be called as triggers
---LOG_ERROR:condo-sb-auth---
{"component":"api","error":"invalid_grant: Invalid login credentials","level":"info","method":"POST","msg":"invalid_grant: Invalid login credentials","path":"/token","referer":"http://100.126.211.117:3002/","remote_addr":"10.89.3.115","request_id":"ee23cb8f-0f9f-4bc6-ab9e-eccfe6a3e98f","time":"2026-11-09T22:43:18Z"}
```
