import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';

export default function ProfileSection({ session, profile, onProfileUpdated, onError, onMessage }) {
  const [fullNameInput, setFullNameInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) setFullNameInput(profile.full_name || '');
  }, [profile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError(null);
    onMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullNameInput, updated_at: new Date() })
      .eq('id', session.user.id);

    setLoading(false);
    if (error) {
      onError(error.message);
    } else {
      onMessage('Perfil actualizado exitosamente.');
      onProfileUpdated();
    }
  };

  return (
    <div style={styles.sectionBox}>
      <h4 style={{ margin: '0 0 12px' }}>Mis Datos Personales</h4>
      <form onSubmit={handleUpdate} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Nombre completo"
          value={fullNameInput}
          onChange={(e) => setFullNameInput(e.target.value)}
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.buttonAction}>
          Guardar
        </button>
      </form>
      <p style={{ color: '#94a3b8', fontSize: '13px', margin: '8px 0 0' }}>
        ID: <code>{session.user.id}</code> | Correo: <code>{session.user.email}</code>
      </p>
    </div>
  );
}
