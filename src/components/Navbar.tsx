// src/components/Navbar.tsx — Clean Multi-Tier Marketplace Header with Shopee-Style Mobile Topbar

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Zap,
  Ticket,
  Store,
  MessageSquare,
  Bell,
  Scale,
  Share2,
  Truck,
  HelpCircle,
  Camera,
} from 'lucide-react';
import './Navbar.css';

interface NavbarProps {
  cartCount?: number;
  wishlistCount?: number;
  onOpenVisualSearch?: () => void;
  className?: string;
}

const TRENDING_KEYWORDS = [
  'หูฟังบลูทูธไร้สาย ตัดเสียงรบกวน',
  'เสื้อยืดโอเวอร์ไซส์ สไตล์เกาหลี',
  'Dyson ไดร์เป่าผม Supersonic',
  'รองเท้าวิ่ง Nike Air Zoom',
  'เซรั่มบำรุงผิวหน้า กระจ่างใส',
  'iPhone 16 Pro Max 256GB',
  'กล้องถ่ายรูป Sony Alpha 7 IV',
  'กระเป๋าสะพายข้าง มินิมอล',
  'หม้อทอดไร้น้ำมัน ดิจิทัล',
  'iPad Air M2 ชิปเซ็ตแรง',
];

export function Navbar({
  cartCount = 0,
  wishlistCount = 0,
  onOpenVisualSearch,
  className = '',
}: NavbarProps) {
  const navigate = useNavigate();
  const [keywordIndex, setKeywordIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Cycling keyword timer (3.2 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setKeywordIndex(prev => (prev + 1) % TRENDING_KEYWORDS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const queryToSearch = searchQuery.trim() || TRENDING_KEYWORDS[keywordIndex];
    navigate(`/shop?q=${encodeURIComponent(queryToSearch)}`);
  }

  return (
    <header className={`navbar ${className}`.trim()} role="banner">
      {/* ── Tier 1: Top Utility Bar (Desktop only) ── */}
      <div className="navbar__top-bar">
        <div className="navbar__top-inner">
          {/* Left Group: Tools for Sellers & Helpers */}
          <div className="navbar__top-group">
            <Link to="/seller" className="navbar__top-link">
              🏪 ศูนย์ผู้ขาย (Seller Centre)
            </Link>
            <span className="navbar__top-divider" />
            <Link to="/affiliate" className="navbar__top-link" style={{ color: '#4F46E5' }}>
              <Share2 size={12} /> นายหน้า Affiliate
            </Link>
            <span className="navbar__top-divider" />
            <Link to="/tracking" className="navbar__top-link">
              <Truck size={12} /> ติดตามพัสดุ
            </Link>
            <span className="navbar__top-divider" />
            <Link to="/help" className="navbar__top-link">
              <HelpCircle size={12} /> ช่วยเหลือ
            </Link>
          </div>

          {/* Right Group: Notifications, Chat, Account */}
          <div className="navbar__top-group">
            <Link to="/notifications" className="navbar__top-link" style={{ position: 'relative' }}>
              <Bell size={12} />
              <span>การแจ้งเตือน</span>
              <span
                style={{
                  background: '#EF4444',
                  color: 'white',
                  fontSize: 9,
                  padding: '0 4px',
                  fontWeight: 900,
                }}
              >
                3
              </span>
            </Link>
            <span className="navbar__top-divider" />
            <Link to="/chat" className="navbar__top-link">
              <MessageSquare size={12} /> แชทกับร้านค้า
            </Link>
            <span className="navbar__top-divider" />
            <Link to="/register" className="navbar__top-link" style={{ color: '#D97706', fontWeight: 700 }}>
              🎁 สมัครสมาชิก (รับ 100.-)
            </Link>
            <span className="navbar__top-divider" />
            <Link to="/login" className="navbar__top-link">
              <User size={12} /> เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tier 2: Main Header Bar (Logo / Full Search / Cart / Chat) ── */}
      <div className="navbar__main-bar">
        <div className="navbar__main-inner">
          {/* Logo (Desktop only) */}
          <Link to="/" className="navbar__logo" aria-label="Movemall Home">
            <div className="navbar__logo-icon">🛍</div>
            <span className="navbar__logo-text">Movemall</span>
          </Link>

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
                  aria-label="ค้นหาสินค้า"
                  autoComplete="off"
                />

                {!searchQuery && !isFocused && (
                  <div className="navbar__animated-placeholder" key={keywordIndex}>
                    <span className="navbar__animated-text">
                      {TRENDING_KEYWORDS[keywordIndex]}
                    </span>
                  </div>
                )}
              </div>

              {/* Camera Button (Visual Search) */}
              <button
                type="button"
                className="navbar__visual-search-btn"
                onClick={onOpenVisualSearch}
                title="ค้นหาด้วยรูปภาพ (AI Visual Lens)"
                aria-label="ค้นหาด้วยรูปภาพ"
              >
                <Camera size={19} />
              </button>

              <button
                type="submit"
                className="navbar__search-submit-btn"
                aria-label="ค้นหา"
              >
                <Search size={16} />
              </button>
            </form>
          </div>

          {/* Actions Right (Wishlist, Cart, Chat) */}
          <div className="navbar__actions">
            {/* Wishlist (Desktop only) */}
            <Link
              to="/wishlist"
              className="navbar__action-btn navbar__wishlist-btn"
              aria-label={`Wishlist ${wishlistCount} รายการ`}
            >
              <div className="navbar__icon-badge-wrap">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="navbar__badge navbar__badge--wishlist">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="navbar__action-label">สินค้าที่ชอบ</span>
            </Link>

            {/* Cart Icon */}
            <Link
              to="/cart"
              id="navbar-cart-btn"
              className="navbar__action-btn navbar__cart-btn"
              aria-label={`ตะกร้าสินค้า ${cartCount} รายการ`}
              title="รถเข็นสินค้า"
            >
              <div className="navbar__icon-badge-wrap">
                <ShoppingBag size={21} />
                {cartCount > 0 && (
                  <span className="navbar__badge navbar__badge--cart">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="navbar__action-label">ตะกร้า</span>
            </Link>

            {/* Chat Icon (แชทที่ส่งหาผู้ใช้) */}
            <Link
              to="/chat"
              id="navbar-chat-btn"
              className="navbar__action-btn navbar__chat-btn"
              aria-label="แชทข้อความ"
              title="กล่องข้อความแชท"
            >
              <div className="navbar__icon-badge-wrap">
                <MessageSquare size={21} />
                <span className="navbar__badge navbar__badge--chat">
                  2
                </span>
              </div>
              <span className="navbar__action-label">แชท</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tier 3: Sub Deals Bar (Desktop only) ── */}
      <div className="navbar__sub-bar">
        <div className="navbar__sub-inner">
          <Link to="/mall" className="navbar__sub-link" style={{ color: '#DC2626', fontWeight: 800 }}>
            <span style={{ background: '#DC2626', color: 'white', fontSize: 9, padding: '1px 5px', fontWeight: 900 }}>MALL</span>
            แบรนด์ดังแท้ 100%
          </Link>

          <Link to="/video" className="navbar__sub-link" style={{ color: '#2563EB', fontWeight: 800 }}>
            <span style={{ background: '#F59E0B', color: '#111827', fontSize: 9, padding: '1px 5px', fontWeight: 900 }}>🟡 ตะกร้า</span>
            🎬 Movemall Video
          </Link>

          <Link to="/live" className="navbar__sub-link" style={{ color: '#EF4444', fontWeight: 800 }}>
            <span className="navbar__live-dot" />
            LIVE ไลฟ์สด
          </Link>

          <Link to="/games" className="navbar__sub-link" style={{ color: '#4F46E5' }}>
            🎮 เล่นเกมส์ & รับ Coins
          </Link>

          <Link to="/flash-sale" className="navbar__sub-link" style={{ color: 'var(--error)' }}>
            <Zap size={13} />
            Flash Sale
          </Link>

          <Link to="/vouchers" className="navbar__sub-link" style={{ color: 'var(--primary-dark)' }}>
            <Ticket size={13} />
            ศูนย์คูปอง
          </Link>

          <Link to="/compare" className="navbar__sub-link">
            <Scale size={13} />
            เปรียบเทียบสเปก
          </Link>

          <Link to="/stores" className="navbar__sub-link">
            <Store size={13} />
            ร้านค้าทางการ
          </Link>

          <Link to="/shop" className="navbar__sub-link" style={{ marginLeft: 'auto', color: 'var(--primary)' }}>
            ดูสินค้าทั้งหมด (160+ ชิ้น) →
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
