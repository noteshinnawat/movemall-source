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
