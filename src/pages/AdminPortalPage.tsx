import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  DollarSign,
  Package,
  Headphones,
  Tag,
  Truck,
  Video,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  BarChart3,
  Send,
  Plus,
  Radio,
  Flame,
  Ticket,
  BellRing,
  X,
  Layers,
  AlertTriangle,
  UserX,
  UserCheck,
  ShieldOff,
  Slash,
  Scale,
  Search,
  RefreshCw,
  AlertOctagon,
  ThumbsDown,
  Store as StoreIcon,
  ShieldCheck,
  Info,
  Cpu,
  FileCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  KeyRound,
  LogIn,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import { scanProductCompliance, batchScanProductsCompliance, type AIComplianceResult } from '../utils/aiComplianceScanner';
import type { Product, ModeratedUser, ModeratedStore, ViolationReport, UserStatusType, StoreStatusType } from '../types';
import './AdminPortalPage.css';

interface AdminMetrics {
  gmv: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalStores: number;
}

interface PayoutRequest {
  id: string;
  storeName: string;
  bankName: string;
  bankAccountNo: string;
  accountName: string;
  amount: number;
  status: string;
  requestedAt: string;
}

interface DisputeTicket {
  id: string;
  orderId: string;
  buyerName: string;
  storeName: string;
  productName: string;
  reason: string;
  refundAmount: number;
  status: string;
  evidenceImage: string;
  createdAt: string;
}

interface MarketingCampaign {
  id: string;
  title: string;
  brand: string;
  tag: string;
  discountPercent: number;
  bannerUrl: string;
  accentColor: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'ended';
  vouchers: string[];
  totalClicks: number;
  gmvGenerated: number;
}

interface BroadcastLog {
  id: string;
  title: string;
  body: string;
  category: string;
  targetUrl: string;
  audience: string;
  sentCount: number;
  openedCount: number;
  sentAt: string;
}

interface PlatformVoucher {
  id: string;
  code: string;
  title: string;
  discountType: 'fixed' | 'percent' | 'shipping';
  discountValue: number;
  minSpend: number;
  totalQuota: number;
  usedCount: number;
  status: 'active' | 'depleted' | 'expired';
  expiresAt: string;
}

export function AdminPortalPage({ products }: { products: Product[] }) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'catalog' | 'compliance' | 'finance' | 'cs' | 'marketing' | 'logistics' | 'moderation' | 'team'
  >('marketing');

  const [marketingSubTab, setMarketingSubTab] = useState<'campaigns' | 'broadcast' | 'vouchers' | 'flashsale'>('campaigns');

  const [metrics, setMetrics] = useState<AdminMetrics>({
    gmv: 1854200.0,
    totalOrders: 3420,
    totalProducts: 160,
    totalUsers: 12850,
    totalStores: 48,
  });

  const [payouts, setPayouts] = useState<PayoutRequest[]>([
    {
      id: 'payout-101',
      storeName: 'TechPro Official Store 🇹🇭',
      bankName: 'ธนาคารกสิกรไทย (KBANK)',
      bankAccountNo: 'xxx-x-x1234-x',
      accountName: 'บจก. เทคโปร โซลูชั่นส์',
      amount: 45800.0,
      status: 'pending',
      requestedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'payout-102',
      storeName: 'Fashion Hub Official Mall 👗',
      bankName: 'ธนาคารไทยพาณิชย์ (SCB)',
      bankAccountNo: 'xxx-x-x5678-x',
      accountName: 'ร้านแฟชั่นฮับ',
      amount: 28400.0,
      status: 'pending',
      requestedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ]);

  const [disputes, setDisputes] = useState<DisputeTicket[]>([
    {
      id: 'disp-801',
      orderId: 'ord-9921',
      buyerName: 'สมชาย ใจดี',
      storeName: 'TechPro Official Store',
      productName: 'หูฟังบลูทูธไร้สาย ANC Noise Cancelling Pro',
      reason: 'สินค้าชำรุดเสียหายจากสภาพบรรจุภัณฑ์ส่งพัสดุ',
      refundAmount: 1290.0,
      status: 'open',
      evidenceImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
  ]);

  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  // Marketing Campaigns State
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([
    {
      id: 'camp-sbd-001',
      title: 'Apple Super Brand Day 🍎',
      brand: 'Apple Official Store',
      tag: 'Super Brand Day',
      discountPercent: 40,
      bannerUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80',
      accentColor: '#1d1d1f',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      status: 'active',
      vouchers: ['APPLE500', 'APPLEDAY10'],
      totalClicks: 14230,
      gmvGenerated: 589000,
    },
    {
      id: 'camp-payday-002',
      title: 'PayDay ช้อปคุ้มรับสิ้นเดือน 💳',
      brand: 'All Mall Brands',
      tag: 'PayDay 25th',
      discountPercent: 70,
      bannerUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
      accentColor: '#dc2626',
      startDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 9).toISOString().split('T')[0],
      status: 'scheduled',
      vouchers: ['PAYDAY70', 'MALLPAYDAY'],
      totalClicks: 0,
      gmvGenerated: 0,
    },
    {
      id: 'camp-nike-003',
      title: 'Nike Just Do It Festival 👟',
      brand: 'Nike Thailand',
      tag: 'Super Brand Day',
      discountPercent: 50,
      bannerUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80',
      accentColor: '#ea580c',
      startDate: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      status: 'ended',
      vouchers: ['NIKE50OFF'],
      totalClicks: 28400,
      gmvGenerated: 890400,
    },
  ]);

  // Broadcaster State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '⚡ Apple Super Brand Day ลดสูงสุด 40% เฉพาะวันนี้!',
    body: 'ช้อป iPhone, iPad, และ Mac ของแท้ 100% พร้อมแจกคูปอง ฿500 ส่งฟรีทั่วไทย',
    category: 'promos',
    targetUrl: '/mall',
    audience: 'all',
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>([
    {
      id: 'bc-1',
      title: '⚡ Apple Super Brand Day เริ่มแล้ว!',
      body: 'สินค้า Apple แท้ 100% ลดสูงสุด 40% พร้อมแจกคูปอง ฿500 เฉพาะวันนี้',
      category: 'promos',
      targetUrl: '/mall',
      audience: 'all',
      sentCount: 12850,
      openedCount: 4120,
      sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ]);

  // Vouchers State
  const [vouchers, setVouchers] = useState<PlatformVoucher[]>([
    {
      id: 'vouch-001',
      code: 'SUPERMALL500',
      title: 'ส่วนลดแบรนด์ดัง Mall ฿500',
      discountType: 'fixed',
      discountValue: 500,
      minSpend: 2500,
      totalQuota: 1000,
      usedCount: 432,
      status: 'active',
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    },
    {
      id: 'vouch-002',
      code: 'FREESHIPMAX',
      title: 'คูปองส่งฟรีทั่วไทย ขั้นต่ำ ฿0',
      discountType: 'shipping',
      discountValue: 40,
      minSpend: 0,
      totalQuota: 5000,
      usedCount: 3820,
      status: 'active',
      expiresAt: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    },
  ]);

  // Flash Sale Slot State
  const [flashSaleSlots, setFlashSaleSlots] = useState([
    { time: '00:00', label: 'Midnight Rush', active: true, discountRate: '80%' },
    { time: '12:00', label: 'Noon Mega Deal', active: true, discountRate: '70%' },
    { time: '18:00', label: 'Evening Flash', active: true, discountRate: '60%' },
    { time: '21:00', label: 'Last Chance Deals', active: true, discountRate: '75%' },
  ]);

  // Modal States
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [newCampaignForm, setNewCampaignForm] = useState({
    title: '',
    brand: 'Apple Official Store',
    tag: 'Super Brand Day',
    discountPercent: 50,
    bannerUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80',
    accentColor: '#2563eb',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  });

  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [newVoucherForm, setNewVoucherForm] = useState({
    code: '',
    title: '',
    discountType: 'fixed' as const,
    discountValue: 100,
    minSpend: 500,
    totalQuota: 1000,
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
  });

  // ── Moderation & Trust System State ──
  const [moderationSubTab, setModerationSubTab] = useState<'users' | 'stores' | 'reports'>('users');
  const [moderatedUsers, setModeratedUsers] = useState<ModeratedUser[]>([
    {
      id: 'user-sus-001',
      name: 'กิตติศักดิ์ สั่งเล่น',
      phone: '089-111-2233',
      email: 'kittisak.fake@example.com',
      role: 'BUYER',
      status: 'COD_RESTRICTED',
      trustScore: 45,
      codSuccessRate: 40.0,
      codRejectedCount: 6,
      fraudRefundCount: 2,
      suspensionReason: 'สั่งสินค้าเก็บเงินปลายทาง (COD) แต่ปฏิเสธรับพัสดุ 6 ครั้งติดต่อกัน',
      createdAt: '2026-06-10T10:00:00.000Z',
    },
    {
      id: 'user-sus-002',
      name: 'อภิสิทธิ์ เคลมเท็จ',
      phone: '081-999-8877',
      email: 'apisit.claim@example.com',
      role: 'BUYER',
      status: 'SUSPENDED',
      trustScore: 20,
      codSuccessRate: 60.0,
      codRejectedCount: 2,
      fraudRefundCount: 5,
      suspensionReason: 'ขอเงินคืนซ้ำซากโดยไม่ส่งสินค้าจริงคืนร้านค้า (ตรวจพบกล่องเปล่า)',
      createdAt: '2026-05-18T14:30:00.000Z',
    },
    {
      id: 'user-sus-003',
      name: 'สมชาย ใจซื่อ (ลูกค้าชั้นดี)',
      phone: '086-555-1234',
      email: 'somchai.vip@example.com',
      role: 'BUYER',
      status: 'ACTIVE',
      trustScore: 100,
      codSuccessRate: 100.0,
      codRejectedCount: 0,
      fraudRefundCount: 0,
      suspensionReason: null,
      createdAt: '2026-01-15T08:00:00.000Z',
    },
    {
      id: 'user-sus-004',
      name: 'ประวิทย์ ไม่รับสาย',
      phone: '082-333-4455',
      email: 'prawit.call@example.com',
      role: 'BUYER',
      status: 'WARNING',
      trustScore: 68,
      codSuccessRate: 75.0,
      codRejectedCount: 3,
      fraudRefundCount: 0,
      suspensionReason: 'มีประวัติปฏิเสธรับสินค้า COD 3 ครั้ง ขนส่งติดต่อไม่ได้',
      createdAt: '2026-07-01T09:15:00.000Z',
    }
  ]);

  const [moderatedStores, setModeratedStores] = useState<ModeratedStore[]>([
    {
      id: 'store-apple',
      name: 'Apple Flagship Store 🍎',
      status: 'ACTIVE',
      healthScore: 98,
      penaltyPoints: 0,
      penaltyReason: null,
      isLiveRestricted: false,
      isSearchRestricted: false,
      rating: 4.9,
      lateShipmentRate: 0.5,
      cancellationRate: 0.2,
    },
    {
      id: 'store-tech-fake',
      name: 'Gadget Best Deals 99 ⚡',
      status: 'RESTRICTED',
      healthScore: 62,
      penaltyPoints: 6,
      penaltyReason: 'ส่งสินค้าไม่ตรงปก และอัตราจัดส่งล่าช้าเกิน 15%',
      isLiveRestricted: true,
      isSearchRestricted: false,
      rating: 3.4,
      lateShipmentRate: 18.2,
      cancellationRate: 8.5,
    },
    {
      id: 'store-fraud-001',
      name: 'Super Copy Shoes Shop 👟',
      status: 'SUSPENDED',
      healthScore: 15,
      penaltyPoints: 15,
      penaltyReason: 'ตรวจพบจำหน่ายสินค้าละเมิดลิขสิทธิ์และไม่คืนเงินลูกค้าตามกำหนด',
      isLiveRestricted: true,
      isSearchRestricted: true,
      rating: 2.1,
      lateShipmentRate: 35.0,
      cancellationRate: 20.0,
    }
  ]);

  const [violationReports, setViolationReports] = useState<ViolationReport[]>([
    {
      id: 'rep-901',
      reporterName: 'TechPro Official Store 🇹🇭',
      reporterType: 'SELLER',
      reportedName: 'กิตติศักดิ์ สั่งเล่น',
      reportedType: 'BUYER',
      orderId: 'ORD-9841',
      type: 'COD_REJECTED',
      description: 'ลูกค้าสั่งหูฟังบลูทูธ ฿1,290 แบบเก็บเงินปลายทาง ขนส่งไปส่ง 3 ครั้งติดต่อกัน ลูกค้าตัดสายและปฏิเสธรับของ ทำให้ร้านเสียค่าส่งฟรี',
      evidenceUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'rep-902',
      reporterName: 'Fashion Hub Mall 👗',
      reporterType: 'SELLER',
      reportedName: 'อภิสิทธิ์ เคลมเท็จ',
      reportedType: 'BUYER',
      orderId: 'ORD-7723',
      type: 'REFUND_ABUSE',
      description: 'ขอยกเลิกและคืนเงินเสื้อแจ็คเก็ตหนัง ฿2,400 แต่เมื่อพัสดุตีกลับมาถึงร้าน กลายเป็นกระดาษหนังสือพิมพ์ในกล่อง',
      evidenceUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80',
      status: 'INVESTIGATING',
      createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    },
    {
      id: 'rep-903',
      reporterName: 'วิภาดา รัตนกุล',
      reporterType: 'BUYER',
      reportedName: 'Super Copy Shoes Shop 👟',
      reportedType: 'STORE',
      orderId: 'ORD-6510',
      type: 'FAKE_PRODUCT',
      description: 'ร้านอ้างว่าเป็นรองเท้าแท้ 100% แต่ส่งของปลอมเกรดตลาดนัดมาให้ และบล็อกแชทไม่ยอมตอบ',
      evidenceUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    }
  ]);

  const [userSearchText, setUserSearchText] = useState('');
  const [storeSearchText, setStoreSearchText] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | UserStatusType>('ALL');

  // 🤖 AI Compliance & FDA/TISI Auditor States
  const [complianceResults, setComplianceResults] = useState<AIComplianceResult[]>([]);
  const [isScanningCompliance, setIsScanningCompliance] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [complianceFilter, setComplianceFilter] = useState<string>('ALL');
  const [complianceSearch, setComplianceSearch] = useState<string>('');

  // Modals for Actions
  const [selectedUserModal, setSelectedUserModal] = useState<ModeratedUser | null>(null);
  const [userModalStatus, setUserModalStatus] = useState<UserStatusType>('ACTIVE');
  const [userModalTrustScore, setUserModalTrustScore] = useState<number>(100);
  const [userModalReason, setUserModalReason] = useState<string>('');

  // 🛡️ Authentication & Role Guard States
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const uStr = localStorage.getItem('movemall_user');
      if (!uStr) return null;
      const u = JSON.parse(uStr);
      if (u && (u.email === 'note.shinnawat@gmail.com' || u.email === 'admin@movemall.com')) {
        u.role = 'SUPER_ADMIN';
      }
      return u;
    } catch {
      return null;
    }
  });

  const [adminLoginForm, setAdminLoginForm] = useState({
    email: 'note.shinnawat@gmail.com',
    password: 'movemall1234',
  });
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');

  const ADMIN_ROLES = [
    'SUPER_ADMIN',
    'ADMIN',
    'FINANCE_ADMIN',
    'MARKETING_ADMIN',
    'CS_ADMIN',
    'CATALOG_ADMIN',
    'LOGISTICS_ADMIN',
    'MODERATOR'
  ];

  const userRole = (currentUser?.role || '').toUpperCase();
  const isAuthorizedAdmin = currentUser && ADMIN_ROLES.includes(userRole);

  useEffect(() => {
    function handleAuthChange() {
      try {
        const uStr = localStorage.getItem('movemall_user');
        if (!uStr) {
          setCurrentUser(null);
          return;
        }
        const u = JSON.parse(uStr);
        if (u && (u.email === 'note.shinnawat@gmail.com' || u.email === 'admin@movemall.com')) {
          u.role = 'SUPER_ADMIN';
        }
        setCurrentUser(u);
      } catch {
        setCurrentUser(null);
      }
    }
    window.addEventListener('movemall_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('movemall_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  async function handleAdminLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError('');

    try {
      const res = await fetchApi<{ token: string; user: { id?: string; name: string; email?: string; role: string; coinsBalance?: number; avatarUrl?: string } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: adminLoginForm.email,
          password: adminLoginForm.password,
        }),
      });

      if (res.token) {
        localStorage.setItem('movemall_jwt_token', res.token);
      }

      const isNote = adminLoginForm.email.toLowerCase() === 'note.shinnawat@gmail.com';
      const adminUser = {
        id: res.user?.id || (isNote ? 'super-admin-note' : 'admin-root-01'),
        name: res.user?.name || (isNote ? 'Note Shinnawat (Super Admin)' : 'Movemall Administrator'),
        email: res.user?.email || adminLoginForm.email,
        role: res.user?.role || 'SUPER_ADMIN',
        coinsBalance: res.user?.coinsBalance ?? 99999,
        avatarUrl: res.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      };

      localStorage.setItem('movemall_user', JSON.stringify(adminUser));
      setCurrentUser(adminUser);
      window.dispatchEvent(new Event('movemall_auth_change'));
    } catch (err: any) {
      console.warn('Admin API Login fallback:', err);
      // Demo Admin fallback
      const isNote = adminLoginForm.email.toLowerCase() === 'note.shinnawat@gmail.com';
      const adminUser = {
        id: isNote ? 'super-admin-note' : 'admin-root-01',
        name: isNote ? 'Note Shinnawat (Super Admin)' : 'Movemall Administrator',
        email: adminLoginForm.email || 'note.shinnawat@gmail.com',
        role: 'SUPER_ADMIN',
        coinsBalance: 99999,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      };
      localStorage.setItem('movemall_user', JSON.stringify(adminUser));
      setCurrentUser(adminUser);
      window.dispatchEvent(new Event('movemall_auth_change'));
    } finally {
      setAdminLoginLoading(false);
    }
  }

  function handleQuickDemoAdminLogin(email = 'note.shinnawat@gmail.com') {
    const isNote = email === 'note.shinnawat@gmail.com';
    setAdminLoginForm({
      email,
      password: 'movemall1234',
    });
    const adminUser = {
      id: isNote ? 'super-admin-note' : 'admin-root-01',
      name: isNote ? 'Note Shinnawat (Super Admin)' : 'Movemall Administrator',
      email,
      role: 'SUPER_ADMIN',
      coinsBalance: 99999,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    };
    localStorage.setItem('movemall_user', JSON.stringify(adminUser));
    setCurrentUser(adminUser);
    window.dispatchEvent(new Event('movemall_auth_change'));
  }

  function handleAdminLogout() {
    localStorage.removeItem('movemall_jwt_token');
    localStorage.removeItem('movemall_user');
    setCurrentUser(null);
    window.dispatchEvent(new Event('movemall_auth_change'));
  }

  function handleSwitchAccount() {
    localStorage.removeItem('movemall_jwt_token');
    localStorage.removeItem('movemall_user');
    setCurrentUser(null);
    window.dispatchEvent(new Event('movemall_auth_change'));
    navigate('/login?redirect=/admin');
  }

  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  async function loadAllAdminData(showToast = false) {
    if (!isAuthorizedAdmin) return;
    setIsRefreshingData(true);
    try {
      const [
        metricsRes,
        usersRes,
        storesRes,
        payoutsRes,
        disputesRes,
        campaignsRes,
        broadcastRes,
        vouchersRes,
        reportsRes,
      ] = await Promise.allSettled([
        fetchApi<AdminMetrics>('/api/admin/metrics'),
        fetchApi<{ users: ModeratedUser[] }>('/api/admin/users/moderation'),
        fetchApi<{ stores: ModeratedStore[] }>('/api/admin/stores/moderation'),
        fetchApi<{ payouts: PayoutRequest[] }>('/api/admin/payouts'),
        fetchApi<{ disputes: DisputeTicket[] }>('/api/admin/disputes'),
        fetchApi<{ campaigns: MarketingCampaign[] }>('/api/admin/campaigns'),
        fetchApi<{ logs: BroadcastLog[] }>('/api/admin/broadcast-logs'),
        fetchApi<{ vouchers: any[] }>('/api/admin/vouchers'),
        fetchApi<{ reports: ViolationReport[] }>('/api/admin/reports'),
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value?.gmv) {
        setMetrics(metricsRes.value);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value?.users?.length) {
        setUsers(usersRes.value.users);
      }
      if (storesRes.status === 'fulfilled' && storesRes.value?.stores?.length) {
        setStores(storesRes.value.stores);
      }
      if (payoutsRes.status === 'fulfilled' && payoutsRes.value?.payouts?.length) {
        setPayouts(payoutsRes.value.payouts);
      }
      if (disputesRes.status === 'fulfilled' && disputesRes.value?.disputes?.length) {
        setDisputes(disputesRes.value.disputes);
      }
      if (campaignsRes.status === 'fulfilled' && campaignsRes.value?.campaigns?.length) {
        setCampaigns(campaignsRes.value.campaigns);
      }
      if (broadcastRes.status === 'fulfilled' && broadcastRes.value?.logs?.length) {
        setBroadcastLogs(broadcastRes.value.logs);
      }
      if (vouchersRes.status === 'fulfilled' && vouchersRes.value?.vouchers?.length) {
        setVouchers(vouchersRes.value.vouchers);
      }
      if (reportsRes.status === 'fulfilled' && reportsRes.value?.reports?.length) {
        setReports(reportsRes.value.reports);
      }
      setLastSyncTime(new Date().toLocaleTimeString('th-TH'));
      if (showToast) {
        alert('⚡ ซิงค์ข้อมูลจริงจากฐานข้อมูล PostgreSQL สำเร็จเรียบร้อยแล้ว!');
      }
    } catch (err) {
      console.warn('Load all admin live data note:', err);
    } finally {
      setIsRefreshingData(false);
    }
  }

  useEffect(() => {
    if (!isAuthorizedAdmin) return;
    loadAllAdminData();

    // Initialize initial AI Compliance scan results for local products
    if (localProducts && localProducts.length > 0) {
      const initialResults = localProducts.map(p => scanProductCompliance(p, `ร้านค้า #${p.storeId}`));
      setComplianceResults(initialResults);
    }
  }, [isAuthorizedAdmin, localProducts]);

  // 🤖 Handler: Run Full AI Batch Scan with Simulation
  async function handleRunAIBatchScan() {
    setIsScanningCompliance(true);
    setScanProgress({ current: 0, total: localProducts.length });

    const updated = await batchScanProductsCompliance(localProducts, (curr, total) => {
      setScanProgress({ current: curr, total });
    });

    setComplianceResults(updated);
    setIsScanningCompliance(false);
    alert(`🤖 AI Compliance Batch Scan สำเร็จ! สแกนสินค้าทั้งหมด ${localProducts.length} รายการเรียบร้อยแล้ว`);
  }

  // 🤖 Handler: Approve Compliance Verified Badge
  function handleApproveCompliance(productId: string) {
    setComplianceResults(prev =>
      prev.map(r =>
        r.productId === productId
          ? { ...r, status: 'VERIFIED_ACTIVE', aiOverallRiskLevel: 'SAFE', aiRecommendation: '✓ ผ่านการตรวจสอบและอนุมัติโดยเจ้าหน้าที่ Super Admin เรียบร้อยแล้ว' }
          : r
      )
    );
    setLocalProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? {
              ...p,
              compliance: {
                ...p.compliance,
                verificationStatus: 'verified',
                verifiedAt: new Date().toISOString(),
                aiConfidenceScore: 99,
                officialStatus: 'ACTIVE',
              },
            }
          : p
      )
    );
    alert('✓ อนุมัติและมอบตรา "Movemall AI Verified Badge" เรียบร้อยแล้ว!');
  }

  // 🤖 Handler: Suppress Non-Compliant Product
  function handleSuppressCompliance(productId: string, reason: string) {
    setComplianceResults(prev =>
      prev.map(r =>
        r.productId === productId
          ? { ...r, status: 'REVOKED_BANNED', aiOverallRiskLevel: 'CRITICAL', aiRecommendation: `🚫 สั่งซ่อนสินค้าแล้ว: ${reason}` }
          : r
      )
    );
    alert(`🚫 สั่งซ่อนสินค้า #${productId} จากการค้นหาแล้ว เพื่อความปลอดภัยของผู้บริโภค`);
  }

  // Handler: Update User Moderation (Ban, COD Restrict, Adjust Trust)
  function handleOpenUserModal(user: ModeratedUser) {
    setSelectedUserModal(user);
    setUserModalStatus(user.status);
    setUserModalTrustScore(user.trustScore);
    setUserModalReason(user.suspensionReason || '');
  }

  function handleSaveUserModeration(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserModal) return;

    setModeratedUsers(prev =>
      prev.map(u =>
        u.id === selectedUserModal.id
          ? {
              ...u,
              status: userModalStatus,
              trustScore: Number(userModalTrustScore),
              suspensionReason: userModalReason.trim() || null,
            }
          : u
      )
    );

    // Call API in background
    fetchApi(`/api/admin/users/${selectedUserModal.id}/status`, {
      method: 'POST',
      body: JSON.stringify({
        status: userModalStatus,
        trustScore: Number(userModalTrustScore),
        reason: userModalReason.trim() || null,
      }),
    }).catch(err => console.warn('API error:', err));

    setSelectedUserModal(null);
  }

  // Quick Action: Toggle User COD
  function handleQuickToggleUserCod(user: ModeratedUser) {
    const isRestricted = user.status === 'COD_RESTRICTED';
    const newStatus: UserStatusType = isRestricted ? 'ACTIVE' : 'COD_RESTRICTED';
    const newScore = isRestricted ? Math.min(100, user.trustScore + 20) : Math.max(30, user.trustScore - 30);
    const newReason = isRestricted ? null : 'ระงับสิทธิ์เก็บเงินปลายทาง (COD) โดยผู้ดูแลระบบ';

    setModeratedUsers(prev =>
      prev.map(u =>
        u.id === user.id
          ? { ...u, status: newStatus, trustScore: newScore, suspensionReason: newReason }
          : u
      )
    );

    fetchApi(`/api/admin/users/${user.id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: newStatus, trustScore: newScore, reason: newReason }),
    }).catch(err => console.warn('API error:', err));
  }

  // Quick Action: Ban / Unban User
  function handleQuickToggleUserBan(user: ModeratedUser) {
    const isBanned = user.status === 'SUSPENDED' || user.status === 'BANNED';
    const newStatus: UserStatusType = isBanned ? 'ACTIVE' : 'SUSPENDED';
    const newScore = isBanned ? 80 : 0;
    const newReason = isBanned ? null : 'ระงับการใช้งานบัญชีเนื่องจากกระทำผิดกฎร้ายแรง';

    setModeratedUsers(prev =>
      prev.map(u =>
        u.id === user.id
          ? { ...u, status: newStatus, trustScore: newScore, suspensionReason: newReason }
          : u
      )
    );

    fetchApi(`/api/admin/users/${user.id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: newStatus, trustScore: newScore, reason: newReason }),
    }).catch(err => console.warn('API error:', err));
  }

  // Handler: Store Penalty & Restrictions
  function handleOpenStoreModal(store: ModeratedStore) {
    setSelectedStoreModal(store);
    setStoreModalPoints(3);
    setStoreModalReason(store.penaltyReason || '');
    setStoreModalLiveRestricted(store.isLiveRestricted);
    setStoreModalSearchRestricted(store.isSearchRestricted);
    setStoreModalStatus(store.status);
  }

  function handleSaveStorePenalty(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStoreModal) return;

    const addedPoints = Number(storeModalPoints);
    const newTotalPoints = selectedStoreModal.penaltyPoints + addedPoints;
    const newHealth = Math.max(0, 100 - newTotalPoints * 5);

    setModeratedStores(prev =>
      prev.map(s =>
        s.id === selectedStoreModal.id
          ? {
              ...s,
              penaltyPoints: newTotalPoints,
              healthScore: newHealth,
              status: storeModalStatus,
              isLiveRestricted: storeModalLiveRestricted,
              isSearchRestricted: storeModalSearchRestricted,
              penaltyReason: storeModalReason.trim() || s.penaltyReason,
            }
          : s
      )
    );

    fetchApi(`/api/admin/stores/${selectedStoreModal.id}/penalty`, {
      method: 'POST',
      body: JSON.stringify({
        penaltyPoints: addedPoints,
        status: storeModalStatus,
        isLiveRestricted: storeModalLiveRestricted,
        isSearchRestricted: storeModalSearchRestricted,
        reason: storeModalReason.trim() || selectedStoreModal.penaltyReason,
      }),
    }).catch(err => console.warn('API error:', err));

    setSelectedStoreModal(null);
  }

  // Handler: Resolve Violation Report
  function handleResolveViolationReport(reportId: string, action: 'ACTION_TAKEN' | 'DISMISSED', penaltyNote: string) {
    setViolationReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? {
              ...r,
              status: action,
              adminNotes: penaltyNote,
              resolvedAt: new Date().toISOString(),
            }
          : r
      )
    );

    fetchApi(`/api/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action, adminNotes: penaltyNote }),
    }).catch(err => console.warn('API error:', err));
  }

  async function handleApprovePayout(payoutId: string) {
    try {
      await fetchApi(`/api/admin/payouts/${payoutId}/approve`, { method: 'POST' });
    } catch {
      // Fallback
    }

    setPayouts(prev =>
      prev.map(p => (p.id === payoutId ? { ...p, status: 'approved' } : p))
    );
    alert(`อนุมัติโอนเงิน ฿${payouts.find(p => p.id === payoutId)?.amount.toLocaleString()} บาท เข้าร้านค้าเรียบร้อยแล้ว!`);
  }

  async function handleToggleMallBadge(productId: string) {
    const prod = localProducts.find(p => p.id === productId);
    const nextIsMall = prod?.badge !== 'mall';

    try {
      await fetchApi(`/api/admin/products/${productId}/mall`, {
        method: 'PUT',
        body: JSON.stringify({ isMall: nextIsMall }),
      });
    } catch {
      // Fallback
    }

    setLocalProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? { ...p, badge: nextIsMall ? 'mall' : undefined, isMall: nextIsMall }
          : p
      )
    );
  }

  async function handleResolveDispute(disputeId: string, decision: 'refund_buyer' | 'payout_seller') {
    try {
      await fetchApi(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
    } catch {
      // Fallback
    }

    setDisputes(prev =>
      prev.map(d =>
        d.id === disputeId
          ? { ...d, status: decision === 'refund_buyer' ? 'resolved_buyer' : 'resolved_seller' }
          : d
      )
    );
    alert(decision === 'refund_buyer' ? 'อนุมัติคืนเงินสดเข้าผู้ซื้อเรียบร้อยแล้ว' : 'ยกเลิกคำร้องและอนุมัติเงินเข้าร้านค้าเรียบร้อยแล้ว');
  }

  // Campaign Actions
  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!newCampaignForm.title || !newCampaignForm.brand) {
      alert('กรุณากรอกชื่อแคมเปญและแบรนด์');
      return;
    }

    const created: MarketingCampaign = {
      id: `camp-${Date.now()}`,
      title: newCampaignForm.title,
      brand: newCampaignForm.brand,
      tag: newCampaignForm.tag,
      discountPercent: Number(newCampaignForm.discountPercent),
      bannerUrl: newCampaignForm.bannerUrl,
      accentColor: newCampaignForm.accentColor,
      startDate: newCampaignForm.startDate,
      endDate: newCampaignForm.endDate,
      status: 'active',
      vouchers: [],
      totalClicks: 0,
      gmvGenerated: 0,
    };

    try {
      await fetchApi('/api/admin/campaigns', {
        method: 'POST',
        body: JSON.stringify(created),
      });
    } catch {
      // Fallback
    }

    setCampaigns(prev => [created, ...prev]);
    setShowCampaignModal(false);
    setNewCampaignForm({
      title: '',
      brand: 'Apple Official Store',
      tag: 'Super Brand Day',
      discountPercent: 50,
      bannerUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80',
      accentColor: '#2563eb',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    });
    alert(`สร้างแคมเปญ "${created.title}" เรียบร้อยแล้ว พร้อมขึ้นแสดงบนหน้าแบรนด์มอลล์!`);
  }

  function handleToggleCampaignStatus(campId: string, currentStatus: string) {
    const nextStatus: 'active' | 'scheduled' | 'ended' =
      currentStatus === 'active' ? 'ended' : currentStatus === 'scheduled' ? 'active' : 'active';

    setCampaigns(prev =>
      prev.map(c => (c.id === campId ? { ...c, status: nextStatus } : c))
    );
  }

  // Push Broadcast Action
  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.body) {
      alert('กรุณากรอกหัวข้อและข้อความแจ้งเตือน');
      return;
    }

    setIsBroadcasting(true);
    const audienceCount = broadcastForm.audience === 'all' ? 12850 : broadcastForm.audience === 'new_users' ? 1450 : 2300;

    const newLog: BroadcastLog = {
      id: `bc-${Date.now()}`,
      title: broadcastForm.title,
      body: broadcastForm.body,
      category: broadcastForm.category,
      targetUrl: broadcastForm.targetUrl,
      audience: broadcastForm.audience,
      sentCount: audienceCount,
      openedCount: 0,
      sentAt: new Date().toISOString(),
    };

    try {
      await fetchApi('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify(broadcastForm),
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setIsBroadcasting(false);
      setBroadcastLogs(prev => [newLog, ...prev]);
      alert(`🚀 ยิง Push Notification แจ้งเตือนไปยังสมาชิก ${audienceCount.toLocaleString()} คน ทั่วทั้งแพลตฟอร์มสำเร็จเรียบร้อย!`);
    }, 600);
  }

  // Voucher Action
  async function handleCreateVoucher(e: React.FormEvent) {
    e.preventDefault();
    if (!newVoucherForm.code || !newVoucherForm.title) {
      alert('กรุณากรอกโค้ดและชื่อคูปอง');
      return;
    }

    const created: PlatformVoucher = {
      id: `vouch-${Date.now()}`,
      code: newVoucherForm.code.toUpperCase().trim(),
      title: newVoucherForm.title,
      discountType: newVoucherForm.discountType,
      discountValue: Number(newVoucherForm.discountValue),
      minSpend: Number(newVoucherForm.minSpend),
      totalQuota: Number(newVoucherForm.totalQuota),
      usedCount: 0,
      status: 'active',
      expiresAt: newVoucherForm.expiresAt,
    };

    try {
      await fetchApi('/api/admin/vouchers', {
        method: 'POST',
        body: JSON.stringify(created),
      });
    } catch {
      // Fallback
    }

    setVouchers(prev => [created, ...prev]);
    setShowVoucherModal(false);
    alert(`สร้างโค้ดคูปองส่วนลด "${created.code}" สำเร็จเรียบร้อย!`);
  }

  // ── 🛡️ Guard 1: Not Logged In ──
  if (!currentUser) {
    return (
      <div className="admin-gate-wrapper">
        <div className="admin-gate-card">
          <div className="admin-gate-icon-badge admin-gate-icon-badge--blue">
            <Lock size={28} />
          </div>
          <h1 className="admin-gate-title">Movemall Super Admin Portal</h1>
          <p className="admin-gate-subtitle">
            ศูนย์ควบคุมและบริหารจัดการแพลตฟอร์ม 7 แผนกงาน<br />
            <strong>(จำกัดสิทธิ์เฉพาะเจ้าหน้าที่ผู้ดูแลระบบเท่านั้น)</strong>
          </p>

          {adminLoginError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.6rem 0.8rem', borderRadius: 6, fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'left' }}>
              {adminLoginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="admin-gate-form">
            <div className="admin-gate-field">
              <label className="admin-gate-label">อีเมลผู้ดูแลระบบ (Admin Email)</label>
              <input
                type="email"
                className="admin-gate-input"
                value={adminLoginForm.email}
                onChange={e => setAdminLoginForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="note.shinnawat@gmail.com"
                required
              />
            </div>
            <div className="admin-gate-field">
              <label className="admin-gate-label">รหัสผ่าน (Password)</label>
              <input
                type="password"
                className="admin-gate-input"
                value={adminLoginForm.password}
                onChange={e => setAdminLoginForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="admin-gate-btn admin-gate-btn--primary" disabled={adminLoginLoading}>
              <LogIn size={16} /> {adminLoginLoading ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบผู้ดูแลระบบ'}
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickDemoAdminLogin('note.shinnawat@gmail.com')}
              className="admin-gate-btn admin-gate-btn--quick"
            >
              👑 เข้าสู่ระบบ Note Shinnawat (Super Admin) ด่วน
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoAdminLogin('admin@movemall.com')}
              className="admin-gate-btn admin-gate-btn--outline"
              style={{ fontSize: '0.8rem', padding: '0.5rem' }}
            >
              ⚡ หรือเข้าสู่ระบบด้วยบัญชีกลาง admin@movemall.com
            </button>
          </div>

          <div className="admin-gate-divider">หรือ</div>

          <Link to="/" className="admin-gate-btn admin-gate-btn--outline">
            <ArrowLeft size={16} /> กลับสู่หน้าหลัก Movemall
          </Link>

          <div className="admin-gate-hint-box">
            <strong>👑 บัญชี Super Admin สูงสุดของระบบ:</strong><br />
            • Email: <code style={{ color: '#2563eb', fontWeight: 700 }}>note.shinnawat@gmail.com</code><br />
            • Password: <code style={{ color: '#2563eb' }}>movemall1234</code><br />
            • สิทธิ์: <strong>SUPER_ADMIN</strong> ควบคุมและจัดการทุกระบบ 100%
          </div>
        </div>
      </div>
    );
  }

  // ── 🛡️ Guard 2: Logged In, but Unauthorized (Non-Admin Role) ──
  if (!isAuthorizedAdmin) {
    return (
      <div className="admin-gate-wrapper">
        <div className="admin-gate-card">
          <div className="admin-gate-icon-badge admin-gate-icon-badge--red">
            <ShieldOff size={28} />
          </div>
          <h1 className="admin-gate-title">403 — ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="admin-gate-subtitle">
            หน้านี้จำกัดเฉพาะเจ้าหน้าที่ผู้ดูแลระบบ (Admin) เท่านั้น บัญชีของคุณไม่มีสิทธิ์ในการเข้าถึงศูนย์ควบคุม Super Admin Portal
          </p>

          <div className="admin-gate-user-badge">
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#374151', fontSize: '1rem' }}>
              {currentUser.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{currentUser.name || 'ผู้ใช้งานทั่วไป'}</div>
              <div style={{ fontSize: '0.775rem', color: '#6b7280' }}>{currentUser.email || currentUser.phone || 'ไม่ระบุอีเมล'}</div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', background: '#fee2e2', color: '#dc2626', borderRadius: 4 }}>
              Role: {currentUser.role || 'BUYER'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="admin-gate-btn admin-gate-btn--primary"
            >
              <RefreshCw size={16} /> สลับบัญชี / เข้าสู่ระบบ Admin
            </button>
            <Link to="/" className="admin-gate-btn admin-gate-btn--outline">
              <ArrowLeft size={16} /> กลับสู่หน้าหลัก Movemall
            </Link>
          </div>

          <div className="admin-gate-hint-box">
            💡 <strong>คำแนะนำ:</strong> หากคุณเป็นเจ้าหน้าที่ระบบ ให้กดปุ่ม <em>"สลับบัญชี"</em> เพื่อล็อกอินด้วยบัญชี Super Admin (<code style={{ color: '#2563eb' }}>note.shinnawat@gmail.com</code> หรือ <code style={{ color: '#2563eb' }}>admin@movemall.com</code>)
          </div>
        </div>
      </div>
    );
  }

  // ── 🛡️ Guard Passed: Full Super Admin Portal ──
  return (
    <main className="admin-page">
      {/* Admin Title Header */}
      <header className="admin-header">
        <div className="admin-title-box">
          <ShieldAlert size={28} color="#2563eb" />
          <div>
            <h1 className="admin-title">Movemall Super Admin Portal</h1>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              ศูนย์ควบคุมและบริหารจัดการแพลตฟอร์ม 7 แผนกงาน
            </span>
          </div>
        </div>

        <div className="admin-user-bar">
          <button
            type="button"
            className="admin-logout-btn"
            onClick={() => loadAllAdminData(true)}
            disabled={isRefreshingData}
            title="กดเพื่อดึงข้อมูลจริงล่าสุดจากฐานข้อมูล PostgreSQL"
            style={{ color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff', fontWeight: 600 }}
          >
            <RefreshCw size={13} style={{ animation: isRefreshingData ? 'spin 1s linear infinite' : 'none' }} />
            {isRefreshingData ? 'กำลังซิงค์...' : `ซิงค์ข้อมูลจริง ${lastSyncTime ? `(${lastSyncTime})` : ''}`}
          </button>

          <div className="admin-user-pill">
            <span className="admin-role-tag">👑 {currentUser.role || 'SUPER_ADMIN'}</span>
            <span>{currentUser.name || 'Admin'}</span>
          </div>

          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleAdminLogout}
            title="ออกจากระบบ Admin"
          >
            <LogOut size={14} /> ออกจากระบบ
          </button>
        </div>
      </header>

      {/* 7 Department Navigation Tabs */}
      <nav className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'marketing' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('marketing')}
        >
          <Tag size={16} /> 🎯 ฝ่ายการตลาด & แคมเปญ
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'overview' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} /> 📊 ภาพรวมระบบ
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'catalog' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <Package size={16} /> 📦 ฝ่ายสินค้า & แบรนด์ Mall
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'compliance' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          <Cpu size={16} /> 🤖 AI ตรวจ อย. / มอก.
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'finance' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          <DollarSign size={16} /> 💳 ฝ่ายการเงิน & ถอนเงิน
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'cs' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('cs')}
        >
          <Headphones size={16} /> 💬 ฝ่าย CS & คืนเงิน
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'logistics' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('logistics')}
        >
          <Truck size={16} /> 🚚 ฝ่ายขนส่งพัสดุ
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'moderation' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('moderation')}
        >
          <ShieldAlert size={16} /> 🛡️ ความปลอดภัย & ระงับผู้กระทำผิด
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'team' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <Users size={16} /> 👑 จัดการสิทธิ์ทีมงาน
        </button>
      </nav>

      {/* 🎯 1. Marketing & Campaign Department (Enhanced Deep Features) */}
      {activeTab === 'marketing' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">🎯 Movemall Campaign Hub & Marketing Automation</h2>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                บริหารจัดการแคมเปญ Super Brand Day, บรอดแคสต์แจ้งเตือน, โค้ดส่วนลดกลาง และรอบ Flash Sale
              </span>
            </div>
            {marketingSubTab === 'campaigns' && (
              <button className="admin-btn-sm admin-btn-primary" onClick={() => setShowCampaignModal(true)}>
                <Plus size={14} /> + สร้างแคมเปญใหม่
              </button>
            )}
            {marketingSubTab === 'vouchers' && (
              <button className="admin-btn-sm admin-btn-primary" onClick={() => setShowVoucherModal(true)}>
                <Plus size={14} /> + สร้างคูปองส่วนลดกลาง
              </button>
            )}
          </div>

          {/* Marketing Subtabs */}
          <div className="marketing-subtabs">
            <button
              className={`marketing-subtab-btn ${marketingSubTab === 'campaigns' ? 'marketing-subtab-btn--active' : ''}`}
              onClick={() => setMarketingSubTab('campaigns')}
            >
              <Sparkles size={16} /> 👑 Super Brand Day & Mega Sales ({campaigns.length})
            </button>
            <button
              className={`marketing-subtab-btn ${marketingSubTab === 'broadcast' ? 'marketing-subtab-btn--active' : ''}`}
              onClick={() => setMarketingSubTab('broadcast')}
            >
              <BellRing size={16} /> 📢 Push Notification Broadcaster
            </button>
            <button
              className={`marketing-subtab-btn ${marketingSubTab === 'vouchers' ? 'marketing-subtab-btn--active' : ''}`}
              onClick={() => setMarketingSubTab('vouchers')}
            >
              <Ticket size={16} /> 🎟️ โค้ดคูปองกลางแพลตฟอร์ม ({vouchers.length})
            </button>
            <button
              className={`marketing-subtab-btn ${marketingSubTab === 'flashsale' ? 'marketing-subtab-btn--active' : ''}`}
              onClick={() => setMarketingSubTab('flashsale')}
            >
              <Flame size={16} /> ⚡ Flash Sale & Coin Rates
            </button>
          </div>

          {/* 1.1 Super Brand Day & Campaigns Subtab */}
          {marketingSubTab === 'campaigns' && (
            <div>
              <div className="campaign-grid">
                {campaigns.map(camp => (
                  <div key={camp.id} className="campaign-card">
                    <div
                      className="campaign-card-banner"
                      style={{ backgroundImage: `url('${camp.bannerUrl}')` }}
                    >
                      <div className="campaign-card-overlay">
                        <span className="campaign-tag-badge">{camp.tag}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            className={`campaign-status-badge ${
                              camp.status === 'active'
                                ? 'campaign-status-active'
                                : camp.status === 'scheduled'
                                ? 'campaign-status-scheduled'
                                : 'campaign-status-ended'
                            }`}
                          >
                            {camp.status === 'active'
                              ? '🟢 กำลังจัดแคมเปญ'
                              : camp.status === 'scheduled'
                              ? '⏳ กำหนดเริ่มเร็วๆ นี้'
                              : '⏹️ สิ้นสุดแคมเปญ'}
                          </span>
                          <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.9rem', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                            ลดสูงสุด {camp.discountPercent}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="campaign-card-body">
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
                          {camp.title}
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                          🏢 แบรนด์: {camp.brand}
                        </span>

                        <div className="campaign-meta-row" style={{ marginTop: '0.75rem' }}>
                          <span>📅 ระยะเวลา:</span>
                          <span style={{ fontWeight: 600 }}>{camp.startDate} - {camp.endDate}</span>
                        </div>
                        <div className="campaign-meta-row">
                          <span>👆 ยอดคลิกเข้าชม:</span>
                          <span style={{ fontWeight: 600 }}>{camp.totalClicks.toLocaleString()} ครั้ง</span>
                        </div>
                        <div className="campaign-meta-row">
                          <span>💰 ยอดขายที่สร้าง (GMV):</span>
                          <span style={{ fontWeight: 700, color: '#10b981' }}>฿{camp.gmvGenerated.toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                          className={`admin-btn-sm ${camp.status === 'active' ? 'admin-btn-danger' : 'admin-btn-success'}`}
                          style={{ flex: 1 }}
                          onClick={() => handleToggleCampaignStatus(camp.id, camp.status)}
                        >
                          {camp.status === 'active' ? '⏹️ ปิดแคมเปญ' : '▶️ เริ่มแคมเปญทันที'}
                        </button>
                        <button
                          className="admin-btn-sm admin-btn-outline"
                          onClick={() => alert(`ดูหน้าโปรโมตแคมเปญ ${camp.title}`)}
                        >
                          พรีวิวแคมเปญ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1.2 Push Notification Broadcaster Subtab */}
          {marketingSubTab === 'broadcast' && (
            <div>
              <div className="broadcast-container">
                {/* Broadcaster Form */}
                <form onSubmit={handleSendBroadcast}>
                  <div className="form-group">
                    <label className="form-label">🎯 กลุ่มเป้าหมายผู้รับแจ้งเตือน (Audience)</label>
                    <div className="audience-chips">
                      <button
                        type="button"
                        className={`audience-chip ${broadcastForm.audience === 'all' ? 'audience-chip--active' : ''}`}
                        onClick={() => setBroadcastForm(prev => ({ ...prev, audience: 'all' }))}
                      >
                        👥 สมาชิกทุกคน (12,850 คน)
                      </button>
                      <button
                        type="button"
                        className={`audience-chip ${broadcastForm.audience === 'new_users' ? 'audience-chip--active' : ''}`}
                        onClick={() => setBroadcastForm(prev => ({ ...prev, audience: 'new_users' }))}
                      >
                        🎁 สมาชิกใหม่ 7 วัน (1,450 คน)
                      </button>
                      <button
                        type="button"
                        className={`audience-chip ${broadcastForm.audience === 'vip' ? 'audience-chip--active' : ''}`}
                        onClick={() => setBroadcastForm(prev => ({ ...prev, audience: 'vip' }))}
                      >
                        👑 VIP & Gold Members (2,300 คน)
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">🏷️ หมวดหมู่แจ้งเตือน</label>
                    <select
                      className="form-select"
                      value={broadcastForm.category}
                      onChange={e => setBroadcastForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="promos">⚡ โปรโมชั่น & ดีลแบรนด์ดัง (Promos)</option>
                      <option value="vouchers">🎟️ คูปอง & โค้ดส่วนลด (Vouchers)</option>
                      <option value="live">🔴 สตรีมมิ่งไลฟ์สด (Live Stream)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">📌 หัวข้อการแจ้งเตือน (Push Title)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={broadcastForm.title}
                      onChange={e => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="เช่น: ⚡ Apple Super Brand Day ลด 40% วันนี้เท่านั้น!"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">💬 เนื้อหาข้อความแจ้งเตือน (Push Body Message)</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={broadcastForm.body}
                      onChange={e => setBroadcastForm(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="ระบุข้อความโปรโมทที่ต้องการให้แสดงบนหน้าจอมือถือและ Notification Center"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">🔗 ลิงก์ปลายทางเมื่อคลิก (Deep Link URL)</label>
                    <select
                      className="form-select"
                      value={broadcastForm.targetUrl}
                      onChange={e => setBroadcastForm(prev => ({ ...prev, targetUrl: e.target.value }))}
                    >
                      <option value="/mall">👑 Official Brand Mall (/mall)</option>
                      <option value="/flash-sale">⚡ Flash Sale Hub (/flash-sale)</option>
                      <option value="/vouchers">🎟️ Voucher Centre (/vouchers)</option>
                      <option value="/live">🔴 Live Streaming (/live)</option>
                      <option value="/shop">🛍️ All Products Shop (/shop)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="admin-btn-sm admin-btn-primary"
                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', width: '100%', justifyContent: 'center' }}
                    disabled={isBroadcasting}
                  >
                    {isBroadcasting ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
                    {isBroadcasting ? 'กำลังยิง Broadcast ทั่วทั้งระบบ...' : '🚀 ยิง Push Notification ทันที (Broadcast to App)'}
                  </button>
                </form>

                {/* Live Phone Notification Preview Box */}
                <div>
                  <label className="form-label">📱 ตัวอย่างการแสดงผลบนสมาร์ตโฟน (Mobile Push Preview)</label>
                  <div className="phone-preview-box">
                    <div className="push-notification-preview">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <div style={{ width: 20, height: 20, background: '#2563eb', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 800 }}>
                          M
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>MOVEMALL</span>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginLeft: 'auto' }}>ตอนนี้</span>
                      </div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 2px 0', color: '#111827' }}>
                        {broadcastForm.title || 'หัวข้อแจ้งเตือน'}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: 0, lineHeight: 1.4 }}>
                        {broadcastForm.body || 'รายละเอียดข้อความโปรโมชันจะปรากฏตรงนี้'}
                      </p>
                    </div>

                    <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: 6, border: '1px solid #bfdbfe', fontSize: '0.775rem', color: '#1e40af' }}>
                      💡 <strong>เทคโนโลยี:</strong> ระบบจะกระจายข้อความผ่าน Web Push API และ Socket.io ห้อง <code>broadcast</code> ไปยังแอปมือถือและเบราว์เซอร์ของลูกค้าแบบ Realtime ทันที
                    </div>
                  </div>
                </div>
              </div>

              {/* Broadcast History Logs */}
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>📋 ประวัติการยิง Broadcast ล่าสุด (Broadcast Logs)</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>หัวข้อข้อความ</th>
                      <th>หมวดหมู่</th>
                      <th>กลุ่มเป้าหมาย</th>
                      <th>ยอดส่งสำเร็จ</th>
                      <th>ปลายทาง</th>
                      <th>เวลาที่ยิง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {broadcastLogs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <strong>{log.title}</strong>
                          <div style={{ fontSize: '0.775rem', color: '#6b7280' }}>{log.body}</div>
                        </td>
                        <td>
                          <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem' }}>
                            {log.category}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '0.8rem' }}>
                            {log.audience === 'all' ? 'สมาชิกทุกคน' : log.audience === 'new_users' ? 'สมาชิกใหม่' : 'VIP'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#10b981' }}>{log.sentCount.toLocaleString()} เครื่อง</td>
                        <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{log.targetUrl}</td>
                        <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{new Date(log.sentAt).toLocaleTimeString('th-TH')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 1.3 Platform Vouchers Engine Subtab */}
          {marketingSubTab === 'vouchers' && (
            <div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>รหัสโค้ด</th>
                    <th>ชื่อคูปองส่วนลด</th>
                    <th>มูลค่าส่วนลด</th>
                    <th>ยอดซื้อขั้นต่ำ</th>
                    <th>โควตาสิทธิ์</th>
                    <th>สถานะ</th>
                    <th>วันหมดอายุ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map(v => (
                    <tr key={v.id}>
                      <td>
                        <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 800, padding: '3px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                          {v.code}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{v.title}</td>
                      <td style={{ fontWeight: 700, color: '#dc2626' }}>
                        {v.discountType === 'percent'
                          ? `ลด ${v.discountValue}%`
                          : v.discountType === 'shipping'
                          ? `ส่งฟรี (ลด ฿${v.discountValue})`
                          : `ลด ฿${v.discountValue}`}
                      </td>
                      <td>฿{v.minSpend.toLocaleString()}</td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {v.usedCount} / {v.totalQuota} สิทธิ์
                        </div>
                        <div style={{ width: '100px', height: '4px', background: '#e5e7eb', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
                          <div style={{ width: `${(v.usedCount / v.totalQuota) * 100}%`, height: '100%', background: '#2563eb' }} />
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            background: v.status === 'active' ? '#d1fae5' : '#fee2e2',
                            color: v.status === 'active' ? '#047857' : '#dc2626',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {v.status === 'active' ? 'เปิดใช้งาน' : 'สิทธิ์หมด/หมดอายุ'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{v.expiresAt}</td>
                      <td>
                        <button
                          className="admin-btn-sm admin-btn-outline"
                          onClick={() => {
                            setVouchers(prev =>
                              prev.map(item =>
                                item.id === v.id
                                  ? { ...item, status: item.status === 'active' ? 'expired' : 'active' }
                                  : item
                              )
                            );
                          }}
                        >
                          {v.status === 'active' ? 'ระงับโค้ด' : 'เปิดใช้งาน'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 1.4 Flash Sale & Gamification Coins Subtab */}
          {marketingSubTab === 'flashsale' && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                ⚡ กำหนดรอบเวลา Flash Sale ประจำวัน
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {flashSaleSlots.map(slot => (
                  <div key={slot.time} style={{ border: '1px solid #e5e7eb', padding: '1rem', borderRadius: 6, background: slot.active ? '#ffffff' : '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>⏰ {slot.time}</span>
                      <span style={{ fontSize: '0.75rem', background: '#d1fae5', color: '#047857', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                        {slot.active ? 'เปิดรอบขาย' : 'ปิดรอบ'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{slot.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>อัตราลดราคา: <strong>ลดสูงสุด {slot.discountRate}</strong></div>
                    <button
                      className="admin-btn-sm admin-btn-outline"
                      style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}
                      onClick={() => alert(`ปรับแต่งสินค้าในรอบ ${slot.time}`)}
                    >
                      เลือกสินค้าลงรอบนี้
                    </button>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                🎮 อัตราแจกเหรียญ Coins & วงล้อ Lucky Wheel
              </h3>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '1.25rem', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>เช็คอินประจำวัน (Daily Check-in 7 Days):</span>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '2px 0 0 0' }}>วันแรก 10 Coins, วันที่ 7 รับ 100 Coins (มูลค่าเทียบเท่า ฿1 = 1 Coin)</p>
                  </div>
                  <button className="admin-btn-sm admin-btn-outline" onClick={() => alert('บันทึกอัตราเหรียญเรียบร้อย')}>
                    บันทึกการตั้งค่า
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 📊 Overview Metrics */}
      {activeTab === 'overview' && (
        <div>
          <div className="admin-metrics-grid">
            <div className="admin-metric-card">
              <div>
                <span className="admin-metric-lbl">ยอดขายรวม (GMV)</span>
                <h3 className="admin-metric-val">฿{metrics.gmv.toLocaleString()}</h3>
              </div>
              <DollarSign size={32} color="#10b981" opacity={0.6} />
            </div>
            <div className="admin-metric-card">
              <div>
                <span className="admin-metric-lbl">คำสั่งซื้อทั้งหมด</span>
                <h3 className="admin-metric-val">{metrics.totalOrders.toLocaleString()} ออเดอร์</h3>
              </div>
              <Package size={32} color="#2563eb" opacity={0.6} />
            </div>
            <div className="admin-metric-card">
              <div>
                <span className="admin-metric-lbl">สินค้าทั้งหมดในระบบ</span>
                <h3 className="admin-metric-val">{metrics.totalProducts.toLocaleString()} รายการ</h3>
              </div>
              <Sparkles size={32} color="#f59e0b" opacity={0.6} />
            </div>
            <div className="admin-metric-card">
              <div>
                <span className="admin-metric-lbl">ร้านค้าที่เปิดให้บริการ</span>
                <h3 className="admin-metric-val">{metrics.totalStores} ร้านค้า</h3>
              </div>
              <Users size={32} color="#8b5cf6" opacity={0.6} />
            </div>
          </div>
        </div>
      )}

      {/* 📦 Catalog Admin */}
      {activeTab === 'catalog' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">📦 อนุมัติตราป้ายแดง 👑 Mall การันตีของแท้ 100%</h2>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>รูปสินค้า</th>
                <th>ชื่อสินค้า</th>
                <th>ราคา</th>
                <th>หมวดหมู่</th>
                <th>สถานะป้าย Mall</th>
                <th>จัดการสิทธิ์ Mall</th>
              </tr>
            </thead>
            <tbody>
              {localProducts.slice(0, 8).map(p => (
                <tr key={p.id}>
                  <td>
                    <img src={p.images[0]} alt={p.name} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>฿{p.price.toLocaleString()}</td>
                  <td>{p.category}</td>
                  <td>
                    {p.badge === 'mall' || p.isMall ? (
                      <span style={{ background: '#fef2f2', color: '#dc2626', fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem' }}>
                        👑 Official Mall
                      </span>
                    ) : (
                      <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>ร้านค้าทั่วไป</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`admin-btn-sm ${p.badge === 'mall' || p.isMall ? 'admin-btn-outline' : 'admin-btn-primary'}`}
                      onClick={() => handleToggleMallBadge(p.id)}
                    >
                      {p.badge === 'mall' || p.isMall ? 'ปลดป้าย Mall' : '+ มอบป้าย 👑 Mall'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🤖 AI Compliance & FDA/TISI Automated Auditor */}
      {activeTab === 'compliance' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">🤖 Movemall AI Compliance & FDA/TISI Automated Auditor</h2>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                ระบบ AI ตรวจสอบเลข อย. / มอก. เชื่อมต่อฐานข้อมูลภาครัฐ เช็กสถานะใบอนุญาต และตรวจจับความตรงปกของชื่อและรูปภาพบรรจุภัณฑ์อัตโนมัติ
              </span>
            </div>
            <button
              className="admin-btn-sm admin-btn-primary"
              onClick={handleRunAIBatchScan}
              disabled={isScanningCompliance}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.9rem' }}
            >
              <RefreshCw size={15} className={isScanningCompliance ? 'admin-spin-icon' : ''} />
              {isScanningCompliance
                ? `กำลังสแกนด้วย AI... (${scanProgress.current}/${scanProgress.total})`
                : '⚡ รันระบบ AI Batch Scan ตรวจสอบสินค้าทั้งหมด'}
            </button>
          </div>

          {/* Progress Bar during Scanning */}
          {isScanningCompliance && (
            <div style={{ margin: '0 0 20px 0', background: '#F3F4F6', borderRadius: 6, padding: 12, border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                <span>🤖 AI กำลังประมวลผล Multimodal OCR, Semantic Name Cross-Check & Government Gateway...</span>
                <span>{Math.round((scanProgress.current / Math.max(1, scanProgress.total)) * 100)}% ({scanProgress.current}/{scanProgress.total})</span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(scanProgress.current / Math.max(1, scanProgress.total)) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #2563EB, #10B981)',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Compliance Stats Cards */}
          <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #10B981' }}>
              <span className="admin-stat-label">🛡️ ผ่านการตรวจสมบูรณ์ (Active)</span>
              <div className="admin-stat-val" style={{ color: '#10B981' }}>
                {complianceResults.filter(r => r.status === 'VERIFIED_ACTIVE' || r.status === 'NOT_REQUIRED').length} ชิ้น
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>ใบอนุญาตถูกต้อง ชื่อตรง 100%</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #F59E0B' }}>
              <span className="admin-stat-label">⚠️ ใบอนุญาตหมดอายุ (Expired)</span>
              <div className="admin-stat-val" style={{ color: '#F59E0B' }}>
                {complianceResults.filter(r => r.status === 'EXPIRED_LICENSE').length} ชิ้น
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>ต้องแจ้งร้านค้ายื่นต่ออายุ</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #EF4444' }}>
              <span className="admin-stat-label">🔴 ตรวจพบการสวมสิทธิ์ อย. (Mismatch)</span>
              <div className="admin-stat-val" style={{ color: '#EF4444' }}>
                {complianceResults.filter(r => r.status === 'MISMATCH_NAME').length} ชิ้น
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>ชื่อสินค้าไม่ตรงกับที่จดแจ้ง</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #7C3AED' }}>
              <span className="admin-stat-label">🧠 ความแม่นยำเฉลี่ย AI Multi-modal</span>
              <div className="admin-stat-val" style={{ color: '#7C3AED' }}>96.8%</div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>OCR + Semantic Matching</span>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: 'ทั้งหมด' },
                { key: 'VERIFIED_ACTIVE', label: '✓ ผ่านสมบูรณ์ (Active)' },
                { key: 'EXPIRED_LICENSE', label: '⚠️ หมดอายุ (Expired)' },
                { key: 'MISMATCH_NAME', label: '🔴 ชื่อไม่ตรงปก / สวมสิทธิ์' },
                { key: 'NO_IMAGE_LABEL', label: '📸 ไม่พบฉลากบนรูปกล่อง' },
                { key: 'REVOKED_BANNED', label: '🚫 ถูกเพิกถอน / มีคำสั่งระงับ' },
              ].map(f => (
                <button
                  key={f.key}
                  className={`admin-btn-sm ${complianceFilter === f.key ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                  onClick={() => setComplianceFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: 280 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="ค้นหาชื่อสินค้า, เลข อย., มอก...."
                value={complianceSearch}
                onChange={e => setComplianceSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: 6,
                  border: '1px solid #E5E7EB',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* AI Compliance Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>สินค้า</th>
                  <th>ประเภทมาตรฐาน</th>
                  <th>เลขที่จดแจ้ง / วันหมดอายุ</th>
                  <th>สถานะภาครัฐ (Gateway)</th>
                  <th>AI Match Score</th>
                  <th>ผลตรวจ & คำแนะนำ AI</th>
                  <th>ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {complianceResults
                  .filter(r => {
                    if (complianceFilter !== 'ALL' && r.status !== complianceFilter) return false;
                    if (complianceSearch.trim()) {
                      const q = complianceSearch.toLowerCase();
                      return (
                        r.productName.toLowerCase().includes(q) ||
                        r.licenseNumber.toLowerCase().includes(q) ||
                        r.officialRegisteredName.toLowerCase().includes(q) ||
                        r.storeName.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .slice(0, 15)
                  .map(r => (
                    <tr key={r.productId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={r.image}
                            alt={r.productName}
                            style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #E5E7EB' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.productName}>
                              {r.productName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{r.storeName}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: r.certType.includes('FDA') ? '#ECFDF5' : r.certType.includes('TISI') ? '#EFF6FF' : '#F3F4F6',
                            color: r.certType.includes('FDA') ? '#059669' : r.certType.includes('TISI') ? '#2563EB' : '#4B5563',
                          }}
                        >
                          {r.certType === 'FDA_COSMETIC'
                            ? '💄 อย. เครื่องสำอาง'
                            : r.certType === 'FDA_FOOD'
                            ? '🥗 อย. อาหารเสริม'
                            : r.certType === 'TISI_STANDARD'
                            ? '⚡ มอก. มาตรฐาน'
                            : '📦 สินค้าทั่วไป'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.licenseNumber || '-'}</div>
                        <div style={{ fontSize: '0.75rem', color: r.officialStatus === 'EXPIRED' ? '#EF4444' : '#6b7280' }}>
                          หมดอายุ: {r.expiryDate}
                        </div>
                      </td>
                      <td>
                        {r.officialStatus === 'ACTIVE' && (
                          <span style={{ background: '#DEF7EC', color: '#03543F', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                            🟢 ACTIVE (ใช้ได้)
                          </span>
                        )}
                        {r.officialStatus === 'EXPIRED' && (
                          <span style={{ background: '#FDE8E8', color: '#9B1C1C', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                            🟡 EXPIRED (หมดอายุ)
                          </span>
                        )}
                        {r.officialStatus === 'REVOKED' && (
                          <span style={{ background: '#771D1D', color: '#FFFFFF', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                            🚫 REVOKED (เพิกถอน)
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 45, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${r.aiNameMatchScore}%`,
                                height: '100%',
                                background: r.aiNameMatchScore > 80 ? '#10B981' : r.aiNameMatchScore > 50 ? '#F59E0B' : '#EF4444',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: r.aiNameMatchScore > 80 ? '#10B981' : r.aiNameMatchScore > 50 ? '#F59E0B' : '#EF4444' }}>
                            {r.aiNameMatchScore}%
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                          {r.aiVisionLabelDetected ? '✓ พบฉลากในรูป' : '⚠️ ไม่พบฉลาก'}
                        </div>
                      </td>
                      <td style={{ maxWidth: 280 }}>
                        <div style={{ fontSize: '0.8rem', lineHeight: 1.3, color: '#374151' }}>
                          {r.aiRecommendation}
                        </div>
                        {r.officialRegisteredName && r.officialRegisteredName !== r.productName && (
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>
                            ชื่อใน อย./มอก.: <em>{r.officialRegisteredName}</em>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {r.status !== 'VERIFIED_ACTIVE' ? (
                            <button
                              className="admin-btn-sm admin-btn-primary"
                              onClick={() => handleApproveCompliance(r.productId)}
                              title="อนุมัติและมอบตรา Verified"
                            >
                              <CheckCircle2 size={13} /> อนุมัติ
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>✓ รับรองแล้ว</span>
                          )}

                          {r.status !== 'REVOKED_BANNED' && (
                            <button
                              className="admin-btn-sm admin-btn-danger"
                              onClick={() => handleSuppressCompliance(r.productId, r.aiRecommendation)}
                              title="สั่งซ่อนสินค้าจากการค้นหาทันที"
                            >
                              <EyeOff size={13} /> ซ่อนสินค้า
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 💳 Finance Admin */}
      {activeTab === 'finance' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">💳 อนุมัติการถอนเงินของร้านค้า (Seller Payout Approvals)</h2>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ชื่อร้านค้า</th>
                <th>ธนาคาร & บัญชี</th>
                <th>ชื่อบัญชี</th>
                <th>จำนวนเงินถอน</th>
                <th>สถานะ</th>
                <th>ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td style={{ fontWeight: 600 }}>{p.storeName}</td>
                  <td>{p.bankName}<br /><span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{p.bankAccountNo}</span></td>
                  <td>{p.accountName}</td>
                  <td style={{ fontWeight: 800, color: '#10b981' }}>฿{p.amount.toLocaleString()}</td>
                  <td>
                    {p.status === 'pending' ? (
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                        ⏳ รออนุมัติ
                      </span>
                    ) : (
                      <span style={{ background: '#d1fae5', color: '#047857', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                        ✓ โอนเงินสำเร็จ
                      </span>
                    )}
                  </td>
                  <td>
                    {p.status === 'pending' ? (
                      <button className="admin-btn-sm admin-btn-success" onClick={() => handleApprovePayout(p.id)}>
                        อนุมัติโอนเงิน
                      </button>
                    ) : (
                      <CheckCircle size={20} color="#10b981" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 💬 CS Admin */}
      {activeTab === 'cs' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">💬 คำร้องขอคืนเงิน & เคสพิพาท (Dispute Resolution)</h2>
          </div>
          {disputes.map(d => (
            <div key={d.id} style={{ border: '1px solid #e5e7eb', padding: '1.25rem', borderRadius: 6, marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700 }}>คำสั่งซื้อ #{d.orderId} (ผู้ซื้อ: {d.buyerName} | ร้านค้า: {d.storeName})</span>
                <span style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 700 }}>ยอดขอคืนเงิน ฿{d.refundAmount.toLocaleString()}</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#374151', margin: '0.5rem 0' }}>เหตุผล: {d.reason}</p>
              {d.status === 'open' ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="admin-btn-sm admin-btn-success" onClick={() => handleResolveDispute(d.id, 'refund_buyer')}>
                    อนุมัติคืนเงินเข้าผู้ซื้อ (Refund Buyer)
                  </button>
                  <button className="admin-btn-sm admin-btn-outline" onClick={() => handleResolveDispute(d.id, 'payout_seller')}>
                    ยกเลิกคำร้อง & โอนเงินเข้าร้านค้า (Payout Seller)
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: '0.8rem', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                  ✓ ตัดสินเคสเรียบร้อยแล้ว ({d.status})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 🚚 Logistics Admin */}
      {activeTab === 'logistics' && (
        <div className="admin-card">
          <h2 className="admin-card-title" style={{ marginBottom: '1rem' }}>🚚 ติดตามพัสดุ & พิกัดรถส่งของเรียลไทม์ (Logistics Control)</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>ประสานงานขนส่ง Flash Express, SPX Express, และ Kerry Express ตรวจสอบพัสดุตกค้าง</p>
          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: 6, marginTop: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>สถานะการส่งพัสดุวันนี้:</span>
            <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, margin: '4px 0 0 0' }}>✓ จัดส่งสำเร็จตามกำหนด 99.4% (เฉลี่ย 1.8 วัน)</p>
          </div>
        </div>
      )}

      {/* 🛡️ Moderation, Trust Scores & Safety Enforcement */}
      {activeTab === 'moderation' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">🛡️ ศูนย์ความปลอดภัย & ระงับผู้กระทำผิด (Trust, Suspension & Anti-Fraud Center)</h2>
              <p className="admin-card-subtitle">
                จัดการและลงโทษผู้ใช้/ร้านค้าที่ทำผิดกฎ: สั่งแล้วไม่รับของ (COD Reject), สั่งเล่น, ขอเงินคืนโดยไม่คืนสินค้า และส่งของปลอม
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`admin-btn-sm ${moderationSubTab === 'users' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                onClick={() => setModerationSubTab('users')}
              >
                <Users size={14} /> ผู้ใช้งาน & Trust Score ({moderatedUsers.length})
              </button>
              <button
                className={`admin-btn-sm ${moderationSubTab === 'stores' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                onClick={() => setModerationSubTab('stores')}
              >
                <StoreIcon size={14} /> ร้านค้า & บทลงโทษ ({moderatedStores.length})
              </button>
              <button
                className={`admin-btn-sm ${moderationSubTab === 'reports' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                onClick={() => setModerationSubTab('reports')}
              >
                <AlertTriangle size={14} /> รายงานการฉ้อโกง & COD ({violationReports.length})
              </button>
            </div>
          </div>

          {/* 👤 SubTab 1: Moderated Users & Buyer Trust Scores */}
          {moderationSubTab === 'users' && (
            <div style={{ marginTop: '1.25rem' }}>
              {/* Filter and Search Bar */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#9ca3af' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.25rem' }}
                    placeholder="ค้นหาชื่อ, เบอร์โทร, หรืออีเมลผู้ซื้อ..."
                    value={userSearchText}
                    onChange={e => setUserSearchText(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>สถานะ:</span>
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
                    value={userStatusFilter}
                    onChange={e => setUserStatusFilter(e.target.value as any)}
                  >
                    <option value="ALL">ทั้งหมดทุกสถานะ</option>
                    <option value="ACTIVE">ปกติ (Active)</option>
                    <option value="WARNING">มีประวัติตักเตือน (Warning)</option>
                    <option value="COD_RESTRICTED">ระงับเก็บเงินปลายทาง (COD Restricted)</option>
                    <option value="SUSPENDED">ระงับการใช้งาน (Suspended)</option>
                    <option value="BANNED">แบนถาวร (Banned)</option>
                  </select>
                </div>
              </div>

              {/* Users Moderation Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563' }}>ข้อมูลผู้ใช้งาน</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563' }}>คะแนนความน่าเชื่อถือ (Trust Score)</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563' }}>สถิติ COD / ไม่รับของ</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563' }}>เคลมเงินคืนเท็จ</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563' }}>สถานะบัญชี</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563', textAlign: 'right' }}>การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moderatedUsers
                      .filter(u => {
                        const matchSearch =
                          u.name.toLowerCase().includes(userSearchText.toLowerCase()) ||
                          u.phone.includes(userSearchText) ||
                          u.email.toLowerCase().includes(userSearchText.toLowerCase());
                        const matchStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
                        return matchSearch && matchStatus;
                      })
                      .map(user => {
                        const scoreColor =
                          user.trustScore >= 80 ? '#10b981' : user.trustScore >= 50 ? '#f59e0b' : '#dc2626';
                        const scoreBg =
                          user.trustScore >= 80 ? '#ecfdf5' : user.trustScore >= 50 ? '#fffbeb' : '#fef2f2';

                        return (
                          <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ fontWeight: 700, color: '#111827' }}>{user.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                📞 {user.phone} • ✉️ {user.email}
                              </div>
                              {user.suspensionReason && (
                                <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 4, background: '#fef2f2', padding: '2px 6px', borderRadius: 4 }}>
                                  ⚠️ หมายเหตุ: {user.suspensionReason}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: scoreBg,
                                    color: scoreColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                    border: `2px solid ${scoreColor}`
                                  }}
                                >
                                  {user.trustScore}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: scoreColor }}>
                                    {user.trustScore >= 80 ? 'ดีเยี่ยม' : user.trustScore >= 50 ? 'เสี่ยงปานกลาง' : 'เสี่ยงสูงมาก'}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>เต็ม 100 คะแนน</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                สำเร็จ: <span style={{ color: user.codSuccessRate >= 90 ? '#10b981' : '#dc2626' }}>{user.codSuccessRate}%</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: user.codRejectedCount > 0 ? '#dc2626' : '#6b7280', fontWeight: user.codRejectedCount > 0 ? 700 : 400 }}>
                                ปฏิเสธไม่รับของ: {user.codRejectedCount} ครั้ง
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  color: user.fraudRefundCount > 0 ? '#dc2626' : '#10b981',
                                }}
                              >
                                {user.fraudRefundCount > 0 ? `🚨 ${user.fraudRefundCount} ครั้ง` : '✓ 0 ครั้ง'}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              {user.status === 'ACTIVE' && (
                                <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                                  ปกติ (Active)
                                </span>
                              )}
                              {user.status === 'WARNING' && (
                                <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                                  ⚠️ ตักเตือน (Warning)
                                </span>
                              )}
                              {user.status === 'COD_RESTRICTED' && (
                                <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                                  🚫 ตัดสิทธิ์ COD
                                </span>
                              )}
                              {(user.status === 'SUSPENDED' || user.status === 'BANNED') && (
                                <span style={{ fontSize: '0.75rem', background: '#111827', color: '#ffffff', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                                  ⛔ ระงับบัญชี (Banned)
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                <button
                                  className="admin-btn-sm admin-btn-outline"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                  title="สลับสิทธิ์การเก็บเงินปลายทาง"
                                  onClick={() => handleQuickToggleUserCod(user)}
                                >
                                  {user.status === 'COD_RESTRICTED' ? 'ปลดบล็อก COD' : 'บล็อก COD'}
                                </button>
                                <button
                                  className={`admin-btn-sm ${user.status === 'SUSPENDED' || user.status === 'BANNED' ? 'admin-btn-success' : 'admin-btn-outline'}`}
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: user.status === 'SUSPENDED' ? '#fff' : '#dc2626', borderColor: '#fca5a5' }}
                                  title="ระงับการเข้าใช้ระบบ"
                                  onClick={() => handleQuickToggleUserBan(user)}
                                >
                                  {user.status === 'SUSPENDED' || user.status === 'BANNED' ? 'ปลดแบน' : 'ระงับบัญชี'}
                                </button>
                                <button
                                  className="admin-btn-sm admin-btn-primary"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                  onClick={() => handleOpenUserModal(user)}
                                >
                                  จัดการละเอียด
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 🏪 SubTab 2: Store Health, Penalty Points & Suspensions */}
          {moderationSubTab === 'stores' && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#9ca3af' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.25rem' }}
                    placeholder="ค้นหาชื่อร้านค้า..."
                    value={storeSearchText}
                    onChange={e => setStoreSearchText(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563' }}>ข้อมูลร้านค้า</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563' }}>คะแนนสุขภาพร้าน (Shop Health)</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563' }}>แต้มตัดสะสม (Penalty Points)</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563' }}>ส่งล่าช้า / ยกเลิกออเดอร์</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563' }}>การจำกัดสิทธิ์</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563', textAlign: 'right' }}>การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moderatedStores
                      .filter(s => s.name.toLowerCase().includes(storeSearchText.toLowerCase()))
                      .map(store => {
                        const healthColor =
                          store.healthScore >= 80 ? '#10b981' : store.healthScore >= 50 ? '#f59e0b' : '#dc2626';

                        return (
                          <tr key={store.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ fontWeight: 700, color: '#111827' }}>{store.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                รหัส: {store.id} • คะแนนรีวิว: ⭐ {store.rating}
                              </div>
                              {store.penaltyReason && (
                                <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 4, background: '#fef2f2', padding: '2px 6px', borderRadius: 4 }}>
                                  ⚠️ สาเหตุ: {store.penaltyReason}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: healthColor }}>
                                  {store.healthScore}/100
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {store.healthScore >= 80 ? 'ดีมาก' : store.healthScore >= 50 ? 'ต้องปรับปรุง' : 'วิกฤต'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 800,
                                  color: store.penaltyPoints > 0 ? '#dc2626' : '#10b981',
                                  background: store.penaltyPoints > 0 ? '#fee2e2' : '#ecfdf5',
                                  padding: '3px 8px',
                                  borderRadius: 6
                                }}
                              >
                                {store.penaltyPoints > 0 ? `+${store.penaltyPoints} แต้มตัด` : '0 แต้ม'}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ fontSize: '0.8rem', color: store.lateShipmentRate > 10 ? '#dc2626' : '#4b5563' }}>
                                ส่งช้า: {store.lateShipmentRate}%
                              </div>
                              <div style={{ fontSize: '0.8rem', color: store.cancellationRate > 5 ? '#dc2626' : '#4b5563' }}>
                                ยกเลิก: {store.cancellationRate}%
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {store.isLiveRestricted && (
                                  <span style={{ fontSize: '0.7rem', color: '#dc2626', background: '#fee2e2', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                    🚫 พักสิทธิ์ไลฟ์สด
                                  </span>
                                )}
                                {store.isSearchRestricted && (
                                  <span style={{ fontSize: '0.7rem', color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                    🔍 จำกัดการค้นหา
                                  </span>
                                )}
                                {!store.isLiveRestricted && !store.isSearchRestricted && store.status === 'ACTIVE' && (
                                  <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>✓ เปิดปกติ</span>
                                )}
                                {store.status === 'SUSPENDED' && (
                                  <span style={{ fontSize: '0.75rem', background: '#111827', color: '#ffffff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                    ⛔ ระงับร้านค้า
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                              <button
                                className="admin-btn-sm admin-btn-primary"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                onClick={() => handleOpenStoreModal(store)}
                              >
                                ตัดแต้ม / สั่งระงับ
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ⚖️ SubTab 3: Violation Reports & Dispute Queue */}
          {moderationSubTab === 'reports' && (
            <div style={{ marginTop: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
                รายการแจ้งเบาะแสการทุจริต: ร้านค้าร้องเรียนผู้ซื้อไม่รับของ COD / ขอเงินคืนฉ้อโกง และผู้ซื้อร้องเรียนร้านค้าส่งของปลอม
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {violationReports.map(rep => (
                  <div
                    key={rep.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 6,
                      padding: '1.25rem',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '1rem',
                      alignItems: 'start'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: rep.type === 'COD_REJECTED' ? '#fee2e2' : rep.type === 'REFUND_ABUSE' ? '#fef3c7' : rep.type === 'FAKE_PRODUCT' ? '#fee2e2' : rep.type === 'SCAM_OFFPLATFORM' ? '#fce7f3' : '#e0e7ff',
                            color: rep.type === 'COD_REJECTED' ? '#b91c1c' : rep.type === 'REFUND_ABUSE' ? '#b45309' : rep.type === 'FAKE_PRODUCT' ? '#991b1b' : rep.type === 'SCAM_OFFPLATFORM' ? '#9d174d' : '#3730a3',
                          }}
                        >
                          {rep.type === 'COD_REJECTED' && '🚨 ปฏิเสธรับสินค้า COD'}
                          {rep.type === 'REFUND_ABUSE' && '⚠️ ขอคืนเงินเท็จ / ไม่ส่งของคืน'}
                          {rep.type === 'FAKE_PRODUCT' && '🚫 สินค้าปลอม / เลียนแบบแบรนด์'}
                          {rep.type === 'MISLEADING_SPECS' && '📦 สินค้าไม่ตรงปก / สเปกเท็จ'}
                          {rep.type === 'SCAM_OFFPLATFORM' && '⚠️ มิจฉาชีพ / หลอกโอนเงินนอกระบบ'}
                          {rep.type === 'HARASSMENT' && '💬 ข้อความคุกคาม / บล็อกแชท'}
                          {rep.type === 'NO_FDA_TISI' && '🏷️ ไม่มีเลข อย./มอก. ถูกต้อง'}
                          {rep.type === 'REFUND_DENIED' && '↩️ ปฏิเสธการคืนเงินถูกต้อง'}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                          ออเดอร์: {rep.orderId}
                        </span>
                        {rep.requestRefund && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 6px', background: '#dbeafe', color: '#1e40af', borderRadius: 4 }}>
                            🛡️ ขอรับเงินคืน (Buyer Guarantee)
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          แจ้งเมื่อ: {new Date(rep.createdAt).toLocaleString('th-TH')}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                        <strong>ผู้ร้องเรียน:</strong> {rep.reporterName} ({rep.reporterType}) ➔ <strong>ผู้ถูกร้องเรียน:</strong>{' '}
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>{rep.reportedName}</span> ({rep.reportedType})
                      </div>

                      <div style={{ fontSize: '0.875rem', color: '#4b5563', background: '#f9fafb', padding: '0.75rem', borderRadius: 6, marginBottom: '0.5rem' }}>
                        {rep.description}
                      </div>

                      {rep.adminNotes && (
                        <div style={{ fontSize: '0.8rem', color: '#15803d', background: '#dcfce7', padding: '4px 8px', borderRadius: 4, fontWeight: 600 }}>
                          ✓ บันทึกการจัดการ: {rep.adminNotes}
                        </div>
                      )}
                    </div>

                    {/* Action Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 220, alignItems: 'flex-end' }}>
                      {rep.evidenceUrl && (
                        <a href={rep.evidenceUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'underline', marginBottom: 4 }}>
                          🔍 ดูรูปหลักฐานพัสดุ / ภาพสินค้า
                        </a>
                      )}

                      {rep.status === 'PENDING' || rep.status === 'INVESTIGATING' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                          {rep.reporterType === 'BUYER' && (rep.type === 'FAKE_PRODUCT' || rep.type === 'SCAM_OFFPLATFORM' || rep.type === 'MISLEADING_SPECS') ? (
                            <>
                              <button
                                className="admin-btn-sm admin-btn-primary"
                                style={{ width: '100%', justifyContent: 'center', background: '#dc2626' }}
                                onClick={() =>
                                  handleResolveViolationReport(
                                    rep.id,
                                    'ACTION_TAKEN',
                                    'อนุมัติคืนเงิน 100% ให้ลูกค้า และลงโทษตัดแต้มร้านค้า 15 แต้ม (สั่งพักร้านค้าทันที)'
                                  )
                                }
                              >
                                💰 อนุมัติเงินคืน + แบนร้านค้า
                              </button>
                              <button
                                className="admin-btn-sm"
                                style={{ width: '100%', justifyContent: 'center', background: '#f59e0b', color: 'white', border: 'none' }}
                                onClick={() =>
                                  handleResolveViolationReport(
                                    rep.id,
                                    'ACTION_TAKEN',
                                    'อนุมัติคืนเงินลูกค้า + ซ่อนสินค้าจากการค้นหา (ตัดแต้มร้าน 5 แต้ม)'
                                  )
                                }
                              >
                                🔍 ซ่อนสินค้า + เตือนร้านค้า
                              </button>
                            </>
                          ) : (
                            <button
                              className="admin-btn-sm admin-btn-primary"
                              style={{ width: '100%', justifyContent: 'center' }}
                              onClick={() =>
                                handleResolveViolationReport(
                                  rep.id,
                                  'ACTION_TAKEN',
                                  rep.type === 'COD_REJECTED'
                                    ? 'ตัดสิทธิ์การใช้งาน COD ของผู้ซื้อ และหักคะแนน Trust Score 30 แต้ม'
                                    : 'ดำเนินการลงโทษและบันทึกประวัติความประพฤติ'
                                )
                              }
                            >
                              ✓ อนุมัติลงโทษ & ตัดคะแนน
                            </button>
                          )}
                          <button
                            className="admin-btn-sm admin-btn-outline"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => handleResolveViolationReport(rep.id, 'DISMISSED', 'ยกเลิกคำร้องเนื่องจากหลักฐานไม่เพียงพอ')}
                          >
                            ยกเลิกคำร้อง (Dismiss)
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', background: '#e0e7ff', color: '#3730a3', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                          ✓ ดำเนินการแล้ว ({rep.status})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 👑 RBAC Team Admin */}
      {activeTab === 'team' && (
        <div className="admin-card">
          <h2 className="admin-card-title" style={{ marginBottom: '1rem' }}>👑 สิทธิ์ทีมงาน Admin ทั้ง 7 แผนก (Role-Based Access Control)</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>กำหนดบทบาท SUPER_ADMIN, CATALOG_ADMIN, FINANCE_ADMIN, CS_ADMIN, MARKETING_ADMIN, LOGISTICS_ADMIN, MODERATOR</p>
          <button className="admin-btn-sm admin-btn-primary" style={{ marginTop: '1rem' }}>+ เพิ่มทีมงาน Admin ใหม่</button>
        </div>
      )}

      {/* ── Modal: Create Campaign ── */}
      {showCampaignModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>👑 สร้างแคมเปญ Super Brand Day & Mega Sales</h3>
              <button onClick={() => setShowCampaignModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign}>
              <div className="form-group">
                <label className="form-label">ชื่อแคมเปญ (Campaign Title)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น: Apple Super Brand Day 🍎"
                  value={newCampaignForm.title}
                  onChange={e => setNewCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">แบรนด์เป้าหมาย (Featured Brand)</label>
                <select
                  className="form-select"
                  value={newCampaignForm.brand}
                  onChange={e => setNewCampaignForm(prev => ({ ...prev, brand: e.target.value }))}
                >
                  <option value="Apple Official Store">Apple Official Store 🍎</option>
                  <option value="Samsung Thailand">Samsung Thailand 📱</option>
                  <option value="Nike Thailand">Nike Thailand 👟</option>
                  <option value="Dyson Thailand">Dyson Thailand 💨</option>
                  <option value="Sony Official Store">Sony Official Store 🎧</option>
                  <option value="All Mall Brands">All Mall Brands (รวมทุกแบรนด์)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">แท็กแคมเปญ (Campaign Tag)</label>
                <select
                  className="form-select"
                  value={newCampaignForm.tag}
                  onChange={e => setNewCampaignForm(prev => ({ ...prev, tag: e.target.value }))}
                >
                  <option value="Super Brand Day">👑 Super Brand Day</option>
                  <option value="PayDay 25th">💳 PayDay สิ้นเดือน</option>
                  <option value="Double Digit Sale">⚡ Double Digit (9.9, 11.11, 12.12)</option>
                  <option value="Mid-Month Flash">🔥 Mid-Month Flash 15th</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ส่วนลดสูงสุด (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newCampaignForm.discountPercent}
                  onChange={e => setNewCampaignForm(prev => ({ ...prev, discountPercent: Number(e.target.value) }))}
                  min={5}
                  max={90}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">วันที่เริ่ม</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newCampaignForm.startDate}
                    onChange={e => setNewCampaignForm(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newCampaignForm.endDate}
                    onChange={e => setNewCampaignForm(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">URL รูปแบนเนอร์โปรโมต (Banner Image URL)</label>
                <input
                  type="url"
                  className="form-input"
                  value={newCampaignForm.bannerUrl}
                  onChange={e => setNewCampaignForm(prev => ({ ...prev, bannerUrl: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="admin-btn-sm admin-btn-primary" style={{ flex: 1, padding: '0.65rem', justifyContent: 'center' }}>
                  บันทึก & เผยแพร่แคมเปญ
                </button>
                <button type="button" className="admin-btn-sm admin-btn-outline" onClick={() => setShowCampaignModal(false)}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Create Platform Voucher ── */}
      {showVoucherModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>🎟️ สร้างคูปองส่วนลดกลางแพลตฟอร์ม</h3>
              <button onClick={() => setShowVoucherModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateVoucher}>
              <div className="form-group">
                <label className="form-label">รหัสโค้ดคูปอง (Voucher Code)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น: SUPERMALL500"
                  value={newVoucherForm.code}
                  onChange={e => setNewVoucherForm(prev => ({ ...prev, code: e.target.value }))}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ชื่อคูปอง (Title)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น: ส่วนลดแบรนด์ดัง Mall ฿500"
                  value={newVoucherForm.title}
                  onChange={e => setNewVoucherForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ประเภทส่วนลด</label>
                <select
                  className="form-select"
                  value={newVoucherForm.discountType}
                  onChange={e => setNewVoucherForm(prev => ({ ...prev, discountType: e.target.value as any }))}
                >
                  <option value="fixed">💰 ส่วนลดเงินสด (บาท)</option>
                  <option value="percent">📊 ส่วนลดเปอร์เซ็นต์ (%)</option>
                  <option value="shipping">🚚 คูปองส่งฟรีทั่วไทย</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">มูลค่าส่วนลด</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newVoucherForm.discountValue}
                    onChange={e => setNewVoucherForm(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ยอดซื้อขั้นต่ำ (฿)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newVoucherForm.minSpend}
                    onChange={e => setNewVoucherForm(prev => ({ ...prev, minSpend: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">จำนวนสิทธิ์ทั้งหมด (Quota)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newVoucherForm.totalQuota}
                    onChange={e => setNewVoucherForm(prev => ({ ...prev, totalQuota: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">วันหมดอายุ</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newVoucherForm.expiresAt}
                    onChange={e => setNewVoucherForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="admin-btn-sm admin-btn-primary" style={{ flex: 1, padding: '0.65rem', justifyContent: 'center' }}>
                  สร้างและเปิดแจกคูปอง
                </button>
                <button type="button" className="admin-btn-sm admin-btn-outline" onClick={() => setShowVoucherModal(false)}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Manage User Moderation ── */}
      {selectedUserModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content" style={{ maxWidth: 520 }}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={20} color="#2563eb" /> จัดการความประพฤติ & Trust Score ผู้ใช้งาน
              </h3>
              <button onClick={() => setSelectedUserModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveUserModeration}>
              <div style={{ background: '#f9fafb', padding: '0.85rem', borderRadius: 6, marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 700, color: '#111827' }}>{selectedUserModal.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  📞 {selectedUserModal.phone} • ✉️ {selectedUserModal.email}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: 4 }}>
                  สถิติ: ไม่รับของ COD <strong>{selectedUserModal.codRejectedCount} ครั้ง</strong> | เคลมเท็จ <strong>{selectedUserModal.fraudRefundCount} ครั้ง</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">สถานะบัญชี (Account Status)</label>
                <select
                  className="form-select"
                  value={userModalStatus}
                  onChange={e => setUserModalStatus(e.target.value as any)}
                >
                  <option value="ACTIVE">✅ ปกติ (Active - สิทธิ์ครบถ้วน)</option>
                  <option value="WARNING">⚠️ แจ้งเตือนความประพฤติ (Warning)</option>
                  <option value="COD_RESTRICTED">🚫 ระงับสิทธิ์เก็บเงินปลายทาง (COD Restricted)</option>
                  <option value="SUSPENDED">⛔ ระงับบัญชีชั่วคราว (Suspended)</option>
                  <option value="BANNED">🔒 แบนบัญชีถาวร (Banned)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">คะแนนความน่าเชื่อถือ (Trust Score 0 - 100)</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  max={100}
                  value={userModalTrustScore}
                  onChange={e => setUserModalTrustScore(Number(e.target.value))}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  * ผู้ใช้ที่มีคะแนนต่ำกว่า 60 จะถูกระบบจำกัดสิทธิ์ COD อัตโนมัติในหน้าสั่งซื้อ
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">เหตุผล / บันทึกการลงโทษ (Reason)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="เช่น: สั่งสินค้า COD 4 ชิ้นติดต่อกันแล้วปฏิเสธรับพัสดุ หรือขอคืนเงินเท็จ"
                  value={userModalReason}
                  onChange={e => setUserModalReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="admin-btn-sm admin-btn-primary" style={{ flex: 1, padding: '0.65rem', justifyContent: 'center' }}>
                  บันทึกการลงโทษ & อัปเดต Trust Score
                </button>
                <button type="button" className="admin-btn-sm admin-btn-outline" onClick={() => setSelectedUserModal(null)}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Manage Store Penalties ── */}
      {selectedStoreModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content" style={{ maxWidth: 520 }}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <StoreIcon size={20} color="#dc2626" /> ตัดแต้มความประพฤติ & กำหนดบทลงโทษร้านค้า
              </h3>
              <button onClick={() => setSelectedStoreModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveStorePenalty}>
              <div style={{ background: '#f9fafb', padding: '0.85rem', borderRadius: 6, marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 700, color: '#111827' }}>{selectedStoreModal.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  คะแนนสุขภาพปัจจุบัน: <strong>{selectedStoreModal.healthScore}/100</strong> | แต้มตัดสะสม: <strong>{selectedStoreModal.penaltyPoints} แต้ม</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">เพิ่มแต้มตัด (Penalty Points to Add)</label>
                <select
                  className="form-select"
                  value={storeModalPoints}
                  onChange={e => setStoreModalPoints(Number(e.target.value))}
                >
                  <option value={1}>+1 แต้ม (ส่งพัสดุล่าช้าเกินกำหนด 3 วัน)</option>
                  <option value={2}>+2 แต้ม (กดยกเลิกออเดอร์ลูกค้าโดยไม่มีเหตุผล)</option>
                  <option value={3}>+3 แต้ม (สินค้าไม่ตรงตามสเปก/รายละเอียด)</option>
                  <option value={6}>+6 แต้ม (จำหน่ายสินค้าละเมิดลิขสิทธิ์ / ปลอม)</option>
                  <option value={10}>+10 แต้ม (ฉ้อโกง / ไม่ยอมรับเคลมคืนเงินตามกฎหมาย)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">สถานะร้านค้า (Store Status)</label>
                <select
                  className="form-select"
                  value={storeModalStatus}
                  onChange={e => setStoreModalStatus(e.target.value as any)}
                >
                  <option value="ACTIVE">✅ เปิดบริการปกติ (Active)</option>
                  <option value="WARNING">⚠️ แจ้งเตือนปรับปรุง (Warning)</option>
                  <option value="RESTRICTED">🚫 จำกัดฟังก์ชันบางส่วน (Restricted)</option>
                  <option value="SUSPENDED">⛔ พักการขายชั่วคราว (Suspended)</option>
                  <option value="BANNED">🔒 ปิดร้านค้าถาวร (Banned)</option>
                </select>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '0.85rem', borderRadius: 6, marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', marginBottom: '0.5rem' }}>มาตรการจำกัดสิทธิ์เพิ่มเติม:</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#374151', cursor: 'pointer', marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={storeModalLiveRestricted}
                    onChange={e => setStoreModalLiveRestricted(e.target.checked)}
                  />
                  <span>🚫 สั่งพักการไลฟ์สดชั่วคราว (Live Stream Restrict)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#374151', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={storeModalSearchRestricted}
                    onChange={e => setStoreModalSearchRestricted(e.target.checked)}
                  />
                  <span>🔍 ซ่อนสินค้าจากการค้นหา & AI Feed (Search Suppress)</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">บันทึกเหตุผลการตัดแต้ม (Penalty Reason)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="ระบุข้อเท็จจริง เช่น ได้รับการร้องเรียนเรื่องสินค้าส่งล่าช้าเกิน 15% ของยอดสั่งซื้อ"
                  value={storeModalReason}
                  onChange={e => setStoreModalReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="admin-btn-sm admin-btn-primary" style={{ flex: 1, padding: '0.65rem', justifyContent: 'center' }}>
                  ยืนยันการตัดแต้ม & สั่งบังคับใช้บทลงโทษ
                </button>
                <button type="button" className="admin-btn-sm admin-btn-outline" onClick={() => setSelectedStoreModal(null)}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminPortalPage;

