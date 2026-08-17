// src/components/VideoClipInGridCard.tsx — In-Grid Short Video Clip Card with Yellow Basket

import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ShoppingBag, Heart, Sparkles, Volume2, VolumeX, Eye } from 'lucide-react';
import type { VideoClip } from '../types';
import './VideoClipInGridCard.css';

interface VideoClipInGridCardProps {
  clip: VideoClip;
  onOpenBasket?: (clip: VideoClip) => void;
}

export function VideoClipInGridCard({ clip, onOpenBasket }: VideoClipInGridCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [likesCount, setLikesCount] = useState(clip.likesCount);
  const [isLiked, setIsLiked] = useState(clip.isLiked || false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const promise = videoRef.current.play();
      if (promise !== undefined) {
        promise.catch(() => {});
      }
    }
  }, [clip.videoUrl]);

  function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikesCount(prev => (isLiked ? prev - 1 : prev + 1));
  }

  const pinned = clip.pinnedProducts?.[0];

  return (
    <div
      className="video-grid-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Animated Video */}
      <video
        ref={videoRef}
        src={clip.videoUrl}
        poster={clip.coverImage}
        autoPlay
        loop
        muted
        playsInline
        className="video-grid-media"
      />
      <div className="video-grid-overlay" />

      {/* Top Header Tags */}
      <div className="video-grid-top">
        <span className="video-grid-tag-video">
          <Sparkles size={11} /> วิดีโอสั้น
        </span>
        <button
          className={`video-grid-like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <Heart size={12} fill={isLiked ? '#EF4444' : 'none'} color={isLiked ? '#EF4444' : '#FFFFFF'} />
          <span>{likesCount.toLocaleString()}</span>
        </button>
      </div>

      {/* Center Creator Info */}
      <div className="video-grid-center">
        <div className="video-grid-creator">
          <img src={clip.creatorAvatar} alt={clip.creatorName} className="video-grid-avatar" />
          <span className="video-grid-author">{clip.creatorName}</span>
        </div>
        <p className="video-grid-caption">{clip.caption}</p>
      </div>

      {/* Bottom Yellow Basket Tag */}
      <div className="video-grid-bottom">
        {pinned && (
          <div className="video-grid-basket">
            <span className="video-grid-basket-pill">🟡 ตะกร้าสีเหลือง</span>
            <div className="video-grid-basket-body">
              <img src={pinned.image} alt={pinned.name} className="video-grid-basket-thumb" />
              <div className="video-grid-basket-info">
                <span className="video-grid-basket-title">{pinned.name}</span>
                <span className="video-grid-basket-price">฿{pinned.price.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <Link to="/video" className="video-grid-watch-btn">
          <Play size={13} fill="currentColor" /> ดูคลิปเต็ม & ช้อปตะกร้าเหลือง
        </Link>
      </div>
    </div>
  );
}
