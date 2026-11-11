import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { paymentGatewayService } from '../../services/paymentGatewayService';
import { useIsMobile } from '../../hooks/useMediaQuery';

export function PaymentGatewayModal({ isOpen, onClose, transactionData, onSuccess }) {
  const isMobile = useIsMobile();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !transactionData) return null;

  const formatCLP = (amount) => '$' + Math.round(amount || 0).toLocaleString('es-CL');

  const handleSimulate = async (shouldApprove) => {
    try {
      setProcessing(true);
      setErrorMsg('');
      await new Promise(r => setTimeout(r, 1000));
      const res = await paymentGatewayService.processSandboxPayment({
        buyOrder: transactionData.buy_order,
        shouldApprove,
        cardLastDigits: '8842'
      });
      if (res.status === 'authorized') {
        setResult('authorized');
        setTimeout(() => { onSuccess(); onClose(); }, 1800);
      } else {
        setResult('failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error en comunicación con la pasarela.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="💳 Pasarela de Pago Seguro (Modo Integración)">
      {result === 'authorized' ? (
        <div style={{ textAlign: 'center', padding: '24px 10px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success-text)', margin: '0 0 6px' }}>¡Pago Aprobado y Conciliado!</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 14px' }}>Tu colilla quedó pagada en línea ($0 saldo). Se despachó el comprobante a tu correo.</p>
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '10px', borderRadius: '8px', fontSize: '12px', display: 'inline-block' }}>
            Orden: <strong>{transactionData.buy_order}</strong>
          </div>
        </div>
      ) : result === 'failed' ? (
        <div style={{ textAlign: 'center', padding: '24px 10px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>❌</div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger-text)', margin: '0 0 6px' }}>Pago Rechazado por el Banco</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>La transacción fue rechazada o cancelada. El saldo de tu unidad permanece sin cambios.</p>
          <button onClick={() => setResult(null)} style={{ padding: '8px 18px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Reintentar Pago</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ backgroundColor: 'var(--primary)', color: 'var(--text-main)', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Simulador Sandbox</div>
              <strong style={{ fontSize: '15px' }}>Webpay Plus / Fintoc</strong>
            </div>
            <span style={{ fontSize: '20px' }}>🔒 256-bit</span>
          </div>
          {errorMsg && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px' }}>{errorMsg}</div>
          )}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Condominio:</span>
              <strong>{transactionData.condo_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Unidad Facturada:</span>
              <strong>Depto {transactionData.unit_number}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-dim)' }}>N° Orden de Compra:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>{transactionData.buy_order}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '14px' }}>Total a Pagar:</strong>
              <strong style={{ fontSize: '18px', color: 'var(--text-main)' }}>{formatCLP(transactionData.amount)} CLP</strong>
            </div>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', textAlign: 'center' }}>
            Estás operando en entorno de pruebas. Selecciona el resultado simulado:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginTop: '6px' }}>
            <button type="button" disabled={processing} onClick={() => handleSimulate(true)} style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#15803d', color: 'var(--text-main)', fontWeight: '800', fontSize: '13px', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {processing ? 'Procesando...' : '🟢 Simular Pago Exitoso'}
            </button>
            <button type="button" disabled={processing} onClick={() => handleSimulate(false)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--danger-border)', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', fontWeight: '700', fontSize: '13px', cursor: processing ? 'not-allowed' : 'pointer' }}>
              🔴 Simular Rechazo Bancario
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
