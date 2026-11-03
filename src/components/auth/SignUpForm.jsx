import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

export default function SignUpForm({ onRegistered, onSwitchMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Código OTP enviado a Inbucket.');
      onRegistered(email);
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
      <input
        type="password"
        placeholder={t('auth.password_placeholder')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={styles.input}
      />
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? t('common.loading') : t('auth.signup_btn')}
      </button>
      <p style={styles.toggleText}>
        {t('auth.have_account')}{' '}
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          style={styles.linkButton}
        >
          {t('auth.login_here')}
        </button>
      </p>
    </form>
  );
}
