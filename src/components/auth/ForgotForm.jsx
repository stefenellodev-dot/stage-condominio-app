import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

export default function ForgotForm({ onCodeSent, onSwitchMode }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      showError(error.message);
    } else {
      showSuccess(`Código temporal enviado a Inbucket.`);
      onCodeSent(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="email"
        placeholder={t('auth.email_placeholder')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={styles.input}
      />
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? t('common.loading') : t('auth.send_code_btn')}
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
