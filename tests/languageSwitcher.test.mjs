import test from 'node:test';
import assert from 'node:assert/strict';

async function loadLanguageSwitcherBehavior() {
  try {
    return await import('../src/components/LanguageSwitcher.behavior.ts');
  } catch {
    return {};
  }
}

test('language selection replaces the locale and preserves path, query, and hash', async () => {
  const { getLanguageSwitchTarget } = await loadLanguageSwitcherBehavior();

  assert.equal(typeof getLanguageSwitchTarget, 'function');
  assert.equal(
    getLanguageSwitchTarget('/en/shop', '?q=running%20shoe', '#filters', 'my'),
    '/my/shop?q=running%20shoe#filters',
  );
});

test('language switcher is excluded from operational routes only', async () => {
  const { isLanguageSwitcherExcluded } = await loadLanguageSwitcherBehavior();

  assert.equal(typeof isLanguageSwitcherExcluded, 'function');
  for (const path of ['/seller', '/seller/register', '/admin', '/affiliate', '/creator/studio', '/video/create']) {
    assert.equal(isLanguageSwitcherExcluded(path), true, path);
  }
  for (const path of ['/th', '/en/shop', '/my/video', '/th/product/example-i.1']) {
    assert.equal(isLanguageSwitcherExcluded(path), false, path);
  }
});

test('language menu keyboard navigation moves through every option and wraps', async () => {
  const { nextLanguageOptionIndex } = await loadLanguageSwitcherBehavior();

  assert.equal(typeof nextLanguageOptionIndex, 'function');
  assert.equal(nextLanguageOptionIndex(0, 'ArrowDown', 3), 1);
  assert.equal(nextLanguageOptionIndex(1, 'ArrowDown', 3), 2);
  assert.equal(nextLanguageOptionIndex(2, 'ArrowDown', 3), 0);
  assert.equal(nextLanguageOptionIndex(0, 'ArrowUp', 3), 2);
  assert.equal(nextLanguageOptionIndex(1, 'Home', 3), 0);
  assert.equal(nextLanguageOptionIndex(1, 'End', 3), 2);
});
