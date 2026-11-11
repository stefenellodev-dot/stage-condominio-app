import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function ResidentCommonAreasView() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [unit, setUnit] = useState(null);
  const [areas, setAreas] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [reserveDate, setReserveDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('23:00');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const formatCLP = (val) => '$' + Math.round(val || 0).toLocaleString('es-CL');

  const fetchData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: uData } = await supabase.from('units').select('id, unit_number, condominium_id').eq('owner_id', profile.id).limit(1).maybeSingle();
      if (!uData) { setLoading(false); return; }
      setUnit(uData);
      const { data: aData } = await supabase.from('common_areas').select('*').eq('condominium_id', uData.condominium_id).eq('status', 'available');
      setAreas(aData || []);
      const { data: rData } = await supabase.from('common_area_bookings').select('*, common_areas(name, fee_amount, deposit_amount)').eq('unit_id', uData.id).order('booking_date', { ascending: false });
      setMyReservations(rData || []);
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [profile?.id]);

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    if (!selectedArea || !reserveDate) return;
    try {
      setSubmitting(true);
      const { error } = await supabase.from('common_area_bookings').insert({
        common_area_id: selectedArea.id, unit_id: unit.id, user_id: profile.id,
        booking_date: reserveDate, start_time: startTime, end_time: endTime,
        total_fee: selectedArea.fee_amount || 0, deposit_fee: selectedArea.deposit_amount || 0, status: 'pending'
      });
      if (error) throw error;
      alert(`Reserva confirmada para ${selectedArea.name} el día ${reserveDate}.`);
      setSelectedArea(null); setReserveDate(''); fetchData();
    } catch (err) { alert('Error al reservar: ' + err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Cargando espacios comunes...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', borderRadius: '14px', padding: '20px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800' }}>Reserva de Espacios Comunes</h1>
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>Unidad: Depto {unit?.unit_number} • Los cobros se cargan a la colilla mensual.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
        {areas.map((area) => (
          <div key={area.id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{area.name.toLowerCase().includes('quincho') ? '🥩' : area.name.toLowerCase().includes('piscina') ? '🏊' : '🎉'}</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{area.name}</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px' }}>Aforo máx: <strong>{area.capacity || 20} personas</strong></div>
              <div style={{ fontSize: '12.5px', marginBottom: '4px' }}>Arriendo: <strong>{formatCLP(area.fee_amount)}</strong></div>
              <div style={{ fontSize: '12px', color: 'var(--primary)' }}>Garantía reembolsable: {formatCLP(area.deposit_amount)}</div>
            </div>
            <button onClick={() => setSelectedArea(area)} style={{ marginTop: '14px', padding: '10px', backgroundColor: 'var(--primary)', color: 'var(--text-main)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}>📅 Reservar Fecha</button>
          </div>
        ))}
      </div>
      {selectedArea && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '24px', maxWidth: '440px', width: '100%' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800' }}>Reservar {selectedArea.name}</h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--text-dim)' }}>Tarifa: {formatCLP(selectedArea.fee_amount)} + Garantía: {formatCLP(selectedArea.deposit_amount)}</p>
            <form onSubmit={handleCreateReservation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)' }}>FECHA DE USO:</label>
                <input type="date" required min={new Date().toISOString().split('T')[0]} value={reserveDate} onChange={(e) => setReserveDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)' }}>HORA INICIO:</label><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginTop: '4px', boxSizing: 'border-box' }} /></div>
                <div><label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)' }}>HORA FIN:</label><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginTop: '4px', boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setSelectedArea(null)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--success)', color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer' }}>{submitting ? 'Procesando...' : 'Confirmar Reserva'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>Mis Reservas y Eventos Agendados</h3>
        {myReservations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>No registras reservas previas ni activas.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myReservations.map((r) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ fontSize: '14px' }}>{r.common_areas?.name}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>📅 {r.booking_date} • {r.start_time} a {r.end_time} hrs</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '800', backgroundColor: r.status === 'approved' ? 'var(--success-bg)' : 'var(--border-subtle)', color: r.status === 'approved' ? 'var(--success-text)' : 'var(--text-secondary)' }}>{r.status === 'approved' ? 'APROBADA' : r.status.toUpperCase()}</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Cobro: {formatCLP(r.total_fee)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
