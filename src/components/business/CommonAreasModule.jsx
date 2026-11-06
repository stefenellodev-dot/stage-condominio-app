import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

const emptyForm = {
  condominiumId: '',
  name: '',
  areaType: 'quincho',
  description: '',
  capacity: '10',
  requiresBooking: true,
  feeAmount: '0',
  depositAmount: '0',
  openingTime: '08:00',
  closingTime: '22:00',
  rules: '',
  status: 'available',
};

const isValidNumber = (value) => value === '' || !Number.isNaN(Number(value));

import { useConfirm } from '../../hooks/useConfirm';

export default function CommonAreasModule() {
  const { confirm, prompt, ConfirmDialogNode } = useConfirm();
  const { isSuperadmin, isAdmin, user } = useAuth();
  const canManageAreas = isSuperadmin || isAdmin;
  const canManageBookings = isSuperadmin || isAdmin;
  const canCreateBooking = !isAdmin;
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const [areas, setAreas] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list');
  const [activeTab, setActiveTab] = useState('catalog');
  const [editingId, setEditingId] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCondominium, setFilterCondominium] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingView, setBookingView] = useState('list');
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    commonAreaId: '',
    unitId: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    guestCount: '1',
    purpose: '',
    status: 'pending',
    depositStatus: 'pending',
    rejectionReason: '',
    cancellationReason: '',
    requesterId: '',
  });
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = useState('all');
  const [bookingFilterDate, setBookingFilterDate] = useState('');
  const [bookingPage, setBookingPage] = useState(1);
  const [units, setUnits] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const perPage = 8;
  const bookingPerPage = 8;

  const loadAreas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('common_areas')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      showError(error.message);
    } else {
      setAreas(data || []);
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

  const loadUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('id, unit_number, condominium_id, owner_id')
      .is('deleted_at', null)
      .order('unit_number', { ascending: true });

    if (!error && data) setUnits(data);
  };

  const loadProfiles = async () => {
    if (!isSuperadmin) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name, email')
      .order('email', { ascending: true });

    if (!error && data) setProfiles(data);
  };

  const loadBookings = async () => {
    setBookingsLoading(true);
    const { data, error } = await supabase
      .from('common_area_bookings')
      .select('*, common_areas(name,area_type,condominium_id,condominiums(name,management_company_id)), units(unit_number), profiles(full_name,email)')
      .is('deleted_at', null)
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      showError(error.message);
      setBookings([]);
    } else {
      setBookings(data || []);
    }
    setBookingsLoading(false);
  };

  useEffect(() => {
    loadAreas();
    loadCondominiums();
    loadCompanies();
    loadUnits();
    loadBookings();
    if (isSuperadmin) loadProfiles();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus, filterType, filterCondominium, filterCompany]);

  useEffect(() => {
    setBookingPage(1);
  }, [bookingSearch, bookingFilterStatus, bookingFilterDate]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!form.condominiumId) {
      showError(t('common_areas.required_fields'));
      return false;
    }
    if (!form.name.trim()) {
      showError(t('common_areas.required_fields'));
      return false;
    }
    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      showError(t('common_areas.required_fields'));
      return false;
    }
    if (form.feeAmount && (!isValidNumber(form.feeAmount) || Number(form.feeAmount) < 0)) {
      showError(t('common_areas.required_fields'));
      return false;
    }
    if (form.depositAmount && (!isValidNumber(form.depositAmount) || Number(form.depositAmount) < 0)) {
      showError(t('common_areas.required_fields'));
      return false;
    }
    if (!form.openingTime || !form.closingTime) {
      showError(t('common_areas.required_fields'));
      return false;
    }
    if (form.openingTime >= form.closingTime) {
      showError(t('common_areas.invalid_hours'));
      return false;
    }
    return true;
  };

  const buildPayload = () => ({
    condominium_id: form.condominiumId,
    name: form.name.trim(),
    area_type: form.areaType,
    description: form.description.trim() || null,
    capacity: Number(form.capacity),
    requires_booking: form.requiresBooking,
    fee_amount: form.feeAmount ? Number(form.feeAmount) : 0,
    deposit_amount: form.depositAmount ? Number(form.depositAmount) : 0,
    opening_time: form.openingTime,
    closing_time: form.closingTime,
    rules: form.rules.trim() || null,
    status: form.status || 'available',
    deleted_at: null,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const payload = buildPayload();
    const query = editingId
      ? supabase.from('common_areas').update(payload).eq('id', editingId)
      : supabase.from('common_areas').insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      showError(error.message);
      return;
    }

    showSuccess(
      editingId
        ? t('common_areas.update_success')
        : t('common_areas.create_success')
    );
    setEditingId(null);
    setForm(emptyForm);
    setReadOnly(false);
    setView('list');
    loadAreas();
  };

  const handleNew = () => {
    setEditingId(null);
    setReadOnly(false);
    setForm(emptyForm);
    setView('form');
  };

  const handleEdit = (area) => {
    setEditingId(area.id);
    setReadOnly(false);
    setForm({
      condominiumId: area.condominium_id ? String(area.condominium_id) : '',
      name: area.name || '',
      areaType: area.area_type || 'quincho',
      description: area.description || '',
      capacity: area.capacity ? String(area.capacity) : '10',
      requiresBooking: Boolean(area.requires_booking),
      feeAmount: area.fee_amount !== null && area.fee_amount !== undefined ? String(area.fee_amount) : '0',
      depositAmount: area.deposit_amount !== null && area.deposit_amount !== undefined ? String(area.deposit_amount) : '0',
      openingTime: area.opening_time || '08:00',
      closingTime: area.closing_time || '22:00',
      rules: area.rules || '',
      status: area.status || 'available',
    });
    setView('form');
  };

  const handleView = (area) => {
    setEditingId(area.id);
    setReadOnly(true);
    setForm({
      condominiumId: area.condominium_id ? String(area.condominium_id) : '',
      name: area.name || '',
      areaType: area.area_type || 'quincho',
      description: area.description || '',
      capacity: area.capacity ? String(area.capacity) : '10',
      requiresBooking: Boolean(area.requires_booking),
      feeAmount: area.fee_amount !== null && area.fee_amount !== undefined ? String(area.fee_amount) : '0',
      depositAmount: area.deposit_amount !== null && area.deposit_amount !== undefined ? String(area.deposit_amount) : '0',
      openingTime: area.opening_time || '08:00',
      closingTime: area.closing_time || '22:00',
      rules: area.rules || '',
      status: area.status || 'available',
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
    if (!(await confirm(t('common_areas.delete_confirm'), { danger: true }))) return;

    const { error } = await supabase
      .from('common_areas')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'inactive',
      })
      .eq('id', id);

    if (error) {
      showError(error.message);
      return;
    }

    showSuccess(t('common_areas.delete_success'));
    loadAreas();
  };

  const getCondominiumName = (id) =>
    condominiums.find((condominium) => condominium.id === id)?.name || '—';

  const getCompanyName = (condominiumId) => {
    const condominium = condominiums.find((item) => item.id === condominiumId);
    return companies.find((company) => company.id === condominium?.management_company_id)?.legal_name || '—';
  };

  const getAreaName = (id) => areas.find((area) => area.id === id)?.name || '—';
  const getCondominiumNameForBooking = (booking) => booking.common_areas?.condominiums?.name || condominiums.find((condominium) => condominium.id === booking.condominium_id)?.name || '—';
  const getCompanyNameForBooking = (booking) => {
    const condominiumId = booking.common_areas?.condominium_id || booking.condominium_id;
    const condominium = condominiums.find((item) => item.id === condominiumId);
    return companies.find((company) => company.id === condominium?.management_company_id)?.legal_name || '—';
  };
  const getUnitNumber = (booking) => booking.units?.unit_number || units.find((unit) => unit.id === booking.unit_id)?.unit_number || '—';
  const getRequesterName = (booking) => {
    if (booking.profiles?.full_name) return booking.profiles.full_name;
    if (isSuperadmin || isAdmin) return booking.profiles?.email || '—';
    return booking.user_id === user?.id ? 'Tú' : 'Residente';
  };

  const handleNewBooking = () => {
    setEditingBookingId(null);
    setBookingForm({
      commonAreaId: '',
      unitId: '',
      bookingDate: '',
      startTime: '',
      endTime: '',
      guestCount: '1',
      purpose: '',
      status: 'pending',
      depositStatus: 'pending',
      rejectionReason: '',
      cancellationReason: '',
      requesterId: isSuperadmin ? '' : (user?.id || ''),
    });
    setBookingView('form');
  };

  const handleBookingBack = () => {
    setEditingBookingId(null);
    setBookingForm({
      commonAreaId: '',
      unitId: '',
      bookingDate: '',
      startTime: '',
      endTime: '',
      guestCount: '1',
      purpose: '',
      status: 'pending',
      depositStatus: 'pending',
      rejectionReason: '',
      cancellationReason: '',
      requesterId: '',
    });
    setBookingView('list');
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    if (!bookingForm.commonAreaId || !bookingForm.unitId || !bookingForm.bookingDate || !bookingForm.startTime || !bookingForm.endTime) {
      showError(t('common_areas.required_fields'));
      return;
    }
    if (bookingForm.startTime >= bookingForm.endTime) {
      showError(t('common_areas.invalid_hours'));
      return;
    }

    const commonArea = areas.find((area) => area.id === bookingForm.commonAreaId);
    if (!commonArea) {
      showError(t('common_areas.required_fields'));
      return;
    }

    setBookingSaving(true);
    const payload = {
      condominium_id: commonArea.condominium_id,
      common_area_id: bookingForm.commonAreaId,
      unit_id: bookingForm.unitId,
      user_id: isSuperadmin ? (bookingForm.requesterId || user?.id) : user?.id,
      booking_date: bookingForm.bookingDate,
      start_time: bookingForm.startTime,
      end_time: bookingForm.endTime,
      guest_count: Number(bookingForm.guestCount) || 1,
      purpose: bookingForm.purpose.trim() || null,
      charge_to_expenses: true,
    };

    const { error } = await supabase.from('common_area_bookings').insert(payload);
    setBookingSaving(false);

    if (error) {
      showError(error.message);
      return;
    }

    showSuccess(t('common_areas.booking_create_success'));
    handleBookingBack();
    loadBookings();
  };

  const handleBookingStatus = async (booking, status, reason = null) => {
    const payload = { status };
    if (status === 'rejected') payload.rejection_reason = reason || '';
    if (status === 'cancelled') payload.cancellation_reason = reason || '';
    if (status === 'confirmed') payload.deposit_status = 'deposited';
    if (status === 'completed') payload.deposit_status = 'refunded';

    const { error } = await supabase
      .from('common_area_bookings')
      .update(payload)
      .eq('id', booking.id);

    if (error) {
      showError(error.message);
      return;
    }

    showSuccess(t('common_areas.booking_update_success'));
    loadBookings();
  };

  const handleCancelBooking = async (booking) => {
    const reason = await prompt(t('common_areas.booking_cancel_reason_prompt'));
    await handleBookingStatus(booking, 'cancelled', reason || '');
  };

  const handleRejectBooking = async (booking) => {
    const reason = await prompt(t('common_areas.booking_reject_reason'));
    await handleBookingStatus(booking, 'rejected', reason || '');
  };

  const handleCancelBookingByManager = async (booking) => {
    const reason = await prompt(t('common_areas.booking_cancel_reason'));
    await handleBookingStatus(booking, 'cancelled', reason || '');
  };

  const filteredBookings = useMemo(() => {
    const term = bookingSearch.trim().toLowerCase();
    return bookings.filter((booking) => {
      const areaName = booking.common_areas?.name || areas.find((area) => area.id === booking.common_area_id)?.name || '';
      const unitNumber = booking.units?.unit_number || units.find((unit) => unit.id === booking.unit_id)?.unit_number || '';
      const requesterName = getRequesterName(booking);
      const matchesSearch =
        !term ||
        [areaName, unitNumber, requesterName, booking.purpose, booking.status]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      const matchesStatus = bookingFilterStatus === 'all' || booking.status === bookingFilterStatus;
      const matchesDate = !bookingFilterDate || booking.booking_date === bookingFilterDate;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, areas, units, bookingSearch, bookingFilterStatus, bookingFilterDate, isSuperadmin, isAdmin, user]);

  const bookingTotalPages = Math.max(1, Math.ceil(filteredBookings.length / bookingPerPage));
  const paginatedBookings = filteredBookings.slice(
    (bookingPage - 1) * bookingPerPage,
    bookingPage * bookingPerPage
  );

  useEffect(() => {
    setBookingPage(1);
  }, [bookingSearch, bookingFilterStatus, bookingFilterDate]);

  const filteredAreas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return areas.filter((area) => {
      const condominiumName = getCondominiumName(area.condominium_id);
      const companyName = getCompanyName(area.condominium_id);

      const matchesSearch =
        !term ||
        [area.name, area.description, area.rules, condominiumName, companyName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));

      const matchesStatus =
        filterStatus === 'all' || (area.status || 'available') === filterStatus;

      const matchesType =
        filterType === 'all' || area.area_type === filterType;

      const matchesCondominium =
        filterCondominium === 'all' || area.condominium_id === filterCondominium;

      const matchesCompany =
        filterCompany === 'all' ||
        condominiums.find((condominium) => condominium.id === area.condominium_id)?.management_company_id === filterCompany;

      return matchesSearch && matchesStatus && matchesType && matchesCondominium && matchesCompany;
    });
  }, [areas, condominiums, companies, searchTerm, filterStatus, filterType, filterCondominium, filterCompany]);

  const totalPages = Math.max(1, Math.ceil(filteredAreas.length / perPage));
  const paginatedAreas = filteredAreas.slice(
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
                ? t('common_areas.view_title')
                : editingId
                ? t('common_areas.edit_title')
                : t('common_areas.new_title')}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('common_areas.subtitle')}
            </p>
          </div>
          <button onClick={handleBack} style={styles.buttonAction}>
            {t('common_areas.back_to_list')}
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('common_areas.section_identification')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label}>{t('common_areas.condominium')}</label>
                <select
                  name="condominiumId"
                  value={form.condominiumId}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.select}
                >
                  <option value="">{t('common_areas.select_condominium')}</option>
                  {condominiums.map((condominium) => (
                    <option key={condominium.id} value={condominium.id}>
                      {condominium.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label}>{t('common_areas.name')}</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>{t('common_areas.area_type')}</label>
                <select
                  name="areaType"
                  value={form.areaType}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.select}
                >
                  <option value="quincho">{t('common_areas.type_quincho')}</option>
                  <option value="piscina">{t('common_areas.type_piscina')}</option>
                  <option value="gimnasio">{t('common_areas.type_gimnasio')}</option>
                  <option value="salon_eventos">{t('common_areas.type_salon')}</option>
                  <option value="cowork_reunion">{t('common_areas.type_cowork')}</option>
                  <option value="cancha">{t('common_areas.type_cancha')}</option>
                  <option value="lavanderia">{t('common_areas.type_lavanderia')}</option>
                  <option value="terraza_lounge">{t('common_areas.type_terraza')}</option>
                  <option value="juegos_infantiles">{t('common_areas.type_juegos')}</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>{t('common_areas.capacity')}</label>
                <input
                  type="number"
                  min="1"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    name="requiresBooking"
                    checked={form.requiresBooking}
                    onChange={handleChange}
                    disabled={readOnly}
                  />
                  {t('common_areas.requires_booking')}
                </label>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={styles.label}>{t('common_areas.description')}</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={readOnly}
                style={{ ...styles.input, minHeight: '72px', resize: 'vertical' }}
              />
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('common_areas.section_fees')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label}>{t('common_areas.fee_amount')}</label>
                <input
                  type="number"
                  min="0"
                  name="feeAmount"
                  value={form.feeAmount}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>{t('common_areas.deposit_amount')}</label>
                <input
                  type="number"
                  min="0"
                  name="depositAmount"
                  value={form.depositAmount}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('common_areas.section_schedule')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label}>{t('common_areas.opening_time')}</label>
                <input
                  type="time"
                  name="openingTime"
                  value={form.openingTime}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>{t('common_areas.closing_time')}</label>
                <input
                  type="time"
                  name="closingTime"
                  value={form.closingTime}
                  onChange={handleChange}
                  disabled={readOnly}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={styles.label}>{t('common_areas.rules')}</label>
              <textarea
                name="rules"
                value={form.rules}
                onChange={handleChange}
                disabled={readOnly}
                style={{ ...styles.input, minHeight: '72px', resize: 'vertical' }}
              />
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label}>{t('common_areas.status')}</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={readOnly}
                style={styles.select}
              >
                <option value="available">{t('common_areas.status_available')}</option>
                <option value="maintenance">{t('common_areas.status_maintenance')}</option>
                <option value="inactive">{t('common_areas.status_inactive')}</option>
              </select>
            </div>
          </div>

          {!readOnly ? (
            <button type="submit" disabled={saving} style={styles.button}>
              {saving
                ? t('common_areas.saving')
                : t('common_areas.save')}
            </button>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
              {t('common_areas.read_only_notice')}
            </div>
          )}
        </form>
      </div>
    );
  }

  if (bookingView === 'form') {
    const selectedArea = areas.find((area) => area.id === bookingForm.commonAreaId);

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
              {t('common_areas.booking_new_title')}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('common_areas.booking_subtitle')}
            </p>
          </div>
          <button onClick={handleBookingBack} style={styles.buttonAction}>
            {t('common_areas.back_to_list')}
          </button>
        </div>

        <form onSubmit={handleBookingSubmit} style={styles.form}>
          <section style={styles.sectionBox}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>
              {t('common_areas.booking_section_request')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label}>{t('common_areas.common_area')}</label>
                <select
                  name="commonAreaId"
                  value={bookingForm.commonAreaId}
                  onChange={(event) => {
                    const area = areas.find((item) => item.id === event.target.value);
                    setBookingForm((prev) => ({
                      ...prev,
                      commonAreaId: event.target.value,
                      condominiumId: area?.condominium_id ? String(area.condominium_id) : prev.condominiumId,
                    }));
                  }}
                  style={styles.select}
                >
                  <option value="">{t('common_areas.select_common_area')}</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name} - {getCondominiumName(area.condominium_id)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label}>{t('common_areas.unit')}</label>
                <select
                  name="unitId"
                  value={bookingForm.unitId}
                  onChange={(event) => setBookingForm((prev) => ({ ...prev, unitId: event.target.value }))}
                  style={styles.select}
                >
                  <option value="">{t('units.select_condominium')}</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unit_number} - {getCondominiumName(unit.condominium_id)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label}>{t('common_areas.booking_date')}</label>
                <input
                  type="date"
                  name="bookingDate"
                  value={bookingForm.bookingDate}
                  onChange={(event) => setBookingForm((prev) => ({ ...prev, bookingDate: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>{t('common_areas.start_time')}</label>
                <input
                  type="time"
                  name="startTime"
                  value={bookingForm.startTime}
                  onChange={(event) => setBookingForm((prev) => ({ ...prev, startTime: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>{t('common_areas.end_time')}</label>
                <input
                  type="time"
                  name="endTime"
                  value={bookingForm.endTime}
                  onChange={(event) => setBookingForm((prev) => ({ ...prev, endTime: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>{t('common_areas.guest_count')}</label>
                <input
                  type="number"
                  min="1"
                  name="guestCount"
                  value={bookingForm.guestCount}
                  onChange={(event) => setBookingForm((prev) => ({ ...prev, guestCount: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={styles.label}>{t('common_areas.purpose')}</label>
                <input
                  name="purpose"
                  value={bookingForm.purpose}
                  onChange={(event) => setBookingForm((prev) => ({ ...prev, purpose: event.target.value }))}
                  style={styles.input}
                />
              </div>
            </div>
            {selectedArea ? (
              <div style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {t('common_areas.fee_amount')}: ${selectedArea.fee_amount || 0} · {t('common_areas.deposit_amount')}: ${selectedArea.deposit_amount || 0}
              </div>
            ) : null}
            {isSuperadmin ? (
              <div style={{ marginTop: '12px' }}>
                <label style={styles.label}>{t('common_areas.requester')}</label>
                <select
                  value={bookingForm.requesterId}
                  onChange={(event) => setBookingForm((prev) => ({ ...prev, requesterId: event.target.value }))}
                  style={styles.select}
                >
                  <option value="">{t('common_areas.select_requester')}</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email} - {profile.email}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </section>

          <button type="submit" disabled={bookingSaving} style={styles.button}>
            {bookingSaving ? t('common_areas.saving') : t('common_areas.booking_create')}
          </button>
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
            {activeTab === 'catalog'
              ? `${t('common_areas.title')} (${filteredAreas.length})`
              : `${t('common_areas.bookings_title')} (${filteredBookings.length})`}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            {activeTab === 'catalog'
              ? t('common_areas.subtitle')
              : t('common_areas.bookings_subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('catalog')}
            style={activeTab === 'catalog' ? styles.buttonAction : { ...styles.buttonAction, backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}
          >
            {t('common_areas.tab_catalog')}
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            style={activeTab === 'bookings' ? styles.buttonAction : { ...styles.buttonAction, backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}
          >
            {t('common_areas.tab_bookings')}
          </button>
          {activeTab === 'catalog' && canManageAreas ? (
            <button onClick={handleNew} style={styles.buttonAction}>
              {t('common_areas.new_button')}
            </button>
          ) : null}
          {activeTab === 'bookings' && canCreateBooking ? (
            <button onClick={handleNewBooking} style={styles.buttonAction}>
              {t('common_areas.booking_new_button')}
            </button>
          ) : null}
        </div>
      </div>

      {activeTab === 'catalog' ? (
      <>
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
          placeholder={t('common_areas.search_placeholder')}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          style={styles.input}
        />
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          style={styles.select}
        >
          <option value="all">{t('common_areas.all_statuses')}</option>
          <option value="available">{t('common_areas.status_available')}</option>
          <option value="maintenance">{t('common_areas.status_maintenance')}</option>
          <option value="inactive">{t('common_areas.status_inactive')}</option>
        </select>
        <select
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
          style={styles.select}
        >
          <option value="all">{t('common_areas.all_types')}</option>
          <option value="quincho">{t('common_areas.type_quincho')}</option>
          <option value="piscina">{t('common_areas.type_piscina')}</option>
          <option value="gimnasio">{t('common_areas.type_gimnasio')}</option>
          <option value="salon_eventos">{t('common_areas.type_salon')}</option>
          <option value="cowork_reunion">{t('common_areas.type_cowork')}</option>
          <option value="cancha">{t('common_areas.type_cancha')}</option>
          <option value="lavanderia">{t('common_areas.type_lavanderia')}</option>
          <option value="terraza_lounge">{t('common_areas.type_terraza')}</option>
          <option value="juegos_infantiles">{t('common_areas.type_juegos')}</option>
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
          <option value="all">{t('common_areas.all_condominiums')}</option>
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
            <option value="all">{t('common_areas.all_companies')}</option>
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
              <th style={{ ...styles.th, width: '20%' }}>{t('common_areas.col_name')}</th>
              <th style={{ ...styles.th, width: '14%' }}>{t('common_areas.col_type')}</th>
              <th style={{ ...styles.th, width: '18%' }}>{t('common_areas.col_condominium')}</th>
              <th style={{ ...styles.th, width: '16%' }}>{t('common_areas.col_company')}</th>
              <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>{t('common_areas.col_capacity')}</th>
              <th style={{ ...styles.th, width: '14%' }}>{t('common_areas.col_schedule')}</th>
              <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>{t('common_areas.col_fee')}</th>
              <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>{t('common_areas.col_status')}</th>
              <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>{t('common_areas.col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                  {t('common.loading')}
                </td>
              </tr>
            ) : paginatedAreas.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                  {t('common_areas.no_areas')}
                </td>
              </tr>
            ) : (
              paginatedAreas.map((area) => (
                <tr key={area.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {area.name}
                    </div>
                    {area.description ? (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {area.description}
                      </div>
                    ) : null}
                  </td>
                  <td style={styles.td}>
                    {area.area_type === 'quincho'
                      ? t('common_areas.type_quincho')
                      : area.area_type === 'piscina'
                      ? t('common_areas.type_piscina')
                      : area.area_type === 'gimnasio'
                      ? t('common_areas.type_gimnasio')
                      : area.area_type === 'salon_eventos'
                      ? t('common_areas.type_salon')
                      : area.area_type === 'cowork_reunion'
                      ? t('common_areas.type_cowork')
                      : area.area_type === 'cancha'
                      ? t('common_areas.type_cancha')
                      : area.area_type === 'lavanderia'
                      ? t('common_areas.type_lavanderia')
                      : area.area_type === 'terraza_lounge'
                      ? t('common_areas.type_terraza')
                      : t('common_areas.type_juegos')}
                  </td>
                  <td style={styles.td}>
                    {getCondominiumName(area.condominium_id)}
                  </td>
                  <td style={styles.td}>
                    {getCompanyName(area.condominium_id)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {area.capacity}
                  </td>
                  <td style={styles.td}>
                    {area.opening_time} - {area.closing_time}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {area.fee_amount ? `$${area.fee_amount}` : t('common_areas.free')}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {(area.status || 'available').toUpperCase()}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleView(area)}
                        style={styles.buttonAction}
                      >
                        {t('common_areas.view_button')}
                      </button>
                      {canManageAreas ? (
                        <>
                          <button
                            onClick={() => handleEdit(area)}
                            style={styles.buttonAction}
                          >
                            {t('common_areas.edit_button')}
                          </button>
                          <button
                            onClick={() => handleDelete(area.id)}
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
      </>
      ) : (
        <div style={{ marginTop: '14px' }}>
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
              placeholder={t('common_areas.booking_search_placeholder')}
              value={bookingSearch}
              onChange={(event) => setBookingSearch(event.target.value)}
              style={styles.input}
            />
            <select
              value={bookingFilterStatus}
              onChange={(event) => setBookingFilterStatus(event.target.value)}
              style={styles.select}
            >
              <option value="all">{t('common_areas.booking_all_statuses')}</option>
              <option value="pending">{t('common_areas.booking_pending')}</option>
              <option value="confirmed">{t('common_areas.booking_confirmed')}</option>
              <option value="rejected">{t('common_areas.booking_rejected')}</option>
              <option value="cancelled">{t('common_areas.booking_cancelled')}</option>
              <option value="completed">{t('common_areas.booking_completed')}</option>
            </select>
            <input
              type="date"
              value={bookingFilterDate}
              onChange={(event) => setBookingFilterDate(event.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, tableLayout: 'fixed', minWidth: '1120px' }}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={{ ...styles.th, width: '12%' }}>{t('common_areas.booking_col_date')}</th>
                  <th style={{ ...styles.th, width: '14%' }}>{t('common_areas.booking_col_schedule')}</th>
                  <th style={{ ...styles.th, width: '18%' }}>{t('common_areas.booking_col_area')}</th>
                  <th style={{ ...styles.th, width: '12%' }}>{t('common_areas.booking_col_unit')}</th>
                  <th style={{ ...styles.th, width: '16%' }}>{t('common_areas.booking_col_requester')}</th>
                  <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>{t('common_areas.booking_col_guests')}</th>
                  <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>{t('common_areas.booking_col_fee')}</th>
                  <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>{t('common_areas.booking_col_status')}</th>
                  <th style={{ ...styles.th, width: '12%', textAlign: 'center' }}>{t('common_areas.col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {bookingsLoading ? (
                  <tr>
                    <td colSpan="9" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                      {t('common_areas.no_bookings')}
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((booking) => (
                    <tr key={booking.id} style={styles.tr}>
                      <td style={styles.td}>{booking.booking_date}</td>
                      <td style={styles.td}>{booking.start_time} - {booking.end_time}</td>
                      <td style={styles.td}>{booking.common_areas?.name || '—'}</td>
                      <td style={styles.td}>{booking.units?.unit_number || '—'}</td>
                      <td style={styles.td}>{getRequesterName(booking)}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>{booking.guest_count}</td>
                      <td style={{ ...styles.td, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {booking.fee_amount ? `$${booking.fee_amount}` : t('common_areas.free')}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>{booking.status}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {booking.user_id === user?.id && (booking.status === 'pending' || booking.status === 'confirmed') ? (
                            <button onClick={() => handleCancelBooking(booking)} style={styles.btnDelete}>
                              {t('common_areas.booking_cancel')}
                            </button>
                          ) : null}
                          {canManageBookings && booking.status === 'pending' ? (
                            <>
                              <button onClick={() => handleBookingStatus(booking, 'confirmed')} style={styles.buttonAction}>
                                {t('common_areas.booking_approve')}
                              </button>
                              <button onClick={() => handleRejectBooking(booking)} style={styles.btnDelete}>
                                {t('common_areas.booking_reject')}
                              </button>
                            </>
                          ) : null}
                          {canManageBookings && booking.status === 'confirmed' ? (
                            <button onClick={() => handleCancelBookingByManager(booking)} style={styles.btnDelete}>
                              {t('common_areas.booking_cancel')}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {bookingTotalPages > 1 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {t('common.page')} <strong>{bookingPage}</strong> {t('common.of')} {bookingTotalPages}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setBookingPage((current) => Math.max(current - 1, 1))} disabled={bookingPage === 1} style={{ ...styles.buttonAction, padding: '6px 12px', fontSize: '12px' }}>
                  {t('common.previous')}
                </button>
                <button onClick={() => setBookingPage((current) => Math.min(current + 1, bookingTotalPages))} disabled={bookingPage === bookingTotalPages} style={{ ...styles.buttonAction, padding: '6px 12px', fontSize: '12px' }}>
                  {t('common.next')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
      {ConfirmDialogNode}
    </div>
  );
}
