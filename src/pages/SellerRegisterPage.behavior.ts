const MAX_STORE_LOGO_BYTES = 3 * 1024 * 1024;
const SUPPORTED_STORE_LOGO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type StoreLogoFile = Pick<File, 'type' | 'size'>;

export function validateStoreLogoFile(file: StoreLogoFile): { valid: true } | { valid: false; error: string } {
  if (!SUPPORTED_STORE_LOGO_TYPES.has(file.type)) {
    return { valid: false, error: 'รองรับเฉพาะไฟล์ JPG, PNG และ WEBP' };
  }

  if (file.size > MAX_STORE_LOGO_BYTES) {
    return { valid: false, error: 'ขนาดไฟล์โลโก้ต้องไม่เกิน 3 MB' };
  }

  return { valid: true };
}
