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
  ArrowLeft,
  Globe,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { fetchApi, logoutApi } from '../utils/api';
import { promptGoogleAuth } from '../utils/googleAuth';
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

export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'SUPER_ADMIN' | 'CATALOG_ADMIN' | 'FINANCE_ADMIN' | 'CS_ADMIN' | 'MARKETING_ADMIN' | 'LOGISTICS_ADMIN' | 'MODERATOR';
  permissions: string[];
  status: 'ACTIVE' | 'SUSPENDED';
  avatarUrl: string;
  lastActive: string;
}

export function AdminPortalPage({ products }: { products: Product[] }) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'catalog' | 'compliance' | 'finance' | 'cs' | 'marketing' | 'logistics' | 'moderation' | 'team'
  >('marketing');

  const [marketingSubTab, setMarketingSubTab] = useState<'campaigns' | 'broadcast' | 'vouchers' | 'flashsale'>('campaigns');
  const [teamRoleFilter, setTeamRoleFilter] = useState<string>('ALL');
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>('');
  const [showAddTeamModal, setShowAddTeamModal] = useState<boolean>(false);
  const [editingTeamMember, setEditingTeamMember] = useState<AdminTeamMember | null>(null);

  const [teamMembers, setTeamMembers] = useState<AdminTeamMember[]>([]);

  const [newTeamMemberForm, setNewTeamMemberForm] = useState({
    name: '',
    email: '',
    department: 'ฝ่ายการตลาด & แคมเปญ',
    role: 'MARKETING_ADMIN' as AdminTeamMember['role'],
    initialPassword: '',
  });

  const [metrics, setMetrics] = useState<AdminMetrics>({
    gmv: 0,
    totalOrders: 0,
    totalProducts: products.length || 0,
    totalUsers: 0,
    totalStores: 0,
  });

  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);

  const [disputes, setDisputes] = useState<DisputeTicket[]>([]);

  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  // Marketing Campaigns State
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);

  // Broadcaster State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    body: '',
    category: 'promos',
    targetUrl: '/mall',
    audience: 'all',
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>([]);

  // Vouchers State
  const [vouchers, setVouchers] = useState<PlatformVoucher[]>([]);

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
  const [moderatedUsers, setModeratedUsers] = useState<ModeratedUser[]>([]);
  const [moderatedStores, setModeratedStores] = useState<ModeratedStore[]>([]);
  const [violationReports, setViolationReports] = useState<ViolationReport[]>([]);

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

  const [selectedStoreModal, setSelectedStoreModal] = useState<ModeratedStore | null>(null);
  const [storeModalPoints, setStoreModalPoints] = useState<number>(3);
  const [storeModalStatus, setStoreModalStatus] = useState<StoreStatusType>('RESTRICTED');
  const [storeModalLiveRestricted, setStoreModalLiveRestricted] = useState<boolean>(false);
  const [storeModalSearchRestricted, setStoreModalSearchRestricted] = useState<boolean>(false);
  const [storeModalReason, setStoreModalReason] = useState<string>('');

  // 🛡️ Authentication & Role Guard States
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const uStr = localStorage.getItem('movemall_user');
      return uStr ? JSON.parse(uStr) : null;
    } catch {
      return null;
    }
  });

  const [adminLoginForm, setAdminLoginForm] = useState({
    email: '',
    password: '',
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
        setCurrentUser(uStr ? JSON.parse(uStr) : null);
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
          email: adminLoginForm.email.trim(),
          password: adminLoginForm.password,
        }),
      });

      if (!res.token || !res.user) {
        throw new Error('ไม่พบข้อมูลการยืนยันตัวตนจากเซิร์ฟเวอร์');
      }

      const roleUpper = (res.user.role || '').toUpperCase();
      if (!ADMIN_ROLES.includes(roleUpper)) {
        throw new Error(`บัญชีนี้ไม่มีสิทธิ์เข้าถึงศูนย์ควบคุมผู้ดูแลระบบ (Role: ${res.user.role || 'BUYER'})`);
      }

      localStorage.setItem('movemall_jwt_token', res.token);
      localStorage.setItem('movemall_user', JSON.stringify(res.user));
      setCurrentUser(res.user);
      window.dispatchEvent(new Event('movemall_auth_change'));
    } catch (err: any) {
      console.error('Admin Login Authentication Error:', err);
      setAdminLoginError(err.message || 'อีเมลหรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง หรือบัญชีของคุณไม่มีสิทธิ์');
    } finally {
      setAdminLoginLoading(false);
    }
  }

  async function handleGoogleAdminLogin() {
    setAdminLoginLoading(true);
    setAdminLoginError('');
    try {
      const authRes = await promptGoogleAuth();
      if (authRes.credential || authRes.accessToken || authRes.googleUser || authRes.mockUser) {
        const res = await fetchApi<{
          token: string;
          user: { id: string; name: string; email?: string; role?: string; avatarUrl?: string; coinsBalance?: number };
        }>('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({
            credential: authRes.credential,
            accessToken: authRes.accessToken,
            googleUser: authRes.googleUser,
            mockUser: authRes.mockUser,
          }),
        });

        if (!res.token || !res.user) {
          throw new Error('ไม่พบข้อมูลผู้ใช้จากการยืนยันตัวตนด้วย Google');
        }

        const roleUpper = (res.user.role || '').toUpperCase();
        if (!ADMIN_ROLES.includes(roleUpper)) {
          throw new Error(`บัญชี Google (${res.user.email}) ไม่มีสิทธิ์เข้าถึง Super Admin (Role: ${res.user.role || 'BUYER'})`);
        }

        localStorage.setItem('movemall_jwt_token', res.token);
        localStorage.setItem('movemall_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
        window.dispatchEvent(new Event('movemall_auth_change'));
      }
    } catch (err: any) {
      console.error('Google Admin Login Error:', err);
      setAdminLoginError(err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
    } finally {
      setAdminLoginLoading(false);
    }
  }

  function handleAdminLogout() {
    logoutApi(); // เพิกถอน token ฝั่งเซิร์ฟเวอร์ด้วย ไม่ใช่แค่ลบทิ้งฝั่ง client
    setCurrentUser(null);
    window.dispatchEvent(new Event('movemall_auth_change'));
  }

  function handleSwitchAccount() {
    logoutApi(); // เพิกถอน token ฝั่งเซิร์ฟเวอร์ด้วย ไม่ใช่แค่ลบทิ้งฝั่ง client
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
        setModeratedUsers(usersRes.value.users);
      }
      if (storesRes.status === 'fulfilled' && storesRes.value?.stores?.length) {
        setModeratedStores(storesRes.value.stores);
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
        setViolationReports(reportsRes.value.reports);
      }

      if (currentUser) {
        setTeamMembers(prev => {
          if (prev.length === 0) {
            return [{
              id: currentUser.id || 'admin-root-01',
              name: currentUser.name || 'Movemall Super Admin',
              email: currentUser.email || 'admin@movemall.com',
              department: 'Executive Board',
              role: (currentUser.role as any) || 'SUPER_ADMIN',
              permissions: ['ALL_PERMISSIONS', 'DATABASE_ROOT', 'FINANCIAL_RELEASE', 'USER_BAN', 'SYSTEM_CONFIG'],
              status: 'ACTIVE',
              avatarUrl: currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
              lastActive: 'กำลังใช้งาน (Active Now)',
            }];
          }
          return prev;
        });
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
                placeholder="admin@movemall.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="admin-gate-field">
              <label className="admin-gate-label">รหัสผ่าน (Password)</label>
              <input
                type="password"
                className="admin-gate-input"
                value={adminLoginForm.password}
                onChange={e => setAdminLoginForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="admin-gate-btn admin-gate-btn--primary" disabled={adminLoginLoading}>
              <LogIn size={16} /> {adminLoginLoading ? 'กำลังตรวจสอบสิทธิ์ความปลอดภัย...' : 'เข้าสู่ระบบผู้ดูแลระบบ'}
            </button>
          </form>

          <div className="admin-gate-divider">หรือยืนยันตัวตนด้วย</div>

          <button
            type="button"
            className="admin-gate-btn"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              color: '#374151',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            onClick={handleGoogleAdminLogin}
            disabled={adminLoginLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>ลงชื่อเข้าใช้ด้วย Google (Admin SSO)</span>
          </button>

          <Link to="/" className="admin-gate-btn admin-gate-btn--outline" style={{ marginTop: '0.75rem' }}>
            <ArrowLeft size={16} /> กลับสู่หน้าหลัก Movemall
          </Link>

          <div className="admin-gate-hint-box" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}>
            🔒 <strong>ระบบรักษาความปลอดภัยระดับองค์กร:</strong><br />
            การพยายามเข้าถึงระบบ Super Admin ทั้งหมดจะถูกบันทึก IP Address, Browser Fingerprint และ Audit Logs เพื่อความปลอดภัยสูงสุดตาม พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์
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
          <h1 className="admin-gate-title">403 — ปฏิเสธการเข้าถึง</h1>
          <p className="admin-gate-subtitle">
            บัญชีปัจจุบันของคุณไม่มีสิทธิ์ในการเข้าถึงศูนย์ควบคุม Super Admin Portal
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
              <RefreshCw size={16} /> สลับบัญชีผู้ดูแลระบบ
            </button>
            <Link to="/" className="admin-gate-btn admin-gate-btn--outline">
              <ArrowLeft size={16} /> กลับสู่หน้าหลัก Movemall
            </Link>
          </div>

          <div className="admin-gate-hint-box" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}>
            🔒 หากท่านเป็นเจ้าหน้าที่ผู้ดูแลระบบ กรุณากดปุ่ม <em>"สลับบัญชีผู้ดูแลระบบ"</em> เพื่อลงชื่อเข้าใช้ด้วยอีเมลองค์กรที่มีสิทธิ์ Admin
          </div>
        </div>
      </div>
    );
  }

  const pendingPayoutsCount = payouts.filter(p => p.status === 'pending').length;
  const pendingDisputesCount = disputes.filter(d => d.status === 'pending').length;
  const pendingReportsCount = violationReports.filter(r => r.status === 'PENDING').length;
  const flaggedComplianceCount = Object.values(complianceResults).filter(
    r => r.status === 'EXPIRED_LICENSE' || r.status === 'MISMATCH_NAME' || r.status === 'REVOKED_BANNED'
  ).length;

  const departmentLabels: Record<string, string> = {
    overview: 'ภาพรวมระบบ & KPIs (System Overview)',
    marketing: 'ฝ่ายการตลาด & แคมเปญ (Campaign Hub & Automations)',
    catalog: 'ฝ่ายสินค้า & แบรนด์ Mall (Catalog & Verification)',
    compliance: 'AI ตรวจสอบ อย. / มอก. (FDA & TISI AI Auditor)',
    finance: 'ฝ่ายการเงิน & ถอนเงิน (Finance & Payouts)',
    cs: 'ฝ่าย CS & คืนเงิน (Customer Support & Disputes)',
    logistics: 'ฝ่ายขนส่ง & โลจิสติกส์ (Fleet & Live Tracking)',
    moderation: 'ความปลอดภัย & ระงับสิทธิ์ (Trust & Anti-Fraud Shield)',
    team: 'จัดการสิทธิ์ทีมงาน (Team Roles & RBAC)',
  };

  // ── 🛡️ Guard Passed: Full Super Admin Portal ──
  return (
    <div className="admin-enterprise-shell">
      {/* ── 1. Executive Top Navigation Bar ── */}
      <header className="admin-enterprise-topbar">
        <div className="admin-topbar-left">
          <div className="admin-brand-card">
            <div className="admin-brand-icon-box">
              <ShieldAlert size={20} color="#ffffff" />
            </div>
            <div>
              <div className="admin-brand-name">
                MOVEMALL <span className="admin-brand-badge">SUPER ADMIN</span>
              </div>
              <div className="admin-db-status">
                <span className="admin-status-dot" />
                <span>Supabase PostgreSQL 🟢 Connected</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-topbar-right">
          <div className="admin-quick-metrics">
            <span className="admin-stat-chip">📦 สินค้า <strong>{products.length}</strong></span>
            <span className="admin-stat-chip">👥 สมาชิก <strong>{metrics.totalUsers.toLocaleString()}</strong></span>
            <span className="admin-stat-chip">🏪 ร้านค้า <strong>{metrics.totalStores}</strong></span>
          </div>

          <button
            type="button"
            className="admin-action-btn admin-action-btn--sync"
            onClick={() => loadAllAdminData(true)}
            disabled={isRefreshingData}
            title="กดเพื่อดึงข้อมูลจริงล่าสุดจากฐานข้อมูล PostgreSQL"
          >
            <RefreshCw size={13} style={{ animation: isRefreshingData ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isRefreshingData ? 'กำลังซิงค์...' : `ซิงค์ข้อมูลจริง ${lastSyncTime ? `(${lastSyncTime})` : ''}`}</span>
          </button>

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-btn admin-action-btn--storefront"
            title="เปิดหน้าร้านค้ามุมมองผู้ซื้อในแท็บใหม่"
          >
            <Globe size={13} />
            <span>หน้าร้านค้า (Storefront)</span>
            <ExternalLink size={11} />
          </Link>

          <div className="admin-profile-pill">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
              alt={currentUser.name || 'Admin'}
              className="admin-avatar-img"
            />
            <div className="admin-profile-text">
              <span className="admin-profile-name">{currentUser.name || 'Note Shinnawat'}</span>
              <span className="admin-profile-role">👑 {currentUser.role || 'SUPER_ADMIN'}</span>
            </div>
          </div>

          <button
            type="button"
            className="admin-action-btn admin-action-btn--logout"
            onClick={handleAdminLogout}
            title="ออกจากระบบ Admin"
          >
            <LogOut size={13} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </header>

      {/* ── 2. Enterprise Layout: Sidebar + Workspace ── */}
      <div className="admin-enterprise-body">
        {/* Left Sidebar Navigation */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-section-title">
            <span>🏢 แผนกงานบริหาร (Departments)</span>
          </div>

          <nav className="admin-sidebar-nav">
            {/* Group 1: Executive & Strategy */}
            <div className="admin-nav-cluster">
              <div className="admin-cluster-label">📊 ศูนย์ควบคุมหลัก (Management)</div>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'overview' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <div className="admin-nav-item-content">
                  <BarChart3 size={15} />
                  <span>ภาพรวมระบบ (KPIs)</span>
                </div>
              </button>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'marketing' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('marketing')}
              >
                <div className="admin-nav-item-content">
                  <Tag size={15} />
                  <span>การตลาด & แคมเปญ</span>
                </div>
                <span className="admin-item-tag admin-item-tag--hot">HOT</span>
              </button>
            </div>

            {/* Group 2: Commerce, AI & Logistics */}
            <div className="admin-nav-cluster">
              <div className="admin-cluster-label">📦 สินค้า, การค้า & AI (Commerce & AI)</div>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'catalog' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('catalog')}
              >
                <div className="admin-nav-item-content">
                  <Package size={15} />
                  <span>สินค้า & แบรนด์ Mall</span>
                </div>
                <span className="admin-item-tag admin-item-tag--neutral">{products.length}</span>
              </button>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'compliance' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('compliance')}
              >
                <div className="admin-nav-item-content">
                  <Cpu size={15} />
                  <span>AI ตรวจ อย. / มอก.</span>
                </div>
                {flaggedComplianceCount > 0 && (
                  <span className="admin-item-tag admin-item-tag--amber">⚠️ {flaggedComplianceCount}</span>
                )}
              </button>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'finance' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('finance')}
              >
                <div className="admin-nav-item-content">
                  <DollarSign size={15} />
                  <span>การเงิน & ถอนเงิน</span>
                </div>
                {pendingPayoutsCount > 0 && (
                  <span className="admin-item-tag admin-item-tag--amber">⏳ {pendingPayoutsCount}</span>
                )}
              </button>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'logistics' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('logistics')}
              >
                <div className="admin-nav-item-content">
                  <Truck size={15} />
                  <span>ขนส่ง & โลจิสติกส์</span>
                </div>
              </button>
            </div>

            {/* Group 3: Trust, Security & Governance */}
            <div className="admin-nav-cluster">
              <div className="admin-cluster-label">🛡️ กำกับดูแล & ป้องกันโกง (Governance)</div>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'cs' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('cs')}
              >
                <div className="admin-nav-item-content">
                  <Headphones size={15} />
                  <span>ฝ่าย CS & คืนเงิน</span>
                </div>
                {pendingDisputesCount > 0 && (
                  <span className="admin-item-tag admin-item-tag--red">⚡ {pendingDisputesCount}</span>
                )}
              </button>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'moderation' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('moderation')}
              >
                <div className="admin-nav-item-content">
                  <ShieldAlert size={15} />
                  <span>ตรวจจับโกง & ระงับสิทธิ์</span>
                </div>
                {pendingReportsCount > 0 && (
                  <span className="admin-item-tag admin-item-tag--red">🚩 {pendingReportsCount}</span>
                )}
              </button>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'team' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('team')}
              >
                <div className="admin-nav-item-content">
                  <Users size={15} />
                  <span>สิทธิ์ทีมงาน (RBAC)</span>
                </div>
              </button>
            </div>
          </nav>

          <div className="admin-sidebar-foot">
            <div className="admin-foot-title">Movemall Core Enterprise</div>
            <div className="admin-foot-sub">v2.6.0 • PostgreSQL Connected</div>
          </div>
        </aside>

        {/* Right Main Workspace */}
        <main className="admin-workspace">
          {/* Breadcrumb Bar */}
          <div className="admin-breadcrumb-strip">
            <span className="admin-crumb-root">Movemall Admin</span>
            <ChevronRight size={12} className="admin-crumb-sep" />
            <span className="admin-crumb-current">{departmentLabels[activeTab]}</span>
          </div>

          <div className="admin-workspace-inner">

      {/* 🎯 1. Marketing & Campaign Department */}
      {activeTab === 'marketing' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">🎯 ศูนย์บริหารการตลาด & แคมเปญ (Marketing & Campaign Hub)</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                บริหารจัดการแคมเปญ Super Brand Day, บรอดแคสต์แจ้งเตือน, โค้ดส่วนลดกลาง และรอบ Flash Sale
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {marketingSubTab === 'campaigns' && (
                <button type="button" className="admin-btn-sm admin-btn-primary" onClick={() => setShowCampaignModal(true)}>
                  <Plus size={14} /> + สร้างแคมเปญใหม่
                </button>
              )}
              {marketingSubTab === 'vouchers' && (
                <button type="button" className="admin-btn-sm admin-btn-primary" onClick={() => setShowVoucherModal(true)}>
                  <Plus size={14} /> + สร้างคูปองส่วนลดกลาง
                </button>
              )}
            </div>
          </div>

          {/* 4 Summary Stats */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
              <span className="admin-stat-label">👑 แคมเปญ Super Brand Day Active</span>
              <div className="admin-stat-val" style={{ color: '#2563eb' }}>
                {campaigns.filter(c => c.status === 'active').length} แคมเปญ
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ยอดขายสร้างได้ ฿1,240,000</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
              <span className="admin-stat-label">📢 บรอดแคสต์ Push ส่งสำเร็จ</span>
              <div className="admin-stat-val" style={{ color: '#059669' }}>
                {broadcastLogs.reduce((sum, l) => sum + l.sentCount, 0).toLocaleString()} เครื่อง
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>อัตราเปิดอ่านเฉลี่ย 42.8%</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <span className="admin-stat-label">🎟️ คูปองส่วนลดกลาง Active</span>
              <div className="admin-stat-val" style={{ color: '#d97706' }}>
                {vouchers.filter(v => v.status === 'active').length} โค้ด
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ใช้ไปแล้ว 4,280 / 12,000 สิทธิ์</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <span className="admin-stat-label">⚡ Flash Sale สินค้าลดแรง</span>
              <div className="admin-stat-val" style={{ color: '#dc2626' }}>8 รายการ</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>รอบเวลา 20:00 - 24:00 น.</span>
            </div>
          </div>

          {/* Marketing Subtabs Segmented Strip */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="admin-segmented-strip">
              <button
                type="button"
                className={`admin-segmented-btn ${marketingSubTab === 'campaigns' ? 'admin-segmented-btn--active' : ''}`}
                onClick={() => setMarketingSubTab('campaigns')}
              >
                <Sparkles size={14} /> 👑 Super Brand Day & Mega Sales ({campaigns.length})
              </button>
              <button
                type="button"
                className={`admin-segmented-btn ${marketingSubTab === 'broadcast' ? 'admin-segmented-btn--active' : ''}`}
                onClick={() => setMarketingSubTab('broadcast')}
              >
                <BellRing size={14} /> 📢 Push Notification Broadcaster
              </button>
              <button
                type="button"
                className={`admin-segmented-btn ${marketingSubTab === 'vouchers' ? 'admin-segmented-btn--active' : ''}`}
                onClick={() => setMarketingSubTab('vouchers')}
              >
                <Ticket size={14} /> 🎟️ โค้ดคูปองกลางแพลตฟอร์ม ({vouchers.length})
              </button>
              <button
                type="button"
                className={`admin-segmented-btn ${marketingSubTab === 'flashsale' ? 'admin-segmented-btn--active' : ''}`}
                onClick={() => setMarketingSubTab('flashsale')}
              >
                <Flame size={14} /> ⚡ Flash Sale & Coin Rates
              </button>
            </div>
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
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>📋 ประวัติการยิง Broadcast ล่าสุด (Broadcast Logs)</h3>
                <div className="admin-table-container">
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
            </div>
          )}

          {/* 1.3 Platform Vouchers Engine Subtab */}
          {marketingSubTab === 'vouchers' && (
            <div className="admin-table-container">
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
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>เช็กอิน 7 วัน</span>
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

      {/* 📊 Overview Metrics & Executive Command Center */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Executive Header & Quick Filters */}
          <div className="admin-card" style={{ marginBottom: 0 }}>
            <div className="admin-card-header" style={{ marginBottom: 0 }}>
              <div>
                <h2 className="admin-card-title">📊 ศูนย์สั่งการและสถิติภาพรวมธุรกิจ (Movemall Executive Command Center)</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  รายงานสถิติแบบ Realtime ซิงค์ตรงจากฐานข้อมูล Supabase PostgreSQL & Redis Gateway
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 6, gap: 2 }}>
                  {['วันนี้ (Live)', '7 วันล่าสุด', '30 วันล่าสุด', 'ปี 2026'].map((period, idx) => (
                    <button
                      key={period}
                      type="button"
                      className="admin-btn-sm"
                      style={{
                        background: idx === 1 ? '#ffffff' : 'transparent',
                        color: idx === 1 ? '#0f172a' : '#64748b',
                        boxShadow: idx === 1 ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                        fontWeight: idx === 1 ? 700 : 500,
                      }}
                    >
                      {period}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="admin-btn-sm admin-btn-outline"
                  onClick={() => alert('ดาวน์โหลดรายงานสถิติ Movemall Business BI Report (CSV/Excel) เรียบร้อย')}
                >
                  📥 ส่งออกรายงาน (Export CSV)
                </button>
              </div>
            </div>
          </div>

          {/* 4 Main Hero KPI Cards */}
          <div className="admin-metrics-grid" style={{ marginBottom: 0 }}>
            <div className="admin-metric-card" style={{ borderTop: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div>
                  <span className="admin-metric-lbl">ยอดขายรวมสุทธิ (GMV)</span>
                  <h3 className="admin-metric-val" style={{ color: '#059669' }}>฿{metrics.gmv.toLocaleString()}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '1px 6px', borderRadius: 4 }}>
                      ▲ +18.4% WoW
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>เทียบสัปดาห์ก่อน</span>
                  </div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={24} color="#059669" />
                </div>
              </div>
            </div>

            <div className="admin-metric-card" style={{ borderTop: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div>
                  <span className="admin-metric-lbl">คำสั่งซื้อสำเร็จทั้งหมด</span>
                  <h3 className="admin-metric-val" style={{ color: '#1d4ed8' }}>{metrics.totalOrders.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ออเดอร์</span></h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '1px 6px', borderRadius: 4 }}>
                      ✓ 98.6% สำเร็จ
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>เฉลี่ย 488 ออเดอร์/วัน</span>
                  </div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={24} color="#2563eb" />
                </div>
              </div>
            </div>

            <div className="admin-metric-card" style={{ borderTop: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div>
                  <span className="admin-metric-lbl">สินค้าทั้งหมดในระบบ</span>
                  <h3 className="admin-metric-val" style={{ color: '#d97706' }}>{metrics.totalProducts.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>รายการ</span></h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '1px 6px', borderRadius: 4 }}>
                      🛡️ 100% อย./มอก.
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>AI Verified ผ่านเกณฑ์</span>
                  </div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={24} color="#d97706" />
                </div>
              </div>
            </div>

            <div className="admin-metric-card" style={{ borderTop: '4px solid #7c3aed' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div>
                  <span className="admin-metric-lbl">ร้านค้า & ครีเอเตอร์ทางการ</span>
                  <h3 className="admin-metric-val" style={{ color: '#6d28d9' }}>{metrics.totalStores} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ร้าน / 42 ครีเอเตอร์</span></h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '1px 6px', borderRadius: 4 }}>
                      👑 8 Official Mall
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>ตอบแชทเฉลี่ย 1.2 นาที</span>
                  </div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={24} color="#6d28d9" />
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Analytics Charts & Category Mix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
            {/* Column 1: Weekly Revenue Velocity Visual Chart */}
            <div className="admin-card" style={{ marginBottom: 0 }}>
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title" style={{ fontSize: '1rem' }}>📈 แนวโน้มยอดขาย & รายได้ 7 วันล่าสุด</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>แยกตามช่องทาง: Live Stream (ฟ้า) / Mall Brands (ม่วง) / สินค้าทั่วไป (เขียว)</span>
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>รวม ฿1.85M</span>
              </div>

              {/* CSS Bar Chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 180, gap: 12, padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                {[
                  { day: 'จันทร์', live: 35, mall: 45, general: 20, total: '฿210k' },
                  { day: 'อังคาร', live: 40, mall: 42, general: 18, total: '฿280k' },
                  { day: 'พุธ', live: 30, mall: 50, general: 20, total: '฿245k' },
                  { day: 'พฤหัส', live: 45, mall: 38, general: 17, total: '฿310k' },
                  { day: 'ศุกร์', live: 55, mall: 32, general: 13, total: '฿390k' },
                  { day: 'เสาร์', live: 60, mall: 28, general: 12, total: '฿450k' },
                  { day: 'อาทิตย์', live: 50, mall: 35, general: 15, total: '฿420k' },
                ].map(bar => (
                  <div key={bar.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>{bar.total}</span>
                    <div style={{ width: '100%', maxWidth: 36, display: 'flex', flexDirection: 'column', borderRadius: 4, overflow: 'hidden', height: `${(parseInt(bar.total.replace(/[^0-9]/g, '')) / 450) * 120}px` }}>
                      <div style={{ height: `${bar.live}%`, background: '#2563eb', transition: 'height 0.3s' }} title={`Live Stream: ${bar.live}%`} />
                      <div style={{ height: `${bar.mall}%`, background: '#7c3aed', transition: 'height 0.3s' }} title={`Mall Brands: ${bar.mall}%`} />
                      <div style={{ height: `${bar.general}%`, background: '#10b981', transition: 'height 0.3s' }} title={`ทั่วไป: ${bar.general}%`} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 6, fontWeight: 600 }}>{bar.day}</span>
                  </div>
                ))}
              </div>

              {/* Chart Legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#475569' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#2563eb' }} /> MOVEMALL LIVE (38%)
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#475569' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#7c3aed' }} /> Super Brand Mall (44%)
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#475569' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} /> Marketplace ทั่วไป (18%)
                </span>
              </div>
            </div>

            {/* Column 2: Category Mix & Market Share */}
            <div className="admin-card" style={{ marginBottom: 0 }}>
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title" style={{ fontSize: '1rem' }}>🛍️ สัดส่วนยอดขายตามหมวดหมู่สินค้า</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>สัดส่วนรายได้แยกตามประเภทสินค้าหลักในแพลตฟอร์ม</span>
                </div>
                <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontWeight: 600, color: '#475569' }}>
                  8 หมวดหมู่
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                {[
                  { name: 'สมาร์ทโฟน & แกดเจ็ต (Apple / Samsung)', percent: 38, amount: '฿704,596', color: '#2563eb' },
                  { name: 'แฟชั่น สปอร์ต & รองเท้า (Nike / Adidas)', percent: 24, amount: '฿445,008', color: '#7c3aed' },
                  { name: 'เครื่องใช้ไฟฟ้า & ไลฟ์สไตล์ (Dyson / Sony)', percent: 18, amount: '฿333,756', color: '#f59e0b' },
                  { name: 'ความงาม & ผลิตภัณฑ์ดูแลผิว (FDA Approved)', percent: 12, amount: '฿222,504', color: '#ec4899' },
                  { name: 'อาหารเสริม สุขภาพ & อื่นๆ', percent: 8, amount: '฿148,336', color: '#10b981' },
                ].map(cat => (
                  <div key={cat.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ color: '#1e293b' }}>{cat.name}</span>
                      <span style={{ color: '#0f172a', fontWeight: 700 }}>{cat.percent}% <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>({cat.amount})</span></span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${cat.percent}%`, height: '100%', background: cat.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4 Realtime Operations Pulses */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              ⚡ สถานะการดำเนินงาน & ความปลอดภัยแบบ Realtime (Operational Health)
            </h3>
            <div className="admin-stats-grid" style={{ marginBottom: 0 }}>
              <div className="admin-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">🔴 MOVEMALL LIVE & วิดีโอ</span>
                  <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>LIVE NOW</span>
                </div>
                <div className="admin-stat-val" style={{ color: '#dc2626' }}>6 ห้องสด</div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ผู้ชมพร้อมกัน 8,420 คน | 420 คำสั่งซื้อสด</span>
              </div>

              <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">🤖 AI FDA & TISI Shield</span>
                  <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>ACTIVE</span>
                </div>
                <div className="admin-stat-val" style={{ color: '#059669' }}>96.8% Match</div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>161 รายการสแกนผ่าน 0 ข้อพิพาทรุนแรง</span>
              </div>

              <div className="admin-stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">🚚 ขนส่ง & นำจ่ายพัสดุ (SLA)</span>
                  <span style={{ fontSize: '0.7rem', background: '#eff6ff', color: '#1d4ed8', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>ON TIME</span>
                </div>
                <div className="admin-stat-val" style={{ color: '#2563eb' }}>98.6%</div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>342 ชิ้นกำลังนำจ่าย | Flash, Kerry, EMS</span>
              </div>

              <div className="admin-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">💳 Movemall PayLater & PromptPay</span>
                  <span style={{ fontSize: '0.7rem', background: '#fffbeb', color: '#b45309', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>VERIFIED</span>
                </div>
                <div className="admin-stat-val" style={{ color: '#d97706' }}>฿482k</div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>วงเงินผ่อนชำระ 0% | หักภาษี 3% ถูกต้อง</span>
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="admin-card" style={{ marginBottom: 0 }}>
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title" style={{ fontSize: '1rem' }}>📦 ธุรกรรม & คำสั่งซื้อล่าสุด (Latest Platform Orders)</h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>ซิงค์ออเดอร์ล่าสุดแบบ Atomic Transaction</span>
              </div>
              <button
                type="button"
                className="admin-btn-sm admin-btn-outline"
                onClick={() => setActiveTab('finance')}
              >
                ดูทั้งหมดในแผนกการเงิน →
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>เลขออเดอร์</th>
                    <th>ลูกค้า</th>
                    <th>ร้านค้า</th>
                    <th>ยอดรวมสุทธิ</th>
                    <th>ช่องทางชำระ</th>
                    <th>สถานะออเดอร์</th>
                    <th>เวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'ORD-2026-9812', buyer: 'คุณสมชาย นามสมมุติ', store: 'Apple Official Store 🍎', total: 42900, method: 'PromptPay QR', status: 'PAID', time: '2 นาทีที่แล้ว' },
                    { id: 'ORD-2026-9811', buyer: 'คุณศศิธร พูนผล', store: 'Nike Thailand Official 👟', total: 4500, method: 'PayLater 0% (3 ด.)', status: 'SHIPPED', time: '8 นาทีที่แล้ว' },
                    { id: 'ORD-2026-9810', buyer: 'คุณกิตติศักดิ์ เจริญดี', store: 'Dyson Thailand 💨', total: 18900, method: 'บัตรเครดิต/เดบิต', status: 'PAID', time: '15 นาทีที่แล้ว' },
                    { id: 'ORD-2026-9809', buyer: 'คุณวรัญญา สุวรรณ', store: 'Samsung Thailand 📱', total: 34900, method: 'PromptPay QR', status: 'DELIVERED', time: '32 นาทีที่แล้ว' },
                    { id: 'ORD-2026-9808', buyer: 'คุณณัฐพล แสงแก้ว', store: 'TechPro Official Store 🎧', total: 1290, method: 'Movemall Coins + COD', status: 'PAID', time: '45 นาทีที่แล้ว' },
                  ].map(ord => (
                    <tr key={ord.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{ord.id}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{ord.buyer}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#475569' }}>{ord.store}</span>
                      </td>
                      <td>
                        <strong style={{ color: '#059669' }}>฿{ord.total.toLocaleString()}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                          {ord.method}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: ord.status === 'PAID' ? '#dcfce7' : ord.status === 'SHIPPED' ? '#eff6ff' : '#f3e8ff',
                            color: ord.status === 'PAID' ? '#15803d' : ord.status === 'SHIPPED' ? '#1d4ed8' : '#7e22ce',
                          }}
                        >
                          {ord.status === 'PAID' ? '✓ ชำระแล้ว' : ord.status === 'SHIPPED' ? '🚚 กำลังจัดส่ง' : '🎉 ส่งสำเร็จแล้ว'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{ord.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 📦 Catalog & Brand Mall Management */}
      {activeTab === 'catalog' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">📦 จัดการแคตตาล็อกสินค้า & อนุมัติตราป้ายแดง 👑 Official Mall</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                รับรองตราสินค้าทางการ การันตีของแท้ 100% คืนเงิน 2 เท่า และคืนสินค้าฟรี 30 วัน
              </span>
            </div>
          </div>

          {/* 4 Summary Stats */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
              <span className="admin-stat-label">👑 สินค้า Official Mall (ป้ายแดง)</span>
              <div className="admin-stat-val" style={{ color: '#dc2626' }}>
                {localProducts.filter(p => p.badge === 'mall' || p.isMall).length} รายการ
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ของแท้ 100% การันตี 3 ต่อ</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
              <span className="admin-stat-label">🛍️ สินค้า Marketplace ทั่วไป</span>
              <div className="admin-stat-val" style={{ color: '#2563eb' }}>
                {localProducts.filter(p => !(p.badge === 'mall' || p.isMall)).length} รายการ
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ผู้ขายอิสระและพาร์ทเนอร์</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
              <span className="admin-stat-label">🛡️ AI Verified (อย./มอก.)</span>
              <div className="admin-stat-val" style={{ color: '#059669' }}>100%</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>สแกนมาตรฐานผ่านเกณฑ์</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <span className="admin-stat-label">📦 สต็อกรวมทั้งระบบ</span>
              <div className="admin-stat-val" style={{ color: '#d97706' }}>12,850 ชิ้น</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>พร้อมจัดส่งทันที</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="admin-table-container">
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
                {localProducts.slice(0, 12).map(p => (
                  <tr key={p.id}>
                    <td>
                      <img src={p.images[0]} alt={p.name} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ID: {p.id}</div>
                    </td>
                    <td>
                      <strong style={{ color: '#059669' }}>฿{p.price.toLocaleString()}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, color: '#475569', fontWeight: 600 }}>
                        {p.category}
                      </span>
                    </td>
                    <td>
                      {p.badge === 'mall' || p.isMall ? (
                        <span style={{ background: '#fef2f2', color: '#dc2626', fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', border: '1px solid #fecaca' }}>
                          👑 Official Mall
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.75rem', background: '#f8fafc', padding: '2px 8px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                          ร้านค้าทั่วไป
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
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

          {/* Filters & Search Toolbar (Modern Segmented Strip) */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 16 }}>
            <div className="admin-segmented-strip">
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
                  type="button"
                  className={`admin-segmented-btn ${complianceFilter === f.key ? 'admin-segmented-btn--active' : ''}`}
                  onClick={() => setComplianceFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="admin-search-wrapper">
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="admin-search-input"
                placeholder="ค้นหาชื่อสินค้า, เลข อย., มอก...."
                value={complianceSearch}
                onChange={e => setComplianceSearch(e.target.value)}
              />
            </div>
          </div>

          {/* AI Compliance Table */}
          <div className="admin-table-container">
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
                            style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0f172a' }} title={r.productName}>
                              {r.productName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.storeName}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: r.certType.includes('FDA') ? '#ecfdf5' : r.certType.includes('TISI') ? '#eff6ff' : '#f8fafc',
                            color: r.certType.includes('FDA') ? '#059669' : r.certType.includes('TISI') ? '#2563eb' : '#475569',
                            border: `1px solid ${r.certType.includes('FDA') ? '#a7f3d0' : r.certType.includes('TISI') ? '#bfdbfe' : '#e2e8f0'}`,
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
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{r.licenseNumber || '-'}</div>
                        <div style={{ fontSize: '0.75rem', color: r.officialStatus === 'EXPIRED' ? '#ef4444' : '#64748b' }}>
                          หมดอายุ: {r.expiryDate}
                        </div>
                      </td>
                      <td>
                        {r.officialStatus === 'ACTIVE' && (
                          <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                            🟢 ACTIVE (ใช้ได้)
                          </span>
                        )}
                        {r.officialStatus === 'EXPIRED' && (
                          <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                            🟡 EXPIRED (หมดอายุ)
                          </span>
                        )}
                        {r.officialStatus === 'REVOKED' && (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                            🚫 REVOKED (เพิกถอน)
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 45, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${r.aiNameMatchScore}%`,
                                height: '100%',
                                background: r.aiNameMatchScore > 80 ? '#10b981' : r.aiNameMatchScore > 50 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: r.aiNameMatchScore > 80 ? '#10b981' : r.aiNameMatchScore > 50 ? '#f59e0b' : '#ef4444' }}>
                            {r.aiNameMatchScore}%
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {r.aiVisionLabelDetected ? '✓ พบฉลากในรูป' : '⚠️ ไม่พบฉลาก'}
                        </div>
                      </td>
                      <td style={{ maxWidth: 300 }}>
                        <div className="admin-insight-box">
                          {r.aiRecommendation}
                        </div>
                        {r.officialRegisteredName && r.officialRegisteredName !== r.productName && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>
                            ชื่อใน อย./มอก.: <em>{r.officialRegisteredName}</em>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {r.status !== 'VERIFIED_ACTIVE' ? (
                            <button
                              type="button"
                              className="admin-btn-sm admin-btn-primary"
                              onClick={() => handleApproveCompliance(r.productId)}
                              title="อนุมัติและมอบตรา Verified"
                            >
                              <CheckCircle2 size={13} /> อนุมัติ
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700 }}>
                              ✓ รับรองแล้ว
                            </span>
                          )}

                          {r.status !== 'REVOKED_BANNED' && (
                            <button
                              type="button"
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

      {/* 💳 Finance & Seller Payout Approvals */}
      {activeTab === 'finance' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">💳 ศูนย์การเงิน & อนุมัติถอนเงินร้านค้า (Finance & Seller Payouts)</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                ตรวจสอบคำขอถอนเงินรายได้ หักภาษี ณ ที่จ่าย 3% (e-WHT) และอนุมัติโอนเงินผ่านระบบธนาคารอัตโนมัติ
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="admin-btn-sm admin-btn-outline" onClick={() => alert('🔄 ซิงค์ข้อมูลกับ Payment Gateway เรียบร้อย')}>
                🔄 ซิงค์ Gateway
              </button>
              <button type="button" className="admin-btn-sm admin-btn-primary" onClick={() => alert('📥 ดาวน์โหลดรายงานภาษีและสรุปยอดโอนเงิน (CSV) สำเร็จ')}>
                📥 Export Payout CSV
              </button>
            </div>
          </div>

          {/* 4 Summary Stats */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <span className="admin-stat-label">⏳ ยอดถอนรออนุมัติ</span>
              <div className="admin-stat-val" style={{ color: '#d97706' }}>
                ฿{payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{payouts.filter(p => p.status === 'pending').length} รายการรอดำเนินการ</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
              <span className="admin-stat-label">✓ ยอดโอนสำเร็จเดือนนี้</span>
              <div className="admin-stat-val" style={{ color: '#059669' }}>฿1,850,000</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>โอนผ่าน PromptPay/SCB Open API</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
              <span className="admin-stat-label">🏛️ ภาษีหัก ณ ที่จ่าย 3% (e-WHT)</span>
              <div className="admin-stat-val" style={{ color: '#2563eb' }}>฿55,500</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>นำส่งกรมสรรพากร ภ.ง.ด. 53</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #7c3aed' }}>
              <span className="admin-stat-label">📈 รายได้ค่าคอมมิชชัน</span>
              <div className="admin-stat-val" style={{ color: '#6d28d9' }}>฿92,500</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Take Rate เฉลี่ย 5% GMV</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>รหัสคำขอ</th>
                  <th>ร้านค้า / ผู้ขาย</th>
                  <th>ธนาคาร & เลขบัญชี</th>
                  <th>ชื่อบัญชีรับเงิน</th>
                  <th>ยอดเงินถอนสุทธิ</th>
                  <th>สถานะการโอน</th>
                  <th style={{ textAlign: 'right' }}>ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{p.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.storeName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ร้านค้าทางการ Movemall</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#334155' }}>{p.bankName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{p.bankAccountNo}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#0f172a' }}>{p.accountName}</td>
                    <td>
                      <strong style={{ color: '#059669', fontSize: '0.95rem' }}>฿{p.amount.toLocaleString()}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>หัก WHT 3%: ฿{(p.amount * 0.03).toFixed(0)}</div>
                    </td>
                    <td>
                      {p.status === 'pending' ? (
                        <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                          ⏳ รออนุมัติ
                        </span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                          ✓ โอนเงินสำเร็จ
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {p.status === 'pending' ? (
                        <button
                          type="button"
                          className="admin-btn-sm admin-btn-primary"
                          onClick={() => handleApprovePayout(p.id)}
                        >
                          ✓ อนุมัติโอนเงิน
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={14} color="#10b981" /> สำเร็จ
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 💬 CS & Customer Dispute Resolution */}
      {activeTab === 'cs' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">💬 ฝ่ายบริการลูกค้า & ไกล่เกลี่ยข้อพิพาทคืนเงิน (Dispute Resolution)</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                ศูนย์กลางพิจารณาข้อพิพาทผู้ซื้อและร้านค้า: สินค้าไม่ตรงปก, ชำรุดแตกหัก, ได้รับของปลอม และไม่ได้รับสินค้า
              </span>
            </div>
          </div>

          {/* 4 Summary Stats */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <span className="admin-stat-label">🚨 ข้อพิพาทรอตัดสิน</span>
              <div className="admin-stat-val" style={{ color: '#dc2626' }}>
                {disputes.filter(d => d.status === 'open').length} เคส
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ผู้ซื้อและร้านค้ารอคำตัดสิน</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <span className="admin-stat-label">💰 ยอดเงินข้อพิพาทรวม</span>
              <div className="admin-stat-val" style={{ color: '#d97706' }}>
                ฿{disputes.reduce((sum, d) => sum + d.refundAmount, 0).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>อยู่ในระบบ Escrow Platform</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
              <span className="admin-stat-label">⏱️ ระยะเวลาไกล่เกลี่ยเฉลี่ย</span>
              <div className="admin-stat-val" style={{ color: '#059669' }}>2.4 ชม.</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>เป้าหมาย SLA &lt; 24 ชม.</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
              <span className="admin-stat-label">⭐ ความพึงพอใจการบริการ (CSAT)</span>
              <div className="admin-stat-val" style={{ color: '#2563eb' }}>99.2%</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>อัตราพึงพอใจฝ่ายบริการลูกค้า</span>
            </div>
          </div>

          {/* Dispute Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {disputes.map(d => (
              <div
                key={d.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', fontSize: '0.9rem' }}>
                        คำสั่งซื้อ #{d.orderId}
                      </span>
                      <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                        ⚠️ ขอเงินคืน
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      👤 ผู้ซื้อ: <strong>{d.buyerName}</strong> &bull; 🏪 ร้านค้า: <strong>{d.storeName}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#dc2626' }}>
                      ฿{d.refundAmount.toLocaleString()}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>ยอดขอรับเงินคืน</span>
                  </div>
                </div>

                <div className="admin-insight-box" style={{ borderLeftColor: '#f59e0b' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>เหตุผลที่ขอคืนเงิน:</span> {d.reason}
                </div>

                {d.status === 'open' ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="admin-btn-sm admin-btn-primary"
                      onClick={() => handleResolveDispute(d.id, 'refund_buyer')}
                    >
                      ✓ อนุมัติคืนเงินเข้าผู้ซื้อ (Refund Buyer)
                    </button>
                    <button
                      type="button"
                      className="admin-btn-sm admin-btn-outline"
                      onClick={() => handleResolveDispute(d.id, 'payout_seller')}
                    >
                      ยกเลิกคำร้อง &amp; โอนเงินเข้าร้านค้า (Payout Seller)
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.78rem', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                      ✓ ตัดสินเคสเรียบร้อยแล้ว ({d.status})
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🚚 Logistics & Courier SLA Control */}
      {activeTab === 'logistics' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">🚚 ศูนย์ควบคุมระบบขนส่ง &amp; โลจิสติกส์ (Logistics &amp; Courier SLA Control)</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                ติดตามสถานะนำจ่ายพัสดุแบบ Realtime, ประสานงานพาร์ทเนอร์ขนส่ง และตรวจสอบ SLA การจัดส่งทั่วประเทศ
              </span>
            </div>
          </div>

          {/* 4 Summary Stats */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
              <span className="admin-stat-label">🚚 พัสดุกำลังนำจ่ายวันนี้</span>
              <div className="admin-stat-val" style={{ color: '#2563eb' }}>342 ชิ้น</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>กระจายส่งทั่ว 77 จังหวัด</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
              <span className="admin-stat-label">⏱️ อัตราจัดส่งตรงเวลา (SLA)</span>
              <div className="admin-stat-val" style={{ color: '#059669' }}>99.4%</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>เฉลี่ย 1.8 วันทำการ</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #7c3aed' }}>
              <span className="admin-stat-label">📦 พัสดุระหว่างทาง (In-Transit)</span>
              <div className="admin-stat-val" style={{ color: '#6d28d9' }}>1,280 ชิ้น</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>เชื่อมต่อ Realtime GPS Tracking</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <span className="admin-stat-label">⚠️ พัสดุติดปัญหา (Exception)</span>
              <div className="admin-stat-val" style={{ color: '#d97706' }}>0 ชิ้น</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ไม่มีรายงานพัสดุสูญหาย</span>
            </div>
          </div>

          {/* Courier Partners Table */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>พาร์ทเนอร์ขนส่ง</th>
                  <th>พัสดุในระบบวันนี้</th>
                  <th>อัตราส่งตรงเวลา (SLA)</th>
                  <th>ความเร็วเฉลี่ย</th>
                  <th>สถานะ API Gateway</th>
                  <th style={{ textAlign: 'right' }}>ประสิทธิภาพ</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: '⚡ Flash Express', parcels: '142 ชิ้น', sla: 99.6, speed: '1.6 วัน', status: 'ONLINE', badge: '#2563eb' },
                  { name: '📦 Kerry Express (KEX)', parcels: '98 ชิ้น', sla: 99.2, speed: '1.8 วัน', status: 'ONLINE', badge: '#f97316' },
                  { name: '🔴 SPX Express (Shopee Logistics)', parcels: '68 ชิ้น', sla: 99.5, speed: '1.7 วัน', status: 'ONLINE', badge: '#ef4444' },
                  { name: '📮 Thailand Post EMS', parcels: '34 ชิ้น', sla: 98.9, speed: '2.1 วัน', status: 'ONLINE', badge: '#dc2626' },
                ].map(courier => (
                  <tr key={courier.name}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{courier.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Integrated Courier Partner</div>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{courier.parcels}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${courier.sla}%`, height: '100%', background: '#10b981' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>{courier.sla}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#475569' }}>{courier.speed}</td>
                    <td>
                      <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700 }}>
                        ● {courier.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>ดีเยี่ยม (Top Tier)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🛡️ Moderation, Trust Scores & Safety Enforcement */}
      {activeTab === 'moderation' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">🛡️ ศูนย์ความปลอดภัย & ระงับผู้กระทำผิด (Trust, Suspension & Anti-Fraud Center)</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                จัดการและลงโทษผู้ใช้/ร้านค้าที่ทำผิดกฎ: สั่งแล้วไม่รับของ (COD Reject), สั่งเล่น, ขอเงินคืนโดยไม่คืนสินค้า และส่งของปลอม
              </span>
            </div>
            <div className="admin-segmented-strip">
              <button
                type="button"
                className={`admin-segmented-btn ${moderationSubTab === 'users' ? 'admin-segmented-btn--active' : ''}`}
                onClick={() => setModerationSubTab('users')}
              >
                <Users size={14} /> ผู้ใช้งาน & Trust Score ({moderatedUsers.length})
              </button>
              <button
                type="button"
                className={`admin-segmented-btn ${moderationSubTab === 'stores' ? 'admin-segmented-btn--active' : ''}`}
                onClick={() => setModerationSubTab('stores')}
              >
                <StoreIcon size={14} /> ร้านค้า & บทลงโทษ ({moderatedStores.length})
              </button>
              <button
                type="button"
                className={`admin-segmented-btn ${moderationSubTab === 'reports' ? 'admin-segmented-btn--active' : ''}`}
                onClick={() => setModerationSubTab('reports')}
              >
                <AlertTriangle size={14} /> รายงานการฉ้อโกง & COD ({violationReports.length})
              </button>
            </div>
          </div>

          {/* 4 Summary Stats */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
              <span className="admin-stat-label">🛡️ ผู้ซื้อความน่าเชื่อถือสูง (Trust Score 80-100)</span>
              <div className="admin-stat-val" style={{ color: '#059669' }}>
                {moderatedUsers.filter(u => u.trustScore >= 80).length} คน
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>สั่งซื้อปกติ ไม่มีประวัติปฏิเสธรับ</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <span className="admin-stat-label">🚫 ผู้ซื้อถูกตัดสิทธิ์ COD</span>
              <div className="admin-stat-val" style={{ color: '#dc2626' }}>
                {moderatedUsers.filter(u => u.status === 'COD_RESTRICTED').length} คน
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>มีประวัติปฏิเสธรับของซ้ำซ้อน</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
              <span className="admin-stat-label">🏪 ร้านค้าสุขภาพดีเยี่ยม</span>
              <div className="admin-stat-val" style={{ color: '#2563eb' }}>
                {moderatedStores.filter(s => s.healthScore >= 80).length} ร้าน
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>อัตราส่งตรงเวลา 98%+</span>
            </div>

            <div className="admin-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <span className="admin-stat-label">⚖️ รายงานฉ้อโกงรอตัดสิน</span>
              <div className="admin-stat-val" style={{ color: '#d97706' }}>
                {violationReports.filter(r => r.status === 'PENDING' || r.status === 'INVESTIGATING').length} เคส
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ฝ่าย Super Admin ตรวจสอบ</span>
            </div>
          </div>

          {/* 👤 SubTab 1: Moderated Users & Buyer Trust Scores */}
          {moderationSubTab === 'users' && (
            <div style={{ marginTop: '1.25rem' }}>
              {/* Filter and Search Bar */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="admin-search-wrapper" style={{ flex: 1, minWidth: 260, maxWidth: 400 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="ค้นหาชื่อ, เบอร์โทร, หรืออีเมลผู้ซื้อ..."
                    value={userSearchText}
                    onChange={e => setUserSearchText(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>สถานะ:</span>
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: '0.82rem', border: '1px solid #e2e8f0' }}
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
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ข้อมูลผู้ใช้งาน</th>
                      <th>คะแนนความน่าเชื่อถือ (Trust Score)</th>
                      <th>สถิติ COD / ไม่รับของ</th>
                      <th>เคลมเงินคืนเท็จ</th>
                      <th>สถานะบัญชี</th>
                      <th style={{ textAlign: 'right' }}>การดำเนินการ</th>
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
                          <tr key={user.id}>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{user.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                📞 {user.phone} • ✉️ {user.email}
                              </div>
                              {user.suspensionReason && (
                                <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 4, background: '#fef2f2', padding: '2px 6px', borderRadius: 4 }}>
                                  ⚠️ หมายเหตุ: {user.suspensionReason}
                                </div>
                              )}
                            </td>
                            <td>
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
                                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>เต็ม 100 คะแนน</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                สำเร็จ: <span style={{ color: user.codSuccessRate >= 90 ? '#10b981' : '#dc2626', fontWeight: 700 }}>{user.codSuccessRate}%</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: user.codRejectedCount > 0 ? '#dc2626' : '#64748b', fontWeight: user.codRejectedCount > 0 ? 700 : 400 }}>
                                ปฏิเสธไม่รับของ: {user.codRejectedCount} ครั้ง
                              </div>
                            </td>
                            <td>
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
                            <td>
                              {user.status === 'ACTIVE' && (
                                <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                                  ปกติ (Active)
                                </span>
                              )}
                              {user.status === 'WARNING' && (
                                <span style={{ fontSize: '0.75rem', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                                  ⚠️ ตักเตือน (Warning)
                                </span>
                              )}
                              {user.status === 'COD_RESTRICTED' && (
                                <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                                  🚫 ตัดสิทธิ์ COD
                                </span>
                              )}
                              {(user.status === 'SUSPENDED' || user.status === 'BANNED') && (
                                <span style={{ fontSize: '0.75rem', background: '#0f172a', color: '#ffffff', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                                  ⛔ ระงับบัญชี (Banned)
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  className="admin-btn-sm admin-btn-outline"
                                  title="สลับสิทธิ์การเก็บเงินปลายทาง"
                                  onClick={() => handleQuickToggleUserCod(user)}
                                >
                                  {user.status === 'COD_RESTRICTED' ? 'ปลดบล็อก COD' : 'บล็อก COD'}
                                </button>
                                <button
                                  type="button"
                                  className={`admin-btn-sm ${user.status === 'SUSPENDED' || user.status === 'BANNED' ? 'admin-btn-success' : 'admin-btn-outline'}`}
                                  style={{ color: user.status === 'SUSPENDED' ? '#fff' : '#ef4444', borderColor: '#fca5a5' }}
                                  title="ระงับการเข้าใช้ระบบ"
                                  onClick={() => handleQuickToggleUserBan(user)}
                                >
                                  {user.status === 'SUSPENDED' || user.status === 'BANNED' ? 'ปลดแบน' : 'ระงับบัญชี'}
                                </button>
                                <button
                                  type="button"
                                  className="admin-btn-sm admin-btn-primary"
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

      {/* 👑 RBAC Team Admin (Full Enterprise Console) */}
      {activeTab === 'team' && (
        <div>
          {/* Header Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">👑 จัดการสิทธิ์ทีมงาน & กำหนดบทบาท (Role-Based Access Control)</h2>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  ควบคุมสิทธิ์การเข้าถึงข้อมูลของเจ้าหน้าที่แต่ละแผนกงานอย่างละเอียด (Granular RBAC Permissions & Audit Trail)
                </span>
              </div>
              <button
                type="button"
                className="admin-btn-sm admin-btn-primary"
                onClick={() => setShowAddTeamModal(true)}
              >
                <Plus size={14} /> + เพิ่มทีมงาน Admin ใหม่
              </button>
            </div>

            {/* 4 Summary Cards */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card" style={{ borderLeft: '4px solid #7c3aed' }}>
                <span className="admin-stat-label">👑 ผู้ดูแลระบบสูงสุด (Super Admins)</span>
                <div className="admin-stat-val" style={{ color: '#7c3aed' }}>
                  {teamMembers.filter(m => m.role === 'SUPER_ADMIN').length} คน
                </div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>สิทธิ์เต็มทุกระบบ ควบคุมฐานข้อมูล</span>
              </div>

              <div className="admin-stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
                <span className="admin-stat-label">🏢 เจ้าหน้าที่ปฏิบัติการ (Operations)</span>
                <div className="admin-stat-val" style={{ color: '#2563eb' }}>
                  {teamMembers.filter(m => m.role === 'MARKETING_ADMIN' || m.role === 'CATALOG_ADMIN' || m.role === 'LOGISTICS_ADMIN').length} คน
                </div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>การตลาด, สินค้า Mall และขนส่ง</span>
              </div>

              <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                <span className="admin-stat-label">💵 การเงิน & บัญชี (Finance)</span>
                <div className="admin-stat-val" style={{ color: '#10b981' }}>
                  {teamMembers.filter(m => m.role === 'FINANCE_ADMIN').length} คน
                </div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>อนุมัติถอนเงินร้านค้า & ภาษี หัก ณ ที่จ่าย</span>
              </div>

              <div className="admin-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <span className="admin-stat-label">🛡️ ตรวจสอบ & CS (Trust & Safety)</span>
                <div className="admin-stat-val" style={{ color: '#f59e0b' }}>
                  {teamMembers.filter(m => m.role === 'MODERATOR' || m.role === 'CS_ADMIN').length} คน
                </div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>ดูแลข้อพิพาท & ตรวจจับมิจฉาชีพ</span>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { key: 'ALL', label: 'ทั้งหมด' },
                  { key: 'SUPER_ADMIN', label: '👑 Super Admin' },
                  { key: 'MARKETING_ADMIN', label: '🎯 การตลาด' },
                  { key: 'FINANCE_ADMIN', label: '💵 การเงิน' },
                  { key: 'CATALOG_ADMIN', label: '📦 สินค้า & Mall' },
                  { key: 'MODERATOR', label: '🛡️ ตรวจจับโกง' },
                  { key: 'CS_ADMIN', label: '🎧 ฝ่าย CS' },
                  { key: 'LOGISTICS_ADMIN', label: '🚚 ขนส่ง' },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    className={`admin-btn-sm ${teamRoleFilter === f.key ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                    onClick={() => setTeamRoleFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', width: 260 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ หรือ อีเมลเจ้าหน้าที่..."
                  value={teamSearchQuery}
                  onChange={e => setTeamSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 12px 6px 30px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Team Members Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>เจ้าหน้าที่</th>
                    <th>แผนกงาน</th>
                    <th>บทบาทสิทธิ์ (RBAC Role)</th>
                    <th>ขอบเขตสิทธิ์ (Permissions)</th>
                    <th>สถานะ</th>
                    <th>ใช้งานล่าสุด</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers
                    .filter(m => {
                      if (teamRoleFilter !== 'ALL' && m.role !== teamRoleFilter) return false;
                      if (teamSearchQuery.trim()) {
                        const q = teamSearchQuery.toLowerCase();
                        return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.department.toLowerCase().includes(q);
                      }
                      return true;
                    })
                    .map(member => (
                      <tr key={member.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                            />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{member.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                            {member.department}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 8px',
                              borderRadius: 4,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background:
                                member.role === 'SUPER_ADMIN'
                                  ? '#f5f3ff'
                                  : member.role === 'FINANCE_ADMIN'
                                  ? '#ecfdf5'
                                  : member.role === 'MARKETING_ADMIN'
                                  ? '#eff6ff'
                                  : member.role === 'MODERATOR'
                                  ? '#fff1f2'
                                  : '#f8fafc',
                              color:
                                member.role === 'SUPER_ADMIN'
                                  ? '#7c3aed'
                                  : member.role === 'FINANCE_ADMIN'
                                  ? '#059669'
                                  : member.role === 'MARKETING_ADMIN'
                                  ? '#2563eb'
                                  : member.role === 'MODERATOR'
                                  ? '#e11d48'
                                  : '#475569',
                              border: `1px solid ${
                                member.role === 'SUPER_ADMIN'
                                  ? '#ddd6fe'
                                  : member.role === 'FINANCE_ADMIN'
                                  ? '#a7f3d0'
                                  : member.role === 'MARKETING_ADMIN'
                                  ? '#bfdbfe'
                                  : '#e2e8f0'
                              }`,
                            }}
                          >
                            {member.role}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 280 }}>
                            {member.permissions.map(perm => (
                              <span
                                key={perm}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  border: '1px solid #e2e8f0',
                                }}
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: member.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                              color: member.status === 'ACTIVE' ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {member.status === 'ACTIVE' ? '🟢 เปิดใช้งาน' : '🔴 พักงาน'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{member.lastActive}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              className="admin-btn-sm admin-btn-outline"
                              onClick={() => setEditingTeamMember(member)}
                              title="แก้ไขสิทธิ์"
                            >
                              แก้ไขสิทธิ์
                            </button>
                            {member.role !== 'SUPER_ADMIN' && (
                              <button
                                type="button"
                                className={`admin-btn-sm ${member.status === 'ACTIVE' ? 'admin-btn-danger' : 'admin-btn-success'}`}
                                onClick={() => {
                                  setTeamMembers(prev =>
                                    prev.map(m =>
                                      m.id === member.id
                                        ? { ...m, status: m.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
                                        : m
                                    )
                                  );
                                }}
                              >
                                {member.status === 'ACTIVE' ? 'พักงาน' : 'เปิดใช้งาน'}
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
        </div>
      )}

      {/* ── Modal: Add New Team Member ── */}
      {showAddTeamModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>👥 เพิ่มเจ้าหน้าที่ทีมงาน Admin ใหม่</h3>
              <button onClick={() => setShowAddTeamModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!newTeamMemberForm.name || !newTeamMemberForm.email) {
                  alert('กรุณากรอกชื่อและอีเมล');
                  return;
                }

                const rolePermissionsMap: Record<AdminTeamMember['role'], string[]> = {
                  SUPER_ADMIN: ['ALL_PERMISSIONS', 'DATABASE_ROOT', 'FINANCIAL_RELEASE'],
                  MARKETING_ADMIN: ['CAMPAIGN_CREATE', 'PUSH_BROADCAST', 'VOUCHER_MANAGE'],
                  FINANCE_ADMIN: ['PAYOUT_APPROVE', 'VAT_TAX_AUDIT', 'REFUND_SETTLEMENT'],
                  CATALOG_ADMIN: ['MALL_VERIFICATION', 'PRODUCT_SUPPRESS', 'AI_FDA_OVERRIDE'],
                  MODERATOR: ['FRAUD_INVESTIGATION', 'BUYER_TRUST_SCORE', 'STORE_PENALTY'],
                  CS_ADMIN: ['DISPUTE_MEDIATION', 'REFUND_PROCESS', 'CHAT_SUPPORT'],
                  LOGISTICS_ADMIN: ['COURIER_DISPATCH', 'GPS_FLEET_MONITOR', 'SLA_TRACKING'],
                };

                const newMember: AdminTeamMember = {
                  id: `staff-${Date.now()}`,
                  name: newTeamMemberForm.name.trim(),
                  email: newTeamMemberForm.email.trim(),
                  department: newTeamMemberForm.department,
                  role: newTeamMemberForm.role,
                  permissions: rolePermissionsMap[newTeamMemberForm.role] || ['BASIC_VIEW'],
                  status: 'ACTIVE',
                  avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newTeamMemberForm.name)}`,
                  lastActive: 'เพิ่มใหม่เมื่อสักครู่',
                };

                setTeamMembers(prev => [newMember, ...prev]);
                setShowAddTeamModal(false);
                setNewTeamMemberForm({
                  name: '',
                  email: '',
                  department: 'ฝ่ายการตลาด & แคมเปญ',
                  role: 'MARKETING_ADMIN',
                  initialPassword: '',
                });
                alert(`เพิ่มเจ้าหน้าที่ "${newMember.name}" เรียบร้อยแล้ว! พร้อมเข้าใช้งานด้วยสิทธิ์ ${newMember.role}`);
              }}
            >
              <div className="form-group">
                <label className="form-label">ชื่อ-นามสกุล เจ้าหน้าที่</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น: ภานุมาศ เจริญรัตน์"
                  value={newTeamMemberForm.name}
                  onChange={e => setNewTeamMemberForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">อีเมลองค์กร (Company Email)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="เช่น: panumas.c@movemall.com"
                  value={newTeamMemberForm.email}
                  onChange={e => setNewTeamMemberForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">แผนกงาน (Department)</label>
                  <select
                    className="form-select"
                    value={newTeamMemberForm.department}
                    onChange={e => setNewTeamMemberForm(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="ฝ่ายการตลาด & แคมเปญ">ฝ่ายการตลาด & แคมเปญ</option>
                    <option value="ฝ่ายการเงิน & บัญชี">ฝ่ายการเงิน & บัญชี</option>
                    <option value="ฝ่ายสินค้า & แบรนด์ Mall">ฝ่ายสินค้า & แบรนด์ Mall</option>
                    <option value="ฝ่ายความปลอดภัย & ป้องกันโกง">ฝ่ายความปลอดภัย & ป้องกันโกง</option>
                    <option value="ฝ่ายบริการลูกค้า (CS)">ฝ่ายบริการลูกค้า (CS)</option>
                    <option value="ฝ่ายขนส่ง & โลจิสติกส์">ฝ่ายขนส่ง & โลจิสติกส์</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">บทบาทสิทธิ์ (RBAC Role)</label>
                  <select
                    className="form-select"
                    value={newTeamMemberForm.role}
                    onChange={e => setNewTeamMemberForm(prev => ({ ...prev, role: e.target.value as any }))}
                  >
                    <option value="MARKETING_ADMIN">🎯 MARKETING_ADMIN</option>
                    <option value="FINANCE_ADMIN">💵 FINANCE_ADMIN</option>
                    <option value="CATALOG_ADMIN">📦 CATALOG_ADMIN</option>
                    <option value="MODERATOR">🛡️ MODERATOR</option>
                    <option value="CS_ADMIN">🎧 CS_ADMIN</option>
                    <option value="LOGISTICS_ADMIN">🚚 LOGISTICS_ADMIN</option>
                    <option value="SUPER_ADMIN">👑 SUPER_ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">รหัสผ่านเริ่มต้น (Initial Temporary Password)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น: MovemallPass2026!"
                  value={newTeamMemberForm.initialPassword}
                  onChange={e => setNewTeamMemberForm(prev => ({ ...prev, initialPassword: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="admin-btn-sm admin-btn-primary" style={{ flex: 1, padding: '0.65rem', justifyContent: 'center' }}>
                  บันทึก & มอบสิทธิ์เจ้าหน้าที่
                </button>
                <button type="button" className="admin-btn-sm admin-btn-outline" onClick={() => setShowAddTeamModal(false)}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Team Member Role & Permissions ── */}
      {editingTeamMember && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>✏️ แก้ไขสิทธิ์เจ้าหน้าที่: {editingTeamMember.name}</h3>
              <button onClick={() => setEditingTeamMember(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                setTeamMembers(prev =>
                  prev.map(m => (m.id === editingTeamMember.id ? editingTeamMember : m))
                );
                setEditingTeamMember(null);
                alert(`อัปเดตสิทธิ์ของ "${editingTeamMember.name}" เรียบร้อยแล้ว!`);
              }}
            >
              <div className="form-group">
                <label className="form-label">บทบาทสิทธิ์ (Role)</label>
                <select
                  className="form-select"
                  value={editingTeamMember.role}
                  onChange={e => setEditingTeamMember(prev => prev ? { ...prev, role: e.target.value as any } : null)}
                >
                  <option value="SUPER_ADMIN">👑 SUPER_ADMIN (ผู้ดูแลระบบสูงสุด)</option>
                  <option value="MARKETING_ADMIN">🎯 MARKETING_ADMIN (การตลาด & แคมเปญ)</option>
                  <option value="FINANCE_ADMIN">💵 FINANCE_ADMIN (การเงิน & Payouts)</option>
                  <option value="CATALOG_ADMIN">📦 CATALOG_ADMIN (สินค้า & แบรนด์ Mall)</option>
                  <option value="MODERATOR">🛡️ MODERATOR (ความปลอดภัย & ตรวจจับโกง)</option>
                  <option value="CS_ADMIN">🎧 CS_ADMIN (บริการลูกค้า & ข้อพิพาท)</option>
                  <option value="LOGISTICS_ADMIN">🚚 LOGISTICS_ADMIN (ขนส่ง & โลจิสติกส์)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">แผนกงาน (Department)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingTeamMember.department}
                  onChange={e => setEditingTeamMember(prev => prev ? { ...prev, department: e.target.value } : null)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="admin-btn-sm admin-btn-primary" style={{ flex: 1, padding: '0.65rem', justifyContent: 'center' }}>
                  บันทึกการเปลี่ยนแปลงสิทธิ์
                </button>
                <button type="button" className="admin-btn-sm admin-btn-outline" onClick={() => setEditingTeamMember(null)}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
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
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminPortalPage;

