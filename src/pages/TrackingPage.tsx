// src/pages/TrackingPage.tsx — Real Interactive Leaflet GPS Route Map & Live Delivery Alerts

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Layers,
} from 'lucide-react';
import L from 'leaflet';
import './TrackingPage.css';

// Real Bangkok Coordinates (From Ekkamai Flash Hub to Sukhumvit 39)
const ROUTE_COORDINATES: [number, number][] = [
  [13.7202, 100.5840], // Flash DC Ekkamai
  [13.7235, 100.5810], // Sukhumvit 63
  [13.7265, 100.5770], // Thonglor Junction
  [13.7300, 100.5720], // Phrom Phong Station
  [13.7345, 100.5680], // Sukhumvit 39 Entrance
  [13.7380, 100.5710], // Customer Residence Destination
];

export function TrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const currentOrderId = orderId || 'MM-2026-0891';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);

  const [truckPosIdx, setTruckPosIdx] = useState(2); // Current position between Thonglor & Phrom Phong

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map only once
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.7290, 100.5740],
        zoom: 14,
        zoomControl: true,
      });

      // Clean OpenStreetMap CartoDB Voyager Tiles (Beautiful & Fast)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Draw Glowing Polyline along real Bangkok roads
      L.polyline(ROUTE_COORDINATES, {
        color: '#2563EB',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // 1. Hub Marker (Flash Distribution Center)
      const hubIcon = L.divIcon({
        className: 'leaflet-hub-marker',
        html: '<div style="background:#F97316;color:white;padding:3px 7px;font-size:10px;font-weight:bold;border:1.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🏢 Flash DC</div>',
        iconSize: [60, 20],
      });
      L.marker(ROUTE_COORDINATES[0], { icon: hubIcon }).addTo(map);

      // 2. Destination Pin (Customer Residence)
      const homeIcon = L.divIcon({
        className: 'leaflet-home-marker',
        html: '<div class="custom-home-pin">📍 บ้านของคุณ (ปลายทาง)</div>',
        iconSize: [120, 24],
      });
      L.marker(ROUTE_COORDINATES[ROUTE_COORDINATES.length - 1], { icon: homeIcon }).addTo(map);

      // 3. Moving Truck Marker
      const truckIcon = L.divIcon({
        className: 'leaflet-truck-marker',
        html: '<div class="custom-truck-pin">🚚 Flash (2กข-8941)</div>',
        iconSize: [110, 24],
      });
      const truckMarker = L.marker(ROUTE_COORDINATES[2], { icon: truckIcon }).addTo(map);
      truckMarkerRef.current = truckMarker;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Animate truck moving forward periodically along real GPS coordinates
  useEffect(() => {
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
  }, []);

  return (
    <main className="tracking-page">
      <div className="tracking-container">
        {/* Back Link */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Link
            to="/orders"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--primary)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} /> กลับสู่รายการคำสั่งซื้อ
          </Link>
        </div>

        {/* 🚨 15-Minute Pre-Arrival Alert Banner */}
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
                คนขับอยู่ห่างจากคุณอีกประมาณ 1.8 กม. (ถ.สุขุมวิท) กรุณาเตรียมรับโทรศัพท์และเตรียมเงินสดหากเป็นออเดอร์เก็บเงินปลายทาง
              </div>
            </div>
          </div>

          <button
            className="delivery-alert-call-btn"
            onClick={() => alert('📞 กำลังต่อสายไปยังพนักงานจัดส่ง: 089-123-4567 (คุณธวัชชัย)')}
          >
            <Phone size={14} style={{ display: 'inline', marginRight: 4 }} />
            ติดต่อคนขับ
          </button>
        </aside>

        {/* Header Summary */}
        <section className="tracking-header-card">
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>หมายเลขติดตามพัสดุ (Tracking No.)</div>
            <h1 className="tracking-title">
              <Truck size={22} style={{ color: 'var(--primary)' }} />
              TH-{currentOrderId.replace('MM-', '')}-FLASH
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              คำสั่งซื้อ: <strong>#{currentOrderId}</strong> • ขนส่งโดย <strong>Flash Express (Standard Delivery)</strong>
            </div>
          </div>

          <div className="tracking-eta-box">
            <div className="tracking-eta-label">⏱️ กำหนดส่งถึงคุณโดยประมาณ</div>
            <div className="tracking-eta-time">วันนี้ ภายใน 16:30 น.</div>
          </div>
        </section>

        {/* Stepper Timeline */}
        <section className="tracking-stepper-card">
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            สถานะการจัดส่งแบบเรียลไทม์
          </h2>

          <div className="tracking-stepper">
            <div className="tracking-step tracking-step--done">
              <div className="tracking-step-icon">✓</div>
              <div className="tracking-step-title">1. ยืนยันคำสั่งซื้อ</div>
              <div className="tracking-step-time">16 ส.ค. 09:15 น.</div>
            </div>

            <div className="tracking-step tracking-step--done">
              <div className="tracking-step-icon">✓</div>
              <div className="tracking-step-title">2. ร้านค้าแพ็คสำเร็จ</div>
              <div className="tracking-step-time">16 ส.ค. 11:30 น.</div>
            </div>

            <div className="tracking-step tracking-step--active">
              <div className="tracking-step-icon">
                <Truck size={18} />
              </div>
              <div className="tracking-step-title" style={{ color: 'var(--primary)' }}>
                3. พนักงานกำลังนำส่ง
              </div>
              <div className="tracking-step-time" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                16 ส.ค. 15:45 น.
              </div>
            </div>

            <div className="tracking-step">
              <div className="tracking-step-icon">
                <Package size={16} />
              </div>
              <div className="tracking-step-title" style={{ color: 'var(--text-muted)' }}>
                4. จัดส่งสำเร็จ
              </div>
              <div className="tracking-step-time">รอดำเนินการ</div>
            </div>
          </div>
        </section>

        {/* ── Real Interactive Leaflet OpenStreetMap Map ── */}
        <section className="tracking-map-card">
          <div className="tracking-map-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14 }}>
              <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)' }} />
              <span>แผนที่การเดินทางจริง (OpenStreetMap & Real GPS Navigation)</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>พิกัดดาวเทียม: ถ.สุขุมวิท กรุงเทพฯ (ซูม/เลื่อนแผนที่ได้อิสระ)</span>
          </div>

          <div className="real-leaflet-map-wrapper">
            {/* Live Floating HUD */}
            <div className="leaflet-map-hud">
              <div className="map-hud-title">
                <Navigation size={14} style={{ color: 'var(--primary)' }} />
                <span>กำลังมุ่งหน้าสู่ ซอยสุขุมวิท 39</span>
              </div>
              <div className="map-hud-meta">
                <span>⏱️ <strong>อีกประมาณ 12 นาที (1.8 กม.)</strong></span>
                <span>⚡ ความเร็ว 38 กม./ชม.</span>
              </div>
            </div>

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
                  ยานพาหนะ: รถตู้ Flash (ทะเบียน 2กข-8941 กทม.) • คะแนนพนักงาน 4.9 ★
                </div>
              </div>
            </div>

            <button
              className="driver-call-btn"
              onClick={() => alert('📞 กำลังต่อสายไปยังพนักงานจัดส่ง: 089-123-4567 (คุณธวัชชัย)')}
            >
              <Phone size={15} />
              โทรหาคนขับ (089-123-4567)
            </button>
          </div>
        </section>

        {/* 📸 Proof of Delivery Card (หลักฐานการจัดส่ง) */}
        <section className="proof-delivery-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
            <Camera size={18} style={{ color: 'var(--primary)' }} />
            📸 หลักฐานและรูปถ่ายการส่งมอบพัสดุ (Proof of Delivery)
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
              <div><strong>ระบบยืนยัน:</strong> มีการบันทึกภาพถ่ายและพิกัด GPS ณ เวลาส่งมอบ</div>
              <div style={{ color: 'var(--success)', fontWeight: 700 }}>✓ มีการรับประกันความเสียหายและสูญหายตามนโยบาย Movemall Mall</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default TrackingPage;
