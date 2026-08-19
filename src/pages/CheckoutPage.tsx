// src/pages/CheckoutPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, QrCode, CreditCard, Banknote } from 'lucide-react';
import { PromptPayModal } from '../components/PromptPayModal';
import { fetchApi } from '../utils/api';
import { saveOrder } from '../data/orders';
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
  const currentUser = (() => {
    try {
      const uStr = localStorage.getItem('movemall_user');
      return uStr ? JSON.parse(uStr) : null;
    } catch {
      return null;
    }
  })();

  const [step] = useState(0);
  const [shipping, setShipping] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('promptpay');
  const [payLaterPlan, setPayLaterPlan] = useState<'1month' | '3month' | '6month'>('3month');
  const [showPromptPayModal, setShowPromptPayModal] = useState(false);
  const [useCoins, setUseCoins] = useState(false);
  const [notifyViaLine, setNotifyViaLine] = useState(true);
  const userCoins = 120; // 120 Movemall Coins

  // Tax Invoice States
  const [requestInvoice, setRequestInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'individual' | 'corporate'>('individual');
  const [invoiceName, setInvoiceName] = useState('');
  const [invoiceTaxId, setInvoiceTaxId] = useState('');
  const [invoiceBranch, setInvoiceBranch] = useState('00000');
  const [invoiceEmail, setInvoiceEmail] = useState('');
  const [invoiceAddress, setInvoiceAddress] = useState('');

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

  async function handleCompleteOrder() {
    let orderId = `MM-${Date.now()}`;
    try {
      const orderPayload = {
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        paymentMethod: paymentMethod === 'promptpay' ? 'PROMPTPAY' : paymentMethod === 'credit' ? 'CREDIT_CARD' : paymentMethod === 'paylater' ? 'PAYLATER' : 'COD',
        shippingAddress: {
          name: `${form.firstName} ${form.lastName}`.trim() || 'ลูกค้า Movemall',
          phone: form.phone || '0812345678',
          address: `${form.address} ${form.district} ${form.province} ${form.zip}`.trim() || 'กรุงเทพมหานคร 10110',
        },
        // ส่งเฉพาะ coinsUsed — เซิร์ฟเวอร์คำนวณส่วนลดเองจากยอดเหรียญจริงของผู้ใช้
        // เดิมส่ง discountAmount มาด้วย ทำให้ฝั่งเซิร์ฟเวอร์หักส่วนลดซ้ำเป็น 2 เท่า
        coinsUsed: useCoins ? Math.min(userCoins, subtotal) : 0,
        invoiceRequested: requestInvoice,
        taxInvoiceData: requestInvoice ? {
          buyerType: invoiceType,
          nameOrCompany: invoiceName || `${form.firstName} ${form.lastName}`.trim(),
          taxId: invoiceTaxId,
          branchCode: invoiceType === 'corporate' ? invoiceBranch : 'สำนักงานใหญ่',
          email: invoiceEmail,
          address: invoiceAddress || `${form.address} ${form.district} ${form.province} ${form.zip}`.trim(),
        } : null,
      };

      const res = await fetchApi<{ order: { id: string } }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (res?.order?.id) {
        orderId = res.order.id;
      }
    } catch (err) {
      console.warn('API Order submission note (proceeding in client mode):', err);
    }

    // Save order locally for /orders and /tracking
    saveOrder({
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'shipped',
      items: items.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        image: item.product.images[0] || '',
        price: item.product.price,
        quantity: item.quantity,
      })),
      subtotal: subtotal,
      shipping: shippingCost,
      total: grandTotal,
      address: `${form.firstName} ${form.lastName}`.trim() + ' • ' + (form.phone || '0812345678') + ' • ' + `${form.address} ${form.district} ${form.province} ${form.zip}`.trim(),
    });

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
                {PAYMENT_METHODS.map(pay => {
                  const isCodRestricted = pay.id === 'cod' && (currentUser?.status === 'COD_RESTRICTED' || (currentUser?.trustScore !== undefined && currentUser?.trustScore < 60));

                  return (
                    <div key={pay.id}>
                      <label
                        className={`checkout__shipping-option ${paymentMethod === pay.id ? 'checkout__shipping-option--selected' : ''}`}
                        style={{
                          opacity: isCodRestricted ? 0.6 : 1,
                          cursor: isCodRestricted ? 'not-allowed' : 'pointer',
                          background: isCodRestricted ? '#FEF2F2' : undefined,
                          border: isCodRestricted ? '1.5px dashed #FCA5A5' : undefined
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={pay.id}
                          disabled={isCodRestricted}
                          checked={paymentMethod === pay.id}
                          onChange={() => {
                            if (!isCodRestricted) setPaymentMethod(pay.id);
                          }}
                          className="sr-only"
                        />
                        <span className="checkout__shipping-icon">{pay.icon}</span>
                        <div className="checkout__shipping-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <p className="checkout__shipping-name">{pay.name}</p>
                            {isCodRestricted && (
                              <span style={{ fontSize: 10, background: '#DC2626', color: 'white', fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>
                                🚫 ถูกระงับสิทธิ์ COD (Trust Score ต่ำ)
                              </span>
                            )}
                          </div>
                          <p className="checkout__shipping-desc">
                            {isCodRestricted
                              ? 'คุณถูกระงับการสั่งแบบเก็บเงินปลายทางเนื่องจากมีประวัติปฏิเสธรับพัสดุ กรุณาชำระผ่าน PromptPay หรือ PayLater'
                              : pay.desc}
                          </p>
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
                );
              })}
              </div>
            </div>

            {/* Tax & Invoice Request Section */}
            <div className="checkout__form-section" style={{ marginTop: '1.5rem', border: '1.5px solid #BFDBFE', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🧾</span>
                  <div>
                    <h2 className="checkout__section-title" style={{ margin: 0, fontSize: '1.05rem', color: '#1E3A8A' }}>
                      ใบกำกับภาษี / ใบเสร็จรับเงิน (e-Tax Ready)
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
                      ร้านค้าที่จด VAT จะออกใบกำกับภาษีเต็มรูปส่งตรงทางอีเมลของคุณทันที
                    </p>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#EFF6FF', padding: '6px 12px', border: '1px solid #93C5FD' }}>
                  <input
                    type="checkbox"
                    checked={requestInvoice}
                    onChange={e => setRequestInvoice(e.target.checked)}
                    style={{ width: '1.1rem', height: '1.1rem', accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1D4ED8' }}>ขอใบกำกับภาษีเต็มรูป</span>
                </label>
              </div>

              {requestInvoice ? (
                <div style={{ background: '#FFFFFF', padding: '1rem', border: '1px solid #CBD5E1', marginTop: '0.5rem' }}>
                  {/* Buyer Type Switch */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: invoiceType === 'individual' ? '#2563EB' : '#475569' }}>
                      <input
                        type="radio"
                        name="invoiceType"
                        value="individual"
                        checked={invoiceType === 'individual'}
                        onChange={() => setInvoiceType('individual')}
                        style={{ accentColor: '#2563EB' }}
                      />
                      บุคคลธรรมดา
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: invoiceType === 'corporate' ? '#2563EB' : '#475569' }}>
                      <input
                        type="radio"
                        name="invoiceType"
                        value="corporate"
                        checked={invoiceType === 'corporate'}
                        onChange={() => setInvoiceType('corporate')}
                        style={{ accentColor: '#2563EB' }}
                      />
                      นิติบุคคล / บริษัท
                    </label>
                  </div>

                  <div className="checkout__form-grid">
                    <div className="checkout__form-group checkout__form-group--full">
                      <label className="checkout__label">
                        {invoiceType === 'individual' ? 'ชื่อ-นามสกุล (ตามบัตรประชาชน) *' : 'ชื่อบริษัท / องค์กร (ตาม ภ.พ.20) *'}
                      </label>
                      <input
                        className="checkout__input"
                        placeholder={invoiceType === 'individual' ? 'เช่น นายสมชาย ใจดี' : 'เช่น บริษัท มูฟมอลล์ เทรดดิ้ง จำกัด'}
                        value={invoiceName}
                        onChange={e => setInvoiceName(e.target.value)}
                        required={requestInvoice}
                      />
                    </div>

                    <div className="checkout__form-group">
                      <label className="checkout__label">
                        {invoiceType === 'individual' ? 'เลขประจำตัวประชาชน 13 หลัก *' : 'เลขประจำตัวผู้เสียภาษี 13 หลัก *'}
                      </label>
                      <input
                        className="checkout__input"
                        maxLength={13}
                        placeholder="13 หลัก"
                        value={invoiceTaxId}
                        onChange={e => setInvoiceTaxId(e.target.value)}
                        required={requestInvoice}
                      />
                    </div>

                    {invoiceType === 'corporate' && (
                      <div className="checkout__form-group">
                        <label className="checkout__label">รหัสสาขา *</label>
                        <input
                          className="checkout__input"
                          maxLength={5}
                          placeholder="00000 (สำนักงานใหญ่)"
                          value={invoiceBranch}
                          onChange={e => setInvoiceBranch(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="checkout__form-group checkout__form-group--full">
                      <label className="checkout__label">อีเมลสำหรับรับ e-Tax Invoice (PDF & XML) *</label>
                      <input
                        type="email"
                        className="checkout__input"
                        placeholder="tax-invoicing@company.com"
                        value={invoiceEmail}
                        onChange={e => setInvoiceEmail(e.target.value)}
                        required={requestInvoice}
                      />
                    </div>

                    <div className="checkout__form-group checkout__form-group--full">
                      <label className="checkout__label">ที่อยู่ตามทะเบียนภาษี *</label>
                      <input
                        className="checkout__input"
                        placeholder="อาคาร เลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์"
                        value={invoiceAddress || (form.address ? `${form.address} ${form.district} ${form.province} ${form.zip}`.trim() : '')}
                        onChange={e => setInvoiceAddress(e.target.value)}
                        required={requestInvoice}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748B', background: '#F1F5F9', padding: '6px 10px' }}>
                  ℹ️ หากไม่ขอใบกำกับภาษีเต็มรูป ระบบจะออกเป็นใบเสร็จรับเงิน/ใบส่งสินค้าตามปกติให้ในกล่องพัสดุ
                </div>
              )}
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

            {/* LINE Official Realtime Shipping Alert Opt-in */}
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#06C755', color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 5px', borderRadius: 3 }}>LINE</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>รับใบเสร็จและแจ้งเตือนพัสดุผ่าน LINE</div>
                  <div style={{ fontSize: 11, color: '#15803D' }}>แจ้งเตือน Flash Express สดเข้าแชท</div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#166534' }}>
                <input
                  type="checkbox"
                  checked={notifyViaLine}
                  onChange={e => setNotifyViaLine(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#06C755', cursor: 'pointer' }}
                />
                เปิดรับ
              </label>
            </div>

            {/* Movemall Coins Point Redemption */}
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderRadius: 6 }}>
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
              <div>
                <div>ยอดชำระสุทธิ</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748B' }}>
                  (รวมภาษีมูลค่าเพิ่ม 7% แล้ว: ฿{(grandTotal * (7 / 107)).toFixed(2)})
                </div>
              </div>
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
