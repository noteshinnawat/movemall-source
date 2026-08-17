// src/data/mockAdsData.ts — Movemall Ads Initial Mock Data & Persistence

import type { AdCampaign, AdWallet } from '../types';

export const initialAdWallet: AdWallet = {
  storeId: 'store-1',
  balance: 3450.0,
  transactions: [
    {
      id: 'tx-1',
      type: 'topup',
      amount: 5000.0,
      description: 'เติมเงินผ่าน PromptPay QR Code',
      createdAt: '2026-08-10 14:32:10',
    },
    {
      id: 'tx-2',
      type: 'click_deduct',
      amount: -850.0,
      description: 'หักค่าคลิก Search Ads (Sony WH-1000XM5)',
      createdAt: '2026-08-14 23:59:59',
    },
    {
      id: 'tx-3',
      type: 'click_deduct',
      amount: -700.0,
      description: 'หักค่าคลิก Discovery Ads (iPhone 16 Pro Max)',
      createdAt: '2026-08-15 23:59:59',
    },
  ],
};

export const initialAdCampaigns: AdCampaign[] = [
  {
    id: 'ad-camp-1',
    storeId: 'store-1',
    productId: 'p-1', // iPhone 16 Pro Max
    productName: 'Apple iPhone 16 Pro Max 256GB Desert Titanium',
    productImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80',
    type: 'search',
    status: 'active',
    dailyBudget: 300,
    cpcBid: 3.5,
    spentToday: 185.5,
    totalSpent: 2450.0,
    impressions: 14200,
    clicks: 700,
    conversions: 24,
    revenue: 1199760.0,
    keywords: [
      { id: 'kw-1', keyword: 'iphone 16', bidPrice: 3.5, matchType: 'broad' },
      { id: 'kw-2', keyword: 'iphone 16 pro max', bidPrice: 4.0, matchType: 'exact' },
      { id: 'kw-3', keyword: 'โทรศัพท์ apple', bidPrice: 2.5, matchType: 'broad' },
    ],
    startDate: '2026-08-01',
  },
  {
    id: 'ad-camp-2',
    storeId: 'store-1',
    productId: 'p-2', // Sony WH-1000XM5
    productName: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    productImage: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&q=80',
    type: 'discovery',
    status: 'active',
    dailyBudget: 150,
    cpcBid: 2.0,
    spentToday: 98.0,
    totalSpent: 1350.0,
    impressions: 8900,
    clicks: 675,
    conversions: 18,
    revenue: 251820.0,
    keywords: [
      { id: 'kw-4', keyword: 'หูฟังตัดเสียงรบกวน', bidPrice: 2.0, matchType: 'broad' },
      { id: 'kw-5', keyword: 'sony wh-1000xm5', bidPrice: 2.5, matchType: 'exact' },
    ],
    startDate: '2026-08-05',
  },
  {
    id: 'ad-camp-3',
    storeId: 'store-1',
    productId: 'p-4', // iPad Pro M4
    productName: 'Apple iPad Pro 11-inch M4 Ultra Retina XDR OLED',
    productImage: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80',
    type: 'live_boost',
    status: 'paused',
    dailyBudget: 200,
    cpcBid: 2.8,
    spentToday: 0,
    totalSpent: 840.0,
    impressions: 5400,
    clicks: 300,
    conversions: 6,
    revenue: 239400.0,
    keywords: [],
    startDate: '2026-08-10',
  },
];
