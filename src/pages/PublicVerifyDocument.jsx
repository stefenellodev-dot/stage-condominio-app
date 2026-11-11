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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-surface)', padding: '24px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
      <div style={{ maxWidth: '580px', margin: '0 auto', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', textAlign: 'center', color: 'var(--text-main)' }}>
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>🛡️</div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px', letterSpacing: '0.5px' }}>REGISTRO NACIONAL DE COPROPIEDAD</h1>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Portal de Verificación de Fe Pública — Ley N° 21.442</div>
        </div>
        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
              <div>Consultando autenticidad en el registro central...</div>
            </div>
          ) : result?.is_valid ? (
            <div>
              <div style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px' }}>✅</span>
                <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--success-text)', margin: '6px 0 2px' }}>DOCUMENTO OFICIAL AUTÉNTICO</h2>
                <div style={{ fontSize: '12px', color: 'var(--success-text)', fontWeight: '600' }}>Verificación Digital Conforme • Sello Hash #{result.integrity_hash}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Tipo de Documento:</span>
                  <strong style={{ textAlign: 'right', color: 'var(--text-main)' }}>{result.document_title}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Folio Único:</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{result.folio}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Condominio Emisor:</span>
                  <strong style={{ textAlign: 'right' }}>{result.condo_name} ({result.condo_rut})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Unidad Imputada:</span>
                  <strong>Departamento {result.unit_number}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Copropietario/a:</span>
                  <strong>{result.owner_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Monto Certificado:</span>
                  <strong style={{ fontSize: '15px', color: 'var(--danger-text)' }}>{formatCLP(result.total_debt)} CLP</strong>
                </div>
                {result.deadline_date && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Plazo Fatal de Corte:</span>
                    <strong style={{ color: '#dc2626' }}>{result.deadline_date}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Fecha de Emisión:</span>
                  <span>{result.issued_at}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Administrador Firmante:</span>
                  <strong>{result.admin_name}</strong>
                </div>
                {result.committee_president && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ color: 'var(--text-dim)' }}>V°B° Presidente Comité:</span>
                    <strong>{result.committee_president}</strong>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                ⚖️ <strong>Validez Jurídica:</strong> {result.legal_basis}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span style={{ fontSize: '42px' }}>❌</span>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--danger-text)', margin: '10px 0 6px' }}>DOCUMENTO NO RECONOCIDO</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: '0 0 16px' }}>
                El folio <strong>{folio}</strong> no figura en la base de datos de títulos ejecutivos del condominio o ha sido anulado.
              </p>
              <div style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--danger-text)' }}>
                Advertencia: Si este documento le fue presentado en juicio o para trámites de compraventa, exija el certificado oficial original al administrador registrado.
              </div>
            </div>
          )}
        </div>
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px', textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)' }}>
          Plataforma de Copropiedad Inmobiliaria Piave • Conforme a Ley N° 21.442
        </div>
      </div>
    </div>
  );
}
