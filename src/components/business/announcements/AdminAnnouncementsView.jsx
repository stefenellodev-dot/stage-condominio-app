import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function AdminAnnouncementsView({ condominiumId }) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [announcements, setAnnouncements] = useState([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('normal');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!condominiumId) return;
    const { count } = await supabase.from('units').select('*', { count: 'exact', head: true }).eq('condominium_id', condominiumId);
    setTotalUnits(count || 1);
    const { data: annData } = await supabase.from('community_announcements').select('*, announcement_read_receipts(count)').eq('condominium_id', condominiumId).order('created_at', { ascending: false });
    setAnnouncements(annData || []);
  };

  useEffect(() => { fetchData(); }, [condominiumId]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('community_announcements').insert({ condominium_id: condominiumId, title: title.trim(), priority, content: content.trim(), published_by: profile?.id, status: 'published' });
      if (error) throw error;
      alert('Circular emitida y notificada a los residentes.');
      setTitle(''); setContent(''); setPriority('normal'); fetchData();
    } catch (err) { alert('Error creando circular: ' + err.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div><h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Emisión y Auditoría de Circulares (Art. 15)</h2><div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Publicación oficial de asambleas, acuerdos y notificaciones fehacientes.</div></div>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>Nueva Circular Oficial</h3>
        <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 1fr', gap: '10px' }}>
            <input type="text" required placeholder="Título de la Circular" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <option value="normal">Prioridad Normal</option>
              <option value="high">Prioridad Alta</option>
              <option value="critical">Citación Legal (Art. 15)</option>
            </select>
          </div>
          <textarea rows={4} required placeholder="Cuerpo formal de la comunicación..." value={content} onChange={(e) => setContent(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: 'var(--bg-surface)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}>{isSubmitting ? 'Publicando...' : '📢 Emitir Circular'}</button>
          </div>
        </form>
      </div>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800' }}>Trazabilidad de Acuses Firmados</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead><tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}><th style={{ padding: '8px 12px' }}>Título</th><th style={{ padding: '8px 12px' }}>Fecha</th><th style={{ padding: '8px 12px' }}>Prioridad</th><th style={{ padding: '8px 12px', textAlign: 'right' }}>Acuses Firmados</th></tr></thead>
            <tbody>
              {announcements.map((a) => {
                const signedCount = a.announcement_read_receipts?.[0]?.count || 0;
                const signedPct = Math.round((signedCount * 100) / totalUnits);
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600' }}>{a.title}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>{new Date(a.created_at || a.published_at).toLocaleDateString('es-CL')}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{a.priority}</span></td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}><strong>{signedCount} / {totalUnits}</strong><span style={{ color: signedPct >= 50 ? '#15803d' : '#ea580c', marginLeft: '6px', fontSize: '11px' }}>({signedPct}%)</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
