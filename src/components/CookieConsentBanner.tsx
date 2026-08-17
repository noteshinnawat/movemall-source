// src/components/CookieConsentBanner.tsx — PDPA Cookie Consent Notification

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cookie } from 'lucide-react';
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
            นโยบายการใช้คุกกี้และการคุ้มครองข้อมูลส่วนบุคคล (PDPA)
          </div>
          <p className="cookie-consent-desc">
            Movemall ใช้คุกกี้ที่จำเป็นสำหรับการทำงานของเว็บไซต์ ตะกร้าสินค้า และคุกกี้เพื่อวิเคราะห์ปรับปรุงประสบการณ์การช้อปปิ้งของคุณให้ดียิ่งขึ้นตามมาตรฐาน พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
            <Link to="/privacy" className="cookie-consent-link">อ่านนโยบายความเป็นส่วนตัว</Link>
          </p>
        </div>

        <div className="cookie-consent-actions">
          <button className="cookie-btn-reject" onClick={handleRejectNonEssential}>
            ปฏิเสธคุกกี้ที่ไม่จำเป็น
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
