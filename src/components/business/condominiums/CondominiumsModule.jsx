import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { SuperAdminCondominiumsView } from './SuperAdminCondominiumsView';
import AdminCondominiumsView from './AdminCondominiumsView';

export default function CondominiumsModule() {
  const { profile } = useAuth();
  if (profile?.role === 'superadmin') {
    return <SuperAdminCondominiumsView />;
  }
  return <AdminCondominiumsView />;
}
