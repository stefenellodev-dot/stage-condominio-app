# Dominio y datos — Condominio App

> **Estado:** esquema verificado en PostgreSQL. Implementados: empresas administradoras, membresías, condominios y unidades. El modelo de comunidades/membresías por comunidad sigue siendo propuesto.
>
> **No usar datos reales** hasta cerrar los P0 de seguridad. Ver [security.md](security.md).

---

## 1. Resumen

| Nivel | Implementado | Estado |
|---|---|---|
| Identidad | `public.profiles` | Verificado |
| Geografía | `public.regions`, `public.communes` | Verificado |
| Condominio | `communities`, `buildings`, `units` | **No existe** |
| Gastos | `expenses_period`, `unit_expenses` | **No existe** |
| Membresías | `community_members` | **No existe**; se propone |

No hay migraciones versionadas. `supabase/init.sql` no refleja el esquema real; ver sección 4.

---

## 2. Esquema implementado

### 2.1 `public.profiles`

26 columnas, 4 filas (1 `superadmin`, 3 `user`).

| Columna | Tipo | Nulo | Default | Nota |
|---|---|---|---|---|
| `id` | `uuid` | No | — | PK; FK a `auth.users(id)` `ON DELETE CASCADE` |
| `email` | `text` | Sí | — | Dato personal |
| `full_name` | `text` | Sí | — | |
| `rut` | `text` | Sí | — | Dato personal; sin UNIQUE en la base real (el `init.sql` lo declara) |
| `phone` | `text` | Sí | — | Dato personal |
| `role` | `text` | No | `'user'` | CHECK: `superadmin`, `admin`, `user` |
| `created_at` | `timestamptz` | Sí | `utc now()` | |
| `updated_at` | `timestamptz` | Sí | `utc now()` | Trigger `handle_updated_at` |
| `first_name` | `text` | Sí | — | |
| `last_name` | `text` | Sí | — | |
| `birth_date` | `date` | Sí | — | Dato personal |
| `avatar_url` | `text` | Sí | — | URL pública actualmente |
| `gender` | `text` | Sí | — | Dato sensible |
| `nationality` | `text` | Sí | `'Chilena'` | |
| `region` | `text` | Sí | — | Texto libre; no es FK |
| `commune` | `text` | Sí | — | Texto libre; no es FK |
| `address` | `text` | Sí | — | Dato personal |
| `status` | `text` | Sí | `'active'` | Sin CHECK en la base real |
| `second_name` | `text` | Sí | — | |
| `second_last_name` | `text` | Sí | — | |
| `street` | `text` | Sí | — | Dato personal |
| `street_number` | `text` | Sí | — | Dato personal |
| `dept_or_unit` | `text` | Sí | — | Dato personal |
| `region_id` | `integer` | Sí | — | **Sin FK verificada** |
| `commune_id` | `integer` | Sí | — | **Sin FK verificada** |
| `deleted_at` | `timestamptz` | Sí | — | Borrado lógico |

El `CHECK` real de `role` es:

```sql
CHECK (role = ANY (ARRAY['superadmin'::text, 'admin'::text, 'user'::text]))
```

### 2.2 `public.regions`

16 filas.

| Columna | Tipo | Nulo | Nota |
|---|---|---|---|
| `id` | `integer` | No | PK, serial |
| `name` | `text` | No | UNIQUE |
| `code` | `text` | No | UNIQUE |
| `roman_numeral` | `text` | Sí | |

### 2.3 `public.communes`

104 filas.

| Columna | Tipo | Nulo | Nota |
|---|---|---|---|
| `id` | `integer` | No | PK, serial |
| `region_id` | `integer` | No | FK a `regions.id` `ON DELETE CASCADE` |
| `name` | `text` | No | |
| `code` | `text` | Sí | UNIQUE |

### 2.4 Relaciones reales

- `profiles.id` → `auth.users.id` (`ON DELETE CASCADE`).
- `communes.region_id` → `regions.id` (`ON DELETE CASCADE`).
- `profiles.region_id` y `profiles.commune_id` **no tienen FK** en el catálogo actual, aunque `init.sql` las declara. Son referencias lógicas.
- No hay tablas de condominio, unidades, gastos ni membresías.

### 2.5 RLS actual

Tablas implementadas con RLS:

- `profiles`: usuario propio o superadmin; admins leen perfiles de su empresa.
- `management_companies`: superadmin o miembro activo de la empresa.
- `management_company_members`: superadmin administra; miembros activos leen miembros de su empresa.
- `condominiums`: superadmin o miembro activo de la empresa; CRUD limitado a la empresa.
- `regions` y `communes`: lectura pública.


- `regions` y `communes`: lectura pública.
- `profiles`: `anon` sin acceso; usuario autenticado lee/actualiza su propio perfil; `superadmin` lee/actualiza todos; trigger bloquea cambios de rol, estado y campos de control. Ver [security.md](security.md) y la migración `20261103_000001_profiles_security.sql`.

---

## 3. Modelo de condominio propuesto

> Parcialmente implementado: empresas administradoras, membresías, condominios y unidades. Comunidades, edificios, unidades de condominio y gastos siguen siendo propuestos.

### 3.1 Entidades

| Entidad | Campos mínimos | Propósito |
|---|---|---|
| `communities` | `id`, `name`, `address`, `commune_id`, `created_at`, `deleted_at` | Condominio o comunidad |
| `buildings` | `id`, `community_id`, `name`, `address`, `floors`, `units_count` | Torre/edificio |
| `units` | `id`, `building_id`, `unit_number`, `floor`, `unit_type`, `status` | Unidad/departamento |
| `community_members` | `community_id`, `user_id`, `role`, `status`, `created_at` | Membresía y rol por comunidad |
| `expenses_period` | `id`, `community_id`, `period`, `status`, `total_amount`, `created_by` | Periodo de gastos |
| `unit_expenses` | `id`, `period_id`, `unit_id`, `amount`, `status`, `due_date` | Gasto imputado a una unidad |

Roles de comunidad propuestos: `community_admin`, `resident`, `viewer`. No reemplazan los roles globales `user`, `admin`, `superadmin`; se combinan.

### 3.2 Reglas de negocio

- Un usuario solo ve las comunidades donde tiene membresía activa.
- Un `community_admin` administra su comunidad, no las demás.
- Un `admin` global puede ver todas las comunidades, pero no necesariamente editar datos financieros cerrados.
- Un `superadmin` puede administrar todo, con auditoría.
- Un periodo `published` no se edita; se corrige con un nuevo periodo o un ajuste auditado.
- Un `unit_expense` pertenece a un periodo y a una unidad; no se puede duplicar la misma unidad en el mismo periodo.
- El borrado es lógico (`deleted_at`) y las consultas excluyen filas borradas.

### 3.3 RLS propuesto

```sql
-- Funciones de apoyo (propuestas)
CREATE OR REPLACE FUNCTION public.is_community_member(target_community uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members m
    WHERE m.community_id = target_community
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_community_admin(target_community uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members m
    WHERE m.community_id = target_community
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.role = 'community_admin'
  );
$$;
```

Cada tabla debe tener RLS habilitado y políticas explícitas de `SELECT`, `INSERT`, `UPDATE` y `DELETE`. No usar `USING (true)` para datos de condominio. Las tablas hijas (`buildings`, `units`, `expenses_period`, `unit_expenses`) deben validar la comunidad a través de su padre.

### 3.4 Orden de migración propuesto

1. Crear `communities`, `buildings`, `units`, `community_members`.
2. Añadir RLS y funciones de membresía.
3. Crear `expenses_period`, `unit_expenses`.
4. Añadir RLS y reglas de transición de estado.
5. Crear seeds de regiones/comunas desde una fuente versionada.
6. Añadir pruebas pgTAP de aislamiento entre comunidades.
7. Recién entonces implementar el frontend del módulo.

---

## 4. Deriva entre `init.sql` y la base real

| Elemento | `supabase/init.sql` | Base real |
|---|---|---|
| `profiles` | 19 columnas | 26 columnas |
| `role` | CHECK `admin`, `user` | CHECK `superadmin`, `admin`, `user` |
| `is_admin()` | Solo `role = 'admin'` | Incluye `admin` y `superadmin` |
| `profiles.region_id` / `commune_id` | FK a `regions`/`communes` | Sin FK |
| `regions` | `created_at`, sin `code` | `code` UNIQUE NOT NULL, sin `created_at` |
| `communes` | `created_at`, sin `code` | `code` UNIQUE nullable, sin `created_at` |
| `profiles` campos | `dept_unit` | `dept_or_unit` + `address` |
| `profiles.rut` | UNIQUE | Sin UNIQUE |
| `profiles.status` | CHECK `active`/`suspended` | Sin CHECK |
| `nationality` | No existe | Default `'Chilena'` |
| `deleted_at` | No existe | Existe |
| Storage | Bucket público, políticas por bucket | Mismas políticas inseguras |

**Conclusión:** `init.sql` no es una fuente reproducible. No usarlo para reconstruir la base. Crear migraciones versionadas y comparar contra el catálogo real antes de aplicar.

---

## 5. Clasificación de datos

| Dato | Clasificación | Control mínimo |
|---|---|---|
| `email`, `rut`, `phone`, `address`, `birth_date` | Personal | RLS por usuario/admin; no exponer a `anon` |
| `gender`, `nationality` | Sensible | RLS; minimizar recolección |
| `role`, `status` | Autorización | Solo admin/superadmin; auditoría |
| `avatar_url` | Personal | Bucket privado o URL firmada |
| `regions`, `communes` | Público | Lectura pública aceptable |
| Datos de gastos/unidades | Financiero | RLS por comunidad; retención definida |

---

## 6. Enlaces

- [security.md](security.md)
- [architecture.md](architecture.md)
- [frontend.md](frontend.md)
- [roadmap.md](roadmap.md)
- [Auditoría profunda](../auditoria_profunda_condominio_2026-11-03.md)
