// src/pages/LiveStreamPage.tsx — TikTok & Shopee Video Vertical Swipe Feed with Yellow Basket

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Send, Eye, Volume2, VolumeX, X, Plus, Check, Share2, MessageCircle, ChevronUp, ChevronDown, Sparkles, Smile, Gift, ShoppingCart, Maximize2, Minimize2 } from 'lucide-react';
import { mockLiveStreams } from '../data/liveStreams';
import { products as staticProducts } from '../data/products';
import type { Product } from '../types';
import './LiveStreamPage.css';

interface LiveStreamPageProps {
  products?: Product[];
  onAddToCart: (product: Product, qty?: number) => void;
  cartCount?: number;
}

interface HeartEffect {
  id: number;
  emoji: string;
  left: number;
}

interface FloatingChatMsg {
  id: number;
  user: string;
  text: string;
  color: string;
  badge?: string;
}

import { fetchActiveLiveStreamsApi } from '../utils/api';

export function LiveStreamPage({ products, onAddToCart, cartCount = 0 }: LiveStreamPageProps) {
  const [streamsList, setStreamsList] = useState<any[]>(mockLiveStreams);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'following' | 'foryou'>('foryou');
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [likedList, setLikedList] = useState<Record<string, boolean>>({});
  const [likesMap, setLikesMap] = useState<Record<string, number>>(() =>
    mockLiveStreams.reduce((acc, item) => ({ ...acc, [item.id]: item.likesCount }), {})
  );
  const [followedList, setFollowedList] = useState<Record<string, boolean>>({});
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [hearts, setHearts] = useState<HeartEffect[]>([]);
  const [inputComment, setInputComment] = useState('');
  const [floatingChats, setFloatingChats] = useState<FloatingChatMsg[]>([]);

  const activeCatalog = useMemo(
    () => products && products.length > 0 ? products : staticProducts,
    [products]
  );

  useEffect(() => {
    async function loadLiveStreams() {
      try {
        const res = await fetchActiveLiveStreamsApi();
        if (res && Array.isArray(res.streams) && res.streams.length > 0) {
          const mapped = res.streams.map((s: any, idx: number) => {
            const foundPinned = s.pinnedProductId ? activeCatalog.find(p => p.id === s.pinnedProductId) : null;
            const pinnedProd = foundPinned ? {
              id: foundPinned.id,
              name: foundPinned.name,
              price: foundPinned.price,
              originalPrice: foundPinned.originalPrice || foundPinned.price * 1.5,
              image: foundPinned.images[0] || s.coverImage,
              stock: foundPinned.stock || 50,
              rating: foundPinned.rating || 4.9,
              soldCount: (foundPinned as any).salesCount || 120,
            } : (s.pinnedProduct || {
              id: 'el-1',
              name: 'ดีลพิเศษในไลฟ์',
              price: 990,
              originalPrice: 1990,
              image: s.coverImage,
              stock: 35,
              rating: 4.9,
              soldCount: 850,
            });

            // Find store products for yellow basket
            const storeProds = activeCatalog
              .filter(p => p.storeId === s.storeId)
              .slice(0, 4)
              .map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                originalPrice: p.originalPrice || p.price * 1.5,
                image: p.images[0],
                stock: p.stock,
                rating: p.rating,
                soldCount: (p as any).salesCount || 50,
              }));

            return {
              id: s.id,
              channelName: s.store?.name || 'Movemall Official Live',
              avatar: s.store?.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
              isMall: s.store?.isMall ?? true,
              followers: `${Math.floor(20 + idx * 15)}K`,
              videoUrl: s.streamUrl,
              coverImage: s.coverImage,
              viewers: `${s.viewersCount || 1500} คนดู`,
              likesCount: s.likesCount || 10000,
              caption: s.title,
              tags: ['#MovemallLive', '#ลดราคา', '#ของแท้'],
              voucherCode: 'LIVE50',
              voucherDiscount: 'ลด 50%',
              pinnedProduct: pinnedProd,
              basketProducts: storeProds.length > 0 ? storeProds : [pinnedProd],
            };
          });
          setStreamsList(mapped);
        }
      } catch {
        // Fallback
      }
    }
    loadLiveStreams();
  }, [activeCatalog]);

  const touchStartY = useRef(0);
  const isScrolling = useRef(false);

  const currentStream = streamsList[activeIndex] || mockLiveStreams[0];

  const handleNext = useCallback(() => {
    setActiveIndex(prev => Math.min(prev + 1, Math.max(0, streamsList.length - 1)));
  }, [streamsList.length]);

  const handlePrev = useCallback(() => {
    setActiveIndex(prev => Math.max(prev - 1, 0));
  }, []);

  // Touch swipe handling
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY < -50) {
      // Swiped UP -> Next video
      handleNext();
    } else if (deltaY > 50) {
      // Swiped DOWN -> Prev video
      handlePrev();
    }
  }

  // Mouse Wheel scroll handling with debounce
  function handleWheel(e: React.WheelEvent) {
    if (isScrolling.current) return;
    if (e.deltaY > 40) {
      isScrolling.current = true;
      handleNext();
      setTimeout(() => { isScrolling.current = false; }, 400);
    } else if (e.deltaY < -40) {
      isScrolling.current = true;
      handlePrev();
      setTimeout(() => { isScrolling.current = false; }, 400);
    }
  }

  // Keyboard Arrow Up / Down handling & Tab Visibility Auto-pause
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') handleNext();
      if (e.key === 'ArrowUp') handlePrev();
    }

    function handleVisibilityChange() {
      const videos = document.querySelectorAll<HTMLVideoElement>('.tiktok-video-bg');
      if (document.hidden) {
        videos.forEach(v => v.pause());
      } else {
        const currentVideo = document.querySelector<HTMLVideoElement>('.tiktok-slide-card:not([style*="opacity: 0"]) .tiktok-video-bg');
        currentVideo?.play().catch(() => {});
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Cleanup: pause all live stream videos when navigating away
      const videos = document.querySelectorAll<HTMLVideoElement>('.tiktok-video-bg');
      videos.forEach(v => {
        v.pause();
        v.muted = true;
      });
    };
  }, [handleNext, handlePrev]);

  // ── Floating Chat Overlay: simulate incoming comments ──
  useEffect(() => {
    const fakeUsers = [
      { name: 'น้องแนน', color: '#93C5FD', badge: '💎' },
      { name: 'ป้าแดง', color: '#FCA5A5', badge: '🔥' },
      { name: 'krit_shop', color: '#6EE7B7', badge: '⭐' },
      { name: 'มะลิ_2025', color: '#FDE68A', badge: '🛍️' },
      { name: 'สมชาย99', color: '#C4B5FD', badge: '👑' },
      { name: 'BamBam', color: '#FB923C', badge: '💕' },
      { name: 'ต้อม_TP', color: '#67E8F9', badge: '✨' },
      { name: 'ยุ้ย_Yui', color: '#F9A8D4', badge: '🎀' },
    ];
    const fakeMsgs = [
      'สวยมากเลยค่ะ 😍',
      'ราคาดีมากๆ เลย!',
      'สั่งได้ที่ไหนคะ?',
      'ขอรีวิวหน่อยนะคะ',
      'น่าซื้อมากเลย 🔥🔥',
      'Hello from Thailand 🇹🇭',
      'คุณภาพดีไหมครับ?',
      'กำลังดูอยู่เลย ❤️',
      'ส่งฟรีไหมคะ?',
      'สั่งแล้วนะคะ!',
      'ซื้อเลยยย 🛒',
      'มีสีอื่นไหมคะ',
      'น่ารักมากค่ะ 💖',
      '฿ถูกมากจริงๆ',
      'live ดีมากเลยนะ',
    ];

    const interval = setInterval(() => {
      const u = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
      const msg: FloatingChatMsg = {
        id: Date.now() + Math.random(),
        user: u.name,
        text: fakeMsgs[Math.floor(Math.random() * fakeMsgs.length)],
        color: u.color,
        badge: u.badge,
      };
      setFloatingChats(prev => [...prev.slice(-5), msg]);
      // Auto-remove after 8s
      setTimeout(() => {
        setFloatingChats(prev => prev.filter(c => c.id !== msg.id));
      }, 8000);
    }, Math.random() * 1500 + 1800);

    return () => clearInterval(interval);
  }, [activeIndex]);

  function handleToggleLike(id: string) {
    const isLiked = !!likedList[id];
    setLikedList(prev => ({ ...prev, [id]: !isLiked }));
    setLikesMap(prev => ({ ...prev, [id]: (prev[id] || 0) + (isLiked ? -1 : 1) }));

    if (!isLiked) {
      // Trigger TikTok floating heart blast
      const emojis = ['❤️', '🔥', '💖', '⭐', '✨'];
      const newH: HeartEffect = {
        id: Date.now() + Math.random(),
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        left: Math.random() * 40 + 30,
      };
      setHearts(prev => [...prev.slice(-8), newH]);
      setTimeout(() => setHearts(prev => prev.filter(h => h.id !== newH.id)), 1800);
    }
  }

  function handleToggleFollow(storeId: string) {
    setFollowedList(prev => ({ ...prev, [storeId]: !prev[storeId] }));
  }

  function handleBuy(product = currentStream.pinnedProduct) {
    const matchedProduct = activeCatalog.find(p => p.id === product.id) || {
      id: product.id,
      storeId: currentStream.storeId,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      images: [product.image],
      category: currentStream.category,
      rating: 5,
      reviewCount: 48,
      stock: 20,
      description: 'สินค้าลดราคาพิเศษเฉพาะในไลฟ์สด',
      tags: ['Live', 'Sale'],
    };
    onAddToCart(matchedProduct, 1);
    setIsBasketOpen(false);
  }

  function handleSendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!inputComment.trim()) return;
    const text = inputComment.trim();
    currentStream.comments.push({
      user: 'คุณ (ฉัน)',
      text,
      time: 'เมื่อสักครู่',
      badge: 'ผู้ใช้',
    });
    // Also show in floating chat overlay
    const myMsg: FloatingChatMsg = {
      id: Date.now() + Math.random(),
      user: 'ฉัน',
      text,
      color: '#FFFFFF',
      badge: '💬',
    };
    setFloatingChats(prev => [...prev.slice(-9), myMsg]);
    setTimeout(() => {
      setFloatingChats(prev => prev.filter(c => c.id !== myMsg.id));
    }, 6000);
    setInputComment('');
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
      className="tiktok-live-page"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div className="tiktok-live-frame">
        {/* ── Top Header Tabs ── */}
        <header className="tiktok-top-header">
          <div className="tiktok-top-tabs">
            <span
              className={`tiktok-tab-item ${activeTab === 'following' ? 'tiktok-tab-item--active' : ''}`}
              onClick={() => setActiveTab('following')}
            >
              กำลังติดตาม
            </span>
            <span
              className={`tiktok-tab-item ${activeTab === 'foryou' ? 'tiktok-tab-item--active' : ''}`}
              onClick={() => setActiveTab('foryou')}
            >
              สำหรับคุณ (LIVE)
            </span>
          </div>

          <div className="tiktok-top-right-controls">
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="tiktok-control-btn"
              title={isFullscreen ? 'ย่อหน้าจอ' : 'แสดงเต็มจอ (ซ่อนแถบ)'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Personal Cart Button with Badge */}
            <Link to="/cart" className="tiktok-control-btn tiktok-user-cart-btn" title="ตะกร้าสินค้าของฉัน">
              <ShoppingCart size={16} />
              {cartCount > 0 && <span className="tiktok-user-cart-badge">{cartCount}</span>}
            </Link>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="tiktok-control-btn"
              title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <Link to="/" className="tiktok-control-btn" title="กลับสู่หน้าหลัก">
              <X size={18} />
            </Link>
          </div>
        </header>

        {/* ── Vertical Swiper Stream Slides ── */}
        <div className="tiktok-feed-wrapper">
          {mockLiveStreams.map((stream, idx) => {
            const isCurrent = activeIndex === idx;
            const isPrev = idx < activeIndex;
            const isNext = idx > activeIndex;

            let transform = 'translateY(100%)';
            if (isCurrent) transform = 'translateY(0%)';
            if (isPrev) transform = 'translateY(-100%)';

            return (
              <div
                key={stream.id}
                className="tiktok-slide-card"
                style={{
                  transform,
                  opacity: isCurrent ? 1 : 0,
                  pointerEvents: isCurrent ? 'auto' : 'none',
                }}
              >
                {/* Fullscreen Video Background */}
                <video
                  src={stream.videoUrl}
                  autoPlay={isCurrent}
                  loop
                  muted={isMuted}
                  playsInline
                  className="tiktok-video-bg"
                />
                <div className="tiktok-video-gradient" />

                {/* ── Right Vertical Action Bar ── */}
                <aside className="tiktok-right-action-bar">
                  {/* Creator Profile Avatar */}
                  <div className="tiktok-action-item">
                    <div className="tiktok-creator-avatar-wrap">
                      <img src={stream.streamerAvatar} alt={stream.streamerName} className="tiktok-creator-avatar" />
                      <button
                        className="tiktok-creator-follow-badge"
                        onClick={() => handleToggleFollow(stream.storeId)}
                        style={{ background: followedList[stream.storeId] ? '#10B981' : '#EF4444' }}
                      >
                        {followedList[stream.storeId] ? <Check size={10} /> : <Plus size={10} />}
                      </button>
                    </div>
                  </div>

                  {/* Like Button */}
                  <div className="tiktok-action-item">
                    <button
                      className="tiktok-action-btn-circle"
                      onClick={() => handleToggleLike(stream.id)}
                    >
                      <Heart
                        size={24}
                        fill={likedList[stream.id] ? '#EF4444' : 'none'}
                        color={likedList[stream.id] ? '#EF4444' : '#FFFFFF'}
                      />
                    </button>
                    <span className="tiktok-action-label">
                      {((likesMap[stream.id] || stream.likesCount) / 1000).toFixed(1)}k
                    </span>
                  </div>
                </aside>

                {/* ── Bottom Left Information ── */}
                <div className="tiktok-bottom-content">
                  {/* Creator Handle */}
                  <div className="tiktok-creator-row">
                    <div className="tiktok-creator-name-box">
                      <span className="tiktok-creator-handle">
                        @{stream.channelName.replace(/\s+/g, '').toLowerCase()}
                      </span>
                      <span className="tiktok-badge-pill">{stream.badge}</span>
                    </div>
                  </div>

                  {/* Caption & Hashtags */}
                  <p className="tiktok-caption-text">
                    {stream.caption}{' '}
                    {stream.hashtags.map(tag => (
                      <span key={tag} className="tiktok-hashtag-tag">{tag} </span>
                    ))}
                  </p>

                  {/* ── Yellow Basket Deal Card (Integrated Balanced Banner) ── */}
                  <div className="tiktok-yellow-basket-card">
                    <div className="tiktok-basket-left">
                      <div className="tiktok-basket-thumb-wrap">
                        <img src={stream.pinnedProduct.image} alt={stream.pinnedProduct.name} className="tiktok-basket-thumb" />
                        <span className="tiktok-basket-num-badge">1</span>
                      </div>
                      <div className="tiktok-basket-info">
                        <div className="tiktok-basket-badge-row">
                          <span className="tiktok-basket-icon-tag">
                            <ShoppingBag size={10} /> ลด {stream.pinnedProduct.discountPct}%
                          </span>
                          <span className="tiktok-urgency-ticker">
                            <Sparkles size={10} /> ดีลไลฟ์สด
                          </span>
                        </div>
                        <span className="tiktok-basket-title">{stream.pinnedProduct.name}</span>
                        <div className="tiktok-basket-price-row">
                          <span className="tiktok-basket-price-now">฿{stream.pinnedProduct.price.toLocaleString()}</span>
                          <span className="tiktok-basket-price-old">฿{stream.pinnedProduct.originalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <button className="tiktok-basket-buy-btn" onClick={() => handleBuy(stream.pinnedProduct)}>
                      <span>⚡ สั่งซื้อ</span>
                      <span style={{ fontSize: 9, opacity: 0.9, fontWeight: 700 }}>ส่งฟรี 0.-</span>
                    </button>
                  </div>
                </div>

                {/* ── Authentic TikTok Bottom Action Bar ── */}
                <div className="tiktok-live-bottom-bar">
                  {/* Yellow Basket Quick Button (สินค้าในไลฟ์) */}
                  <button className="tiktok-bottom-basket-btn" onClick={() => setIsBasketOpen(true)} title="ดูสินค้าทั้งหมดในไลฟ์สด">
                    <ShoppingBag size={18} color="#FFFFFF" />
                    <span className="tiktok-bottom-basket-badge">99+</span>
                  </button>

                  {/* Comment Input Pill Bar */}
                  <div className="tiktok-bottom-comment-pill" onClick={() => setIsCommentsOpen(true)}>
                    <span className="tiktok-bottom-comment-placeholder">พิมพ์...</span>
                    <Smile size={18} className="tiktok-emoji-icon" />
                  </div>

                  {/* Rose Gift Button */}
                  <button className="tiktok-bottom-action-icon-btn" onClick={() => handleToggleLike(stream.id)} title="ส่งหัวใจ / ดอกกุหลาบ">
                    <span style={{ fontSize: 16 }}>🌹</span>
                  </button>

                  {/* Gift Box Button */}
                  <button className="tiktok-bottom-action-icon-btn" onClick={() => handleToggleLike(stream.id)} title="ส่งของขวัญ">
                    <Gift size={18} color="#F43F5E" />
                  </button>

                  {/* Share Button */}
                  <button className="tiktok-bottom-action-icon-btn" onClick={() => alert(`แชร์ไลฟ์สดของ ${stream.channelName} เรียบร้อยแล้ว!`)} title="แชร์ไลฟ์สด">
                    <Share2 size={16} color="#FFFFFF" />
                    <span className="tiktok-bottom-share-count">{stream.sharesCount}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Floating Heart Burst Particles ── */}
        <div className="tiktok-floating-hearts-lane">
          {hearts.map(h => (
            <div key={h.id} className="tiktok-heart-particle" style={{ left: `${h.left}%` }}>
              {h.emoji}
            </div>
          ))}
        </div>

        {/* ── Floating Live Chat Overlay (TikTok-style) ── */}
        <div className="live-chat-overlay">
          {floatingChats.map(msg => (
            <div key={msg.id} className="live-chat-bubble">
              {msg.badge && <span className="live-chat-badge">{msg.badge}</span>}
              <span className="live-chat-username" style={{ color: msg.color }}>
                {msg.user}
              </span>
              <span className="live-chat-text">{msg.text}</span>
            </div>
          ))}
        </div>

        {/* ── Comments Drawer Sheet ── */}
        {isCommentsOpen && (
          <div className="tiktok-comments-drawer-backdrop" onClick={() => setIsCommentsOpen(false)}>
            <div className="tiktok-comments-drawer" onClick={e => e.stopPropagation()}>
              <div className="tiktok-comments-header">
                <span>ความคิดเห็น ({currentStream.comments.length})</span>
                <button onClick={() => setIsCommentsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <div className="tiktok-comments-list">
                {(currentStream.comments || []).map((c: any, i: number) => (
                  <div key={i} className="tiktok-comment-row">
                    <img src={currentStream.streamerAvatar || currentStream.avatar} alt={c.user} className="tiktok-comment-avatar" />
                    <div className="tiktok-comment-bubble">
                      <div style={{ fontWeight: 800, fontSize: 11, color: '#93C5FD', marginBottom: 2 }}>{c.user}</div>
                      <div>{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendComment} style={{ display: 'flex', gap: 6, paddingTop: 8, borderTop: '1px solid #27272A' }}>
                <input
                  type="text"
                  placeholder="เพิ่มความคิดเห็นในคลิป..."
                  value={inputComment}
                  onChange={e => setInputComment(e.target.value)}
                  style={{ flex: 1, background: '#27272A', border: 'none', color: 'white', padding: '8px 12px', fontSize: 12, borderRadius: 0, outline: 'none' }}
                />
                <button type="submit" style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Send size={13} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── TikTok Shop Bottom Basket Drawer ── */}
        {isBasketOpen && (
          <div className="tiktok-comments-drawer-backdrop" onClick={() => setIsBasketOpen(false)}>
            <div className="tiktok-comments-drawer" onClick={e => e.stopPropagation()} style={{ height: '70%' }}>
              <div className="tiktok-comments-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShoppingBag size={18} style={{ color: '#F59E0B' }} />
                  <span>สินค้าในตะกร้าคลิปนี้ ({currentStream.channelName})</span>
                </div>
                <button onClick={() => setIsBasketOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <div className="tiktok-comments-list">
                <div style={{ background: '#27272A', padding: 12, borderRadius: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <img src={currentStream.pinnedProduct.image} alt={currentStream.pinnedProduct.name} style={{ width: 60, height: 60, borderRadius: 0, objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 900, marginBottom: 2 }}>🔥 ปักหมุดในคลิป</div>
                    <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentStream.pinnedProduct.name}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#EF4444', marginTop: 4 }}>
                      ฿{currentStream.pinnedProduct.price.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuy(currentStream.pinnedProduct)}
                    style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: 0, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    ใส่ตะกร้า
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Desktop Swipe Navigation Arrows ── */}
        {activeIndex > 0 && (
          <button className="tiktok-nav-arrow-up" onClick={handlePrev} title="คลิปก่อนหน้า (Arrow Up)">
            <ChevronUp size={24} />
          </button>
        )}
        {activeIndex < mockLiveStreams.length - 1 && (
          <button className="tiktok-nav-arrow-down" onClick={handleNext} title="คลิปถัดไป (Arrow Down)">
            <ChevronDown size={24} />
          </button>
        )}
      </div>
    </main>
  );
}

export default LiveStreamPage;
