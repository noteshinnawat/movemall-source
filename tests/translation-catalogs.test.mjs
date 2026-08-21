import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const languages = ['th', 'en', 'my'];
const namespaces = ['common', 'navigation', 'auth', 'catalog', 'commerce', 'engagement', 'legal'];
const flatten = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return child && typeof child === 'object' && !Array.isArray(child) ? flatten(child, path) : [[path, child]];
});

test('translation catalogs have identical non-empty keys', async () => {
  for (const namespace of namespaces) {
    const catalogs = Object.fromEntries(await Promise.all(languages.map(async language => [
      language,
      JSON.parse(await readFile(`public/locales/${language}/${namespace}.json`, 'utf8')),
    ])));
    const thaiKeys = flatten(catalogs.th).map(([key]) => key).sort();
    for (const language of languages) {
      const entries = flatten(catalogs[language]);
      assert.deepEqual(entries.map(([key]) => key).sort(), thaiKeys, `${language}/${namespace}`);
      assert.ok(entries.every(([, value]) => typeof value !== 'string' || value.trim().length > 0));
    }
  }
});

test('every order status has a commerce label in all languages', async () => {
  const source = await readFile('src/data/orders.ts', 'utf8');
  const union = source.match(/export type OrderStatus = ([^;]+);/)[1];
  const statuses = [...union.matchAll(/'([^']+)'/g)].map(([, status]) => status).sort();
  assert.ok(statuses.length > 0);

  for (const language of languages) {
    const catalog = JSON.parse(await readFile(`public/locales/${language}/commerce.json`, 'utf8'));
    assert.deepEqual(Object.keys(catalog.orderStatus).sort(), statuses, `${language} orderStatus`);
  }
});

test('single-category languages carry one wording across both plural forms', async () => {
  for (const namespace of namespaces) {
    for (const language of ['th', 'my']) {
      const catalog = JSON.parse(await readFile(`public/locales/${language}/${namespace}.json`, 'utf8'));
      const entries = new Map(flatten(catalog));
      // Thai and Burmese resolve to `other` only, so `_one` exists solely to keep
      // catalogs key-identical; it must never drift away from the live wording.
      for (const [key, value] of entries) {
        if (!key.endsWith('_one')) continue;
        const other = entries.get(`${key.slice(0, -4)}_other`);
        assert.equal(value, other, `${language}/${namespace}: ${key}`);
      }
    }
  }
});
