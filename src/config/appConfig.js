export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || 'Mi Aplicación',
  tagline: import.meta.env.VITE_APP_TAGLINE || 'Panel Operativo',
  symbol: import.meta.env.VITE_APP_SYMBOL || 'A',
  version: '1.0.0',
  roles: ['superadmin', 'admin', 'user'],
};
