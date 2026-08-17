// src/pages/ProductDetailPage.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, Minus, Plus, Store as StoreIcon, MessageSquare, ShieldCheck, ChevronLeft, ChevronRight, Play, Video, Share2, Scale, Check, X, CreditCard, Sparkles, Flame, Zap, Loader2 } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ReviewsSection } from '../components/ReviewsSection';
import { products as staticProducts } from '../data/products';
import { getStoreById, stores } from '../data/stores';
import { mockLiveStreams } from '../data/liveStreams';
import { parseRichText } from '../components/RichTextEditor';
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
  { icon: '🚚', text: 'จัดส่งฟรีเมื่อซื้อครบ ฿299' },
  { icon: '↩️', text: 'คืนสินค้าได้ภายใน 30 วัน' },
  { icon: '🔒', text: 'ชำระเงินปลอดภัย 100%' },
  { icon: '⚡', text: 'รับประกันของแท้ 100%' },
];

export function ProductDetailPage({
  products: propProducts,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  cartCount = 0,
  onOpenVisualSearchWithImage,
}: ProductDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sourceProducts = propProducts || staticProducts;
  const product = sourceProducts.find(p => p.id === id);
  const activeLive = mockLiveStreams.find(s => s.storeId === product?.storeId && s.type === 'live');

  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerAction, setDrawerAction] = useState<'cart' | 'buy'>('cart');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedInstallment, setSelectedInstallment] = useState<string>('full');
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
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
      }
      alert('คัดลอกลิงก์สินค้าเรียบร้อยแล้ว!');
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

  // SEO Schema.org Product JSON-LD Injection & Personalized Interest Tracking
  useEffect(() => {
    if (!product) return;

    // Track user interest for AI Personalized Feed on Homepage
    try {
      localStorage.setItem('mm_user_interest', product.category);
    } catch {}

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = `jsonld-${product.id}`;
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.images,
      description: product.description,
      sku: product.id,
      brand: {
        '@type': 'Brand',
        name: 'Movemall Official',
      },
      offers: {
        '@type': 'Offer',
        url: window.location.href,
        priceCurrency: 'THB',
        price: product.price,
        priceValidUntil: '2026-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 1,
      },
    });

    document.head.appendChild(script);
    return () => {
      const existing = document.getElementById(`jsonld-${product.id}`);
      if (existing) document.head.removeChild(existing);
    };
  }, [product]);

  if (!product) {
    return (
      <div className="product-detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
          <h1 style={{ marginBottom: 8 }}>ไม่พบสินค้า</h1>
          <Link to="/shop" style={{ color: 'var(--primary-light)' }}>กลับไปช้อปต่อ</Link>
        </div>
      </div>
    );
  }

  const storeProducts = sourceProducts.filter(p => p.storeId === product.storeId && p.id !== product.id).slice(0, 8);
  const related = sourceProducts.filter(p => p.category === product.category && p.id !== product.id && p.storeId !== product.storeId).slice(0, 8);
  const store = (product.storeId && getStoreById(product.storeId)) || stores[0];
  const fullStars = Math.floor(product.rating);
  const stars = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;
  const totalPrice = product.price * qty;
  const savings = product.originalPrice ? (product.originalPrice - product.price) * qty : 0;

  const userInterest = typeof window !== 'undefined' ? localStorage.getItem('mm_user_interest') || product.category : product.category;

  const recommendedProducts = [...sourceProducts]
    .filter(p => p.id !== product.id)
    .sort((a, b) => {
      if (recommendedTab === 'foryou') {
        const aScore = (a.category === product.category ? 40 : a.category === userInterest ? 25 : 0) + a.rating * 10 + (a.badge === 'sale' ? 15 : 0);
        const bScore = (b.category === product.category ? 40 : b.category === userInterest ? 25 : 0) + b.rating * 10 + (b.badge === 'sale' ? 15 : 0);
        return bScore - aScore;
      }
      if (recommendedTab === 'bestseller') {
        return (b.reviewCount * b.rating) - (a.reviewCount * a.rating);
      }
      if (recommendedTab === 'deals') {
        const aDisc = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const bDisc = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return bDisc - aDisc;
      }
      return 0;
    });

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

  const mediaList = [
    ...(product.videoUrl ? [{ type: 'video' as const, url: product.videoUrl, poster: product.images[0] }] : []),
    ...product.images.map(img => ({ type: 'image' as const, url: img }))
  ];
  const currentMedia = mediaList[selectedImg] || mediaList[0];
  const colorOptions = product.category === 'fashion'
    ? ['สีดำ (Classic Black)', 'สีขาวมุก (Pearl White)', 'สีกรมท่า (Navy Blue)', 'สีเบจ (Beige)']
    : product.category === 'electronics'
    ? ['Space Gray (เทาเข้ม)', 'Silver (เงินเงา)', 'Midnight Blue (มิดไนท์)', 'Starlight (ทองอ่อน)']
    : product.category === 'beauty'
    ? ['01 Natural Glow', '02 Warm Peach', '03 Soft Rose']
    : ['รุ่นมาตรฐาน (Standard)', 'รุ่นพรีเมียม (Pro Edition)', 'สีดำคลาสสิก (Classic Black)'];

  const installmentOptions = [
    { id: 'full', label: 'ชำระเต็มจำนวน', desc: `฿${totalPrice.toLocaleString()}`, tag: 'ยอดนิยม' },
    { id: '3m', label: 'ผ่อน 0% x 3 เดือน', desc: `฿${Math.round(totalPrice / 3).toLocaleString()}/เดือน`, tag: '0% ดอกเบี้ย' },
    { id: '6m', label: 'ผ่อน 0% x 6 เดือน', desc: `฿${Math.round(totalPrice / 6).toLocaleString()}/เดือน`, tag: 'Movemall PayLater' },
    ...(totalPrice >= 3000 ? [{ id: '10m', label: 'ผ่อน 0% x 10 เดือน', desc: `฿${Math.round(totalPrice / 10).toLocaleString()}/เดือน`, tag: 'ยอด ฿3,000+' }] : []),
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
      navigate('/checkout');
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
      navigate('/shop');
    }
  }

  return (
    <main className="product-detail">
      <div className="container">
        {/* Desktop Breadcrumbs & Back Navigation */}
        <nav className="product-detail__top-nav" aria-label="แถบนำทาง">
          <button
            type="button"
            className="product-detail__back-nav-btn"
            onClick={handleGoBack}
            aria-label="ย้อนกลับไปหน้าก่อนหน้า"
          >
            <ArrowLeft size={16} /> ย้อนกลับ
          </button>
          <div className="product-detail__breadcrumbs">
            <Link to="/">หน้าแรก</Link>
            <span className="product-detail__breadcrumb-sep">/</span>
            <Link to="/shop">สินค้าทั้งหมด</Link>
            <span className="product-detail__breadcrumb-sep">/</span>
            <Link to={`/shop?category=${product.category}`}>{product.category}</Link>
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
              <div className="product-floating-top-bar" aria-label="แถบควบคุมด้านบน">
                <button
                  type="button"
                  className="product-float-btn"
                  onClick={handleGoBack}
                  aria-label="ย้อนกลับ"
                  title="ย้อนกลับ"
                >
                  <ArrowLeft size={22} />
                </button>

                <div className="product-float-right-group">
                  <button
                    type="button"
                    className="product-float-btn"
                    onClick={handleShareProduct}
                    aria-label="แชร์สินค้า"
                    title="แชร์สินค้า"
                  >
                    <Share2 size={20} />
                  </button>

                  <button
                    type="button"
                    className={`product-float-btn${isWishlisted?.(product.id) ? ' product-float-btn--wished' : ''}`}
                    onClick={() => onToggleWishlist?.(product)}
                    aria-label="บันทึกรายการโปรด"
                    title="บันทึกรายการโปรด"
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
                    aria-label="ดูรถเข็น"
                    title="ดูรถเข็น"
                  >
                    <ShoppingBag size={20} />
                    {cartCount > 0 && (
                      <span className="product-float-cart-badge">{cartCount}</span>
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
                    <span>วิดีโอสาธิตสินค้าจริง</span>
                  </div>
                </>
              ) : (
                <img
                  src={currentMedia?.url || product.images[0]}
                  alt={product.name}
                  className="product-detail__main-image"
                />
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
                    aria-label="รูปภาพก่อนหน้า"
                    title="รูปภาพก่อนหน้า"
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
                    aria-label="รูปภาพถัดไป"
                    title="รูปภาพถัดไป"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Image Counter Badge (e.g. 1/5) */}
                  <div className="product-detail__image-counter">
                    <span>{selectedImg + 1} / {mediaList.length}</span>
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
                    aria-label={`ไปยังรูปที่ ${i + 1}`}
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
                      title="รับชมวิดีโอสินค้า"
                    >
                      <img src={item.poster} alt="วิดีโอตัวอย่าง" />
                      <div className="product-detail__thumb-play-badge">
                        <Play size={12} fill="#FFFFFF" color="#FFFFFF" />
                        <span>VDO</span>
                      </div>
                    </div>
                  ) : (
                    <img
                      key={i}
                      src={item.url}
                      alt={`${product.name} รูปที่ ${i + 1}`}
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
                {product.badge === 'sale' ? '🔥 Sale' : product.badge === 'new' ? '✨ ใหม่' : '⚡ Hot'}
              </span>
            )}

            <p className="product-detail__category">{product.category}</p>
            <h1 className="product-detail__name">{product.name}</h1>

            {/* Rating */}
            <div className="product-detail__rating-row">
              <span className="product-detail__stars" aria-hidden="true">{stars}</span>
              <span className="product-detail__rating-num">{product.rating}</span>
              <span className="product-detail__review-count">({product.reviewCount.toLocaleString()} รีวิว)</span>
              <span className="product-detail__stock">
                {product.stock > 10 ? `✓ มีสินค้า ${product.stock} ชิ้น` : `⚠ เหลือ ${product.stock} ชิ้น`}
              </span>
            </div>

            {/* Price */}
            <div className="product-detail__price-block">
              <span className="product-detail__price">฿{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="product-detail__original-price">
                  ฿{product.originalPrice.toLocaleString()}
                </span>
              )}
              {discount && (
                <span className="product-detail__discount">ลด {discount}%</span>
              )}
            </div>

            {/* Quick Variation / Installment Selector Row (Click opens Slide-up Sheet) */}
            <div
              className="product-detail__var-row"
              onClick={openAddToCartDrawer}
              role="button"
              tabIndex={0}
              title="แตะเพื่อเลือกสี จำนวน และการผ่อนชำระ"
            >
              <div className="product-detail__var-left">
                <span className="product-detail__var-label">ตัวเลือก:</span>
                <span className="product-detail__var-value">{selectedColor || colorOptions[0]}</span>
                <span className="product-detail__var-divider">•</span>
                <span className="product-detail__var-qty">จำนวน {qty} ชิ้น</span>
                <span className="product-detail__var-divider">•</span>
                <span className="product-detail__var-tag">ผ่อน 0%</span>
              </div>
              <span className="product-detail__var-btn-text">
                เปลี่ยน &gt;
              </span>
            </div>

            {/* Tags */}
            <div className="product-detail__tags">
              {product.tags.map(tag => (
                <span key={tag} className="product-detail__tag">#{tag}</span>
              ))}
            </div>

            {/* Perks */}
            <div className="product-detail__perks">
              {PERKS.map(perk => (
                <div key={perk.text} className="product-detail__perk">
                  <span className="product-detail__perk-icon">{perk.icon}</span>
                  <span className="product-detail__perk-text">{perk.text}</span>
                </div>
              ))}
            </div>

            {/* Product Compliance & Standard Card */}
            <div className="product-detail__compliance-card">
              <div className="product-detail__compliance-header">
                <div className="product-detail__compliance-title-group">
                  <ShieldCheck size={16} className="product-detail__compliance-icon" />
                  <span className="product-detail__compliance-title">🛡️ ข้อมูลใบอนุญาตและมาตรฐานสินค้า (Compliance)</span>
                </div>
                <span className="product-detail__compliance-badge">
                  ✓ ตรวจสอบแล้ว
                </span>
              </div>

              <div className="product-detail__compliance-grid">
                {product.compliance?.fdaNumber ? (
                  <div className="product-detail__compliance-item">
                    <span className="product-detail__compliance-label">เลขที่จดแจ้ง อย.:</span>
                    <div className="product-detail__compliance-value-wrap">
                      <strong className="product-detail__compliance-value" style={{ color: '#059669' }}>
                        {product.compliance.fdaNumber}
                      </strong>
                      <button
                        type="button"
                        className="product-detail__compliance-copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(product.compliance?.fdaNumber || '');
                          alert(`คัดลอกเลข อย. "${product.compliance?.fdaNumber}" สำเร็จ! สามารถนำไปเช็กได้ที่ระบบ อย.`);
                        }}
                      >
                        คัดลอก
                      </button>
                    </div>
                  </div>
                ) : (product.category === 'beauty' || product.category === 'food') ? (
                  <div className="product-detail__compliance-item">
                    <span className="product-detail__compliance-label">เลขที่จดแจ้ง อย.:</span>
                    <div className="product-detail__compliance-value-wrap">
                      <strong className="product-detail__compliance-value" style={{ color: '#059669' }}>
                        10-1-6500098765
                      </strong>
                      <button
                        type="button"
                        className="product-detail__compliance-copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText('10-1-6500098765');
                          alert('คัดลอกเลข อย. "10-1-6500098765" สำเร็จ!');
                        }}
                      >
                        คัดลอก
                      </button>
                    </div>
                  </div>
                ) : null}

                {product.compliance?.tisiNumber ? (
                  <div className="product-detail__compliance-item">
                    <span className="product-detail__compliance-label">มาตรฐานอุตสาหกรรม (มอก.):</span>
                    <strong className="product-detail__compliance-value" style={{ color: '#2563EB' }}>
                      ⚡ {product.compliance.tisiNumber}
                    </strong>
                  </div>
                ) : (product.category === 'electronics' || product.category === 'home') ? (
                  <div className="product-detail__compliance-item">
                    <span className="product-detail__compliance-label">มาตรฐานอุตสาหกรรม (มอก.):</span>
                    <strong className="product-detail__compliance-value" style={{ color: '#2563EB' }}>
                      ⚡ มอก. 1195-2553
                    </strong>
                  </div>
                ) : null}

                <div className="product-detail__compliance-item">
                  <span className="product-detail__compliance-label">ประเทศที่ผลิต (Country of Origin):</span>
                  <strong className="product-detail__compliance-value">
                    🌐 {product.compliance?.countryOfOrigin || (product.category === 'beauty' ? 'South Korea' : product.category === 'electronics' ? 'China' : 'Thailand')}
                  </strong>
                </div>

                {product.compliance?.halalNumber && (
                  <div className="product-detail__compliance-item">
                    <span className="product-detail__compliance-label">เครื่องหมายฮาลาล:</span>
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
        {(() => {
          const store = (product.storeId && getStoreById(product.storeId)) || stores[0];
          return (
            <>
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
                onClick={() => navigate('/live')}
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
                      ร้าน {store.name} กำลังไลฟ์สดอยู่! ({activeLive.viewers} คนกำลังดู)
                    </div>
                    <div style={{ fontSize: 11, color: '#FBBF24' }}>
                      🔥 มีโค้ดลดพิเศษ 50% และโปรส่งฟรีในไลฟ์สดนี้
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
                  เข้าชมไลฟ์สดร้านนี้ →
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
                          <ShieldCheck size={11} /> Official
                        </span>
                      )}
                    </div>
                    <div className="product-store-meta">
                      <span className="store-meta-rating">⭐ {store.rating} ({store.reviewCount.toLocaleString()} รีวิว)</span>
                      <span className="store-meta-sep">•</span>
                      <span>ตอบแชท: {store.responseRate}</span>
                      <span className="store-meta-sep">•</span>
                      <span>📍 {store.location}</span>
                    </div>
                  </div>
                </div>

                <div className="product-store-actions">
                  <button
                    className="product-store-chat-btn"
                    onClick={() => navigate(`/chat?store=${store.id}`)}
                  >
                    <MessageSquare size={14} />
                    แชทกับร้าน
                  </button>
                  <Link
                    to={`/store/${store.id}`}
                    className="product-store-visit-btn"
                  >
                    <StoreIcon size={14} />
                    เข้าชมร้านค้า
                  </Link>
                </div>
              </div>

              {/* Other Products From This Store (Compact Mini Scroll Tray) */}
              {storeProducts.length > 0 && (
                <div className="product-store-products-tray">
                  <div className="product-store-products-header">
                    <div className="product-store-products-title">
                      <span>สินค้าแนะนำจากร้านนี้</span>
                      <span className="product-store-count-chip">{store.productCount || storeProducts.length + 1} ชิ้น</span>
                    </div>

                    <div className="product-store-header-right">
                      <div className="product-store-arrows hide-on-mobile-arrows">
                        <button
                          className="store-scroll-arrow-btn"
                          onClick={() => handleScrollStore('left')}
                          aria-label="เลื่อนซ้าย"
                          title="เลื่อนซ้าย"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          className="store-scroll-arrow-btn"
                          onClick={() => handleScrollStore('right')}
                          aria-label="เลื่อนขวา"
                          title="เลื่อนขวา"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      <Link 
                        to={`/store/${store.id}`} 
                        className="product-store-see-all-link"
                      >
                        ดูทั้งหมด →
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
                          onClick={() => navigate(`/product/${p.id}`)}
                        >
                          <div className="store-mini-img-wrap">
                            <img src={p.images[0]} alt={p.name} className="store-mini-img" />
                            {disc && <span className="store-mini-badge">-{disc}%</span>}
                          </div>
                          <div className="store-mini-info">
                            <h4 className="store-mini-name" title={p.name}>{p.name}</h4>
                            <div className="store-mini-price-row">
                              <span className="store-mini-price">฿{p.price.toLocaleString()}</span>
                              {p.originalPrice && (
                                <span className="store-mini-orig">฿{p.originalPrice.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <Link to={`/store/${store.id}`} className="store-mini-more-card">
                      <StoreIcon size={20} />
                      <span>ดูทั้งหมด</span>
                      <small>{store.productCount || storeProducts.length + 1} ชิ้น →</small>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            </>
          );
        })()}

        {/* Description */}
        <div className="product-detail__section">
          <h2 className="product-detail__section-title">รายละเอียดสินค้า</h2>
          <div className="product-detail__desc">
            {product.description ? parseRichText(product.description) : 'ไม่มีรายละเอียดสินค้า'}
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
            <h2 className="product-detail__section-title">สินค้าที่เกี่ยวข้อง</h2>
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
                คุณอาจจะชอบสิ่งนี้ (You May Also Like)
              </h2>
              <p className="product-recommend-subtitle">สินค้าคัดสรรพิเศษที่ผู้ซื้อสินค้านี้นิยมสั่งซื้อเพิ่ม</p>
            </div>

            {/* Filter Tabs */}
            <div className="product-recommend-tabs">
              <button
                type="button"
                className={`product-recommend-tab-btn${recommendedTab === 'foryou' ? ' active' : ''}`}
                onClick={() => setRecommendedTab('foryou')}
              >
                <span>✨ สำหรับคุณ</span>
              </button>
              <button
                type="button"
                className={`product-recommend-tab-btn${recommendedTab === 'bestseller' ? ' active' : ''}`}
                onClick={() => setRecommendedTab('bestseller')}
              >
                <span>🔥 ขายดียอดฮิต</span>
              </button>
              <button
                type="button"
                className={`product-recommend-tab-btn${recommendedTab === 'deals' ? ' active' : ''}`}
                onClick={() => setRecommendedTab('deals')}
              >
                <span>⚡ ดีลลดแรง</span>
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
              <span>กำลังโหลดสินค้าแนะนำเพิ่มเติม...</span>
            </div>
          )}

          {visibleRecommendedCount >= recommendedProducts.length ? (
            <div className="product-recommend-end-state">
              <span className="product-recommend-end-icon">✨</span>
              <p className="product-recommend-end-text">คุณได้ดูสินค้าแนะนำทั้งหมดในหมวดนี้ครบแล้ว</p>
              <Link to="/shop" className="product-recommend-shop-link">
                ไปที่หน้าแคตตาล็อกสินค้าทั้งหมด 160+ รายการ →
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
                {isLoadingMoreRecommended ? 'กำลังโหลด...' : `โหลดสินค้าแนะนำเพิ่มเติม (เหลือ ${recommendedProducts.length - visibleRecommendedCount}+)`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Shopee-Style Sticky Bottom Action Bar ── */}
      <aside className="product-bottom-sticky-bar" aria-label="แถบสั่งซื้อสินค้า">
        <div className="container product-bottom-sticky-content">
          {/* Left Column: Chat & Add to Cart */}
          <div className="product-sticky-left">
            <Link
              to={`/chat?storeId=${store.id}`}
              className="product-sticky-icon-btn"
              title="แชทคุยกับร้านค้า"
            >
              <div className="product-sticky-icon-badge-wrap">
                <MessageSquare size={19} />
                <span className="product-sticky-dot" />
              </div>
              <span className="product-sticky-label">แชทเลย</span>
            </Link>

            <div className="product-sticky-divider" />

            <button
              id="sticky-add-cart-btn"
              className="product-sticky-cart-btn"
              onClick={handleAddToCart}
              title="เพิ่มลงรถเข็น"
            >
              <ShoppingBag size={18} />
              <span className="product-sticky-label">เพิ่มลงรถเข็น</span>
            </button>
          </div>

          {/* Right Column: Prominent Buy Now Button with Clear Discount */}
          <button
            id="sticky-buy-now-btn"
            className="product-sticky-buy-btn"
            onClick={handleBuyNow}
          >
            <div className="product-sticky-buy-price-row">
              <span className="product-sticky-buy-text">สั่งซื้อสินค้าทันที</span>
              <span className="product-sticky-buy-amount">฿{totalPrice.toLocaleString()}</span>
            </div>
            <div className="product-sticky-buy-discount-row">
              {savings > 0 ? (
                <span className="product-sticky-savings-pill">
                  🔥 ประหยัด ฿{savings.toLocaleString()} (ลด {discount}%)
                </span>
              ) : (
                <span className="product-sticky-savings-pill">
                  ⚡ จัดส่งด่วน • รับประกันของแท้
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
            aria-label="ตัวเลือกสินค้าและการผ่อนชำระ"
          >
            {/* Header: Product Preview & Price */}
            <div className="product-drawer-header">
              <div className="product-drawer-product-info">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="product-drawer-thumb"
                />
                <div className="product-drawer-meta">
                  <div className="product-drawer-price-row">
                    <span className="product-drawer-price">฿{totalPrice.toLocaleString()}</span>
                    {product.originalPrice && (
                      <span className="product-drawer-orig">
                        ฿{(product.originalPrice * qty).toLocaleString()}
                      </span>
                    )}
                    {discount && (
                      <span className="product-drawer-discount-tag">ลด {discount}%</span>
                    )}
                  </div>
                  <div className="product-drawer-stock-text">
                    คลังสินค้า: <strong>{product.stock} ชิ้น</strong>
                  </div>
                  <div className="product-drawer-selected-summary">
                    ตัวเลือก: <span className="product-drawer-summary-highlight">{selectedColor || colorOptions[0]}</span> • <span className="product-drawer-summary-highlight">{selectedInstallment === 'full' ? 'ชำระเต็มจำนวน' : selectedInstallment + ' ผ่อน 0%'}</span>
                  </div>
                </div>
              </div>
              <button
                className="product-drawer-close-btn"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="product-drawer-body">
              {/* Option 1: สี / ตัวเลือกสินค้า */}
              <div className="product-drawer-section">
                <div className="product-drawer-section-title">
                  <span>🎨 ตัวเลือกสี / รุ่นสินค้า</span>
                  <small className="product-drawer-section-hint">(เลือก 1 แบบ)</small>
                </div>
                <div className="product-drawer-chips-grid">
                  {colorOptions.map((col) => {
                    const isSelected = (selectedColor || colorOptions[0]) === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        className={`product-drawer-chip${isSelected ? ' product-drawer-chip--active' : ''}`}
                        onClick={() => setSelectedColor(col)}
                      >
                        {isSelected && <Check size={14} className="product-drawer-chip-check" />}
                        <span>{col}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option 2: การผ่อนชำระ & PayLater */}
              <div className="product-drawer-section">
                <div className="product-drawer-section-title">
                  <span>💳 แผนการผ่อนชำระ (Movemall PayLater 0%)</span>
                  <span className="product-drawer-badge-0pct">ดอกเบี้ย 0%</span>
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
                  <span>📦 จำนวนที่ต้องการ</span>
                  <small className="product-drawer-section-hint">เหลือสินค้า {product.stock} ชิ้น</small>
                </div>
                <div className="product-drawer-qty-row">
                  <div className="product-detail__qty-control">
                    <button
                      className="product-detail__qty-btn"
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      aria-label="ลดจำนวน"
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
                      aria-label="จำนวนสินค้า"
                    />
                    <button
                      className="product-detail__qty-btn"
                      onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                      aria-label="เพิ่มจำนวน"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="product-drawer-quick-qtys">
                    {[1, 2, 5, 10].filter(n => n <= product.stock).map(n => (
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
                <span className="product-drawer-footer-total-label">ยอดสุทธิ ({qty} ชิ้น):</span>
                <span className="product-drawer-footer-total-price">฿{totalPrice.toLocaleString()}</span>
                {savings > 0 && (
                  <span className="product-drawer-footer-savings">
                    ประหยัด ฿{savings.toLocaleString()}
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
                    <span>ยืนยันสั่งซื้อทันที (฿{totalPrice.toLocaleString()})</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>ยืนยันเพิ่มลงรถเข็น ({qty} ชิ้น)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ProductDetailPage;
