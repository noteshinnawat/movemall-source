// src/components/ReviewsSection.tsx — Customer Reviews with Complete Star Filters, Media & Pagination

import { useState, useRef } from 'react';
import { Star, ThumbsUp, Edit3, CheckCircle, Image, Video, X, Play, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProductReviews, type ProductReview } from '../data/reviews';
import { compressImage } from '../utils/mediaCompressor';
import './ReviewsSection.css';

interface ReviewsSectionProps {
  productId: string;
  rating: number;
  reviewCount: number;
}

export function ReviewsSection({ productId, rating, reviewCount }: ReviewsSectionProps) {
  const initialReviews = getProductReviews(productId);
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1' | 'media' | 'comment'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [helpfulGiven, setHelpfulGiven] = useState<Record<string, boolean>>({});
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PAGE_SIZE = 5;

  // Form State
  const [formRating, setFormRating] = useState(5);
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formVideo, setFormVideo] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formImages.length >= 3) {
      alert('แนบรูปภาพได้สูงสุด 3 รูปครับ');
      return;
    }

    setIsCompressing(true);
    try {
      const file = files[0];
      const result = await compressImage(file, 1000, 1000, 0.8);
      setFormImages(prev => [...prev, result.dataUrl]);
    } catch (err) {
      console.error('Compression error:', err);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleAddSamplePhoto() {
    if (formImages.length >= 3) {
      alert('แนบรูปภาพได้สูงสุด 3 รูปครับ');
      return;
    }
    const samplePhotos = [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    ];
    const newPhoto = samplePhotos[formImages.length % samplePhotos.length];
    setFormImages(prev => [...prev, newPhoto]);
  }

  function handleAddSampleVideo() {
    setFormVideo('/videos/live-streamer-1.mp4');
  }

  function handleRemovePhoto(index: number) {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  }

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formComment.trim()) return;

    const newReview: ProductReview = {
      id: `rev-${Date.now()}`,
      productId,
      userName: formName.trim(),
      rating: formRating,
      date: 'วันนี้',
      title: formTitle.trim() || 'รีวิวสินค้า',
      comment: formComment.trim(),
      images: formImages.length > 0 ? formImages : undefined,
      video: formVideo || undefined,
      verified: true,
      helpfulCount: 0,
    };

    setReviews([newReview, ...reviews]);
    setFormName('');
    setFormTitle('');
    setFormComment('');
    setFormImages([]);
    setFormVideo(null);
    setIsFormOpen(false);
    setActiveFilter('all');
    setCurrentPage(1);
  }

  function handleHelpful(id: string) {
    if (helpfulGiven[id]) return;
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );
    setHelpfulGiven(prev => ({ ...prev, [id]: true }));
  }

  // Filter counts
  const countAll = reviews.length;
  const count5 = reviews.filter(r => r.rating === 5).length;
  const count4 = reviews.filter(r => r.rating === 4).length;
  const count3 = reviews.filter(r => r.rating === 3).length;
  const count2 = reviews.filter(r => r.rating === 2).length;
  const count1 = reviews.filter(r => r.rating === 1).length;
  const countMedia = reviews.filter(r => (r.images && r.images.length > 0) || r.video).length;
  const countComment = reviews.filter(r => r.comment && r.comment.trim().length > 0).length;

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(r => {
      if (activeFilter === '5') return r.rating === 5;
      if (activeFilter === '4') return r.rating === 4;
      if (activeFilter === '3') return r.rating === 3;
      if (activeFilter === '2') return r.rating === 2;
      if (activeFilter === '1') return r.rating === 1;
      if (activeFilter === 'media') return (r.images && r.images.length > 0) || r.video;
      if (activeFilter === 'comment') return r.comment && r.comment.trim().length > 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'helpful') return b.helpfulCount - a.helpfulCount;
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const currentSafePage = Math.min(currentPage, totalPages);
  const paginatedReviews = filteredReviews.slice((currentSafePage - 1) * PAGE_SIZE, currentSafePage * PAGE_SIZE);

  function handleFilterChange(filter: typeof activeFilter) {
    setActiveFilter(filter);
    setCurrentPage(1);
  }

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.top < 0) {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  const distribution = [
    { stars: 5, pct: 85, count: Math.round(reviewCount * 0.85) },
    { stars: 4, pct: 10, count: Math.round(reviewCount * 0.10) },
    { stars: 3, pct: 3, count: Math.round(reviewCount * 0.03) },
    { stars: 2, pct: 1, count: Math.round(reviewCount * 0.01) },
    { stars: 1, pct: 1, count: Math.round(reviewCount * 0.01) },
  ];

  return (
    <section ref={sectionRef} className="reviews-section" aria-labelledby="reviews-title">
      <div className="reviews-section__header">
        <h2 id="reviews-title" className="reviews-section__title">
          <Star size={20} style={{ color: 'var(--warning)' }} />
          คะแนนและรีวิวจากผู้ซื้อจริง ({reviewCount.toLocaleString()})
        </h2>
        <button
          className="reviews-section__write-btn"
          onClick={() => setIsFormOpen(prev => !prev)}
        >
          <Edit3 size={15} />
          {isFormOpen ? 'ปิดฟอร์ม' : 'เขียนรีวิวแนบรูป/วิดีโอ'}
        </button>
      </div>

      {/* Summary Score Breakdown */}
      <div className="reviews-summary">
        <div className="reviews-summary__score-box">
          <div className="reviews-summary__score">
            {rating} <span>/ 5</span>
          </div>
          <div className="reviews-summary__stars" aria-hidden="true">
            {'★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating))}
          </div>
          <div className="reviews-summary__total">จาก {reviewCount.toLocaleString()} รีวิว</div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="reviews-bars">
          {distribution.map(d => (
            <div key={d.stars} className="reviews-bar-row">
              <span className="reviews-bar-label">{d.stars} ดาว</span>
              <div className="reviews-bar-track">
                <div className="reviews-bar-fill" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="reviews-bar-count">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Form */}
      {isFormOpen && (
        <form className="review-form" onSubmit={handleSubmitReview}>
          <h3 className="review-form__title">✍️ เขียนรีวิวสินค้า พร้อมแนบรูปภาพ/วิดีโอ</h3>
          <div className="review-form__star-picker">
            <span style={{ fontSize: 13, fontWeight: 600 }}>ให้คะแนน:</span>
            {[1, 2, 3, 4, 5].map(s => (
              <button
                type="button"
                key={s}
                className={`review-form__star-btn${formRating >= s ? ' review-form__star-btn--active' : ''}`}
                onClick={() => setFormRating(s)}
                aria-label={`${s} ดาว`}
              >
                ★
              </button>
            ))}
          </div>

          <div className="review-form__grid">
            <input
              type="text"
              className="review-form__input"
              placeholder="ชื่อของคุณ *"
              required
              value={formName}
              onChange={e => setFormName(e.target.value)}
            />
            <input
              type="text"
              className="review-form__input"
              placeholder="หัวข้อรีวิว (เช่น สินค้าคุณภาพดีมาก)"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
            />
          </div>

          <textarea
            className="review-form__textarea"
            placeholder="เขียนความคิดเห็นของคุณเกี่ยวกับสินค้านี้... *"
            required
            value={formComment}
            onChange={e => setFormComment(e.target.value)}
          />

          {/* Media Attachments Area */}
          <div className="review-form__media-group">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              📸 แนบรูปภาพ & วิดีโอสินค้า (แนบได้สูงสุด 3 รูป):
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            <div className="review-media-upload-btns">
              <button
                type="button"
                className="review-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
              >
                <Image size={15} />
                {isCompressing ? 'กำลังบีบอัดรูป...' : `+ อัปโหลดรูปจากเครื่อง (${formImages.length}/3)`}
              </button>

              <button
                type="button"
                className="review-upload-btn"
                onClick={handleAddSamplePhoto}
              >
                + แนบรูปตัวอย่าง
              </button>

              <button
                type="button"
                className="review-upload-btn"
                onClick={handleAddSampleVideo}
              >
                <Video size={15} />
                {formVideo ? '✓ แนบวิดีโอแล้ว' : '+ เพิ่มวิดีโอแกะกล่อง'}
              </button>
            </div>

            {/* Previews */}
            {(formImages.length > 0 || formVideo) && (
              <div className="review-media-previews">
                {formImages.map((img, i) => (
                  <div key={i} className="review-img-preview-box">
                    <img src={img} alt={`Preview ${i}`} className="review-img-preview" />
                    <button
                      type="button"
                      className="review-img-remove"
                      onClick={() => handleRemovePhoto(i)}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}

                {formVideo && (
                  <div className="review-img-preview-box" style={{ background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Play size={16} fill="white" />
                    <button
                      type="button"
                      className="review-img-remove"
                      onClick={() => setFormVideo(null)}
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="review-form__actions">
            <button
              type="button"
              className="review-form__cancel-btn"
              onClick={() => setIsFormOpen(false)}
            >
              ยกเลิก
            </button>
            <button type="submit" className="review-form__submit-btn">
              ส่งรีวิวสินค้า
            </button>
          </div>
        </form>
      )}

      {/* Shopee Style Multi-Category Filter Bar */}
      <div className="reviews-controls-header">
        <div className="reviews-filter-bar">
          <button
            className={`reviews-filter-btn${activeFilter === 'all' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            ทั้งหมด ({countAll})
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === '5' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('5')}
          >
            ★ 5 ดาว ({count5})
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === '4' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('4')}
          >
            ★ 4 ดาว ({count4})
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === '3' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('3')}
          >
            ★ 3 ดาว ({count3})
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === '2' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('2')}
          >
            ★ 2 ดาว ({count2})
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === '1' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('1')}
          >
            ★ 1 ดาว ({count1})
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === 'media' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('media')}
          >
            📸 มีรูป/วิดีโอ ({countMedia})
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === 'comment' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('comment')}
          >
            💬 มีข้อความ ({countComment})
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="reviews-sort-wrap">
          <ArrowUpDown size={14} className="reviews-sort-icon" />
          <label htmlFor="reviews-sort" className="reviews-sort-label">จัดเรียง:</label>
          <select
            id="reviews-sort"
            className="reviews-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="recent">ล่าสุด</option>
            <option value="helpful">มีประโยชน์สูงสุด</option>
            <option value="highest">คะแนนสูงสุด (5→1)</option>
            <option value="lowest">คะแนนต่ำสุด (1→5)</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="reviews-list">
        {paginatedReviews.length === 0 ? (
          <div className="reviews-empty-state">
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <h4>ไม่พบรีวิวในตัวกรองนี้</h4>
            <p>ลองเลือกตัวกรองอื่นเพื่อดูรีวิวเพิ่มเติม</p>
            <button
              className="reviews-empty-reset-btn"
              onClick={() => handleFilterChange('all')}
            >
              ดูรีวิวทั้งหมด
            </button>
          </div>
        ) : (
          paginatedReviews.map(review => (
            <article key={review.id} className="review-item">
              <div className="review-item__top">
                <div className="review-item__user">
                  <div className="review-item__avatar">
                    {review.userName.slice(0, 1)}
                  </div>
                  <div>
                    <span className="review-item__name">{review.userName}</span>
                    {review.verified && (
                      <span className="review-item__verified">
                        <CheckCircle size={11} style={{ display: 'inline', marginRight: 3 }} />
                        ผู้ซื้อที่ยืนยันแล้ว
                      </span>
                    )}
                  </div>
                </div>
                <span className="review-item__date">{review.date}</span>
              </div>

              <div className="review-item__rating" aria-label={`${review.rating} จาก 5 ดาว`}>
                {'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}
              </div>

              {review.title && <h4 className="review-item__comment-title">{review.title}</h4>}
              <p className="review-item__comment">{review.comment}</p>

              {/* Attached Photo Gallery */}
              {review.images && review.images.length > 0 && (
                <div className="review-media-gallery">
                  {review.images.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt={`Review attachment ${idx + 1}`}
                      className="review-gallery-img"
                      onClick={() => setLightboxImg(imgUrl)}
                      title="คลิกเพื่อดูรูปขนาดใหญ่"
                    />
                  ))}
                </div>
              )}

              {/* Attached Video */}
              {review.video && (
                <div className="review-video-box">
                  <video
                    src={review.video}
                    controls
                    className="review-video-player"
                    poster={review.images?.[0]}
                  />
                </div>
              )}

              <button
                className="review-item__helpful"
                onClick={() => handleHelpful(review.id)}
                disabled={helpfulGiven[review.id]}
              >
                <ThumbsUp size={12} />
                มีประโยชน์ ({review.helpfulCount})
              </button>
            </article>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="reviews-pagination-container">
          <div className="reviews-pagination-info">
            แสดงรีวิวที่ {(currentSafePage - 1) * PAGE_SIZE + 1} - {Math.min(currentSafePage * PAGE_SIZE, filteredReviews.length)} จาก {filteredReviews.length} รายการ
          </div>

          <div className="reviews-pagination-bar">
            <button
              type="button"
              className="reviews-page-btn reviews-page-btn--nav"
              disabled={currentSafePage === 1}
              onClick={() => handlePageChange(currentSafePage - 1)}
              aria-label="รีวิวหน้าที่แล้ว"
              title="รีวิวหน้าที่แล้ว"
            >
              <ChevronLeft size={16} /> หน้าก่อน
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
              <button
                key={page}
                type="button"
                className={`reviews-page-btn${currentSafePage === page ? ' reviews-page-btn--active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="reviews-page-btn reviews-page-btn--nav"
              disabled={currentSafePage === totalPages}
              onClick={() => handlePageChange(currentSafePage + 1)}
              aria-label="รีวิวหน้าถัดไป"
              title="รีวิวหน้าถัดไป"
            >
              หน้าถัดไป <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 16,
          }}
          onClick={() => setLightboxImg(null)}
        >
          <div style={{ position: 'relative', maxWidth: 600, width: '100%' }}>
            <img
              src={lightboxImg}
              alt="Enlarged review photo"
              style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', border: '1px solid white' }}
            />
            <button
              onClick={() => setLightboxImg(null)}
              style={{
                position: 'absolute',
                top: -36,
                right: 0,
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: 20,
                cursor: 'pointer',
              }}
            >
              ✕ ปิด
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default ReviewsSection;

