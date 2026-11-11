import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { styles } from '../../../styles/theme';
import { ROLES } from '../../../constants/roles';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../context/I18nContext';
import { formatRut, validateRut } from '../../../lib/rut';

const emptyForm = {
  rut: '',
  legalName: '',
  fantasyName: '',
  businessLine: '',
  legalRepName: '',
  legalRepRut: '',
  legalRepEmail: '',
  minvuRegistryNumber: '',
  minvuStatus: 'pending',
  minvuRegisteredAt: '',
  hasGuaranteeInsurance: false,
  email: '',
  phone: '',
  emergencyPhone: '',
  website: '',
  street: '',
  streetNumber: '',
  deptOrUnit: '',
  regionId: '',
  communeId: '',
  region: '',
  commune: '',
  bankName: '',
  accountType: '',
  accountNumber: '',
  bankRecipientRut: '',
  status: 'active',
};

const isValidEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidDate = (value) => !value || !Number.isNaN(Date.parse(value));

import { useConfirm } from '../../../hooks/useConfirm';

export default function AdminManagementCompaniesView() {
  const { confirm, ConfirmDialogNode } = useConfirm();
  const { isSuperadmin, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

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
  const [filterMinvu, setFilterMinvu] = useState('all');
  const [page, setPage] = useState(1);
  const [membersView, setMembersView] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [candidateUsers, setCandidateUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberSaving, setMemberSaving] = useState(false);

  const perPage = 8;

  const loadCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('management_companies')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      showError(error.message);
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
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
  }, [searchTerm, filterStatus, filterMinvu]);

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

      if (name === 'rut' || name === 'legalRepRut' || name === 'bankRecipientRut') {
        return { ...prev, [name]: formatRut(value) };
      }

      return { ...prev, [name]: value };
    });
  };

  const validateForm = () => {
    if (!validateRut(form.rut)) {
      showError(t('management_companies.invalid_rut'));
      return false;
    }
    if (!form.legalName.trim()) {
      showError(t('management_companies.required_fields'));
      return false;
    }
    if (!form.legalRepName.trim()) {
      showError(t('management_companies.required_fields'));
      return false;
    }
    if (!validateRut(form.legalRepRut)) {
      showError(t('management_companies.invalid_rut'));
      return false;
    }
    if (!form.email.trim() || !isValidEmail(form.email)) {
      showError(t('management_companies.invalid_email'));
      return false;
    }
    if (form.legalRepEmail && !isValidEmail(form.legalRepEmail)) {
      showError(t('management_companies.invalid_email'));
      return false;
    }
    if (!isValidDate(form.minvuRegisteredAt)) {
      showError(t('management_companies.required_fields'));
      return false;
    }
    return true;
  };

  const buildPayload = () => ({
    rut: form.rut.trim(),
    legal_name: form.legalName.trim(),
    fantasy_name: form.fantasyName.trim() || null,
    business_line: form.businessLine.trim() || null,
    legal_rep_name: form.legalRepName.trim(),
    legal_rep_rut: form.legalRepRut.trim(),
    legal_rep_email: form.legalRepEmail.trim() || null,
    minvu_registry_number: form.minvuRegistryNumber.trim() || null,
    minvu_status: form.minvuStatus || 'pending',
    minvu_registered_at: form.minvuRegisteredAt || null,
    has_guarantee_insurance: form.hasGuaranteeInsurance,
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    emergency_phone: form.emergencyPhone.trim() || null,
    website: form.website.trim() || null,
    street: form.street.trim() || null,
    street_number: form.streetNumber.trim() || null,
    dept_or_unit: form.deptOrUnit.trim() || null,
    region_id: form.regionId ? Number(form.regionId) : null,
    commune_id: form.communeId ? Number(form.communeId) : null,
    region: form.regionId ? form.region : null,
    commune: form.communeId ? form.commune : null,
    bank_name: form.bankName.trim() || null,
    account_type: form.accountType || null,
    account_number: form.accountNumber.trim() || null,
    bank_recipient_rut: form.bankRecipientRut.trim() || null,
    status: form.status || 'active',
    deleted_at: null,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const payload = buildPayload();
    const query = editingId
      ? supabase.from('management_companies').update(payload).eq('id', editingId)
      : supabase.from('management_companies').insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      if (error.code === '23505') {
        showError(t('management_companies.duplicate_error'));
      } else {
        showError(error.message);
      }
      return;
    }

    showSuccess(
      editingId
        ? t('management_companies.update_success')
        : t('management_companies.create_success')
    );
    setEditingId(null);
    setForm(emptyForm);
    setView('list');
    loadCompanies();
  };

  const handleNew = () => {
    setEditingId(null);
    setReadOnly(false);
    setForm(emptyForm);
    setView('form');
  };

  const handleEdit = (company) => {
    setEditingId(company.id);
    setReadOnly(false);
    setForm({
      rut: company.rut || '',
      legalName: company.legal_name || '',
      fantasyName: company.fantasy_name || '',
      businessLine: company.business_line || '',
      legalRepName: company.legal_rep_name || '',
      legalRepRut: company.legal_rep_rut || '',
      legalRepEmail: company.legal_rep_email || '',
      minvuRegistryNumber: company.minvu_registry_number || '',
      minvuStatus: company.minvu_status || 'pending',
      minvuRegisteredAt: company.minvu_registered_at || '',
      hasGuaranteeInsurance: Boolean(company.has_guarantee_insurance),
      email: company.email || '',
      phone: company.phone || '',
      emergencyPhone: company.emergency_phone || '',
      website: company.website || '',
      street: company.street || '',
      streetNumber: company.street_number || '',
      deptOrUnit: company.dept_or_unit || '',
      regionId: company.region_id ? String(company.region_id) : '',
      communeId: company.commune_id ? String(company.commune_id) : '',
      region: company.region || '',
      commune: company.commune || '',
      bankName: company.bank_name || '',
      accountType: company.account_type || '',
      accountNumber: company.account_number || '',
      bankRecipientRut: company.bank_recipient_rut || '',
      status: company.status || 'active',
    });
    setView('form');
  };

  const handleView = (company) => {
    setEditingId(company.id);
    setReadOnly(true);
    setForm({
      rut: company.rut || '',
      legalName: company.legal_name || '',
      fantasyName: company.fantasy_name || '',
      businessLine: company.business_line || '',
      legalRepName: company.legal_rep_name || '',
      legalRepRut: company.legal_rep_rut || '',
      legalRepEmail: company.legal_rep_email || '',
      minvuRegistryNumber: company.minvu_registry_number || '',
      minvuStatus: company.minvu_status || 'pending',
      minvuRegisteredAt: company.minvu_registered_at || '',
      hasGuaranteeInsurance: Boolean(company.has_guarantee_insurance),
      email: company.email || '',
      phone: company.phone || '',
      emergencyPhone: company.emergency_phone || '',
      website: company.website || '',
      street: company.street || '',
      streetNumber: company.street_number || '',
      deptOrUnit: company.dept_or_unit || '',
      regionId: company.region_id ? String(company.region_id) : '',
      communeId: company.commune_id ? String(company.commune_id) : '',
      region: company.region || '',
      commune: company.commune || '',
      bankName: company.bank_name || '',
      accountType: company.account_type || '',
      accountNumber: company.account_number || '',
      bankRecipientRut: company.bank_recipient_rut || '',
      status: company.status || 'active',
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
    if (!(await confirm(t('management_companies.delete_confirm')))) return;

    const { error } = await supabase
      .from('management_companies')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'inactive',
      })
      .eq('id', id);

    if (error) {
      showError(error.message);
      return;
    }

    showSuccess(t('management_companies.delete_success'));
    loadCompanies();
  };

  const loadMembers = async (companyId) => {
    setMembersLoading(true);
    const { data, error } = await supabase
      .from('management_company_members')
      .select('id, role, status, created_at, user_id')
      .eq('management_company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      showError(error.message);
      setMembers([]);
      setMembersLoading(false);
      return;
    }

    const userIds = (data || []).map((member) => member.user_id);
    const profilesById = {};

    if (userIds.length) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, full_name, email, rut')
        .in('id', userIds);

      if (profilesError) {
        showError(profilesError.message);
      } else {
        (profiles || []).forEach((profile) => {
          profilesById[profile.id] = profile;
        });
      }
    }

    setMembers(
      (data || []).map((member) => ({
        ...member,
        profile: profilesById[member.user_id] || null,
      }))
    );
    setMembersLoading(false);
  };

  const loadCandidateUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name, email, rut')
      .eq('role', ROLES.ADMIN)
      .is('deleted_at', null)
      .order('email', { ascending: true });

    if (error) {
      showError(error.message);
      setCandidateUsers([]);
      return;
    }
    setCandidateUsers(data || []);
  };

  const openMembers = (company) => {
    setSelectedCompany(company);
    setMembersView('members');
    setMemberSearch('');
    setSelectedUserId('');
    loadMembers(company.id);
    if (isSuperadmin) loadCandidateUsers();
  };

  const closeMembers = () => {
    setSelectedCompany(null);
    setMembersView('list');
    setMembers([]);
  };

  const handleAssignMember = async (userId = selectedUserId) => {
    if (!selectedCompany || !userId) return;

    setMemberSaving(true);
    const { error } = await supabase
      .from('management_company_members')
      .insert({
        management_company_id: selectedCompany.id,
        user_id: userId,
        role: ROLES.ADMIN,
        status: 'active',
      });
    setMemberSaving(false);

    if (error) {
      if (error.code === '23505') {
        showError(t('management_companies.members_duplicate'));
      } else {
        showError(error.message);
      }
      return;
    }

    showSuccess(t('management_companies.members_assigned'));
    setSelectedUserId('');
    loadMembers(selectedCompany.id);
  };

  const handleRemoveMember = async (memberId) => {
    if (!(await confirm(t('management_companies.members_remove_confirm')))) return;

    const { error } = await supabase
      .from('management_company_members')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'inactive',
      })
      .eq('id', memberId);

    if (error) {
      showError(error.message);
      return;
    }

    showSuccess(t('management_companies.members_removed'));
    if (selectedCompany) loadMembers(selectedCompany.id);
  };

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return companies.filter((company) => {
      const matchesSearch =
        !term ||
        [
          company.legal_name,
          company.fantasy_name,
          company.rut,
          company.legal_rep_name,
          company.commune,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));

      const matchesStatus =
        filterStatus === 'all' || (company.status || 'active') === filterStatus;

      const matchesMinvu =
        filterMinvu === 'all' ||
        (company.minvu_status || 'pending') === filterMinvu;

      return matchesSearch && matchesStatus && matchesMinvu;
    });
  }, [companies, searchTerm, filterStatus, filterMinvu]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / perPage));
  const paginatedCompanies = filteredCompanies.slice(
    (page - 1) * perPage,
    page * perPage
  );

  if (!isSuperadmin && !isAdmin) {
    return null;
  }

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
                ? t('management_companies.view_title')
                : editingId
                ? t('management_companies.edit_title')
                : t('management_companies.new_title')}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('management_companies.subtitle')}
            </p>
          </div>
          <button onClick={handleBack} style={styles.buttonAction}>
            {t('management_companies.back_to_list')}
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('management_companies.section_identification')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="legalName">{t('management_companies.legal_name')}</label>
                <input
                  id="legalName" name="legalName"
                  value={form.legalName}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="fantasyName">{t('management_companies.fantasy_name')}</label>
                <input
                  id="fantasyName" name="fantasyName"
                  value={form.fantasyName}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="rut">{t('management_companies.rut')}</label>
                <input
                  id="rut" name="rut"
                  value={form.rut}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="businessLine">{t('management_companies.business_line')}</label>
                <input
                  id="businessLine" name="businessLine"
                  value={form.businessLine}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('management_companies.section_representative')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="legalRepName">{t('management_companies.legal_rep_name')}</label>
                <input
                  id="legalRepName" name="legalRepName"
                  value={form.legalRepName}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="legalRepRut">{t('management_companies.legal_rep_rut')}</label>
                <input
                  id="legalRepRut" name="legalRepRut"
                  value={form.legalRepRut}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={styles.label} htmlFor="legalRepEmail">{t('management_companies.legal_rep_email')}</label>
                <input
                  id="legalRepEmail" type="email"
                  name="legalRepEmail"
                  value={form.legalRepEmail}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('management_companies.section_minvu')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="minvuRegistryNumber">{t('management_companies.minvu_number')}</label>
                <input
                  id="minvuRegistryNumber" name="minvuRegistryNumber"
                  value={form.minvuRegistryNumber}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="minvuStatus">{t('management_companies.minvu_status')}</label>
                <select
                  id="minvuStatus" name="minvuStatus"
                  value={form.minvuStatus}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.select}
                >
                  <option value="pending">{t('management_companies.minvu_pending')}</option>
                  <option value="active">{t('management_companies.minvu_active')}</option>
                  <option value="suspended">{t('management_companies.minvu_suspended')}</option>
                  <option value="expired">{t('management_companies.minvu_expired')}</option>
                </select>
              </div>
              <div>
                <label style={styles.label} htmlFor="minvuRegisteredAt">{t('management_companies.minvu_registered_at')}</label>
                <input
                  id="minvuRegisteredAt" type="date"
                  name="minvuRegisteredAt"
                  value={form.minvuRegisteredAt}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }} htmlFor="email">
                  <input
                    type="checkbox"
                    name="hasGuaranteeInsurance"
                    checked={form.hasGuaranteeInsurance}
                    onChange={handleChange}
                    disabled={readOnly}
                  />
                  {t('management_companies.has_guarantee')}
                </label>
              </div>
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('management_companies.section_contact')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="email">{t('management_companies.email')}</label>
                <input
                  id="email" type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="phone">{t('management_companies.phone')}</label>
                <input
                  id="phone" name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="emergencyPhone">{t('management_companies.emergency_phone')}</label>
                <input
                  id="emergencyPhone" name="emergencyPhone"
                  value={form.emergencyPhone}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="website">{t('management_companies.website')}</label>
                <input
                  id="website" type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('management_companies.section_address')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="street">{t('management_companies.street')}</label>
                <input
                  id="street" name="street"
                  value={form.street}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="streetNumber">{t('management_companies.street_number')}</label>
                <input
                  id="streetNumber" name="streetNumber"
                  value={form.streetNumber}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="deptOrUnit">{t('management_companies.dept_unit')}</label>
                <input
                  id="deptOrUnit" name="deptOrUnit"
                  value={form.deptOrUnit}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="regionId">{t('management_companies.region')}</label>
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
                <label style={styles.label} htmlFor="communeId">{t('management_companies.commune')}</label>
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
              {t('management_companies.section_bank')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="bankName">{t('management_companies.bank_name')}</label>
                <input
                  id="bankName" name="bankName"
                  value={form.bankName}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="accountType">{t('management_companies.account_type')}</label>
                <select
                  id="accountType" name="accountType"
                  value={form.accountType}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.select}
                >
                  <option value="">{t('management_companies.select_option')}</option>
                  <option value="corriente">{t('management_companies.account_corriente')}</option>
                  <option value="vista">{t('management_companies.account_vista')}</option>
                  <option value="ahorro">{t('management_companies.account_ahorro')}</option>
                </select>
              </div>
              <div>
                <label style={styles.label} htmlFor="accountNumber">{t('management_companies.account_number')}</label>
                <input
                  id="accountNumber" name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label} htmlFor="bankRecipientRut">{t('management_companies.bank_recipient_rut')}</label>
                <input
                  id="bankRecipientRut" name="bankRecipientRut"
                  value={form.bankRecipientRut}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('management_companies.status')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label} htmlFor="status">{t('management_companies.status')}</label>
                <select
                  id="status" name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={readOnly}

                  style={styles.select}
                >
                  <option value="active">{t('management_companies.active_status')}</option>
                  <option value="inactive">{t('management_companies.inactive_status')}</option>
                  <option value="suspended">{t('management_companies.suspended_status')}</option>
                </select>
              </div>
            </div>
          </section>

          {!readOnly ? (
            <button type="submit" disabled={saving} style={styles.button}>
              {saving
                ? t('management_companies.saving')
                : t('management_companies.save')}
            </button>
          ) : null}
        </form>
      </div>
    );
  }

  if (membersView === 'members' && selectedCompany) {
    const memberUserIds = new Set(members.map((member) => member.user_id));
    const filteredCandidates = candidateUsers.filter((user) => {
      const term = memberSearch.trim().toLowerCase();
      if (!term) return true;
      return [user.full_name, user.first_name, user.last_name, user.email, user.rut]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });

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
              {t('management_companies.members_title')}: {selectedCompany.legal_name}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('management_companies.members_subtitle')}
            </p>
          </div>
          <button onClick={closeMembers} style={styles.buttonAction}>
            {t('management_companies.back_to_list')}
          </button>
        </div>

        <div style={styles.tableWrapper}>
          <table style={{ ...styles.table, tableLayout: 'fixed', minWidth: '760px' }}>
            <thead>
              <tr style={styles.thRow}>
                <th style={{ ...styles.th, width: '28%' }}>{t('management_companies.members_col_user')}</th>
                <th style={{ ...styles.th, width: '28%' }}>{t('management_companies.members_col_email')}</th>
                <th style={{ ...styles.th, width: '16%' }}>{t('management_companies.members_col_rut')}</th>
                <th style={{ ...styles.th, width: '12%', textAlign: 'center' }}>{t('management_companies.members_col_role')}</th>
                <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>{t('management_companies.members_col_status')}</th>
                <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>{t('management_companies.members_col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {membersLoading ? (
                <tr>
                  <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                    {t('common.loading')}
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                    {t('management_companies.members_empty')}
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} style={styles.tr}>
                    <td style={styles.td}>
                      {member.profile?.full_name ||
                        [member.profile?.first_name, member.profile?.last_name].filter(Boolean).join(' ') ||
                        '—'}
                    </td>
                    <td style={styles.td}>{member.profile?.email || '—'}</td>
                    <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {member.profile?.rut || '—'}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{member.role}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{member.status}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        style={styles.btnDelete}
                      >
                        {t('management_companies.members_remove')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isSuperadmin ? (
        <section style={{ ...styles.sectionBox, marginTop: '18px' }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
            {t('management_companies.members_assign_title')}
          </h4>
          <div style={{ marginBottom: '12px' }}>
            <label style={styles.label} htmlFor="members_search">{t('management_companies.members_search')}</label>
            <input
              id="members_search"
              type="text"
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              disabled={readOnly}

              style={styles.input}
              placeholder={t('management_companies.members_search_placeholder')}
            />
          </div>
          {filteredCandidates.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '10px' }}>
              {t('management_companies.members_no_candidates')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredCandidates.map((user) => {
                const alreadyAssociated = memberUserIds.has(user.id);
                const displayName =
                  user.full_name ||
                  [user.first_name, user.last_name].filter(Boolean).join(' ') ||
                  user.email;

                return (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                        {displayName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {user.email}
                      </div>
                      {user.rut ? (
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          {user.rut}
                        </div>
                      ) : null}
                    </div>
                    <button
                      onClick={() => handleAssignMember(user.id)}
                      disabled={memberSaving || alreadyAssociated}
                      style={{
                        ...styles.buttonAction,
                        opacity: alreadyAssociated ? 0.55 : 1,
                        cursor: alreadyAssociated ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {alreadyAssociated
                        ? t('management_companies.members_already_associated')
                        : memberSaving
                        ? t('management_companies.saving')
                        : t('management_companies.members_assign_button')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        ) : null}
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
            {t('management_companies.title')} ({filteredCompanies.length})
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            {t('management_companies.subtitle')}
          </p>
        </div>
        {isSuperadmin ? (
          <button onClick={handleNew} style={styles.buttonAction}>
            {t('management_companies.new_button')}
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
          placeholder={t('management_companies.search_placeholder')}
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
          <option value="all">{t('management_companies.all_statuses')}</option>
          <option value="active">{t('management_companies.active_status')}</option>
          <option value="inactive">{t('management_companies.inactive_status')}</option>
          <option value="suspended">{t('management_companies.suspended_status')}</option>
        </select>
        <select
          value={filterMinvu}
          onChange={(event) => setFilterMinvu(event.target.value)}
          disabled={readOnly}

          style={styles.select}
        >
          <option value="all">{t('management_companies.all_minvu')}</option>
          <option value="active">{t('management_companies.minvu_active')}</option>
          <option value="pending">{t('management_companies.minvu_pending')}</option>
          <option value="suspended">{t('management_companies.minvu_suspended')}</option>
          <option value="expired">{t('management_companies.minvu_expired')}</option>
        </select>
      </div>

      <div style={styles.tableWrapper}>
        <table style={{ ...styles.table, tableLayout: 'fixed', minWidth: '980px' }}>
          <thead>
            <tr style={styles.thRow}>
              <th style={{ ...styles.th, width: '24%' }}>{t('management_companies.col_company')}</th>
              <th style={{ ...styles.th, width: '12%' }}>{t('management_companies.col_rut')}</th>
              <th style={{ ...styles.th, width: '18%' }}>{t('management_companies.col_rep')}</th>
              <th style={{ ...styles.th, width: '14%' }}>{t('management_companies.col_minvu')}</th>
              <th style={{ ...styles.th, width: '12%' }}>{t('management_companies.col_commune')}</th>
              <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>{t('management_companies.col_status')}</th>
              <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>{t('management_companies.col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                  {t('common.loading')}
                </td>
              </tr>
            ) : paginatedCompanies.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                  {t('management_companies.no_companies')}
                </td>
              </tr>
            ) : (
              paginatedCompanies.map((company) => (
                <tr key={company.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {company.legal_name}
                    </div>
                    {company.fantasy_name ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {company.fantasy_name}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {company.rut}
                  </td>
                  <td style={styles.td}>
                    <div>{company.legal_rep_name}</div>
                    {company.legal_rep_email ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {company.legal_rep_email}
                      </div>
                    ) : null}
                  </td>
                  <td style={styles.td}>
                    <div>{company.minvu_registry_number || '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {company.minvu_status || 'pending'}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {company.commune || '—'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {(company.status || 'active').toUpperCase()}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleView(company)}
                        style={styles.buttonAction}
                      >
                        {t('management_companies.view_button')}
                      </button>
                      <button
                        onClick={() => openMembers(company)}
                        style={styles.buttonAction}
                      >
                        {t('management_companies.members_button')}
                      </button>
                      {isSuperadmin ? (
                        <>
                          <button
                            onClick={() => handleEdit(company)}
                            style={styles.buttonAction}
                          >
                            {t('management_companies.edit_button')}
                          </button>
                          <button
                            onClick={() => handleDelete(company.id)}
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
                color: page === 1 ? 'var(--text-dim)' : 'var(--bg-card)',
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
                color: page === totalPages ? 'var(--text-dim)' : 'var(--bg-card)',
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
