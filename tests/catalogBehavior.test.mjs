import test from 'node:test';
import assert from 'node:assert/strict';

async function loadCatalogBehavior() {
  try {
    return await import('../src/pages/ProductDetailPage.behavior.ts');
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
