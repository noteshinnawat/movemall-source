import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, ThumbsUp, Edit3, CheckCircle, Image, Video, X, Play, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProductReviews, type ProductReview } from '../data/reviews';
import { compressImage } from '../utils/mediaCompressor';
import { fetchProductReviewsApi, submitProductReviewApi } from '../utils/api';
import { formatDate, formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './ReviewsSection.css';

interface ReviewsSectionProps {
  productId: string;
  rating: number;
  reviewCount: number;
}

export function ReviewsSection({ productId, rating, reviewCount }: ReviewsSectionProps) {
  const { t, i18n } = useTranslation(['catalog', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
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

  // Load live reviews from Supabase DB via Backend REST API
  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetchProductReviewsApi(productId);
        if (res && Array.isArray(res.reviews) && res.reviews.length > 0) {
          const dbReviews: ProductReview[] = res.reviews.map((r: any) => ({
            id: r.id,
            productId: r.productId || productId,
            userName: r.user?.name || t('catalog:reviews.movemallUser'),
            rating: r.rating || 5,
            date: formatDate(r.createdAt, locale),
            title: t('catalog:reviews.verifiedProductReview'),
            comment: r.comment,
            images: r.images,
            verified: true,
            helpfulCount: r.likes || 0,
          }));

          setReviews(prev => {
            const dbIds = new Set(dbReviews.map(dr => dr.id));
            const remaining = prev.filter(p => !dbIds.has(p.id));
            return [...dbReviews, ...remaining];
          });
        }
      } catch {
        // Fallback
      }
    }
    loadReviews();
  }, [locale, productId, t]);

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
      alert(t('catalog:reviews.maxImagesAlert'));
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
      alert(t('catalog:reviews.maxImagesAlert'));
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

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formComment.trim()) return;

    const newReview: ProductReview = {
      id: `rev-${Date.now()}`,
      productId,
      userName: formName.trim(),
      rating: formRating,
      date: t('catalog:reviews.today'),
      title: formTitle.trim() || t('catalog:reviews.defaultReviewTitle'),
      comment: formComment.trim(),
      images: formImages.length > 0 ? formImages : undefined,
      video: formVideo || undefined,
      verified: true,
      helpfulCount: 0,
    };

    setReviews(prev => [newReview, ...prev]);

    // Persist to database via Backend REST API
    try {
      await submitProductReviewApi(productId, {
        rating: formRating,
        comment: formComment.trim(),
        images: formImages.length > 0 ? formImages : undefined,
      });
      console.log('[Movemall API] ✅ Review submitted to DB successfully');
    } catch (err) {
      console.warn('[Movemall API] Could not submit review to DB, saved locally:', err);
    }

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

  const safeReviewCount = reviewCount ?? 0;
  const safeRating = rating ?? 5;
  const ratingFloor = Math.min(5, Math.max(0, Math.floor(safeRating)));

  const distribution = [
    { stars: 5, pct: 85, count: Math.round(safeReviewCount * 0.85) },
    { stars: 4, pct: 10, count: Math.round(safeReviewCount * 0.10) },
    { stars: 3, pct: 3, count: Math.round(safeReviewCount * 0.03) },
    { stars: 2, pct: 1, count: Math.round(safeReviewCount * 0.01) },
    { stars: 1, pct: 1, count: Math.round(safeReviewCount * 0.01) },
  ];

  return (
    <section ref={sectionRef} className="reviews-section" aria-labelledby="reviews-title">
      <div className="reviews-section__header">
        <h2 id="reviews-title" className="reviews-section__title">
          <Star size={20} style={{ color: 'var(--warning)' }} />
          {t('catalog:reviews.title', { count: formatNumber(safeReviewCount, locale) })}
        </h2>
        <button
          className="reviews-section__write-btn"
          onClick={() => setIsFormOpen(prev => !prev)}
        >
          <Edit3 size={15} />
          {isFormOpen ? t('catalog:reviews.closeForm') : t('catalog:reviews.writeReview')}
        </button>
      </div>

      {/* Summary Score Breakdown */}
      <div className="reviews-summary">
        <div className="reviews-summary__score-box">
          <div className="reviews-summary__score">
            {safeRating.toFixed(1)} <span>/ 5</span>
          </div>
          <div className="reviews-summary__stars" aria-hidden="true">
            {'★'.repeat(ratingFloor) + '☆'.repeat(Math.max(0, 5 - ratingFloor))}
          </div>
          <div className="reviews-summary__total">{t('catalog:reviews.total', { count: formatNumber(safeReviewCount, locale) })}</div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="reviews-bars">
          {distribution.map(d => (
            <div key={d.stars} className="reviews-bar-row">
              <span className="reviews-bar-label">{t('catalog:reviews.stars', { count: d.stars })}</span>
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
          <h3 className="review-form__title">{t('catalog:reviews.formTitle')}</h3>
          <div className="review-form__star-picker">
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t('catalog:reviews.rateLabel')}</span>
            {[1, 2, 3, 4, 5].map(s => (
              <button
                type="button"
                key={s}
                className={`review-form__star-btn${formRating >= s ? ' review-form__star-btn--active' : ''}`}
                onClick={() => setFormRating(s)}
                aria-label={t('catalog:reviews.stars', { count: s })}
              >
                ★
              </button>
            ))}
          </div>

          <div className="review-form__grid">
            <input
              type="text"
              className="review-form__input"
              placeholder={t('catalog:reviews.namePlaceholder')}
              required
              value={formName}
              onChange={e => setFormName(e.target.value)}
            />
            <input
              type="text"
              className="review-form__input"
              placeholder={t('catalog:reviews.titlePlaceholder')}
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
            />
          </div>

          <textarea
            className="review-form__textarea"
            placeholder={t('catalog:reviews.commentPlaceholder')}
            required
            value={formComment}
            onChange={e => setFormComment(e.target.value)}
          />

          {/* Media Attachments Area */}
          <div className="review-form__media-group">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('catalog:reviews.mediaLabel')}
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
                {isCompressing
                  ? t('catalog:reviews.compressing')
                  : t('catalog:reviews.uploadImages', { count: formatNumber(formImages.length, locale), max: 3 })}
              </button>

              <button
                type="button"
                className="review-upload-btn"
                onClick={handleAddSamplePhoto}
              >
                {t('catalog:reviews.addSamplePhoto')}
              </button>

              <button
                type="button"
                className="review-upload-btn"
                onClick={handleAddSampleVideo}
              >
                <Video size={15} />
                {formVideo ? t('catalog:reviews.videoAttached') : t('catalog:reviews.addVideo')}
              </button>
            </div>

            {/* Previews */}
            {(formImages.length > 0 || formVideo) && (
              <div className="review-media-previews">
                {formImages.map((img, i) => (
                  <div key={i} className="review-img-preview-box">
                    <img src={img} alt={t('catalog:reviews.previewAlt', { index: i + 1 })} className="review-img-preview" />
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
              {t('common:actions.cancel')}
            </button>
            <button type="submit" className="review-form__submit-btn">
              {t('catalog:reviews.submit')}
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
            {t('catalog:reviews.filters.all', { count: formatNumber(countAll, locale) })}
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === '5' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('5')}
          >
            {t('catalog:reviews.filters.rating', { rating: 5, count: formatNumber(count5, locale) })}
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === '4' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('4')}
          >
            {t('catalog:reviews.filters.rating', { rating: 4, count: formatNumber(count4, locale) })}
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === '3' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('3')}
          >
            {t('catalog:reviews.filters.rating', { rating: 3, count: formatNumber(count3, locale) })}
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === '2' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('2')}
          >
            {t('catalog:reviews.filters.rating', { rating: 2, count: formatNumber(count2, locale) })}
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === '1' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('1')}
          >
            {t('catalog:reviews.filters.rating', { rating: 1, count: formatNumber(count1, locale) })}
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === 'media' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('media')}
          >
            {t('catalog:reviews.filters.media', { count: formatNumber(countMedia, locale) })}
          </button>
          <button
            className={`reviews-filter-btn${activeFilter === 'comment' ? ' reviews-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange('comment')}
          >
            {t('catalog:reviews.filters.comment', { count: formatNumber(countComment, locale) })}
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="reviews-sort-wrap">
          <ArrowUpDown size={14} className="reviews-sort-icon" />
          <label htmlFor="reviews-sort" className="reviews-sort-label">{t('catalog:reviews.sortLabel')}</label>
          <select
            id="reviews-sort"
            className="reviews-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="recent">{t('catalog:reviews.sort.recent')}</option>
            <option value="helpful">{t('catalog:reviews.sort.helpful')}</option>
            <option value="highest">{t('catalog:reviews.sort.highest')}</option>
            <option value="lowest">{t('catalog:reviews.sort.lowest')}</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="reviews-list">
        {paginatedReviews.length === 0 ? (
          <div className="reviews-empty-state">
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <h4>{t('catalog:reviews.emptyTitle')}</h4>
            <p>{t('catalog:reviews.emptyDescription')}</p>
            <button
              className="reviews-empty-reset-btn"
              onClick={() => handleFilterChange('all')}
            >
              {t('catalog:reviews.viewAll')}
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
                        {t('catalog:reviews.verifiedBuyer')}
                      </span>
                    )}
                  </div>
                </div>
                <span className="review-item__date">{review.date}</span>
              </div>

              <div className="review-item__rating" aria-label={t('catalog:reviews.ratingOutOfFive', { rating: review.rating })}>
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
                      alt={t('catalog:reviews.attachmentAlt', { index: idx + 1 })}
                      className="review-gallery-img"
                      onClick={() => setLightboxImg(imgUrl)}
                      title={t('catalog:reviews.enlargePhoto')}
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
                {t('catalog:reviews.helpful', { count: formatNumber(review.helpfulCount, locale) })}
              </button>
            </article>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="reviews-pagination-container">
          <div className="reviews-pagination-info">
            {t('catalog:reviews.paginationInfo', {
              start: formatNumber((currentSafePage - 1) * PAGE_SIZE + 1, locale),
              end: formatNumber(Math.min(currentSafePage * PAGE_SIZE, filteredReviews.length), locale),
              total: formatNumber(filteredReviews.length, locale),
            })}
          </div>

          <div className="reviews-pagination-bar">
            <button
              type="button"
              className="reviews-page-btn reviews-page-btn--nav"
              disabled={currentSafePage === 1}
              onClick={() => handlePageChange(currentSafePage - 1)}
              aria-label={t('catalog:reviews.previousPageAria')}
              title={t('catalog:reviews.previousPageAria')}
            >
              <ChevronLeft size={16} /> {t('catalog:reviews.previousPage')}
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
              aria-label={t('catalog:reviews.nextPageAria')}
              title={t('catalog:reviews.nextPageAria')}
            >
              {t('catalog:reviews.nextPage')} <ChevronRight size={16} />
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
              alt={t('catalog:reviews.enlargedPhotoAlt')}
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
              ✕ {t('common:actions.close')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default ReviewsSection;
