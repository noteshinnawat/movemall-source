import { useState, useMemo, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { LiveStreamCard } from '../components/LiveStreamCard';
import { VideoClipInGridCard } from '../components/VideoClipInGridCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { products as staticProducts, categories } from '../data/products';
import { initialVideoClips } from '../data/videoClips';
import { initialAdCampaigns } from '../data/mockAdsData';
import type { Product } from '../types';
import type { FilterState } from '../components/FilterSidebar';
import './ShopPage.css';

type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  minPrice: '',
  maxPrice: '',
  rating: null,
  badges: [],
};

interface ShopPageProps {
  products?: Product[];
  onAddToCart: (product: Product) => void;
  isWishlisted?: (productId: string) => boolean;
  onToggleWishlist?: (product: Product) => void;
}

export function ShopPage({ products: propProducts, onAddToCart, isWishlisted, onToggleWishlist }: ShopPageProps) {
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');
  const sourceProducts = propProducts || staticProducts;

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    categories: urlCategory ? [urlCategory] : [],
  }));
  const [sort, setSort] = useState<SortKey>('popular');

  const activeSponsoredProductIds = useMemo(() => {
    return new Set(
      initialAdCampaigns
        .filter(c => c.status === 'active')
        .map(c => c.productId)
    );
  }, []);

  const filtered = useMemo(() => {
    let result = [...sourceProducts];


    // Category
    if (filters.categories.length > 0) {
      result = result.filter(p => filters.categories.includes(p.category));
    }

    // Price
    if (filters.minPrice) {
      result = result.filter(p => p.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter(p => p.price <= Number(filters.maxPrice));
    }

    // Rating
    if (filters.rating !== null) {
      result = result.filter(p => p.rating >= filters.rating!);
    }

    // Badge
    if (filters.badges.length > 0) {
      result = result.filter(p => p.badge && filters.badges.includes(p.badge));
    }

    // Tax / e-Tax Ready filter
    if (filters.onlyTaxReady) {
      result = result.filter(p => p.isMall || p.isVatRegistered || (p.badge === 'mall'));
    }

    // Sort
    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => (b.badge === 'new' ? 1 : 0) - (a.badge === 'new' ? 1 : 0));
        break;
      default: // popular
        result.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return result;
  }, [filters, sort]);

  // Active filter chip labels
  const activeChips: { key: string; label: string; remove: () => void }[] = [];
  filters.categories.forEach(id => {
    const cat = categories.find(c => c.id === id);
    if (cat) {
      activeChips.push({
        key: `cat-${id}`,
        label: `${cat.icon} ${cat.name}`,
        remove: () => setFilters(f => ({ ...f, categories: f.categories.filter(c => c !== id) })),
      });
    }
  });
  if (filters.minPrice || filters.maxPrice) {
    activeChips.push({
      key: 'price',
      label: `฿${filters.minPrice || '0'} – ฿${filters.maxPrice || '∞'}`,
      remove: () => setFilters(f => ({ ...f, minPrice: '', maxPrice: '' })),
    });
  }
  if (filters.rating !== null) {
    activeChips.push({
      key: 'rating',
      label: `${'★'.repeat(filters.rating)} ขึ้นไป`,
      remove: () => setFilters(f => ({ ...f, rating: null })),
    });
  }
  filters.badges.forEach(b => {
    activeChips.push({
      key: `badge-${b}`,
      label: b === 'sale' ? '🔥 Sale' : b === 'new' ? '✨ ใหม่' : '⚡ Hot',
      remove: () => setFilters(f => ({ ...f, badges: f.badges.filter(x => x !== b) })),
    });
  });

  return (
    <main className="shop">
      {/* Hero */}
      <div className="shop__hero">
        <div className="container">
          <h1 className="shop__hero-title">🛍 ช้อปสินค้าทั้งหมด</h1>
          <p className="shop__hero-sub">สินค้าคุณภาพดี ราคาโดน จัดส่งไว</p>
        </div>
      </div>

      <div className="container">
        <div className="shop__body">
          {/* Sidebar */}
          <FilterSidebar filters={filters} onChange={setFilters} />

          {/* Main */}
          <div className="shop__main">
            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="shop__active-filters" aria-label="ตัวกรองที่เลือก">
                {activeChips.map(chip => (
                  <button
                    key={chip.key}
                    className="shop__filter-chip"
                    onClick={chip.remove}
                    aria-label={`ลบตัวกรอง ${chip.label}`}
                  >
                    {chip.label}
                    <X size={12} />
                  </button>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="shop__toolbar">
              <p className="shop__result-count">
                พบ <strong>{filtered.length}</strong> รายการ
              </p>
              <div className="shop__toolbar-right">
                <span className="shop__sort-label">เรียงตาม:</span>
                <select
                  id="shop-sort-select"
                  className="shop__sort-select"
                  value={sort}
                  onChange={e => setSort(e.target.value as SortKey)}
                  aria-label="เรียงสินค้า"
                >
                  <option value="popular">ยอดนิยม</option>
                  <option value="newest">ใหม่ล่าสุด</option>
                  <option value="price-asc">ราคา: น้อย → มาก</option>
                  <option value="price-desc">ราคา: มาก → น้อย</option>
                  <option value="rating">คะแนนสูงสุด</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            <div className="shop__grid">
              {filtered.length === 0 ? (
                <div className="shop__empty">
                  <div className="shop__empty-icon">🔍</div>
                  <h2 className="shop__empty-title">ไม่พบสินค้า</h2>
                  <p className="shop__empty-sub">ลองปรับตัวกรองใหม่อีกครั้งนะครับ</p>
                  <button
                    className="shop__empty-btn"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    id="shop-clear-filters-btn"
                  >
                    <X size={14} />
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              ) : (
                filtered.map((product, index) => (
                  <Fragment key={product.id}>
                    <ProductCard
                      product={product}
                      onAddToCart={onAddToCart}
                      isWishlisted={isWishlisted?.(product.id)}
                      onToggleWishlist={onToggleWishlist}
                      isSponsored={activeSponsoredProductIds.has(product.id) && index < 2}
                    />

                    {/* Insert Live Stream Card after 6th product */}
                    {index === 5 && (
                      <LiveStreamCard
                        id="live-shop-1"
                        channelName="BeautyGlow Live"
                        streamerAvatar="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80"
                        title="✨ สกินแคร์เซรั่มวิตามิน C ซื้อ 1 แถม 1 เฉพาะในไลฟ์"
                        viewers="1.8k"
                        videoUrl="/videos/live-streamer-3.mp4"
                        posterImage="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80"
                        pinnedProduct={{
                          name: 'เซรั่มฟื้นฟูผิวเข้มข้น Organic 30ml',
                          image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&q=80',
                          price: 290,
                          originalPrice: 590,
                          discountPct: 50,
                        }}
                      />
                    )}

                    {/* Insert Short Video Clip Card after 11th product */}
                    {index === 10 && (
                      <VideoClipInGridCard clip={initialVideoClips[0]} />
                    )}
                  </Fragment>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ShopPage;
