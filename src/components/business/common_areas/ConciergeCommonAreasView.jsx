import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function ConciergeCommonAreasView({ condominiumId }) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [todayReservations, setTodayReservations] = useState([]);
  const [selectedRes, setSelectedRes] = useState(null);
  const [checklistType, setChecklistType] = useState('check_out');
  const [cleanliness, setCleanliness] = useState(true);
  const [grillOk, setGrillOk] = useState(true);
  const [lightsOk, setLightsOk] = useState(true);
  const [furnitureOk, setFurnitureOk] = useState(true);
  const [damageNotes, setDamageNotes] = useState('');
  const [savingChecklist, setSavingChecklist] = useState(false);

  const fetchTodayEvents = async () => {
    if (!condominiumId) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('common_area_bookings').select('*, common_areas(name), units(unit_number)').eq('condominium_id', condominiumId).eq('booking_date', today).order('start_time');
    setTodayReservations(data || []);
  };

  useEffect(() => { fetchTodayEvents(); }, [condominiumId]);

  const handleSaveChecklist = async () => {
    if (!selectedRes) return;
    try {
      setSavingChecklist(true);
      const isDamaged = !cleanliness || !grillOk || !lightsOk || !furnitureOk;
      const payload = { cleanliness, grillOk, lightsOk, furnitureOk, inspected_at: new Date().toISOString() };
      const updateData = checklistType === 'check_in'
        ? { check_in_checklist: payload, inspected_by: profile?.id }
        : { check_out_checklist: payload, damage_reported: isDamaged, damage_notes: isDamaged ? damageNotes : null, deposit_returned: !isDamaged, inspected_by: profile?.id };
      const { error } = await supabase.from('common_area_bookings').update(updateData).eq('id', selectedRes.id);
      if (error) throw error;
      alert(`Inspección registrada. ${isDamaged ? 'Daño registrado: Garantía retenida.' : 'Conforme: Garantía liberada.'}`);
      setSelectedRes(null); setDamageNotes(''); fetchTodayEvents();
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSavingChecklist(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: 'var(--bg-surface)', color: '#fff', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Conserjería Operativa</div>
          <h2 style={{ margin: '4px 0 0', fontSize: '17px', fontWeight: '800' }}>Eventos y Espacios Comunes de Hoy ({todayReservations.length})</h2>
        </div>
        <button onClick={fetchTodayEvents} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Actualizar</button>
      </div>
      {todayReservations.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay eventos agendados para hoy.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {todayReservations.map((res) => (
            <div key={res.id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <strong style={{ fontSize: '15px' }}>{res.common_areas?.name}</strong>
                <span style={{ margin: '0 8px', color: 'var(--text-dim)' }}>•</span>
                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>Depto {res.units?.unit_number}</span>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>Horario: {res.start_time} a {res.end_time} hrs</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setSelectedRes(res); setChecklistType('check_in'); }} style={{ padding: '8px 12px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>📋 Entrega Inicial</button>
                <button onClick={() => { setSelectedRes(res); setChecklistType('check_out'); }} style={{ padding: '8px 12px', backgroundColor: '#15803d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>🔍 Recepción y Cierre</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedRes && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '20px', maxWidth: '440px', width: '100%' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800' }}>{checklistType === 'check_in' ? 'Checklist de Entrega' : 'Checklist de Recepción y Garantía'}</h3>
            <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: 'var(--text-dim)' }}>{selectedRes.common_areas?.name} — Depto {selectedRes.units?.unit_number}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', cursor: 'pointer' }}><span>✨ Aseo y Limpieza General:</span><input type="checkbox" checked={cleanliness} onChange={(e) => setCleanliness(e.target.checked)} /></label>
              <label style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', cursor: 'pointer' }}><span>🥩 Parrilla / Campana:</span><input type="checkbox" checked={grillOk} onChange={(e) => setGrillOk(e.target.checked)} /></label>
              <label style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', cursor: 'pointer' }}><span>💡 Iluminación y enchufes:</span><input type="checkbox" checked={lightsOk} onChange={(e) => setLightsOk(e.target.checked)} /></label>
              <label style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', cursor: 'pointer' }}><span>🪑 Mobiliario íntegro:</span><input type="checkbox" checked={furnitureOk} onChange={(e) => setFurnitureOk(e.target.checked)} /></label>
              {(!cleanliness || !grillOk || !lightsOk || !furnitureOk) && (
                <div><label style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--danger-text)' }}>OBSERVACIONES DE DAÑOS:</label><textarea rows={3} placeholder="Describe los daños..." value={damageNotes} onChange={(e) => setDamageNotes(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #f87171', marginTop: '4px', boxSizing: 'border-box' }} /></div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" onClick={() => setSelectedRes(null)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#fff', cursor: 'pointer' }}>Cerrar</button>
              <button type="button" disabled={savingChecklist} onClick={handleSaveChecklist} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--bg-surface)', color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer' }}>{savingChecklist ? 'Guardando...' : 'Finalizar Inspección'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
