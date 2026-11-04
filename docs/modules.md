# Módulos de negocio y flujos

## Roles

- `superadmin`: acceso total.
- `admin`: acceso solo a la empresa administradora asociada.
- `user`: acceso solo a su unidad y a los espacios comunes de su condominio.

## Empresas Administradoras (`management_companies`)

- Visible para: `superadmin`, `admin`.
- `superadmin`: crea, edita, da de baja y asocia admins.
- `admin`: solo consulta su empresa y ve admins asociados.
- Acciones activas: `Administradores`, `Editar` y `Eliminar` solo para `superadmin`.
- Flujo: listado con búsqueda/filtros → alta/edición en vista completa → baja lógica.

## Condominios (`condominiums`)

- Visible para: `superadmin`, `admin`.
- `superadmin`: crea, edita y da de baja cualquier condominio.
- `admin`: crea, edita y da de baja solo condominios de su empresa.
- Acciones activas: `Ver`, `Editar` y `Eliminar` para roles gestores; `Ver` para consulta.
- Flujo: listado con filtros → alta/edición en vista completa → baja lógica.

## Unidades (`units`)

- Visible para: `superadmin`, `admin`, `user`.
- `superadmin`: crea, edita y da de baja cualquier unidad.
- `admin`: crea, edita y da de baja solo unidades de su empresa.
- `user`: solo consulta sus unidades mediante `Ver`.
- Acciones activas: `Ver` para todos; `Editar` y `Eliminar` solo para gestores.
- Flujo: listado filtrado por RLS → alta/edición para gestores → vista de solo lectura para `user`.

## Espacios Comunes (`common_areas`)

- Visible para: `superadmin`, `admin`, `user`.
- `superadmin`: crea, edita y da de baja cualquier espacio.
- `admin`: crea, edita y da de baja solo espacios de su empresa.
- `user`: solo consulta espacios de su condominio y ve detalle.
- Acciones activas: `Ver` para todos; `Editar` y `Eliminar` solo para gestores.
- Flujo: pestaña Catálogo para fichas; pestaña Agenda/Reservas para solicitudes.

## Reservas de Espacios Comunes (`common_area_bookings`)

- Visible para: `superadmin`, `admin`, `user`.
- `user`: crea reservas de sus unidades, consulta las de su condominio y cancela las propias pendientes/confirmadas.
- `admin`: consulta reservas de su empresa, aprueba, rechaza y cancela.
- `superadmin`: gestiona todas las reservas.
- Acciones activas: `Aprobar`, `Rechazar` y `Cancelar` según rol; `user` solo `Cancelar`.
- Flujo: listado cronológico → solicitud → aprobación/rechazo/cancelación → control de solapamiento por trigger.

## Regla general

La UI oculta acciones, pero la autorización real está en RLS. Toda tabla nueva debe tener RLS, grants mínimos y migración versionada.
