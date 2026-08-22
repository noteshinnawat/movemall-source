// src/utils/turnstile.ts
// ── Cloudflare Turnstile token provider ──
//
// Movemall สมัครสมาชิก/เข้าสู่ระบบผ่าน REST API ไม่ใช่ฟอร์ม HTML ธรรมดา
// จึงใช้รูปแบบ execute mode: สร้าง widget ที่ซ่อนไว้หนึ่งตัว แล้วขอ token
// ตอนกดปุ่มจริง ๆ — Cloudflare จะแสดง challenge ให้เห็นเฉพาะเมื่อสงสัยว่าเป็นบอท
//
// ⚠️ ฝั่งนี้เป็นแค่การเก็บ token ด่านจริงคือ verifyTurnstile ที่ Express
// (server/src/middleware/turnstile.middleware.ts) เพราะบอทข้ามหน้าเว็บแล้วยิง API ตรงได้

// sitekey เป็นค่าสาธารณะโดยการออกแบบ (ฝังในหน้าเว็บให้ใครก็เห็นได้) และถูกล็อกไว้กับ
// โดเมนที่ลงทะเบียนไว้เท่านั้น จึงใส่เป็นค่า default ในโค้ดได้อย่างปลอดภัย
// ข้อดี: ไม่ต้องพึ่ง build env var ที่ถ้าลืมตั้งแล้วด่านกันบอทจะเงียบไปโดยไม่มีสัญญาณ
// ตั้ง VITE_TURNSTILE_SITE_KEY เพื่อ override ได้ (เช่น ใช้ widget คนละตัวต่อ environment)
import i18n from '../i18n/config';
import { resolveRootLocale } from '../i18n/locales';
import type { Locale } from '../i18n/locales';

const DEFAULT_SITE_KEY = '0x4AAAAAAEV4IWYDw8lkwvt0';
const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() || DEFAULT_SITE_KEY;
const SCRIPT_ID = 'cf-turnstile-script';
const CONTAINER_ID = 'cf-turnstile-invisible-host';
// หน้าที่อยากกำหนดตำแหน่ง widget เอง (เช่น ใต้ปุ่มเข้าสู่ระบบ) ใส่ element ที่มี id นี้ไว้
// — widget singleton จะถูกย้ายเข้าไปแทนที่จะลอยแบบ fixed
const ANCHOR_ID = 'cf-turnstile-anchor';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      execute: (widgetId: string, options?: Record<string, unknown>) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

/** เปิดใช้งาน Turnstile หรือยัง — ถ้ายังไม่ตั้ง sitekey ระบบทำงานได้ตามปกติโดยไม่มีด่านนี้ */
export function isTurnstileEnabled(): boolean {
  return SITE_KEY.length > 0;
}

// Turnstile renders its challenge in the language it is given. Thai and English
// are supported directly; Burmese is not, so `auto` lets Cloudflare pick from
// the browser rather than pinning the challenge to Thai.
const TURNSTILE_LANGUAGES: Record<Locale, string> = { th: 'th', en: 'en', my: 'auto' };

export function turnstileLanguage(locale: Locale): string {
  return TURNSTILE_LANGUAGES[locale];
}

let widgetLanguage: string | null = null;
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // สคริปต์อาจโหลดเสร็จก่อนที่ listener จะถูกผูก จึง poll ควบคู่ไปด้วย
    let waited = 0;
    const poll = setInterval(() => {
      if (window.turnstile) {
        clearInterval(poll);
        resolve();
      } else if ((waited += 100) > 10000) {
        clearInterval(poll);
        scriptPromise = null;
        reject(new Error('โหลดสคริปต์ Turnstile ไม่สำเร็จ'));
      }
    }, 100);

    script.addEventListener('error', () => {
      clearInterval(poll);
      scriptPromise = null;
      reject(new Error('โหลดสคริปต์ Turnstile ไม่สำเร็จ'));
    });
  });

  return scriptPromise;
}

function getContainer(): HTMLElement {
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = CONTAINER_ID;
  }

  const anchor = document.getElementById(ANCHOR_ID);
  if (anchor) {
    // หน้านี้กำหนดตำแหน่งไว้เอง (เช่น ใต้ปุ่มเข้าสู่ระบบ) — ฝังในจุดนั้นตามลำดับเอกสารปกติ
    el.style.position = '';
    el.style.bottom = '';
    el.style.left = '';
    el.style.right = '';
    el.style.zIndex = '';
    if (el.parentElement !== anchor) anchor.appendChild(el);
  } else {
    // ไม่ใช้ display:none เพราะ Turnstile ต้องวาด challenge ได้เมื่อจำเป็น
    // ไม่มี anchor บนหน้านี้ — ลอยไว้มุมซ้ายล่างเหนือ Mobile Bottom Nav (56px + safe-area)
    // เพื่อไม่ให้ชนกับ FloatingLiveWidget ที่ปักไว้มุมขวาล่าง (bottom:80px / right:20px)
    el.style.position = 'fixed';
    el.style.bottom = 'calc(56px + env(safe-area-inset-bottom, 0px) + 12px)';
    el.style.left = '16px';
    el.style.right = '';
    el.style.zIndex = '2147483647';
    if (el.parentElement !== document.body) document.body.appendChild(el);
  }

  return el;
}

let widgetId: string | null = null;

// callback ของ widget ถูกผูกไว้ตั้งแต่ render ครั้งแรก และใช้ตัวเดิมตลอด
// จึงต้องส่งผลลัพธ์ผ่านตัวแปรกลาง ไม่ใช่ closure ของการเรียกครั้งใดครั้งหนึ่ง
// (ถ้าใช้ closure ตรง ๆ การขอ token ครั้งที่สองจะค้างเพราะไปปลุก promise ใบแรก)
let pendingResolve: ((token?: string) => void) | null = null;

function deliver(token?: string) {
  const resolve = pendingResolve;
  pendingResolve = null;
  resolve?.(token);
}

/**
 * ขอ Turnstile token หนึ่งใบ (ใช้ได้ครั้งเดียว หมดอายุใน ~5 นาที)
 *
 * คืน undefined เมื่อยังไม่ได้เปิดใช้งาน Turnstile เพื่อให้โฟลว์เดิมทำงานต่อได้
 * — ฝั่งเซิร์ฟเวอร์ก็ข้ามการตรวจเช่นกันเมื่อไม่ได้ตั้ง secret
 */
export async function getTurnstileToken(): Promise<string | undefined> {
  if (!isTurnstileEnabled()) return undefined;

  await loadScript();
  const turnstile = window.turnstile;
  if (!turnstile) return undefined;

  // ขอทีละใบ: ถ้ามีคำขอค้างอยู่ ให้ใบเก่าจบไปก่อนด้วยค่า undefined
  if (pendingResolve) deliver(undefined);

  return new Promise<string | undefined>((resolve) => {
    // ไม่ให้ผู้ใช้ค้างถ้า Cloudflare ไม่ตอบ — ปล่อยให้ยิงคำขอไปโดยไม่มี token
    // แล้วให้เซิร์ฟเวอร์เป็นผู้ตัดสินใจปฏิเสธ
    const timer = setTimeout(() => deliver(undefined), 20000);

    pendingResolve = (token?: string) => {
      clearTimeout(timer);
      resolve(token);
    };

    try {
      const language = turnstileLanguage(resolveRootLocale(i18n.resolvedLanguage ?? i18n.language));
      // Rebuild the widget when the buyer switched language, so the challenge is
      // not stuck in the language of their first attempt.
      if (widgetId !== null && language !== widgetLanguage) {
        try { turnstile.remove(widgetId); } catch { /* already gone */ }
        widgetId = null;
      }

      if (widgetId === null) {
        widgetLanguage = language;
        widgetId = turnstile.render(getContainer(), {
          sitekey: SITE_KEY,
          action: 'turnstile-spin-v1',
          execution: 'execute',
          appearance: 'interaction-only',
          language,
          callback: (token: string) => deliver(token),
          'error-callback': () => deliver(undefined),
          'expired-callback': () => deliver(undefined),
        });
      } else {
        turnstile.reset(widgetId);
      }

      turnstile.execute(widgetId!);
    } catch {
      deliver(undefined);
    }
  });
}
