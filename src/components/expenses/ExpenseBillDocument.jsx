import React from 'react';
import { storageService } from '../../services/storageService';

export function ExpenseBillDocument({ billData }) {
  if (!billData) return null;

  const { units, profiles, expense_periods } = billData;
  const condo = units?.condominiums;
  const expensesList = expense_periods?.expenses || [];

  const formatCLP = (val) => `$${Number(val || 0).toLocaleString('es-CL')}`;

  return (
    <div className="bill-container">
      <style>{`
        .bill-container {
          background-color: #ffffff;
          color: #1a1a1a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          max-width: 800px;
          margin: 0 auto;
          padding: 32px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .bill-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 16px;
          margin-bottom: 16px;
        }
        .bill-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          margin: 0 0 4px 0;
        }
        .bill-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
        }
        .bill-section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          background-color: #e2e8f0;
          padding: 4px 8px;
          margin: 16px 0 8px 0;
          color: #1e293b;
        }
        .bill-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        .bill-table th {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
        }
        .bill-table td {
          border: 1px solid #e2e8f0;
          padding: 5px 8px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bill-summary-box {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }
        .bill-summary-table {
          width: 320px;
          border-collapse: collapse;
        }
        .bill-summary-table td {
          padding: 4px 8px;
          border: 1px solid #cbd5e1;
        }
        .bill-total-row {
          background-color: #0f172a;
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
        }
        .bill-warning-notice {
          border: 1px solid #ef4444;
          background-color: #fef2f2;
          color: #991b1b;
          padding: 8px 12px;
          border-radius: 4px;
          margin-top: 16px;
          font-size: 9.5px;
          line-height: 1.35;
        }
        .bill-bank-footer {
          border-top: 2px dashed #94a3b8;
          margin-top: 20px;
          padding-top: 12px;
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
        }
        @media print {
          body { background: transparent; }
          .bill-container {
            box-shadow: none;
            border: none;
            padding: 0;
            max-width: 100%;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Acciones de impresión no imprimibles */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🖨️ Imprimir / Guardar como PDF
        </button>
      </div>

      {/* 1. Encabezado Oficial */}
      <div className="bill-header">
        <div>
          <h1 className="bill-title">{condo?.name || 'Condominio'}</h1>
          <div>RUT Comunidad: <strong>{condo?.rut}</strong></div>
          <div>Rol de Avalúo Matriz SII: <strong>{condo?.sii_property_role}</strong></div>
          <div>Dirección: {condo?.street} #{condo?.street_number}, {condo?.commune}, {condo?.region}</div>
        </div>
        <div className="text-right">
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>COPIA LIQUIDACIÓN DE COBRO</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#0284c7' }}>{expense_periods?.period_name}</div>
          <div style={{ marginTop: '4px' }}>Fecha Emisión: {expense_periods?.issue_date}</div>
          <div style={{ color: '#dc2626', fontWeight: '700' }}>Vencimiento: {expense_periods?.due_date}</div>
        </div>
      </div>

      {/* 2. Datos de la Unidad y Copropietario */}
      <div className="bill-meta-grid">
        <div>
          <div>Unidad: <strong>{units?.unit_number}</strong> ({units?.unit_type?.toUpperCase()})</div>
          <div>Ubicación: {units?.block_or_tower} - Piso {units?.floor || 'N/A'}</div>
          <div>Alícuota Copropiedad: <strong>{Number(units?.aliquot || 0).toFixed(5)}%</strong></div>
          <div>Superficie Útil: {units?.surface_m2 ? `${units.surface_m2} m²` : 'N/D'}</div>
        </div>
        <div>
          <div>Copropietario / Ocupante: <strong>{profiles?.full_name || 'Sin Asignar'}</strong></div>
          <div>RUT: {profiles?.rut || 'N/D'}</div>
          <div>Email: {profiles?.email}</div>
          <div>Estado Cobro: <strong style={{ textTransform: 'uppercase' }}>{billData.status}</strong></div>
        </div>
      </div>

      {/* 3. Transparencia: Resumen de Egresos de la Comunidad */}
      <div className="bill-section-title">Resumen de Egresos Operacionales del Condominio ({expense_periods?.period_name})</div>
      <table className="bill-table">
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Descripción / Proveedor</th>
            <th>N° Factura</th>
            <th className="text-right">Monto Total</th>
          </tr>
        </thead>
        <tbody>
          {expensesList.length > 0 ? (
            expensesList.map((exp, idx) => (
              <tr key={idx}>
                <td style={{ textTransform: 'capitalize' }}>{exp.category?.replace('_', ' ')}</td>
                <td>{exp.description} {exp.supplier_name ? `(${exp.supplier_name})` : ''}</td>
                <td>{exp.invoice_number || 'S/N'}</td>
                <td className="text-right">{formatCLP(exp.amount)}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="4" className="text-center">No se registran egresos desglosados para este período.</td></tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: '700', backgroundColor: '#f8fafc' }}>
            <td colSpan="3">TOTAL EGRESOS ORDINARIOS CONDOMINIO</td>
            <td className="text-right">{formatCLP(expense_periods?.total_expenses)}</td>
          </tr>
        </tfoot>
      </table>

      {/* 4. Detalle de Cobro Individualizado */}
      <div className="bill-section-title">Detalle de Cobro de la Unidad</div>
      <div className="bill-summary-box">
        <table className="bill-summary-table">
          <tbody>
            <tr>
              <td>Gasto Común Ordinario ({Number(units?.aliquot || 0).toFixed(5)}%):</td>
              <td className="text-right">{formatCLP(billData.base_aliquot_amount)}</td>
            </tr>
            <tr>
              <td>Fondo de Reserva Obligatorio ({condo?.reserve_fund_percentage}%):</td>
              <td className="text-right">{formatCLP(billData.reserve_fund_amount)}</td>
            </tr>
            <tr>
              <td>Cargos Particulares (Reservas de Áreas / Multas):</td>
              <td className="text-right">{formatCLP(billData.individual_charges_amount)}</td>
            </tr>
            <tr>
              <td>Saldo Anterior / Deuda Acumulada:</td>
              <td className="text-right">{formatCLP(billData.previous_debt_amount)}</td>
            </tr>
            <tr>
              <td>Intereses por Mora devengados:</td>
              <td className="text-right">{formatCLP(billData.interest_amount)}</td>
            </tr>
            <tr className="bill-total-row">
              <td>TOTAL A PAGAR:</td>
              <td className="text-right">{formatCLP(billData.total_amount)}</td>
            </tr>
            {billData.paid_amount > 0 && (
              <tr style={{ color: '#16a34a', fontWeight: 'bold' }}>
                <td>Abonos / Pagos Conciliados:</td>
                <td className="text-right">-{formatCLP(billData.paid_amount)}</td>
              </tr>
            )}
            <tr style={{ fontWeight: '800', backgroundColor: '#f1f5f9' }}>
              <td>SALDO PENDIENTE ACTUAL:</td>
              <td className="text-right" style={{ color: billData.balance > 0 ? '#b91c1c' : '#15803d' }}>
                {formatCLP(billData.balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Apercibimiento Legal de la Ley N° 21.442 */}
      <div className="bill-warning-notice">
        <strong>ADVERTENCIA LEGAL (Art. 5 y Art. 20 - Ley N° 21.442 de Copropiedad Inmobiliaria):</strong><br />
        Esta colilla de cobro tiene mérito ejecutivo legal. El no pago de 3 o más cuotas de gastos comunes continuas o discontinuas faculta a la administración para suspender o requerir la suspensión del suministro eléctrico, telecomunicaciones o climatización de la unidad, además del cobro de intereses penales a la tasa máxima convencional legalmente aplicable.
      </div>

      {/* 6. Talón de Recaudación y Cuenta Corriente Exclusiva */}
      <div className="bill-bank-footer">
        <div>
          <div style={{ fontWeight: '700', marginBottom: '4px' }}>DATOS EXCLUSIVOS DE TRANSFERENCIA BANCARIA:</div>
          <div>Banco: <strong>{condo?.bank_name}</strong></div>
          <div>Tipo de Cuenta: <strong>Cuenta {condo?.account_type === 'corriente' ? 'Corriente' : 'Vista'}</strong></div>
          <div>Número de Cuenta: <strong>{condo?.account_number}</strong></div>
          <div>RUT Titular: <strong>{condo?.rut}</strong> ({condo?.name})</div>
          <div>Enviar comprobante a: <strong>{condo?.administration_email}</strong></div>
        </div>
        <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '12px' }}>
          <div style={{ fontWeight: '700' }}>TALÓN DE CONTROL</div>
          <div>Unidad: <strong>{units?.unit_number}</strong></div>
          <div>Período: {expense_periods?.period_name}</div>
          <div style={{ fontSize: '13px', fontWeight: '800', marginTop: '6px' }}>{formatCLP(billData.balance)}</div>
        </div>
      </div>
    </div>
  );
}
