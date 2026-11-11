import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';

export default function ConfirmDialog({ open, title, message, promptLabel, confirmLabel, cancelLabel, danger, onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setValue('');
    const t = setTimeout(() => {
      (promptLabel ? inputRef.current : dialogRef.current?.querySelector('button'))?.focus();
    }, 0);

    const handleKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); return; }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { clearTimeout(t); document.removeEventListener('keydown', handleKey); };
  }, [open, promptLabel, onCancel]);

  const isMobile = useIsMobile();

  if (!open) return null;

  const handleConfirm = () => onConfirm(promptLabel ? value : true);
  const handleCancel = () => onCancel();

  return (
    <div
      role={danger ? 'alertdialog' : 'dialog'}
      aria-modal="true"
      ref={dialogRef}
      onClick={handleCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? '0' : '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, #1a1f2e)',
          color: 'var(--text, #e6e6e6)',
          borderRadius: isMobile ? '16px 16px 0 0' : '12px',
          padding: '20px',
          width: '100%',
          maxWidth: isMobile ? '100%' : '440px',
          maxHeight: isMobile ? '85vh' : 'none',
          overflowY: isMobile ? 'auto' : 'visible',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        }}
      >
        {isMobile && (
          <div style={{ width: '36px', height: '4px', backgroundColor: 'var(--border-subtle, #cbd5e1)', borderRadius: '2px', margin: '8px auto 12px' }} />
        )}
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
              color: 'var(--text-main)', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}
          >
            {confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
