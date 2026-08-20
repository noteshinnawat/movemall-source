// src/components/TurnstileWidget.tsx
// Cloudflare Turnstile CAPTCHA — Invisible / Managed mode widget
// Docs: https://developers.cloudflare.com/turnstile/

import { useEffect, useRef } from 'react';

// ประเภทของ window.turnstile ประกาศไว้ที่ src/utils/turnstile.ts ที่เดียว
// เพื่อไม่ให้ชนกัน (TS2717) เมื่อมีสองไฟล์ประกาศ global เดียวกัน

interface TurnstileWidgetProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  /** 'managed' (default — Cloudflare decides), 'always', 'never' (invisible) */
  appearance?: 'managed' | 'always' | 'never';
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

const SCRIPT_ID = 'cf-turnstile-script';

export function TurnstileWidget({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  appearance = 'managed',
  theme = 'light',
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onSuccess, onError, onExpire });

  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, onExpire };
  }, [onSuccess, onError, onExpire]);

  useEffect(() => {
    // Inject Cloudflare Turnstile script once
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    function tryRender() {
      if (window.turnstile && containerRef.current) {
        // Clean up any previous widget in this container
        if (widgetIdRef.current) {
          try { window.turnstile.remove(widgetIdRef.current); } catch {}
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: 'turnstile-spin-v1',
          appearance,
          theme,
          callback: (token: string) => callbacksRef.current.onSuccess(token),
          'error-callback': () => {
            callbacksRef.current.onError?.();
          },
          'expired-callback': () => {
            callbacksRef.current.onExpire?.();
          },
        });
      } else if (attempts < MAX_ATTEMPTS) {
        attempts++;
        setTimeout(tryRender, 100);
      }
    }

    tryRender();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, appearance, theme]);

  return <div ref={containerRef} className={className} />;
}
