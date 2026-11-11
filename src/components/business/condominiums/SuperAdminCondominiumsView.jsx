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
      <div style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', borderRadius: '12px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>Parque Habitacional e Inmobiliario</div>
          <h1 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: '800' }}>Padrón Maestro de Condominios</h1>
        </div>
        <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>Total Edificios: <strong>{condos.length}</strong></span>
      </div>
      <input type="text" placeholder="🔍 Filtrar por Nombre, RUT o Comuna..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '13px' }} />
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '16px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px' }}>Condominio / Comuna</th>
              <th style={{ padding: '8px 12px' }}>RUT Legal</th>
              <th style={{ padding: '8px 12px' }}>Tipología Art. 4°</th>
              <th style={{ padding: '8px 12px' }}>Administración Mandante</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Fondo Reserva</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>Unidades</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 12px' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{c.name}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{c.street} {c.street_number}, {c.commune}</div>
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{c.rut}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: c.type === 'tipo_a' ? 'var(--bg-surface)' : 'var(--warning-bg)', color: c.type === 'tipo_a' ? 'var(--text-main)' : 'var(--warning-text)' }}>
                    {c.type === 'tipo_a' ? 'Tipo A (En Terreno Común)' : 'Tipo B (Sitios Privados)'}
                  </span>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>Destino: {c.destination || 'Habitacional'}</div>
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{c.management_companies?.legal_name || c.management_companies?.fantasy_name || 'Administración Directa'}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--primary)' }}>{c.reserve_fund_percentage || 5}%</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '800' }}>{c.units?.[0]?.count || c.total_units || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
