#!/usr/bin/env bash
set -e

FECHA=$(date +"%Y-%m-%d_%H-%M-%S")
OUTPUT_FILE="auditoria_condominio_${FECHA}.md"
LOCAL_APP_DIR="/Users/stefenello/development/stage-condominio-app"

echo "========================================================"
echo " INICIANDO AUDITORÍA INTEGRAL: LOCAL + SERVIDOR PIAVE   "
echo " Reporte de salida: ${OUTPUT_FILE}                     "
echo "========================================================"

# Iniciar archivo de reporte
cat << REPORT_HEADER > "${OUTPUT_FILE}"
# Reporte de Auditoría y Estado Operacional - Condominio App
**Fecha de generación:** $(date +"%Y-%m-%d %H:%M:%S")  
**Host Local:** $(hostname)  
**Host Remoto:** piave (100.126.211.117)  

---

## 1. Estado del Frontend Local (Mac)
REPORT_HEADER

echo "-> [1/4] Auditando frontend local..."

if [ -d "$LOCAL_APP_DIR" ]; then
  cd "$LOCAL_APP_DIR"
  
  cat << LOCAL_INFO >> "${OUTPUT_FILE}"
- **Directorio:** \`$LOCAL_APP_DIR\`
- **Branch Git:** $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
- **Último Commit:** $(git log -1 --oneline 2>/dev/null || echo "N/A")

### 1.1 Variables de Entorno Locales (.env)
\`\`\`ini
$(sed 's/KEY=.*/KEY=[PROTEGIDO]/' .env 2>/dev/null || echo "Archivo .env no encontrado")
\`\`\`

### 1.2 Verificación de Componentes Clave
- **Selector de Contraseña en LoginForm.jsx:** $(grep -q "showPassword" src/components/auth/LoginForm.jsx 2>/dev/null && echo "✅ Implementado" || echo "⚠️ Revisar")
- **Visualización Superadmin en AdminTable.jsx:** $(grep -q "item.role === 'superadmin'" src/components/dashboard/AdminTable.jsx 2>/dev/null && echo "✅ Implementado" || echo "⚠️ Revisar")
- **Campos de Perfil en ProfileSection.jsx:** $(grep -q "communeId" src/components/dashboard/ProfileSection.jsx 2>/dev/null && echo "✅ Integrado" || echo "⚠️ Revisar")
- **Control de Roles en AuthContext.jsx:** $(grep -q "isSuperadmin" src/context/AuthContext.jsx 2>/dev/null && echo "✅ Configurado" || echo "⚠️ Revisar")

---
LOCAL_INFO
else
  echo "- Directorio local no encontrado en $LOCAL_APP_DIR" >> "${OUTPUT_FILE}"
fi

echo "-> [2/4] Conectando a Piave para auditar contenedores y puertos..."

cat << 'REMOTE_HEADER' >> "${OUTPUT_FILE}"
## 2. Infraestructura en Servidor Piave
REMOTE_HEADER

ssh piave 'bash -s' >> "${OUTPUT_FILE}" << 'SSH_PODMAN'
echo "### 2.1 Contenedores de la Pila Supabase Condominio"
echo '```text'
podman ps -a --filter "name=condo-sb" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo '```'

echo "### 2.2 Contenedores de Aplicación"
echo '```text'
podman ps -a --filter "name=condominio" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo '```'

echo "### 2.3 Puertos en Escucha Activa"
echo '```text'
ss -tulpn | grep -E "(8200|8201|3002|5432)" || true
echo '```'
SSH_PODMAN

echo "-> [3/4] Auditando Base de Datos condo-sb-db (esquemas, catálogos, roles)..."

cat << 'DB_HEADER' >> "${OUTPUT_FILE}"
---

## 3. Base de Datos (condo-sb-db)
DB_HEADER

ssh piave 'bash -s' >> "${OUTPUT_FILE}" << 'SSH_DB'
echo "### 3.1 Estructura de la tabla public.profiles"
echo '```text'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public' 
ORDER BY ordinal_position;
"
echo '```'

echo "### 3.2 Registros de Catálogos Geográficos"
echo '```text'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT 
  (SELECT count(*) FROM public.regions) AS total_regiones,
  (SELECT count(*) FROM public.communes) AS total_comunas;
"
echo '```'

echo "### 3.3 Cuentas de Acceso y Roles Activos"
echo '```text'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT id, email, full_name, role, status, deleted_at 
FROM public.profiles 
ORDER BY created_at DESC;
"
echo '```'

echo "### 3.4 Bucket de Supabase Storage"
echo '```text'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'avatars';
"
echo '```'

echo "### 3.5 Políticas RLS en Profiles y Storage"
echo '```text'
podman exec -i condo-sb-db psql -U postgres -d postgres -c "
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname IN ('public', 'storage') 
ORDER BY schemaname, tablename;
"
echo '```'
SSH_DB

echo "-> [4/4] Validando conectividad API (Kong + PostgREST)..."

cat << 'API_HEADER' >> "${OUTPUT_FILE}"
---

## 4. Pruebas de API y Pasarela (Kong / PostgREST)
API_HEADER

ssh piave 'bash -s' >> "${OUTPUT_FILE}" << 'SSH_API'
source ~/stage-platform/core/secrets/supabase-condominio.env 2>/dev/null || true

echo "### 4.1 Endpoint REST (Healthcheck vía Kong :8200)"
REST_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" http://100.126.211.117:8200/rest/v1/)
echo "- **Código HTTP REST:** \`$REST_CODE\` $([ "$REST_CODE" = "200" ] && echo "✅ Conectado" || echo "❌ Fallo upstream")"

echo "### 4.2 Endpoint Auth (Token Superadmin)"
AUTH_RESP=$(curl -s -X POST "http://100.126.211.117:8200/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@test.com","password":"Test1234$"}')

TOKEN=$(echo "$AUTH_RESP" | grep -o '"access_token":"[^"]*"' | head -n1 | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "- **Emisión de Token Auth:** ✅ OK"
  echo "### 4.3 Consulta REST autenticada a public.profiles"
  echo '```json'
  curl -s -X GET "[http://100.126.211.117:8200/rest/v1/profiles?email=eq.superadmin@test.com&select=id,email,full_name,role,status](http://100.126.211.117:8200/rest/v1/profiles?email=eq.superadmin@test.com&select=id,email,full_name,role,status)" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $TOKEN"
  echo -e '\n```'
else
  echo "- **Emisión de Token Auth:** ❌ Falló la autenticación"
fi
SSH_API

echo ""
echo "========================================================"
echo " AUDITORÍA COMPLETADA EXITOSAMENTE                      "
echo " Documento generado: ${OUTPUT_FILE}                     "
echo "========================================================"
