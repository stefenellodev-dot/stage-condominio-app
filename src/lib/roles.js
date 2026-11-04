export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  USER: 'user',
};

export const ROLE_HIERARCHY = {
  [ROLES.SUPERADMIN]: 3,
  [ROLES.ADMIN]: 2,
  [ROLES.USER]: 1,
};

/**
 * Valida si el rol actual alcanza el nivel requerido
 */
export const hasMinimumRole = (userRole, requiredRole) => {
  const currentLevel = ROLE_HIERARCHY[userRole] || 0;
  const targetLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return currentLevel >= targetLevel;
};

/**
 * Valida acceso a módulos respetando la herencia de Superadmin
 */
export const canAccessModule = (userRole, allowedRoles = []) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (userRole === ROLES.SUPERADMIN) return true;
  if (allowedRoles.includes(userRole)) return true;
  if (allowedRoles.includes(ROLES.USER)) return true;
  if (allowedRoles.includes(ROLES.ADMIN) && userRole === ROLES.SUPERADMIN) return true;
  return false;
};
