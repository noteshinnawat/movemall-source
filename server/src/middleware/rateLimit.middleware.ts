// ── Rate Limiting ──
// เดิมทั้งระบบไม่มีการจำกัดอัตราการเรียกเลย ทำให้เดารหัสผ่าน/OTP ได้ไม่จำกัดจำนวนครั้ง
//
// ใช้ Redis เป็นที่เก็บตัวนับเมื่อเชื่อมต่อได้ (นับรวมกันข้าม instance)
// ถ้า Redis ล่ม จะถอยไปใช้ตัวนับใน memory ของ instance นั้น ๆ แทน
// — ยังจำกัดได้อยู่ เพียงแต่ตัวเลขจะถูกนับแยกต่อ instance ดีกว่าปล่อยผ่านทั้งหมด

import rateLimit, { Options, ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import { AuthRequest } from './auth.middleware.js';

// สถานะการเชื่อมต่อ Redis — ใช้ตัดสินว่าจะนับด้วย Redis หรือ memory
let redisAvailable = false;
redis.on('ready', () => {
  if (!redisAvailable) console.log('⚡ Rate limiting: ใช้ Redis store (นับรวมข้าม instance)');
  redisAvailable = true;
});
redis.on('error', () => { redisAvailable = false; });
redis.on('end', () => { redisAvailable = false; });

// client ตั้ง lazyConnect ไว้ จึงต้องสั่งเชื่อมต่อเองเพื่อให้รู้สถานะตั้งแต่ตอนบูต
redis.connect().catch(() => {
  console.warn('⚠️  Rate limiting: เชื่อมต่อ Redis ไม่ได้ — ใช้ memory store แทน (นับแยกต่อ instance)');
});

function createRedisStore(prefix: string) {
  return new RedisStore({
    // ioredis ใช้ .call() สำหรับส่งคำสั่งดิบ
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as Promise<never>,
    prefix: `rl:${prefix}:`,
  });
}

/**
 * ระบุตัวผู้เรียก: ใช้ userId ถ้าล็อกอินแล้ว มิฉะนั้นใช้ IP
 * ต้องผ่าน ipKeyGenerator เสมอ เพราะผู้ใช้ IPv6 หนึ่งรายมักได้ทั้งบล็อก /64
 * ถ้านับแยกทีละ address จะเลี่ยง rate limit ได้ด้วยการเปลี่ยน address ไปเรื่อย ๆ
 */
function ipKey(req: Request): string {
  return ipKeyGenerator(req.ip ?? '');
}

function keyByUserOrIp(req: Request): string {
  const userId = (req as AuthRequest).user?.userId;
  return userId ? `u:${userId}` : `ip:${ipKey(req)}`;
}

/**
 * สร้าง limiter 2 ชุด (Redis และ memory) แล้วเลือกใช้ตามสถานะการเชื่อมต่อจริงตอนนั้น
 *
 * เหตุผล: ถ้าผูกกับ RedisStore ตรง ๆ แล้ว Redis ล่ม express-rate-limit จะโยน error
 * ออกมาทุกคำขอ ทำให้ API ทั้งระบบตอบ 500 — ทดสอบแล้วเกิดขึ้นจริง
 * การจำกัดอัตราไม่ควรเป็นจุดที่ทำให้ทั้งระบบล่มเมื่อ cache มีปัญหา
 */
function buildLimiter(prefix: string, options: Partial<Options>) {
  const base: Partial<Options> = {
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: keyByUserOrIp,
    handler: (_req, res) => {
      res.status(429).json({
        error: 'มีคำขอเข้ามาถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
      });
    },
    ...options,
  };

  const memoryLimiter = rateLimit({ ...base });
  const redisLimiter = rateLimit({ ...base, store: createRedisStore(prefix) });

  return function limiter(req: Request, res: Response, next: NextFunction) {
    const active = redisAvailable ? redisLimiter : memoryLimiter;
    // กันไว้อีกชั้น: ถ้า store โยน error ก็ให้คำขอผ่านไปแทนที่จะตอบ 500
    active(req, res, (err?: unknown) => {
      if (err) {
        console.warn(`Rate limiter (${prefix}) error — ปล่อยคำขอผ่าน:`, (err as Error).message);
        redisAvailable = false;
      }
      next();
    });
  };
}

/** ชั้นกว้างสำหรับทุก endpoint — กันการยิงถล่มทั่วไป */
export const globalLimiter = buildLimiter('global', {
  windowMs: 60 * 1000,
  limit: 300, // 300 คำขอ/นาที ต่อผู้ใช้หรือ IP
});

/**
 * ชั้นเข้มสำหรับเส้นทางยืนยันตัวตน
 * นับแยกตาม IP + บัญชีที่พยายามเข้าถึง เพื่อไม่ให้ผู้โจมตีคนเดียว
 * ล็อกบัญชีคนอื่นได้ด้วยการยิงรหัสผิดซ้ำ ๆ (account lockout DoS)
 */
export const authLimiter = buildLimiter('auth', {
  windowMs: 15 * 60 * 1000,
  limit: 10, // 10 ครั้ง/15 นาที
  skipSuccessfulRequests: true, // นับเฉพาะครั้งที่ล้มเหลว
  keyGenerator: (req: Request) => {
    const target = (req.body?.email || req.body?.phone || req.body?.target || '').toString().toLowerCase();
    return `${ipKey(req)}|${target}`;
  },
});

/** ชั้นเข้มมากสำหรับการขอ OTP — ทุกครั้งมีค่าใช้จ่ายจริง (ค่าส่ง SMS) */
export const otpLimiter = buildLimiter('otp', {
  windowMs: 60 * 60 * 1000,
  limit: 5, // 5 ครั้ง/ชั่วโมง ต่อเบอร์/อีเมล
  keyGenerator: (req: Request) => {
    const target = (req.body?.target || req.body?.phone || req.body?.email || '').toString().toLowerCase();
    return `${ipKey(req)}|${target}`;
  },
});

/** ชั้นสำหรับเส้นทางที่เกี่ยวกับเงิน */
export const paymentLimiter = buildLimiter('payment', {
  windowMs: 60 * 1000,
  limit: 20,
});

/** ชั้นสำหรับ webhook ของผู้ให้บริการ — นับตาม IP อย่างเดียว และตั้งเพดานสูงกว่า */
export const webhookLimiter = buildLimiter('webhook', {
  windowMs: 60 * 1000,
  limit: 120,
  keyGenerator: (req: Request) => `ip:${ipKey(req)}`,
});

export function isRedisRateLimitActive(): boolean {
  return redisAvailable;
}
