import InventoryModule from '../components/business/InventoryModule';

export const businessModules = [
  // ... módulos existentes ...
  {
    id: 'inventory',
    label: 'Inventario',
    icon: '📦',
    component: InventoryModule,
    roles: ['admin', 'operator'], // Control RBAC automático
  },
];
