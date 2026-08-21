import test from 'node:test';
import assert from 'node:assert/strict';
import { auditBuyerSource } from '../scripts/check-locales.mjs';

test('buyer source contains no unapproved Thai UI literals', async () => {
  const violations = await auditBuyerSource();
  assert.deepEqual(violations, []);
});
