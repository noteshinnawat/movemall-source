// src/pages/LoginPage.tsx — Authentication Page (Password Login / Fast SMS OTP Login / Social Login)

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Store, KeyRound, Phone, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { fetchApi } from '../utils/api';
import { LocalizedLink, useLocalizedPath } from '../i18n/LocalizedLink';
import { errorTranslationKey } from '../i18n/errorMessages';
import { formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import { promptGoogleAuth } from '../utils/googleAuth';
import { initiateLineLogin } from '../utils/lineAuth';
import './LoginPage.css';
import { getTurnstileToken } from '../utils/turnstile';
import { authenticatePasswordLogin } from '../utils/passwordLogin';

interface LoginPageProps {
  onLoginSuccess?: (name: string, role: 'buyer' | 'seller') => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const localizePath = useLocalizedPath();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramRole = searchParams.get('role');
  const redirectParam = searchParams.get('redirect');

  const [role, setRole] = useState<'buyer' | 'seller'>(paramRole === 'seller' ? 'seller' : 'buyer');
  
  // Login Type: 'password' vs 'otp'
  const [loginType, setLoginType] = useState<'password' | 'otp'>('password');

  // Fields
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState('123456');
  const [isRealSms, setIsRealSms] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  function getRedirectTarget(userRole?: string) {
    if (redirectParam) return redirectParam;
    const upper = userRole?.toUpperCase() || '';
    if (['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'CS_ADMIN', 'CATALOG_ADMIN', 'LOGISTICS_ADMIN', 'MODERATOR'].includes(upper)) {
      return '/admin';
    }
    if (role === 'seller' || upper === 'SELLER') return '/seller';
    return localizePath('/account');
  }

  // Countdown timer helper
  function startOtpCountdown() {
    setCountdown(60);
    setIsCounting(true);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCounting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Handle Standard Password Login
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const isEmail = identifier.includes('@');
      const bodyPayload = isEmail
        ? { email: identifier.trim(), password }
        : { phone: identifier.trim(), password };

      const res = await authenticatePasswordLogin({
        request: async () => fetchApi<{ token: string; user: { id: string; name: string; email?: string | null; role: string; coinsBalance?: number; avatarUrl?: string | null } }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ ...bodyPayload, turnstileToken: await getTurnstileToken() }),
        }),
        onAuthenticated: session => {
          localStorage.setItem('movemall_jwt_token', session.token);
          localStorage.setItem('movemall_user', JSON.stringify(session.user));
          window.dispatchEvent(new Event('movemall_auth_change'));
        },
      });

      onLoginSuccess?.(res.user.name, (res.user.role?.toLowerCase() as 'buyer' | 'seller') || role);
      navigate(getRedirectTarget(res.user.role));
    } catch (err: any) {
      console.warn('Password login failed:', err);
      localStorage.removeItem('movemall_jwt_token');
      localStorage.removeItem('movemall_user');
      window.dispatchEvent(new Event('movemall_auth_change'));
      const key = errorTranslationKey(err?.code);
      setErrorMsg(key === 'errors.generic' ? t('common:errors.generic') : t(`common:${key}`));
    } finally {
      setLoading(false);
    }
  }

  // Handle Send OTP
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpPhone.trim()) {
      setErrorMsg(t('auth:validation.phoneRequired'));
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const turnstileToken = await getTurnstileToken();
      const res = await fetchApi<{ message: string; otpDemo?: string; isRealSms?: boolean }>('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          turnstileToken, target: otpPhone.trim(), type: 'phone' }),
      });
      if (res.otpDemo) setDemoOtp(res.otpDemo);
      setIsRealSms(Boolean(res.isRealSms));
      setOtpSent(true);
      startOtpCountdown();
    } catch (err: any) {
      // Demo fallback
      setDemoOtp('123456');
      setIsRealSms(false);
      setOtpSent(true);
      startOtpCountdown();
    } finally {
      setLoading(false);
    }
  }

  // Handle Submit OTP Login
  async function handleVerifyOtpLogin() {
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setErrorMsg(t('auth:validation.otpLength'));
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const turnstileToken = await getTurnstileToken();
      const res = await fetchApi<{ token: string; user: { name: string; role: string }; isNewUser?: boolean }>('/api/auth/login-otp', {
        method: 'POST',
        body: JSON.stringify({
          turnstileToken, target: otpPhone.trim(), otp: enteredOtp }),
      });

      if (res.token) {
        localStorage.setItem('movemall_jwt_token', res.token);
        window.dispatchEvent(new Event('movemall_auth_change'));
      }

      onLoginSuccess?.(res.user?.name || t('auth:login.otpUserFallback', { digits: otpPhone.slice(-4) }), role);
      navigate(getRedirectTarget(res.user?.role));
    } catch (err: any) {
      console.warn('OTP login verification failed:', err);
      const key = errorTranslationKey(err?.code);
      setErrorMsg(key === 'errors.generic' ? t('auth:validation.otpInvalid') : t(`common:${key}`));
    } finally {
      setLoading(false);
    }
  }

  // Handle Social Login (Google / LINE / Facebook)
  async function handleSocialLogin(provider: 'google' | 'line' | 'facebook') {
    setLoading(true);
    setErrorMsg('');

    try {
      if (provider === 'google') {
        const authRes = await promptGoogleAuth();
        const res = await fetchApi<{
          token: string;
          user: { id: string; name: string; email?: string; role?: string; avatarUrl?: string; coinsBalance?: number };
          isNewUser?: boolean;
        }>('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({
            credential: authRes.credential,
            accessToken: authRes.accessToken,
            googleUser: authRes.googleUser,
            mockUser: authRes.mockUser,
          }),
        });

        if (res.token) {
          localStorage.setItem('movemall_jwt_token', res.token);
          window.dispatchEvent(new Event('movemall_auth_change'));
        }

        const emailLower = (res.user?.email || authRes.googleUser?.email || '').toLowerCase();
        const isSuperAdmin = ['note.shinnawat@gmail.com', 'admin@movemall.com'].includes(emailLower);

        const finalUser = {
          id: res.user?.id,
          name: res.user?.name || authRes.googleUser?.name || t('auth:oauth.googleMemberFallback'),
          email: res.user?.email || authRes.googleUser?.email,
          avatarUrl: res.user?.avatarUrl || authRes.googleUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(res.user?.name || 'Google')}`,
          role: res.user?.role || (isSuperAdmin ? 'SUPER_ADMIN' : (role === 'seller' ? 'SELLER' : 'BUYER')),
          coinsBalance: res.user?.coinsBalance ?? 100,
        };

        localStorage.setItem('movemall_user', JSON.stringify(finalUser));
        window.dispatchEvent(new Event('movemall_auth_change'));

        const userName = finalUser.name;
        onLoginSuccess?.(userName, (finalUser.role?.toLowerCase() as 'buyer' | 'seller') || role);
        navigate(getRedirectTarget(finalUser.role));
        return;
      }

      // LINE Login v2.1 OAuth Direct Authorization
      if (provider === 'line') {
        initiateLineLogin();
        return;
      }

      // Facebook & ผู้ให้บริการอื่น ๆ — ยังไม่เปิดให้บริการ
      // เดิมเส้นทางนี้ล็อกอินเข้าบัญชีกลางบัญชีเดียวที่ผู้ใช้ทุกคนใช้ร่วมกัน
      // โดยไม่มีการยืนยันตัวตนกับ Facebook จริง จึงถูกปิดไปจนกว่าจะต่อ OAuth ของจริง
      setErrorMsg(t('auth:oauth.facebookLoginUnavailable'));
      return;
    } catch (err: any) {
      console.warn('Social login error:', err);
      const providerLabel = provider === 'google' ? 'Google' : (provider === 'line' ? 'LINE' : 'Facebook');
      setErrorMsg(t('auth:oauth.loginFailed', { provider: providerLabel }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        {/* Role Selection Tabs */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`auth-role-btn${role === 'buyer' ? ' auth-role-btn--active' : ''}`}
            onClick={() => {
              setRole('buyer');
              setErrorMsg('');
            }}
          >
            <User size={14} style={{ display: 'inline', marginRight: 4 }} />
            {t('auth:login.roleBuyer')}
          </button>
          <button
            type="button"
            className={`auth-role-btn${role === 'seller' ? ' auth-role-btn--active' : ''}`}
            onClick={() => {
              setRole('seller');
              setLoginType('password');
              setErrorMsg('');
            }}
          >
            <Store size={14} style={{ display: 'inline', marginRight: 4 }} />
            {t('auth:login.roleSeller')}
          </button>
        </div>

        <h1 className="auth-title">
          {role === 'seller' ? t('auth:login.titleSeller') : t('auth:login.titleBuyer')}
        </h1>
        <p className="auth-sub">
          {role === 'seller'
            ? t('auth:login.subtitleSeller')
            : t('auth:login.subtitleBuyer')}
        </p>

        {/* Login Type Tabs (For Buyers) */}
        {role === 'buyer' && (
          <div className="auth-method-switcher">
            <button
              type="button"
              className={`auth-method-btn ${loginType === 'password' ? 'auth-method-btn--active' : ''}`}
              onClick={() => {
                setLoginType('password');
                setErrorMsg('');
              }}
            >
              <KeyRound size={14} /> {t('auth:login.methodPassword')}
            </button>
            <button
              type="button"
              className={`auth-method-btn ${loginType === 'otp' ? 'auth-method-btn--active' : ''}`}
              onClick={() => {
                setLoginType('otp');
                setErrorMsg('');
              }}
            >
              <Phone size={14} /> {t('auth:login.methodOtp')}
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="auth-alert-error" role="alert">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── Mode 1: Password Login Form ── */}
        {loginType === 'password' ? (
          <form className="auth-form" onSubmit={handlePasswordLogin}>
            <div className="auth-field">
              <label className="auth-label">{t('auth:login.identifierLabel')}</label>
              <input
                type="text"
                className="auth-input"
                required
                placeholder={t('auth:login.identifierPlaceholder')}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">{t('auth:login.passwordLabel')}</label>
                <LocalizedLink to="/help" className="auth-forgot-link">{t('auth:login.forgotPassword')}</LocalizedLink>
              </div>
              <input
                type="password"
                className="auth-input"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? t('auth:login.submitting') : t('auth:login.submit')}
            </button>
            <div id="cf-turnstile-anchor" className="auth-turnstile-slot" />
          </form>
        ) : (
          /* ── Mode 2: Fast SMS OTP Login ── */
          <div className="auth-otp-wrap">
            {!otpSent ? (
              <form className="auth-form" onSubmit={handleRequestOtp}>
                <div className="auth-field">
                  <label className="auth-label">{t('auth:login.phoneLabel')}</label>
                  <input
                    type="tel"
                    className="auth-input"
                    required
                    placeholder={t('auth:login.phonePlaceholder')}
                    value={otpPhone}
                    onChange={e => setOtpPhone(e.target.value)}
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? t('auth:login.sendingOtp') : t('auth:login.requestOtp')}
                </button>
              </form>
            ) : (
              <div className="auth-otp-confirm">
                {isRealSms ? (
                  <div className="auth-otp-demo-tag" style={{ background: '#ECFDF5', color: '#065F46', borderColor: '#10B981' }}>
                    {t('auth:login.realSmsSent', { phone: otpPhone })}
                  </div>
                ) : (
                  <div className="auth-otp-demo-tag">
                    {t('auth:login.demoOtpLabel')} <strong>{demoOtp}</strong>
                  </div>
                )}

                <p className="auth-otp-hint">{t('auth:login.otpHint', { phone: otpPhone })}</p>

                <div className="auth-otp-row">
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      id={`auth-otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="auth-otp-box"
                      aria-label={t('auth:login.otpDigitAria', { position: formatNumber(i + 1, locale) })}
                      value={d}
                      onChange={e => {
                        const val = e.target.value;
                        if (!/^\d*$/.test(val)) return;
                        const newD = [...otpDigits];
                        newD[i] = val.slice(-1);
                        setOtpDigits(newD);
                        if (val && i < 5) {
                          document.getElementById(`auth-otp-${i + 1}`)?.focus();
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
                          document.getElementById(`auth-otp-${i - 1}`)?.focus();
                        }
                      }}
                    />
                  ))}
                </div>

                <div className="auth-otp-actions">
                  <button
                    type="button"
                    className="auth-resend-link"
                    disabled={isCounting}
                    onClick={async () => {
                      try {
                        const turnstileToken = await getTurnstileToken();
                        const res = await fetchApi<{ message: string; otpDemo?: string; isRealSms?: boolean }>('/api/auth/send-otp', {
                          method: 'POST',
                          body: JSON.stringify({
                            turnstileToken, target: otpPhone.trim(), type: 'phone' }),
                        });
                        if (res.otpDemo) setDemoOtp(res.otpDemo);
                        setIsRealSms(Boolean(res.isRealSms));
                      } catch {
                        setDemoOtp(Math.floor(100000 + Math.random() * 900000).toString());
                      }
                      startOtpCountdown();
                    }}
                  >
                    {isCounting
                      ? t('auth:login.resendCountdown', { seconds: formatNumber(countdown, locale) })
                      : t('auth:login.resend')}
                  </button>
                  <button
                    type="button"
                    className="auth-back-link"
                    onClick={() => setOtpSent(false)}
                  >
                    {t('auth:login.changePhone')}
                  </button>
                </div>

                <button
                  type="button"
                  className="auth-btn"
                  disabled={loading || otpDigits.join('').length < 6}
                  onClick={handleVerifyOtpLogin}
                >
                  {loading ? t('auth:login.verifying') : t('auth:login.verifyAndLogin')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Social Login Options */}
        <div className="auth-divider">{t('auth:login.socialDivider')}</div>

        <div className="auth-social-grid">
          <button
            type="button"
            className="auth-social-btn auth-social-btn-google"
            onClick={() => handleSocialLogin('google')}
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
            <span>Google</span>
          </button>
          <button
            type="button"
            className="auth-social-btn"
            onClick={() => handleSocialLogin('line')}
            disabled={loading}
          >
            <span>💬</span> LINE
          </button>
          <button
            type="button"
            className="auth-social-btn"
            onClick={() => handleSocialLogin('facebook')}
            disabled={loading}
          >
            <span>📘</span> Facebook
          </button>
        </div>

        {/* Switch to Register */}
        <div className="auth-toggle-mode">
          <span>{t('auth:login.noAccount')}</span>
          <LocalizedLink
            to={role === 'seller' ? '/seller/register' : '/register'}
            className="auth-register-banner-link"
          >
            <Sparkles size={14} />
            <span>{role === 'seller' ? t('auth:login.openStore') : t('auth:login.createAccount')}</span>
            <ArrowRight size={14} />
          </LocalizedLink>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
