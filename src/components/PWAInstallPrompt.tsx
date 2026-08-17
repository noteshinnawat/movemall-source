// src/components/PWAInstallPrompt.tsx — Add to Home Screen / Install App Banner

import { useState, useEffect } from 'react';
import { X, Smartphone, Download } from 'lucide-react';
import './PWAInstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: Show on mobile browsers if not already installed
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isMobile && !isStandalone) {
      const dismissed = localStorage.getItem('movemall_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowPrompt(false);
      }
    } else {
      alert('เพื่อติดตั้งแอป Movemall:\n- บน iOS (Safari): กดปุ่มแชร์ (Share) แล้วเลือก "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)\n- บน Android (Chrome): กดเมนู 3 จุด แล้วเลือก "ติดตั้งแอป" (Install App)');
    }
  }

  function handleDismiss() {
    setShowPrompt(false);
    localStorage.setItem('movemall_pwa_dismissed', 'true');
  }

  if (!showPrompt) return null;

  return (
    <aside className="pwa-prompt" role="alert" aria-label="ติดตั้งแอป Movemall">
      <div className="pwa-prompt__info">
        <span className="pwa-prompt__icon">🛍️</span>
        <div className="pwa-prompt__text">
          <div className="pwa-prompt__title">ติดตั้งแอป Movemall ลงมือถือ</div>
          <div className="pwa-prompt__desc">เปิดเต็มจอ โหลดไว ช้อปสะดวกกว่า พร้อมรับแจ้งเตือนดีลเด็ด</div>
        </div>
      </div>

      <div className="pwa-prompt__actions">
        <button className="pwa-prompt__install-btn" onClick={handleInstall}>
          <Download size={12} style={{ display: 'inline', marginRight: 4 }} />
          ติดตั้งแอป
        </button>
        <button
          className="pwa-prompt__close-btn"
          onClick={handleDismiss}
          aria-label="ปิดการแจ้งเตือน"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}

export default PWAInstallPrompt;
