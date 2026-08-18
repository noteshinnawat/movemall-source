// ── Centralized API Service Client for Movemall Frontend ──

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

