// src/pages/VouchersPage.tsx — Vouchers & Promotion Center

import { useState } from 'react';
import { Ticket, Check, Sparkles, Truck, Coins, Store } from 'lucide-react';
import './VouchersPage.css';

interface Voucher {
  id: string;
  type: 'shipping' | 'platform' | 'cashback' | 'store';
  discount: string;
  minSpend: string;
  expiry: string;
  storeName?: string;
}

const MOCK_VOUCHERS: Voucher[] = [
  {
    id: 'v-ship-1',
    type: 'shipping',
    discount: 'ส่งฟรี ฿0',
    minSpend: 'ขั้นต่ำ ฿0 ทั่วไทย',
    expiry: 'หมดอายุใน 3 วัน',
  },
  {
    id: 'v-ship-2',
    type: 'shipping',
    discount: 'ส่วนลดค่าส่ง ฿40',
    minSpend: 'ขั้นต่ำ ฿150',
    expiry: 'หมดอายุสิ้นเดือนนี้',
  },
  {
    id: 'v-plat-1',
    type: 'platform',
    discount: 'ลด 15% สูงสุด ฿300',
    minSpend: 'เมื่อช้อปครบ ฿1,000',
    expiry: 'ใช้ได้กับสินค้าทุกหมวดหมู่',
  },
  {
    id: 'v-plat-2',
    type: 'platform',
    discount: 'ลดทันที ฿100',
    minSpend: 'เมื่อช้อปครบ ฿600',
    expiry: 'สำหรับลูกค้าทั่วไป',
  },
  {
    id: 'v-coin-1',
    type: 'cashback',
    discount: 'รับเงินคืน 20% Coins',
    minSpend: 'คืนสูงสุด 200 Coins',
    expiry: 'ใช้เป็นส่วนลดออเดอร์ถัดไป',
  },
  {
    id: 'v-store-1',
    type: 'store',
    discount: 'ลด ฿50 ประจำร้าน',
    minSpend: 'เมื่อซื้อครบ ฿500',
    storeName: 'TechPro Official Store',
    expiry: 'เฉพาะร้าน TechPro',
  },
  {
    id: 'v-store-2',
    type: 'store',
    discount: 'ลด 10% ประจำร้าน',
    minSpend: 'เมื่อซื้อครบ ฿800',
    storeName: 'Fashionista Studio',
    expiry: 'เฉพาะร้าน Fashionista',
  },
];

export function VouchersPage() {
  const [filter, setFilter] = useState<'all' | 'shipping' | 'platform' | 'cashback' | 'store'>('all');
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});

  const filteredVouchers = filter === 'all'
    ? MOCK_VOUCHERS
    : MOCK_VOUCHERS.filter(v => v.type === filter);

  function handleClaim(id: string) {
    setClaimed(prev => ({ ...prev, [id]: true }));
  }

  function handleClaimAll() {
    const allClaimed: Record<string, boolean> = {};
    MOCK_VOUCHERS.forEach(v => {
      allClaimed[v.id] = true;
    });
    setClaimed(allClaimed);
  }

  return (
    <main className="vouchers-page">
      <section className="vouchers-hero">
        <div className="container">
          <h1 className="vouchers-hero__title">🎟️ ศูนย์รวมโค้ดส่วนลด Movemall</h1>
          <p className="vouchers-hero__subtitle">
            เก็บโค้ดส่งฟรี โค้ดส่วนลดเงินสด และคูปองเงินคืน นำไปใช้ลดเพิ่มตอนชำระเงินได้ทันที!
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
            เก็บโค้ดทั้งหมดในคลิกเดียว
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
            ทั้งหมด
          </button>
          <button
            className={`voucher-chip${filter === 'shipping' ? ' voucher-chip--active' : ''}`}
            onClick={() => setFilter('shipping')}
          >
            <Truck size={14} style={{ display: 'inline', marginRight: 4 }} />
            โค้ดส่งฟรี
          </button>
          <button
            className={`voucher-chip${filter === 'platform' ? ' voucher-chip--active' : ''}`}
            onClick={() => setFilter('platform')}
          >
            <Ticket size={14} style={{ display: 'inline', marginRight: 4 }} />
            โค้ดส่วนลด Movemall
          </button>
          <button
            className={`voucher-chip${filter === 'cashback' ? ' voucher-chip--active' : ''}`}
            onClick={() => setFilter('cashback')}
          >
            <Coins size={14} style={{ display: 'inline', marginRight: 4 }} />
            รับเงินคืน Coins
          </button>
          <button
            className={`voucher-chip${filter === 'store' ? ' voucher-chip--active' : ''}`}
            onClick={() => setFilter('store')}
          >
            <Store size={14} style={{ display: 'inline', marginRight: 4 }} />
            โค้ดจากร้านค้า
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
                  {v.storeName ? v.storeName : v.type === 'shipping' ? '🚚 โค้ดส่งฟรี' : v.type === 'cashback' ? '💰 เงินคืน Coins' : '🎟️ คูปองส่วนลด'}
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
                    เก็บแล้ว
                  </>
                ) : (
                  'เก็บโค้ด'
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
