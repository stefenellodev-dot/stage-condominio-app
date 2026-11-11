import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';

export function ShiftHandoverModal({ isOpen, onClose, condominiumId, onSuccess }) {
  const [staffList, setStaffList] = useState([]);
  const [outgoingStaffId, setOutgoingStaffId] = useState('');
  const [incomingStaffId, setIncomingStaffId] = useState('');
  const [shiftTime, setShiftTime] = useState('afternoon_to_night');
  const [pendingTasks, setPendingTasks] = useState('');
  const [cashBalance, setCashBalance] = useState(0);
  const [observations, setObservations] = useState('');
  const [checklist, setChecklist] = useState({
    radios_portatiles: true,
    llaves_maestras_completas: true,
    citofonia_operativa: true,
    camaras_cctv_sin_fallas: true,
    porton_vehicular_operativo: true
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!condominiumId || !isOpen) return;
    const fetchStaff = async () => {
      const { data } = await supabase
        .from('security_staff_records')
        .select('id, full_name, job_title')
        .eq('condominium_id', condominiumId)
        .eq('status', 'active')
        .order('full_name');
      if (data && data.length > 0) {
        setStaffList(data);
        setOutgoingStaffId(data[0].id);
        setIncomingStaffId(data[1]?.id || data[0].id);
      }
    };
    fetchStaff();
  }, [condominiumId, isOpen]);

  if (!isOpen) return null;

  const handleCheckboxChange = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!outgoingStaffId || !incomingStaffId) {
      setErrorMsg('Debe seleccionar conserje saliente y entrante.');
      return;
    }
    if (outgoingStaffId === incomingStaffId) {
      setErrorMsg('El conserje saliente y el entrante no pueden ser la misma persona.');
      return;
    }
    try {
      setSaving(true);
      setErrorMsg('');
      const { error } = await supabase.from('shift_handovers').insert({
        condominium_id: condominiumId,
        outgoing_staff_id: outgoingStaffId,
        incoming_staff_id: incomingStaffId,
        shift_time: shiftTime,
        equipment_checklist: {
          radios_portatiles: checklist.radios_portatiles ? 'operativas' : 'con_fallas',
          llaves_maestras_completas: checklist.llaves_maestras_completas,
          citofonia_operativa: checklist.citofonia_operativa,
          camaras_cctv_sin_fallas: checklist.camaras_cctv_sin_fallas,
          porton_vehicular_operativo: checklist.porton_vehicular_operativo
        },
        pending_tasks_summary: pendingTasks.trim() || 'Sin novedades pendientes.',
        cash_box_balance: Number(cashBalance) || 0,
        observations: observations.trim() || null
      });
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar el relevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="🔄 Acta de Relevo y Entrega de Turno">
      {errorMsg && (
        <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
          {errorMsg}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Conserje Saliente:</label>
            <select value={outgoingStaffId} onChange={e => setOutgoingStaffId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.job_title?.replace('_', ' ')})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Conserje Entrante:</label>
            <select value={incomingStaffId} onChange={e => setIncomingStaffId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.job_title?.replace('_', ' ')})</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Horario de Relevo:</label>
          <select value={shiftTime} onChange={e => setShiftTime(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <option value="morning_to_afternoon">Mañana ➔ Tarde (07:00 a 15:00)</option>
            <option value="afternoon_to_night">Tarde ➔ Noche (15:00 a 23:00)</option>
            <option value="night_to_morning">Noche ➔ Mañana (23:00 a 07:00)</option>
          </select>
        </div>
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)' }}>Checklist de Operatividad en Puesto:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={checklist.radios_portatiles} onChange={() => handleCheckboxChange('radios_portatiles')} />
              Radios portátiles operativas
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={checklist.llaves_maestras_completas} onChange={() => handleCheckboxChange('llaves_maestras_completas')} />
              Llavero maestro completo
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={checklist.citofonia_operativa} onChange={() => handleCheckboxChange('citofonia_operativa')} />
              Citofonía sin fallas
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={checklist.camaras_cctv_sin_fallas} onChange={() => handleCheckboxChange('camaras_cctv_sin_fallas')} />
              CCTV / Cámaras operativas
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', gridColumn: 'span 2' }}>
              <input type="checkbox" checked={checklist.porton_vehicular_operativo} onChange={() => handleCheckboxChange('porton_vehicular_operativo')} />
              Portón vehicular y barreras operativas
            </label>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Tareas y Novedades Pendientes:</label>
          <textarea rows={3} required placeholder="Ej: Quedan 2 paquetes pendientes por retirar..." value={pendingTasks} onChange={e => setPendingTasks(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '12.5px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button type="button" onClick={onClose} disabled={saving} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#fff' }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: '700' }}>
            {saving ? 'Registrando...' : 'Firmar y Registrar Relevo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
