import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';

export default function ForgotForm({ onCodeSent, onSwitchMode, onError, onMessage }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError(null);
    onMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      onError(error.message);
    } else {
      onMessage(`Código de recuperación enviado a Inbucket para ${email}.`);
      onCodeSent(email);
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
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Enviando...' : 'Enviar Código Temporal'}
      </button>
      <p style={styles.toggleText}>
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          style={styles.linkButton}
        >
          Volver al inicio de sesión
        </button>
      </p>
    </form>
  );
}
