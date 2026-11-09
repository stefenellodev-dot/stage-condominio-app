import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { storageService } from '../../services/storageService';
import { useIsMobile } from '../../hooks/useMediaQuery';

export function EmergencyPlanView({ condominiumId }) {
  const isMobile = useIsMobile();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evacUrl, setEvacUrl] = useState(null);

  useEffect(() => {
    if (!condominiumId) return;
    const fetchPlan = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('emergency_plans')
        .select('*')
        .eq('condominium_id', condominiumId)
        .eq('status', 'active')
        .order('valid_year', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setPlan(data);
        if (data.evacuation_map_url) {
          try {
            const url = await storageService.getSignedDownloadUrl('comunicados', data.evacuation_map_url);
            setEvacUrl(url);
          } catch (e) { setEvacUrl(null); }
        }
      }
      setLoading(false);
    };
    fetchPlan();
  }, [condominiumId]);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando Plan de Emergencia...</div>;
  if (!plan) return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
      <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>Plan de Emergencia en Elaboración</strong>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>La administración aún no ha cargado el expediente visado para este año.</p>
    </div>
  );

  const contacts = plan.emergency_contacts || [];
  const assemblyPoints = plan.assembly_points || [];
  const equipment = plan.equipment_status || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: isMobile ? '16px' : '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase' }}>Ley N° 21.442 — Art. 40</span>
            <h2 style={{ fontSize: isMobile ? '18px' : '20px', margin: '8px 0 4px', fontWeight: '800', color: 'var(--text-main)' }}>Plan de Emergencia y Evacuación {plan.valid_year}</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Versión: <strong>{plan.version}</strong> | Aprobación: {plan.approval_date}</div>
          </div>
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '8px 12px', fontSize: '11.5px', lineHeight: 1.4, color: 'var(--text-main)' }}>
            <div>🚒 Bomberos: <strong>{plan.bomberos_approval_folio}</strong></div>
            <div>👮 Carabineros: <strong>{plan.carabineros_approval_folio}</strong></div>
            <div style={{ color: '#0369a1', marginTop: '2px' }}>Próximo Simulacro: <strong>{plan.next_drill_deadline}</strong></div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: isMobile ? '16px' : '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', color: 'var(--text-main)' }}>📞 Contactos Críticos (Discado Directo)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {contacts.map((c, idx) => (
            <a key={idx} href={'tel:' + c.phone.replace(/\s+/g, '')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: c.priority === 1 ? 'rgba(239,68,68,0.1)' : 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: c.priority === 1 ? 'var(--danger-text)' : 'var(--text-main)' }}>{c.entity}</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>{c.phone}</div>
              </div>
              <span style={{ fontSize: '20px' }}>📲</span>
            </a>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', color: 'var(--text-main)' }}>🧯 Infraestructura de Extinción</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {Object.entries(equipment).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
                <span>{k.replace(/_/g, ' ')}</span>
                <strong style={{ color: String(v).includes('operativ') ? 'var(--success-text)' : 'var(--warning-text)' }}>{String(v).toUpperCase()}</strong>
              </div>
            ))}
          </div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', color: 'var(--text-main)' }}>🟢 Puntos de Encuentro</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {assemblyPoints.map((pt, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <strong style={{ color: 'var(--success-text)' }}>{pt.zone}:</strong> {pt.location}
                {pt.capacity && <span style={{ color: 'var(--text-dim)', marginLeft: '6px' }}>({pt.capacity})</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {evacUrl && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, textTransform: 'uppercase', color: 'var(--text-main)' }}>🗺️ Plano de Evacuación</h3>
            <a href={evacUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '700' }}>Abrir ↗</a>
          </div>
          <img src={evacUrl} alt="Plano de Evacuación" style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
        </div>
      )}
    </div>
  );
}
