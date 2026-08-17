// src/pages/StorePage.tsx — Movemall Modern Storefront

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, UserPlus, Check, Star, MapPin, ShieldCheck, Radio, Play, Ticket, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { stores } from '../data/stores';
import { products } from '../data/products';
import { mockLiveStreams } from '../data/liveStreams';
import type { Product } from '../types';
import './StorePage.css';

interface StorePageProps {
  onAddToCart: (product: Product) => void;
  isWishlisted?: (productId: string) => boolean;
  onToggleWishlist?: (product: Product) => void;
}

export function StorePage({ onAddToCart, isWishlisted, onToggleWishlist }: StorePageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = stores.find(s => s.id === id) || stores[0];
  const activeLive = mockLiveStreams.find(s => s.storeId === store.id && s.type === 'live');

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'sale'>('all');
  const [claimedVouchers, setClaimedVouchers] = useState<Record<string, boolean>>({});

  // Filter products belonging to this store
  const storeProducts = products.filter(p => p.storeId === store.id);

  let displayedProducts = [...storeProducts];
  if (activeTab === 'popular') {
    displayedProducts.sort((a, b) => b.reviewCount - a.reviewCount);
  } else if (activeTab === 'sale') {
    displayedProducts = displayedProducts.filter(p => p.badge === 'sale' || p.originalPrice);
  }

  function handleClaimVoucher(vId: string) {
    setClaimedVouchers(prev => ({ ...prev, [vId]: true }));
  }

  return (
    <main className="store-page">
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
                      👀 {activeLive.viewers.toLocaleString()} คนกำลังดู
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
                <strong>{store.rating}</strong>
                <small>({store.reviewCount.toLocaleString()})</small>
              </span>
            </div>

            <div className="store-stat-box">
              <span className="store-stat-label">การตอบกลับแชท</span>
              <span className="store-stat-val">
                <strong>{store.responseRate}</strong>
                <small>({store.responseTime})</small>
              </span>
            </div>

            <div className="store-stat-box">
              <span className="store-stat-label">ผู้ติดตามร้าน</span>
              <span className="store-stat-val">
                <strong>{(store.followerCount + (isFollowing ? 1 : 0)).toLocaleString()}</strong>
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
    </main>
  );
}

export default StorePage;
