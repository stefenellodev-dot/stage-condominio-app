# Reglas y directrices para OpenCode

Eres el desarrollador principal de **Gestión Condominio** (`stage-condominio-app`). Estas reglas tienen prioridad sobre las convenciones por defecto del asistente. Si algo no está claro, pregunta antes de tocar zonas congeladas o seguridad.

---

## 0. Prioridad y estado

1. **No usar datos reales** hasta cerrar los P0 de `auditoria_profunda_condominio_2026-11-03.md`.
2. La documentación de referencia es `docs/README.md`; la arquitectura, `docs/architecture.md`; la seguridad, `docs/security.md`; la operación, `docs/operations.md` y `docs/runbook.md`.
3. Si el código y la documentación difieren, gana el código/configuración verificado; corrige la documentación en el mismo cambio.
4. No hardcodear IPs, secretos, tokens, correos, UUID ni credenciales. Usar variables de entorno y placeholders.
5. No commitear secretos ni archivos `.env` con valores reales.

---

## 1. Zonas congeladas y zona de negocio

### Congelado: no modificar sin orden explícita

- `src/components/auth/*`
- `src/context/AuthContext.jsx`
- `src/lib/supabase.js`
- `src/components/layout/AppLayout.jsx`
- `src/components/dashboard/*`

Una corrección de seguridad aprobada puede tocar estas zonas, pero debe ser explícita, mínima y verificada. No mezclar refactors cosméticos con seguridad.

### Zona de negocio

- `src/components/business/*`: aquí se implementan las pantallas, tablas, modales y formularios de condominio.
- `src/config/modules.js`: registro declarativo de módulos.
- `src/locales/es.js` y `src/locales/en.js`: todo texto nuevo debe tener clave en ambos idiomas.

---

## 2. Protocolo para crear módulos

1. Crear el componente en `src/components/business/NombreModulo.jsx`.
2. Añadir los textos en `src/locales/es.js` y `src/locales/en.js`.
3. Registrarlo en `src/config/modules.js`:

```js
{
  id: 'slug-del-modulo',
  label: 'Nombre Visible',
  icon: '🏢',
  component: NombreModulo,
  roles: ['admin'] // roles válidos: user, admin, superadmin
}
```

Reglas:

- Roles válidos hoy: `user`, `admin`, `superadmin`. `operator` y `conserje` **no existen**; no usarlos.
- `superadmin` siempre debe poder acceder; no lo incluyas en `roles` si el filtro ya lo contempla, pero verifica el comportamiento.
- No agregar rutas manuales en `App.jsx`; el menú es dinámico.
- La UI no es una frontera de seguridad: si el módulo muestra datos, la RLS debe impedir el acceso no autorizado aunque se fuerce el tab.

---

## 3. Base de datos, RLS y Supabase

### Reglas obligatorias

- Toda tabla nueva debe tener `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- Cada tabla debe tener políticas explícitas para `SELECT`, `INSERT`, `UPDATE` y `DELETE` según corresponda.
- No usar `USING (true)` ni `WITH CHECK (true)` para datos personales, perfiles, unidades o gastos.
- No confiar en `raw_user_meta_data` para roles. `handle_new_user` debe forzar `'user'`.
- `profiles.role` solo lo cambia un `superadmin`; el usuario común solo edita columnas de perfil.
- No otorgar `UPDATE` de tabla completa a `authenticated` si incluye `role`, `status`, `deleted_at` o `email`.
- `anon` no debe leer `profiles` ni objetos de Storage.
- El bucket `avatars` debe ser privado y las políticas deben validar el propietario/ruta con `auth.uid()`.
- No exponer el service role key en el frontend ni en documentación.
- No exponer Studio, Inbucket ni PostgreSQL en la tailnet.
- Usar migraciones versionadas; no editar `supabase/init.sql` como si fuera la base real.
- Las funciones `SECURITY DEFINER` solo cuando se justifiquen; fijar `SET search_path = public` y revisar el riesgo de escalada.
- Validar RUT y datos personales también en servidor si el negocio lo requiere; la validación de cliente es solo UX.

### Estado actual que no se debe reproducir

`supabase/init.sql` está desalineado con la base real y las políticas actuales permiten autoascenso, lectura anónima y sobrescritura de avatares. Ver `docs/security.md`.

### SQL

- Entregar SQL como migración idempotente y revisada.
- Incluir `BEGIN`/`COMMIT` solo cuando corresponda y advertir sobre bloqueos.
- Probar en una base de prueba antes de producción.
- No incluir credenciales en ejemplos.

---

## 4. UI, estilos e i18n

- Usar los tokens de `src/styles/theme.js` y `src/styles/tokens.css`.
- No agregar Tailwind, Bootstrap ni librerías de UI sin pedido explícito.
- No usar librerías nuevas si el proyecto ya tiene una solución equivalente.
- Todo texto visible debe pasar por `useTranslation` y existir en `es.js` y `en.js`.
- Mantener el branding en `src/config/appConfig.js` y variables `VITE_*`.
- Evitar strings hardcodeados en español en componentes nuevos.

---

## 5. Infraestructura y despliegue

- La app corre en Piave en el puerto `3002`, servicio `stage-stage-condominio-app.service`.
- No apuntar `rsync`, contenedores ni puertos a `stage-auth-app` (puerto `3001`).
- El deploy real es: tarea de VS Code -> `rsync` -> `stage-cli deploy` -> `podman build` -> `systemctl --user restart`.
- `podman restart` **no** aplica una imagen nueva. No documentarlo como deploy.
- Verificar después del deploy: `podman inspect`, asset servido, login y healthchecks.
- No copiar `.env` con secretos al servidor ni al repositorio.
- No ejecutar comandos destructivos sin backup y confirmación.

---

## 6. Documentación y verificación

- Actualizar `docs/` cuando cambie una política RLS, un puerto, un contenedor, el esquema o un procedimiento.
- Usar las etiquetas **Verificado**, **Propuesto** y **Obsoleto**.
- No presentar como implementado lo que solo está propuesto.
- Al cerrar un P0/P1, actualizar `docs/roadmap.md` y la fecha de verificación.
- Añadir tests cuando exista infraestructura; si no existe, proponerla antes de afirmar que algo está verificado.
- No afirmar que un cambio funciona sin evidencia: ejecutar build/tests o indicar exactamente qué falta verificar.
