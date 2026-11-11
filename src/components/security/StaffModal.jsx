import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';

export function StaffModal({ isOpen, onClose, condominiumId, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [rut, setRut] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('conserje_dia');
  const [contractType, setContractType] = useState('indefinido');
  const [companyName, setCompanyName] = useState('');
  const [shiftPattern, setShiftPattern] = useState('4x4_rotativo');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasOs10, setHasOs10] = useState(true);
  const [credentialNumber, setCredentialNumber] = useState('');
  const [trainingEntity, setTrainingEntity] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      let documentPath = null;
      if (hasOs10 && file) {
        const fileExt = file.name.split('.').pop().toLowerCase();
        const path = `${condominiumId}/personal/${Date.now()}_os10.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('certificaciones').upload(path, file);
        if (uploadErr) throw uploadErr;
        documentPath = path;
      }
      const { error: insertErr } = await supabase.from('security_staff_records').insert({
        condominium_id: condominiumId,
        full_name: fullName.trim(),
        rut: rut.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        job_title: jobTitle,
        contract_type: contractType,
        security_company_name: contractType === 'subcontratado_empresa_seguridad' ? companyName : null,
        shift_pattern: shiftPattern,
        hire_date: hireDate,
        has_os10: hasOs10,
        os10_credential_number: hasOs10 ? credentialNumber : null,
        os10_training_entity: hasOs10 ? trainingEntity : null,
        os10_issue_date: hasOs10 && issueDate ? issueDate : null,
        os10_expiry_date: hasOs10 && expiryDate ? expiryDate : null,
        os10_document_url: documentPath,
        status: 'active',
      });
      if (insertErr) throw insertErr;
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar la ficha de seguridad.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🛡️ Ficha Laboral de Seguridad y OS-10">
      {errorMsg && (
        <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
          {errorMsg}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Nombre Completo:</label>
            <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>RUT Colaborador:</label>
            <input required type="text" placeholder="12.345.678-9" value={rut} onChange={e => setRut(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Cargo / Rol:</label>
            <select value={jobTitle} onChange={e => setJobTitle(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <option value="conserje_dia">Conserje Día</option>
              <option value="conserje_noche">Conserje Noche / Nochero</option>
              <option value="mayordomo">Mayordomo / Jefe de Edificio</option>
              <option value="rondin_fin_de_semana">Rondín Fin de Semana</option>
              <option value="guardia_seguridad">Guardia de Seguridad</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Modalidad Contractual:</label>
            <select value={contractType} onChange={e => setContractType(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <option value="indefinido">Contrato Indefinido</option>
              <option value="plazo_fijo">Plazo Fijo</option>
              <option value="subcontratado_empresa_seguridad">Empresa Externa Subcontratada</option>
            </select>
          </div>
        </div>
        {contractType === 'subcontratado_empresa_seguridad' && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Razón Social Empresa de Seguridad:</label>
            <input required type="text" placeholder="Ej: Securitas Chile SpA" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Teléfono Celular:</label>
            <input required type="tel" placeholder="+56 9 ..." value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Jornada / Turno:</label>
            <select value={shiftPattern} onChange={e => setShiftPattern(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <option value="4x4_rotativo">Turno 4x4 Rotativo</option>
              <option value="5x2_fijo">Turno 5x2 Fijo</option>
              <option value="6x1_rotativo">Turno 6x1</option>
              <option value="part_time_reemplazo">Reemplazo / Fin de Semana</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Fecha de Contratación:</label>
          <input type="date" value={hireDate} onChange={e => setHireDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
        </div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', backgroundColor: 'var(--bg-surface)', marginTop: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={hasOs10} onChange={e => setHasOs10(e.target.checked)} />
            Acreditación OS-10 Carabineros de Chile Vigente
          </label>
          {hasOs10 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '3px' }}>N° Credencial / Folio:</label>
                  <input required={hasOs10} type="text" placeholder="OS10-STGO-2024-..." value={credentialNumber} onChange={e => setCredentialNumber(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '12.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '3px' }}>OTEC / Entidad Capacitadora:</label>
                  <input type="text" placeholder="Ej: OTEC ProSeg" value={trainingEntity} onChange={e => setTrainingEntity(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '12.5px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '3px' }}>Fecha de Emisión:</label>
                  <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '12.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '3px' }}>Fecha Vencimiento (Fatal):</label>
                  <input required={hasOs10} type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '12.5px' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '3px' }}>Adjuntar Credencial Digital (PDF / Imagen):</label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files[0])} style={{ fontSize: '12px' }} />
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button type="button" onClick={onClose} disabled={saving} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#0284c7', color: 'var(--text-main)', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Guardando...' : 'Registrar Colaborador'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
