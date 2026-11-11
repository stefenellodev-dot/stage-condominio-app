import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function ConciergeMaintenanceView({ condominiumId }) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [inspections, setInspections] = useState([]);
  const [equipType, setEquipType] = useState('bombas_agua');
  const [isOk, setIsOk] = useState(true);
  const [levelVal, setLevelVal] = useState('');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchInspections = async () => {
    if (!condominiumId) return;
    const { data } = await supabase.from('equipment_inspections').select('*, profiles(full_name)').eq('condominium_id', condominiumId).order('created_at', { ascending: false }).limit(15);
    setInspections(data || []);
  };

  useEffect(() => { fetchInspections(); }, [condominiumId]);

  const handleSaveInspection = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { error } = await supabase.from('equipment_inspections').insert({ condominium_id: condominiumId, inspected_by: profile?.id, inspection_type: equipType, status_ok: isOk, pressure_or_level: levelVal.trim() || null, observations: obs.trim() || null });
      if (error) throw error;
      alert('Ronda preventiva registrada en la bitácora técnica.');
      setLevelVal(''); setObs(''); fetchInspections();
    } catch (err) { alert('Error al registrar ronda: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '950px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', borderRadius: '12px', padding: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>Bitácora Técnica de Rondas Preventivas</h2>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Inspección diaria de equipos críticos de continuidad operacional.</div>
      </div>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '14.5px', fontWeight: '800' }}>Registrar Parámetro de Equipo</h3>
        <form onSubmit={handleSaveInspection} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
          <select value={equipType} onChange={(e) => setEquipType(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <option value="bombas_agua">💧 Bombas de Agua (Presión)</option>
            <option value="grupo_electrogeno">⚡ Grupo Electrógeno (Petróleo)</option>
            <option value="calderas_central">🔥 Calderas (Temperatura)</option>
            <option value="porton_vehicular">🚗 Portón Vehicular (Motores)</option>
            <option value="luces_emergencia">🔦 Luces de Emergencia</option>
          </select>
          <input type="text" placeholder="Nivel/Presión (Ej: 4.2 bar / 90%)" value={levelVal} onChange={(e) => setLevelVal(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
          <select value={isOk ? 'ok' : 'fail'} onChange={(e) => setIsOk(e.target.value === 'ok')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <option value="ok">🟢 Operando Normal</option>
            <option value="fail">🔴 Anormal / En Falla</option>
          </select>
          <button type="submit" disabled={saving} style={{ padding: '10px', backgroundColor: 'var(--success)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}>{saving ? 'Guardando...' : '+ Grabar Ronda'}</button>
        </form>
      </div>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800' }}>Últimas Rondas Técnicas Registradas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {inspections.map((insp) => (
            <div key={insp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div>
                <strong style={{ fontSize: '13.5px', textTransform: 'capitalize' }}>{insp.inspection_type.replace('_', ' ')}</strong>
                <span style={{ margin: '0 8px', color: 'var(--text-dim)' }}>•</span>
                <span>Nivel: <strong>{insp.pressure_or_level || 'N/D'}</strong></span>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{new Date(insp.created_at).toLocaleString('es-CL')} • Guardia: {insp.profiles?.full_name || 'Turno'}</div>
                {insp.observations && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Obs: {insp.observations}</div>}
              </div>
              <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800', backgroundColor: insp.status_ok ? 'var(--success-bg)' : 'var(--danger-bg)', color: insp.status_ok ? 'var(--success-text)' : 'var(--danger-text)' }}>{insp.status_ok ? 'NORMAL' : 'FALLA'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
