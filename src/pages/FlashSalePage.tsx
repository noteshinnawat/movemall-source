// src/pages/FlashSalePage.tsx — Flash Sale Deals Hub with Urgency & Remind Me Feature

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Clock, Bell, Check, Ticket } from 'lucide-react';
import { products as staticProducts } from '../data/products';
import { getProductUrl } from '../utils/seo';
import { LocalizedLink } from '../i18n/LocalizedLink';
import { formatCurrency } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import type { Product } from '../types';
import './FlashSalePage.css';

interface FlashSalePageProps {
  products?: Product[];
  onAddToCart: (product: Product) => void;
}

const SLOT_IDS = ['s0', 's1', 's2', 's3'] as const;
const SLOT_TIMES = ['12:00', '18:00', '21:00', '00:00'] as const;
const SLOT_STATUS = ['live', 'upcoming', 'upcoming', 'upcoming'] as const;

const VOUCHERS = [
  { id: 'fv1', code: 'FLASH50' },
  { id: 'fv2', code: 'FLASH15P' },
  { id: 'fv3', code: 'FSFREE' },
] as const;

const CATEGORY_IDS = ['all', 'electronics', 'fashion', 'beauty', 'home'] as const;

export function FlashSalePage({ products, onAddToCart }: FlashSalePageProps) {
  const { t, i18n } = useTranslation(['engagement']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const money = (value: number) => formatCurrency(value, locale);

  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORY_IDS)[number]>('all');
  const [remindedProductIds, setRemindedProductIds] = useState<Set<string>>(new Set());
  const [claimedVouchers, setClaimedVouchers] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState({ hours: '02', minutes: '45', seconds: '18' });

  // Countdown timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let sec = parseInt(prev.seconds, 10) - 1;
        let min = parseInt(prev.minutes, 10);
        let hr = parseInt(prev.hours, 10);

        if (sec < 0) {
          sec = 59;
          min -= 1;
        }
        if (min < 0) {
          min = 59;
          hr = hr > 0 ? hr - 1 : 2;
        }

        return {
          hours: String(hr).padStart(2, '0'),
          minutes: String(min).padStart(2, '0'),
          seconds: String(sec).padStart(2, '0'),
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  function handleToggleRemind(productId: string, productName: string) {
    const nextSet = new Set(remindedProductIds);
    if (nextSet.has(productId)) {
      nextSet.delete(productId);
      showToast(t('engagement:flashSale.reminderCancelled', { product: productName }));
    } else {
      nextSet.add(productId);
      showToast(t('engagement:flashSale.reminderSet'));
    }
    setRemindedProductIds(nextSet);
  }

  function handleClaimVoucher(id: string, code: string) {
    setClaimedVouchers(prev => new Set([...prev, id]));
    showToast(t('engagement:flashSale.voucherClaimedToast', { code }));
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  // Filter products
  const isUpcoming = SLOT_STATUS[activeSlot] === 'upcoming';
  const currentSlotTime = SLOT_TIMES[activeSlot];

  const activeProductList = products && products.length > 0 ? products : staticProducts;
  const displayedProducts = activeProductList
    .filter(p => activeCategory === 'all' || p.category === activeCategory)
    .slice(0, 16)
    .map((p, idx) => {
      const discountPct = [55, 60, 48, 70, 65, 50, 40, 75][idx % 8];
      const flashPrice = Math.round(p.price * (1 - discountPct / 100));
      const soldPct = isUpcoming ? 0 : [88, 94, 76, 96, 82, 91, 68, 85][idx % 8];
      const stockLeft = Math.max(2, Math.round((100 - soldPct) * 0.4));

      return {
        ...p,
        discountPct,
        flashPrice,
        soldPct,
        stockLeft,
      };
    });

  return (
    <main className="flash-sale-page">
      {/* Sleek Modern Flash Hero Header */}
      <section className="flash-hero">
        <div className="container">
          <div className="flash-hero__top-row">
            <div className="flash-hero__brand">
              <div className="flash-hero__badge">
                <Zap size={14} fill="#FFFFFF" />
                <span>{t('engagement:flashSale.badge')}</span>
              </div>
              <h1 className="flash-hero__title">
                {t('engagement:flashSale.title')}
              </h1>
              <p className="flash-hero__subtitle">
                {t('engagement:flashSale.subtitle')}
              </p>
            </div>

            {/* Prominent High-Impact Live Countdown Card */}
            <div className="flash-hero__timer-box">
              <div className="flash-timer-header">
                <Clock size={16} />
                <span>{t('engagement:flashSale.timerLabel')}</span>
              </div>
              <div className="flash-timer-digits">
                <div className="flash-digit-block">
                  <span className="flash-digit-num">{timeLeft.hours}</span>
                  <span className="flash-digit-unit">{t('engagement:flashSale.unitHours')}</span>
                </div>
                <span className="flash-colon">:</span>
                <div className="flash-digit-block">
                  <span className="flash-digit-num">{timeLeft.minutes}</span>
                  <span className="flash-digit-unit">{t('engagement:flashSale.unitMinutes')}</span>
                </div>
                <span className="flash-colon">:</span>
                <div className="flash-digit-block flash-digit-block--sec">
                  <span className="flash-digit-num">{timeLeft.seconds}</span>
                  <span className="flash-digit-unit">{t('engagement:flashSale.unitSeconds')}</span>
                </div>
              </div>
              <div className="flash-live-traffic">
                <span className="flash-pulse-beacon" />
                <span>{t('engagement:flashSale.liveTraffic', { count: 2480 })}</span>
              </div>
            </div>
          </div>

          {/* Horizontal Time Slots Tab Bar */}
          <div className="flash-slots-bar">
            {SLOT_IDS.map((slotId, idx) => (
              <button
                key={slotId}
                className={`flash-slot-tab ${activeSlot === idx ? 'active' : ''}`}
                onClick={() => setActiveSlot(idx)}
              >
                <span className="flash-slot-time">{SLOT_TIMES[idx]}</span>
                <span className="flash-slot-status">{t(`engagement:flashSale.slots.${slotId}.label`)}</span>
                <span className="flash-slot-desc">{t(`engagement:flashSale.slots.${slotId}.desc`)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        {/* Compact Flash Vouchers Ticket Strip */}
        <section className="flash-vouchers-strip">
          <div className="flash-vouchers-header">
            <Ticket size={16} color="#DC2626" />
            <h3>{t('engagement:flashSale.vouchersTitle')}</h3>
          </div>
          <div className="flash-vouchers-scroll">
            {VOUCHERS.map(v => (
              <div key={v.id} className="flash-voucher-ticket">
                <div className="flash-voucher-left">
                  <span className="flash-voucher-tag">{t(`engagement:flashSale.vouchers.${v.id}.tag`)}</span>
                  <strong className="flash-voucher-disc">{t(`engagement:flashSale.vouchers.${v.id}.discount`)}</strong>
                  <span className="flash-voucher-min">{t(`engagement:flashSale.vouchers.${v.id}.minSpend`)}</span>
                </div>
                <button
                  className={`flash-voucher-btn ${claimedVouchers.has(v.id) ? 'claimed' : ''}`}
                  onClick={() => handleClaimVoucher(v.id, v.code)}
                  disabled={claimedVouchers.has(v.id)}
                >
                  {claimedVouchers.has(v.id) ? <Check size={13} /> : null}
                  {claimedVouchers.has(v.id) ? t('engagement:flashSale.claimed') : t('engagement:flashSale.claim')}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Categories Filter Tabs */}
        <div className="flash-cat-bar">
          {CATEGORY_IDS.map(catId => (
            <button
              key={catId}
              className={`flash-cat-btn ${activeCategory === catId ? 'active' : ''}`}
              onClick={() => setActiveCategory(catId)}
            >
              {t(`engagement:flashSale.categories.${catId}`)}
            </button>
          ))}
        </div>

        {/* Product Cards Grid with Lava Flow Progress */}
        <div className="flash-products-grid">
          {displayedProducts.map(p => {
            const isReminded = remindedProductIds.has(p.id);

            return (
              <div key={p.id} className="flash-item-card">
                {/* Image & Discount */}
                <LocalizedLink to={getProductUrl(p)} className="flash-item-img-box">
                  <img src={p.images[0]} alt={p.name} className="flash-item-img" />
                  <span className="flash-item-disc-badge">-{p.discountPct}%</span>
                  <span className="flash-item-guarantee-tag">{t('engagement:flashSale.bestPriceTag')}</span>
                </LocalizedLink>

                {/* Details */}
                <div className="flash-item-body">
                  <LocalizedLink to={getProductUrl(p)} className="flash-item-title">
                    {p.name}
                  </LocalizedLink>

                  <div className="flash-item-price-row">
                    <span className="flash-item-price">{money(p.flashPrice)}</span>
                    <span className="flash-item-orig">{money(p.price)}</span>
                  </div>

                  {/* Progress Bar or Upcoming Notice */}
                  {!isUpcoming ? (
                    <div className="flash-fire-progress">
                      <div
                        className="flash-fire-fill"
                        style={{ width: `${p.soldPct}%` }}
                      />
                      <span className="flash-fire-text">
                        {t('engagement:flashSale.soldPct', { percent: p.soldPct })}{' '}
                        {p.stockLeft <= 3 && t('engagement:flashSale.stockLeft', { count: p.stockLeft })}
                      </span>
                    </div>
                  ) : (
                    <div className="flash-upcoming-badge">
                      <Clock size={12} />
                      <span>{t('engagement:flashSale.opensAt', { time: currentSlotTime })}</span>
                    </div>
                  )}

                  {/* Action Button */}
                  {!isUpcoming ? (
                    <button
                      className="flash-buy-btn"
                      onClick={() => onAddToCart({ ...p, price: p.flashPrice })}
                    >
                      <Zap size={14} fill="#FFFFFF" /> {t('engagement:flashSale.buyNow')}
                    </button>
                  ) : (
                    <button
                      className={`flash-item-remind-btn ${isReminded ? 'reminded' : ''}`}
                      onClick={() => handleToggleRemind(p.id, p.name)}
                    >
                      {isReminded ? <Check size={14} /> : <Bell size={14} />}
                      {isReminded ? t('engagement:flashSale.reminded') : t('engagement:flashSale.remindMe')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Toast */}
      {toastMessage && (
        <div className="flash-toast">
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}

export default FlashSalePage;
