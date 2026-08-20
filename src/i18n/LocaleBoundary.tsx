import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation } from 'react-router-dom';
import i18n from './config';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, localeFromPath, withLocale } from './locales';

export function LocalizedNotFound() {
  const location = useLocation();
  const { t } = useTranslation('common');
  const locale = localeFromPath(location.pathname) ?? DEFAULT_LOCALE;

  return (
    <div style={{
      paddingTop: 'calc(var(--navbar-height) + var(--space-12))',
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>404 — {t('errors.notFound')}</h1>
      <Link
        to={withLocale('/', locale)}
        style={{
          marginTop: 8,
          padding: '10px 20px',
          background: 'var(--primary)',
          color: 'white',
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        Movemall
      </Link>
    </div>
  );
}

export function LocaleBoundary() {
  const location = useLocation();
  const locale = localeFromPath(location.pathname);

  useEffect(() => {
    if (!locale) return;

    void i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  return locale ? <Outlet /> : <LocalizedNotFound />;
}
