// ── Cloudflare Turnstile Verification ──
//
// ทำไมต้องตรวจฝั่งเซิร์ฟเวอร์:
// การแสดง widget ในหน้าเว็บอย่างเดียวกันบอทไม่ได้เลย เพราะบอทข้ามหน้าเว็บแล้วยิง
// REST API ตรง ๆ ได้ การตรวจ token กับ siteverify ที่ฝั่งนี้คือด่านจริงด่านเดียว
//
// ความสัมพันธ์กับ rate limiting: rate limit กันการยิงถี่จาก IP เดียว
// ส่วน Turnstile กันบอทที่กระจาย IP ซึ่ง rate limit จับไม่ได้ — ทำงานเสริมกัน

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';
import { TURNSTILE_SECRET_KEY, IS_PRODUCTION } from '../config/env.js';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface SiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
}

let warnedMissingSecret = false;

/**
 * ตรวจ Turnstile token ที่ client แนบมากับคำขอ
 *
 * ถ้ายังไม่ได้ตั้ง TURNSTILE_SECRET_KEY จะข้ามการตรวจไปเลย เพื่อให้ development
 * และระบบที่ยังไม่ได้ตั้งค่าใช้งานได้ตามปกติ — แต่เตือนดัง ๆ บน production
 * เพราะนั่นแปลว่าด่านกันบอทไม่ทำงานอยู่
 */
export async function verifyTurnstile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!TURNSTILE_SECRET_KEY) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      const msg = 'ยังไม่ได้ตั้ง TURNSTILE_SECRET_KEY — ข้ามการตรวจ Turnstile ทุกคำขอ';
      if (IS_PRODUCTION) console.warn(`⚠️  ${msg} (ด่านกันบอทไม่ทำงาน)`);
      else console.log(`ℹ️  ${msg} (dev)`);
    }
    next();
    return;
  }

  const token =
    (req.body?.turnstileToken as string | undefined) ||
    (req.headers['cf-turnstile-response'] as string | undefined);

  if (!token || typeof token !== 'string') {
    res.status(403).json({
      error: 'กรุณายืนยันว่าคุณไม่ใช่บอทก่อนดำเนินการต่อ',
      code: 'TURNSTILE_TOKEN_MISSING',
    });
    return;
  }

  try {
    const form = new URLSearchParams();
    form.append('secret', TURNSTILE_SECRET_KEY);
    form.append('response', token);
    // remoteip ช่วยให้ Cloudflare ประเมินได้แม่นขึ้น (ต้องตั้ง trust proxy ให้ถูกก่อน)
    if (req.ip) form.append('remoteip', req.ip);

    const cfRes = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    const result = (await cfRes.json()) as SiteverifyResponse;

    if (!result.success) {
      const codes = result['error-codes'] ?? [];
      console.warn(`Turnstile ปฏิเสธคำขอ: ${codes.join(', ') || 'ไม่ระบุสาเหตุ'}`);

      // token ใช้ได้ครั้งเดียว — ถ้าหมดอายุหรือถูกใช้ไปแล้ว ให้ผู้ใช้ลองใหม่ได้
      const retryable = codes.some(c => c === 'timeout-or-duplicate' || c === 'invalid-input-response');
      res.status(403).json({
        error: retryable
          ? 'การยืนยันหมดอายุ กรุณาลองใหม่อีกครั้ง'
          : 'การยืนยันตัวตนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
        code: 'TURNSTILE_VERIFICATION_FAILED',
      });
      return;
    }

    next();
  } catch (error) {
    // เชื่อมต่อ Cloudflare ไม่ได้ — เลือก fail-closed เพราะ endpoint ที่ป้องกันอยู่
    // มีค่าใช้จ่ายจริง (SMS) หรือสร้างบัญชีได้ ปล่อยผ่านตอนตรวจไม่ได้เสี่ยงกว่า
    console.error('Turnstile siteverify Error:', error);
    res.status(503).json({
      error: 'ระบบยืนยันตัวตนขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง',
      code: 'TURNSTILE_UNAVAILABLE',
    });
  }
}
