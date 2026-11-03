import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';

export default function VerifyOtpForm({ email, onVerified, onSwitchMode, onError, onMessage }) {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError(null);
    onMessage(null);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode.trim(),
      type: 'signup',
    });

    setLoading(false);
    if (error) {
      onError(error.message);
    } else {
      onMessage('¡Correo verificado con éxito!');
      onVerified(data.session);
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
        {loading ? 'Verificando...' : 'Verificar Código'}
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
