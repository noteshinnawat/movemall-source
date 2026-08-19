// ── Centralized Environment Configuration & Fail-Fast Validation ──
// โหลดค่าจาก .env แล้วตรวจสอบ secret ที่จำเป็นตั้งแต่ตอนบูต
// หลักการ: ห้ามมีค่า fallback ของ secret ในโค้ดเด็ดขาด — ขาดค่าไหนให้เซิร์ฟเวอร์ดับทันที
// ดีกว่ารันต่อด้วยกุญแจที่ใครก็เดาได้จาก source code

import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

function fail(message: string): never {
  console.error(`\n🛑 Movemall Server Startup Aborted\n   ${message}\n`);
  process.exit(1);
}

// ── 1. JWT Secret (ต้องมีเสมอ ทุก environment) ──
function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    fail(
      'ไม่พบ JWT_SECRET ใน environment variables\n' +
      '   กรุณาตั้งค่าใน server/.env (ดูตัวอย่างที่ .env.example)\n' +
      '   สร้างค่าสุ่มได้ด้วย: openssl rand -base64 48'
    );
  }

  if (secret.length < 32) {
    fail(`JWT_SECRET สั้นเกินไป (${secret.length} ตัวอักษร) ต้องมีอย่างน้อย 32 ตัวอักษร`);
  }

  // กันการนำค่าตัวอย่างที่เคยหลุดอยู่ใน source code / .env.example ไปใช้จริง
  const knownLeakedSecrets = [
    'movemall_super_secure_jwt_secret_key_2026_at_least_32_chars!',
    'movemall_webhook_secret_2026',
  ];
  if (knownLeakedSecrets.includes(secret)) {
    fail(
      'JWT_SECRET ที่ตั้งไว้เป็นค่าตัวอย่างที่เคยถูก commit ขึ้น git (ถือว่าหลุดแล้ว)\n' +
      '   กรุณาสร้างค่าใหม่ด้วย: openssl rand -base64 48'
    );
  }

  return secret;
}

export const JWT_SECRET = requireJwtSecret();

// ── 2. Access Token Lifetime ──
// ใช้ type ของ jsonwebtoken โดยตรงเพื่อให้ค่าจาก env ผ่านการตรวจสอบชนิดตอน sign
export const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

// ── 3. Google OAuth Client ID (ใช้ตรวจ aud ของ ID token) ──
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim() || '';

// ── 4. Payment Webhook Secret ──
// ไม่บังคับต้องมี เพราะระบบที่ยังไม่ได้ต่อ payment gateway ก็ควรรันได้
//
// ไม่ตั้ง = /api/payment/webhook ปฏิเสธทุกคำขอด้วย 503 (fail-closed อยู่ในตัว)
// จึงไม่มีเหตุผลที่จะทำให้ทั้งเซิร์ฟเวอร์ดับตั้งแต่บูต
// แต่เตือนดัง ๆ บน production เพราะถ้าต่อ gateway จริงแล้วลืมตั้ง
// การชำระเงินจะไม่ถูกยืนยันเลยสักรายการ
export const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET?.trim() || '';

if (isProduction && !PAYMENT_WEBHOOK_SECRET) {
  console.warn(
    '\n⚠️  ไม่ได้ตั้ง PAYMENT_WEBHOOK_SECRET บน production\n' +
    '   → /api/payment/webhook จะปฏิเสธทุกคำขอด้วย 503\n' +
    '   → ใช้ได้กับระบบทดสอบที่ยังไม่ต่อ payment gateway\n' +
    '   → ถ้าต่อ gateway จริงแล้ว ต้องตั้งค่านี้ให้ตรงกับ dashboard ของผู้ให้บริการ\n'
  );
}

// ── 5. Super Admin Whitelist (ย้ายออกจาก source code มาเป็น env) ──
// ใช้เพื่อ "ตรวจสอบ" เท่านั้น ไม่ได้ใช้เลื่อนขั้นอัตโนมัติอีกต่อไป
// การตั้งแอดมินคนแรกให้ทำผ่าน seed script: npm run seed:admin
export const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export const IS_PRODUCTION = isProduction;
export const IS_TEST = isTest;

// ── 6. ยืนยันว่าโหลดสำเร็จ (ไม่พิมพ์ค่า secret ออก log) ──
if (!isTest) {
  console.log(
    `🔐 Environment loaded (NODE_ENV=${process.env.NODE_ENV || 'development'}, ` +
    `JWT ✓, webhook secret ${PAYMENT_WEBHOOK_SECRET ? '✓' : '✗'}, ` +
    `google client id ${GOOGLE_CLIENT_ID ? '✓' : '✗'})`
  );
}
