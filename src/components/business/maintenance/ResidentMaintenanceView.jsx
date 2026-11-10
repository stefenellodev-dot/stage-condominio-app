import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function ResidentMaintenanceView() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [unit, setUnit] = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('infraestructura');
  const [priority, setPriority] = useState('media');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: uData } = await supabase.from('units').select('id, unit_number, condominium_id').eq('owner_id', profile.id).limit(1).maybeSingle();
      if (!uData) { setLoading(false); return; }
      setUnit(uData);
      const { data: tData } = await supabase.from('maintenance_tickets').select('*').eq('unit_id', uData.id).order('created_at', { ascending: false });
      setMyTickets(tData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, [profile?.id]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !unit) return;
    try {
      setSubmitting(true);
      const { error } = await supabase.from('maintenance_tickets').insert({
        condominium_id: unit.condominium_id, unit_id: unit.id, reported_by: profile.id,
        title: title.trim(), category, priority, description: description.trim(), status: 'reported'
      });
      if (error) throw error;
      alert('Requerimiento de mantenimiento enviado a la administración.');
      setTitle(''); setDescription(''); fetchTickets();
    } catch (err) { alert('Error al reportar ticket: ' + err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Cargando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '850px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', padding: '18px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800' }}>Mantenimiento e Incidentes</h1>
        <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>Reporta fallas operacionales, filtraciones o solicitudes técnicas.</p>
      </div>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '14.5px', fontWeight: '800' }}>Nuevo Requerimiento</h3>
        <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" required placeholder="Título breve (Ej: Fuga de agua en lavaplatos)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="infraestructura">Infraestructura General</option>
              <option value="electricidad">Electricidad / Luminarias</option>
              <option value="aguas_bombas">Plomería / Cañerías / Filtración</option>
              <option value="ascensores">Ascensores</option>
              <option value="gas_calderas">Agua Caliente / Calderas</option>
              <option value="areas_comunes">Espacios Comunes</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="baja">Prioridad Baja</option>
              <option value="media">Prioridad Media</option>
              <option value="alta">Prioridad Alta</option>
              <option value="urgente">Urgencia Crítica</option>
            </select>
          </div>
          <textarea rows={3} required placeholder="Describe detalladamente el desperfecto..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
          <button type="submit" disabled={submitting} style={{ padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}>{submitting ? 'Enviando...' : '+ Ingresar Requerimiento'}</button>
        </form>
      </div>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Mis Requerimientos Registrados ({myTickets.length})</h3>
        {myTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>No tienes solicitudes de mantenimiento registradas.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myTickets.map((t) => (
              <div key={t.id} style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '14px' }}>{t.title}</strong>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>Categoría: {t.category.replace('_', ' ')} • {new Date(t.created_at).toLocaleDateString('es-CL')}</div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '3px' }}>{t.description}</div>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800', backgroundColor: t.status === 'resolved' ? '#d1fae5' : t.status === 'in_progress' ? '#e0f2fe' : '#fef3c7', color: t.status === 'resolved' ? '#065f46' : t.status === 'in_progress' ? '#0369a1' : '#b45309' }}>
                  {t.status === 'resolved' ? 'RESUELTO' : t.status === 'in_progress' ? 'EN PROCESO' : 'REPORTADO'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
