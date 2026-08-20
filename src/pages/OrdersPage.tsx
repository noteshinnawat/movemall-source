import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Calendar, MapPin, Truck, ShoppingBag, ArrowRight, Flag } from 'lucide-react';
import { getStoredOrders, STATUS_COLOR } from '../data/orders';
import type { Order } from '../data/orders';
import { ReportStoreModal } from '../components/ReportStoreModal';
import { LocalizedLink } from '../i18n/LocalizedLink';
import { formatCurrency, formatDate, formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './OrdersPage.css';

import { fetchMyOrdersApi } from '../utils/api';

export function OrdersPage() {
  const { t, i18n } = useTranslation(['commerce', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [reportingOrder, setReportingOrder] = useState<any | null>(null);
  const [orders, setOrders] = useState<Order[]>(() => getStoredOrders());

  useEffect(() => {
    async function loadBackendOrders() {
      try {
        const token = localStorage.getItem('movemall_jwt_token');
        if (token) {
          const res = await fetchMyOrdersApi();
          if (res && Array.isArray(res.orders) && res.orders.length > 0) {
            const mappedOrders: Order[] = res.orders.map((o: any) => ({
              id: o.id,
              createdAt: o.createdAt,
              status: (o.status?.toLowerCase() === 'paid' || o.status?.toLowerCase() === 'preparing') ? 'processing' : (o.status?.toLowerCase() || 'processing'),
              items: (o.items || []).map((item: any) => ({
                productId: item.productId,
                name: item.product?.name || t('commerce:orders.fallbackProductName'),
                image: item.product?.images?.[0] || '',
                price: Number(item.price || 0),
                quantity: item.quantity || 1,
              })),
              subtotal: Number(o.totalAmount || 0) - Number(o.shippingCost || 0),
              shipping: Number(o.shippingCost || 0),
              total: Number(o.totalAmount || 0),
              address: typeof o.shippingAddress === 'string' ? o.shippingAddress : (o.shippingAddress?.address || t('commerce:orders.fallbackAddress')),
            }));


            setOrders(prev => {
              const apiIds = new Set(mappedOrders.map(mo => mo.id));
              const nonDuplicateLocal = prev.filter(p => !apiIds.has(p.id));
              return [...mappedOrders, ...nonDuplicateLocal];
            });
          }
        }
      } catch (err) {
        console.info('Using local stored orders fallback');
      }
    }

    loadBackendOrders();

    function handleOrdersUpdate() {
      setOrders(getStoredOrders());
    }
    window.addEventListener('movemall_orders_change', handleOrdersUpdate);
    window.addEventListener('storage', handleOrdersUpdate);
    return () => {
      window.removeEventListener('movemall_orders_change', handleOrdersUpdate);
      window.removeEventListener('storage', handleOrdersUpdate);
    };
  }, [t]);


  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);

  return (
    <main className="orders">
      <div className="orders__header">
        <div className="container">
          <h1 className="orders__header-title">
            <Package size={28} style={{ color: 'var(--primary)' }} />
            {t('commerce:orders.title')}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {t('commerce:orders.subtitle')}
          </p>
        </div>
      </div>

      <div className="container">
        <div className="orders__body">
          {/* Order Status Tabs */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 'var(--space-6)',
            borderBottom: '1px solid var(--border)',
            paddingBottom: 'var(--space-2)',
            overflowX: 'auto',
          }}>
            {(['all', 'shipped', 'delivered', 'processing'] as const).map(tabId => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                style={{
                  padding: '8px 16px',
                  background: activeTab === tabId ? 'var(--primary)' : 'var(--surface)',
                  color: activeTab === tabId ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'var(--transition)',
                }}
              >
                {t(`commerce:orders.tabs.${tabId}`)}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {filteredOrders.length > 0 ? (
            <div className="orders__list">
              {filteredOrders.map(order => (
                <article key={order.id} className="order-card">
                  <div className="order-card__header">
                    <div className="order-card__meta">
                      <span className="order-card__id">{order.id}</span>
                      <span className="order-card__date">
                        <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                        {formatDate(order.createdAt, locale)}
                      </span>
                    </div>
                    <span
                      className="order-card__status"
                      style={{ color: STATUS_COLOR[order.status] }}
                    >
                      {t(`commerce:orderStatus.${order.status}`)}
                    </span>
                  </div>

                  <div className="order-card__body">
                    <div className="order-card__items">
                      {order.items.map(item => (
                        <div key={item.productId} className="order-card__item">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="order-card__item-img"
                          />
                          <div className="order-card__item-info">
                            <p className="order-card__item-name">{item.name}</p>
                            <p className="order-card__item-qty">
                              {t('commerce:orders.itemQuantity', {
                                count: formatNumber(item.quantity, locale),
                              })}
                            </p>
                          </div>
                          <span className="order-card__item-price">
                            {formatCurrency(item.price * item.quantity, locale)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="order-card__footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <span className="order-card__address">
                        <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                        {order.address}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span className="order-card__total" style={{ fontWeight: 800, fontSize: 14 }}>
                          {t('commerce:orders.netTotal', {
                            amount: formatCurrency(order.total, locale),
                          })}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => setReportingOrder(order)}
                          style={{
                            padding: '7px 12px',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            borderRadius: 6,
                          }}
                          title={t('commerce:orders.reportTitle')}
                        >
                          <Flag size={13} />
                          <span>{t('commerce:orders.reportCta')}</span>
                        </button>

                        <LocalizedLink
                          to={`/tracking/${order.id}`}
                          style={{
                            padding: '7px 14px',
                            background: 'var(--primary)',
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 800,
                            textDecoration: 'none',
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Truck size={14} /> {t('commerce:orders.trackCta')}
                        </LocalizedLink>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: 'var(--space-12)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                {t('commerce:orders.emptyTitle')}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                {t('commerce:orders.emptySubtitle')}
              </p>
              <LocalizedLink
                to="/shop"
                style={{
                  padding: '9px 20px',
                  background: 'var(--primary)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ShoppingBag size={15} /> {t('commerce:orders.emptyCta')} <ArrowRight size={14} />
              </LocalizedLink>
            </div>
          )}
        </div>
      </div>

      {/* Customer Anti-Counterfeit & Scam Report Modal */}
      {reportingOrder && (
        <ReportStoreModal
          isOpen={!!reportingOrder}
          onClose={() => setReportingOrder(null)}
          targetType="ORDER"
          targetId={reportingOrder.id}
          targetName={t('commerce:orders.reportTargetName', {
            orderId: reportingOrder.id,
            items: reportingOrder.items?.map((i: any) => i.name).join(', '),
          })}
          storeName={reportingOrder.storeName || t('commerce:orders.reportStoreFallback')}
          orderId={reportingOrder.id}
        />
      )}
    </main>
  );
}

export default OrdersPage;
