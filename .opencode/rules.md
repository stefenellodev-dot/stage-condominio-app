REGLAS Y DIRECTRICES MAESTRAS PARA OPENCODE

Eres el desarrollador de software principal que asiste en el desarrollo de Gestión Condominio (stage-condominio-app).
Debes ceñirte de forma estricta a los siguientes principios y límites arquitectónicos.

1. Ámbito Arquitectura (Código Congelado vs Código de Negocio)

ZONA CONGELADA (PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA):

src/components/auth/*: Formularios de Login, Registro, Recuperación y OTP.

src/context/AuthContext.jsx: Ciclo de vida de autenticación Supabase.

src/components/layout/AppLayout.jsx: Layout maestro, Sidebar, selector de idioma y logout.

src/components/dashboard/*: Gestión de perfiles y usuarios del Starter Kit.

ZONA PERMITIDA PARA TRABAJO DE NEGOCIO:

src/components/business/*: Aquí se implementan el 100% de las pantallas, tablas, modales y formularios de condominios.

src/config/modules.js: Aquí se registran los nuevos módulos creados.

src/locales/es.js y src/locales/en.js: Diccionarios de internacionalización obligatorios para cualquier texto nuevo en la interfaz.

2. Protocolo Obligatorio para Crear Módulos

Cuando se solicite crear una nueva pantalla o funcionalidad (ej: Gastos Comunes):

Crear el componente dentro de src/components/business/NombreModulo.jsx.

Definir los textos en los diccionarios src/locales/es.js y src/locales/en.js.

Registrarlo en src/config/modules.js con la siguiente estructura declarativa:

{
  id: 'slug-del-modulo',
  label: 'Nombre Visible',
  icon: '🏢',
  component: NombreModulo,
  roles: ['admin', 'conserje'] // Control RBAC
}


NUNCA agregar rutas manuales en App.jsx: El enrutador y el menú lateral son dinámicos y leen directamente la configuración de modules.js.

3. Ámbito Base de Datos y Supabase

Ubicación del Backend:

Instancia: Supabase Staging en Piave (http://100.126.211.117:8100).

Seguridad y RLS (Row Level Security):

Toda tabla nueva creada en PostgreSQL DEBE TENER RLS ACTIVO (ALTER TABLE x ENABLE ROW LEVEL SECURITY;).

Las funciones en PL/pgSQL deben incluir siempre SECURITY DEFINER y SET search_path = public para evitar inyecciones de esquemas.

Convenciones de Datos:

Claves primarias: UUID PRIMARY KEY DEFAULT gen_random_uuid() o SERIAL para catálogos estáticos.

Auditoría: Columnas created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) y updated_at.

Localización Chilena: Si se vinculan personas, relacionar mediante clave foránea a public.profiles(id) y validar RUT chileno con src/lib/rut.js.

4. Ámbito Diseño, UI y Estilos

Sin dependencias pesadas de CSS: No instalar Tailwind, Bootstrap ni librerías externas de UI a menos que se indique explícitamente.

Uso estricto de Design Tokens: Utilizar las variables CSS declaradas en src/styles/tokens.css e index.html:

Fondos: var(--bg-app) (#0f172a), var(--bg-surface) (#1e293b).

Bordes: var(--border-subtle) (rgba(255, 255, 255, 0.08)).

Textos: var(--text-main) (#f8fafc), var(--text-muted) (#94a3b8).

Colores de acción: var(--primary) (#3b82f6), var(--primary-hover).

5. Ámbito Infraestructura y Despliegue (Piave)

Aislamiento de Servidor:

Esta aplicación corre en Piave en el puerto 3002 bajo el servicio Podman stage-stage-condominio-app.service.

NUNCA apuntar transferencias rsync, contenedores o puertos hacia stage-auth-app (puerto 3001).

Despliegue estándar:

Compilar siempre con npm run build antes de desplegar.

El despliegue se ejecuta exclusivamente mediante la tarea de VS Code configurada en .vscode/tasks.json.
