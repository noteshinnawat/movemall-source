// src/components/ProductCard.tsx

import { Heart, Plus, ShoppingCart, Check, Play, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStoreById } from '../data/stores';
import type { Product } from '../types';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  isSponsored?: boolean;
  isVideoCardSlot?: boolean;
  isActiveVideo?: boolean;
  onActivateVideo?: (productId: string | null) => void;
  onOpenVideoModal?: (product: Product) => void;
}

function getDiscount(price: number, original: number): string {
  return `-${Math.round(((original - price) / original) * 100)}%`;
}

export function ProductCard({
  product,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
  isSponsored = false,
  isVideoCardSlot = false,
  isActiveVideo = false,
  onActivateVideo,
  onOpenVideoModal,
}: ProductCardProps) {
  const {
    id, name, price, originalPrice, images, category,
    rating, reviewCount, badge, storeId, videoReview, videoUrl,
  } = product;

  const [isAdded, setIsAdded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const cardRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const store = storeId ? getStoreById(storeId) : undefined;
  const isMall = store?.badge === 'official';
  const isPreferred = store?.badge === 'preferred';
  const soldCount = (reviewCount * 3) + 18;

  const reviewVideoSource = videoReview?.videoUrl || videoUrl;
  const hasVideoReview = Boolean(reviewVideoSource);

  // IntersectionObserver to auto-trigger video slot activation when card enters screen center
  useEffect(() => {
    if (!isVideoCardSlot || !hasVideoReview || !cardRef.current || !onActivateVideo) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            onActivateVideo(id);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isVideoCardSlot, hasVideoReview, id, onActivateVideo]);

  // Handle video element play/pause state synchronization
  useEffect(() => {
    if (!videoRef.current) return;
    const shouldPlay = isVideoCardSlot && (isActiveVideo || isHovered) && hasVideoReview;

    if (shouldPlay) {
      videoRef.current.play().catch(() => {
        // Fallback if browser blocks autoplay
      });
    } else {
      videoRef.current.pause();
    }
  }, [isVideoCardSlot, isActiveVideo, isHovered, hasVideoReview]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1200);
    }
  };

  const handleOpenVideoModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenVideoModal) {
      onOpenVideoModal(product);
    }
  };

  return (
    <article
      ref={cardRef}
      className={`product-card${isVideoCardSlot && hasVideoReview ? ' product-card--video-slot' : ''}${isActiveVideo ? ' product-card--video-active' : ''}`}
      aria-label={name}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image & Badges & Video Slot */}
      <div className="product-card__image-wrap">
        <Link to={`/product/${id}`} className="product-card__image-link" aria-label={`ดูรายละเอียด ${name}`}>
          {/* Active Video Slot Player */}
          {isVideoCardSlot && hasVideoReview ? (
            <div className="product-card__video-container">
              <video
                ref={videoRef}
                src={reviewVideoSource}
                poster={images[0]}
                muted={isMuted}
                loop
                playsInline
                className="product-card__video-player"
              />
              {!isActiveVideo && !isHovered && (
                <div className="product-card__video-overlay-play">
                  <Play size={24} fill="#FFFFFF" stroke="none" />
                </div>
              )}
            </div>
          ) : images[0] ? (
            <>
              <img
                src={images[0]}
                alt={name}
                className={`product-card__image product-card__image--primary${images[1] ? ' has-second-image' : ''}`}
                loading="lazy"
              />
              {images[1] && (
                <img
                  src={images[1]}
                  alt={`${name} รูปถัดไป`}
                  className="product-card__image product-card__image--secondary"
                  loading="lazy"
                />
              )}
            </>
          ) : (
            <div className="product-card__image-placeholder">🛍️</div>
          )}
        </Link>

        {/* Video Review Creator Badge & Action Button */}
        {hasVideoReview && (
          <button
            type="button"
            className="product-card__video-review-badge"
            onClick={handleOpenVideoModal}
            title="คลิกเพื่อดูคลิปรีวิวป้ายยาแบบเต็มพร้อมเสียง"
          >
            {videoReview?.creatorAvatar ? (
              <img src={videoReview.creatorAvatar} alt="" className="product-card__creator-avatar" />
            ) : (
              <span className="product-card__creator-icon">🎬</span>
            )}
            <span className="product-card__creator-name">
              {videoReview?.creatorName ? `รีวิวโดย @${videoReview.creatorName}` : 'คลิปรีวิวจริง'}
            </span>
            <Sparkles size={11} className="product-card__badge-sparkle" />
          </button>
        )}

        {/* Video Sound Toggle Button (only visible when video is playing) */}
        {isVideoCardSlot && hasVideoReview && (isActiveVideo || isHovered) && (
          <button
            type="button"
            className="product-card__sound-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        )}

        {/* Multi-image indicator badge */}
        {!isVideoCardSlot && images.length > 1 && (
          <span className="product-card__multi-img-badge" title={`มีรูปภาพทั้งหมด ${images.length} รูป`}>
            📷 {images.length}
          </span>
        )}

        {/* Top Badges (Mall / Preferred / Sponsored) */}
        <div className="product-card__top-badges">
          {isSponsored && (
            <span className="product-card__badge-tag product-card__badge--sponsored">
              📢 สปอนเซอร์
            </span>
          )}
          {isMall ? (
            <span className="product-card__badge-tag product-card__badge--mall">
              👑 Mall
            </span>
          ) : isPreferred ? (
            <span className="product-card__badge-tag product-card__badge--pref">
              ⭐ แนะนำ
            </span>
          ) : badge ? (
            <span className={`product-card__badge-tag product-card__badge--${badge}`}>
              {badge === 'sale' ? '🔥 SALE' : badge === 'new' ? 'ใหม่' : badge === 'hot' ? '🔥 HOT' : 'LIMIT'}
            </span>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button
          className={`product-card__wishlist${isWishlisted ? ' product-card__wishlist--active' : ''}`}
          aria-label={isWishlisted ? `ลบ ${name} ออกจาก Wishlist` : `บันทึก ${name} ใน Wishlist`}
          id={`wishlist-${id}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist?.(product);
          }}
        >
          <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Discount Tag on Image if on sale */}
        {originalPrice && originalPrice > price && (
          <span className="product-card__image-discount">
            {getDiscount(price, originalPrice)}
          </span>
        )}
      </div>

      {/* Product Information Body */}
      <div className="product-card__body">
        {/* Store & Location Micro Header */}
        <div className="product-card__store-bar">
          <Link
            to={store ? `/store/${store.id}` : `/shop?category=${category}`}
            className="product-card__store-link"
            onClick={(e) => e.stopPropagation()}
          >
            {isMall && <span className="product-card__store-icon">👑</span>}
            <span className="product-card__store-name">
              {store ? store.name : category}
            </span>
          </Link>
          <span className="product-card__location">
            📍 {store?.location || 'กทม.'}
          </span>
        </div>

        {/* Product Title */}
        <Link to={`/product/${id}`} className="product-card__name-link">
          <h3 className="product-card__name" title={name}>
            {name}
          </h3>
        </Link>

        {/* Service & Trust Tags */}
        <div className="product-card__perks-row">
          {(isMall || product.isVatRegistered || store?.isVatRegistered) && (
            <span className="product-card__perk" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              🧾 ใบกำกับภาษี
            </span>
          )}
          {hasVideoReview && (
            <span className="product-card__perk product-card__perk--video-tag">
              🎥 มีคลิปป้ายยา
            </span>
          )}
          <span className="product-card__perk product-card__perk--shipping">
            🚚 ส่งฟรี
          </span>
          {price >= 1000 && (
            <span className="product-card__perk product-card__perk--bnpl">
              ผ่อน 0%
            </span>
          )}
        </div>

        {/* Rating & Sold Stats */}
        <div className="product-card__rating-row">
          <span className="product-card__rating-score">
            ⭐ {rating.toFixed(1)}
          </span>
          <span className="product-card__rating-reviews">
            ({reviewCount.toLocaleString()})
          </span>
          <span className="product-card__sold-count">
            ขายแล้ว {soldCount >= 1000 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount}
          </span>
        </div>

        {/* Price & Action Bottom Row */}
        <div className="product-card__bottom-row">
          <div className="product-card__price-box">
            <div className="product-card__main-price">
              <span className="product-card__currency">฿</span>
              {price.toLocaleString()}
            </div>
            {originalPrice && originalPrice > price && (
              <div className="product-card__original-price">
                ฿{originalPrice.toLocaleString()}
              </div>
            )}
          </div>

          {onAddToCart && (
            <button
              className={`product-card__quick-cart${isAdded ? ' product-card__quick-cart--success' : ''}`}
              onClick={handleAddToCart}
              title="เพิ่มลงตะกร้าทันที"
              id={`add-cart-${id}`}
              aria-label={`เพิ่ม ${name} ลงตะกร้า`}
            >
              {isAdded ? (
                <>
                  <Check size={13} strokeWidth={3} />
                  <span className="product-card__quick-cart-text">เพิ่มแล้ว</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={13} />
                  <Plus size={10} className="product-card__plus-icon" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
