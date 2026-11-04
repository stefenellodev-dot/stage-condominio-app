#!/usr/bin/env bash
set -e

FECHA=$(date +"%Y-%m-%d_%H-%M-%S")
OUTPUT_FILE="manual_tecnico_condominio_${FECHA}.md"
LOCAL_APP_DIR="/Users/stefenello/development/stage-condominio-app"

echo "======================================================================"
echo " GENERANDO DOSSIER TÉCNICO Y AUDITORÍA EXHAUSTIVA DEL SISTEMA       "
echo " Archivo de destino: ${OUTPUT_FILE}                                  "
echo "======================================================================"

# ---------------------------------------------------------
# Encabezado del Documento
# ---------------------------------------------------------
cat << REPORT_HEADER > "${OUTPUT_FILE}"
# Manual Técnico de Arquitectura y Operaciones: Condominio App
**Fecha de levantamiento:** $(date +"%Y-%m-%d %H:%M:%S")  
**Servidor Core (Piave):** 100.126.211.117  
**Orquestador:** Podman (Rootless/User containers)  
**Ambiente:** Stage / Producción Condominio  

---

## 1. Topología del Sistema y Mapa de Red

\`\`\`
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
\`\`\`

---
REPORT_HEADER

echo "-> [1/6] Analizando Frontend y dependencias locales..."
if [ -d "$LOCAL_APP_DIR" ]; then
  cd "$LOCAL_APP_DIR"
  cat << FRONTEND_INFO >> "${OUTPUT_FILE}"
## 2. Especificación del Frontend (React / Vite)

- **Ruta local:** \`$LOCAL_APP_DIR\`
- **Rama Git:** \`$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")\`
- **Último Commit:** \`$(git log -1 --pretty=format:"%h - %s (%ci)" 2>/dev/null || echo "N/A")\`

### 2.1 Variables de Entorno del Cliente
\`\`\`ini
$(sed 's/KEY=eyJhbGciOi[A-Za-z0-9_-]*/KEY=[JWT_ANON_TOKEN_CONFIGURADO]/' .env 2>/dev/null || cat .env.local 2>/dev/null || echo "No se encontró archivo .env")
\`\`\`

### 2.2 Paquetes y Dependencias de Producción
\`\`\`json
$(grep -A 25 '"dependencies"' package.json 2>/dev/null || echo "package.json no disponible")
\`\`\`

### 2.3 Matriz de Componentes Críticos del Frontend
| Componente | Ruta de Archivo | Validación Técnica |
| :--- | :--- | :--- |
| **Login (Ver clave)** | \`src/components/auth/LoginForm.jsx\` | $(grep -q "showPassword" src/components/auth/LoginForm.jsx 2>/dev/null && echo "✅ Alternancia de tipo password/text implementada" || echo "❌ No implementado") |
| **Tabla Admin (Roles)** | $(find src -name "AdminTable.jsx" 2>/dev/null) | $(grep -q "item.role === 'superadmin'" $(find src -name "AdminTable.jsx" 2>/dev/null | head -n1) 2>/dev/null && echo "✅ Badge y protección Superadmin activos" || echo "❌ Requiere revisión") |
| **Perfil (Chile/Comunas)** | \`src/components/dashboard/ProfileSection.jsx\` | $(grep -q "communeId" src/components/dashboard/ProfileSection.jsx 2>/dev/null && echo "✅ Selectores foráneos commune_id/region_id activos" || echo "❌ Requiere revisión") |
| **Contexto de Sesión** | \`src/context/AuthContext.jsx\` | $(grep -q "isSuperadmin" src/context/AuthContext.jsx 2>/dev/null && echo "✅ Flag isSuperadmin presente en provider" || echo "❌ Requiere revisión") |

---
FRONTEND_INFO
fi

echo "-> [2/6] Auditando contenedores, IPs y sockets de red en Piave..."
cat << 'INFRA_HEADER' >> "${OUTPUT_FILE}"
## 3. Estado de la Infraestructura en Piave (Podman)

### 3.1 Contenedores en Ejecución
INFRA_HEADER

ssh piave 'bash -s' >> "${OUTPUT_FILE}" << 'SSH_PODMAN'
echo '```text'
podman ps -a --filter "name=condo-sb|condominio" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
echo '```'

echo -e "\n### 3.2 Asignación de Direcciones IP Internas (Red de Contenedores)"
echo '```text'
podman inspect -f '{{.Name}} => IP: {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(podman ps -q --filter "name=condo-sb") 2>/dev/null || true
echo '```'

echo -e "\n### 3.3 Puertos Expuestos en el Host Piave"
echo '```text'
ss -tulpn | grep -E "(8200|8201|3002|5432)" || true
echo '```'
SSH_PODMAN

echo "-> [3/6] Inspeccionando esquema relacional DDL y catálogos en condo-sb-db..."
cat << 'DB_HEADER' >> "${OUTPUT_FILE}"
---

## 4. Estructura de Base de Datos y Diccionario de Datos

### 4.1 Diccionario de Datos: \`public.profiles\`
DB_HEADER

ssh piave 'bash -s' >> "${OUTPUT_FILE}" << 'SSH_DB_SCHEMA'
echo '```text'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT 
    c.column_name, 
    c.data_type, 
    c.is_nullable, 
    COALESCE(c.column_default, '—') AS valor_por_defecto,
    COALESCE(pgd.description, '—') AS descripcion
FROM information_schema.columns c
LEFT JOIN pg_catalog.pg_statio_all_tables st ON c.table_name = st.relname
LEFT JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position)
WHERE c.table_name = 'profiles' AND c.table_schema = 'public'
ORDER BY c.ordinal_position;
"
echo '```'

echo -e "\n### 4.2 Llaves Foráneas y Restricciones en \`public.profiles\`"
echo '```text'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public' AND conrelid = 'public.profiles'::regclass;
"
echo '```'

echo -e "\n### 4.3 Catálogos Geográficos de Chile (Cargas Maestras)"
echo '```text'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT 
  (SELECT count(*) FROM public.regions) AS total_regiones_chile,
  (SELECT count(*) FROM public.communes) AS total_comunas_chile;
"
echo '```'

echo -e "\n**Muestra de Integridad de Catálogo:**"
echo '```text'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT r.id AS reg_id, r.name AS region, c.id AS com_id, c.name AS comuna
FROM public.communes c
JOIN public.regions r ON c.region_id = r.id
WHERE c.name IN ('Huechuraba', 'Providencia', 'Las Condes', 'Santiago')
ORDER BY r.id, c.name;
"
echo '```'
SSH_DB_SCHEMA

echo "-> [4/6] Auditando Seguridad: Triggers, Funciones y Políticas RLS..."
cat << 'SEC_HEADER' >> "${OUTPUT_FILE}"
---

## 5. Capa de Seguridad, RLS y Triggers de Protección

### 5.1 Triggers Activos en \`public.profiles\`
SEC_HEADER

ssh piave 'bash -s' >> "${OUTPUT_FILE}" << 'SSH_DB_SEC'
echo '```text'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT 
    trigger_name,
    event_manipulation AS evento,
    action_timing AS timing,
    action_statement AS definicion
FROM information_schema.triggers
WHERE event_object_table = 'profiles' AND trigger_schema = 'public';
"
echo '```'

echo -e "\n### 5.2 Código de la Función de Protección Superadmin"
echo '```sql'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'protect_superadmin_role';
"
echo '```'

echo -e "\n### 5.3 Matriz Completa de Políticas RLS (Row Level Security)"
echo '```text'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT 
    schemaname AS esquema,
    tablename AS tabla,
    policyname AS politica,
    cmd AS comando,
    roles AS aplicable_a,
    qual AS regla_using
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;
"
echo '```'

echo -e "\n### 5.4 Configuración de Supabase Storage (\`storage.buckets\`)"
echo '```text'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT id, name, public, avif_autodetection, file_size_limit, allowed_mime_types
FROM storage.buckets;
"
echo '```'
SSH_DB_SEC

echo "-> [5/6] Ejecutando pruebas de integración sobre API Gateway (Kong)..."
cat << 'API_HEADER' >> "${OUTPUT_FILE}"
---

## 6. Pruebas de Integración y Conectividad API
API_HEADER

ssh piave 'bash -s' >> "${OUTPUT_FILE}" << 'SSH_API_TESTS'
source ~/stage-platform/core/secrets/supabase-condominio.env 2>/dev/null || true

echo "### 6.1 Prueba PostgREST Upstream (Puerto 8200)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" http://100.126.211.117:8200/rest/v1/)
echo "- **Endpoint /rest/v1/:** HTTP \`$HTTP_CODE\` $([ "$HTTP_CODE" = "200" ] && echo "✅ OPERATIVO (200 OK)" || echo "❌ FALLO UPSTREAM ($HTTP_CODE)")"

echo -e "\n### 6.2 Prueba de Autenticación y Generación de Token JWT"
AUTH_PAYLOAD='{"email":"superadmin@test.com","password":"Test1234$"}'
AUTH_RESP=$(curl -s -X POST "http://100.126.211.117:8200/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$AUTH_PAYLOAD")

TOKEN=$(echo "$AUTH_RESP" | grep -o '"access_token":"[^"]*"' | head -n1 | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "- **Emisión de JWT Superadmin:** ✅ ÉXITO"
  
  echo -e "\n### 6.3 Consulta REST Simulada (Frontend -> Perfiles)"
  echo '```json'
  curl -s -X GET "[http://100.126.211.117:8200/rest/v1/profiles?email=eq.superadmin@test.com&select=id,email,full_name,role,status,commune,region](http://100.126.211.117:8200/rest/v1/profiles?email=eq.superadmin@test.com&select=id,email,full_name,role,status,commune,region)" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $TOKEN"
  echo -e '\n```'
else
  echo "- **Emisión de JWT Superadmin:** ❌ FALLÓ LA OBTENCIÓN DEL TOKEN"
  echo "Detalle recibido: $AUTH_RESP"
fi
SSH_API_TESTS

echo "-> [6/6] Incorporando Runbook Operativo para futuros desarrolladores..."
cat << 'RUNBOOK' >> "${OUTPUT_FILE}"
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
RUNBOOK

echo ""
echo "======================================================================"
echo " INFORME TÉCNICO GENERADO CON ÉXITO                                   "
echo " Archivo: ${OUTPUT_FILE}                                              "
echo "======================================================================"
