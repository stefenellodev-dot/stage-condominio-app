import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ConciergeDashboard } from '../components/dashboard/ConciergeDashboard';
import { ResidentDashboard } from '../components/dashboard/ResidentDashboard';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { SuperAdminDashboard } from '../components/dashboard/SuperAdminDashboard';

export function Home({ onNavigate }) {
  const { profile } = useAuth();
  const [simulatedRole, setSimulatedRole] = useState(null);
  const activeRole = simulatedRole || profile?.role || 'user';
  const condoId = profile?.condominium_id;

  return (
    <div>
      {profile?.role === 'superadmin' && (
        <div style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid #cbd5e1', padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>🛠️ Vista activa de rol: <strong>{activeRole.toUpperCase()}</strong></span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['superadmin', 'admin', 'concierge', 'user'].map((r) => (
              <button key={r} onClick={() => setSimulatedRole(r === profile.role ? null : r)} style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #94a3b8', backgroundColor: activeRole === r ? 'var(--bg-surface)' : 'var(--bg-card)', color: activeRole === r ? 'var(--text-main)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
      {activeRole === 'superadmin' ? <SuperAdminDashboard onNavigate={onNavigate} /> :
       activeRole === 'admin' ? <AdminDashboard condominiumId={condoId} onNavigate={onNavigate} /> :
       activeRole === 'concierge' ? <ConciergeDashboard condominiumId={condoId} onNavigate={onNavigate} /> :
       <ResidentDashboard onNavigate={onNavigate} />}
    </div>
  );
}
