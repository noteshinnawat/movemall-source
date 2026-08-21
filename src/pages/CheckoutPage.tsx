// src/pages/CheckoutPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { PromptPayModal } from '../components/PromptPayModal';
import { fetchApi } from '../utils/api';
import { saveOrder } from '../data/orders';
import { useLocalizedPath } from '../i18n/LocalizedLink';
import { formatCurrency, formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import type { CartItem } from '../types';
import './CheckoutPage.css';

interface CheckoutPageProps {
  items: CartItem[];
  subtotal: number;
  total: number;
  onClear: () => void;
}

const SHIPPING_OPTIONS = [
  { id: 'standard', icon: '📦', price: 50, free: false },
  { id: 'express', icon: '🚀', price: 120, free: false },
  { id: 'same-day', icon: '⚡', price: 200, free: false },
];

const PAYMENT_METHODS = [
  { id: 'promptpay', icon: '📱' },
  { id: 'paylater', icon: '✨' },
  { id: 'credit', icon: '💳' },
  { id: 'cod', icon: '💵' },
];

const STEP_IDS = ['address', 'shipping', 'payment'] as const;

// Label ids are localized for display; the submitted value stays the canonical
// Thai province name so shipping addresses in the order payload are unchanged.
const PROVINCES = [
  { id: 'bangkok', value: 'กรุงเทพมหานคร' },
  { id: 'chiangMai', value: 'เชียงใหม่' },
  { id: 'phuket', value: 'ภูเก็ต' },
  { id: 'khonKaen', value: 'ขอนแก่น' },
  { id: 'nonthaburi', value: 'นนทบุรี' },
  { id: 'samutPrakan', value: 'สมุทรปราการ' },
  { id: 'pathumThani', value: 'ปทุมธานี' },
] as const;

const PAYLATER_CREDIT_LIMIT = 15000;

export function CheckoutPage({ items, subtotal, total, onClear }: CheckoutPageProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['commerce', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const localizePath = useLocalizedPath();
  const money = (value: number) => formatCurrency(value, locale);
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
    navigate(
      localizePath(`/order/success?id=${orderId}&total=${grandTotal}&method=${paymentMethod}`)
    );
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
          <h1 className="checkout__header-title">{t('commerce:checkout.title')}</h1>
          <div className="checkout__steps" aria-label={t('commerce:checkout.stepsAria')}>
            {STEP_IDS.map((stepId, i) => (
              <div key={stepId} style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`checkout__step${i === step ? ' checkout__step--active' : i < step ? ' checkout__step--done' : ''}`}>
                  <span className="checkout__step-num">{i < step ? '✓' : i + 1}</span>
                  {t(`commerce:checkout.steps.${stepId}`)}
                </div>
                {i < STEP_IDS.length - 1 && <div className="checkout__step-sep" />}
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
              <h2 className="checkout__section-title">{t('commerce:checkout.address.title')}</h2>
              <div className="checkout__form-grid">
                <div className="checkout__form-group">
                  <label className="checkout__label" htmlFor="checkout-fname">{t('commerce:checkout.address.firstName')}</label>
                  <input id="checkout-fname" className="checkout__input" placeholder={t('commerce:checkout.address.firstNamePlaceholder')} required value={form.firstName} onChange={update('firstName')} />
                </div>
                <div className="checkout__form-group">
                  <label className="checkout__label" htmlFor="checkout-lname">{t('commerce:checkout.address.lastName')}</label>
                  <input id="checkout-lname" className="checkout__input" placeholder={t('commerce:checkout.address.lastNamePlaceholder')} required value={form.lastName} onChange={update('lastName')} />
                </div>
                <div className="checkout__form-group">
                  <label className="checkout__label" htmlFor="checkout-phone">{t('commerce:checkout.address.phone')}</label>
                  <input id="checkout-phone" className="checkout__input" placeholder="0812345678" type="tel" required value={form.phone} onChange={update('phone')} />
                </div>
                <div className="checkout__form-group checkout__form-group--full">
                  <label className="checkout__label" htmlFor="checkout-address">{t('commerce:checkout.address.street')}</label>
                  <input id="checkout-address" className="checkout__input" placeholder={t('commerce:checkout.address.streetPlaceholder')} required value={form.address} onChange={update('address')} />
                </div>
                <div className="checkout__form-group">
                  <label className="checkout__label" htmlFor="checkout-district">{t('commerce:checkout.address.district')}</label>
                  <input id="checkout-district" className="checkout__input" placeholder={t('commerce:checkout.address.districtPlaceholder')} required value={form.district} onChange={update('district')} />
                </div>
                <div className="checkout__form-group">
                  <label className="checkout__label" htmlFor="checkout-province">{t('commerce:checkout.address.province')}</label>
                  <select id="checkout-province" className="checkout__select" required value={form.province} onChange={update('province')}>
                    <option value="">{t('commerce:checkout.address.provincePlaceholder')}</option>
                    {PROVINCES.map(province => (
                      <option key={province.id} value={province.value}>
                        {t(`commerce:checkout.provinces.${province.id}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="checkout__form-group">
                  <label className="checkout__label" htmlFor="checkout-zip">{t('commerce:checkout.address.zip')}</label>
                  <input id="checkout-zip" className="checkout__input" placeholder="10110" maxLength={5} required value={form.zip} onChange={update('zip')} />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="checkout__form-section">
              <h2 className="checkout__section-title">{t('commerce:checkout.shipping.title')}</h2>
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
                      <p className="checkout__shipping-name">
                        {t(`commerce:checkout.shipping.options.${opt.id}.name`)}
                      </p>
                      <p className="checkout__shipping-desc">
                        {t(`commerce:checkout.shipping.options.${opt.id}.desc`)}
                      </p>
                    </div>
                    <span className={`checkout__shipping-price${subtotal >= 299 ? ' checkout__shipping-price--free' : ''}`}>
                      {subtotal >= 299 ? t('commerce:checkout.shipping.free') : money(opt.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="checkout__form-section">
              <h2 className="checkout__section-title">{t('commerce:checkout.payment.title')}</h2>
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
                            <p className="checkout__shipping-name">
                              {t(`commerce:checkout.payment.methods.${pay.id}.name`)}
                            </p>
                            {isCodRestricted && (
                              <span style={{ fontSize: 10, background: '#DC2626', color: 'white', fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>
                                {t('commerce:checkout.payment.codBlockedBadge')}
                              </span>
                            )}
                          </div>
                          <p className="checkout__shipping-desc">
                            {isCodRestricted
                              ? t('commerce:checkout.payment.codBlockedDesc')
                              : t(`commerce:checkout.payment.methods.${pay.id}.desc`, {
                                  limit: money(PAYLATER_CREDIT_LIMIT),
                                })}
                          </p>
                        </div>
                      </label>

                    {/* PayLater Installment Options Box */}
                    {paymentMethod === 'paylater' && pay.id === 'paylater' && (
                      <div style={{ background: '#EFF6FF', border: '1.5px solid #3B82F6', padding: 12, margin: '6px 0 10px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF' }}>
                          {t('commerce:checkout.payment.payLater.heading', {
                            limit: money(PAYLATER_CREDIT_LIMIT),
                          })}
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
                            <div style={{ fontWeight: 800 }}>{t('commerce:checkout.payment.payLater.oneMonth')}</div>
                            <div style={{ fontSize: 10, opacity: 0.9 }}>{t('commerce:checkout.payment.payLater.oneMonthNote')}</div>
                            <div style={{ fontWeight: 900, marginTop: 2 }}>
                              {t('commerce:checkout.payment.payLater.perMonth', { amount: money(grandTotal) })}
                            </div>
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
                            <div style={{ fontWeight: 800 }}>{t('commerce:checkout.payment.payLater.threeMonths')}</div>
                            <div style={{ fontSize: 10, color: payLaterPlan === '3month' ? '#FEF08A' : '#D97706', fontWeight: 900 }}>
                              {t('commerce:checkout.payment.payLater.threeMonthsNote')}
                            </div>
                            <div style={{ fontWeight: 900, marginTop: 2 }}>
                              {t('commerce:checkout.payment.payLater.perMonth', {
                                amount: money(Math.round(grandTotal / 3)),
                              })}
                            </div>
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
                            <div style={{ fontWeight: 800 }}>{t('commerce:checkout.payment.payLater.sixMonths')}</div>
                            <div style={{ fontSize: 10, opacity: 0.9 }}>{t('commerce:checkout.payment.payLater.sixMonthsNote')}</div>
                            <div style={{ fontWeight: 900, marginTop: 2 }}>
                              {t('commerce:checkout.payment.payLater.perMonth', {
                                amount: money(Math.round((grandTotal * 1.09) / 6)),
                              })}
                            </div>
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
                      {t('commerce:checkout.invoice.title')}
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
                      {t('commerce:checkout.invoice.subtitle')}
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
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1D4ED8' }}>{t('commerce:checkout.invoice.request')}</span>
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
                      {t('commerce:checkout.invoice.individual')}
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
                      {t('commerce:checkout.invoice.corporate')}
                    </label>
                  </div>

                  <div className="checkout__form-grid">
                    <div className="checkout__form-group checkout__form-group--full">
                      <label className="checkout__label">
                        {invoiceType === 'individual'
                          ? t('commerce:checkout.invoice.nameIndividual')
                          : t('commerce:checkout.invoice.nameCorporate')}
                      </label>
                      <input
                        className="checkout__input"
                        placeholder={
                          invoiceType === 'individual'
                            ? t('commerce:checkout.invoice.namePlaceholderIndividual')
                            : t('commerce:checkout.invoice.namePlaceholderCorporate')
                        }
                        value={invoiceName}
                        onChange={e => setInvoiceName(e.target.value)}
                        required={requestInvoice}
                      />
                    </div>

                    <div className="checkout__form-group">
                      <label className="checkout__label">
                        {invoiceType === 'individual'
                          ? t('commerce:checkout.invoice.taxIdIndividual')
                          : t('commerce:checkout.invoice.taxIdCorporate')}
                      </label>
                      <input
                        className="checkout__input"
                        maxLength={13}
                        placeholder={t('commerce:checkout.invoice.taxIdPlaceholder')}
                        value={invoiceTaxId}
                        onChange={e => setInvoiceTaxId(e.target.value)}
                        required={requestInvoice}
                      />
                    </div>

                    {invoiceType === 'corporate' && (
                      <div className="checkout__form-group">
                        <label className="checkout__label">{t('commerce:checkout.invoice.branch')}</label>
                        <input
                          className="checkout__input"
                          maxLength={5}
                          placeholder={t('commerce:checkout.invoice.branchPlaceholder')}
                          value={invoiceBranch}
                          onChange={e => setInvoiceBranch(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="checkout__form-group checkout__form-group--full">
                      <label className="checkout__label">{t('commerce:checkout.invoice.email')}</label>
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
                      <label className="checkout__label">{t('commerce:checkout.invoice.address')}</label>
                      <input
                        className="checkout__input"
                        placeholder={t('commerce:checkout.invoice.addressPlaceholder')}
                        value={invoiceAddress || (form.address ? `${form.address} ${form.district} ${form.province} ${form.zip}`.trim() : '')}
                        onChange={e => setInvoiceAddress(e.target.value)}
                        required={requestInvoice}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748B', background: '#F1F5F9', padding: '6px 10px' }}>
                  {t('commerce:checkout.invoice.optOutNote')}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="checkout__summary">
            <h2 className="checkout__summary-title">{t('commerce:checkout.summary.title')}</h2>

            <div className="checkout__summary-items">
              {items.map(item => (
                <div key={item.product.id} className="checkout__summary-item">
                  <img src={item.product.images[0]} alt={item.product.name} className="checkout__summary-img" />
                  <div className="checkout__summary-item-info">
                    <p className="checkout__summary-item-name">{item.product.name}</p>
                    <p className="checkout__summary-item-qty">
                      {t('commerce:checkout.summary.quantity', {
                        quantity: formatNumber(item.quantity, locale),
                      })}
                    </p>
                  </div>
                  <span className="checkout__summary-item-price">
                    {money(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 10px', fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0' }}>
              <span>📦</span>
              <span>{t('commerce:checkout.summary.splitShipmentNote')}</span>
            </div>

            <div className="checkout__summary-divider" />

            {/* LINE Official Realtime Shipping Alert Opt-in */}
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#06C755', color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 5px', borderRadius: 3 }}>LINE</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>{t('commerce:checkout.summary.lineTitle')}</div>
                  <div style={{ fontSize: 11, color: '#15803D' }}>{t('commerce:checkout.summary.lineDesc')}</div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#166534' }}>
                <input
                  type="checkbox"
                  checked={notifyViaLine}
                  onChange={e => setNotifyViaLine(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#06C755', cursor: 'pointer' }}
                />
                {t('commerce:checkout.summary.lineOptIn')}
              </label>
            </div>

            {/* Movemall Coins Point Redemption */}
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🪙</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#92400E' }}>{t('commerce:checkout.summary.coinsTitle')}</div>
                  <div style={{ fontSize: 11, color: '#B45309' }}>
                    {t('commerce:checkout.summary.coinsDesc', {
                      count: userCoins,
                      amount: money(userCoins),
                    })}
                  </div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#92400E' }}>
                <input
                  type="checkbox"
                  checked={useCoins}
                  onChange={e => setUseCoins(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                {t('commerce:checkout.summary.coinsUse')}
              </label>
            </div>

            <div className="checkout__summary-row">
              <span className="checkout__summary-label">{t('commerce:checkout.summary.subtotal')}</span>
              <span className="checkout__summary-value">{money(subtotal)}</span>
            </div>
            <div className="checkout__summary-row">
              <span className="checkout__summary-label">{t('commerce:checkout.summary.shipping')}</span>
              <span className={shippingCost === 0 ? 'checkout__summary-value--free' : 'checkout__summary-value'}>
                {shippingCost === 0 ? t('commerce:checkout.summary.shippingFree') : money(shippingCost)}
              </span>
            </div>
            {useCoins && (
              <div className="checkout__summary-row" style={{ color: 'var(--success)' }}>
                <span className="checkout__summary-label" style={{ color: 'var(--success)' }}>{t('commerce:checkout.summary.coinsDiscount')}</span>
                <span className="checkout__summary-value">-{money(coinDiscount)}</span>
              </div>
            )}
            <div className="checkout__summary-divider" />
            <div className="checkout__summary-row checkout__summary-row--total">
              <div>
                <div>{t('commerce:checkout.summary.total')}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748B' }}>
                  {t('commerce:checkout.summary.vatNote', {
                    amount: money(Number((grandTotal * (7 / 107)).toFixed(2))),
                  })}
                </div>
              </div>
              <span className="checkout__total-price">{money(grandTotal)}</span>
            </div>

            <button type="submit" id="checkout-submit-btn" className="checkout__submit-btn">
              <ShieldCheck size={18} />
              {paymentMethod === 'promptpay'
                ? t('commerce:checkout.summary.submitPromptPay')
                : t('commerce:checkout.summary.submitConfirm')}
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
