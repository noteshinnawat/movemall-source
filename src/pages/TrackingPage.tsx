// src/pages/TrackingPage.tsx — Real Order Tracking & Logistics Hub
import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
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
import { getStoredOrders, getOrderTrackingNumber, STATUS_LABEL, STATUS_COLOR } from '../data/orders';
import type { Order, OrderStatus } from '../data/orders';
import { LineConnectModal } from '../components/LineConnectModal';
import './TrackingPage.css';

export function TrackingPage() {
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
      html: '<div style="background:#2563EB;color:white;padding:3px 8px;font-size:11px;font-weight:bold;border-radius:4px;border:1.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25)">🏢 ศูนย์กระจายสินค้า Movemall Hub</div>',
      iconSize: [160, 24],
    });
    L.marker(hubCoords, { icon: hubIcon }).addTo(map);

    // Destination Pin
    const homeIcon = L.divIcon({
      className: 'leaflet-home-marker',
      html: '<div class="custom-home-pin">📍 ที่อยู่จัดส่งปลายทาง</div>',
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
  }, [currentOrder]);

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
      navigate(`/tracking/${found.id}`, { replace: true });
      showToast(`พบพัสดุสำหรับคำสั่งซื้อ #${found.id}`);
    } else {
      showToast(`ไม่พบหมายเลขพัสดุ "${query}" ในรายการคำสั่งซื้อของคุณ`);
    }
  }

  function handleCopyTracking(trackingNo: string) {
    navigator.clipboard.writeText(trackingNo);
    setCopiedTracking(true);
    showToast('คัดลอกหมายเลขพัสดุเรียบร้อยแล้ว 📋');
    setTimeout(() => setCopiedTracking(false), 2000);
  }

  // Format Dates dynamically from actual order
  const orderCreatedDate = currentOrder ? new Date(currentOrder.createdAt) : new Date();
  const createdDateStr = orderCreatedDate.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const packDate = new Date(orderCreatedDate.getTime() + 2 * 60 * 60 * 1000);
  const packDateStr = packDate.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const shipDate = new Date(orderCreatedDate.getTime() + 5 * 60 * 60 * 1000);
  const shipDateStr = shipDate.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const trackingNumber = currentOrder ? getOrderTrackingNumber(currentOrder) : '';

  return (
    <main className="tracking-page">
      <div className="tracking-container">
        {/* Navigation & Search Hub */}
        <div className="tracking-top-nav">
          <Link to="/orders" className="tracking-back-btn">
            <ArrowLeft size={16} /> กลับสู่รายการคำสั่งซื้อ
          </Link>

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
                ค้นหาและติดตามพัสดุ (Parcel Tracking)
              </h2>
              <p className="tracking-search-desc">
                กรอกเลขพัสดุหรือเลขคำสั่งซื้อ
              </p>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="tracking-search-form">
            <div className="tracking-search-input-wrap">
              <Truck size={18} className="tracking-search-icon" />
              <input
                type="text"
                placeholder="เช่น TH-FLASH-XXXXX หรือ ORD-..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="tracking-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="tracking-search-clear"
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="tracking-search-btn">
              <Search size={15} /> ค้นหาพัสดุ
            </button>
          </form>

          {/* Real User's Orders Quick Selector */}
          {orders.length > 0 && (
            <div className="tracking-quick-selector">
              <span className="tracking-quick-label">📦 รายการคำสั่งซื้อจริงของคุณ ({orders.length}):</span>
              <div className="tracking-quick-pills">
                {orders.map(o => {
                  const isSelected = currentOrder?.id === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setCurrentOrder(o);
                        navigate(`/tracking/${o.id}`);
                      }}
                      className={`tracking-quick-pill ${isSelected ? 'tracking-quick-pill--active' : ''}`}
                    >
                      <span className="tracking-pill-id">#{o.id}</span>
                      <span className="tracking-pill-status" style={{ color: STATUS_COLOR[o.status] }}>
                        {STATUS_LABEL[o.status]}
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
                <div className="tracking-no-label">หมายเลขติดตามพัสดุ (Tracking No.)</div>
                <div className="tracking-title-row">
                  <h1 className="tracking-title">
                    <Truck size={22} style={{ color: 'var(--primary)' }} />
                    {trackingNumber}
                  </h1>
                  <button
                    type="button"
                    onClick={() => handleCopyTracking(trackingNumber)}
                    className="tracking-copy-btn"
                    title="คัดลอกหมายเลขพัสดุ"
                  >
                    {copiedTracking ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                    <span>{copiedTracking ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
                <div className="tracking-meta-line">
                  คำสั่งซื้อ: <strong>#{currentOrder.id}</strong> • ขนส่งโดย <strong>Standard Delivery (Flash Express)</strong> • สั่งซื้อเมื่อ {createdDateStr}
                </div>
              </div>

              <div className="tracking-eta-box">
                <div className="tracking-eta-label">
                  {currentOrder.status === 'delivered' ? '✅ สถานะการจัดส่ง' : '⏱️ กำหนดส่งถึงคุณโดยประมาณ'}
                </div>
                <div className="tracking-eta-time">
                  {currentOrder.status === 'delivered'
                    ? 'จัดส่งสำเร็จเรียบร้อยแล้ว'
                    : currentOrder.status === 'shipped'
                    ? '1-2 วันทำการ'
                    : currentOrder.status === 'processing'
                    ? '2-3 วันทำการ'
                    : 'รอดำเนินการ'}
                </div>
                <div className="tracking-badge-status" style={{ background: STATUS_COLOR[currentOrder.status], color: '#FFFFFF' }}>
                  {STATUS_LABEL[currentOrder.status]}
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
                      ? '✓ แจ้งเตือนสถานะพัสดุผ่าน LINE เปิดใช้งานอยู่'
                      : '🔔 รับการแจ้งเตือนพัสดุชิ้นนี้เข้า LINE อัตโนมัติ'}
                  </div>
                  <div className="tracking-line-subtitle">
                    {isLineConnected
                      ? `รับสถานะพัสดุ ${trackingNumber} ผ่าน LINE`
                      : 'เชื่อมต่อ LINE รับ 50 Coins และสถานะพัสดุ'}
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
                    ดูการแจ้งเตือน LINE
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    เชื่อมต่อ LINE (+50 Coins)
                  </>
                )}
              </button>
            </aside>

            {/* Stepper Timeline */}
            <section className="tracking-stepper-card">
              <h2 className="tracking-section-title">
                สถานะขั้นตอนการจัดส่ง (Shipping Timeline)
              </h2>

              <div className="tracking-stepper">
                {/* Step 1: Confirmed */}
                <div className="tracking-step tracking-step--done">
                  <div className="tracking-step-icon">✓</div>
                  <div className="tracking-step-title">1. ชำระเงิน / ยืนยันคำสั่งซื้อ</div>
                  <div className="tracking-step-time">{createdDateStr}</div>
                </div>

                {/* Step 2: Processing / Packed */}
                <div className={`tracking-step ${currentOrder.status !== 'pending' ? 'tracking-step--done' : 'tracking-step--active'}`}>
                  <div className="tracking-step-icon">
                    {currentOrder.status !== 'pending' ? '✓' : <Clock size={16} />}
                  </div>
                  <div className="tracking-step-title">2. ร้านค้าเตรียมจัดส่ง</div>
                  <div className="tracking-step-time">
                    {currentOrder.status === 'pending' ? 'กำลังเตรียมพัสดุ' : packDateStr}
                  </div>
                </div>

                {/* Step 3: Shipped / Out for Delivery */}
                <div className={`tracking-step ${currentOrder.status === 'delivered' ? 'tracking-step--done' : currentOrder.status === 'shipped' ? 'tracking-step--active' : ''}`}>
                  <div className="tracking-step-icon">
                    {currentOrder.status === 'delivered' ? '✓' : <Truck size={18} />}
                  </div>
                  <div className="tracking-step-title">3. บริษัทขนส่งเข้ารับพัสดุ</div>
                  <div className="tracking-step-time">
                    {currentOrder.status === 'delivered' || currentOrder.status === 'shipped' ? shipDateStr : 'รอดำเนินการ'}
                  </div>
                </div>

                {/* Step 4: Delivered */}
                <div className={`tracking-step ${currentOrder.status === 'delivered' ? 'tracking-step--done' : ''}`}>
                  <div className="tracking-step-icon">
                    {currentOrder.status === 'delivered' ? '✓' : <Package size={16} />}
                  </div>
                  <div className="tracking-step-title">4. จัดส่งสำเร็จ</div>
                  <div className="tracking-step-time">
                    {currentOrder.status === 'delivered' ? 'ส่งมอบเรียบร้อย' : 'รอดำเนินการ'}
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
                    <span>เส้นทางการขนส่งพัสดุ (Logistics Route Overview)</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {currentOrder.status === 'delivered' ? '📍 ส่งถึงแล้ว' : '🚚 Flash Express กำลังจัดส่ง'}
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
                รายการสินค้าในคำสั่งซื้อนี้ ({currentOrder.items.length} รายการ)
              </h2>

              <div className="tracking-items-list">
                {currentOrder.items.map((item, idx) => (
                  <div key={idx} className="tracking-item-row">
                    <img src={item.image} alt={item.name} className="tracking-item-img" />
                    <div className="tracking-item-info">
                      <div className="tracking-item-name">{item.name}</div>
                      <div className="tracking-item-sub">
                        ฿{item.price.toLocaleString()} × {item.quantity} ชิ้น
                      </div>
                    </div>
                    <div className="tracking-item-total">
                      ฿{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Destination Address & Price Summary */}
              <div className="tracking-address-summary">
                <div className="tracking-address-box">
                  <div className="address-label">
                    <MapPin size={14} style={{ color: 'var(--primary)' }} /> ที่อยู่จัดส่งปลายทาง:
                  </div>
                  <div className="address-val">{currentOrder.address}</div>
                </div>

                <div className="tracking-price-box">
                  <div className="price-row">
                    <span>ยอดรวมค่าสินค้า:</span>
                    <span>฿{currentOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="price-row">
                    <span>ค่าจัดส่ง:</span>
                    <span>{currentOrder.shipping === 0 ? 'ส่งฟรี (Free Shipping)' : `฿${currentOrder.shipping}`}</span>
                  </div>
                  <div className="price-row price-row--grand">
                    <span>ยอดชำระสุทธิ:</span>
                    <span className="price-grand-val">฿{currentOrder.total.toLocaleString()}</span>
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
              {activeIdOrTracking ? 'ไม่พบข้อมูลพัสดุสำหรับคำสั่งซื้อนี้' : 'ยังไม่มีประวัติคำสั่งซื้อ'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, maxWidth: 450, margin: '0 auto 16px' }}>
              {activeIdOrTracking
                ? 'ตรวจสอบเลขพัสดุ หรือลองค้นหาจากประวัติออเดอร์'
                : 'เมื่อสั่งซื้อแล้ว สถานะพัสดุจะแสดงที่นี่'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/shop" className="tracking-view-orders-btn">
                <ShoppingBag size={15} style={{ display: 'inline', marginRight: 4 }} /> ไปเลือกซื้อสินค้า
              </Link>
              <Link to="/orders" style={{
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
                <Info size={15} /> ดูคำสั่งซื้อทั้งหมด
              </Link>
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
