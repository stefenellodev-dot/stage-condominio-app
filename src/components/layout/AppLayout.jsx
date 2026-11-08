import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { styles } from '../../styles/theme';
import { supabase } from '../../lib/supabase';
import { appConfig } from '../../config/appConfig';
import { businessModules } from '../../config/modules';
import { ROLES } from '../../constants/roles';

export default function AppLayout({ activeTab, onSelectTab, children }) {
  const { profile, isAdmin, isSuperadmin, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState('');
  const { lang, toggleLang, t } = useTranslation();

  const userRole = profile?.role || ROLES.USER;

  // Filtrado de módulos según el rol del usuario autenticado
  const availableModules = businessModules.filter(
    (mod) => !mod.roles || userRole === ROLES.SUPERADMIN || mod.roles.includes(userRole)
  );

  useEffect(() => {
    const avatarPath = profile?.avatar_url || '';
    if (!avatarPath) {
      setAvatarUrl('');
      return;
    }
    if (avatarPath.startsWith('http')) {
      setAvatarUrl(avatarPath);
      return;
    }
    supabase.storage.from('avatars').createSignedUrl(avatarPath, 900).then(({ data }) => {
      setAvatarUrl(data?.signedUrl || '');
    });
  }, [profile?.avatar_url]);

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
    color: isActive ? '#ffffff' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: isActive ? '600' : '500',
    textAlign: 'left',
    width: '100%',
    transition: 'background-color var(--transition-fast), color var(--transition-fast)',
  });

  const sectionHeaderStyle = {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--text-dim)',
    letterSpacing: '1px',
    padding: '14px 14px 6px',
    textTransform: 'uppercase',
  };

  // Determinar título para la cabecera superior
  const currentModule = availableModules.find((m) => m.id === activeTab);
  let activeTitle = currentModule
    ? (currentModule.labelKey ? t(currentModule.labelKey) : currentModule.label)
    : '';
  if (activeTab === 'profile') activeTitle = t('nav.my_profile');
  if (activeTab === 'users') activeTitle = t('nav.users_management');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* SKIP LINK */}
      <a href="#main-content" style={{
        position: 'absolute', left: '-9999px', top: 0, zIndex: 10001,
        padding: '8px 12px', background: 'var(--primary)', color: '#fff',
      }} onFocus={(e) => { e.currentTarget.style.left = '8px'; e.currentTarget.style.top = '8px'; }}
        onBlur={(e) => { e.currentTarget.style.left = '-9999px'; e.currentTarget.style.top = '0'; }}>
        Saltar al contenido principal
      </a>
      {/* SIDEBAR */}
      <aside style={{
        width: '260px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          {/* IDENTIDAD DINÁMICA DE LA APLICACIÓN */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '15px'
            }}>
              {appConfig.symbol}
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)', lineHeight: '1.2' }}>
                {appConfig.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {appConfig.tagline}
              </div>
            </div>
          </div>

          {/* MENÚ DE NAVEGACIÓN */}
          <nav style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* ZONA 1: APLICACIÓN / NEGOCIO */}
            <div style={sectionHeaderStyle}>{t('nav.app_section')}</div>
            {availableModules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => onSelectTab(mod.id)}
                style={navItemStyle(activeTab === mod.id)}
              >
                <span>{mod.icon}</span> {mod.labelKey ? t(mod.labelKey) : mod.label}
              </button>
            ))}

            {/* ZONA 2: SISTEMA Y ADMINISTRACIÓN */}
            <div style={sectionHeaderStyle}>{t('nav.admin_section')}</div>
            <button
              onClick={() => onSelectTab('profile')}
              style={navItemStyle(activeTab === 'profile')}
            >
              <span>👤</span> {t('nav.my_profile')}
            </button>


          </nav>
        </div>

        {/* PIE DEL SIDEBAR: USUARIO + CIERRE DE SESIÓN */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)'
        }}>
          <div
            onClick={() => onSelectTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              minWidth: 0,
              flex: 1,
              paddingRight: '8px'
            }}
            title="Ir a Mi Perfil"
          >
            {profile?.avatar_url ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0
              }}>
                {profile?.first_name ? profile.first_name[0] : 'U'}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '13px', fontWeight: '600', color: 'var(--text-main)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : profile?.full_name || 'Usuario'}
              </div>
              <span style={
                (profile?.role === ROLES.SUPERADMIN || isSuperadmin)
                  ? { ...styles.badgeAdmin, backgroundColor: "#7c3aed", color: "#ffffff" }
                  : profile?.role === ROLES.CONCIERGE
                  ? { ...styles.badgeAdmin, backgroundColor: "#059669", color: "#ffffff" }
                  : isAdmin
                  ? styles.badgeAdmin
                  : styles.badgeUser
              }>
                {(profile?.role === ROLES.SUPERADMIN || isSuperadmin)
                  ? (t('roles.badge_superadmin') || "SUPERADMIN")
                  : profile?.role === ROLES.CONCIERGE
                  ? (t('roles.badge_concierge') || "CONSERJE")
                  : isAdmin
                  ? t('roles.badge_admin')
                  : t('roles.badge_user')}
              </span>
            </div>
          </div>

          <button
            onClick={signOut}
            title={t('common.logout')}
            aria-label={t('common.logout')}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              transition: 'background-color var(--transition-fast), color var(--transition-fast)',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--danger-bg)';
              e.currentTarget.style.color = 'var(--danger-text)';
              e.currentTarget.style.borderColor = 'var(--danger-border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            ⎋
          </button>
        </div>
      </aside>

      {/* ÁREA CENTRAL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: '60px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            {activeTitle}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={toggleLang}
              style={{
                ...styles.buttonAction,
                padding: '6px 12px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '12px',
              }}
            >
              🌐 {lang === 'es' ? 'EN' : 'ES'}
            </button>
          </div>
        </header>

        <main id="main-content" style={{ padding: '28px', flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
