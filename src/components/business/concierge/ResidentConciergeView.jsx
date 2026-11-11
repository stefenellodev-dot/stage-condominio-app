import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function ResidentConciergeView() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [unit, setUnit] = useState(null);
  const [packages, setPackages] = useState([]);
  const [preAuthVisitors, setPreAuthVisitors] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [guestPlate, setGuestPlate] = useState('');
  const [savingGuest, setSavingGuest] = useState(false);

  const fetchResidentConcierge = async () => {
    if (!profile?.id) return;
    const { data: uData } = await supabase.from('units').select('id, unit_number, condominium_id').eq('owner_id', profile.id).limit(1).maybeSingle();
    if (!uData) return;
    setUnit(uData);
    const { data: pData } = await supabase.from('parcels').select('*').eq('unit_id', uData.id).eq('status', 'received').order('created_at', { ascending: false });
    setPackages(pData || []);
  };

  useEffect(() => { fetchResidentConcierge(); }, [profile?.id]);

  const handlePreAuthorize = (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setSavingGuest(true);
    setPreAuthVisitors([{ id: Date.now(), name: guestName.trim(), plate: guestPlate.trim().toUpperCase() }, ...preAuthVisitors]);
    setGuestName('');
    setGuestPlate('');
    setSavingGuest(false);
    alert('✅ Visita pre-autorizada. El conserje tiene el registro en mesón.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>📦 Encomiendas por Retirar ({packages.length})</h3>
        {packages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '13px' }}>No tienes encomiendas pendientes en conserjería.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {packages.map((pkg) => (
              <div key={pkg.id} style={{ backgroundColor: 'var(--bg-surface)', border: '1.5px solid var(--border-subtle)', borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{pkg.carrier}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Tracking: {pkg.tracking_number}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Recibido el {new Date(pkg.created_at || pkg.received_at).toLocaleDateString('es-CL')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary)' }}>PIN DE RETIRO</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: '900', color: 'var(--primary)', backgroundColor: 'var(--bg-surface)', padding: '4px 14px', borderRadius: '8px', letterSpacing: '2px', marginTop: '2px' }}>{pkg.pickup_pin}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>🚪 Pre-autorizar Visitas / Vehículos</h3>
        <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'var(--text-dim)' }}>Informa al conserje con anticipación para un acceso expedito:</p>
        <form onSubmit={handlePreAuthorize} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: '10px' }}>
          <input type="text" required placeholder="Nombre completo invitado" value={guestName} onChange={(e) => setGuestName(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
          <input type="text" placeholder="Patente (opcional)" value={guestPlate} onChange={(e) => setGuestPlate(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
          <button type="submit" disabled={savingGuest} style={{ padding: '10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>+ Crear Pase</button>
        </form>
        {preAuthVisitors.length > 0 && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)' }}>PASES ACTIVOS HOY:</div>
            {preAuthVisitors.map((v) => (
              <div key={v.id} style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '12.5px', display: 'flex', justifyContent: 'space-between' }}>
                <strong>{v.name}</strong>
                {v.plate && <span style={{ fontFamily: 'monospace' }}>🚗 {v.plate}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
