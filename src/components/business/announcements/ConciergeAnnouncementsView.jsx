import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function ConciergeAnnouncementsView({ condominiumId }) {
  const isMobile = useIsMobile();
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    if (!condominiumId) return;
    const fetchNotices = async () => {
      const { data } = await supabase.from('community_announcements').select('*').eq('condominium_id', condominiumId).order('created_at', { ascending: false }).limit(10);
      setNotices(data || []);
    };
    fetchNotices();
  }, [condominiumId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '850px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', borderRadius: '12px', padding: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>Tablero Operativo de Conserjería</h2>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Avisos inmediatos para información de residentes y visitas.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notices.map((notice) => (
          <div key={notice.id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '14px', borderLeft: notice.priority === 'critical' || notice.priority === 'high' ? '4px solid var(--danger)' : '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{notice.title}</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{new Date(notice.created_at || notice.published_at).toLocaleDateString('es-CL')}</span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{notice.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
