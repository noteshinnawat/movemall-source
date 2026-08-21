// src/pages/VideoFeedPage.tsx — TikTok & Shopee Video Feed with AI Recommendation Algorithm

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Plus,
  Check,
  Music2,
  Sparkles,
  Flame,
  Crown,
  ChevronUp,
  ChevronDown,
  X,
  Send,
  Zap,
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { initialVideoClips } from '../data/videoClips';
import { YellowBasketModal } from '../components/YellowBasketModal';
import { LocalizedLink } from '../i18n/LocalizedLink';
import { formatCurrency } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import type { VideoClip, VideoComment, Product } from '../types';
import './VideoFeedPage.css';

interface VideoFeedPageProps {
  onAddToCart: (product: Product, qty?: number) => void;
  customClips?: VideoClip[];
}

export function VideoFeedPage({ onAddToCart, customClips = [] }: VideoFeedPageProps) {
  const { t, i18n } = useTranslation(['engagement']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const money = (value: number) => formatCurrency(value, locale);

  // All video clips combined
  const [allClips, setAllClips] = useState<VideoClip[]>(() => {
    const saved = localStorage.getItem('movemall_custom_clips');
    const localClips: VideoClip[] = saved ? JSON.parse(saved) : [];
    return [...customClips, ...localClips, ...initialVideoClips];
  });

  // Algorithm Feed Tabs: 'foryou' (AI Personalized), 'trending' (Hot), 'mall' (Official Brands)
  const [feedMode, setFeedMode] = useState<'foryou' | 'trending' | 'mall'>('foryou');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Likes, Follows, Comments state
  const [likedList, setLikedList] = useState<Record<string, boolean>>({});
  const [likesCountMap, setLikesCountMap] = useState<Record<string, number>>(() =>
    initialVideoClips.reduce((acc, c) => ({ ...acc, [c.id]: c.likesCount }), {})
  );
  const [followedList, setFollowedList] = useState<Record<string, boolean>>({});
  const [selectedBasketClip, setSelectedBasketClip] = useState<VideoClip | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [liveBasketToast, setLiveBasketToast] = useState<{ user: string; timeAgo: string } | null>(null);

  // Live Realtime Buyer Toast on Yellow Basket
  useEffect(() => {
    const buyers = ['คุณณัฐพล (กทม.)', 'คุณปิยะดา (เชียงใหม่)', 'คุณธีรพงศ์ (นนทบุรี)', 'คุณชลธิชา (ชลบุรี)', 'คุณพงศกร (ภูเก็ต)'];
    
    const triggerToast = () => {
      const randomUser = buyers[Math.floor(Math.random() * buyers.length)];
      const sec = Math.floor(Math.random() * 20) + 3;
      setLiveBasketToast({
        user: randomUser,
        timeAgo: t('engagement:video.feed.toastTimeAgo', { seconds: sec }),
      });

      setTimeout(() => {
        setLiveBasketToast(null);
      }, 4500);
    };

    const initial = setTimeout(triggerToast, 2500);
    const interval = setInterval(triggerToast, 10000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [activeIndex, t]);

  // User category interest tracking for AI Algorithm
  const [userInterests, setUserInterests] = useState<Record<string, number>>({
    electronics: 5,
    fashion: 4,
    beauty: 3,
    home: 2,
    sports: 2,
    food: 3,
  });

  const touchStartY = useRef(0);
  const isScrolling = useRef(false);

  // 🧠 AI Recommendation Algorithm Engine
  const recommendedClips = useMemo(() => {
    let filtered = [...allClips];

    // Category filter if chosen
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    // Apply Algorithm Scoring based on feed mode
    if (feedMode === 'foryou') {
      // 🔮 AI Scoring = (Affinity * 30) + (Engagement Rate * 40) + (Mall Bonus * 20) + Recency
      return filtered.sort((a, b) => {
        const affinityA = userInterests[a.category] || 1;
        const affinityB = userInterests[b.category] || 1;

        const engageA = (a.likesCount * 2 + a.commentsCount * 5 + a.sharesCount * 8) / (a.viewsCount || 1000);
        const engageB = (b.likesCount * 2 + b.commentsCount * 5 + b.sharesCount * 8) / (b.viewsCount || 1000);

        const mallA = a.pinnedProducts?.[0]?.badge?.includes('MALL') ? 25 : 0;
        const mallB = b.pinnedProducts?.[0]?.badge?.includes('MALL') ? 25 : 0;

        const scoreA = affinityA * 20 + engageA * 50 + mallA;
        const scoreB = affinityB * 20 + engageB * 50 + mallB;

        return scoreB - scoreA;
      });
    } else if (feedMode === 'trending') {
      // 🔥 Trending = Sorted by raw Likes + Shares count
      return filtered.sort((a, b) => b.likesCount + b.sharesCount * 3 - (a.likesCount + a.sharesCount * 3));
    } else {
      // 👑 Mall = Official verified brand shops first
      return filtered.filter((c) => c.verified || c.pinnedProducts?.[0]?.badge?.includes('MALL'));
    }
  }, [allClips, feedMode, selectedCategory, userInterests]);

  const currentClip = recommendedClips[activeIndex] || recommendedClips[0] || allClips[0];

  // Touch Swipe Gesture (Swipe UP / DOWN)
  function handleTouchStart(e: React.TouchEvent) {
    if (isCommentsOpen || selectedBasketClip) return;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (isCommentsOpen || selectedBasketClip) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY < -45) {
      handleNext(); // Swiped Up -> Next Video
    } else if (deltaY > 45) {
      handlePrev(); // Swiped Down -> Prev Video
    }
  }

  // Mouse Wheel Scroll Navigation (Debounced)
  function handleWheel(e: React.WheelEvent) {
    if (isCommentsOpen || selectedBasketClip || isScrolling.current) return;
    if (e.deltaY > 40) {
      isScrolling.current = true;
      handleNext();
      setTimeout(() => {
        isScrolling.current = false;
      }, 350);
    } else if (e.deltaY < -40) {
      isScrolling.current = true;
      handlePrev();
      setTimeout(() => {
        isScrolling.current = false;
      }, 350);
    }
  }

  // Tab Visibility Auto-pause & Route Cleanup
  useEffect(() => {
    function handleVisibilityChange() {
      const videos = document.querySelectorAll<HTMLVideoElement>('.video-feed-card-bg');
      if (document.hidden) {
        videos.forEach((v) => v.pause());
      } else {
        const activeVideo = document.querySelector<HTMLVideoElement>(
          '.video-slide-item[style*="translateY(0%)"] .video-feed-card-bg'
        );
        activeVideo?.play().catch(() => {});
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      const videos = document.querySelectorAll<HTMLVideoElement>('.video-feed-card-bg');
      videos.forEach((v) => {
        v.pause();
        v.muted = true;
      });
    };
  }, [activeIndex]);

  // Lock Page / Window Scroll so swiping videos never scrolls the outer webpage
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    window.scrollTo(0, 0);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  const handleNext = useCallback(() => {
    if (activeIndex < recommendedClips.length - 1) {
      const nextIdx = activeIndex + 1;
      setActiveIndex(nextIdx);
      // Learn user affinity for AI algorithm
      const nextClip = recommendedClips[nextIdx];
      if (nextClip) {
        setUserInterests((prev) => ({
          ...prev,
          [nextClip.category]: (prev[nextClip.category] || 0) + 1,
        }));
      }
    } else {
      setActiveIndex(0); // loop back
    }
    setIsPlaying(true);
  }, [activeIndex, recommendedClips]);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    } else {
      setActiveIndex(recommendedClips.length - 1);
    }
    setIsPlaying(true);
  }, [activeIndex, recommendedClips.length]);

  // Keyboard Arrow Up / Down
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isCommentsOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isCommentsOpen]);

  function handleToggleLike(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const isLiked = !!likedList[id];
    setLikedList((prev) => ({ ...prev, [id]: !isLiked }));
    setLikesCountMap((prev) => ({ ...prev, [id]: (prev[id] || 0) + (isLiked ? -1 : 1) }));

    if (!isLiked) {
      // Trigger heart blast animation
      const heartId = Date.now() + Math.random();
      const x = e ? e.clientX - 20 : window.innerWidth / 2 - 20;
      const y = e ? e.clientY - 20 : window.innerHeight / 2 - 20;
      setFloatingHearts((prev) => [...prev, { id: heartId, x, y }]);
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((h) => h.id !== heartId));
      }, 1000);
    }
  }

  function handleToggleFollow(creatorId: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setFollowedList((prev) => ({ ...prev, [creatorId]: !prev[creatorId] }));
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommentText.trim() || !currentClip) return;

    const newComment: VideoComment = {
      id: `comment-${Date.now()}`,
      userId: 'my-user-id',
      userName: t('engagement:video.feed.myCommentUser'),
      text: newCommentText.trim(),
      time: t('engagement:video.feed.myCommentTime'),
      likesCount: 0,
      badge: t('engagement:video.feed.myCommentBadge'),
    };

    setAllClips((prev) =>
      prev.map((c) => {
        if (c.id === currentClip.id) {
          return {
            ...c,
            commentsCount: c.commentsCount + 1,
            comments: [newComment, ...(c.comments || [])],
          };
        }
        return c;
      })
    );
    setNewCommentText('');
  }

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href);
    setShareToast(t('engagement:video.feed.linkCopied'));
    setTimeout(() => setShareToast(null), 2500);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if ((elem as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
        (elem as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
        (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }

  return (
    <main
      className="video-feed-page"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* ── Vertical Swiper Deck Frame (TikTok Slide Container) ── */}
      <div className="video-deck-container">
        {/* ── Top Header Section (Tabs + Controls + Sub-categories) ── */}
        <div className="video-feed-header-wrap">
          <div className="video-feed-navbar">
            {/* Main Algorithm Tabs */}
            <div className="video-algo-tabs">
              <button
                className={`video-algo-tab ${feedMode === 'foryou' ? 'active' : ''}`}
                onClick={() => {
                  setFeedMode('foryou');
                  setActiveIndex(0);
                }}
              >
                <Sparkles size={13} /> {t('engagement:video.feed.tabForYou')}
              </button>
              <button
                className={`video-algo-tab ${feedMode === 'trending' ? 'active' : ''}`}
                onClick={() => {
                  setFeedMode('trending');
                  setActiveIndex(0);
                }}
              >
                <Flame size={13} /> {t('engagement:video.feed.tabTrending')}
              </button>
              <button
                className={`video-algo-tab ${feedMode === 'mall' ? 'active' : ''}`}
                onClick={() => {
                  setFeedMode('mall');
                  setActiveIndex(0);
                }}
              >
                <Crown size={13} /> {t('engagement:video.feed.tabMall')}
              </button>
            </div>

            {/* Top Right Actions: Fullscreen, Search & Create Clip */}
            <div className="video-header-right-actions">
              <button
                onClick={toggleFullscreen}
                className="video-search-header-btn"
                title={isFullscreen ? t('engagement:video.feed.exitFullscreen') : t('engagement:video.feed.enterFullscreen')}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <LocalizedLink to="/shop" className="video-search-header-btn" title={t('engagement:video.feed.searchProducts')}>
                <Search size={14} />
              </LocalizedLink>
              <Link to="/video/create" className="video-create-header-btn" title={t('engagement:video.feed.createClip')}>
                <Plus size={13} /> <span className="video-create-text">{t('engagement:video.feed.createClipShort')}</span>
              </Link>
            </div>
          </div>

          {/* ── Sub Category Filter Pills Bar ── */}
          <div className="video-sub-cat-bar">
            {[
              'all', 'electronics', 'fashion', 'beauty', 'home', 'sports', 'food', 'toys', 'baby',
            ].map((catId) => ({ id: catId, label: t(`engagement:video.feed.categories.${catId}`) })).map((cat) => (
              <button
                key={cat.id}
                className={`video-sub-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setActiveIndex(0);
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        {/* Navigation Arrow Indicators for Desktop */}
        <div className="video-nav-arrows">
          <button
            className="video-nav-arrow-btn"
            onClick={handlePrev}
            title={t('engagement:video.feed.prevClip')}
            aria-label="Previous"
          >
            <ChevronUp size={22} />
          </button>
          <button
            className="video-nav-arrow-btn"
            onClick={handleNext}
            title={t('engagement:video.feed.nextClip')}
            aria-label="Next"
          >
            <ChevronDown size={22} />
          </button>
        </div>

        {/* Video Slides Stack */}
        <div className="video-slides-stack">
          {recommendedClips.map((clip, idx) => {
            const isCurrent = activeIndex === idx;
            const isPrev = idx < activeIndex;
            const isNext = idx > activeIndex;

            let transform = 'translateY(100%)';
            if (isCurrent) transform = 'translateY(0%)';
            if (isPrev) transform = 'translateY(-100%)';

            const pinned = clip.pinnedProducts?.[0];
            const isLiked = !!likedList[clip.id];
            const isFollowed = !!followedList[clip.creatorId];

            return (
              <div
                key={clip.id}
                className="video-slide-item"
                style={{
                  transform,
                  opacity: isCurrent ? 1 : 0,
                  pointerEvents: isCurrent ? 'auto' : 'none',
                }}
              >
                {/* Video Media Background with full-bleed fallback cover */}
                <div
                  className="video-feed-card-bg-wrap"
                  style={{
                    backgroundImage: `url(${clip.coverImage})`,
                  }}
                >
                  <video
                    src={clip.videoUrl}
                    poster={clip.coverImage}
                    className="video-feed-card-bg"
                    autoPlay={isCurrent}
                    loop
                    playsInline
                    muted={isMuted}
                    onClick={() => setIsPlaying(!isPlaying)}
                  />
                </div>
                <div className="video-feed-card-gradient" />



                {/* Audio Mute / Unmute Button */}
                <button
                  className="video-sound-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  title={isMuted ? t('engagement:video.feed.unmute') : t('engagement:video.feed.mute')}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                {/* ── Right Vertical Action Bar (Like, Comment, Share) ── */}
                <aside className="video-right-actions">
                  {/* Creator Profile Avatar */}
                  <div className="video-action-avatar-wrap">
                    <img
                      src={clip.creatorAvatar}
                      alt={clip.creatorName}
                      className="video-action-avatar-img"
                    />
                    <button
                      className="video-action-follow-badge"
                      onClick={(e) => handleToggleFollow(clip.creatorId, e)}
                      style={{ background: isFollowed ? '#10B981' : '#EF4444' }}
                      title={isFollowed ? t('engagement:video.feed.following') : t('engagement:video.feed.follow')}
                    >
                      {isFollowed ? <Check size={10} /> : <Plus size={10} />}
                    </button>
                  </div>

                  {/* Like Button */}
                  <div className="video-action-btn-item">
                    <button
                      className="video-action-circle"
                      onClick={(e) => handleToggleLike(clip.id, e)}
                    >
                      <Heart
                        size={22}
                        fill={isLiked ? '#EF4444' : 'none'}
                        color={isLiked ? '#EF4444' : '#FFFFFF'}
                      />
                    </button>
                    <span className="video-action-count">
                      {((likesCountMap[clip.id] || clip.likesCount) / 1000).toFixed(1)}k
                    </span>
                  </div>

                  {/* Comments Button */}
                  <div className="video-action-btn-item">
                    <button
                      className="video-action-circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCommentsOpen(true);
                      }}
                    >
                      <MessageCircle size={22} />
                    </button>
                    <span className="video-action-count">{clip.commentsCount || 0}</span>
                  </div>

                  {/* Share Button */}
                  <div className="video-action-btn-item">
                    <button
                      className="video-action-circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
                      }}
                    >
                      <Share2 size={22} />
                    </button>
                    <span className="video-action-count">{clip.sharesCount || 0}</span>
                  </div>

                  {/* Spinning Vinyl Disc */}
                  <div className="video-vinyl-disc-spin">
                    <Music2 size={14} />
                  </div>
                </aside>

                {/* ── Bottom Overlay Details & Yellow Basket ── */}
                <div className="video-bottom-overlay">
                  {/* Realtime Live Purchase Alert directly attached to Yellow Basket */}
                  {isCurrent && liveBasketToast && pinned && (
                    <div className="video-basket-live-toast">
                      <span className="video-basket-toast-fire">🔥</span>
                      <span className="video-basket-toast-text">
                        {t('engagement:video.feed.justPurchased', { timeAgo: liveBasketToast.timeAgo })}
                      </span>
                    </div>
                  )}

                  {/* Yellow Basket Pinned Product Bar */}
                  {pinned && (
                    <div
                      className="video-yellow-basket-strip"
                      onClick={() => setSelectedBasketClip(clip)}
                    >
                      <div className="video-yellow-basket-left">
                        <div className="video-yellow-basket-pill">
                          <span className="video-basket-dot" />
                          <span>{t('engagement:video.feed.basketPill', { id: pinned.id })}</span>
                        </div>
                        <div className="video-yellow-basket-info">
                          <img
                            src={pinned.image}
                            alt={pinned.name}
                            className="video-yellow-basket-thumb"
                          />
                          <div className="video-yellow-basket-text">
                            <span className="video-yellow-basket-name">{pinned.name}</span>
                            <div className="video-yellow-basket-prices">
                              <strong className="video-yellow-basket-price">
                                {money(pinned.price)}
                              </strong>
                              {pinned.originalPrice && (
                                <span className="video-yellow-basket-orig">
                                  {money(pinned.originalPrice)}
                                </span>
                              )}
                              <span className="video-yellow-basket-sale-tag">{t('engagement:video.feed.viewProduct')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className="video-yellow-basket-buy-btn">
                        <Zap size={14} fill="#FFFFFF" /> {t('engagement:video.feed.buyNow')}
                      </button>
                    </div>
                  )}

                  {/* Creator Info & Caption */}
                  <div className="video-caption-container">
                    <div className="video-creator-meta">
                      <strong className="video-creator-name">{clip.creatorName}</strong>
                      <span className="video-creator-handle">{clip.creatorHandle}</span>
                    </div>

                    <p className="video-caption-text">{clip.caption}</p>

                    <div className="video-hashtags-row">
                      {clip.hashtags.map((tag, i) => (
                        <span key={i} className="video-hashtag-item">
                          {tag}{' '}
                        </span>
                      ))}
                    </div>

                    {/* Sound Track */}
                    <div className="video-soundtrack-marquee">
                      <Music2 size={12} />
                      <span className="video-soundtrack-title">{clip.soundTitle}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Yellow Basket Modal Drawer ── */}
      {selectedBasketClip && (
        <YellowBasketModal
          isOpen={!!selectedBasketClip}
          products={selectedBasketClip.pinnedProducts || []}
          onClose={() => setSelectedBasketClip(null)}
          onAddToCart={onAddToCart}
        />
      )}

      {/* ── Comments Drawer ── */}
      {isCommentsOpen && (
        <div className="video-comments-overlay" onClick={() => setIsCommentsOpen(false)}>
          <div className="video-comments-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="video-comments-header">
              <h3 className="video-comments-title">
                {t('engagement:video.feed.commentsHeader', { count: currentClip?.commentsCount || 0 })}
              </h3>
              <button
                className="video-comments-close"
                onClick={() => setIsCommentsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="video-comments-list">
              {(currentClip?.comments || []).map((cm) => (
                <div key={cm.id} className="video-comment-row">
                  <div className="video-comment-avatar-wrap">
                    {cm.userAvatar ? (
                      <img src={cm.userAvatar} alt={cm.userName} className="video-comment-avatar" />
                    ) : (
                      <div className="video-comment-avatar-ph">
                        {cm.userName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="video-comment-bubble">
                    <div className="video-comment-user-row">
                      <span className="video-comment-username">{cm.userName}</span>
                      {cm.badge && <span className="video-comment-badge">{cm.badge}</span>}
                      <span className="video-comment-time">{cm.time}</span>
                    </div>
                    <p className="video-comment-content">{cm.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <form className="video-comments-input-bar" onSubmit={handleAddComment}>
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={t('engagement:video.feed.commentPlaceholder')}
                className="video-comment-input"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="video-comment-send-btn"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Heart Blast */}
      {floatingHearts.map((h) => (
        <span
          key={h.id}
          className="video-floating-heart"
          style={{ left: `${h.x}px`, top: `${h.y}px` }}
        >
          ❤️
        </span>
      ))}

      {/* Share Toast */}
      {shareToast && (
        <div className="video-share-toast">
          <span>{shareToast}</span>
        </div>
      )}
    </main>
  );
}

export default VideoFeedPage;
