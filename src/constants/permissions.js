// ============================================================================
// Matriz de Permisos RBAC por Módulo
// ============================================================================
// Estructura: PERMISSIONS[modulo][accion] = [roles permitidos]
// Los roles son: superadmin, admin, concierge, user
// ============================================================================

import { ROLES } from './roles';

const { SUPERADMIN, ADMIN, CONCIERGE, USER } = ROLES;

export const PERMISSIONS = {
  management_companies: {
    create: [SUPERADMIN],
    edit: [SUPERADMIN],
    delete: [SUPERADMIN],
    view: [SUPERADMIN, ADMIN],
    manage_members: [SUPERADMIN],
  },
  banks: {
    create: [SUPERADMIN],
    edit: [SUPERADMIN],
    delete: [SUPERADMIN],
    view: [SUPERADMIN],
    toggle: [SUPERADMIN],
  },
  condominiums: {
    create: [SUPERADMIN],
    edit: [SUPERADMIN, ADMIN],
    delete: [SUPERADMIN],
    view: [SUPERADMIN, ADMIN, USER, CONCIERGE],
    configure_bank: [SUPERADMIN, ADMIN],
  },
  units: {
    create: [SUPERADMIN, ADMIN],
    edit: [SUPERADMIN, ADMIN],
    delete: [SUPERADMIN, ADMIN],
    view: [SUPERADMIN, ADMIN, USER, CONCIERGE],
    manage_occupancy: [SUPERADMIN, ADMIN, USER],
  },
  common_areas: {
    create: [SUPERADMIN, ADMIN],
    edit: [SUPERADMIN, ADMIN],
    delete: [SUPERADMIN, ADMIN],
    view: [SUPERADMIN, ADMIN, USER, CONCIERGE],
    set_maintenance: [SUPERADMIN, ADMIN, CONCIERGE],
    create_booking: [SUPERADMIN, ADMIN, CONCIERGE, USER],
    approve_booking: [SUPERADMIN, ADMIN, CONCIERGE],
    cancel_booking: [SUPERADMIN, ADMIN, CONCIERGE, USER],
    manage_guarantee: [SUPERADMIN, ADMIN],
  },
  concierge: {
    create_visit: [SUPERADMIN, ADMIN, CONCIERGE],
    create_parcel: [SUPERADMIN, ADMIN, CONCIERGE],
    create_log: [SUPERADMIN, ADMIN, CONCIERGE],
    view_visits: [SUPERADMIN, ADMIN, CONCIERGE, USER],
    view_parcels: [SUPERADMIN, ADMIN, CONCIERGE, USER],
    view_logbook: [SUPERADMIN, ADMIN, CONCIERGE],
    authorize_visit: [SUPERADMIN, ADMIN, CONCIERGE, USER],
  },
  maintenance: {
    create_asset: [SUPERADMIN, ADMIN],
    create_cert: [SUPERADMIN, ADMIN],
    create_log: [SUPERADMIN, ADMIN],
    view_assets: [SUPERADMIN, ADMIN, CONCIERGE, USER],
    view_certs: [SUPERADMIN, ADMIN, CONCIERGE, USER],
    view_logs: [SUPERADMIN, ADMIN, CONCIERGE, USER],
  },
  assemblies: {
    create: [SUPERADMIN, ADMIN],
    edit: [SUPERADMIN, ADMIN],
    view: [SUPERADMIN, ADMIN, USER, CONCIERGE],
    checkin: [SUPERADMIN, ADMIN, CONCIERGE],
    vote: [SUPERADMIN, ADMIN, USER],
    close: [SUPERADMIN, ADMIN],
  },
  expenses: {
    create_period: [SUPERADMIN, ADMIN],
    create_expense: [SUPERADMIN, ADMIN],
    view_expenses: [SUPERADMIN, ADMIN, USER],
    view_bills: [SUPERADMIN, ADMIN, USER],
    register_payment: [SUPERADMIN, ADMIN, USER],
    reconcile: [SUPERADMIN, ADMIN],
    suspend_services: [SUPERADMIN, ADMIN],
  },
  security_staff: {
    create: [SUPERADMIN, ADMIN],
    edit: [SUPERADMIN, ADMIN],
    delete: [SUPERADMIN, ADMIN],
    view: [SUPERADMIN, ADMIN, CONCIERGE, USER],
  },
  legal_collection: {
    issue_cutoff: [SUPERADMIN, ADMIN],
    generate_jpl_certificate: [SUPERADMIN, ADMIN],
    view_accountability: [SUPERADMIN, ADMIN],
    view: [SUPERADMIN, ADMIN],
  },
  announcements: {
    create_announcement: [SUPERADMIN, ADMIN],
    broadcast_emergency: [SUPERADMIN, ADMIN, CONCIERGE],
    view_announcements: [SUPERADMIN, ADMIN, CONCIERGE, USER],
    view_emergency_plan: [SUPERADMIN, ADMIN, CONCIERGE, USER],
    acknowledge: [USER],
  },
  users: {
    create: [SUPERADMIN, ADMIN],
    edit: [SUPERADMIN, ADMIN],
    delete: [SUPERADMIN, ADMIN],
    view: [SUPERADMIN, ADMIN],
    change_role: [SUPERADMIN],
  },
};

// Helper: check if a role has permission for an action in a module
export function hasPermission(module, action, role) {
  const modulePerms = PERMISSIONS[module];
  if (!modulePerms) return false;
  const allowedRoles = modulePerms[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}
