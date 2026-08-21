import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, Check, Sparkles, Truck, Coins, Store } from 'lucide-react';
import { fetchApi } from '../utils/api';
import { formatCurrency, formatDate } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './VouchersPage.css';

type VoucherType = 'shipping' | 'platform' | 'cashback' | 'store';

interface MockVoucher {
  id: string;
  type: VoucherType;
  catalogKey: string;
}

interface DisplayVoucher {
  id: string;
  type: VoucherType;
  discount: string;
  minSpend: string;
  expiry: string;
  storeName?: string;
}

const MOCK_VOUCHERS: MockVoucher[] = [
  { id: 'v-ship-1', type: 'shipping', catalogKey: 'vShip1' },
  { id: 'v-ship-2', type: 'shipping', catalogKey: 'vShip2' },
  { id: 'v-plat-1', type: 'platform', catalogKey: 'vPlat1' },
  { id: 'v-plat-2', type: 'platform', catalogKey: 'vPlat2' },
  { id: 'v-coin-1', type: 'cashback', catalogKey: 'vCoin1' },
  { id: 'v-store-1', type: 'store', catalogKey: 'vStore1', },
  { id: 'v-store-2', type: 'store', catalogKey: 'vStore2' },
];

const MOCK_STORE_NAMES: Record<string, string> = {
  'v-store-1': 'TechPro Official Store',
  'v-store-2': 'Fashionista Studio',
};

const FILTER_IDS = ['all', 'shipping', 'platform', 'cashback', 'store'] as const;

export function VouchersPage() {
  const { t, i18n } = useTranslation(['engagement']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);

  const [filter, setFilter] = useState<(typeof FILTER_IDS)[number]>('all');
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  // Raw API rows are fetched once; display strings are derived below so a
  // language switch re-translates them without re-fetching from the server.
  const [rawApiVouchers, setRawApiVouchers] = useState<any[] | null>(null);

  useEffect(() => {
    async function loadVouchersFromDb() {
      try {
        const res = await fetchApi<{ vouchers: any[] }>('/api/vouchers');
        if (res && Array.isArray(res.vouchers) && res.vouchers.length > 0) {
          setRawApiVouchers(res.vouchers);
        }
      } catch {
        // Fallback to the mock catalog below
      }
    }
    loadVouchersFromDb();
  }, []);

  const apiVouchers: DisplayVoucher[] | null = rawApiVouchers && rawApiVouchers.map(v => ({
    id: v.id || v.code,
    type: v.discountType === 'free_shipping' ? 'shipping' : v.storeId ? 'store' : 'platform',
    discount: v.discountType === 'free_shipping'
      ? t('engagement:vouchers.api.freeShipping', { amount: formatCurrency(45, locale) })
      : v.discountType === 'percentage'
        ? t('engagement:vouchers.api.percentOff', { percent: v.value })
        : t('engagement:vouchers.api.amountOff', { amount: formatCurrency(v.value, locale) }),
    minSpend: Number(v.minSpend) > 0
      ? t('engagement:vouchers.api.minSpend', { amount: formatCurrency(Number(v.minSpend), locale) })
      : t('engagement:vouchers.api.noMinimum'),
    expiry: t('engagement:vouchers.api.expiresOn', { date: formatDate(v.expiryDate, locale) }),
    storeName: v.store?.name,
  }));

  const mockDisplayVouchers: DisplayVoucher[] = MOCK_VOUCHERS.map(v => ({
    id: v.id,
    type: v.type,
    discount: t(`engagement:vouchers.mock.${v.catalogKey}.discount`),
    minSpend: t(`engagement:vouchers.mock.${v.catalogKey}.minSpend`),
    expiry: t(`engagement:vouchers.mock.${v.catalogKey}.expiry`),
    storeName: MOCK_STORE_NAMES[v.id],
  }));

  const voucherList: DisplayVoucher[] = apiVouchers
    ? [...apiVouchers, ...mockDisplayVouchers.filter(m => !apiVouchers.some(a => a.id === m.id))]
    : mockDisplayVouchers;

  const filteredVouchers = filter === 'all'
    ? voucherList
    : voucherList.filter(v => v.type === filter);

  function handleClaim(id: string) {
    setClaimed(prev => ({ ...prev, [id]: true }));
    try {
      fetchApi('/api/user/vouchers/claim', {
        method: 'POST',
        body: JSON.stringify({ voucherId: id }),
      });
    } catch {
      // Ignore
    }
  }

  function handleClaimAll() {
    const allClaimed: Record<string, boolean> = {};
    voucherList.forEach(v => {
      allClaimed[v.id] = true;
    });
    setClaimed(allClaimed);
  }

  return (
    <main className="vouchers-page">
      <section className="vouchers-hero">
        <div className="container">
          <h1 className="vouchers-hero__title">{t('engagement:vouchers.heroTitle')}</h1>
          <p className="vouchers-hero__subtitle">
            {t('engagement:vouchers.heroSubtitle')}
          </p>

          <button
            onClick={handleClaimAll}
            style={{
              marginTop: 'var(--space-4)',
              padding: '8px 20px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 0,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={15} />
            {t('engagement:vouchers.claimAll')}
          </button>
        </div>
      </section>

      <div className="container">
        {/* Filter Chips */}
        <div className="vouchers-filter-row">
          <button
            className={`voucher-chip${filter === 'all' ? ' voucher-chip--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('engagement:vouchers.filters.all')}
          </button>
          <button
            className={`voucher-chip${filter === 'shipping' ? ' voucher-chip--active' : ''}`}
            onClick={() => setFilter('shipping')}
          >
            <Truck size={14} style={{ display: 'inline', marginRight: 4 }} />
            {t('engagement:vouchers.filters.shipping')}
          </button>
          <button
            className={`voucher-chip${filter === 'platform' ? ' voucher-chip--active' : ''}`}
            onClick={() => setFilter('platform')}
          >
            <Ticket size={14} style={{ display: 'inline', marginRight: 4 }} />
            {t('engagement:vouchers.filters.platform')}
          </button>
          <button
            className={`voucher-chip${filter === 'cashback' ? ' voucher-chip--active' : ''}`}
            onClick={() => setFilter('cashback')}
          >
            <Coins size={14} style={{ display: 'inline', marginRight: 4 }} />
            {t('engagement:vouchers.filters.cashback')}
          </button>
          <button
            className={`voucher-chip${filter === 'store' ? ' voucher-chip--active' : ''}`}
            onClick={() => setFilter('store')}
          >
            <Store size={14} style={{ display: 'inline', marginRight: 4 }} />
            {t('engagement:vouchers.filters.store')}
          </button>
        </div>

        {/* Vouchers Grid */}
        <div className="vouchers-grid">
          {filteredVouchers.map(v => (
            <div
              key={v.id}
              className={`voucher-ticket voucher-ticket--${v.type}`}
            >
              <div className="voucher-ticket__left">
                <span className="voucher-ticket__type">
                  {v.storeName ? v.storeName : t(`engagement:vouchers.typeLabels.${v.type === 'store' ? 'platform' : v.type}`)}
                </span>
                <div className="voucher-ticket__discount">{v.discount}</div>
                <div className="voucher-ticket__min">{v.minSpend}</div>
                <div className="voucher-ticket__expiry">{v.expiry}</div>
              </div>

              <button
                className={`voucher-ticket__btn${claimed[v.id] ? ' voucher-ticket__btn--claimed' : ''}`}
                onClick={() => handleClaim(v.id)}
                disabled={claimed[v.id]}
              >
                {claimed[v.id] ? (
                  <>
                    <Check size={13} style={{ display: 'inline', marginRight: 2 }} />
                    {t('engagement:vouchers.claimed')}
                  </>
                ) : (
                  t('engagement:vouchers.claim')
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default VouchersPage;
