// ── Centralized API Service Client for Movemall Frontend ──

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred during API request');
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

// ── Live Streams & Media API Helpers ──
export async function fetchActiveLiveStreamsApi(): Promise<{ streams: any[] }> {
  return fetchApi<{ streams: any[] }>('/api/live/active-streams');
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
  discountAmount?: number;
}): Promise<{ message: string; order: any }> {
  return fetchApi<{ message: string; order: any }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}



