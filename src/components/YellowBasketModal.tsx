// src/components/YellowBasketModal.tsx — Yellow Basket Product Drawer Modal for Video Clips

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Zap, Star, ShieldCheck, X, ChevronRight, Check } from 'lucide-react';
import { getProductUrl } from '../utils/seo';
import { LocalizedLink, useLocalizedPath } from '../i18n/LocalizedLink';
import { formatCurrency, formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import type { PinnedProductItem, Product } from '../types';
import './YellowBasketModal.css';

interface YellowBasketModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: PinnedProductItem[];
  onAddToCart: (product: Product, qty?: number) => void;
}

export function YellowBasketModal({
  isOpen,
  onClose,
  products,
  onAddToCart,
}: YellowBasketModalProps) {
  const { t, i18n } = useTranslation(['engagement']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const localizePath = useLocalizedPath();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<PinnedProductItem>(products[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);

  if (!isOpen || !products || products.length === 0) return null;

  const current = selectedProduct || products[0];

  // Convert PinnedProductItem to standard Product for Cart
  const cartProduct: Product = {
    id: current.id,
    storeId: 's1',
    name: current.name,
    price: current.price,
    originalPrice: current.originalPrice,
    images: [current.image],
    category: 'general',
    rating: current.rating || 4.9,
    reviewCount: current.salesCount || 120,
    stock: 99,
    description: t('engagement:video.basket.demoDescription'),
    tags: ['VideoBasket', 'FlashSale'],
    badge: 'hot',
  };

  function handleAdd(item: PinnedProductItem) {
    onAddToCart(cartProduct, quantity);
    setAddedSuccessId(item.id);
    setTimeout(() => setAddedSuccessId(null), 2000);
  }

  function handleBuyNow() {
    onAddToCart(cartProduct, quantity);
    onClose();
    navigate(localizePath('/checkout'));
  }

  return (
    <div className="yellow-basket-overlay" onClick={onClose}>
      <div className="yellow-basket-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="yellow-basket-header">
          <div className="yellow-basket-title-group">
            <span className="yellow-basket-icon-badge">{t('engagement:video.basket.pill')}</span>
            <h3 className="yellow-basket-heading">
              {t('engagement:video.basket.heading', { count: products.length })}
            </h3>
          </div>
          <button className="yellow-basket-close-btn" onClick={onClose} aria-label={t('engagement:video.basket.close')}>
            <X size={20} />
          </button>
        </div>

        {/* Product Items List (if multiple) */}
        {products.length > 1 && (
          <div className="yellow-basket-tabs">
            {products.map((item, idx) => (
              <button
                key={item.id}
                className={`yellow-basket-tab ${current.id === item.id ? 'active' : ''}`}
                onClick={() => setSelectedProduct(item)}
              >
                {t('engagement:video.basket.tabLabel', {
                  index: idx + 1,
                  name: item.name.slice(0, 18),
                })}
              </button>
            ))}
          </div>
        )}

        {/* Main Product Card */}
        <div className="yellow-basket-body">
          <div className="yellow-basket-product-card">
            <div className="yellow-basket-img-box">
              <img src={current.image} alt={current.name} />
              {current.discountPct && (
                <span className="yellow-basket-discount-tag">-{current.discountPct}%</span>
              )}
            </div>

            <div className="yellow-basket-info">
              {current.badge && <span className="yellow-basket-badge">{current.badge}</span>}
              <h4 className="yellow-basket-name">{current.name}</h4>

              <div className="yellow-basket-meta">
                <div className="yellow-basket-rating">
                  <Star size={13} fill="#F59E0B" color="#F59E0B" />
                  <span>{current.rating || 4.9}</span>
                </div>
                <span className="yellow-basket-sales">
                  {t('engagement:video.basket.sold', { count: current.salesCount || 500 })}
                </span>
              </div>

              <div className="yellow-basket-price-row">
                <div className="yellow-basket-price-wrap">
                  <span className="yellow-basket-price">{formatCurrency(current.price, locale)}</span>
                  {current.originalPrice && (
                    <span className="yellow-basket-original">{formatCurrency(current.originalPrice, locale)}</span>
                  )}
                </div>
                <span className="yellow-basket-exclusive-pill">{t('engagement:video.basket.exclusiveDeal')}</span>
              </div>
            </div>
          </div>

          {/* Guarantees & Perks */}
          <div className="yellow-basket-perks">
            <div className="yellow-basket-perk-item">
              <ShieldCheck size={14} color="#10B981" />
              <span>{t('engagement:video.basket.perkAuthentic')}</span>
            </div>
            <div className="yellow-basket-perk-item">
              <span>{t('engagement:video.basket.perkShipping')}</span>
            </div>
            <div className="yellow-basket-perk-item">
              <span>{t('engagement:video.basket.perkPayLater')}</span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="yellow-basket-qty-row">
            <span className="yellow-basket-qty-label">{t('engagement:video.basket.qtyLabel')}</span>
            <div className="yellow-basket-qty-controls">
              <button
                className="yellow-basket-qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="yellow-basket-qty-num">{formatNumber(quantity, locale)}</span>
              <button
                className="yellow-basket-qty-btn"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="yellow-basket-footer">
          <LocalizedLink
            to={getProductUrl(cartProduct)}
            className="yellow-basket-detail-link"
            onClick={onClose}
          >
            {t('engagement:video.basket.viewDetail')} <ChevronRight size={14} />
          </LocalizedLink>

          <div className="yellow-basket-btn-group">
            <button
              className="yellow-basket-add-cart-btn"
              onClick={() => handleAdd(current)}
            >
              {addedSuccessId === current.id ? (
                <>
                  <Check size={16} /> {t('engagement:video.basket.added')}
                </>
              ) : (
                <>
                  <ShoppingCart size={16} /> {t('engagement:video.basket.addToCart')}
                </>
              )}
            </button>
            <button className="yellow-basket-buy-now-btn" onClick={handleBuyNow}>
              <Zap size={16} /> {t('engagement:video.basket.buyNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
