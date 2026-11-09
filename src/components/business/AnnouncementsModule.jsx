import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { ROLES } from '../../constants/roles';
import { styles } from '../../styles/theme';

export default function AnnouncementsModule() {
  const { profile, isAdmin, isSuperadmin } = useAuth();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState('circulares');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [condos, setCondos] = useState([]);
  const [selectedCondo, setSelectedCondo] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [emergencyPlan, setEmergencyPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: '', content: '', category: 'administrativo', priority: 'normal', requires_acknowledgement: true });
  const [broadcastForm, setBroadcastForm] = useState({ alert_type: 'incendio', severity: 'critical', title: '', instructions: '' });
  const [saving, setSaving] = useState(false);

  const canCreate = isAdmin || isSuperadmin;
  const canBroadcast = isAdmin || isSuperadmin || profile?.role === ROLES.CONCIERGE;

  useEffect(() => {
    (async () => {
      // For admin/superadmin: load companies. For regular users: load their condo directly.
      const isPrivileged = isAdmin || isSuperadmin || profile?.role === ROLES.CONCIERGE;
      if (isPrivileged) {
        const { data } = await supabase.from('management_companies').select('id, legal_name, fantasy_name').is('deleted_at', null).order('legal_name');
        setCompanies(data || []);
        if (data && data.length) setSelectedCompany(data[0].id);
      } else {
        // Regular user: find their condominium via units or profile
        let condoId = profile?.condominium_id;
        if (!condoId) {
          const { data: units } = await supabase.from('units').select('condominium_id').eq('owner_id', profile.id).limit(1);
          if (units && units.length) condoId = units[0].condominium_id;
        }
        if (condoId) {
          const { data: condo } = await supabase.from('condominiums').select('id, name, rut, management_company_id').eq('id', condoId).is('deleted_at', null).single();
          if (condo) {
            setCondos([condo]);
            setSelectedCondo(condo.id);
            // Try to set company
            if (condo.management_company_id) {
              const { data: comp } = await supabase.from('management_companies').select('id, legal_name, fantasy_name').eq('id', condo.management_company_id).single();
              if (comp) { setCompanies([comp]); setSelectedCompany(comp.id); }
            }
          }
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedCompany || (isAdmin || isSuperadmin || profile?.role === ROLES.CONCIERGE)) return;
    // Already handled above for regular users
  }, [selectedCompany]);

  useEffect(() => {
    if (!selectedCompany) return;
    if (isAdmin || isSuperadmin || profile?.role === ROLES.CONCIERGE) {
      (async () => {
        const { data } = await supabase.from('condominiums').select('id, name, rut, management_company_id').eq('management_company_id', selectedCompany).is('deleted_at', null).order('name');
        setCondos(data || []);
        if (data && data.length && !selectedCondo) setSelectedCondo(data[0].id);
      })();
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedCondo) {
      loadAnnouncements();
      loadEmergencyPlan();
    }
  }, [selectedCondo]);

  const loadCondos = async () => {};

  const loadAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('community_announcements')
      .select('*, announcement_read_receipts(user_id, read_at)')
      .eq('condominium_id', selectedCondo)
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  const loadEmergencyPlan = async () => {
    const { data } = await supabase
      .from('emergency_plans')
      .select('*')
      .eq('condominium_id', selectedCondo)
      .eq('status', 'active')
      .maybeSingle();
    setEmergencyPlan(data);
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('community_announcements').insert({
      condominium_id: selectedCondo,
      title: newAnn.title,
      content: newAnn.content,
      category: newAnn.category,
      priority: newAnn.priority,
      requires_acknowledgement: newAnn.requires_acknowledgement,
      published_by: profile.id,
    });
    setSaving(false);
    if (error) { alert(error.message); return; }
    setShowNewForm(false);
    setNewAnn({ title: '', content: '', category: 'administrativo', priority: 'normal', requires_acknowledgement: true });
    loadAnnouncements();
  };

  const handleAcknowledge = async (announcementId) => {
    const { error } = await supabase.from('announcement_read_receipts').insert({
      announcement_id: announcementId,
      user_id: profile.id,
    });
    if (error) { alert(error.message); return; }
    loadAnnouncements();
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('emergency_broadcasts').insert({
      condominium_id: selectedCondo,
      alert_type: broadcastForm.alert_type,
      severity: broadcastForm.severity,
      title: broadcastForm.title,
      instructions: broadcastForm.instructions,
      triggered_by: profile.id,
    });
    setSaving(false);
    if (error) { alert(error.message); return; }
    setShowBroadcast(false);
    setBroadcastForm({ alert_type: 'incendio', severity: 'critical', title: '', instructions: '' });
  };

  const hasRead = (ann) => ann.announcement_read_receipts?.some(r => r.user_id === profile.id);

  const categoryColors = {
    corte_suministro: '#dc2626', mantencion: '#f59e0b', asamblea: '#3b82f6',
    convivencia: '#10b981', financiero: '#8b5cf6', seguridad: '#ef4444',
    administrativo: '#64748b', urgente: '#b91c1c',
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} style={styles.select}>
          {companies.map(c => <option key={c.id} value={c.id}>{c.fantasy_name || c.legal_name}</option>)}
        </select>
        <select value={selectedCondo} onChange={e => setSelectedCondo(e.target.value)} style={styles.select}>
          {condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setTab('circulares')} style={{ ...styles.buttonAction, backgroundColor: tab === 'circulares' ? 'var(--primary)' : 'var(--bg-surface)', color: tab === 'circulares' ? '#fff' : 'var(--text-main)' }}>📢 Circulares</button>
          <button onClick={() => setTab('emergencia')} style={{ ...styles.buttonAction, backgroundColor: tab === 'emergencia' ? 'var(--primary)' : 'var(--bg-surface)', color: tab === 'emergencia' ? '#fff' : 'var(--text-main)' }}>🚨 Plan de Emergencia</button>
        </div>
        {canCreate && tab === 'circulares' && (
          <button onClick={() => setShowNewForm(true)} style={{ ...styles.button, marginLeft: 'auto' }}>+ Nueva Circular</button>
        )}
        {canBroadcast && (
          <button onClick={() => setShowBroadcast(true)} style={{ ...styles.button, backgroundColor: '#dc2626', marginLeft: canCreate && tab === 'circulares' ? '0' : 'auto' }}>🚨 Emitir Alerta</button>
        )}
      </div>

      {tab === 'circulares' && (
        <div>
          {loading ? <div style={{ color: 'var(--text-dim)', padding: '24px', textAlign: 'center' }}>Cargando...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.length === 0 && <div style={{ color: 'var(--text-dim)', padding: '24px', textAlign: 'center' }}>Sin circulares publicadas.</div>}
              {announcements.map(a => (
                <div key={a.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: categoryColors[a.category] || 'var(--text-secondary)', marginRight: '8px' }}>{a.category.replace('_', ' ')}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{a.priority.toUpperCase()}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{new Date(a.published_at).toLocaleDateString('es-CL')}</span>
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: 'var(--text-main)' }}>{a.title}</h3>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{a.content}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {a.requires_acknowledgement && (
                        <span>{a.announcement_read_receipts?.length || 0} lecturas confirmadas</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {a.attachment_url && (
                        <button style={styles.buttonAction} onClick={() => alert('Descarga: ' + a.attachment_url)}>📎 Adjunto</button>
                      )}
                      {a.requires_acknowledgement && !hasRead(a) && profile?.role === ROLES.USER && (
                        <button onClick={() => handleAcknowledge(a.id)} style={{ ...styles.button, padding: '6px 12px', fontSize: '12px' }}>✓ Confirmar Lectura</button>
                      )}
                      {a.requires_acknowledgement && hasRead(a) && (
                        <span style={{ fontSize: '12px', color: 'var(--success-text)', fontWeight: '600' }}>✓ Leído</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'emergencia' && (
        <div>
          {!emergencyPlan ? (
            <div style={{ color: 'var(--text-dim)', padding: '24px', textAlign: 'center' }}>Sin plan de emergencia activo.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <h3 style={{ margin: '0 0 12px', color: 'var(--text-main)' }}>📋 Plan de Emergencia — {emergencyPlan.version}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Vigencia:</strong> {emergencyPlan.valid_year}</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Aprobación:</strong> {emergencyPlan.approval_date}</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Folio Bomberos:</strong> {emergencyPlan.bomberos_approval_folio}</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Unidad Bomberos:</strong> {emergencyPlan.bomberos_unit}</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Folio Carabineros:</strong> {emergencyPlan.carabineros_approval_folio}</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Unidad Carabineros:</strong> {emergencyPlan.carabineros_unit}</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Próximo Simulacro:</strong> {emergencyPlan.next_drill_deadline}</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Último Simulacro:</strong> {emergencyPlan.last_drill_date || 'N/A'}</div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <h3 style={{ margin: '0 0 12px', color: 'var(--text-main)' }}>🔧 Estado de Infraestructura</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                  {Object.entries(emergencyPlan.equipment_status || {}).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{k.replace(/_/g, ' ')}</span>
                      <span style={{ fontWeight: '600', color: v.includes('operativ') ? 'var(--success-text)' : 'var(--warning-text)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <h3 style={{ margin: '0 0 12px', color: 'var(--text-main)' }}>📞 Contactos de Emergencia</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(emergencyPlan.emergency_contacts || []).map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-main)' }}>{c.entity}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Prioridad {c.priority}</div>
                      </div>
                      <a href={`tel:${c.phone}`} style={{ ...styles.buttonAction, textDecoration: 'none', backgroundColor: 'var(--success)', color: '#fff' }}>📞 {c.phone}</a>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <h3 style={{ margin: '0 0 12px', color: 'var(--text-main)' }}>📍 Puntos de Encuentro</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(emergencyPlan.assembly_points || []).map((p, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                      <strong style={{ color: 'var(--text-main)' }}>{p.zone}</strong>
                      <div style={{ color: 'var(--text-secondary)' }}>{p.location}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Capacidad: {p.capacity}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Nueva Circular */}
      {showNewForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', padding: '20px', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', color: 'var(--text-main)' }}>Nueva Circular</h3>
            <form onSubmit={handleCreateAnnouncement}>
              <input placeholder="Título" value={newAnn.title} onChange={e => setNewAnn({ ...newAnn, title: e.target.value })} style={{ ...styles.input, marginBottom: '8px' }} required />
              <textarea placeholder="Contenido" value={newAnn.content} onChange={e => setNewAnn({ ...newAnn, content: e.target.value })} style={{ ...styles.input, minHeight: '100px', marginBottom: '8px' }} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <select value={newAnn.category} onChange={e => setNewAnn({ ...newAnn, category: e.target.value })} style={styles.select}>
                  <option value="administrativo">Administrativo</option>
                  <option value="mantencion">Mantención</option>
                  <option value="corte_suministro">Corte de Suministro</option>
                  <option value="convivencia">Convivencia</option>
                  <option value="financiero">Financiero</option>
                  <option value="seguridad">Seguridad</option>
                  <option value="asamblea">Asamblea</option>
                  <option value="urgente">Urgente</option>
                </select>
                <select value={newAnn.priority} onChange={e => setNewAnn({ ...newAnn, priority: e.target.value })} style={styles.select}>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={newAnn.requires_acknowledgement} onChange={e => setNewAnn({ ...newAnn, requires_acknowledgement: e.target.checked })} />
                Requiere acuse de recibo
              </label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowNewForm(false)} style={styles.buttonAction}>Cancelar</button>
                <button type="submit" disabled={saving} style={styles.button}>{saving ? 'Publicando...' : 'Publicar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Broadcast Emergencia */}
      {showBroadcast && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '100%', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', color: '#dc2626' }}>🚨 Emitir Alerta de Emergencia</h3>
            <form onSubmit={handleBroadcast}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <select value={broadcastForm.alert_type} onChange={e => setBroadcastForm({ ...broadcastForm, alert_type: e.target.value })} style={styles.select}>
                  <option value="incendio">Incendio</option>
                  <option value="fuga_gas">Fuga de Gas</option>
                  <option value="sismo">Sismo</option>
                  <option value="falla_ascensor_atrapamiento">Ascensor Atrapado</option>
                  <option value="corte_electrico">Corte Eléctrico</option>
                  <option value="inundacion">Inundación</option>
                  <option value="amenaza_seguridad">Amenaza de Seguridad</option>
                  <option value="otro">Otro</option>
                </select>
                <select value={broadcastForm.severity} onChange={e => setBroadcastForm({ ...broadcastForm, severity: e.target.value })} style={styles.select}>
                  <option value="warning">Advertencia</option>
                  <option value="critical">Crítica</option>
                  <option value="evacuate">Evacuación</option>
                </select>
              </div>
              <input placeholder="Título de la alerta" value={broadcastForm.title} onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })} style={{ ...styles.input, marginBottom: '8px' }} required />
              <textarea placeholder="Instrucciones para la comunidad" value={broadcastForm.instructions} onChange={e => setBroadcastForm({ ...broadcastForm, instructions: e.target.value })} style={{ ...styles.input, minHeight: '80px', marginBottom: '12px' }} required />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowBroadcast(false)} style={styles.buttonAction}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ ...styles.button, backgroundColor: '#dc2626' }}>{saving ? 'Enviando...' : '🚨 Enviar Alerta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
