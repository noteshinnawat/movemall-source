// src/components/LineConnectModal.tsx — 1-Click LINE Official Account Connect & Flex Message Simulator

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  CheckCircle2,
  Bell,
  Coins,
  Truck,
  Sparkles,
  Smartphone,
  Flame,
  Radio,
  ShieldCheck,
  MessageSquare,
  Gift,
  RefreshCw,
} from 'lucide-react';
import { LocalizedLink } from '../i18n/LocalizedLink';
import { formatCurrency } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './LineConnectModal.css';

const SAMPLE_CARRIER = 'Flash Express (Next-Day)';
const SAMPLE_SHIPPED_PRODUCT = 'Sony WH-1000XM5 Wireless Headphones';
const SAMPLE_FLASH_PRODUCT = 'Nike Air Max 270 React Special Edition';
const SAMPLE_FLASH_OLD_PRICE = 4200;
const SAMPLE_FLASH_NEW_PRICE = 2940;
type SimulatedSentTime = 'justNow' | 't1245' | 't1000' | 't1930';

export interface LineConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
  initialTotal?: number;
}

export interface LinePreferences {
  orderUpdates: boolean;
  shippingUpdates: boolean;
  flashSaleAlerts: boolean;
  liveStreamAlerts: boolean;
  dailyCoinsReminders: boolean;
}

export function LineConnectModal({
  isOpen,
  onClose,
  initialOrderId,
  initialTotal,
}: LineConnectModalProps) {
  const { t, i18n } = useTranslation(['commerce', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const money = (value: number) => formatCurrency(value, locale);
  const [activeTab, setActiveTab] = useState<'connect' | 'simulator' | 'settings'>('connect');
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    try {
      const u = localStorage.getItem('movemall_user');
      if (u) {
        const parsed = JSON.parse(u);
        return !!parsed.lineConnected;
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [lineProfile, setLineProfile] = useState<{
    displayName: string;
    pictureUrl: string;
    statusMessage: string;
    lineUserId: string;
  }>(() => {
    try {
      const u = localStorage.getItem('movemall_user');
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed.lineProfile) return parsed.lineProfile;
      }
    } catch {
      // ignore
    }
    return {
      displayName: t('commerce:lineConnect.demoProfile.displayName'),
      pictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      statusMessage: t('commerce:lineConnect.demoProfile.statusMessage'),
      lineUserId: 'U' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    };
  });

  const [preferences, setPreferences] = useState<LinePreferences>(() => {
    try {
      const p = localStorage.getItem('movemall_line_preferences');
      if (p) return JSON.parse(p);
    } catch {
      // ignore
    }
    return {
      orderUpdates: true,
      shippingUpdates: true,
      flashSaleAlerts: true,
      liveStreamAlerts: true,
      dailyCoinsReminders: false,
    };
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [simulatorMessageType, setSimulatorMessageType] = useState<'shipped' | 'receipt' | 'live' | 'flash'>('shipped');
  const [simulatedSentTime, setSimulatedSentTime] = useState<SimulatedSentTime>('justNow');

  useEffect(() => {
    if (isOpen) {
      // sync state
      try {
        const u = localStorage.getItem('movemall_user');
        if (u) {
          const parsed = JSON.parse(u);
          setIsConnected(!!parsed.lineConnected);
          if (parsed.lineProfile) setLineProfile(parsed.lineProfile);
        }
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleTogglePreference(key: keyof LinePreferences) {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    localStorage.setItem('movemall_line_preferences', JSON.stringify(updated));
  }

  function handleConnectLine() {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setShowCelebration(true);

      // Give 50 coins bonus
      try {
        const u = localStorage.getItem('movemall_user');
        let parsed = u ? JSON.parse(u) : {};
        const currentCoins = typeof parsed.coinsBalance === 'number' ? parsed.coinsBalance : 100;
        parsed = {
          ...parsed,
          lineConnected: true,
          lineConnectedAt: new Date().toISOString(),
          coinsBalance: currentCoins + 50,
          lineProfile: lineProfile,
        };
        localStorage.setItem('movemall_user', JSON.stringify(parsed));
        localStorage.setItem('movemall_line_preferences', JSON.stringify(preferences));
        window.dispatchEvent(new Event('movemall_auth_change'));
        window.dispatchEvent(new Event('storage'));
      } catch {
        // ignore
      }

      setTimeout(() => {
        setShowCelebration(false);
      }, 4000);
    }, 1200);
  }

  function handleDisconnectLine() {
    if (!confirm(t('commerce:lineConnect.disconnectConfirm'))) {
      return;
    }
    setIsConnected(false);
    try {
      const u = localStorage.getItem('movemall_user');
      if (u) {
        const parsed = JSON.parse(u);
        delete parsed.lineConnected;
        delete parsed.lineConnectedAt;
        localStorage.setItem('movemall_user', JSON.stringify(parsed));
        window.dispatchEvent(new Event('movemall_auth_change'));
      }
    } catch {
      // ignore
    }
  }

  const sampleOrderId = initialOrderId || 'ORD-2026-889102';
  const sampleTrackingNo = 'TH2608' + sampleOrderId.replace(/[^0-9]/g, '').slice(-6);
  const sampleTotal = initialTotal || 1290;

  return (
    <div className="line-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="line-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="line-modal-header">
          <div className="line-modal-header-brand">
            <div className="line-modal-line-badge">
              <span className="line-icon-text">LINE</span>
            </div>
            <div>
              <h2 className="line-modal-title">Movemall x LINE Official</h2>
              <p className="line-modal-subtitle">{t('commerce:lineConnect.subtitle')}</p>
            </div>
          </div>
          <button className="line-modal-close" onClick={onClose} aria-label={t('commerce:lineConnect.close')}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="line-modal-tabs">
          <button
            className={`line-modal-tab ${activeTab === 'connect' ? 'line-modal-tab--active' : ''}`}
            onClick={() => setActiveTab('connect')}
          >
            <ShieldCheck size={16} />
            {isConnected
              ? t('commerce:lineConnect.tabStatus')
              : t('commerce:lineConnect.tabConnect')}
          </button>
          <button
            className={`line-modal-tab ${activeTab === 'simulator' ? 'line-modal-tab--active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Smartphone size={16} />
            {t('commerce:lineConnect.tabSimulator')}
          </button>
          <button
            className={`line-modal-tab ${activeTab === 'settings' ? 'line-modal-tab--active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Bell size={16} />
            {t('commerce:lineConnect.tabSettings')}
          </button>
        </div>

        {/* Tab 1: Connect / Status */}
        {activeTab === 'connect' && (
          <div className="line-modal-body">
            {showCelebration && (
              <div className="line-celebration-banner">
                <Sparkles size={24} className="line-celebration-sparkle" />
                <div>
                  <div className="line-celebration-title">{t('commerce:lineConnect.celebrationTitle')}</div>
                  <div className="line-celebration-desc">
                    {t('commerce:lineConnect.celebrationDesc')}
                  </div>
                </div>
              </div>
            )}

            {!isConnected ? (
              <div className="line-connect-intro">
                <div className="line-reward-card">
                  <div className="line-reward-badge">
                    <Gift size={16} />
                    {t('commerce:lineConnect.rewardBadge')}
                  </div>
                  <div className="line-reward-grid">
                    <div className="line-reward-item">
                      <div className="line-reward-icon line-reward-icon--coin">
                        <Coins size={20} />
                      </div>
                      <div>
                        <strong>{t('commerce:lineConnect.rewardCoinsTitle')}</strong>
                        <span>{t('commerce:lineConnect.rewardCoinsDesc')}</span>
                      </div>
                    </div>
                    <div className="line-reward-item">
                      <div className="line-reward-icon line-reward-icon--truck">
                        <Truck size={20} />
                      </div>
                      <div>
                        <strong>{t('commerce:lineConnect.rewardTrackingTitle')}</strong>
                        <span>{t('commerce:lineConnect.rewardTrackingDesc')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="line-benefit-list">
                  <div className="line-benefit-item">
                    <CheckCircle2 size={18} className="line-check-icon" />
                    <span>
                      <strong>{t('commerce:lineConnect.benefitReceiptLabel')}</strong>{' '}
                      {t('commerce:lineConnect.benefitReceiptDesc')}
                    </span>
                  </div>
                  <div className="line-benefit-item">
                    <CheckCircle2 size={18} className="line-check-icon" />
                    <span>
                      <strong>{t('commerce:lineConnect.benefitFlashLabel')}</strong>{' '}
                      {t('commerce:lineConnect.benefitFlashDesc')}
                    </span>
                  </div>
                  <div className="line-benefit-item">
                    <CheckCircle2 size={18} className="line-check-icon" />
                    <span>
                      <strong>{t('commerce:lineConnect.benefitLiveLabel')}</strong>{' '}
                      {t('commerce:lineConnect.benefitLiveDesc')}
                    </span>
                  </div>
                </div>

                <div className="line-connect-actions">
                  <button
                    className="line-btn-connect"
                    onClick={handleConnectLine}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw size={18} className="line-spinner" />
                        {t('commerce:lineConnect.connecting')}
                      </>
                    ) : (
                      <>
                        <span className="line-btn-icon">LINE</span>
                        {t('commerce:lineConnect.connectCta')}
                      </>
                    )}
                  </button>
                  <p className="line-terms-note">
                    {t('commerce:lineConnect.termsNote')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="line-connected-view">
                <div className="line-connected-card">
                  <div className="line-profile-avatar-wrap">
                    <img src={lineProfile.pictureUrl} alt={lineProfile.displayName} className="line-profile-avatar" />
                    <span className="line-profile-online-badge">✓</span>
                  </div>
                  <div className="line-profile-details">
                    <div className="line-profile-badge">{t('commerce:lineConnect.profileBadge')}</div>
                    <h3 className="line-profile-name">{lineProfile.displayName}</h3>
                    <p className="line-profile-status">{lineProfile.statusMessage}</p>
                    <span className="line-profile-uid">
                      {t('commerce:lineConnect.profileUserId', { id: lineProfile.lineUserId })}
                    </span>
                  </div>
                </div>

                <div className="line-connected-stats">
                  <div className="line-stat-box">
                    <span className="line-stat-label">{t('commerce:lineConnect.statNotificationLabel')}</span>
                    <strong className="line-stat-val text-green">{t('commerce:lineConnect.statNotificationValue')}</strong>
                  </div>
                  <div className="line-stat-box">
                    <span className="line-stat-label">{t('commerce:lineConnect.statCoinsLabel')}</span>
                    <strong className="line-stat-val text-gold">{t('commerce:lineConnect.statCoinsValue')}</strong>
                  </div>
                </div>

                <div className="line-connected-buttons">
                  <button
                    className="line-btn-preview"
                    onClick={() => setActiveTab('simulator')}
                  >
                    <Smartphone size={16} />
                    {t('commerce:lineConnect.previewCta')}
                  </button>
                  <button
                    className="line-btn-disconnect"
                    onClick={handleDisconnectLine}
                  >
                    {t('commerce:lineConnect.disconnectCta')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: LINE Flex Message Simulator */}
        {activeTab === 'simulator' && (
          <div className="line-modal-body line-simulator-body">
            <div className="line-sim-controls">
              <span className="line-sim-label">{t('commerce:lineConnect.sim.label')}</span>
              <div className="line-sim-pills">
                <button
                  className={`line-sim-pill ${simulatorMessageType === 'shipped' ? 'line-sim-pill--active' : ''}`}
                  onClick={() => {
                    setSimulatorMessageType('shipped');
                    setSimulatedSentTime('justNow');
                  }}
                >
                  <Truck size={14} />
                  {t('commerce:lineConnect.sim.pillShipped')}
                </button>
                <button
                  className={`line-sim-pill ${simulatorMessageType === 'receipt' ? 'line-sim-pill--active' : ''}`}
                  onClick={() => {
                    setSimulatorMessageType('receipt');
                    setSimulatedSentTime('t1245');
                  }}
                >
                  <CheckCircle2 size={14} />
                  {t('commerce:lineConnect.sim.pillReceipt')}
                </button>
                <button
                  className={`line-sim-pill ${simulatorMessageType === 'flash' ? 'line-sim-pill--active' : ''}`}
                  onClick={() => {
                    setSimulatorMessageType('flash');
                    setSimulatedSentTime('t1000');
                  }}
                >
                  <Flame size={14} />
                  {t('commerce:lineConnect.sim.pillFlash')}
                </button>
                <button
                  className={`line-sim-pill ${simulatorMessageType === 'live' ? 'line-sim-pill--active' : ''}`}
                  onClick={() => {
                    setSimulatorMessageType('live');
                    setSimulatedSentTime('t1930');
                  }}
                >
                  <Radio size={14} />
                  {t('commerce:lineConnect.sim.pillLive')}
                </button>
              </div>
            </div>

            {/* Mobile Chat Viewport */}
            <div className="line-phone-frame">
              {/* LINE Header */}
              <div className="line-phone-header">
                <div className="line-phone-header-left">
                  <span className="line-phone-back">‹</span>
                  <div className="line-phone-oa-info">
                    <span className="line-phone-oa-name">Movemall Official</span>
                    <span className="line-phone-oa-badge">{t('commerce:lineConnect.sim.officialBadge')}</span>
                  </div>
                </div>
                <div className="line-phone-header-right">
                  <MessageSquare size={16} />
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="line-phone-messages">
                <div className="line-chat-timestamp">
                  {t('commerce:lineConnect.sim.chatTimestamp', {
                    time: t(`commerce:lineConnect.sim.times.${simulatedSentTime}`),
                  })}
                </div>

                {/* Shipped Flex Message */}
                {simulatorMessageType === 'shipped' && (
                  <div className="line-flex-card">
                    <div className="line-flex-header line-flex-header--blue">
                      <div className="line-flex-header-top">
                        <Truck size={18} />
                        <span>MOVEMALL LOGISTICS</span>
                      </div>
                      <h4 className="line-flex-title">{t('commerce:lineConnect.sim.shippedTitle')}</h4>
                    </div>

                    <div className="line-flex-body">
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">{t('commerce:lineConnect.sim.orderIdLabel')}</span>
                        <strong className="line-flex-val">{sampleOrderId}</strong>
                      </div>
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">{t('commerce:lineConnect.sim.carrierLabel')}</span>
                        <strong className="line-flex-val">{SAMPLE_CARRIER}</strong>
                      </div>
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">{t('commerce:lineConnect.sim.trackingLabel')}</span>
                        <strong className="line-flex-val text-blue">{sampleTrackingNo}</strong>
                      </div>
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">{t('commerce:lineConnect.sim.statusLabel')}</span>
                        <span className="line-flex-badge-status">{t('commerce:lineConnect.sim.statusValue')}</span>
                      </div>

                      <div className="line-flex-product-preview">
                        <img
                          src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&auto=format&fit=crop&q=80"
                          alt={t('commerce:lineConnect.sim.sampleProductAlt')}
                          className="line-flex-thumb"
                        />
                        <div className="line-flex-prod-info">
                          <div className="line-flex-prod-name">{SAMPLE_SHIPPED_PRODUCT}</div>
                          <div className="line-flex-prod-qty">
                            {t('commerce:lineConnect.sim.sampleProductQty', { amount: money(sampleTotal) })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="line-flex-footer">
                      <LocalizedLink
                        to={`/tracking?id=${sampleOrderId}`}
                        className="line-flex-btn line-flex-btn--primary"
                        onClick={onClose}
                      >
                        <Truck size={14} />
                        {t('commerce:lineConnect.sim.trackCta')}
                      </LocalizedLink>
                      <LocalizedLink
                        to="/orders"
                        className="line-flex-btn line-flex-btn--secondary"
                        onClick={onClose}
                      >
                        {t('commerce:lineConnect.sim.orderDetailCta')}
                      </LocalizedLink>
                    </div>
                  </div>
                )}

                {/* Receipt Flex Message */}
                {simulatorMessageType === 'receipt' && (
                  <div className="line-flex-card">
                    <div className="line-flex-header line-flex-header--green">
                      <div className="line-flex-header-top">
                        <CheckCircle2 size={18} />
                        <span>MOVEMALL E-RECEIPT</span>
                      </div>
                      <h4 className="line-flex-title">{t('commerce:lineConnect.sim.receiptTitle')}</h4>
                    </div>

                    <div className="line-flex-body">
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">{t('commerce:lineConnect.sim.receiptOrderLabel')}</span>
                        <strong className="line-flex-val">{sampleOrderId}</strong>
                      </div>
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">{t('commerce:lineConnect.sim.receiptTotalLabel')}</span>
                        <strong className="line-flex-val text-green">{money(sampleTotal)}</strong>
                      </div>
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">{t('commerce:lineConnect.sim.receiptCoinsLabel')}</span>
                        <strong className="line-flex-val text-gold">{t('commerce:lineConnect.sim.receiptCoinsValue')}</strong>
                      </div>
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">{t('commerce:lineConnect.sim.receiptShippingLabel')}</span>
                        <span className="line-flex-val">{t('commerce:lineConnect.sim.receiptShippingValue')}</span>
                      </div>
                    </div>

                    <div className="line-flex-footer">
                      <LocalizedLink
                        to="/orders"
                        className="line-flex-btn line-flex-btn--primary"
                        onClick={onClose}
                      >
                        {t('commerce:lineConnect.sim.orderHistoryCta')}
                      </LocalizedLink>
                    </div>
                  </div>
                )}

                {/* Flash Sale / Abandoned Cart Alert */}
                {simulatorMessageType === 'flash' && (
                  <div className="line-flex-card">
                    <div className="line-flex-header line-flex-header--red">
                      <div className="line-flex-header-top">
                        <Flame size={18} />
                        <span>PRICE DROP ALERT ⚡</span>
                      </div>
                      <h4 className="line-flex-title">{t('commerce:lineConnect.sim.flashTitle')}</h4>
                    </div>

                    <div className="line-flex-body">
                      <p className="line-flex-desc">
                        {t('commerce:lineConnect.sim.flashDesc')}
                      </p>
                      <div className="line-flex-product-preview">
                        <img
                          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80"
                          alt={t('commerce:lineConnect.sim.flashProductAlt')}
                          className="line-flex-thumb"
                        />
                        <div className="line-flex-prod-info">
                          <div className="line-flex-prod-name">{SAMPLE_FLASH_PRODUCT}</div>
                          <div className="line-flex-price-row">
                            <span className="line-flex-old-price">{money(SAMPLE_FLASH_OLD_PRICE)}</span>
                            <span className="line-flex-new-price">{money(SAMPLE_FLASH_NEW_PRICE)}</span>
                            <span className="line-flex-discount-tag">{t('commerce:lineConnect.sim.flashDiscountTag')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="line-flex-footer">
                      <LocalizedLink
                        to="/cart"
                        className="line-flex-btn line-flex-btn--red"
                        onClick={onClose}
                      >
                        {t('commerce:lineConnect.sim.flashCta')}
                      </LocalizedLink>
                    </div>
                  </div>
                )}

                {/* Live Stream Alert */}
                {simulatorMessageType === 'live' && (
                  <div className="line-flex-card">
                    <div className="line-flex-header line-flex-header--purple">
                      <div className="line-flex-header-top">
                        <Radio size={18} />
                        <span>MOVEMALL LIVE 🔴</span>
                      </div>
                      <h4 className="line-flex-title">{t('commerce:lineConnect.sim.liveTitle')}</h4>
                    </div>

                    <div className="line-flex-body">
                      <p className="line-flex-desc">
                        {t('commerce:lineConnect.sim.liveDesc')}
                      </p>
                    </div>

                    <div className="line-flex-footer">
                      <LocalizedLink
                        to="/live"
                        className="line-flex-btn line-flex-btn--purple"
                        onClick={onClose}
                      >
                        {t('commerce:lineConnect.sim.liveCta')}
                      </LocalizedLink>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Notification Preferences */}
        {activeTab === 'settings' && (
          <div className="line-modal-body">
            <div className="line-settings-header">
              <h3 className="line-settings-title">{t('commerce:lineConnect.settings.title')}</h3>
              <p className="line-settings-sub">{t('commerce:lineConnect.settings.subtitle')}</p>
            </div>

            <div className="line-toggles-list">
              <label className="line-toggle-item">
                <div className="line-toggle-info">
                  <div className="line-toggle-label">
                    <CheckCircle2 size={16} className="text-green" />
                    <strong>{t('commerce:lineConnect.settings.orderTitle')}</strong>
                  </div>
                  <span className="line-toggle-sub">{t('commerce:lineConnect.settings.orderDesc')}</span>
                </div>
                <input
                  type="checkbox"
                  className="line-toggle-checkbox"
                  checked={preferences.orderUpdates}
                  onChange={() => handleTogglePreference('orderUpdates')}
                />
              </label>

              <label className="line-toggle-item">
                <div className="line-toggle-info">
                  <div className="line-toggle-label">
                    <Truck size={16} className="text-blue" />
                    <strong>{t('commerce:lineConnect.settings.shippingTitle')}</strong>
                  </div>
                  <span className="line-toggle-sub">{t('commerce:lineConnect.settings.shippingDesc')}</span>
                </div>
                <input
                  type="checkbox"
                  className="line-toggle-checkbox"
                  checked={preferences.shippingUpdates}
                  onChange={() => handleTogglePreference('shippingUpdates')}
                />
              </label>

              <label className="line-toggle-item">
                <div className="line-toggle-info">
                  <div className="line-toggle-label">
                    <Flame size={16} className="text-red" />
                    <strong>{t('commerce:lineConnect.settings.flashTitle')}</strong>
                  </div>
                  <span className="line-toggle-sub">{t('commerce:lineConnect.settings.flashDesc')}</span>
                </div>
                <input
                  type="checkbox"
                  className="line-toggle-checkbox"
                  checked={preferences.flashSaleAlerts}
                  onChange={() => handleTogglePreference('flashSaleAlerts')}
                />
              </label>

              <label className="line-toggle-item">
                <div className="line-toggle-info">
                  <div className="line-toggle-label">
                    <Radio size={16} className="text-purple" />
                    <strong>{t('commerce:lineConnect.settings.liveTitle')}</strong>
                  </div>
                  <span className="line-toggle-sub">{t('commerce:lineConnect.settings.liveDesc')}</span>
                </div>
                <input
                  type="checkbox"
                  className="line-toggle-checkbox"
                  checked={preferences.liveStreamAlerts}
                  onChange={() => handleTogglePreference('liveStreamAlerts')}
                />
              </label>

              <label className="line-toggle-item">
                <div className="line-toggle-info">
                  <div className="line-toggle-label">
                    <Coins size={16} className="text-gold" />
                    <strong>{t('commerce:lineConnect.settings.coinsTitle')}</strong>
                  </div>
                  <span className="line-toggle-sub">{t('commerce:lineConnect.settings.coinsDesc')}</span>
                </div>
                <input
                  type="checkbox"
                  className="line-toggle-checkbox"
                  checked={preferences.dailyCoinsReminders}
                  onChange={() => handleTogglePreference('dailyCoinsReminders')}
                />
              </label>
            </div>

            <div className="line-settings-footer">
              <button className="line-btn-save-settings" onClick={onClose}>
                {t('commerce:lineConnect.settings.save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LineConnectModal;
