import React, { useState, Suspense } from 'react';
import AppLayout from '../layout/AppLayout';
import ProfileSection from './ProfileSection';
import HomeModule from '../home/HomeModule';
import { businessModules } from '../../config/modules';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { isSuperadmin } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [homeKey, setHomeKey] = useState(0);

  const currentBusinessModule = businessModules.find((m) => m.id === activeTab);
  const BusinessComponent = currentBusinessModule?.component;

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'home') setHomeKey(k => k + 1);
  };

  return (
    <AppLayout activeTab={activeTab} onSelectTab={handleSelectTab}>
      <Suspense fallback={<div style={{ padding: 24, color: 'var(--text-dim, #9aa0a6)' }}>Cargando módulo…</div>}>
        {activeTab === 'home' && <HomeModule key={homeKey} />}
        {BusinessComponent && activeTab !== 'home' && <BusinessComponent />}
      </Suspense>
      {activeTab === 'profile' && <ProfileSection />}
    </AppLayout>
  );
}