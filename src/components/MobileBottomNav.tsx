// src/components/MobileBottomNav.tsx — Mobile App Bottom Navigation Bar

import { Link, useLocation } from 'react-router-dom';
import { Home, Radio, PlaySquare, ShoppingCart, User } from 'lucide-react';
import './MobileBottomNav.css';

interface MobileBottomNavProps {
  cartCount: number;
}

export function MobileBottomNav({ cartCount }: MobileBottomNavProps) {
  const location = useLocation();
  const path = location.pathname;

  // Hide bottom nav on studio creation pages and product detail pages (where product action bar is active)
  if (path === '/video/create' || path.startsWith('/creator') || path.startsWith('/product/')) {
    return null;
  }

  const isDarkPage = path.startsWith('/video') || path.startsWith('/live');
  const isVideoPage = path.startsWith('/video');
  const isLivePage = path.startsWith('/live');

  return (
    <nav className={`mobile-bottom-nav ${isDarkPage ? 'mobile-bottom-nav--dark' : ''}`} aria-label="Mobile Navigation">
      {/* 1. Home */}
      <Link
        to="/"
        className={`mobile-nav-item${path === '/' ? ' mobile-nav-item--active' : ''}`}
      >
        {path === '/' && <span className="mobile-nav-active-bar" />}
        <div className="mobile-nav-icon-wrap">
          <Home size={20} />
        </div>
        <span>หน้าแรก</span>
      </Link>

      {/* 2. Short Video */}
      <Link
        to="/video"
        className={`mobile-nav-item mobile-nav-item--video${isVideoPage ? ' mobile-nav-item--active' : ''}`}
      >
        {isVideoPage && <span className="mobile-nav-active-bar mobile-nav-active-bar--video" />}
        <div className="mobile-nav-icon-wrap">
          <PlaySquare size={20} />
          <span className="mobile-nav-video-hot-badge">
            <span className="mobile-nav-sparkle-dot" />
            HOT
          </span>
        </div>
        <span>วิดีโอ</span>
      </Link>

      {/* 3. Live Stream */}
      <Link
        to="/live"
        className={`mobile-nav-item mobile-nav-item--live${isLivePage ? ' mobile-nav-item--active' : ''}`}
      >
        {isLivePage && <span className="mobile-nav-active-bar mobile-nav-active-bar--live" />}
        <div className="mobile-nav-icon-wrap">
          <Radio size={20} />
          <span className="mobile-nav-live-beacon">
            <span className="mobile-nav-live-ring" />
            <span className="mobile-nav-live-core" />
          </span>
        </div>
        <span>ไลฟ์สด</span>
      </Link>

      {/* 4. Cart */}
      <Link
        to="/cart"
        className={`mobile-nav-item${path === '/cart' ? ' mobile-nav-item--active' : ''}`}
      >
        {path === '/cart' && <span className="mobile-nav-active-bar" />}
        <div className="mobile-nav-icon-wrap">
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="mobile-nav-cart-badge">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </div>
        <span>ตะกร้า</span>
      </Link>

      {/* 5. Account / Me */}
      <Link
        to="/login"
        className={`mobile-nav-item${path === '/login' || path === '/account' ? ' mobile-nav-item--active' : ''}`}
      >
        {(path === '/login' || path === '/account') && <span className="mobile-nav-active-bar" />}
        <div className="mobile-nav-icon-wrap">
          <User size={20} />
        </div>
        <span>ฉัน</span>
      </Link>
    </nav>
  );
}

export default MobileBottomNav;
