import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ResidentMaintenanceView } from './ResidentMaintenanceView';
import { ConciergeMaintenanceView } from './ConciergeMaintenanceView';
import { AdminMaintenanceView } from './AdminMaintenanceView';

export default function MaintenanceModule() {
  const { profile } = useAuth();
  if (profile?.role === 'superadmin' || profile?.role === 'admin') {
    return <AdminMaintenanceView condominiumId={profile?.condominium_id} />;
  }
  if (profile?.role === 'concierge') {
    return <ConciergeMaintenanceView condominiumId={profile?.condominium_id} />;
  }
  return <ResidentMaintenanceView />;
}
