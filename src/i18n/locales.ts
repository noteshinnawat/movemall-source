export const SUPPORTED_LOCALES = ['th', 'en', 'my'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'th';
export const LOCALE_STORAGE_KEY = 'movemall_locale';

export const BUYER_ROUTE_PATHS = [
  '/',
  '/shop',
  '/mall',
  '/live',
  '/video',
  '/games',
  '/flash-sale',
  '/vouchers',
  '/notifications',
  '/tracking',
  '/tracking/:orderId',
  '/compare',
  '/stores',
  '/chat',
  '/login',
  '/register',
  '/auth/line/callback',
  '/account',
  '/product/:id',
  '/store/:id',
  '/cart',
  '/checkout',
  '/order/success',
  '/wishlist',
  '/orders',
  '/help',
  '/how-to-order',
  '/shipping',
  '/returns',
  '/contact',
  '/privacy',
  '/privacy-policy',
  '/terms',
] as const;

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

function pathnameOnly(path: string): string {
  return path.match(/^[^?#]*/u)?.[0] || '/';
}

function matchesRoutePattern(pathname: string, pattern: string): boolean {
  const pathSegments = pathname.split('/').filter(Boolean);
  const patternSegments = pattern.split('/').filter(Boolean);

  return pathSegments.length === patternSegments.length
    && patternSegments.every((segment, index) => segment.startsWith(':') || segment === pathSegments[index]);
}

export function isBuyerLegacyPath(path: string): boolean {
  const pathname = pathnameOnly(path).replace(/\/+$/u, '') || '/';
  return localeFromPath(pathname) === null
    && BUYER_ROUTE_PATHS.some(pattern => matchesRoutePattern(pathname, pattern));
}

export function legacyRedirectTarget(path: string, savedLocale: string | null): string | null {
  if (localeFromPath(path)) return null;

  const pathname = pathnameOnly(path).replace(/\/+$/u, '') || '/';
  if (pathname === '/') return withLocale(path, resolveRootLocale(savedLocale));
  return isBuyerLegacyPath(path) ? withLocale(path, DEFAULT_LOCALE) : null;
}
