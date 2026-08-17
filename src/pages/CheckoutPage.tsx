// src/pages/CheckoutPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, QrCode, CreditCard, Banknote } from 'lucide-react';
import { PromptPayModal } from '../components/PromptPayModal';
import type { CartItem } from '../types';
import './CheckoutPage.css';

interface CheckoutPageProps {
  items: CartItem[];
  subtotal: number;
  total: number;
  onClear: () => void;
}

const SHIPPING_OPTIONS = [
  { id: 'standard', icon: '📦', name: 'จัดส่งปกติ', desc: '3-5 วันทำการ', price: 50, free: false },
  { id: 'express', icon: '🚀', name: 'จัดส่งด่วน', desc: '1-2 วันทำการ', price: 120, free: false },
  { id: 'same-day', icon: '⚡', name: 'จัดส่งภายในวัน', desc: 'ภายใน 4 ชั่วโมง (กทม.)', price: 200, free: false },
];

const PAYMENT_METHODS = [
  { id: 'promptpay', name: 'พร้อมเพย์ (PromptPay QR)', desc: 'สแกนจ่ายทันทีผ่านแอปธนาคารทุกแห่ง ฟรีค่าธรรมเนียม', icon: '📱' },
  { id: 'paylater', name: 'Movemall PayLater (ผ่อนชำระ 0%)', desc: 'ช้อปก่อนจ่ายทีหลัง วงเงินคงเหลือ ฿15,000 (ผ่อน 0% สูงสุด 3 เดือน)', icon: '✨' },
  { id: 'credit', name: 'บัตรเครดิต / เดบิต', desc: 'Visa, Mastercard, JCB ปลอดภัยด้วย 3D Secure', icon: '💳' },
  { id: 'cod', name: 'เก็บเงินปลายทาง (COD)', desc: 'ชำระเงินกับพนักงานเมื่อได้รับสินค้า', icon: '💵' },
];

const STEPS = ['ที่อยู่', 'จัดส่ง', 'ชำระเงิน'];

export function CheckoutPage({ items, subtotal, total, onClear }: CheckoutPageProps) {
  const navigate = useNavigate();
  const [step] = useState(0);
  const [shipping, setShipping] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('promptpay');
  const [payLaterPlan, setPayLaterPlan] = useState<'1month' | '3month' | '6month'>('3month');
  const [showPromptPayModal, setShowPromptPayModal] = useState(false);
  const [useCoins, setUseCoins] = useState(false);
  const userCoins = 120; // 120 Movemall Coins

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '',
    address: '', district: '', province: '', zip: '',
  });

  const selectedShipping = SHIPPING_OPTIONS.find(o => o.id === shipping)!;
  const shippingCost = subtotal >= 299 ? 0 : selectedShipping.price;
  const coinDiscount = useCoins ? Math.min(userCoins, subtotal) : 0;
  const grandTotal = Math.max(0, subtotal + shippingCost - coinDiscount);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function handleCompleteOrder() {
    const orderId = `MM-${Date.now()}`;
    onClear();
    navigate(`/order/success?id=${orderId}&total=${grandTotal}&method=${paymentMethod}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (paymentMethod === 'promptpay') {
      setShowPromptPayModal(true);
    } else {
      handleCompleteOrder();
    }
  }

  return (
    <main className="checkout">
      {/* Header */}
      <div className="checkout__header">
        <div className="container">
          <h1 className="checkout__header-title">💳 ชำระเงิน</h1>
          <div className="checkout__steps" aria-label="ขั้นตอนการชำระเงิน">
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`checkout__step${i === step ? ' checkout__step--active' : i < step ? ' checkout__step--done' : ''}`}>
                  <span className="checkout__step-num">{i < step ? '✓' : i + 1}</span>
                  {s}
                </div>
                {i < STEPS.length - 1 && <div className="checkout__step-sep" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <form className="checkout__body" onSubmit={handleSubmit}>
          <div>
            {/* Address */}
            <div className="checkout__form-section">
              <h2 className="checkout__section-title">📍 ที่อยู่จัดส่ง</h2>
              <div className="checkout__form-grid">
                <div className="checkout__form-group">
                  <label className="checkout__label" htmlFor="checkout-fname">ชื่อ *</label>
                  <input id="checkout-fname" className="checkout__input" placeholder="ชื่อ" required value={form.firstName} onChange={update('firstName')} />
                </div>
                <div className="checkout__form-group">
                  <label className="checkout__label" htmlFor="checkout-lname">นามสกุล *</label>
                  <input id="checkout-lname" className="checkout__input" placeholder="นามสกุล" required value={form.lastName} onChange={update('lastName')} />
                </div>
                <div className="checkout__form-group">
                  <label className="checkout__label" htmlFor="checkout-phone">เบอร์โทรศัพท์ *</label>
                  <input id="checkout-phone" className="checkout__input" placeholder="0812345678" type="tel" required value={form.phone} onChange={update('phone')} />
                </div>
                <div className="checkout__form-group checkout__form-group--full">
                  <label className="checkout__label" htmlFor="checkout-address">ที่อยู่ *</label>
                  <input id="checkout-address" className="checkout__input" placeholder="บ้านเลขที่ ถนน แขวง/ตำบล" required value={form.address} onChange={update('address')} />
                </div>
                <div className="checkout__form-group">
                  <label className="checkout__label" htmlFor="checkout-district">เขต/อำเภอ *</label>
                  <input id="checkout-district" className="checkout__input" placeholder="เขต/อำเภอ" required value={form.district} onChange={update('district')} />
                </div>
                <div className="checkout__form-group">
                  <label className="checkout__label" htmlFor="checkout-province">จังหวัด *</label>
                  <select id="checkout-province" className="checkout__select" required value={form.province} onChange={update('province')}>
                    <option value="">เลือกจังหวัด</option>
                    <option>กรุงเทพมหานคร</option>
                    <option>เชียงใหม่</option>
                    <option>ภูเก็ต</option>
                    <option>ขอนแก่น</option>
                    <option>นนทบุรี</option>
                    <option>สมุทรปราการ</option>
                    <option>ปทุมธานี</option>
                  </select>
                </div>
                <div className="checkout__form-group">
                  <label className="checkout__label" htmlFor="checkout-zip">รหัสไปรษณีย์ *</label>
                  <input id="checkout-zip" className="checkout__input" placeholder="10110" maxLength={5} required value={form.zip} onChange={update('zip')} />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="checkout__form-section">
              <h2 className="checkout__section-title">🚚 วิธีจัดส่ง</h2>
              <div className="checkout__shipping-options">
                {SHIPPING_OPTIONS.map(opt => (
                  <label
                    key={opt.id}
                    className={`checkout__shipping-option${shipping === opt.id ? ' checkout__shipping-option--active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value={opt.id}
                      checked={shipping === opt.id}
                      onChange={() => setShipping(opt.id)}
                      className="sr-only"
                    />
                    <span className="checkout__shipping-icon">{opt.icon}</span>
                    <div className="checkout__shipping-info">
                      <p className="checkout__shipping-name">{opt.name}</p>
                      <p className="checkout__shipping-desc">{opt.desc}</p>
                    </div>
                    <span className={`checkout__shipping-price${subtotal >= 299 ? ' checkout__shipping-price--free' : ''}`}>
                      {subtotal >= 299 ? 'ฟรี' : `฿${opt.price}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="checkout__form-section">
              <h2 className="checkout__section-title">💳 วิธีการชำระเงิน</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {PAYMENT_METHODS.map(pay => (
                  <div key={pay.id}>
                    <label
                      className={`checkout__shipping-option${paymentMethod === pay.id ? ' checkout__shipping-option--active' : ''}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pay.id}
                        checked={paymentMethod === pay.id}
                        onChange={() => setPaymentMethod(pay.id)}
                        className="sr-only"
                      />
                      <span className="checkout__shipping-icon">{pay.icon}</span>
                      <div className="checkout__shipping-info">
                        <p className="checkout__shipping-name">{pay.name}</p>
                        <p className="checkout__shipping-desc">{pay.desc}</p>
                      </div>
                    </label>

                    {/* PayLater Installment Options Box */}
                    {paymentMethod === 'paylater' && pay.id === 'paylater' && (
                      <div style={{ background: '#EFF6FF', border: '1.5px solid #3B82F6', padding: 12, margin: '6px 0 10px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF' }}>
                          ⚡ เลือกระยะเวลาผ่อนชำระ (วงเงินคงเหลือ ฿15,000):
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => setPayLaterPlan('1month')}
                            style={{
                              padding: '8px 4px',
                              textAlign: 'center',
                              background: payLaterPlan === '1month' ? '#2563EB' : '#FFFFFF',
                              color: payLaterPlan === '1month' ? '#FFFFFF' : '#1E293B',
                              border: '1.5px solid',
                              borderColor: payLaterPlan === '1month' ? '#2563EB' : '#CBD5E1',
                              borderRadius: 0,
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            <div style={{ fontWeight: 800 }}>จ่ายเดือนหน้า</div>
                            <div style={{ fontSize: 10, opacity: 0.9 }}>ดอกเบี้ย 0%</div>
                            <div style={{ fontWeight: 900, marginTop: 2 }}>฿{grandTotal.toLocaleString()}/ด.</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPayLaterPlan('3month')}
                            style={{
                              padding: '8px 4px',
                              textAlign: 'center',
                              background: payLaterPlan === '3month' ? '#2563EB' : '#FFFFFF',
                              color: payLaterPlan === '3month' ? '#FFFFFF' : '#1E293B',
                              border: '1.5px solid',
                              borderColor: payLaterPlan === '3month' ? '#2563EB' : '#CBD5E1',
                              borderRadius: 0,
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            <div style={{ fontWeight: 800 }}>ผ่อน 3 เดือน</div>
                            <div style={{ fontSize: 10, color: payLaterPlan === '3month' ? '#FEF08A' : '#D97706', fontWeight: 900 }}>🔥 ฟรีดอกเบี้ย 0%</div>
                            <div style={{ fontWeight: 900, marginTop: 2 }}>฿{Math.round(grandTotal / 3).toLocaleString()}/ด.</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPayLaterPlan('6month')}
                            style={{
                              padding: '8px 4px',
                              textAlign: 'center',
                              background: payLaterPlan === '6month' ? '#2563EB' : '#FFFFFF',
                              color: payLaterPlan === '6month' ? '#FFFFFF' : '#1E293B',
                              border: '1.5px solid',
                              borderColor: payLaterPlan === '6month' ? '#2563EB' : '#CBD5E1',
                              borderRadius: 0,
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            <div style={{ fontWeight: 800 }}>ผ่อน 6 เดือน</div>
                            <div style={{ fontSize: 10, opacity: 0.9 }}>ดบ. 1.5%/ด.</div>
                            <div style={{ fontWeight: 900, marginTop: 2 }}>฿{Math.round((grandTotal * 1.09) / 6).toLocaleString()}/ด.</div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="checkout__summary">
            <h2 className="checkout__summary-title">สรุปคำสั่งซื้อ</h2>

            <div className="checkout__summary-items">
              {items.map(item => (
                <div key={item.product.id} className="checkout__summary-item">
                  <img src={item.product.images[0]} alt={item.product.name} className="checkout__summary-img" />
                  <div className="checkout__summary-item-info">
                    <p className="checkout__summary-item-name">{item.product.name}</p>
                    <p className="checkout__summary-item-qty">× {item.quantity}</p>
                  </div>
                  <span className="checkout__summary-item-price">
                    ฿{(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 10px', fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0' }}>
              <span>📦</span>
              <span>พัสดุจะถูกแยกจัดส่งจากแต่ละร้านค้า (ติดตามเลขพัสดุแยกกล่องได้)</span>
            </div>

            <div className="checkout__summary-divider" />

            {/* Movemall Coins Point Redemption */}
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🪙</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#92400E' }}>Movemall Coins</div>
                  <div style={{ fontSize: 11, color: '#B45309' }}>แลก {userCoins} Coins ลด ฿{userCoins}</div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#92400E' }}>
                <input
                  type="checkbox"
                  checked={useCoins}
                  onChange={e => setUseCoins(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                ใช้ Coins
              </label>
            </div>

            <div className="checkout__summary-row">
              <span className="checkout__summary-label">ยอดรวมสินค้า</span>
              <span className="checkout__summary-value">฿{subtotal.toLocaleString()}</span>
            </div>
            <div className="checkout__summary-row">
              <span className="checkout__summary-label">ค่าส่ง</span>
              <span className={shippingCost === 0 ? 'checkout__summary-value--free' : 'checkout__summary-value'}>
                {shippingCost === 0 ? 'ฟรี 🎉' : `฿${shippingCost}`}
              </span>
            </div>
            {useCoins && (
              <div className="checkout__summary-row" style={{ color: 'var(--success)' }}>
                <span className="checkout__summary-label" style={{ color: 'var(--success)' }}>ส่วนลดจาก Movemall Coins</span>
                <span className="checkout__summary-value">-฿{coinDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="checkout__summary-divider" />
            <div className="checkout__summary-row checkout__summary-row--total">
              <span>ยอดชำระสุทธิ</span>
              <span className="checkout__total-price">฿{grandTotal.toLocaleString()}</span>
            </div>

            <button type="submit" id="checkout-submit-btn" className="checkout__submit-btn">
              <ShieldCheck size={18} />
              {paymentMethod === 'promptpay' ? 'ไปที่หน้าสแกน QR พร้อมเพย์' : 'ยืนยันคำสั่งซื้อ'}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {showPromptPayModal && (
          <PromptPayModal
            amount={grandTotal}
            onSuccess={() => {
              setShowPromptPayModal(false);
              handleCompleteOrder();
            }}
            onClose={() => setShowPromptPayModal(false)}
          />
        )}
      </div>
    </main>
  );
}

export default CheckoutPage;
