import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { SuperAdminManagementCompaniesView } from './SuperAdminManagementCompaniesView';
import AdminManagementCompaniesView from './AdminManagementCompaniesView';

export default function ManagementCompaniesModule() {
  const { profile } = useAuth();
  if (profile?.role === 'superadmin') {
    return <SuperAdminManagementCompaniesView />;
  }
  return <AdminManagementCompaniesView />;
}
