// src/components/FloatingLiveWidget.tsx — Picture-in-Picture Floating Live Stream

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useLocalizedPath } from '../i18n/LocalizedLink';
import { stripLocale } from '../i18n/locales';
import './FloatingLiveWidget.css';

export function FloatingLiveWidget() {
  const { t } = useTranslation(['engagement']);
  const location = useLocation();
  const navigate = useNavigate();
  const localizePath = useLocalizedPath();
  const [isOpen, setIsOpen] = useState(true);

  // Do not show widget on /live, /video, /creator, /checkout, /cart, or /order pages
  const hiddenRoutes = ['/live', '/video', '/creator', '/checkout', '/cart', '/order'];
  const routePathname = stripLocale(location.pathname);
  const isHiddenRoute = hiddenRoutes.some(route => routePathname.startsWith(route));

  if (isHiddenRoute || !isOpen) {
    return null;
  }

  return (
    <div
      className="floating-live-widget"
      onClick={() => navigate(localizePath('/live'))}
      title={t('engagement:live.floatingWidget.clickToWatch')}
    >
      <div className="floating-live-video-box">
        <video
          src="/videos/live-streamer-1.mp4"
          poster="https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=300&q=80"
          autoPlay
          loop
          muted
          playsInline
          className="floating-live-bg"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="floating-live-badge">
          <span className="floating-live-badge-dot" />
          LIVE 1.2k
        </div>
        <button
          className="floating-live-close"
          onClick={e => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          aria-label={t('engagement:live.floatingWidget.close')}
        >
          <X size={12} />
        </button>
      </div>

      <div className="floating-live-footer">
        <span className="floating-live-title">TechPro Live 50%</span>
        <span className="floating-live-cta">{t('engagement:live.floatingWidget.watchNow')}</span>
      </div>
    </div>
  );
}

export default FloatingLiveWidget;
