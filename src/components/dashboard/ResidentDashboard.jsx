import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useIsMobile } from '../../hooks/useMediaQuery';

export function ResidentDashboard({ onNavigate }) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [unitInfo, setUnitInfo] = useState(null);
  const [latestBill, setLatestBill] = useState(null);
  const [packages, setPackages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatCLP = (val) => '$' + Math.round(val || 0).toLocaleString('es-CL');

  const fetchResidentData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: unitData } = await supabase.from('units').select('id, unit_number, aliquot, condominium_id, condominiums(name)').eq('owner_id', profile.id).limit(1).maybeSingle();
      if (unitData) {
        setUnitInfo(unitData);
        const { data: billData } = await supabase.from('unit_expense_bills').select('id, total_amount, balance, status, executive_title_folio, expense_periods(period_name, due_date)').eq('unit_id', unitData.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        setLatestBill(billData);
        const { data: pkgData } = await supabase.from('parcels').select('id, tracking_number, pickup_pin, carrier, created_at').eq('unit_id', unitData.id).eq('status', 'received');
        setPackages(pkgData || []);
        const { data: annData } = await supabase.from('community_announcements').select('*').eq('condominium_id', unitData.condominium_id).eq('status', 'published').order('published_at', { ascending: false }).limit(2);
        setAnnouncements(annData || []);
      }
    } catch (err) {
      console.error('Error cargando datos de residente:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResidentData(); }, [profile?.id]);

  const hasDebt = latestBill && Number(latestBill.balance) > 0;

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-dim)' }}>Cargando…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: hasDebt ? '#7f1d1d' : '#064e3b', backgroundImage: hasDebt ? 'linear-gradient(135deg, #991b1b 0%, #450a0a 100%)' : 'linear-gradient(135deg, #059669 0%, #064e3b 100%)', color: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', letterSpacing: '1px', opacity: 0.85, textTransform: 'uppercase' }}>{unitInfo?.condominiums?.name || 'Mi Condominio'}</div>
            <h1 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '900' }}>Depto {unitInfo?.unit_number || '---'}</h1>
          </div>
          <span style={{ backgroundColor: hasDebt ? '#fecaca' : '#d1fae5', color: hasDebt ? '#991b1b' : '#065f46', padding: '4px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '11.5px' }}>
            {hasDebt ? 'CUOTA PENDIENTE' : 'AL DÍA'}
          </span>
        </div>
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>{hasDebt ? `Saldo Pendiente (${latestBill?.expense_periods?.period_name || 'Mes en curso'})` : 'Total a pagar'}</div>
          <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '2px', letterSpacing: '-0.5px' }}>{latestBill ? formatCLP(latestBill.balance) : '$0'}</div>
          {latestBill?.expense_periods?.due_date && hasDebt && <div style={{ fontSize: '11.5px', opacity: 0.85, marginTop: '4px' }}>Vence el: {latestBill.expense_periods.due_date}</div>}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
          {hasDebt && (
            <button onClick={() => onNavigate && onNavigate('expenses')} style={{ padding: '10px 20px', backgroundColor: 'var(--bg-card)', color: 'var(--danger-text)', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>💳 Pagar en Línea (Webpay)</button>
          )}
          <button onClick={() => onNavigate && onNavigate('expenses')} style={{ padding: '10px 16px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Ver Colilla Oficial (Art. 6)</button>
        </div>
      </div>

      {packages.length > 0 && (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '2px dashed var(--primary)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px' }}>📦</span>
            <strong style={{ fontSize: '14px' }}>Tienes {packages.length} {packages.length === 1 ? 'encomienda lista' : 'encomiendas listas'} en Conserjería</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {packages.map((pkg) => (
              <div key={pkg.id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #bfdbfe' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>{pkg.carrier || 'Reparto / Courier'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Presenta este código al conserje:</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: '900', color: '#1d4ed8', backgroundColor: 'var(--bg-surface)', padding: '4px 12px', borderRadius: '8px', letterSpacing: '3px' }}>{pkg.pickup_pin}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '10px' }}>
        <button onClick={() => onNavigate && onNavigate('visitors')} style={{ padding: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '22px' }}>🚪</span>
          <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>Pre-autorizar Visita</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Genera pase rápido con patente</span>
        </button>
        <button onClick={() => onNavigate && onNavigate('announcements')} style={{ padding: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '22px' }}>📢</span>
          <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>Circulares y Asambleas</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Acuerdos Ley N° 21.442</span>
        </button>
        <button onClick={() => onNavigate && onNavigate('emergency')} style={{ padding: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '22px' }}>🚨</span>
          <strong style={{ fontSize: '13px', color: 'var(--danger-text)' }}>Plan de Evacuación</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Zonas seguras y Bomberos</span>
        </button>
      </div>

      {announcements.length > 0 && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>ÚLTIMA CIRCULAR DE COPROPIEDAD</div>
          <h3 style={{ margin: '0 0 6px', fontSize: '15px', color: 'var(--text-main)' }}>{announcements[0].title}</h3>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{announcements[0].content?.slice(0, 160)}...</p>
          <div style={{ marginTop: '10px' }}>
            <button onClick={() => onNavigate && onNavigate('announcements')} style={{ fontSize: '12px', color: '#0284c7', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer', padding: 0 }}>
              Leer comunicado completo y firmar acuse →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
