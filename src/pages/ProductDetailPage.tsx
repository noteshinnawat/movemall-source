import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, Minus, Plus, Store as StoreIcon, MessageSquare, ShieldCheck, ChevronLeft, ChevronRight, Play, Video, Share2, Check, X, CreditCard, Sparkles, Loader2, Flag } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ReviewsSection } from '../components/ReviewsSection';
import { ReportStoreModal } from '../components/ReportStoreModal';
import { products as staticProducts } from '../data/products';
import { getStoreById, stores } from '../data/stores';
import { mockLiveStreams } from '../data/liveStreams';
import { parseRichText } from '../components/RichTextEditor';
import { extractProductId, getProductUrl, updateProductSEO } from '../utils/seo';
import { LocalizedLink as Link, useLocalizedPath } from '../i18n/LocalizedLink';
import { formatCurrency, formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import { getDemoProductOptionKeys, getProductPerkInterpolation } from './ProductDetailPage.behavior';
import type { Product } from '../types';
import './ProductDetailPage.css';

interface ProductDetailPageProps {
  products?: Product[];
  onAddToCart: (product: Product, qty: number) => void;
  isWishlisted?: (productId: string) => boolean;
  onToggleWishlist?: (product: Product) => void;
  cartCount?: number;
  onOpenVisualSearchWithImage?: (imageUrl: string) => void;
}

const PERKS = [
  { icon: '🚚', textKey: 'product.perks.freeShipping', threshold: 299 },
  { icon: '↩️', textKey: 'product.perks.returns' },
  { icon: '🔒', textKey: 'product.perks.securePayment' },
  { icon: '⚡', textKey: 'product.perks.authentic' },
];

export function ProductDetailPage({
  products: propProducts,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  cartCount = 0,
  onOpenVisualSearchWithImage,
}: ProductDetailPageProps) {
  const { t, i18n } = useTranslation(['catalog', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const { id: rawId } = useParams<{ id: string }>();
  const id = extractProductId(rawId);
  const navigate = useNavigate();
  const localizePath = useLocalizedPath();
  const sourceProducts = propProducts || staticProducts;
  const product = sourceProducts.find(p => p.id === id || p.id === rawId);
  const store = (product?.storeId && getStoreById(product.storeId)) || stores[0];
  const activeLive = mockLiveStreams.find(s => s.storeId === product?.storeId && s.type === 'live');

  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerAction, setDrawerAction] = useState<'cart' | 'buy'>('cart');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedInstallment, setSelectedInstallment] = useState<string>('full');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [recommendedTab, setRecommendedTab] = useState<'foryou' | 'bestseller' | 'deals'>('foryou');
  const [visibleRecommendedCount, setVisibleRecommendedCount] = useState(12);
  const [isLoadingMoreRecommended, setIsLoadingMoreRecommended] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const storeScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const touchStartXRef = useRef(0);

  // Scroll to top immediately when product page opens or id changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    setSelectedImg(0);
    setQty(1);
  }, [id]);

  function handleShareProduct() {
    try {
      const shareUrl = product ? `${window.location.origin}${localizePath(getProductUrl(product))}` : window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
      }
      alert(t('catalog:product.shareCopied'));
    } catch {}
  }

  function handleScrollStore(direction: 'left' | 'right') {
    if (!storeScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    storeScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!storeScrollRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - storeScrollRef.current.offsetLeft;
    scrollLeftRef.current = storeScrollRef.current.scrollLeft;
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDraggingRef.current || !storeScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - storeScrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    storeScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  }

  function handleMouseUp() {
    isDraggingRef.current = false;
  }

  // SEO Schema.org, Open Graph, Meta & Canonical URL Synchronization
  useEffect(() => {
    if (!product) return;

    // Track user interest for AI Personalized Feed on Homepage
    try {
      localStorage.setItem('mm_user_interest', product.category);
    } catch {}

    // Update comprehensive SEO Meta, Social & JSON-LD
    updateProductSEO(product, store?.name);

    // If accessed with legacy non-SEO URL, gracefully replace browser history URL without reloading
    const canonicalSeoUrl = localizePath(getProductUrl(product));
    if (window.location.pathname !== canonicalSeoUrl) {
      window.history.replaceState(null, '', canonicalSeoUrl + window.location.search);
    }
  }, [localizePath, product, store]);

  const productId = product?.id;
  const productStoreId = product?.storeId;
  const productCategory = product?.category || 'all';
  const storeProducts = product
    ? sourceProducts.filter(p => p.storeId === productStoreId && p.id !== productId).slice(0, 8)
    : [];
  const related = product
    ? sourceProducts.filter(p => p.category === productCategory && p.id !== productId && p.storeId !== productStoreId).slice(0, 8)
    : [];
  const safeRating = product?.rating ?? 5;
  const fullStars = Math.min(5, Math.max(0, Math.floor(safeRating)));
  const stars = '★'.repeat(fullStars) + '☆'.repeat(Math.max(0, 5 - fullStars));
  const productPrice = product?.price ?? 0;
  const productOrigPrice = product?.originalPrice ?? 0;
  const discount = productOrigPrice > productPrice && productOrigPrice > 0
    ? Math.round(((productOrigPrice - productPrice) / productOrigPrice) * 100)
    : null;
  const totalPrice = productPrice * qty;
  const savings = productOrigPrice > productPrice ? (productOrigPrice - productPrice) * qty : 0;

  const userInterest = typeof window !== 'undefined' ? localStorage.getItem('mm_user_interest') || productCategory : productCategory;

  const recommendedProducts = product ? [...sourceProducts]
    .filter(p => p.id !== productId)
    .sort((a, b) => {
      if (recommendedTab === 'foryou') {
        const aScore = (a.category === productCategory ? 40 : a.category === userInterest ? 25 : 0) + (a.rating ?? 5) * 10 + (a.badge === 'sale' ? 15 : 0);
        const bScore = (b.category === productCategory ? 40 : b.category === userInterest ? 25 : 0) + (b.rating ?? 5) * 10 + (b.badge === 'sale' ? 15 : 0);
        return bScore - aScore;
      }
      if (recommendedTab === 'bestseller') {
        return ((b.reviewCount ?? 0) * (b.rating ?? 5)) - ((a.reviewCount ?? 0) * (a.rating ?? 5));
      }
      if (recommendedTab === 'deals') {
        const aOrig = a.originalPrice ?? 0;
        const aPrice = a.price ?? 0;
        const aDisc = aOrig > 0 && aPrice > 0 ? (aOrig - aPrice) / aOrig : 0;
        const bOrig = b.originalPrice ?? 0;
        const bPrice = b.price ?? 0;
        const bDisc = bOrig > 0 && bPrice > 0 ? (bOrig - bPrice) / bOrig : 0;
        return bDisc - aDisc;
      }
      return 0;
    }) : [];

  const displayedRecommended = recommendedProducts.slice(0, visibleRecommendedCount);

  // Auto-Load Infinite Scroll for Recommended Products
  const handleLoadMoreRecommended = useCallback(() => {
    if (isLoadingMoreRecommended) return;
    setIsLoadingMoreRecommended(true);
    setTimeout(() => {
      setVisibleRecommendedCount((prev) => Math.min(prev + 12, recommendedProducts.length));
      setIsLoadingMoreRecommended(false);
    }, 300);
  }, [isLoadingMoreRecommended, recommendedProducts.length]);

  // Window scroll fallback listener
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (visibleRecommendedCount < recommendedProducts.length && !isLoadingMoreRecommended) {
            const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;
            if (scrollY + windowHeight >= docHeight - 750) {
              handleLoadMoreRecommended();
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleRecommendedCount, recommendedProducts.length, isLoadingMoreRecommended, handleLoadMoreRecommended]);

  // IntersectionObserver on sentinel element
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting && visibleRecommendedCount < recommendedProducts.length && !isLoadingMoreRecommended) {
          handleLoadMoreRecommended();
        }
      },
      {
        root: null,
        rootMargin: '400px',
        threshold: 0.1,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleRecommendedCount, recommendedProducts.length, isLoadingMoreRecommended, handleLoadMoreRecommended]);

  // Reset count on tab or product switch
  useEffect(() => {
    setVisibleRecommendedCount(12);
  }, [id, recommendedTab]);

  if (!product) {
    return (
      <div className="product-detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
          <h1 style={{ marginBottom: 8 }}>{t('catalog:product.notFound')}</h1>
          <Link to="/shop" style={{ color: 'var(--primary-light)' }}>{t('catalog:product.backToShop')}</Link>
        </div>
      </div>
    );
  }

  const mediaList = [
    ...(product.videoUrl ? [{ type: 'video' as const, url: product.videoUrl, poster: (product.images && product.images[0]) || '' }] : []),
    ...((product.images || []).map(img => ({ type: 'image' as const, url: img })))
  ];
  const currentMedia = mediaList[selectedImg] || mediaList[0];
  const colorOptions = getDemoProductOptionKeys(product.category);
  const selectedOptionKey = selectedColor || colorOptions[0];
  const selectedOptionLabel = t(`catalog:${selectedOptionKey}`);

  const installmentOptions = [
    {
      id: 'full',
      label: t('catalog:product.installments.full'),
      desc: formatCurrency(totalPrice ?? 0, locale),
      tag: t('catalog:product.installments.popular'),
    },
    {
      id: '3m',
      label: t('catalog:product.installments.months', { count: 3 }),
      desc: t('catalog:product.installments.perMonth', { amount: formatCurrency(Math.round((totalPrice ?? 0) / 3), locale) }),
      tag: t('catalog:product.installments.zeroInterest'),
    },
    {
      id: '6m',
      label: t('catalog:product.installments.months', { count: 6 }),
      desc: t('catalog:product.installments.perMonth', { amount: formatCurrency(Math.round((totalPrice ?? 0) / 6), locale) }),
      tag: 'Movemall PayLater',
    },
    ...(totalPrice >= 3000 ? [{
      id: '10m',
      label: t('catalog:product.installments.months', { count: 10 }),
      desc: t('catalog:product.installments.perMonth', { amount: formatCurrency(Math.round((totalPrice ?? 0) / 10), locale) }),
      tag: t('catalog:product.installments.minimumTag', { amount: formatCurrency(3000, locale) }),
    }] : []),
  ];

  function openAddToCartDrawer() {
    setDrawerAction('cart');
    setIsDrawerOpen(true);
  }

  function openBuyNowDrawer() {
    setDrawerAction('buy');
    setIsDrawerOpen(true);
  }

  function handleConfirmDrawer() {
    if (!product) return;
    onAddToCart(product, qty);
    setIsDrawerOpen(false);
    if (drawerAction === 'buy') {
      navigate(localizePath('/checkout'));
    }
  }

  function handleAddToCart() {
    openAddToCartDrawer();
  }

  function handleBuyNow() {
    openBuyNowDrawer();
  }

  function handleGoBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(localizePath('/shop'));
    }
  }

  return (
    <main className="product-detail">
      <div className="container">
        {/* Desktop Breadcrumbs & Back Navigation */}
        <nav className="product-detail__top-nav" aria-label={t('catalog:product.breadcrumbAria')}>
          <button
            type="button"
            className="product-detail__back-nav-btn"
            onClick={handleGoBack}
            aria-label={t('catalog:product.backAria')}
          >
            <ArrowLeft size={16} /> {t('common:actions.back')}
          </button>
          <div className="product-detail__breadcrumbs">
            <Link to="/">{t('catalog:product.home')}</Link>
            <span className="product-detail__breadcrumb-sep">/</span>
            <Link to="/shop">{t('catalog:product.allProducts')}</Link>
            <span className="product-detail__breadcrumb-sep">/</span>
            <Link to={`/shop?category=${product.category}`}>
              {t(`catalog:categories.${product.category}.name`, { defaultValue: product.category })}
            </Link>
            <span className="product-detail__breadcrumb-sep">/</span>
            <span className="product-detail__breadcrumb-current">{product.name}</span>
          </div>
        </nav>

        {/* Main: Gallery + Info */}
        <div className="product-detail__main">
          {/* Gallery */}
          <div className="product-detail__gallery">
            <div
              className="product-detail__main-media-wrap"
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                const diff = touchStartXRef.current - e.changedTouches[0].clientX;
                if (diff > 40) {
                  // Swipe left -> Next image
                  setSelectedImg((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
                } else if (diff < -40) {
                  // Swipe right -> Prev image
                  setSelectedImg((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
                }
              }}
            >
              {/* Shopee / TikTok Style Floating Navigation & Actions Overlay */}
              <div className="product-floating-top-bar" aria-label={t('catalog:product.topControls')}>
                <button
                  type="button"
                  className="product-float-btn"
                  onClick={handleGoBack}
                  aria-label={t('common:actions.back')}
                  title={t('common:actions.back')}
                >
                  <ArrowLeft size={22} />
                </button>

                <div className="product-float-right-group">
                  <button
                    type="button"
                    className="product-float-btn"
                    onClick={() => setIsReportModalOpen(true)}
                    aria-label={t('catalog:product.reportAria')}
                    title={t('catalog:product.reportTitle')}
                    style={{ color: '#DC2626' }}
                  >
                    <Flag size={18} />
                  </button>

                  <button
                    type="button"
                    className="product-float-btn"
                    onClick={handleShareProduct}
                    aria-label={t('catalog:product.share')}
                    title={t('catalog:product.share')}
                  >
                    <Share2 size={20} />
                  </button>

                  <button
                    type="button"
                    className={`product-float-btn${isWishlisted?.(product.id) ? ' product-float-btn--wished' : ''}`}
                    onClick={() => onToggleWishlist?.(product)}
                    aria-label={t('catalog:product.saveFavorite')}
                    title={t('catalog:product.saveFavorite')}
                  >
                    <Heart
                      size={20}
                      fill={isWishlisted?.(product.id) ? '#EF4444' : 'none'}
                      color={isWishlisted?.(product.id) ? '#EF4444' : 'currentColor'}
                    />
                  </button>

                  <Link
                    to="/cart"
                    className="product-float-btn product-float-cart-link"
                    aria-label={t('catalog:product.viewCart')}
                    title={t('catalog:product.viewCart')}
                  >
                    <ShoppingBag size={20} />
                    {cartCount > 0 && (
                      <span className="product-float-cart-badge">{formatNumber(cartCount, locale)}</span>
                    )}
                  </Link>
                </div>
              </div>

              {currentMedia?.type === 'video' ? (
                <>
                  <video
                    src={currentMedia.url}
                    poster={currentMedia.poster}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="product-detail__main-video"
                  />
                  <div className="product-detail__video-tag">
                    <Video size={12} />
                    <span>{t('catalog:product.demoVideo')}</span>
                  </div>
                </>
              ) : (
                <img
                  src={currentMedia?.url || product.images?.[0] || ''}
                  alt={product.name}
                  className="product-detail__main-image"
                />
              )}

              {currentMedia?.type !== 'video' && onOpenVisualSearchWithImage && (
                <button
                  type="button"
                  className="product-detail__visual-search"
                  onClick={() => onOpenVisualSearchWithImage(currentMedia?.url || product.images?.[0] || '')}
                  aria-label={t('catalog:product.visualSearchAria')}
                >
                  <Sparkles size={15} />
                  <span>{t('catalog:product.visualSearch')}</span>
                </button>
              )}

              {/* Navigation Arrows for Previous / Next Image */}
              {mediaList.length > 1 && (
                <>
                  <button
                    type="button"
                    className="product-detail__nav-arrow product-detail__nav-arrow--prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImg((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
                    }}
                    aria-label={t('catalog:product.previousImage')}
                    title={t('catalog:product.previousImage')}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    className="product-detail__nav-arrow product-detail__nav-arrow--next"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImg((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
                    }}
                    aria-label={t('catalog:product.nextImage')}
                    title={t('catalog:product.nextImage')}
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Image Counter Badge (e.g. 1/5) */}
                  <div className="product-detail__image-counter">
                    <span>{t('catalog:product.imagePosition', {
                      current: formatNumber(selectedImg + 1, locale),
                      total: formatNumber(mediaList.length, locale),
                    })}</span>
                  </div>
                </>
              )}
            </div>

            {/* Dots Indicator */}
            {mediaList.length > 1 && (
              <div className="product-detail__dots-indicator">
                {mediaList.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`product-detail__dot${selectedImg === i ? ' product-detail__dot--active' : ''}`}
                    onClick={() => setSelectedImg(i)}
                    aria-label={t('catalog:product.goToImage', { number: i + 1 })}
                  />
                ))}
              </div>
            )}

            {/* Thumbnails */}
            {mediaList.length > 1 && (
              <div className="product-detail__thumbnails">
                {mediaList.map((item, i) => (
                  item.type === 'video' ? (
                    <div
                      key="video-thumb"
                      className={`product-detail__thumb product-detail__thumb--video${selectedImg === i ? ' product-detail__thumb--active' : ''}`}
                      onClick={() => setSelectedImg(i)}
                      title={t('catalog:product.watchVideo')}
                    >
                      <img src={item.poster} alt={t('catalog:product.videoPreviewAlt')} />
                      <div className="product-detail__thumb-play-badge">
                        <Play size={12} fill="#FFFFFF" color="#FFFFFF" />
                        <span>VDO</span>
                      </div>
                    </div>
                  ) : (
                    <img
                      key={i}
                      src={item.url}
                      alt={t('catalog:product.imageAlt', { name: product.name, number: i + 1 })}
                      className={`product-detail__thumb${selectedImg === i ? ' product-detail__thumb--active' : ''}`}
                      onClick={() => setSelectedImg(i)}
                    />
                  )
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-detail__info">
            {product.badge && (
              <span className={`product-detail__badge product-detail__badge--${product.badge}`}>
                {t(`catalog:product.card.badges.${product.badge}`)}
              </span>
            )}

            <p className="product-detail__category">
              {t(`catalog:categories.${product.category}.name`, { defaultValue: product.category })}
            </p>
            <h1 className="product-detail__name">{product.name}</h1>

            {/* Rating */}
            <div className="product-detail__rating-row">
              <span className="product-detail__stars" aria-hidden="true">{stars}</span>
              <span className="product-detail__rating-num">{(product.rating ?? 5).toFixed(1)}</span>
              <span className="product-detail__review-count">{t('catalog:product.reviewCount', { count: product.reviewCount ?? 0 })}</span>
              <span className="product-detail__stock">
                {(product.stock ?? 0) > 10
                  ? t('catalog:product.inStock', { count: product.stock })
                  : t('catalog:product.lowStock', { count: product.stock ?? 0 })}
              </span>
            </div>

            {/* Price */}
            <div className="product-detail__price-block">
              <span className="product-detail__price">{formatCurrency(product.price ?? 0, locale)}</span>
              {Boolean(product.originalPrice && product.originalPrice > (product.price ?? 0)) && (
                <span className="product-detail__original-price">
                  {formatCurrency(product.originalPrice ?? 0, locale)}
                </span>
              )}
              {discount && (
                <span className="product-detail__discount">{t('catalog:product.discount', { discount })}</span>
              )}
            </div>

            {/* Quick Variation / Installment Selector Row (Click opens Slide-up Sheet) */}
            <div
              className="product-detail__var-row"
              onClick={openAddToCartDrawer}
              role="button"
              tabIndex={0}
              title={t('catalog:product.optionsHint')}
            >
              <div className="product-detail__var-left">
                <span className="product-detail__var-label">{t('catalog:product.optionsLabel')}</span>
                <span className="product-detail__var-value">{selectedOptionLabel}</span>
                <span className="product-detail__var-divider">•</span>
                <span className="product-detail__var-qty">{t('catalog:product.quantityItems', { count: qty })}</span>
                <span className="product-detail__var-divider">•</span>
                <span className="product-detail__var-tag">{t('catalog:product.installmentZero')}</span>
              </div>
              <span className="product-detail__var-btn-text">
                {t('catalog:product.change')}
              </span>
            </div>

            {/* Tags */}
            <div className="product-detail__tags">
              {(product.tags || []).map(tag => (
                <span key={tag} className="product-detail__tag">#{tag}</span>
              ))}
            </div>

            {/* Perks */}
            <div className="product-detail__perks">
              {PERKS.map(perk => (
                <div key={perk.textKey} className="product-detail__perk">
                  <span className="product-detail__perk-icon">{perk.icon}</span>
                  <span className="product-detail__perk-text">
                    {t(`catalog:${perk.textKey}`, perk.threshold === undefined
                      ? {}
                      : getProductPerkInterpolation(perk.threshold, locale))}
                  </span>
                </div>
              ))}
            </div>

            {/* e-Tax Guarantee Banner */}
            {(store?.badge === 'official' || store?.isMall || product.isMall || product.isVatRegistered) && (
              <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#1E40AF' }}>
                <span style={{ fontSize: '1.1rem' }}>🧾</span>
                <div>
                  {t('catalog:product.taxInvoiceBanner')}
                </div>
              </div>
            )}

            {/* Desktop Actions & Quantity Controls (Visible on Desktop / Tablets) */}
            <div className="product-detail__desktop-purchase-card">
              {/* Color / Variant Selector */}
              <div className="product-detail__desktop-var-group">
                <span className="product-detail__desktop-label">{t('catalog:product.colorOptions')}</span>
                <div className="product-detail__desktop-var-chips">
                  {colorOptions.map(optionKey => (
                    <button
                      key={optionKey}
                      type="button"
                      className={`product-detail__desktop-chip ${selectedOptionKey === optionKey ? 'selected' : ''}`}
                      onClick={() => setSelectedColor(optionKey)}
                    >
                      {t(`catalog:${optionKey}`)}
                      {selectedOptionKey === optionKey && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="product-detail__desktop-qty-row">
                <span className="product-detail__desktop-label">{t('catalog:product.quantity')}</span>
                <div className="product-detail__desktop-qty-box">
                  <button
                    type="button"
                    className="product-detail__desktop-qty-btn"
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="product-detail__desktop-qty-val">{qty}</span>
                  <button
                    type="button"
                    className="product-detail__desktop-qty-btn"
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="product-detail__desktop-stock-txt">
                  {t('catalog:product.totalStock', { count: product.stock })}
                </span>
              </div>

              {/* Action Buttons Row */}
              <div className="product-detail__desktop-btn-row">
                <button
                  type="button"
                  id="desktop-add-cart-btn"
                  className="product-detail__desktop-add-cart-btn"
                  onClick={handleAddToCart}
                >
                  <ShoppingBag size={18} />
                  <span>{t('catalog:product.addToCart')}</span>
                </button>

                <button
                  type="button"
                  id="desktop-buy-now-btn"
                  className="product-detail__desktop-buy-now-btn"
                  onClick={handleBuyNow}
                >
                  <CreditCard size={18} />
                  <span>{t('catalog:product.buyNowAmount', { amount: formatCurrency(totalPrice ?? 0, locale) })}</span>
                </button>

                {(() => {
                  const currentStore = (product.storeId && getStoreById(product.storeId)) || stores[0];
                  return (
                    <Link
                      to={`/chat?storeId=${currentStore.id}&source=product&ref=${product.id}&refName=${encodeURIComponent(product.name || '')}`}
                      className="product-detail__desktop-chat-btn"
                      title={t('catalog:product.chatStore')}
                    >
                      <MessageSquare size={18} />
                      <span>{t('catalog:product.chat')}</span>
                    </Link>
                  );
                })()}
              </div>
            </div>

            {/* Product Compliance & Standard Card (AI Verified) */}
            <div className="product-detail__compliance-card">
              <div className="product-detail__compliance-header">
                <div className="product-detail__compliance-title-group">
                  <ShieldCheck size={16} className="product-detail__compliance-icon" />
                  <span className="product-detail__compliance-title">{t('catalog:product.compliance.title')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                    {t('catalog:product.compliance.governmentActive')}
                  </span>
                  <span className="product-detail__compliance-badge">
                    {t('catalog:product.compliance.aiVerified', { score: 98 })}
                  </span>
                </div>
              </div>

              <div className="product-detail__compliance-grid">
                {product.compliance?.fdaNumber ? (
                  <div className="product-detail__compliance-item">
                    <span className="product-detail__compliance-label">{t('catalog:product.compliance.fdaNumber')}</span>
                    <div className="product-detail__compliance-value-wrap">
                      <strong className="product-detail__compliance-value" style={{ color: '#059669' }}>
                        {product.compliance.fdaNumber}
                      </strong>
                      <button
                        type="button"
                        className="product-detail__compliance-copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(product.compliance?.fdaNumber || '');
                          alert(t('catalog:product.compliance.copiedFda', { number: product.compliance?.fdaNumber }));
                        }}
                      >
                        {t('catalog:product.compliance.copy')}
                      </button>
                    </div>
                  </div>
                ) : (product.category === 'beauty' || product.category === 'food') ? (
                  <div className="product-detail__compliance-item">
                    <span className="product-detail__compliance-label">{t('catalog:product.compliance.fdaNumber')}</span>
                    <div className="product-detail__compliance-value-wrap">
                      <strong className="product-detail__compliance-value" style={{ color: '#059669' }}>
                        10-1-6500098765
                      </strong>
                      <button
                        type="button"
                        className="product-detail__compliance-copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText('10-1-6500098765');
                          alert(t('catalog:product.compliance.copiedFda', { number: '10-1-6500098765' }));
                        }}
                      >
                        {t('catalog:product.compliance.copy')}
                      </button>
                    </div>
                  </div>
                ) : null}

                {product.compliance?.tisiNumber ? (
                  <div className="product-detail__compliance-item">
                    <span className="product-detail__compliance-label">{t('catalog:product.compliance.tisiNumber')}</span>
                    <strong className="product-detail__compliance-value" style={{ color: '#2563EB' }}>
                      ⚡ {product.compliance.tisiNumber}
                    </strong>
                  </div>
                ) : (product.category === 'electronics' || product.category === 'home') ? (
                  <div className="product-detail__compliance-item">
                    <span className="product-detail__compliance-label">{t('catalog:product.compliance.tisiNumber')}</span>
                    <strong className="product-detail__compliance-value" style={{ color: '#2563EB' }}>
                      {t('catalog:product.compliance.defaultTisi')}
                    </strong>
                  </div>
                ) : null}

                <div className="product-detail__compliance-item">
                  <span className="product-detail__compliance-label">{t('catalog:product.compliance.countryOfOrigin')}</span>
                  <strong className="product-detail__compliance-value">
                    🌐 {product.compliance?.countryOfOrigin || (product.category === 'beauty' ? 'South Korea' : product.category === 'electronics' ? 'China' : 'Thailand')}
                  </strong>
                </div>

                {product.compliance?.halalNumber && (
                  <div className="product-detail__compliance-item">
                    <span className="product-detail__compliance-label">{t('catalog:product.compliance.halal')}</span>
                    <strong className="product-detail__compliance-value" style={{ color: '#059669' }}>
                      ☪️ {product.compliance.halalNumber}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Marketplace Store Widget */}
        {/* Store Live Stream Alert Banner (ถ้าทางร้านกำลังไลฟ์อยู่) */}
            {activeLive && (
              <div
                style={{
                  margin: 'var(--space-5) 0 0 0',
                  background: 'linear-gradient(90deg, #18181B 0%, #27272A 100%)',
                  border: '1.5px solid #EF4444',
                  borderRadius: 0,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
                }}
                onClick={() => navigate(localizePath('/live'))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    background: '#DC2626',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: 0,
                    letterSpacing: '0.5px',
                    boxShadow: '0 0 8px rgba(220, 38, 38, 0.6)',
                  }}>
                    🔴 LIVE
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>
                      {t('catalog:product.storeLive', {
                        store: store.name,
                        count: activeLive.viewers,
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: '#FBBF24' }}>
                      {t('catalog:product.livePromotion', { discount: 50 })}
                    </div>
                  </div>
                </div>

                <button
                  style={{
                    padding: '6px 14px',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 0,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {t('catalog:product.joinStoreLive')}
                </button>
              </div>
            )}

            {/* Unified Marketplace Store Showcase */}
            <div className="product-store-showcase">
              {/* Store Profile Header */}
              <div className="product-store-header">
                <div className="product-store-info-left">
                  <div className="product-store-logo-wrap">
                    <img
                      src={store.logo}
                      alt={store.name}
                      className={`product-store-logo ${activeLive ? 'product-store-logo--live' : ''}`}
                    />
                    {activeLive && (
                      <span className="product-store-live-badge">LIVE</span>
                    )}
                  </div>
                  <div>
                    <div className="product-store-name-row">
                      <h3 className="product-store-name">{store.name}</h3>
                      {store.badge === 'official' && (
                        <span className="product-store-badge-official">
                          <ShieldCheck size={11} /> {t('catalog:store.official')}
                        </span>
                      )}
                    </div>
                    <div className="product-store-meta">
                      <span className="store-meta-rating">{t('catalog:product.storeRating', {
                        rating: store.rating ?? 5,
                        count: store.reviewCount ?? 0,
                      })}</span>
                      <span className="store-meta-sep">•</span>
                      <span>{t('catalog:product.chatResponse', { rate: store.responseRate || '100%' })}</span>
                      <span className="store-meta-sep">•</span>
                      <span>📍 {store.location || t('catalog:store.defaultLocation')}</span>
                    </div>
                  </div>
                </div>

                <div className="product-store-actions">
                  <button
                    className="product-store-chat-btn"
                    onClick={() => navigate(localizePath(`/chat?store=${store.id}&source=product&ref=${product.id}&refName=${encodeURIComponent(product.name || '')}`))}
                  >
                    <MessageSquare size={14} />
                    {t('catalog:product.chatStore')}
                  </button>
                  <Link
                    to={`/store/${store.id}`}
                    className="product-store-visit-btn"
                  >
                    <StoreIcon size={14} />
                    {t('catalog:product.visitStore')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    style={{
                      padding: '6px 10px',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FECACA',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title={t('catalog:product.reportStoreTitle')}
                  >
                    <Flag size={12} />
                    {t('catalog:product.report')}
                  </button>
                </div>
              </div>

              {/* Other Products From This Store (Compact Mini Scroll Tray) */}
              {storeProducts.length > 0 && (
                <div className="product-store-products-tray">
                  <div className="product-store-products-header">
                    <div className="product-store-products-title">
                      <span>{t('catalog:product.storeRecommendations')}</span>
                      <span className="product-store-count-chip">{t('catalog:product.itemCount', {
                        count: store.productCount || storeProducts.length + 1,
                      })}</span>
                    </div>

                    <div className="product-store-header-right">
                      <div className="product-store-arrows hide-on-mobile-arrows">
                        <button
                          className="store-scroll-arrow-btn"
                          onClick={() => handleScrollStore('left')}
                          aria-label={t('catalog:product.scrollLeft')}
                          title={t('catalog:product.scrollLeft')}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          className="store-scroll-arrow-btn"
                          onClick={() => handleScrollStore('right')}
                          aria-label={t('catalog:product.scrollRight')}
                          title={t('catalog:product.scrollRight')}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      <Link 
                        to={`/store/${store.id}`} 
                        className="product-store-see-all-link"
                      >
                        {t('catalog:product.viewAll')}
                      </Link>
                    </div>
                  </div>

                  <div 
                    ref={storeScrollRef} 
                    className="product-store-scroll-track"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {storeProducts.map(p => {
                      const disc = p.originalPrice
                        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                        : null;
                      return (
                        <div 
                          key={p.id} 
                          className="store-mini-card"
                          onClick={() => navigate(localizePath(getProductUrl(p)))}
                        >
                          <div className="store-mini-img-wrap">
                            <img src={p.images?.[0] || ''} alt={p.name} className="store-mini-img" />
                            {disc && <span className="store-mini-badge">{t('catalog:product.card.discount', { discount: disc })}</span>}
                          </div>
                          <div className="store-mini-info">
                            <h4 className="store-mini-name" title={p.name}>{p.name}</h4>
                            <div className="store-mini-price-row">
                              <span className="store-mini-price">{formatCurrency(p.price ?? 0, locale)}</span>
                              {p.originalPrice && (
                                <span className="store-mini-orig">{formatCurrency(p.originalPrice ?? 0, locale)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <Link to={`/store/${store.id}`} className="store-mini-more-card">
                      <StoreIcon size={20} />
                      <span>{t('catalog:product.viewAllLabel')}</span>
                      <small>{t('catalog:product.itemCountArrow', {
                        count: store.productCount || storeProducts.length + 1,
                      })}</small>
                    </Link>
                  </div>
                </div>
              )}
            </div>

        {/* Description */}
        <div className="product-detail__section">
          <h2 className="product-detail__section-title">{t('catalog:product.descriptionTitle')}</h2>
          <div className="product-detail__desc">
            {product.description ? parseRichText(product.description) : t('catalog:product.noDescription')}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <ReviewsSection
          productId={product.id}
          rating={product.rating}
          reviewCount={product.reviewCount}
        />

        {/* Related */}
        {related.length > 0 && (
          <div className="product-detail__section">
            <h2 className="product-detail__section-title">{t('catalog:product.related')}</h2>
            <div className="product-detail__related-grid">
              {related.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={prod => onAddToCart(prod, 1)}
                  isWishlisted={isWishlisted?.(p.id)}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Products Feed (You May Also Like) */}
        <div className="product-detail__section product-detail__recommendations">
          <div className="product-recommend-header">
            <div className="product-recommend-title-wrap">
              <h2 className="product-detail__section-title">
                <Sparkles size={18} className="product-recommend-sparkle-icon" />
                {t('catalog:product.recommendations.title')}
              </h2>
              <p className="product-recommend-subtitle">{t('catalog:product.recommendations.subtitle')}</p>
            </div>

            {/* Filter Tabs */}
            <div className="product-recommend-tabs">
              <button
                type="button"
                className={`product-recommend-tab-btn${recommendedTab === 'foryou' ? ' active' : ''}`}
                onClick={() => setRecommendedTab('foryou')}
              >
                <span>{t('catalog:product.recommendations.forYou')}</span>
              </button>
              <button
                type="button"
                className={`product-recommend-tab-btn${recommendedTab === 'bestseller' ? ' active' : ''}`}
                onClick={() => setRecommendedTab('bestseller')}
              >
                <span>{t('catalog:product.recommendations.bestSeller')}</span>
              </button>
              <button
                type="button"
                className={`product-recommend-tab-btn${recommendedTab === 'deals' ? ' active' : ''}`}
                onClick={() => setRecommendedTab('deals')}
              >
                <span>{t('catalog:product.recommendations.deals')}</span>
              </button>
            </div>
          </div>

          <div className="product-detail__related-grid product-recommend-grid">
            {displayedRecommended.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={prod => onAddToCart(prod, 1)}
                isWishlisted={isWishlisted?.(p.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>

          {/* Auto-Load Sentinel & Infinite Loading State */}
          <div ref={sentinelRef} className="product-recommend-sentinel" />

          {isLoadingMoreRecommended && (
            <div className="product-recommend-loading-state">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
              <span>{t('common:loading')}</span>
            </div>
          )}

          {visibleRecommendedCount >= recommendedProducts.length ? (
            <div className="product-recommend-end-state">
              <span className="product-recommend-end-icon">✨</span>
              <p className="product-recommend-end-text">{t('catalog:product.recommendations.end')}</p>
              <Link to="/shop" className="product-recommend-shop-link">
                {t('catalog:product.recommendations.viewAll')}
              </Link>
            </div>
          ) : (
            <div className="product-recommend-footer">
              <button
                type="button"
                className="product-recommend-load-more-btn"
                onClick={handleLoadMoreRecommended}
                disabled={isLoadingMoreRecommended}
              >
                {isLoadingMoreRecommended
                  ? t('common:loading')
                  : t('catalog:product.recommendations.loadMore', {
                    count: recommendedProducts.length - visibleRecommendedCount,
                  })}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Shopee-Style Sticky Bottom Action Bar ── */}
      <aside className="product-bottom-sticky-bar" aria-label={t('catalog:product.purchaseBarAria')}>
        <div className="container product-bottom-sticky-content">
          {/* Left Column: Chat & Add to Cart */}
          <div className="product-sticky-left">
            <Link
              to={`/chat?storeId=${store.id}&source=product&ref=${product.id}&refName=${encodeURIComponent(product.name || '')}`}
              className="product-sticky-icon-btn"
              title={t('catalog:product.chatStore')}
            >
              <div className="product-sticky-icon-badge-wrap">
                <MessageSquare size={19} />
                <span className="product-sticky-dot" />
              </div>
              <span className="product-sticky-label">{t('catalog:product.chatNow')}</span>
            </Link>

            <div className="product-sticky-divider" />

            <button
              id="sticky-add-cart-btn"
              className="product-sticky-cart-btn"
              onClick={handleAddToCart}
              title={t('catalog:product.addToCart')}
            >
              <ShoppingBag size={18} />
              <span className="product-sticky-label">{t('catalog:product.addToCart')}</span>
            </button>
          </div>

          {/* Right Column: Prominent Buy Now Button with Clear Discount */}
          <button
            id="sticky-buy-now-btn"
            className="product-sticky-buy-btn"
            onClick={handleBuyNow}
          >
            <div className="product-sticky-buy-price-row">
              <span className="product-sticky-buy-text">{t('catalog:product.buyNow')}</span>
              <span className="product-sticky-buy-amount">{formatCurrency(totalPrice ?? 0, locale)}</span>
            </div>
            <div className="product-sticky-buy-discount-row">
              {savings > 0 ? (
                <span className="product-sticky-savings-pill">
                  {t('catalog:product.savings', { amount: formatCurrency(savings ?? 0, locale), discount })}
                </span>
              ) : (
                <span className="product-sticky-savings-pill">
                  {t('catalog:product.fastAuthentic')}
                </span>
              )}
            </div>
          </button>
        </div>
      </aside>

      {/* ── Shopee-Style Slide-up Product Options Drawer (Color, Qty, Installment) ── */}
      {isDrawerOpen && (
        <div className="product-drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div
            className="product-drawer-sheet"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('catalog:product.drawerAria')}
          >
            {/* Header: Product Preview & Price */}
            <div className="product-drawer-header">
              <div className="product-drawer-product-info">
                <img
                  src={product.images?.[0] || ''}
                  alt={product.name}
                  className="product-drawer-thumb"
                />
                <div className="product-drawer-meta">
                  <div className="product-drawer-price-row">
                    <span className="product-drawer-price">{formatCurrency(totalPrice ?? 0, locale)}</span>
                    {product.originalPrice && (
                      <span className="product-drawer-orig">
                        {formatCurrency((product.originalPrice || 0) * qty, locale)}
                      </span>
                    )}
                    {discount && (
                      <span className="product-drawer-discount-tag">{t('catalog:product.discount', { discount })}</span>
                    )}
                  </div>
                  <div className="product-drawer-stock-text">
                    {t('catalog:product.stockLabel')} <strong>{t('catalog:product.itemCount', { count: product.stock })}</strong>
                  </div>
                  <div className="product-drawer-selected-summary">
                    {t('catalog:product.optionsLabel')} <span className="product-drawer-summary-highlight">{selectedOptionLabel}</span> •{' '}
                    <span className="product-drawer-summary-highlight">
                      {installmentOptions.find(option => option.id === selectedInstallment)?.label}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="product-drawer-close-btn"
                onClick={() => setIsDrawerOpen(false)}
                aria-label={t('common:actions.close')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="product-drawer-body">
              {/* Option 1: สี / ตัวเลือกสินค้า */}
              <div className="product-drawer-section">
                <div className="product-drawer-section-title">
                  <span>{t('catalog:product.drawer.optionTitle')}</span>
                  <small className="product-drawer-section-hint">{t('catalog:product.drawer.chooseOne')}</small>
                </div>
                <div className="product-drawer-chips-grid">
                  {colorOptions.map((optionKey) => {
                    const isSelected = selectedOptionKey === optionKey;
                    return (
                      <button
                        key={optionKey}
                        type="button"
                        className={`product-drawer-chip${isSelected ? ' product-drawer-chip--active' : ''}`}
                        onClick={() => setSelectedColor(optionKey)}
                      >
                        {isSelected && <Check size={14} className="product-drawer-chip-check" />}
                        <span>{t(`catalog:${optionKey}`)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option 2: การผ่อนชำระ & PayLater */}
              <div className="product-drawer-section">
                <div className="product-drawer-section-title">
                  <span>{t('catalog:product.drawer.installmentTitle')}</span>
                  <span className="product-drawer-badge-0pct">{t('catalog:product.installments.zeroInterest')}</span>
                </div>
                <div className="product-drawer-installments-grid">
                  {installmentOptions.map((opt) => {
                    const isSelected = selectedInstallment === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`product-drawer-installment-card${isSelected ? ' product-drawer-installment-card--active' : ''}`}
                        onClick={() => setSelectedInstallment(opt.id)}
                      >
                        <div className="product-drawer-inst-header">
                          <span className="product-drawer-inst-label">{opt.label}</span>
                          <span className="product-drawer-inst-tag">{opt.tag}</span>
                        </div>
                        <div className="product-drawer-inst-price">{opt.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Option 3: จำนวนสินค้า */}
              <div className="product-drawer-section">
                <div className="product-drawer-section-title">
                  <span>{t('catalog:product.drawer.quantityTitle')}</span>
                  <small className="product-drawer-section-hint">{t('catalog:product.lowStockPlain', { count: product.stock })}</small>
                </div>
                <div className="product-drawer-qty-row">
                  <div className="product-detail__qty-control">
                    <button
                      className="product-detail__qty-btn"
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      aria-label={t('catalog:product.decreaseQuantity')}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      className="product-detail__qty-num"
                      value={qty}
                      min={1}
                      max={product.stock}
                      onChange={e => setQty(Math.min(product.stock, Math.max(1, Number(e.target.value))))}
                      aria-label={t('catalog:product.quantityAria')}
                    />
                    <button
                      className="product-detail__qty-btn"
                      onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                      aria-label={t('catalog:product.increaseQuantity')}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="product-drawer-quick-qtys">
                    {[1, 2, 5, 10].filter(n => n <= (product.stock ?? 1)).map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`product-drawer-quick-qty-btn${qty === n ? ' product-drawer-quick-qty-btn--active' : ''}`}
                        onClick={() => setQty(n)}
                      >
                        +{n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Button */}
            <div className="product-drawer-footer">
              <div className="product-drawer-footer-summary">
                <span className="product-drawer-footer-total-label">{t('catalog:product.drawer.netTotal', { count: qty })}</span>
                <span className="product-drawer-footer-total-price">{formatCurrency(totalPrice ?? 0, locale)}</span>
                {savings > 0 && (
                  <span className="product-drawer-footer-savings">
                    {t('catalog:product.drawer.saveAmount', { amount: formatCurrency(savings ?? 0, locale) })}
                  </span>
                )}
              </div>

              <button
                type="button"
                className={`product-drawer-submit-btn ${drawerAction === 'buy' ? 'product-drawer-submit-btn--buy' : 'product-drawer-submit-btn--cart'}`}
                onClick={handleConfirmDrawer}
              >
                {drawerAction === 'buy' ? (
                  <>
                    <CreditCard size={18} />
                    <span>{t('catalog:product.drawer.buyNow', { amount: formatCurrency(totalPrice ?? 0, locale) })}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>{t('catalog:product.drawer.addToCart', { count: qty })}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Anti-Counterfeit & Scam Report Modal */}
      {product && (
        <ReportStoreModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="PRODUCT"
          targetId={product.id}
          targetName={product.name}
          storeName={(product.storeId && getStoreById(product.storeId)?.name) || t('catalog:store.official')}
        />
      )}
    </main>
  );
}

export default ProductDetailPage;
