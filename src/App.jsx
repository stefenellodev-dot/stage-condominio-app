import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Conexión externa a Supabase por Tailscale
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://100.126.211.117:8100';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true
  }
});

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        if (data?.user?.identities?.length === 0) {
          setMessage({ type: 'error', text: 'Este correo ya se encuentra registrado.' });
        } else {
          setMessage({ type: 'success', text: 'Cuenta creada. Revisa tu buzón en Inbucket para confirmar el correo.' });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (session) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ color: '#38bdf8' }}>Panel Seguro de Usuario</h2>
          <p style={{ color: '#94a3b8' }}>Sesión validada por Supabase GoTrue en Staging.</p>
          <div style={styles.infoBox}>
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>ID Usuario:</strong> <code>{session.user.id}</code></p>
            <p><strong>Último acceso:</strong> {new Date(session.user.last_sign_in_at).toLocaleString()}</p>
          </div>
          <button style={styles.btnSecondary} onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: '#38bdf8', marginBottom: '0.25rem' }}>
          {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          {mode === 'login' ? 'Ingresa tus credenciales' : 'Registra un usuario y valida su correo'}
        </p>

        {message && (
          <div style={{ ...styles.alert, backgroundColor: message.type === 'error' ? '#ef444420' : '#10b98120', borderColor: message.type === 'error' ? '#ef4444' : '#10b981' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} style={styles.form}>
          <label style={styles.label}>Correo Electrónico</label>
          <input
            style={styles.input}
            type="email"
            required
            placeholder="usuario@test.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={styles.label}>Contraseña</label>
          <input
            style={styles.input}
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.btnPrimary} type="submit" disabled={loading}>
            {loading ? 'Procesando...' : mode === 'login' ? 'Acceder' : 'Registrarse'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <span
            style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(null); }}
          >
            {mode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
  card: { background: '#131b2e', padding: '2.5rem', borderRadius: '12px', border: '1px solid #1e293b', width: '100%', maxWidth: '400px', color: '#f8fafc' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' },
  label: { fontSize: '0.8rem', color: '#94a3b8' },
  input: { padding: '0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' },
  btnPrimary: { marginTop: '0.75rem', padding: '0.75rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  btnSecondary: { marginTop: '1.5rem', width: '100%', padding: '0.75rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  infoBox: { background: '#0f172a', border: '1px solid #1e293b', padding: '1rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.85rem' },
  alert: { padding: '0.75rem', border: '1px solid', borderRadius: '6px', fontSize: '0.85rem', margin: '0.75rem 0' }
};
