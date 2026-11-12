import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { styles } from '../../../styles/theme';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useTranslation } from '../../../context/I18nContext';
import { ROLES, ROLE_GROUPS } from '../../../constants/roles';
import { usePermissions } from '../../../hooks/usePermissions';
import { useIsMobile } from '../../../hooks/useMediaQuery';
console.log('ConciergeModule loaded');

const fmtTime = (iso) => iso ? new Date(iso).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—';

export default function ConciergeDeskView() {
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();
  const { can } = usePermissions('concierge');

  const condominiumId = profile?.condominium_id;
  const canManage = can('create_visit') || can('create_parcel') || can('create_log');

  const [tab, setTab] = useState('visitas');
  const [pkgView, setPkgView] = useState('list');
  const [visitView, setVisitView] = useState('list');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [condominiums, setCondominiums] = useState([]);
  const [selectedCondo, setSelectedCondo] = useState('');
  const [visits, setVisits] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [units, setUnits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [handoverForm, setHandoverForm] = useState({ outgoing: '', incoming: '', shiftTime: 'afternoon_to_night', pendingTasks: '', cashBalance: 0, observations: '' });
  const [handoverChecklist, setHandoverChecklist] = useState({ radios_portatiles: true, llaves_maestras_completas: true, citofonia_operativa: true, camaras_cctv_sin_fallas: true, porton_vehicular_operativo: true });
  const [savingHandover, setSavingHandover] = useState(false);
  const [loading, setLoading] = useState(false);

  const [visitForm, setVisitForm] = useState({ unit_id: '', visitor_name: '', visitor_rut: '', vehicle_plate: '', parking_spot: '', notes: '' });
  const [savingVisit, setSavingVisit] = useState(false);
  const [pkgForm, setPkgForm] = useState({ unit_id: '', carrier: 'chilexpress', tracking_number: '', package_type: 'caja', pickup_pin: '', voucher_url: '' });
  const [savingPkg, setSavingPkg] = useState(false);
  const [logForm, setLogForm] = useState({ shift: 'morning', entry_type: 'rutina', title: '', description: '' });
  const [showHandover, setShowHandover] = useState(false);
  const [savingLog, setSavingLog] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: companiesData } = await supabase.from('management_companies').select('id,legal_name,fantasy_name').is('deleted_at', null).order('legal_name');
      setCompanies(companiesData || []);
      if (companiesData && companiesData.length) setSelectedCompany(companiesData[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!selectedCompany) {
      setCondominiums([]);
      setSelectedCondo('');
      setUnits([]);
      return;
    }
    (async () => {
      const { data } = await supabase.from('condominiums').select('id,name,rut,management_company_id').eq('management_company_id', selectedCompany).is('deleted_at', null).order('name');
      setCondominiums(data || []);
      if (data && data.length) {
        setSelectedCondo(data[0].id);
      } else {
        setSelectedCondo('');
        setUnits([]);
      }
    })();
  }, [selectedCompany]);

  const loadStaff = async () => {
    if (!selectedCondo) return;
    const { data } = await supabase.from('security_staff_records').select('id, full_name, job_title').eq('condominium_id', selectedCondo).eq('status', 'active').order('full_name');
    setStaffList(data || []);
    if (data && data.length > 0) {
      setHandoverForm(prev => ({ ...prev, outgoing: data[0].id, incoming: data[1]?.id || data[0].id }));
    }
  };

  const loadUnits = async () => {
    if (!selectedCondo) {
      setUnits([]);
      return;
    }
    const { data } = await supabase.from('units').select('id, unit_number, condominium_id').eq('condominium_id', selectedCondo).is('deleted_at', null).order('unit_number');
    setUnits(data || []);
  };

  const loadViews = async () => {
    if (!selectedCondo) return;
    setLoading(true);
    try {
      const [visitsRes, parcelsRes, logbookRes, handoversRes] = await Promise.all([
        supabase
          .from('visitor_logs')
          .select('id, unit_id, visitor_name, visitor_rut, vehicle_plate, parking_spot, entry_time, registered_by, status, notes, units(unit_number)')
          .eq('condominium_id', selectedCondo)
          .order('created_at', { ascending: false }),
        supabase
          .from('parcels')
          .select('id, unit_id, carrier, tracking_number, package_type, pickup_pin, received_at, received_by, picked_up_at, picked_up_by_name, status, units(unit_number)')
          .eq('condominium_id', selectedCondo)
          .order('created_at', { ascending: false }),
        supabase
          .from('concierge_logbook')
          .select('id, shift, entry_type, title, description, author_id, status, created_at, updated_at')
          .eq('condominium_id', selectedCondo)
          .order('created_at', { ascending: false }),
        supabase
          .from('shift_handovers')
          .select('id, shift_time, handover_timestamp, pending_tasks_summary, observations, outgoing:outgoing_staff_id(full_name, job_title), incoming:incoming_staff_id(full_name, job_title)')
          .eq('condominium_id', selectedCondo)
          .order('handover_timestamp', { ascending: false })
          .limit(10),
      ]);
      if (visitsRes.error) showError(visitsRes.error.message); else setVisits(visitsRes.data || []);
      if (parcelsRes.error) showError(parcelsRes.error.message); else setParcels(parcelsRes.data || []);
      if (logbookRes.error) showError(logbookRes.error.message); else setLogs(logbookRes.data || []);
      if (handoversRes.error) showError(handoversRes.error.message); else setHandovers(handoversRes.data || []);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
    loadStaff();
    loadViews();
  }, [selectedCondo, tab]);

  const handleCreateVisit = async (e) => {
    e.preventDefault();
    if (!visitForm.unit_id || !visitForm.visitor_name.trim()) { showError('Unidad y visitante son obligatorios'); return; }
    setSavingVisit(true);
    const { error } = await supabase.from('visitor_logs').insert({
      condominium_id: selectedCondo,
      unit_id: visitForm.unit_id,
      visitor_name: visitForm.visitor_name.trim(),
      visitor_rut: visitForm.visitor_rut.trim() || null,
      vehicle_plate: visitForm.vehicle_plate.trim() || null,
      parking_spot: visitForm.parking_spot.trim() || null,
      notes: visitForm.notes.trim() || null,
    });
    setSavingVisit(false);
    if (error) { showError(error.message); return; }
    showSuccess('Visita registrada');
    setVisitForm({ unit_id: '', visitor_name: '', visitor_rut: '', vehicle_plate: '', parking_spot: '', notes: '' });
    loadViews();
  };

  const handleCreateParcel = async (e) => {
    e.preventDefault();
    if (!pkgForm.unit_id || !pkgForm.tracking_number.trim()) { showError('Unidad y número de guía son obligatorios'); return; }
    setSavingPkg(true);
    const { error } = await supabase.from('parcels').insert({
      condominium_id: selectedCondo,
      unit_id: pkgForm.unit_id,
      carrier: pkgForm.carrier,
      tracking_number: pkgForm.tracking_number.trim(),
      package_type: pkgForm.package_type,
      pickup_pin: pkgForm.pickup_pin.trim() || null,
      voucher_url: pkgForm.voucher_url.trim() || null,
      received_by: user?.id,
    });
    setSavingPkg(false);
    if (error) { showError(error.message); return; }
    showSuccess('Paquete registrado');
    setPkgForm({ unit_id: '', carrier: 'chilexpress', tracking_number: '', package_type: 'caja', pickup_pin: '', voucher_url: '' });
    loadViews();
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    if (!logForm.title.trim() || !logForm.description.trim()) { showError('Título y descripción son obligatorios'); return; }
    setSavingLog(true);
    const { error } = await supabase.from('concierge_logbook').insert({
      condominium_id: selectedCondo,
      author_id: user?.id,
      shift: logForm.shift,
      entry_type: logForm.entry_type,
      title: logForm.title.trim(),
      description: logForm.description.trim(),
    });
    setSavingLog(false);
    if (error) { showError(error.message); return; }
    showSuccess('Novedad registrada');
    setLogForm({ shift: 'morning', entry_type: 'rutina', title: '', description: '' });
    loadViews();
  };

  const handleCreateHandover = async (e) => {
    e.preventDefault();
    if (!handoverForm.outgoing || !handoverForm.incoming) { showError('Debe seleccionar conserje saliente y entrante'); return; }
    if (handoverForm.outgoing === handoverForm.incoming) { showError('El conserje saliente y entrante no pueden ser la misma persona'); return; }
    if (!handoverForm.pendingTasks.trim()) { showError('Las tareas pendientes son obligatorias'); return; }
    setSavingHandover(true);
    const { error } = await supabase.from('shift_handovers').insert({
      condominium_id: selectedCondo,
      outgoing_staff_id: handoverForm.outgoing,
      incoming_staff_id: handoverForm.incoming,
      shift_time: handoverForm.shiftTime,
      equipment_checklist: {
        radios_portatiles: handoverChecklist.radios_portatiles ? 'operativas' : 'con_fallas',
        llaves_maestras_completas: handoverChecklist.llaves_maestras_completas,
        citofonia_operativa: handoverChecklist.citofonia_operativa,
        camaras_cctv_sin_fallas: handoverChecklist.camaras_cctv_sin_fallas,
        porton_vehicular_operativo: handoverChecklist.porton_vehicular_operativo
      },
      pending_tasks_summary: handoverForm.pendingTasks.trim(),
      cash_box_balance: Number(handoverForm.cashBalance) || 0,
      observations: handoverForm.observations.trim() || null
    });
    setSavingHandover(false);
    if (error) { showError(error.message); return; }
    showSuccess('Relevo registrado');
    setHandoverForm({ outgoing: staffList[0]?.id || '', incoming: staffList[1]?.id || staffList[0]?.id || '', shiftTime: 'afternoon_to_night', pendingTasks: '', cashBalance: 0, observations: '' });
    setHandoverChecklist({ radios_portatiles: true, llaves_maestras_completas: true, citofonia_operativa: true, camaras_cctv_sin_fallas: true, porton_vehicular_operativo: true });
    loadViews();
  };

  const tabStyle = (active) => ({ padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: active ? 'var(--primary)' : 'transparent', color: active ? '#fff' : 'var(--text-secondary)', borderRadius: 'var(--radius-md)' });

  return (
    <div style={{ marginTop: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>Conserjería y Accesos</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Visitas, paquetes y bitácora de guardia.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTab('visitas')}
            style={tab === 'visitas' ? { padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' } : { padding: '4px 10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}
          >
            Visitas
          </button>
          <button
            onClick={() => setTab('paquetes')}
            style={tab === 'paquetes' ? { padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' } : { padding: '4px 10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}
          >
            Paquetes
          </button>
          <button
            onClick={() => setTab('libro')}
            style={tab === 'libro' ? { padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' } : { padding: '4px 10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}
          >
            Bitácora
          </button>
          <button
            onClick={() => setTab('relevos')}
            style={tab === 'relevos' ? { padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' } : { padding: '4px 10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}
          >
            Relevos
          </button>
        </div>
      </div>

      <div style={{ ...styles.sectionBox, marginBottom: '14px' }}>
        <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>Filtrar</h4>
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
          {condominiums.length > 0 && (
            <select
              value={selectedCondo}
              onChange={e => setSelectedCondo(e.target.value)}
              style={{ ...styles.select, minWidth: '240px' }}
            >
              {condominiums.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading && <p style={{ color: 'var(--text-dim)' }}>Cargando…</p>}

      {tab === 'visitas' && (
        <div>
          {canManage && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
              {visitView === 'list' ? (
                <button onClick={() => setVisitView('form')} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Nueva visita</button>
              ) : (
                <button onClick={() => setVisitView('list')} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Volver a la lista</button>
              )}
            </div>
          )}
          {visitView === 'form' && canManage && (
            <form onSubmit={handleCreateVisit} style={{ ...styles.form, marginBottom: '16px' }}>
              <section style={styles.sectionBox}>
                <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>Registrar visita</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <select value={visitForm.unit_id} onChange={e => setVisitForm({ ...visitForm, unit_id: e.target.value })} style={styles.select} required>
                    <option value="">Selecciona unidad</option>
                    {units.filter(u => !selectedCondo || selectedCondo === 'all' || u.condominium_id === selectedCondo).map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
                  </select>
                  <input placeholder="Visitante" value={visitForm.visitor_name} onChange={e => setVisitForm({ ...visitForm, visitor_name: e.target.value })} style={styles.input} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <input placeholder="Vehículo (opcional)" value={visitForm.vehicle_plate} onChange={e => setVisitForm({ ...visitForm, vehicle_plate: e.target.value })} style={styles.input} />
                  <input placeholder="RUT (opcional)" value={visitForm.visitor_rut} onChange={e => setVisitForm({ ...visitForm, visitor_rut: e.target.value })} style={styles.input} />
                  <input placeholder="Estacionamiento (opcional)" value={visitForm.parking_spot} onChange={e => setVisitForm({ ...visitForm, parking_spot: e.target.value })} style={styles.input} />
                </div>
                <div style={{ marginTop: '8px' }}>
                  <label style={styles.label}>Notas</label>
                  <textarea value={visitForm.notes} onChange={e => setVisitForm({ ...visitForm, notes: e.target.value })} style={{ ...styles.input, minHeight: '80px' }} />
                </div>
              </section>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={savingVisit} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>{savingVisit ? 'Registrando…' : 'Crear'}</button>
              <button type="button" onClick={() => setVisitView('list')} style={{ padding: '4px 10px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Cancelar</button>
            </div>
            </form>
          )}
          {visitView === 'list' && (isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visits.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin visitas registradas.</div>
              ) : visits.map(v => (
                <div key={v.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '15px' }}>Unidad {v.units?.unit_number}</strong>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{v.status}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{v.visitor_name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
                    <div>🚗 {v.vehicle_plate || '—'}</div>
                    <div>🪪 {v.visitor_rut || '—'}</div>
                    <div>🕐 {v.entry_time ? fmtTime(v.entry_time) : '—'}</div>
                    <div>🅿️ {v.parking_spot || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '700px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Unidad</th><th style={styles.th}>Visitante</th><th style={styles.th}>Vehículo</th><th style={styles.th}>RUT</th><th style={styles.th}>Entrada</th><th style={styles.th}>Estado</th>
              </tr></thead>
              <tbody>
                {visits.length === 0 ? (
                  <tr><td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin visitas registradas.</td></tr>
                ) : visits.map(v => (
                  <tr key={v.id} style={styles.tr}>
                    <td style={styles.td}>{v.units?.unit_number}</td>
                    <td style={styles.td}>{v.visitor_name}</td>
                    <td style={styles.td}>{v.vehicle_plate || '—'}</td>
                    <td style={styles.td}>{v.visitor_rut || '—'}</td>
                    <td style={styles.td}>{v.entry_time ? fmtTime(v.entry_time) : '—'}</td>
                    <td style={styles.td}>{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ))}
        </div>
      )}

      {tab === 'paquetes' && (
        <div>
          {canManage && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
              {pkgView === 'list' ? (
                <button onClick={() => setPkgView('form')} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Nuevo paquete</button>
              ) : (
                <button onClick={() => setPkgView('list')} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Volver a la lista</button>
              )}
            </div>
          )}
          {pkgView === 'form' && canManage && (
            <form onSubmit={handleCreateParcel} style={{ ...styles.form, marginBottom: '16px' }}>
              <section style={styles.sectionBox}>
                <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>Registrar paquete</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <select value={pkgForm.unit_id} onChange={e => setPkgForm({ ...pkgForm, unit_id: e.target.value })} style={styles.select} required>
                    <option value="">Selecciona unidad</option>
                    {units.filter(u => !selectedCondo || selectedCondo === 'all' || u.condominium_id === selectedCondo).map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
                  </select>
                  <input placeholder="Nº guía/tracking" value={pkgForm.tracking_number} onChange={e => setPkgForm({ ...pkgForm, tracking_number: e.target.value })} style={styles.input} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <select value={pkgForm.carrier} onChange={e => setPkgForm({ ...pkgForm, carrier: e.target.value })} style={styles.select}>
                    <option value="chilexpress">Chilexpress</option>
                    <option value="starken">Starken</option>
                    <option value="blue_express">Blue Express</option>
                    <option value="mercado_libre">Mercado Libre</option>
                    <option value="correos_chile">Correos Chile</option>
                    <option value="pedidos_ya">Pedidos Ya</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input placeholder="PIN de retiro" value={pkgForm.pickup_pin} onChange={e => setPkgForm({ ...pkgForm, pickup_pin: e.target.value })} style={styles.input} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="submit" disabled={savingPkg} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>{savingPkg ? 'Registrando…' : 'Crear'}</button>
                  <button type="button" onClick={() => setPkgView('list')} style={{ padding: '4px 10px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Cancelar</button>
                </div>
              </section>
            </form>
          )}
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {parcels.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin paquetes registrados.</div>
              ) : parcels.map(p => (
                <div key={p.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '15px' }}>Unidad {p.units?.unit_number}</strong>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{p.carrier}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>Guía: {p.tracking_number}</div>
                  <div style={{
                    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)', padding: '10px', textAlign: 'center', marginBottom: '10px',
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>PIN de retiro</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '4px', fontFamily: 'var(--font-mono)' }}>{p.pickup_pin}</div>
                  </div>
                  <button style={{ width: '100%', padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer' }}>
                    Entregar paquete
                  </button>
                </div>
              ))}
            </div>
          ) : (
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '700px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Unidad</th><th style={styles.th}>Transportista</th><th style={styles.th}>Guía</th><th style={styles.th}>PIN</th><th style={styles.th}>Estado</th>
              </tr></thead>
              <tbody>
                {parcels.length === 0 ? (
                  <tr><td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin paquetes registrados.</td></tr>
                ) : parcels.map(p => (
                  <tr key={p.id} style={styles.tr}>
                    <td style={styles.td}>{p.units?.unit_number}</td>
                    <td style={styles.td}>{p.carrier}</td>
                    <td style={styles.td}>{p.tracking_number}</td>
                    <td style={styles.td}>{p.pickup_pin}</td>
                    <td style={styles.td}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {tab === 'libro' && (
        <div>
          {handovers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {handovers.map(h => (
                <div key={h.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>Relevo: {h.shift_time?.replace(/_/g, ' ').toUpperCase()}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{new Date(h.handover_timestamp).toLocaleString('es-CL')}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Saliente: <strong>{h.outgoing?.full_name}</strong> ➔ Entrante: <strong>{h.incoming?.full_name}</strong>
                  </div>
                  {h.pending_tasks_summary && <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>Pendientes: {h.pending_tasks_summary}</div>}
                </div>
              ))}
            </div>
          )}
          {canManage && (
            <form onSubmit={handleCreateLog} style={{ ...styles.form, marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select value={logForm.shift} onChange={e => setLogForm({ ...logForm, shift: e.target.value })} style={styles.select}>
                  <option value="morning">Mañana</option>
                  <option value="afternoon">Tarde</option>
                  <option value="night">Noche</option>
                </select>
                <select value={logForm.entry_type} onChange={e => setLogForm({ ...logForm, entry_type: e.target.value })} style={styles.select}>
                  <option value="rutina">Rutina</option>
                  <option value="espacios_comunes">Espacios comunes</option>
                  <option value="reservas">Reservas</option>
                  <option value="incidentes">Incidentes</option>
                </select>
              </div>
              <div style={{ marginTop: '8px' }}>
                <label style={styles.label}>Título</label>
                <input value={logForm.title} onChange={e => setLogForm({ ...logForm, title: e.target.value })} style={styles.input} required />
              </div>
              <div style={{ marginTop: '8px' }}>
                <label style={styles.label}>Descripción</label>
                <textarea value={logForm.description} onChange={e => setLogForm({ ...logForm, description: e.target.value })} style={{ ...styles.input, minHeight: '80px' }} required />
              </div>
              <button type="submit" disabled={savingLog} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>{savingLog ? 'Registrando…' : 'Registrar novedad'}</button>
            </form>
          )}
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '700px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Fecha</th><th style={styles.th}>Turno</th><th style={styles.th}>Tipo</th><th style={styles.th}>Título</th><th style={styles.th}>Estado</th>
              </tr></thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin novedades registradas.</td></tr>
                ) : logs.map(l => (
                  <tr key={l.id} style={styles.tr}>
                    <td style={styles.td}>{l.created_at ? new Date(l.created_at).toLocaleDateString('es-CL') : ''}</td>
                    <td style={styles.td}>{l.shift}</td>
                    <td style={styles.td}>{l.entry_type}</td>
                    <td style={styles.td}>{l.title}</td>
                    <td style={styles.td}>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === 'relevos' && (
        <div>
          {canManage && (
            <form onSubmit={handleCreateHandover} style={{ ...styles.form, marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.label}>Conserje Saliente</label>
                  <select value={handoverForm.outgoing} onChange={e => setHandoverForm({ ...handoverForm, outgoing: e.target.value })} style={styles.select} required>
                    <option value="">Selecciona</option>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.job_title?.replace('_', ' ')})</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Conserje Entrante</label>
                  <select value={handoverForm.incoming} onChange={e => setHandoverForm({ ...handoverForm, incoming: e.target.value })} style={styles.select} required>
                    <option value="">Selecciona</option>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.job_title?.replace('_', ' ')})</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <label style={styles.label}>Horario de Relevo</label>
                <select value={handoverForm.shiftTime} onChange={e => setHandoverForm({ ...handoverForm, shiftTime: e.target.value })} style={styles.select}>
                  <option value="morning_to_afternoon">Mañana ➔ Tarde (07:00 a 15:00)</option>
                  <option value="afternoon_to_night">Tarde ➔ Noche (15:00 a 23:00)</option>
                  <option value="night_to_morning">Noche ➔ Mañana (23:00 a 07:00)</option>
                </select>
              </div>
              <div style={{ marginTop: '8px' }}>
                <label style={styles.label}>Checklist de Operatividad</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={handoverChecklist.radios_portatiles} onChange={() => setHandoverChecklist(p => ({...p, radios_portatiles: !p.radios_portatiles}))} /> Radios portátiles
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={handoverChecklist.llaves_maestras_completas} onChange={() => setHandoverChecklist(p => ({...p, llaves_maestras_completas: !p.llaves_maestras_completas}))} /> Llavero maestro
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={handoverChecklist.citofonia_operativa} onChange={() => setHandoverChecklist(p => ({...p, citofonia_operativa: !p.citofonia_operativa}))} /> Citofonía
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={handoverChecklist.camaras_cctv_sin_fallas} onChange={() => setHandoverChecklist(p => ({...p, camaras_cctv_sin_fallas: !p.camaras_cctv_sin_fallas}))} /> CCTV / Cámaras
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', gridColumn: 'span 2' }}>
                    <input type="checkbox" checked={handoverChecklist.porton_vehicular_operativo} onChange={() => setHandoverChecklist(p => ({...p, porton_vehicular_operativo: !p.porton_vehicular_operativo}))} /> Portón vehicular
                  </label>
                </div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <label style={styles.label}>Tareas y Novedades Pendientes</label>
                <textarea value={handoverForm.pendingTasks} onChange={e => setHandoverForm({ ...handoverForm, pendingTasks: e.target.value })} style={{ ...styles.input, minHeight: '80px' }} required />
              </div>
              <div style={{ marginTop: '8px' }}>
                <label style={styles.label}>Observaciones</label>
                <textarea value={handoverForm.observations} onChange={e => setHandoverForm({ ...handoverForm, observations: e.target.value })} style={{ ...styles.input, minHeight: '60px' }} />
              </div>
              <button type="submit" disabled={savingHandover} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>{savingHandover ? 'Registrando…' : 'Firmar y Registrar Relevo'}</button>
            </form>
          )}
          {handovers.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin relevos registrados.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {handovers.map(h => (
                <div key={h.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>Relevo: {h.shift_time?.replace(/_/g, ' ').toUpperCase()}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{new Date(h.handover_timestamp).toLocaleString('es-CL')}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Saliente: <strong>{h.outgoing?.full_name}</strong> ➔ Entrante: <strong>{h.incoming?.full_name}</strong>
                  </div>
                  {h.pending_tasks_summary && <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>Pendientes: {h.pending_tasks_summary}</div>}
                  {h.observations && <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}><em>{h.observations}</em></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}