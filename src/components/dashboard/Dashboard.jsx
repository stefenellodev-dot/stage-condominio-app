import React from 'react';
import ProfileSection from './ProfileSection';
import AdminTable from './AdminTable';
import { styles } from '../../styles/theme';

export default function Dashboard({ session, profile, onProfileUpdated, onLogout, onError, onMessage }) {
  const isAdmin = profile?.role === 'admin';

  return (
    <div style={styles.container}>
      <div style={isAdmin ? styles.cardWide : styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h2 style={{ color: '#22c55e', margin: '0 0 4px' }}>
              {isAdmin ? 'Panel de Administración (CRUD)' : 'Panel de Usuario'}
            </h2>
            <span style={isAdmin ? styles.badgeAdmin : styles.badgeUser}>
              ROL: {profile?.role?.toUpperCase() || 'CARGANDO...'}
            </span>
          </div>
          <button onClick={onLogout} style={styles.buttonLogout}>Cerrar Sesión</button>
        </div>

        <ProfileSection
          session={session}
          profile={profile}
          onProfileUpdated={onProfileUpdated}
          onError={onError}
          onMessage={onMessage}
        />

        {isAdmin ? (
          <AdminTable
            currentUserId={session.user.id}
            onError={onError}
            onMessage={onMessage}
          />
        ) : (
          <div style={{ marginTop: '16px', color: '#94a3b8', fontSize: '13px' }}>
            ℹ️ Como usuario regular, las políticas RLS te permiten actualizar tus datos pero no modificar usuarios ajenos.
          </div>
        )}
      </div>
    </div>
  );
}
