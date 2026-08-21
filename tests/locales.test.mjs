import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isBuyerLegacyPath, legacyRedirectTarget, localeFromPath, stripLocale, withLocale,
  replaceLocale, resolvePathLocale, resolveRootLocale,
} from '../src/i18n/locales.ts';
import * as formatters from '../src/i18n/formatters.ts';

const { formatCurrency, formatNumber } = formatters;

test('reads and removes supported locale prefixes', () => {
  assert.equal(localeFromPath('/my/shop?q=shoe'), 'my');
  assert.equal(localeFromPath('/jp/shop'), null);
  assert.equal(stripLocale('/en/product/abc-i.1'), '/product/abc-i.1');
});

test('adds and replaces locale without losing search or hash', () => {
  assert.equal(withLocale('/shop?q=shoe#filters', 'en'), '/en/shop?q=shoe#filters');
  assert.equal(replaceLocale('/th/shop?q=shoe#filters', 'my'), '/my/shop?q=shoe#filters');
});

test('adds locale to relative buyer destinations with slash separation', () => {
  assert.equal(withLocale('shop?q=shoe#filters', 'en'), '/en/shop?q=shoe#filters');
});

test('root locale uses saved supported value and otherwise Thai', () => {
  assert.equal(resolveRootLocale('en'), 'en');
  assert.equal(resolveRootLocale('jp'), 'th');
  assert.equal(resolveRootLocale(null), 'th');
});

test('route locale resolution falls back to Thai for invalid prefixes', () => {
  assert.equal(resolvePathLocale('/en/shop'), 'en');
  assert.equal(resolvePathLocale('/jp/shop'), 'th');
});

test('legacy buyer routes redirect to Thai without changing URL state', () => {
  assert.equal(legacyRedirectTarget('/shop?q=phone#top', null), '/th/shop?q=phone#top');
  assert.equal(legacyRedirectTarget('/', 'my'), '/my');
  assert.equal(legacyRedirectTarget('/jp/shop', null), null);
});

test('operational routes never enter buyer localization', () => {
  for (const path of ['/seller', '/admin', '/affiliate', '/creator/studio', '/video/create']) {
    assert.equal(isBuyerLegacyPath(path), false);
  }
});

test('formats THB and counts with the selected locale', () => {
  assert.match(formatCurrency(1500, 'th'), /1,500/);
  assert.match(formatCurrency(1500, 'en'), /1,500/);
  assert.equal(formatNumber(12500, 'en'), '12,500');
});

test('formats canonical audience metrics compactly with Latin digits in every locale', () => {
  assert.equal(typeof formatters.formatCompactNumber, 'function');
  assert.equal(formatters.formatCompactNumber(2400, 'th'), '2.4K');
  assert.equal(formatters.formatCompactNumber(2400000, 'en'), '2.4M');
  assert.equal(formatters.formatCompactNumber(2400, 'my'), '2.4\u00a0ထောင်');
  assert.equal(formatters.formatCompactNumber(2400000, 'my'), '2.4\u00a0သန်း');
});
