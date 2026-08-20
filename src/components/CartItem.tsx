// src/components/CartItem.tsx

import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { getProductUrl } from '../utils/seo';
import { LocalizedLink } from '../i18n/LocalizedLink';
import { formatCurrency } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import type { CartItem as CartItemType } from '../types';
import './CartItem.css';

interface CartItemProps {
  item: CartItemType;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({ item, onUpdateQty, onRemove }: CartItemProps) {
  const { t, i18n } = useTranslation(['commerce', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const { product, quantity } = item;
  const totalPrice = product.price * quantity;

  return (
    <div className="cart-item" role="listitem">
      {/* Image */}
      {product.images[0] ? (
        <img
          src={product.images[0]}
          alt={product.name}
          className="cart-item__image"
          loading="lazy"
        />
      ) : (
        <div className="cart-item__image-placeholder">🛍️</div>
      )}

      {/* Body */}
      <div className="cart-item__body">
        <p className="cart-item__category">{product.category}</p>
        <h3 className="cart-item__name">
          <LocalizedLink to={getProductUrl(product)}>{product.name}</LocalizedLink>
        </h3>

        <div className="cart-item__bottom">
          {/* Qty control */}
          <div className="cart-item__qty">
            <button
              className="cart-item__qty-btn"
              onClick={() => onUpdateQty(product.id, quantity - 1)}
              aria-label={t('commerce:cartItem.decrease')}
              id={`cart-decrease-${product.id}`}
            >
              <Minus size={13} />
            </button>
            <input
              type="number"
              className="cart-item__qty-num"
              value={quantity}
              min={1}
              max={product.stock}
              onChange={e => onUpdateQty(product.id, Number(e.target.value))}
              aria-label={t('commerce:cartItem.quantityAria', { product: product.name })}
            />
            <button
              className="cart-item__qty-btn"
              onClick={() => onUpdateQty(product.id, quantity + 1)}
              disabled={quantity >= product.stock}
              aria-label={t('commerce:cartItem.increase')}
              id={`cart-increase-${product.id}`}
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Price */}
          <div className="cart-item__price-col">
            <p className="cart-item__unit-price">
              {t('commerce:cartItem.unitPrice', {
                price: formatCurrency(product.price, locale),
                quantity,
              })}
            </p>
            <p className="cart-item__total-price">
              {formatCurrency(totalPrice, locale)}
            </p>
          </div>

          {/* Remove */}
          <button
            className="cart-item__remove"
            onClick={() => onRemove(product.id)}
            aria-label={t('commerce:cartItem.removeAria', { product: product.name })}
            id={`cart-remove-${product.id}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItem;
