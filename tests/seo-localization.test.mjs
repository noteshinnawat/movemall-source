import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProductSeo, buildStaticSeo, slugify } from '../src/utils/seo.ts';

const product = {
  id: 'p-1', storeId: 's-1', name: 'Original Product', description: 'Original description',
  price: 1500, images: ['/product.webp'], category: 'electronics', rating: 5,
  reviewCount: 1, stock: 10, tags: [],
};
const fakeTranslator = (key, values = {}) => ({
  'catalog:seo.productTitle': `${values.name} | Movemall`,
  'catalog:seo.productDescription': values.description,
  'catalog:seo.home': 'Home',
  'catalog:seo.allProducts': 'All products',
}[key] ?? key);

test('builds locale canonical and alternates without translating product content', () => {
  const model = buildProductSeo(product, 'my', fakeTranslator, 'Original Store');
  assert.match(model.canonicalUrl, /\/my\/product\//);
  assert.deepEqual(Object.keys(model.alternates).sort(), ['en', 'my', 'th', 'x-default']);
  assert.equal(model.structuredData['@graph'][0].name, product.name);
  assert.equal(model.structuredData['@graph'][0].description.includes(product.description), true);
});

test('alternates cover every supported locale plus x-default with the same slug', () => {
  const model = buildProductSeo(product, 'en', fakeTranslator, 'Original Store');
  assert.match(model.alternates.th, /^https:\/\/movemall\.app\/th\/product\//);
  assert.match(model.alternates.en, /^https:\/\/movemall\.app\/en\/product\//);
  assert.match(model.alternates.my, /^https:\/\/movemall\.app\/my\/product\//);
  assert.equal(model.alternates['x-default'], model.alternates.th);
});

test('never renames the product or its store — only surrounding copy is localized', () => {
  const model = buildProductSeo(product, 'th', fakeTranslator, 'Original Store');
  assert.equal(model.structuredData['@graph'][0].brand.name, 'Original Store');
  assert.equal(model.structuredData['@graph'][0].offers.seller.name, 'Original Store');
  assert.equal(model.structuredData['@graph'][0].image, product.images);
});

test('falls back to a translated description only when the product has none', () => {
  const withoutDescription = { ...product, description: '' };
  const translatorRecordingCalls = (key, values = {}) => {
    if (key === 'catalog:seo.productDescriptionFallback') return `Fallback for ${values.name}`;
    return fakeTranslator(key, values);
  };
  const model = buildProductSeo(withoutDescription, 'en', translatorRecordingCalls, 'Store');
  assert.equal(model.description, 'Fallback for Original Product');
});

test('buildStaticSeo carries the supplied copy through without mutation', () => {
  const model = buildStaticSeo('/shop', 'en', { title: 'Shop | Movemall', description: 'Browse everything' });
  assert.equal(model.title, 'Shop | Movemall');
  assert.equal(model.description, 'Browse everything');
  assert.equal(model.canonicalUrl, 'https://movemall.app/en/shop');
  assert.equal(model.type, 'website');
  assert.equal(model.structuredData, undefined);
});

test('slugify accepts Myanmar Unicode alongside Thai and Latin text', () => {
  const slug = slugify('ကုန်ပစ္စည်း Test 123');
  assert.match(slug, /^[a-z0-9-ကုန်ပစ္စည်း]+$/u);
  assert.ok(slug.length > 0);
});
