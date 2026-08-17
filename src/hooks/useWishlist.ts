// src/hooks/useWishlist.ts

import { useState, useEffect } from 'react';
import type { Product } from '../types';

const STORAGE_KEY = 'movemall_wishlist';

function load(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

export function useWishlist() {
  const [items, setItems] = useState<Product[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function toggle(product: Product) {
    setItems(prev =>
      prev.some(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );
  }

  function remove(productId: string) {
    setItems(prev => prev.filter(p => p.id !== productId));
  }

  function isWished(productId: string) {
    return items.some(p => p.id === productId);
  }

  return { items, toggle, remove, isWished, count: items.length };
}
