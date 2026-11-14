# Estado del Sistema: Mac (Código) vs Piave (Despliegue e Infraestructura)
**Fecha de levantamiento:** 2026-11-14 15:25:29
**Servidor Remoto (Infraestructura y Producción):** piave (100.126.211.117)
**Host Local (Desarrollo):** dstefene1-mac

---

## 1. Servidor Físico Piave (Host y Recursos)
- **HOSTNAME:** `piave`
- **KERNEL:** `6.8.0-139-generic`
- **UPTIME:** `up 7 weeks, 4 days, 1 hour, 43 minutes`
- **DISK_USAGE:** `60G/232G (28% en uso)`
- **RAM_USAGE:** `3362MB / 7829MB (42.9%)`
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
- **Tamaño en Disco:** `17 MB`
- **Conexiones Activas:** `8`

---

## 2. Auditoría del Frontend Desplegado en Piave (Runtime)

| Parámetro Evaluado | Valor Detectado en Piave |
| :--- | :--- |
| **Contenedor Web** | `stage-stage-condominio-app` |
| **Estado del Contenedor** | `running` |
| **Último Inicio / Reinicio** | `2026-11-14 18:25:04.35080326 +0000 UTC` |
| **Veces Reiniciado (Crash count)** | `0` |
| **Directorio Servido (Web Root)** | `/app/dist` |
| **Fecha de Compilación en Piave** | `2026-11-14 18:24:35.000000000 +0000` |
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
| `svc-gateway` | `Up 7 weeks
10.89.1.6` | Up 7 weeks | `` |
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
| `stage-demo-app` | `Up 11 days
10.89.3.24` | Up 11 days | `127.0.0.1:3000->3000/tcp, 100.126.211.117:3000->3000/tcp` |
| `svc-kong` | `Up 11 days
10.89.1.46` | Up 11 days | `127.0.0.1:8000->8000/tcp` |
| `svc-auth` | `Up 11 days
10.89.1.45` | Up 11 days | `` |
| `svc-email` | `Up 11 days
10.89.1.44` | Up 11 days | `127.0.0.1:8091->8091/tcp` |
| `stage-sb-db` | `Up 11 days (healthy)
10.89.3.90` | Up 11 days (healthy) | `100.126.211.117:54321->5432/tcp` |
| `stage-sb-studio` | `Up 11 days
10.89.3.91` | Up 11 days | `100.126.211.117:8180->3000/tcp` |
| `stage-sb-kong` | `Up 11 days (healthy)
10.89.3.92` | Up 11 days (healthy) | `100.126.211.117:8100->8000/tcp` |
| `stage-sb-inbucket` | `Up 11 days
10.89.3.93` | Up 11 days | `100.126.211.117:9000->9000/tcp` |
| `stage-sb-rest` | `Up 11 days
10.89.3.94` | Up 11 days | `` |
| `stage-sb-auth` | `Up 11 days
10.89.3.95` | Up 11 days | `` |
| `stage-sb-storage` | `Up 11 days
10.89.3.96` | Up 11 days | `` |
| `stage-sb-meta` | `Up 11 days
10.89.3.97` | Up 11 days | `` |
| `concierge-test` | `Up 6 days` | Up 6 days | `0.0.0.0:3003->3000/tcp` |
| `stage-new` | `Up 6 days` | Up 6 days | `0.0.0.0:3005->3000/tcp` |
| `concierge-test2` | `Up 6 days` | Up 6 days | `0.0.0.0:3006->3000/tcp` |
| `stage-condominio-app-v2` | `Created` | Created | `100.126.211.117:3002->3000/tcp` |
| `condo-sb-db` | `Up 4 days (healthy)
10.89.5.2` | Up 4 days (healthy) | `` |
| `condo-sb-studio` | `Up 4 days
10.89.5.3` | Up 4 days | `127.0.0.1:8280->3000/tcp` |
| `condo-sb-inbucket` | `Up 4 days
10.89.5.5` | Up 4 days | `100.126.211.117:9100->9000/tcp` |
| `condo-sb-rest` | `Up 4 days
10.89.5.24` | Up 4 days | `` |
| `condo-sb-auth` | `Up 4 days
10.89.5.7` | Up 4 days | `` |
| `condo-sb-storage` | `Up 4 days
10.89.5.8` | Up 4 days | `` |
| `condo-sb-meta` | `Up 4 days
10.89.5.9` | Up 4 days | `` |
| `condo-sb-kong` | `Up 4 days (healthy)
10.89.5.34` | Up 4 days (healthy) | `100.126.211.117:8200->8000/tcp` |
| `vaultwarden` | `Up 4 days (healthy)
10.89.4.5` | Up 4 days (healthy) | `100.126.211.117:8222->80/tcp` |
| `fin-engine-redis` | `Up 28 hours
10.89.0.145` | Up 28 hours | `` |
| `fin-engine-agent-pedro` | `Up 27 hours
10.89.0.164` | Up 27 hours | `` |
| `fin-engine-agent-pablo` | `Up 27 hours
10.89.0.165` | Up 27 hours | `` |
| `fin-engine-agent-marcos` | `Up 27 hours
10.89.0.166` | Up 27 hours | `` |
| `fin-engine-brain` | `Up 27 hours
10.89.0.167` | Up 27 hours | `` |
| `fin-engine-dashboard` | `Up 27 hours
10.89.0.170` | Up 27 hours | `0.0.0.0:8080->8080/tcp` |
| `fin-engine-notifier` | `Up 27 hours
10.89.0.173` | Up 27 hours | `` |
| `stage-stage-condominio-app` | `Up 28 seconds (starting)
10.89.5.56` | Up 28 seconds (starting) | `127.0.0.1:3002->3000/tcp, 100.126.211.117:3002->3000/tcp` |

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
- **Último Commit:** `711d3b0 - style: show Activa/Inactiva (Spanish) in Banks status badge (2026-11-14 15:24:35 -0300)`
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
10.89.1.44 - - [14/Nov/2026:18:25:42 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "8971947aa237af38c3148f270fdd0c5b"
10.89.1.44 - - [14/Nov/2026:18:25:57 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "a7ddd02b63581542f344f449a2fc0d71"
10.89.1.44 - - [14/Nov/2026:18:26:12 +0000] "GET /rest/v1/email_outbox?sent_at=is.null&failed_at=is.null&order=created_at.asc&limit=10&select=id,event_type,user_id,email,payload,attempt_count,next_attempt_at,locked_at,locale HTTP/1.1" 200 2 "-" "Python-urllib/3.11" kong_request_id: "d3725011f2bb623be85df51cd43e024f"
---LOG_ERROR:stage-sb-db---
[local] 2026-11-12 17:45:47.753 UTC [596633] postgres@postgres ERROR:  relation "assembly_motions" does not exist at character 22
[local] 2026-11-12 17:46:17.432 UTC [596664] postgres@condosmart FATAL:  database "condosmart" does not exist
[local] 2026-11-12 18:06:44.839 UTC [597531] postgres@template0 FATAL:  database "template0" is not currently accepting connections
---LOG_ERROR:condo-sb-inbucket---
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:53164","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-12T19:15:16Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:34906","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-13T15:34:22Z","message":"Socket error"}
{"level":"warn","module":"rest","proto":"WebSocket","remote":"10.89.5.5:58994","error":"websocket: close 1006 (abnormal closure): unexpected EOF","time":"2026-11-14T00:17:33Z","message":"Socket error"}
---LOG_ERROR:condo-sb-rest---
14/Nov/2026:18:25:01 +0000: {"code":"PGRST000","details":"could not translate host name \"condo-sb-db\" to address: Try again\n","hint":null,"message":"Database connection error. Retrying the connection."}
14/Nov/2026:18:25:01 +0000: {"code":"PGRST000","details":"could not translate host name \"condo-sb-db\" to address: Try again\n","hint":null,"message":"Database connection error. Retrying the connection."}
```
