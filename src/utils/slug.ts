/**
 * Helper to generate and clean SEO-friendly URL slugs for Stores & Products
 */
export function generateSlug(text: string): string {
  if (!text) return `store-${Math.random().toString(36).substring(2, 7)}`;
  
  // Clean special chars, preserve english, numbers, thai characters, and hyphens
  const clean = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0E00-\u0E7F-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return clean || `store-${Math.random().toString(36).substring(2, 7)}`;
}

export function formatStoreUrl(slugOrId: string): string {
  return `/store/${encodeURIComponent(slugOrId)}`;
}
