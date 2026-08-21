// ── Email OTP Store ──
// เดิม endpoint ยืนยันอีเมลรับพารามิเตอร์ `otp` มาแต่ไม่เคยนำไปเทียบกับอะไรเลย
// ทำให้ยืนยันอีเมลใดก็ได้สำเร็จเสมอ (และรับเหรียญโบนัสซ้ำได้ไม่จำกัด)
//
// หมายเหตุ: เก็บใน memory เหมือน sms.service — เพียงพอสำหรับเซิร์ฟเวอร์เดี่ยว
// ถ้าขยายเป็นหลาย instance ต้องย้ายไปเก็บใน Redis (มี client อยู่แล้วที่ config/redis.ts)

import crypto from 'crypto';

interface StoredEmailOtp {
  code: string;
  expiresAt: number;
  attempts: number;
}

const store = new Map<string, StoredEmailOtp>();

const TTL_MS = 10 * 60 * 1000; // 10 นาที
const MAX_ATTEMPTS = 5;

function key(userId: string, email: string): string {
  return `${userId}:${email.trim().toLowerCase()}`;
}

// ล้างรายการหมดอายุเป็นระยะ กันหน่วยความจำบวม
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.expiresAt < now) store.delete(k);
  }
}, 5 * 60 * 1000).unref();

export function issueEmailOtp(userId: string, email: string): { code: string; expiresAt: number } {
  // ใช้ตัวสุ่มเชิงเข้ารหัส ไม่ใช่ Math.random ที่คาดเดาได้
  const code = String(crypto.randomInt(100000, 1000000));
  const expiresAt = Date.now() + TTL_MS;
  store.set(key(userId, email), { code, expiresAt, attempts: 0 });
  return { code, expiresAt };
}

export function verifyEmailOtp(
  userId: string,
  email: string,
  entered: string
): { success: boolean; message: string; code?: 'OTP_INVALID' | 'OTP_EXPIRED' } {
  const k = key(userId, email);
  const rec = store.get(k);

  if (!rec) {
    return { success: false, message: 'ยังไม่ได้ขอรหัส OTP หรือรหัสหมดอายุแล้ว', code: 'OTP_EXPIRED' };
  }

  if (rec.expiresAt < Date.now()) {
    store.delete(k);
    return { success: false, message: 'รหัส OTP หมดอายุ กรุณาขอรหัสใหม่', code: 'OTP_EXPIRED' };
  }

  rec.attempts += 1;
  if (rec.attempts > MAX_ATTEMPTS) {
    store.delete(k);
    return { success: false, message: 'ใส่รหัสผิดเกินจำนวนที่กำหนด กรุณาขอรหัสใหม่', code: 'OTP_INVALID' };
  }

  const entry = Buffer.from(entered.trim(), 'utf8');
  const expected = Buffer.from(rec.code, 'utf8');
  const matches = entry.length === expected.length && crypto.timingSafeEqual(entry, expected);

  if (!matches) {
    return { success: false, message: 'รหัส OTP ไม่ถูกต้อง', code: 'OTP_INVALID' };
  }

  store.delete(k); // ใช้ได้ครั้งเดียว
  return { success: true, message: 'ยืนยันอีเมลสำเร็จ' };
}
