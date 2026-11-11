import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function AdminCommonAreasView({ condominiumId }) {
  const isMobile = useIsMobile();
  const [areas, setAreas] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatCLP = (val) => '$' + Math.round(val || 0).toLocaleString('es-CL');

  const fetchAdminData = async () => {
    if (!condominiumId) return;
    setLoading(true);
    try {
      const { data: aData } = await supabase.from('common_areas').select('*').eq('condominium_id', condominiumId);
      setAreas(aData || []);
      const { data: rData } = await supabase.from('common_area_bookings').select('*, common_areas(name), units(unit_number)').order('booking_date', { ascending: false }).limit(20);
      setReservations(rData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAdminData(); }, [condominiumId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>Cargando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div><h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Gestión de Espacios Comunes</h2><div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Tarifas, garantías y auditoría de eventos</div></div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
        {areas.map((a) => (
          <div key={a.id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700' }}>{a.name}</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Aforo: {a.capacity} personas</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '6px' }}>Arriendo: {formatCLP(a.fee_amount)}</div>
            <div style={{ fontSize: '12px', color: 'var(--primary)' }}>Garantía: {formatCLP(a.deposit_amount)}</div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800' }}>Auditoría de Reservas Recientes</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '8px 10px' }}>Fecha</th><th style={{ padding: '8px 10px' }}>Espacio</th><th style={{ padding: '8px 10px' }}>Unidad</th><th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Cobrado</th><th style={{ padding: '8px 10px' }}>Inspección / Daños</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px 10px' }}>{r.booking_date}</td>
                  <td style={{ padding: '8px 10px', fontWeight: '600' }}>{r.common_areas?.name}</td>
                  <td style={{ padding: '8px 10px' }}>Depto {r.units?.unit_number}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>{formatCLP(r.total_fee)}</td>
                  <td style={{ padding: '8px 10px' }}>
                    {r.damage_reported ? <span style={{ color: 'var(--danger-text)', fontWeight: 'bold', fontSize: '11.5px' }}>⚠️ Daños: {r.damage_notes || 'Garantía retenida'}</span> :
                     r.check_out_checklist?.inspected_at ? <span style={{ color: 'var(--success-text)', fontSize: '11.5px' }}>✓ Conforme</span> :
                     <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>Pendiente de uso</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
