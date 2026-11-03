import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { formatRut, validateRut } from '../../lib/rut';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

export default function ProfileSection() {
  const { session, profile, refreshProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    firstName: '',
    secondName: '',
    lastName: '',
    secondLastName: '',
    rut: '',
    phone: '',
    birthDate: '',
    street: '',
    streetNumber: '',
    deptOrUnit: '',
    regionId: '',
    communeId: '',
  });

  const [regions, setRegions] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRegions = async () => {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name, roman_numeral')
        .order('id', { ascending: true });
      if (!error && data) setRegions(data);
    };
    loadRegions();
  }, []);

  useEffect(() => {
    if (!formData.regionId) {
      setCommunes([]);
      return;
    }
    const loadCommunes = async () => {
      const { data, error } = await supabase
        .from('communes')
        .select('id, name')
        .eq('region_id', formData.regionId)
        .order('name', { ascending: true });
      if (!error && data) setCommunes(data);
    };
    loadCommunes();
  }, [formData.regionId]);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        secondName: profile.second_name || '',
        lastName: profile.last_name || '',
        secondLastName: profile.second_last_name || '',
        rut: profile.rut ? formatRut(profile.rut) : '',
        phone: profile.phone || '',
        birthDate: profile.birth_date || '',
        street: profile.street || '',
        streetNumber: profile.street_number || '',
        deptOrUnit: profile.dept_or_unit || '',
        regionId: profile.region_id || '',
        communeId: profile.commune_id || '',
      });
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'rut') {
      setFormData((prev) => ({ ...prev, rut: formatRut(value) }));
    } else if (name === 'regionId') {
      setFormData((prev) => ({ ...prev, regionId: value, communeId: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('La imagen supera el límite de 5MB.');
      return;
    }

    setUploadingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${session.user.id}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploadingAvatar(false);
      showError(`Error al subir imagen: ${uploadError.message}`);
      return;
    }

    const { data: publicData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const finalUrl = publicData.publicUrl;

    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ avatar_url: finalUrl })
      .eq('id', session.user.id);

    setUploadingAvatar(false);

    if (updateProfileError) {
      showError(updateProfileError.message);
    } else {
      setAvatarUrl(finalUrl);
      showSuccess('Foto de perfil actualizada exitosamente.');
      refreshProfile();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.rut && !validateRut(formData.rut)) {
      showError('El RUT ingresado no es válido (dígito verificador incorrecto).');
      return;
    }

    setLoading(true);

    const selectedRegion = regions.find((r) => r.id === parseInt(formData.regionId, 10));
    const selectedCommune = communes.find((c) => c.id === parseInt(formData.communeId, 10));
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: formData.firstName.trim(),
        second_name: formData.secondName.trim(),
        last_name: formData.lastName.trim(),
        second_last_name: formData.secondLastName.trim(),
        full_name: fullName,
        rut: formData.rut.trim(),
        phone: formData.phone.trim(),
        birth_date: formData.birthDate || null,
        street: formData.street.trim(),
        street_number: formData.streetNumber.trim(),
        dept_or_unit: formData.deptOrUnit.trim(),
        region_id: formData.regionId ? parseInt(formData.regionId, 10) : null,
        commune_id: formData.communeId ? parseInt(formData.communeId, 10) : null,
        region: selectedRegion ? selectedRegion.name : '',
        commune: selectedCommune ? selectedCommune.name : '',
      })
      .eq('id', session.user.id);

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        showError('El RUT ingresado ya está registrado por otro usuario.');
      } else {
        showError(error.message);
      }
    } else {
      showSuccess('Datos de perfil guardados correctamente.');
      refreshProfile();
    }
  };

  return (
    <div style={styles.sectionBox}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-focus)' }}
            />
          ) : (
            <div style={{
              width: '84px', height: '84px', borderRadius: '50%', backgroundColor: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: '2px dashed var(--border-subtle)'
            }}>
              👤
            </div>
          )}
        </div>
        <div>
          <h4 style={{ margin: '0 0 6px', color: 'var(--text-main)' }}>{t('profile.photo_title')}</h4>
          <label style={{
            ...styles.buttonAction,
            display: 'inline-block',
            cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            padding: '6px 12px'
          }}>
            {uploadingAvatar ? t('profile.uploading') : t('profile.change_photo')}
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              style={{ display: 'none' }}
            />
          </label>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
            {t('profile.photo_hint')}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ margin: '0', color: 'var(--primary)', fontSize: '15px' }}>{t('profile.identification_section')}</h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={styles.label}>{t('profile.first_name')}</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>{t('profile.second_name')}</label>
            <input
              type="text"
              name="secondName"
              value={formData.secondName}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>{t('profile.last_name')}</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>{t('profile.second_last_name')}</label>
            <input
              type="text"
              name="secondLastName"
              value={formData.secondLastName}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={styles.label}>{t('profile.rut')}</label>
            <input
              type="text"
              name="rut"
              placeholder="12.345.678-5"
              value={formData.rut}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>{t('profile.phone')}</label>
            <input
              type="tel"
              name="phone"
              placeholder="+56 9 1234 5678"
              value={formData.phone}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>{t('profile.birth_date')}</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        <h4 style={{ margin: '8px 0 0', color: 'var(--primary)', fontSize: '15px' }}>{t('profile.address_section')}</h4>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={styles.label}>{t('profile.street')}</label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>{t('profile.street_number')}</label>
            <input
              type="text"
              name="streetNumber"
              value={formData.streetNumber}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>{t('profile.dept_unit')}</label>
            <input
              type="text"
              name="deptOrUnit"
              value={formData.deptOrUnit}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={styles.label}>{t('profile.region')}</label>
            <select
              name="regionId"
              value={formData.regionId}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">{t('profile.select_region')}</option>
              {regions.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.roman_numeral ? `${reg.roman_numeral} - ` : ''}{reg.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>{t('profile.commune')}</label>
            <select
              name="communeId"
              value={formData.communeId}
              onChange={handleChange}
              disabled={!formData.regionId}
              style={styles.select}
            >
              <option value="">{t('profile.select_commune')}</option>
              {communes.map((com) => (
                <option key={com.id} value={com.id}>
                  {com.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="submit" disabled={loading} style={styles.buttonAction}>
            {loading ? t('common.saving') : t('profile.save_info')}
          </button>
        </div>
      </form>
    </div>
  );
}
