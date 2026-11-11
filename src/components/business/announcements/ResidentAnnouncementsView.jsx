import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function ResidentAnnouncementsView() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [announcements, setAnnouncements] = useState([]);
  const [readReceipts, setReadReceipts] = useState(new Set());
  const [signingId, setSigningId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    if (!profile?.condominium_id) return;
    setLoading(true);
    try {
      const { data: annData } = await supabase.from('community_announcements').select('*').eq('condominium_id', profile.condominium_id).order('priority', { ascending: false }).order('created_at', { ascending: false });
      const { data: recData } = await supabase.from('announcement_read_receipts').select('announcement_id').eq('user_id', profile.id);
      const readSet = new Set((recData || []).map((r) => r.announcement_id));
      setAnnouncements(annData || []);
      setReadReceipts(readSet);
    } catch (err) { console.error('Error cargando circulares:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnnouncements(); }, [profile?.condominium_id, profile?.id]);

  const handleSignReceipt = async (annId) => {
    try {
      setSigningId(annId);
      const { error } = await supabase.from('announcement_read_receipts').insert({ announcement_id: annId, user_id: profile.id, unit_id: profile.condominium_id ? null : null, user_agent: navigator.userAgent });
      if (error) throw error;
      setReadReceipts(new Set([...readReceipts, annId]));
      alert('Acuse de recibo registrado conforme al Art. 15 de la Ley N° 21.442.');
    } catch (err) { alert('Error registrando acuse: ' + err.message); }
    finally { setSigningId(null); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Cargando circulares...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '850px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', borderRadius: '14px', padding: '20px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800' }}>Circulares y Citaciones Oficiales</h1>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Comunicación fehaciente de la administración conforme a la Ley N° 21.442.</p>
      </div>
      {announcements.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '30px', textAlign: 'center', color: 'var(--text-dim)', border: '1px solid var(--border-subtle)' }}>No hay circulares publicadas actualmente.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {announcements.map((ann) => {
            const hasSigned = readReceipts.has(ann.id);
            const isUrgent = ann.priority === 'urgent' || ann.priority === 'critical' || ann.priority === 'high';
            return (
              <div key={ann.id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: isUrgent ? '1.5px solid var(--danger-border)' : '1px solid var(--border-subtle)', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', backgroundColor: isUrgent ? 'var(--danger-bg)' : 'var(--bg-surface)', color: isUrgent ? 'var(--danger-text)' : 'var(--primary)' }}>{ann.priority || 'INFORMATIVO'}</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>{new Date(ann.created_at || ann.published_at).toLocaleDateString('es-CL')}</span>
                  </div>
                  <div>{hasSigned ? <span style={{ color: 'var(--success-text)', fontSize: '11px', fontWeight: '700' }}>✓ Acuse de Lectura Firmado</span> : <span style={{ color: 'var(--warning-text)', fontSize: '11px', fontWeight: '700' }}>Pendiente de Confirmación</span>}</div>
                </div>
                <h3 style={{ margin: '10px 0 6px', fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{ann.title}</h3>
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{ann.content}</p>
                {!hasSigned && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleSignReceipt(ann.id)} disabled={signingId === ann.id} style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>✍️ {signingId === ann.id ? 'Registrando...' : 'Confirmar Lectura y Conformidad (Art. 15)'}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
