import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { paymentGatewayService } from '../../../services/paymentGatewayService';
import { PaymentGatewayModal } from '../../payments/PaymentGatewayModal';

export function ResidentExpensesView() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [unit, setUnit] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gatewayTx, setGatewayTx] = useState(null);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [startingPayment, setStartingPayment] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [operationNumber, setOperationNumber] = useState('');
  const [uploadingVoucher, setUploadingVoucher] = useState(false);

  const formatCLP = (val) => '$' + Math.round(val || 0).toLocaleString('es-CL');

  const fetchResidentBills = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: unitData } = await supabase.from('units').select('id, unit_number, aliquot, condominium_id, condominiums(name)').eq('owner_id', profile.id).limit(1).maybeSingle();
      if (!unitData) { setLoading(false); return; }
      setUnit(unitData);
      const { data: billsData } = await supabase.from('unit_expense_bills').select('id, operational_amount, reserve_fund_amount, individual_charges, previous_debt, total_amount, paid_amount, balance, status, executive_title_folio, created_at, expense_periods(period_name, due_date, status)').eq('unit_id', unitData.id).order('created_at', { ascending: false });
      setBills(billsData || []);
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResidentBills(); }, [profile?.id]);

  const activeBill = bills.find((b) => Number(b.balance) > 0) || bills[0];
  const hasDebt = activeBill && Number(activeBill.balance) > 0;

  const handleStartOnlinePayment = async (billId) => {
    try {
      setStartingPayment(true);
      const tx = await paymentGatewayService.initiatePayment(billId);
      setGatewayTx(tx);
      setIsGatewayOpen(true);
    } catch (err) { alert(err.message || 'Error al conectar con la pasarela.'); }
    finally { setStartingPayment(false); }
  };

  const handleUploadVoucher = async (e) => {
    e.preventDefault();
    if (!operationNumber.trim()) { alert('Ingresa el número de operación.'); return; }
    try {
      setUploadingVoucher(true);
      const { error } = await supabase.from('bill_payments').insert({
        bill_id: activeBill.id, amount: activeBill.balance, payment_method: 'transferencia',
        transaction_number: operationNumber.trim(), status: 'pending_review',
        observations: 'Comprobante transferido manualmente por residente'
      });
      if (error) throw error;
      alert('Comprobante enviado a la administración para conciliación.');
      setIsManualModalOpen(false);
      setOperationNumber('');
      fetchResidentBills();
    } catch (err) { alert(err.message || 'Error al registrar el comprobante.'); }
    finally { setUploadingVoucher(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Cargando estado de cuenta...</div>;
  if (!unit) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>No tienes una unidad vinculada a tu cuenta.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '850px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: hasDebt ? '#991b1b' : '#065f46', backgroundImage: hasDebt ? 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)' : 'linear-gradient(135deg, #059669 0%, #064e3b 100%)', color: 'var(--text-main)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>{unit.condominiums?.name || 'Condominio'}</div>
            <h1 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '900' }}>Departamento {unit.unit_number}</h1>
          </div>
          <span style={{ backgroundColor: hasDebt ? '#fee2e2' : '#d1fae5', color: hasDebt ? '#991b1b' : '#065f46', padding: '4px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '11px' }}>{hasDebt ? 'COBRO PENDIENTE' : 'AL DÍA'}</span>
        </div>
        <div style={{ marginTop: '22px' }}>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>{hasDebt ? `Saldo a Pagar (${activeBill?.expense_periods?.period_name})` : 'Sin saldo adeudado'}</div>
          <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '2px', letterSpacing: '-0.5px' }}>{hasDebt ? formatCLP(activeBill.balance) : '$0'}</div>
          {activeBill?.expense_periods?.due_date && hasDebt && <div style={{ fontSize: '11.5px', opacity: 0.85, marginTop: '4px' }}>Fecha límite: <strong>{activeBill.expense_periods.due_date}</strong></div>}
        </div>
        {hasDebt && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => handleStartOnlinePayment(activeBill.id)} disabled={startingPayment} style={{ padding: '10px 22px', backgroundColor: 'var(--bg-card)', color: 'var(--danger-text)', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>💳 {startingPayment ? 'Conectando...' : 'Pagar en Línea con Webpay'}</button>
            <button onClick={() => setIsManualModalOpen(true)} style={{ padding: '10px 16px', backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}>Informar Transferencia</button>
          </div>
        )}
      </div>

      {activeBill && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>Desglose Legal: {activeBill.expense_periods?.period_name}</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>Folio: {activeBill.executive_title_folio || 'COL-2026-N/D'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>GASTO BASE (ALÍCUOTA)</div>
              <div style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px' }}>{formatCLP(activeBill.operational_amount)}</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>FONDO DE RESERVA (ART. 39)</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary)', marginTop: '2px' }}>{formatCLP(activeBill.reserve_fund_amount)}</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>DEUDA ANTERIOR</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: activeBill.previous_debt > 0 ? 'var(--danger-text)' : 'var(--text-main)', marginTop: '2px' }}>{formatCLP(activeBill.previous_debt)}</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>MULTAS / CARGOS</div>
              <div style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px' }}>{formatCLP(activeBill.individual_charges)}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>Historial de Colillas y Comprobantes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {bills.map((bill) => (
            <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>{bill.expense_periods?.period_name}</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Folio: {bill.executive_title_folio} • Vence: {bill.expense_periods?.due_date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{formatCLP(bill.total_amount)}</div>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: bill.status === 'paid' ? 'var(--success-text)' : 'var(--danger-text)' }}>{bill.status === 'paid' ? '● PAGADA' : `● SALDO: ${formatCLP(bill.balance)}`}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PaymentGatewayModal isOpen={isGatewayOpen} onClose={() => setIsGatewayOpen(false)} transactionData={gatewayTx} onSuccess={() => { fetchResidentBills(); }} />

      {isManualModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '24px', maxWidth: '420px', width: '100%' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '800' }}>Informar Transferencia Bancaria</h3>
            <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: 'var(--text-dim)' }}>Transfiere <strong>{formatCLP(activeBill?.balance)}</strong> a la cuenta corriente del condominio:</p>
            <form onSubmit={handleUploadVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)' }}>N° DE OPERACIÓN BANCARIA:</label>
                <input type="text" required placeholder="Ej: 8492019" value={operationNumber} onChange={(e) => setOperationNumber(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsManualModalOpen(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={uploadingVoucher} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--bg-surface)', color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer' }}>{uploadingVoucher ? 'Enviando...' : 'Confirmar Envío'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
