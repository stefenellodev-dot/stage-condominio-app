# Verificación responsive rol `user` — 2026-11-05

## Contexto

Tarea 5 del plan [2026-11-05-post-audit-hardening](../superpowers/plans/2026-11-05-post-audit-hardening.md).

Método: Playwright (Chromium headless) contra la app en ejecución (`npm run dev`, apuntando a la stage de Supabase en piave:8200).
- Usuario de prueba `almagro.101@test.com` (rol `user`), contraseña restablecida vía `auth.users` + pgcrypto (`RespTest2026$`).
- Tamaños: móvil 390×844, tablet 768×1024, desktop 1280×800.
- Pantallas revisadas: home (módulo por defecto), unidades, espacios comunes, perfil.
- Criterio: `document.documentElement.scrollWidth <= window.innerWidth` (sin scroll horizontal crítico).
- Capturas: `tests/e2e/responsive-check.cjs` guarda PNG en `/tmp/r5-<vista>-<tamaño>.png`.

## Resultado: **12/12 sin scroll horizontal**

| Vista | Móvil 390×844 | Tablet 768×1024 | Desktop 1280×800 |
|-------|---------------|-----------------|------------------|
| home | OK | OK | OK |
| unidades | OK | OK | OK |
| espacios comunes | OK | OK | OK |
| perfil | OK | OK | OK |

Todos los `scrollWidth` coinciden con `innerWidth`: no hay desbordamiento horizontal en ninguna combinación.

## Decisiones verificadas

- Los módulos accesibles al rol `user` son `units`, `common_areas` y `profile` (AppLayout filtra la navegación por `mod.roles`, `modules.js:17-19`).
- `users` (gestión de usuarios) permanece solo para superadmin/admin — consistente con "admin/superadmin mantienen desktop".
- Los campos estructurales del perfil están deshabilitados para `user` (migration `20261105_000002` + UI en `ProfileSection`).

## Script

`tests/e2e/responsive-check.cjs` (devDependency `playwright` añadida para futuras ejecuciones en CI).
