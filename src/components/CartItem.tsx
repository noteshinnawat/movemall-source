// src/components/CartItem.tsx

import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem as CartItemType } from '../types';
import './CartItem.css';

interface CartItemProps {
  item: CartItemType;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({ item, onUpdateQty, onRemove }: CartItemProps) {
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
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>

        <div className="cart-item__bottom">
          {/* Qty control */}
          <div className="cart-item__qty">
            <button
              className="cart-item__qty-btn"
              onClick={() => onUpdateQty(product.id, quantity - 1)}
              aria-label="ลดจำนวน"
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
              aria-label={`จำนวน ${product.name}`}
            />
            <button
              className="cart-item__qty-btn"
              onClick={() => onUpdateQty(product.id, quantity + 1)}
              disabled={quantity >= product.stock}
              aria-label="เพิ่มจำนวน"
              id={`cart-increase-${product.id}`}
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Price */}
          <div className="cart-item__price-col">
            <p className="cart-item__unit-price">
              ฿{product.price.toLocaleString()} × {quantity}
            </p>
            <p className="cart-item__total-price">
              ฿{totalPrice.toLocaleString()}
            </p>
          </div>

          {/* Remove */}
          <button
            className="cart-item__remove"
            onClick={() => onRemove(product.id)}
            aria-label={`ลบ ${product.name} ออกจากตะกร้า`}
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
