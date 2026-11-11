import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function AdminUnitsView({ condominiumId }) {
  const isMobile = useIsMobile();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUnits = async () => {
    if (!condominiumId) return;
    setLoading(true);
    const { data } = await supabase.from('units').select('*, profiles(full_name, email, phone)').eq('condominium_id', condominiumId).order('unit_number');
    setUnits(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUnits(); }, [condominiumId]);

  const totalAliquot = units.reduce((acc, u) => acc + Number(u.aliquot || 0), 0);
  const isAliquot100 = Math.abs(totalAliquot - 100.0) < 0.05;

  if (loading) return <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>Cargando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div><h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Padrón Maestro de Unidades (Art. 5 Ley N° 21.442)</h2><div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Asignación de alícuotas, bodegas y roles de avalúo.</div></div>
        <div style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '800', fontSize: '13px', backgroundColor: isAliquot100 ? '#dcfce7' : '#fee2e2', color: isAliquot100 ? '#166534' : '#991b1b', border: isAliquot100 ? '1px solid #86efac' : '1px solid #fca5a5' }}>Suma Alícuotas: {totalAliquot.toFixed(2)}% {isAliquot100 ? '✓ (Conforme a Ley)' : '⚠️ (Descuadre)'}</div>
      </div>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
          <thead><tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}><th style={{ padding: '8px 12px' }}>Unidad</th><th style={{ padding: '8px 12px' }}>Copropietario</th><th style={{ padding: '8px 12px', textAlign: 'right' }}>Alícuota (%)</th><th style={{ padding: '8px 12px' }}>Estacionamiento</th><th style={{ padding: '8px 12px' }}>Bodega</th><th style={{ padding: '8px 12px' }}>Contacto</th></tr></thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 12px', fontWeight: '800' }}>Depto {u.unit_number}</td>
                <td style={{ padding: '8px 12px' }}>{u.profiles?.full_name || 'Sin asignar'}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--primary)' }}>{u.aliquot}%</td>
                <td style={{ padding: '8px 12px' }}>{u.parking_number || '—'}</td>
                <td style={{ padding: '8px 12px' }}>{u.storage_number || '—'}</td>
                <td style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>{u.profiles?.phone || u.profiles?.email || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
