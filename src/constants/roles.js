// Roles definidos en la base de datos (tabla profiles.role)
// Estos valores deben coincidir exactamente con los almacenados en la DB.
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  USER: 'user',
  CONCIERGE: 'concierge',
};

// Grupos de roles para RBAC
export const ROLE_GROUPS = {
  ADMIN_ROLES: [ROLES.SUPERADMIN, ROLES.ADMIN],
  MANAGEMENT_ROLES: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CONCIERGE],
  ALL_ROLES: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.USER, ROLES.CONCIERGE],
};
