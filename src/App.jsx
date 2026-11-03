import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { styles } from './styles/theme';
import LoginForm from './components/auth/LoginForm';
import SignUpForm from './components/auth/SignUpForm';
import VerifyOtpForm from './components/auth/VerifyOtpForm';
import ForgotForm from './components/auth/ForgotForm';
import ResetForm from './components/auth/ResetForm';
import Dashboard from './components/dashboard/Dashboard';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'verify' | 'forgot' | 'reset'
  const [activeEmail, setActiveEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setActiveEmail('');
    setMode('login');
    setMessage(null);
    setError(null);
  };

  const clearAlerts = (nextMode) => {
    setError(null);
    setMessage(null);
    setMode(nextMode);
  };

  if (session) {
    return (
      <>
        {error && <div style={{ ...styles.errorBox, position: 'fixed', top: 20, right: 20, zIndex: 99 }}>{error}</div>}
        {message && <div style={{ ...styles.messageBox, position: 'fixed', top: 20, right: 20, zIndex: 99 }}>{message}</div>}
        <Dashboard
          session={session}
          profile={profile}
          onProfileUpdated={() => fetchProfile(session.user)}
          onLogout={handleLogout}
          onError={setError}
          onMessage={setMessage}
        />
      </>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ margin: '0 0 10px' }}>
          {mode === 'login' && 'Iniciar Sesión'}
          {mode === 'signup' && 'Crear Cuenta'}
          {mode === 'verify' && 'Verificar Código de Registro'}
          {mode === 'forgot' && 'Recuperar Contraseña'}
          {mode === 'reset' && 'Nueva Contraseña'}
        </h2>

        {error && <div style={styles.errorBox}>{error}</div>}
        {message && <div style={styles.messageBox}>{message}</div>}

        {mode === 'login' && (
          <LoginForm
            onLoginSuccess={(s) => { setSession(s); fetchProfile(s.user); }}
            onSwitchMode={clearAlerts}
            onError={setError}
            onMessage={setMessage}
          />
        )}

        {mode === 'signup' && (
          <SignUpForm
            onRegistered={(email) => { setActiveEmail(email); setMode('verify'); }}
            onSwitchMode={clearAlerts}
            onError={setError}
            onMessage={setMessage}
          />
        )}

        {mode === 'verify' && (
          <VerifyOtpForm
            email={activeEmail}
            onVerified={(s) => {
              if (s) { setSession(s); fetchProfile(s.user); }
              else { setMode('login'); }
            }}
            onSwitchMode={clearAlerts}
            onError={setError}
            onMessage={setMessage}
          />
        )}

        {mode === 'forgot' && (
          <ForgotForm
            onCodeSent={(email) => { setActiveEmail(email); setMode('reset'); }}
            onSwitchMode={clearAlerts}
            onError={setError}
            onMessage={setMessage}
          />
        )}

        {mode === 'reset' && (
          <ResetForm
            email={activeEmail}
            onPasswordUpdated={(s) => {
              if (s) { setSession(s); fetchProfile(s.user); }
              else { setMode('login'); }
            }}
            onSwitchMode={clearAlerts}
            onError={setError}
            onMessage={setMessage}
          />
        )}
      </div>
    </div>
  );
}
