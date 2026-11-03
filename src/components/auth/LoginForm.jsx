import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';

export default function LoginForm({ onLoginSuccess, onSwitchMode, onError, onMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError(null);
    onMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      onError(error.message);
    } else {
      onLoginSuccess(data.session);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="email"
        placeholder="correo@ejemplo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={styles.input}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={styles.input}
      />
      <div style={{ textAlign: 'right' }}>
        <button
          type="button"
          onClick={() => onSwitchMode('forgot')}
          style={styles.linkButtonSmall}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Iniciando...' : 'Entrar'}
      </button>
      <p style={styles.toggleText}>
        ¿No tienes cuenta?{' '}
        <button
          type="button"
          onClick={() => onSwitchMode('signup')}
          style={styles.linkButton}
        >
          Regístrate aquí
        </button>
      </p>
    </form>
  );
}
