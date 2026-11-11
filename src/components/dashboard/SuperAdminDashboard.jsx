import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useIsMobile } from '../../hooks/useMediaQuery';

export function SuperAdminDashboard({ onNavigate }) {
  const isMobile = useIsMobile();
  const [platformMetrics, setPlatformMetrics] = useState({ condoCount: 0, unitCount: 0, userCount: 0, outboxPending: 0, outboxSent: 0 });
  const [condos, setCondos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGlobalMetrics = async () => {
    setLoading(true);
    try {
      const { data: condoList } = await supabase.from('condominiums').select('*').is('deleted_at', null);
      const { count: unitCount } = await supabase.from('units').select('*', { count: 'exact', head: true }).is('deleted_at', null);
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: pendingMail } = await supabase.from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: sentMail } = await supabase.from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'sent');
      setCondos(condoList || []);
      setPlatformMetrics({ condoCount: condoList?.length || 0, unitCount: unitCount || 0, userCount: userCount || 0, outboxPending: pendingMail || 0, outboxSent: sentMail || 0 });
    } catch (err) {
      console.error('Error cargando métricas SaaS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGlobalMetrics(); }, []);

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-dim)' }}>Cargando…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', color: '#fff', borderRadius: '12px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8' }}>Centro de Operaciones Global (SaaS)</div>
          <h1 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: '800' }}>Plataforma Piave • ecomunity.cl</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ backgroundColor: '#059669', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>TUNNEL CLOUDFLARE: ACTIVO</span>
          <span style={{ backgroundColor: '#0284c7', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>BACKUPS: OK</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>CONDOMINIOS ACTIVOS</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>{platformMetrics.condoCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>UNIDADES TOTALES</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>{platformMetrics.unitCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>USUARIOS REGISTRADOS</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#15803d', marginTop: '4px' }}>{platformMetrics.userCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>NOTIFICACIONES EN COLA</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: platformMetrics.outboxPending > 0 ? '#ea580c' : '#64748b', marginTop: '4px' }}>{platformMetrics.outboxPending} pendientes</div>
          <div style={{ fontSize: '11px', color: '#15803d' }}>{platformMetrics.outboxSent} despachadas</div>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800' }}>Comunidades Registradas en la Red</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px' }}>Condominio</th>
              <th style={{ padding: '8px 12px' }}>RUT</th>
              <th style={{ padding: '8px 12px' }}>Dirección</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {condos.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 12px', fontWeight: '700' }}>{c.name}</td>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{c.rut}</td>
                <td style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>{c.street} {c.street_number}, {c.commune}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <button onClick={() => onNavigate && onNavigate('units')} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Ver Unidades</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
