import { readFile } from 'node:fs/promises';

const languages = ['th', 'en', 'my'];
const namespaces = ['common', 'navigation', 'auth', 'catalog', 'commerce', 'engagement', 'legal'];

const flatten = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return child && typeof child === 'object' && !Array.isArray(child) ? flatten(child, path) : [[path, child]];
});

// Interpolation tokens are load-bearing: a placeholder dropped in one language
// makes its value vanish from the UI, which key parity alone would not catch.
const placeholders = value => (typeof value === 'string'
  ? [...value.matchAll(/\{\{([^}]+)\}\}/g)].map(([, token]) => token.trim()).sort()
  : []).join('|');

const errors = [];

for (const namespace of namespaces) {
  const catalogs = Object.fromEntries(await Promise.all(languages.map(async language => {
    try {
      return [language, JSON.parse(await readFile(`public/locales/${language}/${namespace}.json`, 'utf8'))];
    } catch (error) {
      errors.push(`Unable to read ${language}/${namespace}: ${error.message}`);
      return [language, {}];
    }
  })));
  const expectedKeys = new Set(flatten(catalogs.th).map(([key]) => key));

  for (const language of languages) {
    const entries = flatten(catalogs[language]);
    const actualKeys = new Set(entries.map(([key]) => key));
    const missing = [...expectedKeys].filter(key => !actualKeys.has(key));
    const extra = [...actualKeys].filter(key => !expectedKeys.has(key));
    const empty = entries.filter(([, value]) => typeof value === 'string' && value.trim().length === 0).map(([key]) => key);

    const thaiValues = new Map(flatten(catalogs.th));
    const mismatched = entries
      .filter(([key, value]) => actualKeys.has(key) && expectedKeys.has(key)
        && placeholders(value) !== placeholders(thaiValues.get(key)))
      .map(([key]) => key);

    if (missing.length) errors.push(`${language}/${namespace}: missing keys: ${missing.join(', ')}`);
    if (mismatched.length) errors.push(`${language}/${namespace}: placeholder mismatch: ${mismatched.join(', ')}`);
    if (extra.length) errors.push(`${language}/${namespace}: extra keys: ${extra.join(', ')}`);
    if (empty.length) errors.push(`${language}/${namespace}: empty keys: ${empty.join(', ')}`);
  }
}

if (errors.length) {
  console.error('Locale catalog validation failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('Locale catalogs are valid.');
}
