import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ResidentAnnouncementsView } from './ResidentAnnouncementsView';
import { ConciergeAnnouncementsView } from './ConciergeAnnouncementsView';
import { AdminAnnouncementsView } from './AdminAnnouncementsView';

export default function AnnouncementsModule() {
  const { profile } = useAuth();
  if (profile?.role === 'superadmin' || profile?.role === 'admin') {
    return <AdminAnnouncementsView condominiumId={profile?.condominium_id} />;
  }
  if (profile?.role === 'concierge') {
    return <ConciergeAnnouncementsView condominiumId={profile?.condominium_id} />;
  }
  return <ResidentAnnouncementsView />;
}
