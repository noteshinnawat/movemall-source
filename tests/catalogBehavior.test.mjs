import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function loadCatalogBehavior() {
  try {
    return await import('../src/pages/ProductDetailPage.behavior.ts');
  } catch {
    return {};
  }
}

async function loadMallBehavior() {
  try {
    return await import('../src/pages/BrandMallPage.behavior.ts');
  } catch {
    return {};
  }
}

test('embedded demo variants resolve to stable locale keys by product category', async () => {
  const { getDemoProductOptionKeys } = await loadCatalogBehavior();

  assert.equal(typeof getDemoProductOptionKeys, 'function');
  assert.deepEqual(getDemoProductOptionKeys('fashion'), [
    'product.options.fashion.classicBlack',
    'product.options.fashion.pearlWhite',
    'product.options.fashion.navyBlue',
    'product.options.fashion.beige',
  ]);
  assert.deepEqual(getDemoProductOptionKeys('electronics'), [
    'product.options.electronics.spaceGray',
    'product.options.electronics.silver',
    'product.options.electronics.midnightBlue',
    'product.options.electronics.starlight',
  ]);
  assert.deepEqual(getDemoProductOptionKeys('beauty'), [
    'product.options.beauty.naturalGlow',
    'product.options.beauty.warmPeach',
    'product.options.beauty.softRose',
  ]);
  assert.deepEqual(getDemoProductOptionKeys('unknown-api-category'), [
    'product.options.default.standard',
    'product.options.default.proEdition',
    'product.options.default.classicBlack',
  ]);
});

test('embedded demo option labels are monolingual in every catalog', async () => {
  const catalogs = Object.fromEntries(await Promise.all(['th', 'en', 'my'].map(async locale => [
    locale,
    JSON.parse(await readFile(`public/locales/${locale}/catalog.json`, 'utf8')),
  ])));
  const optionLabels = locale => Object.values(catalogs[locale].product.options)
    .flatMap(group => Object.values(group));

  assert.ok(optionLabels('th').every(label => !/[A-Za-zက-႟]/u.test(label)), optionLabels('th'));
  assert.ok(optionLabels('en').every(label => !/[ก-๙က-႟]/u.test(label)), optionLabels('en'));
  assert.ok(optionLabels('my').every(label => !/[A-Za-zก-๙]/u.test(label)), optionLabels('my'));
});

test('product thresholds produce complete locale-formatted interpolation inputs', async () => {
  const { getProductPerkInterpolation } = await loadCatalogBehavior();

  assert.equal(typeof getProductPerkInterpolation, 'function');
  assert.deepEqual(getProductPerkInterpolation(4321, 'en'), { amount: 'THB\u00a04,321.00' });
  assert.deepEqual(getProductPerkInterpolation(9876, 'my'), { amount: '9,876.00\u00a0฿' });
});

test('Mall offers format mutated canonical values before catalog interpolation', async () => {
  const { getMallVoucherInterpolation } = await loadMallBehavior();

  assert.equal(typeof getMallVoucherInterpolation, 'function');
  assert.deepEqual(getMallVoucherInterpolation({
    discountPercent: 17,
    minimumSpend: 4321,
    maximumDiscount: 876,
    expiryHours: 36,
  }, 'en'), {
    discount: '17',
    minimum: 'THB\u00a04,321.00',
    maximum: 'THB\u00a0876.00',
    hours: '36',
  });
  assert.deepEqual(getMallVoucherInterpolation({
    discountAmount: 765,
    minimumSpend: 5432,
    minimumDeliveryDays: 3,
    maximumDeliveryDays: 5,
  }, 'my'), {
    amount: '765.00\u00a0฿',
    minimum: '5,432.00\u00a0฿',
    minimumDays: '3',
    maximumDays: '5',
  });
});

test('catalog audience metrics remain canonical numbers in source data', async () => {
  const { mockLiveStreams } = await import('../src/data/liveStreams.ts');
  const { famousBrands } = await import('../src/data/brands.ts');

  assert.ok(mockLiveStreams.every(stream => Number.isFinite(stream.viewers)));
  assert.ok(famousBrands.every(brand => Number.isFinite(brand.followers)));
});
