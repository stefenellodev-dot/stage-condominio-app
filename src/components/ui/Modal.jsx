import React from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';

export default function Modal({ open, onClose, children, maxWidth = '520px' }) {
  const isMobile = useIsMobile();
  if (!open) return null;

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', alignItems: isMobile ? 'flex-end' : 'center',
    justifyContent: 'center', overflow: 'auto',
    padding: isMobile ? '0' : '20px',
  };

  const containerStyle = isMobile ? {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px 16px 0 0',
    width: '100%', maxHeight: '85vh',
    overflowY: 'auto', padding: '0 20px 20px',
    position: 'relative',
  } : {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg, 12px)',
    maxWidth, width: '100%', maxHeight: '90vh',
    overflow: 'auto', padding: '20px', position: 'relative',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
        {isMobile && (
          <div style={{
            width: '36px', height: '4px',
            backgroundColor: 'var(--border-subtle)',
            borderRadius: '2px', margin: '8px auto 12px',
          }} />
        )}
        {children}
      </div>
    </div>
  );
}
