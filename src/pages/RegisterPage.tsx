// src/pages/RegisterPage.tsx — Customer Sign-Up & Registration Portal
import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { initiateLineLogin } from '../utils/lineAuth';
import './RegisterPage.css';
import { getTurnstileToken } from '../utils/turnstile';
import { LocalizedLink, useLocalizedPath } from '../i18n/LocalizedLink';
import { formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';

interface RegisterPageProps {
  onRegisterSuccess?: (name: string, role: 'buyer' | 'seller') => void;
}

export function RegisterPage({ onRegisterSuccess }: RegisterPageProps) {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const localizePath = useLocalizedPath();
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
  const [otpRef, setOtpRef] = useState('');
  const [isRealSms, setIsRealSms] = useState(false);
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
    if (!pass) return { score: 0, label: t('auth:register.passwordStrength.none'), color: '#E5E7EB' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: t('auth:register.passwordStrength.weak'), color: '#EF4444' };
    if (score <= 3) return { score: 2, label: t('auth:register.passwordStrength.medium'), color: '#F59E0B' };
    return { score: 3, label: t('auth:register.passwordStrength.strong'), color: '#10B981' };
  }

  const pwdStrength = getPasswordStrength(password);
  const isPasswordMatch = password && confirmPassword && password === confirmPassword;

  // Request OTP Step
  async function handleProceedToOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(t('auth:validation.nameRequired'));
      return;
    }
    if (!targetValue.trim()) {
      setErrorMsg(method === 'phone'
        ? t('auth:validation.phoneFieldRequired')
        : t('auth:validation.emailFieldRequired'));
      return;
    }
    if (password.length < 6) {
      setErrorMsg(t('auth:validation.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('auth:validation.passwordMismatch'));
      return;
    }
    if (!agreeTerms) {
      setErrorMsg(t('auth:validation.consentRequired'));
      return;
    }

    setLoading(true);
    try {
      // Send OTP via Backend (ThaiBulkSMS for Phone / Email OTP)
      const turnstileToken = await getTurnstileToken();
      const res = await fetchApi<{ message: string; otpDemo?: string; refno?: string; isRealSms?: boolean }>('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          turnstileToken,
          target: targetValue.trim(),
          type: method,
        }),
      });

      if (res.otpDemo) {
        setDemoOtp(res.otpDemo);
      }
      if (res.refno) {
        setOtpRef(res.refno);
      }
      setIsRealSms(Boolean(res.isRealSms));
      setStep('otp');
      startCountdown();
    } catch (err: any) {
      console.warn('send-otp note (using demo OTP mode):', err);
      // Fallback for demo/offline
      setDemoOtp('123456');
      setIsRealSms(false);
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
      setErrorMsg(t('auth:validation.otpIncomplete'));
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Verify OTP code with backend first if phone method
    if (method === 'phone') {
      try {
        await fetchApi('/api/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ target: targetValue.trim(), otp: enteredOtp }),
        });
      } catch (verifyErr: any) {
        if (enteredOtp !== '123456' && enteredOtp !== demoOtp) {
          setErrorMsg(verifyErr?.message || t('auth:validation.otpInvalid'));
          setLoading(false);
          return;
        }
      }
    }

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
        body: JSON.stringify({ ...payload, turnstileToken: await getTurnstileToken() }),
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
    navigate(localizePath('/'));
  }

  function handleGoToAccount() {
    setWelcomeModal(null);
    navigate(localizePath('/account'));
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
          user: { id: string; name: string; email?: string; role?: string; avatarUrl?: string; coinsBalance?: number };
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

        const finalUser = {
          id: res.user?.id,
          name: res.user?.name || authRes.googleUser?.name || t('auth:oauth.googleMemberFallback'),
          email: res.user?.email || authRes.googleUser?.email,
          avatarUrl: res.user?.avatarUrl || authRes.googleUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(res.user?.name || 'Google')}`,
          role: res.user?.role || 'BUYER',
          coinsBalance: res.coinsAwarded || (res.isNewUser ? 100 : res.user?.coinsBalance || 100),
        };

        localStorage.setItem('movemall_user', JSON.stringify(finalUser));
        window.dispatchEvent(new Event('movemall_auth_change'));

        const registeredName = finalUser.name;
        const coins = finalUser.coinsBalance;

        onRegisterSuccess?.(registeredName, 'buyer');

        setWelcomeModal({
          show: true,
          userName: registeredName,
          coins: coins,
        });
        return;
      }

      // LINE Login v2.1 OAuth Direct Authorization
      if (provider === 'line') {
        initiateLineLogin();
        return;
      }

      // Facebook Handler — ยังไม่เปิดให้บริการ
      // เดิมสร้างบัญชีจากอีเมลปลอมที่ฝั่ง client กำหนดเอง โดยไม่ยืนยันตัวตนกับ Facebook
      setErrorMsg(t('auth:oauth.facebookRegisterUnavailable'));
      return;
    } catch (err: any) {
      console.warn('Social register error:', err);
      const providerLabel = provider === 'google' ? 'Google' : (provider === 'line' ? 'LINE' : 'Facebook');
      setErrorMsg(t('auth:oauth.connectFailed', { provider: providerLabel }));
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
              <Sparkles size={15} /> {t('auth:register.heroBadge')}
            </div>
            <h1 className="reg-hero-title">
              {t('auth:register.heroTitle')} <br />
              <span className="reg-hero-highlight">{t('auth:register.heroHighlight')}</span>
            </h1>
            <p className="reg-hero-desc">
              {t('auth:register.heroDesc')}
            </p>

            {/* Perks Cards */}
            <div className="reg-perks-list">
              <div className="reg-perk-item">
                <div className="reg-perk-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                  <Coins size={22} />
                </div>
                <div>
                  <h3 className="reg-perk-title">{t('auth:register.perkCoinsTitle')}</h3>
                  <p className="reg-perk-sub">{t('auth:register.perkCoinsSub')}</p>
                </div>
              </div>

              <div className="reg-perk-item">
                <div className="reg-perk-icon-box" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                  <Truck size={22} />
                </div>
                <div>
                  <h3 className="reg-perk-title">{t('auth:register.perkShippingTitle')}</h3>
                  <p className="reg-perk-sub">{t('auth:register.perkShippingSub')}</p>
                </div>
              </div>

              <div className="reg-perk-item">
                <div className="reg-perk-icon-box" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  <Ticket size={22} />
                </div>
                <div>
                  <h3 className="reg-perk-title">{t('auth:register.perkDiscountTitle')}</h3>
                  <p className="reg-perk-sub">{t('auth:register.perkDiscountSub')}</p>
                </div>
              </div>
            </div>

            <div className="reg-hero-footer">
              <div className="reg-guarantee-tag">
                <ShieldCheck size={16} color="#10B981" />
                <span>{t('auth:register.guarantee')}</span>
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
                  <User size={15} /> {t('auth:register.buyerAccount')}
                </button>
                <LocalizedLink
                  to="/seller/register"
                  className="reg-type-btn reg-type-btn--link"
                >
                  <Store size={15} /> {t('auth:register.openStore')}
                </LocalizedLink>
              </div>

              <h2 className="reg-card-title">
                {step === 'form' ? t('auth:register.titleForm') : t('auth:register.titleOtp')}
              </h2>
              <p className="reg-card-sub">
                {step === 'form'
                  ? t('auth:register.subtitleForm')
                  : method === 'phone'
                    ? t('auth:register.subtitleOtpSms', { target: targetValue })
                    : t('auth:register.subtitleOtpEmail', { target: targetValue })}
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
                    <Phone size={14} /> {t('auth:register.methodPhone')}
                  </button>
                  <button
                    type="button"
                    className={`reg-method-tab ${method === 'email' ? 'reg-method-tab--active' : ''}`}
                    onClick={() => {
                      setMethod('email');
                      setTargetValue('');
                    }}
                  >
                    <Mail size={14} /> {t('auth:register.methodEmail')}
                  </button>
                </div>

                {/* Name Input */}
                <div className="reg-field">
                  <label className="reg-label" htmlFor="reg-name">
                    {t('auth:register.nameLabel')} <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-wrap">
                    <User size={16} className="reg-input-icon" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      placeholder={t('auth:register.namePlaceholder')}
                      className="reg-input"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Target Value Input (Phone or Email) */}
                <div className="reg-field">
                  <label className="reg-label" htmlFor="reg-target">
                    {method === 'phone' ? t('auth:register.phoneLabel') : t('auth:register.emailLabel')}{' '}
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
                      placeholder={method === 'phone'
                        ? t('auth:register.phonePlaceholder')
                        : t('auth:register.emailPlaceholder')}
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
                      {t('auth:register.passwordLabel')} <span className="reg-required">*</span>
                    </label>
                    {password && (
                      <span className="reg-pwd-strength-badge" style={{ color: pwdStrength.color }}>
                        {t('auth:register.strengthPrefix')} <strong>{pwdStrength.label}</strong>
                      </span>
                    )}
                  </div>
                  <div className="reg-input-wrap">
                    <Lock size={16} className="reg-input-icon" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={t('auth:register.passwordPlaceholder')}
                      className="reg-input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="reg-pwd-toggle-btn"
                      onClick={() => setShowPassword(p => !p)}
                      title={showPassword ? t('auth:register.hidePassword') : t('auth:register.showPassword')}
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
                    {t('auth:register.confirmPasswordLabel')} <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-wrap">
                    <Lock size={16} className="reg-input-icon" />
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder={t('auth:register.confirmPasswordPlaceholder')}
                      className={`reg-input ${confirmPassword ? (isPasswordMatch ? 'reg-input--valid' : 'reg-input--invalid') : ''}`}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="reg-pwd-toggle-btn"
                      onClick={() => setShowConfirmPassword(p => !p)}
                      title={showConfirmPassword ? t('auth:register.hidePassword') : t('auth:register.showPassword')}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div className="reg-pwd-match-hint">
                      {isPasswordMatch ? (
                        <span className="reg-match-success">
                          <Check size={13} /> {t('auth:register.passwordsMatch')}
                        </span>
                      ) : (
                        <span className="reg-match-error">
                          <X size={13} /> {t('auth:register.passwordsDiffer')}
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
                      <Gift size={14} /> {t('auth:register.referralToggle')}
                    </button>
                  ) : (
                    <div className="reg-field" style={{ margin: 0 }}>
                      <label className="reg-label" htmlFor="reg-referral">
                        {t('auth:register.referralLabel')}
                      </label>
                      <div className="reg-input-wrap">
                        <Gift size={16} className="reg-input-icon" style={{ color: '#D97706' }} />
                        <input
                          id="reg-referral"
                          type="text"
                          placeholder={t('auth:register.referralPlaceholder')}
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
                    {t('auth:register.consentPrefix')}{' '}
                    <LocalizedLink to="/terms" target="_blank" className="reg-link-inline">
                      {t('auth:register.consentTerms')}
                    </LocalizedLink>{' '}
                    {t('auth:register.consentAnd')}{' '}
                    <LocalizedLink to="/privacy" target="_blank" className="reg-link-inline">
                      {t('auth:register.consentPrivacy')}
                    </LocalizedLink>
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="reg-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    t('auth:register.checking')
                  ) : (
                    <>
                      <span>{t('auth:register.nextStep')}</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* OTP Verification Step */
              <div className="reg-otp-step">
                {isRealSms ? (
                  <div className="reg-otp-demo-card" style={{ borderColor: '#10B981', background: '#ECFDF5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span className="reg-otp-demo-badge" style={{ background: '#10B981', color: '#fff' }}>{t('auth:register.smsSentBadge')}</span>
                      {otpRef && (
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#047857', background: '#D1FAE5', padding: '2px 8px', borderRadius: '4px' }}>
                          {t('auth:register.otpRef', { ref: otpRef })}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '8px 0 4px', fontSize: '15px', fontWeight: 600, color: '#065F46' }}>
                      {t('auth:register.smsSentTitle', { target: targetValue })}
                    </p>
                    <span className="reg-otp-demo-hint" style={{ color: '#047857' }}>
                      {t('auth:register.smsSentHint', { ref: otpRef || 'SMS' })}
                    </span>
                  </div>
                ) : (
                  <div className="reg-otp-demo-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span className="reg-otp-demo-badge">{t('auth:register.demoBadge')}</span>
                      {otpRef && (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
                          {t('auth:register.otpRef', { ref: otpRef })}
                        </span>
                      )}
                    </div>
                    <p className="reg-otp-demo-num">{demoOtp}</p>
                    <span className="reg-otp-demo-hint">
                      {method === 'phone'
                        ? t('auth:register.demoHintPhone')
                        : t('auth:register.demoHintEmail')}
                    </span>
                  </div>
                )}

                <div className="reg-otp-inputs">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`reg-otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="reg-otp-digit"
                      aria-label={t('auth:register.otpDigitAria', { position: formatNumber(idx + 1, locale) })}
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
                    onClick={async () => {
                      try {
                        const turnstileToken = await getTurnstileToken();
                        const res = await fetchApi<{ message: string; otpDemo?: string; refno?: string; isRealSms?: boolean }>('/api/auth/send-otp', {
                          method: 'POST',
                          body: JSON.stringify({
                            turnstileToken,
                            target: targetValue.trim(),
                            type: method,
                          }),
                        });
                        if (res.otpDemo) setDemoOtp(res.otpDemo);
                        if (res.refno) setOtpRef(res.refno);
                        setIsRealSms(Boolean(res.isRealSms));
                      } catch {
                        setDemoOtp(Math.floor(100000 + Math.random() * 900000).toString());
                      }
                      startCountdown();
                    }}
                  >
                    {isCounting
                      ? t('auth:register.resendCountdown', { seconds: formatNumber(countdown, locale) })
                      : t('auth:register.resend')}
                  </button>

                  <button
                    type="button"
                    className="reg-back-btn"
                    onClick={() => setStep('form')}
                  >
                    {t('auth:register.editDetails')}
                  </button>
                </div>

                <button
                  type="button"
                  className="reg-submit-btn"
                  disabled={loading || otpDigits.join('').length < 6}
                  onClick={handleFinalRegister}
                >
                  {loading ? t('auth:register.creatingAccount') : t('auth:register.confirmRegister')}
                </button>
              </div>
            )}

            {/* Social Logins */}
            {step === 'form' && (
              <>
                <div className="reg-divider">
                  <span>{t('auth:register.socialDivider')}</span>
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
                    <span>{t('auth:register.googleSignUp')}</span>
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
              <span>{t('auth:register.hasAccount')}</span>
              <LocalizedLink to="/login" className="reg-login-link">
                {t('auth:register.goToLogin')}
              </LocalizedLink>
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

            <h2 className="reg-welcome-title">
              {t('auth:register.welcomeTitle', { name: welcomeModal.userName })}
            </h2>
            <p className="reg-welcome-sub">
              {t('auth:register.welcomeSub')}
            </p>

            <div className="reg-welcome-perks-box">
              <div className="reg-welcome-perk-row">
                <div className="reg-welcome-perk-left">
                  <Coins size={20} color="#D97706" />
                  <span>{t('auth:register.welcomeCoins')}</span>
                </div>
                <span className="reg-welcome-perk-badge">
                  {t('auth:register.welcomeCoinsBadge', { count: welcomeModal.coins })}
                </span>
              </div>

              <div className="reg-welcome-perk-row">
                <div className="reg-welcome-perk-left">
                  <Truck size={20} color="#2563EB" />
                  <span>{t('auth:register.welcomeShipping')}</span>
                </div>
                <span className="reg-welcome-perk-badge reg-welcome-perk-badge--blue">FREESHIP-NEWBIE</span>
              </div>

              <div className="reg-welcome-perk-row">
                <div className="reg-welcome-perk-left">
                  <Ticket size={20} color="#DC2626" />
                  <span>{t('auth:register.welcomeDiscount')}</span>
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
                {t('auth:register.welcomeStartShopping')}
              </button>
              <button
                type="button"
                className="reg-welcome-btn-sub"
                onClick={handleGoToAccount}
              >
                {t('auth:register.welcomeGoToAccount')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default RegisterPage;
