# Plan post-auditoría — endurecimiento y estandarización

## Decisiones confirmadas

- Avatares: URL firmada de 15 minutos, renovación automática al cargar.
- `user`: solo puede editar teléfono, teléfono de urgencias y sitio web.
- Backup off-host: copia a `~/Backups/condo-sb-db` en la Mac, fuera del repositorio.
- Responsive móvil: obligatorio para `user`; admin/superadmin mantienen desktop.
- Inbucket: temporal, cerrar al finalizar pruebas.

## Secuencia

1. **Avatar firmado de 15 minutos**
   - Frontend: `createSignedUrl(path, 900)`.
   - Renovar URL al montar perfil/listados.
   - Verificar que usuario A no acceda al avatar de B.
   - Actualizar documentación.

2. **Campos editables limitados para `user`**
   - Definir lista exacta: `phone`, `emergency_phone`, `website`.
   - RLS: policy UPDATE con `WITH CHECK` y trigger para bloquear el resto.
   - UI: formulario de perfil con campos deshabilitados para datos estructurales.
   - Pruebas para escalada de privilegios.

3. **Backup off-host en Mac**
   - Copiar último dump y checksum a `~/Backups/condo-sb-db`.
   - Verificar checksum local.
   - Documentar comando de restauración.
   - Programar copia periódica sin sincronizar con GitHub.

4. **RLS y autorización automatizadas**
   - Crear pruebas para superadmin, admin y user.
   - Probar cross-company, cross-condominium y acceso directo por API.
   - Verificar aprobación/rechazo/cancelación de reservas.
   - Ejecutar y registrar resultados.

5. **Responsive para `user`**
   - Adaptar listados y formularios del rol `user`.
   - Evitar scroll horizontal crítico.
   - Verificar en móvil, tablet y desktop.
   - Documentar límites para admin/superadmin.

6. **CI mínimo**
   - Build, audit y pruebas automatizadas.
   - Bloquear merge si falla.

7. **Cabeceras y observabilidad**
   - CSP, nosniff, referrer policy.
   - Healthchecks y alertas básicas.
   - Retención y redacción de logs.

## Regla de cierre

Cada tarea se marca terminada solo con verificación ejecutada y evidencia registrada.
