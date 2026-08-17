// src/components/FilterSidebar.tsx

import { useState } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { categories } from '../data/products';
import './FilterSidebar.css';

export interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
  rating: number | null;
  badges: string[];
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const RATINGS = [5, 4, 3];
const BADGES = [
  { id: 'sale', label: '🔥 Sale' },
  { id: 'new', label: '✨ ใหม่' },
  { id: 'hot', label: '⚡ Hot' },
];

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
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
    <aside className="filter-sidebar" aria-label="ตัวกรองสินค้า">
      <div className="filter-sidebar__header">
        <h2 className="filter-sidebar__title">
          <SlidersHorizontal size={16} style={{ display: 'inline', marginRight: 8 }} />
          ตัวกรอง
        </h2>
        {hasFilters && (
          <button className="filter-sidebar__clear" onClick={clearAll}>
            ล้างทั้งหมด
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="filter-group">
        <div className="filter-group__label">
          หมวดหมู่ <ChevronDown size={14} />
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
                <span className="filter-option__name">{cat.name}</span>
              </div>
              <span className="filter-option__count">{cat.productCount}</span>
              <input
                type="checkbox"
                className="sr-only"
                checked={active}
                onChange={() => toggleCategory(cat.id)}
                aria-label={cat.name}
              />
            </label>
          );
        })}
      </div>

      {/* Price Range */}
      <div className="filter-group">
        <div className="filter-group__label">
          ราคา <ChevronDown size={14} />
        </div>
        <div className="filter-price-inputs">
          <input
            id="filter-price-min"
            type="number"
            className="filter-price-input"
            placeholder="ต่ำสุด"
            value={priceMin}
            onChange={e => setPriceMin(e.target.value)}
            min={0}
            aria-label="ราคาต่ำสุด"
          />
          <span className="filter-price-sep">—</span>
          <input
            id="filter-price-max"
            type="number"
            className="filter-price-input"
            placeholder="สูงสุด"
            value={priceMax}
            onChange={e => setPriceMax(e.target.value)}
            min={0}
            aria-label="ราคาสูงสุด"
          />
        </div>
        <button className="filter-apply-btn" onClick={applyPrice} id="filter-price-apply">
          ใช้ตัวกรองราคา
        </button>
      </div>

      {/* Rating */}
      <div className="filter-group">
        <div className="filter-group__label">
          คะแนน <ChevronDown size={14} />
        </div>
        {RATINGS.map(r => (
          <label key={r} className="filter-rating-option">
            <div className={`filter-option__check${filters.rating === r ? ' filter-option__check--active' : ''}`}>
              {filters.rating === r && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <span className="filter-stars">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>
            <span className="filter-option__name">ขึ้นไป</span>
            <input
              type="radio"
              className="sr-only"
              name="rating-filter"
              checked={filters.rating === r}
              onChange={() => onChange({ ...filters, rating: filters.rating === r ? null : r })}
              aria-label={`${r} ดาวขึ้นไป`}
            />
          </label>
        ))}
      </div>

      {/* Badge */}
      <div className="filter-group">
        <div className="filter-group__label">
          โปรโมชั่น <ChevronDown size={14} />
        </div>
        <div className="filter-badge-list">
          {BADGES.map(b => (
            <button
              key={b.id}
              id={`filter-badge-${b.id}`}
              className={`filter-badge-chip${filters.badges.includes(b.id) ? ' filter-badge-chip--active' : ''}`}
              onClick={() => toggleBadge(b.id)}
              aria-pressed={filters.badges.includes(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default FilterSidebar;
