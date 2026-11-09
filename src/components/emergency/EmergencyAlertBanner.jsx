import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function EmergencyAlertBanner({ condominiumId, userRole, userId }) {
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    if (!condominiumId) return;

    const fetchActiveAlert = async () => {
      const { data } = await supabase
        .from('emergency_broadcasts')
        .select('*')
        .eq('condominium_id', condominiumId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setActiveAlert(data);
    };

    fetchActiveAlert();

    // Polling cada 30s (realtime no disponible en este entorno)
    const interval = setInterval(fetchActiveAlert, 30000);
    return () => clearInterval(interval);
  }, [condominiumId]);

  if (!activeAlert) return null;

  const handleResolveAlert = async () => {
    if (!window.confirm('¿Confirmas que la emergencia ha sido controlada y resuelta?')) return;

    await supabase
      .from('emergency_broadcasts')
      .update({ is_active: false, resolved_at: new Date().toISOString(), resolved_by: userId })
      .eq('id', activeAlert.id);

    setActiveAlert(null);
  };

  const isEvacuate = activeAlert.severity === 'evacuate';
  const bgColor = isEvacuate ? '#b91c1c' : '#c2410c';

  return (
    <div style={{
      backgroundColor: bgColor,
      color: '#ffffff',
      padding: '12px 16px',
      position: 'sticky',
      top: 0,
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
          🚨 {activeAlert.title}
        </div>
        <div style={{ fontSize: '13px', marginTop: '2px', opacity: 0.95 }}>
          {activeAlert.instructions}
        </div>
      </div>

      {['superadmin', 'admin', 'concierge'].includes(userRole) && (
        <button
          onClick={handleResolveAlert}
          style={{
            backgroundColor: '#ffffff',
            color: bgColor,
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Dar por Superada
        </button>
      )}
    </div>
  );
}
