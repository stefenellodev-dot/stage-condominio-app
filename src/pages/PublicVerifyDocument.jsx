import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function PublicVerifyDocument() {
  const [folio, setFolio] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramFolio = params.get('folio');
    if (paramFolio) {
      setFolio(paramFolio);
      verifyFolio(paramFolio);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyFolio = async (folioToVerify) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('verify_legal_document', { p_folio: folioToVerify.trim() });
      if (error) throw error;
      setResult(data);
    } catch (err) {
      setResult({ is_valid: false, message: 'Error de conexión con el Registro Central.' });
    } finally {
      setLoading(false);
    }
  };

  const formatCLP = (val) => '$' + Math.round(val || 0).toLocaleString('es-CL');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
      <div style={{ maxWidth: '580px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ backgroundColor: '#0f172a', padding: '20px', textAlign: 'center', color: '#ffffff' }}>
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>🛡️</div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px', letterSpacing: '0.5px' }}>REGISTRO NACIONAL DE COPROPIEDAD</h1>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Portal de Verificación de Fe Pública — Ley N° 21.442</div>
        </div>
        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
              <div>Consultando autenticidad en el registro central...</div>
            </div>
          ) : result?.is_valid ? (
            <div>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px' }}>✅</span>
                <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#166534', margin: '6px 0 2px' }}>DOCUMENTO OFICIAL AUTÉNTICO</h2>
                <div style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>Verificación Digital Conforme • Sello Hash #{result.integrity_hash}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Tipo de Documento:</span>
                  <strong style={{ textAlign: 'right', color: '#0f172a' }}>{result.document_title}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Folio Único:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{result.folio}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Condominio Emisor:</span>
                  <strong style={{ textAlign: 'right' }}>{result.condo_name} ({result.condo_rut})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Unidad Imputada:</span>
                  <strong>Departamento {result.unit_number}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Copropietario/a:</span>
                  <strong>{result.owner_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Monto Certificado:</span>
                  <strong style={{ fontSize: '15px', color: '#b91c1c' }}>{formatCLP(result.total_debt)} CLP</strong>
                </div>
                {result.deadline_date && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Plazo Fatal de Corte:</span>
                    <strong style={{ color: '#dc2626' }}>{result.deadline_date}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Fecha de Emisión:</span>
                  <span>{result.issued_at}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Administrador Firmante:</span>
                  <strong>{result.admin_name}</strong>
                </div>
                {result.committee_president && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ color: '#64748b' }}>V°B° Presidente Comité:</span>
                    <strong>{result.committee_president}</strong>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '11px', color: '#64748b', lineHeight: '1.5' }}>
                ⚖️ <strong>Validez Jurídica:</strong> {result.legal_basis}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span style={{ fontSize: '42px' }}>❌</span>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#b91c1c', margin: '10px 0 6px' }}>DOCUMENTO NO RECONOCIDO</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
                El folio <strong>{folio}</strong> no figura en la base de datos de títulos ejecutivos del condominio o ha sido anulado.
              </p>
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#991b1b' }}>
                Advertencia: Si este documento le fue presentado en juicio o para trámites de compraventa, exija el certificado oficial original al administrador registrado.
              </div>
            </div>
          )}
        </div>
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px', textAlign: 'center', fontSize: '11px', color: '#94a3b8', backgroundColor: '#f8fafc' }}>
          Plataforma de Copropiedad Inmobiliaria Piave • Conforme a Ley N° 21.442
        </div>
      </div>
    </div>
  );
}
