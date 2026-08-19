// ── Token Revocation (Denylist) ──
// JWT เป็น stateless: ออกแล้วใช้ได้จนหมดอายุ ไม่มีทางยกเลิกกลางคัน
// จึงต้องมีบัญชีดำไว้ปฏิเสธ token ที่ถูกเพิกถอน เช่น ตอนผู้ใช้กดออกจากระบบทุกอุปกรณ์
// หรือตอนแอดมินสั่งแบนบัญชี
//
// เก็บใน Redis พร้อม TTL เท่ากับอายุที่เหลือของ token — พอ token หมดอายุเอง
// รายการก็หายไปเอง ไม่ต้องตามลบ

import { redis } from '../config/redis.js';

const TOKEN_PREFIX = 'revoked:jti:';
const USER_PREFIX = 'revoked:user:';

/** เพิกถอน token ใบเดียว (ใช้ตอน logout อุปกรณ์เดียว) */
export async function revokeToken(jti: string, expiresAtEpochSec: number): Promise<void> {
  const ttl = Math.max(1, expiresAtEpochSec - Math.floor(Date.now() / 1000));
  try {
    await redis.set(`${TOKEN_PREFIX}${jti}`, '1', 'EX', ttl);
  } catch {
    // Redis ล่ม: ไม่ทำให้ logout ล้มเหลว แต่ token ใบนั้นจะยังใช้ได้จนหมดอายุ
    console.warn('Token revocation: ไม่สามารถบันทึกลง Redis ได้');
  }
}

/**
 * เพิกถอน token ทุกใบของผู้ใช้ที่ออกก่อนเวลานี้
 * ใช้ตอน "ออกจากระบบทุกอุปกรณ์", เปลี่ยนรหัสผ่าน, หรือถูกแบน
 */
export async function revokeAllUserTokens(userId: string, maxTokenLifetimeSec = 7 * 24 * 60 * 60): Promise<void> {
  try {
    await redis.set(`${USER_PREFIX}${userId}`, String(Math.floor(Date.now() / 1000)), 'EX', maxTokenLifetimeSec);
  } catch {
    console.warn('Token revocation: ไม่สามารถบันทึก user cutoff ลง Redis ได้');
  }
}

/** ตรวจว่า token ใบนี้ถูกเพิกถอนไปแล้วหรือยัง */
export async function isTokenRevoked(jti: string | undefined, userId: string, issuedAtEpochSec?: number): Promise<boolean> {
  try {
    if (jti) {
      const hit = await redis.get(`${TOKEN_PREFIX}${jti}`);
      if (hit) return true;
    }

    const cutoff = await redis.get(`${USER_PREFIX}${userId}`);
    if (cutoff && issuedAtEpochSec && issuedAtEpochSec < Number(cutoff)) {
      return true;
    }

    return false;
  } catch {
    // Redis ล่ม: เลือกให้ระบบใช้งานต่อได้ (fail-open) เพราะถ้า fail-closed
    // ผู้ใช้ทุกคนจะถูกเตะออกจากระบบทันทีที่ cache ล่ม
    // ความเสี่ยงที่รับไว้: token ที่เพิ่งถูกเพิกถอนอาจใช้ได้ต่อจนกว่าจะหมดอายุ
    return false;
  }
}
