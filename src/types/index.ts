export interface Store {
  id: string;
  name: string;
  logo: string;
  banner?: string;
  badge?: 'official' | 'preferred' | 'verified';
  isMall?: boolean;
  isVatRegistered?: boolean;
  taxId?: string;
  taxCompanyName?: string;
  taxBranchCode?: string;
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

export type ComplianceType = 'fda_cosmetics' | 'fda_food' | 'tisi_standard' | 'import_license' | 'halal' | 'organic' | 'customs_co';

export interface ProductCompliance {
  fdaNumber?: string;          // เลขที่จดแจ้ง อย. (เช่น 10-1-6200012345 หรือ 11-1-02544-1-0001)
  tisiNumber?: string;         // เลขที่ มอก. (เช่น มอก. 1195-2553)
  countryOfOrigin?: string;    // ประเทศผู้ผลิต (เช่น Thailand, Japan, South Korea, China, USA, Germany)
  certType?: ComplianceType;   // ประเภทใบรับรองหลัก
  certDocUrl?: string;         // URL เอกสาร/ภาพใบรับรอง
  halalNumber?: string;        // เลขฮาลาล (ถ้ามี)
  verificationStatus: 'verified' | 'pending' | 'unverified' | 'rejected';
  verifiedAt?: string;
  rejectionReason?: string;
  aiConfidenceScore?: number;  // คะแนนความเชื่อมั่นจาก AI (0-100%)
  officialStatus?: 'ACTIVE' | 'EXPIRED' | 'REVOKED'; // สถานะจากฐานข้อมูล อย./มอก.
  officialName?: string;       // ชื่อผลิตภัณฑ์ทางการค้าที่จดแจ้งไว้
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
  badge?: 'new' | 'sale' | 'hot' | 'limited' | 'mall';
  isMall?: boolean;
  isVatRegistered?: boolean;
  compliance?: ProductCompliance;
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

export type TaxDocType = 'TAX_INVOICE' | 'RECEIPT' | 'CREDIT_NOTE';

export interface TaxDocument {
  id: string;
  docNumber: string;
  docType: TaxDocType;
  orderId: string;
  storeId?: string;
  buyerName: string;
  buyerTaxId?: string;
  buyerBranch?: string;
  buyerAddress?: string;
  buyerEmail?: string;
  totalAmount: number;
  netAmount: number;
  vatAmount: number;
  emailSent?: boolean;
  status: 'ISSUED' | 'CANCELLED';
  createdAt: string;
  pdfUrl?: string;
  xmlUrl?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
}

export interface StoreTaxProfile {
  storeId: string;
  isVatRegistered: boolean;
  taxId: string;
  taxCompanyName: string;
  taxBranchCode: string;
  taxAddress: string;
  eTaxAutoEmail: boolean;
  eTaxProvider?: string;
}

export interface TaxInvoiceRequest {
  buyerType: 'individual' | 'corporate';
  taxId: string;
  nameOrCompany: string;
  branchCode: string;
  address: string;
  email: string;
}

// ── Trust, Moderation & Anti-Fraud Protection ──
export type UserStatusType = 'ACTIVE' | 'WARNING' | 'COD_RESTRICTED' | 'SUSPENDED' | 'BANNED';
export type StoreStatusType = 'ACTIVE' | 'WARNING' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED';

export interface ModeratedUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: UserStatusType;
  trustScore: number;
  codSuccessRate: number;
  codRejectedCount: number;
  fraudRefundCount: number;
  suspensionReason?: string | null;
  createdAt: string;
}

export interface ModeratedStore {
  id: string;
  name: string;
  status: StoreStatusType;
  healthScore: number;
  penaltyPoints: number;
  penaltyReason?: string | null;
  isLiveRestricted: boolean;
  isSearchRestricted: boolean;
  rating: number;
  lateShipmentRate: number;
  cancellationRate: number;
}

export interface ViolationReport {
  id: string;
  reporterName: string;
  reporterType: 'BUYER' | 'SELLER' | 'SYSTEM';
  reportedName: string;
  reportedType: 'BUYER' | 'STORE';
  orderId?: string;
  type: 'COD_REJECTED' | 'FAKE_ORDER' | 'REFUND_ABUSE' | 'FAKE_PRODUCT' | 'MISLEADING_SPECS' | 'SCAM_OFFPLATFORM' | 'HARASSMENT' | 'NO_FDA_TISI' | 'REFUND_DENIED';
  description: string;
  evidenceUrl?: string;
  requestRefund?: boolean;
  status: 'PENDING' | 'INVESTIGATING' | 'ACTION_TAKEN' | 'DISMISSED';
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}


