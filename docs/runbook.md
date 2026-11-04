# Runbook — Condominio App

> **Estado:** verificado 2026-11-03. **Uso:** operación y guardia.
>
> No ejecutar comandos destructivos sin backup. No imprimir secretos en terminales ni en tickets.

---

## 1. Error 502 en Kong (`:8200`)

### Síntoma

La app recibe `502 Bad Gateway` al llamar `/auth/v1`, `/rest/v1` o `/storage/v1`.

### Diagnóstico

```bash
# ¿Responde el gateway?
curl -sS -o /dev/null -w '%{http_code}\n' http://<tailscale-ip>:8200/rest/v1/

# ¿Están los contenedores?
podman ps --filter name=condo-sb-

# ¿PostgREST está vivo y puede hablar con la DB?
podman inspect condo-sb-rest --format '{{.State.Status}} {{.State.StartedAt}} {{.RestartCount}}'
podman logs --tail=100 condo-sb-rest

# ¿La DB está sana?
podman exec condo-sb-db pg_isready -U postgres
podman logs --tail=100 condo-sb-db

# ¿Kong registra 502/upstream?
podman logs --tail=100 condo-sb-kong | grep -E ' 50[234] |upstream'
```

### Causas frecuentes

- PostgREST caído o reiniciándose.
- PostgreSQL apagándose o sin conexiones.
- Cambio de IP del contenedor upstream y caché de Kong.
- Configuración de Kong inválida tras un cambio.

### Procedimiento

1. Si la DB no está sana, resolver primero la DB.
2. Si PostgREST está caído, revisar su log y reiniciarlo:

```bash
podman restart condo-sb-rest
```

3. Esperar a que responda y luego reiniciar Kong:

```bash
podman restart condo-sb-kong
```

4. Verificar:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://<tailscale-ip>:8200/rest/v1/
curl -sS -o /dev/null -w '%{http_code}\n' http://<tailscale-ip>:8200/auth/v1/health
```

No reiniciar todo el stack sin evidencia; el orden importa y un reinicio masivo puede empeorar el incidente.

---

## 2. Error de esquema en PostgREST (`HTTP 400`)

### Síntoma

`Column X of relation 'profiles' does not exist` o un error de caché de esquema después de una migración.

### Procedimiento

```bash
podman exec condo-sb-db psql -U postgres -d postgres -c "NOTIFY pgrst, 'reload schema';"
```

Si no se refleja:

```bash
podman restart condo-sb-rest
```

Verificar que la migración se aplicó en la base correcta y que PostgREST apunta a `public,storage`.

---

## 3. Crear o restaurar un superadmin

> **Advertencia:** en el estado actual (2026-11-03) cualquier usuario autenticado puede autoascenderse por la política UPDATE de `profiles`. Este procedimiento es administrativo, no un control de seguridad. Primero corregir P0-1.

### Procedimiento controlado

```sql
BEGIN;

-- Reemplazar <uuid> por el id real del usuario.
UPDATE public.profiles
SET role = 'superadmin'
WHERE id = '<uuid>';

-- Verificar que solo la fila esperada cambió y que el rol es correcto.
SELECT id, role FROM public.profiles WHERE id = '<uuid>';

COMMIT;
```

Notas:

- No es necesario actualizar `raw_user_meta_data.role`; RLS usa `profiles.role`.
- No usar el email como identificador si puede cambiar; usar el UUID.
- Registrar quién autorizó el cambio y por qué.
- Si se está creando un usuario nuevo, hacerlo por invitación/administración, no por signup abierto.

---

## 4. Restaurar la base de datos

### Preparación

1. Identificar el backup y verificar checksum.
2. Avisar ventana de mantenimiento.
3. Detener la app para evitar escrituras:

```bash
systemctl --user stop stage-stage-condominio-app.service
```

### Restauración

1. Probar primero en una base aislada.
2. Restaurar con `pg_restore`:

```bash
podman exec -i condo-sb-db pg_restore -U postgres -d postgres --clean --if-exists < ~/stage-platform/backups/condo-sb-db/<archivo>.dump
```

3. Validar:

```bash
podman exec condo-sb-db psql -U postgres -d postgres -c "SELECT count(*) FROM public.profiles;"
podman exec condo-sb-db psql -U postgres -d postgres -c "SELECT count(*) FROM public.regions;"
podman exec condo-sb-db psql -U postgres -d postgres -c "SELECT count(*) FROM public.communes;"
```

4. Verificar RLS y login con un usuario de prueba.
5. Arrancar la app:

```bash
systemctl --user start stage-stage-condominio-app.service
```

6. Registrar RPO/RTO real y el motivo del incidente.

---

## 5. Rotación de secretos

1. Backup y ventana de mantenimiento.
2. Rotar contraseña de PostgreSQL y actualizar el secreto en el compose/Podman.
3. Rotar JWT secret; actualizar anon/service keys.
4. Actualizar `.env`, rebuild del frontend y redeploy.
5. Reiniciar Kong, GoTrue, PostgREST y Storage.
6. Verificar login, perfiles, storage y healthchecks.
7. Revisar logs de accesos anómalos.

No imprimir los valores nuevos en consola compartida ni en documentos. Usar el gestor de secretos.

---

## 6. Incidente: servicio de administración expuesto

Si se confirma acceso no autorizado a Studio, Inbucket o PostgreSQL:

1. Quitar el `ports:` correspondiente y recrear el contenedor.
2. Rotar service key, JWT secret y contraseña de PostgreSQL.
3. Revisar logs de Kong, GoTrue, PostgREST, Studio e Inbucket.
4. Revisar `auth.users`, `profiles.role` y objetos de Storage.
5. Forzar cierre de sesiones (rotación de JWT).
6. Documentar el incidente y las acciones.

---

## 7. Rollback de despliegue

1. Identificar la imagen/digest anterior.
2. Retaggear como `latest` o fijar el digest en el Quadlet.
3. `systemctl --user restart stage-stage-condominio-app.service`.
4. Verificar asset, login y healthchecks.
5. Si el rollback incluye DB, seguir el procedimiento de restauración.

---

## 8. Comandos útiles

```bash
# Inventario
podman ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}'

# Logs
podman logs --tail=200 condo-sb-rest
podman logs --tail=200 condo-sb-kong
podman logs --tail=200 condo-sb-auth

# Estado del servicio de la app
systemctl --user status stage-stage-condominio-app.service --no-pager

# Salud
curl -fsS http://<tailscale-ip>:8200/auth/v1/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://<tailscale-ip>:8200/rest/v1/
curl -fsS -o /dev/null -w '%{http_code}\n' http://<tailscale-ip>:3002/
```

---

## 9. Enlaces

- [operations.md](operations.md)
- [security.md](security.md)
- [architecture.md](architecture.md)
