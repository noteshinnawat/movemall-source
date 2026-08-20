export const SUPPORTED_LOCALES = ['th', 'en', 'my'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'th';
export const LOCALE_STORAGE_KEY = 'movemall_locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale);
}

export function localeFromPath(pathname: string): Locale | null {
  const first = pathname.split('/').filter(Boolean)[0];
  return isLocale(first) ? first : null;
}

export function stripLocale(path: string): string {
  const [, pathname = '/', suffix = ''] = path.match(/^([^?#]*)(.*)$/u) ?? [];
  const locale = localeFromPath(pathname);
  const bare = locale ? pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/' : pathname;
  return `${bare}${suffix}`;
}

export function withLocale(path: string, locale: Locale): string {
  const bare = stripLocale(path);
  return bare === '/' ? `/${locale}` : `/${locale}${bare}`;
}

export const replaceLocale = withLocale;

export function resolveRootLocale(value: string | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
