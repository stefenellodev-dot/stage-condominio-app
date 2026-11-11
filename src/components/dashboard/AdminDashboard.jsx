import React, { useState, useEffect } from 'react';
import '../../styles/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useIsMobile } from '../../hooks/useMediaQuery';

export function AdminDashboard({ condominiumId, onNavigate }) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [financials, setFinancials] = useState({ billed: 0, collected: 0, collectionPct: 0, reserveFund: 0 });
  const [cutoffEligibleCount, setCutoffEligibleCount] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const formatCLP = (val) => '$' + Math.round(val || 0).toLocaleString('es-CL');

  const fetchAdminMetrics = async () => {
    if (!condominiumId) return;
    setLoading(true);
    try {
      const { data: periodData } = await supabase.from('expense_periods').select('*').eq('condominium_id', condominiumId).order('period_date', { ascending: false }).limit(1).maybeSingle();
      if (periodData) {
        setCurrentPeriod(periodData);
        if (periodData.status === 'issued') {
          const { data: report } = await supabase.rpc('get_accountability_report', { p_period_id: periodData.id });
          if (report?.financial_summary) {
            setFinancials({ billed: report.financial_summary.total_billed, collected: report.financial_summary.total_collected, collectionPct: report.financial_summary.collection_rate_pct, reserveFund: report.financial_summary.reserve_fund_inflow });
          }
        }
      }
      const { data: moroseData } = await supabase.from('vw_units_morosity').select('unit_id').eq('condominium_id', condominiumId).eq('is_cutoff_eligible', true);
      setCutoffEligibleCount(moroseData?.length || 0);
      const { data: pendingPay } = await supabase.from('bill_payments').select('id').eq('status', 'pending_review');
      setPendingPaymentsCount(pendingPay?.length || 0);
    } catch (err) {
      console.error('Error cargando métricas de administración:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdminMetrics(); }, [condominiumId]);

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-dim)' }}>Cargando…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Panel de Gestión Administrativa</h1>
          <div style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>Período Activo: <strong>{currentPeriod?.period_name || 'Sin período'}</strong> ({currentPeriod?.status === 'issued' ? 'Emitido' : 'Borrador'})</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onNavigate && onNavigate('expenses')} style={{ padding: '8px 16px', backgroundColor: 'var(--success)', color: 'var(--text-main)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}>⚙️ Gastos y Prorrateo</button>
          <button onClick={() => onNavigate && onNavigate('legal_collection')} style={{ padding: '8px 16px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}>⚖️ Módulo Legal (Art. 6/20)</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' }}>Total Facturado</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>{formatCLP(financials.billed)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' }}>Recaudación Efectiva</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success-text)', marginTop: '4px' }}>{formatCLP(financials.collected)}</div>
          <div style={{ fontSize: '11px', color: 'var(--success-text)', fontWeight: '600' }}>{financials.collectionPct}% recuperado</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' }}>Fondo de Reserva (Art. 39)</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>{formatCLP(financials.reserveFund)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' }}>Conciliaciones Pendientes</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: pendingPaymentsCount > 0 ? '#ea580c' : '#0f172a', marginTop: '4px' }}>{pendingPaymentsCount}</div>
        </div>
      </div>

      {cutoffEligibleCount > 0 && (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--danger-text)' }}>{cutoffEligibleCount} {cutoffEligibleCount === 1 ? 'Unidad apta' : 'Unidades aptas'} para Corte de Suministro</strong>
              <div style={{ fontSize: '12px', color: 'var(--danger-text)' }}>Registran 3 o más cuotas impagas (Ley N° 21.442, Art. 20).</div>
            </div>
          </div>
          <button onClick={() => onNavigate && onNavigate('legal_collection')} style={{ padding: '8px 14px', backgroundColor: 'var(--danger)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Apercibir con Plazo Fatal →</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '700' }}>Cierre y Prorrateo</h3>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-dim)' }}>Distribuye gastos operacionales según alícuota.</p>
          <button onClick={() => onNavigate && onNavigate('expenses')} style={{ padding: '6px 12px', backgroundColor: 'var(--primary)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Ir a Períodos de Gasto</button>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '700' }}>Certificados JPL (Art. 6)</h3>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-dim)' }}>Genera títulos ejecutivos con código QR.</p>
          <button onClick={() => onNavigate && onNavigate('legal_collection')} style={{ padding: '6px 12px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Gestionar Cobro Judicial</button>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '700' }}>Rendición Asambleas (Art. 22)</h3>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-dim)' }}>Reportes contables con respaldo de facturas.</p>
          <button onClick={() => onNavigate && onNavigate('legal_collection')} style={{ padding: '6px 12px', backgroundColor: 'var(--border-subtle)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Ver Balances del Mes</button>
        </div>
      </div>
    </div>
  );
}
