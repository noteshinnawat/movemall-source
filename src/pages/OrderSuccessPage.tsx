// src/pages/OrderSuccessPage.tsx

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Package,
  Truck,
  Sparkles,
  Check,
  Smartphone,
} from 'lucide-react';
import { LineConnectModal } from '../components/LineConnectModal';
import './OrderSuccessPage.css';

export function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id') || `ORD-${Date.now()}`;
  const total = searchParams.get('total') ? Number(searchParams.get('total')) : null;
  const method = searchParams.get('method') || 'promptpay';
  const isCOD = method === 'cod';

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

  useEffect(() => {
    function syncAuth() {
      try {
        const u = localStorage.getItem('movemall_user');
        if (u) setIsLineConnected(!!JSON.parse(u).lineConnected);
      } catch {
        // ignore
      }
    }
    window.addEventListener('movemall_auth_change', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('movemall_auth_change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  return (
    <main className="order-success">
      <div className="container">
        <div className="order-success__card">
          <div className="order-success__icon-wrapper">
            <CheckCircle2 size={64} className="order-success__icon" />
          </div>

          <span className="order-success__badge">สั่งซื้อสำเร็จ 🎉</span>
          <h1 className="order-success__title">ขอบคุณสำหรับการสั่งซื้อ!</h1>
          <p className="order-success__subtitle">
            เราได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว และกำลังเตรียมจัดส่งสินค้าอย่างรวดเร็วที่สุด
          </p>

          {isCOD && total !== null && (
            <div style={{
              background: '#FEF3C7',
              border: '1.5px solid #F59E0B',
              padding: '12px 16px',
              margin: '16px 0',
              textAlign: 'left',
              color: '#92400E',
              fontSize: 13,
              lineHeight: 1.5,
              borderRadius: '6px',
            }}>
              <strong>💵 คำแนะนำสำหรับเก็บเงินปลายทาง (COD):</strong>
              <div>กรุณาเตรียมเงินสดจำนวน <strong>฿{total.toLocaleString()}</strong> ไว้ล่วงหน้า และเตรียมรับสายโทรศัพท์จากพนักงานจัดส่ง Flash Express เมื่อพัสดุถึงบ้าน</div>
            </div>
          )}

          {/* High-Converting LINE Connect Card */}
          <div className="order-success__line-card">
            <div className="order-success__line-header">
              <div className="order-success__line-badge-icon">LINE</div>
              <div className="order-success__line-texts">
                <h3 className="order-success__line-title">
                  {isLineConnected
                    ? '✓ เชื่อมต่อ LINE แจ้งเตือนพัสดุเรียบร้อยแล้ว'
                    : '📲 รับการแจ้งเตือนพัสดุ & เลขแทร็กกิ้งผ่าน LINE ฟรี!'}
                </h3>
                <p className="order-success__line-desc">
                  {isLineConnected
                    ? 'ระบบจะส่งเลขพัสดุ Flash Express และแจ้งเตือนเมื่อพนักงานนำส่งเข้าแชท LINE ของคุณอัตโนมัติ'
                    : 'เชื่อมต่อบัญชี LINE รับทันที +50 Movemall Coins พร้อมรับใบเสร็จและแจ้งเตือนจัดส่งพัสดุสด'}
                </p>
              </div>
            </div>

            <div className="order-success__line-actions">
              {!isLineConnected ? (
                <button
                  type="button"
                  className="order-success__line-btn order-success__line-btn--connect"
                  onClick={() => setIsLineModalOpen(true)}
                >
                  <Sparkles size={16} />
                  เชื่อมต่อ LINE ทันที (รับฟรี 50 Coins)
                </button>
              ) : (
                <button
                  type="button"
                  className="order-success__line-btn order-success__line-btn--view"
                  onClick={() => setIsLineModalOpen(true)}
                >
                  <Smartphone size={16} />
                  ดูตัวอย่างข้อความและจัดการการแจ้งเตือน
                </button>
              )}
            </div>
          </div>

          <div className="order-success__info">
            <div className="order-success__info-row">
              <span className="order-success__info-label">หมายเลขคำสั่งซื้อ</span>
              <span className="order-success__info-val order-success__order-id">{orderId}</span>
            </div>
            {total !== null && (
              <div className="order-success__info-row">
                <span className="order-success__info-label">ยอดชำระทั้งหมด</span>
                <span className="order-success__info-val">฿{total.toLocaleString()}</span>
              </div>
            )}
            <div className="order-success__info-row">
              <span className="order-success__info-label">รูปแบบการชำระเงิน</span>
              <span className="order-success__info-val">
                {isCOD ? '💵 เก็บเงินปลายทาง (COD)' : method === 'credit' ? '💳 บัตรเครดิต/เดบิต' : '📱 พร้อมเพย์ (PromptPay QR)'}
              </span>
            </div>
            <div className="order-success__info-row">
              <span className="order-success__info-label">สถานะการชำระเงิน</span>
              <span className={`order-success__info-val ${isCOD ? 'order-success__status-pending' : 'order-success__status-paid'}`} style={isCOD ? { color: '#D97706', fontWeight: 800 } : {}}>
                {isCOD ? 'รอชำระเงินเมื่อได้รับสินค้า' : 'ชำระเงินสำเร็จ'}
              </span>
            </div>
            <div className="order-success__info-row">
              <span className="order-success__info-label">กำหนดการส่งโดยประมาณ</span>
              <span className="order-success__info-val">1-3 วันทำการ (Flash Express)</span>
            </div>
          </div>

          <div className="order-success__actions">
            <Link to={`/tracking?id=${orderId}`} className="order-success__btn order-success__btn--primary">
              <Truck size={18} />
              ติดตามสถานะพัสดุ (Live GPS)
            </Link>
            <Link to="/shop" className="order-success__btn order-success__btn--secondary">
              <ShoppingBag size={18} />
              ช้อปสินค้าต่อ
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* LINE Connect Modal */}
      <LineConnectModal
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
        initialOrderId={orderId}
        initialTotal={total || undefined}
      />
    </main>
  );
}

export default OrderSuccessPage;
