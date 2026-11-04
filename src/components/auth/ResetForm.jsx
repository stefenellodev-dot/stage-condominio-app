import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';

export default function ResetForm({ email, onSwitchMode }) {
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useToast();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode.trim(),
      type: 'recovery',
    });

    if (otpError) {
      setLoading(false);
      showError(otpError.message);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);
    if (updateError) {
      showError(updateError.message);
    } else {
      showSuccess('Contraseña restablecida exitosamente.');
      await signOut();
      onSwitchMode('login');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="text"
        placeholder="123456"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value)}
        maxLength={6}
        autoFocus
        required
        style={{ ...styles.input, textAlign: 'center', fontSize: '20px', letterSpacing: '4px' }}
      />
      <input
        type="password"
        placeholder={t('auth.new_password_placeholder')}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        style={styles.input}
      />
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? t('common.loading') : t('auth.save_access_btn')}
      </button>
      <p style={styles.toggleText}>
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          style={styles.linkButton}
        >
          {t('common.cancel')}
        </button>
      </p>
    </form>
  );
}
