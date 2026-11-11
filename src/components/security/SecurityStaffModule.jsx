import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { StaffModal } from './StaffModal';

export default function SecurityStaffModule() {
  const { profile, isAdmin, isSuperadmin } = useAuth();
  const isMobile = useIsMobile();
  const condominiumId = profile?.condominium_id;

  const [staffList, setStaffList] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [activeTab, setActiveTab] = useState('staff');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAdminOrSuper = isAdmin || isSuperadmin;

  const fetchStaffData = async () => {
    if (!condominiumId) return;
    setLoading(true);
    const { data: staffData } = await supabase
      .from('vw_security_staff_os10_status')
      .select('*')
      .eq('condominium_id', condominiumId)
      .eq('status', 'active')
      .order('os10_expiry_date', { ascending: true });
    const { data: handoverData } = await supabase
      .from('shift_handovers')
      .select('*, outgoing:outgoing_staff_id(full_name, job_title), incoming:incoming_staff_id(full_name, job_title)')
      .eq('condominium_id', condominiumId)
      .order('handover_timestamp', { ascending: false })
      .limit(10);
    setStaffList(staffData || []);
    setHandovers(handoverData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStaffData();
  }, [condominiumId]);

  const handleOpenCertificate = async (path) => {
    try {
      const url = await storageService.getSignedDownloadUrl('certificaciones', path);
      window.open(url, '_blank');
    } catch (e) {
      alert('No se pudo abrir el documento digital.');
    }
  };

  const getStatusBadge = (status, days) => {
    switch (status) {
      case 'vigente':
        return <span style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>🟢 Vigente ({days} días)</span>;
      case 'por_vencer':
        return <span style={{ backgroundColor: '#fef3c7', color: 'var(--warning-text)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>🟡 Por Vencer ({days} días)</span>;
      case 'vencido':
        return <span style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>🔴 Vencido</span>;
      default:
        return <span style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>⚪ No Acreditado</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('staff')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', backgroundColor: activeTab === 'staff' ? 'var(--bg-surface)' : 'var(--bg-surface)', color: activeTab === 'staff' ? 'var(--text-main)' : 'var(--text-secondary)' }}>
            🛡️ Personal y Semáforo OS-10
          </button>
          <button onClick={() => setActiveTab('handovers')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', backgroundColor: activeTab === 'handovers' ? 'var(--bg-surface)' : 'var(--bg-surface)', color: activeTab === 'handovers' ? 'var(--text-main)' : 'var(--text-secondary)' }}>
            📋 Libro de Relevos de Turno
          </button>
        </div>
        {isAdminOrSuper && activeTab === 'staff' && (
          <button onClick={() => setIsModalOpen(true)} style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>
            + Registrar Personal
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>Cargando registros de seguridad...</div>
      ) : activeTab === 'staff' ? (
        isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {staffList.map(s => (
              <div key={s.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>{s.full_name}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {s.job_title?.replace('_', ' ')} • Turno {s.shift_pattern}
                    </div>
                  </div>
                  {getStatusBadge(s.os10_legal_status, s.days_until_expiry)}
                </div>
                <div style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '4px', margin: '8px 0', color: 'var(--text-secondary)' }}>
                  <div><strong>RUT:</strong> {s.rut}</div>
                  <div><strong>Credencial OS-10:</strong> {s.os10_credential_number || 'Sin credencial'}</div>
                  <div><strong>Vencimiento:</strong> {s.os10_expiry_date || 'N/A'}</div>
                  <div><strong>Contacto:</strong> <a href={`tel:${s.phone}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{s.phone}</a></div>
                </div>
                {s.os10_document_url && (
                  <button onClick={() => handleOpenCertificate(s.os10_document_url)} style={{ width: '100%', marginTop: '8px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer' }}>
                    📄 Ver Credencial Escaneada
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 14px' }}>Colaborador</th>
                  <th style={{ padding: '10px 14px' }}>Cargo / Jornada</th>
                  <th style={{ padding: '10px 14px' }}>RUT</th>
                  <th style={{ padding: '10px 14px' }}>N° Folio OS-10</th>
                  <th style={{ padding: '10px 14px' }}>Vencimiento</th>
                  <th style={{ padding: '10px 14px' }}>Semáforo OS-10</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Credencial</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: 'var(--text-main)' }}>{s.full_name}</td>
                    <td style={{ padding: '10px 14px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {s.job_title?.replace('_', ' ')} <br />
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>({s.shift_pattern})</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{s.rut}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{s.os10_credential_number || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{s.os10_expiry_date || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{getStatusBadge(s.os10_legal_status, s.days_until_expiry)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {s.os10_document_url ? (
                        <button onClick={() => handleOpenCertificate(s.os10_document_url)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold' }}>
                          Ver PDF ↗
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {handovers.map(h => (
            <div key={h.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Relevo de Puesto: {h.shift_time?.replace(/_/g, ' ').toUpperCase()}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Fecha y Hora: {new Date(h.handover_timestamp).toLocaleString('es-CL')}
                  </div>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Saliente: <strong>{h.outgoing?.full_name}</strong> ➔ Entrante: <strong>{h.incoming?.full_name}</strong>
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '10px', borderRadius: '6px', fontSize: '12.5px', margin: '8px 0', color: 'var(--text-secondary)' }}>
                <div><strong>Pendientes / Novedades recibidas:</strong> {h.pending_tasks_summary || 'Sin novedades pendientes.'}</div>
                {h.observations && <div style={{ marginTop: '4px', color: 'var(--text-dim)' }}><em>Observaciones: {h.observations}</em></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        condominiumId={condominiumId}
        onSuccess={fetchStaffData}
      />
    </div>
  );
}
