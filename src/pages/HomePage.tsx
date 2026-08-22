import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Zap, ChevronLeft, ChevronRight, X, ShoppingCart } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { LiveStreamCard } from '../components/LiveStreamCard';
import { products as staticProducts, categories, banners, subBanners } from '../data/products';
import { stores } from '../data/stores';
import { mockLiveStreams } from '../data/liveStreams';
import { famousBrands } from '../data/brands';
import { initialAdCampaigns } from '../data/mockAdsData';
import { getProductUrl } from '../utils/seo';
import { LocalizedLink as Link } from '../i18n/LocalizedLink';
import { formatCompactNumber, formatCurrency, formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import type { Product } from '../types';
import './HomePage.css';

interface HomePageProps {
  products?: Product[];
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
  { id: 'live', icon: '🔴', link: '/live' },
  { id: 'mall', icon: '👑', link: '/mall' },
  { id: 'flashSale', icon: '⚡', link: '/flash-sale' },
  { id: 'vouchers', icon: '🎟️', link: '/vouchers' },
  { id: 'games', icon: '🎮', link: '/games' },
  { id: 'tracking', icon: '🚚', link: '/tracking' },
  { id: 'compare', icon: '⚖️', link: '/compare' },
  { id: 'affiliate', icon: '💰', link: '/affiliate' },
];

const FEED_TABS = [
  {
    id: 'foryou' as const,
    titleKey: 'home.feed.tabs.forYou.title',
    subtitleKey: 'home.feed.tabs.forYou.subtitle',
    icon: '✨',
    badgeKey: 'home.feed.tabs.forYou.badge',
    badgeClass: 'feed-badge-blue',
    accentColor: '#2563EB',
  },
  {
    id: 'bestseller' as const,
    titleKey: 'home.feed.tabs.bestSeller.title',
    subtitleKey: 'home.feed.tabs.bestSeller.subtitle',
    icon: '🔥',
    badgeKey: 'home.feed.tabs.bestSeller.badge',
    badgeClass: 'feed-badge-orange',
    accentColor: '#EA580C',
  },
  {
    id: 'deals' as const,
    titleKey: 'home.feed.tabs.deals.title',
    subtitleKey: 'home.feed.tabs.deals.subtitle',
    icon: '⚡',
    badgeKey: 'home.feed.tabs.deals.badge',
    badgeClass: 'feed-badge-red',
    accentColor: '#DC2626',
  },
  {
    id: 'mall' as const,
    titleKey: 'home.feed.tabs.mall.title',
    subtitleKey: 'home.feed.tabs.mall.subtitle',
    icon: '👑',
    badgeKey: 'home.feed.tabs.mall.badge',
    badgeClass: 'feed-badge-purple',
    accentColor: '#7C3AED',
  },
];

import { fetchActiveLiveStreamsApi } from '../utils/api';
import { onImageError } from '../utils/imageFallback';

export function HomePage({ products: propProducts, onAddToCart, isWishlisted, onToggleWishlist }: HomePageProps) {
  const { t, i18n } = useTranslation(['catalog', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const { h, m, s } = useCountdown(4 * 3600 + 32 * 60 + 15);
  const sourceProducts = propProducts || staticProducts;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [feedTab, setFeedTab] = useState<'foryou' | 'bestseller' | 'deals' | 'mall'>('foryou');
  const [visibleCount, setVisibleCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [selectedVideoProduct, setSelectedVideoProduct] = useState<Product | null>(null);
  const [liveStreamsList, setLiveStreamsList] = useState<any[]>(mockLiveStreams);
  const featuredLive = liveStreamsList[0];

  useEffect(() => {
    async function loadLiveChannels() {
      try {
        const res = await fetchActiveLiveStreamsApi();
        if (res && Array.isArray(res.streams) && res.streams.length > 0) {
          const mapped = res.streams.map((s: any) => ({
            id: s.id,
            type: 'live',
            storeId: s.storeId || 'store-techpro',
            channelName: s.store?.name || 'Movemall Official Live',
            storeLogo: s.store?.logo || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&q=80',
            streamerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
            streamerName: 'Live Host',
            caption: s.title,
            hashtags: ['#MovemallLive', '#ลดราคา', '#ของแท้'],
            soundTitle: 'เสียงต้นฉบับ - Movemall Live 🎵',
            category: 'electronics',
            viewers: Number(s.viewersCount || 1200),
            likesCount: s.likesCount || 10000,
            commentsCount: 250,
            sharesCount: 95,
            videoUrl: s.streamUrl,
            coverImage: s.coverImage,
            badge: '👑 OFFICIAL MALL',
            pinnedProduct: s.pinnedProduct || {
              id: 'el-1',
              name: 'ดีลพิเศษในไลฟ์',
              image: s.coverImage,
              price: 990,
              originalPrice: 1990,
              discountPct: 50,
            },
            comments: [],
          }));
          setLiveStreamsList(mapped);
        }
      } catch {
        // Fallback
      }
    }
    loadLiveChannels();
  }, [locale, t]);

  // AI Personalized Scoring Engine based on user affinity in localStorage
  const userInterest = typeof window !== 'undefined' ? localStorage.getItem('mm_user_interest') || 'electronics' : 'electronics';


  const personalizedProducts = [...sourceProducts].sort((a, b) => {
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
  const liveGridRef = useRef<HTMLDivElement>(null);

  const scrollFlashGrid = (direction: 'left' | 'right') => {
    if (flashGridRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      flashGridRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollLiveGrid = (direction: 'left' | 'right') => {
    if (liveGridRef.current) {
      const scrollAmount = liveGridRef.current.clientWidth * 0.85;
      liveGridRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
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
      <section className="hero" aria-label={t('catalog:home.hero.promotions')}>
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
                  onError={onImageError} />
                )}
                <div className="hero__slide-overlay" />
                <div className="hero__slide-content">
                  <span className="hero__slide-badge">
                    {t(`catalog:home.hero.banners.${banner.id}.badge`)}
                  </span>
                  <h2 className="hero__slide-title">{t(`catalog:home.hero.banners.${banner.id}.title`)}</h2>
                  <p className="hero__slide-desc">{t(`catalog:home.hero.banners.${banner.id}.subtitle`)}</p>
                  <Link to={banner.ctaLink} className="hero__slide-cta">
                    {t(`catalog:home.hero.banners.${banner.id}.cta`)}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ))}

            {/* Nav Arrows */}
            <button
              className="hero__nav-btn hero__nav-btn--prev"
              onClick={() => setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length)}
              aria-label={t('catalog:home.hero.previousSlide')}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="hero__nav-btn hero__nav-btn--next"
              onClick={() => setCurrentSlide(prev => (prev + 1) % banners.length)}
              aria-label={t('catalog:home.hero.nextSlide')}
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
                  aria-label={t('catalog:home.hero.goToSlide', { number: i + 1 })}
                />
              ))}
            </div>
          </div>

          <aside className="home-live-edit" aria-label="MOVEMALL LIVE">
            {featuredLive && (
              <Link
                to="/live"
                className="home-live-edit__preview"
                title={t('catalog:home.live.watchChannel', { channel: featuredLive.channelName })}
              >
                <video
                  src={featuredLive.videoUrl}
                  poster={featuredLive.coverImage}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="home-live-edit__video"
                />
                <div className="home-live-edit__overlay" />
                <div className="home-live-edit__content">
                  <span className="home-live-edit__status"><span /> LIVE</span>
                  <strong>{featuredLive.channelName}</strong>
                  <span className="home-live-edit__meta">
                    {formatCompactNumber(featuredLive.viewers, locale)} · {featuredLive.caption}
                  </span>
                  <span className="home-live-edit__cta">{t('catalog:home.live.shopLive')} <ArrowRight size={13} /></span>
                </div>
              </Link>
            )}
            <div className="home-live-edit__offers">
              {subBanners.map(sub => (
                <Link key={sub.id} to={sub.link} className="home-live-edit__offer">
                  <span>{t(`catalog:home.hero.subBanners.${sub.id}.tag`)}</span>
                  <strong>{t(`catalog:home.hero.subBanners.${sub.id}.title`)}</strong>
                </Link>
              ))}
            </div>
          </aside>
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
              {t('catalog:home.live.subtitle')}
            </span>
          </div>
          <div className="home-live-actions">
            <div className="home-live-nav-controls">
              <button
                type="button"
                className="home-live-arrow-btn"
                onClick={() => scrollLiveGrid('left')}
                aria-label={t('catalog:home.flash.scrollLeft')}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="home-live-arrow-btn"
                onClick={() => scrollLiveGrid('right')}
                aria-label={t('catalog:home.flash.scrollRight')}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <Link to="/live" className="home-live-viewall-btn">
              <span>{t('catalog:home.live.viewAll', { count: mockLiveStreams.length })}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <div className="home-live-grid" ref={liveGridRef}>
          {liveStreamsList.slice(0, 5).map(ch => (
            <Link
              key={ch.id}
              to="/live"
              className="home-live-card"
              title={t('catalog:home.live.watchChannel', { channel: ch.channelName })}
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
                  {formatCompactNumber(ch.viewers, locale)}
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
                    {formatCurrency(ch.pinnedProduct?.price ?? 0, locale)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="container">
        <nav className="quick-access-bar" aria-label={t('catalog:home.shortcuts.ariaLabel')}>
          {QUICK_SHORTCUTS.map(sc => (
            <Link key={sc.id} to={sc.link} className="quick-access-item">
              <div className="quick-access-icon-box">{sc.icon}</div>
              <span className="quick-access-label">{t(`catalog:home.shortcuts.items.${sc.id}`)}</span>
            </Link>
          ))}
        </nav>
      </div>

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
                {t('catalog:home.flash.heading')}
              </h2>
              {/* Countdown Timer */}
              <div className="home-flash-timer-wrap">
                <span className="home-flash-timer-label">{t('catalog:home.flash.endsIn')}</span>
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
                <span>{t('catalog:home.flash.liveBuyers', { count: 18 })}</span>
              </div>
            </div>

            <div className="home-flash-right-actions">
              <div className="home-flash-nav-controls">
                <button
                  type="button"
                  className="home-flash-arrow-btn"
                  onClick={() => scrollFlashGrid('left')}
                  aria-label={t('catalog:home.flash.scrollLeft')}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="home-flash-arrow-btn"
                  onClick={() => scrollFlashGrid('right')}
                  aria-label={t('catalog:home.flash.scrollRight')}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <Link to="/flash-sale" className="home-flash-view-all">
                {t('catalog:home.flash.viewAll')} <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Flash Sale Products Horizontal Grid Carousel */}
          <div className="home-flash-grid" ref={flashGridRef}>
            {sourceProducts.slice(0, 6).map((product, idx) => {
              const discountPct = [55, 60, 48, 70, 65, 50][idx % 6];
              const flashPrice = Math.round(product.price * (1 - discountPct / 100));
              const soldPct = [88, 94, 76, 96, 82, 91][idx % 6];

              return (
                <div key={product.id} className="home-flash-card">
                  {/* Image & Discount Badge */}
                  <Link to={getProductUrl(product)} className="home-flash-img-wrap">
                    <img src={product.images[0]} alt={product.name} className="home-flash-img" onError={onImageError} />
                    <span className="home-flash-tag">{t('catalog:home.flash.discount', { discount: discountPct })}</span>
                    <span className="home-flash-guarantee">{t('catalog:home.flash.lowestPrice')}</span>
                  </Link>

                  {/* Info */}
                  <div className="home-flash-info">
                    <Link to={getProductUrl(product)} className="home-flash-name">
                      {product.name}
                    </Link>

                    <div className="home-flash-price-row">
                      <span className="home-flash-price">{formatCurrency(flashPrice ?? 0, locale)}</span>
                      <span className="home-flash-orig">{formatCurrency(product.price ?? 0, locale)}</span>
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
                        {soldPct > 90
                          ? t('catalog:home.flash.soldUrgent', { percent: soldPct })
                          : t('catalog:home.flash.sold', { percent: soldPct })}
                      </span>
                    </div>

                    {/* Add to Cart Quick Action */}
                    <button
                      className="home-flash-buy-btn"
                      onClick={() => onAddToCart({ ...product, price: flashPrice })}
                    >
                      <Zap size={13} fill="#FFFFFF" /> {t('catalog:home.flash.buyNow')}
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
              <span className="home-category-tag-badge">{t('catalog:home.categories.eyebrow')}</span>
              <span className="home-category-count-badge">
              {t('catalog:home.categories.count', { count: categories.length })}
              </span>
            </div>
            <h2 id="categories-heading" className="home-category-main-title">
              {t('catalog:home.categories.title')}
            </h2>
            <p className="home-category-subtitle">
              {t('catalog:home.categories.subtitle')}
            </p>
          </div>

          <div className="home-category-actions">
            <div className="home-category-perks">
              <div className="home-category-perk-chip">
                <span>{t('catalog:home.categories.deals', { count: 160 })}</span>
              </div>
              <div className="home-category-perk-chip">
                <span>{t('catalog:home.categories.updatedDaily')}</span>
              </div>
            </div>
            <Link to="/shop" className="home-category-viewall-btn">
              <span>{t('catalog:home.categories.viewAll', { count: categories.length })}</span>
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
              aria-label={t('catalog:home.categories.categoryAria', {
                category: t(`catalog:categories.${cat.id}.name`),
                count: cat.productCount,
              })}
            >
              <div className="category-card__img-wrap">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=240&q=80'}
                  alt={t(`catalog:categories.${cat.id}.name`)}
                  className="category-card__img"
                  loading="lazy"
                onError={onImageError} />
                {cat.tag && (
                  <span className="category-card__tag-pill">
                    {t(`catalog:categories.${cat.id}.tag`)}
                  </span>
                )}
                <span className="category-card__icon-badge">
                  {cat.icon}
                </span>
              </div>
              <div className="category-card__info">
                <span className="category-card__name">{t(`catalog:categories.${cat.id}.name`)}</span>
                <span className="category-card__count">{t('catalog:home.categories.categoryDeals', { count: cat.productCount })}</span>
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
            <span className="home-mall-badge">{t('catalog:home.mall.badge')}</span>
            <h2 id="mall-heading" className="home-mall-title">
              {t('catalog:home.mall.title')}
            </h2>
            <div className="home-mall-guarantees">
              <span>{t('catalog:home.mall.authentic')}</span>
              <span>•</span>
              <span>{t('catalog:home.mall.returns')}</span>
              <span>•</span>
              <span>{t('catalog:home.mall.shipping')}</span>
            </div>
          </div>
          <Link to="/mall" className="home-mall-viewall-btn">
            {t('catalog:home.mall.viewAll')} <ArrowRight size={13} />
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
              onError={onImageError} />
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
            {t('catalog:home.stores.title')}
          </h2>
          <Link to="/stores" className="section__view-all">
            {t('catalog:home.stores.viewAll', { count: stores.length })} <ChevronRight size={14} />
          </Link>
        </div>

        <div className="home-stores-compact-grid">
          {stores.slice(0, 4).map(st => {
            const storeProducts = sourceProducts.filter(p => p.storeId === st.id).slice(0, 3);
            return (
              <div key={st.id} className="home-store-card-compact">
                <div
                  className="home-store-card-top-bar"
                  style={{ background: st.banner || 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' }}
                >
                  <span className="home-store-badge-small">
                    {st.badge === 'official' ? t('catalog:home.stores.official') : t('catalog:home.stores.preferred')}
                  </span>
                  <span className="home-store-followers-small">
                    {t('catalog:home.stores.followers', { count: st.followerCount })}
                  </span>
                </div>
                <div className="home-store-card-content">
                  <div className="home-store-card-profile-row">
                    <Link to={`/store/${st.id}`}>
                      <img src={st.logo} alt={st.name} className="home-store-card-logo" onError={onImageError} />
                    </Link>
                    <div className="home-store-card-title-box">
                      <Link to={`/store/${st.id}`} className="home-store-card-name-link">
                        <h3 className="home-store-card-name">{st.name}</h3>
                      </Link>
                      <div className="home-store-card-sub-info">
                        <span className="home-store-card-rating">⭐ {st.rating}</span>
                        <span className="home-store-card-voucher">{t('catalog:home.stores.voucher', { amount: formatCurrency(50, locale) })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="home-store-card-thumbs">
                    {storeProducts.map(prod => (
                      <Link key={prod.id} to={getProductUrl(prod)} className="home-store-card-thumb-item" title={prod.name}>
                        <img src={prod.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'} alt={prod.name} loading="lazy" onError={onImageError} />
                        <span className="home-store-card-thumb-price">{formatCurrency(prod.price ?? 0, locale)}</span>
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
      <section className="section container" aria-label={t('catalog:home.rewards.ariaLabel')}>
        <Link
          to="/games"
          className="home-games-promo-strip"
        >
          <div className="home-games-promo-left">
            <div className="home-games-promo-icons">🎡 🎮 🎁</div>
            <div>
              <div className="home-games-promo-badge">{t('catalog:home.rewards.eyebrow')}</div>
              <h3 className="home-games-promo-title">
                {t('catalog:home.rewards.title')}
              </h3>
              <p className="home-games-promo-desc">
                {t('catalog:home.rewards.description')}
              </p>
            </div>
          </div>
          <div className="home-games-promo-cta">
            <span>{t('catalog:home.rewards.play')}</span>
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
                <span className="home-feed-tag-badge">{t('catalog:home.feed.eyebrow')}</span>
                <span className="home-feed-live-badge">
                  <span className="home-feed-live-dot" />
                  {t('catalog:home.feed.realtime')}
                </span>
              </div>
              <h2 id="all-heading" className="home-feed-main-title">
                {t('catalog:home.feed.title')}
              </h2>
              <p className="home-feed-subtitle">
                {t(`catalog:home.feed.descriptions.${feedTab}`)}
              </p>
            </div>

            <div className="home-feed-header-perks">
              <div className="home-feed-perk-item">
                <span>{t('catalog:home.feed.deals', { count: 160 })}</span>
              </div>
              <div className="home-feed-perk-item">
                <span>{t('catalog:home.feed.freeShipping')}</span>
              </div>
            </div>
          </div>

          {/* Modern Interactive Tab Cards Grid */}
          <div className="home-feed-tabs-grid" role="tablist" aria-label={t('catalog:home.feed.tabsAria')}>
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
                    <span className="home-feed-tab-title">{t(`catalog:${tab.titleKey}`)}</span>
                    <span className={`home-feed-tab-badge ${tab.badgeClass}`}>
                      {t(`catalog:${tab.badgeKey}`)}
                    </span>
                  </div>
                  <div className="home-feed-tab-sub">
                    {t(`catalog:${tab.subtitleKey}`)}
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
            title="👗 ไลฟ์ลองชุดคอลเลกชั่น 2026 • ซื้อ 1 แถม 1" /* i18n-allow-user-content: simulated live-stream caption, not UI chrome */
            viewers={920}
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
                  ? t('catalog:home.feed.loadingProgress', {
                    visible: formatNumber(visibleCount, locale),
                    total: formatNumber(personalizedProducts.length, locale),
                  })
                  : t('catalog:home.feed.viewMoreProgress', {
                    visible: formatNumber(visibleCount, locale),
                    total: formatNumber(personalizedProducts.length, locale),
                  })}
              </span>
            </div>
          </div>
        ) : (
          <div className="home-feed-end-state" role="status">
            <div className="home-feed-end-line" />
            <span className="home-feed-end-text">
              {t('catalog:home.feed.end', { count: personalizedProducts.length })}
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
              title={t('common:actions.close')}
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
                  onError={onImageError} />
                ) : (
                  <div className="home-video-modal-creator-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2563EB', color: '#FFF' }}>🎬</div>
                )}
                <div>
                  <h4 className="home-video-modal-creator-title">
                    {selectedVideoProduct.videoReview?.creatorName
                      ? t('catalog:product.card.reviewBy', { creator: selectedVideoProduct.videoReview.creatorName })
                      : t('catalog:home.video.realUserReview')}
                  </h4>
                  <p className="home-video-modal-creator-sub">
                    {t('catalog:home.video.verifiedReview')}
                  </p>
                </div>
              </div>

              <div className="home-video-modal-product-card">
                <img
                  src={selectedVideoProduct.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                  alt=""
                  className="home-video-modal-product-img"
                onError={onImageError} />
                <div className="home-video-modal-product-details">
                  <h5 className="home-video-modal-product-name">{selectedVideoProduct.name}</h5>
                  <div className="home-video-modal-product-price">
                    {formatCurrency(selectedVideoProduct.price ?? 0, locale)}
                  </div>
                </div>
                <button
                  className="home-video-modal-buy-btn"
                  onClick={() => {
                    onAddToCart(selectedVideoProduct);
                    setSelectedVideoProduct(null);
                  }}
                >
                  <ShoppingCart size={14} /> {t('catalog:product.card.addToCart')}
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
