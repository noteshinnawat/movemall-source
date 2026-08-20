// src/components/PWAInstallPrompt.tsx — Add to Home Screen / Install App Banner

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download } from 'lucide-react';
import './PWAInstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const { t } = useTranslation('common');
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
      alert(t('pwa.manualInstructions'));
    }
  }

  function handleDismiss() {
    setShowPrompt(false);
    localStorage.setItem('movemall_pwa_dismissed', 'true');
  }

  if (!showPrompt) return null;

  return (
    <aside className="pwa-prompt" role="alert" aria-label={t('pwa.ariaLabel')}>
      <div className="pwa-prompt__info">
        <span className="pwa-prompt__icon">🛍️</span>
        <div className="pwa-prompt__text">
          <div className="pwa-prompt__title">{t('pwa.title')}</div>
          <div className="pwa-prompt__desc">{t('pwa.description')}</div>
        </div>
      </div>

      <div className="pwa-prompt__actions">
        <button className="pwa-prompt__install-btn" onClick={handleInstall}>
          <Download size={12} style={{ display: 'inline', marginRight: 4 }} />
          {t('pwa.install')}
        </button>
        <button
          className="pwa-prompt__close-btn"
          onClick={handleDismiss}
          aria-label={t('pwa.close')}
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}

export default PWAInstallPrompt;
