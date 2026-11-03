import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';

export default function SignUpForm({ onRegistered, onSwitchMode, onError, onMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError(null);
    onMessage(null);

    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      onError(error.message);
    } else {
      onMessage('Usuario registrado. Ingresa el código de 6 dígitos enviado a Inbucket.');
      onRegistered(email);
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
        placeholder="Contraseña (mínimo 6 caracteres)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={styles.input}
      />
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Registrando...' : 'Registrarse'}
      </button>
      <p style={styles.toggleText}>
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          style={styles.linkButton}
        >
          Inicia sesión
        </button>
      </p>
    </form>
  );
}
