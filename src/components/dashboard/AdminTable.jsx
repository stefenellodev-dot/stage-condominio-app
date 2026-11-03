import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';

export default function AdminTable({ currentUserId, onError, onMessage }) {
  const [profiles, setProfiles] = useState([]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data);
    } else if (error) {
      onError(error.message);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleRoleChange = async (id, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date() })
      .eq('id', id);

    if (error) {
      onError(error.message);
    } else {
      onMessage('Rol actualizado.');
      fetchProfiles();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este perfil del catálogo?')) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      onError(error.message);
    } else {
      onMessage('Usuario eliminado correctamente.');
      fetchProfiles();
    }
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <h3 style={{ margin: '0 0 12px' }}>Gestión Global de Usuarios ({profiles.length})</h3>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Rol</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((item) => (
              <tr key={item.id} style={styles.tr}>
                <td style={styles.td}>{item.email}</td>
                <td style={styles.td}>{item.full_name || '—'}</td>
                <td style={styles.td}>
                  <select
                    value={item.role}
                    onChange={(e) => handleRoleChange(item.id, e.target.value)}
                    disabled={item.id === currentUserId}
                    style={styles.select}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td style={styles.td}>
                  {item.id !== currentUserId ? (
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={styles.btnDelete}
                    >
                      Eliminar
                    </button>
                  ) : (
                    <span style={{ color: '#64748b', fontSize: '12px' }}>Tú</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
