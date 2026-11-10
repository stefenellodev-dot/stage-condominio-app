import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function AdminMaintenanceView({ condominiumId }) {
  const isMobile = useIsMobile();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    if (!condominiumId) return;
    setLoading(true);
    try {
      const { data: tData } = await supabase.from('maintenance_tickets').select('*, units(unit_number)').eq('condominium_id', condominiumId).order('created_at', { ascending: false });
      setTickets(tData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAdminData(); }, [condominiumId]);

  const handleResolveTicket = async (ticketId) => {
    try {
      await supabase.from('maintenance_tickets').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', ticketId);
      fetchAdminData();
    } catch (err) { alert('Error resolviendo ticket: ' + err.message); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>Cargando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div><h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Gestión de Mantenimiento y Cumplimiento Normativo</h2><div style={{ fontSize: '12px', color: '#64748b' }}>Supervisión de certificaciones obligatorias y resolución de incidentes.</div></div>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Semáforo de Certificaciones Oficiales de Ley</h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#166534' }}>LEY N° 20.296 (MINVU)</div>
            <strong style={{ fontSize: '14px', display: 'block', margin: '4px 0' }}>Certificación de Ascensores</strong>
            <div style={{ fontSize: '12px', color: '#15803d' }}>Empresa: Otis Chile S.A.</div>
            <div style={{ fontSize: '11px', color: '#166534', marginTop: '6px' }}>Vigente hasta: <strong>14/12/2026</strong></div>
          </div>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#166534' }}>NORMA SEC (GAS)</div>
            <strong style={{ fontSize: '14px', display: 'block', margin: '4px 0' }}>Sello Verde de Gas</strong>
            <div style={{ fontSize: '12px', color: '#15803d' }}>Organismo: Certigas Ltda.</div>
            <div style={{ fontSize: '11px', color: '#166534', marginTop: '6px' }}>Vigente hasta: <strong>05/08/2027</strong></div>
          </div>
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>RED CONTRA INCENDIOS</div>
            <strong style={{ fontSize: '14px', display: 'block', margin: '4px 0' }}>Extintores y Red Húmeda</strong>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Inspección anual al día</div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>Revisión: <strong>Semestral OK</strong></div>
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800' }}>Tickets Operacionales Pendientes ({tickets.filter(t => t.status !== 'resolved').length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tickets.map((t) => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div>
                <strong style={{ fontSize: '14px' }}>{t.title}</strong>
                <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
                <span>Depto {t.units?.unit_number}</span>
                <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{t.category.replace('_', ' ')}</span>
                <div style={{ fontSize: '12px', color: '#334155', marginTop: '3px' }}>{t.description}</div>
              </div>
              <div>
                {t.status !== 'resolved' ? (
                  <button onClick={() => handleResolveTicket(t.id)} style={{ padding: '6px 12px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Marcar Resuelto</button>
                ) : (
                  <span style={{ color: '#15803d', fontSize: '12px', fontWeight: 'bold' }}>✓ Resuelto</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
