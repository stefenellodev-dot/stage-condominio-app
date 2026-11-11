import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';

export function PeriodCloseModal({ isOpen, onClose, period, condominiumId, adminId, onSuccess }) {
  const [expenses, setExpenses] = useState([]);
  const [reserveFundPct, setReserveFundPct] = useState(5.0);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !period) return;
    const fetchSummary = async () => {
      setLoading(true);
      setErrorMsg('');
      const { data: expData, error: expErr } = await supabase
        .from('condo_expenses').select('*').eq('period_id', period.id);
      const { data: unitData, error: unitErr } = await supabase
        .from('units').select('id, unit_number, aliquot').eq('condominium_id', condominiumId).order('unit_number');
      if (expErr || unitErr) {
        setErrorMsg('Error al cargar datos contables del período.');
      } else {
        setExpenses(expData || []);
        setUnits(unitData || []);
      }
      setLoading(false);
    };
    fetchSummary();
  }, [isOpen, period, condominiumId]);

  if (!isOpen || !period) return null;

  const totalOperational = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalReserve = Math.round(totalOperational * (reserveFundPct / 100.0));
  const grandTotal = totalOperational + totalReserve;

  const formatCLP = (val) => '$' + Math.round(val || 0).toLocaleString('es-CL');

  const handleIssuePeriod = async () => {
    if (expenses.length === 0) {
      alert('No puedes emitir un período sin gastos registrados.');
      return;
    }
    const confirmMessage = `¿Confirmas la emisión del período "${period.period_name}"?\n\n` +
      `• Total Gastos Operacionales: ${formatCLP(totalOperational)}\n` +
      `• Fondo de Reserva (${reserveFundPct}%): ${formatCLP(totalReserve)}\n` +
      `• Total a Prorratear: ${formatCLP(grandTotal)}\n` +
      `• Unidades Facturadas: ${units.length}\n\n` +
      `Esta acción otorgará mérito ejecutivo a las colillas (Art. 6 Ley 21.442).`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setSubmitting(true);
      setErrorMsg('');
      const { data, error } = await supabase.rpc('close_and_issue_expense_period', {
        p_period_id: period.id,
        p_admin_id: adminId,
        p_reserve_fund_pct: Number(reserveFundPct)
      });
      if (error) throw error;
      alert(`✅ Período ${period.period_name} emitido con éxito.\nSe generaron ${data.bills_generated} colillas individuales.`);
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al emitir el período.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={`📊 Cierre y Prorrateo Mensual: ${period.period_name}`}>
      {errorMsg && (
        <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
          {errorMsg}
        </div>
      )}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>Consolidando balance del período...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' }}>Gastos Operacionales</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>{formatCLP(totalOperational)}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>{expenses.length} facturas ingresadas</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' }}>Fondo de Reserva</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>{formatCLP(totalReserve)}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--primary)' }}>{reserveFundPct}% mandatorio (Art. 39)</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' }}>Total a Prorratear</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success-text)', marginTop: '2px' }}>{formatCLP(grandTotal)}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--success-text)' }}>{units.length} unidades activas</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div>
              <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>% Recargo Fondo de Reserva:</strong>
              <div style={{ fontSize: '11.5px', color: '#3b82f6' }}>Ley N° 21.442 exige mantención permanente.</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[5.0, 8.0, 10.0].map((pct) => (
                <button key={pct} type="button" onClick={() => setReserveFundPct(pct)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #3b82f6', backgroundColor: reserveFundPct === pct ? 'var(--primary-active)' : 'var(--bg-card)', color: reserveFundPct === pct ? 'var(--text-main)' : 'var(--primary)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                  {pct}%
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>Facturas del Período ({expenses.length}):</div>
            <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '6px 10px' }}>Proveedor</th>
                    <th style={{ padding: '6px 10px' }}>Categoría</th>
                    <th style={{ padding: '6px 10px' }}>Documento</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 10px', fontWeight: '600' }}>{e.supplier_name}</td>
                      <td style={{ padding: '6px 10px', textTransform: 'capitalize' }}>{e.category.replace('_', ' ')}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--text-dim)' }}>{e.document_number}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '700' }}>{formatCLP(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
            <button type="button" onClick={handleIssuePeriod} disabled={submitting || expenses.length === 0} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: submitting || expenses.length === 0 ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Emitiendo y Prorrateando...' : '⚖️ Emitir Período y Despachar Colillas (Art. 6)'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
