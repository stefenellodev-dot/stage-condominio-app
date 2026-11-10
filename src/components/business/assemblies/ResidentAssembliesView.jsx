import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function ResidentAssembliesView() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [unit, setUnit] = useState(null);
  const [assemblies, setAssemblies] = useState([]);
  const [activeAssembly, setActiveAssembly] = useState(null);
  const [motions, setMotions] = useState([]);
  const [myVotes, setMyVotes] = useState({});
  const [votingMotionId, setVotingMotionId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: uData } = await supabase.from('units').select('id, unit_number, aliquot, condominium_id').eq('owner_id', profile.id).limit(1).maybeSingle();
      if (!uData) { setLoading(false); return; }
      setUnit(uData);
      const { data: aData } = await supabase.from('assemblies').select('*').eq('condominium_id', uData.condominium_id).order('first_call_at', { ascending: false });
      setAssemblies(aData || []);
      const current = (aData || []).find((a) => a.status === 'in_progress') || aData?.[0] || null;
      setActiveAssembly(current);
      if (current) {
        const { data: mData } = await supabase.from('assembly_motions').select('*').eq('assembly_id', current.id);
        setMotions(mData || []);
        const { data: vData } = await supabase.from('assembly_votes').select('motion_id, vote').eq('unit_id', uData.id);
        const vMap = {};
        (vData || []).forEach((v) => { vMap[v.motion_id] = v.vote; });
        setMyVotes(vMap);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [profile?.id]);

  const handleVote = async (motionId, voteOption) => {
    if (!unit) return;
    try {
      setVotingMotionId(motionId);
      const { error } = await supabase.from('assembly_votes').insert({ motion_id: motionId, unit_id: unit.id, user_id: profile.id, vote: voteOption, aliquot_weight: unit.aliquot || 1.0 });
      if (error) throw error;
      setMyVotes({ ...myVotes, [motionId]: voteOption });
      alert(`Voto emitido (${voteOption.toUpperCase()}) con ponderación de ${unit.aliquot}%.`);
    } catch (err) { alert('Error emitiendo voto: ' + err.message); }
    finally { setVotingMotionId(null); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Cargando asambleas...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '850px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '14px', padding: '20px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800' }}>Asambleas y Votación Electrónica</h1>
        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Unidad: Depto {unit?.unit_number} • Poder de Voto (Alícuota Legal): <strong>{unit?.aliquot}%</strong></p>
      </div>
      {activeAssembly ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800', backgroundColor: activeAssembly.status === 'in_progress' ? '#d1fae5' : '#e2e8f0', color: activeAssembly.status === 'in_progress' ? '#065f46' : '#475569' }}>{activeAssembly.status === 'in_progress' ? '● ASAMBLEA EN VIVO' : activeAssembly.status.toUpperCase()}</span>
                <h2 style={{ margin: '8px 0 2px', fontSize: '17px', fontWeight: '800' }}>{activeAssembly.title}</h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>1ª Citación: {new Date(activeAssembly.first_call_at).toLocaleString('es-CL')}</div>
              </div>
              {activeAssembly.meeting_url && activeAssembly.status === 'in_progress' && (
                <a href={activeAssembly.meeting_url} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 18px', backgroundColor: '#059669', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '800', fontSize: '13px' }}>📹 Conectarse a la Sesión</a>
              )}
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '800' }}>Mociones Sometidas a Votación ({motions.length})</h3>
            {motions.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>No hay mociones abiertas en este momento.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {motions.map((m) => {
                  const userVote = myVotes[m.id];
                  return (
                    <div key={m.id} style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{m.title}</strong>
                      <p style={{ margin: '4px 0 12px', fontSize: '12.5px', color: '#475569' }}>{m.description}</p>
                      {userVote ? (
                        <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#15803d' }}>✓ Ya votaste: <span style={{ textTransform: 'uppercase' }}>{userVote}</span> (Ponderación: {unit?.aliquot}%)</div>
                      ) : m.status === 'open' ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleVote(m.id, 'apruebo')} disabled={votingMotionId === m.id} style={{ padding: '8px 16px', backgroundColor: '#15803d', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Apruebo</button>
                          <button onClick={() => handleVote(m.id, 'rechazo')} disabled={votingMotionId === m.id} style={{ padding: '8px 16px', backgroundColor: '#b91c1c', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Rechazo</button>
                          <button onClick={() => handleVote(m.id, 'abstencion')} disabled={votingMotionId === m.id} style={{ padding: '8px 16px', backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Abstención</button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Moción cerrada por la mesa.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No hay asambleas convocadas.</div>
      )}
    </div>
  );
}
