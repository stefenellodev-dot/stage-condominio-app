import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';

export default function ResetForm({ email, onPasswordUpdated, onSwitchMode, onError, onMessage }) {
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError(null);
    onMessage(null);

    const { data, error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode.trim(),
      type: 'recovery',
    });

    if (otpError) {
      setLoading(false);
      onError(otpError.message);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);
    if (updateError) {
      onError(updateError.message);
    } else {
      onMessage('Contraseña restablecida exitosamente.');
      onPasswordUpdated(data.session);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="text"
        placeholder="Código de 6 dígitos (ej. 123456)"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value)}
        maxLength={6}
        autoFocus
        required
        style={{ ...styles.input, textAlign: 'center', fontSize: '20px', letterSpacing: '4px' }}
      />
      <input
        type="password"
        placeholder="Nueva contraseña (mínimo 6 caracteres)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        style={styles.input}
      />
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Guardando...' : 'Guardar y Acceder'}
      </button>
      <p style={styles.toggleText}>
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          style={styles.linkButton}
        >
          Cancelar
        </button>
      </p>
    </form>
  );
}
