import React from 'react';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';

export default function HomeOverview() {
  const { profile } = useAuth();
  const { t } = useTranslation();

  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
    : profile?.full_name || 'Usuario';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={styles.sectionBox}>
        <h2 style={{ margin: '0 0 6px', color: 'var(--text-main)', fontSize: '20px' }}>
          {t('home_overview.title')}
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
          Hola, <strong>{displayName}</strong>. {t('home_overview.subtitle')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>📦</div>
          <h4 style={{ margin: '0 0 8px', color: 'var(--text-main)' }}>{t('home_overview.card1_title')}</h4>
          <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '13px', lineHeight: '1.4' }}>
            {t('home_overview.card1_desc')}
          </p>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🛡️</div>
          <h4 style={{ margin: '0 0 8px', color: 'var(--text-main)' }}>{t('home_overview.card2_title')}</h4>
          <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '13px', lineHeight: '1.4' }}>
            {t('home_overview.card2_desc')}
          </p>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚡</div>
          <h4 style={{ margin: '0 0 8px', color: 'var(--text-main)' }}>{t('home_overview.card3_title')}</h4>
          <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '13px', lineHeight: '1.4' }}>
            {t('home_overview.card3_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
