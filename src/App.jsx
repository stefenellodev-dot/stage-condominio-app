import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider, useTranslation } from './context/I18nContext';
import { styles } from './styles/theme';
import LoginForm from './components/auth/LoginForm';
import SignUpForm from './components/auth/SignUpForm';
import VerifyOtpForm from './components/auth/VerifyOtpForm';
import ForgotForm from './components/auth/ForgotForm';
import ResetForm from './components/auth/ResetForm';
import Dashboard from './components/dashboard/Dashboard';

function MainApp() {
  const { session, loading } = useAuth();
  const { lang, toggleLang, t } = useTranslation();
  const [mode, setMode] = useState('login');
  const [activeEmail, setActiveEmail] = useState('');

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</div>
      </div>
    );
  }

  if (session) {
    return <Dashboard />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>
            {mode === 'login' && t('auth.login_title')}
            {mode === 'signup' && t('auth.signup_title')}
            {mode === 'verify' && t('auth.verify_title')}
            {mode === 'forgot' && t('auth.forgot_title')}
            {mode === 'reset' && t('auth.reset_title')}
          </h2>
          <button
            onClick={toggleLang}
            style={{
              ...styles.buttonAction,
              padding: '4px 10px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '11px',
            }}
          >
            🌐 {lang === 'es' ? 'EN' : 'ES'}
          </button>
        </div>

        {mode === 'login' && <LoginForm onSwitchMode={setMode} />}
        {mode === 'signup' && (
          <SignUpForm
            onRegistered={(email) => { setActiveEmail(email); setMode('verify'); }}
            onSwitchMode={setMode}
          />
        )}
        {mode === 'verify' && <VerifyOtpForm email={activeEmail} onSwitchMode={setMode} />}
        {mode === 'forgot' && (
          <ForgotForm
            onCodeSent={(email) => { setActiveEmail(email); setMode('reset'); }}
            onSwitchMode={setMode}
          />
        )}
        {mode === 'reset' && <ResetForm email={activeEmail} onSwitchMode={setMode} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <I18nProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </I18nProvider>
    </ToastProvider>
  );
}
