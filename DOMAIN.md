# Modelo de dominio — Condominio

> **Estado real verificado:** 2026-11-03. El detalle completo está en **[docs/domain.md](docs/domain.md)**.

---

## 1. Implementado

| Entidad | Estado | Nota |
|---|---|---|
| `public.profiles` | Verificado | 26 columnas; rol `user`/`admin`/`superadmin` |
| `public.regions` | Verificado | 16 filas; `code`, `name`, `roman_numeral` |
| `public.communes` | Verificado | 104 filas; FK a `regions` |
| `communities` | **No existe** | Propuesto |
| `buildings` | **No existe** | Propuesto |
| `units` | **No existe** | Propuesto |
| `expenses_period` | **No existe** | Propuesto |
| `unit_expenses` | **No existe** | Propuesto |

`supabase/init.sql` no refleja la base real: tiene menos columnas, otro CHECK de roles, FKs que no existen y nombres distintos. No usarlo para reconstruir la base. Ver la tabla de deriva en [docs/domain.md](docs/domain.md).

---

## 2. Modelo propuesto

El dominio objetivo incluye:

- `communities`: condominio, RUT tributario, dirección, comuna/región.
- `buildings`: torres/bloques dentro de una comunidad.
- `units`: departamentos, casas, bodegas y estacionamientos; prorrateo (`aliquot`).
- `community_members`: membresía y rol por comunidad (`community_admin`, `resident`, `viewer`).
- `expenses_period`: periodo mensual de gastos comunes (`draft`, `issued`, `closed`).
- `unit_expenses`: monto por unidad, pagos y estado (`pending`, `partial`, `paid`, `overdue`).

El modelo propuesto, las reglas de negocio y el orden de migración están en [docs/domain.md](docs/domain.md).

---

## 3. Regla de autorización

- Los roles globales son `user`, `admin`, `superadmin`.
- Los roles por comunidad son un concepto **propuesto**, no implementado.
- Toda tabla de condominio debe tener RLS por membresía; no alcanza con ocultar el módulo en la UI.
- El estado actual de RLS y sus fallas están en [docs/security.md](docs/security.md).
