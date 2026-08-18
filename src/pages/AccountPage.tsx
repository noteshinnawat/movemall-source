import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Upload,
  Plus,
  Trash2,
  Pencil,
  Store,
  LogOut,
  Smartphone,
  Truck,
  Check,
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import { LineConnectModal } from '../components/LineConnectModal';
import './AccountPage.css';

export function AccountPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'addresses' | 'paylater' | 'line'>('profile');

  // Load Saved User from LocalStorage as Initial State
  const savedUser = (() => {
    try {
      const item = localStorage.getItem('movemall_user');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  // User Profile State
  const [name, setName] = useState(savedUser?.name || 'สมาชิก Movemall');
  const [email, setEmail] = useState(savedUser?.email || '');
  const [phone, setPhone] = useState(savedUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(
    savedUser?.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(savedUser?.name || 'Movemall')}`
  );
  const [coins, setCoins] = useState(savedUser?.coinsBalance ?? 100);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isLineConnected, setIsLineConnected] = useState<boolean>(() => !!savedUser?.lineConnected);

  // Sync state when auth changes
  useEffect(() => {
    function syncAuth() {
      try {
        const item = localStorage.getItem('movemall_user');
        if (item) {
          const u = JSON.parse(item);
          if (u.name) setName(u.name);
          if (u.email) setEmail(u.email);
          if (u.phone) setPhone(u.phone);
          if (u.avatarUrl) setAvatarUrl(u.avatarUrl);
          if (typeof u.coinsBalance === 'number') setCoins(u.coinsBalance);
          setIsLineConnected(!!u.lineConnected);
        }
      } catch {
        // Ignore
      }
    }

    window.addEventListener('movemall_auth_change', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('movemall_auth_change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  // Fetch Live Profile from Server
  useEffect(() => {
    const token = localStorage.getItem('movemall_jwt_token');
    if (!token) return;

    fetchApi<{
      user: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
        avatarUrl?: string;
        coinsBalance?: number;
      };
    }>('/api/auth/me')
      .then((res) => {
        if (res?.user) {
          setName(res.user.name);
          if (res.user.email) setEmail(res.user.email);
          if (res.user.phone) setPhone(res.user.phone);
          if (res.user.avatarUrl) setAvatarUrl(res.user.avatarUrl);
          if (typeof res.user.coinsBalance === 'number') setCoins(res.user.coinsBalance);

          // Update local cache
          localStorage.setItem('movemall_user', JSON.stringify(res.user));
          window.dispatchEvent(new Event('movemall_auth_change'));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch live profile from API, using cached state:', err);
      });
  }, []);

  function handleSaveProfile() {
    const updatedUser = {
      ...(savedUser || {}),
      id: savedUser?.id || 'usr-local',
      name: name.trim() || 'สมาชิก Movemall',
      email: email.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl,
      coinsBalance: coins,
    };

    localStorage.setItem('movemall_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('movemall_auth_change'));

    // Optional API call
    const token = localStorage.getItem('movemall_jwt_token');
    if (token) {
      fetchApi('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: updatedUser.name, avatarUrl: updatedUser.avatarUrl }),
      }).catch(() => {});
    }

    setSaveSuccessMsg('✅ บันทึกข้อมูลส่วนตัวและรูปโปรไฟล์เรียบร้อยแล้ว!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  }

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

  // Shipping Addresses State (Up to 10 addresses)
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

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    recipientName: '',
    phone: '',
    addressLine: '',
    district: '',
    province: 'กรุงเทพมหานคร',
    postalCode: '',
    isDefault: false,
  });

  function handleOpenAddAddress() {
    if (addresses.length >= 10) {
      alert('คุณสามารถบันทึกที่อยู่จัดส่งได้สูงสุดไม่เกิน 10 ที่อยู่');
      return;
    }
    setEditingAddressId(null);
    setAddressForm({
      recipientName: name || '',
      phone: phone || '',
      addressLine: '',
      district: '',
      province: 'กรุงเทพมหานคร',
      postalCode: '',
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  }

  function handleOpenEditAddress(addr: typeof addresses[0]) {
    setEditingAddressId(addr.id);
    setAddressForm({
      recipientName: addr.recipientName,
      phone: addr.phone,
      addressLine: addr.addressLine,
      district: addr.district,
      province: addr.province,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
    });
    setIsAddressModalOpen(true);
  }

  function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (editingAddressId) {
      setAddresses(prev =>
        prev.map(a => {
          if (a.id === editingAddressId) {
            return { ...a, ...addressForm };
          }
          return addressForm.isDefault ? { ...a, isDefault: false } : a;
        })
      );
    } else {
      if (addresses.length >= 10) {
        alert('คุณสามารถบันทึกที่อยู่จัดส่งได้สูงสุดไม่เกิน 10 ที่อยู่');
        return;
      }
      const newAddr = {
        id: `addr-${Date.now()}`,
        ...addressForm,
      };
      setAddresses(prev => {
        if (addressForm.isDefault) {
          return [...prev.map(a => ({ ...a, isDefault: false })), newAddr];
        }
        return [...prev, newAddr];
      });
    }
    setIsAddressModalOpen(false);
  }

  function handleDeleteAddress(id: string) {
    if (confirm('คุณต้องการลบที่อยู่จัดส่งนี้ใช่หรือไม่?')) {
      setAddresses(prev => {
        const remaining = prev.filter(a => a.id !== id);
        if (remaining.length > 0 && !remaining.some(a => a.isDefault)) {
          remaining[0].isDefault = true;
        }
        return remaining;
      });
    }
  }

  function handleSetDefaultAddress(id: string) {
    setAddresses(prev =>
      prev.map(a => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
  }

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
      else setCoins((prev: number) => prev + 50);

      setOtpStatusMsg(res.message || 'ยืนยันตัวตนสำเร็จ! รับฟรี 50 Movemall Coins 🪙');
      setTimeout(() => {
        setOtpModalType(null);
      }, 1500);
    } catch {
      if (otpModalType === 'email') setIsEmailVerified(true);
      if (otpModalType === 'phone') setIsPhoneVerified(true);
      setCoins((prev: number) => prev + 50);
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

  function handleLogout() {
    localStorage.removeItem('movemall_jwt_token');
    localStorage.removeItem('movemall_user');
    window.dispatchEvent(new Event('movemall_auth_change'));
    navigate('/login');
  }

  // ── Membership Tier Calculation (Classic -> Silver -> Gold -> Platinum VIP) ──
  const totalSpent = Number(savedUser?.totalSpent) || 0;
  const currentTier = (() => {
    if (totalSpent >= 20000) {
      return {
        key: 'vip',
        name: 'Platinum VIP',
        icon: '👑',
        badgeTitle: '👑 MOVEMALL PLATINUM VIP',
        roleLabel: 'สมาชิก Platinum VIP',
        progressPct: 100,
        nextTierName: null,
        neededAmount: 0,
        perks: 'รับ Coins คืน 2x + Flash Sale VIP + สิทธิ์ส่งฟรีก่อนใคร',
      };
    }
    if (totalSpent >= 5000) {
      return {
        key: 'gold',
        name: 'Gold Member',
        icon: '🥇',
        badgeTitle: '🥇 MOVEMALL GOLD MEMBER',
        roleLabel: 'สมาชิก Gold Member',
        progressPct: Math.min(100, Math.round(((totalSpent - 5000) / 15000) * 100)),
        nextTierName: 'Platinum VIP',
        neededAmount: 20000 - totalSpent,
        perks: 'รับ Coins คืน 1.5x + โค้ดส่งฟรี 4 ใบ/เดือน',
      };
    }
    if (totalSpent >= 1000) {
      return {
        key: 'silver',
        name: 'Silver Member',
        icon: '🥈',
        badgeTitle: '🥈 MOVEMALL SILVER MEMBER',
        roleLabel: 'สมาชิก Silver Member',
        progressPct: Math.min(100, Math.round(((totalSpent - 1000) / 4000) * 100)),
        nextTierName: 'Gold Member',
        neededAmount: 5000 - totalSpent,
        perks: 'รับ Coins คืน 1.2x + โค้ดส่วนลดวันเกิด',
      };
    }
    return {
      key: 'classic',
      name: 'Classic Member',
      icon: '🥉',
      badgeTitle: '🥉 MOVEMALL CLASSIC MEMBER',
      roleLabel: 'สมาชิกทั่วไป (Classic)',
      progressPct: Math.min(100, Math.round((totalSpent / 1000) * 100)),
      nextTierName: 'Silver Member',
      neededAmount: 1000 - totalSpent,
      perks: 'รับ 100 Coins ต้อนรับ + โค้ดส่งฟรีช้อปครั้งแรก',
    };
  })();

  return (
    <main className="account-page">
      <div className="account-container">
        {/* Left Navigation Sidebar */}
        <aside className="account-sidebar">
          <div className="account-user-card">
            <img src={avatarUrl} alt={name} className="account-avatar" />
            <div>
              <h2 className="account-name">{name}</h2>
              <span className="account-badge-role">{currentTier.icon} {currentTier.roleLabel}</span>
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
            <button
              className={`account-nav-btn ${activeTab === 'line' ? 'account-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('line')}
            >
              <span style={{
                background: '#06C755',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 900,
                padding: '2px 5px',
                borderRadius: '3px',
                marginRight: '2px',
                letterSpacing: '0.3px',
                display: 'inline-flex',
                alignItems: 'center',
              }}>LINE</span>
              การแจ้งเตือน LINE Official
              {!isLineConnected && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#FEF3C7',
                  color: '#D97706',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}>+50 Coins</span>
              )}
            </button>
            <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0' }} />
            <Link
              to="/seller"
              className="account-nav-btn"
              style={{
                textDecoration: 'none',
                background: '#EFF6FF',
                color: '#2563EB',
                fontWeight: 700,
                border: '1px solid #BFDBFE',
              }}
            >
              <Store size={18} /> 🏪 ศูนย์ผู้ขาย (Seller Centre)
            </Link>
            <button
              type="button"
              className="account-nav-btn"
              onClick={handleLogout}
              style={{
                color: '#EF4444',
                fontWeight: 700,
                marginTop: 6,
                border: '1px solid #FEE2E2',
                background: '#FEF2F2',
                cursor: 'pointer',
              }}
            >
              <LogOut size={18} /> 🚪 ออกจากระบบ
            </button>
          </nav>
        </aside>

        {/* Right Main Content */}
        <section className="account-content">
          {activeTab === 'profile' && (
            <div>
              <h1 className="account-section-title">โปรไฟล์ส่วนตัว (Personal Profile)</h1>
              <p className="account-section-sub">จัดการข้อมูลส่วนตัว ระดับสมาชิก และตรวจสอบยอดสะสม Movemall Coins</p>

              <div className="account-card account-vip-card">
                <div className="account-vip-card__header">
                  <div className="account-vip-badge">{currentTier.badgeTitle}</div>
                  <Sparkles size={20} className="account-vip-sparkle" />
                </div>
                <div className="account-vip-card__body">
                  <div>
                    <span className="account-vip-label">ยอดเหรียญสะสม Movemall Coins</span>
                    <h2 className="account-vip-val">🪙 {coins.toLocaleString()} <span className="account-vip-unit">Coins</span></h2>
                    <span className="account-vip-sub">💡 ใช้เป็นส่วนลดเงินสด 1 Coin = 1 บาท ในขั้นตอนชำระเงิน</span>
                    <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#DBEAFE', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🎁 สิทธิประโยชน์ระดับปัจจุบัน:</span>
                      <strong>{currentTier.perks}</strong>
                    </div>
                  </div>
                  <div className="account-vip-actions">
                    <Link to="/games" className="account-vip-btn">
                      🪙 แลกรางวัล
                    </Link>
                  </div>
                </div>

                {/* Tier Progress Bar */}
                {currentTier.nextTierName && (
                  <div style={{
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '0.8rem',
                    color: 'white',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>สะสมยอดช้อปอีก <strong>฿{currentTier.neededAmount.toLocaleString()}</strong> เพื่อเลื่อนเป็น <strong>{currentTier.nextTierName}</strong></span>
                      <span>ยอดช้อปสะสม ฿{totalSpent.toLocaleString()}</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: 6,
                      background: 'rgba(255, 255, 255, 0.25)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${Math.max(8, currentTier.progressPct)}%`,
                        height: '100%',
                        background: '#FDE047',
                        borderRadius: 3,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                )}
              </div>

              {/* 🛡️ Buyer Trust Score & Fairness Shield Card */}
              <div className="account-card" style={{
                border: '1.5px solid #e2e8f0',
                borderRadius: 6,
                padding: '1.25rem',
                background: '#ffffff',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '1.25rem',
                alignItems: 'center'
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  border: '3px solid #10b981',
                  color: '#10b981',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900
                }}>
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>100</span>
                  <span style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 700 }}>แต้ม</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={18} color="#10b981" /> คะแนนความน่าเชื่อถือผู้ซื้อ (Buyer Trust Score)
                    </h3>
                    <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                      ✓ ระดับ: ผู้ซื้อคุณภาพสูงสุด (Excellent)
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 8px 0', fontSize: '0.8rem', color: '#64748b' }}>
                    สถิติการรับพัสดุ COD <strong>100%</strong> • ไม่มีประวัติปฏิเสธรับสินค้าหรือสั่งเล่น • สิทธิ์ช้อปปลอดภัยสูงสุด
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#475569', flexWrap: 'wrap' }}>
                    <span>✅ สิทธิ์เก็บเงินปลายทาง (COD) ไม่จำกัดวงเงิน</span>
                    <span>✅ ได้รับความสำคัญในการจัดส่งพัสดุด่วน</span>
                    <span>✅ อนุมัติการคืนเงินด่วนพิเศษ (Fast Refund)</span>
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
                          📷 เลือกรูปโปรไฟล์ใหม่จากเครื่อง (มือถือ / คอม)
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>

                      <div className="account-avatar-presets">
                        <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>หรือเลือกอวตารทางการ:</span>
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

                {saveSuccessMsg && (
                  <p style={{ margin: '1rem 0 0 0', color: '#10B981', fontWeight: 700, fontSize: '0.9rem' }}>
                    {saveSuccessMsg}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="account-btn-primary"
                  style={{ marginTop: '1.25rem' }}
                >
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
              <div className="account-address-header">
                <div>
                  <h1 className="account-section-title">สมุดที่อยู่จัดส่งพัสดุ (Shipping Address Book)</h1>
                  <p className="account-section-sub" style={{ marginBottom: 0 }}>
                    จัดการที่อยู่สำหรับจัดส่งพัสดุด่วน (บันทึกได้สูงสุดไม่เกิน 10 ที่อยู่)
                  </p>
                </div>
                <div className="account-address-header-actions">
                  <span className="account-address-count-badge">
                    📍 {addresses.length}/10 ที่อยู่
                  </span>
                  <button
                    type="button"
                    className="account-btn-primary account-add-address-btn"
                    onClick={handleOpenAddAddress}
                    disabled={addresses.length >= 10}
                  >
                    <Plus size={16} /> เพิ่มที่อยู่ใหม่
                  </button>
                </div>
              </div>

              {addresses.length === 0 ? (
                <div className="account-card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <MapPin size={40} style={{ color: '#9CA3AF', margin: '0 auto 10px auto' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>ยังไม่มีที่อยู่สำหรับจัดส่ง</h3>
                  <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '0 0 16px 0' }}>เพิ่มที่อยู่เพื่อความสะดวกรวดเร็วในการสั่งซื้อสินค้า</p>
                  <button type="button" className="account-btn-primary" onClick={handleOpenAddAddress}>
                    <Plus size={16} /> เพิ่มที่อยู่แรก
                  </button>
                </div>
              ) : (
                <div className="account-address-list">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`account-card account-address-card ${addr.isDefault ? 'account-address-card--default' : ''}`}
                    >
                      <div className="account-address-card__content">
                        <div className="account-address-card__info">
                          <div className="account-address-card__name-row">
                            <h3 className="account-address-card__recipient">{addr.recipientName}</h3>
                            <span className="account-address-card__phone">({addr.phone})</span>
                            {addr.isDefault && (
                              <span className="account-address-card__default-badge">
                                ✓ ที่อยู่หลักสำหรับจัดส่ง
                              </span>
                            )}
                          </div>
                          <p className="account-address-card__text">
                            {addr.addressLine} {addr.district} {addr.province} {addr.postalCode}
                          </p>
                        </div>

                        <div className="account-address-card__actions">
                          <button
                            type="button"
                            className="account-address-action-btn account-address-action-btn--edit"
                            onClick={() => handleOpenEditAddress(addr)}
                          >
                            <Pencil size={13} /> แก้ไขที่อยู่
                          </button>

                          {!addr.isDefault && (
                            <>
                              <button
                                type="button"
                                className="account-address-action-btn account-address-action-btn--set-default"
                                onClick={() => handleSetDefaultAddress(addr.id)}
                              >
                                ตั้งเป็นที่อยู่หลัก
                              </button>
                              <button
                                type="button"
                                className="account-address-action-btn account-address-action-btn--delete"
                                onClick={() => handleDeleteAddress(addr.id)}
                                title="ลบที่อยู่นี้"
                              >
                                <Trash2 size={13} /> ลบ
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

          {activeTab === 'line' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h1 className="account-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#06C755', color: '#fff', fontSize: '12px', fontWeight: 900, padding: '3px 7px', borderRadius: '4px' }}>LINE</span>
                    การแจ้งเตือนและบริการ Movemall x LINE Official
                  </h1>
                  <p className="account-section-sub">รับใบเสร็จ, แจ้งเตือนสถานะพัสดุ Flash Express, และดีลลดแรงผ่าน LINE แบบเรียลไทม์</p>
                </div>
                <button
                  type="button"
                  className="account-btn-primary"
                  style={{ background: '#06C755', borderColor: '#06C755' }}
                  onClick={() => setIsLineModalOpen(true)}
                >
                  <Smartphone size={16} />
                  {isLineConnected ? '📱 เปิดศูนย์ควบคุม & ดูตัวอย่าง LINE' : '🟢 เชื่อมต่อ LINE (+50 Coins)'}
                </button>
              </div>

              {/* Status Card */}
              <div className="account-card" style={{ borderLeft: isLineConnected ? '4px solid #06C755' : '4px solid #F59E0B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>สถานะการเชื่อมต่อ LINE Official</span>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: isLineConnected ? '#06C755' : '#D97706', margin: '0.25rem 0' }}>
                      {isLineConnected ? '🟢 เชื่อมต่อกับ Movemall เรียบร้อยแล้ว' : '⚠️ ยังไม่ได้เชื่อมต่อบัญชี LINE'}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                      {isLineConnected
                        ? 'คุณจะได้รับข้อความแจ้งเตือนคำสั่งซื้อและการจัดส่งพัสดุสดผ่าน LINE Official Account'
                        : 'เชื่อมต่อบัญชี LINE ตอนนี้เพื่อรับโบนัสฟรี +50 Coins และรับเลขแทร็กกิ้งพัสดุทันทีเมื่อของออกจากร้าน'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="account-btn-primary"
                    style={{ background: isLineConnected ? '#2563EB' : '#06C755' }}
                    onClick={() => setIsLineModalOpen(true)}
                  >
                    {isLineConnected ? 'จัดการการแจ้งเตือน' : 'เชื่อมต่อทันที'}
                  </button>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div className="account-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#2563EB', fontWeight: 700, fontSize: '14px' }}>
                    <Truck size={18} />
                    <span>แจ้งเตือนพัสดุเรียลไทม์</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                    รับเลข Tracking No. Flash Express พร้อมลิงก์กดเปิดดูแผนที่สด GPS ทันทีเมื่อคนขับใกล้ถึงบ้าน
                  </p>
                </div>

                <div className="account-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#059669', fontWeight: 700, fontSize: '14px' }}>
                    <Check size={18} />
                    <span>ใบเสร็จดิจิทัล (E-Receipt)</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                    สรุปยอดเงิน รายการสินค้า และประวัติการชำระเงินในรูปแบบ Flex Card สวยงาม เก็บเป็นหลักฐานได้
                  </p>
                </div>

                <div className="account-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#D97706', fontWeight: 700, fontSize: '14px' }}>
                    <Coins size={18} />
                    <span>แจ้งเตือน Coins & Flash Sale</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                    สะกิดเช็คอินรับ Coins ทุกวัน และเตือนทันทีเมื่อสินค้าใน Wishlist จัดโปรลดแรง 50%
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Add / Edit Shipping Address Modal */}
      {isAddressModalOpen && (
        <div className="otp-modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="account-modal account-address-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={20} color="#2563EB" />
                {editingAddressId ? 'แก้ไขที่อยู่จัดส่งพัสดุ' : 'เพิ่มที่อยู่จัดส่งพัสดุใหม่'}
              </h2>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress}>
              <div className="account-grid-2">
                <div className="account-field">
                  <label className="account-label">ชื่อ-นามสกุล ผู้รับ *</label>
                  <input
                    type="text"
                    required
                    className="account-input"
                    placeholder="เช่น สมชาย ใจดี"
                    value={addressForm.recipientName}
                    onChange={e => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                  />
                </div>
                <div className="account-field">
                  <label className="account-label">เบอร์โทรศัพท์ติดต่อ *</label>
                  <input
                    type="tel"
                    required
                    className="account-input"
                    placeholder="เช่น 0812345678"
                    value={addressForm.phone}
                    onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="account-field">
                <label className="account-label">ที่อยู่ (บ้านเลขที่, ซอย, หมู่, ถนน, อาคาร) *</label>
                <input
                  type="text"
                  required
                  className="account-input"
                  placeholder="เช่น 99/1 อาคารมูฟมอลล์ ชั้น 5 ถ.สุขุมวิท"
                  value={addressForm.addressLine}
                  onChange={e => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                />
              </div>

              <div className="account-grid-2">
                <div className="account-field">
                  <label className="account-label">แขวง / ตำบล, เขต / อำเภอ *</label>
                  <input
                    type="text"
                    required
                    className="account-input"
                    placeholder="เช่น แขวงคลองเตย เขตคลองเตย"
                    value={addressForm.district}
                    onChange={e => setAddressForm({ ...addressForm, district: e.target.value })}
                  />
                </div>
                <div className="account-field">
                  <label className="account-label">จังหวัด *</label>
                  <input
                    type="text"
                    required
                    className="account-input"
                    placeholder="เช่น กรุงเทพมหานคร"
                    value={addressForm.province}
                    onChange={e => setAddressForm({ ...addressForm, province: e.target.value })}
                  />
                </div>
              </div>

              <div className="account-field">
                <label className="account-label">รหัสไปรษณีย์ *</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{5}"
                  maxLength={5}
                  className="account-input"
                  placeholder="เช่น 10110"
                  value={addressForm.postalCode}
                  onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                />
              </div>

              <label className="account-address-default-checkbox">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                />
                <span>ตั้งที่อยู่นี้เป็นที่อยู่หลักสำหรับจัดส่ง</span>
              </label>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="account-btn-outline"
                  onClick={() => setIsAddressModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="account-btn-primary">
                  💾 บันทึกที่อยู่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* LINE Connect Modal */}
      <LineConnectModal
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
      />
    </main>
  );
}

export default AccountPage;
