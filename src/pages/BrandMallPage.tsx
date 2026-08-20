// src/pages/BrandMallPage.tsx — Movemall Official Brand Mall (Clean Flat Strict Rectangular)

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  RotateCcw,
  Truck,
  Award,
  Check,
  Ticket,
  Clock,
  ArrowRight,
  ChevronRight,
  BadgeCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { famousBrands } from '../data/brands';
import { products as staticProducts } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { LocalizedLink } from '../i18n/LocalizedLink';
import { formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import type { Product } from '../types';
import './BrandMallPage.css';

interface BrandMallPageProps {
  products?: Product[];
  onAddToCart: (product: Product) => void;
  isWishlisted?: (productId: string) => boolean;
  onToggleWishlist?: (product: Product) => void;
}

interface MallVoucher {
  id: string;
  code: string;
  titleKey: string;
  discountKey: string;
  minSpendKey: string;
  expiryKey: string;
  category: string;
}

const MALL_VOUCHERS: MallVoucher[] = [
  {
    id: 'mv-1',
    code: 'MALLSUPER15',
    titleKey: 'mall.vouchers.items.mall.title',
    discountKey: 'mall.vouchers.items.mall.discount',
    minSpendKey: 'mall.vouchers.items.mall.minimum',
    expiryKey: 'mall.vouchers.items.mall.expiry',
    category: 'mall',
  },
  {
    id: 'mv-2',
    code: 'MALLCOIN20',
    titleKey: 'mall.vouchers.items.coins.title',
    discountKey: 'mall.vouchers.items.coins.discount',
    minSpendKey: 'mall.vouchers.items.coins.minimum',
    expiryKey: 'mall.vouchers.items.coins.expiry',
    category: 'coins',
  },
  {
    id: 'mv-3',
    code: 'TECHPRO300',
    titleKey: 'mall.vouchers.items.tech.title',
    discountKey: 'mall.vouchers.items.tech.discount',
    minSpendKey: 'mall.vouchers.items.tech.minimum',
    expiryKey: 'mall.vouchers.items.tech.expiry',
    category: 'electronics',
  },
  {
    id: 'mv-4',
    code: 'MALLFREESHIP',
    titleKey: 'mall.vouchers.items.shipping.title',
    discountKey: 'mall.vouchers.items.shipping.discount',
    minSpendKey: 'mall.vouchers.items.shipping.minimum',
    expiryKey: 'mall.vouchers.items.shipping.expiry',
    category: 'shipping',
  },
];

const SUPER_BRAND_HIGHLIGHTS = [
  {
    id: 'apple',
    brandName: 'Apple Flagship',
    campaignTitle: 'Apple Grand Festival 2026',
    descKey: 'mall.highlights.apple.description',
    discountBadgeKey: 'mall.highlights.apple.discount',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&q=80',
    categorySlug: 'electronics',
    storeUrl: '/store/store-techpro',
  },
  {
    id: 'nike',
    brandName: 'Nike Official',
    campaignTitle: 'Nike Super Marathon Day',
    descKey: 'mall.highlights.nike.description',
    discountBadgeKey: 'mall.highlights.nike.discount',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=80',
    categorySlug: 'sports',
    storeUrl: '/store/store-sports',
  },
  {
    id: 'dyson',
    brandName: 'Dyson Official',
    campaignTitle: 'Dyson Innovation Days',
    descKey: 'mall.highlights.dyson.description',
    discountBadgeKey: 'mall.highlights.dyson.discount',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700&q=80',
    categorySlug: 'home',
    storeUrl: '/shop?category=home',
  },
  {
    id: 'samsung',
    brandName: 'Samsung Official',
    campaignTitle: 'Galaxy AI Mega Days',
    descKey: 'mall.highlights.samsung.description',
    discountBadgeKey: 'mall.highlights.samsung.discount',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=700&q=80',
    categorySlug: 'electronics',
    storeUrl: '/shop?category=electronics',
  },
];

export function BrandMallPage({ products, onAddToCart, isWishlisted, onToggleWishlist }: BrandMallPageProps) {
  const { t, i18n } = useTranslation(['catalog', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const [selectedBrandCategory, setSelectedBrandCategory] = useState<string>('all');
  const [selectedProductTab, setSelectedProductTab] = useState<'hot' | 'sale' | 'new' | 'electronics' | 'sports'>('hot');
  const [followedBrands, setFollowedBrands] = useState<Record<string, boolean>>({});
  const [claimedVouchers, setClaimedVouchers] = useState<Record<string, boolean>>({});
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);

  const activeProducts = products && products.length > 0 ? products : staticProducts;

  // Countdown timer for Super Brand Day
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 48 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredBrands = selectedBrandCategory === 'all'
    ? famousBrands
    : famousBrands.filter(b => b.category === selectedBrandCategory);

  // Filter mall products based on tab
  const getTabProducts = (): Product[] => {
    switch (selectedProductTab) {
      case 'sale':
        return activeProducts.filter(p => p.originalPrice || p.badge === 'sale').slice(0, 12);
      case 'new':
        return activeProducts.filter(p => p.badge === 'new').slice(0, 12);
      case 'electronics':
        return activeProducts.filter(p => p.category === 'electronics').slice(0, 12);
      case 'sports':
        return activeProducts.filter(p => p.category === 'sports' || p.category === 'fashion').slice(0, 12);
      case 'hot':
      default:
        return activeProducts.slice(0, 12);
    }
  };

  const currentMallProducts = getTabProducts();

  function toggleFollow(bId: string) {
    setFollowedBrands(prev => ({ ...prev, [bId]: !prev[bId] }));
  }

  function handleClaimVoucher(vId: string) {
    setClaimedVouchers(prev => ({ ...prev, [vId]: true }));
  }

  function handleClaimAllVouchers() {
    const allClaimed: Record<string, boolean> = {};
    MALL_VOUCHERS.forEach(v => {
      allClaimed[v.id] = true;
    });
    setClaimedVouchers(allClaimed);
  }

  const activeHighlight = SUPER_BRAND_HIGHLIGHTS[activeHighlightIndex];

  return (
    <main className="mall-page">
      {/* 1. 4-Pillar Mall Guarantee Top Bar (Compact & Responsive) */}
      <div className="mall-guarantee-bar">
        <div className="container mall-guarantee-inner">
          <div className="mall-guarantee-item">
            <ShieldCheck size={16} className="mall-guarantee-icon" />
            <span className="mall-guarantee-text">{t('catalog:mall.guarantees.authentic')}</span>
          </div>
          <div className="mall-guarantee-item">
            <RotateCcw size={16} className="mall-guarantee-icon" />
            <span className="mall-guarantee-text">{t('catalog:mall.guarantees.returns')}</span>
          </div>
          <div className="mall-guarantee-item">
            <Truck size={16} className="mall-guarantee-icon" />
            <span className="mall-guarantee-text">{t('catalog:mall.guarantees.shipping')}</span>
          </div>
          <div className="mall-guarantee-item">
            <BadgeCheck size={16} className="mall-guarantee-icon" />
            <span className="mall-guarantee-text">{t('catalog:mall.guarantees.warranty')}</span>
          </div>
        </div>
      </div>

      {/* 2. Hero Header Banner (Compact & Sleek) */}
      <section className="mall-hero">
        <div className="container">
          <div className="mall-hero-content">
            <div className="mall-hero-text">
              <h1 className="mall-hero-title">
                {t('catalog:mall.hero.title')}
              </h1>
              <p className="mall-hero-sub">
                {t('catalog:mall.hero.subtitle')}
              </p>
            </div>
            <div className="mall-hero-stats">
              <div className="mall-stat-box">
                <span className="mall-stat-num">500+</span>
                <span className="mall-stat-label">{t('catalog:mall.hero.officialBrands')}</span>
              </div>
              <div className="mall-stat-box">
                <span className="mall-stat-num">100%</span>
                <span className="mall-stat-label">{t('catalog:mall.hero.authentic')}</span>
              </div>
              <div className="mall-stat-box">
                <span className="mall-stat-num">{t('catalog:mall.hero.thirtyDays')}</span>
                <span className="mall-stat-label">{t('catalog:mall.hero.freeReturns')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* 3. Super Brand Day Spotlight with Tab Selector */}
        <section className="mall-spotlight-section">
          <div className="mall-section-header">
            <div className="mall-section-title-group">
              <span className="mall-tag-red">SUPER BRAND FESTIVAL</span>
              <h2 className="mall-section-heading">{t('catalog:mall.spotlight.title')}</h2>
            </div>
            <div className="mall-countdown-box">
              <Clock size={14} />
              <span>{t('catalog:mall.spotlight.endsIn')}</span>
              <div className="mall-countdown-digits">
                <span className="mall-digit">{String(timeLeft.hours).padStart(2, '0')}</span>:
                <span className="mall-digit">{String(timeLeft.minutes).padStart(2, '0')}</span>:
                <span className="mall-digit">{String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>
          </div>

          {/* Super Brand Tabs (Horizontal Scrollable on Mobile) */}
          <div className="super-brand-nav-wrapper">
            <div className="super-brand-nav">
              {SUPER_BRAND_HIGHLIGHTS.map((item, idx) => (
                <button
                  key={item.id}
                  className={`super-brand-nav-btn ${activeHighlightIndex === idx ? 'active' : ''}`}
                  onClick={() => setActiveHighlightIndex(idx)}
                >
                  <span className="super-brand-nav-name">{item.brandName}</span>
                  <span className="super-brand-nav-badge">{t(`catalog:${item.discountBadgeKey}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Super Brand Card */}
          <div className="super-brand-card">
            <div className="super-brand-info">
              <div className="super-brand-label-row">
                <span className="super-brand-pill">DEALS OF THE DAY</span>
                <span className="super-brand-discount-badge">{t(`catalog:${activeHighlight.discountBadgeKey}`)}</span>
              </div>
              <h3 className="super-brand-title">{activeHighlight.campaignTitle}</h3>
              <p className="super-brand-desc">{t(`catalog:${activeHighlight.descKey}`)}</p>
              
              <div className="super-brand-benefits">
                <span className="super-benefit-item">{t('catalog:mall.spotlight.taxInvoice')}</span>
                <span className="super-benefit-item">{t('catalog:mall.spotlight.installment')}</span>
                <span className="super-benefit-item">{t('catalog:mall.spotlight.express')}</span>
              </div>

              <div className="super-brand-action-row">
                <LocalizedLink to={activeHighlight.storeUrl} className="super-brand-btn-primary">
                  {t('catalog:mall.spotlight.shopBrand', { brand: activeHighlight.brandName })} <ArrowRight size={14} />
                </LocalizedLink>
                <LocalizedLink to="/vouchers" className="super-brand-btn-secondary">
                  <Ticket size={14} /> {t('catalog:mall.spotlight.claimExtra')}
                </LocalizedLink>
              </div>
            </div>

            <div className="super-brand-media">
              <img
                src={activeHighlight.image}
                alt={activeHighlight.campaignTitle}
                className="super-brand-media-img"
              />
              <div className="super-brand-media-badge">
                <Award size={14} /> {t('catalog:store.official')}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Mall Exclusive Voucher Claim Hub */}
        <section className="mall-vouchers-section">
          <div className="mall-section-header">
            <div className="mall-section-title-group">
              <span className="mall-tag-red">MALL EXCLUSIVE VOUCHERS</span>
              <h2 className="mall-section-heading">{t('catalog:mall.vouchers.title')}</h2>
            </div>
            <button
              onClick={handleClaimAllVouchers}
              className="mall-claim-all-btn"
            >
              <Ticket size={14} /> {t('catalog:mall.vouchers.claimAll')}
            </button>
          </div>

          <div className="mall-vouchers-grid">
            {MALL_VOUCHERS.map(voucher => {
              const isClaimed = claimedVouchers[voucher.id];
              return (
                <div key={voucher.id} className={`mall-voucher-card ${isClaimed ? 'claimed' : ''}`}>
                  <div className="mall-voucher-left">
                    <div className="mall-voucher-discount">{t(`catalog:${voucher.discountKey}`)}</div>
                    <div className="mall-voucher-code">{voucher.code}</div>
                  </div>
                  <div className="mall-voucher-middle">
                    <h4 className="mall-voucher-title">{t(`catalog:${voucher.titleKey}`)}</h4>
                    <p className="mall-voucher-min">{t(`catalog:${voucher.minSpendKey}`)}</p>
                    <span className="mall-voucher-expiry">🕒 {t(`catalog:${voucher.expiryKey}`)}</span>
                  </div>
                  <div className="mall-voucher-right">
                    <button
                      onClick={() => handleClaimVoucher(voucher.id)}
                      disabled={isClaimed}
                      className={`mall-voucher-btn ${isClaimed ? 'claimed' : ''}`}
                    >
                      {isClaimed ? (
                        <>
                          <Check size={13} /> {t('catalog:mall.vouchers.claimed')}
                        </>
                      ) : (
                        t('catalog:mall.vouchers.claim')
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Famous Brands Directory with Clean Filter Tabs */}
        <section className="mall-directory-section">
          <div className="mall-section-header">
            <div className="mall-section-title-group">
              <span className="mall-tag-red">OFFICIAL FLAGSHIP DIRECTORY</span>
              <h2 className="mall-section-heading">{t('catalog:mall.directory.title')}</h2>
            </div>
            <div className="mall-category-filter-tabs-wrapper">
              <div className="mall-category-filter-tabs">
                {[
                  { id: 'all', labelKey: 'all' },
                  { id: 'electronics', labelKey: 'electronics' },
                  { id: 'sports', labelKey: 'sports' },
                  { id: 'beauty', labelKey: 'beauty' },
                  { id: 'home', labelKey: 'home' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedBrandCategory(cat.id)}
                    className={`mall-cat-filter-btn ${selectedBrandCategory === cat.id ? 'active' : ''}`}
                  >
                    {t(`catalog:mall.directory.categories.${cat.labelKey}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="brand-directory-grid">
            {filteredBrands.map(brand => {
              const isFollowed = followedBrands[brand.id];
              return (
                <div key={brand.id} className="brand-directory-card">
                  {/* Brand Header Banner */}
                  <div className="brand-directory-banner" style={{ background: brand.banner }}>
                    <span className="brand-directory-mall-tag">MALL</span>
                  </div>

                  {/* Brand Profile Details */}
                  <div className="brand-directory-body">
                    <div className="brand-directory-logo-container">
                      <img src={brand.logo} alt={brand.name} className="brand-directory-logo" />
                    </div>
                    <h3 className="brand-directory-name">{brand.name}</h3>
                    <p className="brand-directory-tagline">{t(`catalog:mall.brandData.${brand.id}.tagline`)}</p>
                    
                    <div className="brand-directory-meta">
                      <span className="brand-discount-badge">{t(`catalog:mall.brandData.${brand.id}.discount`)}</span>
                      <span className="brand-followers-text">{t('catalog:mall.directory.followers', { count: brand.followers })}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="brand-directory-actions">
                      <button
                        onClick={() => toggleFollow(brand.id)}
                        className={`brand-follow-btn ${isFollowed ? 'followed' : ''}`}
                      >
                        {isFollowed ? t('catalog:mall.directory.followed') : t('catalog:mall.directory.follow')}
                      </button>
                      <LocalizedLink
                        to={`/store/store-${brand.id === 'apple' || brand.id === 'samsung' || brand.id === 'sony' || brand.id === 'xiaomi' ? 'techpro' : brand.id === 'nike' || brand.id === 'adidas' ? 'sports' : 'home'}`}
                        className="brand-visit-btn"
                      >
                        {t('catalog:mall.directory.visit')} <ExternalLink size={12} />
                      </LocalizedLink>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. Mall Exclusive Products Grid with Interactive Filter Tabs */}
        <section className="mall-products-section">
          <div className="mall-section-header">
            <div className="mall-section-title-group">
              <span className="mall-tag-red">MALL EXCLUSIVE DEALS</span>
              <h2 className="mall-section-heading">{t('catalog:mall.products.title')}</h2>
            </div>
            
            <div className="mall-product-tabs-wrapper">
              <div className="mall-product-tabs">
                {[
                  { id: 'hot', labelKey: 'hot' },
                  { id: 'sale', labelKey: 'sale' },
                  { id: 'new', labelKey: 'new' },
                  { id: 'electronics', labelKey: 'electronics' },
                  { id: 'sports', labelKey: 'sports' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedProductTab(tab.id as any)}
                    className={`mall-product-tab-btn ${selectedProductTab === tab.id ? 'active' : ''}`}
                  >
                    {t(`catalog:mall.products.tabs.${tab.labelKey}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="products-grid">
            {currentMallProducts.map(product => (
              <div key={product.id} className="mall-product-item-wrapper">
                <div className="mall-product-corner-badge">
                  MALL
                </div>
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  isWishlisted={isWishlisted?.(product.id)}
                  onToggleWishlist={onToggleWishlist}
                />
              </div>
            ))}
          </div>

          <div className="mall-view-all-container">
            <LocalizedLink to="/shop" className="mall-view-all-btn">
              {t('catalog:mall.products.viewAll', { count: formatNumber(activeProducts.length, locale) })} <ChevronRight size={16} />
            </LocalizedLink>
          </div>
        </section>

        {/* 7. Mall Trust & Assurance Highlights */}
        <section className="mall-trust-section">
          <h3 className="mall-trust-heading">
            {t('catalog:mall.trust.heading')}
          </h3>
          <div className="mall-trust-grid">
            <div className="mall-trust-card">
              <div className="mall-trust-icon-box">
                <ShieldCheck size={22} />
              </div>
              <h4 className="mall-trust-title">{t('catalog:mall.trust.authenticTitle')}</h4>
              <p className="mall-trust-desc">
                {t('catalog:mall.trust.authenticDescription')}
              </p>
            </div>

            <div className="mall-trust-card">
              <div className="mall-trust-icon-box">
                <RotateCcw size={22} />
              </div>
              <h4 className="mall-trust-title">{t('catalog:mall.trust.returnsTitle')}</h4>
              <p className="mall-trust-desc">
                {t('catalog:mall.trust.returnsDescription')}
              </p>
            </div>

            <div className="mall-trust-card">
              <div className="mall-trust-icon-box">
                <Truck size={22} />
              </div>
              <h4 className="mall-trust-title">{t('catalog:mall.trust.shippingTitle')}</h4>
              <p className="mall-trust-desc">
                {t('catalog:mall.trust.shippingDescription')}
              </p>
            </div>

            <div className="mall-trust-card">
              <div className="mall-trust-icon-box">
                <Award size={22} />
              </div>
              <h4 className="mall-trust-title">{t('catalog:mall.trust.warrantyTitle')}</h4>
              <p className="mall-trust-desc">
                {t('catalog:mall.trust.warrantyDescription')}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default BrandMallPage;
