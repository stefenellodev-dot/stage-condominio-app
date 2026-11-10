import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import ConciergeDeskView from './ConciergeDeskView';
import { ResidentConciergeView } from './ResidentConciergeView';

export default function ConciergeModule() {
  const { profile } = useAuth();
  if (profile?.role === 'user') {
    return <ResidentConciergeView />;
  }
  return <ConciergeDeskView condominiumId={profile?.condominium_id} />;
}
