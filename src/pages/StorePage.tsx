// src/pages/StorePage.tsx — Movemall Modern Storefront

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, UserPlus, Check, Star, MapPin, ShieldCheck, Radio, Play, Ticket, Sparkles, Flag, AlertTriangle } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ReportStoreModal } from '../components/ReportStoreModal';
import { stores, getStoreById } from '../data/stores';
import { products as staticProducts } from '../data/products';
import { mockLiveStreams } from '../data/liveStreams';
import { fetchApi } from '../utils/api';
import { generateSlug } from '../utils/slug';
import { useLocalizedPath } from '../i18n/LocalizedLink';
import { formatCurrency, formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import type { Product, Store } from '../types';
import './StorePage.css';

interface StorePageProps {
  onAddToCart: (product: Product) => void;
  isWishlisted?: (productId: string) => boolean;
  onToggleWishlist?: (product: Product) => void;
  allProducts?: Product[];
}

export function StorePage({ onAddToCart, isWishlisted, onToggleWishlist, allProducts }: StorePageProps) {
  const { t, i18n } = useTranslation(['catalog', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const localizePath = useLocalizedPath();

  const [remoteStore, setRemoteStore] = useState<Store | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'sale'>('all');
  const [claimedVouchers, setClaimedVouchers] = useState<Record<string, boolean>>({});
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // 1. Resolve store from static data, active seller profile, or decoded URL slug
  const resolvedLocalStore: Store | undefined = (() => {
    if (!id) return stores[0];
    
    let decodedId = id;
    try {
      decodedId = decodeURIComponent(id).trim();
    } catch {
      decodedId = id.trim();
    }

    // Check static stores by ID or Slug
    const foundStatic = getStoreById(decodedId) || getStoreById(id);
    if (foundStatic) return foundStatic;

    // Check if it's the current user's registered store
    let currentUser: any = null;
    try {
      const stored = localStorage.getItem('movemall_user');
      if (stored) currentUser = JSON.parse(stored);
    } catch {}

    const customName = 
      localStorage.getItem('movemall_custom_store_name') || 
      localStorage.getItem('movemall_my_store_name') ||
      (currentUser?.name ? t('catalog:store.defaults.ownedBy', { name: currentUser.name }) : '');
      
    const customId = localStorage.getItem('movemall_seller_store_id') || (currentUser?.id ? `store-${currentUser.id}` : '');
    const customSlug = localStorage.getItem('movemall_store_slug') || (customName ? generateSlug(customName) : '');

    const isMatchCustom = 
      (customId && (decodedId === customId || id === customId)) ||
      (customSlug && (decodedId === customSlug || id === customSlug || decodedId.toLowerCase() === customSlug.toLowerCase())) ||
      (customName && (decodedId === customName || decodedId.toLowerCase() === generateSlug(customName).toLowerCase())) ||
      (currentUser?.name && (decodedId.includes(currentUser.name) || decodedId.toLowerCase().includes(generateSlug(currentUser.name).toLowerCase()))) ||
      decodedId === 'store-my-live' ||
      decodedId === 'store-custom';

    const savedStoreLogo = localStorage.getItem('movemall_store_logo') || currentUser?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName || 'Store')}`;
    const savedStoreBanner = localStorage.getItem('movemall_store_banner') || 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)';
    const savedStoreBio = localStorage.getItem('movemall_store_bio') || t('catalog:store.defaults.bio');

    if (isMatchCustom || (customName && decodedId.includes(customName))) {
      return {
        id: customId || `store-${currentUser?.id || 'my-shop'}`,
        slug: customSlug || generateSlug(customName || 'my-shop'),
        name: customName || decodedId.replace(/-/g, ' '),
        logo: savedStoreLogo,
        banner: savedStoreBanner,
        badge: 'verified',
        rating: 5.0,
        reviewCount: 48,
        responseRate: '100%',
        responseTime: t('catalog:store.defaults.responseTime'),
        joinedDate: t('catalog:store.defaults.newStore'),
        productCount: 3,
        followerCount: 12,
        location: t('catalog:store.defaultLocation'),
        description: savedStoreBio,
      };
    }

    // Dynamic fallback for custom store URLs (e.g. sharing link to another user / device / incognito)
    // If URL is a custom store slug like "ร้านค้าของ-สิทธิมัณฑ์-สุขสกุล" or "store-xxx"
    const readableName = decodedId.replace(/^store-/, '').replace(/-/g, ' ').trim();
    if (readableName) {
      const isCurrentUserShop = currentUser?.name && (readableName.includes(currentUser.name) || (customName && readableName.includes(customName)));
      const fallbackLogo = isCurrentUserShop 
        ? (localStorage.getItem('movemall_store_logo') || currentUser?.avatarUrl)
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(readableName)}`;

      return {
        id: decodedId,
        slug: decodedId,
        name: readableName,
        logo: fallbackLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(readableName)}`,
        banner: isCurrentUserShop ? savedStoreBanner : 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
        badge: 'verified',
        rating: 5.0,
        reviewCount: 12,
        responseRate: '100%',
        responseTime: t('catalog:store.defaults.responseTime'),
        joinedDate: t('catalog:store.defaults.memberStore'),
        productCount: 0,
        followerCount: 1,
        location: t('catalog:store.defaultLocation'),
        description: isCurrentUserShop ? savedStoreBio : t('catalog:store.defaults.qualityDescription', { name: readableName }),
      };
    }

    return undefined;
  })();

  const store: Store = remoteStore || resolvedLocalStore || stores[0];

  // 2. Fetch from backend API to get real-time Supabase store stats & products
  useEffect(() => {
    if (id) {
      fetchApi<{ store: Store }>(`/api/stores/${encodeURIComponent(id)}`)
        .then(res => {
          if (res && res.store) {
            setRemoteStore({
              ...res.store,
              reviewCount: res.store.reviewCount || 10,
              responseRate: res.store.responseRate || '99%',
              responseTime: res.store.responseTime || t('catalog:store.defaults.responseTime15'),
              joinedDate: res.store.joinedDate || t('catalog:store.defaults.memberStore'),
              productCount: res.store.productCount || (res.store as any).products?.length || 0,
              followerCount: res.store.followerCount || (res.store as any).followers || 1,
              location: res.store.location || t('catalog:store.defaultLocation'),
            });
          }
        })
        .catch(() => {});
    }
  }, [id, t]);

  // 3. Dynamic SEO Title & Meta Tags
  useEffect(() => {
    if (store?.name) {
      document.title = t('catalog:store.seoTitle', { store: store.name });
      
      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute(
        'content',
        t('catalog:store.seoDescription', { store: store.name })
      );
    }
  }, [store, t]);

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
      addressLocality: store.location || t('catalog:store.defaultLocation'),
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
                      <ShieldCheck size={11} /> {t('catalog:store.official')}
                    </span>
                  )}
                  {store.badge === 'preferred' && (
                    <span className="store-badge-preferred">
                      {t('catalog:store.preferred')}
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
                <span>{isFollowing ? t('catalog:store.following') : t('catalog:store.follow')}</span>
              </button>
              <button 
                className="store-chat-btn" 
                onClick={() => navigate(localizePath(`/chat?store=${store.id}&source=store&ref=${store.id}&refName=${encodeURIComponent(store.name || '')}`))}
              >
                <MessageSquare size={14} />
                <span>{t('catalog:store.chat')}</span>
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
                title={t('catalog:store.reportTitle')}
              >
                <Flag size={14} />
                <span>{t('catalog:store.report')}</span>
              </button>
            </div>
          </div>

          {/* Active Live Stream Highlight Bar (ถ้ามีไลฟ์สดอยู่) */}
          {activeLive && (
            <div className="store-live-banner" onClick={() => navigate(localizePath('/live'))}>
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
                      <Radio size={11} /> {t('catalog:store.liveNow')}
                    </span>
                    <span className="store-live-viewers">
                      {t('catalog:store.liveViewers', {
                        count: activeLive?.viewers ?? 0,
                      })}
                    </span>
                  </div>
                  <div className="store-live-caption">
                    {activeLive.caption}
                  </div>
                  <div className="store-live-promo">
                    {t('catalog:store.livePromotion', { discount: activeLive.pinnedProduct.discountPct })}
                  </div>
                </div>
              </div>

              <button className="store-live-join-btn">
                {t('catalog:store.joinLive')}
              </button>
            </div>
          )}

          {/* Store Statistics Row */}
          <div className="store-stats-grid">
            <div className="store-stat-box">
              <span className="store-stat-label">{t('catalog:store.stats.rating')}</span>
              <span className="store-stat-val rating-val">
                <Star size={13} fill="#F59E0B" color="#F59E0B" />
                <strong>{store.rating ?? 5}</strong>
                <small>({formatNumber(store.reviewCount ?? 0, locale)})</small>
              </span>
            </div>

            <div className="store-stat-box">
              <span className="store-stat-label">{t('catalog:store.stats.response')}</span>
              <span className="store-stat-val">
                <strong>{store.responseRate || '100%'}</strong>
                <small>({store.responseTime || t('catalog:store.defaults.immediately')})</small>
              </span>
            </div>

            <div className="store-stat-box">
              <span className="store-stat-label">{t('catalog:store.stats.followers')}</span>
              <span className="store-stat-val">
                <strong>{formatNumber((store.followerCount ?? 0) + (isFollowing ? 1 : 0), locale)}</strong>
                <small>{t('catalog:store.stats.people')}</small>
              </span>
            </div>

            <div className="store-stat-box">
              <span className="store-stat-label">{t('catalog:store.stats.products')}</span>
              <span className="store-stat-val">
                <strong>{formatNumber(storeProducts.length, locale)}</strong>
                <small>{t('catalog:store.stats.items')}</small>
              </span>
            </div>

            <div className="store-stat-box hide-on-narrow">
              <span className="store-stat-label">{t('catalog:store.stats.location')}</span>
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
              <Ticket size={16} /> {t('catalog:store.vouchers.title')}
            </h2>
            <span className="store-vouchers-sub">{t('catalog:store.vouchers.subtitle')}</span>
          </div>

          <div className="store-vouchers-scroll">
            <div className="store-voucher-ticket">
              <div className="store-voucher-ticket-left">
                <span className="voucher-amount">{t('catalog:store.vouchers.amountOff', { amount: formatCurrency(50, locale) })}</span>
                <span className="voucher-condition">{t('catalog:store.vouchers.spendThreshold', { amount: formatCurrency(500, locale) })}</span>
              </div>
              <div className="store-voucher-divider"></div>
              <button
                className={`store-voucher-btn ${claimedVouchers['v1'] ? 'store-voucher-btn--claimed' : ''}`}
                onClick={() => handleClaimVoucher('v1')}
                disabled={claimedVouchers['v1']}
              >
                {claimedVouchers['v1'] ? t('catalog:store.vouchers.claimed') : t('catalog:store.vouchers.claim')}
              </button>
            </div>

            <div className="store-voucher-ticket">
              <div className="store-voucher-ticket-left">
                <span className="voucher-amount">{t('catalog:store.vouchers.percentOff', { discount: 10 })}</span>
                <span className="voucher-condition">{t('catalog:store.vouchers.percentCondition', {
                  threshold: formatCurrency(1000, locale),
                  maximum: formatCurrency(150, locale),
                })}</span>
              </div>
              <div className="store-voucher-divider"></div>
              <button
                className={`store-voucher-btn ${claimedVouchers['v2'] ? 'store-voucher-btn--claimed' : ''}`}
                onClick={() => handleClaimVoucher('v2')}
                disabled={claimedVouchers['v2']}
              >
                {claimedVouchers['v2'] ? t('catalog:store.vouchers.claimed') : t('catalog:store.vouchers.claim')}
              </button>
            </div>

            <div className="store-voucher-ticket">
              <div className="store-voucher-ticket-left">
                <span className="voucher-amount">{t('catalog:store.vouchers.freeShipping')}</span>
                <span className="voucher-condition">{t('catalog:store.vouchers.freeShippingCondition')}</span>
              </div>
              <div className="store-voucher-divider"></div>
              <button
                className={`store-voucher-btn ${claimedVouchers['v3'] ? 'store-voucher-btn--claimed' : ''}`}
                onClick={() => handleClaimVoucher('v3')}
                disabled={claimedVouchers['v3']}
              >
                {claimedVouchers['v3'] ? t('catalog:store.vouchers.claimed') : t('catalog:store.vouchers.claim')}
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
            {t('catalog:store.tabs.all', { count: storeProducts.length })}
          </button>
          <button
            className={`store-tab-item ${activeTab === 'popular' ? 'store-tab-item--active' : ''}`}
            onClick={() => setActiveTab('popular')}
          >
            {t('catalog:store.tabs.popular')}
          </button>
          <button
            className={`store-tab-item ${activeTab === 'sale' ? 'store-tab-item--active' : ''}`}
            onClick={() => setActiveTab('sale')}
          >
            {t('catalog:store.tabs.sale')}
          </button>
        </div>

        <div className="store-products-grid">
          {displayedProducts.length === 0 ? (
            <div className="store-empty-products">
              <p>{t('catalog:store.emptyProducts')}</p>
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
