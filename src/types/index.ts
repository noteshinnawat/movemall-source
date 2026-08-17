export interface Store {
  id: string;
  name: string;
  logo: string;
  banner?: string;
  badge?: 'official' | 'preferred' | 'verified';
  rating: number;
  reviewCount: number;
  responseRate: string;
  responseTime: string;
  joinedDate: string;
  productCount: number;
  followerCount: number;
  location: string;
  description: string;
}

export interface VideoReview {
  id: string;
  videoUrl: string;
  posterUrl?: string;
  creatorName: string;
  creatorAvatar?: string;
  duration?: number;
  viewsCount?: number;
  likesCount?: number;
  isTrending?: boolean;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  videoUrl?: string;
  videoReview?: VideoReview;
  category: string;
  rating: number;
  reviewCount: number;
  stock: number;
  description: string;
  tags: string[];
  badge?: 'new' | 'sale' | 'hot' | 'limited';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image?: string;
  tag?: string;
  productCount: number;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images?: string[];
  video?: string;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  gradient: string;
  image?: string;
}

export type AdType = 'search' | 'discovery' | 'live_boost';
export type AdStatus = 'active' | 'paused' | 'out_of_budget' | 'ended';

export interface AdKeyword {
  id: string;
  keyword: string;
  bidPrice: number;
  matchType: 'exact' | 'broad';
}

export interface AdCampaign {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  productImage: string;
  type: AdType;
  status: AdStatus;
  dailyBudget: number;
  cpcBid: number;
  spentToday: number;
  totalSpent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  keywords: AdKeyword[];
  startDate: string;
}

export interface AdTransaction {
  id: string;
  type: 'topup' | 'click_deduct' | 'refund';
  amount: number;
  description: string;
  createdAt: string;
}

export interface AdWallet {
  storeId: string;
  balance: number;
  transactions: AdTransaction[];
}

export interface PinnedProductItem {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountPct?: number;
  commissionRate?: number;
  commissionAmount?: number;
  salesCount?: number;
  badge?: string;
  rating?: number;
}

export interface VideoComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  time: string;
  likesCount: number;
  isLiked?: boolean;
  badge?: string;
}

export interface VideoClip {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorHandle: string;
  isFollowed?: boolean;
  verified?: boolean;
  caption: string;
  hashtags: string[];
  soundTitle: string;
  soundAuthor?: string;
  category: string;
  videoUrl: string;
  coverImage?: string;
  durationSeconds: number; // Max 60s
  fileSizeBytes?: number;
  originalSizeBytes?: number;
  compressionRatioPct?: number;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  pinnedProducts: PinnedProductItem[];
  comments: VideoComment[];
  createdAt: string;
}

export interface VideoCompressionResult {
  originalFile: File;
  originalSizeMb: number;
  compressedSizeMb: number;
  savedPercent: number;
  duration: number;
  resolution: { width: number; height: number };
  videoUrl: string;
  thumbnailUrl: string;
}

