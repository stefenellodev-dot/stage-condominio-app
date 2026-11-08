import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../constants/permissions';

export function usePermissions(module) {
  const { profile } = useAuth();
  const role = profile?.role;

  return {
    can: (action) => hasPermission(module, action, role),
    canCreate: hasPermission(module, 'create', role),
    canEdit: hasPermission(module, 'edit', role),
    canDelete: hasPermission(module, 'delete', role),
    canView: hasPermission(module, 'view', role),
    canManage: hasPermission(module, 'create', role) || hasPermission(module, 'edit', role),
  };
}
