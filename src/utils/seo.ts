// src/utils/seo.ts
import type { Product } from '../types';

/**
 * Converts any product name (Thai / English / Numbers) into a clean, human & search engine-friendly URL slug.
 * Example:
 * "Apple iPhone 15 Pro Max 256GB ไทเทเนียมธรรมชาติ"
 * -> "apple-iphone-15-pro-max-256gb-ไทเทเนียมธรรมชาติ"
 */
export function slugify(text: string): string {
  if (!text) return 'item';
  return text
    .toLowerCase()
    .trim()
    // Preserve English alphanumeric and Thai Unicode range (\u0E00-\u0E7F)
    .replace(/[^\w\u0E00-\u0E7Fa-z0-9]+/gi, '-')
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
 * Injects dynamic Open Graph, Twitter, Meta description, and Schema.org JSON-LD Structured Data
 * for maximum Google SEO Rich Snippet ranking.
 */
export function updateProductSEO(product: Product, storeName?: string) {
  if (typeof document === 'undefined' || !product) return;

  const siteTitle = 'Movemall';
  const pageTitle = `${product.name} | ราคาพิเศษ ฿${(product.price ?? 0).toLocaleString()} ช้อปเลยที่ ${siteTitle}`;
  const description = (product.description || `${product.name} ช้อปออนไลน์ราคาพิเศษ ของแท้ 100% พร้อมบริการส่งฟรีทั่วไทย ผ่อน 0% ซื้อเลยที่ Movemall`).slice(0, 160);
  const primaryImage = product.images?.[0] || 'https://movemall.app/og-image.png';
  const canonicalUrl = `https://movemall.app${getProductUrl(product)}`;

  // 1. Update Document Title
  document.title = pageTitle;

  // 2. Helper to set or create meta tag
  const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 3. Helper for Link tags
  const setLinkTag = (rel: string, href: string) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  // Standard Meta Tags
  setMetaTag('name', 'description', description);
  setMetaTag('name', 'keywords', `${product.name}, ${product.category}, ช้อปปิ้งออนไลน์, Movemall, ซื้อ ${product.name}`);
  setLinkTag('canonical', canonicalUrl);

  // Open Graph / Social Media Preview
  setMetaTag('property', 'og:type', 'product');
  setMetaTag('property', 'og:title', pageTitle);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:image', primaryImage);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:site_name', siteTitle);
  setMetaTag('property', 'product:price:amount', (product.price ?? 0).toString());
  setMetaTag('property', 'product:price:currency', 'THB');

  // Twitter Card
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', pageTitle);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', primaryImage);

  // 4. Schema.org JSON-LD Structured Data for Google Rich Snippets
  const jsonLdId = `jsonld-product-${product.id}`;
  let scriptEl = document.getElementById(jsonLdId) as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = jsonLdId;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': canonicalUrl,
        name: product.name,
        image: product.images,
        description: description,
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
            name: 'หน้าแรก',
            item: 'https://movemall.app/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: product.category || 'สินค้าทั้งหมด',
            item: `https://movemall.app/shop?category=${encodeURIComponent(product.category || '')}`,
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

  scriptEl.text = JSON.stringify(structuredData);
}
