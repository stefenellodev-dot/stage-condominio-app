import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';
import { useConfirm } from '../../hooks/useConfirm';
import { usePermissions } from '../../hooks/usePermissions';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { storageService } from '../../services/storageService';
import { paymentGatewayService } from '../../services/paymentGatewayService';
import { PaymentGatewayModal } from '../payments/PaymentGatewayModal';
import { PeriodCloseModal } from '../expenses/PeriodCloseModal';
import Modal from '../ui/Modal';
import { billPdfService } from '../../services/billPdfService';
import { ExpenseBillDocument } from '../expenses/ExpenseBillDocument';

const CATEGORIES = ['administracion', 'mantencion', 'reparacion', 'uso_consumo', 'extraordinario'];

const fmtCLP = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

export default function ExpensesModule() {
  const isMobile = useIsMobile();
  const { isSuperadmin, isAdmin, profile } = useAuth();
  const { canCreate, canEdit } = usePermissions('expenses');
  const canManage = canCreate || canEdit;
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();
  const { confirm, ConfirmDialogNode } = useConfirm();

  const [tab, setTab] = useState('egresos');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [condominiums, setCondominiums] = useState([]);
  const [selectedCondo, setSelectedCondo] = useState('');
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingBill, setViewingBill] = useState(null);

  // Form egreso
  const [expForm, setExpForm] = useState({ category: 'administracion', description: '', supplier_name: '', supplier_rut: '', invoice_number: '', amount: '' });
  const [savingExp, setSavingExp] = useState(false);

  // Form pago
  const [payForm, setPayForm] = useState({ bill_id: '', amount: '', payment_method: 'transferencia', transaction_number: '', voucher_url: '' });
  const [payFile, setPayFile] = useState(null);
  const [gatewayTx, setGatewayTx] = useState(null);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [startingPayment, setStartingPayment] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [savingPay, setSavingPay] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: companiesData } = await supabase.from('management_companies').select('id,legal_name,fantasy_name').is('deleted_at', null).order('legal_name');
      setCompanies(companiesData || []);
      if (companiesData && companiesData.length) {
        setSelectedCompany(companiesData[0].id);
      } else {
        // Regular user: load their condo directly
        const uid = profile?.id;
        let condoId = profile?.condominium_id;
        if (!condoId && uid) {
          const { data: units } = await supabase.from('units').select('condominium_id').eq('owner_id', uid).limit(1);
          if (units && units.length) condoId = units[0].condominium_id;
        }
        if (condoId) {
          const { data: condo } = await supabase.from('condominiums').select('id,name,rut,management_company_id').eq('id', condoId).is('deleted_at', null).maybeSingle();
          if (condo) {
            setCondominiums([condo]);
            setSelectedCondo(condo.id);
          }
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedCompany) return;
    (async () => {
      const { data } = await supabase.from('condominiums').select('id,name,rut,management_company_id').eq('management_company_id', selectedCompany).is('deleted_at', null).order('name');
      setCondominiums(data || []);
      if (data && data.length) setSelectedCondo(data[0].id);
    })();
  }, [selectedCompany]);

  useEffect(() => {
    if (!selectedCondo) return;
    (async () => {
      const { data } = await supabase
        .from('expense_periods')
        .select('id, period_name, period_date, status, total_expenses, total_reserve_fund, total_billed')
        .eq('condominium_id', selectedCondo)
        .is('deleted_at', null)
        .order('period_date', { ascending: false });
      setPeriods(data || []);
      if (data && data.length) setSelectedPeriod(data[0].id);
    })();
  }, [selectedCondo]);

  const loadExpenses = async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('id, category, description, supplier_name, supplier_rut, invoice_number, amount, created_at')
      .eq('period_id', selectedPeriod)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) showError(error.message); else setExpenses(data || []);
    setLoading(false);
  };

  const loadBills = async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    let q = supabase
      .from('unit_expense_bills')
      .select('id, unit_id, owner_id, base_aliquot_amount, reserve_fund_amount, individual_charges_amount, previous_debt_amount, interest_amount, total_amount, paid_amount, balance, status, units(unit_number, aliquot), expense_periods(period_name, due_date)')
      .eq('period_id', selectedPeriod)
      .is('deleted_at', null)
      .order('units(unit_number)');
    if (!canManage && profile?.id) q = q.eq('owner_id', profile.id);
    const { data, error } = await q;
    if (error) { showError(error.message); return []; }
    else { setBills(data || []); setLoading(false); return data || []; }
  };

  const loadPayments = async (billsList) => {
    const list = billsList || bills;
    if (!selectedPeriod) return;
    setLoading(true);
    const billIds = list.map(b => b.id);
    if (!billIds.length) { setPayments([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('bill_payments')
      .select('id, bill_id, unit_id, user_id, amount, payment_method, transaction_number, payment_date, status, created_at, unit_expense_bills(total_amount, units(unit_number))')
      .in('bill_id', billIds)
      .order('created_at', { ascending: false });
    if (error) showError(error.message); else setPayments(data || []);
    setLoading(false);
  };

  useEffect(() => { if (tab === 'egresos') loadExpenses(); }, [tab, selectedPeriod]);
  useEffect(() => { if (tab === 'colillas' && profile) loadBills(); }, [tab, selectedPeriod, profile]);
  useEffect(() => { if (tab === 'pagos' && profile) { loadBills().then(b => loadPayments(b)); } }, [tab, selectedPeriod, profile]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expForm.description.trim() || !expForm.amount) { showError('Descripción y monto son obligatorios'); return; }
    setSavingExp(true);
    const { error } = await supabase.from('expenses').insert({
      period_id: selectedPeriod,
      condominium_id: selectedCondo,
      category: expForm.category,
      description: expForm.description.trim(),
      supplier_name: expForm.supplier_name.trim() || null,
      supplier_rut: expForm.supplier_rut.trim() || null,
      invoice_number: expForm.invoice_number.trim() || null,
      amount: parseInt(expForm.amount, 10),
    });
    setSavingExp(false);
    if (error) { showError(error.message); return; }
    showSuccess('Egreso registrado');
    setExpForm({ category: 'administracion', description: '', supplier_name: '', supplier_rut: '', invoice_number: '', amount: '' });
    loadExpenses();
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    if (!payForm.bill_id || !payForm.amount) { showError('Selecciona una colilla y un monto'); return; }
    setSavingPay(true);
    const bill = bills.find(b => b.id === payForm.bill_id);

    let voucherPath = payForm.voucher_url.trim() || null;
    if (payFile) {
      try {
        voucherPath = await storageService.uploadPaymentVoucher({
          condominiumId: selectedCondo,
          periodId: selectedPeriod,
          unitId: bill?.unit_id,
          file: payFile,
        });
      } catch (err) {
        setSavingPay(false);
        showError(err.message || 'Error al subir el comprobante.');
        return;
      }
    }

    const { error } = await supabase.from('bill_payments').insert({
      bill_id: payForm.bill_id,
      unit_id: bill?.unit_id,
      user_id: profile?.id,
      amount: parseInt(payForm.amount, 10),
      payment_method: payForm.payment_method,
      transaction_number: payForm.transaction_number.trim() || null,
      voucher_url: voucherPath,
    });
    setSavingPay(false);
    if (error) { showError(error.message); return; }
    showSuccess('Pago registrado');
    setPayForm({ bill_id: '', amount: '', payment_method: 'transferencia', transaction_number: '', voucher_url: '' });
    setPayFile(null);
    loadBills().then(b => loadPayments(b));
  };

  const handleStartOnlinePayment = async (billId) => {
    try {
      setStartingPayment(true);
      const tx = await paymentGatewayService.initiatePayment(billId);
      setGatewayTx(tx);
      setIsGatewayOpen(true);
    } catch (err) {
      showError(err.message || 'Error al conectar con la pasarela de pagos.');
    } finally {
      setStartingPayment(false);
    }
  };

  const handleReconcile = async (paymentId, action) => {
    let reason = null;
    if (action === 'reject') {
      reason = prompt('Motivo del rechazo:');
      if (reason === null) return;
    }
    const { error } = await supabase.rpc('reconcile_bill_payment', {
      p_payment_id: paymentId,
      p_admin_id: profile.id,
      p_action: action,
      p_rejection_reason: reason,
    });
    if (error) { showError(error.message); return; }
    showSuccess(action === 'verify' ? 'Pago conciliado exitosamente' : 'Pago rechazado');
    loadBills().then(b => loadPayments(b));
  };

  const period = periods.find(p => p.id === selectedPeriod);

  const tabStyle = (active) => ({
    padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    background: active ? 'var(--primary)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    borderRadius: 'var(--radius-md)',
  });

  return (
    <div style={{ marginTop: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>Gastos Comunes y Finanzas</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Periodo contable, egresos, colillas y pagos.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {companies.length > 0 && (
            <select
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              style={{ ...styles.select, minWidth: '220px' }}
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.fantasy_name || c.legal_name}</option>
              ))}
            </select>
          )}
          {condominiums.length > 0 && (
            <select
              value={selectedCondo}
              onChange={e => setSelectedCondo(e.target.value)}
              style={{ ...styles.select, minWidth: '240px' }}
            >
              {condominiums.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} style={styles.select}>
          {periods.map(p => <option key={p.id} value={p.id}>{p.period_name} ({p.status})</option>)}
        </select>
        {canManage && selectedPeriod && period?.status !== 'issued' && (
          <button onClick={() => setIsCloseModalOpen(true)} style={{ ...styles.button, backgroundColor: 'var(--success)', fontSize: '12.5px', padding: '8px 16px' }}>
            ⚙️ Cierre y Prorrateo Masivo
          </button>
        )}
      </div>

      {period && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', flexWrap: 'wrap', fontSize: '13px' }}>
          <span>Egresos: <strong>{fmtCLP(period.total_expenses)}</strong></span>
          <span>Fondo reserva: <strong>{fmtCLP(period.total_reserve_fund)}</strong></span>
          <span>Total facturado: <strong>{fmtCLP(period.total_billed)}</strong></span>
          <span>Vencimiento: <strong>{period.due_date}</strong></span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        <button style={tabStyle(tab === 'egresos')} onClick={() => setTab('egresos')}>Egresos</button>
        <button style={tabStyle(tab === 'colillas')} onClick={() => setTab('colillas')}>Colillas</button>
        <button style={tabStyle(tab === 'pagos')} onClick={() => setTab('pagos')}>Pagos</button>
      </div>

      {loading && <p style={{ color: 'var(--text-dim)' }}>Cargando…</p>}

      {tab === 'egresos' && (
        <div>
          {canManage && (
            <form onSubmit={handleCreateExpense} style={{ ...styles.form, marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <select value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })} style={styles.select}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Descripción" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} style={styles.input} required />
                <input placeholder="Monto CLP" type="number" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} style={styles.input} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
                <input placeholder="Proveedor" value={expForm.supplier_name} onChange={e => setExpForm({ ...expForm, supplier_name: e.target.value })} style={styles.input} />
                <input placeholder="RUT proveedor" value={expForm.supplier_rut} onChange={e => setExpForm({ ...expForm, supplier_rut: e.target.value })} style={styles.input} />
                <input placeholder="Nº factura" value={expForm.invoice_number} onChange={e => setExpForm({ ...expForm, invoice_number: e.target.value })} style={styles.input} />
              </div>
              <button type="submit" disabled={savingExp} style={{ ...styles.button, marginTop: '10px' }}>{savingExp ? 'Guardando…' : 'Registrar egreso'}</button>
            </form>
          )}
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '700px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Categoría</th><th style={styles.th}>Descripción</th><th style={styles.th}>Proveedor</th><th style={styles.th}>Monto</th><th style={styles.th}>Fecha</th>
              </tr></thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin egresos registrados.</td></tr>
                ) : expenses.map(e => (
                  <tr key={e.id} style={styles.tr}>
                    <td style={styles.td}>{e.category}</td>
                    <td style={styles.td}>{e.description}</td>
                    <td style={styles.td}>{e.supplier_name || '—'}</td>
                    <td style={styles.td}>{fmtCLP(e.amount)}</td>
                    <td style={styles.td}>{new Date(e.created_at).toLocaleDateString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'colillas' && (
        <div>
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bills.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin colillas para este periodo.</div>
              ) : bills.map(b => (
                <div key={b.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '15px' }}>Unidad {b.units?.unit_number}</strong>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: b.status === 'paid' ? 'var(--success-text)' : 'var(--warning-text)' }}>{b.status}</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>{fmtCLP(b.total_amount)}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px' }}>
                    <div>Ordinario: {fmtCLP(b.base_aliquot_amount)}</div>
                    <div>Fondo reserva: {fmtCLP(b.reserve_fund_amount)}</div>
                    <div>Cargos: {fmtCLP(b.individual_charges_amount)}</div>
                    <div>Pagado: {fmtCLP(b.paid_amount)}</div>
                    <div>Saldo: {fmtCLP(b.balance)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setViewingBill(b)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
                      Ver Colilla
                    </button>
                    {b.balance > 0 && (
                      <button onClick={() => handleStartOnlinePayment(b.id)} disabled={startingPayment} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: '700', cursor: startingPayment ? 'not-allowed' : 'pointer' }}>
                        {startingPayment ? 'Conectando...' : '💳 Pagar en Línea'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '800px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Unidad</th><th style={styles.th}>Ordinario</th><th style={styles.th}>Fondo reserva</th><th style={styles.th}>Cargos individuales</th><th style={styles.th}>Total</th><th style={styles.th}>Pagado</th><th style={styles.th}>Saldo</th><th style={styles.th}>Estado</th><th style={styles.th}>Colilla</th>
              </tr></thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr><td colSpan="9" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin colillas para este periodo.</td></tr>
                ) : bills.map(b => (
                  <tr key={b.id} style={styles.tr}>
                    <td style={styles.td}>{b.units?.unit_number}</td>
                    <td style={styles.td}>{fmtCLP(b.base_aliquot_amount)}</td>
                    <td style={styles.td}>{fmtCLP(b.reserve_fund_amount)}</td>
                    <td style={styles.td}>{fmtCLP(b.individual_charges_amount)}</td>
                    <td style={styles.td}><strong>{fmtCLP(b.total_amount)}</strong></td>
                    <td style={styles.td}>{fmtCLP(b.paid_amount)}</td>
                    <td style={styles.td}>{fmtCLP(b.balance)}</td>
                    <td style={styles.td}>{b.status}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => setViewingBill(b)}
                        style={styles.buttonAction}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {tab === 'pagos' && (
        <div>
          {canManage || bills.length > 0 ? (
            <form onSubmit={handleRegisterPayment} style={{ ...styles.form, marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <select value={payForm.bill_id} onChange={e => setPayForm({ ...payForm, bill_id: e.target.value })} style={styles.select} required>
                  <option value="">Selecciona colilla</option>
                  {bills.map(b => <option key={b.id} value={b.id}>{b.units?.unit_number} — {fmtCLP(b.balance)} pendiente</option>)}
                </select>
                <input placeholder="Monto CLP" type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} style={styles.input} required />
                <select value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })} style={styles.select}>
                  <option value="transferencia">Transferencia</option>
                  <option value="deposito">Depósito</option>
                  <option value="webpay">Webpay</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                <input placeholder="Nº operación" value={payForm.transaction_number} onChange={e => setPayForm({ ...payForm, transaction_number: e.target.value })} style={styles.input} />
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setPayFile(e.target.files[0])} style={styles.input} />
              </div>
              <button type="submit" disabled={savingPay} style={{ ...styles.button, marginTop: '10px' }}>{savingPay ? 'Guardando…' : 'Registrar pago'}</button>
            </form>
          ) : null}
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '700px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Unidad</th><th style={styles.th}>Monto</th><th style={styles.th}>Método</th><th style={styles.th}>Nº operación</th><th style={styles.th}>Fecha</th><th style={styles.th}>Estado</th><th style={styles.th}>Comprobante</th><th style={styles.th}>Acciones</th>
              </tr></thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan="8" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin pagos registrados.</td></tr>
                ) : payments.map(p => (
                  <tr key={p.id} style={styles.tr}>
                    <td style={styles.td}>{p.unit_expense_bills?.units?.unit_number}</td>
                    <td style={styles.td}>{fmtCLP(p.amount)}</td>
                    <td style={styles.td}>{p.payment_method}</td>
                    <td style={styles.td}>{p.transaction_number || '—'}</td>
                    <td style={styles.td}>{p.payment_date}</td>
                    <td style={styles.td}>{p.status}</td>
                    <td style={styles.td}>
                      {p.voucher_url ? (
                        <button
                          onClick={async () => {
                            try {
                              const url = await storageService.getSignedDownloadUrl('comprobantes-pago', p.voucher_url);
                              window.open(url, '_blank');
                            } catch (err) {
                              showError(err.message);
                            }
                          }}
                          style={styles.buttonAction}
                        >
                          Ver
                        </button>
                      ) : '—'}
                    </td>
                    <td style={styles.td}>
                      {canManage && p.status === 'pending_review' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleReconcile(p.id, 'verify')}
                            style={{ ...styles.buttonAction, backgroundColor: 'var(--success)', color: '#fff' }}
                          >
                            ✓ Aprobar
                          </button>
                          <button
                            onClick={() => handleReconcile(p.id, 'reject')}
                            style={{ ...styles.buttonAction, backgroundColor: 'var(--danger)', color: '#fff' }}
                          >
                            ✕ Rechazar
                          </button>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ConfirmDialogNode}

      <Modal open={!!viewingBill} onClose={() => setViewingBill(null)} maxWidth="850px">
        <button
          onClick={() => setViewingBill(null)}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'transparent', border: 'none', fontSize: '20px',
            cursor: 'pointer', color: 'var(--text-secondary)',
          }}
        >
          ✕
        </button>
        <ExpenseBillDocument billData={viewingBill} />
      </Modal>

      <PeriodCloseModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        period={period}
        condominiumId={selectedCondo}
        adminId={profile?.id}
        onSuccess={() => {
          loadExpenses();
          loadBills().then(b => loadPayments(b));
        }}
      />

      <PaymentGatewayModal
        isOpen={isGatewayOpen}
        onClose={() => setIsGatewayOpen(false)}
        transactionData={gatewayTx}
        onSuccess={() => {
          loadBills().then(b => loadPayments(b));
        }}
      />
    </div>
  );
}
