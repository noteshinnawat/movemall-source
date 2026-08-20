// src/components/LineConnectModal.tsx — 1-Click LINE Official Account Connect & Flex Message Simulator

import { useState, useEffect } from 'react';
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
import { Link } from 'react-router-dom';
import './LineConnectModal.css';

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
      displayName: 'สมชาย ใจดี',
      pictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      statusMessage: 'ช้อปปิ้งเพลินๆ ที่ Movemall ✨',
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
  const [simulatedSentTime, setSimulatedSentTime] = useState('เมื่อสักครู่');

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
    if (!confirm('คุณต้องการยกเลิกการเชื่อมต่อ LINE Official Account ใช่หรือไม่? คุณจะไม่ได้รับการแจ้งเตือนพัสดุผ่าน LINE อีกต่อไป')) {
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
              <p className="line-modal-subtitle">ระบบแจ้งเตือนออเดอร์และบริการพิเศษผ่าน LINE แบบเรียลไทม์</p>
            </div>
          </div>
          <button className="line-modal-close" onClick={onClose} aria-label="ปิดหน้าต่าง">
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
            {isConnected ? 'สถานะการเชื่อมต่อ' : 'เชื่อมต่อบัญชี (+50 Coins)'}
          </button>
          <button
            className={`line-modal-tab ${activeTab === 'simulator' ? 'line-modal-tab--active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Smartphone size={16} />
            จำลองข้อความ LINE (Flex Message)
          </button>
          <button
            className={`line-modal-tab ${activeTab === 'settings' ? 'line-modal-tab--active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Bell size={16} />
            การตั้งค่าแจ้งเตือน
          </button>
        </div>

        {/* Tab 1: Connect / Status */}
        {activeTab === 'connect' && (
          <div className="line-modal-body">
            {showCelebration && (
              <div className="line-celebration-banner">
                <Sparkles size={24} className="line-celebration-sparkle" />
                <div>
                  <div className="line-celebration-title">🎉 เชื่อมต่อ LINE สำเร็จ!</div>
                  <div className="line-celebration-desc">
                    คุณได้รับ <strong>+50 Movemall Coins</strong> และคูปองส่งฟรี 1 ใบเรียบร้อยแล้ว
                  </div>
                </div>
              </div>
            )}

            {!isConnected ? (
              <div className="line-connect-intro">
                <div className="line-reward-card">
                  <div className="line-reward-badge">
                    <Gift size={16} />
                    สิทธิพิเศษสำหรับผู้เชื่อมต่อ
                  </div>
                  <div className="line-reward-grid">
                    <div className="line-reward-item">
                      <div className="line-reward-icon line-reward-icon--coin">
                        <Coins size={20} />
                      </div>
                      <div>
                        <strong>ฟรี 50 Coins</strong>
                        <span>ใช้เป็นส่วนลดเงินสดได้ทันที</span>
                      </div>
                    </div>
                    <div className="line-reward-item">
                      <div className="line-reward-icon line-reward-icon--truck">
                        <Truck size={20} />
                      </div>
                      <div>
                        <strong>แจ้งเตือนพัสดุสด</strong>
                        <span>รู้ทันทีเมื่อพัสดุออกจากร้าน/ถึงบ้าน</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="line-benefit-list">
                  <div className="line-benefit-item">
                    <CheckCircle2 size={18} className="line-check-icon" />
                    <span><strong>ใบเสร็จดิจิทัล (E-Receipt):</strong> สรุปยอดเงินและหลักฐานคำสั่งซื้อชัดเจน</span>
                  </div>
                  <div className="line-benefit-item">
                    <CheckCircle2 size={18} className="line-check-icon" />
                    <span><strong>Flash Sale Alerts:</strong> เตือนเมื่อของในตะกร้าหรือ Wishlist จัดโปรลดแรง</span>
                  </div>
                  <div className="line-benefit-item">
                    <CheckCircle2 size={18} className="line-check-icon" />
                    <span><strong>Live Alerts:</strong> ไม่พลาดไลฟ์สดของร้านค้า Official Mall พร้อมแจกโค้ด 50%</span>
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
                        กำลังเชื่อมต่อ LINE...
                      </>
                    ) : (
                      <>
                        <span className="line-btn-icon">LINE</span>
                        เชื่อมต่อ LINE ทันที (รับ 50 Coins)
                      </>
                    )}
                  </button>
                  <p className="line-terms-note">
                    🔒 Movemall ปลอดภัย 100% แจ้งเตือนเฉพาะเรื่องสำคัญ สามารถเปิด-ปิดการแจ้งเตือนได้ตลอดเวลา
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
                    <div className="line-profile-badge">🟢 เชื่อมต่อกับ Movemall เรียบร้อยแล้ว</div>
                    <h3 className="line-profile-name">{lineProfile.displayName}</h3>
                    <p className="line-profile-status">{lineProfile.statusMessage}</p>
                    <span className="line-profile-uid">LINE User ID: {lineProfile.lineUserId}</span>
                  </div>
                </div>

                <div className="line-connected-stats">
                  <div className="line-stat-box">
                    <span className="line-stat-label">สถานะการแจ้งเตือน</span>
                    <strong className="line-stat-val text-green">เปิดใช้งานปกติ (Active)</strong>
                  </div>
                  <div className="line-stat-box">
                    <span className="line-stat-label">เหรียญที่ได้รับ</span>
                    <strong className="line-stat-val text-gold">+50 Coins (รับแล้ว)</strong>
                  </div>
                </div>

                <div className="line-connected-buttons">
                  <button
                    className="line-btn-preview"
                    onClick={() => setActiveTab('simulator')}
                  >
                    <Smartphone size={16} />
                    ดูตัวอย่างข้อความแจ้งเตือนใน LINE
                  </button>
                  <button
                    className="line-btn-disconnect"
                    onClick={handleDisconnectLine}
                  >
                    ยกเลิกการเชื่อมต่อ LINE
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
              <span className="line-sim-label">เลือกประเภทข้อความจำลอง:</span>
              <div className="line-sim-pills">
                <button
                  className={`line-sim-pill ${simulatorMessageType === 'shipped' ? 'line-sim-pill--active' : ''}`}
                  onClick={() => {
                    setSimulatorMessageType('shipped');
                    setSimulatedSentTime('เมื่อสักครู่');
                  }}
                >
                  <Truck size={14} />
                  แจ้งเตือนจัดส่งพัสดุ
                </button>
                <button
                  className={`line-sim-pill ${simulatorMessageType === 'receipt' ? 'line-sim-pill--active' : ''}`}
                  onClick={() => {
                    setSimulatorMessageType('receipt');
                    setSimulatedSentTime('12:45 น.');
                  }}
                >
                  <CheckCircle2 size={14} />
                  ใบเสร็จสั่งซื้อสำเร็จ
                </button>
                <button
                  className={`line-sim-pill ${simulatorMessageType === 'flash' ? 'line-sim-pill--active' : ''}`}
                  onClick={() => {
                    setSimulatorMessageType('flash');
                    setSimulatedSentTime('10:00 น.');
                  }}
                >
                  <Flame size={14} />
                  สินค้าในตะกร้าลดราคา
                </button>
                <button
                  className={`line-sim-pill ${simulatorMessageType === 'live' ? 'line-sim-pill--active' : ''}`}
                  onClick={() => {
                    setSimulatorMessageType('live');
                    setSimulatedSentTime('19:30 น.');
                  }}
                >
                  <Radio size={14} />
                  แจ้งเตือนไลฟ์สด
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
                    <span className="line-phone-oa-badge">✓ ทางการ</span>
                  </div>
                </div>
                <div className="line-phone-header-right">
                  <MessageSquare size={16} />
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="line-phone-messages">
                <div className="line-chat-timestamp">วันนี้ {simulatedSentTime}</div>

                {/* Shipped Flex Message */}
                {simulatorMessageType === 'shipped' && (
                  <div className="line-flex-card">
                    <div className="line-flex-header line-flex-header--blue">
                      <div className="line-flex-header-top">
                        <Truck size={18} />
                        <span>MOVEMALL LOGISTICS</span>
                      </div>
                      <h4 className="line-flex-title">🚚 พัสดุของคุณอยู่ระหว่างจัดส่ง!</h4>
                    </div>

                    <div className="line-flex-body">
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">หมายเลขคำสั่งซื้อ:</span>
                        <strong className="line-flex-val">{sampleOrderId}</strong>
                      </div>
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">ผู้ให้บริการขนส่ง:</span>
                        <strong className="line-flex-val">Flash Express (Next-Day)</strong>
                      </div>
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">เลขพัสดุ (Tracking No.):</span>
                        <strong className="line-flex-val text-blue">{sampleTrackingNo}</strong>
                      </div>
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">สถานะล่าสุด:</span>
                        <span className="line-flex-badge-status">📍 กำลังนำส่งโดยพนักงาน</span>
                      </div>

                      <div className="line-flex-product-preview">
                        <img
                          src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&auto=format&fit=crop&q=80"
                          alt="Product"
                          className="line-flex-thumb"
                        />
                        <div className="line-flex-prod-info">
                          <div className="line-flex-prod-name">หูฟัง Sony WH-1000XM5 Wireless Headphones</div>
                          <div className="line-flex-prod-qty">จำนวน 1 ชิ้น • รวม ฿{sampleTotal.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="line-flex-footer">
                      <Link
                        to={`/tracking?id=${sampleOrderId}`}
                        className="line-flex-btn line-flex-btn--primary"
                        onClick={onClose}
                      >
                        <Truck size={14} />
                        📍 ติดตามพัสดุสดแบบ GPS
                      </Link>
                      <Link
                        to={`/orders`}
                        className="line-flex-btn line-flex-btn--secondary"
                        onClick={onClose}
                      >
                        ดูรายละเอียดคำสั่งซื้อ
                      </Link>
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
                      <h4 className="line-flex-title">✅ ชำระเงินสำเร็จ เรียบร้อยแล้ว</h4>
                    </div>

                    <div className="line-flex-body">
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">คำสั่งซื้อ:</span>
                        <strong className="line-flex-val">{sampleOrderId}</strong>
                      </div>
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">ยอดชำระสุทธิ:</span>
                        <strong className="line-flex-val text-green">฿{sampleTotal.toLocaleString()}</strong>
                      </div>
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">Coins ที่ได้รับเพิ่ม:</span>
                        <strong className="line-flex-val text-gold">+12 Coins ✨</strong>
                      </div>
                      <div className="line-flex-row">
                        <span className="line-flex-lbl">การจัดส่ง:</span>
                        <span className="line-flex-val">Flash Express (เตรียมแพ็กพัสดุ)</span>
                      </div>
                    </div>

                    <div className="line-flex-footer">
                      <Link
                        to="/orders"
                        className="line-flex-btn line-flex-btn--primary"
                        onClick={onClose}
                      >
                        ดูประวัติคำสั่งซื้อ
                      </Link>
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
                      <h4 className="line-flex-title">🔥 สินค้าที่คุณดูไว้ ลดราคาพิเศษ!</h4>
                    </div>

                    <div className="line-flex-body">
                      <p className="line-flex-desc">
                        สินค้าในตะกร้าของคุณจัดโปรโมชั่นลดแรง 30% เฉพาะ 2 ชั่วโมงนี้เท่านั้น!
                      </p>
                      <div className="line-flex-product-preview">
                        <img
                          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80"
                          alt="Nike Shoes"
                          className="line-flex-thumb"
                        />
                        <div className="line-flex-prod-info">
                          <div className="line-flex-prod-name">Nike Air Max 270 React Special Edition</div>
                          <div className="line-flex-price-row">
                            <span className="line-flex-old-price">฿4,200</span>
                            <span className="line-flex-new-price">฿2,940</span>
                            <span className="line-flex-discount-tag">-30%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="line-flex-footer">
                      <Link
                        to="/cart"
                        className="line-flex-btn line-flex-btn--red"
                        onClick={onClose}
                      >
                        🛒 สั่งซื้อทันทีพร้อมรับส่วนลด
                      </Link>
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
                      <h4 className="line-flex-title">แบรนด์โปรดกำลังถ่ายทอดสด!</h4>
                    </div>

                    <div className="line-flex-body">
                      <p className="line-flex-desc">
                        <strong>Apple Flagship Store</strong> เริ่มต้นสตรีมสดแล้ว พร้อมแจกโค้ดลดทันที 500 บาท และปักหมุด iPhone 16 Pro Max ลดพิเศษ
                      </p>
                    </div>

                    <div className="line-flex-footer">
                      <Link
                        to="/live"
                        className="line-flex-btn line-flex-btn--purple"
                        onClick={onClose}
                      >
                        🔴 กดเข้าชมไลฟ์สดรับโค้ด
                      </Link>
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
              <h3 className="line-settings-title">เลือกการแจ้งเตือนที่คุณต้องการรับผ่าน LINE</h3>
              <p className="line-settings-sub">คุณสามารถปรับเปลี่ยนหรือปิดการแจ้งเตือนได้ตลอดเวลา</p>
            </div>

            <div className="line-toggles-list">
              <label className="line-toggle-item">
                <div className="line-toggle-info">
                  <div className="line-toggle-label">
                    <CheckCircle2 size={16} className="text-green" />
                    <strong>ใบเสร็จดิจิทัล & ยืนยันออเดอร์ (Order Updates)</strong>
                  </div>
                  <span className="line-toggle-sub">รับสรุปคำสั่งซื้อและหลักฐานชำระเงินทันทีหลังสั่งซื้อ</span>
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
                    <strong>สถานะจัดส่งและเลขพัสดุ</strong>
                  </div>
                  <span className="line-toggle-sub">แจ้งเตือนเมื่อพัสดุถูกส่งออก และเมื่อพนักงานกำลังนำส่งถึงบ้าน</span>
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
                    <strong>Flash Sale & สินค้าลดราคา (Price Drop Alerts)</strong>
                  </div>
                  <span className="line-toggle-sub">เตือนเมื่อสินค้าใน Wishlist หรือในตะกร้าจัด Flash Sale</span>
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
                    <strong>แจ้งเตือนไลฟ์สด (Live Stream Shopping)</strong>
                  </div>
                  <span className="line-toggle-sub">เตือนเมื่อร้านค้าโปรดเริ่ม Live พร้อมแจกโค้ดส่วนลดพิเศษในไลฟ์</span>
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
                    <strong>เตือนเช็กอินรับ Coins</strong>
                  </div>
                  <span className="line-toggle-sub">สะกิดรับเหรียญฟรีทุกวัน เพื่อนำไปใช้แลกส่วนลดเงินสด</span>
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
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LineConnectModal;
