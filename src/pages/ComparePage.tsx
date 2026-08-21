// src/pages/ComparePage.tsx — Movemall Responsive Product Comparison Tool

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Scale, 
  ShoppingBag, 
  Star, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  ArrowLeftRight, 
  Search, 
  X, 
  Share2, 
  Check, 
  Sparkles, 
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { categories } from '../data/products';
import { allMarketplaceProducts } from '../data/mockProductsData';
import { stores } from '../data/stores';
import { formatCurrency, formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import type { Product } from '../types';
import './ComparePage.css';

interface ComparePageProps {
  onAddToCart: (product: Product) => void;
}

export function ComparePage({ onAddToCart }: ComparePageProps) {
  const { t, i18n } = useTranslation(['commerce', 'catalog', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const money = (value: number) => formatCurrency(value, locale);

  // Category state
  const [selectedCat, setSelectedCat] = useState<string>('electronics');
  
  // Products currently in comparison (Max 4)
  const defaultItems = useMemo(() => {
    const items = allMarketplaceProducts.filter(p => p.category === 'electronics');
    return items.slice(0, 3);
  }, []);

  const [compareItems, setCompareItems] = useState<Product[]>(defaultItems);
  
  // Mobile View Mode: 'dual' (1 vs 1) or 'table' (All items scrollable)
  const [mobileMode, setMobileMode] = useState<'dual' | 'table'>('dual');
  const [dualIndexA, setDualIndexA] = useState<number>(0);
  const [dualIndexB, setDualIndexB] = useState<number>(1);

  // Filters & Options
  const [highlightDiff, setHighlightDiff] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  
  // Add Product Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [modalCatFilter, setModalCatFilter] = useState<string>('all');
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  // Switch category updates comparison list if empty
  function handleSelectCategory(catId: string) {
    setSelectedCat(catId);
    const newItems = allMarketplaceProducts.filter(p => p.category === catId);
    setCompareItems(newItems.slice(0, 3));
    setDualIndexA(0);
    setDualIndexB(Math.min(1, newItems.length - 1));
  }

  // Remove an item
  function handleRemoveItem(id: string) {
    if (compareItems.length <= 1) {
      alert(t('commerce:compare.minItemsAlert'));
      return;
    }
    const updated = compareItems.filter(p => p.id !== id);
    setCompareItems(updated);
    setDualIndexA(0);
    setDualIndexB(Math.min(1, updated.length - 1));
  }

  // Swap dual mode items
  function handleSwapDual() {
    const temp = dualIndexA;
    setDualIndexA(dualIndexB);
    setDualIndexB(temp);
  }

  // Open modal to add or replace
  function openAddModal(indexToReplace: number | null = null) {
    setReplaceIndex(indexToReplace);
    setModalCatFilter(selectedCat);
    setModalSearchQuery('');
    setIsModalOpen(true);
  }

  // Add selected product to comparison
  function handleAddProduct(product: Product) {
    if (replaceIndex !== null) {
      const updated = [...compareItems];
      updated[replaceIndex] = product;
      setCompareItems(updated);
    } else {
      if (compareItems.some(p => p.id === product.id)) {
        alert(t('commerce:compare.duplicateAlert'));
        return;
      }
      if (compareItems.length >= 4) {
        alert(t('commerce:compare.maxItemsAlert'));
        return;
      }
      setCompareItems([...compareItems, product]);
    }
    setIsModalOpen(false);
  }

  // Share comparison
  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  }

  // Modal filtered products
  const availableModalProducts = useMemo(() => {
    return allMarketplaceProducts.filter(p => {
      const matchCat = modalCatFilter === 'all' || p.category === modalCatFilter;
      const matchQuery = !modalSearchQuery || 
        p.name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(modalSearchQuery.toLowerCase()));
      const notAlreadyIn = !compareItems.some(item => item.id === p.id);
      return matchCat && matchQuery && notAlreadyIn;
    });
  }, [modalCatFilter, modalSearchQuery, compareItems]);

  // Determine Highlights / Winners
  const lowestPriceId = useMemo(() => {
    if (compareItems.length === 0) return null;
    return [...compareItems].sort((a, b) => a.price - b.price)[0].id;
  }, [compareItems]);

  const highestRatingId = useMemo(() => {
    if (compareItems.length === 0) return null;
    return [...compareItems].sort((a, b) => b.rating - a.rating)[0].id;
  }, [compareItems]);

  const highestDiscountId = useMemo(() => {
    if (compareItems.length === 0) return null;
    const withDisc = compareItems.filter(p => p.originalPrice && p.originalPrice > p.price);
    if (withDisc.length === 0) return null;
    return withDisc.sort((a, b) => {
      const discA = ((a.originalPrice! - a.price) / a.originalPrice!) * 100;
      const discB = ((b.originalPrice! - b.price) / b.originalPrice!) * 100;
      return discB - discA;
    })[0].id;
  }, [compareItems]);

  // Active items for Dual View (Mobile)
  const dualItemA = compareItems[dualIndexA] || compareItems[0];
  const dualItemB = compareItems[dualIndexB] || compareItems[1] || compareItems[0];

  return (
    <main className="compare-page">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="compare-toast">
          <Check size={16} /> {t('commerce:compare.copiedToast')}
        </div>
      )}

      <div className="compare-container">
        {/* Header Section */}
        <div className="compare-header">
          <div className="compare-header-left">
            <div className="compare-badge-pill">
              <Scale size={14} /> {t('commerce:compare.badge')}
            </div>
            <h1 className="compare-title">
              {t('commerce:compare.title')}
            </h1>
            <p className="compare-subtitle">
              {t('commerce:compare.subtitle')}
            </p>
          </div>

          <div className="compare-header-actions">
            <button 
              className={`compare-tool-btn ${highlightDiff ? 'compare-tool-btn--active' : ''}`}
              onClick={() => setHighlightDiff(!highlightDiff)}
              title={t('commerce:compare.highlightTitle')}
            >
              <SlidersHorizontal size={14} />
              <span>
                {highlightDiff
                  ? t('commerce:compare.showAll')
                  : t('commerce:compare.highlightDiff')}
              </span>
            </button>
            <button className="compare-tool-btn" onClick={handleShare}>
              <Share2 size={14} />
              <span>{t('commerce:compare.share')}</span>
            </button>
          </div>
        </div>

        {/* Category Selector Bar */}
        <div className="compare-cat-bar">
          <span className="compare-cat-label">{t('commerce:compare.categoryLabel')}</span>
          <div className="compare-cat-scroll">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`compare-cat-chip ${selectedCat === cat.id ? 'compare-cat-chip--active' : ''}`}
                onClick={() => handleSelectCategory(cat.id)}
              >
                <span>{cat.icon}</span> {t(`catalog:categories.${cat.id}.name`, { defaultValue: cat.name })}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View Toggle Tabs (Visible on screens < 768px) */}
        <div className="compare-mobile-controls">
          <div className="compare-mode-switch">
            <button 
              className={`compare-mode-btn ${mobileMode === 'dual' ? 'compare-mode-btn--active' : ''}`}
              onClick={() => setMobileMode('dual')}
            >
              {t('commerce:compare.modeDual')}
            </button>
            <button 
              className={`compare-mode-btn ${mobileMode === 'table' ? 'compare-mode-btn--active' : ''}`}
              onClick={() => setMobileMode('table')}
            >
              {t('commerce:compare.modeTable', { count: compareItems.length })}
            </button>
          </div>

          {mobileMode === 'dual' && compareItems.length >= 2 && (
            <div className="compare-dual-selectors">
              <div className="compare-dual-select-group">
                <label>{t('commerce:compare.sideA')}</label>
                <select 
                  value={dualIndexA} 
                  onChange={(e) => setDualIndexA(Number(e.target.value))}
                  className="compare-select"
                >
                  {compareItems.map((item, idx) => (
                    <option key={item.id} value={idx} disabled={idx === dualIndexB}>
                      {t('commerce:compare.optionLabel', {
                        index: formatNumber(idx + 1, locale),
                        name: item.name.substring(0, 20),
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <button className="compare-swap-btn" onClick={handleSwapDual} title={t('commerce:compare.swap')}>
                <ArrowLeftRight size={16} />
              </button>

              <div className="compare-dual-select-group">
                <label>{t('commerce:compare.sideB')}</label>
                <select 
                  value={dualIndexB} 
                  onChange={(e) => setDualIndexB(Number(e.target.value))}
                  className="compare-select"
                >
                  {compareItems.map((item, idx) => (
                    <option key={item.id} value={idx} disabled={idx === dualIndexA}>
                      {t('commerce:compare.optionLabel', {
                        index: formatNumber(idx + 1, locale),
                        name: item.name.substring(0, 20),
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* MOBILE 1 vs 1 DUAL VIEW */}
        {mobileMode === 'dual' && (
          <div className="compare-dual-container">
            {/* Sticky Dual Header Bar */}
            <div className="compare-dual-header-grid">
              {[dualItemA, dualItemB].map((product, sideIdx) => {
                if (!product) return null;
                const isLowest = product.id === lowestPriceId;
                const isTopRating = product.id === highestRatingId;
                const isTopDisc = product.id === highestDiscountId;
                return (
                  <div key={product.id} className="compare-dual-card">
                    {/* Image with Overlaid Badges */}
                    <div className="compare-img-box">
                      <img src={product.images[0]} alt={product.name} className="compare-dual-img" />
                      <div className="compare-card-badges-overlay">
                        {isLowest && <span className="badge-best-price">{t('commerce:compare.badgeBestPrice')}</span>}
                        {isTopRating && <span className="badge-best-rating">{t('commerce:compare.badgeBestRating')}</span>}
                        {isTopDisc && <span className="badge-best-disc">{t('commerce:compare.badgeBestDiscount')}</span>}
                      </div>
                    </div>

                    <h3 className="compare-dual-name" title={product.name}>{product.name}</h3>
                    
                    <div className="compare-dual-price-box">
                      <span className="compare-dual-price">{money(product.price ?? 0)}</span>
                      {product.originalPrice && (
                        <span className="compare-dual-orig-price">{money(product.originalPrice ?? 0)}</span>
                      )}
                    </div>

                    <button className="compare-buy-btn" onClick={() => onAddToCart(product)}>
                      <ShoppingBag size={13} /> {t('commerce:compare.addToCart')}
                    </button>
                    
                    <button 
                      className="compare-sub-btn" 
                      onClick={() => openAddModal(sideIdx === 0 ? dualIndexA : dualIndexB)}
                    >
                      {t('commerce:compare.changeProduct')}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Spec Rows for Dual View */}
            <div className="compare-dual-specs">
              <div className="compare-spec-section-title">{t('commerce:compare.specsTitle')}</div>

              <div className="compare-spec-row">
                <div className="compare-spec-row-label">{t('commerce:compare.rowRating')}</div>
                <div className="compare-spec-row-values">
                  <div className="compare-spec-val">
                    <span className="star-rating"><Star size={13} fill="#F59E0B" /> {dualItemA?.rating}</span>
                    <span className="sub-text">
                      {t('commerce:compare.reviewCount', {
                        count: dualItemA?.reviewCount ?? 0,
                      })}
                    </span>
                  </div>
                  <div className="compare-spec-val">
                    <span className="star-rating"><Star size={13} fill="#F59E0B" /> {dualItemB?.rating}</span>
                    <span className="sub-text">
                      {t('commerce:compare.reviewCount', {
                        count: dualItemB?.reviewCount ?? 0,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="compare-spec-row">
                <div className="compare-spec-row-label">{t('commerce:compare.rowDiscount')}</div>
                <div className="compare-spec-row-values">
                  <div className="compare-spec-val">
                    {dualItemA?.originalPrice ? (
                      <span className="discount-tag">
                        {t('commerce:compare.discountTag', {
                          discount: Math.round(((dualItemA.originalPrice - dualItemA.price) / dualItemA.originalPrice) * 100),
                        })}
                      </span>
                    ) : <span className="muted-text">{t('commerce:compare.standardPrice')}</span>}
                  </div>
                  <div className="compare-spec-val">
                    {dualItemB?.originalPrice ? (
                      <span className="discount-tag">
                        {t('commerce:compare.discountTag', {
                          discount: Math.round(((dualItemB.originalPrice - dualItemB.price) / dualItemB.originalPrice) * 100),
                        })}
                      </span>
                    ) : <span className="muted-text">{t('commerce:compare.standardPrice')}</span>}
                  </div>
                </div>
              </div>

              <div className="compare-spec-row">
                <div className="compare-spec-row-label">{t('commerce:compare.rowWarranty')}</div>
                <div className="compare-spec-row-values">
                  <div className="compare-spec-val highlight-green">
                    <ShieldCheck size={14} /> {t('commerce:compare.warrantyShort')}
                  </div>
                  <div className="compare-spec-val highlight-green">
                    <ShieldCheck size={14} /> {t('commerce:compare.warrantyShort')}
                  </div>
                </div>
              </div>

              <div className="compare-spec-row">
                <div className="compare-spec-row-label">{t('commerce:compare.rowShipping')}</div>
                <div className="compare-spec-row-values">
                  <div className="compare-spec-val highlight-green">{t('commerce:compare.shippingShort')}</div>
                  <div className="compare-spec-val highlight-green">{t('commerce:compare.shippingShort')}</div>
                </div>
              </div>

              <div className="compare-spec-row">
                <div className="compare-spec-row-label">{t('commerce:compare.rowTags')}</div>
                <div className="compare-spec-row-values">
                  <div className="compare-spec-val tags-val">
                    {(dualItemA?.tags || []).map(tag => (
                      <span key={tag} className="feature-tag">#{tag}</span>
                    ))}
                  </div>
                  <div className="compare-spec-val tags-val">
                    {(dualItemB?.tags || []).map(tag => (
                      <span key={tag} className="feature-tag">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="compare-spec-row">
                <div className="compare-spec-row-label">{t('commerce:compare.rowDescription')}</div>
                <div className="compare-spec-row-values">
                  <div className="compare-spec-val desc-val">{dualItemA?.description}</div>
                  <div className="compare-spec-val desc-val">{dualItemB?.description}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FULL MULTI-COLUMN TABLE VIEW (Default on Desktop, Optional on Mobile) */}
        <div className={`compare-table-wrapper ${mobileMode === 'dual' ? 'hide-on-mobile' : ''}`}>
          <table className="compare-table">
            <thead>
              <tr className="compare-sticky-header">
                <th className="compare-corner-cell">
                  <div className="corner-label">
                    <span>
                      {t('commerce:compare.cornerLabel', {
                        count: compareItems.length,
                      })}
                    </span>
                    {compareItems.length < 4 && (
                      <button className="corner-add-btn" onClick={() => openAddModal(null)}>
                        <Plus size={12} /> {t('commerce:compare.addProduct')}
                      </button>
                    )}
                  </div>
                </th>
                {compareItems.map((p, idx) => {
                  const isLowest = p.id === lowestPriceId;
                  const isTopRating = p.id === highestRatingId;
                  const isTopDisc = p.id === highestDiscountId;
                  const store = stores.find(s => s.id === p.storeId);

                  return (
                    <td key={p.id} className="compare-product-col">
                      <div className="compare-col-header">
                        <button 
                          className="compare-remove-icon-btn" 
                          onClick={() => handleRemoveItem(p.id)}
                          title={t('commerce:compare.removeTitle')}
                        >
                          <Trash2 size={13} />
                        </button>

                        <div className="compare-img-box">
                          <img src={p.images[0]} alt={p.name} className="compare-product-img" />
                          <div className="compare-card-badges-overlay">
                            {isLowest && <span className="badge-best-price">{t('commerce:compare.badgeBestPrice')}</span>}
                            {isTopRating && <span className="badge-best-rating">{t('commerce:compare.badgeBestRating')}</span>}
                            {isTopDisc && <span className="badge-best-disc">{t('commerce:compare.badgeBestDiscount')}</span>}
                          </div>
                        </div>
                        
                        {store && (
                          <div className="compare-store-pill">
                            <span>👑 {store.name}</span>
                          </div>
                        )}

                        <h3 className="compare-product-name" title={p.name}>{p.name}</h3>
                        
                        <div className="compare-product-price-box">
                          <span className="compare-product-price">{money(p.price ?? 0)}</span>
                          {p.originalPrice && (
                            <span className="compare-product-orig">{money(p.originalPrice ?? 0)}</span>
                          )}
                        </div>

                        <button className="compare-buy-btn" onClick={() => onAddToCart(p)}>
                          <ShoppingBag size={14} /> {t('commerce:compare.addToCart')}
                        </button>

                        <button 
                          className="compare-change-btn" 
                          onClick={() => openAddModal(idx)}
                        >
                          <ArrowLeftRight size={12} /> {t('commerce:compare.swapProduct')}
                        </button>
                      </div>
                    </td>
                  );
                })}

                {/* Empty Slot if less than 4 items */}
                {compareItems.length < 4 && (
                  <td className="compare-empty-col">
                    <button className="compare-empty-slot" onClick={() => openAddModal(null)}>
                      <div className="empty-slot-circle">
                        <Plus size={24} />
                      </div>
                      <span className="empty-slot-title">{t('commerce:compare.emptySlotTitle')}</span>
                      <span className="empty-slot-sub">{t('commerce:compare.emptySlotSub')}</span>
                    </button>
                  </td>
                )}
              </tr>
            </thead>

            <tbody>
              {/* Category Spec Header */}
              <tr className="compare-section-divider">
                <td colSpan={compareItems.length + (compareItems.length < 4 ? 2 : 1)}>
                  {t('commerce:compare.sectionStats')}
                </td>
              </tr>

              <tr className={highlightDiff ? 'row-highlight' : ''}>
                <th className="compare-spec-label">{t('commerce:compare.rowAvgRating')}</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell center">
                    <div className="rating-box">
                      <Star size={15} fill="#F59E0B" color="#F59E0B" />
                      <strong>{p.rating}</strong> {t('commerce:compare.ratingOutOf')}
                    </div>
                    <div className="review-count">
                      {t('commerce:compare.reviewCount', {
                        count: p.reviewCount ?? 0,
                      })}
                    </div>
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>

              <tr className={highlightDiff ? 'row-highlight' : ''}>
                <th className="compare-spec-label">{t('commerce:compare.rowPromotions')}</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell center">
                    {p.originalPrice ? (
                      <span className="discount-tag">
                        {t('commerce:compare.discountTag', {
                          discount: Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100),
                        })}
                      </span>
                    ) : (
                      <span className="muted-text">{t('commerce:compare.standardPrice')}</span>
                    )}
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>

              {/* Service & Guarantee Specs */}
              <tr className="compare-section-divider">
                <td colSpan={compareItems.length + (compareItems.length < 4 ? 2 : 1)}>
                  {t('commerce:compare.sectionGuarantee')}
                </td>
              </tr>

              <tr>
                <th className="compare-spec-label">{t('commerce:compare.rowWarrantyTable')}</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell center highlight-green">
                    <ShieldCheck size={16} /> {t('commerce:compare.warrantyFull')}
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>

              <tr>
                <th className="compare-spec-label">{t('commerce:compare.rowShippingTable')}</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell center highlight-green">
                    {t('commerce:compare.shippingFull')}
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>

              <tr>
                <th className="compare-spec-label">{t('commerce:compare.rowReturns')}</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell center">
                    {t('commerce:compare.returnsPolicy')}
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>

              {/* Features & Detailed Specs */}
              <tr className="compare-section-divider">
                <td colSpan={compareItems.length + (compareItems.length < 4 ? 2 : 1)}>
                  {t('commerce:compare.sectionSpecs')}
                </td>
              </tr>

              <tr>
                <th className="compare-spec-label">{t('commerce:compare.rowFeatureTags')}</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell">
                    <div className="tags-container">
                      {(p.tags || []).map(tag => (
                        <span key={tag} className="feature-tag">#{tag}</span>
                      ))}
                    </div>
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>

              <tr>
                <th className="compare-spec-label">{t('commerce:compare.rowSpecs')}</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell desc-text">
                    {p.description}
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Comparison Bottom Tips */}
        <div className="compare-footer-card">
          <div className="compare-footer-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h4>{t('commerce:compare.tipsTitle')}</h4>
            <p>{t('commerce:compare.tipsBody')}</p>
          </div>
        </div>
      </div>

      {/* ADD / SEARCH PRODUCT MODAL */}
      {isModalOpen && (
        <div className="compare-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="compare-modal" onClick={e => e.stopPropagation()}>
            <div className="compare-modal-header">
              <h3>
                <Plus size={18} />
                {replaceIndex !== null
                  ? t('commerce:compare.modalReplaceTitle')
                  : t('commerce:compare.modalAddTitle')}
              </h3>
              <button
                className="compare-modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label={t('commerce:compare.modalClose')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="compare-modal-filters">
              <div className="compare-search-input-wrap">
                <Search size={16} />
                <input 
                  type="text"
                  placeholder={t('commerce:compare.modalSearchPlaceholder')}
                  value={modalSearchQuery}
                  onChange={e => setModalSearchQuery(e.target.value)}
                  className="compare-modal-input"
                  autoFocus
                />
              </div>

              <select 
                value={modalCatFilter} 
                onChange={e => setModalCatFilter(e.target.value)}
                className="compare-modal-select"
              >
                <option value="all">{t('commerce:compare.modalAllCategories')}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {t('commerce:compare.modalCategoryOption', {
                      icon: c.icon,
                      category: t(`catalog:categories.${c.id}.name`, { defaultValue: c.name }),
                    })}
                  </option>
                ))}
              </select>
            </div>

            {/* Modal Product List */}
            <div className="compare-modal-list">
              {availableModalProducts.length === 0 ? (
                <div className="compare-modal-empty">
                  <Info size={32} />
                  <p>{t('commerce:compare.modalEmpty')}</p>
                </div>
              ) : (
                availableModalProducts.map(product => (
                  <div key={product.id} className="compare-modal-item">
                    <img src={product.images[0]} alt={product.name} className="compare-modal-item-img" />
                    <div className="compare-modal-item-info">
                      <div className="compare-modal-item-name">{product.name}</div>
                      <div className="compare-modal-item-meta">
                        <span className="price">{money(product.price ?? 0)}</span>
                        <span className="rating">
                          {t('commerce:compare.modalRating', {
                            rating: product.rating ?? 5,
                            count: product.reviewCount ?? 0,
                          })}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="compare-modal-select-btn"
                      onClick={() => handleAddProduct(product)}
                    >
                      {t('commerce:compare.modalSelect')}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ComparePage;
