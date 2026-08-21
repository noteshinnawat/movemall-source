import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation } from 'react-router-dom';
import i18n from './config';
import { BuyerSeo } from './BuyerSeo';
import {
  LOCALE_STORAGE_KEY,
  localeFromPath,
  resolvePathLocale,
  withLocale,
} from './locales';

export function LocalizedNotFound() {
  const location = useLocation();
  const { t } = useTranslation('common');
  const locale = resolvePathLocale(location.pathname);

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
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>
        404 — {t('errors.notFound', { lng: locale })}
      </h1>
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
  const resolvedLocale = resolvePathLocale(location.pathname);

  useEffect(() => {
    void i18n.changeLanguage(resolvedLocale);
    document.documentElement.lang = resolvedLocale;
    if (locale) localStorage.setItem(LOCALE_STORAGE_KEY, locale);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.setAttribute('rel', 'manifest');
      document.head.appendChild(manifestLink);
    }
    manifestLink.setAttribute('href', `/manifest.${resolvedLocale}.json`);
  }, [locale, resolvedLocale]);

  if (!locale) return <LocalizedNotFound />;

  return (
    <>
      <BuyerSeo />
      <Outlet />
    </>
  );
}
