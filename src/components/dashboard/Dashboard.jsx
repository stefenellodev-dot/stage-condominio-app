import React, { useState, Suspense } from 'react';
import AppLayout from '../layout/AppLayout';
import ProfileSection from './ProfileSection';
import { businessModules } from '../../config/modules';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { isSuperadmin } = useAuth();
  const defaultModule = businessModules[0];
  const [activeTab, setActiveTab] = useState(defaultModule?.id || 'home');

  const currentBusinessModule = businessModules.find((m) => m.id === activeTab);
  const BusinessComponent = currentBusinessModule?.component;

  return (
    <AppLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      <Suspense fallback={<div style={{ padding: 24, color: 'var(--text-dim, #9aa0a6)' }}>Cargando módulo…</div>}>
        {BusinessComponent && <BusinessComponent />}
      </Suspense>
      {activeTab === 'profile' && <ProfileSection />}
    </AppLayout>
  );
}
