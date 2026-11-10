import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ResidentAssembliesView } from './ResidentAssembliesView';
import { AdminAssembliesView } from './AdminAssembliesView';

export default function AssembliesModule() {
  const { profile } = useAuth();
  if (profile?.role === 'superadmin' || profile?.role === 'admin') {
    return <AdminAssembliesView condominiumId={profile?.condominium_id} />;
  }
  return <ResidentAssembliesView />;
}
