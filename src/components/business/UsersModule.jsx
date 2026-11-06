import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';
import { formatRut, validateRut } from '../../lib/rut';

const emptyForm = {
  first_name: '',
  second_name: '',
  last_name: '',
  second_last_name: '',
  full_name: '',
  email: '',
  password: '',
  rut: '',
  phone: '',
  birth_date: '',
  street: '',
  street_number: '',
  dept_unit: '',
  region: '',
  commune: '',
  role: 'user',
  status: 'active',
};

const isValidEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

import { useConfirm } from '../../hooks/useConfirm';

export default function UsersModule() {
  const { isSuperadmin, isAdmin, session } = useAuth();
  const canManageUsers = isSuperadmin || isAdmin;
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [avatarUrls, setAvatarUrls] = useState({});

  const perPage = 8;

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      showError(error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const loadAvatarUrls = async () => {
      const entries = await Promise.all(
        users.map(async (user) => {
          const avatarPath = user.avatar_url || '';
          if (!avatarPath || avatarPath.startsWith('http')) {
            return [user.id, avatarPath];
          }
          const { data } = await supabase.storage.from('avatars').createSignedUrl(avatarPath, 900);
          return [user.id, data?.signedUrl || ''];
        })
      );
      setAvatarUrls(Object.fromEntries(entries));
    };
    loadAvatarUrls();
  }, [users]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.first_name.trim() && !form.last_name.trim() && !editingId) {
      showError(t('users.required_fields'));
      return false;
    }
    if (!form.email.trim() || !isValidEmail(form.email)) {
      showError(t('users.invalid_email'));
      return false;
    }
    if (!editingId && !form.password.trim()) {
      showError(t('users.password_required'));
      return false;
    }
    if (form.rut && !validateRut(form.rut)) {
      showError(t('users.invalid_rut'));
      return false;
    }
    return true;
  };

  const handleNew = () => {
    setEditingId(null);
    setReadOnly(false);
    setForm(emptyForm);
    setView('form');
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setReadOnly(false);
    setForm({
      first_name: user.first_name || '',
      second_name: user.second_name || '',
      last_name: user.last_name || '',
      second_last_name: user.second_last_name || '',
      full_name: user.full_name || '',
      email: user.email || '',
      password: '',
      rut: user.rut || '',
      phone: user.phone || '',
      birth_date: user.birth_date || '',
      street: user.street || '',
      street_number: user.street_number || '',
      dept_unit: user.dept_unit || '',
      region: user.region || '',
      commune: user.commune || '',
      role: user.role || 'user',
      status: user.status || 'active',
    });
    setView('form');
  };

  const handleView = (user) => {
    setEditingId(user.id);
    setReadOnly(true);
    // Poblar con los datos de la lista de inmediato (evita pantalla vacía)
    setForm({
      first_name: user.first_name || '',
      second_name: user.second_name || '',
      last_name: user.last_name || '',
      second_last_name: user.second_last_name || '',
      full_name: user.full_name || '',
      email: user.email || '',
      password: '',
      rut: user.rut || '',
      phone: user.phone || '',
      birth_date: user.birth_date || '',
      street: user.street || '',
      street_number: user.street_number || '',
      dept_unit: user.dept_unit || '',
      region: user.region || '',
      commune: user.commune || '',
      role: user.role || 'user',
      status: user.status || 'active',
    });
    setView('form');

    // Refrescar desde DB (RLS puede bloquear para algunos roles; si falla, se conservan los datos de la lista)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data: profile, error }) => {
        if (error || !profile) return;
        setForm({
          first_name: profile.first_name || '',
          second_name: profile.second_name || '',
          last_name: profile.last_name || '',
          second_last_name: profile.second_last_name || '',
          full_name: profile.full_name || '',
          email: profile.email || '',
          password: '',
          rut: profile.rut || '',
          phone: profile.phone || '',
          birth_date: profile.birth_date || '',
          street: profile.street || '',
          street_number: profile.street_number || '',
          dept_unit: profile.dept_unit || '',
          region: profile.region || '',
          commune: profile.commune || '',
          role: profile.role || 'user',
          status: profile.status || 'active',
        });
      });
  };

  const handleBack = () => {
    setEditingId(null);
    setReadOnly(false);
    setForm(emptyForm);
    setView('list');
  };

  const { confirm, ConfirmDialogNode } = useConfirm();

  const handleDelete = async (id) => {
    if (!(await confirm(t('users.delete_confirm'), { danger: true }))) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'inactive',
      })
      .eq('id', id);

    if (error) {
      showError(error.message);
      return;
    }

    showSuccess(t('users.delete_success'));
    loadUsers();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);

    if (editingId) {
      // Update existing user
      const payload = {
        first_name: form.first_name.trim(),
        second_name: form.second_name.trim(),
        last_name: form.last_name.trim(),
        second_last_name: form.second_last_name.trim(),
        full_name: `${form.first_name} ${form.last_name}`.trim(),
        email: form.email.trim(),
        rut: form.rut.trim(),
        phone: form.phone.trim(),
        birth_date: form.birth_date || null,
        street: form.street.trim(),
        street_number: form.street_number.trim(),
        dept_unit: form.dept_unit.trim(),
        region: form.region.trim(),
        commune: form.commune.trim(),
        role: isSuperadmin ? form.role : undefined,
        status: form.status,
      };
      // Remove role from payload if not superadmin
      if (!isSuperadmin) delete payload.role;

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', editingId);

      setSaving(false);

      if (error) {
        showError(error.message);
        return;
      }

      showSuccess(t('users.update_success'));
    } else {
      // Create new user via Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password.trim(),
        options: {
          data: {
            full_name: `${form.first_name} ${form.last_name}`.trim(),
            role: form.role,
          },
        },
      });

      if (error) {
        setSaving(false);
        showError(error.message);
        return;
      }

      // Update the profile with additional info
      if (data?.user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: form.first_name.trim(),
            second_name: form.second_name.trim(),
            last_name: form.last_name.trim(),
            second_last_name: form.second_last_name.trim(),
            full_name: `${form.first_name} ${form.last_name}`.trim(),
            rut: form.rut.trim(),
            phone: form.phone.trim(),
            birth_date: form.birth_date || null,
            street: form.street.trim(),
            street_number: form.street_number.trim(),
            dept_unit: form.dept_unit.trim(),
            region: form.region.trim(),
            commune: form.commune.trim(),
            role: form.role,
            status: form.status,
          })
          .eq('id', data.user.id);

        if (profileError) {
          showError(profileError.message);
        }
      }

      setSaving(false);
      showSuccess(t('users.create_success'));
    }

    setEditingId(null);
    setForm(emptyForm);
    setReadOnly(false);
    setView('list');
    loadUsers();
  };

  const getInitials = (user) => {
    if (user.first_name || user.last_name) {
      const f = user.first_name ? user.first_name[0] : '';
      const l = user.last_name ? user.last_name[0] : '';
      return (f + l).toUpperCase() || 'U';
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''} ${user.full_name || ''}`.toLowerCase();
      const matchesSearch =
        !term ||
        [
          user.email,
          fullName,
          user.rut,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));

      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || (user.status || 'active') === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * perPage,
    page * perPage
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  // Form view
  if (view === 'form') {
    return (
      <div style={{ marginTop: '28px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px' }}>
              {readOnly
                ? t('users.view_title')
                : editingId
                ? t('users.edit_title')
                : t('users.new_title')}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('users.subtitle')}
            </p>
            {readOnly && !form.first_name && !form.last_name ? (
              <div style={{
                marginTop: '10px', padding: '10px 12px', borderRadius: '8px',
                background: 'rgba(250,204,21,0.10)', border: '1px solid rgba(250,204,21,0.35)',
                color: '#ca8a04', fontSize: '13px',
              }}>
                Este perfil tiene datos incompletos: solo se registró el correo electrónico. Los demás campos están vacíos en la base de datos.
              </div>
            ) : null}
          </div>
          <button onClick={handleBack} style={styles.buttonAction}>
            {t('users.back_to_list')}
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('users.section_identification')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label}>{t('users.first_name')}</label>
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>{t('users.second_name')}</label>
                <input
                  name="second_name"
                  value={form.second_name}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>{t('users.last_name')}</label>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>{t('users.second_last_name')}</label>
                <input
                  name="second_last_name"
                  value={form.second_last_name}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={styles.label}>{t('users.full_name')}</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                disabled={readOnly}
                style={styles.input}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={styles.label}>{t('users.email')}</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled={readOnly || !!editingId}
                style={styles.input}
              />
            </div>
            {!editingId ? (
              <div style={{ marginTop: '12px' }}>
                <label style={styles.label}>{t('users.password')}</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
            ) : null}
            <div style={{ marginTop: '12px' }}>
              <label style={styles.label}>{t('users.rut')}</label>
              <input
                name="rut"
                value={form.rut}
                onChange={handleChange}
                disabled={readOnly}
                style={styles.input}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={styles.label}>{t('users.phone')}</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                disabled={readOnly}
                style={styles.input}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={styles.label}>{t('users.birth_date')}</label>
              <input
                type="date"
                name="birth_date"
                value={form.birth_date}
                onChange={handleChange}
                disabled={readOnly}
                style={styles.input}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={styles.label}>{t('users.street')}</label>
              <input
                name="street"
                value={form.street}
                onChange={handleChange}
                disabled={readOnly}
                style={styles.input}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div>
                <label style={styles.label}>{t('users.street_number')}</label>
                <input
                  name="street_number"
                  value={form.street_number}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>{t('users.dept_unit')}</label>
                <input
                  name="dept_unit"
                  value={form.dept_unit}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div>
                <label style={styles.label}>{t('users.region')}</label>
                <input
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>{t('users.commune')}</label>
                <input
                  name="commune"
                  value={form.commune}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('users.section_role')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label}>{t('users.role')}</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  disabled={readOnly || !isSuperadmin}
                  style={{ ...styles.select, width: '100%' }}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  {isSuperadmin ? <option value="superadmin">superadmin</option> : null}
                </select>
              </div>
              <div>
                <label style={styles.label}>{t('users.status')}</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={{ ...styles.select, width: '100%' }}
                >
                  <option value="active">{t('users.status_active')}</option>
                  <option value="suspended">{t('users.status_suspended')}</option>
                </select>
              </div>
            </div>
          </section>

          {!readOnly ? (
            <button type="submit" disabled={saving} style={styles.button}>
              {saving
                ? t('common.saving')
                : editingId
                ? t('users.save')
                : t('users.create')}
            </button>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
              {t('users.read_only_notice')}
            </div>
          )}
        </form>
      </div>
    );
  }

  if (!canManageUsers) return null;

  return (
    <div style={{ marginTop: '28px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '14px',
        flexWrap: 'wrap',
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>
            {t('users.title')} ({filteredUsers.length})
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            {t('users.subtitle')}
          </p>
        </div>
        <button onClick={handleNew} style={styles.buttonAction}>
          {t('users.new_button')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <input
          type="text"
          placeholder={t('users.search_placeholder')}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          style={styles.input}
        />
        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
          style={styles.select}
        >
          <option value="all">{t('users.all_roles')}</option>
          <option value="user">{t('users.only_users')}</option>
          <option value="admin">{t('users.only_admins')}</option>
          {isSuperadmin ? <option value="superadmin">superadmin</option> : null}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          style={styles.select}
        >
          <option value="all">{t('users.all_statuses')}</option>
          <option value="active">{t('users.active_status')}</option>
          <option value="suspended">{t('users.suspended_status')}</option>
        </select>
      </div>

      <div style={styles.tableWrapper}>
        <table style={{ ...styles.table, tableLayout: 'fixed', minWidth: '760px' }}>
          <thead>
            <tr style={styles.thRow}>
              <th style={{ ...styles.th, width: '56px', textAlign: 'center' }}>{t('users.col_photo')}</th>
              <th style={{ ...styles.th, width: '28%' }}>{t('users.col_user')}</th>
              <th style={{ ...styles.th, width: '16%' }}>{t('users.col_rut')}</th>
              <th style={{ ...styles.th, width: '22%' }}>{t('users.col_location')}</th>
              <th style={{ ...styles.th, width: '12%' }}>{t('users.col_role')}</th>
              <th style={{ ...styles.th, width: '11%', textAlign: 'center' }}>{t('users.col_status')}</th>
              <th style={{ ...styles.th, width: '11%', textAlign: 'center' }}>{t('users.col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                  {t('common.loading')}
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                  {t('users.no_users_found')}
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                const hasRealName = Boolean(user.first_name || user.last_name || user.full_name);
                const displayName = hasRealName
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.full_name
                  : t('users.no_name_completed');

                return (
                  <tr key={user.id} style={styles.tr}>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {user.avatar_url ? (
                        <img
                          src={avatarUrls[user.id] || user.avatar_url}
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
                          {getInitials(user)}
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
                        {user.email}
                      </div>
                    </td>

                    <td style={{ ...styles.td, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {user.rut || <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>

                    <td style={styles.td}>
                      {user.commune ? (
                        <div style={{ lineHeight: '1.3' }}>
                          <span style={{ color: 'var(--text-main)' }}>{user.commune}</span>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>{user.region}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      {user.role === 'superadmin' ? (
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
                          value={user.role || 'user'}
                          onChange={async (e) => {
                            const newRole = e.target.value;
                            const { error } = await supabase
                              .from('profiles')
                              .update({ role: newRole })
                              .eq('id', user.id);
                            if (!error) {
                              showSuccess('Rol actualizado correctamente.');
                              loadUsers();
                            } else {
                              showError(error.message);
                            }
                          }}
                          disabled={user.id === session?.user?.id || !isSuperadmin}
                          style={{ ...styles.select, width: '100%' }}
                        >
                          <option value="user">user</option>
                          {isSuperadmin ? <option value="admin">admin</option> : null}
                        </select>
                      )}
                    </td>

                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button
                        onClick={async () => {
                          const nextStatus = (user.status || 'active') === 'active' ? 'suspended' : 'active';
                          const { error } = await supabase
                            .from('profiles')
                            .update({ status: nextStatus })
                            .eq('id', user.id);
                          if (!error) {
                            showSuccess(`Estado cambiado a ${nextStatus}.`);
                            loadUsers();
                          } else {
                            showError(error.message);
                          }
                        }}
                        disabled={user.id === session?.user?.id || user.role === 'superadmin'}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          cursor: (user.id === session?.user?.id || user.role === 'superadmin') ? 'not-allowed' : 'pointer',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: (user.status || 'active') === 'active' ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: (user.status || 'active') === 'active' ? 'var(--success-text)' : 'var(--danger-text)',
                          opacity: user.role === 'superadmin' ? 0.7 : 1
                        }}
                      >
                        {(user.status || 'active').toUpperCase()}
                      </button>
                    </td>

                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleView(user)}
                          style={styles.buttonAction}
                        >
                          {t('common.view')}
                        </button>
                        {user.id !== session?.user?.id ? (
                          <button
                            onClick={() => handleEdit(user)}
                            style={styles.buttonAction}
                          >
                            {t('common.edit')}
                          </button>
                        ) : null}
                        {user.id !== session?.user?.id && user.role !== 'superadmin' ? (
                          <button
                            onClick={() => handleDelete(user.id)}
                            style={styles.btnDelete}
                          >
                            {t('common.delete')}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '14px',
          fontSize: '13px',
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {t('common.page')} <strong>{page}</strong> {t('common.of')} {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page === 1}
              style={{
                ...styles.buttonAction,
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: page === 1 ? 'var(--bg-card)' : 'var(--primary)',
                color: page === 1 ? 'var(--text-dim)' : '#ffffff',
                border: page === 1 ? '1px solid var(--border-subtle)' : 'none',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.6 : 1,
              }}
            >
              {t('common.previous')}
            </button>
            <button
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={page === totalPages}
              style={{
                ...styles.buttonAction,
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: page === totalPages ? 'var(--bg-card)' : 'var(--primary)',
                color: page === totalPages ? 'var(--text-dim)' : '#ffffff',
                border: page === totalPages ? '1px solid var(--border-subtle)' : 'none',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                opacity: page === totalPages ? 0.6 : 1,
              }}
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      ) : null}
      {ConfirmDialogNode}
    </div>
  );
}
