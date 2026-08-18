// src/pages/TrackingPage.tsx — Real Interactive Order Tracking, Search & Leaflet GPS Navigation

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  Phone,
  ArrowLeft,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  Camera,
  Search,
  Copy,
  Check,
  HelpCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import L from 'leaflet';
import { getStoredOrders, updateOrderStatus, getOrderTrackingNumber, STATUS_LABEL, STATUS_COLOR } from '../data/orders';
import type { Order, OrderStatus } from '../data/orders';
import './TrackingPage.css';

// Real Bangkok GPS Coordinates (From Flash Distribution Hub to Sukhumvit)
const ROUTE_COORDINATES: [number, number][] = [
  [13.7202, 100.5840], // Flash DC Hub Ekkamai
  [13.7235, 100.5810], // Sukhumvit 63
  [13.7265, 100.5770], // Thonglor Junction
  [13.7300, 100.5720], // Phrom Phong Station
  [13.7345, 100.5680], // Sukhumvit 39 Entrance
  [13.7380, 100.5710], // Customer Destination
];

export function TrackingPage() {
  const { orderId: routeOrderId } = useParams<{ orderId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>(() => getStoredOrders());
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync orders with LocalStorage events
  useEffect(() => {
    function handleOrdersUpdate() {
      setOrders(getStoredOrders());
    }
    window.addEventListener('movemall_orders_change', handleOrdersUpdate);
    window.addEventListener('storage', handleOrdersUpdate);
    return () => {
      window.removeEventListener('movemall_orders_change', handleOrdersUpdate);
      window.removeEventListener('storage', handleOrdersUpdate);
    };
  }, []);

  // Determine active order from URL param or query or latest order
  const activeIdOrTracking = routeOrderId || searchParams.get('id') || searchParams.get('track') || '';

  const matchedOrder = orders.find(o => 
    o.id.toLowerCase() === activeIdOrTracking.toLowerCase() ||
    getOrderTrackingNumber(o).toLowerCase() === activeIdOrTracking.toLowerCase() ||
    o.id.replace(/[^A-Za-z0-9]/g, '').toLowerCase() === activeIdOrTracking.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
  ) || (orders.length > 0 ? orders[0] : null);

  const [currentOrder, setCurrentOrder] = useState<Order | null>(matchedOrder);

  useEffect(() => {
    if (activeIdOrTracking) {
      const found = orders.find(o => 
        o.id.toLowerCase() === activeIdOrTracking.toLowerCase() ||
        getOrderTrackingNumber(o).toLowerCase() === activeIdOrTracking.toLowerCase() ||
        o.id.replace(/[^A-Za-z0-9]/g, '').toLowerCase() === activeIdOrTracking.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
      );
      if (found) {
        setCurrentOrder(found);
      }
    } else if (orders.length > 0) {
      setCurrentOrder(orders[0]);
    }
  }, [activeIdOrTracking, orders]);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const [truckPosIdx, setTruckPosIdx] = useState(2);

  // Initialize and Render Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!currentOrder || (currentOrder.status !== 'shipped' && currentOrder.status !== 'delivered')) return;

    // Reset old map if order changed
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [13.7290, 100.5740],
      zoom: 14,
      zoomControl: true,
    });

    // Clean OpenStreetMap CartoDB Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Draw Polyline Route
    L.polyline(ROUTE_COORDINATES, {
      color: '#2563EB',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // 1. Hub Marker
    const hubIcon = L.divIcon({
      className: 'leaflet-hub-marker',
      html: '<div style="background:#F97316;color:white;padding:3px 7px;font-size:10px;font-weight:bold;border-radius:4px;border:1.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🏢 Flash DC</div>',
      iconSize: [65, 22],
    });
    L.marker(ROUTE_COORDINATES[0], { icon: hubIcon }).addTo(map);

    // 2. Destination Pin
    const homeIcon = L.divIcon({
      className: 'leaflet-home-marker',
      html: '<div class="custom-home-pin">📍 ที่อยู่ผู้รับ (ปลายทาง)</div>',
      iconSize: [130, 24],
    });
    L.marker(ROUTE_COORDINATES[ROUTE_COORDINATES.length - 1], { icon: homeIcon }).addTo(map);

    // 3. Moving Truck Marker
    const startIdx = currentOrder.status === 'delivered' ? ROUTE_COORDINATES.length - 1 : 2;
    const truckIcon = L.divIcon({
      className: 'leaflet-truck-marker',
      html: `<div class="custom-truck-pin">${currentOrder.status === 'delivered' ? '✅ ส่งมอบแล้ว' : '🚚 Flash (2กข-8941)'}</div>`,
      iconSize: [120, 24],
    });
    const truckMarker = L.marker(ROUTE_COORDINATES[startIdx], { icon: truckIcon }).addTo(map);
    truckMarkerRef.current = truckMarker;

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [currentOrder?.id, currentOrder?.status]);

  // Truck Animation Interval when in 'shipped' state
  useEffect(() => {
    if (!currentOrder || currentOrder.status !== 'shipped') return;

    const interval = setInterval(() => {
      setTruckPosIdx(prev => {
        const nextIdx = (prev + 1) % (ROUTE_COORDINATES.length - 1) || 1;
        const nextCoord = ROUTE_COORDINATES[nextIdx];
        if (truckMarkerRef.current) {
          truckMarkerRef.current.setLatLng(nextCoord);
        }
        return nextIdx;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentOrder?.status]);

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
      showToast(`ไม่พบหมายเลขพัสดุ "${query}" ในระบบ`);
    }
  }

  function handleCopyTracking(trackingNo: string) {
    navigator.clipboard.writeText(trackingNo);
    setCopiedTracking(true);
    showToast('คัดลอกหมายเลขพัสดุเรียบร้อยแล้ว 📋');
    setTimeout(() => setCopiedTracking(false), 2000);
  }

  function handleUpdateStatus(newStatus: OrderStatus) {
    if (!currentOrder) return;
    updateOrderStatus(currentOrder.id, newStatus);
    setCurrentOrder(prev => prev ? { ...prev, status: newStatus } : null);
    showToast(`อัปเดตสถานะเป็น "${STATUS_LABEL[newStatus]}" สำเร็จแล้ว`);
  }

  // Format Dates
  const orderCreatedDate = currentOrder ? new Date(currentOrder.createdAt) : new Date();
  const createdDateStr = orderCreatedDate.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
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

  const trackingNumber = currentOrder ? getOrderTrackingNumber(currentOrder) : 'TH-FLASH-00000000';

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
                ค้นหาและติดตามพัสดุแบบเรียลไทม์ (Live Parcel Tracking)
              </h2>
              <p className="tracking-search-desc">
                กรอกหมายเลขติดตามพัสดุ (Tracking No.) หรือหมายเลขคำสั่งซื้อ (Order ID)
              </p>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="tracking-search-form">
            <div className="tracking-search-input-wrap">
              <Truck size={18} className="tracking-search-icon" />
              <input
                type="text"
                placeholder="เช่น TH-FLASH-XXXXX, ORD-20260816-001 หรือ MM-..."
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

          {/* Quick Select from User's Orders */}
          {orders.length > 0 && (
            <div className="tracking-quick-selector">
              <span className="tracking-quick-label">📦 รายการคำสั่งซื้อของคุณ:</span>
              <div className="tracking-quick-pills">
                {orders.map(o => {
                  const isSelected = currentOrder?.id === o.id;
                  const trackNo = getOrderTrackingNumber(o);
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

        {/* 🚨 Pre-Arrival Alert Banner (Only when status is 'shipped') */}
        {currentOrder?.status === 'shipped' && (
          <aside className="delivery-alert-banner" role="alert">
            <div className="delivery-alert-info">
              <div className="delivery-alert-pulse-icon">
                🚨
              </div>
              <div>
                <div className="delivery-alert-title">
                  พนักงานจัดส่งกำลังจะเดินทางถึงคุณในอีกประมาณ 12 นาที!
                </div>
                <div className="delivery-alert-desc">
                  คนขับอยู่ห่างจากคุณประมาณ 1.8 กม. กรุณาเตรียมรับโทรศัพท์และเตรียมเงินสดหากเป็นออเดอร์เก็บเงินปลายทาง (COD)
                </div>
              </div>
            </div>

            <button
              className="delivery-alert-call-btn"
              onClick={() => alert('📞 กำลังต่อสายไปยังพนักงานจัดส่ง Flash Express: 089-123-4567 (คุณธวัชชัย)')}
            >
              <Phone size={14} style={{ display: 'inline', marginRight: 4 }} />
              ติดต่อคนขับ
            </button>
          </aside>
        )}

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
                  คำสั่งซื้อ: <strong>#{currentOrder.id}</strong> • ขนส่งโดย <strong>Flash Express (Standard Delivery)</strong> • สั่งซื้อเมื่อ {createdDateStr}
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
                    ? 'วันนี้ ภายใน 16:30 น.'
                    : currentOrder.status === 'processing'
                    ? '1-2 วันทำการ'
                    : 'รอร้านค้ายืนยัน'}
                </div>
                <div className="tracking-badge-status" style={{ background: STATUS_COLOR[currentOrder.status], color: '#FFFFFF' }}>
                  {STATUS_LABEL[currentOrder.status]}
                </div>
              </div>
            </section>

            {/* Stepper Timeline */}
            <section className="tracking-stepper-card">
              <h2 className="tracking-section-title">
                สถานะการจัดส่งแบบเรียลไทม์ (Live Stepper)
              </h2>

              <div className="tracking-stepper">
                {/* Step 1: Confirmed */}
                <div className="tracking-step tracking-step--done">
                  <div className="tracking-step-icon">✓</div>
                  <div className="tracking-step-title">1. ยืนยันคำสั่งซื้อ</div>
                  <div className="tracking-step-time">{createdDateStr}</div>
                </div>

                {/* Step 2: Processing / Packed */}
                <div className={`tracking-step ${currentOrder.status !== 'pending' ? 'tracking-step--done' : 'tracking-step--active'}`}>
                  <div className="tracking-step-icon">
                    {currentOrder.status !== 'pending' ? '✓' : <Clock size={16} />}
                  </div>
                  <div className="tracking-step-title">2. ร้านค้าแพ็คสำเร็จ</div>
                  <div className="tracking-step-time">
                    {currentOrder.status === 'pending' ? 'กำลังเตรียมของ' : packDateStr}
                  </div>
                </div>

                {/* Step 3: Shipped / Out for Delivery */}
                <div className={`tracking-step ${currentOrder.status === 'delivered' ? 'tracking-step--done' : currentOrder.status === 'shipped' ? 'tracking-step--active' : ''}`}>
                  <div className="tracking-step-icon">
                    {currentOrder.status === 'delivered' ? '✓' : <Truck size={18} />}
                  </div>
                  <div className="tracking-step-title">3. พนักงานกำลังนำส่ง</div>
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
                    {currentOrder.status === 'delivered' ? 'ส่งมอบแล้ว' : 'รอดำเนินการ'}
                  </div>
                </div>
              </div>

              {/* Status Action & Simulation Buttons */}
              <div className="tracking-status-controls">
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                  ⚙️ จำลองเปลี่ยนสถานะพัสดุ:
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('processing')}
                  className={`status-ctrl-btn ${currentOrder.status === 'processing' ? 'status-ctrl-btn--active' : ''}`}
                >
                  ⏳ เตรียมพัสดุ
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('shipped')}
                  className={`status-ctrl-btn ${currentOrder.status === 'shipped' ? 'status-ctrl-btn--active' : ''}`}
                >
                  🚚 กำลังนำส่ง
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('delivered')}
                  className={`status-ctrl-btn ${currentOrder.status === 'delivered' ? 'status-ctrl-btn--active' : ''}`}
                >
                  ✅ จัดส่งสำเร็จ
                </button>
              </div>
            </section>

            {/* ── Real Interactive Leaflet OpenStreetMap Map (When Shipped or Delivered) ── */}
            {(currentOrder.status === 'shipped' || currentOrder.status === 'delivered') && (
              <section className="tracking-map-card">
                <div className="tracking-map-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14 }}>
                    <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)' }} />
                    <span>แผนที่ตำแหน่งรถขนส่งจริง (OpenStreetMap & Real GPS Navigation)</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {currentOrder.status === 'delivered' ? '📍 พัสดุถูกส่งมอบถึงจุดหมายแล้ว' : '📡 ซิงค์พิกัดดาวเทียมสด (ถ.สุขุมวิท กรุงเทพฯ)'}
                  </span>
                </div>

                <div className="real-leaflet-map-wrapper">
                  {/* Live Floating HUD */}
                  {currentOrder.status === 'shipped' && (
                    <div className="leaflet-map-hud">
                      <div className="map-hud-title">
                        <Navigation size={14} style={{ color: 'var(--primary)' }} />
                        <span>กำลังมุ่งหน้าสู่ที่อยู่ปลายทาง</span>
                      </div>
                      <div className="map-hud-meta">
                        <span>⏱️ <strong>อีกประมาณ 12 นาที (1.8 กม.)</strong></span>
                        <span>⚡ ความเร็ว 38 กม./ชม.</span>
                      </div>
                    </div>
                  )}

                  {/* Leaflet Map DOM Target */}
                  <div ref={mapContainerRef} className="real-leaflet-map" />
                </div>

                {/* Driver Information Card */}
                <div className="courier-driver-card">
                  <div className="driver-info">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
                      alt="Driver Avatar"
                      className="driver-avatar"
                    />
                    <div>
                      <div className="driver-name">คุณธวัชชัย • พนักงานจัดส่ง Flash Express</div>
                      <div className="driver-meta">
                        ยานพาหนะ: รถตู้ Flash (ทะเบียน 2กข-8941 กทม.) • คะแนนความพึงพอใจ 4.9 ★ (1,420 รีวิว)
                      </div>
                    </div>
                  </div>

                  <div className="driver-actions">
                    <button
                      className="driver-call-btn"
                      onClick={() => alert('📞 กำลังต่อสายไปยังพนักงานจัดส่ง: 089-123-4567 (คุณธวัชชัย)')}
                    >
                      <Phone size={15} />
                      โทรหาคนขับ (089-123-4567)
                    </button>
                    {currentOrder.status === 'shipped' && (
                      <button
                        className="confirm-receipt-btn"
                        onClick={() => handleUpdateStatus('delivered')}
                      >
                        <CheckCircle2 size={15} />
                        ยืนยันได้รับสินค้าแล้ว
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* 📦 Ordered Items & Shipping Details Card */}
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

              {/* Destination Address & Summary */}
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

            {/* 📸 Proof of Delivery Card (Shown when status is 'delivered') */}
            {currentOrder.status === 'delivered' && (
              <section className="proof-delivery-card">
                <div className="proof-header">
                  <Camera size={18} style={{ color: 'var(--primary)' }} />
                  <span>📸 หลักฐานและรูปถ่ายการส่งมอบพัสดุ (Proof of Delivery)</span>
                </div>

                <div className="proof-delivery-grid">
                  <img
                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80"
                    alt="Proof of Delivery Box"
                    className="proof-delivery-img"
                  />
                  <div className="proof-details">
                    <div><strong>สถานที่ส่งมอบ:</strong> วางพัสดุที่จุดรับพัสดุ / หน้าประตูบ้าน (ปลอดภัย 100%)</div>
                    <div><strong>พนักงานจัดส่ง:</strong> คุณธวัชชัย (Flash Express)</div>
                    <div><strong>บันทึกเวลาส่งมอบ:</strong> วันนี้ เวลา 16:15 น. (พิกัด GPS ตรงกับที่อยู่ผู้รับ)</div>
                    <div style={{ color: 'var(--success)', fontWeight: 700 }}>
                      ✓ มีการรับประกันความเสียหายและคืนเงิน 100% ตามนโยบาย Movemall Mall
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          /* Empty / Not Found State */
          <div className="tracking-not-found-card">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              ไม่พบข้อมูลพัสดุสำหรับคำสั่งซื้อนี้
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, maxWidth: 450, margin: '0 auto 16px' }}>
              กรุณาตรวจสอบหมายเลขพัสดุหรือหมายเลขคำสั่งซื้อใหม่อีกครั้ง หรือเลือกจากรายการคำสั่งซื้อล่าสุดของคุณ
            </p>
            <Link to="/orders" className="tracking-view-orders-btn">
              ไปที่ประวัติคำสั่งซื้อทั้งหมด
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default TrackingPage;
