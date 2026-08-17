// src/pages/LoginPage.tsx — Authentication Page (Login / Register)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Store, ShieldCheck } from 'lucide-react';
import './LoginPage.css';

interface LoginPageProps {
  onLoginSuccess?: (name: string, role: 'buyer' | 'seller') => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    onLoginSuccess?.(name || (role === 'seller' ? 'ร้านค้า Movemall' : 'ผู้ใช้งาน Movemall'), role);

    if (role === 'seller') {
      navigate('/seller');
    } else {
      navigate('/account');
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        {/* Role Tabs */}
        <div className="auth-role-tabs">
          <button
            className={`auth-role-btn${role === 'buyer' ? ' auth-role-btn--active' : ''}`}
            onClick={() => setRole('buyer')}
          >
            <User size={14} style={{ display: 'inline', marginRight: 4 }} />
            สำหรับผู้ซื้อ
          </button>
          <button
            className={`auth-role-btn${role === 'seller' ? ' auth-role-btn--active' : ''}`}
            onClick={() => setRole('seller')}
          >
            <Store size={14} style={{ display: 'inline', marginRight: 4 }} />
            สำหรับร้านค้า / ผู้ขาย
          </button>
        </div>

        <h1 className="auth-title">
          {isRegister
            ? role === 'seller' ? 'เปิดร้านค้าบน Movemall' : 'สมัครสมาชิกใหม่'
            : role === 'seller' ? 'เข้าสู่ระบบศูนย์ผู้ขาย' : 'เข้าสู่ระบบ Movemall'}
        </h1>
        <p className="auth-sub">
          {role === 'seller'
            ? 'เข้าถึงแดชบอร์ดจัดการสต็อกและคำสั่งซื้อร้านค้าของคุณ'
            : 'เพื่อติดตามคำสั่งซื้อ บันทึกสินค้า และรับสิทธิพิเศษมากมาย'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="auth-field">
              <label className="auth-label">{role === 'seller' ? 'ชื่อร้านค้า *' : 'ชื่อ-นามสกุล *'}</label>
              <input
                type="text"
                className="auth-input"
                required
                placeholder={role === 'seller' ? 'เช่น TechPro Official' : 'เช่น สมชาย ใจดี'}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">อีเมล หรือ เบอร์โทรศัพท์ *</label>
            <input
              type="text"
              className="auth-input"
              required
              placeholder="user@movemall.local หรือ 0812345678"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">รหัสผ่าน *</label>
            <input
              type="password"
              className="auth-input"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-btn">
            {isRegister
              ? role === 'seller' ? '🚀 เปิดร้านค้าทันที' : '✨ สมัครสมาชิก'
              : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="auth-divider">หรือเข้าสู่ระบบด้วย</div>

        <div className="auth-social-grid">
          <button className="auth-social-btn" onClick={() => navigate('/account')}>🌐 Google</button>
          <button className="auth-social-btn" onClick={() => navigate('/account')}>💬 LINE</button>
          <button className="auth-social-btn" onClick={() => navigate('/account')}>📘 Facebook</button>
        </div>

        <div className="auth-toggle-mode">
          {isRegister ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชีใช่ไหม?'}
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={() => setIsRegister(r => !r)}
          >
            {isRegister ? 'เข้าสู่ระบบที่นี่' : 'สมัครสมาชิกใหม่'}
          </button>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
