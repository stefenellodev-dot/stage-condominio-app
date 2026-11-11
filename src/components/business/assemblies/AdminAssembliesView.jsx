import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function AdminAssembliesView({ condominiumId }) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [assemblies, setAssemblies] = useState([]);
  const [selectedAssembly, setSelectedAssembly] = useState(null);
  const [motions, setMotions] = useState([]);
  const [newMotionTitle, setNewMotionTitle] = useState('');
  const [newMotionDesc, setNewMotionDesc] = useState('');

  const fetchAssemblies = async () => {
    if (!condominiumId) return;
    const { data: aData } = await supabase.from('assemblies').select('*').eq('condominium_id', condominiumId).order('first_call_at', { ascending: false });
    setAssemblies(aData || []);
    if (aData && aData.length > 0 && !selectedAssembly) setSelectedAssembly(aData[0]);
  };

  useEffect(() => { fetchAssemblies(); }, [condominiumId]);

  useEffect(() => {
    if (!selectedAssembly) return;
    const fetchMotions = async () => {
      const { data } = await supabase.from('assembly_motions').select('*, assembly_votes(vote, aliquot_weight)').eq('assembly_id', selectedAssembly.id);
      setMotions(data || []);
    };
    fetchMotions();
  }, [selectedAssembly]);

  const handleCreateMotion = async (e) => {
    e.preventDefault();
    if (!newMotionTitle.trim() || !selectedAssembly) return;
    try {
      const { error } = await supabase.from('assembly_motions').insert({ assembly_id: selectedAssembly.id, title: newMotionTitle.trim(), description: newMotionDesc.trim() || null, status: 'open' });
      if (error) throw error;
      setNewMotionTitle(''); setNewMotionDesc('');
      const { data } = await supabase.from('assembly_motions').select('*, assembly_votes(vote, aliquot_weight)').eq('assembly_id', selectedAssembly.id);
      setMotions(data || []);
    } catch (err) { alert('Error creando moción: ' + err.message); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1050px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div><h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Gestión de Asambleas y Quórums (Arts. 15 y 17)</h2><div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Convocatoria, control de asistencia telemática y votaciones de ley.</div></div>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)' }}>ASAMBLEA EN GESTIÓN:</label>
        <select value={selectedAssembly?.id || ''} onChange={(e) => setSelectedAssembly(assemblies.find(a => a.id === e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}>
          {assemblies.map((a) => (<option key={a.id} value={a.id}>{a.title} ({a.assembly_type.toUpperCase()}) — Estado: {a.status}</option>))}
        </select>
      </div>
      {selectedAssembly && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>Lanzar Moción a Votación en Vivo</h3>
            <form onSubmit={handleCreateMotion} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" required placeholder="Título de la Moción (Ej: Aprobación Presupuesto Anual 2027)" value={newMotionTitle} onChange={(e) => setNewMotionTitle(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
              <textarea rows={2} placeholder="Detalle o fundamentación..." value={newMotionDesc} onChange={(e) => setNewMotionDesc(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', boxSizing: 'border-box' }} />
              <button type="submit" style={{ alignSelf: 'flex-end', padding: '8px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>+ Abrir Votación</button>
            </form>
          </div>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800' }}>Cómputo en Vivo de Alícuotas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {motions.map((m) => {
                const totalVotes = m.assembly_votes || [];
                const aprueboAli = totalVotes.filter(v => v.vote === 'apruebo').reduce((acc, v) => acc + Number(v.aliquot_weight), 0);
                const rechazoAli = totalVotes.filter(v => v.vote === 'rechazo').reduce((acc, v) => acc + Number(v.aliquot_weight), 0);
                const abstencionAli = totalVotes.filter(v => v.vote === 'abstencion').reduce((acc, v) => acc + Number(v.aliquot_weight), 0);
                return (
                  <div key={m.id} style={{ padding: '14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px' }}>{m.title}</strong>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>ESTADO: {m.status.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px', textAlign: 'center' }}>
                      <div style={{ backgroundColor: 'var(--success-bg)', padding: '8px', borderRadius: '6px' }}><div style={{ fontSize: '11px', color: 'var(--success-text)' }}>APRUEBO</div><strong style={{ fontSize: '14px', color: 'var(--success-text)' }}>{aprueboAli.toFixed(2)}%</strong></div>
                      <div style={{ backgroundColor: 'var(--danger-bg)', padding: '8px', borderRadius: '6px' }}><div style={{ fontSize: '11px', color: 'var(--danger-text)' }}>RECHAZO</div><strong style={{ fontSize: '14px', color: 'var(--danger-text)' }}>{rechazoAli.toFixed(2)}%</strong></div>
                      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '8px', borderRadius: '6px' }}><div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ABSTENCIÓN</div><strong style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{abstencionAli.toFixed(2)}%</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
