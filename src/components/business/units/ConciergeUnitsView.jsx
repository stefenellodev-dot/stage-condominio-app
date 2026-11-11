import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function ConciergeUnitsView({ condominiumId }) {
  const isMobile = useIsMobile();
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!condominiumId) return;
    const fetchPhonebook = async () => {
      const { data } = await supabase.from('vw_concierge_phonebook').select('*').eq('condominium_id', condominiumId).order('unit_number');
      setContacts(data || []);
    };
    fetchPhonebook();
  }, [condominiumId]);

  const filtered = contacts.filter((c) => c.unit_number.toLowerCase().includes(search.toLowerCase()) || c.contact_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '850px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: 'var(--bg-surface)', color: '#fff', borderRadius: '12px', padding: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>Citofonía y Contacto de Residentes</h2>
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Directorio de recepción protegido conforme a la Ley N° 19.628.</div>
      </div>
      <input type="text" placeholder="🔍 Buscar por N° Depto o Nombre..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '14px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((c) => (
          <div key={c.unit_id} style={{ padding: '12px 16px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '15px' }}>Depto {c.unit_number}</strong>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.contact_name}</div>
              {c.authorized_vehicles && <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>🚗 {c.authorized_vehicles}</div>}
            </div>
            <div>
              {c.contact_phone !== 'No registrado' ? (
                <a href={`tel:${c.contact_phone}`} style={{ padding: '8px 14px', backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '12px', display: 'inline-block' }}>📞 {c.contact_phone}</a>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sin teléfono</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
