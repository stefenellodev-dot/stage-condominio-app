MODELO DE DOMINIO: GESTIÓN CONDOMINIO

Este documento detalla las entidades principales requeridas para la gestión del sistema de condominios.

1. Entidades Principales

communities (Comunidades / Condominios)

Representa a cada conjunto residencial o condominio independiente.

id: UUID (PK, gen_random_uuid())

name: VARCHAR(150) (Ej: "Condominio Los Alerces")

rut: VARCHAR(20) (RUT tributario de la comunidad chilena)

address: VARCHAR(200)

commune_id: INT (FK -> public.communes(id))

region_id: INT (FK -> public.regions(id))

created_at: TIMESTAMPTZ

buildings (Torres / Bloques)

Subdivisiones físicas de una comunidad.

id: UUID (PK, gen_random_uuid())

community_id: UUID (FK -> public.communities(id) ON DELETE CASCADE)

name: VARCHAR(50) (Ej: "Torre A", "Edificio Poniente")

created_at: TIMESTAMPTZ

units (Unidades: Departamentos, Casas, Bodegas, Estacionamientos)

Inmuebles individuales pertenecientes a un edificio o comunidad.

id: UUID (PK, gen_random_uuid())

building_id: UUID (FK -> public.buildings(id) ON DELETE CASCADE)

unit_number: VARCHAR(20) (Ej: "1004", "Casa 12")

type: VARCHAR(20) CHECK (department, parking, storage, house)

aliquot: NUMERIC(6,4) (Porcentaje de prorrateo para gastos comunes, ej: 0.0125 = 1.25%)

owner_id: UUID (FK -> public.profiles(id) ON DELETE SET NULL)

created_at: TIMESTAMPTZ

expenses_period (Períodos de Gastos Comunes)

Control mensual de facturación del condominio.

id: UUID (PK, gen_random_uuid())

community_id: UUID (FK -> public.communities(id) ON DELETE CASCADE)

period_month: INT (1-12)

period_year: INT (Ej: 2026)

total_amount: NUMERIC(12,2)

status: VARCHAR(20) DEFAULT 'draft' CHECK (draft, issued, closed)

created_at: TIMESTAMPTZ

unit_expenses (Cuentas individuales por unidad)

Detalle del cobro asignado a cada copropietario en un período específico.

id: UUID (PK, gen_random_uuid())

period_id: UUID (FK -> public.expenses_period(id) ON DELETE CASCADE)

unit_id: UUID (FK -> public.units(id) ON DELETE CASCADE)

amount_to_pay: NUMERIC(12,2)

paid_amount: NUMERIC(12,2) DEFAULT 0

status: VARCHAR(20) DEFAULT 'pending' CHECK (pending, partial, paid, overdue)

created_at: TIMESTAMPTZ
