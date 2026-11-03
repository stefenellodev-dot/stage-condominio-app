import React, { useState } from 'react';
import AppLayout from '../layout/AppLayout';
import ProfileSection from './ProfileSection';
import AdminTable from './AdminTable';
import { businessModules } from '../../config/modules';

export default function Dashboard() {
  const defaultModule = businessModules.find((m) => m.default) || businessModules[0];
  const [activeTab, setActiveTab] = useState(defaultModule?.id || 'home');

  const currentBusinessModule = businessModules.find((m) => m.id === activeTab);
  const BusinessComponent = currentBusinessModule?.component;

  return (
    <AppLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      {BusinessComponent && <BusinessComponent />}
      {activeTab === 'profile' && <ProfileSection />}
      {activeTab === 'admin_users' && <AdminTable />}
    </AppLayout>
  );
}
