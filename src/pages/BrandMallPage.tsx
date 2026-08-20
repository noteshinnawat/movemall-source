// src/pages/BrandMallPage.tsx — Movemall Official Brand Mall (Clean Flat Strict Rectangular)

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  title: string;
  discount: string;
  minSpend: string;
  expiry: string;
  category: string;
}

const MALL_VOUCHERS: MallVoucher[] = [
  {
    id: 'mv-1',
    code: 'MALLSUPER15',
    title: 'ส่วนลดพิเศษเฉพาะสินค้า Mall',
    discount: 'ลด 15%',
    minSpend: 'ขั้นต่ำ ฿1,500 (ลดสูงสุด ฿1,000)',
    expiry: 'หมดอายุใน 24 ชม.',
    category: 'mall',
  },
  {
    id: 'mv-2',
    code: 'MALLCOIN20',
    title: 'เงินคืน Movemall Coins',
    discount: 'คืน 20%',
    minSpend: 'ขั้นต่ำ ฿800 (รับสูงสุด 300 Coins)',
    expiry: 'ใช้ได้กับทุกแบรนด์',
    category: 'coins',
  },
  {
    id: 'mv-3',
    code: 'TECHPRO300',
    title: 'ดีลเด็ดไอที & แก็ดเจ็ตแท้',
    discount: 'ลด ฿300',
    minSpend: 'ขั้นต่ำ ฿2,990 สำหรับสินค้า Tech',
    expiry: 'จำนวนจำกัด',
    category: 'electronics',
  },
  {
    id: 'mv-4',
    code: 'MALLFREESHIP',
    title: 'คูปองส่งฟรี Mall ด่วนพิเศษ',
    discount: 'ส่งฟรี ฿0',
    minSpend: 'ไม่มีขั้นต่ำ จัดส่งด่วน 1-2 วัน',
    expiry: 'ใช้ได้ไม่อั้นวันนี้',
    category: 'shipping',
  },
];

const SUPER_BRAND_HIGHLIGHTS = [
  {
    id: 'apple',
    brandName: 'Apple Flagship',
    campaignTitle: 'Apple Grand Festival 2026',
    desc: 'ลดสูงสุด 25% สำหรับ iPhone, iPad, Apple Watch และอุปกรณ์เสริมแท้ ประกันศูนย์ไทย 1 ปีเต็ม',
    discountBadge: 'ลดสูงสุด 25%',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&q=80',
    categorySlug: 'electronics',
    storeUrl: '/store/store-techpro',
  },
  {
    id: 'nike',
    brandName: 'Nike Official',
    campaignTitle: 'Nike Super Marathon Day',
    desc: 'ลดสูงสุด 50% รองเท้าวิ่ง เสื้อผ้า และคอลเลกชันใหม่ล่าสุด การันตีของแท้ 100%',
    discountBadge: 'ลดสูงสุด 50%',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=80',
    categorySlug: 'sports',
    storeUrl: '/store/store-sports',
  },
  {
    id: 'dyson',
    brandName: 'Dyson Official',
    campaignTitle: 'Dyson Innovation Days',
    desc: 'เทคโนโลยีดูดฝุ่น พัดลมกรองอากาศ และจัดแต่งทรงผมระดับโลก รับคูปองเงินสดลดเพิ่ม ฿2,000',
    discountBadge: 'แจกโค้ด ฿2,000',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700&q=80',
    categorySlug: 'home',
    storeUrl: '/shop?category=home',
  },
  {
    id: 'samsung',
    brandName: 'Samsung Official',
    campaignTitle: 'Galaxy AI Mega Days',
    desc: 'สมาร์ทโฟนและสมาร์ททีวีพรีเมียม ผ่อน 0% นานสูงสุด 10 เดือน พร้อมของแถมมูลค่า ฿5,990',
    discountBadge: 'ลดสูงสุด 40%',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=700&q=80',
    categorySlug: 'electronics',
    storeUrl: '/shop?category=electronics',
  },
];

export function BrandMallPage({ products, onAddToCart, isWishlisted, onToggleWishlist }: BrandMallPageProps) {
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
            <span className="mall-guarantee-text">ของแท้ 100% (คืนเงิน 2 เท่า)</span>
          </div>
          <div className="mall-guarantee-item">
            <RotateCcw size={16} className="mall-guarantee-icon" />
            <span className="mall-guarantee-text">คืนฟรี 30 วัน</span>
          </div>
          <div className="mall-guarantee-item">
            <Truck size={16} className="mall-guarantee-icon" />
            <span className="mall-guarantee-text">ส่งฟรี ฿0 ทุกออเดอร์</span>
          </div>
          <div className="mall-guarantee-item">
            <BadgeCheck size={16} className="mall-guarantee-icon" />
            <span className="mall-guarantee-text">ประกันศูนย์ไทยแท้</span>
          </div>
        </div>
      </div>

      {/* 2. Hero Header Banner (Compact & Sleek) */}
      <section className="mall-hero">
        <div className="container">
          <div className="mall-hero-content">
            <div className="mall-hero-text">
              <h1 className="mall-hero-title">
                ศูนย์รวมแบรนด์ดังทางการ การันตีแท้ 100%
              </h1>
              <p className="mall-hero-sub">
                สินค้าแท้จากแบรนด์ พร้อมดีลและประกันศูนย์
              </p>
            </div>
            <div className="mall-hero-stats">
              <div className="mall-stat-box">
                <span className="mall-stat-num">500+</span>
                <span className="mall-stat-label">Official Brands</span>
              </div>
              <div className="mall-stat-box">
                <span className="mall-stat-num">100%</span>
                <span className="mall-stat-label">Authentic</span>
              </div>
              <div className="mall-stat-box">
                <span className="mall-stat-num">30 วัน</span>
                <span className="mall-stat-label">Free Returns</span>
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
              <h2 className="mall-section-heading">ไฮไลท์แบรนด์ดังประจำวัน</h2>
            </div>
            <div className="mall-countdown-box">
              <Clock size={14} />
              <span>สิ้นสุดใน:</span>
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
                  <span className="super-brand-nav-badge">{item.discountBadge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Super Brand Card */}
          <div className="super-brand-card">
            <div className="super-brand-info">
              <div className="super-brand-label-row">
                <span className="super-brand-pill">DEALS OF THE DAY</span>
                <span className="super-brand-discount-badge">{activeHighlight.discountBadge}</span>
              </div>
              <h3 className="super-brand-title">{activeHighlight.campaignTitle}</h3>
              <p className="super-brand-desc">{activeHighlight.desc}</p>
              
              <div className="super-brand-benefits">
                <span className="super-benefit-item">✓ ออกใบกำกับภาษีเต็มรูปแบบได้</span>
                <span className="super-benefit-item">✓ ผ่อนชำระ 0% สูงสุด 10 เดือน</span>
                <span className="super-benefit-item">✓ จัดส่งด่วนพิเศษภายในวัน</span>
              </div>

              <div className="super-brand-action-row">
                <Link to={activeHighlight.storeUrl} className="super-brand-btn-primary">
                  ช้อปดีล {activeHighlight.brandName} ทันที <ArrowRight size={14} />
                </Link>
                <Link to="/vouchers" className="super-brand-btn-secondary">
                  <Ticket size={14} /> เก็บโค้ดลดเพิ่ม
                </Link>
              </div>
            </div>

            <div className="super-brand-media">
              <img
                src={activeHighlight.image}
                alt={activeHighlight.campaignTitle}
                className="super-brand-media-img"
              />
              <div className="super-brand-media-badge">
                <Award size={14} /> Official Store
              </div>
            </div>
          </div>
        </section>

        {/* 4. Mall Exclusive Voucher Claim Hub */}
        <section className="mall-vouchers-section">
          <div className="mall-section-header">
            <div className="mall-section-title-group">
              <span className="mall-tag-red">MALL EXCLUSIVE VOUCHERS</span>
              <h2 className="mall-section-heading">คูปองส่วนลดพิเศษเฉพาะสินค้า Mall</h2>
            </div>
            <button
              onClick={handleClaimAllVouchers}
              className="mall-claim-all-btn"
            >
              <Ticket size={14} /> เก็บโค้ดทั้งหมด
            </button>
          </div>

          <div className="mall-vouchers-grid">
            {MALL_VOUCHERS.map(voucher => {
              const isClaimed = claimedVouchers[voucher.id];
              return (
                <div key={voucher.id} className={`mall-voucher-card ${isClaimed ? 'claimed' : ''}`}>
                  <div className="mall-voucher-left">
                    <div className="mall-voucher-discount">{voucher.discount}</div>
                    <div className="mall-voucher-code">{voucher.code}</div>
                  </div>
                  <div className="mall-voucher-middle">
                    <h4 className="mall-voucher-title">{voucher.title}</h4>
                    <p className="mall-voucher-min">{voucher.minSpend}</p>
                    <span className="mall-voucher-expiry">🕒 {voucher.expiry}</span>
                  </div>
                  <div className="mall-voucher-right">
                    <button
                      onClick={() => handleClaimVoucher(voucher.id)}
                      disabled={isClaimed}
                      className={`mall-voucher-btn ${isClaimed ? 'claimed' : ''}`}
                    >
                      {isClaimed ? (
                        <>
                          <Check size={13} /> เก็บแล้ว
                        </>
                      ) : (
                        'เก็บโค้ด'
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
              <h2 className="mall-section-heading">ร้านค้าทางการและแบรนด์ดังชั้นนำ</h2>
            </div>
            <div className="mall-category-filter-tabs-wrapper">
              <div className="mall-category-filter-tabs">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'electronics', label: 'ไอที & ดิจิทัล' },
                  { id: 'sports', label: 'สปอร์ต & แฟชั่น' },
                  { id: 'beauty', label: 'ความงาม' },
                  { id: 'home', label: 'เครื่องใช้ไฟฟ้า' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedBrandCategory(cat.id)}
                    className={`mall-cat-filter-btn ${selectedBrandCategory === cat.id ? 'active' : ''}`}
                  >
                    {cat.label}
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
                    <p className="brand-directory-tagline">{brand.tagline}</p>
                    
                    <div className="brand-directory-meta">
                      <span className="brand-discount-badge">{brand.discountText}</span>
                      <span className="brand-followers-text">{brand.followers} ผู้ติดตาม</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="brand-directory-actions">
                      <button
                        onClick={() => toggleFollow(brand.id)}
                        className={`brand-follow-btn ${isFollowed ? 'followed' : ''}`}
                      >
                        {isFollowed ? '✓ ติดตามแล้ว' : '+ ติดตาม'}
                      </button>
                      <Link
                        to={`/store/store-${brand.id === 'apple' || brand.id === 'samsung' || brand.id === 'sony' || brand.id === 'xiaomi' ? 'techpro' : brand.id === 'nike' || brand.id === 'adidas' ? 'sports' : 'home'}`}
                        className="brand-visit-btn"
                      >
                        เข้าชมร้าน <ExternalLink size={12} />
                      </Link>
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
              <h2 className="mall-section-heading">ดีลสินค้าแบรนด์แท้ลดพิเศษ</h2>
            </div>
            
            <div className="mall-product-tabs-wrapper">
              <div className="mall-product-tabs">
                {[
                  { id: 'hot', label: 'ดีลยอดนิยม' },
                  { id: 'sale', label: 'ลดแรงแซงพิกัด' },
                  { id: 'new', label: 'สินค้าเปิดตัวใหม่' },
                  { id: 'electronics', label: 'แก็ดเจ็ตแท้' },
                  { id: 'sports', label: 'สปอร์ต & แฟชั่น' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedProductTab(tab.id as any)}
                    className={`mall-product-tab-btn ${selectedProductTab === tab.id ? 'active' : ''}`}
                  >
                    {tab.label}
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
            <Link to="/shop" className="mall-view-all-btn">
              ดูทั้งหมด ({activeProducts.length}) <ChevronRight size={16} />
            </Link>
          </div>
        </section>

        {/* 7. Mall Trust & Assurance Highlights */}
        <section className="mall-trust-section">
          <h3 className="mall-trust-heading">
            ทำไมต้องเลือกช้อปสินค้าแบรนด์ทางการ (Official Mall)?
          </h3>
          <div className="mall-trust-grid">
            <div className="mall-trust-card">
              <div className="mall-trust-icon-box">
                <ShieldCheck size={22} />
              </div>
              <h4 className="mall-trust-title">สินค้าของแท้ 100% จากผู้ผลิต</h4>
              <p className="mall-trust-desc">
                ตรวจสอบแหล่งที่มาและตัวแทนจำหน่ายแล้ว
              </p>
            </div>

            <div className="mall-trust-card">
              <div className="mall-trust-icon-box">
                <RotateCcw size={22} />
              </div>
              <h4 className="mall-trust-title">คืนสินค้าฟรี 30 วัน</h4>
              <p className="mall-trust-desc">
                คืนฟรีเมื่อสินค้ามีปัญหาหรือไม่ตรงรายละเอียด
              </p>
            </div>

            <div className="mall-trust-card">
              <div className="mall-trust-icon-box">
                <Truck size={22} />
              </div>
              <h4 className="mall-trust-title">จัดส่งด่วนพิเศษ & ปลอดภัย</h4>
              <p className="mall-trust-desc">
                แพ็กปลอดภัย พร้อมประกันความเสียหาย
              </p>
            </div>

            <div className="mall-trust-card">
              <div className="mall-trust-icon-box">
                <Award size={22} />
              </div>
              <h4 className="mall-trust-title">รับประกันศูนย์บริการไทย</h4>
              <p className="mall-trust-desc">
                เคลมได้ที่ศูนย์บริการทางการ
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default BrandMallPage;
