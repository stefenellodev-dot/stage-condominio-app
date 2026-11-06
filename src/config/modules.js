import { lazy } from 'react';

export const businessModules = [
  {
    id: 'management_companies',
    labelKey: 'nav.management_companies',
    icon: '🏢',
    component: lazy(() => import('../components/business/ManagementCompaniesModule')),
    roles: ['superadmin', 'admin'],
  },
  {
    id: 'condominiums',
    labelKey: 'nav.condominiums',
    icon: '🏗️',
    component: lazy(() => import('../components/business/CondominiumsModule')),
    roles: ['superadmin', 'admin'],
  },
  {
    id: 'units',
    labelKey: 'nav.units',
    icon: '🚪',
    component: lazy(() => import('../components/business/UnitsModule')),
    roles: ['superadmin', 'admin', 'user'],
  },
  {
    id: 'common_areas',
    labelKey: 'nav.common_areas',
    icon: '🏊',
    component: lazy(() => import('../components/business/CommonAreasModule')),
    roles: ['superadmin', 'admin', 'user'],
  },
  {
    id: 'maintenance',
    labelKey: 'nav.maintenance',
    icon: '🔧',
    component: lazy(() => import('../components/business/MaintenanceModule')),
    roles: ['superadmin', 'admin'],
  },
  {
    id: 'assemblies',
    labelKey: 'nav.assemblies',
    icon: '🗳️',
    component: lazy(() => import('../components/business/AssembliesModule')),
    roles: ['superadmin', 'admin', 'user'],
  },
  {
    id: 'expenses',
    labelKey: 'nav.expenses',
    icon: '💰',
    component: lazy(() => import('../components/business/ExpensesModule')),
    roles: ['superadmin', 'admin', 'user'],
  },
  {
    id: 'users',
    labelKey: 'nav.users_management',
    icon: '👥',
    component: lazy(() => import('../components/business/UsersModule')),
    roles: ['superadmin', 'admin'],
  },
];
