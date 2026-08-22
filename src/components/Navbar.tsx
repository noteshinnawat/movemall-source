import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Store,
  MessageSquare,
  Bell,
  Share2,
  Truck,
  HelpCircle,
  Camera,
  LogOut,
} from 'lucide-react';
import { fetchUnreadNotificationCount, logoutApi } from '../utils/api';
import { LocalizedLink, useLocalizedPath } from '../i18n/LocalizedLink';
import { LanguageSwitcher } from './LanguageSwitcher';
import './Navbar.css';
import { onImageError } from '../utils/imageFallback';

interface NavbarProps {
  cartCount?: number;
  wishlistCount?: number;
  onOpenVisualSearch?: () => void;
  className?: string;
}

export function Navbar({
  cartCount = 0,
  wishlistCount = 0,
  onOpenVisualSearch,
  className = '',
}: NavbarProps) {
  const { t } = useTranslation('navigation');
  const navigate = useNavigate();
  const localizePath = useLocalizedPath();
  const trendingKeywords = [
    t('primary.trending.wirelessHeadphones'),
    t('primary.trending.oversizedShirt'),
    t('primary.trending.dysonHairDryer'),
    t('primary.trending.nikeRunningShoes'),
    t('primary.trending.faceSerum'),
    t('primary.trending.iphone'),
    t('primary.trending.sonyCamera'),
    t('primary.trending.crossbodyBag'),
    t('primary.trending.airFryer'),
    t('primary.trending.ipad'),
  ];
  const trendingKeywordCount = trendingKeywords.length;
  const [keywordIndex, setKeywordIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // User Auth State
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    avatarUrl?: string;
    coinsBalance?: number;
  } | null>(() => {
    try {
      const uStr = localStorage.getItem('movemall_user');
      return uStr ? JSON.parse(uStr) : null;
    } catch {
      return null;
    }
  });

  // Notification Unread Count State
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  // Chat Unread Count State (0 when not logged in)
  const [unreadChatCount, setUnreadChatCount] = useState<number>(() => {
    if (!currentUser) return 0;
    try {
      const stored = localStorage.getItem('movemall_chat_unread_count');
      return stored !== null ? Math.max(0, parseInt(stored, 10)) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    async function loadNotifCount() {
      const token = localStorage.getItem('movemall_jwt_token');
      if (!token) {
        setUnreadNotifCount(0);
        setUnreadChatCount(0);
        return;
      }
      try {
        const res = await fetchUnreadNotificationCount();
        if (typeof res?.unreadCount === 'number') {
          setUnreadNotifCount(res.unreadCount);
        }
      } catch {
        // Fallback default
      }

      // Check chat unread count
      try {
        const stored = localStorage.getItem('movemall_chat_unread_count');
        setUnreadChatCount(stored !== null ? Math.max(0, parseInt(stored, 10)) : 0);
      } catch {
        setUnreadChatCount(0);
      }
    }

    loadNotifCount();
    window.addEventListener('movemall_auth_change', loadNotifCount);
    window.addEventListener('movemall_notif_change', loadNotifCount);
    window.addEventListener('movemall_chat_change', loadNotifCount);
    return () => {
      window.removeEventListener('movemall_auth_change', loadNotifCount);
      window.removeEventListener('movemall_notif_change', loadNotifCount);
      window.removeEventListener('movemall_chat_change', loadNotifCount);
    };
  }, [currentUser]);

  // Sync Auth Changes across tabs and actions
  useEffect(() => {
    function handleAuthUpdate() {
      try {
        const uStr = localStorage.getItem('movemall_user');
        setCurrentUser(uStr ? JSON.parse(uStr) : null);
      } catch {
        setCurrentUser(null);
      }
    }

    window.addEventListener('storage', handleAuthUpdate);
    window.addEventListener('movemall_auth_change', handleAuthUpdate);
    return () => {
      window.removeEventListener('storage', handleAuthUpdate);
      window.removeEventListener('movemall_auth_change', handleAuthUpdate);
    };
  }, []);

  function handleLogout() {
    logoutApi(); // เพิกถอน token ฝั่งเซิร์ฟเวอร์ด้วย ไม่ใช่แค่ลบทิ้งฝั่ง client
    setCurrentUser(null);
    window.dispatchEvent(new Event('movemall_auth_change'));
    navigate(localizePath('/login'));
  }

  // Cycling keyword timer (3.2 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setKeywordIndex(prev => (prev + 1) % trendingKeywordCount);
    }, 3200);
    return () => clearInterval(timer);
  }, [trendingKeywordCount]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const queryToSearch = searchQuery.trim() || trendingKeywords[keywordIndex];
    navigate(localizePath(`/shop?q=${encodeURIComponent(queryToSearch)}`));
  }

  return (
    <header className={`navbar ${className}`.trim()} role="banner">
      {/* ── Tier 1: Top Utility Bar (Desktop only) ── */}
      <div className="navbar__top-bar">
        <div className="navbar__top-inner">
          {/* Left Group: Tools for Sellers & Helpers */}
          <div className="navbar__top-group">
            {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
              <>
                <Link to="/admin" className="navbar__top-link" style={{ color: '#DC2626', fontWeight: 800 }}>
                  👑 {t('primary.admin')}
                </Link>
                <span className="navbar__top-divider" />
              </>
            )}
            <Link to="/seller" className="navbar__top-link">
              🏪 {t('primary.sellerCentre')}
            </Link>
            <span className="navbar__top-divider" />
            <Link to="/affiliate" className="navbar__top-link" style={{ color: '#4F46E5' }}>
              <Share2 size={12} /> {t('primary.affiliate')}
            </Link>
            <span className="navbar__top-divider" />
            <LocalizedLink to="/tracking" className="navbar__top-link">
              <Truck size={12} /> {t('primary.tracking')}
            </LocalizedLink>
            <span className="navbar__top-divider" />
            <LocalizedLink to="/help" className="navbar__top-link">
              <HelpCircle size={12} /> {t('primary.help')}
            </LocalizedLink>
          </div>

          {/* Right Group: Notifications, Chat, Account */}
          <div className="navbar__top-group">
            <div className="navbar__language-switcher--desktop">
              <LanguageSwitcher />
            </div>
            <span className="navbar__top-divider" />
            <LocalizedLink to="/notifications" className="navbar__top-link" style={{ position: 'relative' }}>
              <Bell size={12} />
              <span>{t('primary.notifications')}</span>
              {unreadNotifCount > 0 && (
                <span
                  style={{
                    background: '#EF4444',
                    color: 'white',
                    fontSize: 9,
                    padding: '0 5px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    fontWeight: 900,
                  }}
                >
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </LocalizedLink>
            <span className="navbar__top-divider" />
            <LocalizedLink to="/chat" className="navbar__top-link">
              <MessageSquare size={12} /> {t('primary.chatWithStore')}
            </LocalizedLink>
            {/* Auth / Account State */}
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LocalizedLink
                  to="/account"
                  className="navbar__top-link"
                  style={{ fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <img
                    src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name || 'User')}`}
                    alt=""
                    style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }}
                  onError={onImageError} />
                  <span>{currentUser.name}</span>
                  <span style={{ fontSize: 11, background: '#FEF3C7', color: '#D97706', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                    🪙 {currentUser.coinsBalance ?? 100}
                  </span>
                </LocalizedLink>
                <span className="navbar__top-divider" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="navbar__top-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#EF4444',
                    fontWeight: 600,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title={t('account.logout')}
                >
                  <LogOut size={12} /> {t('account.logout')}
                </button>
              </div>
            ) : (
              <>
                <LocalizedLink to="/register" className="navbar__top-link" style={{ color: '#D97706', fontWeight: 700 }}>
                  🎁 {t('account.registerReward')}
                </LocalizedLink>
                <span className="navbar__top-divider" />
                <LocalizedLink to="/login" className="navbar__top-link">
                  <User size={12} /> {t('account.login')}
                </LocalizedLink>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tier 2: Main Header Bar (Logo / Full Search / Cart / Chat) ── */}
      <div className="navbar__main-bar">
        <div className="navbar__main-inner">
          {/* Logo (Desktop only) */}
          <LocalizedLink to="/" className="navbar__logo" aria-label={t('primary.logoHome')}>
            <div className="navbar__logo-icon">🛍</div>
            <span className="navbar__logo-text">Movemall</span>
          </LocalizedLink>

          {/* Search Box with Cycling Placeholder Words & Camera Icon */}
          <div className="navbar__search">
            <form
              className="navbar__search-form"
              role="search"
              onSubmit={handleSearchSubmit}
            >
              <Search size={17} className="navbar__search-leading-icon" />

              <div className="navbar__search-input-wrap">
                <input
                  id="navbar-search"
                  type="text"
                  className="navbar__search-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  aria-label={t('primary.searchProducts')}
                  autoComplete="off"
                />

                {!searchQuery && !isFocused && (
                  <div className="navbar__animated-placeholder" key={keywordIndex}>
                    <span className="navbar__animated-text">
                      {trendingKeywords[keywordIndex]}
                    </span>
                  </div>
                )}
              </div>

              {/* Camera Button (Visual Search) */}
              <button
                type="button"
                className="navbar__visual-search-btn"
                onClick={onOpenVisualSearch}
                title={t('primary.visualSearchTitle')}
                aria-label={t('primary.visualSearch')}
              >
                <Camera size={19} />
              </button>

              <button
                type="submit"
                className="navbar__search-submit-btn"
                aria-label={t('primary.searchProducts')}
              >
                <Search size={16} />
              </button>
            </form>
          </div>

          {/* Actions Right (Wishlist, Cart, Chat) */}
          <div className="navbar__actions">
            {/* Wishlist (Desktop only) */}
            <LocalizedLink
              to="/wishlist"
              className="navbar__action-btn navbar__wishlist-btn"
              aria-label={t('primary.wishlistCount', { count: wishlistCount })}
            >
              <div className="navbar__icon-badge-wrap">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="navbar__badge navbar__badge--wishlist">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="navbar__action-label">{t('primary.wishlist')}</span>
            </LocalizedLink>

            {/* Cart Icon */}
            <LocalizedLink
              to="/cart"
              id="navbar-cart-btn"
              className="navbar__action-btn navbar__cart-btn"
              aria-label={t('primary.cartCount', { count: cartCount })}
              title={t('primary.cart')}
            >
              <div className="navbar__icon-badge-wrap">
                <ShoppingBag size={21} />
                {cartCount > 0 && (
                  <span className="navbar__badge navbar__badge--cart">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="navbar__action-label">{t('primary.cart')}</span>
            </LocalizedLink>

            {/* Chat Icon (แชทที่ส่งหาผู้ใช้) */}
            <LocalizedLink
              to="/chat"
              id="navbar-chat-btn"
              className="navbar__action-btn navbar__chat-btn"
              aria-label={t('primary.chatMessages')}
              title={t('primary.chatMessages')}
            >
              <div className="navbar__icon-badge-wrap">
                <MessageSquare size={21} />
                {currentUser && unreadChatCount > 0 && (
                  <span className="navbar__badge navbar__badge--chat">
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </div>
              <span className="navbar__action-label">{t('primary.chat')}</span>
            </LocalizedLink>
            <div className="navbar__language-switcher--mobile">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tier 3: Primary shopping navigation (Desktop only) ── */}
      <div className="navbar__sub-bar">
        <div className="navbar__sub-inner">
          <LocalizedLink to="/" className="navbar__sub-link">
            {t('primary.home')}
          </LocalizedLink>

          <LocalizedLink to="/shop" className="navbar__sub-link">
            {t('primary.allProducts')}
          </LocalizedLink>

          <LocalizedLink to="/mall" className="navbar__sub-link" style={{ color: '#DC2626', fontWeight: 800 }}>
            <span style={{ background: '#DC2626', color: 'white', fontSize: 9, padding: '1px 5px', fontWeight: 900 }}>MALL</span>
            {t('primary.mallAuthentic')}
          </LocalizedLink>

          <LocalizedLink to="/stores" className="navbar__sub-link">
            <Store size={13} />
            {t('primary.officialStores')}
          </LocalizedLink>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
