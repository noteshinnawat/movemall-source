// ── Centralized API Service Client for Movemall Frontend ──

import { ApiError } from './apiError.ts';
export { ApiError } from './apiError.ts';

export const API_BASE_URL = (() => {
  let url = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (!url) {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:4000'
      : 'https://movemall-source-production.up.railway.app';
  }
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
})();

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('movemall_jwt_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new ApiError('NETWORK_ERROR', err instanceof Error ? err.message : 'Network request failed');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 429) {
      throw new ApiError('RATE_LIMITED', data.error);
    }
    throw new ApiError(data.code || 'UNKNOWN', data.error || 'An error occurred during API request');
  }

  return data as T;
}

// ── Notification API Types & Helpers ──
export interface ApiNotification {
  id: string;
  userId: string;
  category: 'orders' | 'promos' | 'live' | 'vouchers';
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export async function fetchUserNotifications(category?: string): Promise<{ notifications: ApiNotification[]; unreadCount: number }> {
  const query = category && category !== 'all' ? `?category=${category}` : '';
  return fetchApi<{ notifications: ApiNotification[]; unreadCount: number }>(`/api/notifications${query}`);
}

export async function fetchUnreadNotificationCount(): Promise<{ unreadCount: number }> {
  return fetchApi<{ unreadCount: number }>('/api/notifications/unread-count');
}

export async function markNotificationAsRead(id: string): Promise<{ success: boolean; id: string; unreadCount: number }> {
  return fetchApi<{ success: boolean; id: string; unreadCount: number }>(`/api/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsRead(category?: string): Promise<{ success: boolean; unreadCount: number }> {
  return fetchApi<{ success: boolean; unreadCount: number }>('/api/notifications/read-all', {
    method: 'PATCH',
    body: JSON.stringify({ category }),
  });
}

// ── Affiliate & Creator API Types & Helpers ──
export interface CreatorProfileData {
  userId: string;
  creatorId: string;
  fullName: string;
  idCard: string;
  accountType: 'INDIVIDUAL' | 'COMPANY';
  socialPlatform: string;
  socialHandle: string;
  followerRange: string;
  contentCategory: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  promptPayPhone?: string;
  status: 'VERIFIED' | 'PENDING';
  tier: 'SILVER' | 'GOLD' | 'PLATINUM';
  commissionRate: number;
  availableBalance: number;
  pendingSettlement: number;
  totalEarned: number;
  totalClicks: number;
  totalOrders: number;
  createdAt: string;
}

export interface AffiliateRegisterPayload {
  fullName: string;
  idCard: string;
  accountType?: 'INDIVIDUAL' | 'COMPANY';
  socialPlatform: string;
  socialHandle: string;
  followerRange: string;
  contentCategory: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName?: string;
  promptPayPhone?: string;
}

export async function registerAffiliateCreator(payload: AffiliateRegisterPayload): Promise<{ message: string; creator: CreatorProfileData }> {
  return fetchApi<{ message: string; creator: CreatorProfileData }>('/api/payout/affiliate/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAffiliateProfile(): Promise<{ isRegistered: boolean; creator: CreatorProfileData | null }> {
  return fetchApi<{ isRegistered: boolean; creator: CreatorProfileData | null }>('/api/payout/affiliate/profile');
}

export async function requestAffiliatePayout(amount: number, payoutMethod: string = 'PROMPTPAY'): Promise<{
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payout: any;
  remainingBalance: number;
}> {
  return fetchApi<{
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payout: any;
    remainingBalance: number;
  }>('/api/payout/request', {
    method: 'POST',
    body: JSON.stringify({ amount, payoutMethod }),
  });
}

// ── Wishlist API Types & Helpers ──
export interface ApiWishlistResponse {
  productIds: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items?: Array<{ id: string; productId: string; product: any }>;
}

export async function fetchUserWishlist(): Promise<ApiWishlistResponse> {
  return fetchApi<ApiWishlistResponse>('/api/user/wishlist');
}

export async function syncUserWishlist(productIds: string[]): Promise<ApiWishlistResponse> {
  return fetchApi<ApiWishlistResponse>('/api/user/wishlist/sync', {
    method: 'POST',
    body: JSON.stringify({ productIds }),
  });
}

export async function toggleUserWishlistItem(productId: string): Promise<{ isWished: boolean; productId: string; productIds: string[] }> {
  return fetchApi<{ isWished: boolean; productId: string; productIds: string[] }>('/api/user/wishlist/toggle', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}

export async function removeUserWishlistItem(productId: string): Promise<{ message: string; productIds: string[] }> {
  return fetchApi<{ message: string; productIds: string[] }>(`/api/user/wishlist/${productId}`, {
    method: 'DELETE',
  });
}

// ── Catalog, Products & Stores API Helpers ──
export interface FetchProductsParams {
  category?: string;
  search?: string;
  brand?: string;
  badge?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export async function fetchProductsApi(params: FetchProductsParams = {}): Promise<{ products: any[]; pagination: any }> {
  const queryParams = new URLSearchParams();
  if (params.category && params.category !== 'all') queryParams.set('category', params.category);
  if (params.search) queryParams.set('search', params.search);
  if (params.brand) queryParams.set('brand', params.brand);
  if (params.badge && params.badge !== 'all') queryParams.set('badge', params.badge);
  if (params.minPrice) queryParams.set('minPrice', String(params.minPrice));
  if (params.maxPrice) queryParams.set('maxPrice', String(params.maxPrice));
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.page) queryParams.set('page', String(params.page));
  if (params.limit) queryParams.set('limit', String(params.limit));

  const qs = queryParams.toString();
  return fetchApi<{ products: any[]; pagination: any }>(`/api/products${qs ? `?${qs}` : ''}`);
}

export async function fetchProductByIdApi(id: string): Promise<{ product: any }> {
  return fetchApi<{ product: any }>(`/api/products/${id}`);
}

export async function fetchStoresApi(params: { isMall?: boolean; search?: string } = {}): Promise<{ stores: any[] }> {
  const queryParams = new URLSearchParams();
  if (params.isMall !== undefined) queryParams.set('isMall', String(params.isMall));
  if (params.search) queryParams.set('search', params.search);
  const qs = queryParams.toString();
  return fetchApi<{ stores: any[] }>(`/api/stores${qs ? `?${qs}` : ''}`);
}

export async function fetchStoreByIdApi(id: string): Promise<{ store: any }> {
  return fetchApi<{ store: any }>(`/api/stores/${id}`);
}

export async function createProductApi(payload: any): Promise<{ message: string; product: any }> {
  return fetchApi<{ message: string; product: any }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProductApi(id: string, payload: any): Promise<{ message: string; product: any }> {
  return fetchApi<{ message: string; product: any }>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProductApi(id: string): Promise<{ message: string; id: string }> {
  return fetchApi<{ message: string; id: string }>(`/api/products/${id}`, {
    method: 'DELETE',
  });
}

// ── Live Streams & Media API Helpers ──
export async function fetchActiveLiveStreamsApi(): Promise<{ streams: any[] }> {
  return fetchApi<{ streams: any[] }>('/api/live/active-streams');
}

export async function createLiveSessionApi(payload: {
  title: string;
  storeId?: string;
  pinnedProductId?: string;
  coverImage?: string;
}): Promise<{ message: string; session: any }> {
  return fetchApi<{ message: string; session: any }>('/api/live/create-session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Orders & Checkout API Helpers ──
export async function fetchMyOrdersApi(): Promise<{ orders: any[] }> {
  return fetchApi<{ orders: any[] }>('/api/orders/my-orders');
}

export async function createOrderApi(payload: {
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: string;
  shippingAddress: any;
  coinsUsed?: number;
}): Promise<{ message: string; order: any }> {
  return fetchApi<{ message: string; order: any }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Product Reviews API Helpers ──
export async function fetchProductReviewsApi(productId: string): Promise<{ reviews: any[] }> {
  return fetchApi<{ reviews: any[] }>(`/api/products/${productId}/reviews`);
}

export async function submitProductReviewApi(productId: string, payload: { rating: number; comment: string; images?: string[] }): Promise<{ message: string; review: any }> {
  return fetchApi<{ message: string; review: any }>(`/api/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Movemall Ads API Helpers ──
export async function fetchAdWalletApi(storeId?: string): Promise<{ wallet: any }> {
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
  return fetchApi<{ wallet: any }>(`/api/ads/wallet${query}`);
}

export async function topupAdWalletApi(amount: number, storeId?: string): Promise<{ message: string; wallet: any }> {
  return fetchApi<{ message: string; wallet: any }>('/api/ads/wallet/topup', {
    method: 'POST',
    body: JSON.stringify({ amount, storeId }),
  });
}

export async function fetchAdCampaignsApi(storeId?: string, type?: string): Promise<{ campaigns: any[] }> {
  const params = new URLSearchParams();
  if (storeId) params.set('storeId', storeId);
  if (type && type !== 'all') params.set('type', type);
  const qs = params.toString();
  return fetchApi<{ campaigns: any[] }>(`/api/ads/campaigns${qs ? `?${qs}` : ''}`);
}

export async function createAdCampaignApi(payload: any): Promise<{ message: string; campaign: any }> {
  return fetchApi<{ message: string; campaign: any }>('/api/ads/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleAdCampaignApi(id: string): Promise<{ message: string; campaign: any }> {
  return fetchApi<{ message: string; campaign: any }>(`/api/ads/campaigns/${id}/toggle`, {
    method: 'PATCH',
  });
}

// ── Seller Orders & Shipping API Helpers ──
export async function fetchSellerOrdersApi(storeId?: string): Promise<{ orders: any[] }> {
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
  return fetchApi<{ orders: any[] }>(`/api/orders/seller/store-orders${query}`);
}

export async function updateOrderStatusApi(id: string, payload: { status: string; trackingNumber?: string; courierProvider?: string }): Promise<{ message: string; order: any }> {
  return fetchApi<{ message: string; order: any }>(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ── Tax & e-Tax Invoices API Helpers ──
export async function fetchStoreTaxSettingsApi(storeId: string): Promise<any> {
  return fetchApi<any>(`/api/tax/store/${encodeURIComponent(storeId)}/settings`);
}

export async function updateStoreTaxSettingsApi(storeId: string, payload: any): Promise<any> {
  return fetchApi<any>(`/api/tax/store/${encodeURIComponent(storeId)}/settings`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function fetchTaxDocumentsApi(storeId?: string): Promise<{ documents?: any[]; data?: any[] }> {
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
  return fetchApi<{ documents?: any[]; data?: any[] }>(`/api/tax/documents${query}`);
}




// ── ออกจากระบบ ──
// ลบ token ฝั่ง client อย่างเดียวไม่พอ — token ใบนั้นยังใช้เรียก API ได้จนหมดอายุ
// จึงต้องแจ้งเซิร์ฟเวอร์ให้เพิกถอน (ใส่บัญชีดำ) ด้วยเสมอ
export function logoutApi(): void {
  const token = localStorage.getItem('movemall_jwt_token');

  // ยิงแบบไม่รอผล เพื่อไม่ให้ UI ค้างหากเครือข่ายช้า
  if (token) {
    fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      keepalive: true,
    }).catch(() => {
      // ออฟไลน์: token จะยังใช้ได้จนหมดอายุ ซึ่งรับได้สำหรับการกดออกจากระบบทั่วไป
    });
  }

  localStorage.removeItem('movemall_jwt_token');
  localStorage.removeItem('movemall_user');
  window.dispatchEvent(new Event('movemall_auth_change'));
}
