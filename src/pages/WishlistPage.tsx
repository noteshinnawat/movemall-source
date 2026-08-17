// src/pages/WishlistPage.tsx

import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import type { Product } from '../types';
import './WishlistPage.css';

interface WishlistPageProps {
  items: Product[];
  onAddToCart: (product: Product) => void;
}

export function WishlistPage({ items, onAddToCart }: WishlistPageProps) {
  if (items.length === 0) {
    return (
      <main className="wishlist">
        <div className="container">
          <div className="wishlist__empty">
            <div className="wishlist__empty-icon">💔</div>
            <h1 className="wishlist__empty-title">ยังไม่มีสินค้าที่บันทึกไว้</h1>
            <p className="wishlist__empty-sub">กดไอคอนหัวใจที่สินค้าเพื่อบันทึกไว้ดูภายหลังได้เลย</p>
            <Link to="/shop" className="wishlist__empty-btn">
              <ShoppingBag size={18} />
              ไปเลือกดูสินค้า
            </Link>
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
            สินค้าที่บันทึกไว้ (Wishlist)
            <span className="wishlist__count-badge">{items.length} รายการ</span>
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

export default WishlistPage;
