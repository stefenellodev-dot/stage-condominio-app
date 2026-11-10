import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ResidentCommonAreasView } from './ResidentCommonAreasView';
import { ConciergeCommonAreasView } from './ConciergeCommonAreasView';
import { AdminCommonAreasView } from './AdminCommonAreasView';

export default function CommonAreasModule() {
  const { profile } = useAuth();
  if (profile?.role === 'superadmin' || profile?.role === 'admin') {
    return <AdminCommonAreasView condominiumId={profile?.condominium_id} />;
  }
  if (profile?.role === 'concierge') {
    return <ConciergeCommonAreasView condominiumId={profile?.condominium_id} />;
  }
  return <ResidentCommonAreasView />;
}
