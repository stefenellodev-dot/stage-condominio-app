# Operaciones — Condominio App

> **Estado:** verificado 2026-11-03. **Ámbito:** staging en Piave. **No producción.**
>
> Antes de cualquier cambio: tomar respaldo, revisar [security.md](security.md) y confirmar que no se están exponiendo servicios de administración.

---

## 1. Inventario

| Recurso | Identificador | Notas |
|---|---|---|
| App | `stage-stage-condominio-app` | Quadlet systemd de usuario, `Restart=always`, límite 768 MB |
| Servicio | `stage-stage-condominio-app.service` | `systemctl --user` |
| Stack Supabase | `condo-sb-db`, `condo-sb-kong`, `condo-sb-rest`, `condo-sb-auth`, `condo-sb-storage`, `condo-sb-meta`, `condo-sb-studio`, `condo-sb-inbucket` | Contenedores Podman rootless |
| Red | `net-stage-platform` | Red externa compartida; IPs dinámicas |
| Código en servidor | `~/stage-platform/apps/stage-condominio-app/src/` | Copia sincronizada desde el Mac |
| Deploy CLI | `~/stage-platform/bin/stage-cli` | `deploy` compila imagen y reinicia el servicio |
| Config Supabase | `~/stage-platform/core/supabase-condominio/` | Compose, Kong, init y volúmenes |
| Entorno de app | `~/stage-platform/apps/stage-condominio-app/.env.stage` | Variables del contenedor; las `VITE_*` se hornean en build |

### Puertos

| Puerto | Servicio | Exposición actual | Objetivo |
|---|---|---|---|
| `3002` | App | Tailscale | Mantener; TLS solo si se publica |
| `8200` | Kong | Tailscale | Mantener; CORS restringido a la app y Vite local |
| `8280` | Studio | `127.0.0.1`, sin auth | Túnel SSH restringido |
| `9100` | Inbucket | Tailscale, sin auth | **Cerrar al terminar pruebas** |
| `54322` | PostgreSQL | Cerrado; solo red de contenedores | Mantener cerrado |

Las IPs de los contenedores cambian al recrearlos. Usar nombres DNS de la red, no IPs.

---

## 2. Despliegue correcto

### 2.1 Flujo real

La tarea de VS Code `Deploy to Piave Staging` ejecuta:

```bash
npm run build
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.env' --exclude '.env.*' --exclude 'dist' --exclude 'docs' --exclude 'scripts' --exclude 'deploy' --exclude '.vscode' --exclude '.opencode' --exclude '*.md' --exclude '.DS_Store' ./ piave:~/stage-platform/apps/stage-condominio-app/src/
ssh piave '~/stage-platform/bin/stage-cli deploy stage-condominio-app'
```

`stage-cli deploy` hace:

1. `podman build -t localhost/stage-stage-condominio-app:latest <src>`
2. `systemctl --user daemon-reload`
3. `systemctl --user restart stage-stage-condominio-app.service`

### 2.2 Regla importante

`podman restart stage-stage-condominio-app` **no despliega** una imagen nueva: reinicia el contenedor con la imagen existente. Para aplicar cambios usar la tarea de VS Code o `stage-cli deploy`.

### 2.3 Verificación posterior

```bash
# Estado y arranque del contenedor
ssh piave 'podman inspect stage-stage-condominio-app --format "{{.Image}} {{.State.StartedAt}} {{.State.ExitCode}}"'

# El servicio debe estar activo
ssh piave 'systemctl --user status stage-stage-condominio-app.service --no-pager'

# La app debe responder y servir el asset esperado
curl -sI http://<tailscale-ip>:3002/
curl -s http://<tailscale-ip>:3002/ | grep -E '<title>|/assets/'
```

Si el asset cambió pero el HTML sigue apuntando al anterior, el build o la copia no se aplicó. Revisar el log del deploy y el `StartedAt` del contenedor.

### 2.4 Sincronización y secretos

El `rsync` excluye `.env`, `.env.*`, `dist`, `docs`, `scripts`, `deploy`, `.vscode`, `.opencode`, `*.md`, `node_modules` y `.git`. El `.env` de producción/preproducción debe existir y mantenerse en el servidor; no viaja desde el repo. `.gitignore` y `.dockerignore` evitan publicar secretos y artefactos.

- Confirmar que el `.env` remoto tiene las variables correctas antes de desplegar.
- No copiar credenciales de auditoría ni claves de servicio.
- El healthcheck efectivo vive en el Quadlet, no en la imagen OCI.

### 2.5 CI — acceso a la base de stage desde GitHub Actions

El job `rls` de `.github/workflows/ci.yml` ejecuta la suite RLS (34 casos) contra `condo-sb-db` desde un runner de GitHub:

1. El runner se une al tailnet como nodo **efímero** con la auth key `TS_AUTHKEY` (reusable, 90 días, expiración de nodo deshabilitada por efímera).
2. Conexión SSH a `stefenello@100.126.211.117` usando la clave privada `RLS_SSH_KEY` (ed25519, `~/.ssh/rls_ci_ed25519` local).
3. En piave, la línea correspondiente de `~/.ssh/authorized_keys` tiene **comando forzado** `podman exec -i condo-sb-db psql -U postgres -d postgres -v ON_ERROR_STOP=1` con `no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding`: la clave solo puede ejecutar psql, sin shell ni forwarding.
4. El SQL de la suite viaja por stdin; cada caso corre en su propia transacción con `ROLLBACK`.

Postgres **no** está expuesto en ningún puerto público ni de Tailscale (bitácora: se probó publicar `100.126.211.117:5432` en `docker-compose.yml` y podman 4.9.3 lo descartó silenciosamente; se revirtió).

Mantenimiento:
- **Renovar `TS_AUTHKEY` cada 90 días** (Consola Tailscale → Settings → Keys → Generate auth key; reutilizable + efímera), y actualizar el secreto de GitHub (`gh secret set TS_AUTHKEY < <archivo-copia> `).
- Los secretos de GitHub en uso: `RLS_SSH_KEY`, `TS_AUTHKEY` (actualizados con `gh secret set`, nunca en texto plano en el repo).
- Branch protection de `main` exige los checks `build` y `rls` (strict=false).

---

## 3. Respaldos

### 3.1 Estado actual

- Timer de usuario `condo-sb-db-backup.timer` habilitado, con `Linger=yes`.
- Script desplegado: `~/stage-platform/bin/backup-condo-sb-db.sh`.
- Salida: `~/stage-platform/backups/condo-sb-db/condo-sb-db-<UTC>.dump` + `.sha256`.
- Retención local: 7 días.
- Primera ejecución manual OK; backup verificado con `sha256sum -c`.
- Copia off-host: implementada en la Mac del desarrollador en `~/Backups/condo-sb-db` (fuera del repositorio, sin GitHub). Verificado con checksum.

### 3.2 Operación

```bash
# Ejecutar ahora
systemctl --user start condo-sb-db-backup.service

# Ver próximo disparo y estado
systemctl --user list-timers condo-sb-db-backup.timer --no-pager
systemctl --user status condo-sb-db-backup.service --no-pager

# Verificar el backup más reciente
latest=$(ls -t ~/stage-platform/backups/condo-sb-db/*.dump | head -1)
sha256sum -c "$latest.sha256"
```

El script usa `pg_dump -Fc`, escribe en temporal, valida que no esté vacío, aplica checksum y renombra de forma atómica.

#### Copia off-host (Mac)

- Script: `scripts/sync-backup-offhost.sh` del repositorio. Trae el dump más reciente desde `piave` a `~/Backups/condo-sb-db` y verifica el checksum por valor (los `.sha256` contienen la ruta absoluta de piave, no sirven con `shasum -c` local).
- Programación: LaunchAgent `cl.stefenello.condo-backup-sync` en `~/Library/LaunchAgents`, diario 09:30.
- Log: `~/Backups/condo-sb-db/.sync.log`.
- Retención off-host: 30 días.

```bash
# Copiar ahora desde la Mac
scripts/sync-backup-offhost.sh

# Estado del LaunchAgent
launchctl print gui/$(id -u)/cl.stefenello.condo-backup-sync | grep -E "state =|last exit"

# Ejecutar manualmente vía launchd
launchctl kickstart gui/$(id -u)/cl.stefenello.condo-backup-sync
```

### 3.3 Restauración

Procedimiento resumido; el detalle está en [runbook.md](runbook.md):

1. Identificar el backup y verificar el checksum.
2. Si el backup local se perdió, traer la última copia off-host desde la Mac: `scp ~/Backups/condo-sb-db/<archivo>.dump piave:~/stage-platform/backups/condo-sb-db/` y verificar `sha256sum -c`.
3. Detener la app para evitar escrituras.
4. Restaurar con `pg_restore` en una base de prueba primero.
5. Validar conteos y RLS.
6. Cambiar a producción y arrancar la app.
7. Registrar el incidente y el RPO/RTO real.

---

## 4. Healthchecks y observabilidad

### 4.1 Checks mínimos

```bash
curl -fsS http://<tailscale-ip>:8200/auth/v1/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://<tailscale-ip>:8200/rest/v1/
curl -fsS -o /dev/null -w '%{http_code}\n' http://<tailscale-ip>:3002/
podman exec condo-sb-db pg_isready -U postgres
```

### 4.2 Estado actual

- `condo-sb-db`, Kong y la app tienen healthcheck; la app responde `healthy`.
- Cabeceras de seguridad vía Kong (`response-transformer`, 2026-11-05): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` en `auth`, `rest` y `storage` (verificado con `curl -D -` en `/auth/v1/health` y `/rest/v1/`). El plugin `response-transformer` se añadió a `KONG_PLUGINS` en `docker-compose.yml` (contenedor recreado con `podman compose up -d condo-sb-kong`; `restart` no reaplica env). Backups: `kong.yml.bak-*` y `docker-compose.yml.bak-*` en `~/stage-platform/core/supabase-condominio/`.
- `index.html` incluye CSP y `Referrer-Policy` vía meta tags (la app en :3002 no pasa por Kong).
- No hay alertas de 5xx, backup, disco, memoria ni saturación. 
- `log_min_duration_statement = -1`; no hay slow query log.
- Los logs usan journald y pueden contener correos/PII.

### 4.3 Objetivo

- Healthcheck para PostgREST, GoTrue y Storage.
- Alertas de 5xx, latencia, errores de auth, backup y espacio.
- Retención de logs y redacción de PII.
- Panel simple de estado de contenedores y puertos.
- Slow queries y `pg_stat_statements` si el volumen lo justifica.

---

## 5. Rotación de secretos

### 5.0 Bóveda: Vaultwarden (2026-11-06)

Criterio establecido: **secretos de humano → Vaultwarden; secretos de máquina → GitHub Secrets / `authorized_keys` / env del servidor.**

- Contenedor `vaultwarden` (podman rootless, compose en `~/stage-platform/core/vaultwarden/`, datos en `~/stage-platform/volumes/vaultwarden/data`).
- Acceso: `https://piave.tailfbc159.ts.net` (HTTPS vía `tailscale serve --bg --https=443` → `100.126.211.117:8222`; la función `serve` se habilitó para el tailnet y exigirá sudo si se reconfigura). También responde HTTP solo en la IP de Tailscale, pero los clientes Bitwarden exigen HTTPS.
- `DOMAIN=https://piave.tailfbc159.ts.net` fijado en el compose (necesario para websockets/adjuntos del cliente).
- Imagen `vaultwarden/server:latest` (v1.37.5 al desplegar), `restart: unless-stopped`, healthcheck `/alive`.
- Cuenta registrada: `stefenello.dev@gmail.com` (única). `SIGNUPS_ALLOWED: 'false'` desde el 2026-11-06 — para registrar otra cuenta habría que habilitar temporalmente, recrear y deshabilitar. `ADMIN_TOKEN` (panel admin) off por defecto.
- Backup: `~/stage-platform/bin/backup-vaultwarden.sh` (sqlite online vía `python3`, checksum, retención 7 días) + timer systemd user `vaultwarden-backup.timer` (03:00 diario). Off-host: la copia `sync-backup-offhost.sh` en la Mac sincroniza también `~/Backups/vaultwarden/`.
- La bóveda guarda credenciales de persona de **todo lo administrado en piave** (stack Supabase, apps, cuentas GitHub/Tailscale, usuarios de prueba). No la consultan procesos ni CI.

### 5.1 Cuándo rotar

- Contraseña de PostgreSQL compartida expuesta en texto plano.
- Service key o JWT secret potencialmente expuestos.
- Sospecha de acceso a Studio/Inbucket/DB.
- Salida de un operador con acceso al servidor.

### 5.1a Rotaciones aplicadas (2026-11-06)

- `POSTGRES_PASSWORD` rotada (nueva generada con `openssl rand -hex` en piave, sin imprimir). Ojo con la imagen `supabase/postgres` (15.6.1.139 + **supautils**): `postgres` es el *rol privilegiado* y los roles internos son *reservados* — `ALTER ROLE` a estos genera "only superusers can alter privileged roles/reserved". Procedimiento que funcionó:
  1. Reemplazo literal (6 ocurrencias) en `docker-compose.yml`.
  2. `supautils.reserved_roles=''` en `/etc/postgresql-custom/supautils.conf` (dentro del contenedor; con `podman restart`, **no** recreate) → `ALTER ROLE supabase_auth_admin, supabase_storage_admin` (como `postgres`) y `ALTER ROLE supabase_admin` (self-alter por psql login) → restaurar el conf y `restart`.
  3. `ALTER ROLE postgres` como `supabase_admin` (el superuser de la imagen) con conexión por la red interna.
  4. Recreate de `rest/auth/storage/meta/studio` (lean el compose con la URI nueva).
  5. Verificación **por wire** (red interna, `scram-sha-256`): la `pg_hba` tiene `trust` para `127.0.0.1` — no vale como verificación. Nueva OK / vieja rechazada en los 4 roles.
- `RLS_SSH_KEY` (CI) rotada: certificado par nuevo, command-forced line reemplazada en `authorized_keys`, secreto GitHub actualizado. La vieja rechazada.
- `TS_AUTHKEY` (CI) rotada: vieja revocada en consola Tailscale, nueva (reuable+ephemeral, 90 días → **renovar antes del 2027-02-04**).
- Valores nuevos almacenados en la bóveda Vaultwarden (`https://piave.tailfbc159.ts.net`); los archivos `.bak-*` del compose contienen la contraseña vieja (ya inválida).
- Backup inmediato post-rotación: `condo-sb-db-20261106-013727.dump` verificado y copiado off-host.

### 5.2 Orden recomendado

1. Tomar backup y avisar ventana de mantenimiento.
2. Rotar la contraseña de PostgreSQL y actualizar `docker-compose.yml`/secretos.
3. Rotar el JWT secret; esto invalida sesiones y cambia anon/service keys.
4. Actualizar `.env`, rebuild del frontend y redeploy.
5. Reiniciar Kong, GoTrue, PostgREST y Storage en orden.
6. Verificar login, lectura de perfiles, storage y healthchecks.
7. Cerrar sesiones antiguas y revisar logs.

La rotación de JWT/anon key requiere coordinar el rebuild del frontend porque las variables `VITE_*` se incorporan en build.

---

## 6. Cambios y rollback

### 6.1 Antes de un cambio

- Backup verificado.
- Migración revisada y probada en una base de prueba.
- Ventana de mantenimiento.
- Plan de rollback con imagen/digest anterior.

### 6.2 Rollback de la app

`stage-cli` usa el tag `localhost/stage-stage-condominio-app:latest`. Para volver atrás:

1. Identificar la imagen anterior (`podman images --digests`).
2. Retaggearla como `latest` o ajustar el Quadlet a un digest/tag inmutable.
3. `systemctl --user restart stage-stage-condominio-app.service`.
4. Verificar asset, login y healthchecks.

### 6.3 Rollback de base de datos

Las migraciones deben ser reversibles o tener un plan de restauración. Si no hay migración reversible, restaurar el backup en una base nueva y validar antes de cortar tráfico.

---

## 7. Enlaces

- [runbook.md](runbook.md)
- [security.md](security.md)
- [architecture.md](architecture.md)
- [Auditoría profunda](../auditoria_profunda_condominio_2026-11-03.md)

## 5. Cabeceras y observabilidad

- CSP y `Referrer-Policy` se envían desde `index.html`.
- `X-Content-Type-Options` y `X-Frame-Options` deben validarse en el proxy o Kong; `serve` no agrega cabeceras HTTP.
- Healthchecks activos: `condo-sb-db`, Kong y app.
- Pendiente: alertas de 5xx, auth, backup y espacio.
