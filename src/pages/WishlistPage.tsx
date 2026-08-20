// src/pages/WishlistPage.tsx

import { useTranslation } from 'react-i18next';
import { Heart, ShoppingBag } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { LocalizedLink } from '../i18n/LocalizedLink';
import { formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import type { Product } from '../types';
import './WishlistPage.css';

interface WishlistPageProps {
  items: Product[];
  onAddToCart: (product: Product) => void;
}

export function WishlistPage({ items, onAddToCart }: WishlistPageProps) {
  const { t, i18n } = useTranslation(['commerce', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);

  if (items.length === 0) {
    return (
      <main className="wishlist">
        <div className="container">
          <div className="wishlist__empty">
            <div className="wishlist__empty-icon">💔</div>
            <h1 className="wishlist__empty-title">{t('commerce:wishlist.emptyTitle')}</h1>
            <p className="wishlist__empty-sub">{t('commerce:wishlist.emptySubtitle')}</p>
            <LocalizedLink to="/shop" className="wishlist__empty-btn">
              <ShoppingBag size={18} />
              {t('commerce:wishlist.emptyCta')}
            </LocalizedLink>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="wishlist">
      <div className="wishlist__header">
        <div className="container">
          <h1 className="wishlist__header-title">
            <Heart size={32} style={{ color: 'var(--accent)' }} fill="var(--accent)" />
            {t('commerce:wishlist.title')}
            <span className="wishlist__count-badge">
              {t('commerce:wishlist.count', { count: formatNumber(items.length, locale) })}
            </span>
          </h1>
        </div>
      </div>

      <div className="container">
        <div className="wishlist__body">
          <div className="wishlist__grid">
            {items.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
