// src/components/FilterSidebar.tsx

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { categories } from '../data/products';
import { formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './FilterSidebar.css';

export interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
  rating: number | null;
  badges: string[];
  onlyTaxReady?: boolean;
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const RATINGS = [5, 4, 3];
const BADGES = ['sale', 'new', 'hot'];

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const { t, i18n } = useTranslation(['catalog', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const [priceMin, setPriceMin] = useState(filters.minPrice);
  const [priceMax, setPriceMax] = useState(filters.maxPrice);

  function toggleCategory(id: string) {
    const next = filters.categories.includes(id)
      ? filters.categories.filter(c => c !== id)
      : [...filters.categories, id];
    onChange({ ...filters, categories: next });
  }

  function toggleBadge(id: string) {
    const next = filters.badges.includes(id)
      ? filters.badges.filter(b => b !== id)
      : [...filters.badges, id];
    onChange({ ...filters, badges: next });
  }

  function applyPrice() {
    onChange({ ...filters, minPrice: priceMin, maxPrice: priceMax });
  }

  function clearAll() {
    setPriceMin('');
    setPriceMax('');
    onChange({ categories: [], minPrice: '', maxPrice: '', rating: null, badges: [] });
  }

  const hasFilters =
    filters.categories.length > 0 ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.rating !== null ||
    filters.badges.length > 0;

  return (
    <aside className="filter-sidebar" aria-label={t('catalog:filters.ariaLabel')}>
      <div className="filter-sidebar__header">
        <h2 className="filter-sidebar__title">
          <SlidersHorizontal size={16} style={{ display: 'inline', marginRight: 8 }} />
          {t('catalog:filters.title')}
        </h2>
        {hasFilters && (
          <button className="filter-sidebar__clear" onClick={clearAll}>
            {t('catalog:filters.clearAll')}
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="filter-group">
        <div className="filter-group__label">
          {t('catalog:filters.categories')} <ChevronDown size={14} />
        </div>
        {categories.map(cat => {
          const active = filters.categories.includes(cat.id);
          return (
            <label key={cat.id} className="filter-option">
              <div className="filter-option__left">
                <div className={`filter-option__check${active ? ' filter-option__check--active' : ''}`}>
                  {active && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
                <span className="filter-option__icon">{cat.icon}</span>
                <span className="filter-option__name">{t(`catalog:categories.${cat.id}.name`)}</span>
              </div>
              <span className="filter-option__count">{formatNumber(cat.productCount, locale)}</span>
              <input
                type="checkbox"
                className="sr-only"
                checked={active}
                onChange={() => toggleCategory(cat.id)}
                aria-label={t(`catalog:categories.${cat.id}.name`)}
              />
            </label>
          );
        })}
      </div>

      {/* Price Range */}
      <div className="filter-group">
        <div className="filter-group__label">
          {t('catalog:filters.price')} <ChevronDown size={14} />
        </div>
        <div className="filter-price-inputs">
          <input
            id="filter-price-min"
            type="number"
            className="filter-price-input"
            placeholder={t('catalog:filters.minimum')}
            value={priceMin}
            onChange={e => setPriceMin(e.target.value)}
            min={0}
            aria-label={t('catalog:filters.minimumPrice')}
          />
          <span className="filter-price-sep">—</span>
          <input
            id="filter-price-max"
            type="number"
            className="filter-price-input"
            placeholder={t('catalog:filters.maximum')}
            value={priceMax}
            onChange={e => setPriceMax(e.target.value)}
            min={0}
            aria-label={t('catalog:filters.maximumPrice')}
          />
        </div>
        <button className="filter-apply-btn" onClick={applyPrice} id="filter-price-apply">
          {t('catalog:filters.applyPrice')}
        </button>
      </div>

      {/* Rating */}
      <div className="filter-group">
        <div className="filter-group__label">
          {t('catalog:filters.rating')} <ChevronDown size={14} />
        </div>
        {RATINGS.map(r => (
          <label key={r} className="filter-rating-option">
            <div className={`filter-option__check${filters.rating === r ? ' filter-option__check--active' : ''}`}>
              {filters.rating === r && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <span className="filter-stars">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>
            <span className="filter-option__name">{t('catalog:filters.andUp')}</span>
            <input
              type="radio"
              className="sr-only"
              name="rating-filter"
              checked={filters.rating === r}
              onChange={() => onChange({ ...filters, rating: filters.rating === r ? null : r })}
              aria-label={t('catalog:filters.ratingAndUp', { rating: r })}
            />
          </label>
        ))}
      </div>

      {/* Badge */}
      <div className="filter-group">
        <div className="filter-group__label">
          {t('catalog:filters.promotions')} <ChevronDown size={14} />
        </div>
        <div className="filter-badge-list">
          {BADGES.map(badge => (
            <button
              key={badge}
              id={`filter-badge-${badge}`}
              className={`filter-badge-chip${filters.badges.includes(badge) ? ' filter-badge-chip--active' : ''}`}
              onClick={() => toggleBadge(badge)}
              aria-pressed={filters.badges.includes(badge)}
            >
              {t(`catalog:filters.badges.${badge}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tax & Invoice Filter */}
      <div className="filter-group" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB' }}>
        <div className="filter-group__label">
          {t('catalog:filters.taxInvoice')} <ChevronDown size={14} />
        </div>
        <label className="filter-option" style={{ cursor: 'pointer' }}>
          <div className="filter-option__left">
            <div className={`filter-option__check${filters.onlyTaxReady ? ' filter-option__check--active' : ''}`}>
              {filters.onlyTaxReady && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <span className="filter-option__icon">🧾</span>
            <span className="filter-option__name" style={{ fontWeight: 600, color: '#1E40AF' }}>{t('catalog:filters.taxReady')}</span>
          </div>
          <input
            type="checkbox"
            className="sr-only"
            checked={!!filters.onlyTaxReady}
            onChange={() => onChange({ ...filters, onlyTaxReady: !filters.onlyTaxReady })}
            aria-label={t('catalog:filters.taxReadyAria')}
          />
        </label>
      </div>
    </aside>
  );
}

export default FilterSidebar;
