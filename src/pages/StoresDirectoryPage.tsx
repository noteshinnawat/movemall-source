// src/pages/StoresDirectoryPage.tsx — Stores & Brands Directory

import { Link } from 'react-router-dom';
import { Store as StoreIcon, ShieldCheck, Star } from 'lucide-react';
import { stores } from '../data/stores';
import './StoresDirectoryPage.css';

import { useState, useEffect } from 'react';
import { fetchStoresApi } from '../utils/api';
import type { Store } from '../types';

export function StoresDirectoryPage() {
  const [storeList, setStoreList] = useState<Store[]>(stores);

  useEffect(() => {
    async function loadStores() {
      try {
        const res = await fetchStoresApi();
        if (res && Array.isArray(res.stores) && res.stores.length > 0) {
          const mapped: Store[] = res.stores.map(s => ({
            id: s.id,
            name: s.name,
            logo: s.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80',
            banner: s.banner || 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
            badge: s.isMall ? 'official' : 'preferred',
            rating: s.rating || 4.8,
            reviewCount: 1200,
            responseRate: '98%',
            responseTime: 'ภายในไม่กี่นาที',
            joinedDate: '1 ปีที่แล้ว',
            productCount: s._count?.products || 20,
            followerCount: s.followers || 15000,
            location: 'กรุงเทพมหานคร',
            description: s.description || 'ร้านค้าทางการ Movemall ของแท้ 100%',
          }));
          setStoreList(mapped);
        }
      } catch {
        // Fallback
      }
    }
    loadStores();
  }, []);

  return (
    <main className="stores-page">
      <section className="stores-hero">
        <div className="container">
          <h1 className="stores-hero__title">🏬 ร้านค้าทางการ & แบรนด์ชั้นนำ (Movemall Official)</h1>
          <p className="stores-hero__subtitle">
            ร้านทางการและร้านแนะนำในที่เดียว
          </p>
        </div>
      </section>

      <div className="container">
        <div className="stores-grid">
          {storeList.map(store => (
            <div key={store.id} className="store-card">
              <div className="store-card__top">
                <img src={store.logo} alt={store.name} className="store-card__logo" />
                <div>
                  <h2 className="store-card__name">
                    {store.name}
                    {store.badge === 'official' && (
                      <span style={{ fontSize: 10, background: 'var(--primary)', color: 'white', padding: '1px 5px', marginLeft: 6 }}>
                        Official
                      </span>
                    )}
                  </h2>
                  <p className="store-card__desc">{store.description}</p>
                </div>
              </div>

              <div className="store-card__stats">
                <div>
                  <div className="store-card__stat-val">⭐ {store.rating}</div>
                  <div className="store-card__stat-label">คะแนนร้าน</div>
                </div>
                <div>
                  <div className="store-card__stat-val">{(store.followerCount ?? 0).toLocaleString()}</div>
                  <div className="store-card__stat-label">ผู้ติดตาม</div>
                </div>
                <div>
                  <div className="store-card__stat-val">{store.productCount} รายการ</div>
                  <div className="store-card__stat-label">สินค้าทั้งหมด</div>
                </div>
              </div>

              <Link to={`/store/${store.id}`} className="store-card__btn">
                เข้าชมหน้าร้านค้า →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default StoresDirectoryPage;
