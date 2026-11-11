import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useIsMobile } from '../../hooks/useMediaQuery';

export function ConciergeDashboard({ condominiumId, onNavigate }) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({ pendingPackages: 0, activeVisitors: 0, occupiedParking: 0, totalParking: 12 });
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConciergeData = async () => {
    if (!condominiumId) return;
    setLoading(true);
    try {
      const { data: pkgData } = await supabase.from('parcels').select('id, tracking_number, pickup_pin, carrier, created_at, units(unit_number)').eq('condominium_id', condominiumId).eq('status', 'received').order('created_at', { ascending: false });
      const today = new Date().toISOString().split('T')[0];
      const { data: visitorData } = await supabase.from('visitor_logs').select('id, visitor_name, vehicle_plate, entry_time, parking_spot, units(unit_number)').eq('condominium_id', condominiumId).gte('entry_time', `${today}T00:00:00`).is('exit_time', null);
      const occupied = (visitorData || []).filter(v => v.parking_spot).length;
      setPackages(pkgData || []);
      setStats({ pendingPackages: pkgData?.length || 0, activeVisitors: visitorData?.length || 0, occupiedParking: occupied, totalParking: 12 });
    } catch (err) {
      console.error('Error cargando datos de conserjería:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConciergeData(); }, [condominiumId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', color: '#fff', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8' }}>Conserjería y Control de Acceso</div>
          <h2 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: '800' }}>Turno Activo: {profile?.full_name || 'Personal de Turno'}</h2>
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Acreditación OS-10 al día</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
        <button onClick={() => onNavigate && onNavigate('concierge')} style={{ padding: '16px', borderRadius: '10px', border: 'none', backgroundColor: '#0284c7', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
          <span style={{ fontSize: '24px' }}>📦</span><span>Recepcionar Paquete</span>
        </button>
        <button onClick={() => onNavigate && onNavigate('concierge')} style={{ padding: '16px', borderRadius: '10px', border: 'none', backgroundColor: '#059669', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
          <span style={{ fontSize: '24px' }}>🚪</span><span>Ingreso de Visita</span>
        </button>
        <button onClick={() => onNavigate && onNavigate('concierge')} style={{ padding: '16px', borderRadius: '10px', border: 'none', backgroundColor: '#334155', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
          <span style={{ fontSize: '24px' }}>✍️</span><span>Libro de Novedades</span>
        </button>
        <button onClick={() => onNavigate && onNavigate('announcements')} style={{ padding: '16px', borderRadius: '10px', border: 'none', backgroundColor: '#dc2626', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}>
          <span style={{ fontSize: '24px' }}>🚨</span><span>Protocolo SOS (Art. 40)</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: '700' }}>PAQUETES EN CUSTODIA</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>{stats.pendingPackages}</div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>Pendientes de retiro</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: '700' }}>VISITAS ACTUALES DENTRO</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success-text)', marginTop: '4px' }}>{stats.activeVisitors}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Ingresos registrados hoy</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: '700' }}>ESTACIONAMIENTOS VISITA</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: stats.occupiedParking >= 10 ? '#dc2626' : '#0f172a', marginTop: '4px' }}>
            {stats.occupiedParking} / {stats.totalParking}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{stats.totalParking - stats.occupiedParking} disponibles</div>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>📦 Encomiendas en Custodia ({packages.length})</h3>
          <button onClick={fetchConciergeData} style={{ fontSize: '11px', background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: '700' }}>🔄 Actualizar</button>
        </div>
        {packages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>No hay encomiendas pendientes en conserjería.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {packages.map((pkg) => (
              <div key={pkg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Depto {pkg.units?.unit_number}</strong>
                  <span style={{ margin: '0 8px', color: 'var(--text-dim)' }}>•</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{pkg.carrier}</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Tracking: {pkg.tracking_number || 'S/N'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '700' }}>PIN EXIGIDO</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '900', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', letterSpacing: '1.5px' }}>
                    {pkg.pickup_pin}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
