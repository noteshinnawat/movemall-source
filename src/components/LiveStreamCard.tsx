// src/components/LiveStreamCard.tsx — In-Grid Interactive Live Stream Card

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Eye, ShoppingBag, ArrowRight, Heart } from 'lucide-react';
import { LocalizedLink } from '../i18n/LocalizedLink';
import { formatCompactNumber, formatCurrency, formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './LiveStreamCard.css';

export interface LiveStreamCardProps {
  id?: string;
  channelName?: string;
  streamerAvatar?: string;
  title?: string;
  viewers?: number;
  videoUrl?: string;
  posterImage?: string;
  pinnedProduct?: {
    name: string;
    image: string;
    price: number;
    originalPrice: number;
    discountPct: number;
  };
}

export function LiveStreamCard({
  id = 'live-1',
  channelName = 'TechPro Official Live',
  streamerAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
  title = '🔥 แจกโค้ดลับ 50% ทุก 15 นาที + รีวิวแกะกล่องสินค้าใหม่',
  viewers = 1_400,
  videoUrl = '/videos/live-streamer-1.mp4',
  posterImage = 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=600&q=80',
  pinnedProduct = {
    name: 'หูฟังไร้สาย Pro Noise Cancelling ANC',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80',
    price: 990,
    originalPrice: 1990,
    discountPct: 50,
  },
}: LiveStreamCardProps) {
  const { t, i18n } = useTranslation(['catalog', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const [heartsCount, setHeartsCount] = useState(384);
  const [isLiked, setIsLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Guarantee smooth autoplay loop
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay fallback
        });
      }
    }
  }, [videoUrl]);

  function handleSendHeart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setHeartsCount(prev => prev + 1);
    setIsLiked(true);
  }

  return (
    <LocalizedLink to="/live" className="live-stream-card" aria-label={t('catalog:home.live.watchChannel', { channel: channelName })}>
      {/* Background Autoplay Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterImage}
        autoPlay
        loop
        muted
        playsInline
        className="live-stream-video-bg"
      />
      <div className="live-stream-card-overlay" />

      {/* Top Header Bar */}
      <div className="live-stream-card-top">
        <div className="live-stream-badge-pulse">
          <span className="live-stream-red-dot" />
          <span>LIVE</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="live-stream-viewer-count">
            <Eye size={12} style={{ display: 'inline', marginRight: 3 }} />
            {formatCompactNumber(viewers, locale)}
          </div>

          <button
            onClick={handleSendHeart}
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: isLiked ? '#EF4444' : '#FFFFFF',
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
            title={t('catalog:home.live.sendHeart')}
          >
            <Heart size={12} fill={isLiked ? '#EF4444' : 'none'} />
            {formatNumber(heartsCount, locale)}
          </button>
        </div>
      </div>

      {/* Streamer Info */}
      <div className="live-stream-card-center">
        <div className="live-streamer-row">
          <img src={streamerAvatar} alt={channelName} className="live-streamer-avatar" />
          <span className="live-stream-channel-name">{channelName}</span>
        </div>
        <h4 className="live-stream-title">{title}</h4>
      </div>

      {/* Bottom Pinned Deal & Action */}
      <div className="live-stream-card-bottom">
        <div className="live-pinned-deal">
          <img src={pinnedProduct.image} alt={pinnedProduct.name} className="live-pinned-deal-img" />
          <div className="live-pinned-deal-info">
            <div className="live-pinned-tag">{t('catalog:home.live.pinnedDiscount', { discount: pinnedProduct.discountPct })}</div>
            <div className="live-pinned-name">{pinnedProduct.name}</div>
            <div className="live-pinned-price-row">
              <span className="live-pinned-price">{formatCurrency(pinnedProduct.price, locale)}</span>
              <span className="live-pinned-orig">{formatCurrency(pinnedProduct.originalPrice, locale)}</span>
            </div>
          </div>
        </div>

        <div className="live-watch-now-btn">
          <Play size={12} fill="white" />
          <span>{t('catalog:home.live.shopLive')}</span>
          <ArrowRight size={12} />
        </div>
      </div>
    </LocalizedLink>
  );
}

export default LiveStreamCard;
