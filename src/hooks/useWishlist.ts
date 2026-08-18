// src/hooks/useWishlist.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Product } from '../types';
import { products as fallbackProducts } from '../data/products';
import { syncUserWishlist, toggleUserWishlistItem, removeUserWishlistItem } from '../utils/api';

const STORAGE_KEY = 'movemall_wishlist';

function load(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

export function useWishlist(customProductsList?: Product[]) {
  const [items, setItems] = useState<Product[]>(load);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const isSyncingRef = useRef<boolean>(false);

  // Sync to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota error
    }
  }, [items]);

  // Cloud Auto-Sync on Login or token availability
  const performCloudSync = useCallback(async () => {
    const token = localStorage.getItem('movemall_jwt_token');
    if (!token || isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      const localItems = load();
      const localIds = localItems.map(p => p.id);

      const res = await syncUserWishlist(localIds);
      if (res && Array.isArray(res.productIds)) {
        const pool = [
          ...(customProductsList || []),
          ...localItems,
          ...fallbackProducts,
        ];
        const poolMap = new Map<string, Product>();
        pool.forEach(p => poolMap.set(p.id, p));

        // Reconstruct merged items list
        const mergedList: Product[] = [];
        for (const pid of res.productIds) {
          if (poolMap.has(pid)) {
            mergedList.push(poolMap.get(pid)!);
          } else {
            // Check if server returned product object
            const serverItem = res.items?.find(i => i.productId === pid);
            if (serverItem?.product) {
              const sp = serverItem.product;
              mergedList.push({
                id: sp.id,
                storeId: sp.storeId || 'store-1',
                name: sp.name,
                price: Number(sp.price),
                originalPrice: sp.originalPrice ? Number(sp.originalPrice) : undefined,
                images: Array.isArray(sp.images) && sp.images.length > 0 ? sp.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'],
                rating: Number(sp.rating || 5),
                reviewCount: Number(sp.reviewCount || 0),
                stock: sp.stock || 99,
                category: sp.category || 'electronics',
                description: sp.description || sp.name,
                tags: Array.isArray(sp.tags) ? sp.tags : ['Wishlist'],
                isMall: sp.isMall,
              });
            }
          }
        }

        setItems(mergedList);
        setIsCloudSynced(true);
        console.log(`[Wishlist Cloud] ☁️ Synced ${mergedList.length} items with User Cloud Account!`);
      }
    } catch (err) {
      console.info('[Wishlist Cloud] Sync skipped or offline:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [customProductsList]);

  // Trigger sync on mount and when storage/auth events fire
  useEffect(() => {
    performCloudSync();

    const handleAuthChange = () => {
      performCloudSync();
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('movemall_auth_change', handleAuthChange);
    window.addEventListener('focus', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('movemall_auth_change', handleAuthChange);
      window.removeEventListener('focus', handleAuthChange);
    };
  }, [performCloudSync]);

  function toggle(product: Product) {
    const isWishedNow = items.some(p => p.id === product.id);
    
    // Optimistic UI update
    setItems(prev =>
      isWishedNow
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );

    // Cloud background sync if logged in
    const token = localStorage.getItem('movemall_jwt_token');
    if (token) {
      toggleUserWishlistItem(product.id).catch(err => {
        console.info('[Wishlist Cloud] Toggle backend notification error:', err);
      });
    }
  }

  function remove(productId: string) {
    setItems(prev => prev.filter(p => p.id !== productId));

    const token = localStorage.getItem('movemall_jwt_token');
    if (token) {
      removeUserWishlistItem(productId).catch(err => {
        console.info('[Wishlist Cloud] Remove backend notification error:', err);
      });
    }
  }

  function isWished(productId: string) {
    return items.some(p => p.id === productId);
  }

  return { items, toggle, remove, isWished, count: items.length, isCloudSynced, syncCloud: performCloudSync };
}

