import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—';

export default function ConciergeModule() {
  const { user, profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const condominiumId = profile?.condominium_id;
  const canManage = ['superadmin', 'admin', 'concierge'].includes(profile?.role || '');

  const [tab, setTab] = useState('visitas');
  const [condominiums, setCondominiums] = useState([]);
  const [selectedCondo, setSelectedCondo] = useState('');
  const [visits, setVisits] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [visitForm, setVisitForm] = useState({ unit_id: '', visitor_name: '', visitor_rut: '', vehicle_plate: '', parking_spot: '', notes: '' });
  const [savingVisit, setSavingVisit] = useState(false);
  const [pkgForm, setPkgForm] = useState({ unit_id: '', carrier: 'chilexpress', tracking_number: '', package_type: 'caja', pickup_pin: '', voucher_url: '' });
  const [savingPkg, setSavingPkg] = useState(false);
  const [logForm, setLogForm] = useState({ shift: 'morning', entry_type: 'rutina', title: '', description: '' });
  const [savingLog, setSavingLog] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('condominiums').select('id,name,rut').is('deleted_at', null).order('name');
      setCondominiums(data || []);
      if (data && data.length) setSelectedCondo(data[0].id);
    })();
  }, []);

  const loadViews = async () => {
    if (!selectedCondo) return;
    setLoading(true);
    try {
      const [visitsRes, parcelsRes, logbookRes] = await Promise.all([
        supabase
          .from('visitor_logs')
          .select('id, unit_id, visitor_name, visitor_rut, vehicle_plate, parking_spot, entry_time, registered_by, status, notes, units(unit_number)')
          .eq('condominium_id', selectedCondo)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('parcels')
          .select('id, unit_id, carrier, tracking_number, package_type, pickup_pin, received_at, received_by, picked_up_at, picked_up_by_name, status, units(unit_number)')
          .eq('condominium_id', selectedCondo)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('concierge_logbook')
          .select('id, unit_id, owner_id, base_aliquot_amount, reserve_fund_amount, individual_charges_amount, previous_debt_amount, interest_amount, total_amount, paid_amount, balance, status, units(unit_number), periods(period_name, due_date)')
          .eq('condominium_id', selectedCondo)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
      ]);
      if (visitsRes.error) showError(visitsRes.error.message); else setVisits(visitsRes.data || []);
      if (parcelsRes.error) showError(parcelsRes.error.message); else setParcels(parcelsRes.data || []);
      if (logbookRes.error) showError(logbookRes.error.message); else setLogs(logbookRes.data || []);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const tabStyle = (active) => ({ padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: active ? 'var(--primary)' : 'transparent', color: active ? '#fff' : 'var(--text-secondary)', borderRadius: 'var(--radius-md)' });

  return (
    <div style={{ marginTop: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>Conserjería y Accesos</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Visitas, paquetes y bitácora de guardia.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button style={tabStyle(tab === 'visitas')} onClick={() => setTab('visitas')}>Visitas</button>
        <button style={tabStyle(tab === 'paquetes')} onClick={() => setTab('paquetes')}>Paquetes</button>
        <button style={tabStyle(tab === 'libro')} onClick={() => setTab('libro')}>Bitácora</button>
      </div>

      {loading && <p style={{ color: 'var(--text-dim)' }}>Cargando…</p>}

      {tab === 'visitas' && (
        <div>
          {canManage && (
            <form onSubmit={handleCreateVisit} style={{ ...styles.form, marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input placeholder="Unidad" value={visitForm.unit_id} onChange={e => setVisitForm({ ...visitForm, unit_id: e.target.value })} style={styles.input} required />
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
              <button type="submit" disabled={savingVisit} style={{ ...styles.button, marginTop: '10px' }}>{savingVisit ? 'Registrando…' : 'Registrar visita'}</button>
            </form>
          )}
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
        </div>
      )}

      {tab === 'paquetes' && (
        <div>
          {canManage && (
            <form onSubmit={handleCreatePkg} style={{ ...styles.form, marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select value={pkgForm.unit_id} onChange={e => setPkgForm({ ...pkgForm, unit_id: e.target.value })} style={styles.select} required>
                  <option value="">Selecciona unidad</option>
                  {condominiums.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              <button type="submit" disabled={savingPkg} style={{ ...styles.button, marginTop: '10px' }}>{savingPkg ? 'Registrando…' : 'Registrar paquete'}</button>
            </form>
          )}
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
        </div>
      )}

      {tab === 'libro' && (
        <div>
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
              <button type="submit" disabled={savingLog} style={{ ...styles.button, marginTop: '10px' }}>{savingLog ? 'Registrando…' : 'Registrar novedad'}</button>
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
    </div>
  );
}