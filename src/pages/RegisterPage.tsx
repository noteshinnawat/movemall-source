// src/pages/RegisterPage.tsx — Customer Sign-Up & Registration Portal
import { useState, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Gift,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Truck,
  Ticket,
  Coins,
  Store,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import { promptGoogleAuth } from '../utils/googleAuth';
import './RegisterPage.css';

interface RegisterPageProps {
  onRegisterSuccess?: (name: string, role: 'buyer' | 'seller') => void;
}

export function RegisterPage({ onRegisterSuccess }: RegisterPageProps) {
  const navigate = useNavigate();

  // Form Mode: 'phone' or 'email'
  const [method, setMethod] = useState<'phone' | 'email'>('phone');

  // Form State
  const [name, setName] = useState('');
  const [targetValue, setTargetValue] = useState(''); // phone or email
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP Verification State
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState('123456');
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);

  // Status & Feedback State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [welcomeModal, setWelcomeModal] = useState<{
    show: boolean;
    userName: string;
    coins: number;
  } | null>(null);

  // Password Strength Calculation
  function getPasswordStrength(pass: string): { score: number; label: string; color: string } {
    if (!pass) return { score: 0, label: 'ยังไม่ได้ระบุ', color: '#E5E7EB' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'ง่ายเกินไป', color: '#EF4444' };
    if (score <= 3) return { score: 2, label: 'ปานกลาง', color: '#F59E0B' };
    return { score: 3, label: 'ปลอดภัยสูง', color: '#10B981' };
  }

  const pwdStrength = getPasswordStrength(password);
  const isPasswordMatch = password && confirmPassword && password === confirmPassword;

  // Request OTP Step
  async function handleProceedToOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุลของคุณ');
      return;
    }
    if (!targetValue.trim()) {
      setErrorMsg(method === 'phone' ? 'กรุณากรอกเบอร์โทรศัพท์' : 'กรุณากรอกอีเมล');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('กรุณากดยอมรับข้อกำหนดและนโยบายความเป็นส่วนตัว');
      return;
    }

    setLoading(true);
    try {
      // Check duplicate and send OTP code
      const res = await fetchApi<{ message: string; otpDemo?: string }>('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          target: targetValue.trim(),
          type: method,
        }),
      });

      if (res.otpDemo) {
        setDemoOtp(res.otpDemo);
      }
      setStep('otp');
      startCountdown();
    } catch (err: any) {
      console.warn('API send-otp note (using demo OTP mode):', err);
      // Fallback for demo/offline
      setDemoOtp('123456');
      setStep('otp');
      startCountdown();
    } finally {
      setLoading(false);
    }
  }

  function startCountdown() {
    setCountdown(60);
    setIsCounting(true);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCounting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Handle OTP inputs
  function handleOtpChange(index: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next field
    if (val && index < 5) {
      const nextInput = document.getElementById(`reg-otp-${index + 1}`);
      nextInput?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`reg-otp-${index - 1}`);
      prevInput?.focus();
    }
  }

  // Final Registration Submission
  async function handleFinalRegister() {
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setErrorMsg('กรุณากรอกรหัส OTP 6 หลักให้ครบถ้วน');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const payload = {
      name: name.trim(),
      email: method === 'email' ? targetValue.trim() : undefined,
      phone: method === 'phone' ? targetValue.trim() : undefined,
      password,
      role: 'BUYER',
      referralCode: referralCode.trim() || undefined,
    };

    try {
      const res = await fetchApi<{
        message: string;
        token: string;
        user: { id: string; name: string; email?: string; phone?: string; coinsBalance: number };
        welcomePerks?: { coinsGranted: number };
      }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.token) {
        localStorage.setItem('movemall_jwt_token', res.token);
      }

      onRegisterSuccess?.(res.user?.name || name, 'buyer');

      // Show celebratory modal
      setWelcomeModal({
        show: true,
        userName: res.user?.name || name,
        coins: res.welcomePerks?.coinsGranted || (referralCode ? 150 : 100),
      });
    } catch (err: any) {
      console.warn('API Register note (fallback for demo offline mode):', err);
      // Demo offline mode
      onRegisterSuccess?.(name, 'buyer');
      setWelcomeModal({
        show: true,
        userName: name,
        coins: referralCode ? 150 : 100,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleCompleteAndStartShopping() {
    setWelcomeModal(null);
    navigate('/');
  }

  function handleGoToAccount() {
    setWelcomeModal(null);
    navigate('/account');
  }

  // Handle 1-Click Social Sign-Up (Google / LINE / Facebook)
  async function handleSocialRegister(provider: 'google' | 'line' | 'facebook') {
    setLoading(true);
    setErrorMsg('');

    try {
      if (provider === 'google') {
        const authRes = await promptGoogleAuth();
        const res = await fetchApi<{
          token: string;
          user: { name: string; email?: string; coinsBalance?: number };
          isNewUser?: boolean;
          coinsAwarded?: number;
          message?: string;
        }>('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({
            credential: authRes.credential,
            accessToken: authRes.accessToken,
            googleUser: authRes.googleUser,
            mockUser: authRes.mockUser,
            referralCode: referralCode.trim() || undefined,
          }),
        });

        if (res.token) {
          localStorage.setItem('movemall_jwt_token', res.token);
        }

        if (res.user) {
          localStorage.setItem('movemall_user', JSON.stringify(res.user));
        } else if (authRes.mockUser) {
          localStorage.setItem('movemall_user', JSON.stringify(authRes.mockUser));
        }

        const registeredName = res.user?.name || authRes.mockUser?.name || 'สมาชิก Google';
        const coins = res.coinsAwarded || (res.isNewUser ? 100 : res.user?.coinsBalance || 100);

        onRegisterSuccess?.(registeredName, 'buyer');

        setWelcomeModal({
          show: true,
          userName: registeredName,
          coins: coins,
        });
        return;
      }

      // LINE & Facebook Handler
      const providerDefaults = {
        line: { name: 'LINE Member', email: `line_${Date.now()}@line.me` },
        facebook: { name: 'Facebook Member', email: `fb_${Date.now()}@facebook.com` },
      };

      const target = providerDefaults[provider];

      const res = await fetchApi<{
        token: string;
        user: { name: string; email?: string; coinsBalance?: number };
        isNewUser?: boolean;
      }>('/api/auth/social-login', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          name: target.name,
          email: target.email,
        }),
      });

      if (res.token) {
        localStorage.setItem('movemall_jwt_token', res.token);
      }

      onRegisterSuccess?.(res.user?.name || target.name, 'buyer');

      setWelcomeModal({
        show: true,
        userName: res.user?.name || target.name,
        coins: 100,
      });
    } catch (err) {
      console.warn('Social register error, using fallback:', err);
      const fallbackName = provider === 'google' ? 'Google Member' : `${provider.toUpperCase()} Member`;
      onRegisterSuccess?.(fallbackName, 'buyer');
      setWelcomeModal({
        show: true,
        userName: fallbackName,
        coins: 100,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="reg-page">
      <div className="reg-container">
        {/* Left Side: Brand & Welcome Value Proposition */}
        <aside className="reg-hero-side">
          <div className="reg-hero-content">
            <div className="reg-hero-badge">
              <Sparkles size={15} /> สิทธิพิเศษเฉพาะสมาชิกใหม่ Movemall
            </div>
            <h1 className="reg-hero-title">
              สมัครสมาชิกวันนี้ <br />
              <span className="reg-hero-highlight">รับสิทธิประโยชน์ทันที 3 ต่อ!</span>
            </h1>
            <p className="reg-hero-desc">
              ร่วมเป็นส่วนหนึ่งของคอมมูนิตี้ช้อปปิ้ง มาร์เก็ตเพลสครบวงจร ดูไลฟ์สด วิดีโอสั้นติดตะกร้า และสะสมเหรียญ Coins ใช้แทนเงินสดได้จริง
            </p>

            {/* Perks Cards */}
            <div className="reg-perks-list">
              <div className="reg-perk-item">
                <div className="reg-perk-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                  <Coins size={22} />
                </div>
                <div>
                  <h3 className="reg-perk-title">รับฟรี 100 Movemall Coins 🪙</h3>
                  <p className="reg-perk-sub">ใช้แลกเป็นส่วนลดเงินสดได้ทันที ฿100 ในทุกการสั่งซื้อ</p>
                </div>
              </div>

              <div className="reg-perk-item">
                <div className="reg-perk-icon-box" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                  <Truck size={22} />
                </div>
                <div>
                  <h3 className="reg-perk-title">คูปองส่งฟรี 0 บาท ทั่วประเทศ 🚚</h3>
                  <p className="reg-perk-sub">ไม่มีขั้นต่ำ ใช้ได้กับสินค้าทุกหมวดหมู่บน Movemall</p>
                </div>
              </div>

              <div className="reg-perk-item">
                <div className="reg-perk-icon-box" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  <Ticket size={22} />
                </div>
                <div>
                  <h3 className="reg-perk-title">โค้ดลด 50% ต้อนรับออเดอร์แรก 🎟️</h3>
                  <p className="reg-perk-sub">ลดสูงสุด ฿200 สำหรับการช้อปครั้งแรกของคุณ</p>
                </div>
              </div>
            </div>

            <div className="reg-hero-footer">
              <div className="reg-guarantee-tag">
                <ShieldCheck size={16} color="#10B981" />
                <span>การันตีสินค้าแท้ 100% ปลอดภัย มั่นใจได้</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side: Registration Form Card */}
        <section className="reg-form-side">
          <div className="reg-card">
            {/* Header / Tabs */}
            <div className="reg-card-header">
              <div className="reg-type-switch">
                <button
                  type="button"
                  className="reg-type-btn reg-type-btn--active"
                >
                  <User size={15} /> สมาชิกผู้ซื้อทั่วไป
                </button>
                <Link
                  to="/seller/register"
                  className="reg-type-btn reg-type-btn--link"
                >
                  <Store size={15} /> เปิดร้านค้า / ผู้ขาย →
                </Link>
              </div>

              <h2 className="reg-card-title">
                {step === 'form' ? 'สร้างบัญชีผู้ใช้งานใหม่' : 'ยืนยันรหัสความปลอดภัย OTP'}
              </h2>
              <p className="reg-card-sub">
                {step === 'form'
                  ? 'กรอกข้อมูลด้านล่างเพื่อเริ่มสัมผัสประสบการณ์ช้อปปิ้งสุดพิเศษ'
                  : `กรุณากรอกรหัส OTP 6 หลักที่ได้รับทาง ${method === 'phone' ? 'SMS' : 'Email'} ${targetValue}`}
              </p>
            </div>

            {errorMsg && (
              <div className="reg-alert-error" role="alert">
                <AlertCircle size={17} />
                <span>{errorMsg}</span>
              </div>
            )}

            {step === 'form' ? (
              <form className="reg-form" onSubmit={handleProceedToOtp}>
                {/* Method Switch: Phone or Email */}
                <div className="reg-method-tabs">
                  <button
                    type="button"
                    className={`reg-method-tab ${method === 'phone' ? 'reg-method-tab--active' : ''}`}
                    onClick={() => {
                      setMethod('phone');
                      setTargetValue('');
                    }}
                  >
                    <Phone size={14} /> สมัครด้วยเบอร์โทรศัพท์
                  </button>
                  <button
                    type="button"
                    className={`reg-method-tab ${method === 'email' ? 'reg-method-tab--active' : ''}`}
                    onClick={() => {
                      setMethod('email');
                      setTargetValue('');
                    }}
                  >
                    <Mail size={14} /> สมัครด้วยอีเมล
                  </button>
                </div>

                {/* Name Input */}
                <div className="reg-field">
                  <label className="reg-label" htmlFor="reg-name">
                    ชื่อ-นามสกุล <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-wrap">
                    <User size={16} className="reg-input-icon" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      placeholder="เช่น สมชาย ใจดี"
                      className="reg-input"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Target Value Input (Phone or Email) */}
                <div className="reg-field">
                  <label className="reg-label" htmlFor="reg-target">
                    {method === 'phone' ? 'เบอร์โทรศัพท์มือถือ' : 'ที่อยู่อีเมล'}{' '}
                    <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-wrap">
                    {method === 'phone' ? (
                      <Phone size={16} className="reg-input-icon" />
                    ) : (
                      <Mail size={16} className="reg-input-icon" />
                    )}
                    <input
                      id="reg-target"
                      type={method === 'phone' ? 'tel' : 'email'}
                      required
                      placeholder={method === 'phone' ? 'เช่น 0812345678' : 'เช่น yourname@example.com'}
                      className="reg-input"
                      value={targetValue}
                      onChange={e => setTargetValue(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="reg-field">
                  <div className="reg-label-row">
                    <label className="reg-label" htmlFor="reg-password">
                      รหัสผ่านความปลอดภัย <span className="reg-required">*</span>
                    </label>
                    {password && (
                      <span className="reg-pwd-strength-badge" style={{ color: pwdStrength.color }}>
                        ความปลอดภัย: <strong>{pwdStrength.label}</strong>
                      </span>
                    )}
                  </div>
                  <div className="reg-input-wrap">
                    <Lock size={16} className="reg-input-icon" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="ตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร"
                      className="reg-input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="reg-pwd-toggle-btn"
                      onClick={() => setShowPassword(p => !p)}
                      title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter Bar */}
                  {password && (
                    <div className="reg-strength-meter">
                      <div
                        className="reg-strength-bar"
                        style={{
                          width: `${(pwdStrength.score / 3) * 100}%`,
                          backgroundColor: pwdStrength.color,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="reg-field">
                  <label className="reg-label" htmlFor="reg-confirm-password">
                    ยืนยันรหัสผ่านอีกครั้ง <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-wrap">
                    <Lock size={16} className="reg-input-icon" />
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="พิมพ์รหัสผ่านเดิมซ้ำอีกครั้ง"
                      className={`reg-input ${confirmPassword ? (isPasswordMatch ? 'reg-input--valid' : 'reg-input--invalid') : ''}`}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="reg-pwd-toggle-btn"
                      onClick={() => setShowConfirmPassword(p => !p)}
                      title={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div className="reg-pwd-match-hint">
                      {isPasswordMatch ? (
                        <span className="reg-match-success">
                          <Check size={13} /> รหัสผ่านตรงกันสมบูรณ์
                        </span>
                      ) : (
                        <span className="reg-match-error">
                          <X size={13} /> รหัสผ่านไม่ตรงกัน
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Referral Code (Optional) */}
                <div className="reg-referral-block">
                  {!showReferralInput ? (
                    <button
                      type="button"
                      className="reg-referral-toggle-btn"
                      onClick={() => setShowReferralInput(true)}
                    >
                      <Gift size={14} /> มีรหัสแนะนำเพื่อนไหม? รับเพิ่มอีก +50 Coins 🪙
                    </button>
                  ) : (
                    <div className="reg-field" style={{ margin: 0 }}>
                      <label className="reg-label" htmlFor="reg-referral">
                        รหัสแนะนำเพื่อน (Referral Code)
                      </label>
                      <div className="reg-input-wrap">
                        <Gift size={16} className="reg-input-icon" style={{ color: '#D97706' }} />
                        <input
                          id="reg-referral"
                          type="text"
                          placeholder="เช่น FRIEND2026"
                          className="reg-input"
                          value={referralCode}
                          onChange={e => setReferralCode(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Agree Terms & PDPA */}
                <label className="reg-terms-checkbox">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    required
                  />
                  <span>
                    ฉันได้อ่านและยอมรับ{' '}
                    <Link to="/terms" target="_blank" className="reg-link-inline">
                      เงื่อนไขการให้บริการ
                    </Link>{' '}
                    และ{' '}
                    <Link to="/privacy" target="_blank" className="reg-link-inline">
                      นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
                    </Link>
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="reg-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    'กำลังตรวจสอบข้อมูล...'
                  ) : (
                    <>
                      <span>ถัดไป: รับรหัสยืนยัน OTP</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* OTP Verification Step */
              <div className="reg-otp-step">
                <div className="reg-otp-demo-card">
                  <span className="reg-otp-demo-badge">💡 Demo OTP Code</span>
                  <p className="reg-otp-demo-num">{demoOtp}</p>
                  <span className="reg-otp-demo-hint">(ใช้รหัส 6 หลักนี้ในการทดสอบสมัครสมาชิก)</span>
                </div>

                <div className="reg-otp-inputs">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`reg-otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="reg-otp-digit"
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <div className="reg-otp-actions">
                  <button
                    type="button"
                    className="reg-resend-btn"
                    disabled={isCounting}
                    onClick={() => {
                      setDemoOtp(Math.floor(100000 + Math.random() * 900000).toString());
                      startCountdown();
                    }}
                  >
                    {isCounting
                      ? `ส่งรหัสใหม่อีกครั้งใน (${countdown}s)`
                      : '🔄 ขอรับรหัส OTP อีกครั้ง'}
                  </button>

                  <button
                    type="button"
                    className="reg-back-btn"
                    onClick={() => setStep('form')}
                  >
                    ← แก้ไขข้อมูล
                  </button>
                </div>

                <button
                  type="button"
                  className="reg-submit-btn"
                  disabled={loading || otpDigits.join('').length < 6}
                  onClick={handleFinalRegister}
                >
                  {loading ? 'กำลังสร้างบัญชีผู้ใช้...' : '✨ ยืนยันการสมัครและรับของขวัญต้อนรับ'}
                </button>
              </div>
            )}

            {/* Social Logins */}
            {step === 'form' && (
              <>
                <div className="reg-divider">
                  <span>หรือสมัครด้วยบัญชีโซเชียล</span>
                </div>

                <div className="reg-social-grid">
                  <button
                    type="button"
                    className="reg-social-btn reg-social-btn-google"
                    onClick={() => handleSocialRegister('google')}
                    disabled={loading}
                  >
                    <svg className="google-icon-svg" viewBox="0 0 24 24" width="18" height="18">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>สมัครด้วย Google</span>
                  </button>
                  <button
                    type="button"
                    className="reg-social-btn"
                    onClick={() => handleSocialRegister('line')}
                    disabled={loading}
                  >
                    <span>💬</span> LINE
                  </button>
                  <button
                    type="button"
                    className="reg-social-btn"
                    onClick={() => handleSocialRegister('facebook')}
                    disabled={loading}
                  >
                    <span>📘</span> Facebook
                  </button>
                </div>
              </>
            )}

            {/* Switch to Login */}
            <div className="reg-footer-nav">
              <span>มีบัญชีสมาชิก Movemall อยู่แล้วใช่ไหม?</span>
              <Link to="/login" className="reg-login-link">
                เข้าสู่ระบบที่นี่ →
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Celebratory Welcome Perks Modal */}
      {welcomeModal?.show && (
        <div className="reg-modal-backdrop">
          <div className="reg-welcome-modal">
            <div className="reg-welcome-sparkle-circle">
              <Sparkles size={36} color="#D97706" />
            </div>

            <h2 className="reg-welcome-title">ยินดีต้อนรับคุณ {welcomeModal.userName}!</h2>
            <p className="reg-welcome-sub">
              การสมัครสมาชิก Movemall ของคุณเสร็จสมบูรณ์แล้ว พร้อมรับสิทธิพิเศษต้อนรับสมาชิกใหม่เข้าสู่บัญชีของคุณทันที
            </p>

            <div className="reg-welcome-perks-box">
              <div className="reg-welcome-perk-row">
                <div className="reg-welcome-perk-left">
                  <Coins size={20} color="#D97706" />
                  <span>Movemall Coins ต้อนรับ</span>
                </div>
                <span className="reg-welcome-perk-badge">+{welcomeModal.coins} Coins 🪙</span>
              </div>

              <div className="reg-welcome-perk-row">
                <div className="reg-welcome-perk-left">
                  <Truck size={20} color="#2563EB" />
                  <span>คูปองส่งฟรี 0 บาท (ทุกชิ้น)</span>
                </div>
                <span className="reg-welcome-perk-badge reg-welcome-perk-badge--blue">FREESHIP-NEWBIE</span>
              </div>

              <div className="reg-welcome-perk-row">
                <div className="reg-welcome-perk-left">
                  <Ticket size={20} color="#DC2626" />
                  <span>ส่วนลด 50% ออเดอร์แรก</span>
                </div>
                <span className="reg-welcome-perk-badge reg-welcome-perk-badge--red">WELCOME50</span>
              </div>
            </div>

            <div className="reg-welcome-actions">
              <button
                type="button"
                className="reg-welcome-btn-main"
                onClick={handleCompleteAndStartShopping}
              >
                🛍️ เริ่มช้อปปิ้งเลยตอนนี้
              </button>
              <button
                type="button"
                className="reg-welcome-btn-sub"
                onClick={handleGoToAccount}
              >
                👤 ไปยังหน้าโปรไฟล์ของฉัน
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default RegisterPage;
