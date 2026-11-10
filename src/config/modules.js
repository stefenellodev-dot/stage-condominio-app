import { lazy } from 'react';

import { ROLES } from '../constants/roles';

export const businessModules = [
  {
    id: 'management_companies',
    labelKey: 'nav.management_companies',
    icon: '🏢',
    component: lazy(() => import('../components/business/ManagementCompaniesModule')),
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
  },
  {
    id: 'condominiums',
    labelKey: 'nav.condominiums',
    icon: '🏗️',
    component: lazy(() => import('../components/business/CondominiumsModule')),
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
  },
  {
    id: 'units',
    labelKey: 'nav.units',
    icon: '🚪',
    component: lazy(() => import('../components/business/UnitsModule')),
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.USER],
  },
  {
    id: 'common_areas',
    labelKey: 'nav.common_areas',
    icon: '🏊',
    component: lazy(() => import('../components/business/CommonAreasModule')),
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.USER, ROLES.CONCIERGE],
  },
  {
    id: 'concierge',
    labelKey: 'nav.concierge',
    icon: '🧑‍💼',
    component: lazy(() => import('../components/business/ConciergeModule')),
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CONCIERGE],
  },
  {
    id: 'maintenance',
    labelKey: 'nav.maintenance',
    icon: '🔧',
    component: lazy(() => import('../components/business/MaintenanceModule')),
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CONCIERGE, ROLES.USER],
  },
  {
    id: 'assemblies',
    labelKey: 'nav.assemblies',
    icon: '🗳️',
    component: lazy(() => import('../components/business/AssembliesModule')),
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.USER],
  },
  {
    id: 'expenses',
    labelKey: 'nav.expenses',
    icon: '💰',
    component: lazy(() => import('../components/business/ExpensesModule')),
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.USER],
  },
  {
    id: 'security_staff',
    labelKey: 'nav.security_staff',
    icon: '🛡️',
    component: lazy(() => import('../components/security/SecurityStaffModule')),
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CONCIERGE],
  },
  {
    id: 'legal_collection',
    labelKey: 'nav.legal_collection',
    icon: '⚖️',
    component: lazy(() => import('../components/legal/LegalCollectionModule')),
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
  },
  {
    id: 'announcements',
    labelKey: 'nav.announcements',
    icon: '📢',
    component: lazy(() => import('../components/business/AnnouncementsModule')),
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CONCIERGE, ROLES.USER],
  },
  {
    id: 'users',
    labelKey: 'nav.users_management',
    icon: '👥',
    component: lazy(() => import('../components/business/UsersModule')),
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
  },
];
