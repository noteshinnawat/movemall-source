// src/pages/CartPage.tsx — Movemall Modern Interactive Marketplace Cart

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  Store as StoreIcon,
  Ticket,
  Coins,
  ChevronRight,
  Heart,
  ShieldCheck,
  Minus,
  Plus,
  Truck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { stores } from '../data/stores';
import { products as allProducts } from '../data/products';
import { getProductUrl } from '../utils/seo';
import { ProductCard } from '../components/ProductCard';
import { LocalizedLink, useLocalizedPath } from '../i18n/LocalizedLink';
import { formatCurrency } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import type { CartItem as CartItemType, Product } from '../types';
import './CartPage.css';

interface CartPageProps {
  items: CartItemType[];
  subtotal: number;
  shipping: number;
  total: number;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onAddToCart?: (product: Product, qty?: number) => void;
  isWishlisted?: (productId: string) => boolean;
  onToggleWishlist?: (product: Product) => void;
}

const FREE_SHIPPING_THRESHOLD = 299;

export function CartPage({
  items,
  onUpdateQty,
  onRemove,
  onClear,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}: CartPageProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['commerce', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const localizePath = useLocalizedPath();
  const money = (value: number) => formatCurrency(value, locale);

  // Selected item IDs (default to all items selected)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(items.map(i => i.product.id)));

  // Platform Voucher code state
  const [voucherApplied, setVoucherApplied] = useState<boolean>(true);
  const [voucherDiscount, setVoucherDiscount] = useState<number>(50);

  // Movemall Coins toggle state
  const [useCoins, setUseCoins] = useState<boolean>(false);
  const userCoins = 150;
  const coinsDiscount = useCoins ? Math.min(userCoins, 50) : 0;

  // Sync selected IDs when items change (e.g. if item added or removed)
  useMemo(() => {
    setSelectedIds(prev => {
      const updated = new Set<string>();
      items.forEach(i => {
        if (prev.size === 0 || prev.has(i.product.id)) {
          updated.add(i.product.id);
        }
      });
      return updated.size > 0 ? updated : new Set(items.map(i => i.product.id));
    });
  }, [items]);

  // Selected items calculation
  const selectedItems = items.filter(i => selectedIds.has(i.product.id));
  const selectedCount = selectedItems.reduce((s, i) => s + i.quantity, 0);
  const selectedSubtotal = selectedItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const selectedOriginalTotal = selectedItems.reduce(
    (s, i) => s + (i.product.originalPrice || i.product.price) * i.quantity,
    0
  );
  const selectedSavings = Math.max(0, selectedOriginalTotal - selectedSubtotal) + (voucherApplied ? voucherDiscount : 0) + coinsDiscount;

  const shippingFee = selectedSubtotal >= FREE_SHIPPING_THRESHOLD || selectedSubtotal === 0 ? 0 : 40;
  const finalTotal = Math.max(0, selectedSubtotal - (voucherApplied ? voucherDiscount : 0) - coinsDiscount + shippingFee);

  const progressPct = Math.min(100, (selectedSubtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - selectedSubtotal);

  // Group items by store
  const storeGroups = useMemo(() => {
    const map = new Map<string, CartItemType[]>();
    items.forEach(item => {
      const storeId = item.product.storeId || 'store-techpro';
      if (!map.has(storeId)) map.set(storeId, []);
      map.get(storeId)!.push(item);
    });
    return Array.from(map.entries()).map(([storeId, groupItems]) => {
      const storeInfo = stores.find(s => s.id === storeId) || {
        id: storeId,
        name: t('commerce:cart.storeFallbackName'),
        badge: 'official' as const,
        rating: 4.9,
      };
      return { storeInfo, groupItems };
    });
  }, [items, t]);

  // Recommended products (excluding items in cart)
  const recommendedProducts = useMemo(() => {
    const inCartIds = new Set(items.map(i => i.product.id));
    return allProducts.filter(p => !inCartIds.has(p.id)).slice(0, 6);
  }, [items]);

  // Toggle single item
  function toggleItem(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Toggle all items
  function toggleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.product.id)));
    }
  }

  // Toggle store items
  function toggleStore(storeGroupItems: CartItemType[]) {
    const storeItemIds = storeGroupItems.map(i => i.product.id);
    const allStoreSelected = storeItemIds.every(id => selectedIds.has(id));

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allStoreSelected) {
        storeItemIds.forEach(id => next.delete(id));
      } else {
        storeItemIds.forEach(id => next.add(id));
      }
      return next;
    });
  }

  // Remove selected items
  function handleRemoveSelected() {
    selectedIds.forEach(id => onRemove(id));
  }

  if (items.length === 0) {
    return (
      <main className="cart-page-modern">
        <div className="container">
          <div className="cart-empty-state">
            <div className="cart-empty-icon-wrap">
              <ShoppingBag size={56} className="cart-empty-bag-icon" />
            </div>
            <h1 className="cart-empty-title">{t('commerce:cart.empty.title')}</h1>
            <p className="cart-empty-subtitle">
              {t('commerce:cart.empty.subtitle')}
            </p>
            <div className="cart-empty-actions">
              <LocalizedLink to="/shop" className="cart-empty-primary-btn" id="cart-empty-shop-btn">
                {t('commerce:cart.empty.startShopping')}
              </LocalizedLink>
              <LocalizedLink to="/mall" className="cart-empty-secondary-btn">
                {t('commerce:cart.empty.viewMall')}
              </LocalizedLink>
            </div>

            {/* Recommendations Grid */}
            <div className="cart-empty-recommendations">
              <div className="cart-recom-header">
                <span className="cart-recom-tag">{t('commerce:cart.empty.recommendedTag')}</span>
                <h2 className="cart-recom-title">{t('commerce:cart.empty.recommendedTitle')}</h2>
              </div>
              <div className="cart-recom-grid">
                {recommendedProducts.slice(0, 4).map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={onAddToCart ? () => onAddToCart(p, 1) : undefined}
                    isWishlisted={isWishlisted?.(p.id)}
                    onToggleWishlist={onToggleWishlist ? () => onToggleWishlist(p) : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isAllSelected = selectedIds.size === items.length && items.length > 0;

  return (
    <main className="cart-page-modern">
      {/* ── Top Bar Header ── */}
      <header className="cart-modern-topbar">
        <div className="container cart-topbar-inner">
          <div className="cart-topbar-left">
            <button
              className="cart-back-nav-btn"
              onClick={() => navigate(-1)}
              aria-label={t('commerce:cart.topbar.back')}
              title={t('commerce:cart.topbar.back')}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="cart-topbar-heading">
              <h1 className="cart-main-title">
                {t('commerce:cart.topbar.title')}
                <span className="cart-items-pill">
                  {t('commerce:cart.topbar.itemCount', { count: items.length })}
                </span>
              </h1>
            </div>
          </div>

          <div className="cart-topbar-right">
            {selectedIds.size > 0 && (
              <button
                className="cart-delete-selected-btn"
                onClick={handleRemoveSelected}
                title={t('commerce:cart.topbar.deleteSelectedTitle')}
              >
                <Trash2 size={14} />
                <span>
                  {t('commerce:cart.topbar.deleteSelected', {
                    count: selectedIds.size,
                  })}
                </span>
              </button>
            )}
            <button
              className="cart-clear-all-header-btn"
              onClick={onClear}
              title={t('commerce:cart.topbar.clearAllTitle')}
            >
              {t('commerce:cart.topbar.clearAll')}
            </button>
          </div>
        </div>
      </header>

      {/* ── Free Shipping Notification Bar ── */}
      <div className="cart-free-shipping-banner">
        <div className="container cart-free-shipping-inner">
          <div className="cart-shipping-info">
            <div className="cart-shipping-icon-wrap">
              <Truck size={17} />
            </div>
            <div className="cart-shipping-text-wrap">
              {remainingForFreeShipping === 0 ? (
                <span className="cart-shipping-congrats">
                  <Trans
                    i18nKey="cart.freeShipping.achieved"
                    ns="commerce"
                    components={{ b: <strong /> }}
                  />
                </span>
              ) : (
                <span className="cart-shipping-hint">
                  <Trans
                    i18nKey="cart.freeShipping.remaining"
                    ns="commerce"
                    values={{ amount: money(remainingForFreeShipping) }}
                    components={{ b: <strong /> }}
                  />
                </span>
              )}
            </div>
          </div>
          <div className="cart-shipping-progress-track">
            <div
              className="cart-shipping-progress-bar"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      <div className="container cart-layout-grid">
        {/* ── Left Column: Store-Grouped Cart Items ── */}
        <section className="cart-items-column" aria-label={t('commerce:cart.itemsAria')}>
          {/* Select All Bar Header */}
          <div className="cart-select-all-header">
            <label className="cart-checkbox-label">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="cart-hidden-checkbox"
              />
              <span className="cart-custom-checkbox">
                {isAllSelected ? <CheckSquare size={18} /> : <Square size={18} />}
              </span>
              <span className="cart-select-all-text">
                {t('commerce:cart.selectAll', { count: items.length })}
              </span>
            </label>

            <span className="cart-selected-summary-badge">
              {t('commerce:cart.selectedSummary', { count: selectedCount })}
            </span>
          </div>

          {/* Store Groups */}
          <div className="cart-store-groups-list">
            {storeGroups.map(({ storeInfo, groupItems }) => {
              const storeItemIds = groupItems.map(i => i.product.id);
              const isStoreAllSelected = storeItemIds.every(id => selectedIds.has(id));

              return (
                <div key={storeInfo.id} className="cart-store-card">
                  {/* Store Header */}
                  <div className="cart-store-card-header">
                    <label className="cart-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isStoreAllSelected}
                        onChange={() => toggleStore(groupItems)}
                        className="cart-hidden-checkbox"
                      />
                      <span className="cart-custom-checkbox">
                        {isStoreAllSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </span>
                    </label>

                    <LocalizedLink to={`/store/${storeInfo.id}`} className="cart-store-name-link">
                      <StoreIcon size={16} className="cart-store-icon" />
                      {storeInfo.badge === 'official' && (
                        <span className="cart-mall-badge">Mall</span>
                      )}
                      <span className="cart-store-title">{storeInfo.name}</span>
                      <ChevronRight size={14} className="cart-store-chevron" />
                    </LocalizedLink>

                    <button
                      className="cart-store-voucher-btn"
                      onClick={() =>
                        alert(t('commerce:cart.storeVoucherClaimed', { store: storeInfo.name }))
                      }
                      title={t('commerce:cart.storeVoucherTitle')}
                    >
                      <Ticket size={13} />
                      <span>{t('commerce:cart.storeVoucher')}</span>
                    </button>
                  </div>

                  {/* Store Items List */}
                  <div className="cart-store-items-list">
                    {groupItems.map(item => {
                      const isSelected = selectedIds.has(item.product.id);
                      const discount = item.product.originalPrice
                        ? Math.round(((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100)
                        : null;
                      const itemTotal = item.product.price * item.quantity;

                      return (
                        <div
                          key={item.product.id}
                          className={`cart-product-row ${isSelected ? 'cart-product-row--selected' : ''}`}
                        >
                          {/* Checkbox */}
                          <label className="cart-checkbox-label">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItem(item.product.id)}
                              className="cart-hidden-checkbox"
                            />
                            <span className="cart-custom-checkbox">
                              {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                            </span>
                          </label>

                          {/* Product Thumbnail */}
                          <LocalizedLink
                            to={getProductUrl(item.product)}
                            className="cart-product-img-wrap"
                          >
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="cart-product-img"
                              loading="lazy"
                            />
                            {item.product.badge && (
                              <span className={`cart-img-badge cart-img-badge--${item.product.badge}`}>
                                {item.product.badge === 'sale'
                                  ? t('commerce:cart.badges.sale')
                                  : t('commerce:cart.badges.hot')}
                              </span>
                            )}
                          </LocalizedLink>

                          {/* Product Info & Controls */}
                          <div className="cart-product-info-wrap">
                            <div className="cart-product-title-row">
                              <h3 className="cart-product-name">
                                <LocalizedLink to={getProductUrl(item.product)}>
                                  {item.product.name}
                                </LocalizedLink>
                              </h3>
                              <button
                                className="cart-item-trash-btn"
                                onClick={() => onRemove(item.product.id)}
                                title={t('commerce:cart.item.removeTitle', {
                                  product: item.product.name,
                                })}
                                aria-label={t('commerce:cart.item.removeAria')}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>

                            {/* Variation Tag Badge */}
                            <div className="cart-product-variation-tag">
                              <span>
                                {t('commerce:cart.item.variation', {
                                  variant:
                                    item.product.category === 'fashion'
                                      ? t('commerce:cart.variants.fashion')
                                      : item.product.category === 'electronics'
                                        ? t('commerce:cart.variants.electronics')
                                        : t('commerce:cart.variants.standard'),
                                })}
                              </span>
                              <span className="cart-var-tag-divider">•</span>
                              <span className="cart-paylater-pill">{t('commerce:cart.item.payLater')}</span>
                            </div>

                            {/* Price & Quantity Stepper Row */}
                            <div className="cart-product-price-qty-row">
                              <div className="cart-product-price-col">
                                <div className="cart-product-current-price">
                                  {money(item.product.price)}
                                </div>
                                {item.product.originalPrice && (
                                  <div className="cart-product-orig-price-wrap">
                                    <span className="cart-product-orig-price">
                                      {money(item.product.originalPrice)}
                                    </span>
                                    {discount && (
                                      <span className="cart-product-discount-pill">
                                        {t('commerce:cart.item.discount', { discount })}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Stepper */}
                              <div className="cart-stepper-control">
                                <button
                                  className="cart-stepper-btn"
                                  onClick={() => onUpdateQty(item.product.id, item.quantity - 1)}
                                  aria-label={t('commerce:cart.item.decrease')}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus size={13} />
                                </button>
                                <input
                                  type="number"
                                  className="cart-stepper-input"
                                  value={item.quantity}
                                  min={1}
                                  max={item.product.stock}
                                  onChange={e =>
                                    onUpdateQty(
                                      item.product.id,
                                      Math.min(item.product.stock, Math.max(1, Number(e.target.value) || 1))
                                    )
                                  }
                                  aria-label={t('commerce:cart.item.quantityAria')}
                                />
                                <button
                                  className="cart-stepper-btn"
                                  onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}
                                  aria-label={t('commerce:cart.item.increase')}
                                  disabled={item.quantity >= item.product.stock}
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Item Subtotal Highlight */}
                            <div className="cart-item-subtotal-footer">
                              <span className="cart-item-subtotal-label">{t('commerce:cart.item.subtotalLabel')}</span>
                              <span className="cart-item-subtotal-val">{money(itemTotal)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shopee-style Movemall Vouchers & Coins Platform Hub */}
          <div className="cart-platform-perks-card">
            {/* Voucher Row */}
            <div className="cart-perk-row" onClick={() => setVoucherApplied(v => !v)}>
              <div className="cart-perk-left">
                <Ticket size={18} className="cart-perk-icon cart-perk-icon--voucher" />
                <div>
                  <span className="cart-perk-title">{t('commerce:cart.perks.voucherTitle')}</span>
                  <p className="cart-perk-desc">
                    {voucherApplied
                      ? t('commerce:cart.perks.voucherApplied', { amount: money(voucherDiscount) })
                      : t('commerce:cart.perks.voucherIdle')}
                  </p>
                </div>
              </div>
              <div className="cart-perk-right">
                {voucherApplied ? (
                  <span className="cart-perk-badge cart-perk-badge--applied">
                    {t('commerce:cart.perks.voucherBadge', { amount: money(voucherDiscount) })}
                  </span>
                ) : (
                  <span className="cart-perk-action-text">{t('commerce:cart.perks.voucherAction')}</span>
                )}
              </div>
            </div>

            <div className="cart-perk-divider" />

            {/* Coins Row */}
            <div className="cart-perk-row" onClick={() => setUseCoins(c => !c)}>
              <div className="cart-perk-left">
                <Coins size={18} className="cart-perk-icon cart-perk-icon--coins" />
                <div>
                  <span className="cart-perk-title">{t('commerce:cart.perks.coinsTitle')}</span>
                  <p className="cart-perk-desc">
                    {t('commerce:cart.perks.coinsDesc', {
                      count: userCoins,
                      max: money(50),
                    })}
                  </p>
                </div>
              </div>
              <div className="cart-perk-right">
                <label className="cart-coins-toggle-switch" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={useCoins}
                    onChange={() => setUseCoins(c => !c)}
                  />
                  <span className="cart-toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Column: Order Summary Sidebar (Desktop Sticky) ── */}
        <aside className="cart-summary-sidebar" aria-label={t('commerce:cart.summary.aria')}>
          <div className="cart-summary-card">
            <h2 className="cart-summary-heading">
              {t('commerce:cart.summary.heading')}
              <span className="cart-summary-count">
                {t('commerce:cart.summary.count', { count: selectedCount })}
              </span>
            </h2>

            <div className="cart-summary-breakdown">
              <div className="cart-summary-line">
                <span className="cart-summary-line-label">
                  {t('commerce:cart.summary.items', { count: selectedCount })}
                </span>
                <span className="cart-summary-line-val">{money(selectedSubtotal)}</span>
              </div>

              {selectedSavings > 0 && (
                <div className="cart-summary-line cart-summary-line--savings">
                  <span className="cart-summary-line-label">
                    <Sparkles size={14} /> {t('commerce:cart.summary.savings')}
                  </span>
                  <span className="cart-summary-line-val">-{money(selectedSavings)}</span>
                </div>
              )}

              {voucherApplied && (
                <div className="cart-summary-line cart-summary-line--voucher">
                  <span className="cart-summary-line-label">
                    <Ticket size={14} /> {t('commerce:cart.summary.voucher')}
                  </span>
                  <span className="cart-summary-line-val">-{money(voucherDiscount)}</span>
                </div>
              )}

              {useCoins && (
                <div className="cart-summary-line cart-summary-line--coins">
                  <span className="cart-summary-line-label">
                    <Coins size={14} />{' '}
                    {t('commerce:cart.summary.coins', { count: coinsDiscount })}
                  </span>
                  <span className="cart-summary-line-val">-{money(coinsDiscount)}</span>
                </div>
              )}

              <div className="cart-summary-line">
                <span className="cart-summary-line-label">{t('commerce:cart.summary.shipping')}</span>
                {shippingFee === 0 ? (
                  <span className="cart-summary-line-val cart-summary-line-val--free">
                    {t('commerce:cart.summary.shippingFree', { amount: money(0) })}
                  </span>
                ) : (
                  <span className="cart-summary-line-val">{money(shippingFee)}</span>
                )}
              </div>
            </div>

            <div className="cart-summary-divider" />

            <div className="cart-summary-total-block">
              <div className="cart-summary-total-label-wrap">
                <span className="cart-summary-total-title">{t('commerce:cart.summary.totalTitle')}</span>
                <span className="cart-summary-total-tax">{t('commerce:cart.summary.totalTax')}</span>
              </div>
              <div className="cart-summary-total-amount">
                {money(finalTotal)}
              </div>
            </div>

            {selectedSavings > 0 && (
              <div className="cart-summary-savings-banner">
                <Trans
                  i18nKey="cart.summary.savingsBanner"
                  ns="commerce"
                  values={{ amount: money(selectedSavings) }}
                  components={{ b: <strong /> }}
                />
              </div>
            )}

            <button
              id="cart-checkout-btn-sidebar"
              className="cart-checkout-main-btn"
              onClick={() => navigate(localizePath('/checkout'))}
              disabled={selectedCount === 0}
            >
              <span>
                {t('commerce:cart.summary.checkout', { count: selectedCount })}
              </span>
              <ArrowRight size={18} />
            </button>

            <div className="cart-guarantee-perks">
              <div className="cart-guarantee-item">
                <ShieldCheck size={16} className="cart-guarantee-icon" />
                <span>{t('commerce:cart.summary.guaranteeAuthentic')}</span>
              </div>
              <div className="cart-guarantee-item">
                <CheckCircle2 size={16} className="cart-guarantee-icon" />
                <span>{t('commerce:cart.summary.guaranteeReturns')}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Recommended Products Section ── */}
      <section className="cart-recommendations-section">
        <div className="container">
          <div className="cart-recom-master-header">
            <div className="cart-recom-header-left">
              <span className="cart-recom-tag">{t('commerce:cart.recommendations.tag')}</span>
              <h2 className="cart-recom-title">{t('commerce:cart.recommendations.title')}</h2>
            </div>
            <LocalizedLink to="/shop" className="cart-recom-more-link">
              {t('commerce:cart.recommendations.viewAll')}
            </LocalizedLink>
          </div>

          <div className="cart-recom-grid">
            {recommendedProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={onAddToCart ? () => onAddToCart(p, 1) : undefined}
                isWishlisted={isWishlisted?.(p.id)}
                onToggleWishlist={onToggleWishlist ? () => onToggleWishlist(p) : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Shopee-Style Sticky Bottom Checkout Dock (Mobile & Quick Action) ── */}
      <div className="cart-sticky-checkout-dock" aria-label={t('commerce:cart.dock.aria')}>
        <div className="container cart-sticky-dock-inner">
          {/* Left: Select All */}
          <div className="cart-sticky-select-all">
            <label className="cart-checkbox-label">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="cart-hidden-checkbox"
              />
              <span className="cart-custom-checkbox">
                {isAllSelected ? <CheckSquare size={19} /> : <Square size={19} />}
              </span>
              <span className="cart-sticky-select-text">
                {t('commerce:cart.dock.selectAll', { count: items.length })}
              </span>
            </label>
          </div>

          {/* Middle: Total & Savings */}
          <div className="cart-sticky-total-col">
            <div className="cart-sticky-total-row">
              <span className="cart-sticky-total-label">{t('commerce:cart.dock.totalLabel')}</span>
              <span className="cart-sticky-total-price">{money(finalTotal)}</span>
            </div>
            {selectedSavings > 0 ? (
              <div className="cart-sticky-savings-pill">
                {t('commerce:cart.dock.savings', { amount: money(selectedSavings) })}
              </div>
            ) : (
              <div className="cart-sticky-free-ship-tag">
                {t('commerce:cart.dock.freeShippingHint', { amount: money(FREE_SHIPPING_THRESHOLD) })}
              </div>
            )}
          </div>

          {/* Right: Big Checkout Button */}
          <button
            id="cart-sticky-checkout-btn"
            className="cart-sticky-checkout-btn"
            onClick={() => navigate(localizePath('/checkout'))}
            disabled={selectedCount === 0}
          >
            <span>
              {t('commerce:cart.dock.checkout', { count: selectedCount })}
            </span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}

export default CartPage;
