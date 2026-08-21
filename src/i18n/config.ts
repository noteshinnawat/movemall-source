import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { formatCompactNumber, formatNumber } from './formatters';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, resolveRootLocale } from './locales';

export const NAMESPACES = [
  'common',
  'navigation',
  'auth',
  'catalog',
  'commerce',
  'engagement',
  'legal',
] as const;

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    supportedLngs: SUPPORTED_LOCALES,
    fallbackLng: DEFAULT_LOCALE,
    ns: NAMESPACES,
    defaultNS: 'common',
    returnEmptyString: false,
    maxRetries: 1,
    retryTimeout: 250,
    parseMissingKeyHandler: () => 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

// Counts are passed to `t` as raw numbers so plural resolution works; these
// formatters render them with the active locale's grouping and Latin digits.
i18n.services.formatter?.add('number', (value, lng) =>
  formatNumber(Number(value), resolveRootLocale(lng ?? null)),
);
i18n.services.formatter?.add('compact', (value, lng) =>
  formatCompactNumber(Number(value), resolveRootLocale(lng ?? null)),
);

export default i18n;
