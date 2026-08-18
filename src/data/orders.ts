// src/data/orders.ts — Mock order history data

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address: string;
}

export const mockOrders: Order[] = [
  {
    id: 'ORD-20260816-001',
    createdAt: '2026-08-16T08:00:00Z',
    status: 'shipped',
    items: [
      {
        productId: 'p1',
        name: 'หูฟังไร้สาย Premium Pro X',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
        price: 1290,
        quantity: 1,
      },
      {
        productId: 'p4',
        name: 'ครีมกันแดด SPF 50+ PA++++',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
        price: 349,
        quantity: 2,
      },
    ],
    subtotal: 1988,
    shipping: 0,
    total: 1988,
    address: '123 ถ.สุขุมวิท กรุงเทพฯ 10110',
  },
  {
    id: 'ORD-20260810-002',
    createdAt: '2026-08-10T14:30:00Z',
    status: 'delivered',
    items: [
      {
        productId: 'p6',
        name: 'รองเท้าวิ่ง Air Max Boost',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
        price: 2190,
        quantity: 1,
      },
    ],
    subtotal: 2190,
    shipping: 0,
    total: 2190,
    address: '456 ถ.พระราม 9 กรุงเทพฯ 10310',
  },
  {
    id: 'ORD-20260801-003',
    createdAt: '2026-08-01T10:00:00Z',
    status: 'delivered',
    items: [
      {
        productId: 'p7',
        name: 'กาแฟ Single Origin Ethiopia',
        image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80',
        price: 299,
        quantity: 3,
      },
    ],
    subtotal: 897,
    shipping: 0,
    total: 897,
    address: '789 ถ.ลาดพร้าว กรุงเทพฯ 10230',
  },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '⏳ รอดำเนินการ',
  processing: '⚙️ กำลังจัดเตรียม',
  shipped: '🚚 กำลังจัดส่ง',
  delivered: '✅ ส่งสำเร็จ',
  cancelled: '❌ ยกเลิกแล้ว',
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'var(--warning)',
  processing: 'var(--primary-light)',
  shipped: 'hsl(200, 80%, 55%)',
  delivered: 'var(--success)',
  cancelled: 'var(--error)',
};

/** Get all combined orders (local user orders + demo mock orders) */
export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem('movemall_orders');
    if (raw) {
      const parsed: Order[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const localIds = new Set(parsed.map(o => o.id));
        const nonDuplicateMocks = mockOrders.filter(m => !localIds.has(m.id));
        return [...parsed, ...nonDuplicateMocks];
      }
    }
  } catch (err) {
    console.error('Failed to load orders from localStorage:', err);
  }
  return mockOrders;
}

/** Save a new order to localStorage */
export function saveOrder(newOrder: Order): void {
  try {
    const current = getStoredOrders();
    const updated = [newOrder, ...current.filter(o => o.id !== newOrder.id)];
    localStorage.setItem('movemall_orders', JSON.stringify(updated));
    window.dispatchEvent(new Event('movemall_orders_change'));
  } catch (err) {
    console.error('Failed to save order to localStorage:', err);
  }
}

/** Update status of an existing order */
export function updateOrderStatus(orderId: string, status: OrderStatus): void {
  try {
    const current = getStoredOrders();
    const updated = current.map(o => o.id === orderId ? { ...o, status } : o);
    localStorage.setItem('movemall_orders', JSON.stringify(updated));
    window.dispatchEvent(new Event('movemall_orders_change'));
  } catch (err) {
    console.error('Failed to update order status:', err);
  }
}

/** Generate a formatted Tracking Number from Order ID */
export function getOrderTrackingNumber(order: Order): string {
  const cleanId = order.id.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return `TH-FLASH-${cleanId.slice(-8)}`;
}

