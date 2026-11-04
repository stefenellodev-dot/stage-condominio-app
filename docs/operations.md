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
| `3002` | App | Tailscale | Mantener, preferiblemente detrás de TLS/proxy |
| `8200` | Kong | Tailscale | Mantener; restringir CORS |
| `8280` | Studio | Tailscale, sin auth | **Cerrar** o exigir autenticación |
| `9100` | Inbucket | Tailscale, sin auth | **Cerrar** o exigir autenticación |
| `54322` | PostgreSQL | Tailscale, `ssl=off` | **Cerrar**; usar red interna o túnel |

Las IPs de los contenedores cambian al recrearlos. Usar nombres DNS de la red, no IPs.

---

## 2. Despliegue correcto

### 2.1 Flujo real

La tarea de VS Code `Deploy to Piave Staging` ejecuta:

```bash
npm run build
rsync -avz --exclude 'node_modules' --exclude '.git' ./ piave:~/stage-platform/apps/stage-condominio-app/src/
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

El `rsync` actual copia `.env` y otros archivos del repositorio. Antes de desplegar:

- Confirmar que `.env` no contiene secretos que no deban viajar.
- Añadir `.dockerignore`/`.gitignore` para excluir `.env`, `node_modules`, `dist` y reportes.
- No copiar credenciales de auditoría ni claves de servicio.

---

## 3. Respaldos

### 3.1 Estado actual

No existe timer/servicio de respaldo para `condo-sb-db`. El único respaldo encontrado pertenece al proyecto CondoSmart y no cubre esta base. Esto es un riesgo P1: no hay recuperación ante corrupción o borrado.

### 3.2 Patrón recomendado

Adaptar el script de CondoSmart (`~/condosmart/backup-db.sh`) para `condo-sb-db`:

```bash
STAMP="$(date -u +%Y%m%d_%H%M%S)"
OUT="/ruta/segura/condo_${STAMP}.dump"
podman exec condo-sb-db pg_dump -U postgres -d postgres -Fc > "$OUT"
sha256sum "$OUT" > "$OUT.sha256"
```

Requisitos:

- Ejecutar como usuario sin privilegios, no como root.
- Verificar que el archivo no esté vacío.
- Publicar de forma atómica (tmp -> verificación -> rename).
- Retención mínima de 30 días.
- Copia fuera del servidor (restic/rclone) y cifrada.
- Prueba de restauración mensual en un entorno aislado.
- Alerta si el backup falla o no se ejecuta.

### 3.3 Restauración

Procedimiento resumido; el detalle está en [runbook.md](runbook.md):

1. Identificar el backup y verificar el checksum.
2. Detener la app para evitar escrituras.
3. Restaurar con `pg_restore` en una base de prueba primero.
4. Validar conteos y RLS.
5. Cambiar a producción y arrancar la app.
6. Registrar el incidente y el RPO/RTO real.

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

- `condo-sb-db` y Kong tienen healthcheck; la mayoría de los servicios restantes no.
- No hay alertas de 5xx, backup, disco, memoria ni saturación.
- `log_min_duration_statement = -1`; no hay slow query log.
- Los logs usan journald y pueden contener correos/PII.
- La app no envía cabeceras de seguridad.

### 4.3 Objetivo

- Healthcheck para PostgREST, GoTrue y Storage.
- Alertas de 5xx, latencia, errores de auth, backup y espacio.
- Retención de logs y redacción de PII.
- Panel simple de estado de contenedores y puertos.
- Slow queries y `pg_stat_statements` si el volumen lo justifica.

---

## 5. Rotación de secretos

### 5.1 Cuándo rotar

- Contraseña de PostgreSQL compartida expuesta en texto plano.
- Service key o JWT secret potencialmente expuestos.
- Sospecha de acceso a Studio/Inbucket/DB.
- Salida de un operador con acceso al servidor.

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
