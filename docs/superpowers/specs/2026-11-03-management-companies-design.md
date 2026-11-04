# Diseño: módulo de Empresas Administradoras de Condominios

> **Estado:** propuesto y aprobado por el usuario el 2026-11-03.
> **Rama prevista:** `hardening/preprod-condominio`.
> **Alcance:** solo `superadmin` en esta etapa.

## 1. Objetivo

Agregar un módulo de negocio para administrar empresas administradoras de condominios en Chile, con CRUD completo, seguridad por RLS y una interfaz coherente con los patrones existentes de la app.

El módulo debe permitir a un `superadmin` crear, consultar, editar y desactivar empresas administradoras. No implementa todavía la relación entre un usuario `admin` y una empresa; esa relación queda preparada para una etapa posterior.

## 2. Alcance

### 2.1 Incluido

- Migración versionada para crear `public.management_companies`.
- RLS y grants para `anon`, `authenticated` y `service_role`.
- Componente de negocio `ManagementCompaniesModule`.
- Registro del módulo en `src/config/modules.js`.
- Soporte de `labelKey` en `AppLayout` para mostrar el nombre traducido en el menú.
- Textos en `src/locales/es.js` y `src/locales/en.js`.
- Listado estilo `SuperAdminTabla`.
- Vista completa de alta/edición/detalle estilo `ProfileSection`.
- Validaciones de RUT, email y campos obligatorios.
- Baja lógica con confirmación.
- Verificación de build, RLS y despliegue.

### 2.2 Fuera de alcance

- Asociación `admin → empresa administradora`.
- Roles nuevos (`operator`, `conserje`, etc.).
- Carga masiva o importación desde Excel.
- Historial/auditoría de cambios.
- Integración con otros sistemas.

## 3. Arquitectura y datos

### 3.1 Tabla

Crear `public.management_companies` con los campos definidos por el usuario:

- Identificación tributaria y legal: `rut`, `legal_name`, `fantasy_name`, `business_line`.
- Representación legal: `legal_rep_name`, `legal_rep_rut`, `legal_rep_email`.
- Registro MINVU: `minvu_registry_number`, `minvu_status`, `minvu_registered_at`, `has_guarantee_insurance`.
- Contacto: `email`, `phone`, `emergency_phone`, `website`.
- Dirección: `street`, `street_number`, `dept_or_unit`, `region_id`, `commune_id`, `region`, `commune`.
- Datos bancarios: `bank_name`, `account_type`, `account_number`, `bank_recipient_rut`.
- Estado y auditoría: `status`, `created_at`, `updated_at`, `deleted_at`.

### 3.2 Ajustes sobre el SQL propuesto

- `rut` y `minvu_registry_number` mantienen unicidad.
- `region_id` referencia `public.regions(id)` con `ON DELETE SET NULL`.
- `commune_id` referencia `public.communes(id)` con `ON DELETE SET NULL`.
- `updated_at` se mantiene mediante un trigger específico:
  - `public.set_management_companies_updated_at()`.
- No se agregan `created_by` ni claves foráneas a `profiles` en esta etapa.

### 3.3 Índices

Se crean índices para:

- `rut`.
- `minvu_registry_number`.
- `commune_id`.
- `deleted_at`.

Las restricciones `UNIQUE` generan sus propios índices para `rut` y `minvu_registry_number`.

### 3.4 Permisos y RLS

- `anon` no tiene ningún permiso sobre la tabla.
- `authenticated` tiene `SELECT`, `INSERT` y `UPDATE`.
- `service_role` tiene todos los permisos.
- RLS habilitada.
- Políticas:
  - `Lectura administradoras`: `SELECT TO authenticated USING (deleted_at IS NULL AND public.is_superadmin())`.
  - `Alta administradoras`: `INSERT TO authenticated WITH CHECK (public.is_superadmin())`.
  - `Edición administradoras`: `UPDATE TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin())`.
- No hay política de `DELETE`; la baja es lógica mediante `deleted_at`.

El uso de `public.is_superadmin()` mantiene la autorización en la base de datos y permite cambiar el alcance futuro sin modificar el frontend.

## 4. Frontend

### 4.1 Componente principal

Crear `src/components/business/ManagementCompaniesModule.jsx`.

El componente maneja:

- Listado de empresas.
- Búsqueda por razón social, nombre de fantasía, RUT, representante y comuna.
- Filtros por `status` y `minvu_status`.
- Paginación local.
- Estado de carga y error.
- Modal/vista de alta, edición y detalle.
- Baja lógica con confirmación.

### 4.2 Listado

El listado sigue el patrón de `SuperAdminTabla.jsx`:

- Contador de resultados.
- Campo de búsqueda.
- Select de estado operativo.
- Select de estado MINVU.
- Tabla con columnas:
  - Empresa.
  - RUT.
  - Representante legal.
  - Registro MINVU.
  - Comuna.
  - Estado.
  - Acciones.
- Acciones por fila:
  - Editar.
  - Dar de baja, excepto si ya está dada de baja o si el usuario no tiene permisos.

### 4.3 Vista completa de detalle/alta/edición

Al crear o editar, la lista se oculta y el formulario ocupa el tab, con el mismo estilo de `ProfileSection.jsx`:

- Secciones con `styles.sectionBox`.
- Títulos de sección.
- Campos en grids de una o dos columnas.
- Selects de región y comuna.
- Botón principal de guardar.
- Botón secundario “Volver al listado”.

Las secciones son:

1. Identificación legal.
2. Representante legal.
3. Registro MINVU.
4. Contacto.
5. Dirección.
6. Datos bancarios.

### 4.4 Formulario y datos

El formulario usa un estado único con todos los campos. Al guardar:

- Normaliza strings con `trim()`.
- Convierte `region_id` y `commune_id` a entero o `null`.
- Guarda `region` y `commune` como texto denormalizado cuando hay selección.
- Envía `account_type` como `null` si está vacío.
- Envía `minvu_registered_at` como `null` si está vacío.
- Envía `deleted_at` como `null` al crear o reactivar.

Al editar:

- Se carga el registro completo desde la fila seleccionada.
- Se permiten cambios en todos los campos.

Al dar de baja:

- Se actualiza `deleted_at` con la fecha actual.
- Se puede mantener `status` o cambiarlo a `inactive`; se usará `deleted_at` como criterio principal para ocultar.

### 4.5 Validaciones

Validaciones de cliente:

- RUT de empresa obligatorio y válido.
- Razón social obligatoria.
- Representante legal obligatorio.
- RUT de representante obligatorio y válido.
- Email corporativo obligatorio y con formato válido.
- MINVU: si se informa fecha, debe ser válida.
- RUTs se formatean con la utilidad existente `formatRut`.

Validaciones de servidor:

- Unicidad de `rut`.
- Unicidad de `minvu_registry_number` cuando no es nulo.
- RLS rechaza operaciones de usuarios no superadmin.
- Errores de unicidad se muestran con un mensaje claro.

### 4.6 Manejo de errores

- Los errores de Supabase se muestran mediante `showError`.
- El submit se deshabilita mientras se guarda.
- Se muestra mensaje de éxito al crear, editar o dar de baja.
- Si un usuario sin permisos fuerza el tab, la tabla queda vacía y cualquier operación falla por RLS.

## 5. Integración en la app

### 5.1 Registro del módulo

En `src/config/modules.js`:

```js
{
  id: 'management_companies',
  labelKey: 'nav.management_companies',
  icon: '🏢',
  component: ManagementCompaniesModule,
  roles: ['superadmin']
}
```

### 5.2 Navegación

`AppLayout.jsx` se ajusta mínimamente para resolver `labelKey` con `t()`:

- Si el módulo tiene `labelKey`, usar `t(mod.labelKey)`.
- Si no, usar `label`.

Esto permite mantener el menú traducido sin romper los módulos existentes.

### 5.3 i18n

Agregar claves en `src/locales/es.js` y `src/locales/en.js`:

- `nav.management_companies`.
- Título, subtítulo y botones del módulo.
- Labels de todos los campos.
- Opciones de estado y MINVU.
- Mensajes de éxito y error.
- Textos de confirmación de baja.

No se deben hardcodear strings visibles en el componente.

## 6. Seguridad

- Solo `superadmin` puede leer y modificar empresas en esta etapa.
- `anon` no accede.
- `authenticated` tiene permisos mínimos; la RLS decide la autorización.
- No hay borrado físico.
- Datos bancarios solo son visibles para `superadmin`.
- El frontend no es frontera de seguridad; RLS es la barrera real.

## 7. Verificación

### 7.1 Build y código

- Ejecutar `npm run build`.
- Verificar que no haya referencias rotas.
- Verificar que el módulo se registra y carga.

### 7.2 Base de datos

- Aplicar la migración en Piave.
- Verificar tabla, índices, trigger y RLS.
- Probar:
  - `superadmin` lee y edita.
  - usuario normal recibe 0 filas.
  - `anon` recibe 401 o 0 filas.
  - baja lógica oculta el registro.

### 7.3 Despliegue

- Build local.
- `rsync` excluyendo `.env`, `node_modules`, `dist` y artefactos.
- `stage-cli deploy stage-condominio-app`.
- Verificar HTTP 200, asset servido y módulo visible solo para superadmin.

## 8. Etapa futura: admin por empresa

Cuando exista la asociación entre usuarios y empresas:

1. Agregar `management_company_id` a `profiles` o una tabla de membresía.
2. Ajustar la política SELECT para que:
   - `superadmin` vea todo.
   - `admin` vea solo su empresa.
3. Reutilizar el mismo componente y solo cambiar RLS.

Esta etapa no se implementa ahora.

## 9. Riesgos y decisiones

- El módulo queda visible solo para `superadmin`; esto es coherente con el estado actual de la app.
- Los datos bancarios se almacenan en texto plano en la base; su protección depende de RLS y de no exponer la base. Una etapa posterior puede cifrar campos sensibles.
- La unicidad de `rut` impide recrear una empresa dada de baja con el mismo RUT. Si se necesita reactivar, se debe hacer un restore o una reactivación explícita.
- No se agregan tests automatizados porque el proyecto no tiene infraestructura de tests; la verificación será manual y por RLS.
