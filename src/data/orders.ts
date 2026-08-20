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

export const mockOrders: Order[] = [];

// Status labels live in public/locales/*/commerce.json under `orderStatus`.

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'var(--warning)',
  processing: 'var(--primary-light)',
  shipped: 'hsl(200, 80%, 55%)',
  delivered: 'var(--success)',
  cancelled: 'var(--error)',
};

/** Get all real user orders from localStorage */
export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem('movemall_orders');
    if (raw) {
      const parsed: Order[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load orders from localStorage:', err);
  }
  return [];
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

