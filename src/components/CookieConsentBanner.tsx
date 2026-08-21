// src/components/CookieConsentBanner.tsx — PDPA Cookie Consent Notification

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Cookie } from 'lucide-react';
import { LocalizedLink } from '../i18n/LocalizedLink';
import './CookieConsentBanner.css';

export function CookieConsentBanner() {
  const { t } = useTranslation('common');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('movemall_cookie_consent');
    if (!consent) {
      // Show after 1 second
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAcceptAll() {
    localStorage.setItem('movemall_cookie_consent', 'accepted_all');
    setIsVisible(false);
  }

  function handleRejectNonEssential() {
    localStorage.setItem('movemall_cookie_consent', 'essential_only');
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <aside className="cookie-consent-bar" aria-label={t('cookie.ariaLabel')}>
      <div className="cookie-consent-inner">
        <div className="cookie-consent-text">
          <div className="cookie-consent-title">
            <Cookie size={16} style={{ color: '#F59E0B' }} />
            {t('cookie.title')}
          </div>
          <p className="cookie-consent-desc">
            {t('cookie.description')}{' '}
            <LocalizedLink to="/privacy" className="cookie-consent-link">{t('cookie.details')}</LocalizedLink>
          </p>
        </div>

        <div className="cookie-consent-actions">
          <button className="cookie-btn-reject" onClick={handleRejectNonEssential}>
            {t('cookie.essentialOnly')}
          </button>
          <button className="cookie-btn-accept" onClick={handleAcceptAll}>
            ✓ {t('cookie.acceptAll')}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default CookieConsentBanner;
