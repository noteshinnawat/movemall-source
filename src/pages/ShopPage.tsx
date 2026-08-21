import { useState, useMemo, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { LiveStreamCard } from '../components/LiveStreamCard';
import { VideoClipInGridCard } from '../components/VideoClipInGridCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { products as staticProducts, categories } from '../data/products';
import { initialVideoClips } from '../data/videoClips';
import { initialAdCampaigns } from '../data/mockAdsData';
import { formatCurrency } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
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
  const { t, i18n } = useTranslation(['catalog', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
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
  }, [filters, sort, sourceProducts]);

  // Active filter chip labels
  const activeChips: { key: string; label: string; remove: () => void }[] = [];
  filters.categories.forEach(id => {
    const cat = categories.find(c => c.id === id);
    if (cat) {
      activeChips.push({
        key: `cat-${id}`,
        label: t('catalog:shop.categoryChip', {
          icon: cat.icon,
          category: t(`catalog:categories.${cat.id}.name`),
        }),
        remove: () => setFilters(f => ({ ...f, categories: f.categories.filter(c => c !== id) })),
      });
    }
  });
  if (filters.minPrice || filters.maxPrice) {
    activeChips.push({
      key: 'price',
      label: t('catalog:shop.priceRange', {
        min: formatCurrency(Number(filters.minPrice || 0), locale),
        max: filters.maxPrice ? formatCurrency(Number(filters.maxPrice), locale) : t('catalog:shop.noMaximum'),
      }),
      remove: () => setFilters(f => ({ ...f, minPrice: '', maxPrice: '' })),
    });
  }
  if (filters.rating !== null) {
    activeChips.push({
      key: 'rating',
      label: t('catalog:shop.ratingChip', { stars: '★'.repeat(filters.rating) }),
      remove: () => setFilters(f => ({ ...f, rating: null })),
    });
  }
  filters.badges.forEach(b => {
    activeChips.push({
      key: `badge-${b}`,
      label: t(`catalog:filters.badges.${b}`),
      remove: () => setFilters(f => ({ ...f, badges: f.badges.filter(x => x !== b) })),
    });
  });

  return (
    <main className="shop">
      {/* Hero */}
      <div className="shop__hero">
        <div className="container">
          <h1 className="shop__hero-title">{t('catalog:shop.title')}</h1>
          <p className="shop__hero-sub">{t('catalog:shop.subtitle')}</p>
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
              <div className="shop__active-filters" aria-label={t('catalog:shop.selectedFilters')}>
                {activeChips.map(chip => (
                  <button
                    key={chip.key}
                    className="shop__filter-chip"
                    onClick={chip.remove}
                    aria-label={t('catalog:shop.removeFilter', { filter: chip.label })}
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
                {t('catalog:shop.results', { count: filtered.length })}
              </p>
              <div className="shop__toolbar-right">
                <span className="shop__sort-label">{t('catalog:shop.sortLabel')}</span>
                <select
                  id="shop-sort-select"
                  className="shop__sort-select"
                  value={sort}
                  onChange={e => setSort(e.target.value as SortKey)}
                  aria-label={t('catalog:shop.sortAria')}
                >
                  <option value="popular">{t('catalog:shop.sort.popular')}</option>
                  <option value="newest">{t('catalog:shop.sort.newest')}</option>
                  <option value="price-asc">{t('catalog:shop.sort.priceAsc')}</option>
                  <option value="price-desc">{t('catalog:shop.sort.priceDesc')}</option>
                  <option value="rating">{t('catalog:shop.sort.rating')}</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            <div className="shop__grid">
              {filtered.length === 0 ? (
                <div className="shop__empty">
                  <div className="shop__empty-icon">🔍</div>
                  <h2 className="shop__empty-title">{t('catalog:shop.emptyTitle')}</h2>
                  <p className="shop__empty-sub">{t('catalog:shop.emptySubtitle')}</p>
                  <button
                    className="shop__empty-btn"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    id="shop-clear-filters-btn"
                  >
                    <X size={14} />
                    {t('catalog:shop.clearAll')}
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
                        title="✨ สกินแคร์เซรั่มวิตามิน C ซื้อ 1 แถม 1 เฉพาะในไลฟ์" /* i18n-allow-user-content: simulated live-stream caption, not UI chrome */
                        viewers={1_800}
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
