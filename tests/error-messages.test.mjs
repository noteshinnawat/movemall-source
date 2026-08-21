import test from 'node:test';
import assert from 'node:assert/strict';

import { errorTranslationKey } from '../src/i18n/errorMessages.ts';

test('maps known codes and hides unknown server copy', () => {
  assert.equal(errorTranslationKey('AUTH_INVALID_CREDENTIALS'), 'errors.authInvalidCredentials');
  assert.equal(errorTranslationKey('ORDER_OUT_OF_STOCK'), 'errors.orderOutOfStock');
  assert.equal(errorTranslationKey('anything-else'), 'errors.generic');
  assert.equal(errorTranslationKey(null), 'errors.generic');
});

test('maps every code in the minimum required set', () => {
  const codes = [
    'AUTH_INVALID_CREDENTIALS',
    'AUTH_REQUIRED',
    'OTP_INVALID',
    'OTP_EXPIRED',
    'PRODUCT_NOT_FOUND',
    'ORDER_OUT_OF_STOCK',
    'ORDER_FAILED',
    'PAYMENT_FAILED',
    'NETWORK_ERROR',
    'RATE_LIMITED',
  ];
  for (const code of codes) {
    const key = errorTranslationKey(code);
    assert.notEqual(key, 'errors.generic', `${code} should not fall back to generic`);
    assert.match(key, /^errors\./);
  }
});

test('unknown, missing or malformed input never throws and always falls back', () => {
  assert.equal(errorTranslationKey(undefined), 'errors.generic');
  assert.equal(errorTranslationKey(''), 'errors.generic');
  assert.equal(errorTranslationKey(123), 'errors.generic');
  assert.equal(errorTranslationKey({}), 'errors.generic');
});
