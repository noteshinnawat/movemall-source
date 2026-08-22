import test from 'node:test';
import assert from 'node:assert/strict';

async function loadSellerLogoUpload() {
  try {
    return await import('../src/pages/SellerRegisterPage.behavior.ts');
  } catch {
    return {};
  }
}

test('accepts a PNG logo up to 3 MB', async () => {
  const { validateStoreLogoFile } = await loadSellerLogoUpload();

  assert.equal(typeof validateStoreLogoFile, 'function');
  assert.deepEqual(
    validateStoreLogoFile({ type: 'image/png', size: 3 * 1024 * 1024 }),
    { valid: true },
  );
});

test('rejects unsupported formats and oversized logo files', async () => {
  const { validateStoreLogoFile } = await loadSellerLogoUpload();

  assert.deepEqual(
    validateStoreLogoFile({ type: 'image/gif', size: 100 }),
    { valid: false, error: 'รองรับเฉพาะไฟล์ JPG, PNG และ WEBP' },
  );
  assert.deepEqual(
    validateStoreLogoFile({ type: 'image/webp', size: 3 * 1024 * 1024 + 1 }),
    { valid: false, error: 'ขนาดไฟล์โลโก้ต้องไม่เกิน 3 MB' },
  );
});
