import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

export default function LoginForm({ onSwitchMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      showError(error.message);
    } else {
      showSuccess(t('auth.login_btn') + ' OK');
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

      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={t('auth.password_placeholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            ...styles.input,
            width: '100%',
            paddingRight: '44px',
            boxSizing: 'border-box'
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          style={{
            position: 'absolute',
            right: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim, #94a3b8)',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main, #ffffff)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim, #94a3b8)'}
        >
          {showPassword ? (
            /* Icono Ojo Tachado (Ocultar) */
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            /* Icono Ojo Abierto (Mostrar) */
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      <div style={{ textAlign: 'right' }}>
        <button
          type="button"
          onClick={() => onSwitchMode('forgot')}
          style={styles.linkButtonSmall}
        >
          {t('auth.forgot_link')}
        </button>
      </div>

      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? t('common.loading') : t('auth.login_btn')}
      </button>

      <p style={styles.toggleText}>
        {t('auth.no_account')}{' '}
        <button
          type="button"
          onClick={() => onSwitchMode('signup')}
          style={styles.linkButton}
        >
          {t('auth.register_here')}
        </button>
      </p>
    </form>
  );
}