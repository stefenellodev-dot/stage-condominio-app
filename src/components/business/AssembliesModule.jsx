import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';
import { usePermissions } from '../../hooks/usePermissions';

const ASSEMBLY_TYPES = ['ordinaria', 'extraordinaria_absoluta', 'extraordinaria_reforzada'];
const MODALITIES = ['presencial', 'telemática', 'hybrid'];

export default function AssembliesModule() {
  const { isSuperadmin, isAdmin, profile } = useAuth();
  const { canCreate, canEdit } = usePermissions('assemblies');
  const canManage = canCreate || canEdit;
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const [tab, setTab] = useState('asambleas');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [condominiums, setCondominiums] = useState([]);
  const [selectedCondo, setSelectedCondo] = useState('');
  const [assemblies, setAssemblies] = useState([]);
  const [selectedAssembly, setSelectedAssembly] = useState('');
  const [asmView, setAsmView] = useState('list');
  const [topics, setTopics] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form asamblea
  const [asmForm, setAsmForm] = useState({
    title: '', assembly_type: 'ordinaria', modality: 'hybrid',
    scheduled_date: '', first_call_time: '19:00', second_call_time: '19:30',
    video_conference_url: '', location: '',
  });
  const [savingAsm, setSavingAsm] = useState(false);

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
      setSelectedAssembly('');
      if (data && data.length) setSelectedCondo(data[0].id);
      else setSelectedCondo('');
    })();
  }, [selectedCompany]);

  useEffect(() => {
    if (!selectedCondo) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('assemblies')
        .select('id, title, assembly_type, modality, scheduled_date, first_call_time, second_call_time, video_conference_url, location, status, current_attendance_aliquot, is_quorum_reached, minutes_text')
        .eq('condominium_id', selectedCondo)
        .is('deleted_at', null)
        .order('scheduled_date', { ascending: false });
      if (error) showError(error.message); else setAssemblies(data || []);
      setLoading(false);
      // Auto-select first assembly if available
      if (data && data.length) setSelectedAssembly(data[0].id);
    })();
  }, [selectedCondo]);

  useEffect(() => {
    if (!selectedAssembly) { setTopics([]); setAttendees([]); return; }
    (async () => {
      const { data: t } = await supabase
        .from('assembly_topics')
        .select('id, order_index, title, description, required_majority, status, votes_in_favor_aliquot, votes_against_aliquot, votes_abstention_aliquot, is_approved')
        .eq('assembly_id', selectedAssembly)
        .order('order_index');
      setTopics(t || []);
      const { data: a } = await supabase
        .from('assembly_attendees')
        .select('id, unit_id, user_id, attendee_type, aliquot_represented, check_in_time, is_verified, units(unit_number), profiles(full_name, email)')
        .eq('assembly_id', selectedAssembly)
        .order('check_in_time');
      setAttendees(a || []);
    })();
  }, [selectedAssembly]);

  const handleCreateAssembly = async (e) => {
    e.preventDefault();
    if (!asmForm.title.trim() || !asmForm.scheduled_date) { showError('Título y fecha son obligatorios'); return; }
    setSavingAsm(true);
    const { error } = await supabase.from('assemblies').insert({
      condominium_id: selectedCondo,
      title: asmForm.title.trim(),
      assembly_type: asmForm.assembly_type,
      modality: asmForm.modality,
      scheduled_date: asmForm.scheduled_date,
      first_call_time: asmForm.first_call_time,
      second_call_time: asmForm.second_call_time,
      video_conference_url: asmForm.video_conference_url.trim() || null,
      location: asmForm.location.trim() || null,
      status: 'scheduled',
    });
    setSavingAsm(false);
    if (error) { showError(error.message); return; }
    showSuccess('Asamblea creada');
    setAsmForm({ title: '', assembly_type: 'ordinaria', modality: 'hybrid', scheduled_date: '', first_call_time: '19:00', second_call_time: '19:30', video_conference_url: '', location: '' });
    // reload
    const { data } = await supabase.from('assemblies').select('id, title, assembly_type, modality, scheduled_date, first_call_time, second_call_time, video_conference_url, location, status, current_attendance_aliquot, is_quorum_reached, minutes_text').eq('condominium_id', selectedCondo).is('deleted_at', null).order('scheduled_date', { ascending: false });
    setAssemblies(data || []);
  };

  const handleCheckIn = async (assemblyId, unitId, userId, aliquot) => {
    const { error } = await supabase.from('assembly_attendees').insert({
      assembly_id: assemblyId,
      unit_id: unitId,
      user_id: userId,
      attendee_type: 'owner',
      aliquot_represented: aliquot,
    });
    if (error) showError(error.message); else { showSuccess('Acreditado'); setSelectedAssembly(assemblyId); }
  };

  const handleVote = async (topicId, unitId, userId, aliquot, vote) => {
    const { error } = await supabase.from('assembly_votes').insert({
      topic_id: topicId,
      unit_id: unitId,
      user_id: userId,
      vote,
      aliquot_weight: aliquot,
    });
    if (error) showError(error.message); else showSuccess('Voto registrado');
  };

  const tabStyle = (active) => ({
    padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    background: active ? 'var(--primary)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    borderRadius: 'var(--radius-md)',
  });

  const selectedAsm = assemblies.find(a => a.id === selectedAssembly);

  return (
    <div style={{ marginTop: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>Asambleas y Votaciones</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Convocatoria, quórum, votación y actas (Ley 21.442).</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTab('asambleas')}
            style={tab === 'asambleas' ? { padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' } : { padding: '4px 10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}
          >
            Asambleas
          </button>
          <button
            onClick={() => setTab('asistencia')}
            style={tab === 'asistencia' ? { padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' } : { padding: '4px 10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}
          >
            Asistencia
          </button>
          <button
            onClick={() => setTab('votacion')}
            style={tab === 'votacion' ? { padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' } : { padding: '4px 10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}
          >
            Votación
          </button>
          <button
            onClick={() => setTab('acta')}
            style={tab === 'acta' ? { padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' } : { padding: '4px 10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}
          >
            Acta
          </button>
        </div>
      </div>

      <div style={{ ...styles.sectionBox, marginBottom: '14px' }}>
        <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>Filtrar</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
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

      {tab === 'asambleas' && (
        <div>
          {canManage && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
              {asmView === 'list' ? (
                <button onClick={() => setAsmView('form')} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Nueva asamblea</button>
              ) : (
                <button onClick={() => setAsmView('list')} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Volver a la lista</button>
              )}
            </div>
          )}
          {asmView === 'form' && canManage && (
            <form onSubmit={handleCreateAssembly} style={{ ...styles.form, marginBottom: '16px' }}>
              <section style={styles.sectionBox}>
                <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>Registrar asamblea</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input placeholder="Título de la asamblea" value={asmForm.title} onChange={e => setAsmForm({ ...asmForm, title: e.target.value })} style={styles.input} required />
                  <select value={asmForm.assembly_type} onChange={e => setAsmForm({ ...asmForm, assembly_type: e.target.value })} style={styles.select}>
                    <option value="ordinaria">Ordinaria</option>
                    <option value="extraordinaria">Extraordinaria</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <input type="date" value={asmForm.scheduled_date} onChange={e => setAsmForm({ ...asmForm, scheduled_date: e.target.value })} style={styles.input} required />
                  <input placeholder="Primera citación (HH:MM)" value={asmForm.first_call_time} onChange={e => setAsmForm({ ...asmForm, first_call_time: e.target.value })} style={styles.input} />
                  <input placeholder="Segunda citación (HH:MM)" value={asmForm.second_call_time} onChange={e => setAsmForm({ ...asmForm, second_call_time: e.target.value })} style={styles.input} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <input placeholder="Enlace telemático (Zoom/Meet)" value={asmForm.video_conference_url} onChange={e => setAsmForm({ ...asmForm, video_conference_url: e.target.value })} style={styles.input} />
                  <input placeholder="Lugar" value={asmForm.location} onChange={e => setAsmForm({ ...asmForm, location: e.target.value })} style={styles.input} />
                </div>
              </section>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={savingAsm} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>{savingAsm ? 'Guardando…' : 'Crear'}</button>
              <button type="button" onClick={() => setAsmView('list')} style={{ padding: '4px 10px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Cancelar</button>
            </div>
            </form>
          )}
          {asmView === 'list' && (
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '600px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Título</th><th style={styles.th}>Tipo</th><th style={styles.th}>Fecha</th><th style={styles.th}>Quórum</th><th style={styles.th}>Estado</th>
              </tr></thead>
              <tbody>
                {assemblies.length === 0 ? (
                  <tr><td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin asambleas registradas.</td></tr>
                ) : assemblies.map(a => (
                  <tr key={a.id} style={styles.tr}>
                    <td style={styles.td}>{a.title}</td>
                    <td style={styles.td}>{a.assembly_type}</td>
                    <td style={styles.td}>{a.scheduled_date}</td>
                    <td style={styles.td}>{a.current_attendance_aliquot}% {a.is_quorum_reached ? '✅' : '❌'}</td>
                    <td style={styles.td}>{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {tab === 'asistencia' && selectedAssembly && (
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Asistentes acreditados: {attendees.length} (quórum {selectedAsm?.current_attendance_aliquot}%)</p>
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '600px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Unidad</th><th style={styles.th}>Asistente</th><th style={styles.th}>Tipo</th><th style={styles.th}>Alícuota</th><th style={styles.th}>Hora check-in</th>
              </tr></thead>
              <tbody>
                {attendees.length === 0 ? (
                  <tr><td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin asistentes acreditados.</td></tr>
                ) : attendees.map(a => (
                  <tr key={a.id} style={styles.tr}>
                    <td style={styles.td}>{a.units?.unit_number}</td>
                    <td style={styles.td}>{a.profiles?.full_name || a.profiles?.email}</td>
                    <td style={styles.td}>{a.attendee_type}</td>
                    <td style={styles.td}>{a.aliquot_represented}%</td>
                    <td style={styles.td}>{new Date(a.check_in_time).toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'votacion' && selectedAssembly && (
        <div>
          {topics.length === 0 ? (
            <p style={{ color: 'var(--text-dim)' }}>Sin mociones registradas.</p>
          ) : topics.map(topic => (
            <div key={topic.id} style={{ ...styles.sectionBox, marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 8px' }}>{topic.order_index}. {topic.title}</h4>
              {topic.description && <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontSize: '13px' }}>{topic.description}</p>}
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', marginBottom: '8px' }}>
                <span>A favor: <strong>{topic.votes_in_favor_aliquot}%</strong></span>
                <span>En contra: <strong>{topic.votes_against_aliquot}%</strong></span>
                <span>Abstención: <strong>{topic.votes_abstention_aliquot}%</strong></span>
                <span>Veredicto: <strong>{topic.is_approved === null ? 'Pendiente' : topic.is_approved ? '✅ Aprobada' : '❌ Rechazada'}</strong></span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Mayoría requerida: {topic.required_majority}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'acta' && selectedAssembly && (
        <div>
          {selectedAsm?.minutes_text ? (
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: 1.6 }}>{selectedAsm.minutes_text}</pre>
          ) : (
            <p style={{ color: 'var(--text-dim)' }}>Acta no generada aún.</p>
          )}
        </div>
      )}

    </div>
  );
}
