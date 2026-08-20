// src/pages/StoresDirectoryPage.tsx — Stores & Brands Directory

import { useTranslation } from 'react-i18next';
import { Store as StoreIcon, ShieldCheck, Star } from 'lucide-react';
import { stores } from '../data/stores';
import { LocalizedLink } from '../i18n/LocalizedLink';
import { formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './StoresDirectoryPage.css';

import { useState, useEffect } from 'react';
import { fetchStoresApi } from '../utils/api';
import type { Store } from '../types';

export function StoresDirectoryPage() {
  const { t, i18n } = useTranslation(['catalog', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
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
            responseTime: t('catalog:store.defaults.responseTime'),
            joinedDate: t('catalog:store.defaults.joinedOneYear'),
            productCount: s._count?.products || 20,
            followerCount: s.followers || 15000,
            location: t('catalog:store.defaultLocation'),
            description: s.description || t('catalog:storesDirectory.defaultDescription'),
          }));
          setStoreList(mapped);
        }
      } catch {
        // Fallback
      }
    }
    loadStores();
  }, [t]);

  return (
    <main className="stores-page">
      <section className="stores-hero">
        <div className="container">
          <h1 className="stores-hero__title">{t('catalog:storesDirectory.title')}</h1>
          <p className="stores-hero__subtitle">
            {t('catalog:storesDirectory.subtitle')}
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
                        {t('catalog:store.official')}
                      </span>
                    )}
                  </h2>
                  <p className="store-card__desc">{store.description}</p>
                </div>
              </div>

              <div className="store-card__stats">
                <div>
                  <div className="store-card__stat-val">⭐ {store.rating}</div>
                  <div className="store-card__stat-label">{t('catalog:storesDirectory.storeRating')}</div>
                </div>
                <div>
                  <div className="store-card__stat-val">{formatNumber(store.followerCount ?? 0, locale)}</div>
                  <div className="store-card__stat-label">{t('catalog:storesDirectory.followers')}</div>
                </div>
                <div>
                  <div className="store-card__stat-val">{t('catalog:storesDirectory.productCount', { count: formatNumber(store.productCount, locale) })}</div>
                  <div className="store-card__stat-label">{t('catalog:storesDirectory.allProducts')}</div>
                </div>
              </div>

              <LocalizedLink to={`/store/${store.id}`} className="store-card__btn">
                {t('catalog:storesDirectory.visitStore')}
              </LocalizedLink>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default StoresDirectoryPage;
