import ManagementCompaniesModule from '../components/business/ManagementCompaniesModule';
import CondominiumsModule from '../components/business/CondominiumsModule';
import UnitsModule from '../components/business/UnitsModule';
import CommonAreasModule from '../components/business/CommonAreasModule';

export const businessModules = [
  {
    id: 'management_companies',
    labelKey: 'nav.management_companies',
    icon: '🏢',
    component: ManagementCompaniesModule,
    roles: ['superadmin', 'admin'],
  },
  {
    id: 'condominiums',
    labelKey: 'nav.condominiums',
    icon: '🏗️',
    component: CondominiumsModule,
    roles: ['superadmin', 'admin'],
  },
  {
    id: 'units',
    labelKey: 'nav.units',
    icon: '🚪',
    component: UnitsModule,
    roles: ['superadmin', 'admin', 'user'],
  },
  {
    id: 'common_areas',
    labelKey: 'nav.common_areas',
    icon: '🏊',
    component: CommonAreasModule,
    roles: ['superadmin', 'admin', 'user'],
  },
];
