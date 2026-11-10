import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import AdminExpensesView from './AdminExpensesView';
import { ResidentExpensesView } from './ResidentExpensesView';

export default function ExpensesModule() {
  const { profile } = useAuth();
  if (profile?.role === 'superadmin' || profile?.role === 'admin') {
    return <AdminExpensesView condominiumId={profile?.condominium_id} adminId={profile?.id} />;
  }
  return <ResidentExpensesView />;
}
