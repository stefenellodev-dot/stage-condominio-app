# Manual Técnico de Arquitectura y Operaciones: Condominio App

> **OBSOLETO (2026-11-03).** Documento histórico reemplazado por [docs/README.md](../README.md), [docs/architecture.md](../architecture.md), [docs/operations.md](../operations.md) y [docs/runbook.md](../runbook.md). No usar para operar. Contiene IPs internas históricas y datos que ya no son válidos. Se conserva solo como evidencia.

**Fecha de levantamiento:** 2026-11-03 19:42:06  
**Servidor Core (Piave):** 100.126.211.117  
**Orquestador:** Podman (Rootless/User containers)  
**Ambiente:** Stage / Producción Condominio  

---

## 1. Topología del Sistema y Mapa de Red

```
   [ Cliente / Navegador ]
             |
             +---> http://100.126.211.117:3002  (Frontend SPA: Vite / React / Nginx)
             |
             +---> http://100.126.211.117:8200  (API Gateway: Kong)
                         |
                         +-- /auth/v1/    --> condo-sb-auth    (GoTrue :9999)
                         +-- /rest/v1/    --> condo-sb-rest    (PostgREST :3000)
                         +-- /storage/v1/ --> condo-sb-storage (Supabase Storage :5000)
                         |
     [ Base de Datos Central ] <--------------+
     condo-sb-db (PostgreSQL 15+ :5432)
```

---
## 2. Especificación del Frontend (React / Vite)

- **Ruta local:** `/Users/stefenello/development/stage-condominio-app`
- **Rama Git:** `main`
- **Último Commit:** `8fed2d0 - archivos de configuración (2026-11-03 15:16:52 -0300)`

### 2.1 Variables de Entorno del Cliente
```ini
VITE_SUPABASE_URL=http://100.126.211.117:8200
VITE_SUPABASE_ANON_KEY=[REDACTADO]
VITE_APP_NAME=Condominio
VITE_APP_TAGLINE="Panel de Administración"
```

### 2.2 Paquetes y Dependencias de Producción
```json
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.2"
  }
}
```

### 2.3 Matriz de Componentes Críticos del Frontend
| Componente | Ruta de Archivo | Validación Técnica |
| :--- | :--- | :--- |
| **Login (Ver clave)** | `src/components/auth/LoginForm.jsx` | ✅ Alternancia de tipo password/text implementada |
| **Tabla Admin (Roles)** | src/components/dashboard/AdminTable.jsx | ✅ Badge y protección Superadmin activos |
| **Perfil (Chile/Comunas)** | `src/components/dashboard/ProfileSection.jsx` | ✅ Selectores foráneos commune_id/region_id activos |
| **Contexto de Sesión** | `src/context/AuthContext.jsx` | ✅ Flag isSuperadmin presente en provider |

---
## 3. Estado de la Infraestructura en Piave (Podman)

### 3.1 Contenedores en Ejecución
```text
NAMES                       STATUS                PORTS                                                     IMAGE
condo-sb-db                 Up 3 hours (healthy)  100.126.211.117:54322->5432/tcp                           docker.io/supabase/postgres:15.6.1.139
condo-sb-studio             Up 4 hours            100.126.211.117:8280->3000/tcp                            docker.io/supabase/studio:latest
condo-sb-kong               Up 2 hours (healthy)  100.126.211.117:8200->8000/tcp                            docker.io/library/kong:2.8.1-alpine
condo-sb-inbucket           Up 4 hours            100.126.211.117:9100->9000/tcp                            docker.io/inbucket/inbucket:latest
condo-sb-rest               Up 2 hours                                                                      docker.io/postgrest/postgrest:v12.0.2
condo-sb-auth               Up 4 hours                                                                      docker.io/supabase/gotrue:v2.158.1
condo-sb-storage            Up 4 hours                                                                      docker.io/supabase/storage-api:v1.11.1
condo-sb-meta               Up 4 hours                                                                      docker.io/supabase/postgres-meta:v0.84.2
stage-stage-condominio-app  Up 7 minutes          127.0.0.1:3002->3000/tcp, 100.126.211.117:3002->3000/tcp  localhost/stage-stage-condominio-app:latest
```

### 3.2 Asignación de Direcciones IP Internas (Red de Contenedores)
```text
condo-sb-db => IP: 10.89.3.131
condo-sb-studio => IP: 10.89.3.119
condo-sb-kong => IP: 10.89.3.138
condo-sb-inbucket => IP: 10.89.3.121
condo-sb-rest => IP: 10.89.3.137
condo-sb-auth => IP: 10.89.3.123
condo-sb-storage => IP: 10.89.3.124
condo-sb-meta => IP: 10.89.3.125
```

### 3.3 Puertos Expuestos en el Host Piave
```text
tcp   LISTEN 0      4096                     127.0.0.1:3002       0.0.0.0:*    users:(("rootlessport",pid=3875619,fd=11))
tcp   LISTEN 0      4096               100.126.211.117:3002       0.0.0.0:*    users:(("rootlessport",pid=3875619,fd=12))
tcp   LISTEN 0      4096                     127.0.0.1:55432      0.0.0.0:*    users:(("rootlessport",pid=2603940,fd=11))
tcp   LISTEN 0      4096               100.126.211.117:8200       0.0.0.0:*    users:(("rootlessport",pid=3701560,fd=5)) 
tcp   LISTEN 0      4096               100.126.211.117:54322      0.0.0.0:*    users:(("rootlessport",pid=3666078,fd=11))
tcp   LISTEN 0      4096               100.126.211.117:54321      0.0.0.0:*    users:(("rootlessport",pid=2547485,fd=11))
```
---

## 4. Estructura de Base de Datos y Diccionario de Datos

### 4.1 Diccionario de Datos: \`public.profiles\`
```text
   column_name    |        data_type         | is_nullable |      valor_por_defecto       | descripcion 
------------------+--------------------------+-------------+------------------------------+-------------
 id               | uuid                     | NO          | —                            | —
 email            | text                     | YES         | —                            | —
 full_name        | text                     | YES         | —                            | —
 rut              | text                     | YES         | —                            | —
 phone            | text                     | YES         | —                            | —
 role             | text                     | NO          | 'user'::text                 | —
 created_at       | timestamp with time zone | YES         | timezone('utc'::text, now()) | —
 updated_at       | timestamp with time zone | YES         | timezone('utc'::text, now()) | —
 first_name       | text                     | YES         | —                            | —
 last_name        | text                     | YES         | —                            | —
 birth_date       | date                     | YES         | —                            | —
 avatar_url       | text                     | YES         | —                            | —
 gender           | text                     | YES         | —                            | —
 nationality      | text                     | YES         | 'Chilena'::text              | —
 region           | text                     | YES         | —                            | —
 commune          | text                     | YES         | —                            | —
 address          | text                     | YES         | —                            | —
 status           | text                     | YES         | 'active'::text               | —
 second_name      | text                     | YES         | —                            | —
 second_last_name | text                     | YES         | —                            | —
 street           | text                     | YES         | —                            | —
 street_number    | text                     | YES         | —                            | —
 dept_or_unit     | text                     | YES         | —                            | —
 region_id        | integer                  | YES         | —                            | —
 commune_id       | integer                  | YES         | —                            | —
 deleted_at       | timestamp with time zone | YES         | —                            | —
(26 rows)

---

## 5. Capa de Seguridad, RLS y Triggers de Protección

### 5.1 Triggers Activos en \`public.profiles\`
```text
     trigger_name      | evento | timing |                 definicion                 
-----------------------+--------+--------+--------------------------------------------
 tr_protect_superadmin | UPDATE | BEFORE | EXECUTE FUNCTION protect_superadmin_role()
(1 row)

---

## 6. Pruebas de Integración y Conectividad API
### 6.1 Prueba PostgREST Upstream (Puerto 8200)
- **Endpoint /rest/v1/:** HTTP `200` ✅ OPERATIVO (200 OK)

### 6.2 Prueba de Autenticación y Generación de Token JWT
- **Emisión de JWT Superadmin:** ✅ ÉXITO

### 6.3 Consulta REST Simulada (Frontend -> Perfiles)
```json

```
---

## 7. Runbook Operativo para Desarrolladores

### 7.1 Síntoma: Error 502 Bad Gateway en \`:8200\`
* **Causa raíz:** Si el contenedor \`condo-sb-rest\` se reinicia, Podman puede asignarle una nueva IP en la red virtual interna. Kong almacena en caché la IP anterior y produce un error de conexión hacia el upstream (\`113: Host is unreachable\`).
* **Procedimiento de solución:**
  \`\`\`bash
  ssh piave "podman restart condo-sb-kong"
  \`\`\`

### 7.2 Síntoma: Column X of relation 'profiles' does not exist (HTTP 400)
* **Causa raíz:** Se agregaron o alteraron columnas en PostgreSQL vía CLI, pero PostgREST no ha recargado el esquema de metadatos que mantiene en memoria RAM.
* **Procedimiento de solución:**
  \`\`\`bash
  ssh piave "podman exec -i condo-sb-db psql -U postgres -d postgres -c \"NOTIFY pgrst, 'reload schema';\" && podman restart condo-sb-rest"
  \`\`\`

### 7.3 Procedimiento para Restaurar o Crear un Superadmin
Si un nuevo usuario requiere privilegios de superadmin, debe asignarse tanto en el perfil público como en los metadatos de GoTrue para evitar discrepancias:
\`\`\`sql
-- Ejecutar dentro de condo-sb-db:
UPDATE public.profiles 
SET role = 'superadmin' 
WHERE email = 'usuario@correo.com';

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"superadmin"'),
    raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"superadmin"')
WHERE email = 'usuario@correo.com';
\`\`\`

### 7.4 Compilación y Despliegue de Cambios del Frontend
Cada vez que se modifiquen variables \`VITE_*\` o archivos React en el Mac:
\`\`\`bash
cd /Users/stefenello/development/stage-condominio-app
npm run build
# Sincronizar o reiniciar el servicio en el servidor Piave
ssh piave "podman restart stage-stage-condominio-app"
\`\`\`
