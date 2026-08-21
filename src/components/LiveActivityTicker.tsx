// src/components/LiveActivityTicker.tsx — Realtime Purchase Activity Popups

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag } from 'lucide-react';
import { getProductUrl } from '../utils/seo';
import { useLocalizedPath } from '../i18n/LocalizedLink';
import { stripLocale } from '../i18n/locales';
import type { Product } from '../types';
import './LiveActivityTicker.css';

interface Activity {
  product: Product;
  secondsAgo: number;
}

interface LiveActivityTickerProps {
  products: Product[];
}

export function LiveActivityTicker({ products }: LiveActivityTickerProps) {
  const { t } = useTranslation(['engagement']);
  const location = useLocation();
  const navigate = useNavigate();
  const localizePath = useLocalizedPath();
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);

  // Do not show on /live, /video, /creator, /checkout, /cart, /orders, /wishlist, /login, /notifications, /tracking, /seller
  const hiddenRoutes = [
    '/live',
    '/video',
    '/creator',
    '/checkout',
    '/cart',
    '/order',
    '/orders',
    '/wishlist',
    '/login',
    '/notifications',
    '/tracking',
    '/seller',
  ];
  const routePathname = stripLocale(location.pathname);
  const isHiddenRoute = hiddenRoutes.some(route => routePathname.startsWith(route));

  useEffect(() => {
    if (isHiddenRoute || products.length === 0) return;

    const showRandomActivity = () => {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const secondsAgo = Math.floor(Math.random() * 20) + 2;

      setCurrentActivity({
        product: randomProduct,
        secondsAgo,
      });

      // Hide after 4.5 seconds
      setTimeout(() => {
        setCurrentActivity(null);
      }, 4500);
    };

    // First trigger after 4s, then repeat every 14s
    const initialTimer = setTimeout(showRandomActivity, 4000);
    const interval = setInterval(showRandomActivity, 14000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isHiddenRoute, products]);

  if (isHiddenRoute || !currentActivity) return null;

  return (
    <div className="activity-ticker-container">
      <div
        className="activity-ticker"
        onClick={() => navigate(localizePath(getProductUrl(currentActivity.product)))}
      >
        <div className="activity-ticker__icon-badge">
          <ShoppingBag size={13} />
        </div>
        <div className="activity-ticker__body">
          <div className="activity-ticker__status-line">
            <span className="activity-ticker__title">{t('engagement:live.ticker.soldTitle')}</span>
            <span className="activity-ticker__time">
              • {t('engagement:live.ticker.secondsAgo', { seconds: currentActivity.secondsAgo })}
            </span>
          </div>
          <div className="activity-ticker__product">
            {currentActivity.product.name}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveActivityTicker;
