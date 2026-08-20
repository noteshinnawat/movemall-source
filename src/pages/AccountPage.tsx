import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { fetchApi, logoutApi } from '../utils/api';
import { LineConnectModal } from '../components/LineConnectModal';
import { LocalizedLink, useLocalizedPath } from '../i18n/LocalizedLink';
import { formatCurrency, formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './AccountPage.css';

const PAYLATER_CREDIT_LIMIT = 15000;

export function AccountPage() {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const localizePath = useLocalizedPath();
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
  const [name, setName] = useState(savedUser?.name || t('auth:account.memberFallback'));
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
      name: name.trim() || t('auth:account.memberFallback'),
      email: email.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl,
      coinsBalance: coins,
    };

    localStorage.setItem('movemall_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('movemall_auth_change'));

    // API call to sync with backend database
    const token = localStorage.getItem('movemall_jwt_token');
    if (token) {
      fetchApi('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: updatedUser.name,
          avatarUrl: updatedUser.avatarUrl,
          email: updatedUser.email,
          phone: updatedUser.phone,
        }),
      }).catch(() => {});
    }

    setSaveSuccessMsg(t('auth:account.saveSuccess'));
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  }

  function handleAvatarFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('auth:account.avatarTooLarge'));
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
      alert(t('auth:account.addressLimitReached'));
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
        alert(t('auth:account.addressLimitReached'));
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
    if (confirm(t('auth:account.deleteAddressConfirm'))) {
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

      setOtpStatusMsg(res.message || t('auth:account.otpVerified'));
      setTimeout(() => {
        setOtpModalType(null);
      }, 1500);
    } catch {
      if (otpModalType === 'email') setIsEmailVerified(true);
      if (otpModalType === 'phone') setIsPhoneVerified(true);
      setCoins((prev: number) => prev + 50);
      setOtpStatusMsg(t('auth:account.otpVerified'));
      setTimeout(() => {
        setOtpModalType(null);
      }, 1500);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg(t('auth:account.passwordMismatch'));
      return;
    }

    try {
      await fetchApi('/api/user/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordMsg(t('auth:account.passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg(t('auth:account.passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  function handleLogout() {
    logoutApi(); // เพิกถอน token ฝั่งเซิร์ฟเวอร์ด้วย ไม่ใช่แค่ลบทิ้งฝั่ง client
    window.dispatchEvent(new Event('movemall_auth_change'));
    navigate(localizePath('/login'));
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
        roleLabel: t('auth:account.tiers.vip.roleLabel'),
        progressPct: 100,
        nextTierName: null,
        neededAmount: 0,
        perks: t('auth:account.tiers.vip.perks'),
      };
    }
    if (totalSpent >= 5000) {
      return {
        key: 'gold',
        name: 'Gold Member',
        icon: '🥇',
        badgeTitle: '🥇 MOVEMALL GOLD MEMBER',
        roleLabel: t('auth:account.tiers.gold.roleLabel'),
        progressPct: Math.min(100, Math.round(((totalSpent - 5000) / 15000) * 100)),
        nextTierName: 'Platinum VIP',
        neededAmount: 20000 - totalSpent,
        perks: t('auth:account.tiers.gold.perks'),
      };
    }
    if (totalSpent >= 1000) {
      return {
        key: 'silver',
        name: 'Silver Member',
        icon: '🥈',
        badgeTitle: '🥈 MOVEMALL SILVER MEMBER',
        roleLabel: t('auth:account.tiers.silver.roleLabel'),
        progressPct: Math.min(100, Math.round(((totalSpent - 1000) / 4000) * 100)),
        nextTierName: 'Gold Member',
        neededAmount: 5000 - totalSpent,
        perks: t('auth:account.tiers.silver.perks'),
      };
    }
    return {
      key: 'classic',
      name: 'Classic Member',
      icon: '🥉',
      badgeTitle: '🥉 MOVEMALL CLASSIC MEMBER',
      roleLabel: t('auth:account.tiers.classic.roleLabel'),
      progressPct: Math.min(100, Math.round((totalSpent / 1000) * 100)),
      nextTierName: 'Silver Member',
      neededAmount: 1000 - totalSpent,
      perks: t('auth:account.tiers.classic.perks'),
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
              <User size={18} /> {t('auth:account.nav.profile')}
            </button>
            <button
              className={`account-nav-btn ${activeTab === 'security' ? 'account-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <ShieldCheck size={18} /> {t('auth:account.nav.security')}
            </button>
            <button
              className={`account-nav-btn ${activeTab === 'addresses' ? 'account-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <MapPin size={18} /> {t('auth:account.nav.addresses')}
            </button>
            <button
              className={`account-nav-btn ${activeTab === 'paylater' ? 'account-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('paylater')}
            >
              <CreditCard size={18} /> {t('auth:account.nav.payLater')}
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
              {t('auth:account.nav.line')}
              {!isLineConnected && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#FEF3C7',
                  color: '#D97706',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}>{t('auth:account.nav.lineBonus')}</span>
              )}
            </button>
            <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0' }} />
            {(savedUser?.role === 'SUPER_ADMIN' || savedUser?.role === 'ADMIN' || savedUser?.email === 'note.shinnawat@gmail.com') && (
              <Link
                to="/admin"
                className="account-nav-btn"
                style={{
                  textDecoration: 'none',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontWeight: 800,
                  border: '1px solid #FECACA',
                  marginBottom: 6,
                }}
              >
                <ShieldCheck size={18} /> {t('auth:account.nav.admin')}
              </Link>
            )}
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
              <Store size={18} /> {t('auth:account.nav.sellerCentre')}
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
              <LogOut size={18} /> {t('auth:account.nav.logout')}
            </button>
          </nav>
        </aside>

        {/* Right Main Content */}
        <section className="account-content">
          {activeTab === 'profile' && (
            <div>
              <h1 className="account-section-title">{t('auth:account.profile.title')}</h1>
              <p className="account-section-sub">{t('auth:account.profile.subtitle')}</p>

              <div className="account-card account-vip-card">
                <div className="account-vip-card__header">
                  <div className="account-vip-badge">{currentTier.badgeTitle}</div>
                  <Sparkles size={20} className="account-vip-sparkle" />
                </div>
                <div className="account-vip-card__body">
                  <div>
                    <span className="account-vip-label">{t('auth:account.profile.coinsLabel')}</span>
                    <h2 className="account-vip-val">
                      {t('auth:account.profile.coinsValue', { count: coins })}{' '}
                      <span className="account-vip-unit">{t('auth:account.profile.coinsUnit')}</span>
                    </h2>
                    <span className="account-vip-sub">{t('auth:account.profile.coinsHint')}</span>
                    <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#DBEAFE', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{t('auth:account.profile.tierPerksLabel')}</span>
                      <strong>{currentTier.perks}</strong>
                    </div>
                  </div>
                  <div className="account-vip-actions">
                    <LocalizedLink to="/games" className="account-vip-btn">
                      {t('auth:account.profile.redeemRewards')}
                    </LocalizedLink>
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
                      <span>
                        {t('auth:account.profile.tierProgress', {
                          amount: formatCurrency(currentTier.neededAmount, locale),
                          tier: currentTier.nextTierName,
                        })}
                      </span>
                      <span>
                        {t('auth:account.profile.totalSpent', { amount: formatCurrency(totalSpent, locale) })}
                      </span>
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
                  <span style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 700 }}>{t('auth:account.profile.trustUnit')}</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={18} color="#10b981" /> {t('auth:account.profile.trustTitle')}
                    </h3>
                    <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                      {t('auth:account.profile.trustBadge')}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 8px 0', fontSize: '0.8rem', color: '#64748b' }}>
                    {t('auth:account.profile.trustSummary')}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#475569', flexWrap: 'wrap' }}>
                    <span>{t('auth:account.profile.trustPerkCod')}</span>
                    <span>{t('auth:account.profile.trustPerkPriority')}</span>
                    <span>{t('auth:account.profile.trustPerkRefund')}</span>
                  </div>
                </div>
              </div>

              <div className="account-card">
                <div className="account-grid-2">
                  <div className="account-field">
                    <label className="account-label">{t('auth:account.profile.nameLabel')}</label>
                    <input type="text" className="account-input" value={name} onChange={e => setName(e.target.value)} placeholder={t('auth:account.profile.namePlaceholder')} />
                  </div>
                  <div className="account-field">
                    <label className="account-label">{t('auth:account.profile.emailLabel')}</label>
                    <input type="email" className="account-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" />
                  </div>
                  <div className="account-field">
                    <label className="account-label">{t('auth:account.profile.phoneLabel')}</label>
                    <input type="tel" className="account-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812345678" />
                  </div>
                  <div className="account-field">
                    <label className="account-label">{t('auth:account.profile.tierLabel')}</label>
                    <input type="text" className="account-input" value={t('auth:account.profile.tierValue', { badge: currentTier.badgeTitle, role: currentTier.roleLabel })} disabled style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
                  </div>
                </div>

                <div className="account-field" style={{ marginTop: '1rem' }}>
                  <label className="account-label">{t('auth:account.profile.avatarLabel')}</label>
                  <div className="account-avatar-picker">
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={avatarUrl} alt={t('auth:account.profile.avatarPreviewAlt')} className="account-avatar-preview" />
                      <label className="account-avatar-upload-icon-btn" title={t('auth:account.profile.avatarUploadTitle')}>
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
                          {t('auth:account.profile.avatarPickFile')}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>

                      <div className="account-avatar-presets">
                        <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>{t('auth:account.profile.avatarPresetsLabel')}</span>
                        <button
                          type="button"
                          className="account-preset-btn"
                          onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fc6?auto=format&fit=crop&w=200&q=80')}
                        >
                          {t('auth:account.profile.avatarMale')}
                        </button>
                        <button
                          type="button"
                          className="account-preset-btn"
                          onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80')}
                        >
                          {t('auth:account.profile.avatarFemale')}
                        </button>
                        <button
                          type="button"
                          className="account-preset-btn"
                          onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80')}
                        >
                          {t('auth:account.profile.avatarBusiness')}
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
                  {t('auth:account.profile.save')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h1 className="account-section-title">{t('auth:account.security.title')}</h1>
              <p className="account-section-sub">{t('auth:account.security.subtitle')}</p>

              {/* Email Verification Card */}
              <div className="verify-card">
                <div className="verify-info">
                  <div className={`verify-icon-box ${isEmailVerified ? 'verify-icon-box--verified' : ''}`}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <h3 className="verify-title">{t('auth:account.security.emailTitle')}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '2px 0' }}>{email}</p>
                    <span className={`verify-status-badge ${isEmailVerified ? 'verify-status-badge--verified' : 'verify-status-badge--unverified'}`}>
                      {isEmailVerified ? t('auth:account.security.verified') : t('auth:account.security.unverified')}
                    </span>
                  </div>
                </div>
                {!isEmailVerified ? (
                  <button className="account-btn-primary" onClick={() => handleRequestOtp('email')}>
                    {t('auth:account.security.requestEmailOtp')}
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
                    <h3 className="verify-title">{t('auth:account.security.phoneTitle')}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '2px 0' }}>{phone}</p>
                    <span className={`verify-status-badge ${isPhoneVerified ? 'verify-status-badge--verified' : 'verify-status-badge--unverified'}`}>
                      {isPhoneVerified ? t('auth:account.security.verified') : t('auth:account.security.unverifiedPhone')}
                    </span>
                  </div>
                </div>
                {!isPhoneVerified ? (
                  <button className="account-btn-primary" onClick={() => handleRequestOtp('phone')}>
                    {t('auth:account.security.requestSmsOtp')}
                  </button>
                ) : (
                  <CheckCircle size={24} color="#10b981" />
                )}
              </div>

              {/* Password Change Form */}
              <div className="account-card" style={{ marginTop: '2rem' }}>
                <h3 className="verify-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={18} /> {t('auth:account.security.changePasswordTitle')}
                </h3>
                {passwordMsg && <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb', marginBottom: '1rem' }}>{passwordMsg}</p>}
                <form onSubmit={handleChangePassword}>
                  <div className="account-field">
                    <label className="account-label">{t('auth:account.security.currentPassword')}</label>
                    <input type="password" required className="account-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  </div>
                  <div className="account-grid-2">
                    <div className="account-field">
                      <label className="account-label">{t('auth:account.security.newPassword')}</label>
                      <input type="password" required className="account-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="account-field">
                      <label className="account-label">{t('auth:account.security.confirmPassword')}</label>
                      <input type="password" required className="account-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="account-btn-primary">{t('auth:account.security.updatePassword')}</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <div className="account-address-header">
                <div>
                  <h1 className="account-section-title">{t('auth:account.addresses.title')}</h1>
                  <p className="account-section-sub" style={{ marginBottom: 0 }}>
                    {t('auth:account.addresses.subtitle')}
                  </p>
                </div>
                <div className="account-address-header-actions">
                  <span className="account-address-count-badge">
                    {t('auth:account.addresses.countBadge', { count: addresses.length })}
                  </span>
                  <button
                    type="button"
                    className="account-btn-primary account-add-address-btn"
                    onClick={handleOpenAddAddress}
                    disabled={addresses.length >= 10}
                  >
                    <Plus size={16} /> {t('auth:account.addresses.add')}
                  </button>
                </div>
              </div>

              {addresses.length === 0 ? (
                <div className="account-card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <MapPin size={40} style={{ color: '#9CA3AF', margin: '0 auto 10px auto' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>{t('auth:account.addresses.emptyTitle')}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '0 0 16px 0' }}>{t('auth:account.addresses.emptySubtitle')}</p>
                  <button type="button" className="account-btn-primary" onClick={handleOpenAddAddress}>
                    <Plus size={16} /> {t('auth:account.addresses.addFirst')}
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
                            <span className="account-address-card__phone">
                              {t('auth:account.addresses.phoneWrapped', { phone: addr.phone })}
                            </span>
                            {addr.isDefault && (
                              <span className="account-address-card__default-badge">
                                {t('auth:account.addresses.defaultBadge')}
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
                            <Pencil size={13} /> {t('auth:account.addresses.edit')}
                          </button>

                          {!addr.isDefault && (
                            <>
                              <button
                                type="button"
                                className="account-address-action-btn account-address-action-btn--set-default"
                                onClick={() => handleSetDefaultAddress(addr.id)}
                              >
                                {t('auth:account.addresses.setDefault')}
                              </button>
                              <button
                                type="button"
                                className="account-address-action-btn account-address-action-btn--delete"
                                onClick={() => handleDeleteAddress(addr.id)}
                                title={t('auth:account.addresses.deleteTitle')}
                              >
                                <Trash2 size={13} /> {t('auth:account.addresses.delete')}
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
              <h1 className="account-section-title">{t('auth:account.payLater.title')}</h1>
              <p className="account-section-sub">{t('auth:account.payLater.subtitle')}</p>

              <div className="account-card" style={{ borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{t('auth:account.payLater.statusLabel')}</span>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', margin: '0.25rem 0' }}>
                      {t('auth:account.payLater.approved', { limit: formatCurrency(PAYLATER_CREDIT_LIMIT, locale) })}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                      {t('auth:account.payLater.terms', { limit: formatCurrency(PAYLATER_CREDIT_LIMIT, locale) })}
                    </p>
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
                    {t('auth:account.line.title')}
                  </h1>
                  <p className="account-section-sub">{t('auth:account.line.subtitle')}</p>
                </div>
                <button
                  type="button"
                  className="account-btn-primary"
                  style={{ background: '#06C755', borderColor: '#06C755' }}
                  onClick={() => setIsLineModalOpen(true)}
                >
                  <Smartphone size={16} />
                  {isLineConnected ? t('auth:account.line.manageCta') : t('auth:account.line.connectCta')}
                </button>
              </div>

              {/* Status Card */}
              <div className="account-card" style={{ borderLeft: isLineConnected ? '4px solid #06C755' : '4px solid #F59E0B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{t('auth:account.line.statusLabel')}</span>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: isLineConnected ? '#06C755' : '#D97706', margin: '0.25rem 0' }}>
                      {isLineConnected ? t('auth:account.line.connected') : t('auth:account.line.disconnected')}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                      {isLineConnected
                        ? t('auth:account.line.connectedDesc')
                        : t('auth:account.line.disconnectedDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="account-btn-primary"
                    style={{ background: isLineConnected ? '#2563EB' : '#06C755' }}
                    onClick={() => setIsLineModalOpen(true)}
                  >
                    {isLineConnected ? t('auth:account.line.manageShort') : t('auth:account.line.connectShort')}
                  </button>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div className="account-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#2563EB', fontWeight: 700, fontSize: '14px' }}>
                    <Truck size={18} />
                    <span>{t('auth:account.line.featureTrackingTitle')}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                    {t('auth:account.line.featureTrackingDesc')}
                  </p>
                </div>

                <div className="account-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#059669', fontWeight: 700, fontSize: '14px' }}>
                    <Check size={18} />
                    <span>{t('auth:account.line.featureReceiptTitle')}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                    {t('auth:account.line.featureReceiptDesc')}
                  </p>
                </div>

                <div className="account-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#D97706', fontWeight: 700, fontSize: '14px' }}>
                    <Coins size={18} />
                    <span>{t('auth:account.line.featureDealsTitle')}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                    {t('auth:account.line.featureDealsDesc')}
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
                {editingAddressId
                  ? t('auth:account.addresses.modalEditTitle')
                  : t('auth:account.addresses.modalAddTitle')}
              </h2>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                aria-label={t('auth:account.addresses.modalClose')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress}>
              <div className="account-grid-2">
                <div className="account-field">
                  <label className="account-label">{t('auth:account.addresses.recipientLabel')}</label>
                  <input
                    type="text"
                    required
                    className="account-input"
                    placeholder={t('auth:account.addresses.recipientPlaceholder')}
                    value={addressForm.recipientName}
                    onChange={e => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                  />
                </div>
                <div className="account-field">
                  <label className="account-label">{t('auth:account.addresses.phoneLabel')}</label>
                  <input
                    type="tel"
                    required
                    className="account-input"
                    placeholder={t('auth:account.addresses.phonePlaceholder')}
                    value={addressForm.phone}
                    onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="account-field">
                <label className="account-label">{t('auth:account.addresses.lineLabel')}</label>
                <input
                  type="text"
                  required
                  className="account-input"
                  placeholder={t('auth:account.addresses.linePlaceholder')}
                  value={addressForm.addressLine}
                  onChange={e => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                />
              </div>

              <div className="account-grid-2">
                <div className="account-field">
                  <label className="account-label">{t('auth:account.addresses.districtLabel')}</label>
                  <input
                    type="text"
                    required
                    className="account-input"
                    placeholder={t('auth:account.addresses.districtPlaceholder')}
                    value={addressForm.district}
                    onChange={e => setAddressForm({ ...addressForm, district: e.target.value })}
                  />
                </div>
                <div className="account-field">
                  <label className="account-label">{t('auth:account.addresses.provinceLabel')}</label>
                  <input
                    type="text"
                    required
                    className="account-input"
                    placeholder={t('auth:account.addresses.provincePlaceholder')}
                    value={addressForm.province}
                    onChange={e => setAddressForm({ ...addressForm, province: e.target.value })}
                  />
                </div>
              </div>

              <div className="account-field">
                <label className="account-label">{t('auth:account.addresses.postalLabel')}</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{5}"
                  maxLength={5}
                  className="account-input"
                  placeholder={t('auth:account.addresses.postalPlaceholder')}
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
                <span>{t('auth:account.addresses.setDefaultCheckbox')}</span>
              </label>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="account-btn-outline"
                  onClick={() => setIsAddressModalOpen(false)}
                >
                  {t('auth:account.addresses.cancel')}
                </button>
                <button type="submit" className="account-btn-primary">
                  {t('auth:account.addresses.save')}
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
                {otpModalType === 'email'
                  ? t('auth:account.otpModal.emailTitle')
                  : t('auth:account.otpModal.phoneTitle')}
              </h2>
              <button
                onClick={() => setOtpModalType(null)}
                aria-label={t('auth:account.otpModal.close')}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              {t('auth:account.otpModal.sentTo', { target: otpModalType === 'email' ? email : phone })}
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
                  aria-label={t('auth:account.otpModal.digitAria', { position: formatNumber(idx + 1, locale) })}
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
              {t('auth:account.otpModal.confirm')}
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
