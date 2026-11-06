import React, { useState, useCallback, useRef } from 'react';

/**
 * Modal reutilizable de confirmación / prompt.
 * Uso vía el hook useConfirm (src/hooks/useConfirm.js).
 */
export default function ConfirmDialog({ open, title, message, promptLabel, confirmLabel, cancelLabel, danger, onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  React.useEffect(() => {
    if (open) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => onConfirm(promptLabel ? value : true);
  const handleCancel = () => onCancel();

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, #1a1f2e)',
          color: 'var(--text, #e6e6e6)',
          borderRadius: '12px',
          padding: '20px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        }}
      >
        {title && <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{title}</h3>}
        {message && <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-dim, #9aa0a6)' }}>{message}</p>}
        {promptLabel && (
          <label style={{ display: 'block', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>{promptLabel}</span>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') handleCancel(); }}
              style={{
                width: '100%', padding: '8px 10px', fontSize: '14px',
                borderRadius: '8px', border: '1px solid var(--border, #333)',
                background: 'var(--bg-input, #0f1320)', color: 'var(--text, #e6e6e6)',
              }}
            />
          </label>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border, #333)',
              background: 'transparent', color: 'var(--text, #e6e6e6)', cursor: 'pointer', fontSize: '13px',
            }}
          >
            {cancelLabel || 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              background: danger ? 'var(--danger, #d33)' : 'var(--accent, #4f8cff)',
              color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}
          >
            {confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
