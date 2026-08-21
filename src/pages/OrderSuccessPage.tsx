// src/pages/OrderSuccessPage.tsx

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Package,
  Truck,
  Sparkles,
  Check,
  Smartphone,
} from 'lucide-react';
import { LineConnectModal } from '../components/LineConnectModal';
import { LocalizedLink } from '../i18n/LocalizedLink';
import { formatCurrency } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './OrderSuccessPage.css';

export function OrderSuccessPage() {
  const { t, i18n } = useTranslation(['commerce', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id') || `ORD-${Date.now()}`;
  const total = searchParams.get('total') ? Number(searchParams.get('total')) : null;
  const method = searchParams.get('method') || 'promptpay';
  const isCOD = method === 'cod';

  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isLineConnected, setIsLineConnected] = useState<boolean>(() => {
    try {
      const u = localStorage.getItem('movemall_user');
      if (u) return !!JSON.parse(u).lineConnected;
    } catch {
      // ignore
    }
    return false;
  });

  useEffect(() => {
    function syncAuth() {
      try {
        const u = localStorage.getItem('movemall_user');
        if (u) setIsLineConnected(!!JSON.parse(u).lineConnected);
      } catch {
        // ignore
      }
    }
    window.addEventListener('movemall_auth_change', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('movemall_auth_change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  return (
    <main className="order-success">
      <div className="container">
        <div className="order-success__card">
          <div className="order-success__icon-wrapper">
            <CheckCircle2 size={64} className="order-success__icon" />
          </div>

          <span className="order-success__badge">{t('commerce:orderSuccess.badge')}</span>
          <h1 className="order-success__title">{t('commerce:orderSuccess.title')}</h1>
          <p className="order-success__subtitle">
            {t('commerce:orderSuccess.subtitle')}
          </p>

          {isCOD && total !== null && (
            <div style={{
              background: '#FEF3C7',
              border: '1.5px solid #F59E0B',
              padding: '12px 16px',
              margin: '16px 0',
              textAlign: 'left',
              color: '#92400E',
              fontSize: 13,
              lineHeight: 1.5,
              borderRadius: '6px',
            }}>
              <strong>{t('commerce:orderSuccess.codTitle')}</strong>
              <div>{t('commerce:orderSuccess.codNote', { amount: formatCurrency(total, locale) })}</div>
            </div>
          )}

          {/* High-Converting LINE Connect Card */}
          <div className="order-success__line-card">
            <div className="order-success__line-header">
              <div className="order-success__line-badge-icon">LINE</div>
              <div className="order-success__line-texts">
                <h3 className="order-success__line-title">
                  {isLineConnected
                    ? t('commerce:orderSuccess.lineConnectedTitle')
                    : t('commerce:orderSuccess.lineConnectTitle')}
                </h3>
                <p className="order-success__line-desc">
                  {isLineConnected
                    ? t('commerce:orderSuccess.lineConnectedDesc')
                    : t('commerce:orderSuccess.lineConnectDesc')}
                </p>
              </div>
            </div>

            <div className="order-success__line-actions">
              {!isLineConnected ? (
                <button
                  type="button"
                  className="order-success__line-btn order-success__line-btn--connect"
                  onClick={() => setIsLineModalOpen(true)}
                >
                  <Sparkles size={16} />
                  {t('commerce:orderSuccess.lineConnectCta')}
                </button>
              ) : (
                <button
                  type="button"
                  className="order-success__line-btn order-success__line-btn--view"
                  onClick={() => setIsLineModalOpen(true)}
                >
                  <Smartphone size={16} />
                  {t('commerce:orderSuccess.lineManageCta')}
                </button>
              )}
            </div>
          </div>

          <div className="order-success__info">
            <div className="order-success__info-row">
              <span className="order-success__info-label">{t('commerce:orderSuccess.orderIdLabel')}</span>
              <span className="order-success__info-val order-success__order-id">{orderId}</span>
            </div>
            {total !== null && (
              <div className="order-success__info-row">
                <span className="order-success__info-label">{t('commerce:orderSuccess.totalLabel')}</span>
                <span className="order-success__info-val">{formatCurrency(total, locale)}</span>
              </div>
            )}
            <div className="order-success__info-row">
              <span className="order-success__info-label">{t('commerce:orderSuccess.methodLabel')}</span>
              <span className="order-success__info-val">
                {isCOD
                  ? t('commerce:orderSuccess.methodCod')
                  : method === 'credit'
                    ? t('commerce:orderSuccess.methodCredit')
                    : t('commerce:orderSuccess.methodPromptPay')}
              </span>
            </div>
            <div className="order-success__info-row">
              <span className="order-success__info-label">{t('commerce:orderSuccess.paymentStatusLabel')}</span>
              <span className={`order-success__info-val ${isCOD ? 'order-success__status-pending' : 'order-success__status-paid'}`} style={isCOD ? { color: '#D97706', fontWeight: 800 } : {}}>
                {isCOD
                  ? t('commerce:orderSuccess.paymentStatusPending')
                  : t('commerce:orderSuccess.paymentStatusPaid')}
              </span>
            </div>
            <div className="order-success__info-row">
              <span className="order-success__info-label">{t('commerce:orderSuccess.etaLabel')}</span>
              <span className="order-success__info-val">{t('commerce:orderSuccess.etaValue')}</span>
            </div>
          </div>

          <div className="order-success__actions">
            <LocalizedLink to={`/tracking?id=${orderId}`} className="order-success__btn order-success__btn--primary">
              <Truck size={18} />
              {t('commerce:orderSuccess.trackCta')}
            </LocalizedLink>
            <LocalizedLink to="/shop" className="order-success__btn order-success__btn--secondary">
              <ShoppingBag size={18} />
              {t('commerce:orderSuccess.continueShopping')}
              <ArrowRight size={16} />
            </LocalizedLink>
          </div>
        </div>
      </div>

      {/* LINE Connect Modal */}
      <LineConnectModal
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
        initialOrderId={orderId}
        initialTotal={total || undefined}
      />
    </main>
  );
}

export default OrderSuccessPage;
