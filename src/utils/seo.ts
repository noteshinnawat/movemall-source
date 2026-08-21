// src/utils/seo.ts
import type { Product } from '../types';
import { formatCurrency } from '../i18n/formatters.ts';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, withLocale } from '../i18n/locales.ts';
import type { Locale } from '../i18n/locales.ts';

export const SITE_ORIGIN = 'https://movemall.app';

const OG_LOCALES: Record<Locale, string> = {
  th: 'th_TH',
  en: 'en_US',
  my: 'my_MM',
};

/** A translator shaped like i18next's `t`, kept minimal so this module stays testable under plain Node. */
export type SeoTranslator = (key: string, values?: Record<string, unknown>) => string;

export interface SeoModel {
  title: string;
  description: string;
  canonicalUrl: string;
  /** Keyed by each supported locale plus `x-default`. */
  alternates: Record<string, string>;
  ogLocale: string;
  image: string;
  type: 'website' | 'product';
  keywords?: string;
  /** Omit to leave the page with no JSON-LD (and clear any previous script). */
  structuredData?: Record<string, unknown>;
  priceAmount?: number;
  availableStock?: number;
}

function buildAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    alternates[locale] = `${SITE_ORIGIN}${withLocale(path, locale)}`;
  }
  alternates['x-default'] = `${SITE_ORIGIN}${withLocale(path, DEFAULT_LOCALE)}`;
  return alternates;
}

/**
 * Converts any product name (Thai / English / Myanmar / Numbers) into a clean,
 * human & search engine-friendly URL slug.
 * Example:
 * "Apple iPhone 15 Pro Max 256GB ไทเทเนียมธรรมชาติ"
 * -> "apple-iphone-15-pro-max-256gb-ไทเทเนียมธรรมชาติ"
 */
export function slugify(text: string): string {
  if (!text) return 'item';
  return text
    .toLowerCase()
    .trim()
    // Preserve English alphanumeric, Thai (฀-๿) and Myanmar (က-႟) Unicode ranges
    .replace(/[^\w฀-๿က-႟a-z0-9]+/gi, '-')
    // Replace consecutive hyphens with a single hyphen
    .replace(/-+/g, '-')
    // Trim hyphens from begin and end
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Returns canonical SEO friendly product URL in standard Shopee / Lazada format:
 * `/product/{slug}-i.{id}`
 * Example: `/product/apple-iphone-15-pro-max-256gb-i.el-1`
 */
export function getProductUrl(product: { id: string; name?: string; slug?: string } | undefined | null): string {
  if (!product || !product.id) return '/shop';
  const slug = product.slug || slugify(product.name || 'product');
  return `/product/${slug}-i.${product.id}`;
}

/**
 * Extracts raw product ID from either SEO slug URL or direct ID param:
 * Supports:
 * - `apple-iphone-15-pro-max-256gb-i.el-1` -> `el-1`
 * - `el-1` -> `el-1`
 * - `apple-iphone-15-pro-max-256gb-el-1` -> `el-1` (fallback)
 */
export function extractProductId(param: string | undefined | null): string {
  if (!param) return '';
  const decoded = decodeURIComponent(param);

  // Standard Shopee/Lazada format: slug-i.ID
  if (decoded.includes('-i.')) {
    const parts = decoded.split('-i.');
    return parts[parts.length - 1];
  }

  return decoded;
}

/**
 * Builds the localized SEO model for a product detail page. Pure and
 * DOM-free so it's independently testable — product name/description stay
 * exactly as supplied (never translated); only the surrounding copy
 * (fallback description, breadcrumb labels, price formatting) is localized.
 */
export function buildProductSeo(
  product: Product,
  locale: Locale,
  t: SeoTranslator,
  storeName?: string,
): SeoModel {
  const path = getProductUrl(product);
  const canonicalUrl = `${SITE_ORIGIN}${withLocale(path, locale)}`;
  const priceLabel = formatCurrency(product.price ?? 0, locale);
  const title = t('catalog:seo.productTitle', { name: product.name, price: priceLabel });
  const description = (product.description || t('catalog:seo.productDescriptionFallback', { name: product.name })).slice(0, 160);
  const image = product.images?.[0] || `${SITE_ORIGIN}/og-image.png`;
  const categoryName = product.category
    ? t(`catalog:categories.${product.category}.name`, { defaultValue: product.category })
    : t('catalog:seo.allProducts');

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': canonicalUrl,
        name: product.name,
        image: product.images,
        description,
        sku: product.id,
        mpn: product.id,
        brand: {
          '@type': 'Brand',
          name: storeName || 'Movemall Official',
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'THB',
          price: product.price ?? 0,
          priceValidUntil: '2027-12-31',
          itemCondition: 'https://schema.org/NewCondition',
          availability: (product.stock ?? 10) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: storeName || 'Movemall Official',
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating || 4.9,
          reviewCount: product.reviewCount || 12,
          bestRating: '5',
          worstRating: '1',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: t('catalog:seo.home'),
            item: `${SITE_ORIGIN}${withLocale('/', locale)}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: categoryName,
            item: `${SITE_ORIGIN}${withLocale('/shop', locale)}?category=${encodeURIComponent(product.category || '')}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.name,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return {
    title,
    description,
    canonicalUrl,
    alternates: buildAlternates(path),
    ogLocale: OG_LOCALES[locale],
    image,
    type: 'product',
    keywords: t('catalog:seo.keywords', { name: product.name, category: categoryName }),
    structuredData,
    priceAmount: product.price ?? 0,
    availableStock: product.stock,
  };
}

/**
 * Builds the SEO model for a static (non-product) buyer page from an
 * already-resolved title/description pair (see `BuyerSeo`).
 */
export function buildStaticSeo(
  path: string,
  locale: Locale,
  copy: { title: string; description: string },
): SeoModel {
  return {
    title: copy.title,
    description: copy.description,
    canonicalUrl: `${SITE_ORIGIN}${withLocale(path, locale)}`,
    alternates: buildAlternates(path),
    ogLocale: OG_LOCALES[locale],
    image: `${SITE_ORIGIN}/og-image.png`,
    type: 'website',
  };
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonicalTag(href: string) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

const STRUCTURED_DATA_ID = 'movemall-structured-data';

/**
 * Writes one `SeoModel` to the document: title, canonical, exactly the
 * four current `link[rel="alternate"]` entries (any previous ones are
 * removed first so switching pages/languages never accumulates stale
 * tags), Open Graph/Twitter meta, and JSON-LD (cleared when the model
 * carries none).
 */
export function applySeoTags(model: SeoModel) {
  if (typeof document === 'undefined') return;

  document.title = model.title;

  setMetaTag('name', 'description', model.description);
  if (model.keywords) setMetaTag('name', 'keywords', model.keywords);
  setCanonicalTag(model.canonicalUrl);

  document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());
  for (const [hreflang, href] of Object.entries(model.alternates)) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    link.setAttribute('href', href);
    document.head.appendChild(link);
  }

  setMetaTag('property', 'og:type', model.type);
  setMetaTag('property', 'og:title', model.title);
  setMetaTag('property', 'og:description', model.description);
  setMetaTag('property', 'og:image', model.image);
  setMetaTag('property', 'og:url', model.canonicalUrl);
  setMetaTag('property', 'og:site_name', 'Movemall');
  setMetaTag('property', 'og:locale', model.ogLocale);

  if (model.type === 'product' && model.priceAmount !== undefined) {
    setMetaTag('property', 'product:price:amount', model.priceAmount.toString());
    setMetaTag('property', 'product:price:currency', 'THB');
  }

  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', model.title);
  setMetaTag('name', 'twitter:description', model.description);
  setMetaTag('name', 'twitter:image', model.image);

  let scriptEl = document.getElementById(STRUCTURED_DATA_ID) as HTMLScriptElement | null;
  if (!model.structuredData) {
    scriptEl?.remove();
    return;
  }
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = STRUCTURED_DATA_ID;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.text = JSON.stringify(model.structuredData);
}
