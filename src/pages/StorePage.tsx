// src/pages/StorePage.tsx — Movemall Modern Storefront

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, UserPlus, Check, Star, MapPin, ShieldCheck, Radio, Play, Ticket, Sparkles, Flag, AlertTriangle } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ReportStoreModal } from '../components/ReportStoreModal';
import { stores, getStoreById } from '../data/stores';
import { products as staticProducts } from '../data/products';
import { mockLiveStreams } from '../data/liveStreams';
import { fetchApi } from '../utils/api';
import { generateSlug } from '../utils/slug';
import type { Product, Store } from '../types';
import './StorePage.css';

interface StorePageProps {
  onAddToCart: (product: Product) => void;
  isWishlisted?: (productId: string) => boolean;
  onToggleWishlist?: (product: Product) => void;
  allProducts?: Product[];
}

export function StorePage({ onAddToCart, isWishlisted, onToggleWishlist, allProducts }: StorePageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [remoteStore, setRemoteStore] = useState<Store | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'sale'>('all');
  const [claimedVouchers, setClaimedVouchers] = useState<Record<string, boolean>>({});
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // 1. Resolve store from static data or active seller profile in localStorage
  const resolvedLocalStore: Store | undefined = (() => {
    if (!id) return stores[0];
    
    // Check static stores by ID or Slug
    const foundStatic = getStoreById(id);
    if (foundStatic) return foundStatic;

    // Check if it's the current user's registered store
    const customName = localStorage.getItem('movemall_custom_store_name') || localStorage.getItem('movemall_my_store_name');
    const customId = localStorage.getItem('movemall_seller_store_id');
    const customSlug = localStorage.getItem('movemall_store_slug') || (customName ? generateSlug(customName) : '');

    if (customName && (id === customId || id === customSlug || id === 'store-my-live' || id.toLowerCase() === generateSlug(customName).toLowerCase())) {
      return {
        id: customId || `store-${Date.now()}`,
        slug: customSlug,
        name: customName,
        logo: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=300&q=80',
        banner: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
        badge: 'verified',
        rating: 5.0,
        reviewCount: 48,
        responseRate: '100%',
        responseTime: 'ภายในไม่กี่นาที',
        joinedDate: 'เพิ่งเปิดร้านใหม่',
        productCount: 3,
        followerCount: 12,
        location: 'กรุงเทพมหานคร',
        description: 'ร้านค้าทางการในระบบ Movemall การันตีสินค้าแท้ 100% จัดส่งรวดเร็ว',
      };
    }

    return undefined;
  })();

  const store: Store = remoteStore || resolvedLocalStore || stores[0];

  // 2. Fetch from backend API if not found locally
  useEffect(() => {
    if (!resolvedLocalStore && id) {
      fetchApi<{ store: Store }>(`/api/stores/${encodeURIComponent(id)}`)
        .then(res => {
          if (res && res.store) {
            setRemoteStore({
              ...res.store,
              reviewCount: res.store.reviewCount || 10,
              responseRate: res.store.responseRate || '99%',
              responseTime: res.store.responseTime || 'ภายใน 15 นาที',
              joinedDate: res.store.joinedDate || 'ร้านค้าสมาชิก Movemall',
              productCount: res.store.productCount || 0,
              followerCount: res.store.followerCount || (res.store as any).followers || 1,
              location: res.store.location || 'กรุงเทพมหานคร',
            });
          }
        })
        .catch(() => {});
    }
  }, [id, resolvedLocalStore]);

  // 3. Dynamic SEO Title & Meta Tags
  useEffect(() => {
    if (store?.name) {
      document.title = `${store.name} — ร้านค้าทางการบน Movemall | ช้อปออนไลน์ มั่นใจของแท้ 100%`;
      
      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute(
        'content',
        `ช้อปสินค้าคุณภาพจาก ${store.name} บน Movemall สั่งซื้อง่าย ส่งฟรี มีเก็บเงินปลายทาง พร้อมโค้ดส่วนลดพิเศษและไลฟ์สดทุกวัน`
      );
    }
  }, [store]);

  const activeLive = mockLiveStreams.find(s => (s.storeId === store.id || s.storeId === store.slug) && s.type === 'live');

  // Filter products belonging to this store
  const availableProductList = allProducts || staticProducts;
  const storeProducts = availableProductList.filter(p => p.storeId === store.id || (store.slug && p.storeId === store.slug));

  let displayedProducts = [...storeProducts];
  if (activeTab === 'popular') {
    displayedProducts.sort((a, b) => b.reviewCount - a.reviewCount);
  } else if (activeTab === 'sale') {
    displayedProducts = displayedProducts.filter(p => p.badge === 'sale' || p.originalPrice);
  }

  function handleClaimVoucher(vId: string) {
    setClaimedVouchers(prev => ({ ...prev, [vId]: true }));
  }

  // Schema.org JSON-LD for Google Rich Results
  const storeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    description: store.description,
    image: store.logo,
    url: window.location.href,
    telephone: '+66-2-000-0000',
    address: {
      '@type': 'PostalAddress',
      addressLocality: store.location || 'กรุงเทพมหานคร',
      addressCountry: 'TH',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: store.rating || 5.0,
      reviewCount: store.reviewCount || 10,
    },
  };

  return (
    <main className="store-page">
      {/* Schema.org Structured Data for Google SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />

      {/* Store Header Banner Section */}
      <section className="store-hero">
        <div className="container">
          <div className="store-profile-card">
            {/* Top Row: Store Identity & Follow/Chat */}
            <div className="store-profile-main">
              <div className="store-avatar-wrap">
                <img
                  src={store.logo}
                  alt={store.name}
                  className={`store-avatar ${activeLive ? 'store-avatar--live' : ''}`}
                />
                {activeLive && (
                  <span className="store-avatar-live-badge">🔴 LIVE</span>
                )}
              </div>

              <div className="store-info-content">
                <div className="store-name-row">
                  <h1 className="store-name">{store.name}</h1>
                  {store.badge === 'official' && (
                    <span className="store-badge-official">
                      <ShieldCheck size={11} /> Official Store
                    </span>
                  )}
                  {store.badge === 'preferred' && (
                    <span className="store-badge-preferred">
                      ร้านแนะนำ
                    </span>
                  )}
                </div>

                <p className="store-bio">{store.description}</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="store-cta-actions">
              <button
                className={`store-follow-btn ${isFollowing ? 'store-follow-btn--active' : ''}`}
                onClick={() => setIsFollowing(f => !f)}
              >
                {isFollowing ? <Check size={14} /> : <UserPlus size={14} />}
                <span>{isFollowing ? 'กำลังติดตาม' : '+ ติดตามร้านนี้'}</span>
              </button>
              <button 
                className="store-chat-btn" 
                onClick={() => navigate(`/chat?store=${store.id}`)}
              >
                <MessageSquare size={14} />
                <span>แชทกับร้านค้า</span>
              </button>
              <button
                type="button"
                className="store-chat-btn"
                style={{
                  background: '#FEF2F2',
                  color: '#DC2626',
                  borderColor: '#FECACA',
                }}
                onClick={() => setIsReportModalOpen(true)}
                title="รายงานร้านค้านี้ กรณีขายสินค้าปลอม ละเมิดลิขสิทธิ์ หรือหลอกลวง"
              >
                <Flag size={14} />
                <span>รายงานร้านค้านี้</span>
              </button>
            </div>
          </div>

          {/* Active Live Stream Highlight Bar (ถ้ามีไลฟ์สดอยู่) */}
          {activeLive && (
            <div className="store-live-banner" onClick={() => navigate('/live')}>
              <div className="store-live-left">
                <div className="store-live-cover-box">
                  <img
                    src={activeLive.coverImage}
                    alt={activeLive.caption}
                    className="store-live-cover-img"
                  />
                  <div className="store-live-play-icon">
                    <Play size={18} fill="#FFFFFF" color="#FFFFFF" />
                  </div>
                </div>

                <div className="store-live-text-box">
                  <div className="store-live-status-line">
                    <span className="store-live-red-pill">
                      <Radio size={11} /> กำลัง LIVE สด
                    </span>
                    <span className="store-live-viewers">
                      👀 {(activeLive?.viewers ?? 0).toLocaleString()} คนกำลังดู
                    </span>
                  </div>
                  <div className="store-live-caption">
                    {activeLive.caption}
                  </div>
                  <div className="store-live-promo">
                    ⚡ โค้ดพิเศษในไลฟ์: ลด {activeLive.pinnedProduct.discountPct}% + ส่งฟรี 0 บาท
                  </div>
                </div>
              </div>

              <button className="store-live-join-btn">
                🔴 เข้าชมไลฟ์สดร้านนี้ →
              </button>
            </div>
          )}

          {/* Store Statistics Row */}
          <div className="store-stats-grid">
            <div className="store-stat-box">
              <span className="store-stat-label">คะแนนร้านค้า</span>
              <span className="store-stat-val rating-val">
                <Star size={13} fill="#F59E0B" color="#F59E0B" />
                <strong>{store.rating ?? 5}</strong>
                <small>({(store.reviewCount ?? 0).toLocaleString()})</small>
              </span>
            </div>

            <div className="store-stat-box">
              <span className="store-stat-label">การตอบกลับแชท</span>
              <span className="store-stat-val">
                <strong>{store.responseRate || '100%'}</strong>
                <small>({store.responseTime || 'ทันที'})</small>
              </span>
            </div>

            <div className="store-stat-box">
              <span className="store-stat-label">ผู้ติดตามร้าน</span>
              <span className="store-stat-val">
                <strong>{((store.followerCount ?? 0) + (isFollowing ? 1 : 0)).toLocaleString()}</strong>
                <small>คน</small>
              </span>
            </div>

            <div className="store-stat-box">
              <span className="store-stat-label">สินค้าทั้งหมด</span>
              <span className="store-stat-val">
                <strong>{storeProducts.length}</strong>
                <small>รายการ</small>
              </span>
            </div>

            <div className="store-stat-box hide-on-narrow">
              <span className="store-stat-label">ที่ตั้งร้านค้า</span>
              <span className="store-stat-val location-val">
                <MapPin size={13} />
                <span>{store.location}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Store Vouchers Carousel (Horizontal Scroll on Mobile) */}
      <section className="store-vouchers-section">
        <div className="container">
          <div className="store-vouchers-header">
            <h2 className="store-vouchers-title">
              <Ticket size={16} /> คูปองส่วนลดประจำร้าน (Store Vouchers)
            </h2>
            <span className="store-vouchers-sub">เก็บคูปองไปใช้ลดทันทีที่ขั้นตอนชำระเงิน</span>
          </div>

          <div className="store-vouchers-scroll">
            <div className="store-voucher-ticket">
              <div className="store-voucher-ticket-left">
                <span className="voucher-amount">ลด ฿50</span>
                <span className="voucher-condition">เมื่อซื้อครบ ฿500</span>
              </div>
              <div className="store-voucher-divider"></div>
              <button
                className={`store-voucher-btn ${claimedVouchers['v1'] ? 'store-voucher-btn--claimed' : ''}`}
                onClick={() => handleClaimVoucher('v1')}
                disabled={claimedVouchers['v1']}
              >
                {claimedVouchers['v1'] ? 'เก็บแล้ว' : 'เก็บโค้ด'}
              </button>
            </div>

            <div className="store-voucher-ticket">
              <div className="store-voucher-ticket-left">
                <span className="voucher-amount">ลด 10%</span>
                <span className="voucher-condition">ซื้อครบ ฿1,000 (ลดสูงสุด ฿150)</span>
              </div>
              <div className="store-voucher-divider"></div>
              <button
                className={`store-voucher-btn ${claimedVouchers['v2'] ? 'store-voucher-btn--claimed' : ''}`}
                onClick={() => handleClaimVoucher('v2')}
                disabled={claimedVouchers['v2']}
              >
                {claimedVouchers['v2'] ? 'เก็บแล้ว' : 'เก็บโค้ด'}
              </button>
            </div>

            <div className="store-voucher-ticket">
              <div className="store-voucher-ticket-left">
                <span className="voucher-amount">🚚 โค้ดส่งฟรี</span>
                <span className="voucher-condition">ส่งฟรี 0 บาท ไม่มีขั้นต่ำ</span>
              </div>
              <div className="store-voucher-divider"></div>
              <button
                className={`store-voucher-btn ${claimedVouchers['v3'] ? 'store-voucher-btn--claimed' : ''}`}
                onClick={() => handleClaimVoucher('v3')}
                disabled={claimedVouchers['v3']}
              >
                {claimedVouchers['v3'] ? 'เก็บแล้ว' : 'เก็บโค้ด'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Store Products Catalogue */}
      <section className="store-products container">
        <div className="store-tabs-bar">
          <button
            className={`store-tab-item ${activeTab === 'all' ? 'store-tab-item--active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            สินค้าทั้งหมด ({storeProducts.length})
          </button>
          <button
            className={`store-tab-item ${activeTab === 'popular' ? 'store-tab-item--active' : ''}`}
            onClick={() => setActiveTab('popular')}
          >
            🔥 สินค้าขายดี
          </button>
          <button
            className={`store-tab-item ${activeTab === 'sale' ? 'store-tab-item--active' : ''}`}
            onClick={() => setActiveTab('sale')}
          >
            ⚡ ดีลโปรโมชั่น & ลดราคา
          </button>
        </div>

        <div className="store-products-grid">
          {displayedProducts.length === 0 ? (
            <div className="store-empty-products">
              <p>ไม่มีรายการสินค้าในหมวดหมู่นี้</p>
            </div>
          ) : (
            displayedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                isWishlisted={isWishlisted?.(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))
          )}
        </div>
      </section>

      {/* Customer Anti-Counterfeit & Scam Report Modal */}
      <ReportStoreModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="STORE"
        targetId={store.id}
        targetName={store.name}
        storeName={store.name}
      />
    </main>
  );
}

export default StorePage;
