// src/pages/OrderSuccessPage.tsx

import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import './OrderSuccessPage.css';

export function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id') || `ORD-${Date.now()}`;
  const total = searchParams.get('total') ? Number(searchParams.get('total')) : null;
  const method = searchParams.get('method') || 'promptpay';
  const isCOD = method === 'cod';

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
            }}>
              <strong>💵 คำแนะนำสำหรับเก็บเงินปลายทาง (COD):</strong>
              <div>กรุณาเตรียมเงินสดจำนวน <strong>฿{total.toLocaleString()}</strong> ไว้ล่วงหน้า และเตรียมรับสายโทรศัพท์จากพนักงานจัดส่ง Flash Express เมื่อพัสดุถึงบ้าน</div>
            </div>
          )}

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
            <Link to="/orders" className="order-success__btn order-success__btn--primary">
              <Package size={18} />
              ดูประวัติคำสั่งซื้อ
            </Link>
            <Link to="/shop" className="order-success__btn order-success__btn--secondary">
              <ShoppingBag size={18} />
              ช้อปสินค้าต่อ
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default OrderSuccessPage;
