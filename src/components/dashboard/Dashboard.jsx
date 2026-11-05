import React, { useState } from 'react';
import AppLayout from '../layout/AppLayout';
import ProfileSection from './ProfileSection';
import { businessModules } from '../../config/modules';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { isSuperadmin } = useAuth();
  const defaultModule = businessModules.find((m) => m.default) || businessModules[0];
  const [activeTab, setActiveTab] = useState(defaultModule?.id || 'home');

  const currentBusinessModule = businessModules.find((m) => m.id === activeTab);
  const BusinessComponent = currentBusinessModule?.component;

  return (
    <AppLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      {BusinessComponent && <BusinessComponent />}
      {activeTab === 'profile' && <ProfileSection />}
    </AppLayout>
  );
}
