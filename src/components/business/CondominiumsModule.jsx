import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';
import { usePermissions } from '../../hooks/usePermissions';

export default function CondominiumsModule() {
  const { isSuperadmin, isAdmin } = useAuth();
  const { canCreate, canEdit } = usePermissions('condominiums');
  const canManage = canCreate || canEdit;
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const [condominiums, setCondominiums] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [regions, setRegions] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [formMode, setFormMode] = useState('list');
  const [formData, setFormData] = useState({
    id: '', management_company_id: '', name: '', rut: '', sii_property_role: '', type: 'tipo_a',
    destination: '', total_units: '', dom_certificate_number: '', dom_approval_date: '',
    reserve_fund_percentage: '5', street: '', street_number: '', region_id: '', commune_id: '',
    region: '', commune: '', bank_name: '', account_type: '', account_number: '',
    concierge_phone: '', administration_email: '', status: 'active',
  });

  useEffect(() => {
    (async () => {
      const { data: companiesData } = await supabase.from('management_companies').select('id,legal_name,fantasy_name').is('deleted_at', null).order('legal_name');
      setCompanies(companiesData || []);
      if (companiesData && companiesData.length) setSelectedCompany(companiesData[0].id);
      const { data: regionsData } = await supabase.from('regions').select('id, name, roman_numeral').order('id');
      setRegions(regionsData || []);
    })();
  }, []);

  useEffect(() => {
    if (!selectedCompany) return;
    loadCondominiums();
  }, [selectedCompany]);

  useEffect(() => {
    if (formData.region_id) {
      (async () => {
        const { data } = await supabase.from('communes').select('id, name').eq('region_id', formData.region_id).order('name');
        setCommunes(data || []);
      })();
    } else {
      setCommunes([]);
    }
  }, [formData.region_id]);

  const loadCondominiums = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('condominiums')
      .select('id, name, rut, sii_property_role, type, destination, total_units, dom_certificate_number, dom_approval_date, street, street_number, commune, region, region_id, commune_id, bank_name, account_type, account_number, reserve_fund_percentage, concierge_phone, administration_email, status, management_company_id')
      .eq('management_company_id', selectedCompany)
      .is('deleted_at', null)
      .order('name');
    if (error) showError(error.message);
    else setCondominiums(data || []);
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'region_id') {
        const region = regions.find(r => String(r.id) === value);
        return { ...prev, region_id: value, commune_id: '', region: region?.name || '', commune: '' };
      }
      if (name === 'commune_id') {
        const commune = communes.find(c => String(c.id) === value);
        return { ...prev, commune_id: value, commune: commune?.name || '' };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.rut.trim()) { showError('Nombre y RUT son obligatorios'); return; }
    setSaving(true);
    const { error } = await supabase.from('condominiums').insert({
      management_company_id: selectedCompany || null,
      name: formData.name.trim(),
      rut: formData.rut.trim(),
      sii_property_role: formData.sii_property_role.trim() || null,
      type: formData.type,
      destination: formData.destination.trim() || null,
      total_units: formData.total_units ? parseInt(formData.total_units) : null,
      dom_certificate_number: formData.dom_certificate_number.trim() || null,
      dom_approval_date: formData.dom_approval_date || null,
      reserve_fund_percentage: parseFloat(formData.reserve_fund_percentage) || 5,
      street: formData.street.trim() || null,
      street_number: formData.street_number.trim() || null,
      region_id: formData.region_id ? parseInt(formData.region_id) : null,
      commune_id: formData.commune_id ? parseInt(formData.commune_id) : null,
      region: formData.region || null,
      commune: formData.commune || null,
      bank_name: formData.bank_name.trim() || null,
      account_type: formData.account_type || null,
      account_number: formData.account_number.trim() || null,
      concierge_phone: formData.concierge_phone.trim() || null,
      administration_email: formData.administration_email.trim() || null,
      status: formData.status,
    });
    setSaving(false);
    if (error) { showError(error.message); return; }
    showSuccess('Condominio creado exitosamente');
    setFormData({ id: '', management_company_id: '', name: '', rut: '', sii_property_role: '', type: 'tipo_a', destination: '', total_units: '', dom_certificate_number: '', dom_approval_date: '', reserve_fund_percentage: '5', street: '', street_number: '', region_id: '', commune_id: '', region: '', commune: '', bank_name: '', account_type: '', account_number: '', concierge_phone: '', administration_email: '', status: 'active' });
    setFormMode('list');
    loadCondominiums();
  };

  const handleView = (condo) => {
    setFormData({
      id: condo.id,
      management_company_id: condo.management_company_id || selectedCompany,
      name: condo.name || '',
      rut: condo.rut || '',
      sii_property_role: condo.sii_property_role || '',
      type: condo.type || 'tipo_a',
      destination: condo.destination || '',
      total_units: condo.total_units ? String(condo.total_units) : '',
      dom_certificate_number: condo.dom_certificate_number || '',
      dom_approval_date: condo.dom_approval_date || '',
      reserve_fund_percentage: condo.reserve_fund_percentage ? String(condo.reserve_fund_percentage) : '5',
      street: condo.street || '',
      street_number: condo.street_number || '',
      region_id: condo.region_id ? String(condo.region_id) : '',
      commune_id: condo.commune_id ? String(condo.commune_id) : '',
      region: condo.region || '',
      commune: condo.commune || '',
      bank_name: condo.bank_name || '',
      account_type: condo.account_type || '',
      account_number: condo.account_number || '',
      concierge_phone: condo.concierge_phone || '',
      administration_email: condo.administration_email || '',
      status: condo.status || 'active',
    });
    setReadOnly(true);
    setFormMode('edit');
  };

  const handleEdit = (condo) => {
    setReadOnly(false);
    setFormData({
      id: condo.id,
      management_company_id: condo.management_company_id || selectedCompany,
      name: condo.name || '',
      rut: condo.rut || '',
      sii_property_role: condo.sii_property_role || '',
      type: condo.type || 'residencial',
      destination: condo.destination || '',
      total_units: condo.total_units ? String(condo.total_units) : '',
      dom_certificate_number: condo.dom_certificate_number || '',
      dom_approval_date: condo.dom_approval_date || '',
      reserve_fund_percentage: condo.reserve_fund_percentage ? String(condo.reserve_fund_percentage) : '5',
      street: condo.street || '',
      street_number: condo.street_number || '',
      region_id: condo.region_id ? String(condo.region_id) : '',
      commune_id: condo.commune_id ? String(condo.commune_id) : '',
      region: condo.region || '',
      commune: condo.commune || '',
      bank_name: condo.bank_name || '',
      account_type: condo.account_type || '',
      account_number: condo.account_number || '',
      concierge_phone: condo.concierge_phone || '',
      administration_email: condo.administration_email || '',
      status: condo.status || 'active',
    });
    setFormMode('edit');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.rut.trim()) { showError('Nombre y RUT son obligatorios'); return; }
    setSaving(true);
    const { error } = await supabase.from('condominiums').update({
      name: formData.name.trim(),
      rut: formData.rut.trim(),
      sii_property_role: formData.sii_property_role.trim() || null,
      type: formData.type,
      destination: formData.destination.trim() || null,
      total_units: formData.total_units ? parseInt(formData.total_units) : null,
      dom_certificate_number: formData.dom_certificate_number.trim() || null,
      dom_approval_date: formData.dom_approval_date || null,
      reserve_fund_percentage: parseFloat(formData.reserve_fund_percentage) || 5,
      street: formData.street.trim() || null,
      street_number: formData.street_number.trim() || null,
      region_id: formData.region_id ? parseInt(formData.region_id) : null,
      commune_id: formData.commune_id ? parseInt(formData.commune_id) : null,
      region: formData.region || null,
      commune: formData.commune || null,
      bank_name: formData.bank_name.trim() || null,
      account_type: formData.account_type || null,
      account_number: formData.account_number.trim() || null,
      concierge_phone: formData.concierge_phone.trim() || null,
      administration_email: formData.administration_email.trim() || null,
      status: formData.status,
    }).eq('id', formData.id);
    setSaving(false);
    if (error) { showError(error.message); return; }
    showSuccess('Condominio actualizado');
    setFormMode('list');
    loadCondominiums();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este condominio?')) return;
    setSaving(true);
    const { error } = await supabase.from('condominiums').update({ status: 'inactive', deleted_at: new Date().toISOString() }).eq('id', id);
    setSaving(false);
    if (error) { showError(error.message); return; }
    showSuccess('Condominio desactivado');
    loadCondominiums();
  };

  const handleCancel = () => {
    setReadOnly(false);
    setFormData({ id: '', management_company_id: '', name: '', rut: '', sii_property_role: '', type: 'tipo_a', destination: '', total_units: '', dom_certificate_number: '', dom_approval_date: '', reserve_fund_percentage: '5', street: '', street_number: '', region_id: '', commune_id: '', region: '', commune: '', bank_name: '', account_type: '', account_number: '', concierge_phone: '', administration_email: '', status: 'active' });
    setFormMode('list');
  };

  return (
    <div style={{ marginTop: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>Condominios ({condominiums.length})</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Gestión de condominios, recepción municipal, ubicación y cuenta bancaria.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {companies.length > 0 && (
            <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} style={{ ...styles.select, minWidth: '220px' }}>
              {companies.map(c => <option key={c.id} value={c.id}>{c.fantasy_name || c.legal_name}</option>)}
            </select>
          )}
          {canManage && (
            <button style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }} onClick={() => { handleCancel(); setFormMode('create'); }}>Nuevo condominio</button>
          )}
        </div>
      </div>

      {formMode !== 'list' && (
        <div style={{ ...styles.sectionBox, marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>{readOnly ? 'Ver condominio' : formMode === 'create' ? 'Nuevo condominio' : 'Editar condominio'}</h4>
          <form onSubmit={formMode === 'create' ? handleCreate : handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={styles.label}>Nombre del condominio *</label><input type="text" name="name" value={formData.name} onChange={handleChange} style={styles.input} required /></div>
              <div><label style={styles.label}>RUT del condominio *</label><input type="text" name="rut" value={formData.rut} onChange={handleChange} style={styles.input} required /></div>
              <div><label style={styles.label}>Rol Matriz SII</label><input type="text" name="sii_property_role" value={formData.sii_property_role} onChange={handleChange} style={styles.input} placeholder="Ej: 1234-5" /></div>
              <div><label style={styles.label}>Tipo</label><select name="type" value={formData.type} onChange={handleChange} style={styles.select}><option value="tipo_a">Tipo A</option><option value="tipo_b">Tipo B</option></select></div>
              <div><label style={styles.label}>Destino</label><select name="destination" value={formData.destination} onChange={handleChange} style={styles.select}><option value="">Seleccionar</option><option value="habitacional">Habitacional</option><option value="comercial">Comercial</option><option value="mixto">Mixto</option></select></div>
              <div><label style={styles.label}>Total de unidades</label><input type="number" name="total_units" value={formData.total_units} onChange={handleChange} style={styles.input} /></div>
              <div><label style={styles.label}>N° Certificado DOM</label><input type="text" name="dom_certificate_number" value={formData.dom_certificate_number} onChange={handleChange} style={styles.input} /></div>
              <div><label style={styles.label}>Fecha aprobación DOM</label><input type="date" name="dom_approval_date" value={formData.dom_approval_date} onChange={handleChange} style={styles.input} /></div>
              <div><label style={styles.label}>% Fondo de Reserva</label><input type="number" name="reserve_fund_percentage" value={formData.reserve_fund_percentage} onChange={handleChange} style={styles.input} step="0.01" /></div>
              <div><label style={styles.label}>Teléfono Conserjería</label><input type="text" name="concierge_phone" value={formData.concierge_phone} onChange={handleChange} style={styles.input} /></div>
              <div><label style={styles.label}>Email Administración</label><input type="email" name="administration_email" value={formData.administration_email} onChange={handleChange} style={styles.input} /></div>
              <div><label style={styles.label}>Estado</label><select name="status" value={formData.status} onChange={handleChange} style={styles.select}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '8px' }}>
              <div><label style={styles.label}>Calle</label><input type="text" name="street" value={formData.street} onChange={handleChange} style={styles.input} /></div>
              <div><label style={styles.label}>Número</label><input type="text" name="street_number" value={formData.street_number} onChange={handleChange} style={styles.input} /></div>
              <div>
                <label style={styles.label}>Región</label>
                <select name="region_id" value={formData.region_id} onChange={handleChange} style={styles.select}>
                  <option value="">Seleccionar</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.roman_numeral ? `${r.roman_numeral} - ` : ''}{r.name}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>Comuna</label>
                <select name="commune_id" value={formData.commune_id} onChange={handleChange} style={styles.select} disabled={!formData.region_id}>
                  <option value="">Seleccionar</option>
                  {communes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '8px' }}>
              <div><label style={styles.label}>Banco</label><input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} style={styles.input} /></div>
              <div><label style={styles.label}>Tipo de cuenta</label><select name="account_type" value={formData.account_type} onChange={handleChange} style={styles.select}><option value="">Seleccionar</option><option value="corriente">Corriente</option><option value="vista">Vista</option><option value="ahorro">Ahorro</option></select></div>
              <div><label style={styles.label}>N° de cuenta</label><input type="text" name="account_number" value={formData.account_number} onChange={handleChange} style={styles.input} /></div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              {!readOnly && <button type="submit" disabled={saving} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>{saving ? 'Guardando...' : formMode === 'create' ? 'Crear' : 'Actualizar'}</button>}
              <button type="button" onClick={handleCancel} style={{ padding: '4px 10px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={{ ...styles.table, minWidth: '800px' }}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Condominio</th>
              <th style={styles.th}>RUT</th>
              <th style={styles.th}>Comuna</th>
              <th style={styles.th}>Tipo</th>
              <th style={styles.th}>Unidades</th>
              <th style={styles.th}>Fondo Reserva</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Cargando...</td></tr>
            ) : condominiums.length === 0 ? (
              <tr><td colSpan="8" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>No se encontraron condominios.</td></tr>
            ) : condominiums.map((c) => (
              <tr key={c.id} style={styles.tr}>
                <td style={styles.td}>{c.name}</td>
                <td style={styles.td}>{c.rut || '—'}</td>
                <td style={styles.td}>{c.commune || '—'}</td>
                <td style={styles.td}>{c.type || '—'}</td>
                <td style={styles.td}>{c.total_units || '—'}</td>
                <td style={styles.td}>{c.reserve_fund_percentage || 5}%</td>
                <td style={styles.td}>{c.status}</td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                    <button onClick={() => handleView(c)} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Ver</button>
                    {canManage && <button onClick={() => handleEdit(c)} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Editar</button>}
                    {canManage && <button onClick={() => handleDelete(c.id)} style={{ padding: '4px 10px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>Desactivar</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
