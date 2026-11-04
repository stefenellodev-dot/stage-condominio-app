# Plan de endurecimiento para producción (sin Inbucket)

> **Objetivo:** cerrar los hallazgos abiertos sin modificar el comportamiento ya verificado de la app.

## Orden de ejecución

1. **Avatares privados**
   - Migración: `storage.buckets.public = false` para `avatars`.
   - Reemplazar políticas de Storage por propietario/ruta con `auth.uid()`.
   - Frontend: guardar ruta interna y generar URL firmada al mostrar.
   - Verificar que usuario A no lea/escriba avatar de B.
   - Actualizar docs.

2. **Copia off-host de backups**
   - Definir destino (Mac u otro host).
   - Probar `rsync`/`scp` del último dump y checksum.
   - Automatizar desde Piave o desde el host destino.
   - Probar restore mensual en entorno aislado.
   - Documentar RPO/RTO.

3. **Rotación de secretos PostgreSQL**
   - Ventana de mantenimiento.
   - Backup previo.
   - Rotar contraseña compartida y actualizar `docker-compose.yml`, `roles.sql` y `.env`.
   - Reiniciar solo stack Condominio.
   - Validar login, RLS, backup y restore.

4. **Grants de `regions` y `communes`**
   - Migración: revocar escritura de `anon` y `authenticated`.
   - Mantener `SELECT` para referencia pública.
   - Verificar que la app siga cargando regiones/comunas.

5. **Node 22 en build**
   - Cambiar `node:20-alpine` por `node:22-alpine` en `Dockerfile`.
   - Rebuild y deploy.
   - Verificar app, healthcheck y ausencia de `EBADENGINE`.

6. **Tests y CI mínimos**
   - Agregar lint y tests unitarios básicos.
   - Agregar pruebas SQL de aislamiento por empresa.
   - Configurar pipeline en GitHub.
   - No mergear sin CI verde.

7. **Observabilidad y cabeceras**
   - Healthchecks para PostgREST, GoTrue y Storage.
   - CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
   - Alertas de 5xx, auth, backup y espacio.
   - Slow query log con umbral definido.

## Regla de no daño

Cada paso se ejecuta en rama, con backup previo, build verificado y rollback documentado. No se tocan otros stacks ni se exponen secretos.
