// src/pages/VideoStudioPage.tsx — Creator Short Video Studio (3 Tabs Wizard Flow)

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Sparkles,
  Video,
  Scissors,
  Plus,
  Trash2,
  DollarSign,
  ArrowLeft,
  AlertTriangle,
  Eye,
  Search,
} from 'lucide-react';
import { products } from '../data/products';
import { ProductPickerModal } from '../components/ProductPickerModal';
import {
  getVideoMetadata,
  formatFileSize,
  formatDuration,
  optimizeAndCompressVideo,
  type VideoMetadata,
} from '../utils/videoProcessor';
import type {
  Product,
  PinnedProductItem,
  VideoClip,
} from '../types';
import './VideoStudioPage.css';
import { onImageError } from '../utils/imageFallback';

interface VideoStudioPageProps {
  onPublishClip: (clip: VideoClip) => void;
}

const SAMPLE_VIDEOS = [
  {
    name: '🎧 รีวิวหูฟัง Pro ANC ตัดเสียงรบกวน (ไอที)',
    url: '/videos/live-streamer-1.mp4',
    simulatedSize: 24500000,
    defaultProduct: products.find((p) => p.category === 'electronics') || products[0],
  },
  {
    name: '👗 ป้ายยาเดรสแฟชั่นสไตล์เกาหลี (แฟชั่น)',
    url: '/videos/live-streamer-2.mp4',
    simulatedSize: 18200000,
    defaultProduct: products.find((p) => p.category === 'fashion') || products[1],
  },
  {
    name: '💄 สกินแคร์เซรั่มไฮยาหน้าใส (บิวตี้)',
    url: '/videos/live-streamer-3.mp4',
    simulatedSize: 29000000,
    defaultProduct: products.find((p) => p.category === 'beauty') || products[2],
  },
  {
    name: '🧹 หุ่นยนต์ดูดฝุ่นถูพื้นอัจฉริยะ (ของใช้ในบ้าน)',
    url: '/videos/live-streamer-4.mp4',
    simulatedSize: 34000000,
    defaultProduct: products.find((p) => p.category === 'home') || products[3],
  },
  {
    name: '🏃 สมาร์ทวอทช์ GPS จอ AMOLED (กีฬา)',
    url: '/videos/live-streamer-5.mp4',
    simulatedSize: 22000000,
    defaultProduct: products.find((p) => p.category === 'sports') || products[4],
  },
  {
    name: '🤤 ทุเรียนหมอนทองฟรีซดราย (อาหาร & ขนม)',
    url: '/videos/live-streamer-6.mp4',
    simulatedSize: 16500000,
    defaultProduct: products.find((p) => p.category === 'food') || products[5],
  },
  {
    name: '⌨️ คีย์บอร์ดกลไกไร้สาย Custom RGB (แกดเจ็ต)',
    url: '/videos/sample-vertical.mp4',
    simulatedSize: 21000000,
    defaultProduct: products.find((p) => p.id === 'el-2') || products[0],
  },
];

const SUGGESTED_HASHTAGS = [
  '#รีวิวของดี',
  '#MovemallVideo',
  '#ป้ายยาช้อปปี้',
  '#ของมันต้องมี',
  '#ตะกร้าสีเหลือง',
  '#ช้อปปิ้งออนไลน์',
  '#ลดราคาพิเศษ',
];

const TRENDING_SOUNDS = [
  { title: 'เสียงต้นฉบับ - Creator Official 🎵', artist: 'My Studio' },
  { title: 'T-Pop Trending Beat 2026 🎶', artist: 'Viral Sound TH' },
  { title: 'Aesthetic Chill Beat 🌿', artist: 'Lofi Records' },
  { title: 'Energetic Shopping Beat ⚡', artist: 'TikTok Viral Beats' },
];

export function VideoStudioPage({ onPublishClip }: VideoStudioPageProps) {
  const navigate = useNavigate();

  // Wizard Step State: 1 = Video, 2 = Basket, 3 = Caption & Post
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Video Source State
  const [videoSourceType, setVideoSourceType] = useState<'upload' | 'sample'>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Trimming State (Max 60s rule)
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(60);

  // Post Metadata State
  const [caption, setCaption] = useState('🌟 ป้ายยาไอเทมเด็ดที่ต้องมีใน Movemall! ปักตะกร้าสีเหลืองลดพิเศษ พร้อมส่งฟรี 0 บาทน้าา 💛');
  const [hashtags, setHashtags] = useState<string[]>(['#ป้ายยาของดี', '#MovemallVideo', '#ตะกร้าสีเหลือง']);
  const [selectedSound, setSelectedSound] = useState(TRENDING_SOUNDS[0].title);
  const [selectedCategory] = useState('electronics');

  // Yellow Basket Pinned Product Selector
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pinnedProducts, setPinnedProducts] = useState<PinnedProductItem[]>([
    {
      id: products[0].id,
      name: products[0].name,
      image: products[0].images[0],
      price: products[0].price,
      originalPrice: products[0].originalPrice || products[0].price * 1.5,
      discountPct: 40,
      commissionRate: 15,
      commissionAmount: Math.round(products[0].price * 0.15),
      salesCount: 320,
      badge: '👑 Official Mall',
      rating: 4.9,
    },
  ]);

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Handle File Upload
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    try {
      const meta = await getVideoMetadata(file);
      setMetadata(meta);
      setTrimStart(0);
      setTrimEnd(Math.min(meta.duration, 60));
    } catch (err) {
      console.warn(err);
    }
  }

  // Handle Sample Video Select
  async function handleSelectSample(sample: (typeof SAMPLE_VIDEOS)[0]) {
    setVideoFile(null);
    setVideoUrl(sample.url);

    if (sample.defaultProduct) {
      setPinnedProducts([
        {
          id: sample.defaultProduct.id,
          name: sample.defaultProduct.name,
          image: sample.defaultProduct.images[0],
          price: sample.defaultProduct.price,
          originalPrice: sample.defaultProduct.originalPrice || sample.defaultProduct.price * 1.4,
          discountPct: 35,
          commissionRate: 15,
          commissionAmount: Math.round(sample.defaultProduct.price * 0.15),
          salesCount: 450,
          badge: '⚡ FLASH DEAL',
          rating: 4.9,
        },
      ]);
    }

    try {
      const meta = await getVideoMetadata(sample.url);
      setMetadata({
        ...meta,
        fileSizeBytes: sample.simulatedSize,
        formattedSize: formatFileSize(sample.simulatedSize),
      });
      setTrimStart(0);
      setTrimEnd(Math.min(meta.duration, 60));
    } catch (err) {
      console.warn(err);
    }
  }

  // Add Tagged Product
  function handleAddProduct(product: Product) {
    if (pinnedProducts.some((p) => p.id === product.id)) return;
    if (pinnedProducts.length >= 3) {
      alert('สามารถปักตะกร้าได้สูงสุด 3 ชิ้นต่อคลิป');
      return;
    }

    const newPinned: PinnedProductItem = {
      id: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      originalPrice: product.originalPrice || product.price * 1.3,
      discountPct: Math.round(Math.random() * 30 + 20),
      commissionRate: 12,
      commissionAmount: Math.round(product.price * 0.12),
      salesCount: Math.round(Math.random() * 500 + 100),
      badge: '✨ ไอเทมแนะนำ',
      rating: 4.8,
    };

    setPinnedProducts([...pinnedProducts, newPinned]);
  }

  function handleRemoveProduct(id: string) {
    setPinnedProducts(pinnedProducts.filter((p) => p.id !== id));
  }

  function handleToggleHashtag(tag: string) {
    if (hashtags.includes(tag)) {
      setHashtags(hashtags.filter((t) => t !== tag));
    } else {
      setHashtags([...hashtags, tag]);
    }
  }

  // Publish Clip (Background Auto-Optimized)
  async function handlePublish() {
    if (!videoUrl) {
      alert('กรุณาเลือกหรืออัปโหลดวิดีโอก่อน');
      setCurrentStep(1);
      return;
    }

    if (pinnedProducts.length === 0) {
      alert('กรุณาเลือกสินค้าปักตะกร้าสีเหลืองอย่างน้อย 1 ชิ้น');
      setCurrentStep(2);
      return;
    }

    // Run Background Compression Optimization silently
    let optimizedSize = 4800000;
    try {
      let dummyFile = videoFile || new File(['mock_video'], 'clip.mp4', { type: 'video/mp4' });
      const compResult = await optimizeAndCompressVideo(
        dummyFile,
        { start: trimStart, end: trimEnd },
        'balanced'
      );
      optimizedSize = compResult.compressedSize;
    } catch {
      // Fallback
    }

    const duration = Math.min(metadata?.duration || 30, 60);

    const newClip: VideoClip = {
      id: `clip-custom-${Date.now()}`,
      creatorId: 'my-user-creator',
      creatorName: 'ฉัน (Movemall Creator)',
      creatorHandle: '@my_official_shop',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
      verified: true,
      isFollowed: false,
      caption,
      hashtags,
      soundTitle: selectedSound,
      soundAuthor: 'Creator Audio',
      category: selectedCategory,
      videoUrl: videoUrl,
      coverImage: pinnedProducts[0]?.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
      durationSeconds: Math.round(duration),
      fileSizeBytes: optimizedSize,
      originalSizeBytes: metadata?.fileSizeBytes || 25000000,
      compressionRatioPct: 78,
      likesCount: 1,
      isLiked: true,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 12,
      pinnedProducts,
      comments: [
        {
          id: `cm-${Date.now()}`,
          userId: 'movemall-bot',
          userName: 'Movemall Video Bot 🤖',
          text: 'เผยแพร่คลิปพร้อมตะกร้าแล้ว',
          time: 'เมื่อสักครู่',
          likesCount: 1,
          badge: 'ระบบ',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage for persistence
    const saved = localStorage.getItem('movemall_custom_clips');
    const existing: VideoClip[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem('movemall_custom_clips', JSON.stringify([newClip, ...existing]));

    onPublishClip(newClip);
    navigate('/video');
  }

  const filteredSearchProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchProductQuery.toLowerCase())
  ).slice(0, 5);

  const totalEstimatedCommission = pinnedProducts.reduce(
    (sum, p) => sum + (p.commissionAmount || 0),
    0
  );

  return (
    <main className="video-studio-page">
      <div className="video-studio-container">
        {/* Top Header */}
        <div className="studio-header">
          <div className="studio-header-title-wrap">
            <button className="studio-back-btn" onClick={() => navigate('/video')}>
              <ArrowLeft size={16} /> ฟีด
            </button>
            <h1 className="studio-title">🎬 สตูดิโอสร้างคลิป</h1>
          </div>

          {/* Stepper Tabs Bar */}
          <div className="studio-stepper-tabs">
            <button
              className={`studio-stepper-tab ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
              onClick={() => setCurrentStep(1)}
            >
              <span className="studio-stepper-num">1</span>
              <span>เลือกคลิป</span>
            </button>
            <button
              className={`studio-stepper-tab ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
              onClick={() => setCurrentStep(2)}
            >
              <span className="studio-stepper-num">2</span>
              <span>ปักตะกร้า</span>
            </button>
            <button
              className={`studio-stepper-tab ${currentStep === 3 ? 'active' : ''}`}
              onClick={() => setCurrentStep(3)}
            >
              <span className="studio-stepper-num">3</span>
              <span>แคปชัน & โพสต์</span>
            </button>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="studio-grid">
          {/* Left Column: Form & Tools */}
          <div className="studio-controls-col">
            {/* ─── TAB 1: Video Source & Trim ─── */}
            {currentStep === 1 && (
              <div className="studio-card">
                <div className="studio-card-header">
                  <div className="studio-step-num">1</div>
                  <h3 className="studio-card-title">เลือกไฟล์วิดีโอ (ความยาวไม่เกิน 60 วินาที)</h3>
                </div>

                {/* Source Toggle */}
                <div className="studio-source-tabs">
                  <button
                    className={`studio-source-tab ${videoSourceType === 'upload' ? 'active' : ''}`}
                    onClick={() => setVideoSourceType('upload')}
                  >
                    <Upload size={16} /> อัปโหลดจากอุปกรณ์
                  </button>
                  <button
                    className={`studio-source-tab ${videoSourceType === 'sample' ? 'active' : ''}`}
                    onClick={() => setVideoSourceType('sample')}
                  >
                    <Sparkles size={16} /> เลือกคลิปตัวอย่างทดสอบ
                  </button>
                </div>

                {videoSourceType === 'upload' ? (
                  <div className="studio-upload-zone">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleFileSelect}
                      id="video-upload-input"
                      className="studio-file-input"
                    />
                    <label htmlFor="video-upload-input" className="studio-upload-label">
                      <Video size={40} className="studio-upload-icon" />
                      <span className="studio-upload-maintext">คลิกเพื่อเลือกไฟล์วิดีโอ หรือลากไฟล์มาวางที่นี่</span>
                      <span className="studio-upload-subtext">รองรับ MP4, MOV, WebM (แนะนำแนวตั้ง 9:16 ความยาว ≤ 60s)</span>
                    </label>
                  </div>
                ) : (
                  <div className="studio-samples-list">
                    {SAMPLE_VIDEOS.map((sample, i) => (
                      <button
                        key={i}
                        className={`studio-sample-btn ${videoUrl === sample.url ? 'selected' : ''}`}
                        onClick={() => handleSelectSample(sample)}
                      >
                        <Video size={18} />
                        <div className="studio-sample-text">
                          <span className="studio-sample-name">{sample.name}</span>
                          <span className="studio-sample-meta">ขนาดไฟล์จำลอง {formatFileSize(sample.simulatedSize)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Video Metadata Inspector & Max 60s Rule */}
                {metadata && (
                  <div className="studio-meta-box">
                    <div className="studio-meta-row">
                      <span>ความยาวคลิป: <strong>{formatDuration(metadata.duration)}</strong></span>
                      <span>ขนาดไฟล์เดิม: <strong>{metadata.formattedSize}</strong></span>
                      <span>สัดส่วน: <strong>{metadata.aspectRatio}</strong></span>
                    </div>

                    {metadata.isOverLimit && (
                      <div className="studio-warning-banner">
                        <AlertTriangle size={16} color="#DC2626" />
                        <span>คลิปเกิน 60 วินาที ระบบจะตัดให้อัตโนมัติ</span>
                      </div>
                    )}

                    {/* Trimmer Slider */}
                    <div className="studio-trim-slider-wrap">
                      <div className="studio-trim-header">
                        <span className="studio-trim-label"><Scissors size={14} /> ตัดความยาวคลิป (0 - 60s):</span>
                        <span className="studio-trim-val">
                          {formatDuration(trimStart)} - {formatDuration(trimEnd)} ({Math.round(trimEnd - trimStart)} วินาที)
                        </span>
                      </div>
                      <div className="studio-range-inputs">
                        <input
                          type="range"
                          min={0}
                          max={Math.min(metadata.duration, 60)}
                          value={trimEnd}
                          onChange={(e) => setTrimEnd(Number(e.target.value))}
                          className="studio-range-slider"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1 Actions */}
                <div className="studio-step-actions">
                  <button
                    className="studio-next-btn"
                    onClick={() => {
                      if (!videoUrl) {
                        alert('กรุณาเลือกหรืออัปโหลดวิดีโอก่อนไปขั้นตอนถัดไป');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                  >
                    ถัดไป: ปักตะกร้าสินค้า ➔
                  </button>
                </div>
              </div>
            )}

            {/* ─── TAB 2: Yellow Basket Product Selection ─── */}
            {currentStep === 2 && (
              <div className="studio-card">
                <div className="studio-card-header">
                  <div className="studio-step-num">2</div>
                  <h3 className="studio-card-title">🟡 ปักตะกร้าสินค้าสีเหลือง (Yellow Basket)</h3>
                </div>

                <p className="studio-card-desc">
                  เลือกสินค้ามาปักในคลิปเพื่อรับค่าคอมมิชชัน
                </p>

                {/* Smart Product Picker Button & Search Input */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="studio-next-btn"
                    onClick={() => setIsPickerOpen(true)}
                    style={{ background: '#F59E0B', color: '#111827', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900 }}
                  >
                    <Plus size={16} /> ค้นหา & เลือกสินค้าจากคลัง (50,000+ รายการ)
                  </button>
                </div>

                <div className="studio-product-search">
                  <Search size={16} className="studio-search-icon" />
                  <input
                    type="text"
                    value={searchProductQuery}
                    onChange={(e) => setSearchProductQuery(e.target.value)}
                    placeholder="หรือพิมพ์ค้นหาด่วนที่นี่ เช่น หูฟัง, เดรส, เซรั่ม..."
                    className="studio-search-input"
                  />
                </div>

                {/* Search Results Dropdown/List */}
                {searchProductQuery && (
                  <div className="studio-search-results">
                    {filteredSearchProducts.map((prod) => (
                      <div key={prod.id} className="studio-search-item">
                        <img src={prod.images[0]} alt={prod.name} className="studio-search-thumb" onError={onImageError} />
                        <div className="studio-search-info">
                          <span className="studio-search-title">{prod.name}</span>
                          <span className="studio-search-price">฿{prod.price.toLocaleString()}</span>
                        </div>
                        <button
                          className="studio-search-add-btn"
                          onClick={() => {
                            handleAddProduct(prod);
                            setSearchProductQuery('');
                          }}
                        >
                          <Plus size={14} /> ปักหมุด
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pinned Products List */}
                <div className="studio-pinned-section">
                  <h4 className="studio-pinned-title">
                    สินค้าที่ปักหมุดในคลิป ({pinnedProducts.length}/3 ชิ้น):
                  </h4>

                  <div className="studio-pinned-list">
                    {pinnedProducts.map((item) => (
                      <div key={item.id} className="studio-pinned-item">
                        <img src={item.image} alt={item.name} className="studio-pinned-thumb" onError={onImageError} />
                        <div className="studio-pinned-info">
                          <span className="studio-pinned-name">{item.name}</span>
                          <div className="studio-pinned-meta">
                            <span className="studio-pinned-price">฿{item.price.toLocaleString()}</span>
                            <span className="studio-pinned-comm">
                              คอมมิชชัน ~฿{item.commissionAmount} ({item.commissionRate}%)
                            </span>
                          </div>
                        </div>
                        <button
                          className="studio-pinned-remove-btn"
                          onClick={() => handleRemoveProduct(item.id)}
                          title="ลบออก"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estimated Earning Card */}
                <div className="studio-earnings-card">
                  <DollarSign size={20} color="#10B981" />
                  <div className="studio-earnings-text">
                    <span className="studio-earnings-title">ค่าคอมมิชชันโดยประมาณ</span>
                    <span className="studio-earnings-desc">
                      รับสูงสุด <strong>฿{totalEstimatedCommission.toLocaleString()}</strong> / ออเดอร์
                    </span>
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="studio-step-actions studio-step-actions--dual">
                  <button className="studio-prev-btn" onClick={() => setCurrentStep(1)}>
                    ← ย้อนกลับ
                  </button>
                  <button
                    className="studio-next-btn"
                    onClick={() => {
                      if (pinnedProducts.length === 0) {
                        alert('กรุณาเลือกสินค้าปักตะกร้าอย่างน้อย 1 ชิ้น');
                        return;
                      }
                      setCurrentStep(3);
                    }}
                  >
                    ถัดไป: ใส่แคปชัน ➔
                  </button>
                </div>
              </div>
            )}

            {/* ─── TAB 3: Caption, Sound & Hashtags ─── */}
            {currentStep === 3 && (
              <div className="studio-card">
                <div className="studio-card-header">
                  <div className="studio-step-num">3</div>
                  <h3 className="studio-card-title">📝 แคปชัน, เพลงฮิต & แฮชแท็ก</h3>
                </div>

                {/* Caption */}
                <div className="studio-field">
                  <label className="studio-label">แคปชันป้ายยา:</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="studio-textarea"
                    rows={3}
                    placeholder="เขียนแคปชันชวนกดตะกร้าเหลือง..."
                  />
                </div>

                {/* Hashtags */}
                <div className="studio-field">
                  <label className="studio-label">แฮชแท็กติดเทรนด์ (คลิกเพื่อเลือก):</label>
                  <div className="studio-hashtags-cloud">
                    {SUGGESTED_HASHTAGS.map((tag) => (
                      <button
                        key={tag}
                        className={`studio-hashtag-btn ${hashtags.includes(tag) ? 'active' : ''}`}
                        onClick={() => handleToggleHashtag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sound Selection */}
                <div className="studio-field">
                  <label className="studio-label">🎵 เพลงประกอบคลิป:</label>
                  <select
                    value={selectedSound}
                    onChange={(e) => setSelectedSound(e.target.value)}
                    className="studio-select"
                  >
                    {TRENDING_SOUNDS.map((s, i) => (
                      <option key={i} value={s.title}>
                        {s.title} — {s.artist}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 3 Actions */}
                <div className="studio-step-actions studio-step-actions--dual">
                  <button className="studio-prev-btn" onClick={() => setCurrentStep(2)}>
                    ← ย้อนกลับ
                  </button>
                  <button className="studio-publish-btn" onClick={handlePublish}>
                    🚀 เผยแพร่คลิปวิดีโอทันที
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: 9:16 Live Phone Mockup Preview */}
          <div className="studio-preview-col">
            <div className="studio-sticky-preview">
              <div className="studio-preview-header">
                <span className="studio-preview-badge">
                  <Eye size={14} /> LIVE PREVIEW (9:16)
                </span>
                <span className="studio-preview-device-lbl">หน้าจอผู้ชมจริง</span>
              </div>

              {/* Phone Frame */}
              <div className="studio-phone-frame">
                {videoUrl ? (
                  <video
                    ref={previewVideoRef}
                    src={videoUrl}
                    className="studio-phone-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <div className="studio-phone-placeholder">
                    <Video size={48} color="#64748b" />
                    <span>ยังไม่ได้เลือกวิดีโอ</span>
                  </div>
                )}

                {/* Phone Right Sidebar Mock */}
                <div className="studio-phone-sidebar">
                  <div className="studio-phone-avatar">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80"
                      alt="Me"
                    onError={onImageError} />
                  </div>
                  <div className="studio-phone-icon">❤️</div>
                  <div className="studio-phone-icon">💬</div>
                  <div className="studio-phone-icon">↗️</div>
                  <div className="studio-phone-disc">🎵</div>
                </div>

                {/* Phone Bottom Yellow Basket Overlay */}
                <div className="studio-phone-bottom">
                  {pinnedProducts.length > 0 && (
                    <div className="studio-phone-yellow-basket">
                      <span className="studio-phone-basket-tag">🟡 ตะกร้าสีเหลือง</span>
                      <div className="studio-phone-basket-body">
                        <img
                          src={pinnedProducts[0].image}
                          alt={pinnedProducts[0].name}
                          className="studio-phone-basket-thumb"
                        onError={onImageError} />
                        <div className="studio-phone-basket-info">
                          <span className="studio-phone-basket-title">
                            {pinnedProducts[0].name}
                          </span>
                          <span className="studio-phone-basket-price">
                            ฿{pinnedProducts[0].price.toLocaleString()}
                          </span>
                        </div>
                        <button className="studio-phone-basket-btn">ซื้อเลย</button>
                      </div>
                    </div>
                  )}

                  <div className="studio-phone-caption-box">
                    <span className="studio-phone-author">@my_official_shop</span>
                    <p className="studio-phone-caption">{caption}</p>
                    <div className="studio-phone-tags">
                      {hashtags.map((t, idx) => (
                        <span key={idx}>{t} </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Picker Modal Drawer (Enterprise Scale 50,000+ items) */}
      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectProduct={handleAddProduct}
        alreadyPinnedIds={pinnedProducts.map((p) => p.id)}
      />
    </main>
  );
}

export default VideoStudioPage;
