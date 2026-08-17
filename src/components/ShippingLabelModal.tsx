// src/components/ShippingLabelModal.tsx — 100x150mm Thermal Shipping Label (Air Waybill)

import { Printer, X, Tag, Truck } from 'lucide-react';
import './ShippingLabelModal.css';

export interface ShippingLabelProps {
  orderId: string;
  trackingNo?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  zipCode?: string;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  items: { name: string; quantity: number }[];
  total: number;
  isCOD?: boolean;
  onClose: () => void;
}

export function ShippingLabelModal({
  orderId,
  trackingNo = 'TH-2026-0891-FLASH',
  customerName,
  customerPhone,
  customerAddress,
  zipCode = '10110',
  storeName,
  storePhone,
  storeAddress,
  items,
  total,
  isCOD = false,
  onClose,
}: ShippingLabelProps) {
  function handlePrint() {
    window.print();
  }

  // Generate realistic barcode bars
  const barcodePattern = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2];

  return (
    <div className="label-modal-backdrop" onClick={onClose}>
      <div className="label-modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Top Bar */}
        <div className="label-modal-header">
          <div className="label-modal-title">
            <Tag size={16} style={{ color: 'var(--primary)' }} />
            ใบปะหน้าพัสดุ (Air Waybill Label)
          </div>
          <div className="label-modal-actions">
            <button className="label-print-btn" onClick={handlePrint}>
              <Printer size={14} /> พิมพ์ใบปะหน้า (4x6 นิ้ว)
            </button>
            <button className="label-close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* ── 100x150mm Air Waybill Printable Sheet ── */}
        <div className="awb-sheet">
          {/* Header */}
          <div className="awb-row awb-header-zone">
            <div className="awb-brand-logo">
              🛍️ MOVEMALL
            </div>
            <div className="awb-courier-tag">
              ⚡ FLASH EXPRESS
            </div>
            {isCOD ? (
              <div className="awb-cod-box">
                COD: ฿{total.toLocaleString()}
              </div>
            ) : (
              <div style={{ fontWeight: 800, fontSize: 10, border: '1px solid #000', padding: '2px 4px' }}>
                ชำระเงินแล้ว (PAID)
              </div>
            )}
          </div>

          {/* Sorting Code */}
          <div className="awb-row awb-sorting-zone">
            <div>
              <div style={{ fontSize: 9, fontWeight: 700 }}>รหัสคัดแยกปลายทาง (HUB SORTING CODE)</div>
              <div className="awb-sorting-code">BKK-WTT-039</div>
            </div>
            <div className="awb-route-type">
              STANDARD 24H
            </div>
          </div>

          {/* Barcode */}
          <div className="awb-row" style={{ flexDirection: 'column' }}>
            <div className="awb-barcode-zone">
              <div className="awb-barcode-lines">
                {barcodePattern.map((w, idx) => (
                  <div
                    key={idx}
                    className="awb-barcode-bar"
                    style={{ width: `${w * 1.5}px` }}
                  />
                ))}
              </div>
              <div className="awb-tracking-number">{trackingNo}</div>
              <div style={{ fontSize: 9, color: '#333333' }}>Order Ref: #{orderId}</div>
            </div>
          </div>

          {/* Sender & Recipient Addresses */}
          <div className="awb-row">
            <div className="awb-address-col">
              <div className="awb-label-tag">ผู้ส่ง (Sender):</div>
              <div style={{ fontWeight: 800 }}>{storeName}</div>
              <div>โทร: {storePhone}</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>{storeAddress}</div>
            </div>

            <div className="awb-address-col">
              <div className="awb-label-tag">ผู้รับ (Recipient):</div>
              <div className="awb-recipient-name">{customerName}</div>
              <div>โทร: {customerPhone}</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>{customerAddress}</div>
              <div className="awb-recipient-zip">รหัส ปณ. {zipCode}</div>
            </div>
          </div>

          {/* Order Items Summary */}
          <div className="awb-row" style={{ flexDirection: 'column' }}>
            <div className="awb-items-zone">
              <div style={{ fontWeight: 800, marginBottom: 2 }}>รายการสินค้าในกล่อง:</div>
              {items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>• {it.name}</span>
                  <strong>x {it.quantity}</strong>
                </div>
              ))}
            </div>

            <div className="awb-fragile-alert">
              ⚠️ คำเตือน: ระวังแตก ห้ามโยน (FRAGILE) • มีประกันสินค้า Movemall Mall
            </div>
          </div>

          {/* Footer Time */}
          <div className="awb-row awb-row--last" style={{ padding: '4px 10px', fontSize: 8, justifyContent: 'space-between', color: '#666' }}>
            <span>พิมพ์เมื่อ: 16 ส.ค. 2026 15:55 น.</span>
            <span>ระบบขนส่งอัตโนมัติ Movemall x Flash Open API</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShippingLabelModal;
