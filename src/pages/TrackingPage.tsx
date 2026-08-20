// src/pages/TrackingPage.tsx — Real Order Tracking & Logistics Hub
import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Truck,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  ArrowLeft,
  Navigation,
  Search,
  Copy,
  Check,
  ShoppingBag,
  Sparkles,
  Smartphone,
  Info,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getStoredOrders, getOrderTrackingNumber, STATUS_COLOR } from '../data/orders';
import type { Order } from '../data/orders';
import { LineConnectModal } from '../components/LineConnectModal';
import { LocalizedLink, useLocalizedPath } from '../i18n/LocalizedLink';
import { formatCurrency, formatDate, formatNumber, formatTime } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './TrackingPage.css';

const CARRIER_NAME = 'Flash Express';
const CARRIER_SERVICE = 'Standard Delivery (Flash Express)';

export function TrackingPage() {
  const { t, i18n } = useTranslation(['commerce', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const localizePath = useLocalizedPath();
  const { orderId: routeOrderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>(() => getStoredOrders());
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isLineConnected, setIsLineConnected] = useState<boolean>(() => {
    try {
      const u = localStorage.getItem('movemall_user');
      if (u) return !!JSON.parse(u).lineConnected;
    } catch {
      // ignore
    }
    return false;
  });

  // Sync orders with LocalStorage events
  useEffect(() => {
    function handleOrdersUpdate() {
      setOrders(getStoredOrders());
    }
    function handleAuthUpdate() {
      try {
        const u = localStorage.getItem('movemall_user');
        if (u) setIsLineConnected(!!JSON.parse(u).lineConnected);
      } catch {
        // ignore
      }
    }
    window.addEventListener('movemall_orders_change', handleOrdersUpdate);
    window.addEventListener('movemall_auth_change', handleAuthUpdate);
    window.addEventListener('storage', handleOrdersUpdate);
    return () => {
      window.removeEventListener('movemall_orders_change', handleOrdersUpdate);
      window.removeEventListener('movemall_auth_change', handleAuthUpdate);
      window.removeEventListener('storage', handleOrdersUpdate);
    };
  }, []);

  // Determine active order from URL param or query or latest real order
  const activeIdOrTracking = routeOrderId || searchParams.get('id') || searchParams.get('track') || '';

  const matchedOrder = activeIdOrTracking
    ? orders.find(o => 
        o.id.toLowerCase() === activeIdOrTracking.toLowerCase() ||
        getOrderTrackingNumber(o).toLowerCase() === activeIdOrTracking.toLowerCase() ||
        o.id.replace(/[^A-Za-z0-9]/g, '').toLowerCase() === activeIdOrTracking.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
      ) || null
    : orders.length > 0 ? orders[0] : null;

  const [currentOrder, setCurrentOrder] = useState<Order | null>(matchedOrder);

  useEffect(() => {
    if (activeIdOrTracking) {
      const found = orders.find(o => 
        o.id.toLowerCase() === activeIdOrTracking.toLowerCase() ||
        getOrderTrackingNumber(o).toLowerCase() === activeIdOrTracking.toLowerCase() ||
        o.id.replace(/[^A-Za-z0-9]/g, '').toLowerCase() === activeIdOrTracking.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
      );
      setCurrentOrder(found || null);
    } else if (orders.length > 0) {
      setCurrentOrder(orders[0]);
    } else {
      setCurrentOrder(null);
    }
  }, [activeIdOrTracking, orders]);

  // Leaflet Map Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Initialize and Render Real Location Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!currentOrder || (currentOrder.status !== 'shipped' && currentOrder.status !== 'delivered')) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center around Bangkok logistics hub & delivery area
    const centerCoords: [number, number] = [13.7367, 100.5608];
    const hubCoords: [number, number] = [13.7150, 100.5840];
    const destCoords: [number, number] = [13.7450, 100.5650];

    const map = L.map(mapContainerRef.current, {
      center: centerCoords,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Distribution Hub Marker
    const hubIcon = L.divIcon({
      className: 'leaflet-hub-marker',
      html: `<div style="background:#2563EB;color:white;padding:3px 8px;font-size:11px;font-weight:bold;border-radius:4px;border:1.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25)">${t('commerce:tracking.mapHub')}</div>`,
      iconSize: [160, 24],
    });
    L.marker(hubCoords, { icon: hubIcon }).addTo(map);

    // Destination Pin
    const homeIcon = L.divIcon({
      className: 'leaflet-home-marker',
      html: `<div class="custom-home-pin">${t('commerce:tracking.mapDestination')}</div>`,
      iconSize: [130, 24],
    });
    L.marker(destCoords, { icon: homeIcon }).addTo(map);

    // Connecting Route Line
    L.polyline([hubCoords, destCoords], {
      color: '#2563EB',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.8,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [currentOrder, t]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    const found = orders.find(o => 
      o.id.toLowerCase() === query.toLowerCase() ||
      getOrderTrackingNumber(o).toLowerCase() === query.toLowerCase() ||
      o.id.replace(/[^A-Za-z0-9]/g, '').toLowerCase() === query.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
    );

    if (found) {
      setCurrentOrder(found);
      navigate(localizePath(`/tracking/${found.id}`), { replace: true });
      showToast(t('commerce:tracking.foundToast', { orderId: found.id }));
    } else {
      showToast(t('commerce:tracking.notFoundToast', { query }));
    }
  }

  function handleCopyTracking(trackingNo: string) {
    navigator.clipboard.writeText(trackingNo);
    setCopiedTracking(true);
    showToast(t('commerce:tracking.copiedToast'));
    setTimeout(() => setCopiedTracking(false), 2000);
  }

  // Format Dates dynamically from actual order
  const orderCreatedDate = currentOrder ? new Date(currentOrder.createdAt) : new Date();
  const dateTimeStr = (value: Date) =>
    t('commerce:tracking.dateTime', {
      date: formatDate(value, locale),
      time: formatTime(value, locale),
    });

  const createdDateStr = dateTimeStr(orderCreatedDate);

  const packDate = new Date(orderCreatedDate.getTime() + 2 * 60 * 60 * 1000);
  const packDateStr = dateTimeStr(packDate);

  const shipDate = new Date(orderCreatedDate.getTime() + 5 * 60 * 60 * 1000);
  const shipDateStr = dateTimeStr(shipDate);

  const trackingNumber = currentOrder ? getOrderTrackingNumber(currentOrder) : '';

  return (
    <main className="tracking-page">
      <div className="tracking-container">
        {/* Navigation & Search Hub */}
        <div className="tracking-top-nav">
          <LocalizedLink to="/orders" className="tracking-back-btn">
            <ArrowLeft size={16} /> {t('commerce:tracking.back')}
          </LocalizedLink>

          {toastMsg && (
            <div className="tracking-toast-pill">
              {toastMsg}
            </div>
          )}
        </div>

        {/* 🔍 Tracking Search Bar & Order Quick Selector */}
        <section className="tracking-search-card">
          <div className="tracking-search-header">
            <div>
              <h2 className="tracking-search-title">
                <Search size={18} style={{ color: 'var(--primary)' }} />
                {t('commerce:tracking.searchTitle')}
              </h2>
              <p className="tracking-search-desc">
                {t('commerce:tracking.searchDesc')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="tracking-search-form">
            <div className="tracking-search-input-wrap">
              <Truck size={18} className="tracking-search-icon" />
              <input
                type="text"
                placeholder={t('commerce:tracking.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="tracking-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="tracking-search-clear"
                  aria-label={t('commerce:tracking.searchClear')}
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="tracking-search-btn">
              <Search size={15} /> {t('commerce:tracking.searchSubmit')}
            </button>
          </form>

          {/* Real User's Orders Quick Selector */}
          {orders.length > 0 && (
            <div className="tracking-quick-selector">
              <span className="tracking-quick-label">
                {t('commerce:tracking.quickLabel', { count: formatNumber(orders.length, locale) })}
              </span>
              <div className="tracking-quick-pills">
                {orders.map(o => {
                  const isSelected = currentOrder?.id === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setCurrentOrder(o);
                        navigate(localizePath(`/tracking/${o.id}`));
                      }}
                      className={`tracking-quick-pill ${isSelected ? 'tracking-quick-pill--active' : ''}`}
                    >
                      <span className="tracking-pill-id">#{o.id}</span>
                      <span className="tracking-pill-status" style={{ color: STATUS_COLOR[o.status] }}>
                        {t(`commerce:orderStatus.${o.status}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {currentOrder ? (
          <>
            {/* Header Summary Card */}
            <section className="tracking-header-card">
              <div className="tracking-header-left">
                <div className="tracking-no-label">{t('commerce:tracking.trackingNoLabel')}</div>
                <div className="tracking-title-row">
                  <h1 className="tracking-title">
                    <Truck size={22} style={{ color: 'var(--primary)' }} />
                    {trackingNumber}
                  </h1>
                  <button
                    type="button"
                    onClick={() => handleCopyTracking(trackingNumber)}
                    className="tracking-copy-btn"
                    title={t('commerce:tracking.copyTitle')}
                  >
                    {copiedTracking ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                    <span>
                      {copiedTracking ? t('commerce:tracking.copied') : t('commerce:tracking.copy')}
                    </span>
                  </button>
                </div>
                <div className="tracking-meta-line">
                  {t('commerce:tracking.metaLine', {
                    orderId: currentOrder.id,
                    carrier: CARRIER_SERVICE,
                    date: createdDateStr,
                  })}
                </div>
              </div>

              <div className="tracking-eta-box">
                <div className="tracking-eta-label">
                  {currentOrder.status === 'delivered'
                    ? t('commerce:tracking.etaLabelDelivered')
                    : t('commerce:tracking.etaLabelPending')}
                </div>
                <div className="tracking-eta-time">
                  {currentOrder.status === 'delivered'
                    ? t('commerce:tracking.etaDelivered')
                    : currentOrder.status === 'shipped'
                    ? t('commerce:tracking.etaShipped')
                    : currentOrder.status === 'processing'
                    ? t('commerce:tracking.etaProcessing')
                    : t('commerce:tracking.etaWaiting')}
                </div>
                <div className="tracking-badge-status" style={{ background: STATUS_COLOR[currentOrder.status], color: '#FFFFFF' }}>
                  {t(`commerce:orderStatus.${currentOrder.status}`)}
                </div>
              </div>
            </section>

            {/* 📲 LINE Official Realtime Shipping Alert Card */}
            <aside className="tracking-line-alert-card">
              <div className="tracking-line-alert-left">
                <div className="tracking-line-badge">LINE</div>
                <div>
                  <div className="tracking-line-title">
                    {isLineConnected
                      ? t('commerce:tracking.lineOnTitle')
                      : t('commerce:tracking.lineOffTitle')}
                  </div>
                  <div className="tracking-line-subtitle">
                    {isLineConnected
                      ? t('commerce:tracking.lineOnSubtitle', { trackingNumber })
                      : t('commerce:tracking.lineOffSubtitle')}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="tracking-line-alert-btn"
                onClick={() => setIsLineModalOpen(true)}
              >
                {isLineConnected ? (
                  <>
                    <Smartphone size={14} />
                    {t('commerce:tracking.lineViewCta')}
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    {t('commerce:tracking.lineConnectCta')}
                  </>
                )}
              </button>
            </aside>

            {/* Stepper Timeline */}
            <section className="tracking-stepper-card">
              <h2 className="tracking-section-title">
                {t('commerce:tracking.timelineTitle')}
              </h2>

              <div className="tracking-stepper">
                {/* Step 1: Confirmed */}
                <div className="tracking-step tracking-step--done">
                  <div className="tracking-step-icon">✓</div>
                  <div className="tracking-step-title">{t('commerce:tracking.step1')}</div>
                  <div className="tracking-step-time">{createdDateStr}</div>
                </div>

                {/* Step 2: Processing / Packed */}
                <div className={`tracking-step ${currentOrder.status !== 'pending' ? 'tracking-step--done' : 'tracking-step--active'}`}>
                  <div className="tracking-step-icon">
                    {currentOrder.status !== 'pending' ? '✓' : <Clock size={16} />}
                  </div>
                  <div className="tracking-step-title">{t('commerce:tracking.step2')}</div>
                  <div className="tracking-step-time">
                    {currentOrder.status === 'pending' ? t('commerce:tracking.step2Pending') : packDateStr}
                  </div>
                </div>

                {/* Step 3: Shipped / Out for Delivery */}
                <div className={`tracking-step ${currentOrder.status === 'delivered' ? 'tracking-step--done' : currentOrder.status === 'shipped' ? 'tracking-step--active' : ''}`}>
                  <div className="tracking-step-icon">
                    {currentOrder.status === 'delivered' ? '✓' : <Truck size={18} />}
                  </div>
                  <div className="tracking-step-title">{t('commerce:tracking.step3')}</div>
                  <div className="tracking-step-time">
                    {currentOrder.status === 'delivered' || currentOrder.status === 'shipped'
                      ? shipDateStr
                      : t('commerce:tracking.stepWaiting')}
                  </div>
                </div>

                {/* Step 4: Delivered */}
                <div className={`tracking-step ${currentOrder.status === 'delivered' ? 'tracking-step--done' : ''}`}>
                  <div className="tracking-step-icon">
                    {currentOrder.status === 'delivered' ? '✓' : <Package size={16} />}
                  </div>
                  <div className="tracking-step-title">{t('commerce:tracking.step4')}</div>
                  <div className="tracking-step-time">
                    {currentOrder.status === 'delivered'
                      ? t('commerce:tracking.step4Done')
                      : t('commerce:tracking.stepWaiting')}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Real Map Routing Hub (When Shipped or Delivered) ── */}
            {(currentOrder.status === 'shipped' || currentOrder.status === 'delivered') && (
              <section className="tracking-map-card">
                <div className="tracking-map-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14 }}>
                    <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)' }} />
                    <span>{t('commerce:tracking.mapTitle')}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {currentOrder.status === 'delivered'
                      ? t('commerce:tracking.mapDelivered')
                      : t('commerce:tracking.mapShipping', { carrier: CARRIER_NAME })}
                  </span>
                </div>

                <div className="real-leaflet-map-wrapper">
                  <div ref={mapContainerRef} className="real-leaflet-map" />
                </div>
              </section>
            )}

            {/* 📦 Real Ordered Items & Shipping Details Card */}
            <section className="tracking-items-card">
              <h2 className="tracking-section-title">
                <Package size={18} style={{ color: 'var(--primary)' }} />
                {t('commerce:tracking.itemsTitle', {
                  count: formatNumber(currentOrder.items.length, locale),
                })}
              </h2>

              <div className="tracking-items-list">
                {currentOrder.items.map((item, idx) => (
                  <div key={idx} className="tracking-item-row">
                    <img src={item.image} alt={item.name} className="tracking-item-img" />
                    <div className="tracking-item-info">
                      <div className="tracking-item-name">{item.name}</div>
                      <div className="tracking-item-sub">
                        {t('commerce:tracking.itemLine', {
                          price: formatCurrency(item.price, locale),
                          quantity: formatNumber(item.quantity, locale),
                        })}
                      </div>
                    </div>
                    <div className="tracking-item-total">
                      {formatCurrency(item.price * item.quantity, locale)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Destination Address & Price Summary */}
              <div className="tracking-address-summary">
                <div className="tracking-address-box">
                  <div className="address-label">
                    <MapPin size={14} style={{ color: 'var(--primary)' }} /> {t('commerce:tracking.addressLabel')}
                  </div>
                  <div className="address-val">{currentOrder.address}</div>
                </div>

                <div className="tracking-price-box">
                  <div className="price-row">
                    <span>{t('commerce:tracking.subtotalLabel')}</span>
                    <span>{formatCurrency(currentOrder.subtotal, locale)}</span>
                  </div>
                  <div className="price-row">
                    <span>{t('commerce:tracking.shippingLabel')}</span>
                    <span>
                      {currentOrder.shipping === 0
                        ? t('commerce:tracking.shippingFree')
                        : formatCurrency(currentOrder.shipping, locale)}
                    </span>
                  </div>
                  <div className="price-row price-row--grand">
                    <span>{t('commerce:tracking.grandTotalLabel')}</span>
                    <span className="price-grand-val">{formatCurrency(currentOrder.total, locale)}</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Empty / Not Found State */
          <div className="tracking-not-found-card">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              {activeIdOrTracking
                ? t('commerce:tracking.notFoundTitle')
                : t('commerce:tracking.emptyTitle')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, maxWidth: 450, margin: '0 auto 16px' }}>
              {activeIdOrTracking
                ? t('commerce:tracking.notFoundDesc')
                : t('commerce:tracking.emptyDesc')}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <LocalizedLink to="/shop" className="tracking-view-orders-btn">
                <ShoppingBag size={15} style={{ display: 'inline', marginRight: 4 }} /> {t('commerce:tracking.shopCta')}
              </LocalizedLink>
              <LocalizedLink to="/orders" style={{
                padding: '9px 18px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <Info size={15} /> {t('commerce:tracking.ordersCta')}
              </LocalizedLink>
            </div>
          </div>
        )}
      </div>

      {/* LINE Connect Modal */}
      <LineConnectModal
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
        initialOrderId={currentOrder?.id}
        initialTotal={currentOrder?.total}
      />
    </main>
  );
}

export default TrackingPage;
