import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

export default function SuperAdminTabla() {
  const { session, isSuperadmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const [profiles, setProfiles] = useState([]);
  const [avatarUrls, setAvatarUrls] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data);
    } else if (error) {
      showError(error.message);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    const loadAvatarUrls = async () => {
      const entries = await Promise.all(
        profiles.map(async (profile) => {
          const avatarPath = profile.avatar_url || '';
          if (!avatarPath || avatarPath.startsWith('http')) {
            return [profile.id, avatarPath];
          }
          const { data } = await supabase.storage.from('avatars').createSignedUrl(avatarPath, 3600);
          return [profile.id, data?.signedUrl || ''];
        })
      );
      setAvatarUrls(Object.fromEntries(entries));
    };
    loadAvatarUrls();
  }, [profiles]);

  if (!isSuperadmin) return null;

  const handleRoleChange = async (id, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Rol actualizado correctamente.');
      fetchProfiles();
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const { error } = await supabase
      .from('profiles')
      .update({ status: nextStatus })
      .eq('id', id);

    if (error) {
      showError(error.message);
    } else {
      showSuccess(`Estado cambiado a ${nextStatus}.`);
      fetchProfiles();
    }
  };

  const handleSoftDelete = async (id) => {
    if (!confirm('¿Deseas dar de baja a este usuario?')) return;

    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date() })
      .eq('id', id);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Usuario dado de baja (Soft Delete).');
      fetchProfiles();
    }
  };

  const getInitials = (item) => {
    if (item.first_name || item.last_name) {
      const f = item.first_name ? item.first_name[0] : '';
      const l = item.last_name ? item.last_name[0] : '';
      return (f + l).toUpperCase() || 'U';
    }
    if (item.email) {
      return item.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const filteredProfiles = profiles.filter((p) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${p.first_name || ''} ${p.last_name || ''} ${p.full_name || ''}`.toLowerCase();
    const matchesSearch =
      p.email?.toLowerCase().includes(term) ||
      fullName.includes(term) ||
      p.rut?.toLowerCase().includes(term);

    const matchesRole = filterRole === 'all' || p.role === filterRole;
    const matchesStatus = filterStatus === 'all' || (p.status || 'active') === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage) || 1;
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ marginTop: '28px' }}>
      <h3 style={{ margin: '0 0 14px' }}>{t('admin.global_users')} ({filteredProfiles.length})</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <input
          type="text"
          placeholder={t('admin.search_placeholder')}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          style={styles.input}
        />
        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
          style={styles.select}
        >
          <option value="all">{t('admin.all_roles')}</option>
          <option value="user">{t('admin.only_users')}</option>
          <option value="admin">{t('admin.only_admins')}</option>
          <option value="superadmin">superadmin</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          style={styles.select}
        >
          <option value="all">{t('admin.all_statuses')}</option>
          <option value="active">{t('admin.active_status')}</option>
          <option value="suspended">{t('admin.suspended_status')}</option>
        </select>
      </div>

      <div style={styles.tableWrapper}>
        <table style={{ ...styles.table, tableLayout: 'fixed', minWidth: '760px' }}>
          <thead>
            <tr style={styles.thRow}>
              <th style={{ ...styles.th, width: '56px', textAlign: 'center' }}>{t('admin.col_photo')}</th>
              <th style={{ ...styles.th, width: '28%' }}>{t('admin.col_user')}</th>
              <th style={{ ...styles.th, width: '16%' }}>{t('admin.col_rut')}</th>
              <th style={{ ...styles.th, width: '22%' }}>{t('admin.col_location')}</th>
              <th style={{ ...styles.th, width: '12%' }}>{t('admin.col_role')}</th>
              <th style={{ ...styles.th, width: '11%', textAlign: 'center' }}>{t('admin.col_status')}</th>
              <th style={{ ...styles.th, width: '11%', textAlign: 'center' }}>{t('admin.col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProfiles.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                  {t('admin.no_users_found')}
                </td>
              </tr>
            ) : (
              paginatedProfiles.map((item) => {
                const hasRealName = Boolean(item.first_name || item.last_name || item.full_name);
                const displayName = hasRealName
                  ? `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.full_name
                  : t('admin.no_name_completed');

                return (
                  <tr key={item.id} style={styles.tr}>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {item.avatar_url ? (
                        <img
                          src={avatarUrls[item.id] || item.avatar_url}
                          alt="Avatar"
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', display: 'inline-block' }}
                        />
                      ) : (
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          backgroundColor: 'var(--border-subtle)', color: 'var(--text-secondary)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 'bold'
                        }}>
                          {getInitials(item)}
                        </div>
                      )}
                    </td>

                    <td style={styles.td}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: hasRealName ? '600' : '400',
                        color: hasRealName ? 'var(--text-main)' : 'var(--text-dim)',
                        fontStyle: hasRealName ? 'normal' : 'italic'
                      }}>
                        {displayName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>
                        {item.email}
                      </div>
                    </td>

                    <td style={{ ...styles.td, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {item.rut || <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>

                    <td style={styles.td}>
                      {item.commune ? (
                        <div style={{ lineHeight: '1.3' }}>
                          <span style={{ color: 'var(--text-main)' }}>{item.commune}</span>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>{item.region}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      {item.role === 'superadmin' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(139, 92, 246, 0.15)',
                          color: '#a78bfa',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.5px'
                        }}>
                          SUPERADMIN
                        </span>
                      ) : (
                        <select
                          value={item.role || 'user'}
                          onChange={(e) => handleRoleChange(item.id, e.target.value)}
                          disabled={item.id === session?.user?.id}
                          style={{ ...styles.select, width: '100%' }}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                    </td>

                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button
                        onClick={() => handleStatusToggle(item.id, item.status || 'active')}
                        disabled={item.id === session?.user?.id || item.role === 'superadmin'}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          cursor: (item.id === session?.user?.id || item.role === 'superadmin') ? 'not-allowed' : 'pointer',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: (item.status || 'active') === 'active' ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: (item.status || 'active') === 'active' ? 'var(--success-text)' : 'var(--danger-text)',
                          opacity: item.role === 'superadmin' ? 0.7 : 1
                        }}
                      >
                        {(item.status || 'active').toUpperCase()}
                      </button>
                    </td>

                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {item.id === session?.user?.id ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          {t('common.you')}
                        </span>
                      ) : item.role === 'superadmin' ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--border-subtle)',
                          color: 'var(--text-dim)',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          —
                        </span>
                      ) : (
                        <button onClick={() => handleSoftDelete(item.id)} style={styles.btnDelete}>
                          {t('common.delete')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {t('common.page')} <strong>{currentPage}</strong> {t('common.of')} {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={{
                ...styles.buttonAction,
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: currentPage === 1 ? 'var(--bg-card)' : 'var(--primary)',
                color: currentPage === 1 ? 'var(--text-dim)' : '#ffffff',
                border: currentPage === 1 ? '1px solid var(--border-subtle)' : 'none',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.6 : 1
              }}
            >
              {t('common.previous')}
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                ...styles.buttonAction,
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: currentPage === totalPages ? 'var(--bg-card)' : 'var(--primary)',
                color: currentPage === totalPages ? 'var(--text-dim)' : '#ffffff',
                border: currentPage === totalPages ? '1px solid var(--border-subtle)' : 'none',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.6 : 1
              }}
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}