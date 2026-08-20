// src/components/CookieConsentBanner.tsx — PDPA Cookie Consent Notification

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import './CookieConsentBanner.css';

export function CookieConsentBanner() {
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
    <aside className="cookie-consent-bar" aria-label="การแจ้งเตือนคุกกี้และความเป็นส่วนตัว (PDPA)">
      <div className="cookie-consent-inner">
        <div className="cookie-consent-text">
          <div className="cookie-consent-title">
            <Cookie size={16} style={{ color: '#F59E0B' }} />
            การใช้คุกกี้
          </div>
          <p className="cookie-consent-desc">
            เราใช้คุกกี้เพื่อให้เว็บไซต์ทำงานและปรับปรุงการใช้งาน
            <Link to="/privacy" className="cookie-consent-link">ดูรายละเอียด</Link>
          </p>
        </div>

        <div className="cookie-consent-actions">
          <button className="cookie-btn-reject" onClick={handleRejectNonEssential}>
            เฉพาะที่จำเป็น
          </button>
          <button className="cookie-btn-accept" onClick={handleAcceptAll}>
            ✓ ยอมรับทั้งหมด
          </button>
        </div>
      </div>
    </aside>
  );
}

export default CookieConsentBanner;
