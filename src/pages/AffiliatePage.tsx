// src/pages/AffiliatePage.tsx — Movemall Creator & Affiliate Hub (Clean Minimalist Theme)

import { useState } from 'react';
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
} from 'lucide-react';
import { products } from '../data/products';
import { mockLiveStreams } from '../data/liveStreams';
import { ProductPickerModal } from '../components/ProductPickerModal';
import type { Product } from '../types';
import './AffiliatePage.css';

interface AffiliatePageProps {
  onCopySuccess?: (msg: string) => void;
}

export function AffiliatePage({ onCopySuccess }: AffiliatePageProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [productUrlInput, setProductUrlInput] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Video Upload with Yellow Basket Form State
  const [selectedProductId, setSelectedProductId] = useState(products[0].id);
  const [videoCaption, setVideoCaption] = useState('👗 แกะกล่องป้ายยาของดีใน Movemall ใส่แล้วสวยมากกก ปักตะกร้าสีเหลืองด้านล่างเลยค่ะ!');
  const [videoHashtags, setVideoHashtags] = useState('#ป้ายยาของดี #MovemallVideo #ตะกร้าสีเหลือง');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // Sample high commission products
  const affiliateProducts = products.slice(0, 8).map((p) => ({
    ...p,
    commissionRate: 15,
    commissionAmount: Math.round(p.price * 0.15),
  }));

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const estimatedCommission = Math.round(selectedProduct.price * 0.15);

  function handleGenerateLink(e: React.FormEvent) {
    e.preventDefault();
    const cleanUrl = productUrlInput.trim() || 'https://movemall.app/product/el-1';
    const finalAffLink = `${cleanUrl}?ref=creator_movemall_889`;
    setGeneratedLink(finalAffLink);
  }

  function handleCopy(link: string) {
    navigator.clipboard?.writeText(link);
    setCopiedLink(link);
    onCopySuccess?.('คัดลอกลิงก์ป้ายยา Affiliate สำเร็จแล้ว!');
    setTimeout(() => setCopiedLink(null), 2500);
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
        channelName: 'ฉัน (Creator Affiliate)',
        storeLogo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
        streamerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
        streamerName: 'ฉัน (My Channel)',
        caption: videoCaption,
        hashtags: videoHashtags.split(' '),
        soundTitle: 'เสียงต้นฉบับ - My Creator Studio 🎵',
        category: selectedProduct.category,
        viewers: '1.2k วิว',
        likesCount: 120,
        commentsCount: 8,
        sharesCount: 14,
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-modern-smartphone-and-headphones-41274-large.mp4',
        coverImage: selectedProduct.images[0],
        badge: '🌟 MY BASKET',
        pinnedProduct: {
          id: selectedProduct.id,
          name: selectedProduct.name,
          image: selectedProduct.images[0],
          price: selectedProduct.price,
          originalPrice: selectedProduct.originalPrice || selectedProduct.price * 1.5,
          discountPct: 30,
          commissionRate: 15,
          commissionAmount: estimatedCommission,
        },
        comments: [
          { user: 'Movemall Bot', text: 'คลิปวิดีโอติดตะกร้าของคุณเริ่มเผยแพร่แล้ว 🎉', time: 'เมื่อสักครู่' },
        ],
      };

      mockLiveStreams.unshift(newVideo);
      setIsPublishing(false);
      setPublishedSuccess(true);
      onCopySuccess?.('เผยแพร่วิดีโอสั้นติดตะกร้าสินค้าสำเร็จแล้ว! ไปดูในฟีดวิดีโอได้เลย');
    }, 800);
  }

  return (
    <main className="affiliate-page">
      <div className="affiliate-container">
        {/* ── Hero Banner (Royal Blue Clean) ── */}
        <section className="affiliate-hero">
          <span className="affiliate-hero-badge">MOVEMALL CREATOR & AFFILIATE</span>
          <h1 className="affiliate-hero__title">
            👥 ศูนย์รวมนายหน้า & วิดีโอป้ายยาติดตะกร้า
          </h1>
          <p className="affiliate-hero__desc">
            สร้างรายได้ง่ายๆ ด้วยการลงคลิปวิดีโอสั้นติดตะกร้าสินค้า และแชร์ลิงก์ป้ายยา รับค่าคอมมิชชั่นสูงสุด 15% ทุกคำสั่งซื้อ
          </p>
        </section>

        {/* ── Stats Metrics Grid ── */}
        <div className="affiliate-stats-grid">
          <div className="affiliate-stat-box">
            <span className="affiliate-stat-label">ยอดวิวคลิปทั้งหมด</span>
            <div className="affiliate-stat-value">28,450 วิว</div>
            <span className="affiliate-stat-sub">+34% สัปดาห์นี้</span>
          </div>
          <div className="affiliate-stat-box">
            <span className="affiliate-stat-label">ออเดอร์จากตะกร้า</span>
            <div className="affiliate-stat-value">124 ออเดอร์</div>
            <span className="affiliate-stat-sub">อัตราสั่งซื้อ 5.8%</span>
          </div>
          <div className="affiliate-stat-box">
            <span className="affiliate-stat-label">รายได้สะสม (Commission)</span>
            <div className="affiliate-stat-value" style={{ color: '#10B981' }}>฿9,420</div>
            <span className="affiliate-stat-sub">ถอนเงินเข้าบัญชีได้ทันที</span>
          </div>
          <div className="affiliate-stat-box">
            <span className="affiliate-stat-label">อัตราค่าคอมเฉลี่ย</span>
            <div className="affiliate-stat-value" style={{ color: '#2563EB' }}>15.0%</div>
            <span className="affiliate-stat-sub">ระดับ Creator: Gold ⭐</span>
          </div>
        </div>

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
                  <span className="affiliate-earning-preview-lbl">ค่าคอมมิชชั่นที่คุณจะได้รับ (15%):</span>
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
            วางลิงก์สินค้า Movemall เพื่อแปลงเป็นลิงก์นายหน้าเฉพาะของคุณ นำไปแชร์บนโซเชียลมีเดียได้ทันที
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
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            🔥 สินค้าแนะนำ ค่าคอมมิชชั่นสูง (Top Commission Picks)
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
                const itemLink = `https://movemall.app/product/${p.id}?ref=creator_889`;
                return (
                  <tr key={p.id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        style={{ width: 44, height: 44, objectFit: 'cover', border: '1px solid var(--border)' }}
                      />
                      <div>
                        <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>หมวด: {p.category}</div>
                      </div>
                    </td>
                    <td>฿{p.price.toLocaleString()}</td>
                    <td>
                      <span style={{ background: '#ECFDF5', color: '#059669', padding: '2px 6px', fontWeight: 800 }}>
                        {p.commissionRate}%
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#059669', fontSize: 14 }}>
                        +฿{p.commissionAmount.toLocaleString()} / ชิ้น
                      </strong>
                    </td>
                    <td>
                      <button
                        className="affiliate-share-btn"
                        onClick={() => handleCopy(itemLink)}
                      >
                        {copiedLink === itemLink ? <Check size={14} /> : <Copy size={14} />}
                        {copiedLink === itemLink ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
                      </button>
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
            const itemLink = `https://movemall.app/product/${p.id}?ref=creator_889`;
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

      {/* Product Picker Modal Drawer (Enterprise Scale 50,000+ items) */}
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
