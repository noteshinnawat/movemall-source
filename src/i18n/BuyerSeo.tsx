// src/i18n/BuyerSeo.tsx — Applies localized SEO tags for every static buyer
// route. Product detail pages own their SEO via `buildProductSeo` because
// their title/description depend on the product, not just the route.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { applySeoTags, buildStaticSeo } from '../utils/seo';
import { resolvePathLocale, stripLocale } from './locales';

// Maps a stripped buyer pathname to its translation key stem. Dynamic
// segments (`/product/:id`, `/store/:id`) are matched by prefix below.
const STATIC_PAGE_SEO: Record<string, string> = {
  '/': 'catalog:seo.pages.home',
  '/shop': 'catalog:seo.pages.shop',
  '/mall': 'catalog:seo.pages.mall',
  '/compare': 'catalog:seo.pages.compare',
  '/stores': 'catalog:seo.pages.stores',
  '/live': 'engagement:seo.pages.live',
  '/video': 'engagement:seo.pages.video',
  '/games': 'engagement:seo.pages.games',
  '/flash-sale': 'engagement:seo.pages.flashSale',
  '/vouchers': 'engagement:seo.pages.vouchers',
  '/chat': 'engagement:seo.pages.chat',
  '/notifications': 'engagement:seo.pages.notifications',
  '/login': 'auth:seo.pages.login',
  '/register': 'auth:seo.pages.register',
  '/account': 'auth:seo.pages.account',
  '/cart': 'commerce:seo.pages.cart',
  '/checkout': 'commerce:seo.pages.checkout',
  '/order/success': 'commerce:seo.pages.orderSuccess',
  '/wishlist': 'commerce:seo.pages.wishlist',
  '/orders': 'commerce:seo.pages.orders',
  '/help': 'legal:seo.pages.help',
  '/how-to-order': 'legal:seo.pages.howToOrder',
  '/shipping': 'legal:seo.pages.shipping',
  '/returns': 'legal:seo.pages.returns',
  '/contact': 'legal:seo.pages.contact',
  '/privacy': 'legal:seo.pages.privacy',
  '/privacy-policy': 'legal:seo.pages.privacy',
  '/terms': 'legal:seo.pages.terms',
};

// Prefix-matched dynamic routes: tracking accepts an order id, store accepts
// a store id — both reuse the closest static page copy since a per-entity
// title would need the entity's own data (out of scope for this component).
const DYNAMIC_PAGE_SEO: [prefix: string, key: string][] = [
  ['/tracking', 'commerce:seo.pages.tracking'],
  ['/store/', 'catalog:seo.pages.stores'],
];

// Routes with no public SEO value: product detail (handled separately) and
// the OAuth callback (transient, never linked to or indexed).
function isExcludedRoute(routePath: string): boolean {
  return routePath.startsWith('/product/') || routePath === '/auth/line/callback';
}

export function BuyerSeo() {
  const location = useLocation();
  const { t } = useTranslation(['catalog', 'commerce', 'engagement', 'auth', 'legal']);
  const locale = resolvePathLocale(location.pathname);
  const routePath = stripLocale(location.pathname) || '/';

  useEffect(() => {
    if (isExcludedRoute(routePath)) return;

    const key = STATIC_PAGE_SEO[routePath]
      ?? DYNAMIC_PAGE_SEO.find(([prefix]) => routePath.startsWith(prefix))?.[1];
    if (!key) return;

    applySeoTags(buildStaticSeo(routePath, locale, {
      title: t(`${key}.title`),
      description: t(`${key}.description`),
    }));
  }, [routePath, locale, t]);

  return null;
}
