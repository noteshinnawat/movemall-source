// src/components/PromptPayModal.tsx — Interactive PromptPay QR Code Modal

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './PromptPayModal.css';

interface PromptPayModalProps {
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function PromptPayModal({ amount, onSuccess, onClose }: PromptPayModalProps) {
  const { t, i18n } = useTranslation(['commerce', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="promptpay-overlay" onClick={onClose}>
      <div className="promptpay-modal" onClick={e => e.stopPropagation()}>
        <div className="promptpay-header">
          <div className="promptpay-logo-title">{t('commerce:promptPay.title')}</div>
          <button
            className="promptpay-close-btn"
            onClick={onClose}
            aria-label={t('commerce:promptPay.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="promptpay-body">
          <span className="promptpay-amount-label">{t('commerce:promptPay.amountLabel')}</span>
          <div className="promptpay-amount">{formatCurrency(amount, locale)}</div>

          {/* QR Code Container */}
          <div className="promptpay-qr-box">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MOVEMALL_PROMPTPAY_${amount}_TH`}
              alt={t('commerce:promptPay.qrAlt')}
              className="promptpay-qr-img"
            />
          </div>

          <div className="promptpay-timer-badge">
            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
            {t('commerce:promptPay.timer', {
              minutes: mins,
              seconds: secs < 10 ? `0${secs}` : `${secs}`,
            })}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            {t('commerce:promptPay.payee')} <strong>MOVEMALL THAILAND CO., LTD.</strong>
          </div>

          <button className="promptpay-confirm-btn" onClick={onSuccess}>
            <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6 }} />
            {t('commerce:promptPay.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PromptPayModal;
