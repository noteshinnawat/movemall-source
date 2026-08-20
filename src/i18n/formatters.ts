import type { Locale } from './locales.ts';

const LOCALE_TAGS: Record<Locale, string> = {
  th: 'th-TH',
  en: 'en-US',
  my: 'my-MM',
};

const localeTag = (locale: Locale) => LOCALE_TAGS[locale];

export function formatCurrency(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'currency',
    currency: 'THB',
    numberingSystem: 'latn',
  }).format(value);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag(locale), {
    numberingSystem: 'latn',
  }).format(value);
}

export function formatDate(value: Date | number | string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: 'medium',
    numberingSystem: 'latn',
  }).format(new Date(value));
}

export function formatTime(value: Date | number | string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeStyle: 'short',
    numberingSystem: 'latn',
  }).format(new Date(value));
}
