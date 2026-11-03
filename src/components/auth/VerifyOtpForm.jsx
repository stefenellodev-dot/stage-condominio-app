import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

export default function VerifyOtpForm({ email, onSwitchMode }) {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode.trim(),
      type: 'signup',
    });

    setLoading(false);
    if (error) {
      showError(error.message);
    } else {
      showSuccess('¡Correo verificado con éxito!');
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
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? t('common.loading') : t('auth.verify_btn')}
      </button>
      <p style={styles.toggleText}>
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          style={styles.linkButton}
        >
          {t('auth.back_to_login')}
        </button>
      </p>
    </form>
  );
}
