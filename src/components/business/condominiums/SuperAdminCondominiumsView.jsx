import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function SuperAdminCondominiumsView() {
  const isMobile = useIsMobile();
  const [condos, setCondos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCondominiums = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('condominiums').select('*, management_companies(legal_name, fantasy_name), units(count)').is('deleted_at', null).order('created_at', { ascending: false });
      if (error) throw error;
      setCondos(data || []);
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCondominiums(); }, []);

  const filtered = condos.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.rut || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.commune || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8' }}>Parque Habitacional e Inmobiliario</div>
          <h1 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: '800' }}>Padrón Maestro de Condominios</h1>
        </div>
        <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>Total Edificios: <strong>{condos.length}</strong></span>
      </div>
      <input type="text" placeholder="🔍 Filtrar por Nombre, RUT o Comuna..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '10px 12px' }}>Condominio / Comuna</th>
              <th style={{ padding: '10px 12px' }}>RUT Legal</th>
              <th style={{ padding: '10px 12px' }}>Tipología Art. 4°</th>
              <th style={{ padding: '10px 12px' }}>Administración Mandante</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Fondo Reserva</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Unidades</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 12px' }}>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{c.name}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{c.street} {c.street_number}, {c.commune}</div>
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{c.rut}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: c.type === 'tipo_a' ? '#eff6ff' : '#fef3c7', color: c.type === 'tipo_a' ? '#1e40af' : '#92400e' }}>
                    {c.type === 'tipo_a' ? 'Tipo A (En Terreno Común)' : 'Tipo B (Sitios Privados)'}
                  </span>
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>Destino: {c.destination || 'Habitacional'}</div>
                </td>
                <td style={{ padding: '10px 12px', color: '#334155' }}>{c.management_companies?.legal_name || c.management_companies?.fantasy_name || 'Administración Directa'}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#0369a1' }}>{c.reserve_fund_percentage || 5}%</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800' }}>{c.units?.[0]?.count || c.total_units || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
