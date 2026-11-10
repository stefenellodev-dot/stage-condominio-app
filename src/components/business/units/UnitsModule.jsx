import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ResidentUnitsView } from './ResidentUnitsView';
import { ConciergeUnitsView } from './ConciergeUnitsView';
import { AdminUnitsView } from './AdminUnitsView';

export default function UnitsModule() {
  const { profile } = useAuth();
  if (profile?.role === 'superadmin' || profile?.role === 'admin') {
    return <AdminUnitsView condominiumId={profile?.condominium_id} />;
  }
  if (profile?.role === 'concierge') {
    return <ConciergeUnitsView condominiumId={profile?.condominium_id} />;
  }
  return <ResidentUnitsView />;
}
