// src/pages/AffiliatePage.tsx — Movemall Creator & Affiliate Hub (Clean Minimalist Theme)

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Share2,
  DollarSign,
  Copy,
  Check,
  Sparkles,
  Video,
  CheckCircle,
  TrendingUp,
  Percent,
  UserCheck,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Award,
  Flame,
  HelpCircle,
  X,
  CreditCard,
} from 'lucide-react';
import { products } from '../data/products';
import { getProductUrl } from '../utils/seo';
import { mockLiveStreams } from '../data/liveStreams';
import { ProductPickerModal } from '../components/ProductPickerModal';
import { AffiliateRegisterModal } from '../components/AffiliateRegisterModal';
import type { CreatorProfileData } from '../utils/api';
import { fetchAffiliateProfile, requestAffiliatePayout } from '../utils/api';
import './AffiliatePage.css';

interface AffiliatePageProps {
  onCopySuccess?: (msg: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPublishClip?: (clip: any) => void;
}

export function AffiliatePage({ onCopySuccess, onPublishClip }: AffiliatePageProps) {
  // Creator Profile & Registration State
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfileData | null>(() => {
    const saved = localStorage.getItem('movemall_creator_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const isRegistered = !!creatorProfile;
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Withdraw Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState('');

  // Link Generator & Copy States
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedRefId, setCopiedRefId] = useState(false);
  const [productUrlInput, setProductUrlInput] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Video Upload with Yellow Basket Form State
  const [selectedProductId, setSelectedProductId] = useState(products[0].id);
  const [videoCaption, setVideoCaption] = useState('👗 แกะกล่องป้ายยาของดีใน Movemall ใส่แล้วสวยมากกก ปักตะกร้าสีเหลืองด้านล่างเลยค่ะ!');
  const [videoHashtags, setVideoHashtags] = useState('#ป้ายยาของดี #MovemallVideo #ตะกร้าสีเหลือง');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  const activeRefCode = creatorProfile?.creatorId || 'CREATOR-TH8891';

  // Load profile from API if possible
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetchAffiliateProfile();
        if (res.isRegistered && res.creator) {
          setCreatorProfile(res.creator);
          localStorage.setItem('movemall_creator_profile', JSON.stringify(res.creator));
        }
      } catch {
        // Use localStorage data
      }
    }
    loadProfile();
  }, []);

  // Sample high commission products
  const affiliateProducts = products.slice(0, 8).map((p) => {
    const rate = creatorProfile?.commissionRate || 15;
    return {
      ...p,
      commissionRate: rate,
      commissionAmount: Math.round(p.price * (rate / 100)),
    };
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const estimatedCommission = Math.round(selectedProduct.price * ((creatorProfile?.commissionRate || 15) / 100));

  function handleGenerateLink(e: React.FormEvent) {
    e.preventDefault();
    const cleanUrl = productUrlInput.trim() || `https://movemall.app${getProductUrl(selectedProduct)}`;
    const finalAffLink = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}ref=${activeRefCode}`;
    setGeneratedLink(finalAffLink);
  }

  function handleCopy(link: string) {
    navigator.clipboard?.writeText(link);
    setCopiedLink(link);
    onCopySuccess?.('คัดลอกลิงก์ป้ายยา Affiliate สำเร็จแล้ว!');
    setTimeout(() => setCopiedLink(null), 2500);
  }

  function handleCopyCode(code: string) {
    navigator.clipboard?.writeText(code);
    setCopiedRefId(true);
    onCopySuccess?.(`คัดลอกรหัสนายหน้า ${code} สำเร็จแล้ว!`);
    setTimeout(() => setCopiedRefId(false), 2000);
  }

  function handleRegisterSuccess(newCreator: CreatorProfileData) {
    setCreatorProfile(newCreator);
    onCopySuccess?.('ยินดีด้วย! บัญชีของคุณได้รับการอนุมัติเป็น Movemall Creator แล้ว 🎉');
  }

  async function handleConfirmWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt < 100) {
      alert('ยอดถอนขั้นต่ำคือ ฿100');
      return;
    }

    if (creatorProfile && amt > creatorProfile.availableBalance) {
      alert('ยอดเงินคงเหลือไม่เพียงพอ');
      return;
    }

    setIsWithdrawing(true);
    setWithdrawSuccessMsg('');

    try {
      const res = await requestAffiliatePayout(amt, 'PROMPTPAY');
      const updatedBalance = res.remainingBalance;

      if (creatorProfile) {
        const updated: CreatorProfileData = {
          ...creatorProfile,
          availableBalance: updatedBalance,
        };
        setCreatorProfile(updated);
        localStorage.setItem('movemall_creator_profile', JSON.stringify(updated));
      }

      setWithdrawSuccessMsg(`ส่งคำขอถอนเงิน ฿${amt.toLocaleString()} สำเร็จ! ยอดเงินสุทธิหลังหักภาษี 3% (฿${(amt * 0.97).toLocaleString()}) จะโอนเข้าบัญชีของคุณ`);
      onCopySuccess?.('ส่งคำขอถอนเงินสำเร็จ ยอดเงินจะเข้าบัญชีภายใน 24 ชม.');
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawSuccessMsg('');
      }, 2500);
    } catch {
      // Fallback local update
      if (creatorProfile) {
        const newBal = Math.max(0, creatorProfile.availableBalance - amt);
        const updated: CreatorProfileData = {
          ...creatorProfile,
          availableBalance: newBal,
        };
        setCreatorProfile(updated);
        localStorage.setItem('movemall_creator_profile', JSON.stringify(updated));
      }
      setWithdrawSuccessMsg(`ส่งคำขอถอนเงิน ฿${amt.toLocaleString()} สำเร็จ! ยอดสุทธิหลังหักภาษี 3% (฿${(amt * 0.97).toLocaleString()}) จะโอนเข้าบัญชี`);
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawSuccessMsg('');
      }, 2500);
    } finally {
      setIsWithdrawing(false);
    }
  }

  function handlePublishVideo(e: React.FormEvent) {
    e.preventDefault();
    setIsPublishing(true);

    setTimeout(() => {
      // Add new video to mockLiveStreams queue
      const newVideo = {
        id: `video-creator-${Date.now()}`,
        type: 'video' as const,
        storeId: selectedProduct.storeId || 's1',
        channelName: creatorProfile ? `${creatorProfile.fullName} (${creatorProfile.socialPlatform})` : 'ฉัน (Creator Affiliate)',
        storeLogo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
        streamerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
        streamerName: creatorProfile ? creatorProfile.fullName : 'ฉัน (My Channel)',
        caption: videoCaption,
        hashtags: videoHashtags.split(' '),
        soundTitle: 'เสียงต้นฉบับ - My Creator Studio 🎵',
        category: selectedProduct.category,
        viewers: '1.2k วิว',
        likesCount: 120,
        commentsCount: 8,
        sharesCount: 14,
        videoUrl: '/videos/live-streamer-1.mp4',
        coverImage: selectedProduct.images[0],
        badge: '🌟 MY BASKET',
        pinnedProduct: {
          id: selectedProduct.id,
          name: selectedProduct.name,
          image: selectedProduct.images[0],
          price: selectedProduct.price,
          originalPrice: selectedProduct.originalPrice || selectedProduct.price * 1.5,
          discountPct: 30,
          commissionRate: creatorProfile?.commissionRate || 15,
          commissionAmount: estimatedCommission,
        },
        comments: [
          { user: 'Movemall Bot', text: 'คลิปวิดีโอติดตะกร้าของคุณเริ่มเผยแพร่แล้ว 🎉', time: 'เมื่อสักครู่' },
        ],
      };

      if (onPublishClip) {
        onPublishClip(newVideo);
      } else {
        mockLiveStreams.unshift(newVideo);
      }
      setIsPublishing(false);
      setPublishedSuccess(true);
      onCopySuccess?.('เผยแพร่วิดีโอสั้นติดตะกร้าสินค้าสำเร็จแล้ว! ไปดูในฟีดวิดีโอได้เลย');
    }, 800);
  }

  return (
    <main className="affiliate-page">
      <div className="affiliate-container">
        {/* ─────────────────────────────────────────────────────────────
            A. NON-REGISTERED ONBOARDING HERO (If Not Yet an Affiliate)
        ────────────────────────────────────────────────────────────── */}
        {!isRegistered ? (
          <section className="affiliate-onboarding-hero">
            <div className="affiliate-onboarding-left">
              <span className="affiliate-hero-badge">MOVEMALL CREATOR & AFFILIATE PROGRAM</span>
              <h1 className="affiliate-onboarding-title">
                สร้างรายได้หลักหมื่นง่ายๆ<br />
                <span style={{ color: '#FDE047' }}>ด้วยการป้ายยา & ปักตะกร้าสินค้า 🛍️</span>
              </h1>
              <p className="affiliate-onboarding-desc">
                รับค่าคอมมิชชั่นสูงสุด <strong>15 - 20% ทุกคำสั่งซื้อ</strong> แค่ลงคลิปวิดีโอสั้นติดตะกร้าสีเหลือง
                หรือแชร์ลิงก์ให้เพื่อนซื้อ สมัครฟรี อนุมัติทันที พร้อมรับโบนัสแรกเข้า ฿500
              </p>

              <div className="affiliate-onboarding-cta-row">
                <button
                  className="affiliate-register-main-btn"
                  onClick={() => setIsRegisterModalOpen(true)}
                >
                  <Sparkles size={18} /> สมัครเป็นนายหน้าทันที (ฟรี) ➔
                </button>
                <div className="affiliate-fast-perk">
                  <ShieldCheck size={16} style={{ color: '#86EFAC' }} />
                  <span>อนุมัติทันทีใน 1 นาที • รับเงินผ่าน PromptPay</span>
                </div>
              </div>
            </div>

            <div className="affiliate-onboarding-perks-card">
              <h3 className="affiliate-perks-card-title">💎 สิทธิพิเศษสำหรับ Movemall Creator</h3>
              <div className="affiliate-perk-item">
                <div className="affiliate-perk-icon">💰</div>
                <div>
                  <strong>ค่าคอมมิชชั่นสูงสุด 15-20%</strong>
                  <span>รายได้ไม่จำกัด ถอนเข้าบัญชีธนาคารได้ทุกวัน</span>
                </div>
              </div>
              <div className="affiliate-perk-item">
                <div className="affiliate-perk-icon">🎬</div>
                <div>
                  <strong>สิทธิ์ปักตะกร้าเหลืองในคลิปสั้น</strong>
                  <span>ติดตะกร้าในฟีดวิดีโอสไตล์ TikTok สั่งซื้อได้ทันที</span>
                </div>
              </div>
              <div className="affiliate-perk-item">
                <div className="affiliate-perk-icon">🎁</div>
                <div>
                  <strong>โบนัสต้อนรับ ฿500 เข้ากระเป๋า</strong>
                  <span>เริ่มต้นสร้างรายได้ทันทีหลังสมัครเสร็จ</span>
                </div>
              </div>
              <div className="affiliate-perk-item">
                <div className="affiliate-perk-icon">📊</div>
                <div>
                  <strong>ระบบ Realtime Analytics & e-WHT</strong>
                  <span>ตรวจสอบยอดคลิก ออเดอร์ พร้อมหักภาษี 3% ถูกต้อง</span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* ─────────────────────────────────────────────────────────────
              B. ACTIVE CREATOR PROFILE HEADER & DASHBOARD
          ────────────────────────────────────────────────────────────── */
          <section className="affiliate-creator-header-card">
            <div className="affiliate-creator-profile-info">
              <div className="affiliate-creator-avatar">
                {creatorProfile.fullName.charAt(0)}
              </div>
              <div>
                <div className="affiliate-creator-name-row">
                  <h1 className="affiliate-creator-name">{creatorProfile.fullName}</h1>
                  <span className="affiliate-verified-tag">
                    <UserCheck size={12} /> ยืนยันตัวตนแล้ว (Verified)
                  </span>
                  <span className="affiliate-tier-tag">
                    <Award size={12} /> ระดับ: {creatorProfile.tier} ⭐
                  </span>
                </div>
                <div className="affiliate-creator-details-sub">
                  <span>📱 ช่องทาง: <strong>{creatorProfile.socialPlatform} ({creatorProfile.socialHandle})</strong></span>
                  <span> • 🏦 บัญชี: <strong>{creatorProfile.bankName} (xxx-{creatorProfile.bankAccountNumber.slice(-4)})</strong></span>
                </div>
              </div>
            </div>

            {/* Referral Code Badge with Quick Copy */}
            <div className="affiliate-creator-ref-box">
              <span className="affiliate-creator-ref-lbl">รหัสนายหน้าของคุณ (Referral Code):</span>
              <div className="affiliate-creator-ref-val">
                <code>{creatorProfile.creatorId}</code>
                <button
                  className="affiliate-ref-copy-btn"
                  onClick={() => handleCopyCode(creatorProfile.creatorId)}
                >
                  {copiedRefId ? <Check size={13} /> : <Copy size={13} />}
                  {copiedRefId ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Stats Metrics Grid ── */}
        <div className="affiliate-stats-grid">
          <div className="affiliate-stat-box">
            <span className="affiliate-stat-label">ยอดคลิกลิงก์ & วิวทั้งหมด</span>
            <div className="affiliate-stat-value">
              {isRegistered ? `${(creatorProfile?.totalClicks ?? 0).toLocaleString()} ครั้ง` : '0 ครั้ง'}
            </div>
            <span className="affiliate-stat-sub">
              {isRegistered
                ? (creatorProfile && creatorProfile.totalClicks > 0 ? '+12% สัปดาห์นี้' : 'เริ่มแชร์ลิงก์หรือลงคลิปเพื่อสร้างยอดคลิก')
                : 'เริ่มลงคลิป/แชร์ลิงก์เพื่อสร้างยอดคลิก'}
            </span>
          </div>

          <div className="affiliate-stat-box">
            <span className="affiliate-stat-label">ออเดอร์จากตะกร้า/ลิงก์</span>
            <div className="affiliate-stat-value">
              {isRegistered ? `${(creatorProfile?.totalOrders ?? 0).toLocaleString()} ออเดอร์` : '0 ออเดอร์'}
            </div>
            <span className="affiliate-stat-sub">
              {isRegistered
                ? (creatorProfile && creatorProfile.totalOrders > 0
                    ? `อัตราสั่งซื้อ ${((creatorProfile.totalOrders / Math.max(1, creatorProfile.totalClicks)) * 100).toFixed(1)}%`
                    : 'รอคำสั่งซื้อแรกจากลูกค้า')
                : 'รอการสั่งซื้อแรก'}
            </span>
          </div>

          <div className="affiliate-stat-box" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="affiliate-stat-label" style={{ color: '#166534' }}>รายได้สะสม (Commission)</span>
              {isRegistered && (
                <button
                  className="affiliate-withdraw-trigger-btn"
                  onClick={() => setIsWithdrawModalOpen(true)}
                >
                  <Wallet size={12} /> ถอนเงิน
                </button>
              )}
            </div>
            <div className="affiliate-stat-value" style={{ color: '#15803D' }}>
              ฿{isRegistered ? (creatorProfile?.availableBalance ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            <span className="affiliate-stat-sub" style={{ color: '#166534' }}>
              {isRegistered ? 'ถอนเข้าบัญชีได้ทันที (หักภาษี 3%)' : 'สมัครเพื่อรับโบนัส ฿500'}
            </span>
          </div>

          <div className="affiliate-stat-box">
            <span className="affiliate-stat-label">อัตราค่าคอมมิชชั่น</span>
            <div className="affiliate-stat-value" style={{ color: '#2563EB' }}>
              {creatorProfile?.commissionRate || 15}.0%
            </div>
            <span className="affiliate-stat-sub">
              {isRegistered ? `ระดับ: ${creatorProfile?.tier || 'Silver'} ⭐` : 'เริ่มต้น 15% ทุกคำสั่งซื้อ'}
            </span>
          </div>
        </div>

        {/* ── 3-Step Simple How It Works (For All Users) ── */}
        {!isRegistered && (
          <section className="affiliate-how-it-works-section">
            <h2 className="affiliate-section-title">
              🚀 เริ่มต้นเป็นนายหน้าใน 3 ขั้นตอนง่ายๆ
            </h2>
            <div className="affiliate-steps-grid">
              <div className="affiliate-step-card">
                <div className="affiliate-step-num">1</div>
                <h4>สมัครฟรีใน 1 นาที</h4>
                <p>กรอกข้อมูลตัวตน ช่องทางโซเชียลมีเดีย และผูกบัญชีธนาคารรับเงิน อนุมัติทันที</p>
              </div>
              <div className="affiliate-step-card">
                <div className="affiliate-step-num">2</div>
                <h4>ปักตะกร้า หรือ แชร์ลิงก์</h4>
                <p>เลือกสินค้าที่ชอบจากคลังกว่า 50,000 ชิ้น ลงคลิปสั้นติดตะกร้าสีเหลือง หรือแชร์ลิงก์</p>
              </div>
              <div className="affiliate-step-card">
                <div className="affiliate-step-num">3</div>
                <h4>รับค่าคอมมิชชั่น 15%</h4>
                <p>เมื่อมีคนสั่งซื้อผ่านลิงก์หรือตะกร้าของคุณ รับเงินเข้ากระเป๋าและกดถอนได้ทันที 24 ชม.</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Creator Studio CTA Banner ── */}
        <section className="affiliate-studio-banner">
          <div className="affiliate-studio-banner-content">
            <div className="affiliate-studio-banner-text">
              <span className="affiliate-studio-tag">
                🎬 SHORT VIDEO CREATOR STUDIO
              </span>
              <h2 className="affiliate-studio-title">
                สตูดิโอสร้างคลิปสั้นโซเชียลติดตะกร้า (ความยาว ≤60 วินาที)
              </h2>
              <p className="affiliate-studio-desc">
                สร้างคลิปรีวิว/ป้ายยา พร้อมเครื่องมือตัดต่อ เลือกลงคลิป และปักตะกร้าสินค้าเพื่อรับค่าคอมมิชชั่นสูงสุด 15%
              </p>
            </div>
            <Link to="/video/create" className="affiliate-studio-btn">
              <Sparkles size={15} /> เปิด Creator Studio ➔
            </Link>
          </div>
        </section>

        {/* ── Quick Pin Video Section ── */}
        <section className="affiliate-tool-card">
          <h2 className="affiliate-tool-title">
            <Video size={18} style={{ color: '#2563EB' }} />
            อัปโหลดคลิปด่วนติดตะกร้าสินค้า (Quick Video Pin)
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            อัปโหลดวิดีโอรีวิว และเลือกสินค้าที่ต้องการปักหมุด คลิปของคุณจะไปแสดงในฟีดวิดีโอให้ลูกค้ากดซื้อได้ทันที
          </p>

          <form onSubmit={handlePublishVideo} className="affiliate-quick-form">
            <div className="affiliate-quick-form-grid">
              {/* Product Selector with Smart Modal Trigger */}
              <div>
                <label className="affiliate-form-label">
                  1. สินค้าที่จะติดตะกร้าสีเหลือง (คลัง 50,000+ รายการ):
                </label>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="affiliate-picker-trigger-btn"
                >
                  <span className="affiliate-picker-trigger-name">
                    🛒 {selectedProduct ? selectedProduct.name : 'คลิกเพื่อเลือกสินค้า...'}
                  </span>
                  <span className="affiliate-picker-trigger-tag">
                    เปลี่ยนสินค้า ➔
                  </span>
                </button>
              </div>

              {/* Commission Preview Card */}
              <div className="affiliate-earning-preview-box">
                <div>
                  <span className="affiliate-earning-preview-lbl">ค่าคอมมิชชั่นที่คุณจะได้รับ ({creatorProfile?.commissionRate || 15}%):</span>
                  <div className="affiliate-earning-preview-val">+฿{estimatedCommission.toLocaleString()} / ออเดอร์</div>
                </div>
                <div style={{ fontSize: 24 }}>💰</div>
              </div>
            </div>

            {/* Video Caption & Hashtags */}
            <div>
              <label className="affiliate-form-label">
                2. แคปชันป้ายยา & แฮชแท็ก:
              </label>
              <textarea
                rows={2}
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
                placeholder="เขียนแคปชันรีวิวชวนซื้อ..."
                className="affiliate-form-textarea"
              />
            </div>

            <div className="affiliate-form-submit-row">
              <button
                type="submit"
                disabled={isPublishing}
                className="affiliate-form-submit-btn"
              >
                {isPublishing ? 'กำลังประมวลผลคลิป...' : '🚀 โพสต์คลิปสั้นติดตะกร้าทันที'}
              </button>
              {publishedSuccess && (
                <div className="affiliate-publish-success-msg">
                  <CheckCircle size={16} />
                  <span>เผยแพร่วิดีโอสำเร็จแล้ว! <Link to="/video">ไปดูในฟีดวิดีโอ ➔</Link></span>
                </div>
              )}
            </div>
          </form>
        </section>

        {/* ── Link Generator Tool ── */}
        <section className="affiliate-tool-card">
          <h2 className="affiliate-tool-title">
            <Share2 size={18} style={{ color: '#2563EB' }} />
            สร้างลิงก์ป้ายยา (Affiliate Link Generator)
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            วางลิงก์สินค้า Movemall เพื่อแปลงเป็นลิงก์นายหน้าเฉพาะของคุณ ({activeRefCode}) นำไปแชร์บนโซเชียลมีเดียได้ทันที
          </p>

          <form onSubmit={handleGenerateLink} className="affiliate-input-group">
            <input
              type="text"
              value={productUrlInput}
              onChange={(e) => setProductUrlInput(e.target.value)}
              placeholder="วางลิงก์สินค้าที่นี่ เช่น https://movemall.app/product/el-1"
              className="affiliate-input"
            />
            <button type="submit" className="affiliate-btn">
              สร้างลิงก์ป้ายยา
            </button>
          </form>

          {generatedLink && (
            <div className="affiliate-generated-link-box">
              <span className="affiliate-generated-link-text">{generatedLink}</span>
              <button
                className="affiliate-share-btn"
                onClick={() => handleCopy(generatedLink)}
              >
                {copiedLink === generatedLink ? <Check size={14} /> : <Copy size={14} />}
                {copiedLink === generatedLink ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
              </button>
            </div>
          )}
        </section>

        {/* ── High Commission Products Header ── */}
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={18} style={{ color: '#DC2626' }} />
            สินค้าแนะนำ ค่าคอมมิชชั่นสูง (Top Commission Picks)
          </h2>
        </div>

        {/* High Commission Products — Responsive Desktop Table */}
        <div className="affiliate-table-desktop">
          <table className="affiliate-products-table">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>ราคาสินค้า</th>
                <th>อัตราค่าคอม</th>
                <th>รายได้ที่คุณจะได้รับ</th>
                <th>การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              {affiliateProducts.map((p) => {
                const itemLink = `https://movemall.app${getProductUrl(p)}?ref=${activeRefCode}`;
                return (
                  <tr key={p.id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        style={{ width: 44, height: 44, objectFit: 'cover', border: '1px solid var(--border)', borderRadius: 4 }}
                      />
                      <div>
                        <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>หมวด: {p.category}</div>
                      </div>
                    </td>
                    <td>฿{p.price.toLocaleString()}</td>
                    <td>
                      <span style={{ background: '#ECFDF5', color: '#059669', padding: '2px 6px', fontWeight: 800, borderRadius: 4 }}>
                        {p.commissionRate}%
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#059669', fontSize: 14 }}>
                        +฿{p.commissionAmount.toLocaleString()} / ชิ้น
                      </strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="affiliate-share-btn"
                          onClick={() => handleCopy(itemLink)}
                        >
                          {copiedLink === itemLink ? <Check size={14} /> : <Copy size={14} />}
                          {copiedLink === itemLink ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
                        </button>
                        <Link
                          to="/video/create"
                          className="affiliate-create-clip-sm-btn"
                        >
                          <Video size={13} /> สร้างคลิป
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* High Commission Products — Mobile Cards List */}
        <div className="affiliate-cards-mobile">
          {affiliateProducts.map((p) => {
            const itemLink = `https://movemall.app${getProductUrl(p)}?ref=${activeRefCode}`;
            return (
              <div key={p.id} className="affiliate-mobile-card">
                <div className="affiliate-mobile-card-top">
                  <img src={p.images[0]} alt={p.name} className="affiliate-mobile-card-thumb" />
                  <div className="affiliate-mobile-card-info">
                    <strong className="affiliate-mobile-card-name">{p.name}</strong>
                    <div className="affiliate-mobile-card-prices">
                      <span className="affiliate-mobile-card-price">฿{p.price.toLocaleString()}</span>
                      <span className="affiliate-mobile-card-rate">คอมมิชชั่น {p.commissionRate}%</span>
                    </div>
                    <div className="affiliate-mobile-card-earning">
                      รายได้ที่คุณจะได้รับ: <strong>+฿{p.commissionAmount.toLocaleString()}</strong> / ออเดอร์
                    </div>
                  </div>
                </div>

                <div className="affiliate-mobile-card-actions">
                  <button
                    className="affiliate-mobile-copy-btn"
                    onClick={() => handleCopy(itemLink)}
                  >
                    {copiedLink === itemLink ? <Check size={14} /> : <Copy size={14} />}
                    {copiedLink === itemLink ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
                  </button>
                  <Link
                    to="/video/create"
                    className="affiliate-mobile-create-video-btn"
                  >
                    <Video size={14} /> สร้างคลิปติดตะกร้า
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. Affiliate Registration Modal Wizard (4 Steps)
      ────────────────────────────────────────────────────────────── */}
      <AffiliateRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterSuccess}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. Withdraw Payout Modal with 3% Withholding Tax
      ────────────────────────────────────────────────────────────── */}
      {isWithdrawModalOpen && (
        <div className="affiliate-modal-overlay" onClick={() => setIsWithdrawModalOpen(false)}>
          <div className="affiliate-modal-container" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="affiliate-modal-header">
              <div className="affiliate-modal-header-left">
                <span className="affiliate-modal-badge">
                  <Wallet size={13} /> PAYOUT SETTLEMENT
                </span>
                <h3 className="affiliate-modal-title">💸 ถอนเงินค่านายหน้าเข้าบัญชี</h3>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="affiliate-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmWithdraw} className="affiliate-modal-body">
              {withdrawSuccessMsg ? (
                <div className="affiliate-withdraw-success-box">
                  <CheckCircle size={40} style={{ color: '#10B981', margin: '0 auto 12px' }} />
                  <h4>ส่งคำขอถอนเงินสำเร็จ!</h4>
                  <p>{withdrawSuccessMsg}</p>
                </div>
              ) : (
                <>
                  <div className="affiliate-withdraw-balance-banner">
                    <div>
                      <span style={{ fontSize: 11, color: '#166534' }}>ยอดเงินที่สามารถถอนได้:</span>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#15803D' }}>
                        ฿{(creatorProfile?.availableBalance || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ fontSize: 28 }}>💰</div>
                  </div>

                  <div className="affiliate-form-group" style={{ marginBottom: 14 }}>
                    <label className="affiliate-label">จำนวนเงินที่ต้องการถอน (บาท) *</label>
                    <input
                      type="number"
                      min={100}
                      max={creatorProfile?.availableBalance || 500}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="ขั้นต่ำ ฿100"
                      className="affiliate-form-input"
                      required
                    />
                  </div>

                  {/* Calculation Breakdown */}
                  <div className="affiliate-withdraw-breakdown">
                    <div className="affiliate-summary-row">
                      <span className="affiliate-summary-lbl">ยอดเงินที่ขอถอน:</span>
                      <span className="affiliate-summary-val">฿{Number(withdrawAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="affiliate-summary-row">
                      <span className="affiliate-summary-lbl">หักภาษี ณ ที่จ่าย 3% (e-WHT):</span>
                      <span className="affiliate-summary-val" style={{ color: '#DC2626' }}>
                        -฿{(Number(withdrawAmount || 0) * 0.03).toFixed(2)}
                      </span>
                    </div>
                    <div className="affiliate-summary-row" style={{ fontWeight: 800 }}>
                      <span className="affiliate-summary-lbl" style={{ color: '#0F172A' }}>ยอดเงินสุทธิที่จะได้รับ:</span>
                      <span className="affiliate-summary-val" style={{ color: '#059669', fontSize: 15 }}>
                        ฿{(Number(withdrawAmount || 0) * 0.97).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Bank Info Destination */}
                  <div className="affiliate-withdraw-dest-box">
                    <CreditCard size={16} style={{ color: '#2563EB' }} />
                    <span style={{ fontSize: 12, color: '#1E3A8A' }}>
                      โอนเข้าบัญชี: <strong>{creatorProfile?.bankName} (xxx-{creatorProfile?.bankAccountNumber.slice(-4)})</strong>
                    </span>
                  </div>

                  <div className="affiliate-modal-footer" style={{ padding: '14px 0 0', margin: '14px 0 0', borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => setIsWithdrawModalOpen(false)}
                      className="affiliate-btn-secondary"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) < 100}
                      className="affiliate-btn-primary"
                    >
                      {isWithdrawing ? 'กำลังส่งคำขอ...' : 'ยืนยันการถอนเงิน ➔'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. Product Picker Modal Drawer
      ────────────────────────────────────────────────────────────── */}
      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectProduct={(p) => setSelectedProductId(p.id)}
        alreadyPinnedIds={[selectedProductId]}
      />
    </main>
  );
}

export default AffiliatePage;
