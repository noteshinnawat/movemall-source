import test from 'node:test';
import assert from 'node:assert/strict';

async function loadVisualSearchBehavior() {
  try {
    return await import('../src/components/VisualSearch.behavior.ts');
  } catch {
    return {};
  }
}

test('synthetic ranking tokens and results stay identical across UI locales', async () => {
  const {
    createSyntheticSearchSubject,
    rankVisualSearchProducts,
  } = await loadVisualSearchBehavior();

  assert.equal(typeof createSyntheticSearchSubject, 'function');
  assert.equal(typeof rankVisualSearchProducts, 'function');

  const products = [
    { id: 'matching', name: 'Ready', tags: ['พร้อมส่ง'], category: 'electronics' },
    { id: 'other', name: 'Basic', tags: [], category: 'electronics' },
  ];
  const localizedLabels = [
    'วัตถุหลักที่ตรวจพบ (Primary Subject)',
    'Primary detected subject',
    'ရှာဖွေတွေ့ရှိသော အဓိကအရာ',
  ];

  for (const label of localizedLabels) {
    const subject = createSyntheticSearchSubject(label);
    assert.equal(subject.label, label);
    assert.deepEqual(subject.suggestedKeywords, ['ยอดนิยม', 'คุณภาพสูง', 'ของแท้', 'พร้อมส่ง']);
    assert.deepEqual(
      rankVisualSearchProducts(products, 'electronics', subject.suggestedKeywords)
        .map(product => ({ id: product.id, visualMatchScore: product.visualMatchScore })),
      [
        { id: 'matching', visualMatchScore: 99 },
        { id: 'other', visualMatchScore: 92 },
      ],
    );
  }
});

test('visual search uses the neutral Movemall Store proper name only as fallback', async () => {
  const { resolveVisualSearchStoreName } = await loadVisualSearchBehavior();

  assert.equal(typeof resolveVisualSearchStoreName, 'function');
  assert.equal(resolveVisualSearchStoreName(undefined), 'Movemall Store');
  assert.equal(resolveVisualSearchStoreName('TechPro Official Store'), 'TechPro Official Store');
});
