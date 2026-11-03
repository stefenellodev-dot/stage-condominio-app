# ARCHITECTURE & DEVELOPER GUIDELINES (FOR AGENTS & OPENCODE)

Este proyecto es un **Starter Kit / Boilerplate desacoplado** para aplicaciones web B2B y SaaS basadas en React + Supabase.

---

## 1. Reglas Sagradas para Asistentes y Desarrolladores

1. **NO MODIFICAR EL NÚCLEO DE AUTENTICACIÓN:**
   * Los archivos `src/context/AuthContext.jsx`, `src/lib/supabase.js`, y `src/components/auth/*` son estándar. No agregar lógica de negocio en ellos.
2. **DESACOPLAMIENTO DE MÓDULOS DE NEGOCIO:**
   * Toda vista, pantalla o módulo específico de un cliente **DEBE** crearse en `src/components/business/`.
   * Para hacer visible un módulo en el menú, solo debe registrarse en `src/config/modules.js`.
3. **PARAMETRIZACIÓN POR CONFIGURACIÓN:**
   * La identidad del cliente (nombre, descripción, siglas) se define en `src/config/appConfig.js` y se alimenta mediante variables de entorno en `.env`.
4. **ESTILOS Y DISEÑO:**
   * Usar los tokens de diseño definidos en `src/styles/theme.js` y las variables CSS de `index.html` (`var(--bg-app)`, `var(--primary)`, `var(--border-subtle)`, etc.). No usar librerías externas de CSS a menos que se solicite explícitamente.
5. **INTERNACIONALIZACIÓN (i18n):**
   * Cualquier texto nuevo en la interfaz debe tener su respectiva clave en `src/locales/es.js` y `src/locales/en.js`.

---

## 2. Estructura de Directorios

```text
src/
├── components/
│   ├── auth/          # Login, Registro, Recuperación (FROZEN - No modificar)
│   ├── business/      # MÓDULOS DE NEGOCIO DEL CLIENTE (Aquí se programa)
│   ├── dashboard/     # Perfil y Administración de usuarios (FROZEN)
│   ├── layout/        # AppLayout dinámico y barra de navegación (FROZEN)
│   └── ui/            # Toast, modales y componentes visuales reutilizables
├── config/
│   ├── appConfig.js   # Branding y metadatos de la aplicación
│   └── modules.js     # REGISTRO DECLARATIVO DE MÓDULOS
├── context/           # AuthContext e I18nContext
├── lib/               # Cliente Supabase singleton
├── locales/           # Diccionarios es.js y en.js
└── styles/            # Tokens visuales y temas
