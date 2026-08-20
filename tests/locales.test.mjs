import test from 'node:test';
import assert from 'node:assert/strict';
import {
  localeFromPath, stripLocale, withLocale, replaceLocale, resolveRootLocale,
} from '../src/i18n/locales.ts';
import { formatCurrency, formatNumber } from '../src/i18n/formatters.ts';

test('reads and removes supported locale prefixes', () => {
  assert.equal(localeFromPath('/my/shop?q=shoe'), 'my');
  assert.equal(localeFromPath('/jp/shop'), null);
  assert.equal(stripLocale('/en/product/abc-i.1'), '/product/abc-i.1');
});

test('adds and replaces locale without losing search or hash', () => {
  assert.equal(withLocale('/shop?q=shoe#filters', 'en'), '/en/shop?q=shoe#filters');
  assert.equal(replaceLocale('/th/shop?q=shoe#filters', 'my'), '/my/shop?q=shoe#filters');
});

test('root locale uses saved supported value and otherwise Thai', () => {
  assert.equal(resolveRootLocale('en'), 'en');
  assert.equal(resolveRootLocale('jp'), 'th');
  assert.equal(resolveRootLocale(null), 'th');
});

test('formats THB and counts with the selected locale', () => {
  assert.match(formatCurrency(1500, 'th'), /1,500/);
  assert.match(formatCurrency(1500, 'en'), /1,500/);
  assert.equal(formatNumber(12500, 'en'), '12,500');
});
