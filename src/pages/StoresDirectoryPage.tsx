// src/pages/StoresDirectoryPage.tsx — Stores & Brands Directory

import { Link } from 'react-router-dom';
import { Store as StoreIcon, ShieldCheck, Star } from 'lucide-react';
import { stores } from '../data/stores';
import './StoresDirectoryPage.css';

export function StoresDirectoryPage() {
  return (
    <main className="stores-page">
      <section className="stores-hero">
        <div className="container">
          <h1 className="stores-hero__title">🏬 ร้านค้าทางการ & แบรนด์ชั้นนำ (Movemall Official)</h1>
          <p className="stores-hero__subtitle">
            รวมร้านค้า Official Store และร้านแนะนำชั้นนำ พร้อมสินค้าแท้ 100% รับประกันคุณภาพและการจัดส่ง
          </p>
        </div>
      </section>

      <div className="container">
        <div className="stores-grid">
          {stores.map(store => (
            <div key={store.id} className="store-card">
              <div className="store-card__top">
                <img src={store.logo} alt={store.name} className="store-card__logo" />
                <div>
                  <h2 className="store-card__name">
                    {store.name}
                    {store.badge === 'official' && (
                      <span style={{ fontSize: 10, background: 'var(--primary)', color: 'white', padding: '1px 5px' }}>
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
                  <div className="store-card__stat-val">{store.followerCount.toLocaleString()}</div>
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
