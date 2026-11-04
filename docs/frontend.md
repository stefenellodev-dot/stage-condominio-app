# Frontend — Condominio App

> **Estado:** actualizado 2026-11-04. React 18 + Vite 5, build estático servido por `serve -s` como usuario `node`.
>
> El frontend no es la frontera de seguridad. Toda autorización real debe vivir en RLS; la UI solo oculta acciones.

---

## 1. Stack

| Elemento | Valor |
|---|---|
| Framework | React 18.3.1 |
| Bundler | Vite 5.4.x |
| Cliente Supabase | `@supabase/supabase-js` 2.x (2.118.0 observado) |
| Estilos | Objetos JS + variables CSS (`src/styles/theme.js`, `src/styles/tokens.css`) |
| Servidor | `serve -s` en Node 20 Alpine, puerto 3000 interno |
| Build | `vite build` -> `dist/` |
| Tests / lint / CI | **No existen** |

---

## 2. Mapa de archivos

```text
src/
├── App.jsx                         # Router por estado: login/registro/OTP/reset o Dashboard
├── main.jsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── SignUpForm.jsx
│   │   ├── VerifyOtpForm.jsx
│   │   ├── ForgotForm.jsx
│   │   └── ResetForm.jsx
│   ├── business/
│   │   ├── HomeOverview.jsx        # No referenciado
│   │   └── InventoryModule.jsx     # Placeholder
│   ├── dashboard/
│   │   ├── Dashboard.jsx
│   │   ├── ProfileSection.jsx
│   │   └── SuperAdminTabla.jsx
│   └── layout/
│       └── AppLayout.jsx
├── config/
│   ├── appConfig.js
│   └── modules.js
├── context/
│   ├── AuthContext.jsx
│   ├── I18nContext.jsx
│   └── ToastContext.jsx
├── lib/
│   ├── supabase.js
│   ├── roles.js
│   └── rut.js
├── locales/
│   ├── es.js
│   └── en.js
└── styles/
    ├── theme.js
    └── tokens.css
```

---

## 3. Autenticación

### 3.1 Cliente

`src/lib/supabase.js` crea el cliente con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Ambas se incorporan en build; cambiar el entorno exige rebuild.

### 3.2 Flujo

1. `App.jsx` muestra login, registro, verificación OTP, recuperación y reset según estado local.
2. `SignUpForm` llama `supabase.auth.signUp({ email, password })`; no envía metadata de rol.
3. `VerifyOtpForm` confirma `type: 'signup'` con un código de 6 dígitos.
4. `ForgotForm` llama `resetPasswordForEmail`; `ResetForm` verifica `type: 'recovery'` y actualiza la contraseña.
5. `AuthContext` escucha `onAuthStateChange`, carga `profiles` por `id` y expone `isAdmin`/`isSuperadmin`.
6. `App.jsx` renderiza `Dashboard` si hay sesión.

### 3.3 Puntos débiles

- Signup abierto; la metadata de rol no se envía desde el formulario, pero la API de GoTrue acepta metadata arbitraria.
- Los códigos OTP llegan a Inbucket, que está expuesto sin autenticación.
- No hay rate limiting ni captcha en el frontend.
- La sesión se guarda con el comportamiento por defecto de Supabase JS (localStorage).
- No hay manejo centralizado de sesión expirada.

---

## 4. Roles y navegación

### 4.1 Roles reales

`src/lib/roles.js` define correctamente:

```js
SUPERADMIN: 'superadmin'
ADMIN: 'admin'
USER: 'user'
```

`AuthContext` expone:

- `isSuperadmin`: `profile.role === 'superadmin'`.
- `isAdmin`: `admin` o `superadmin`.

### 4.2 Inconsistencias

| Archivo | Problema |
|---|---|
| `src/config/appConfig.js` | `roles: ['admin', 'user']`; omite `superadmin`. |
| `src/config/modules.js` | `roles: ['admin', 'operator']`; `operator` no existe en `roles.js` ni en la base. |
| `src/lib/roles.js` | `canAccessModule` devuelve `true` si `allowedRoles` incluye `user`, lo que puede abrir módulos a todos; la última condición es redundante. No se usa en la navegación. |
| `src/components/layout/AppLayout.jsx` | Filtra por `userRole === 'superadmin'` o `mod.roles.includes(userRole)`; no usa `canAccessModule`. |
| `src/components/dashboard/Dashboard.jsx` | `superadmin_users` se renderiza solo si `isSuperadmin`; además RLS bloquea datos. El alcance `admin` por comunidad queda pendiente de las tablas de dominio. |

La UI no debe ser la única barrera. Un usuario sin permisos debe recibir 0 filas/error aunque fuerce el tab; la guarda de UI es defensa en profundidad.

### 4.3 Módulos

`businessModules` solo contiene `inventory`, que renderiza un `<div>` placeholder. Es el tab inicial porque es el primer elemento y no tiene `default`. `HomeOverview` existe pero no está referenciado.

---

## 5. Perfil y avatar

### 5.1 Perfil

`ProfileSection` carga `regions` y `communes`, y actualiza `profiles` con nombres, RUT, teléfono, fecha de nacimiento, dirección, región/comuna y `avatar_url`. También guarda `region`/`commune` como texto además de los IDs.

Observaciones:

- La validación de RUT es solo de formato en cliente.
- `ProfileSection` maneja `error.code === '23505'` para RUT duplicado, pero la base real **no tiene UNIQUE en `rut`**; el mensaje no se activará y los duplicados son posibles.
- `region_id`/`commune_id` no tienen FK en la base real; pueden quedar IDs huérfanos.
- No hay validación de longitud ni sanitización más allá de `trim`.

### 5.2 Avatar

- Ruta: `${session.user.id}/avatar_${Date.now()}.${ext}`.
- Bucket `avatars` público; se usa `getPublicUrl`.
- Límite de 5 MB solo en cliente; el bucket lo replica.
- `accept` permite PNG/JPEG/WebP; el bucket también permite GIF.
- Las políticas actuales solo validan `bucket_id`, así que cualquier usuario autenticado puede subir/sobrescribir rutas de otros.
- No se borra el avatar anterior.
- Si el bucket pasa a privado, `getPublicUrl` deja de servir y hay que usar `createSignedUrl` o un proxy autenticado; guardar la ruta en `avatar_url` y firmar al mostrar.

Ver [security.md](security.md) para el bucket privado y las políticas por propietario.

---

## 6. Administración de usuarios

`SuperAdminTabla` lista perfiles, busca, filtra, cambia rol, suspende y hace soft delete. Solo se monta para `superadmin`; RLS y el trigger son la barrera real. Pendientes:

- `select('*')` sobre `profiles`; un admin con alcance futuro verá solo lo permitido, pero la UI asume todas las columnas.
- Cambia `role`, `status` y `deleted_at` directamente; solo `superadmin` puede hacerlo. El alcance `admin` por comunidad requiere tablas de dominio y una RPC administrativa.
- No hay paginación de servidor; trae todos los perfiles y pagina en cliente.
- No muestra errores de RLS de forma distinguible de otros errores.
- No hay auditoría de cambios de rol/estado.

---

## 7. i18n y branding

- `I18nContext` devuelve la clave si falta una traducción.
- Hay strings hardcodeados en español en formularios y toasts (“Código OTP enviado a Inbucket”, etc.).
- `index.html` tiene `<title>Staging Auth Test</title>`.
- `appConfig` usa `Mi Aplicación` / `Panel Operativo` por defecto.
- `.env.example` está desactualizado: apunta a un puerto que no corresponde y contiene una IP interna. No copiarlo a documentación ni a un entorno real; actualizarlo a placeholders.
- El nombre “Condominio” no está aplicado de forma consistente.

---

## 8. Build, dependencias y calidad

| Tema | Estado |
|---|---|
| Lockfile | `package-lock.json` presente, pero Docker usa `npm install` y no lo copia |
| Docker | Node 20 Alpine, root, sin `HEALTHCHECK`, `serve` global sin versión fija |
| Dependencias | `npm audit`: 1 high (`vite`), 1 moderate (`esbuild`) |
| Source maps | No expuestos en producción (verificado; no es un hallazgo) |
| Fallback SPA | `serve -s` devuelve `index.html` 200 para rutas inexistentes |
| Tests | Sin unitarios, integración ni E2E |
| Lint/format | Sin ESLint/Prettier configurados |
| CI/CD | Sin pipeline; deploy manual por tarea de VS Code |

### Objetivo

- `npm ci` y copiar `package-lock.json` en el build.
- Fijar imágenes y `serve` por versión/digest.
- Usuario no root y `HEALTHCHECK`.
- Añadir ESLint/Prettier y tests mínimos de auth/perfil.
- CI con build, audit y escaneo de secretos.
- Versionar el build con el SHA del commit.

---

## 9. Deuda técnica priorizada

| Prioridad | Tema | Acción |
|---|---|---|
| P0 | RLS/roles | Corregir en DB; la UI no protege |
| P0 | OTP/Inbucket | Cerrar Inbucket; usar SMTP real |
| P1 | Avatar | Bucket privado + políticas por usuario |
| P1 | RUT | Añadir UNIQUE/validación si el negocio lo requiere |
| P1 | `operator` | Eliminar o implementar el rol en DB y UI |
| P2 | `SuperAdminTabla` | RPC administrativa, auditoría y paginación de servidor |
| P2 | Branding/i18n | Título, nombre y strings consistentes |
| P2 | Tests/CI | Cobertura mínima y pipeline |
| P3 | `HomeOverview` | Referenciar o eliminar |

---

## 10. Enlaces

- [architecture.md](architecture.md)
- [security.md](security.md)
- [domain.md](domain.md)
- [roadmap.md](roadmap.md)
