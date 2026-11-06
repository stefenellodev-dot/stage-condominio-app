import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';
import { formatRut, validateRut } from '../../lib/rut';

const emptyForm = {
  managementCompanyId: '',
  name: '',
  rut: '',
  siiPropertyRole: '',
  type: 'tipo_a',
  destination: 'habitacional',
  totalUnits: '1',
  domCertificateNumber: '',
  domApprovalDate: '',
  reserveFundPercentage: '5.00',
  street: '',
  streetNumber: '',
  regionId: '',
  communeId: '',
  region: '',
  commune: '',
  bankName: '',
  accountType: 'corriente',
  accountNumber: '',
  conciergePhone: '',
  administrationEmail: '',
  status: 'active',
};

const isValidEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidDate = (value) => !value || !Number.isNaN(Date.parse(value));

import { useConfirm } from '../../hooks/useConfirm';

export default function CondominiumsModule() {
  const { confirm, ConfirmDialogNode } = useConfirm();
  const { isSuperadmin, isAdmin } = useAuth();
  const canManageCondominiums = isSuperadmin || isAdmin;
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const [condominiums, setCondominiums] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regions, setRegions] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [view, setView] = useState('list');
  const [readOnly, setReadOnly] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDestination, setFilterDestination] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [page, setPage] = useState(1);

  const perPage = 8;

  const loadCondominiums = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('condominiums')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      showError(error.message);
    } else {
      setCondominiums(data || []);
    }
    setLoading(false);
  };

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from('management_companies')
      .select('id, legal_name, fantasy_name')
      .is('deleted_at', null)
      .order('legal_name', { ascending: true });

    if (!error && data) setCompanies(data);
  };

  const loadRegions = async () => {
    const { data, error } = await supabase
      .from('regions')
      .select('id, name')
      .order('id', { ascending: true });

    if (!error && data) setRegions(data);
  };

  const loadCommunes = async (regionId) => {
    const { data, error } = await supabase
      .from('communes')
      .select('id, name')
      .eq('region_id', regionId)
      .order('name', { ascending: true });

    if (!error && data) setCommunes(data);
  };

  useEffect(() => {
    loadCondominiums();
    loadCompanies();
    loadRegions();
  }, []);

  useEffect(() => {
    if (form.regionId) {
      loadCommunes(form.regionId);
    } else {
      setCommunes([]);
    }
  }, [form.regionId]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus, filterType, filterDestination, filterCompany]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => {
      if (type === 'checkbox') {
        return { ...prev, [name]: checked };
      }

      if (name === 'regionId') {
        const region = regions.find((item) => String(item.id) === value);
        return {
          ...prev,
          regionId: value,
          communeId: '',
          region: region?.name || '',
          commune: '',
        };
      }

      if (name === 'communeId') {
        const commune = communes.find((item) => String(item.id) === value);
        return {
          ...prev,
          communeId: value,
          commune: commune?.name || '',
        };
      }

      if (name === 'rut') {
        return { ...prev, [name]: formatRut(value) };
      }

      return { ...prev, [name]: value };
    });
  };

  const validateForm = () => {
    if (!form.managementCompanyId) {
      showError(t('condominiums.required_fields'));
      return false;
    }
    if (!form.name.trim()) {
      showError(t('condominiums.required_fields'));
      return false;
    }
    if (!validateRut(form.rut)) {
      showError(t('condominiums.invalid_rut'));
      return false;
    }
    if (!form.siiPropertyRole.trim()) {
      showError(t('condominiums.required_fields'));
      return false;
    }
    if (!form.street.trim()) {
      showError(t('condominiums.required_fields'));
      return false;
    }
    if (!form.streetNumber.trim()) {
      showError(t('condominiums.required_fields'));
      return false;
    }
    if (!form.bankName.trim()) {
      showError(t('condominiums.required_fields'));
      return false;
    }
    if (!form.accountNumber.trim()) {
      showError(t('condominiums.required_fields'));
      return false;
    }
    if (form.administrationEmail && !isValidEmail(form.administrationEmail)) {
      showError(t('condominiums.invalid_email'));
      return false;
    }
    if (!isValidDate(form.domApprovalDate)) {
      showError(t('condominiums.required_fields'));
      return false;
    }
    if (form.reserveFundPercentage && (Number.isNaN(Number(form.reserveFundPercentage)) || Number(form.reserveFundPercentage) < 0 || Number(form.reserveFundPercentage) > 100)) {
      showError(t('condominiums.required_fields'));
      return false;
    }
    const totalUnits = Number(form.totalUnits);
    if (!Number.isInteger(totalUnits) || totalUnits <= 0) {
      showError(t('condominiums.required_fields'));
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const managementCompanyId = isSuperadmin
      ? form.managementCompanyId
      : (companies[0]?.id || form.managementCompanyId);

    return {
      management_company_id: managementCompanyId,
      name: form.name.trim(),
      rut: form.rut.trim(),
      sii_property_role: form.siiPropertyRole.trim(),
      type: form.type,
      destination: form.destination,
      total_units: Number(form.totalUnits),
      dom_certificate_number: form.domCertificateNumber.trim() || null,
      dom_approval_date: form.domApprovalDate || null,
      reserve_fund_percentage: form.reserveFundPercentage ? Number(form.reserveFundPercentage) : null,
      street: form.street.trim(),
      street_number: form.streetNumber.trim(),
      region_id: form.regionId ? Number(form.regionId) : null,
      commune_id: form.communeId ? Number(form.communeId) : null,
      region: form.regionId ? form.region : null,
      commune: form.communeId ? form.commune : null,
      bank_name: form.bankName.trim(),
      account_type: form.accountType,
      account_number: form.accountNumber.trim(),
      concierge_phone: form.conciergePhone.trim() || null,
      administration_email: form.administrationEmail.trim() || null,
      status: form.status || 'active',
      deleted_at: null,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const payload = buildPayload();
    const query = editingId
      ? supabase.from('condominiums').update(payload).eq('id', editingId)
      : supabase.from('condominiums').insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      if (error.code === '23505') {
        showError(t('condominiums.duplicate_error'));
      } else {
        showError(error.message);
      }
      return;
    }

    showSuccess(
      editingId
        ? t('condominiums.update_success')
        : t('condominiums.create_success')
    );
    setEditingId(null);
    setForm(emptyForm);
    setView('list');
    loadCondominiums();
  };

  const handleNew = () => {
    setEditingId(null);
    setReadOnly(false);
    const nextForm = { ...emptyForm };
    if (!isSuperadmin && companies.length === 1) {
      nextForm.managementCompanyId = companies[0].id;
    }
    setForm(nextForm);
    setView('form');
  };

  const handleEdit = (condominium) => {
    setEditingId(condominium.id);
    setReadOnly(false);
    setForm({
      managementCompanyId: condominium.management_company_id ? String(condominium.management_company_id) : '',
      name: condominium.name || '',
      rut: condominium.rut || '',
      siiPropertyRole: condominium.sii_property_role || '',
      type: condominium.type || 'tipo_a',
      destination: condominium.destination || 'habitacional',
      totalUnits: condominium.total_units ? String(condominium.total_units) : '1',
      domCertificateNumber: condominium.dom_certificate_number || '',
      domApprovalDate: condominium.dom_approval_date || '',
      reserveFundPercentage: condominium.reserve_fund_percentage ? String(condominium.reserve_fund_percentage) : '5.00',
      street: condominium.street || '',
      streetNumber: condominium.street_number || '',
      regionId: condominium.region_id ? String(condominium.region_id) : '',
      communeId: condominium.commune_id ? String(condominium.commune_id) : '',
      region: condominium.region || '',
      commune: condominium.commune || '',
      bankName: condominium.bank_name || '',
      accountType: condominium.account_type || 'corriente',
      accountNumber: condominium.account_number || '',
      conciergePhone: condominium.concierge_phone || '',
      administrationEmail: condominium.administration_email || '',
      status: condominium.status || 'active',
    });
    setView('form');
  };

  const handleView = (condominium) => {
    setEditingId(condominium.id);
    setReadOnly(true);
    setForm({
      managementCompanyId: condominium.management_company_id ? String(condominium.management_company_id) : '',
      name: condominium.name || '',
      rut: condominium.rut || '',
      siiPropertyRole: condominium.sii_property_role || '',
      type: condominium.type || 'tipo_a',
      destination: condominium.destination || 'habitacional',
      totalUnits: condominium.total_units ? String(condominium.total_units) : '1',
      domCertificateNumber: condominium.dom_certificate_number || '',
      domApprovalDate: condominium.dom_approval_date || '',
      reserveFundPercentage: condominium.reserve_fund_percentage ? String(condominium.reserve_fund_percentage) : '5.00',
      street: condominium.street || '',
      streetNumber: condominium.street_number || '',
      regionId: condominium.region_id ? String(condominium.region_id) : '',
      communeId: condominium.commune_id ? String(condominium.commune_id) : '',
      region: condominium.region || '',
      commune: condominium.commune || '',
      bankName: condominium.bank_name || '',
      accountType: condominium.account_type || 'corriente',
      accountNumber: condominium.account_number || '',
      conciergePhone: condominium.concierge_phone || '',
      administrationEmail: condominium.administration_email || '',
      status: condominium.status || 'active',
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
    if (!(await confirm(t('condominiums.delete_confirm')))) return;

    const { error } = await supabase
      .from('condominiums')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'inactive',
      })
      .eq('id', id);

    if (error) {
      showError(error.message);
      return;
    }

    showSuccess(t('condominiums.delete_success'));
    loadCondominiums();
  };

  const filteredCondominiums = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return condominiums.filter((condominium) => {
      const companyName =
        companies.find((company) => company.id === condominium.management_company_id)?.legal_name || '';

      const matchesSearch =
        !term ||
        [
          condominium.name,
          condominium.rut,
          condominium.sii_property_role,
          condominium.commune,
          companyName,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));

      const matchesStatus =
        filterStatus === 'all' || (condominium.status || 'active') === filterStatus;

      const matchesType =
        filterType === 'all' || condominium.type === filterType;

      const matchesDestination =
        filterDestination === 'all' || condominium.destination === filterDestination;

      const matchesCompany =
        filterCompany === 'all' || condominium.management_company_id === filterCompany;

      return matchesSearch && matchesStatus && matchesType && matchesDestination && matchesCompany;
    });
  }, [condominiums, companies, searchTerm, filterStatus, filterType, filterDestination, filterCompany]);

  const totalPages = Math.max(1, Math.ceil(filteredCondominiums.length / perPage));
  const paginatedCondominiums = filteredCondominiums.slice(
    (page - 1) * perPage,
    page * perPage
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus, filterType, filterDestination, filterCompany]);

  const getCompanyName = (companyId) =>
    companies.find((company) => company.id === companyId)?.legal_name || '—';

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
                ? t('condominiums.view_title')
                : editingId
                ? t('condominiums.edit_title')
                : t('condominiums.new_title')}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('condominiums.subtitle')}
            </p>
          </div>
          <button onClick={handleBack} style={styles.buttonAction}>
            {t('condominiums.back_to_list')}
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('condominiums.section_identification')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="name">{t('condominiums.name')}</label>
                <input
                  id="name" name="name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="rut">{t('condominiums.rut')}</label>
                <input
                  id="rut" name="rut"
                  value={form.rut}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="siiPropertyRole">{t('condominiums.sii_role')}</label>
                <input
                  id="siiPropertyRole" name="siiPropertyRole"
                  value={form.siiPropertyRole}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="type">{t('condominiums.type')}</label>
                <select
                  id="type" name="type"
                  value={form.type}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.select}
                >
                  <option value="tipo_a">{t('condominiums.type_a')}</option>
                  <option value="tipo_b">{t('condominiums.type_b')}</option>
                </select>
              </div>
              <div>
                <label style={styles.label} htmlFor="destination">{t('condominiums.destination')}</label>
                <select
                  id="destination" name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.select}
                >
                  <option value="habitacional">{t('condominiums.destination_habitacional')}</option>
                  <option value="comercial">{t('condominiums.destination_comercial')}</option>
                  <option value="mixto">{t('condominiums.destination_mixto')}</option>
                </select>
              </div>
              <div>
                <label style={styles.label} htmlFor="totalUnits">{t('condominiums.total_units')}</label>
                <input
                  id="totalUnits" type="number"
                  min="1"
                  name="totalUnits"
                  value={form.totalUnits}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('condominiums.section_company')}
            </h4>
            {isSuperadmin ? (
              <div>
                <label style={styles.label} htmlFor="managementCompanyId">{t('condominiums.company')}</label>
                <select
                  id="managementCompanyId" name="managementCompanyId"
                  value={form.managementCompanyId}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.select}
                >
                  <option value="">{t('condominiums.select_company')}</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.legal_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label style={styles.label} htmlFor="domCertificateNumber">{t('condominiums.company')}</label>
                <input
                  value={getCompanyName(form.managementCompanyId)}
                  readOnly
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
            )}
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('condominiums.section_dom')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="domCertificateNumber">{t('condominiums.dom_certificate')}</label>
                <input
                  id="domCertificateNumber" name="domCertificateNumber"
                  value={form.domCertificateNumber}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="domApprovalDate">{t('condominiums.dom_approval_date')}</label>
                <input
                  id="domApprovalDate" type="date"
                  name="domApprovalDate"
                  value={form.domApprovalDate}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="reserveFundPercentage">{t('condominiums.reserve_fund')}</label>
                <input
                  id="reserveFundPercentage" type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  name="reserveFundPercentage"
                  value={form.reserveFundPercentage}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('condominiums.section_address')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="street">{t('condominiums.street')}</label>
                <input
                  id="street" name="street"
                  value={form.street}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="streetNumber">{t('condominiums.street_number')}</label>
                <input
                  id="streetNumber" name="streetNumber"
                  value={form.streetNumber}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="regionId">{t('condominiums.region')}</label>
                <select
                  id="regionId" name="regionId"
                  value={form.regionId}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.select}
                >
                  <option value="">{t('profile.select_region')}</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label} htmlFor="communeId">{t('condominiums.commune')}</label>
                <select
                  id="communeId" name="communeId"
                  value={form.communeId}
                  onChange={handleChange}
                  disabled={readOnly || !form.regionId}
                  style={styles.select}
                >
                  <option value="">{t('profile.select_commune')}</option>
                  {communes.map((commune) => (
                    <option key={commune.id} value={commune.id}>
                      {commune.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('condominiums.section_bank')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="bankName">{t('condominiums.bank_name')}</label>
                <input
                  id="bankName" name="bankName"
                  value={form.bankName}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="accountType">{t('condominiums.account_type')}</label>
                <select
                  id="accountType" name="accountType"
                  value={form.accountType}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.select}
                >
                  <option value="corriente">{t('condominiums.account_corriente')}</option>
                  <option value="vista">{t('condominiums.account_vista')}</option>
                </select>
              </div>
              <div>
                <label style={styles.label} htmlFor="accountNumber">{t('condominiums.account_number')}</label>
                <input
                  id="accountNumber" name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('condominiums.section_contact')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="conciergePhone">{t('condominiums.concierge_phone')}</label>
                <input
                  id="conciergePhone" name="conciergePhone"
                  value={form.conciergePhone}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="administrationEmail">{t('condominiums.administration_email')}</label>
                <input
                  id="administrationEmail" type="email"
                  name="administrationEmail"
                  value={form.administrationEmail}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label} htmlFor="status">{t('condominiums.status')}</label>
              <select
                id="status" name="status"
                value={form.status}
                onChange={handleChange}
                disabled={readOnly}

                style={styles.select}
              >
                <option value="active">{t('condominiums.active_status')}</option>
                <option value="inactive">{t('condominiums.inactive_status')}</option>
              </select>
            </div>
          </div>

          {!readOnly ? (
            <button type="submit" disabled={saving} style={styles.button}>
              {saving
                ? t('condominiums.saving')
                : t('condominiums.save')}
            </button>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
              {t('condominiums.read_only_notice')}
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
            {t('condominiums.title')} ({filteredCondominiums.length})
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            {t('condominiums.subtitle')}
          </p>
        </div>
        {canManageCondominiums ? (
          <button onClick={handleNew} style={styles.buttonAction}>
            {t('condominiums.new_button')}
          </button>
        ) : null}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <input
          type="text"
          placeholder={t('condominiums.search_placeholder')}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          disabled={readOnly}

          style={styles.input}
        />
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          disabled={readOnly}

          style={styles.select}
        >
          <option value="all">{t('condominiums.all_statuses')}</option>
          <option value="active">{t('condominiums.active_status')}</option>
          <option value="inactive">{t('condominiums.inactive_status')}</option>
        </select>
        <select
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
          disabled={readOnly}

          style={styles.select}
        >
          <option value="all">{t('condominiums.all_types')}</option>
          <option value="tipo_a">{t('condominiums.type_a')}</option>
          <option value="tipo_b">{t('condominiums.type_b')}</option>
        </select>
        <select
          value={filterDestination}
          onChange={(event) => setFilterDestination(event.target.value)}
          disabled={readOnly}

          style={styles.select}
        >
          <option value="all">{t('condominiums.all_destinations')}</option>
          <option value="habitacional">{t('condominiums.destination_habitacional')}</option>
          <option value="comercial">{t('condominiums.destination_comercial')}</option>
          <option value="mixto">{t('condominiums.destination_mixto')}</option>
        </select>
      </div>

      {isSuperadmin ? (
        <div style={{ marginBottom: '14px' }}>
          <select
            value={filterCompany}
            onChange={(event) => setFilterCompany(event.target.value)}
            disabled={readOnly}

            style={styles.select}
          >
            <option value="all">{t('condominiums.all_companies')}</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.legal_name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div style={styles.tableWrapper}>
        <table style={{ ...styles.table, tableLayout: 'fixed', minWidth: '1040px' }}>
          <thead>
            <tr style={styles.thRow}>
              <th style={{ ...styles.th, width: '22%' }}>{t('condominiums.col_name')}</th>
              <th style={{ ...styles.th, width: '12%' }}>{t('condominiums.col_rut')}</th>
              <th style={{ ...styles.th, width: '18%' }}>{t('condominiums.col_company')}</th>
              <th style={{ ...styles.th, width: '10%' }}>{t('condominiums.col_type')}</th>
              <th style={{ ...styles.th, width: '12%' }}>{t('condominiums.col_destination')}</th>
              <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>{t('condominiums.col_units')}</th>
              <th style={{ ...styles.th, width: '12%' }}>{t('condominiums.col_commune')}</th>
              <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>{t('condominiums.col_status')}</th>
              <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>{t('condominiums.col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                  {t('common.loading')}
                </td>
              </tr>
            ) : paginatedCondominiums.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                  {t('condominiums.no_condominiums')}
                </td>
              </tr>
            ) : (
              paginatedCondominiums.map((condominium) => (
                <tr key={condominium.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {condominium.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {condominium.sii_property_role}
                    </div>
                  </td>
                  <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {condominium.rut}
                  </td>
                  <td style={styles.td}>
                    {getCompanyName(condominium.management_company_id)}
                  </td>
                  <td style={styles.td}>
                    {condominium.type === 'tipo_a'
                      ? t('condominiums.type_a')
                      : t('condominiums.type_b')}
                  </td>
                  <td style={styles.td}>
                    {condominium.destination === 'habitacional'
                      ? t('condominiums.destination_habitacional')
                      : condominium.destination === 'comercial'
                      ? t('condominiums.destination_comercial')
                      : t('condominiums.destination_mixto')}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {condominium.total_units}
                  </td>
                  <td style={styles.td}>
                    {condominium.commune || '—'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {(condominium.status || 'active').toUpperCase()}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleView(condominium)}
                        style={styles.buttonAction}
                      >
                        {t('condominiums.view_button')}
                      </button>
                      {canManageCondominiums ? (
                        <>
                          <button
                            onClick={() => handleEdit(condominium)}
                            style={styles.buttonAction}
                          >
                            {t('condominiums.edit_button')}
                          </button>
                          <button
                            onClick={() => handleDelete(condominium.id)}
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
