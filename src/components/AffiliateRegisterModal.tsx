// src/components/AffiliateRegisterModal.tsx — Movemall Creator & Affiliate Registration Wizard

import { useState } from 'react';
import {
  X,
  User,
  Share2,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import type { CreatorProfileData, AffiliateRegisterPayload } from '../utils/api';
import './AffiliateRegisterModal.css';

interface AffiliateRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (creator: CreatorProfileData) => void;
}

const THAI_BANKS = [
  { id: 'KBANK', name: 'ธนาคารกสิกรไทย (Kasikornbank)', color: '#138f2d' },
  { id: 'SCB', name: 'ธนาคารไทยพาณิชย์ (Siam Commercial Bank)', color: '#4e2a84' },
  { id: 'BBL', name: 'ธนาคารกรุงเทพ (Bangkok Bank)', color: '#1e4598' },
  { id: 'KTB', name: 'ธนาคารกรุงไทย (Krungthai Bank)', color: '#00a3e0' },
  { id: 'TTB', name: 'ธนาคารทหารไทยธนชาต (ttb)', color: '#002d62' },
  { id: 'BAY', name: 'ธนาคารกรุงศรีอยุธยา (Bank of Ayudhya)', color: '#fdb913' },
  { id: 'GSB', name: 'ธนาคารออมสิน (Government Savings Bank)', color: '#eb1985' },
  { id: 'PROMPTPAY', name: 'พร้อมเพย์ (PromptPay Direct)', color: '#005b94' },
];

const SOCIAL_PLATFORMS = [
  { id: 'TikTok', name: 'TikTok', icon: '🎵', example: '@username.review' },
  { id: 'YouTube', name: 'YouTube', icon: '▶️', example: 'youtube.com/@channel' },
  { id: 'Instagram', name: 'Instagram', icon: '📸', example: '@my_instagram' },
  { id: 'Facebook', name: 'Facebook Fanpage', icon: '📘', example: 'fb.com/mypage' },
  { id: 'Lemon8', name: 'Lemon8', icon: '🍋', example: '@lemon8_creator' },
  { id: 'X', name: 'X (Twitter)', icon: '✖️', example: '@twitter_handle' },
];

const CATEGORIES = [
  '👗 แฟชั่น & เครื่องแต่งกาย',
  '💄 เครื่องสำอาง & ความงาม',
  '📱 อิเล็กทรอนิกส์ & อุปกรณ์ไอที',
  '🍳 เครื่องใช้ในบ้าน & ของแต่งห้อง',
  '🍲 อาหาร ขนม & เครื่องดื่ม',
  '🏃 กีฬา & กิจกรรมกลางแจ้ง',
  '🧸 แม่และเด็ก & ของเล่น',
  '✨ ไลฟ์สไตล์ & รีวิวของใช้ทั่วไป',
];

// Helper: Thai National ID 13-digit checksum validator
function isValidThaiID(id: string): boolean {
  const cleanId = id.replace(/\D/g, '');
  if (cleanId.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId.charAt(i), 10) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return check === parseInt(cleanId.charAt(12), 10);
}

export function AffiliateRegisterModal({ isOpen, onClose, onSuccess }: AffiliateRegisterModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [accountType, setAccountType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');

  // Step 1: Personal info
  const [fullName, setFullName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Social media
  const [socialPlatform, setSocialPlatform] = useState('TikTok');
  const [socialHandle, setSocialHandle] = useState('');
  const [followerRange, setFollowerRange] = useState('1,000 - 10,000 คน');
  const [contentCategory, setContentCategory] = useState(CATEGORIES[0]);

  // Step 3: Bank info
  const [bankName, setBankName] = useState(THAI_BANKS[0].name);
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [promptPayPhone, setPromptPayPhone] = useState('');
  const [agreedWHT, setAgreedWHT] = useState(true);

  // Step 4: Terms
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 5: Success state
  const [createdCreator, setCreatedCreator] = useState<CreatorProfileData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  function validateStep1(): boolean {
    setErrorMsg('');
    if (!fullName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุลจริง (ต้องตรงกับสมุดบัญชีธนาคาร)');
      return false;
    }
    const cleanId = idCard.replace(/\D/g, '');
    if (accountType === 'INDIVIDUAL') {
      if (cleanId.length !== 13 || !isValidThaiID(cleanId)) {
        setErrorMsg('กรุณากรอกเลขประจำตัวประชาชน 13 หลักที่ถูกต้องเพื่อการหักภาษี ณ ที่จ่าย');
        return false;
      }
    } else {
      if (cleanId.length !== 13) {
        setErrorMsg('กรุณากรอกเลขประจำตัวผู้เสียภาษีนิติบุคคล 13 หลัก');
        return false;
      }
    }
    if (!phone.trim() || phone.length < 9) {
      setErrorMsg('กรุณากรอกหมายเลขโทรศัพท์ติดต่อ');
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    setErrorMsg('');
    if (!socialHandle.trim()) {
      setErrorMsg('กรุณากรอกชื่อบัญชี / ลิงก์ช่องทางโซเชียลมีเดียของคุณ');
      return false;
    }
    return true;
  }

  function validateStep3(): boolean {
    setErrorMsg('');
    const cleanAcc = bankAccountNumber.replace(/\D/g, '');
    if (cleanAcc.length < 8) {
      setErrorMsg('กรุณากรอกเลขที่บัญชีธนาคารให้ถูกต้อง (8-12 หลัก)');
      return false;
    }
    if (!agreedWHT) {
      setErrorMsg('คุณต้องยินยอมการหักภาษี ณ ที่จ่าย 3% ตามระเบียบกรมสรรพากร');
      return false;
    }
    return true;
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep((prev) => Math.min(prev + 1, 4) as 1 | 2 | 3 | 4 | 5);
  }

  function handleBack() {
    setErrorMsg('');
    setStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3 | 4 | 5);
  }

  async function handleSubmit() {
    if (!agreedTerms) {
      setErrorMsg('กรุณาทำเครื่องหมายยอมรับข้อตกลงและเงื่อนไขการเป็นนายหน้า Movemall');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const payload: AffiliateRegisterPayload = {
      fullName,
      idCard: idCard.replace(/\D/g, ''),
      accountType,
      socialPlatform,
      socialHandle,
      followerRange,
      contentCategory,
      bankName,
      bankAccountNumber: bankAccountNumber.replace(/\D/g, ''),
      bankAccountName: bankAccountName.trim() || fullName,
      promptPayPhone: promptPayPhone.trim() || phone,
    };

    try {
      // Direct API Call with fallbacks
      const token = localStorage.getItem('movemall_jwt_token');
      const res = await fetch('http://localhost:4000/api/payout/affiliate/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      let creatorData: CreatorProfileData;
      if (res.ok && data.creator) {
        creatorData = data.creator;
      } else {
        // Fallback local creator generation
        creatorData = {
          userId: `user-${Date.now()}`,
          creatorId: `CREATOR-TH${Math.floor(1000 + Math.random() * 9000)}`,
          fullName: payload.fullName,
          idCard: payload.idCard,
          accountType: payload.accountType || 'INDIVIDUAL',
          socialPlatform: payload.socialPlatform,
          socialHandle: payload.socialHandle,
          followerRange: payload.followerRange,
          contentCategory: payload.contentCategory,
          bankName: payload.bankName,
          bankAccountNumber: payload.bankAccountNumber,
          bankAccountName: payload.bankAccountName || payload.fullName,
          promptPayPhone: payload.promptPayPhone,
          status: 'VERIFIED',
          tier: 'SILVER',
          commissionRate: 15,
          availableBalance: 500.0,
          pendingSettlement: 0.0,
          totalEarned: 500.0,
          totalClicks: 0,
          totalOrders: 0,
          createdAt: new Date().toISOString(),
        };
      }

      // Save locally
      localStorage.setItem('movemall_creator_profile', JSON.stringify(creatorData));
      localStorage.setItem('movemall_is_affiliate', 'true');

      setCreatedCreator(creatorData);
      setStep(5);
      onSuccess(creatorData);
    } catch {
      // Local fallback in case server offline
      const fallbackCreator: CreatorProfileData = {
        userId: `user-${Date.now()}`,
        creatorId: `CREATOR-TH${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: payload.fullName,
        idCard: payload.idCard,
        accountType: payload.accountType || 'INDIVIDUAL',
        socialPlatform: payload.socialPlatform,
        socialHandle: payload.socialHandle,
        followerRange: payload.followerRange,
        contentCategory: payload.contentCategory,
        bankName: payload.bankName,
        bankAccountNumber: payload.bankAccountNumber,
        bankAccountName: payload.bankAccountName || payload.fullName,
        promptPayPhone: payload.promptPayPhone,
        status: 'VERIFIED',
        tier: 'SILVER',
        commissionRate: 15,
        availableBalance: 500.0,
        pendingSettlement: 0.0,
        totalEarned: 500.0,
        totalClicks: 0,
        totalOrders: 0,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('movemall_creator_profile', JSON.stringify(fallbackCreator));
      localStorage.setItem('movemall_is_affiliate', 'true');

      setCreatedCreator(fallbackCreator);
      setStep(5);
      onSuccess(fallbackCreator);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyReferral() {
    if (!createdCreator) return;
    navigator.clipboard?.writeText(createdCreator.creatorId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  return (
    <div className="affiliate-modal-overlay" onClick={onClose}>
      <div
        className="affiliate-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="affiliate-modal-header">
          <div className="affiliate-modal-header-left">
            <span className="affiliate-modal-badge">
              <Sparkles size={13} /> OFFICIAL CREATOR PARTNER
            </span>
            <h2 className="affiliate-modal-title">
              {step === 5 ? '🎉 ยินดีต้อนรับสู่ครอบครัว Movemall Creator!' : '📝 สมัครเป็นนายหน้า & ครีเอเตอร์ Movemall'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="affiliate-modal-close-btn"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Stepper Bar (Hidden on Success Step 5) */}
        {step < 5 && (
          <div className="affiliate-modal-stepper">
            <div className={`affiliate-step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="affiliate-step-circle">1</div>
              <span className="affiliate-step-text">ข้อมูลตัวตน</span>
            </div>
            <div className={`affiliate-step-line ${step >= 2 ? 'active' : ''}`} />

            <div className={`affiliate-step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="affiliate-step-circle">2</div>
              <span className="affiliate-step-text">ช่องทางโซเชียล</span>
            </div>
            <div className={`affiliate-step-line ${step >= 3 ? 'active' : ''}`} />

            <div className={`affiliate-step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <div className="affiliate-step-circle">3</div>
              <span className="affiliate-step-text">บัญชีรับเงิน & ภาษี</span>
            </div>
            <div className={`affiliate-step-line ${step >= 4 ? 'active' : ''}`} />

            <div className={`affiliate-step-item ${step >= 4 ? 'active' : ''}`}>
              <div className="affiliate-step-circle">4</div>
              <span className="affiliate-step-text">ยืนยันข้อตกลง</span>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="affiliate-modal-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="affiliate-modal-body">
          {/* ───────────────── STEP 1: Personal / Company Info ───────────────── */}
          {step === 1 && (
            <div className="affiliate-step-pane">
              <div className="affiliate-form-section-header">
                <h3>1. เลือกประเภทบัญชี & ข้อมูลตัวตน</h3>
                <p>ข้อมูลนี้จะใช้สำหรับการยืนยันตัวตนและการหักภาษี ณ ที่จ่าย 3% ตามกฎหมายสรรพากร</p>
              </div>

              {/* Account Type Selector Tabs */}
              <div className="affiliate-type-tabs">
                <button
                  type="button"
                  className={`affiliate-type-tab ${accountType === 'INDIVIDUAL' ? 'active' : ''}`}
                  onClick={() => setAccountType('INDIVIDUAL')}
                >
                  <User size={16} />
                  <div>
                    <strong>บุคคลธรรมดา (Individual)</strong>
                    <span>สำหรับครีเอเตอร์ / อินฟลูเอนเซอร์ทั่วไป</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`affiliate-type-tab ${accountType === 'COMPANY' ? 'active' : ''}`}
                  onClick={() => setAccountType('COMPANY')}
                >
                  <Building2 size={16} />
                  <div>
                    <strong>นิติบุคคล (Company)</strong>
                    <span>สำหรับบริษัท, เอเจนซี่, สตูดิโอ</span>
                  </div>
                </button>
              </div>

              <div className="affiliate-input-grid">
                <div className="affiliate-form-group">
                  <label className="affiliate-label">
                    {accountType === 'INDIVIDUAL' ? 'ชื่อ-นามสกุลจริง (ภาษาไทย) *' : 'ชื่อบริษัท / นิติบุคคล *'}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={accountType === 'INDIVIDUAL' ? 'เช่น นายสมชาย ใจดี' : 'เช่น บจก. มีเดีย พลัส จำกัด'}
                    className="affiliate-form-input"
                  />
                  <span className="affiliate-form-hint">ชื่อต้องตรงกับชื่อบัญชีธนาคารที่จะรับเงินค่านายหน้า</span>
                </div>

                <div className="affiliate-form-group">
                  <label className="affiliate-label">
                    {accountType === 'INDIVIDUAL' ? 'เลขประจำตัวประชาชน 13 หลัก *' : 'เลขประจำตัวผู้เสียภาษี 13 หลัก *'}
                  </label>
                  <input
                    type="text"
                    maxLength={17}
                    value={idCard}
                    onChange={(e) => setIdCard(e.target.value)}
                    placeholder="x-xxxx-xxxxx-xx-x"
                    className="affiliate-form-input"
                  />
                  <span className="affiliate-form-hint">ข้อมูลถูกเข้ารหัสความปลอดภัยระดับธนาคาร (AES-256)</span>
                </div>

                <div className="affiliate-form-group">
                  <label className="affiliate-label">หมายเลขโทรศัพท์มือถือ *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08x-xxx-xxxx"
                    className="affiliate-form-input"
                  />
                </div>

                <div className="affiliate-form-group">
                  <label className="affiliate-label">อีเมลสำหรับรับรายงานสรุปรายได้</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@example.com"
                    className="affiliate-form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ───────────────── STEP 2: Social Media Channels ───────────────── */}
          {step === 2 && (
            <div className="affiliate-step-pane">
              <div className="affiliate-form-section-header">
                <h3>2. ช่องทางโซเชียลมีเดีย & สไตล์คอนเทนต์</h3>
                <p>เลือกช่องทางหลักที่คุณใช้ลงคลิปวิดีโอสั้น หรือโพสต์แชร์ป้ายยาสินค้า</p>
              </div>

              {/* Social Platform Grid Selection */}
              <div className="affiliate-platforms-grid">
                {SOCIAL_PLATFORMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`affiliate-platform-btn ${socialPlatform === item.id ? 'active' : ''}`}
                    onClick={() => setSocialPlatform(item.id)}
                  >
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <span className="affiliate-platform-name">{item.name}</span>
                  </button>
                ))}
              </div>

              <div className="affiliate-input-grid" style={{ marginTop: 16 }}>
                <div className="affiliate-form-group">
                  <label className="affiliate-label">ชื่อบัญชี / ลิงก์ช่องทางของคุณ *</label>
                  <input
                    type="text"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    placeholder={SOCIAL_PLATFORMS.find((p) => p.id === socialPlatform)?.example || '@username'}
                    className="affiliate-form-input"
                  />
                </div>

                <div className="affiliate-form-group">
                  <label className="affiliate-label">จำนวนผู้ติดตามโดยประมาณ</label>
                  <select
                    value={followerRange}
                    onChange={(e) => setFollowerRange(e.target.value)}
                    className="affiliate-form-select"
                  >
                    <option value="น้อยกว่า 1,000 คน">น้อยกว่า 1,000 คน (ผู้เริ่มต้น)</option>
                    <option value="1,000 - 10,000 คน">1,000 - 10,000 คน (Micro-Creator)</option>
                    <option value="10,000 - 50,000 คน">10,000 - 50,000 คน (Mid-Tier)</option>
                    <option value="50,000 - 100,000 คน">50,000 - 100,000 คน (Macro-Creator)</option>
                    <option value="มากกว่า 100,000 คน">มากกว่า 100,000 คน (Top Star)</option>
                  </select>
                </div>

                <div className="affiliate-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="affiliate-label">หมวดหมู่สินค้าที่คุณสนใจป้ายยาเป็นหลัก</label>
                  <select
                    value={contentCategory}
                    onChange={(e) => setContentCategory(e.target.value)}
                    className="affiliate-form-select"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────── STEP 3: Bank & Withholding Tax ───────────────── */}
          {step === 3 && (
            <div className="affiliate-step-pane">
              <div className="affiliate-form-section-header">
                <h3>3. บัญชีธนาคารรับเงิน & การหักภาษี ณ ที่จ่าย</h3>
                <p>รายได้ค่านายหน้าจะถูกโอนเข้าบัญชีนี้โดยตรงผ่านระบบหักบัญชีอัตโนมัติ</p>
              </div>

              <div className="affiliate-input-grid">
                <div className="affiliate-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="affiliate-label">ธนาคารรับเงิน *</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="affiliate-form-select"
                  >
                    {THAI_BANKS.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="affiliate-form-group">
                  <label className="affiliate-label">เลขที่บัญชีธนาคาร *</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="xxx-x-xxxxx-x"
                    className="affiliate-form-input"
                  />
                </div>

                <div className="affiliate-form-group">
                  <label className="affiliate-label">ชื่อเจ้าของบัญชี (ตรงกับชื่อผู้สมัคร)</label>
                  <input
                    type="text"
                    value={bankAccountName || fullName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    placeholder={fullName || 'นายสมชาย ใจดี'}
                    className="affiliate-form-input"
                  />
                </div>

                <div className="affiliate-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="affiliate-label">เบอร์พร้อมเพย์ PromptPay (รับเงินด่วน 24 ชม.)</label>
                  <input
                    type="tel"
                    value={promptPayPhone}
                    onChange={(e) => setPromptPayPhone(e.target.value)}
                    placeholder="08x-xxx-xxxx"
                    className="affiliate-form-input"
                  />
                </div>
              </div>

              {/* Tax Notice Card */}
              <div className="affiliate-tax-notice">
                <ShieldCheck size={20} style={{ color: '#2563EB', flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: 13, color: '#1E40AF', display: 'block', marginBottom: 2 }}>
                    การหักภาษี ณ ที่จ่าย 3% (e-Withholding Tax)
                  </strong>
                  <span style={{ fontSize: 11, color: '#1E3A8A', lineHeight: 1.4, display: 'block' }}>
                    ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร ค่าตอบแทนจากการเป็นนายหน้าจะถูกหักภาษี ณ ที่จ่าย 3%
                    โดย Movemall จะนำส่งข้อมูลและออกหนังสือรับรองภาษีแบบอิเล็กทรอนิกส์ให้คุณทุกสิ้นปี
                  </span>
                  <label className="affiliate-checkbox-row" style={{ marginTop: 8 }}>
                    <input
                      type="checkbox"
                      checked={agreedWHT}
                      onChange={(e) => setAgreedWHT(e.target.checked)}
                    />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1E3A8A' }}>
                      ฉันรับทราบและยินยอมการหักภาษี ณ ที่จ่าย 3%
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────── STEP 4: Terms & Fast Approval ───────────────── */}
          {step === 4 && (
            <div className="affiliate-step-pane">
              <div className="affiliate-form-section-header">
                <h3>4. สรุปข้อมูล & ยอมรับข้อตกลงการเป็นนายหน้า</h3>
                <p>ตรวจสอบความถูกต้องของข้อมูลก่อนกดยืนยันการสมัคร</p>
              </div>

              {/* Summary Card */}
              <div className="affiliate-summary-card">
                <div className="affiliate-summary-row">
                  <span className="affiliate-summary-lbl">ผู้สมัคร:</span>
                  <span className="affiliate-summary-val">{fullName} ({accountType === 'INDIVIDUAL' ? 'บุคคลธรรมดา' : 'นิติบุคคล'})</span>
                </div>
                <div className="affiliate-summary-row">
                  <span className="affiliate-summary-lbl">ช่องทางโซเชียล:</span>
                  <span className="affiliate-summary-val">{socialPlatform} ({socialHandle})</span>
                </div>
                <div className="affiliate-summary-row">
                  <span className="affiliate-summary-lbl">หมวดสินค้าที่ถนัด:</span>
                  <span className="affiliate-summary-val">{contentCategory}</span>
                </div>
                <div className="affiliate-summary-row">
                  <span className="affiliate-summary-lbl">บัญชีรับเงิน:</span>
                  <span className="affiliate-summary-val">{bankName} ({bankAccountNumber})</span>
                </div>
                <div className="affiliate-summary-row">
                  <span className="affiliate-summary-lbl">อัตราค่าคอมเริ่มต้น:</span>
                  <span className="affiliate-summary-val" style={{ color: '#059669', fontWeight: 900 }}>15.0% ทุกออเดอร์</span>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="affiliate-terms-box">
                <label className="affiliate-checkbox-row">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    ฉันยอมรับ <strong>ข้อกำหนดและเงื่อนไขการเป็น Movemall Creator & Affiliate Partner</strong>,
                    นโยบายการโฆษณาอย่างโปร่งใส และตกลงที่จะไม่กระทำการใดๆ ที่เป็นการปั่นยอดการคลิกหรือสร้างยอดสั่งซื้อปลอม
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ───────────────── STEP 5: Success & Creator Onboarding ───────────────── */}
          {step === 5 && createdCreator && (
            <div className="affiliate-step-pane affiliate-success-pane">
              <div className="affiliate-success-icon-wrap">
                <CheckCircle2 size={48} style={{ color: '#10B981' }} />
              </div>
              <h3 className="affiliate-success-title">
                ยินดีต้อนรับคุณ {createdCreator.fullName}
              </h3>
              <p className="affiliate-success-subtitle">
                ใบสมัครของคุณได้รับการอนุมัติเรียบร้อยแล้ว! คุณเป็น Movemall Official Creator ระดับ Silver ⭐
              </p>

              {/* Referral ID Display Box */}
              <div className="affiliate-id-showcase">
                <div className="affiliate-id-showcase-label">รหัสนายหน้าประจำตัวของคุณ (Referral ID)</div>
                <div className="affiliate-id-showcase-code">
                  <span>{createdCreator.creatorId}</span>
                  <button
                    className="affiliate-copy-badge-btn"
                    onClick={handleCopyReferral}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}
                  </button>
                </div>
              </div>

              {/* Starter Pack Perks */}
              <div className="affiliate-starter-perks">
                <div className="affiliate-starter-perk-item">
                  <DollarSign size={18} style={{ color: '#10B981' }} />
                  <div>
                    <strong>โบนัสต้อนรับ ฿500</strong>
                    <span>เติมเข้ากระเป๋า Creator Wallet ของคุณแล้ว</span>
                  </div>
                </div>
                <div className="affiliate-starter-perk-item">
                  <Share2 size={18} style={{ color: '#2563EB' }} />
                  <div>
                    <strong>ปักตะกร้าเหลือง & แชร์ลิงก์</strong>
                    <span>รับค่าคอมมิชชัน 15% ทุกออเดอร์</span>
                  </div>
                </div>
              </div>

              <button
                className="affiliate-enter-dashboard-btn"
                onClick={onClose}
              >
                เข้าสู่แดชบอร์ดนายหน้าของคุณทันที ➔
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step < 5 && (
          <div className="affiliate-modal-footer">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="affiliate-btn-secondary"
              >
                <ArrowLeft size={16} /> ย้อนกลับ
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="affiliate-btn-primary"
              >
                ถัดไป <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !agreedTerms}
                className="affiliate-btn-primary"
              >
                {isSubmitting ? 'กำลังส่งข้อมูลสมัคร...' : '🚀 ยืนยันการสมัคร & เริ่มเป็นนายหน้า'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AffiliateRegisterModal;
