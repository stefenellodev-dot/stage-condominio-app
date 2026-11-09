#!/usr/bin/env bash
set -e

LOCAL_APP_DIR="/Users/stefenello/development/stage-condominio-app"
DOCS_DIR="${LOCAL_APP_DIR}/docs"
mkdir -p "$DOCS_DIR"

FILE_ESTADO="${DOCS_DIR}/ESTADO_SISTEMA.md"
FILE_ARQUITECTURA="${DOCS_DIR}/ARQUITECTURA.md"
FECHA_EJECUCION=$(date +"%Y-%m-%d %H:%M:%S")

echo "======================================================================"
echo " AUDITORÍA CRUZADA INTEGRAL: CÓDIGO MAC ↔ DESPLIEGUE EN SERVIDOR PIAVE"
echo " Fecha: ${FECHA_EJECUCION}                                            "
echo "======================================================================"

TMP_REMOTE=$(mktemp)

echo "-> [1/4] Auditando en Piave: Sistema host, contenedores, frontend desplegado y BD..."

ssh piave 'bash -s' > "$TMP_REMOTE" << 'SSH_PIAVE'
echo "===SECTION_HOST_METRICS==="
echo "HOSTNAME|$(hostname)"
echo "KERNEL|$(uname -r)"
echo "UPTIME|$(uptime -p)"
echo "DISK_USAGE|$(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " en uso)"}')"
echo "RAM_USAGE|$(free -m | awk 'NR==2 {printf "%dMB / %dMB (%.1f%%)", $3, $2, $3*100/$2}')"
echo "PODMAN_VER|$(podman --version)"

echo "===SECTION_CONTAINERS==="
podman ps -a --format "{{.Names}}|{{.Status}}|{{.Ports}}|{{.Image}}"

echo "===SECTION_PODMAN_NETWORKS==="
for c in $(podman ps -q); do
  cname=$(podman inspect -f '{{.Name}}' "$c" | sed 's/\///')
  cip=$(podman inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$c")
  echo "${cname}|${cip}"
done

echo "===SECTION_DEPLOYED_FRONTEND==="
APP_CONTAINER=$(podman ps --filter "name=condominio" --format "{{.Names}}" | grep -E "app|stage" | head -n1 || echo "")
if [ -n "$APP_CONTAINER" ]; then
  echo "CONTAINER_NAME|${APP_CONTAINER}"
  echo "CONTAINER_STATUS|$(podman inspect -f '{{.State.Status}}' "$APP_CONTAINER")"
  echo "STARTED_AT|$(podman inspect -f '{{.State.StartedAt}}' "$APP_CONTAINER")"
  echo "RESTART_COUNT|$(podman inspect -f '{{.RestartCount}}' "$APP_CONTAINER")"

  WEB_ROOT="/app/dist"
  if podman exec "$APP_CONTAINER" test -d "$WEB_ROOT" 2>/dev/null; then
    echo "WEB_ROOT|${WEB_ROOT}"
    INDEX_DATE=$(podman exec "$APP_CONTAINER" stat -c "%y" "${WEB_ROOT}/index.html" 2>/dev/null || echo "N/A")
    echo "DEPLOY_BUILD_DATE|${INDEX_DATE}"
    TITLE_DEPLOYED=$(podman exec "$APP_CONTAINER" grep -o '<title>[^<]*</title>' "${WEB_ROOT}/index.html" 2>/dev/null || echo "N/A")
    echo "DEPLOYED_TITLE|${TITLE_DEPLOYED}"

    JS_DIR="${WEB_ROOT}/assets"
    HAS_SHOW_PASS=$(podman exec "$APP_CONTAINER" sh -c "grep -rn 'showPassword' ${JS_DIR} 2>/dev/null" | head -n1 || true)
    HAS_SUPERADMIN=$(podman exec "$APP_CONTAINER" sh -c "grep -rn 'superadmin' ${JS_DIR} 2>/dev/null" | head -n1 || true)
    HAS_APP_NAME=$(podman exec "$APP_CONTAINER" sh -c "grep -o 'VITE_APP_NAME' ${JS_DIR} 2>/dev/null" | head -n1 || true)

    echo "JS_BUNDLE_SHOW_PASSWORD|$([ -n "$HAS_SHOW_PASS" ] && echo "PRESENTE EN BUNDLE" || echo "NO ENCONTRADO EN BUNDLE")"
    echo "JS_BUNDLE_SUPERADMIN|$([ -n "$HAS_SUPERADMIN" ] && echo "PRESENTE EN BUNDLE" || echo "NO ENCONTRADO EN BUNDLE")"

    echo "---ASSET_LIST---"
    podman exec "$APP_CONTAINER" ls -lh "$JS_DIR" 2>/dev/null || true
  else
    echo "WEB_ROOT|No se localizó /usr/share/nginx/html en contenedor"
  fi
else
  echo "CONTAINER_NAME|NO_DETECTADO"
fi

echo "===SECTION_LIVE_HTTP_CHECK==="
HTTP_CODE_3002=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/ || echo "000")
HEADER_SERVER=$(curl -s -I http://127.0.0.1:3002/ | grep -i "^server:" | tr -d '\r' || echo "N/A")
echo "HTTP_STATUS_3002|${HTTP_CODE_3002}"
echo "HEADER_SERVER|${HEADER_SERVER}"

echo "===SECTION_CONTAINER_LOGS_ERRORS==="
for c in $(podman ps --format "{{.Names}}"); do
  ERRS=$(podman logs --tail 30 "$c" 2>&1 | grep -iE "error|fatal|exception|failed|panic" | tail -n 3 || true)
  if [ -n "$ERRS" ]; then
    echo "---LOG_ERROR:${c}---"
    echo "$ERRS"
  fi
done

echo "===SECTION_DB_METRICS==="
podman exec -i condo-sb-db psql -U postgres -d postgres -t -A -F"|" -c "
SELECT
  current_database(),
  pg_size_pretty(pg_database_size(current_database())),
  (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) AS active_connections;
"

echo "===SECTION_TABLES_ROW_COUNTS==="
podman exec -i condo-sb-db psql -U postgres -d postgres -t -A -F"|" -c "
DO \$\$
DECLARE
  r RECORD;
  cnt BIGINT;
BEGIN
  FOR r IN (
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  ) LOOP
    EXECUTE format('SELECT count(*) FROM %I.%I', r.table_schema, r.table_name) INTO cnt;
    RAISE NOTICE '%|%', r.table_name, cnt;
  END LOOP;
END \$\$;
" 2>&1 | grep "NOTICE:" | sed 's/NOTICE:  //' || true

echo "===SECTION_COLUMNS==="
podman exec -i condo-sb-db psql -U postgres -d postgres -t -A -F"|" -c "
SELECT table_name, column_name, data_type, is_nullable, COALESCE(column_default, '')
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
"

echo "===SECTION_FOREIGN_KEYS==="
podman exec -i condo-sb-db psql -U postgres -d postgres -t -A -F"|" -c "
SELECT
    kcu.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY kcu.table_name, kcu.column_name;
"

echo "===SECTION_TRIGGERS==="
podman exec -i condo-sb-db psql -U postgres -d postgres -t -A -F"|" -c "
SELECT event_object_table, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
"

echo "===SECTION_RLS==="
podman exec -i condo-sb-db psql -U postgres -d postgres -t -A -F"|" -c "
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
"

echo "===SECTION_ALIQUOTS==="
podman exec -i condo-sb-db psql -U postgres -d postgres -t -A -F"|" -c "
SELECT
  c.name,
  c.rut,
  count(u.id),
  COALESCE(round(sum(u.aliquot), 2), 0)
FROM public.condominiums c
LEFT JOIN public.units u ON u.condominium_id = c.id
GROUP BY c.id, c.name, c.rut
ORDER BY c.name;
" 2>/dev/null || echo "NO_UNITS_TABLE"

echo "===SECTION_API_KONG==="
SECRETS_FILE="$HOME/stage-platform/core/secrets/supabase-condominio.env"
if [ -f "$SECRETS_FILE" ]; then
  source "$SECRETS_FILE"
fi

if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  AUTH_RESP=$(curl -s -X POST "http://100.126.211.117:8200/auth/v1/token?grant_type=password" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"email":"superadmin@test.com","password":"Test1234$"}' || true)

  TOKEN=$(echo "$AUTH_RESP" | grep -o '"access_token":"[^"]*"' | head -n1 | cut -d'"' -f4 || true)

  for tbl in $(podman exec -i condo-sb-db psql -U postgres -d postgres -t -A -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';"); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $TOKEN" "http://100.126.211.117:8200/rest/v1/${tbl}?limit=1" || echo "000")
    echo "ENDPOINT|${tbl}|${STATUS}"
  done
fi
SSH_PIAVE

echo "-> [2/4] Auditando entorno de código en tu Mac (${LOCAL_APP_DIR})..."

GIT_BRANCH=$(git -C "$LOCAL_APP_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
GIT_COMMIT=$(git -C "$LOCAL_APP_DIR" log -1 --pretty=format:"%h - %s (%cd)" --date=iso 2>/dev/null || echo "N/A")
GIT_MODIFIED_FILES=$(git -C "$LOCAL_APP_DIR" status --short 2>/dev/null || echo "N/A")

ENV_VARS_LOCAL=$(grep -v '^#' "${LOCAL_APP_DIR}/.env" 2>/dev/null | grep '=' | sed 's/=.*$/=[CONFIGURADA]/' || echo "No se encontró .env")

MAC_SHOW_PASSWORD=$(grep -rn "showPassword" "${LOCAL_APP_DIR}/src" 2>/dev/null | head -n 3 || echo "No encontrado")
MAC_SUPERADMIN=$(grep -rn "item.role === 'superadmin'" "${LOCAL_APP_DIR}/src" 2>/dev/null | head -n 3 || echo "No encontrado")
MAC_APP_NAME_CONFIG=$(grep -rn "VITE_APP_NAME" "${LOCAL_APP_DIR}/src" 2>/dev/null || echo "No encontrado")

echo "-> [3/4] Generando informe operacional consolidado en ${FILE_ESTADO}..."

cat << EOF > "$FILE_ESTADO"
# Estado del Sistema: Mac (Código) vs Piave (Despliegue e Infraestructura)
**Fecha de levantamiento:** ${FECHA_EJECUCION}
**Servidor Remoto (Infraestructura y Producción):** piave (100.126.211.117)
**Host Local (Desarrollo):** $(hostname)

---

## 1. Servidor Físico Piave (Host y Recursos)
$(sed -n '/===SECTION_HOST_METRICS===/,/===SECTION_CONTAINERS===/p' "$TMP_REMOTE" | grep -v '===' | awk -F'|' '{print "- **" $1 ":** `" $2 "`"}')

# Verificar buckets de storage
echo "### 1.2 Storage Buckets (condo-sb-storage)" >> "$TMPFILE"
echo "" >> "$TMPFILE"
for bucket in colillas comprobantes-pago certificaciones evidencias-infracciones actas-asambleas; do
  count=$(podman exec -i condo-sb-db psql -U postgres -d postgres -t -A -c "SELECT COUNT(*) FROM storage.buckets WHERE id = '$bucket';" 2>/dev/null | tr -d ' ')
  if [ "$count" = "1" ]; then
    echo "- Bucket \`$bucket\`: ✅ registrado" >> "$TMPFILE"
  else
    echo "- Bucket \`$bucket\`: ❌ no encontrado" >> "$TMPFILE"
  fi
done
echo "" >> "$TMPFILE"
$(sed -n '/===SECTION_DB_METRICS===/,/===SECTION_TABLES_ROW_COUNTS===/p' "$TMP_REMOTE" | grep -v '===' | awk -F'|' '{print "- **Base de Datos:** `" $1 "`\n- **Tamaño en Disco:** `" $2 "`\n- **Conexiones Activas:** `" $3 "`"}')

---

## 2. Auditoría del Frontend Desplegado en Piave (Runtime)

| Parámetro Evaluado | Valor Detectado en Piave |
| :--- | :--- |
| **Contenedor Web** | \`$(grep '^CONTAINER_NAME|' "$TMP_REMOTE" | cut -d'|' -f2)\` |
| **Estado del Contenedor** | \`$(grep '^CONTAINER_STATUS|' "$TMP_REMOTE" | cut -d'|' -f2)\` |
| **Último Inicio / Reinicio** | \`$(grep '^STARTED_AT|' "$TMP_REMOTE" | cut -d'|' -f2)\` |
| **Veces Reiniciado (Crash count)** | \`$(grep '^RESTART_COUNT|' "$TMP_REMOTE" | cut -d'|' -f2)\` |
| **Directorio Servido (Web Root)** | \`$(grep '^WEB_ROOT|' "$TMP_REMOTE" | cut -d'|' -f2)\` |
| **Fecha de Compilación en Piave** | \`$(grep '^DEPLOY_BUILD_DATE|' "$TMP_REMOTE" | cut -d'|' -f2)\` |
| **Título HTML Desplegado** | \`$(grep '^DEPLOYED_TITLE|' "$TMP_REMOTE" | cut -d'|' -f2)\` |
| **Respuesta HTTP Puerto :3002** | \`$(grep '^HTTP_STATUS_3002|' "$TMP_REMOTE" | cut -d'|' -f2)\` |
| **Servidor Web Interno** | \`$(grep '^HEADER_SERVER|' "$TMP_REMOTE" | cut -d'|' -f2)\` |

### 2.1 Verificación de Código Compilado en Piave vs Fuente Mac
| Funcionalidad | En Código Local (Mac) | En Bundle JS Desplegado (Piave) | Estado de Despliegue |
| :--- | :--- | :--- | :--- |
| **Toggle Ver Contraseña** | $([ "$MAC_SHOW_PASSWORD" != "No encontrado" ] && echo "✅ En código fuente" || echo "❌ Falta en Mac") | \`$(grep '^JS_BUNDLE_SHOW_PASSWORD|' "$TMP_REMOTE" | cut -d'|' -f2)\` | $([ "$(grep '^JS_BUNDLE_SHOW_PASSWORD|' "$TMP_REMOTE" | cut -d'|' -f2)" = "PRESENTE EN BUNDLE" ] && echo "✅ Desplegado y Activo" || echo "⚠️ Requiere nuevo build en Piave") |
| **Badge y Reglas Superadmin** | $([ "$MAC_SUPERADMIN" != "No encontrado" ] && echo "✅ En código fuente" || echo "❌ Falta en Mac") | \`$(grep '^JS_BUNDLE_SUPERADMIN|' "$TMP_REMOTE" | cut -d'|' -f2)\` | $([ "$(grep '^JS_BUNDLE_SUPERADMIN|' "$TMP_REMOTE" | cut -d'|' -f2)" = "PRESENTE EN BUNDLE" ] && echo "✅ Desplegado y Activo" || echo "⚠️ Requiere nuevo build en Piave") |

### 2.2 Archivos Estáticos Servidos por Nginx en Piave
\`\`\`text
$(sed -n '/---ASSET_LIST---/,/===SECTION_LIVE_HTTP_CHECK===/p' "$TMP_REMOTE" | grep -v '---' | grep -v '===')
\`\`\`

---

## 3. Estado de la Pila de Contenedores e IP Internas
| Contenedor | IP Interna Podman | Estado / Uptime | Puertos Expuestos |
| :--- | :--- | :--- | :--- |
$(
  sed -n '/===SECTION_CONTAINERS===/,/===SECTION_PODMAN_NETWORKS===/p' "$TMP_REMOTE" | grep -v '===' | while IFS='|' read -r name status ports img; do
    ip=$(grep "^${name}|" "$TMP_REMOTE" | cut -d'|' -f2 || echo "N/A")
    echo "| \`${name}\` | \`${ip}\` | ${status} | \`${ports}\` |"
  done
)

---

## 4. Base de Datos en Piave: Tablas y Registros Reales
| Esquema | Tabla | Total Registros |
| :--- | :--- | :--- |
$(sed -n '/===SECTION_TABLES_ROW_COUNTS===/,/===SECTION_COLUMNS===/p' "$TMP_REMOTE" | grep -v '===' | awk -F'|' '{print "| public | `" $1 "` | **" $2 "** |"}')

### Cuadre de Alícuotas por Condominio (Ley N° 21.442)
| Condominio | RUT | Unidades Reales | Suma de Alícuota | Estado Legal |
| :--- | :--- | :--- | :--- | :--- |
$(sed -n '/===SECTION_ALIQUOTS===/,/===SECTION_API_KONG===/p' "$TMP_REMOTE" | grep -v '===' | awk -F'|' '{
  status = ($4 == "100.00" || $4 == "100") ? "✅ Cuadrado al 100.00%" : "⚠️ Descuadre (" $4 "%)";
  print "| " $1 " | " $2 " | " $3 " | " $4 "% | " status " |";
}')

---

## 5. Pruebas de Integración Kong API Gateway (:8200)
| Tabla / Recurso | Código HTTP Real | Estado de la API |
| :--- | :--- | :--- |
$(sed -n '/===SECTION_API_KONG===/,$p' "$TMP_REMOTE" | grep '^ENDPOINT|' | awk -F'|' '{
  diag = ($3 == "200") ? "✅ Operativo (200 OK)" : "❌ Falla Upstream (" $3 ")";
  print "| `/rest/v1/" $2 "` | `" $3 "` | " diag " |";
}')

---

## 6. Código Local en Mac
- **Ruta:** \`${LOCAL_APP_DIR}\`
- **Branch Git:** \`${GIT_BRANCH}\`
- **Último Commit:** \`${GIT_COMMIT}\`
- **Archivos Pendientes de Commit:**
\`\`\`text
${GIT_MODIFIED_FILES}
\`\`\`

---

## 7. Errores Detectados en Logs de Contenedores en Piave
\`\`\`text
$(sed -n '/===SECTION_CONTAINER_LOGS_ERRORS===/,/===SECTION_DB_METRICS===/p' "$TMP_REMOTE" | grep -v '===' || echo "Sin errores críticos registrados en los últimos 30 logs.")
\`\`\`
EOF

echo "-> [4/4] Actualizando especificación DDL viva en ${FILE_ARQUITECTURA}..."

cat << EOF > "$FILE_ARQUITECTURA"
# Especificación de Arquitectura de Datos y Seguridad (Ley N° 21.442)
**Última actualización confirmada en servidor Piave:** ${FECHA_EJECUCION}

---

## 1. Topología del Sistema y Mapa de Red en Piave

\`\`\`
[ Cliente / Navegador ]
        │
        ├──> http://100.126.211.117:3002 (Frontend SPA React / Nginx en contenedor)
        │
        └──> http://100.126.211.117:8200 (API Gateway Kong en Piave)
                    │
                    ├── /auth/v1/    ──> condo-sb-auth    (:9999)
                    ├── /rest/v1/    ──> condo-sb-rest    (:3000)
                    └── /storage/v1/ ──> condo-sb-storage (:5000)
                               │
                               ▼
                 [ PostgreSQL: condo-sb-db :5432 ]
\`\`\`

---

## 2. Diccionario de Datos Relacional (PostgreSQL en Piave)

$(awk -F'|' '
BEGIN { prev_table = ""; }
{
  if ($1 != prev_table && $1 != "") {
    if (prev_table != "") { print "\n"; }
    prev_table = $1;
    print "### Tabla: `public." prev_table "`";
    print "| Columna | Tipo de Dato | Nulo | Valor por Defecto |";
    print "| :--- | :--- | :--- | :--- |";
  }
  if ($1 != "") {
    print "| `" $2 "` | `" $3 "` | " $4 " | " ($5 == "" ? "—" : "`" $5 "`") " |";
  }
}
' <(sed -n '/===SECTION_COLUMNS===/,/===SECTION_FOREIGN_KEYS===/p' "$TMP_REMOTE" | grep -v '==='))

---

## 3. Relaciones y Llaves Foráneas Verificadas
| Tabla Origen | Columna | Tabla Destino | Columna Destino |
| :--- | :--- | :--- | :--- |
$(sed -n '/===SECTION_FOREIGN_KEYS===/,/===SECTION_TRIGGERS===/p' "$TMP_REMOTE" | grep -v '===' | awk -F'|' '{print "| `" $1 "` | `" $2 "` | `" $3 "` | `" $4 "` |"}')

---

## 4. Triggers y Funciones de Negocio Activas en Piave
| Tabla | Nombre del Trigger | Momento | Evento |
| :--- | :--- | :--- | :--- |
$(sed -n '/===SECTION_TRIGGERS===/,/===SECTION_RLS===/p' "$TMP_REMOTE" | grep -v '===' | awk -F'|' '{print "| `" $1 "` | `" $2 "` | " $3 " | " $4 " |"}')

---

## 5. Matriz de Políticas RLS (Row Level Security)
| Tabla | Política | Comando | Roles Autorizados |
| :--- | :--- | :--- | :--- |
$(sed -n '/===SECTION_RLS===/,/===SECTION_ALIQUOTS===/p' "$TMP_REMOTE" | grep -v '===' | awk -F'|' '{print "| `" $1 "` | `" $2 "` | " $3 " | " $4 " |"}')
EOF

rm -f "$TMP_REMOTE"

echo ""
echo "======================================================================"
echo " AUDITORÍA FINALIZADA EXITOSAMENTE                                    "
echo " 1. ${FILE_ESTADO}                                                    "
echo " 2. ${FILE_ARQUITECTURA}                                              "
echo "======================================================================"
