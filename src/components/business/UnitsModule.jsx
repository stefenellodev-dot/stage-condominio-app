import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

const emptyForm = {
  condominiumId: '',
  unitNumber: '',
  unitType: 'departamento',
  floor: '',
  blockOrTower: 'Torre A',
  aliquot: '',
  surfaceM2: '',
  ownerId: '',
  occupancyStatus: 'owner_occupied',
  status: 'active',
};

const isValidNumber = (value) => value === '' || !Number.isNaN(Number(value));

import { useConfirm } from '../../hooks/useConfirm';
import { usePermissions } from '../../hooks/usePermissions';
import { filterSensitiveFields } from '../../constants/fieldPermissions';

export default function UnitsModule() {
  const { confirm, ConfirmDialogNode } = useConfirm();
  const { isSuperadmin, isAdmin, profile } = useAuth();
  const { canCreate, canEdit } = usePermissions('units');
  const canManageUnits = canCreate || canEdit;
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const [units, setUnits] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCondominium, setFilterCondominium] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [page, setPage] = useState(1);

  const perPage = 8;

  const loadUnits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      showError(error.message);
    } else {
      const filtered = filterSensitiveFields(data || [], 'units', profile?.role);
      setUnits(filtered);
    }
    setLoading(false);
  };

  const loadCondominiums = async () => {
    const { data, error } = await supabase
      .from('condominiums')
      .select('id, name, management_company_id')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (!error && data) setCondominiums(data);
  };

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from('management_companies')
      .select('id, legal_name, fantasy_name')
      .is('deleted_at', null)
      .order('legal_name', { ascending: true });

    if (!error && data) setCompanies(data);
  };

  const loadOwners = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name, email, rut')
      .order('email', { ascending: true });

    if (!error && data) setOwners(data);
  };

  useEffect(() => {
    loadUnits();
    loadCondominiums();
    loadCompanies();
    loadOwners();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus, filterType, filterCondominium, filterCompany]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.condominiumId) {
      showError(t('units.required_fields'));
      return false;
    }
    if (!form.unitNumber.trim()) {
      showError(t('units.required_fields'));
      return false;
    }
    if (!form.unitType) {
      showError(t('units.required_fields'));
      return false;
    }
    if (form.unitType !== 'casa' && !form.floor.trim()) {
      showError(t('units.required_fields'));
      return false;
    }
    if (form.floor && (!Number.isInteger(Number(form.floor)) || Number(form.floor) < 1)) {
      showError(t('units.required_fields'));
      return false;
    }
    const aliquot = Number(form.aliquot);
    if (Number.isNaN(aliquot) || aliquot <= 0 || aliquot > 100) {
      showError(t('units.invalid_aliquot'));
      return false;
    }
    if (form.surfaceM2 && (!isValidNumber(form.surfaceM2) || Number(form.surfaceM2) <= 0)) {
      showError(t('units.required_fields'));
      return false;
    }
    return true;
  };

  const buildPayload = () => ({
    condominium_id: form.condominiumId,
    unit_number: form.unitNumber.trim(),
    unit_type: form.unitType,
    floor: form.floor ? Number(form.floor) : null,
    block_or_tower: form.blockOrTower.trim() || null,
    aliquot: Number(form.aliquot),
    surface_m2: form.surfaceM2 ? Number(form.surfaceM2) : null,
    owner_id: form.ownerId || null,
    occupancy_status: form.occupancyStatus,
    status: form.status || 'active',
    deleted_at: null,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const payload = buildPayload();
    const query = editingId
      ? supabase.from('units').update(payload).eq('id', editingId)
      : supabase.from('units').insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      if (error.code === '23505') {
        showError(t('units.duplicate_error'));
      } else {
        showError(error.message);
      }
      return;
    }

    showSuccess(
      editingId
        ? t('units.update_success')
        : t('units.create_success')
    );
    setEditingId(null);
    setForm(emptyForm);
    setView('list');
    loadUnits();
  };

  const handleNew = () => {
    setEditingId(null);
    setReadOnly(false);
    setForm(emptyForm);
    setView('form');
  };

  const handleEdit = (unit) => {
    setEditingId(unit.id);
    setReadOnly(false);
    setForm({
      condominiumId: unit.condominium_id ? String(unit.condominium_id) : '',
      unitNumber: unit.unit_number || '',
      unitType: unit.unit_type || 'departamento',
      floor: unit.floor ? String(unit.floor) : '',
      blockOrTower: unit.block_or_tower || '',
      aliquot: unit.aliquot ? String(unit.aliquot) : '',
      surfaceM2: unit.surface_m2 ? String(unit.surface_m2) : '',
      ownerId: unit.owner_id || '',
      occupancyStatus: unit.occupancy_status || 'owner_occupied',
      status: unit.status || 'active',
    });
    setView('form');
  };

  const handleView = (unit) => {
    setEditingId(unit.id);
    setReadOnly(true);
    setForm({
      condominiumId: unit.condominium_id ? String(unit.condominium_id) : '',
      unitNumber: unit.unit_number || '',
      unitType: unit.unit_type || 'departamento',
      floor: unit.floor ? String(unit.floor) : '',
      blockOrTower: unit.block_or_tower || '',
      aliquot: unit.aliquot ? String(unit.aliquot) : '',
      surfaceM2: unit.surface_m2 ? String(unit.surface_m2) : '',
      ownerId: unit.owner_id || '',
      occupancyStatus: unit.occupancy_status || 'owner_occupied',
      status: unit.status || 'active',
    });
    setView('form');
  };

  const handleBack = () => {
    setEditingId(null);
    setReadOnly(false);
    setForm(emptyForm);
    setView('list');
  };

  const handleDelete = async (id) => {
    if (!(await confirm(t('units.delete_confirm')))) return;

    const { error } = await supabase
      .from('units')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'inactive',
      })
      .eq('id', id);

    if (error) {
      showError(error.message);
      return;
    }

    showSuccess(t('units.delete_success'));
    loadUnits();
  };

  const getCondominiumName = (id) =>
    condominiums.find((condominium) => condominium.id === id)?.name || '—';

  const getCompanyName = (condominiumId) => {
    const condominium = condominiums.find((item) => item.id === condominiumId);
    return companies.find((company) => company.id === condominium?.management_company_id)?.legal_name || '—';
  };

  const getOwnerName = (ownerId) => {
    const owner = owners.find((item) => item.id === ownerId);
    if (!owner) return '—';
    return owner.full_name || [owner.first_name, owner.last_name].filter(Boolean).join(' ') || owner.email || '—';
  };

  const filteredUnits = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return units.filter((unit) => {
      const owner = owners.find((item) => item.id === unit.owner_id);
      const ownerName = owner?.full_name || [owner?.first_name, owner?.last_name].filter(Boolean).join(' ') || owner?.email || '';
      const condominiumName = getCondominiumName(unit.condominium_id);
      const companyName = getCompanyName(unit.condominium_id);

      const matchesSearch =
        !term ||
        [
          unit.unit_number,
          unit.unit_type,
          ownerName,
          owner?.email,
          condominiumName,
          companyName,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));

      const matchesStatus =
        filterStatus === 'all' || (unit.status || 'active') === filterStatus;

      const matchesType =
        filterType === 'all' || unit.unit_type === filterType;

      const matchesCondominium =
        filterCondominium === 'all' || unit.condominium_id === filterCondominium;

      const matchesCompany =
        filterCompany === 'all' ||
        condominiums.find((condominium) => condominium.id === unit.condominium_id)?.management_company_id === filterCompany;

      return matchesSearch && matchesStatus && matchesType && matchesCondominium && matchesCompany;
    });
  }, [units, owners, condominiums, companies, searchTerm, filterStatus, filterType, filterCondominium, filterCompany]);

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / perPage));
  const paginatedUnits = filteredUnits.slice(
    (page - 1) * perPage,
    page * perPage
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus, filterType, filterCondominium, filterCompany]);

  if (view === 'form') {
    return (
      <div style={{ marginTop: '28px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '18px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 4px' }}>
              {readOnly
                ? t('units.view_title')
                : editingId
                ? t('units.edit_title')
                : t('units.new_title')}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('units.subtitle')}
            </p>
          </div>
          <button onClick={handleBack} style={styles.buttonAction}>
            {t('units.back_to_list')}
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('units.section_identification')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="condominiumId">{t('units.condominium')}</label>
                <select
                  id="condominiumId" name="condominiumId"
                  value={form.condominiumId}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.select}
                >
                  <option value="">{t('units.select_condominium')}</option>
                  {condominiums.map((condominium) => (
                    <option key={condominium.id} value={condominium.id}>
                      {condominium.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label} htmlFor="unitNumber">{t('units.unit_number')}</label>
                <input
                  id="unitNumber" name="unitNumber"
                  value={form.unitNumber}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="unitType">{t('units.unit_type')}</label>
                <select
                  id="unitType" name="unitType"
                  value={form.unitType}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.select}
                >
                  <option value="departamento">{t('units.type_departamento')}</option>
                  <option value="casa">{t('units.type_casa')}</option>
                  <option value="oficina">{t('units.type_oficina')}</option>
                  <option value="local">{t('units.type_local')}</option>
                </select>
              </div>
              <div>
                <label style={styles.label} htmlFor="floor">{t('units.floor')}</label>
                <input
                  id="floor" type="number"
                  min="1"
                  name="floor"
                  value={form.floor}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="blockOrTower">{t('units.block')}</label>
                <input
                  id="blockOrTower" name="blockOrTower"
                  value={form.blockOrTower}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="aliquot">{t('units.aliquot')}</label>
                <input
                  id="aliquot" type="number"
                  min="0"
                  max="100"
                  step="0.00001"
                  name="aliquot"
                  value={form.aliquot}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="surfaceM2">{t('units.surface')}</label>
                <input
                  id="surfaceM2" type="number"
                  min="0"
                  step="0.01"
                  name="surfaceM2"
                  value={form.surfaceM2}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('units.section_assignment')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="ownerId">{t('units.owner')}</label>
                <select
                  id="ownerId" name="ownerId"
                  value={form.ownerId}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.select}
                >
                  <option value="">{t('units.no_owner')}</option>
                  {owners.map((owner) => {
                    const name =
                      owner.full_name ||
                      [owner.first_name, owner.last_name].filter(Boolean).join(' ') ||
                      owner.email;
                    return (
                      <option key={owner.id} value={owner.id}>
                        {name} - {owner.email}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label style={styles.label} htmlFor="occupancyStatus">{t('units.occupancy_status')}</label>
                <select
                  id="occupancyStatus" name="occupancyStatus"
                  value={form.occupancyStatus}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.select}
                >
                  <option value="owner_occupied">{t('units.occupancy_owner')}</option>
                  <option value="rented">{t('units.occupancy_rented')}</option>
                  <option value="vacant">{t('units.occupancy_vacant')}</option>
                </select>
              </div>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label} htmlFor="status">{t('units.status')}</label>
              <select
                id="status" name="status"
                value={form.status}
                onChange={handleChange}
                disabled={readOnly}
                style={styles.select}
              >
                <option value="active">{t('units.active_status')}</option>
                <option value="inactive">{t('units.inactive_status')}</option>
              </select>
            </div>
          </div>

          {!readOnly ? (
            <button type="submit" disabled={saving} style={styles.button}>
              {saving
                ? t('units.saving')
                : t('units.save')}
            </button>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
              {t('units.read_only_notice')}
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '28px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 4px' }}>
            {t('units.title')} ({filteredUnits.length})
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            {t('units.subtitle')}
          </p>
        </div>
        {canManageUnits ? (
          <button onClick={handleNew} style={styles.buttonAction}>
            {t('units.new_button')}
          </button>
        ) : null}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <input
          type="text"
          placeholder={t('units.search_placeholder')}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          style={styles.input}
        />
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          style={styles.select}
        >
          <option value="all">{t('units.all_statuses')}</option>
          <option value="active">{t('units.active_status')}</option>
          <option value="inactive">{t('units.inactive_status')}</option>
        </select>
        <select
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
          style={styles.select}
        >
          <option value="all">{t('units.all_types')}</option>
          <option value="departamento">{t('units.type_departamento')}</option>
          <option value="casa">{t('units.type_casa')}</option>
          <option value="oficina">{t('units.type_oficina')}</option>
          <option value="local">{t('units.type_local')}</option>
        </select>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isSuperadmin ? '1fr 1fr' : '1fr',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <select
          value={filterCondominium}
          onChange={(event) => setFilterCondominium(event.target.value)}
          style={styles.select}
        >
          <option value="all">{t('units.all_condominiums')}</option>
          {condominiums.map((condominium) => (
            <option key={condominium.id} value={condominium.id}>
              {condominium.name}
            </option>
          ))}
        </select>
        {isSuperadmin ? (
          <select
            value={filterCompany}
            onChange={(event) => setFilterCompany(event.target.value)}
            style={styles.select}
          >
            <option value="all">{t('units.all_companies')}</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.legal_name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div style={styles.tableWrapper}>
        <table style={{ ...styles.table, tableLayout: 'fixed', minWidth: '1080px' }}>
          <thead>
            <tr style={styles.thRow}>
              <th style={{ ...styles.th, width: '10%' }}>{t('units.col_unit')}</th>
              <th style={{ ...styles.th, width: '12%' }}>{t('units.col_type')}</th>
              <th style={{ ...styles.th, width: '20%' }}>{t('units.col_condominium')}</th>
              <th style={{ ...styles.th, width: '16%' }}>{t('units.col_company')}</th>
              <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>{t('units.col_floor')}</th>
              <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>{t('units.col_aliquot')}</th>
              <th style={{ ...styles.th, width: '16%' }}>{t('units.col_owner')}</th>
              <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>{t('units.col_status')}</th>
              <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>{t('units.col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                  {t('common.loading')}
                </td>
              </tr>
            ) : paginatedUnits.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                  {t('units.no_units')}
                </td>
              </tr>
            ) : (
              paginatedUnits.map((unit) => (
                <tr key={unit.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {unit.unit_number}
                    </div>
                    {unit.block_or_tower ? (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {unit.block_or_tower}
                      </div>
                    ) : null}
                  </td>
                  <td style={styles.td}>
                    {unit.unit_type === 'departamento'
                      ? t('units.type_departamento')
                      : unit.unit_type === 'casa'
                      ? t('units.type_casa')
                      : unit.unit_type === 'oficina'
                      ? t('units.type_oficina')
                      : t('units.type_local')}
                  </td>
                  <td style={styles.td}>
                    {getCondominiumName(unit.condominium_id)}
                  </td>
                  <td style={styles.td}>
                    {getCompanyName(unit.condominium_id)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {unit.floor || '—'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {unit.aliquot ? Number(unit.aliquot).toFixed(5) + '%' : '—'}
                  </td>
                  <td style={styles.td}>
                    {getOwnerName(unit.owner_id)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {(unit.status || 'active').toUpperCase()}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleView(unit)}
                        style={styles.buttonAction}
                      >
                        {t('units.view_button')}
                      </button>
                      {canManageUnits ? (
                        <>
                          <button
                            onClick={() => handleEdit(unit)}
                            style={styles.buttonAction}
                          >
                            {t('units.edit_button')}
                          </button>
                          <button
                            onClick={() => handleDelete(unit.id)}
                            style={styles.btnDelete}
                          >
                            {t('common.delete')}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '14px',
            fontSize: '13px',
          }}
        >
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
