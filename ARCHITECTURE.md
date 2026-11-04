# Arquitectura y directrices

> La arquitectura detallada, los componentes, el flujo de auth y los límites de confianza están en **[docs/architecture.md](docs/architecture.md)**.
>
> Seguridad y RLS: **[docs/security.md](docs/security.md)**. Operación: **[docs/operations.md](docs/operations.md)**.

---

## 1. Reglas para asistentes y desarrolladores

1. **No modificar el núcleo de autenticación sin orden explícita.**
   - `src/context/AuthContext.jsx`, `src/lib/supabase.js` y `src/components/auth/*` son zona congelada.
   - Excepción: una corrección de seguridad aprobada puede tocar estos archivos, pero debe documentarse y verificarse.
2. **Desacoplar módulos de negocio.**
   - Toda pantalla de condominio va en `src/components/business/`.
   - Para hacer visible un módulo, registrarlo en `src/config/modules.js`.
3. **Parametrizar por configuración.**
   - Branding en `src/config/appConfig.js` y variables `VITE_*`.
   - Las variables `VITE_*` se incorporan en build; cambiar el entorno exige rebuild.
4. **Estilos y diseño.**
   - Usar `src/styles/theme.js` y las variables CSS de `src/styles/tokens.css`.
   - No agregar Tailwind, Bootstrap ni librerías de UI sin pedido explícito.
5. **Internacionalización.**
   - Todo texto nuevo debe tener clave en `src/locales/es.js` y `src/locales/en.js`.
6. **No hardcodear IPs ni secretos.**
   - Usar variables de entorno y placeholders. Las IPs de contenedores son dinámicas.

---

## 2. Zonas del código

| Zona | Ruta | Regla |
|---|---|---|
| Congelada | `src/components/auth/*`, `src/context/AuthContext.jsx`, `src/lib/supabase.js` | No modificar sin orden explícita |
| Congelada | `src/components/layout/AppLayout.jsx`, `src/components/dashboard/*` | No modificar sin orden explícita |
| Negocio | `src/components/business/*` | Aquí se implementan los módulos |
| Configuración | `src/config/modules.js`, `src/config/appConfig.js` | Registrar módulos y branding |
| i18n | `src/locales/es.js`, `src/locales/en.js` | Textos obligatorios |

---

## 3. Estructura

```text
src/
├── components/
│   ├── auth/          # Login, registro, OTP, recuperación (congelado)
│   ├── business/      # Módulos de negocio (aquí se programa)
│   ├── dashboard/     # Perfil y administración (congelado)
│   ├── layout/        # Layout y navegación (congelado)
│   └── ui/            # Componentes reutilizables (si existen)
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

## 4. Reglas de datos y seguridad

- Toda tabla nueva debe tener RLS activo y políticas explícitas.
- No usar `USING (true)` para datos personales o de condominio.
- No confiar en `raw_user_meta_data` para roles; forzar `'user'` en el alta.
- No exponer Studio, Inbucket ni PostgreSQL en la tailnet.
- Aplicar cambios de esquema con migraciones versionadas, no con `init.sql` editado a mano.
- El estado real del esquema está en [docs/domain.md](docs/domain.md).

---

## 5. Despliegue

- Compilar con `npm run build`.
- Desplegar con la tarea de VS Code o `stage-cli deploy`; `podman restart` no despliega una imagen nueva.
- Verificar imagen, asset y healthchecks después del deploy.
- Ver [docs/operations.md](docs/operations.md).
