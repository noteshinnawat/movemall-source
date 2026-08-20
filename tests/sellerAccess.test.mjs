import test from 'node:test';
import assert from 'node:assert/strict';

async function loadSellerAccessPolicy() {
  try {
    return await import('../src/utils/sellerAccess.ts');
  } catch {
    return {};
  }
}

test('blocks protected Seller Centre data loading without a signed-in seller session', async () => {
  const { canAccessSellerHub } = await loadSellerAccessPolicy();

  assert.equal(typeof canAccessSellerHub, 'function');
  assert.equal(canAccessSellerHub(null, null), false);
  assert.equal(canAccessSellerHub({ role: 'SELLER' }, null), false);
  assert.equal(canAccessSellerHub({ role: 'BUYER' }, 'valid-token'), false);
});

test('allows protected Seller Centre data loading for authorized seller roles', async () => {
  const { canAccessSellerHub } = await loadSellerAccessPolicy();

  assert.equal(typeof canAccessSellerHub, 'function');
  assert.equal(canAccessSellerHub({ role: 'SELLER' }, 'valid-token'), true);
  assert.equal(canAccessSellerHub({ role: 'CREATOR' }, 'valid-token'), true);
  assert.equal(canAccessSellerHub({ role: 'ADMIN' }, 'valid-token'), true);
  assert.equal(canAccessSellerHub({ role: 'SUPER_ADMIN' }, 'valid-token'), true);
});
