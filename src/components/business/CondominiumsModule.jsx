import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';
import { usePermissions } from '../../hooks/usePermissions';
import { filterSensitiveFields } from '../../constants/fieldPermissions';

export default function CondominiumsModule() {
  const { user, profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();
  const { canCreate, canEdit, canDelete } = usePermissions('condominiums');

  const canManage = canCreate || canEdit;

  const [condominiums, setCondominiums] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState('list');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    rut: '',
    comuna: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: companiesData } = await supabase.from('management_companies').select('id,legal_name,fantasy_name').is('deleted_at', null).order('legal_name');
      setCompanies(companiesData || []);
      if (companiesData && companiesData.length) setSelectedCompany(companiesData[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!selectedCompany) return;
    loadCondominiums();
  }, [selectedCompany]);

  const loadCondominiums = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('condominiums')
      .select('id, name, rut, comuna, status, management_company_id')
      .eq('management_company_id', selectedCompany)
      .order('created_at', { ascending: false });
    if (error) {
      showError(error.message);
    } else {
      const filtered = filterSensitiveFields(data || [], 'condominiums', profile?.role);
      setCondominiums(filtered);
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.rut.trim()) {
      showError(t('common.required_fields'));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('condominiums').insert({
      name: formData.name.trim(),
      rut: formData.rut.trim(),
      comuna: formData.comuna.trim(),
      status: formData.status,
    });
    setSaving(false);
    if (error) {
      showError(error.message);
    } else {
      showSuccess(t('common.created_success'));
      setFormData({ id: '', name: '', rut: '', comuna: '', status: 'active' });
      setFormMode('list');
      loadCondominiums();
    }
  };

  const handleEdit = (condo) => {
    setFormData({
      id: condo.id,
      name: condo.name || '',
      rut: condo.rut || '',
      comuna: condo.comuna || '',
      status: condo.status || 'active',
    });
    setFormMode('edit');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.rut.trim()) {
      showError(t('common.required_fields'));
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('condominiums')
      .update({
        name: formData.name.trim(),
        rut: formData.rut.trim(),
        comuna: formData.comuna.trim(),
        status: formData.status,
      })
      .eq('id', formData.id);
    setSaving(false);
    if (error) {
      showError(error.message);
    } else {
      showSuccess(t('common.updated_success'));
      setFormMode('list');
      loadCondominiums();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.confirm_delete'))) return;
    setSaving(true);
    const { error } = await supabase
      .from('condominiums')
      .update({ status: 'inactive' })
      .eq('id', id);
    setSaving(false);
    if (error) {
      showError(error.message);
    } else {
      showSuccess(t('common.deleted_success'));
      loadCondominiums();
    }
  };

  const handleCancel = () => {
    setFormData({ id: '', name: '', rut: '', comuna: '', status: 'active' });
    setFormMode('list');
  };

  return (
    <div style={{ marginTop: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>{t('condominiums.title')}</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>{t('condominiums.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {companies.length > 0 && (
            <select
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              style={{ ...styles.select, minWidth: '220px' }}
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.fantasy_name || c.legal_name}</option>
              ))}
            </select>
          )}
          {canManage && (
            <button style={{ ...styles.button, padding: '8px 16px', fontSize: '13px' }} onClick={() => {
              setFormData({ id: '', name: '', rut: '', comuna: '', status: 'active' });
              setFormMode('create');
            }}>
              {t('common.new_button')}
            </button>
          )}
        </div>
      </div>

      {formMode !== 'list' && (
        <div style={{ ...styles.formSection, marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
            {formMode === 'create' ? t('condominiums.new_title') : t('condominiums.edit_title')}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label}>{t('condominiums.name')}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}>{t('condominiums.rut')}</label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}>{t('condominiums.comuna')}</label>
              <input
                type="text"
                name="comuna"
                value={formData.comuna}
                onChange={e => setFormData({ ...formData, comuna: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}>{t('users.status')}</label>
                <select name="status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={styles.input}>
                  <option value="active">{t('users.status_active')}</option>
                  <option value="inactive">{t('users.status_suspended')}</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={saving} style={{ ...styles.button, padding: '8px 16px' }}>
                {saving ? t('common.saving') : formMode === 'create' ? t('users.save') : t('users.save')}
              </button>
              <button type="button" onClick={handleCancel} style={{ ...styles.button, backgroundColor: 'var(--danger-bg)', marginTop: '0' }}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
        <div style={styles.tableWrapper}>
          <table style={{ ...styles.table, minWidth: '600px' }}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>{t('condominiums.col_name')}</th>
                <th style={styles.th}>{t('condominiums.col_rut')}</th>
                <th style={styles.th}>{t('condominiums.col_comuna')}</th>
                <th style={styles.th}>{t('condominiums.col_status')}</th>
                <th style={styles.th}>{t('condominiums.col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                    {t('common.loading')}
                  </td>
                </tr>
              ) : condominiums.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                    {t('condominiums.no_condominiums')}
                  </td>
                </tr>
              ) : condominiums.map((c) => (
                <tr key={c.id} style={styles.tr}>
                  <td style={styles.td}>{c.name}</td>
                  <td style={styles.td}>{c.rut || '—'}</td>
                  <td style={styles.td}>{c.comuna || '—'}</td>
                  <td style={styles.td}>{c.status}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {canManage && (
                        <button onClick={() => handleEdit(c)} style={{ ...styles.buttonAction, padding: '4px 8px', fontSize: '12px' }}>
                          {t('common.edit')}
                        </button>
                      )}
                      {canManage && (
                        <button onClick={() => handleDelete(c.id)} style={{ ...styles.buttonAction, padding: '4px 8px', fontSize: '12px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
                          {t('common.delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
}