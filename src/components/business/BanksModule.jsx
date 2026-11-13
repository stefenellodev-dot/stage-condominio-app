import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

const emptyForm = {
  sbif_code: '',
  name: '',
  short_name: '',
  institution_type: 'banco',
  is_active: true,
};

export default function BanksModule() {
  const { isSuperadmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [view, setView] = useState('list');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingBank, setEditingBank] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .order('sbif_code', { ascending: true });

      if (error) throw error;
      setBanks(data || []);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleNew = () => {
    setEditingBank(null);
    setEditingId(null);
    setForm(emptyForm);
    setView('form');
  };

  const handleEdit = (bank) => {
    setEditingBank(bank);
    setEditingId(bank.id);
    setForm({
      sbif_code: bank.sbif_code,
      name: bank.name,
      short_name: bank.short_name,
      institution_type: bank.institution_type,
      is_active: bank.is_active,
    });
    setView('form');
  };

  const handleBack = () => {
    setView('list');
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sbif_code.trim() || !form.name.trim() || !form.short_name.trim()) {
      showError('Código, nombre y sigla son obligatorios');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        sbif_code: form.sbif_code.trim().padStart(3, '0'),
        name: form.name.trim(),
        short_name: form.short_name.trim(),
        institution_type: form.institution_type,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from('banks')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        showSuccess('Banco actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('banks')
          .insert(payload);
        if (error) throw error;
        showSuccess('Banco creado correctamente');
      }

      setView('list');
      setEditingId(null);
      setEditingBank(null);
      setForm(emptyForm);
      fetchBanks();
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (bank) => {
    try {
      const { error } = await supabase
        .from('banks')
        .update({ is_active: !bank.is_active, updated_at: new Date().toISOString() })
        .eq('id', bank.id);

      if (error) throw error;
      showSuccess(bank.is_active ? 'Banco desactivado' : 'Banco activado');
      fetchBanks();
    } catch (err) {
      showError(err.message);
    }
  };

  const filteredBanks = banks.filter((b) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      b.name.toLowerCase().includes(term) ||
      b.short_name.toLowerCase().includes(term) ||
      b.sbif_code.includes(term);
    const matchesType = filterType === 'all' || b.institution_type === filterType;
    return matchesSearch && matchesType;
  });

  if (!isSuperadmin) {
    return <div style={{ padding: '24px', color: 'var(--text-dim)' }}>Sin permisos para este módulo.</div>;
  }

  return (
    <div style={{ marginTop: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>Bancos e Instituciones Financieras ({banks.length})</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Catálogo de bancos e instituciones financieras de Chile (CMF/SBIF).</p>
        </div>
        {view === 'list' && (
          <button style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }} onClick={handleNew}>
            + Nuevo Banco
          </button>
        )}
        {view === 'form' && (
          <button style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }} onClick={handleBack}>
            Volver al listado
          </button>
        )}
      </div>

      {view === 'list' && (
        <>
          <div style={{ ...styles.sectionBox, marginBottom: '14px' }}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>Filtrar</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Buscar por nombre, sigla o código SBIF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...styles.input, minWidth: '240px' }}
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ ...styles.select, minWidth: '200px' }}
              >
                <option value="all">Todas las instituciones ({banks.length})</option>
                <option value="banco">Bancos</option>
                <option value="cooperativa">Cooperativas</option>
                <option value="prepago">Emisores de Prepago</option>
              </select>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={{ ...styles.table, tableLayout: 'fixed', minWidth: '800px' }}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={{ ...styles.th, width: '10%' }}>Cód. CMF</th>
                  <th style={{ ...styles.th, width: '30%' }}>Banco / Institución</th>
                  <th style={{ ...styles.th, width: '20%' }}>Sigla</th>
                  <th style={{ ...styles.th, width: '15%' }}>Tipo</th>
                  <th style={{ ...styles.th, width: '12%', textAlign: 'center' }}>Estado</th>
                  <th style={{ ...styles.th, width: '13%', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanks.length === 0 ? (
                  <tr><td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>Sin bancos registrados.</td></tr>
                ) : filteredBanks.map((bank) => (
                  <tr key={bank.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)' }}>
                      {bank.sbif_code}
                    </td>
                    <td style={{ ...styles.td, fontWeight: '600', color: 'var(--text-main)' }}>
                      {bank.name}
                    </td>
                    <td style={{ ...styles.td, color: 'var(--text-secondary)' }}>
                      {bank.short_name}
                    </td>
                    <td style={{ ...styles.td, textTransform: 'capitalize', color: 'var(--text-dim)' }}>
                      {bank.institution_type}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '10.5px',
                        fontWeight: '700',
                        backgroundColor: bank.is_active ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: bank.is_active ? 'var(--success-text)' : 'var(--danger-text)',
                      }}>
                        {bank.is_active ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleEdit(bank)}
                          style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleActive(bank)}
                          style={{
                            padding: '4px 10px', borderRadius: '4px', border: 'none', fontSize: '11.5px', cursor: 'pointer',
                            backgroundColor: bank.is_active ? 'var(--danger-bg)' : 'var(--success-bg)',
                            color: bank.is_active ? 'var(--danger-text)' : 'var(--success-text)',
                          }}
                        >
                          {bank.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === 'form' && (
        <div style={{ ...styles.sectionBox, marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800' }}>{editingBank ? 'Editar Institución Financiera' : 'Registrar Nuevo Banco'}</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <section style={styles.sectionBox}>
              <h4 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>Datos de la institución</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={styles.label}>Código CMF/SBIF *</label>
                  <input
                    type="text"
                    name="sbif_code"
                    required
                    maxLength={5}
                    placeholder="Ej: 037"
                    value={form.sbif_code}
                    onChange={handleChange}
                    style={{ ...styles.input, fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div>
                  <label style={styles.label}>Tipo de institución *</label>
                  <select
                    name="institution_type"
                    value={form.institution_type}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    <option value="banco">Banco</option>
                    <option value="cooperativa">Cooperativa de Ahorro y Crédito</option>
                    <option value="prepago">Emisor de Prepago</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <div>
                  <label style={styles.label}>Nombre oficial *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Ej: Banco Santander-Chile"
                    value={form.name}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Nombre corto / Sigla *</label>
                  <input
                    type="text"
                    name="short_name"
                    required
                    placeholder="Ej: Santander"
                    value={form.short_name}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                <span>Institución activa y disponible en selectores</span>
              </label>
            </section>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={saving} style={{ padding: '4px 10px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>
                {saving ? 'Guardando...' : editingBank ? 'Guardar' : 'Crear'}
              </button>
              <button type="button" onClick={handleBack} style={{ padding: '4px 10px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'none', borderRadius: '4px', fontSize: '11.5px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}