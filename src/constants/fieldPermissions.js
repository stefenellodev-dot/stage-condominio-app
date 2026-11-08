// ============================================================================
// Matriz de Permisos de Campos (Field-Level RBAC)
// ============================================================================
// Define qué campos son visibles para cada rol por módulo/tabla.
// Campos no listados en 'sensitive' son visibles para todos los roles.
// ============================================================================

import { ROLES } from './roles';

const { SUPERADMIN, ADMIN, CONCIERGE, USER } = ROLES;

// Campos sensibles por tabla/módulo y los roles que pueden verlos
export const SENSITIVE_FIELDS = {
  units: {
    // Concierge no puede ver alícuota
    aliquot: [SUPERADMIN, ADMIN, USER],
    owner_id: [SUPERADMIN, ADMIN],
    deleted_at: [SUPERADMIN, ADMIN],
  },
  profiles: {
    // Solo admin/superadmin ven datos sensibles de otros usuarios
    rut: [SUPERADMIN, ADMIN],
    phone: [SUPERADMIN, ADMIN],
    emergency_phone: [SUPERADMIN, ADMIN],
    address: [SUPERADMIN, ADMIN],
    street: [SUPERADMIN, ADMIN],
    street_number: [SUPERADMIN, ADMIN],
    birth_date: [SUPERADMIN, ADMIN],
    gender: [SUPERADMIN, ADMIN],
    nationality: [SUPERADMIN, ADMIN],
    region: [SUPERADMIN, ADMIN],
    commune: [SUPERADMIN, ADMIN],
    deleted_at: [SUPERADMIN, ADMIN],
  },
  condominiums: {
    // Solo admin/superadmin ven datos bancarios
    bank_name: [SUPERADMIN, ADMIN],
    account_type: [SUPERADMIN, ADMIN],
    account_number: [SUPERADMIN, ADMIN],
    bank_recipient_rut: [SUPERADMIN, ADMIN],
    rut: [SUPERADMIN, ADMIN],
    deleted_at: [SUPERADMIN, ADMIN],
  },
  expenses: {
    // User solo ve montos totales, no detalles de proveedores
    supplier_rut: [SUPERADMIN, ADMIN],
    supplier_name: [SUPERADMIN, ADMIN],
    invoice_number: [SUPERADMIN, ADMIN],
  },
  common_areas: {
    // Todos pueden ver, pero solo admin gestiona
    deleted_at: [SUPERADMIN, ADMIN],
  },
  assemblies: {
    // Todos pueden ver actas
    minutes_text: [SUPERADMIN, ADMIN, USER, CONCIERGE],
  },
};

// Función para filtrar campos sensibles de un objeto basado en el rol
export function filterSensitiveFields(data, module, role) {
  if (!data || !role) return data;
  const sensitiveFields = SENSITIVE_FIELDS[module];
  if (!sensitiveFields) return data;

  if (Array.isArray(data)) {
    return data.map(item => filterSingleObject(item, sensitiveFields, role));
  }
  return filterSingleObject(data, sensitiveFields, role);
}

function filterSingleObject(obj, sensitiveFields, role) {
  if (!obj || typeof obj !== 'object') return obj;
  const filtered = { ...obj };
  for (const [field, allowedRoles] of Object.entries(sensitiveFields)) {
    if (!allowedRoles.includes(role)) {
      delete filtered[field];
    }
  }
  return filtered;
}

// Función para verificar si un campo es visible para un rol
export function isFieldVisible(module, field, role) {
  const sensitiveFields = SENSITIVE_FIELDS[module];
  if (!sensitiveFields || !sensitiveFields[field]) return true;
  return sensitiveFields[field].includes(role);
}
