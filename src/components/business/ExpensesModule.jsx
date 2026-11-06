import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';
import { useConfirm } from '../../hooks/useConfirm';

const CATEGORIES = ['administracion', 'mantencion', 'reparacion', 'uso_consumo', 'extraordinario'];

const fmtCLP = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

export default function ExpensesModule() {
  const { isSuperadmin, isAdmin, profile } = useAuth();
  const canManage = isSuperadmin || isAdmin;
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();
  const { confirm, ConfirmDialogNode } = useConfirm();

  const [tab, setTab] = useState('egresos');
  const [condominiums, setCondominiums] = useState([]);
  const [selectedCondo, setSelectedCondo] = useState('');
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form egreso
  const [expForm, setExpForm] = useState({ category: 'administracion', description: '', supplier_name: '', supplier_rut: '', invoice_number: '', amount: '' });
  const [savingExp, setSavingExp] = useState(false);

  // Form pago
  const [payForm, setPayForm] = useState({ bill_id: '', amount: '', payment_method: 'transferencia', transaction_number: '', voucher_url: '' });
  const [savingPay, setSavingPay] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('condominiums').select('id,name,rut').is('deleted_at', null).order('name');
      setCondominiums(data || []);
      if (data && data.length) setSelectedCondo(data[0].id);
    })();
  }, []);

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
    if (!canManage) q = q.eq('owner_id', profile?.id);
    const { data, error } = await q;
    if (error) showError(error.message); else setBills(data || []);
    setLoading(false);
  };

  const loadPayments = async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    const billIds = bills.map(b => b.id);
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
  useEffect(() => { if (tab === 'pagos' && profile) { loadBills().then(loadPayments); } }, [tab, selectedPeriod, profile]);

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
    const { error } = await supabase.from('bill_payments').insert({
      bill_id: payForm.bill_id,
      unit_id: bill?.unit_id,
      user_id: profile?.id,
      amount: parseInt(payForm.amount, 10),
      payment_method: payForm.payment_method,
      transaction_number: payForm.transaction_number.trim() || null,
      voucher_url: payForm.voucher_url.trim() || null,
    });
    setSavingPay(false);
    if (error) { showError(error.message); return; }
    showSuccess('Pago registrado');
    setPayForm({ bill_id: '', amount: '', payment_method: 'transferencia', transaction_number: '', voucher_url: '' });
    loadBills().then(loadPayments);
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
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <select value={selectedCondo} onChange={e => setSelectedCondo(e.target.value)} style={styles.select}>
          {condominiums.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} style={styles.select}>
          {periods.map(p => <option key={p.id} value={p.id}>{p.period_name} ({p.status})</option>)}
        </select>
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
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '800px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Unidad</th><th style={styles.th}>Ordinario</th><th style={styles.th}>Fondo reserva</th><th style={styles.th}>Cargos individuales</th><th style={styles.th}>Total</th><th style={styles.th}>Pagado</th><th style={styles.th}>Saldo</th><th style={styles.th}>Estado</th>
              </tr></thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr><td colSpan="8" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin colillas para este periodo.</td></tr>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <input placeholder="URL comprobante" value={payForm.voucher_url} onChange={e => setPayForm({ ...payForm, voucher_url: e.target.value })} style={styles.input} />
              </div>
              <button type="submit" disabled={savingPay} style={{ ...styles.button, marginTop: '10px' }}>{savingPay ? 'Guardando…' : 'Registrar pago'}</button>
            </form>
          ) : null}
          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, minWidth: '700px' }}>
              <thead><tr style={styles.thRow}>
                <th style={styles.th}>Unidad</th><th style={styles.th}>Monto</th><th style={styles.th}>Método</th><th style={styles.th}>Nº operación</th><th style={styles.th}>Fecha</th><th style={styles.th}>Estado</th>
              </tr></thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin pagos registrados.</td></tr>
                ) : payments.map(p => (
                  <tr key={p.id} style={styles.tr}>
                    <td style={styles.td}>{p.unit_expense_bills?.units?.unit_number}</td>
                    <td style={styles.td}>{fmtCLP(p.amount)}</td>
                    <td style={styles.td}>{p.payment_method}</td>
                    <td style={styles.td}>{p.transaction_number || '—'}</td>
                    <td style={styles.td}>{p.payment_date}</td>
                    <td style={styles.td}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ConfirmDialogNode}
    </div>
  );
}
