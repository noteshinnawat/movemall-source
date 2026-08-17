import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, ChevronLeft, ChevronRight, Sparkles, X, ShoppingCart } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { LiveStreamCard } from '../components/LiveStreamCard';
import { products, categories, banners, subBanners } from '../data/products';
import { stores } from '../data/stores';
import { mockLiveStreams } from '../data/liveStreams';
import { famousBrands } from '../data/brands';
import { initialAdCampaigns } from '../data/mockAdsData';
import type { Product } from '../types';
import './HomePage.css';

interface HomePageProps {
  onAddToCart: (product: Product) => void;
  isWishlisted?: (productId: string) => boolean;
  onToggleWishlist?: (product: Product) => void;
}

function useCountdown(targetSeconds: number) {
  const [seconds, setSeconds] = useState(targetSeconds);
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => (s > 0 ? s - 1 : targetSeconds)), 1000);
    return () => clearInterval(id);
  }, [targetSeconds]);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return { h, m, s };
}



const QUICK_SHORTCUTS = [
  { icon: '🔴', label: 'Movemall LIVE', link: '/live', badge: 'LIVE' },
  { icon: '👑', label: 'แบรนด์ดังแท้', link: '/mall', badge: 'MALL' },
  { icon: '⚡', label: 'Flash Sale', link: '/flash-sale', badge: 'HOT' },
  { icon: '🎟️', label: 'ศูนย์คูปองลด', link: '/vouchers', badge: 'โค้ดฟรี' },
  { icon: '🎮', label: 'วงล้อ & Coins', link: '/games', badge: 'แจกเหรียญ' },
  { icon: '🚚', label: 'ติดตามพัสดุสด', link: '/tracking', badge: 'GPS' },
  { icon: '⚖️', label: 'เปรียบเทียบสเปก', link: '/compare', badge: 'ใหม่' },
  { icon: '💰', label: 'นายหน้า Affiliate', link: '/affiliate', badge: 'ค่าคอม 10%' },
];

const FEED_TABS = [
  {
    id: 'foryou' as const,
    title: 'สำหรับคุณ',
    subtitle: 'คัดสรรพิเศษเพื่อคุณ',
    icon: '✨',
    badge: 'แนะนำ',
    badgeClass: 'feed-badge-blue',
    accentColor: '#2563EB',
  },
  {
    id: 'bestseller' as const,
    title: 'สินค้าขายดี',
    subtitle: 'ยอดฮิตประจำสัปดาห์',
    icon: '🔥',
    badge: 'TOP HIT',
    badgeClass: 'feed-badge-orange',
    accentColor: '#EA580C',
  },
  {
    id: 'deals' as const,
    title: 'ดีลลดแรง',
    subtitle: 'ลดสูงสุด 70%',
    icon: '⚡',
    badge: '-70%',
    badgeClass: 'feed-badge-red',
    accentColor: '#DC2626',
  },
  {
    id: 'mall' as const,
    title: 'Mall ของแท้',
    subtitle: 'การันตีแท้ 100%',
    icon: '👑',
    badge: 'OFFICIAL',
    badgeClass: 'feed-badge-purple',
    accentColor: '#7C3AED',
  },
];

export function HomePage({ onAddToCart, isWishlisted, onToggleWishlist }: HomePageProps) {
  const { h, m, s } = useCountdown(4 * 3600 + 32 * 60 + 15);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [feedTab, setFeedTab] = useState<'foryou' | 'bestseller' | 'deals' | 'mall'>('foryou');
  const [visibleCount, setVisibleCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [selectedVideoProduct, setSelectedVideoProduct] = useState<Product | null>(null);

  // AI Personalized Scoring Engine based on user affinity in localStorage
  const userInterest = typeof window !== 'undefined' ? localStorage.getItem('mm_user_interest') || 'electronics' : 'electronics';

  const personalizedProducts = [...products].sort((a, b) => {
    if (feedTab === 'foryou') {
      const aScore = (a.category === userInterest ? 50 : 0) + a.rating * 10 + (a.badge === 'sale' ? 15 : 0);
      const bScore = (b.category === userInterest ? 50 : 0) + b.rating * 10 + (b.badge === 'sale' ? 15 : 0);
      return bScore - aScore;
    }
    if (feedTab === 'bestseller') {
      return b.reviewCount - a.reviewCount;
    }
    if (feedTab === 'deals') {
      const aDiscount = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) : 0;
      const bDiscount = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) : 0;
      return bDiscount - aDiscount;
    }
    if (feedTab === 'mall') {
      const aMall = a.badge === 'new' || a.rating >= 4.9 ? 1 : 0;
      const bMall = b.badge === 'new' || b.rating >= 4.9 ? 1 : 0;
      return bMall - aMall;
    }
    return 0;
  });

  // Algorithmic Video Review Slot Spacing Engine (Ensures video slots are spaced out by at least 5 products)
  const videoSlotMap = new Set<string>();
  let lastVideoIdx = -5;
  personalizedProducts.forEach((p, index) => {
    const hasVideo = Boolean(p.videoReview?.videoUrl || p.videoUrl);
    if (hasVideo && (index - lastVideoIdx >= 5)) {
      videoSlotMap.add(p.id);
      lastVideoIdx = index;
    }
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const flashGridRef = useRef<HTMLDivElement>(null);

  const scrollFlashGrid = (direction: 'left' | 'right') => {
    if (flashGridRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      flashGridRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Reset pagination when tab changes
  useEffect(() => {
    setVisibleCount(8);
  }, [feedTab]);

  // Load more function
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => {
        const next = Math.min(prev + 12, personalizedProducts.length);
        return next;
      });
      setIsLoadingMore(false);
    }, 250);
  }, [isLoadingMore, personalizedProducts.length]);

  // 1. Window scroll listener (Fast & reliable fallback)
  useEffect(() => {
    let ticking = false;
    const handleWindowScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (visibleCount < personalizedProducts.length && !isLoadingMore) {
            const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;
            if (scrollY + windowHeight >= docHeight - 600) {
              handleLoadMore();
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [visibleCount, personalizedProducts.length, isLoadingMore, handleLoadMore]);

  // 2. IntersectionObserver on sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting && visibleCount < personalizedProducts.length && !isLoadingMore) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '400px',
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, personalizedProducts.length, isLoadingMore, handleLoadMore]);

  // Auto slide every 4 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <main className="home">
      {/* ── Hero Campaign Zone ── */}
      <section className="hero" aria-label="Promotions">
        <div className="hero__grid">
          {/* Main Auto Carousel */}
          <div
            className="hero__carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {banners.map((banner, i) => (
              <div
                key={banner.id}
                className={`hero__slide${currentSlide === i ? ' hero__slide--active' : ''}`}
                style={{ background: banner.gradient }}
              >
                {banner.image && (
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="hero__slide-bg"
                  />
                )}
                <div className="hero__slide-overlay" />
                <div className="hero__slide-content">
                  <span className="hero__slide-badge">
                    {i === 0 ? '🔥 แคมเปญลดใหญ่ประจำวัน' : i === 1 ? '👑 SUPER BRAND DAY' : '⚡ PAYDAY BIG SALE'}
                  </span>
                  <h2 className="hero__slide-title">{banner.title}</h2>
                  <p className="hero__slide-desc">{banner.subtitle}</p>
                  <Link to={banner.ctaLink} className="hero__slide-cta">
                    {banner.cta}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ))}

            {/* Nav Arrows */}
            <button
              className="hero__nav-btn hero__nav-btn--prev"
              onClick={() => setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length)}
              aria-label="Previous Slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="hero__nav-btn hero__nav-btn--next"
              onClick={() => setCurrentSlide(prev => (prev + 1) % banners.length)}
              aria-label="Next Slide"
            >
              <ChevronRight size={20} />
            </button>

            {/* Indicator Dots */}
            <div className="hero__dots">
              {banners.map((_, i) => (
                <button
                  key={i}
                  className={`hero__dot${currentSlide === i ? ' hero__dot--active' : ''}`}
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Sub Banners */}
          <div className="hero__sub-banners">
            {subBanners.map(sub => (
              <Link
                key={sub.id}
                to={sub.link}
                className="hero__sub-banner"
                style={{ background: sub.bg }}
              >
                <img src={sub.img} alt={sub.title} className="hero__sub-bg" />
                <div className="hero__sub-overlay" />
                <div className="hero__sub-content">
                  <span className="hero__sub-tag">{sub.tag}</span>
                  <div className="hero__sub-title">{sub.title}</div>
                  <div className="hero__sub-desc">{sub.subtitle}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 8 Quick Access Shortcuts Bar ── */}
        <div className="container">
          <div className="quick-access-bar" aria-label="เมนูลัดยอดฮิต">
            {QUICK_SHORTCUTS.map(sc => (
              <Link key={sc.label} to={sc.link} className="quick-access-item">
                <div className="quick-access-icon-box">
                  {sc.icon}
                </div>
                <span className="quick-access-label">{sc.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOVEMALL LIVE: 4 Small Interactive Live Channels Grid ── */}
      <section className="home-live-section container" aria-labelledby="movemall-live-heading">
        <div className="home-live-header">
          <div className="home-live-title-group">
            <span className="home-live-pulse-badge">
              <span className="home-live-pulse-dot" />
              LIVE
            </span>
            <h2 id="movemall-live-heading" className="home-live-title">
              MOVEMALL LIVE
            </h2>
            <span className="home-live-subtitle">
              • ช้อปสด ปักหมุดดีลลดแรง & โค้ดสดในไลฟ์
            </span>
          </div>
          <Link to="/live" className="home-live-viewall-btn">
            <span>ดูไลฟ์ทั้งหมด ({mockLiveStreams.length} ช่อง)</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="home-live-grid">
          {mockLiveStreams.slice(0, 4).map(ch => (
            <Link
              key={ch.id}
              to="/live"
              className="home-live-card"
              title={`เข้าชมไลฟ์ ${ch.channelName}`}
            >
              <video
                src={ch.videoUrl}
                poster={ch.coverImage}
                autoPlay
                loop
                muted
                playsInline
                className="home-live-video"
              />
              <div className="home-live-overlay" />

              {/* Top Tag & Channel */}
              <div className="home-live-card-top">
                <span className="home-live-tag">
                  <span className="home-live-tag-dot" />
                  {ch.viewers} คนดู
                </span>
                <span className="home-live-channel">{ch.channelName}</span>
              </div>

              {/* Bottom Deal Info */}
              <div className="home-live-card-bottom">
                <div className="home-live-caption">
                  {ch.caption}
                </div>
                <div className="home-live-pinned-product">
                  <div className="home-live-basket-icon">🧺</div>
                  <span className="home-live-prod-name">
                    {ch.pinnedProduct.name}
                  </span>
                  <span className="home-live-prod-price">
                    ฿{ch.pinnedProduct.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Compact Flash Sale Showcase (Moved to Top Zone) ── */}
      <section className="section container" aria-labelledby="flash-sale-heading">
        <div className="home-flash-container">
          {/* Flash Sale Header */}
          <div className="home-flash-header">
            <div className="home-flash-title-group">
              <div className="home-flash-badge">
                <Zap size={15} fill="#FFFFFF" />
                <span>FLASH SALE</span>
              </div>
              <h2 id="flash-sale-heading" className="home-flash-heading">
                ดีลเดือดจำกัดเวลา ลดสูงสุด 70%
              </h2>
              {/* Countdown Timer */}
              <div className="home-flash-timer-wrap">
                <span className="home-flash-timer-label">⏰ ดีลจบใน:</span>
                <div className="home-flash-timer-digits">
                  <span className="home-flash-digit">{String(h).padStart(2, '0')}</span>
                  <span className="home-flash-colon">:</span>
                  <span className="home-flash-digit">{String(m).padStart(2, '0')}</span>
                  <span className="home-flash-colon">:</span>
                  <span className="home-flash-digit home-flash-digit--sec">{String(s).padStart(2, '0')}</span>
                </div>
              </div>

              <div className="home-flash-live-pulse">
                <span className="home-flash-pulse-dot" />
                <span>กำลังสั่งซื้อสด 18 คน</span>
              </div>
            </div>

            <div className="home-flash-right-actions">
              <div className="home-flash-nav-controls">
                <button
                  type="button"
                  className="home-flash-arrow-btn"
                  onClick={() => scrollFlashGrid('left')}
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="home-flash-arrow-btn"
                  onClick={() => scrollFlashGrid('right')}
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <Link to="/flash-sale" className="home-flash-view-all">
                ดูดีลทั้งหมด <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Flash Sale Products Horizontal Grid Carousel */}
          <div className="home-flash-grid" ref={flashGridRef}>
            {products.slice(0, 6).map((product, idx) => {
              const discountPct = [55, 60, 48, 70, 65, 50][idx % 6];
              const flashPrice = Math.round(product.price * (1 - discountPct / 100));
              const soldPct = [88, 94, 76, 96, 82, 91][idx % 6];

              return (
                <div key={product.id} className="home-flash-card">
                  {/* Image & Discount Badge */}
                  <Link to={`/product/${product.id}`} className="home-flash-img-wrap">
                    <img src={product.images[0]} alt={product.name} className="home-flash-img" />
                    <span className="home-flash-tag">-{discountPct}%</span>
                    <span className="home-flash-guarantee">👑 ถูกสุด 30 วัน</span>
                  </Link>

                  {/* Info */}
                  <div className="home-flash-info">
                    <Link to={`/product/${product.id}`} className="home-flash-name">
                      {product.name}
                    </Link>

                    <div className="home-flash-price-row">
                      <span className="home-flash-price">฿{flashPrice.toLocaleString()}</span>
                      <span className="home-flash-orig">฿{product.price.toLocaleString()}</span>
                    </div>

                    {/* Fire Progress Bar */}
                    <div className="home-flash-progress-wrap">
                      <div className="home-flash-progress-bar">
                        <div
                          className="home-flash-progress-fill"
                          style={{ width: `${soldPct}%` }}
                        />
                      </div>
                      <span className="home-flash-progress-text">
                        🔥 ขายแล้ว {soldPct}% {soldPct > 90 && '• ด่วน!'}
                      </span>
                    </div>

                    {/* Add to Cart Quick Action */}
                    <button
                      className="home-flash-buy-btn"
                      onClick={() => onAddToCart({ ...product, price: flashPrice })}
                    >
                      <Zap size={13} fill="#FFFFFF" /> สั่งซื้อด่วน
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Categories (Marketplace Visual Category Grid) ── */}
      <section className="section container" aria-labelledby="categories-heading">
        {/* Marketplace Categories Master Header Banner */}
        <div className="home-category-banner-header">
          <div className="home-category-title-block">
            <div className="home-category-badge-row">
              <span className="home-category-tag-badge">EXPLORE CATEGORIES</span>
              <span className="home-category-count-badge">
                🔥 ครบครัน 8 หมวดหมู่หลัก
              </span>
            </div>
            <h2 id="categories-heading" className="home-category-main-title">
              🛍️ หมวดหมู่สินค้ายอดนิยม
            </h2>
            <p className="home-category-subtitle">
              เลือกช้อปสินค้าตามหมวดหมู่ พร้อมดีลส่วนลดสูงสุด 70% และโค้ดส่งฟรีทุกวัน
            </p>
          </div>

          <div className="home-category-actions">
            <div className="home-category-perks">
              <div className="home-category-perk-chip">
                <span>✨ 160+ ดีลเด็ด</span>
              </div>
              <div className="home-category-perk-chip">
                <span>⚡ อัปเดตทุกวัน</span>
              </div>
            </div>
            <Link to="/shop" className="home-category-viewall-btn">
              <span>ดูหมวดหมู่ทั้งหมด ({categories.length})</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="categories-grid">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.id}`}
              id={`category-${cat.id}`}
              className="category-card"
              aria-label={`${cat.name} ${cat.productCount} สินค้า`}
            >
              <div className="category-card__img-wrap">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=240&q=80'}
                  alt={cat.name}
                  className="category-card__img"
                  loading="lazy"
                />
                {cat.tag && (
                  <span className="category-card__tag-pill">
                    {cat.tag}
                  </span>
                )}
                <span className="category-card__icon-badge">
                  {cat.icon}
                </span>
              </div>
              <div className="category-card__info">
                <span className="category-card__name">{cat.name}</span>
                <span className="category-card__count">{cat.productCount}+ ดีลเด็ด</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Movemall Official Brand Mall ── */}
      <section className="section container" aria-labelledby="mall-heading">
        {/* ── Movemall Official Brand Mall Header Banner ── */}
        <div className="home-mall-banner">
          <div className="home-mall-banner-left">
            <span className="home-mall-badge">MALL</span>
            <h2 id="mall-heading" className="home-mall-title">
              แบรนด์ทางการแท้ 100%
            </h2>
            <div className="home-mall-guarantees">
              <span>🛡️ แท้ 100%</span>
              <span>•</span>
              <span>🔄 คืนฟรี 30 วัน</span>
              <span>•</span>
              <span>🚚 ส่งฟรี</span>
            </div>
          </div>
          <Link to="/mall" className="home-mall-viewall-btn">
            ดูแบรนด์ทั้งหมด <ArrowRight size={13} />
          </Link>
        </div>

        {/* Brand Logos Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
          {famousBrands.slice(0, 8).map(brand => (
            <Link
              key={brand.id}
              to="/mall"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                textDecoration: 'none',
                transition: 'transform 0.2s, border-color 0.2s',
              }}
            >
              <img
                src={brand.logo}
                alt={brand.name}
                style={{ width: 48, height: 48, objectFit: 'cover', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 6 }}
              />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {brand.name.split(' ')[0]}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>
                {brand.discountText}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Multi-Vendor Stores Spotlight (รวมร้านค้ายอดนิยม & ร้านค้าแนะนำ - Compact 1-Row Grid) ── */}
      <section className="section container" aria-labelledby="stores-heading">
        <div className="section__header">
          <h2 id="stores-heading" className="section__title">
            <span className="section__title-accent" />
            🏪 ร้านค้ายอดนิยม & แบรนด์ชั้นนำ
          </h2>
          <Link to="/stores" className="section__view-all">
            ดูทั้งหมด ({stores.length}) <ChevronRight size={14} />
          </Link>
        </div>

        <div className="home-stores-compact-grid">
          {stores.slice(0, 4).map(st => {
            const storeProducts = products.filter(p => p.storeId === st.id).slice(0, 3);
            return (
              <div key={st.id} className="home-store-card-compact">
                <div
                  className="home-store-card-top-bar"
                  style={{ background: st.banner || 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' }}
                >
                  <span className="home-store-badge-small">
                    {st.badge === 'official' ? 'MALL ทางการ' : '⭐ ร้านแนะนำ'}
                  </span>
                  <span className="home-store-followers-small">
                    {(st.followerCount / 1000).toFixed(1)}k ผู้ติดตาม
                  </span>
                </div>
                <div className="home-store-card-content">
                  <div className="home-store-card-profile-row">
                    <Link to={`/store/${st.id}`}>
                      <img src={st.logo} alt={st.name} className="home-store-card-logo" />
                    </Link>
                    <div className="home-store-card-title-box">
                      <Link to={`/store/${st.id}`} className="home-store-card-name-link">
                        <h3 className="home-store-card-name">{st.name}</h3>
                      </Link>
                      <div className="home-store-card-sub-info">
                        <span className="home-store-card-rating">⭐ {st.rating}</span>
                        <span className="home-store-card-voucher">🎟️ ลด ฿50</span>
                      </div>
                    </div>
                  </div>
                  <div className="home-store-card-thumbs">
                    {storeProducts.map(prod => (
                      <Link key={prod.id} to={`/product/${prod.id}`} className="home-store-card-thumb-item" title={prod.name}>
                        <img src={prod.images[0]} alt={prod.name} loading="lazy" />
                        <span className="home-store-card-thumb-price">฿{prod.price.toLocaleString()}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>



      {/* ── Gamification Promo Banner (Lucky Spin & Coins) ── */}
      <section className="section container" aria-label="Games and Coins">
        <Link
          to="/games"
          className="home-games-promo-strip"
        >
          <div className="home-games-promo-left">
            <div className="home-games-promo-icons">🎡 🎮 🎁</div>
            <div>
              <div className="home-games-promo-badge">MOVEMALL REWARDS</div>
              <h3 className="home-games-promo-title">
                ศูนย์รวมเกมส์ & เหรียญรางวัล (Games Hub)
              </h3>
              <p className="home-games-promo-desc">
                หมุนวงล้อเสี่ยงโชค Lucky Wheel, เช็คอิน 7 วันรับเหรียญ Coins ใช้ลดราคาสินค้าได้จริงทุกออเดอร์!
              </p>
            </div>
          </div>
          <div className="home-games-promo-cta">
            <span>เข้าสู่เกมส์รูม & เช็คอินรับเหรียญ</span>
            <ArrowRight size={15} />
          </div>
        </Link>
      </section>

      {/* ── Daily Discover & Recommended Feed Zone ── */}
      <section className="section container" aria-labelledby="all-heading">
        <div className="home-feed-section-header">
          {/* Marketplace Daily Discover Header Banner */}
          <div className="home-feed-banner-header">
            <div className="home-feed-title-block">
              <div className="home-feed-badge-row">
                <span className="home-feed-tag-badge">DAILY DISCOVER</span>
                <span className="home-feed-live-badge">
                  <span className="home-feed-live-dot" />
                  อัปเดตเรียลไทม์
                </span>
              </div>
              <h2 id="all-heading" className="home-feed-main-title">
                ✨ สินค้าแนะนำสำหรับคุณ
              </h2>
              <p className="home-feed-subtitle">
                {feedTab === 'foryou' && '🎯 ดีลเด็ดและสินค้าคัดสรรพิเศษเพื่อคุณโดยเฉพาะ'}
                {feedTab === 'bestseller' && '🔥 สินค้ายอดนิยมประจำสัปดาห์ที่มียอดสั่งซื้อสูงสุด'}
                {feedTab === 'deals' && '⚡ รวมสินค้าลดราคาพิเศษ 30% - 70% คุ้มค่าที่สุด'}
                {feedTab === 'mall' && '👑 สินค้าของแท้ 100% จากแบรนด์และร้านค้าทางการ'}
              </p>
            </div>

            <div className="home-feed-header-perks">
              <div className="home-feed-perk-item">
                <span>📦 160+ ดีลเด็ด</span>
              </div>
              <div className="home-feed-perk-item">
                <span>🚚 ส่งฟรีทั่วไทย</span>
              </div>
            </div>
          </div>

          {/* Modern Interactive Tab Cards Grid */}
          <div className="home-feed-tabs-grid" role="tablist" aria-label="หมวดหมู่สินค้าแนะนำ">
            {FEED_TABS.map((tab) => {
              const isActive = feedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFeedTab(tab.id)}
                  className={`home-feed-tab-card${isActive ? ' home-feed-tab-card--active' : ''}`}
                  role="tab"
                  aria-selected={isActive}
                  style={{
                    '--tab-accent': tab.accentColor,
                  } as React.CSSProperties}
                >
                  <div className="home-feed-tab-top">
                    <span className="home-feed-tab-icon">{tab.icon}</span>
                    <span className="home-feed-tab-title">{tab.title}</span>
                    <span className={`home-feed-tab-badge ${tab.badgeClass}`}>
                      {tab.badge}
                    </span>
                  </div>
                  <div className="home-feed-tab-sub">
                    {tab.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="products-grid">
          {personalizedProducts.slice(0, Math.min(4, visibleCount)).map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              isWishlisted={isWishlisted?.(product.id)}
              onToggleWishlist={onToggleWishlist}
              isVideoCardSlot={videoSlotMap.has(product.id)}
              isActiveVideo={activeVideoId === product.id}
              onActivateVideo={setActiveVideoId}
              onOpenVideoModal={setSelectedVideoProduct}
              isSponsored={idx === 0 || initialAdCampaigns.some(c => c.status === 'active' && c.productId === product.id && c.type === 'discovery')}
            />
          ))}

          {/* 🔴 In-Grid Live Stream Card 2 */}
          <LiveStreamCard
            id="live-grid-2"
            channelName="Fashionista Studio"
            streamerAvatar="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80"
            title="👗 ไลฟ์ลองชุดคอลเลกชั่น 2026 • ซื้อ 1 แถม 1"
            viewers="920"
            videoUrl="/videos/live-streamer-2.mp4"
            posterImage="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80"
            pinnedProduct={{
              name: 'เดรสแฟชั่นสไตล์เกาหลี เรียบหรู',
              image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&q=80',
              price: 490,
              originalPrice: 990,
              discountPct: 51,
            }}
          />

          {personalizedProducts.slice(4, visibleCount).map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              isWishlisted={isWishlisted?.(product.id)}
              onToggleWishlist={onToggleWishlist}
              isVideoCardSlot={videoSlotMap.has(product.id)}
              isActiveVideo={activeVideoId === product.id}
              onActivateVideo={setActiveVideoId}
              onOpenVideoModal={setSelectedVideoProduct}
            />
          ))}
        </div>

        {/* Infinite Scroll Sentinel / Loading Indicator */}
        {visibleCount < personalizedProducts.length ? (
          <div
            ref={sentinelRef}
            className="home-feed-sentinel"
            aria-live="polite"
            onClick={handleLoadMore}
          >
            <div className="home-feed-loading-state">
              <div className="home-feed-spinner" />
              <span>
                {isLoadingMore
                  ? `กำลังโหลดสินค้าเพิ่มเติม... (${visibleCount}/${personalizedProducts.length})`
                  : `เลื่อนลงเพื่อโหลดต่อ หรือแตะที่นี่ (${visibleCount}/${personalizedProducts.length})`}
              </span>
            </div>
          </div>
        ) : (
          <div className="home-feed-end-state" role="status">
            <div className="home-feed-end-line" />
            <span className="home-feed-end-text">
              🎉 คุณได้ดูสินค้าครบทั้งหมด {personalizedProducts.length} รายการแล้ว
            </span>
            <div className="home-feed-end-line" />
          </div>
        )}
      </section>

      {/* 🎬 Video Review Full-Screen Modal Viewer */}
      {selectedVideoProduct && (
        <div className="home-video-modal-backdrop" onClick={() => setSelectedVideoProduct(null)}>
          <div className="home-video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="home-video-modal-close"
              onClick={() => setSelectedVideoProduct(null)}
              title="ปิด"
            >
              <X size={18} />
            </button>

            <div className="home-video-modal-player-wrap">
              <video
                src={selectedVideoProduct.videoReview?.videoUrl || selectedVideoProduct.videoUrl}
                poster={selectedVideoProduct.images[0]}
                controls
                autoPlay
                playsInline
                className="home-video-modal-player"
              />
            </div>

            <div className="home-video-modal-info">
              <div className="home-video-modal-creator">
                {selectedVideoProduct.videoReview?.creatorAvatar ? (
                  <img
                    src={selectedVideoProduct.videoReview.creatorAvatar}
                    alt=""
                    className="home-video-modal-creator-img"
                  />
                ) : (
                  <div className="home-video-modal-creator-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2563EB', color: '#FFF' }}>🎬</div>
                )}
                <div>
                  <h4 className="home-video-modal-creator-title">
                    {selectedVideoProduct.videoReview?.creatorName ? `รีวิวโดย @${selectedVideoProduct.videoReview.creatorName}` : 'คลิปรีวิวจริงจากผู้ใช้งาน'}
                  </h4>
                  <p className="home-video-modal-creator-sub">
                    🎥 ทดลองใช้งานจริง • การันตีรีวิวแท้ 100%
                  </p>
                </div>
              </div>

              <div className="home-video-modal-product-card">
                <img
                  src={selectedVideoProduct.images[0]}
                  alt=""
                  className="home-video-modal-product-img"
                />
                <div className="home-video-modal-product-details">
                  <h5 className="home-video-modal-product-name">{selectedVideoProduct.name}</h5>
                  <div className="home-video-modal-product-price">
                    ฿{selectedVideoProduct.price.toLocaleString()}
                  </div>
                </div>
                <button
                  className="home-video-modal-buy-btn"
                  onClick={() => {
                    onAddToCart(selectedVideoProduct);
                    setSelectedVideoProduct(null);
                  }}
                >
                  <ShoppingCart size={14} /> ใส่ตะกร้า
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default HomePage;

