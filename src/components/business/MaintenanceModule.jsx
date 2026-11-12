import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';
import { usePermissions } from '../../hooks/usePermissions';
import { storageService } from '../../services/storageService';

const CATEGORIES = ['transporte_vertical', 'gas_calderas', 'red_humeda_seca', 'sala_bombas', 'grupo_electrogeno', 'portones_accesos', 'seguridad_cctv'];
const CRITICALITY = ['critica', 'alta', 'media', 'baja'];
const STATUS_OPTIONS = ['operational', 'warning', 'out_of_service'];
const CERT_TYPES = ['sello_minvu_ascensores', 'sello_verde_sec_gas', 'certificado_estanques_salud', 'red_incendio_bomberos', 'certificacion_extintores'];
const SEAL_RESULTS = ['verde_aprobado', 'amarillo_observado', 'rojo_rechazado'];
const MAINT_TYPES = ['preventiva', 'correctiva', 'emergencia', 'inspeccion_legal'];
const OP_STATUS = ['operativo', 'operativo_observado', 'fuera_servicio'];

const fmtCLP = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

const sealColor = (s) => s === 'verde_aprobado' ? 'var(--success-text)' : s === 'amarillo_observado' ? 'var(--warning-text)' : 'var(--danger-text)';
const statusColor = (s) => s === 'active' ? 'var(--success-text)' : s === 'warning_expiring' ? 'var(--warning-text)' : 'var(--danger-text)';

export default function MaintenanceModule() {
  const { isSuperadmin, isAdmin } = useAuth();
  const { can } = usePermissions('maintenance');
  const canManage = can('create_asset') || can('create_cert') || can('create_log');
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const [tab, setTab] = useState('activos');
  const [logView, setLogView] = useState('list');
  const [certView, setCertView] = useState('list');
  const [assetView, setAssetView] = useState('list');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [condominiums, setCondominiums] = useState([]);
  const [selectedCondo, setSelectedCondo] = useState('');
  const [assets, setAssets] = useState([]);
  const [certs, setCerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form activo
  const [assetForm, setAssetForm] = useState({ name: '', category: 'transporte_vertical', brand: '', model: '', serial_number: '', location: '', maintenance_frequency_days: 30, criticality_level: 'alta', status: 'operational' });
  const [savingAsset, setSavingAsset] = useState(false);

  // Form certificación
  const [certForm, setCertForm] = useState({ asset_id: '', certification_type: 'sello_minvu_ascensores', certificate_number: '', issuing_entity: '', certifying_company_name: '', certifying_company_rut: '', inspector_name: '', inspection_date: '', expiration_date: '', seal_result: 'verde_aprobado', observations: '', document_url: '' });
  const [certFile, setCertFile] = useState(null);
  const [savingCert, setSavingCert] = useState(false);

  // Form bitácora
  const [logForm, setLogForm] = useState({ asset_id: '', maintenance_type: 'preventiva', service_date: '', technician_name: '', provider_name: '', provider_rut: '', work_order_number: '', cost_amount: 0, tasks_performed: '', parts_replaced: '', operational_status_after: 'operativo', report_document_url: '' });
  const [savingLog, setSavingLog] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: companiesData } = await supabase.from('management_companies').select('id,legal_name,fantasy_name').is('deleted_at', null).order('legal_name');
      setCompanies(companiesData || []);
      if (companiesData && companiesData.length) setSelectedCompany(companiesData[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!selectedCompany) return;
    (async () => {
      const { data } = await supabase.from('condominiums').select('id,name,management_company_id').eq('management_company_id', selectedCompany).is('deleted_at', null).order('name');
      setCondominiums(data || []);
      if (data && data.length) setSelectedCondo(data[0].id);
    })();
  }, [selectedCompany]);

  const loadAssets = async () => {
    if (!selectedCondo) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('equipment_assets')
      .select('id, name, category, brand, model, serial_number, location, maintenance_frequency_days, criticality_level, status, created_at')
      .eq('condominium_id', selectedCondo)
      .is('deleted_at', null)
      .order('name');
    if (error) showError(error.message); else setAssets(data || []);
    setLoading(false);
  };

  const loadCerts = async () => {
    if (!selectedCondo) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('official_certifications')
      .select('id, asset_id, certification_type, certificate_number, issuing_entity, certifying_company_name, certifying_company_rut, inspector_name, inspection_date, expiration_date, seal_result, observations, document_url, status, equipment_assets(name)')
      .eq('condominium_id', selectedCondo)
      .is('deleted_at', null)
      .order('expiration_date');
    if (error) showError(error.message); else setCerts(data || []);
    setLoading(false);
  };

  const loadLogs = async () => {
    if (!selectedCondo) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('maintenance_logs')
      .select('id, asset_id, maintenance_type, service_date, technician_name, provider_name, provider_rut, work_order_number, cost_amount, tasks_performed, parts_replaced, operational_status_after, report_document_url, equipment_assets(name)')
      .eq('condominium_id', selectedCondo)
      .is('deleted_at', null)
      .order('service_date', { ascending: false });
    if (error) showError(error.message); else setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { if (tab === 'activos') loadAssets(); }, [tab, selectedCondo]);
  useEffect(() => { if (tab === 'certificaciones') loadCerts(); }, [tab, selectedCondo]);
  useEffect(() => { if (tab === 'bitacora') loadLogs(); }, [tab, selectedCondo]);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!assetForm.name.trim() || !assetForm.location.trim()) { showError('Nombre y ubicación son obligatorios'); return; }
    setSavingAsset(true);
    const { error } = await supabase.from('equipment_assets').insert({
      condominium_id: selectedCondo,
      name: assetForm.name.trim(),
      category: assetForm.category,
      brand: assetForm.brand.trim() || null,
      model: assetForm.model.trim() || null,
      serial_number: assetForm.serial_number.trim() || null,
      location: assetForm.location.trim(),
      maintenance_frequency_days: parseInt(assetForm.maintenance_frequency_days, 10) || 30,
      criticality_level: assetForm.criticality_level,
      status: assetForm.status,
    });
    setSavingAsset(false);
    if (error) { showError(error.message); return; }
    showSuccess('Activo registrado');
    setAssetForm({ name: '', category: 'transporte_vertical', brand: '', model: '', serial_number: '', location: '', maintenance_frequency_days: 30, criticality_level: 'alta', status: 'operational' });
    loadAssets();
  };

  const handleCreateCert = async (e) => {
    e.preventDefault();
    if (!certForm.certificate_number.trim() || !certForm.inspection_date || !certForm.expiration_date) { showError('Folio, fecha de inspección y vencimiento son obligatorios'); return; }
    setSavingCert(true);

    let documentPath = certForm.document_url.trim() || null;
    if (certFile) {
      try {
        documentPath = await storageService.uploadTechnicalCertification({
          condominiumId: selectedCondo,
          assetId: certForm.asset_id || 'general',
          certType: certForm.certification_type,
          folio: certForm.certificate_number.trim(),
          file: certFile,
        });
      } catch (err) {
        setSavingCert(false);
        showError(err.message || 'Error al subir el documento.');
        return;
      }
    }

    const { error } = await supabase.from('official_certifications').insert({
      condominium_id: selectedCondo,
      asset_id: certForm.asset_id || null,
      certification_type: certForm.certification_type,
      certificate_number: certForm.certificate_number.trim(),
      issuing_entity: certForm.issuing_entity.trim(),
      certifying_company_name: certForm.certifying_company_name.trim(),
      certifying_company_rut: certForm.certifying_company_rut.trim(),
      inspector_name: certForm.inspector_name.trim() || null,
      inspection_date: certForm.inspection_date,
      expiration_date: certForm.expiration_date,
      seal_result: certForm.seal_result,
      observations: certForm.observations.trim() || null,
      document_url: documentPath,
    });
    setSavingCert(false);
    if (error) { showError(error.message); return; }
    showSuccess('Certificación registrada');
    setCertForm({ asset_id: '', certification_type: 'sello_minvu_ascensores', certificate_number: '', issuing_entity: '', certifying_company_name: '', certifying_company_rut: '', inspector_name: '', inspection_date: '', expiration_date: '', seal_result: 'verde_aprobado', observations: '', document_url: '' });
    setCertFile(null);
    loadCerts();
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    if (!logForm.asset_id || !logForm.technician_name.trim() || !logForm.provider_name.trim() || !logForm.tasks_performed.trim()) { showError('Activo, técnico, proveedor y tareas son obligatorios'); return; }
    setSavingLog(true);
    const { error } = await supabase.from('maintenance_logs').insert({
      condominium_id: selectedCondo,
      asset_id: logForm.asset_id,
      maintenance_type: logForm.maintenance_type,
      service_date: logForm.service_date || new Date().toISOString().slice(0, 10),
      technician_name: logForm.technician_name.trim(),
      provider_name: logForm.provider_name.trim(),
      provider_rut: logForm.provider_rut.trim() || null,
      work_order_number: logForm.work_order_number.trim() || null,
      cost_amount: parseInt(logForm.cost_amount, 10) || 0,
      tasks_performed: logForm.tasks_performed.trim(),
      parts_replaced: logForm.parts_replaced.trim() || null,
      operational_status_after: logForm.operational_status_after,
      report_document_url: logForm.report_document_url.trim() || null,
    });
    setSavingLog(false);
    if (error) { showError(error.message); return; }
    showSuccess('Mantención registrada');
    setLogForm({ asset_id: '', maintenance_type: 'preventiva', service_date: '', technician_name: '', provider_name: '', provider_rut: '', work_order_number: '', cost_amount: 0, tasks_performed: '', parts_replaced: '', operational_status_after: 'operativo', report_document_url: '' });
    loadLogs();
  };

  const tabStyle = (active) => ({
    padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    background: active ? 'var(--primary)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    borderRadius: 'var(--radius-md)',
  });

  // Certificaciones por vencer o vencidas (para badge de alerta)
  const alertCerts = certs.filter(c => c.status === 'warning_expiring' || c.status === 'expired');

  return (
    <div style={{ marginTop: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>Mantenciones y Certificaciones</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Equipamiento crítico, sellos oficiales y bitácora técnica (Ley 21.442).</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {alertCerts.length > 0 && (
            <span style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', color: 'var(--danger-text)', fontSize: '12px', fontWeight: 700 }}>
              ⚠️ {alertCerts.length} certificación(es) por vencer o vencida(s)
            </span>
          )}
          <button
            onClick={() => setTab('activos')}
            style={tab === 'activos' ? { padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' } : { padding: '4px 10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}
          >
            Activos
          </button>
          <button
            onClick={() => setTab('certificaciones')}
            style={tab === 'certificaciones' ? { padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' } : { padding: '4px 10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}
          >
            Certificaciones
          </button>
          <button
            onClick={() => setTab('bitacora')}
            style={tab === 'bitacora' ? { padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' } : { padding: '4px 10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}
          >
            Bitácora
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

      {tab === 'activos' && (
        <div>
          {canManage && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
              {assetView === 'list' ? (
                <button onClick={() => setAssetView('form')} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Nuevo Activo</button>
              ) : (
                <button onClick={() => setAssetView('list')} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Volver a la lista</button>
              )}
            </div>
          )}
          {assetView === 'form' && canManage && (
            <form onSubmit={handleCreateAsset} style={{ ...styles.form, marginBottom: '16px' }}>
              <section style={styles.sectionBox}>
                <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>Registrar activo</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input placeholder="Nombre del activo" value={assetForm.name} onChange={e => setAssetForm({ ...assetForm, name: e.target.value })} style={styles.input} required />
                  <select value={assetForm.category} onChange={e => setAssetForm({ ...assetForm, category: e.target.value })} style={styles.select}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <input placeholder="Marca" value={assetForm.brand} onChange={e => setAssetForm({ ...assetForm, brand: e.target.value })} style={styles.input} />
                  <input placeholder="Modelo" value={assetForm.model} onChange={e => setAssetForm({ ...assetForm, model: e.target.value })} style={styles.input} />
                  <input placeholder="N° serie" value={assetForm.serial_number} onChange={e => setAssetForm({ ...assetForm, serial_number: e.target.value })} style={styles.input} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <input placeholder="Ubicación" value={assetForm.location} onChange={e => setAssetForm({ ...assetForm, location: e.target.value })} style={styles.input} required />
                  <input placeholder="Frecuencia (días)" type="number" value={assetForm.maintenance_frequency_days} onChange={e => setAssetForm({ ...assetForm, maintenance_frequency_days: e.target.value })} style={styles.input} />
                  <select value={assetForm.criticality_level} onChange={e => setAssetForm({ ...assetForm, criticality_level: e.target.value })} style={styles.select}>
                    {CRITICALITY.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </section>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={savingAsset} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>{savingAsset ? 'Guardando…' : 'Crear'}</button>
              <button type="button" onClick={() => setAssetView('list')} style={{ padding: '4px 10px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Cancelar</button>
            </div>
            </form>
          )}
          {assetView === 'list' && (
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '700px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Activo</th><th style={styles.th}>Categoría</th><th style={styles.th}>Marca/Modelo</th><th style={styles.th}>Ubicación</th><th style={styles.th}>Criticidad</th><th style={styles.th}>Estado</th>
              </tr></thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr><td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin activos registrados.</td></tr>
                ) : assets.map(a => (
                  <tr key={a.id} style={styles.tr}>
                    <td style={styles.td}>{a.name}</td>
                    <td style={styles.td}>{a.category}</td>
                    <td style={styles.td}>{a.brand || '—'} {a.model || ''}</td>
                    <td style={styles.td}>{a.location}</td>
                    <td style={styles.td}>{a.criticality_level}</td>
                    <td style={styles.td}>{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {tab === 'certificaciones' && (
        <div>
          {canManage && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
              {certView === 'list' ? (
                <button onClick={() => setCertView('form')} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Nueva Certificación</button>
              ) : (
                <button onClick={() => setCertView('list')} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Volver a la lista</button>
              )}
            </div>
          )}
          {certView === 'form' && canManage && (
            <form onSubmit={handleCreateCert} style={{ ...styles.form, marginBottom: '16px' }}>
              <section style={styles.sectionBox}>
                <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>Registrar certificación</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <select value={certForm.asset_id} onChange={e => setCertForm({ ...certForm, asset_id: e.target.value })} style={styles.select}>
                    <option value="">Activo (opcional)</option>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <select value={certForm.certification_type} onChange={e => setCertForm({ ...certForm, certification_type: e.target.value })} style={styles.select}>
                    {CERT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <input placeholder="Nº certificado/folio" value={certForm.certificate_number} onChange={e => setCertForm({ ...certForm, certificate_number: e.target.value })} style={styles.input} required />
                  <input placeholder="Entidad emisora" value={certForm.issuing_entity} onChange={e => setCertForm({ ...certForm, issuing_entity: e.target.value })} style={styles.input} required />
                  <input placeholder="Empresa certificadora" value={certForm.certifying_company_name} onChange={e => setCertForm({ ...certForm, certifying_company_name: e.target.value })} style={styles.input} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <input placeholder="RUT certificadora" value={certForm.certifying_company_rut} onChange={e => setCertForm({ ...certForm, certifying_company_rut: e.target.value })} style={styles.input} required />
                  <input placeholder="Inspector" value={certForm.inspector_name} onChange={e => setCertForm({ ...certForm, inspector_name: e.target.value })} style={styles.input} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <input type="date" value={certForm.inspection_date} onChange={e => setCertForm({ ...certForm, inspection_date: e.target.value })} style={styles.input} required />
                  <input type="date" value={certForm.expiration_date} onChange={e => setCertForm({ ...certForm, expiration_date: e.target.value })} style={styles.input} required />
                  <select value={certForm.seal_result} onChange={e => setCertForm({ ...certForm, seal_result: e.target.value })} style={styles.select}>
                    {SEAL_RESULTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <input placeholder="Observaciones" value={certForm.observations} onChange={e => setCertForm({ ...certForm, observations: e.target.value })} style={styles.input} />
                </div>
                <div style={{ marginTop: '8px' }}>
                  <label style={styles.label}>Documento (PDF, JPG, PNG)</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setCertFile(e.target.files[0])} style={styles.input} />
                </div>
              </section>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={savingCert} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>{savingCert ? 'Guardando…' : 'Crear'}</button>
              <button type="button" onClick={() => setCertView('list')} style={{ padding: '4px 10px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Cancelar</button>
            </div>
            </form>
          )}
          {certView === 'list' && (
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '900px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Activo</th><th style={styles.th}>Tipo</th><th style={styles.th}>Folio</th><th style={styles.th}>Entidad</th><th style={styles.th}>Empresa certificadora</th><th style={styles.th}>Inspección</th><th style={styles.th}>Vencimiento</th><th style={styles.th}>Sello</th><th style={styles.th}>Estado</th><th style={styles.th}>Doc</th>
              </tr></thead>
              <tbody>
                {certs.length === 0 ? (
                  <tr><td colSpan="10" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin certificaciones registradas.</td></tr>
                ) : certs.map(c => (
                  <tr key={c.id} style={styles.tr}>
                    <td style={styles.td}>{c.equipment_assets?.name || '—'}</td>
                    <td style={styles.td}>{c.certification_type}</td>
                    <td style={styles.td}>{c.certificate_number}</td>
                    <td style={styles.td}>{c.issuing_entity}</td>
                    <td style={styles.td}>{c.certifying_company_name}</td>
                    <td style={styles.td}>{c.inspection_date}</td>
                    <td style={styles.td}>{c.expiration_date}</td>
                    <td style={{ ...styles.td, color: sealColor(c.seal_result) }}>{c.seal_result}</td>
                    <td style={{ ...styles.td, color: statusColor(c.status), fontWeight: 700 }}>{c.status}</td>
                    <td style={styles.td}>
                      {c.document_url ? (
                        <button
                          onClick={async () => {
                            try {
                              const url = await storageService.getSignedDownloadUrl('certificaciones', c.document_url);
                              window.open(url, '_blank');
                            } catch (err) {
                              showError(err.message);
                            }
                          }}
                          style={styles.buttonAction}
                        >
                          Ver doc
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {tab === 'bitacora' && (
        <div>
          {canManage && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
              <button onClick={() => setLogView('form')} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Nueva mantención</button>
            </div>
          )}
          {logView === 'form' && canManage && (
            <form onSubmit={handleCreateLog} style={{ ...styles.form, marginBottom: '16px' }}>
              <section style={styles.sectionBox}>
                <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>Registrar mantención</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <select value={logForm.asset_id} onChange={e => setLogForm({ ...logForm, asset_id: e.target.value })} style={styles.select} required>
                    <option value="">Selecciona activo</option>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <select value={logForm.maintenance_type} onChange={e => setLogForm({ ...logForm, maintenance_type: e.target.value })} style={styles.select}>
                    {MAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <input type="date" value={logForm.service_date} onChange={e => setLogForm({ ...logForm, service_date: e.target.value })} style={styles.input} />
                  <input placeholder="Técnico" value={logForm.technician_name} onChange={e => setLogForm({ ...logForm, technician_name: e.target.value })} style={styles.input} required />
                  <input placeholder="Proveedor" value={logForm.provider_name} onChange={e => setLogForm({ ...logForm, provider_name: e.target.value })} style={styles.input} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <input placeholder="RUT proveedor" value={logForm.provider_rut} onChange={e => setLogForm({ ...logForm, provider_rut: e.target.value })} style={styles.input} />
                  <input placeholder="Nº orden de trabajo" value={logForm.work_order_number} onChange={e => setLogForm({ ...logForm, work_order_number: e.target.value })} style={styles.input} />
                  <input placeholder="Costo CLP" type="number" value={logForm.cost_amount} onChange={e => setLogForm({ ...logForm, cost_amount: e.target.value })} style={styles.input} />
                </div>
                <div style={{ marginTop: '8px' }}>
                  <textarea placeholder="Tareas realizadas" value={logForm.tasks_performed} onChange={e => setLogForm({ ...logForm, tasks_performed: e.target.value })} style={{ ...styles.input, minHeight: '60px' }} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <input placeholder="Repuestos cambiados" value={logForm.parts_replaced} onChange={e => setLogForm({ ...logForm, parts_replaced: e.target.value })} style={styles.input} />
                  <select value={logForm.operational_status_after} onChange={e => setLogForm({ ...logForm, operational_status_after: e.target.value })} style={styles.select}>
                    {OP_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="submit" disabled={savingLog} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>{savingLog ? 'Guardando…' : 'Crear'}</button>
                  <button type="button" onClick={() => setLogView('list')} style={{ padding: '4px 10px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Cancelar</button>
                </div>
              </section>
            </form>
          )}
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '900px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Activo</th><th style={styles.th}>Tipo</th><th style={styles.th}>Fecha</th><th style={styles.th}>Técnico</th><th style={styles.th}>Proveedor</th><th style={styles.th}>Costo</th><th style={styles.th}>Estado post</th>
              </tr></thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin mantenciones registradas.</td></tr>
                ) : logs.map(l => (
                  <tr key={l.id} style={styles.tr}>
                    <td style={styles.td}>{l.equipment_assets?.name || '—'}</td>
                    <td style={styles.td}>{l.maintenance_type}</td>
                    <td style={styles.td}>{l.service_date}</td>
                    <td style={styles.td}>{l.technician_name}</td>
                    <td style={styles.td}>{l.provider_name}</td>
                    <td style={styles.td}>{fmtCLP(l.cost_amount)}</td>
                    <td style={styles.td}>{l.operational_status_after}</td>
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
