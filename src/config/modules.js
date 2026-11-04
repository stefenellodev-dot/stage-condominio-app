import ManagementCompaniesModule from '../components/business/ManagementCompaniesModule';

export const businessModules = [
  {
    id: 'management_companies',
    labelKey: 'nav.management_companies',
    icon: '🏢',
    component: ManagementCompaniesModule,
    roles: ['superadmin'],
  },
];
