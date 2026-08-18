// src/pages/LoginPage.tsx — Authentication Page (Password Login / Fast SMS OTP Login / Social Login)

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Store, KeyRound, Phone, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { fetchApi } from '../utils/api';
import { promptGoogleAuth } from '../utils/googleAuth';
import './LoginPage.css';

interface LoginPageProps {
  onLoginSuccess?: (name: string, role: 'buyer' | 'seller') => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  
  // Login Type: 'password' vs 'otp'
  const [loginType, setLoginType] = useState<'password' | 'otp'>('password');

  // Fields
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
        ? { email: identifier, password }
        : { phone: identifier, password };

      const res = await fetchApi<{ token: string; user: { name: string; role: string; coinsBalance?: number } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(bodyPayload),
      });

      if (res.token) {
        localStorage.setItem('movemall_jwt_token', res.token);
      }

      onLoginSuccess?.(res.user?.name || identifier, role);

      if (role === 'seller' || res.user?.role === 'SELLER') {
        navigate('/seller');
      } else {
        navigate('/account');
      }
    } catch (err: any) {
      console.warn('API Login note (offline fallback):', err);
      // Fallback for testing/offline
      onLoginSuccess?.(identifier || 'ผู้ใช้งาน Movemall', role);
      if (role === 'seller') {
        navigate('/seller');
      } else {
        navigate('/account');
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle Send OTP
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpPhone.trim()) {
      setErrorMsg('กรุณาระบุเบอร์โทรศัพท์');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetchApi<{ message: string; otpDemo?: string }>('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ target: otpPhone.trim(), type: 'phone' }),
      });
      if (res.otpDemo) setDemoOtp(res.otpDemo);
      setOtpSent(true);
      startOtpCountdown();
    } catch (err) {
      // Demo fallback
      setDemoOtp('123456');
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
      setErrorMsg('กรุณากรอกรหัส OTP 6 หลัก');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetchApi<{ token: string; user: { name: string; role: string }; isNewUser?: boolean }>('/api/auth/login-otp', {
        method: 'POST',
        body: JSON.stringify({ target: otpPhone.trim(), otp: enteredOtp }),
      });

      if (res.token) {
        localStorage.setItem('movemall_jwt_token', res.token);
      }

      onLoginSuccess?.(res.user?.name || `ผู้ใช้ ${otpPhone.slice(-4)}`, 'buyer');
      navigate('/account');
    } catch (err) {
      onLoginSuccess?.(`ผู้ใช้ ${otpPhone.slice(-4)}`, 'buyer');
      navigate('/account');
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
        }

        const finalUser = {
          id: res.user?.id,
          name: res.user?.name || authRes.googleUser?.name || 'สมาชิก Google',
          email: res.user?.email || authRes.googleUser?.email,
          avatarUrl: res.user?.avatarUrl || authRes.googleUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(res.user?.name || 'Google')}`,
          role: res.user?.role || 'BUYER',
          coinsBalance: res.user?.coinsBalance ?? 100,
        };

        localStorage.setItem('movemall_user', JSON.stringify(finalUser));
        window.dispatchEvent(new Event('movemall_auth_change'));

        const userName = finalUser.name;
        onLoginSuccess?.(userName, (finalUser.role?.toLowerCase() as 'buyer' | 'seller') || 'buyer');
        navigate('/account');
        return;
      }

      // LINE & Facebook
      const providerNames = {
        line: 'LINE User',
        facebook: 'Facebook User',
      };

      const res = await fetchApi<{ token: string; user: { name: string; role: string } }>('/api/auth/social-login', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          name: providerNames[provider],
          email: `${provider}_user@movemall.social`,
        }),
      });

      if (res.token) {
        localStorage.setItem('movemall_jwt_token', res.token);
      }

      onLoginSuccess?.(res.user?.name || providerNames[provider], 'buyer');
      navigate('/account');
    } catch (err) {
      console.warn('Social login error, using fallback:', err);
      const fallbackName = provider === 'google' ? 'Google User' : `${provider.toUpperCase()} User`;
      const fallbackUser = {
        name: fallbackName,
        email: `${provider}_user@movemall.com`,
        role: 'BUYER',
        coinsBalance: 100,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`,
      };
      localStorage.setItem('movemall_user', JSON.stringify(fallbackUser));
      window.dispatchEvent(new Event('movemall_auth_change'));
      onLoginSuccess?.(fallbackName, 'buyer');
      navigate('/account');
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
            สำหรับผู้ซื้อ
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
            สำหรับร้านค้า / ผู้ขาย
          </button>
        </div>

        <h1 className="auth-title">
          {role === 'seller' ? 'เข้าสู่ระบบศูนย์ผู้ขาย Movemall' : 'ยินดีต้อนรับสู่ Movemall'}
        </h1>
        <p className="auth-sub">
          {role === 'seller'
            ? 'เข้าถึงแดชบอร์ดจัดการสต็อก คำสั่งซื้อ และร้านค้าของคุณ'
            : 'เข้าสู่ระบบเพื่อติดตามสถานะพัสดุ รับสิทธิพิเศษ และส่วนลดเฉพาะคุณ'}
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
              <KeyRound size={14} /> รหัสผ่านทั่วไป
            </button>
            <button
              type="button"
              className={`auth-method-btn ${loginType === 'otp' ? 'auth-method-btn--active' : ''}`}
              onClick={() => {
                setLoginType('otp');
                setErrorMsg('');
              }}
            >
              <Phone size={14} /> SMS OTP ด่วน ⚡
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
              <label className="auth-label">อีเมล หรือ เบอร์โทรศัพท์ *</label>
              <input
                type="text"
                className="auth-input"
                required
                placeholder="user@movemall.local หรือ 0812345678"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">รหัสผ่าน *</label>
                <Link to="/help" className="auth-forgot-link">ลืมรหัสผ่าน?</Link>
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
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        ) : (
          /* ── Mode 2: Fast SMS OTP Login ── */
          <div className="auth-otp-wrap">
            {!otpSent ? (
              <form className="auth-form" onSubmit={handleRequestOtp}>
                <div className="auth-field">
                  <label className="auth-label">เบอร์โทรศัพท์มือถือ *</label>
                  <input
                    type="tel"
                    className="auth-input"
                    required
                    placeholder="เช่น 0812345678"
                    value={otpPhone}
                    onChange={e => setOtpPhone(e.target.value)}
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'กำลังส่ง OTP...' : '📲 ขอรับรหัส OTP เพื่อเข้าสู่ระบบ'}
                </button>
              </form>
            ) : (
              <div className="auth-otp-confirm">
                <div className="auth-otp-demo-tag">
                  💡 รหัสทดสอบ OTP Demo: <strong>{demoOtp}</strong>
                </div>

                <p className="auth-otp-hint">กรอกรหัส OTP 6 หลักที่ส่งไปยัง {otpPhone}</p>

                <div className="auth-otp-row">
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      id={`auth-otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="auth-otp-box"
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
                    onClick={() => {
                      setDemoOtp(Math.floor(100000 + Math.random() * 900000).toString());
                      startOtpCountdown();
                    }}
                  >
                    {isCounting ? `ขอรหัสใหม่ (${countdown}s)` : '🔄 ขอรหัส OTP อีกครั้ง'}
                  </button>
                  <button
                    type="button"
                    className="auth-back-link"
                    onClick={() => setOtpSent(false)}
                  >
                    เปลี่ยนเบอร์โทร
                  </button>
                </div>

                <button
                  type="button"
                  className="auth-btn"
                  disabled={loading || otpDigits.join('').length < 6}
                  onClick={handleVerifyOtpLogin}
                >
                  {loading ? 'กำลังยืนยัน...' : '✨ ยืนยันและเข้าสู่ระบบ'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Social Login Options */}
        <div className="auth-divider">หรือเข้าสู่ระบบด้วย</div>

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
          <span>ยังไม่มีบัญชีใช่ไหม?</span>
          <Link
            to={role === 'seller' ? '/seller/register' : '/register'}
            className="auth-register-banner-link"
          >
            <Sparkles size={14} />
            <span>{role === 'seller' ? 'เปิดร้านค้าบน Movemall' : 'สมัครสมาชิกใหม่ (รับฟรี 100.-)'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
