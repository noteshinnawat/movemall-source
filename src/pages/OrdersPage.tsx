import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, MapPin, Truck, ShoppingBag, ArrowRight, Flag, ShieldAlert } from 'lucide-react';
import { mockOrders, STATUS_LABEL, STATUS_COLOR } from '../data/orders';
import { ReportStoreModal } from '../components/ReportStoreModal';
import './OrdersPage.css';

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [reportingOrder, setReportingOrder] = useState<any | null>(null);

  const filteredOrders = activeTab === 'all'
    ? mockOrders
    : mockOrders.filter(o => o.status === activeTab);

  return (
    <main className="orders">
      <div className="orders__header">
        <div className="container">
          <h1 className="orders__header-title">
            <Package size={28} style={{ color: 'var(--primary)' }} />
            ประวัติคำสั่งซื้อของฉัน
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            ตรวจสอบสถานะพัสดุ ติดตามตำแหน่งรถส่งของ และดูประวัติการสั่งซื้อย้อนหลัง
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
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'shipped', label: '🚚 กำลังนำส่ง' },
              { id: 'delivered', label: '✓ สำเร็จแล้ว' },
              { id: 'processing', label: '⏳ กำลังเตรียมพัสดุ' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  background: activeTab === tab.id ? 'var(--primary)' : 'var(--surface)',
                  color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'var(--transition)',
                }}
              >
                {tab.label}
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
                        {new Date(order.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <span
                      className="order-card__status"
                      style={{ color: STATUS_COLOR[order.status] }}
                    >
                      {STATUS_LABEL[order.status]}
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
                            <p className="order-card__item-qty">จำนวน: {item.quantity} ชิ้น</p>
                          </div>
                          <span className="order-card__item-price">
                            ฿{(item.price * item.quantity).toLocaleString()}
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
                          ยอดสุทธิ: ฿{order.total.toLocaleString()}
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
                          title="ร้องเรียนสินค้าปลอม ไม่ตรงปก หรือมิจฉาชีพ เพื่อขอเงินคืน"
                        >
                          <Flag size={13} />
                          <span>ร้องเรียน / แจ้งของปลอม</span>
                        </button>

                        <Link
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
                          <Truck size={14} /> ติดตามพัสดุสด
                        </Link>
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
                ไม่พบรายการคำสั่งซื้อในหมวดนี้
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                เลือกซื้อสินค้าแบรนด์ดังราคาพิเศษพร้อมส่งฟรีได้เลย
              </p>
              <Link
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
                <ShoppingBag size={15} /> ไปช้อปปิ้งกันเลย <ArrowRight size={14} />
              </Link>
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
          targetName={`คำสั่งซื้อ #${reportingOrder.id} (${reportingOrder.items?.map((i: any) => i.name).join(', ')})`}
          storeName={reportingOrder.storeName || 'ร้านค้าบน Movemall'}
          orderId={reportingOrder.id}
        />
      )}
    </main>
  );
}

export default OrdersPage;
