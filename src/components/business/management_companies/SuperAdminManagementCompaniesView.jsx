import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function SuperAdminManagementCompaniesView() {
  const isMobile = useIsMobile();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('management_companies').select('*, condominiums(count)').is('deleted_at', null).order('created_at', { ascending: false });
      if (error) throw error;
      setCompanies(data || []);
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const filtered = companies.filter((c) =>
    (c.legal_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.rut || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.fantasy_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: '12px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>Control Multi-Tenant SaaS</div>
          <h1 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: '800' }}>Empresas Administradoras y Operadores</h1>
        </div>
        <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>Empresas: <strong>{companies.length}</strong></span>
      </div>
      <input type="text" placeholder="🔍 Buscar por Razón Social, Nombre de Fantasía o RUT..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '13px' }} />
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '10px 12px' }}>Razón Social / Fantasía</th>
              <th style={{ padding: '10px 12px' }}>RUT Legal</th>
              <th style={{ padding: '10px 12px' }}>Registro MINVU</th>
              <th style={{ padding: '10px 12px' }}>Garantía / Póliza</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Condominios</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((comp) => {
              const isMinvuActive = comp.minvu_status === 'active';
              return (
                <tr key={comp.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{comp.legal_name}</strong>
                    {comp.fantasy_name && <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{comp.fantasy_name}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{comp.rut}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: '700', color: isMinvuActive ? 'var(--success-text)' : 'var(--warning)' }}>{comp.minvu_registry_number || 'Sin registro'}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>{comp.minvu_status ? comp.minvu_status.toUpperCase() : 'PENDIENTE'}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '800', backgroundColor: comp.has_guarantee_insurance ? 'var(--success-bg)' : 'var(--danger-bg)', color: comp.has_guarantee_insurance ? 'var(--success-text)' : 'var(--danger-text)' }}>
                      {comp.has_guarantee_insurance ? 'PÓLIZA VIGENTE' : 'SIN PÓLIZA'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800' }}>{comp.condominiums?.[0]?.count || 0}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '700', backgroundColor: comp.status === 'active' ? 'var(--bg-surface)' : 'var(--bg-surface)', color: comp.status === 'active' ? 'var(--info-hover)' : 'var(--text-dim)' }}>{comp.status ? comp.status.toUpperCase() : 'ACTIVA'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
