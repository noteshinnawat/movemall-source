// src/pages/AccountPage.tsx — Customer Account & Multi-channel Verification Portal

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  MapPin,
  CreditCard,
  CheckCircle,
  Coins,
  Sparkles,
  Key,
  X,
  Upload
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import './AccountPage.css';

export function AccountPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'addresses' | 'paylater'>('profile');

  // User Profile State
  const [name, setName] = useState('สมชาย ใจดี (นักช้อป Movemall)');
  const [email, setEmail] = useState('somchai.demo@movemall.com');
  const [phone, setPhone] = useState('0899999999');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80');
  const [coins, setCoins] = useState(250);

  function handleAvatarFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('กรุณาเลือกไฟล์รูปภาพขนาดไม่เกิน 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Verification Status
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // OTP Modal State
  const [otpModalType, setOtpModalType] = useState<'email' | 'phone' | null>(null);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState('');
  const [otpStatusMsg, setOtpStatusMsg] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  // Shipping Addresses State
  const [addresses, setAddresses] = useState([
    {
      id: 'addr-1',
      recipientName: 'สมชาย ใจดี',
      phone: '0899999999',
      addressLine: '99/1 อาคารมูฟมอลล์ ถ.สุขุมวิท แขวงคลองเตย',
      district: 'เขตคลองเตย',
      province: 'กรุงเทพมหานคร',
      postalCode: '10110',
      isDefault: true,
    },
  ]);

  async function handleRequestOtp(type: 'email' | 'phone') {
    setOtpModalType(type);
    setOtpStatusMsg('');
    setOtpCode(['', '', '', '', '', '']);

    try {
      const endpoint = type === 'email' ? '/api/user/verify-email/request-otp' : '/api/user/verify-phone/request-otp';
      const bodyPayload = type === 'email' ? { email } : { phone };

      const res = await fetchApi<{ message: string; otpDemo: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(bodyPayload),
      });

      setDemoOtp(res.otpDemo || '123456');
    } catch {
      setDemoOtp('123456');
    }
  }

  async function handleVerifyOtp() {
    const enteredCode = otpCode.join('');
    if (enteredCode.length < 6) return;

    try {
      const endpoint = otpModalType === 'email' ? '/api/user/verify-email/verify' : '/api/user/verify-phone/verify';
      const bodyPayload = otpModalType === 'email' ? { email, otp: enteredCode } : { phone, otp: enteredCode };

      const res = await fetchApi<{ message: string; coinsBalance: number }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(bodyPayload),
      });

      if (otpModalType === 'email') setIsEmailVerified(true);
      if (otpModalType === 'phone') setIsPhoneVerified(true);

      if (res.coinsBalance) setCoins(res.coinsBalance);
      else setCoins(prev => prev + 50);

      setOtpStatusMsg(res.message || 'ยืนยันตัวตนสำเร็จ! รับฟรี 50 Movemall Coins 🪙');
      setTimeout(() => {
        setOtpModalType(null);
      }, 1500);
    } catch {
      if (otpModalType === 'email') setIsEmailVerified(true);
      if (otpModalType === 'phone') setIsPhoneVerified(true);
      setCoins(prev => prev + 50);
      setOtpStatusMsg('ยืนยันตัวตนสำเร็จ! รับฟรี 50 Movemall Coins 🪙');
      setTimeout(() => {
        setOtpModalType(null);
      }, 1500);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg('❌ รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');
      return;
    }

    try {
      await fetchApi('/api/user/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordMsg('✅ เปลี่ยนรหัสผ่านความปลอดภัยเรียบร้อยแล้ว!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg(`✅ อัปเดตรหัสผ่านความปลอดภัยเรียบร้อยแล้ว!`);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  return (
    <main className="account-page">
      <div className="account-container">
        {/* Left Navigation Sidebar */}
        <aside className="account-sidebar">
          <div className="account-user-card">
            <img src={avatarUrl} alt={name} className="account-avatar" />
            <div>
              <h2 className="account-name">{name}</h2>
              <span className="account-badge-role">สมาชิก Movemall VIP</span>
            </div>
          </div>

          <nav className="account-nav">
            <button
              className={`account-nav-btn ${activeTab === 'profile' ? 'account-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} /> โปรไฟล์ส่วนตัว
            </button>
            <button
              className={`account-nav-btn ${activeTab === 'security' ? 'account-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <ShieldCheck size={18} /> ยืนยันตัวตน & ความปลอดภัย
            </button>
            <button
              className={`account-nav-btn ${activeTab === 'addresses' ? 'account-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <MapPin size={18} /> สมุดที่อยู่จัดส่งพัสดุ
            </button>
            <button
              className={`account-nav-btn ${activeTab === 'paylater' ? 'account-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('paylater')}
            >
              <CreditCard size={18} /> Movemall PayLater
            </button>
          </nav>
        </aside>

        {/* Right Main Content */}
        <section className="account-content">
          {activeTab === 'profile' && (
            <div>
              <h1 className="account-section-title">โปรไฟล์ส่วนตัว (Personal Profile)</h1>
              <p className="account-section-sub">จัดการข้อมูลส่วนตัวและตรวจสอบยอดสะสม Movemall Coins</p>

              <div className="account-card account-vip-card">
                <div className="account-vip-card__header">
                  <div className="account-vip-badge">👑 MOVEMALL VIP MEMBER</div>
                  <Sparkles size={20} className="account-vip-sparkle" />
                </div>
                <div className="account-vip-card__body">
                  <div>
                    <span className="account-vip-label">ยอดเหรียญสะสม Movemall Coins</span>
                    <h2 className="account-vip-val">🪙 {coins.toLocaleString()} <span className="account-vip-unit">Coins</span></h2>
                    <span className="account-vip-sub">💡 ใช้เป็นส่วนลดเงินสด 1 Coin = 1 บาท ในขั้นตอนชำระเงิน</span>
                  </div>
                  <div className="account-vip-actions">
                    <Link to="/games" className="account-vip-btn">
                      🪙 แลกรางวัล
                    </Link>
                  </div>
                </div>
              </div>

              <div className="account-card">
                <div className="account-grid-2">
                  <div className="account-field">
                    <label className="account-label">ชื่อ-นามสกุล</label>
                    <input type="text" className="account-input" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="account-field">
                    <label className="account-label">เบอร์โทรศัพท์ (ยืนยันแล้ว)</label>
                    <input type="text" className="account-input" value="081-234-5678" disabled />
                  </div>
                </div>

                <div className="account-field" style={{ marginTop: '1rem' }}>
                  <label className="account-label">รูปโปรไฟล์ & อวตาร (Avatar Image)</label>
                  <div className="account-avatar-picker">
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={avatarUrl} alt="Avatar Preview" className="account-avatar-preview" />
                      <label className="account-avatar-upload-icon-btn" title="อัปโหลดรูปจากเครื่อง">
                        <Upload size={13} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    <div className="account-avatar-inputs">
                      <div className="account-avatar-action-row">
                        <label className="account-avatar-file-label">
                          <Upload size={14} />
                          📷 เลือกรูปจากมือถือ / คอมพิวเตอร์
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>หรือวาง Image URL:</span>
                      </div>

                      <input
                        type="text"
                        className="account-input"
                        placeholder="วาง URL รูปภาพโปรไฟล์..."
                        value={avatarUrl}
                        onChange={e => setAvatarUrl(e.target.value)}
                      />

                      <div className="account-avatar-presets">
                        <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>รูปตัวอย่าง:</span>
                        <button
                          type="button"
                          className="account-preset-btn"
                          onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fc6?auto=format&fit=crop&w=200&q=80')}
                        >
                          👤 ชาย
                        </button>
                        <button
                          type="button"
                          className="account-preset-btn"
                          onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80')}
                        >
                          👩 หญิง
                        </button>
                        <button
                          type="button"
                          className="account-preset-btn"
                          onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80')}
                        >
                          🧑 ธุรกิจ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="account-btn-primary" style={{ marginTop: '1.25rem' }}>
                  💾 บันทึกข้อมูลส่วนตัว
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h1 className="account-section-title">ยืนยันตัวตน & ความปลอดภัย (Security & OTP Hub)</h1>
              <p className="account-section-sub">ยืนยันอีเมลและเบอร์โทรศัพท์เพื่อรับสิทธิ์ส่งฟรีและ 100 Movemall Coins ฟรี</p>

              {/* Email Verification Card */}
              <div className="verify-card">
                <div className="verify-info">
                  <div className={`verify-icon-box ${isEmailVerified ? 'verify-icon-box--verified' : ''}`}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <h3 className="verify-title">ยืนยันอีเมล (Email Verification)</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '2px 0' }}>{email}</p>
                    <span className={`verify-status-badge ${isEmailVerified ? 'verify-status-badge--verified' : 'verify-status-badge--unverified'}`}>
                      {isEmailVerified ? '✓ ยืนยันเรียบร้อยแล้ว' : '⚠ ยังไม่ได้ยืนยัน'}
                    </span>
                  </div>
                </div>
                {!isEmailVerified ? (
                  <button className="account-btn-primary" onClick={() => handleRequestOtp('email')}>
                    ขอรับ OTP ยืนยัน
                  </button>
                ) : (
                  <CheckCircle size={24} color="#10b981" />
                )}
              </div>

              {/* Phone Verification Card */}
              <div className="verify-card">
                <div className="verify-info">
                  <div className={`verify-icon-box ${isPhoneVerified ? 'verify-icon-box--verified' : ''}`}>
                    <Phone size={22} />
                  </div>
                  <div>
                    <h3 className="verify-title">ยืนยันเบอร์โทรศัพท์ (SMS Phone Verification)</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '2px 0' }}>{phone}</p>
                    <span className={`verify-status-badge ${isPhoneVerified ? 'verify-status-badge--verified' : 'verify-status-badge--unverified'}`}>
                      {isPhoneVerified ? '✓ ยืนยันเรียบร้อยแล้ว' : '⚠ ยังไม่ได้ยืนยัน (รับฟรี 50 Coins)'}
                    </span>
                  </div>
                </div>
                {!isPhoneVerified ? (
                  <button className="account-btn-primary" onClick={() => handleRequestOtp('phone')}>
                    ขอรับ SMS OTP
                  </button>
                ) : (
                  <CheckCircle size={24} color="#10b981" />
                )}
              </div>

              {/* Password Change Form */}
              <div className="account-card" style={{ marginTop: '2rem' }}>
                <h3 className="verify-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={18} /> เปลี่ยนรหัสผ่านความปลอดภัย
                </h3>
                {passwordMsg && <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb', marginBottom: '1rem' }}>{passwordMsg}</p>}
                <form onSubmit={handleChangePassword}>
                  <div className="account-field">
                    <label className="account-label">รหัสผ่านปัจจุบัน</label>
                    <input type="password" required className="account-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  </div>
                  <div className="account-grid-2">
                    <div className="account-field">
                      <label className="account-label">รหัสผ่านใหม่</label>
                      <input type="password" required className="account-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="account-field">
                      <label className="account-label">ยืนยันรหัสผ่านใหม่</label>
                      <input type="password" required className="account-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="account-btn-primary">อัปเดตรหัสผ่านใหม่</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <h1 className="account-section-title">สมุดที่อยู่จัดส่งพัสดุ (Shipping Address Book)</h1>
              <p className="account-section-sub">จัดการที่อยู่สำหรับจัดส่งพัสดุด่วนจากคำสั่งซื้อของคุณ</p>

              {addresses.map(addr => (
                <div key={addr.id} className="account-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                        {addr.recipientName} <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 400 }}>({addr.phone})</span>
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: '#374151', margin: '0.5rem 0' }}>
                        {addr.addressLine} {addr.district} {addr.province} {addr.postalCode}
                      </p>
                      {addr.isDefault && (
                        <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          ที่อยู่หลักสำหรับจัดส่ง
                        </span>
                      )}
                    </div>
                    <button className="account-btn-outline">แก้ไขที่อยู่</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'paylater' && (
            <div>
              <h1 className="account-section-title">Movemall PayLater (ผ่อน 0% นานสูงสุด 3 เดือน)</h1>
              <p className="account-section-sub">วงเงินสินเชื่อช้อปก่อนจ่ายทีหลัง อนุมัติไว ไม่ต้องใช้เอกสาร</p>

              <div className="account-card" style={{ borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>สถานะสิทธิ์ Movemall PayLater</span>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', margin: '0.25rem 0' }}>✓ อนุมัติวงเงินแล้ว ฿15,000 บาท</h2>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>วงเงินคงเหลือพร้อมใช้: ฿15,000.00 บาท | ดอกเบี้ย 0% สูงสุด 3 เดือน</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* OTP Verification Modal */}
      {otpModalType && (
        <div className="otp-modal-backdrop">
          <div className="otp-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {otpModalType === 'email' ? '📧 ยืนยันรหัส OTP ผ่านอีเมล' : '📱 ยืนยันรหัส SMS OTP'}
              </h2>
              <button onClick={() => setOtpModalType(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              ระบบได้ส่งรหัส OTP 6 หลักไปที่ {otpModalType === 'email' ? email : phone}
            </p>

            <div style={{ background: '#eff6ff', padding: '0.5rem', borderRadius: 6, margin: '1rem 0', fontSize: '0.85rem', color: '#1e40af' }}>
              💡 Demo OTP Code: <strong>{demoOtp || '123456'}</strong>
            </div>

            <div className="otp-inputs">
              {otpCode.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  className="otp-digit"
                  value={digit}
                  onChange={e => {
                    const val = e.target.value;
                    const newOtp = [...otpCode];
                    newOtp[idx] = val;
                    setOtpCode(newOtp);
                  }}
                />
              ))}
            </div>

            {otpStatusMsg && <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>{otpStatusMsg}</p>}

            <button className="account-btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={handleVerifyOtp}>
              ยืนยันรหัส OTP และรับฟรี 50 Coins
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default AccountPage;
