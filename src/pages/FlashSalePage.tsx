// src/pages/FlashSalePage.tsx — Flash Sale Deals Hub with Urgency & Remind Me Feature

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Clock, Bell, Check, Sparkles, Flame, ShieldCheck, Ticket, Users, ArrowRight } from 'lucide-react';
import { products as staticProducts } from '../data/products';
import type { Product } from '../types';
import './FlashSalePage.css';

interface FlashSalePageProps {
  products?: Product[];
  onAddToCart: (product: Product) => void;
}

export function FlashSalePage({ products, onAddToCart }: FlashSalePageProps) {
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
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

  const slots = [
    { time: '12:00', label: 'กำลังลดราคา 🔴', status: 'live', desc: 'สิ้นสุดใน 02:45:18' },
    { time: '18:00', label: 'รอบถัดไป ⏰', status: 'upcoming', desc: 'เริ่ม 18:00 น.' },
    { time: '21:00', label: 'รอบค่ำดีลเดือด 🌙', status: 'upcoming', desc: 'เริ่ม 21:00 น.' },
    { time: '00:00', label: 'Midnight Sale ⚡', status: 'upcoming', desc: 'คืนนี้เที่ยงคืน' },
  ];

  const flashVouchers = [
    { id: 'fv-1', code: 'FLASH50', discount: 'ลด ฿50', minSpend: 'ขั้นต่ำ ฿300', tag: '⚡ โค้ดด่วน' },
    { id: 'fv-2', code: 'FLASH15P', discount: 'ลด 15%', minSpend: 'ขั้นต่ำ ฿800', tag: '🔥 ฮิตสุด' },
    { id: 'fv-3', code: 'FSFREE', discount: 'ส่งฟรี 0.-', minSpend: 'ไม่มีขั้นต่ำ', tag: '🚚 ส่งฟรี' },
  ];

  function handleToggleRemind(productId: string, productName: string) {
    const nextSet = new Set(remindedProductIds);
    if (nextSet.has(productId)) {
      nextSet.delete(productId);
      showToast(`ยกเลิกการแจ้งเตือน "${productName}" แล้ว`);
    } else {
      nextSet.add(productId);
      showToast(`🔔 ตั้งเตือนสำเร็จ! ระบบจะแจ้งเตือนคุณก่อนเริ่มรอบ Flash Sale`);
    }
    setRemindedProductIds(nextSet);
  }

  function handleClaimVoucher(id: string, code: string) {
    setClaimedVouchers(prev => new Set([...prev, id]));
    showToast(`🎉 เก็บโค้ดส่วนลด "${code}" สำเร็จแล้ว! ใช้ลดในหน้าชำระเงินได้ทันที`);
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  // Filter products
  const currentSlotInfo = slots[activeSlot];
  const isUpcoming = currentSlotInfo.status === 'upcoming';

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
                <span>MOVEMALL FLASH DEALS</span>
              </div>
              <h1 className="flash-hero__title">
                ⚡ มหกรรมลดล้างสต็อก Flash Sale ลดสูงสุด 70%
              </h1>
              <p className="flash-hero__subtitle">
                สินค้าราคาพิเศษเฉพาะช่วงเวลานี้ การันตีราคาถูกที่สุดในรอบ 30 วัน หมดแล้วหมดเลย!
              </p>
            </div>

            {/* Prominent High-Impact Live Countdown Card */}
            <div className="flash-hero__timer-box">
              <div className="flash-timer-header">
                <Clock size={16} />
                <span>สิ้นสุดรอบปัจจุบันใน</span>
              </div>
              <div className="flash-timer-digits">
                <div className="flash-digit-block">
                  <span className="flash-digit-num">{timeLeft.hours}</span>
                  <span className="flash-digit-unit">ชม.</span>
                </div>
                <span className="flash-colon">:</span>
                <div className="flash-digit-block">
                  <span className="flash-digit-num">{timeLeft.minutes}</span>
                  <span className="flash-digit-unit">นาที</span>
                </div>
                <span className="flash-colon">:</span>
                <div className="flash-digit-block flash-digit-block--sec">
                  <span className="flash-digit-num">{timeLeft.seconds}</span>
                  <span className="flash-digit-unit">วินาที</span>
                </div>
              </div>
              <div className="flash-live-traffic">
                <span className="flash-pulse-beacon" />
                <span>มีผู้กำลังรอแย่งช้อป 2,480 คน</span>
              </div>
            </div>
          </div>

          {/* Horizontal Time Slots Tab Bar */}
          <div className="flash-slots-bar">
            {slots.map((slot, idx) => (
              <button
                key={slot.time}
                className={`flash-slot-tab ${activeSlot === idx ? 'active' : ''}`}
                onClick={() => setActiveSlot(idx)}
              >
                <span className="flash-slot-time">{slot.time}</span>
                <span className="flash-slot-status">{slot.label}</span>
                <span className="flash-slot-desc">{slot.desc}</span>
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
            <h3>🎟️ คูปองลับลดเพิ่มในรอบ Flash Sale นี้</h3>
          </div>
          <div className="flash-vouchers-scroll">
            {flashVouchers.map(v => (
              <div key={v.id} className="flash-voucher-ticket">
                <div className="flash-voucher-left">
                  <span className="flash-voucher-tag">{v.tag}</span>
                  <strong className="flash-voucher-disc">{v.discount}</strong>
                  <span className="flash-voucher-min">{v.minSpend}</span>
                </div>
                <button
                  className={`flash-voucher-btn ${claimedVouchers.has(v.id) ? 'claimed' : ''}`}
                  onClick={() => handleClaimVoucher(v.id, v.code)}
                  disabled={claimedVouchers.has(v.id)}
                >
                  {claimedVouchers.has(v.id) ? <Check size={13} /> : null}
                  {claimedVouchers.has(v.id) ? 'เก็บแล้ว' : 'เก็บโค้ด'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Categories Filter Tabs */}
        <div className="flash-cat-bar">
          <button
            className={`flash-cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            🔥 ทั้งหมด
          </button>
          <button
            className={`flash-cat-btn ${activeCategory === 'electronics' ? 'active' : ''}`}
            onClick={() => setActiveCategory('electronics')}
          >
            🎧 ไอที & แกดเจ็ต
          </button>
          <button
            className={`flash-cat-btn ${activeCategory === 'fashion' ? 'active' : ''}`}
            onClick={() => setActiveCategory('fashion')}
          >
            👗 แฟชั่น
          </button>
          <button
            className={`flash-cat-btn ${activeCategory === 'beauty' ? 'active' : ''}`}
            onClick={() => setActiveCategory('beauty')}
          >
            💄 บิวตี้ & สกินแคร์
          </button>
          <button
            className={`flash-cat-btn ${activeCategory === 'home' ? 'active' : ''}`}
            onClick={() => setActiveCategory('home')}
          >
            🏠 ของใช้ในบ้าน
          </button>
        </div>

        {/* Product Cards Grid with Lava Flow Progress */}
        <div className="flash-products-grid">
          {displayedProducts.map(p => {
            const isReminded = remindedProductIds.has(p.id);

            return (
              <div key={p.id} className="flash-item-card">
                {/* Image & Discount */}
                <Link to={`/product/${p.id}`} className="flash-item-img-box">
                  <img src={p.images[0]} alt={p.name} className="flash-item-img" />
                  <span className="flash-item-disc-badge">-{p.discountPct}%</span>
                  <span className="flash-item-guarantee-tag">👑 ถูกสุดใน 30 วัน</span>
                </Link>

                {/* Details */}
                <div className="flash-item-body">
                  <Link to={`/product/${p.id}`} className="flash-item-title">
                    {p.name}
                  </Link>

                  <div className="flash-item-price-row">
                    <span className="flash-item-price">฿{p.flashPrice.toLocaleString()}</span>
                    <span className="flash-item-orig">฿{p.price.toLocaleString()}</span>
                  </div>

                  {/* Progress Bar or Upcoming Notice */}
                  {!isUpcoming ? (
                    <div className="flash-fire-progress">
                      <div
                        className="flash-fire-fill"
                        style={{ width: `${p.soldPct}%` }}
                      />
                      <span className="flash-fire-text">
                        🔥 ขายแล้ว {p.soldPct}% {p.stockLeft <= 3 && `(เหลือ ${p.stockLeft} ชิ้น)`}
                      </span>
                    </div>
                  ) : (
                    <div className="flash-upcoming-badge">
                      <Clock size={12} />
                      <span>เปิดขายรอบ {currentSlotInfo.time} น.</span>
                    </div>
                  )}

                  {/* Action Button */}
                  {!isUpcoming ? (
                    <button
                      className="flash-buy-btn"
                      onClick={() => onAddToCart({ ...p, price: p.flashPrice })}
                    >
                      <Zap size={14} fill="#FFFFFF" /> สั่งซื้อด่วน
                    </button>
                  ) : (
                    <button
                      className={`flash-item-remind-btn ${isReminded ? 'reminded' : ''}`}
                      onClick={() => handleToggleRemind(p.id, p.name)}
                    >
                      {isReminded ? <Check size={14} /> : <Bell size={14} />}
                      {isReminded ? '✓ ตั้งเตือนแล้ว' : '🔔 เตือนฉัน'}
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
