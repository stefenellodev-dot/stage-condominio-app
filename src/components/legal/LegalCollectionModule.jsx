import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { documentPdfService } from '../../services/documentPdfService';
import { useIsMobile } from '../../hooks/useMediaQuery';

export function LegalCollectionModule({ condominiumId }) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('cutoffs');
  const [morosityList, setMorosityList] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [accountabilityData, setAccountabilityData] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [certData, setCertData] = useState(null);
  const [presidentName, setPresidentName] = useState('Rodrigo Morales Peña');
  const [courtName, setCourtName] = useState('1er Juzgado de Policía Local de Santiago');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const formatCLP = (val) => '$' + Math.round(val || 0).toLocaleString('es-CL');

  const fetchData = async () => {
    if (!condominiumId) return;
    setLoading(true);
    const { data: morosity } = await supabase.from('vw_units_morosity').select('*').eq('condominium_id', condominiumId).order('unpaid_periods_count', { ascending: false });
    const { data: periodList } = await supabase.from('expense_periods').select('*').eq('condominium_id', condominiumId).eq('status', 'issued').order('period_date', { ascending: false });
    setMorosityList(morosity || []);
    setPeriods(periodList || []);
    if (periodList && periodList.length > 0) setSelectedPeriodId(periodList[0].id);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [condominiumId]);

  useEffect(() => {
    if (!selectedPeriodId) return;
    const fetchAccountability = async () => {
      const { data, error } = await supabase.rpc('get_accountability_report', { p_period_id: selectedPeriodId });
      if (!error) setAccountabilityData(data);
    };
    fetchAccountability();
  }, [selectedPeriodId]);

  const handleIssueCutoff = async (unit) => {
    const confirm = window.confirm(`⚠️ ¿Confirmas emitir Carta de Apercibimiento Legal de Corte (Art. 20)?\n\n• Unidad: Depto ${unit.unit_number}\n• Cuotas Impagas: ${unit.unpaid_periods_count}\n• Deuda Total: ${formatCLP(unit.total_debt)}\n\nSe otorgarán 5 días corridos de plazo fatal.`);
    if (!confirm) return;
    try {
      setActionLoading(true);
      const { data, error } = await supabase.rpc('issue_cutoff_notice', { p_unit_id: unit.unit_id, p_admin_id: profile.id, p_service_type: 'energia_electrica', p_days_deadline: 5 });
      if (error) throw error;
      alert(`✅ Apercibimiento generado: Folio ${data.folio}.\nPlazo fatal: ${data.deadline_date}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error al emitir apercibimiento.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateCertificate = async (unit) => {
    try {
      setActionLoading(true);
      const { data, error } = await supabase.rpc('generate_jpl_debt_certificate', { p_unit_id: unit.unit_id, p_admin_id: profile.id, p_president_name: presidentName, p_jpl_court: courtName });
      if (error) throw error;
      setCertData(data);
    } catch (err) {
      alert(err.message || 'Error al generar certificado judicial.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('cutoffs')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', backgroundColor: activeTab === 'cutoffs' ? '#0f172a' : '#e2e8f0', color: activeTab === 'cutoffs' ? '#fff' : '#475569' }}>
          ⚡ Suspensión de Suministros (Art. 20)
        </button>
        <button onClick={() => setActiveTab('jpl')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', backgroundColor: activeTab === 'jpl' ? '#0f172a' : '#e2e8f0', color: activeTab === 'jpl' ? '#fff' : '#475569' }}>
          ⚖️ Cobro Judicial JPL (Art. 6)
        </button>
        <button onClick={() => setActiveTab('accountability')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', backgroundColor: activeTab === 'accountability' ? '#0f172a' : '#e2e8f0', color: activeTab === 'accountability' ? '#fff' : '#475569' }}>
          📋 Rendición de Cuentas (Art. 22)
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px' }}>Cargando datos legales...</div>
      ) : activeTab === 'cutoffs' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px', padding: '12px', fontSize: '12.5px', color: 'var(--danger-text)' }}>
            <strong>Marco Legal Art. 20:</strong> Procede suspender el servicio eléctrico a unidades con <strong>3 o más cuotas impagas</strong>, previa notificación fehaciente otorgando plazo fatal.
          </div>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 14px' }}>Unidad</th>
                  <th style={{ padding: '10px 14px' }}>Copropietario</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Cuotas Impagas</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Deuda Total</th>
                  <th style={{ padding: '10px 14px' }}>Estado Corte</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {morosityList.filter(u => u.total_debt > 0).map(u => (
                  <tr key={u.unit_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700' }}>Depto {u.unit_number}</td>
                    <td style={{ padding: '10px 14px' }}>{u.owner_name || 'Sin asignar'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '12px', fontWeight: '800', fontSize: '11px', backgroundColor: u.is_cutoff_eligible ? '#fee2e2' : '#fef3c7', color: u.is_cutoff_eligible ? '#b91c1c' : '#b45309' }}>
                        {u.unpaid_periods_count} {u.unpaid_periods_count === 1 ? 'cuota' : 'cuotas'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: 'var(--text-main)' }}>{formatCLP(u.total_debt)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {u.active_cutoff_status === 'notified' ? <span style={{ color: 'var(--warning-text)', fontWeight: '700', fontSize: '11.5px' }}>⏳ Apercibido (Vence {u.active_cutoff_deadline})</span> :
                       u.active_cutoff_status === 'suspended' ? <span style={{ color: 'var(--danger-text)', fontWeight: '800', fontSize: '11.5px' }}>🔴 Suministro Cortado</span> :
                       u.is_cutoff_eligible ? <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '11.5px' }}>Sujeto a Corte Inmediato</span> :
                       <span style={{ color: 'var(--text-dim)', fontSize: '11.5px' }}>Deuda regular</span>}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {u.is_cutoff_eligible && u.active_cutoff_status !== 'notified' && (
                          <button disabled={actionLoading} onClick={() => handleIssueCutoff(u)} style={{ padding: '6px 12px', backgroundColor: 'var(--danger)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}>⚡ Apercibir Corte</button>
                        )}
                        {u.active_cutoff_status === 'notified' && (
                          <button onClick={() => documentPdfService.downloadCutoffNoticePdf({ condo_name: u.condo_name, unit_number: u.unit_number, total_debt: u.total_debt, unpaid_periods_count: u.unpaid_periods_count, notice_folio: 'NOT-CORTE-' + u.unit_number, deadline_date: u.active_cutoff_deadline || '5 días desde notificación', service_type: 'energia_electrica' })} style={{ padding: '6px 10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}>📥 Carta PDF (QR)</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'jpl' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: '8px', padding: '12px', fontSize: '12.5px', color: 'var(--success-text)' }}>
            <strong>Mérito Ejecutivo (Art. 6):</strong> Las colillas de cobro constituyen <strong>título ejecutivo</strong> ante los Juzgados de Policía Local para iniciar juicio sumario de cobro.
          </div>
          {certData ? (
            <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--text-main)', borderRadius: '8px', padding: '24px', fontFamily: 'serif' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--text-main)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', textTransform: 'uppercase' }}>{certData.condo_name}</h2>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Administración de Edificios y Condominios</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>FOLIO: {certData.folio}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Fecha: {certData.issued_at}</div>
                </div>
              </div>
              <h3 style={{ textAlign: 'center', textTransform: 'uppercase', fontSize: '16px', letterSpacing: '1px', margin: '20px 0' }}>
                Certificado de Deuda de Gastos Comunes con Mérito Ejecutivo<br />
                <span style={{ fontSize: '12px', fontWeight: 'normal' }}>(Art. 6° Ley N° 21.442)</span>
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', textAlign: 'justify' }}>
                El Administrador certifica que el copropietario de la <strong>Unidad N° {certData.unit_number}</strong> adeuda la suma de <strong>{formatCLP(certData.total_debt)} CLP</strong>, desglosada en {certData.unpaid_periods_count} períodos:
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '14px 0', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                    <th style={{ padding: '6px' }}>Período</th>
                    <th style={{ padding: '6px' }}>Folio Colilla</th>
                    <th style={{ padding: '6px' }}>Vencimiento</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Saldo Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {certData.bills_detail.map((b, i) => (
                    <tr key={i} style={{ borderBottom: '1px dotted #ccc' }}>
                      <td style={{ padding: '6px' }}>{b.period_name}</td>
                      <td style={{ padding: '6px' }}>{b.executive_folio || 'S/F'}</td>
                      <td style={{ padding: '6px' }}>{b.due_date}</td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{formatCLP(b.balance_due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '50px', textAlign: 'center', fontSize: '12px' }}>
                <div><div style={{ borderTop: '1px solid #000', paddingTop: '6px', fontWeight: 'bold' }}>Firma Administrador</div><div>Condominio {certData.condo_name}</div></div>
                <div><div style={{ borderTop: '1px solid #000', paddingTop: '6px', fontWeight: 'bold' }}>V°B° Presidente Comité</div><div>{certData.committee_president_name}</div></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <button onClick={() => documentPdfService.downloadJplCertificatePdf(certData)} style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>📥 Descargar PDF (QR)</button>
                <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#0f172a', color: 'var(--text-main)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🖨️ Imprimir / Guardar PDF</button>
                <button onClick={() => setCertData(null)} style={{ padding: '8px 16px', border: '1px solid #ccc', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Volver al Listado</button>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>Unidades con Deuda Ejecutiva Exigible:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {morosityList.filter(u => u.total_debt > 0).map(u => (
                  <div key={u.unit_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px' }}>
                    <div>
                      <strong>Depto {u.unit_number}</strong> — {u.owner_name} ({u.unpaid_periods_count} cuotas impagas)
                      <div style={{ fontSize: '12px', color: 'var(--danger-text)', fontWeight: 'bold' }}>Deuda: {formatCLP(u.total_debt)}</div>
                    </div>
                    <button onClick={() => handleGenerateCertificate(u)} disabled={actionLoading} style={{ padding: '8px 14px', backgroundColor: 'var(--primary)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      📜 Emitir Título Ejecutivo JPL
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Selecciona Período a Rendir:</span>
            <select value={selectedPeriodId} onChange={(e) => setSelectedPeriodId(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}>
              {periods.map(p => (<option key={p.id} value={p.id}>{p.period_name}</option>))}
            </select>
          </div>
          {accountabilityData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>TOTAL FACTURADO</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px' }}>{formatCLP(accountabilityData.financial_summary.total_billed)}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>TOTAL RECAUDADO</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success-text)', marginTop: '4px' }}>{formatCLP(accountabilityData.financial_summary.total_collected)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--success-text)' }}>{accountabilityData.financial_summary.collection_rate_pct}% efectividad</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>EGRESOS OPERACIONALES</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger-text)', marginTop: '4px' }}>{formatCLP(accountabilityData.financial_summary.total_operational_expenses)}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>APORTE FONDO RESERVA</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>{formatCLP(accountabilityData.financial_summary.reserve_fund_inflow)}</div>
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ fontSize: '13.5px' }}>Desglose de Egresos Mensuales:</strong>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '8px' }}>Categoría de Gasto</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Monto Rendido</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>% del Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountabilityData.expenses_breakdown.map((exp, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px', textTransform: 'capitalize' }}>{exp.category.replace('_', ' ')}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCLP(exp.total)}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-dim)' }}>{exp.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default LegalCollectionModule;
