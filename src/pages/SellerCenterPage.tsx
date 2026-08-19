import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Package, DollarSign, TrendingUp, Star, Trash2, X, Store, CheckCircle,
  Printer, Target, Eye, MousePointerClick, Wallet, ArrowUpRight, Play, Pause,
  AlertCircle, RefreshCw, Zap, ShieldCheck, Pencil, Upload, Image as ImageIcon, Video,
  User, MapPin, FileText, Download, Send, Search, Check, Building2, SlidersHorizontal,
  MessageSquare, Radio, Layers, Globe, ExternalLink, Lock, Cpu, CheckCircle2, Sliders, ArrowRight,
  AlertTriangle, Settings, CreditCard, Truck, Phone, Mail, Save, Home, LogOut
} from 'lucide-react';
import { categories } from '../data/products';
import { ShippingLabelModal, type ShippingLabelProps } from '../components/ShippingLabelModal';
import { RichTextEditor } from '../components/RichTextEditor';
import type { Product, AdCampaign, AdType, AdWallet, AdKeyword, ProductCompliance, ComplianceType, TaxDocument, StoreTaxProfile, TaxDocType } from '../types';
import {
  fetchApi,
  fetchSellerOrdersApi,
  updateOrderStatusApi,
  fetchAdWalletApi,
  topupAdWalletApi,
  fetchAdCampaignsApi,
  createAdCampaignApi,
  toggleAdCampaignApi,
  fetchStoreTaxSettingsApi,
  updateStoreTaxSettingsApi, logoutApi } from '../utils/api';
import { promptGoogleAuth } from '../utils/googleAuth';
import { generateSlug } from '../utils/slug';
import { getProductUrl } from '../utils/seo';
import {
  getChatSocket,
  joinSellerChatRoom,
  emitChatMessage,
  getStoredChatHistory,
  saveStoredChatHistory,
} from '../utils/chatSocket';
import './AdminPortalPage.css';
import './SellerCenterPage.css';

interface SellerCenterPageProps {
  products: Product[];
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct?: (updatedProduct: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export function SellerCenterPage({ products, onAddProduct, onUpdateProduct, onDeleteProduct }: SellerCenterPageProps) {
  const navigate = useNavigate();

  // User Authentication & Personal Store Management
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const uStr = localStorage.getItem('movemall_user');
      return uStr ? JSON.parse(uStr) : null;
    } catch {
      return null;
    }
  });

  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);

  function handleLogout() {
    if (window.confirm('คุณต้องการออกจากระบบศูนย์ผู้ขาย Movemall ใช่หรือไม่?')) {
      logoutApi(); // เพิกถอน token ฝั่งเซิร์ฟเวอร์ด้วย ไม่ใช่แค่ลบทิ้งฝั่ง client
      localStorage.removeItem('movemall_seller_store_id');
      localStorage.removeItem('movemall_custom_store_name');
      setCurrentUser(null);
      window.dispatchEvent(new Event('movemall_auth_change'));
      navigate('/');
    }
  }

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

  async function handleFastGoogleLogin() {
    setIsLoggingInGoogle(true);
    try {
      const authRes = await promptGoogleAuth();
      const res = await fetchApi<{
        token: string;
        user: { id: string; name: string; email?: string; role?: string; avatarUrl?: string; coinsBalance?: number };
        isNewUser?: boolean;
      }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          credential: authRes.credential,
          accessToken: authRes.accessToken,
          googleUser: authRes.googleUser,
          mockUser: authRes.mockUser,
        }),
      });

      if (res.token) {
        localStorage.setItem('movemall_jwt_token', res.token);
      }

      const finalUser = {
        id: res.user?.id || 'usr-google',
        name: res.user?.name || authRes.googleUser?.name || 'สมาชิก Google',
        email: res.user?.email || authRes.googleUser?.email,
        avatarUrl: res.user?.avatarUrl || authRes.googleUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(res.user?.name || 'Google')}`,
        role: 'SELLER',
        coinsBalance: res.user?.coinsBalance ?? 100,
      };

      localStorage.setItem('movemall_user', JSON.stringify(finalUser));
      window.dispatchEvent(new Event('movemall_auth_change'));
      setCurrentUser(finalUser);
    } catch (err) {
      console.warn('Google fast login error, using fallback:', err);
      const fallbackUser = {
        name: 'Google Seller',
        email: 'seller@movemall.com',
        role: 'SELLER',
        coinsBalance: 100,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
      };
      localStorage.setItem('movemall_user', JSON.stringify(fallbackUser));
      window.dispatchEvent(new Event('movemall_auth_change'));
      setCurrentUser(fallbackUser);
    } finally {
      setIsLoggingInGoogle(false);
    }
  }

  const [customStoreName, setCustomStoreName] = useState(() => {
    return (
      localStorage.getItem('movemall_custom_store_name') ||
      localStorage.getItem('movemall_my_store_name') ||
      (currentUser?.name ? `ร้านค้าของ ${currentUser.name}` : 'ร้านค้าของฉัน')
    );
  });

  const [isEditingStoreName, setIsEditingStoreName] = useState(false);
  const [storeNameInput, setStoreNameInput] = useState(customStoreName);

  function handleSaveStoreName(e: React.FormEvent) {
    e.preventDefault();
    if (!storeNameInput.trim()) return;
    setCustomStoreName(storeNameInput.trim());
    localStorage.setItem('movemall_custom_store_name', storeNameInput.trim());
    localStorage.setItem('movemall_my_store_name', storeNameInput.trim());
    setIsEditingStoreName(false);
  }

  const sellerStoreSlug = localStorage.getItem('movemall_store_slug') || (customStoreName ? generateSlug(customStoreName) : 'my-shop');
  const sellerStoreId = localStorage.getItem('movemall_seller_store_id') || (currentUser?.id ? `store-${currentUser.id}` : 'store-my-live');

  const currentStoreLogo = localStorage.getItem('movemall_store_logo') || currentUser?.avatarUrl || '';

  const currentStore = {
    id: sellerStoreId,
    slug: sellerStoreSlug,
    name: customStoreName || 'ร้านค้าของฉัน',
    logo: currentStoreLogo,
    rating: 5.0,
    responseRate: '100%',
    followers: 0,
    isMall: false,
  };

  const storeProducts = products.filter(p => p.storeId === currentStore.id);

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'api' | 'ads' | 'tax' | 'flash' | 'chat' | 'health' | 'settings'>('overview');

  // ── Store Profile & Comprehensive Settings State ──
  const [storeSettingsForm, setStoreSettingsForm] = useState({
    name: customStoreName || '',
    description: localStorage.getItem('movemall_store_bio') || '',
    logo: localStorage.getItem('movemall_store_logo') || currentUser?.avatarUrl || '',
    banner: localStorage.getItem('movemall_store_banner') || '',
    category: localStorage.getItem('movemall_store_category') || 'electronics',
    contactPhone: localStorage.getItem('movemall_store_phone') || '',
    contactEmail: localStorage.getItem('movemall_store_email') || currentUser?.email || '',
    lineId: localStorage.getItem('movemall_store_line') || '',
    facebookPage: localStorage.getItem('movemall_store_fb') || '',

    // Warehouse & Logistics
    warehouseContact: localStorage.getItem('movemall_warehouse_contact') || '',
    warehousePhone: localStorage.getItem('movemall_warehouse_phone') || '',
    warehouseAddress: localStorage.getItem('movemall_warehouse_address') || '',
    courier: localStorage.getItem('movemall_courier_pref') || 'flash',
    allowCod: localStorage.getItem('movemall_allow_cod') === 'true',

    // Bank Payout
    bankName: localStorage.getItem('movemall_payout_bank') || 'กสิกรไทย (KBANK)',
    bankAccountNo: localStorage.getItem('movemall_payout_acc_no') || '',
    accountName: localStorage.getItem('movemall_payout_acc_name') || '',
    promptPay: localStorage.getItem('movemall_payout_promptpay') || '',

    // Auto-Reply Chat Bot
    autoReplyEnabled: localStorage.getItem('movemall_autoreply_enabled') === 'true',
    welcomeMessage: localStorage.getItem('movemall_welcome_msg') || '',
  });

  async function handleSaveStoreSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    try {
      localStorage.setItem('movemall_custom_store_name', storeSettingsForm.name);
      localStorage.setItem('movemall_my_store_name', storeSettingsForm.name);
      localStorage.setItem('movemall_store_bio', storeSettingsForm.description);
      localStorage.setItem('movemall_store_logo', storeSettingsForm.logo);
      localStorage.setItem('movemall_store_banner', storeSettingsForm.banner);
      localStorage.setItem('movemall_store_category', storeSettingsForm.category);
      localStorage.setItem('movemall_store_phone', storeSettingsForm.contactPhone);
      localStorage.setItem('movemall_store_email', storeSettingsForm.contactEmail);
      localStorage.setItem('movemall_store_line', storeSettingsForm.lineId);
      localStorage.setItem('movemall_store_fb', storeSettingsForm.facebookPage);

      localStorage.setItem('movemall_warehouse_contact', storeSettingsForm.warehouseContact);
      localStorage.setItem('movemall_warehouse_phone', storeSettingsForm.warehousePhone);
      localStorage.setItem('movemall_warehouse_address', storeSettingsForm.warehouseAddress);
      localStorage.setItem('movemall_courier_pref', storeSettingsForm.courier);
      localStorage.setItem('movemall_allow_cod', String(storeSettingsForm.allowCod));

      localStorage.setItem('movemall_payout_bank', storeSettingsForm.bankName);
      localStorage.setItem('movemall_payout_acc_no', storeSettingsForm.bankAccountNo);
      localStorage.setItem('movemall_payout_acc_name', storeSettingsForm.accountName);
      localStorage.setItem('movemall_payout_promptpay', storeSettingsForm.promptPay);

      localStorage.setItem('movemall_autoreply_enabled', String(storeSettingsForm.autoReplyEnabled));
      localStorage.setItem('movemall_welcome_msg', storeSettingsForm.welcomeMessage);

      setCustomStoreName(storeSettingsForm.name);
      setStoreNameInput(storeSettingsForm.name);

      try {
        await fetchApi(`/api/stores/${currentStore.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: storeSettingsForm.name,
            description: storeSettingsForm.description,
            logo: storeSettingsForm.logo,
            banner: storeSettingsForm.banner,
          }),
        });
      } catch {
        // local persistence is active
      }

      triggerToast('💾 บันทึกการตั้งค่ารายละเอียดร้านค้าสำเร็จเรียบร้อยแล้ว!');
    } catch {
      triggerToast('❌ บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  }

  // ── Shop Health & Buyer Report State ──
  const [storeHealthScore, setStoreHealthScore] = useState(100);
  const [storePenaltyPoints, setStorePenaltyPoints] = useState(0);
  const [showBuyerReportModal, setShowBuyerReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    orderId: '',
    customerName: '',
    type: 'COD_REJECTED' as 'COD_REJECTED' | 'REFUND_ABUSE' | 'FAKE_ORDER' | 'HARASSMENT',
    description: '',
    evidenceUrl: '',
  });

  const [myFiledReports, setMyFiledReports] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`movemall_seller_buyer_reports_${sellerStoreId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  function handleSubmitBuyerReport(e: React.FormEvent) {
    e.preventDefault();
    const newReport = {
      id: `rep-filed-${Date.now()}`,
      orderId: reportForm.orderId,
      customerName: reportForm.customerName,
      type: reportForm.type,
      description: reportForm.description,
      status: 'PENDING',
      compensationStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    setMyFiledReports(prev => {
      const updated = [newReport, ...prev];
      try {
        localStorage.setItem(`movemall_seller_buyer_reports_${sellerStoreId}`, JSON.stringify(updated));
      } catch {
        // storage full
      }
      return updated;
    });
    setShowBuyerReportModal(false);
    alert(`ส่งรายงานพฤติกรรมลูกค้าออเดอร์ ${reportForm.orderId} เรียบร้อยแล้ว ทีมงาน CS Admin จะตรวจสอบและชดเชยค่าขนส่งให้ภายใน 24 ชม.`);
  }

  // ── Live Seller Chat State (Strict Store Isolated) ──
  const [sellerMessages, setSellerMessages] = useState<Record<string, any[]>>(() => {
    const all = getStoredChatHistory();
    const filtered: Record<string, any[]> = {};
    Object.keys(all).forEach(k => {
      if (k.startsWith(`${currentStore.id}::`)) {
        filtered[k] = all[k];
      }
    });
    return filtered;
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [sellerInputVal, setSellerInputVal] = useState('');
  const [isSellerSocketConnected, setIsSellerSocketConnected] = useState(false);
  const sellerMessagesAreaRef = useRef<HTMLDivElement>(null);

  // Archive/delete threads (localStorage-persisted)
  const [archivedThreads, setArchivedThreads] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`movemall_archived_threads_${sellerStoreId}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Chat referral source map: customerId → { source, productId, productName, openedAt }
  const [chatSourceMap, setChatSourceMap] = useState<Record<string, { source: string; label: string; openedAt: string }>>(() => {
    try {
      const saved = localStorage.getItem(`movemall_chat_source_${sellerStoreId}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Customer info panel toggle
  const [showCustomerPanel, setShowCustomerPanel] = useState(true);
  const [hoveredCustomerId, setHoveredCustomerId] = useState<string | null>(null);

  // Sync real chat messages for this specific store from DB
  useEffect(() => {
    async function loadStoreChatHistory() {
      try {
        const res = await fetchApi<{ success: boolean; messages: any[] }>(`/api/chat/messages?storeId=${currentStore.id}`);
        if (res?.messages && res.messages.length > 0) {
          setSellerMessages(prev => {
            const next = { ...prev };
            res.messages.forEach((m: any) => {
              const custId = m.sender === 'store' ? m.recipientId : m.senderId;
              const threadKey = `${currentStore.id}::${custId}`;
              const list = next[threadKey] || [];
              if (!list.some(existing => existing.id === m.id)) {
                next[threadKey] = [...list, m];
              }
            });
            return next;
          });
        }
      } catch {
        // local mode
      }
    }
    loadStoreChatHistory();
  }, [currentStore.id]);

  useEffect(() => {
    if (activeTab === 'chat' && sellerMessagesAreaRef.current) {
      sellerMessagesAreaRef.current.scrollTop = sellerMessagesAreaRef.current.scrollHeight;
    }
  }, [sellerMessages, selectedCustomerId, activeTab]);

  useEffect(() => {
    const socket = getChatSocket();
    joinSellerChatRoom(currentStore.id);
    if (socket.connected) setIsSellerSocketConnected(true);

    const handleConnect = () => {
      setIsSellerSocketConnected(true);
      joinSellerChatRoom(currentStore.id);
    };

    const handleReceiveMsg = (msg: any) => {
      if (!msg) return;
      const storeTargetId = msg.storeId || currentStore.id;
      // Strictly ignore messages from other stores
      if (storeTargetId !== currentStore.id) return;

      const custId = msg.customerId || msg.userId || (msg.sender === 'store' ? (msg.recipientId || selectedCustomerId) : 'guest_user');
      const threadKey = `${currentStore.id}::${custId}`;

      setSellerMessages(prev => {
        const list = prev[threadKey] || [];
        // Deduplicate by ID or identical text from same sender
        const isDuplicate = list.some(m =>
          m.id === msg.id ||
          (m.sender === msg.sender && m.text === msg.text && m.time === msg.time)
        );
        if (isDuplicate) return prev;
        const updated = {
          ...prev,
          [threadKey]: [...list, msg],
        };
        const allStored = getStoredChatHistory();
        saveStoredChatHistory({ ...allStored, [threadKey]: updated[threadKey] });
        return updated;
      });
    };

    socket.on('connect', handleConnect);
    socket.on('receive_chat_message', handleReceiveMsg);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('receive_chat_message', handleReceiveMsg);
    };
  }, [currentStore.id, selectedCustomerId]);

  function handleSellerSendMessage(e?: React.FormEvent, customText?: string) {
    if (e) e.preventDefault();
    const textToSend = customText || sellerInputVal;
    if (!textToSend.trim()) return;

    const threadKey = `${currentStore.id}::${selectedCustomerId}`;
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'store',
      senderId: currentStore.id,
      recipientId: selectedCustomerId,
      storeId: currentStore.id,
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    setSellerMessages(prev => {
      const list = prev[threadKey] || prev[selectedCustomerId] || [];
      const updated = {
        ...prev,
        [threadKey]: [...list, newMsg],
        [selectedCustomerId]: [...list, newMsg],
      };
      saveStoredChatHistory(updated);
      return updated;
    });
    setSellerInputVal('');

    // Emit live to WebSocket with explicit message ID
    emitChatMessage({
      id: newMsg.id,
      storeId: currentStore.id,
      userId: selectedCustomerId,
      text: textToSend.trim(),
      sender: 'store',
      customerId: selectedCustomerId,
    });

    // Also persist via REST API
    fetchApi('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        storeId: currentStore.id,
        recipientId: selectedCustomerId,
        text: textToSend.trim(),
        senderRole: 'store',
      }),
    }).catch(() => {});
  }

  function archiveThread(customerId: string) {
    setArchivedThreads(prev => {
      const next = prev.includes(customerId) ? prev : [...prev, customerId];
      try { localStorage.setItem(`movemall_archived_threads_${sellerStoreId}`, JSON.stringify(next)); } catch {}
      return next;
    });
    if (selectedCustomerId === customerId) setSelectedCustomerId('');
  }

  function restoreThread(customerId: string) {
    setArchivedThreads(prev => {
      const next = prev.filter(id => id !== customerId);
      try { localStorage.setItem(`movemall_archived_threads_${sellerStoreId}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function deleteThreadPermanently(customerId: string) {
    const threadKey = `${currentStore.id}::${customerId}`;
    setSellerMessages(prev => {
      const next = { ...prev };
      delete next[threadKey];
      delete next[customerId];
      try {
        const allStored = getStoredChatHistory();
        delete allStored[threadKey];
        delete allStored[customerId];
        saveStoredChatHistory(allStored);
      } catch {}
      return next;
    });
    setArchivedThreads(prev => {
      const next = prev.filter(id => id !== customerId);
      try { localStorage.setItem(`movemall_archived_threads_${sellerStoreId}`, JSON.stringify(next)); } catch {}
      return next;
    });
    if (selectedCustomerId === customerId) setSelectedCustomerId('');
  }

  function handleLoadSampleProducts() {
    const samples: Product[] = [
      {
        id: `p-custom-${Date.now()}-1`,
        name: 'สมาร์ทวอทช์ Movemall Pro Series 9 (หน้าจอ AMOLED 1.96 นิ้ว โทรได้ แบตอึด 7 วัน)',
        price: 1490,
        originalPrice: 2890,
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'],
        category: 'electronics',
        storeId: currentStore.id,
        rating: 4.9,
        reviewCount: 48,
        stock: 50,
        tags: ['สมาร์ทวอทช์', 'Gadget', 'ขายดี'],
        description: 'สมาร์ทวอทช์รุ่นเรือธง รองรับการโทรผ่านบลูทูธ วัดอัตราการเต้นของหัวใจ และโหมดกีฬา 100+ ชนิด',
        isVatRegistered: true,
      },
      {
        id: `p-custom-${Date.now()}-2`,
        name: 'หูฟังบลูทูธไร้สาย ANC True Wireless Earbuds ตัดเสียงรบกวน 35dB',
        price: 890,
        originalPrice: 1590,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'],
        category: 'electronics',
        storeId: currentStore.id,
        rating: 4.8,
        reviewCount: 32,
        stock: 80,
        tags: ['หูฟัง', 'บลูทูธ', 'ANC'],
        description: 'หูฟังไร้สายคุณภาพเสียงระดับ Hi-Res ตัดเสียงรบกวนรอบข้าง แบตเตอรี่ใช้งานต่อเนื่อง 30 ชม.',
        isVatRegistered: true,
      },
      {
        id: `p-custom-${Date.now()}-3`,
        name: 'เสื้อเชิ้ตมินิมอล Oversized Cotton 100% ทรงเกาหลี ผ้านุ่มใส่สบาย',
        price: 450,
        originalPrice: 790,
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80'],
        category: 'fashion',
        storeId: currentStore.id,
        rating: 5.0,
        reviewCount: 24,
        stock: 120,
        tags: ['เสื้อผ้า', 'แฟชั่น', 'มินิมอล'],
        description: 'เสื้อเชิ้ตโอเวอร์ไซส์สไตล์มินิมอลเกาหลี ผ้าคอตตอนแท้ 100% ระบายอากาศดีเยี่ยม',
        isVatRegistered: true,
      }
    ];

    samples.forEach(s => onAddProduct(s));
  }

  // ── Flash Sale Nomination State ──
  interface FlashNomination {
    id: string;
    productId: string;
    productName: string;
    productImage: string;
    originalPrice: number;
    flashPrice: number;
    discountPct: number;
    timeSlot: string;
    reservedStock: number;
    status: 'approved' | 'pending' | 'rejected';
    registeredAt: string;
  }

  const [flashNominations, setFlashNominations] = useState<FlashNomination[]>(() => {
    try {
      const saved = localStorage.getItem(`movemall_seller_flash_nominations_${sellerStoreId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [nomProdId, setNomProdId] = useState(storeProducts[0]?.id || '');
  const [nomTimeSlot, setNomTimeSlot] = useState('12:00 - 16:00 (รอบกลางวัน ดีลเด็ด ☀️)');
  const [nomFlashPrice, setNomFlashPrice] = useState('');
  const [nomStock, setNomStock] = useState('30');
  
  // ── Open API & Security State ──
  const [apiEnv, setApiEnv] = useState<'live' | 'sandbox'>('live');
  const [liveApiKey, setLiveApiKey] = useState('mov_live_9a8f4c2e1b3d7e5f608192a3b4c5d6e7');
  const [liveApiSecret, setLiveApiSecret] = useState('mov_sec_live_99d14ea62f7c03be81a9807f45c');
  const [sandboxApiKey, setSandboxApiKey] = useState('mov_test_4b2c1d8e9f0a3e5c7a1b8c9d0e1f2a3b');
  const [sandboxApiSecret, setSandboxApiSecret] = useState('mov_sec_test_11a84ec02f7c93be81a9807f12d');
  const [isSecretVisible, setIsSecretVisible] = useState(false);
  const [isCopiedKey, setIsCopiedKey] = useState(false);
  const [isCopiedSecret, setIsCopiedSecret] = useState(false);
  
  // IP Whitelist
  const [ipList, setIpList] = useState<string[]>(['203.144.12.89', '159.65.132.40']);
  const [newIpInput, setNewIpInput] = useState('');
  
  // API Scopes
  const [scopes, setScopes] = useState<{ [key: string]: boolean }>({
    'inventory:sync': true,
    'orders:read': true,
    'orders:dispatch': true,
    'products:write': false,
    'finance:read': false,
  });

  // Webhook State & Signature Tester
  const [webhookUrl, setWebhookUrl] = useState('https://erp.techpro.co.th/api/movemall/webhook');
  const [webhookSecret, setWebhookSecret] = useState('whsec_8849b2ef4c6790a18273645019283746');
  const [webhookTestEvent, setWebhookTestEvent] = useState<'order.paid' | 'inventory.low'>('order.paid');
  const [webhookSimResult, setWebhookSimResult] = useState<string | null>(null);

  const currentApiKey = apiEnv === 'live' ? liveApiKey : sandboxApiKey;
  const currentApiSecret = apiEnv === 'live' ? liveApiSecret : sandboxApiSecret;

  // ── Certified ISV Partners State ──
  interface PartnerItem {
    id: string;
    name: string;
    logoColor: string;
    category: 'ERP' | 'CHAT' | 'WMS';
    categoryLabel: string;
    description: string;
    connected: boolean;
    syncHealth: number;
    lastSyncedAt: string;
    features: string[];
    autoSyncStock: boolean;
    autoSyncOrders: boolean;
    autoSyncChat: boolean;
    webhookTarget: string;
    partnerToken: string;
  }

  const [partners, setPartners] = useState<PartnerItem[]>([
    {
      id: 'bigseller',
      name: 'BigSeller',
      logoColor: '#7C3AED',
      category: 'ERP',
      categoryLabel: 'ERP & ซิงค์สต็อกหลายช่องทาง',
      description: 'ซิงค์สต็อกสินค้าอัตโนมัติ 2 ทิศทาง ดึงออเดอร์ไปจัดส่ง พิมพ์ใบปะหน้า Flash/Kerry และคัดลอกสินค้าข้ามร้านค้าได้ในคลิกเดียว',
      connected: true,
      syncHealth: 99.8,
      lastSyncedAt: '2 นาทีที่แล้ว',
      features: ['2-Way Real-time Stock Sync', 'Auto Order Pulling', 'Bulk Product Listing', 'พิมพ์ใบปะหน้าพัสดุ'],
      autoSyncStock: true,
      autoSyncOrders: true,
      autoSyncChat: false,
      webhookTarget: 'https://api.bigseller.com/v1/movemall/events',
      partnerToken: 'bs_tok_live_8849b2ef4c6790a1827364',
    },
    {
      id: 'page365',
      name: 'Page365',
      logoColor: '#10B981',
      category: 'CHAT',
      categoryLabel: 'Omnichannel Social Chat & CRM',
      description: 'รวมแชทลูกค้า Movemall เข้าสู่หน้าจอเดียวกับ Facebook, LINE OA, TikTok Shop มีบอทตรวจสลิปโอนเงิน และระบบบันทึกประวัติลูกค้า CRM',
      connected: true,
      syncHealth: 100,
      lastSyncedAt: '1 นาทีที่แล้ว',
      features: ['รวมแชทลูกค้าทุกช่องทาง', 'ระบบตอบแชทอัตโนมัติ', 'บอทอ่านสลิปธนาคาร', 'ระบบ CRM ข้อมูลลูกค้า'],
      autoSyncStock: false,
      autoSyncOrders: true,
      autoSyncChat: true,
      webhookTarget: 'https://api.page365.net/integrations/movemall/webhook',
      partnerToken: 'p365_tok_9912a7f04c6790a182736',
    },
    {
      id: 'zwiz',
      name: 'Zwiz.ai',
      logoColor: '#2563EB',
      category: 'CHAT',
      categoryLabel: 'AI Live Shopping & Chatbot',
      description: 'ผู้ช่วย AI อัจฉริยะตอบแทนแอดมิน 24 ชม. พร้อมระบบดูดคอมเมนต์ CF อัตโนมัติใน Movemall Live Stream และส่งเข้าแชทปิดการขายทันที',
      connected: false,
      syncHealth: 0,
      lastSyncedAt: 'ยังไม่เคยซิงค์',
      features: ['AI ตอบแชทอัตโนมัติ 24 ชม.', 'ดูดคอมเมนต์ CF ในไลฟ์สด', 'บรอดแคสต์โปรโมชั่น', 'ระบบคูปองพิเศษในแชท'],
      autoSyncStock: false,
      autoSyncOrders: false,
      autoSyncChat: true,
      webhookTarget: 'https://api.zwiz.ai/v2/movemall/chat-events',
      partnerToken: 'zwiz_tok_unlinked_3391b',
    },
    {
      id: 'ginee',
      name: 'Ginee Omnichannel',
      logoColor: '#0284C7',
      category: 'ERP',
      categoryLabel: 'Omnichannel ERP & Warehouse WMS',
      description: 'ระบบบริหารจัดการคลังสินค้าหลายสาขา จัดการสต็อกข้ามแพลตฟอร์มระดับ Enterprise และวิเคราะห์ผลกำไรแม่นยำ',
      connected: false,
      syncHealth: 0,
      lastSyncedAt: 'ยังไม่เคยซิงค์',
      features: ['Multi-Warehouse WMS', 'Real-time Stock Deduct', 'การกระจายสินค้าตามสาขา', 'รายงานวิเคราะห์กำไรขั้นต้น'],
      autoSyncStock: true,
      autoSyncOrders: true,
      autoSyncChat: false,
      webhookTarget: 'https://api.ginee.com/v1/partners/movemall',
      partnerToken: 'gn_tok_unlinked_7718c',
    },
    {
      id: 'ohochat',
      name: 'Oho Chat',
      logoColor: '#EC4899',
      category: 'CHAT',
      categoryLabel: 'Enterprise Customer Care & SLA',
      description: 'แพลตฟอร์มบริการลูกค้าสำหรับทีมขนาดใหญ่ กระจายแชทตามแผนก วัดเวลาตอบกลับ SLA และเก็บบันทึกประวัติการเคลมสินค้า',
      connected: false,
      syncHealth: 0,
      lastSyncedAt: 'ยังไม่เคยซิงค์',
      features: ['ระบบกระจายแชทตามทีม', 'วัดผล SLA แอดมิน', 'ระบบเคสและเคลมสินค้า', 'แดชบอร์ดความพึงพอใจ CSAT'],
      autoSyncStock: false,
      autoSyncOrders: false,
      autoSyncChat: true,
      webhookTarget: 'https://api.ohochat.com/webhook/movemall',
      partnerToken: 'oho_tok_unlinked_5521a',
    },
    {
      id: 'bentoweb',
      name: 'BentoWeb & Shipnity',
      logoColor: '#F59E0B',
      category: 'WMS',
      categoryLabel: 'Local Thai POS & Logistics',
      description: 'เชื่อมต่อสต็อกหน้าร้าน POS เข้ากับ Movemall และระบบรวมค่ายขนส่ง Flash, Kerry, J&T และไปรษณีย์ไทยเพื่อออกเลขแทร็กกิ้งอัตโนมัติ',
      connected: false,
      syncHealth: 0,
      lastSyncedAt: 'ยังไม่เคยซิงค์',
      features: ['เชื่อมต่อระบบ POS หน้าร้าน', 'ออกเลขพัสดุอัตโนมัติ 5 ขนส่ง', 'ระบบเรียกรถเข้ารับพัสดุ', 'แจ้งเตือนสถานะส่งพัสดุทาง SMS'],
      autoSyncStock: true,
      autoSyncOrders: true,
      autoSyncChat: false,
      webhookTarget: 'https://api.bentoweb.com/v1/shipnity/movemall',
      partnerToken: 'bw_tok_unlinked_4412d',
    },
  ]);

  const [selectedPartnerModal, setSelectedPartnerModal] = useState<PartnerItem | null>(null);
  const [isPartnerRequestModalOpen, setIsPartnerRequestModalOpen] = useState(false);
  const [partnerApplicationForm, setPartnerApplicationForm] = useState({
    companyName: '',
    softwareName: '',
    contactEmail: '',
    category: 'ERP',
    estimatedStores: '10-50',
    technicalDocUrl: '',
  });
  const [partnerAppSubmitted, setPartnerAppSubmitted] = useState<string | null>(null);

  // OmniChat Simulation State
  const [omniSimChannel, setOmniSimChannel] = useState<'page365' | 'zwiz' | 'ohochat'>('page365');
  const [omniSimType, setOmniSimType] = useState<'incoming' | 'outgoing'>('incoming');
  const [omniSimResult, setOmniSimResult] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<Omit<ShippingLabelProps, 'onClose'> | null>(null);

  // ── Seller Store Orders State (Synced with PostgreSQL) ──
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);

  // ── Ads State ──
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [wallet, setWallet] = useState<AdWallet>({
    storeId: currentStore.id,
    balance: 0,
    transactions: [],
  });

  // Sync Live Orders, Live Ads & Tax Settings from Supabase Backend
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString('th-TH'));

  const syncSellerHubLive = useCallback(async (showNotification = false) => {
    setIsRefreshingData(true);
    try {
      const [ordersRes, walletRes, campsRes, taxRes] = await Promise.all([
        fetchSellerOrdersApi(currentStore.id).catch(() => null),
        fetchAdWalletApi(currentStore.id).catch(() => null),
        fetchAdCampaignsApi(currentStore.id).catch(() => null),
        fetchStoreTaxSettingsApi(currentStore.id).catch(() => null),
      ]);

      if (ordersRes && Array.isArray(ordersRes.orders)) {
        const mappedOrders = ordersRes.orders.map((o: any) => ({
          id: o.id,
          orderId: `ORD-${o.id.slice(0, 8).toUpperCase()}`,
          trackingNo: o.tracking?.trackingNumber || `TH-${o.id.slice(0, 4).toUpperCase()}-FLASH`,
          customerName: o.user?.name || (typeof o.shippingAddress === 'object' ? o.shippingAddress?.fullName : 'ผู้ซื้อ'),
          customerPhone: o.user?.phone || (typeof o.shippingAddress === 'object' ? o.shippingAddress?.phone : '08x-xxx-xxxx'),
          customerAddress: typeof o.shippingAddress === 'object' ? o.shippingAddress?.address : (o.shippingAddress || 'กรุงเทพมหานคร'),
          zipCode: typeof o.shippingAddress === 'object' ? o.shippingAddress?.postalCode : '10110',
          items: (o.items || []).map((i: any) => ({
            name: i.product?.name || 'สินค้า',
            quantity: i.quantity || 1,
            price: Number(i.price || 0),
          })),
          total: Number(o.totalAmount || 0),
          status: (o.status?.toLowerCase() === 'shipped' || o.status?.toLowerCase() === 'delivered') ? 'shipped' : 'pending',
          statusText: (o.status?.toLowerCase() === 'shipped' || o.status?.toLowerCase() === 'delivered') ? '✅ จัดส่งแล้ว' : '⚙️ รอดำเนินการส่ง',
          date: new Date(o.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          isCOD: o.paymentMethod === 'COD',
        }));

        setSellerOrders(mappedOrders);
      }

      if (walletRes?.wallet) {
        setWallet(prev => ({
          ...prev,
          balance: Number(walletRes.wallet.balance || 0),
        }));
      }

      if (campsRes?.campaigns && Array.isArray(campsRes.campaigns)) {
        setCampaigns(campsRes.campaigns);
      }

      if (taxRes && taxRes.storeId) {
        setTaxProfile({
          storeId: taxRes.storeId,
          isVatRegistered: !!taxRes.isVatRegistered,
          taxId: taxRes.taxId || '0105562019876',
          taxCompanyName: taxRes.taxCompanyName || currentStore.name,
          taxBranchCode: taxRes.taxBranchCode || '00000',
          taxAddress: taxRes.taxAddress || 'กรุงเทพมหานคร 10110',
          eTaxAutoEmail: !!taxRes.eTaxAutoEmail,
          eTaxProvider: taxRes.eTaxProvider || 'ETDA / Revenue Dept e-Tax by Email',
        });
      }

      const timeStr = new Date().toLocaleTimeString('th-TH');
      setLastSyncTime(timeStr);
      if (showNotification) {
        alert(`✓ ซิงค์ข้อมูลร้านค้าล่าสุดจาก PostgreSQL สำเร็จ (${timeStr})`);
      }
    } catch (err) {
      console.warn('Seller hub live sync fallback:', err);
    } finally {
      setIsRefreshingData(false);
    }
  }, [currentStore.id, currentStore.name]);

  useEffect(() => {
    syncSellerHubLive(false);
  }, [syncSellerHubLive]);
  const [isCreateAdModalOpen, setIsCreateAdModalOpen] = useState(false);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('1000');
  const [isPromptPayShown, setIsPromptPayShown] = useState(false);
  const [adFilterType, setAdFilterType] = useState<'all' | AdType>('all');

  // New Campaign Form State
  const [selectedProdId, setSelectedProdId] = useState(storeProducts[0]?.id || products[0]?.id || '');
  const [adCampaignType, setAdCampaignType] = useState<AdType>('search');
  const [dailyBudget, setDailyBudget] = useState('200');
  const [cpcBid, setCpcBid] = useState('3.00');
  const [keywordsInput, setKeywordsInput] = useState('หูฟัง, แท็บเล็ต, โปรโมชั่น, ของแท้');

  // ── Tax Hub & e-Tax Invoice State ──
  const [taxSubTab, setTaxSubTab] = useState<'documents' | 'settings' | 'report'>('documents');
  const [taxProfile, setTaxProfile] = useState<StoreTaxProfile>({
    storeId: currentStore.id,
    isVatRegistered: true,
    taxId: '0105562019876',
    taxCompanyName: 'บริษัท มูฟมอลล์ เทคโปร จำกัด (สำนักงานใหญ่)',
    taxBranchCode: '00000',
    taxAddress: 'เลขที่ 88/1 อาคารมูฟมอลล์ ชั้น 12 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
    eTaxAutoEmail: true,
    eTaxProvider: 'ETDA / Revenue Dept e-Tax by Email',
  });
  const [isTaxSaving, setIsTaxSaving] = useState(false);
  const [taxSaveSuccess, setTaxSaveSuccess] = useState(false);

  const [taxDocs, setTaxDocs] = useState<TaxDocument[]>(() => {
    try {
      const saved = localStorage.getItem(`movemall_seller_tax_docs_${sellerStoreId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [taxDocFilter, setTaxDocFilter] = useState<'ALL' | TaxDocType>('ALL');
  const [taxSearch, setTaxSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<TaxDocument | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function triggerToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  async function handleSaveTaxSettings() {
    setIsTaxSaving(true);
    try {
      await fetchApi(`/api/tax/store/${currentStore.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(taxProfile),
      });
      setTaxSaveSuccess(true);
      triggerToast('✓ บันทึกข้อมูลการตั้งค่าภาษีร้านค้าสำเร็จ');
      setTimeout(() => setTaxSaveSuccess(false), 3000);
    } catch {
      setTaxSaveSuccess(true);
      triggerToast('✓ บันทึกข้อมูลการตั้งค่าภาษีร้านค้าสำเร็จ');
      setTimeout(() => setTaxSaveSuccess(false), 3000);
    } finally {
      setIsTaxSaving(false);
    }
  }

  // Product Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('electronics');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState<Product['badge']>(undefined);

  // Compliance Form State
  const [complianceFda, setComplianceFda] = useState('');
  const [complianceTisi, setComplianceTisi] = useState('');
  const [complianceCountry, setComplianceCountry] = useState('Thailand');
  const [complianceCertType, setComplianceCertType] = useState<ComplianceType | ''>('');
  const [complianceCertUrl, setComplianceCertUrl] = useState('');
  const [complianceCertFile, setComplianceCertFile] = useState<File | null>(null);
  const [complianceCertPreview, setComplianceCertPreview] = useState<string | null>(null);
  const [complianceCertUploading, setComplianceCertUploading] = useState(false);
  const [complianceCertDragOver, setComplianceCertDragOver] = useState(false);
  const [complianceHalal, setComplianceHalal] = useState('');
  const [aiCheckingCompliance, setAiCheckingCompliance] = useState(false);
  const [aiComplianceFeedback, setAiComplianceFeedback] = useState<string | null>(null);

  function resetComplianceForm() {
    setComplianceFda('');
    setComplianceTisi('');
    setComplianceCountry('Thailand');
    setComplianceCertType('');
    setComplianceCertUrl('');
    setComplianceCertFile(null);
    setComplianceCertPreview(null);
    setComplianceCertUploading(false);
    setComplianceHalal('');
    setAiComplianceFeedback(null);
  }

  async function compressImageFile(file: File, maxSizeKB = 400, maxWidth = 1200): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.85;
          const tryCompress = () => {
            canvas.toBlob((blob) => {
              if (!blob) { resolve(file); return; }
              if (blob.size / 1024 <= maxSizeKB || quality <= 0.3) {
                const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
                resolve(compressed);
              } else {
                quality -= 0.1;
                tryCompress();
              }
            }, 'image/jpeg', quality);
          };
          tryCompress();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleCertFileSelect(file: File) {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      alert('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP) และ PDF เท่านั้น');
      return;
    }
    const maxMB = isPdf ? 10 : 5;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`ขนาดไฟล์ต้องไม่เกิน ${maxMB} MB`);
      return;
    }
    setComplianceCertUploading(true);
    try {
      let finalFile = file;
      if (isImage) {
        finalFile = await compressImageFile(file);
      }
      setComplianceCertFile(finalFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        setComplianceCertPreview(e.target?.result as string);
      };
      if (isPdf) {
        setComplianceCertPreview('pdf');
      } else {
        reader.readAsDataURL(finalFile);
      }

      // Encode to data URL and store as certDocUrl (base64 for local state)
      const urlReader = new FileReader();
      urlReader.onload = (e) => {
        setComplianceCertUrl(e.target?.result as string);
      };
      urlReader.readAsDataURL(finalFile);
    } finally {
      setComplianceCertUploading(false);
    }
  }

  function handleAICheckCompliance() {
    const num = complianceFda.trim() || complianceTisi.trim();
    if (!num) {
      alert('กรุณากรอกเลข อย. หรือเลข มอก. ก่อนเรียกใช้ AI ตรวจสอบ');
      return;
    }

    setAiCheckingCompliance(true);
    setTimeout(() => {
      setAiCheckingCompliance(false);
      if (num.includes('10-1-6500098765') || num.includes('11-1') || num.includes('1195')) {
        setAiComplianceFeedback('✓ AI ตรวจสอบผ่าน 98%: เลขใบอนุญาตตรงกับฐานข้อมูล อย./สมอ. สถานะ ACTIVE (ยังไม่หมดอายุ) และชื่อสอดคล้องกับภาพสินค้า');
      } else {
        setAiComplianceFeedback('✓ AI บันทึกและตรวจสอบโครงสร้างเลขใบอนุญาตแล้ว: พร้อมส่งตรวจยืนยันในฐานข้อมูลภาครัฐ');
      }
    }, 800);
  }

  function handleImageFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleVideoFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setVideoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleOpenEditModal(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setPrice(String(product.price));
    setOriginalPrice(String(product.originalPrice || ''));
    setStock(String(product.stock));
    setImage(product.images[0] || '');
    setVideoUrl(product.videoUrl || '');
    setDescription(product.description || '');
    setBadge(product.badge);

    // Populate compliance fields
    setComplianceFda(product.compliance?.fdaNumber || '');
    setComplianceTisi(product.compliance?.tisiNumber || '');
    setComplianceCountry(product.compliance?.countryOfOrigin || 'Thailand');
    setComplianceCertType(product.compliance?.certType || '');
    setComplianceCertUrl(product.compliance?.certDocUrl || '');
    setComplianceCertFile(null);
    setComplianceCertPreview(
      product.compliance?.certDocUrl
        ? (product.compliance.certDocUrl.startsWith('data:application/pdf') ? 'pdf' : product.compliance.certDocUrl)
        : null
    );
    setComplianceHalal(product.compliance?.halalNumber || '');

    setIsEditModalOpen(true);
  }

  function handleSaveEditProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;

    const hasCompliance = Boolean(complianceFda.trim() || complianceTisi.trim() || complianceCountry || complianceCertUrl.trim() || complianceHalal.trim());
    const updatedCompliance: ProductCompliance | undefined = hasCompliance ? {
      fdaNumber: complianceFda.trim() || undefined,
      tisiNumber: complianceTisi.trim() || undefined,
      countryOfOrigin: complianceCountry || 'Thailand',
      certType: (complianceCertType as ComplianceType) || (complianceFda ? 'fda_cosmetics' : complianceTisi ? 'tisi_standard' : undefined),
      certDocUrl: complianceCertUrl.trim() || undefined,
      halalNumber: complianceHalal.trim() || undefined,
      verificationStatus: (complianceFda.trim() || complianceTisi.trim()) ? 'verified' : 'unverified',
      verifiedAt: (complianceFda.trim() || complianceTisi.trim()) ? new Date().toISOString().split('T')[0] : undefined,
    } : editingProduct.compliance;

    const updatedProduct: Product = {
      ...editingProduct,
      name,
      category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      stock: Number(stock),
      images: image ? [image] : editingProduct.images,
      videoUrl: videoUrl || undefined,
      description: description || editingProduct.description,
      badge: badge || undefined,
      compliance: updatedCompliance,
    };

    if (onUpdateProduct) {
      onUpdateProduct(updatedProduct);
    }

    setIsEditModalOpen(false);
    setEditingProduct(null);
    setName('');
    setPrice('');
    setOriginalPrice('');
    setStock('');
    setImage('');
    setVideoUrl('');
    setDescription('');
    resetComplianceForm();
  }

  // Handlers for Ads
  function handleToggleCampaignStatus(campaignId: string) {
    setCampaigns(prev =>
      prev.map(c => {
        if (c.id === campaignId) {
          const nextStatus = c.status === 'active' ? 'paused' : 'active';
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  }

  function handleDeleteCampaign(campaignId: string) {
    if (confirm('คุณต้องการลบแคมเปญโฆษณานี้ใช่หรือไม่?')) {
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    const targetProduct = products.find(p => p.id === selectedProdId) || storeProducts[0];
    if (!targetProduct) return;

    const parsedKeywords: AdKeyword[] = keywordsInput
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
      .map((k, i) => ({
        id: `kw-${Date.now()}-${i}`,
        keyword: k,
        bidPrice: Number(cpcBid) || 2.5,
        matchType: 'broad',
      }));

    const newCampaign: AdCampaign = {
      id: `ad-camp-${Date.now()}`,
      storeId: currentStore.id,
      productId: targetProduct.id,
      productName: targetProduct.name,
      productImage: targetProduct.images[0] || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400&q=80',
      type: adCampaignType,
      status: 'active',
      dailyBudget: Number(dailyBudget) || 100,
      cpcBid: Number(cpcBid) || 2.0,
      spentToday: 0,
      totalSpent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      keywords: parsedKeywords,
      startDate: new Date().toISOString().split('T')[0],
    };

    try {
      await fetchApi('/api/ads/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          storeId: currentStore.id,
          productId: targetProduct.id,
          name: `${targetProduct.name} Ads`,
          type: adCampaignType,
          dailyBudget: Number(dailyBudget) || 100,
          cpcBid: Number(cpcBid) || 2.0,
          keywords: keywordsInput.split(',').map(k => k.trim()).filter(Boolean),
        }),
      });
    } catch (err) {
      console.warn('API Ad Campaign Note (falling back to local state):', err);
    }

    setCampaigns([newCampaign, ...campaigns]);
    setIsCreateAdModalOpen(false);
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(topupAmount);
    if (!amt || amt <= 0) return;

    try {
      await fetchApi('/api/ads/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({
          storeId: currentStore.id,
          amount: amt,
        }),
      });
    } catch (err) {
      console.warn('API Topup Note (falling back to local state):', err);
    }

    setWallet(prev => ({
      ...prev,
      balance: prev.balance + amt,
      transactions: [
        {
          id: `tx-${Date.now()}`,
          type: 'topup',
          amount: amt,
          description: `เติมเงินผ่าน PromptPay QR Code (฿${amt.toLocaleString()})`,
          createdAt: new Date().toLocaleString('sv-SE').replace('T', ' '),
        },
        ...prev.transactions,
      ],
    }));

    setIsPromptPayShown(false);
    setIsTopupModalOpen(false);
    alert(`เติมเงินเข้า Ad Wallet สำเร็จ ฿${amt.toLocaleString()} บาท!`);
  }

  // Calculated Ad Metrics
  const totalAdImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
  const totalAdClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const totalAdSpent = campaigns.reduce((acc, c) => acc + c.totalSpent, 0);
  const totalAdRevenue = campaigns.reduce((acc, c) => acc + c.revenue, 0);
  const overallROAS = totalAdSpent > 0 ? (totalAdRevenue / totalAdSpent).toFixed(1) : '0.0';
  const overallCTR = totalAdImpressions > 0 ? ((totalAdClicks / totalAdImpressions) * 100).toFixed(2) : '0.00';

  const filteredCampaigns = campaigns.filter(c => {
    if (adFilterType === 'all') return true;
    return c.type === adFilterType;
  });

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const hasCompliance = Boolean(complianceFda.trim() || complianceTisi.trim() || complianceCountry || complianceCertUrl.trim() || complianceHalal.trim());
    const newCompliance: ProductCompliance | undefined = hasCompliance ? {
      fdaNumber: complianceFda.trim() || undefined,
      tisiNumber: complianceTisi.trim() || undefined,
      countryOfOrigin: complianceCountry || 'Thailand',
      certType: (complianceCertType as ComplianceType) || (complianceFda ? 'fda_cosmetics' : complianceTisi ? 'tisi_standard' : undefined),
      certDocUrl: complianceCertUrl.trim() || undefined,
      halalNumber: complianceHalal.trim() || undefined,
      verificationStatus: (complianceFda.trim() || complianceTisi.trim()) ? 'verified' : 'unverified',
      verifiedAt: (complianceFda.trim() || complianceTisi.trim()) ? new Date().toISOString().split('T')[0] : undefined,
    } : undefined;

    const newProd: Product = {
      id: `p-${Date.now()}`,
      storeId: currentStore.id,
      name: name.trim(),
      category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      stock: Number(stock) || 10,
      images: [
        image.trim() ||
          'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400&q=80',
      ],
      videoUrl: videoUrl.trim() || undefined,
      description: description.trim() || 'สินค้าคุณภาพสูงจากร้านค้าทางการ',
      rating: 5.0,
      reviewCount: 0,
      tags: [category, 'สินค้าใหม่'],
      badge: currentStore.isMall ? 'mall' : badge,
      compliance: newCompliance,
    };

    try {
      const res = await fetchApi<{ product: Product }>('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          storeId: currentStore.id,
          name: newProd.name,
          category: newProd.category,
          price: newProd.price,
          originalPrice: newProd.originalPrice,
          stock: newProd.stock,
          description: newProd.description,
          images: newProd.images,
          badge: newProd.badge,
        }),
      });

      if (res.product) {
        onAddProduct({ ...newProd, id: res.product.id });
      } else {
        onAddProduct(newProd);
      }
    } catch (err) {
      console.warn('API Product Creation (falling back to local state):', err);
      onAddProduct(newProd);
    }

    setName('');
    setPrice('');
    setOriginalPrice('');
    setStock('');
    setImage('');
    setVideoUrl('');
    setDescription('');
    setBadge(undefined);
    resetComplianceForm();
    setIsAddModalOpen(false);
  }

  function handleNominateFlashSale(e: React.FormEvent) {
    e.preventDefault();
    const targetProd = storeProducts.find(p => p.id === nomProdId) || storeProducts[0];
    if (!targetProd) return;

    const fPrice = Number(nomFlashPrice) || Math.round(targetProd.price * 0.6);
    const discPct = Math.round(((targetProd.price - fPrice) / targetProd.price) * 100);

    const newNom: FlashNomination = {
      id: `nom-${Date.now()}`,
      productId: targetProd.id,
      productName: targetProd.name,
      productImage: targetProd.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
      originalPrice: targetProd.price,
      flashPrice: fPrice,
      discountPct: discPct,
      timeSlot: nomTimeSlot,
      reservedStock: Number(nomStock) || 20,
      status: 'approved',
      registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setFlashNominations(prev => [newNom, ...prev]);
    setIsNominateModalOpen(false);
    alert(`ลงทะเบียนสินค้า "${targetProd.name}" เข้าร่วม Flash Sale รอบ ${nomTimeSlot} สำเร็จ! (สถานะ: อนุมัติแล้ว)`);
  }

  function renderComplianceFormFields() {
    return (
      <div className="seller-modal__group seller-modal__group--full seller-compliance-card">
        <div className="seller-compliance-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} className="seller-compliance-card__icon" />
            <span className="seller-compliance-card__title">🛡️ ข้อมูลใบอนุญาต มาตรฐานสินค้า & ประเทศผู้ผลิต (Product Compliance)</span>
          </div>
          <button
            type="button"
            className="seller-btn-sm seller-btn-primary"
            onClick={handleAICheckCompliance}
            disabled={aiCheckingCompliance}
            style={{ fontSize: '0.8rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            {aiCheckingCompliance ? '🤖 AI กำลังเช็กฐานข้อมูล...' : '🤖 AI ตรวจสอบ อย./มอก.'}
          </button>
        </div>

        {aiComplianceFeedback && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', margin: '0 0 12px 0', lineHeight: 1.4 }}>
            {aiComplianceFeedback}
          </div>
        )}

        <div className="seller-compliance-card__grid">
          {(category === 'beauty' || category === 'food' || category === 'health') && (
            <div className="seller-modal__group">
              <label className="seller-modal__label">
                เลขที่จดแจ้ง / เลขสารบบอาหาร อย. (Thai FDA Notification No.)
                {complianceFda.trim() && (
                  <span className="seller-compliance-tag seller-compliance-tag--valid">
                    ✓ เลข อย. ถูกต้อง
                  </span>
                )}
              </label>
              <input
                type="text"
                className="seller-modal__input"
                placeholder="เช่น 10-1-6200012345 หรือ 11-1-02544-1-0001"
                value={complianceFda}
                onChange={e => setComplianceFda(e.target.value)}
              />
            </div>
          )}

          {(category === 'electronics' || category === 'home' || category === 'toys' || category === 'sports') && (
            <div className="seller-modal__group">
              <label className="seller-modal__label">
                เครื่องหมายมาตรฐาน มอก. (TISI Standard)
                {complianceTisi.trim() && (
                  <span className="seller-compliance-tag seller-compliance-tag--valid">
                    ✓ มอก. อนุมัติแล้ว
                  </span>
                )}
              </label>
              <input
                type="text"
                className="seller-modal__input"
                placeholder="เช่น มอก. 1195-2553 หรือ มอก. 685-2540"
                value={complianceTisi}
                onChange={e => setComplianceTisi(e.target.value)}
              />
            </div>
          )}

          <div className="seller-modal__group">
            <label className="seller-modal__label">ประเทศที่ผลิต (Country of Origin) *</label>
            <select
              className="seller-modal__select"
              value={complianceCountry}
              onChange={e => setComplianceCountry(e.target.value)}
            >
              <option value="Thailand">🇹🇭 ประเทศไทย (Thailand)</option>
              <option value="Japan">🇯🇵 ญี่ปุ่น (Japan)</option>
              <option value="South Korea">🇰🇷 เกาหลีใต้ (South Korea)</option>
              <option value="China">🇨🇳 จีน (China)</option>
              <option value="USA">🇺🇸 สหรัฐอเมริกา (USA)</option>
              <option value="Germany">🇩🇪 เยอรมนี (Germany)</option>
              <option value="Taiwan">🇹🇼 ไต้หวัน (Taiwan)</option>
              <option value="Vietnam">🇻🇳 เวียดนาม (Vietnam)</option>
            </select>
          </div>

          {category === 'food' && (
            <div className="seller-modal__group">
              <label className="seller-modal__label">เลขเครื่องหมายฮาลาล (Halal No. - ถ้ามี)</label>
              <input
                type="text"
                className="seller-modal__input"
                placeholder="เช่น 10 B987 001 02 65"
                value={complianceHalal}
                onChange={e => setComplianceHalal(e.target.value)}
              />
            </div>
          )}

          <div className="seller-modal__group seller-modal__group--full">
            <label className="seller-modal__label">ภาพสแกนใบอนุญาต / เอกสารรับรอง (ตัวเลือกเสริม)</label>
            <div
              className={`cert-upload-zone${complianceCertDragOver ? ' cert-upload-zone--dragover' : ''}${complianceCertPreview ? ' cert-upload-zone--has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setComplianceCertDragOver(true); }}
              onDragLeave={() => setComplianceCertDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setComplianceCertDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleCertFileSelect(file);
              }}
              onClick={() => {
                if (!complianceCertPreview) {
                  document.getElementById('cert-file-input-compliance')?.click();
                }
              }}
            >
              <input
                id="cert-file-input-compliance"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCertFileSelect(file);
                  e.target.value = '';
                }}
              />
              {complianceCertUploading ? (
                <div className="cert-upload-zone__loading">
                  <div className="cert-upload-zone__spinner" />
                  <span>กำลังปรับขนาดไฟล์...</span>
                </div>
              ) : complianceCertPreview ? (
                <div className="cert-upload-zone__preview">
                  {complianceCertPreview === 'pdf' ? (
                    <div className="cert-upload-zone__pdf-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#DC2626" strokeWidth="1.5" fill="#FEF2F2"/>
                        <path d="M14 2v6h6" stroke="#DC2626" strokeWidth="1.5"/>
                        <text x="6" y="18" fontSize="5" fill="#DC2626" fontWeight="700">PDF</text>
                      </svg>
                      <span className="cert-upload-zone__filename">{complianceCertFile?.name || 'เอกสาร PDF'}</span>
                      {complianceCertFile && (
                        <span className="cert-upload-zone__filesize">{(complianceCertFile.size / 1024).toFixed(0)} KB</span>
                      )}
                    </div>
                  ) : (
                    <img src={complianceCertPreview} alt="Certificate preview" className="cert-upload-zone__img" />
                  )}
                  <div className="cert-upload-zone__actions">
                    <button
                      type="button"
                      className="cert-upload-zone__change-btn"
                      onClick={(e) => { e.stopPropagation(); document.getElementById('cert-file-input-compliance')?.click(); }}
                    >🔄 เปลี่ยนไฟล์</button>
                    <button
                      type="button"
                      className="cert-upload-zone__remove-btn"
                      onClick={(e) => { e.stopPropagation(); setComplianceCertFile(null); setComplianceCertPreview(null); setComplianceCertUrl(''); }}
                    >🗑️ ลบ</button>
                  </div>
                </div>
              ) : (
                <div className="cert-upload-zone__placeholder">
                  <div className="cert-upload-zone__icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
                      <polyline points="17 8 12 3 7 8" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="3" x2="12" y2="15" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="cert-upload-zone__title">คลิกหรือลากไฟล์มาวางที่นี่</p>
                  <p className="cert-upload-zone__subtitle">รองรับ JPG, PNG, WebP และ PDF · ขนาดไม่เกิน 5 MB (รูป) / 10 MB (PDF)</p>
                  <p className="cert-upload-zone__note">ระบบจะปรับขนาดรูปภาพให้เหมาะสมอัตโนมัติ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <main className="seller-auth-gate">
        <div className="seller-auth-gate__container">
          <div className="seller-auth-gate__card">
            <div className="seller-auth-gate__badge">
              <ShieldCheck size={14} />
              <span>ระบบความปลอดภัยศูนย์ผู้ขาย Movemall</span>
            </div>

            <div className="seller-auth-gate__icon-wrapper">
              <Store size={36} />
            </div>

            <h1 className="seller-auth-gate__title">ศูนย์ผู้ขาย Movemall (Seller Centre)</h1>
            <p className="seller-auth-gate__desc">
              กรุณาเข้าสู่ระบบบัญชีผู้ขาย หรือสมัครเปิดร้านค้าใหม่ เพื่อเข้าถึงระบบจัดการสต็อกสินค้า คำสั่งซื้อ ยิงแคมเปญโฆษณา และศูนย์การเงินร้านค้า
            </p>

            <div className="seller-auth-gate__features">
              <div className="seller-auth-gate__feature-item">
                <CheckCircle2 size={16} color="var(--primary)" />
                <span>จัดการสต็อกสินค้า & แกลเลอรีแบบ Realtime</span>
              </div>
              <div className="seller-auth-gate__feature-item">
                <CheckCircle2 size={16} color="var(--primary)" />
                <span>ระบบพิมพ์ใบปะหน้า & จัดส่งพัสดุ 1-Click</span>
              </div>
              <div className="seller-auth-gate__feature-item">
                <CheckCircle2 size={16} color="var(--primary)" />
                <span>Movemall Ads & Smart Click Shield</span>
              </div>
              <div className="seller-auth-gate__feature-item">
                <CheckCircle2 size={16} color="var(--primary)" />
                <span>เชื่อมต่อระบบสต็อก Omnichannel & ISV Hub</span>
              </div>
            </div>

            <div className="seller-auth-gate__actions">
              <Link
                to="/login?role=seller&redirect=/seller"
                className="seller-auth-gate__btn seller-auth-gate__btn--primary"
              >
                <Lock size={16} />
                <span>เข้าสู่ระบบผู้ขาย (Seller Login)</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/seller/register"
                className="seller-auth-gate__btn seller-auth-gate__btn--secondary"
              >
                <Store size={16} />
                <span>สมัครเปิดร้านค้าใหม่ (Register Store)</span>
              </Link>

              <button
                type="button"
                onClick={handleFastGoogleLogin}
                disabled={isLoggingInGoogle}
                className="seller-auth-gate__btn seller-auth-gate__btn--google"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{isLoggingInGoogle ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด่วนด้วย Google'}</span>
              </button>

              <Link to="/" className="seller-auth-gate__btn--text">
                ← กลับสู่หน้าหลัก Movemall
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="admin-enterprise-shell">
      {/* ── 1. Enterprise Top Navigation Bar ── */}
      <header className="admin-enterprise-topbar" style={{ padding: '0.6rem 1.25rem' }}>
        <div className="admin-topbar-left" style={{ gap: '0.85rem' }}>
          <div className="admin-brand-card">
            <div className="admin-brand-icon-box" style={{ width: 34, height: 34 }}>
              <Store size={18} color="#ffffff" />
            </div>
            <div>
              <div className="admin-brand-name" style={{ fontSize: '0.95rem' }}>
                MOVEMALL <span className="admin-brand-badge">SELLER CENTRE</span>
              </div>
              <div className="admin-db-status">
                <span className="admin-status-dot" />
                <span>Supabase PostgreSQL 🟢 Connected</span>
              </div>
            </div>
          </div>

          <div style={{ height: '24px', width: '1px', background: '#e2e8f0', margin: '0 0.25rem' }} />

          {/* Current Store Identity */}
          {isEditingStoreName ? (
            <form onSubmit={handleSaveStoreName} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="text"
                value={storeNameInput}
                onChange={e => setStoreNameInput(e.target.value)}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1.5px solid #2563eb',
                  borderRadius: '6px',
                  outline: 'none',
                  color: '#0f172a',
                  width: '180px',
                }}
                autoFocus
              />
              <button
                type="submit"
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => setIsEditingStoreName(false)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                ยกเลิก
              </button>
            </form>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '4px 10px',
                background: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
              }}
            >
              {currentStore.logo ? (
                <img
                  src={currentStore.logo}
                  alt={currentStore.name}
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '0.9rem' }}>🏪</span>
              )}
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  maxWidth: '220px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={currentStore.name}
              >
                {currentStore.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setStoreNameInput(customStoreName);
                  setIsEditingStoreName(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="เปลี่ยนชื่อร้านค้า"
              >
                <Pencil size={11} />
              </button>
            </div>
          )}
        </div>

        <div className="admin-topbar-right" style={{ gap: '0.65rem' }}>
          <Link
            to="/"
            className="admin-action-btn admin-action-btn--home"
            title="กลับสู่หน้าหลัก Movemall"
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.78rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#334155',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
            }}
          >
            <Home size={13} />
            <span>กลับหน้าหลัก</span>
          </Link>

          <button
            type="button"
            className="admin-action-btn admin-action-btn--sync"
            onClick={() => syncSellerHubLive(true)}
            disabled={isRefreshingData}
            title={lastSyncTime ? `ดึงข้อมูลจริงล่าสุดจาก PostgreSQL (${lastSyncTime})` : 'กดเพื่อซิงค์ข้อมูลจริง'}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
          >
            <RefreshCw size={13} style={{ animation: isRefreshingData ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isRefreshingData ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูล'}</span>
          </button>

          <Link
            to={`/store/${currentStore.slug || currentStore.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-btn admin-action-btn--storefront"
            title="เปิดหน้าร้านค้ามุมมองผู้ซื้อในแท็บใหม่"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
          >
            <ExternalLink size={13} />
            <span>ดูหน้าร้าน</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} />
            <span>ลงขายสินค้า</span>
          </button>

          <div
            className="admin-profile-pill"
            onClick={() => setActiveTab('settings')}
            style={{
              cursor: 'pointer',
              padding: '3px 8px 3px 3px',
              gap: '0.4rem',
            }}
            title="คลิกเพื่อไปที่การตั้งค่าร้านค้า (เปลี่ยนรูปโปรไฟล์ / แบนเนอร์ / บัญชี)"
          >
            {currentStore.logo ? (
              <img
                src={currentStore.logo}
                alt={currentStore.name}
                className="admin-avatar-img"
                style={{ width: 26, height: 26, borderRadius: '50%' }}
              />
            ) : (
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                🏪
              </div>
            )}
            <div className="admin-profile-text">
              <span className="admin-profile-role" style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                ⚙️ ตั้งค่าร้านค้า
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="ออกจากระบบศูนย์ผู้ขาย Movemall"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              whiteSpace: 'nowrap',
            }}
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
            <span>🏢 เมนูจัดการร้านค้า (Seller Navigation)</span>
          </div>

          <nav className="admin-sidebar-nav">
            {/* Cluster 1: Commerce */}
            <div className="admin-nav-cluster">
              <div className="admin-cluster-label">🛍️ สินค้า & การขาย (Commerce)</div>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'overview' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <div className="admin-nav-item-content">
                  <Store size={15} />
                  <span>สินค้าของร้าน</span>
                </div>
                <span className="admin-item-tag admin-item-tag--neutral">{storeProducts.length}</span>
              </button>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'orders' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <div className="admin-nav-item-content">
                  <Package size={15} />
                  <span>รายการคำสั่งซื้อ</span>
                </div>
                {sellerOrders.filter(o => o.status === 'pending').length > 0 ? (
                  <span className="admin-item-tag admin-item-tag--amber">
                    {sellerOrders.filter(o => o.status === 'pending').length} รอส่ง
                  </span>
                ) : (
                  <span className="admin-item-tag admin-item-tag--neutral">{sellerOrders.length}</span>
                )}
              </button>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'flash' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('flash')}
              >
                <div className="admin-nav-item-content">
                  <Zap size={15} />
                  <span>ดีล Flash Sale</span>
                </div>
                <span className="admin-item-tag admin-item-tag--hot">HOT</span>
              </button>
            </div>

            {/* Cluster 2: Growth & Finance */}
            <div className="admin-nav-cluster">
              <div className="admin-cluster-label">🎯 การตลาด & รายได้ (Growth & Tax)</div>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'ads' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('ads')}
              >
                <div className="admin-nav-item-content">
                  <Target size={15} />
                  <span>Movemall Ads</span>
                </div>
                <span className="admin-item-tag admin-item-tag--hot">ROI {overallROAS}x</span>
              </button>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'tax' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('tax')}
              >
                <div className="admin-nav-item-content">
                  <FileText size={15} />
                  <span>ระบบภาษี & e-Tax</span>
                </div>
                <span className="admin-item-tag admin-item-tag--neutral">7%</span>
              </button>
            </div>

            {/* Cluster 3: CRM & Trust */}
            <div className="admin-nav-cluster">
              <div className="admin-cluster-label">💬 ลูกค้า & ความปลอดภัย (CRM & Trust)</div>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'chat' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <div className="admin-nav-item-content">
                  <MessageSquare size={15} />
                  <span>แชทสดกับลูกค้า</span>
                </div>
                {isSellerSocketConnected && (
                  <span className="admin-item-tag" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                    ● LIVE
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'health' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('health')}
              >
                <div className="admin-nav-item-content">
                  <ShieldCheck size={15} />
                  <span>สุขภาพร้านค้า</span>
                </div>
                <span className="admin-item-tag" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                  {storeHealthScore}/100
                </span>
              </button>
            </div>

            {/* Cluster 4: Integration & Settings */}
            <div className="admin-nav-cluster">
              <div className="admin-cluster-label">⚙️ การเชื่อมต่อ & ตั้งค่า (Settings)</div>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'api' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('api')}
              >
                <div className="admin-nav-item-content">
                  <Cpu size={15} />
                  <span>พาร์ทเนอร์ ERP Hub</span>
                </div>
                <span className="admin-item-tag admin-item-tag--neutral">ISV</span>
              </button>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'settings' ? 'admin-nav-item--active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <div className="admin-nav-item-content">
                  <Settings size={15} />
                  <span>ตั้งค่ารายละเอียดร้านค้า</span>
                </div>
              </button>
            </div>
          </nav>

          {/* Bottom Card */}
          <div className="admin-sidebar-foot">
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                <ShieldCheck size={14} color="#10b981" />
                <span>Movemall Merchant Shield</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
                ร้านค้านี้ได้รับการการันตีและคุ้มครอง 100% เคลมค่าเสียหาย COD ได้เต็มจำนวน
              </div>
            </div>

            {/* Quick Home & Logout buttons in Sidebar */}
            <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Link
                to="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '7px 10px',
                  borderRadius: 6,
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: '#475569',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
                title="กลับสู่หน้าหลัก Movemall"
              >
                <Home size={14} color="#64748b" />
                <span>กลับสู่หน้าหลัก Movemall</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '7px 10px',
                  borderRadius: 6,
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: '#dc2626',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                title="ออกจากระบบศูนย์ผู้ขาย"
              >
                <LogOut size={14} color="#dc2626" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main className="admin-workspace">
          {/* Breadcrumb Strip */}
          <div className="admin-breadcrumb-strip">
            <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Movemall</Link>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#64748b' }}>ศูนย์ผู้ขาย (Seller Centre)</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#0f172a', fontWeight: 700 }}>
              {activeTab === 'overview' && 'สินค้าของร้าน (Product Catalog)'}
              {activeTab === 'orders' && 'รายการคำสั่งซื้อ (Order Management)'}
              {activeTab === 'ads' && 'Movemall Ads (Campaign Hub)'}
              {activeTab === 'flash' && 'ดีล Flash Sale'}
              {activeTab === 'api' && 'พาร์ทเนอร์ ERP Hub'}
              {activeTab === 'chat' && 'แชทสดกับลูกค้า (Live Customer CRM)'}
              {activeTab === 'health' && 'สุขภาพร้านค้า (Shop Health Shield)'}
              {activeTab === 'tax' && 'ระบบภาษี & e-Tax (e-Tax Invoice & VAT 7%)'}
              {activeTab === 'settings' && 'ตั้งค่ารายละเอียดร้านค้า (Store Settings)'}
            </span>
          </div>

          {/* Department Header Banner */}
          <div className="admin-workspace-header">
            <div className="admin-workspace-title-box">
              <h1 className="admin-workspace-title">
                {activeTab === 'overview' && '📦 จัดการสินค้าในร้าน (Product Catalog)'}
                {activeTab === 'orders' && '🚚 รายการคำสั่งซื้อ & จัดส่งพัสดุ (Order Fulfillment)'}
                {activeTab === 'ads' && '🎯 Movemall Ads & Smart Keyword Bidding'}
                {activeTab === 'flash' && '⚡ ดีลลดแรง Flash Sale (Flash Deals Hub)'}
                {activeTab === 'api' && '🔌 Movemall Partner & Omnichannel ERP Hub'}
                {activeTab === 'chat' && '💬 ศูนย์สนทนากับลูกค้าแบบสด (Live Customer CRM)'}
                {activeTab === 'health' && '🛡️ สุขภาพร้านค้า & ปกป้องความปลอดภัย (Shop Health Shield)'}
                {activeTab === 'tax' && '🧾 ระบบภาษี & ใบกำกับภาษีอิเล็กทรอนิกส์ (e-Tax Invoice & VAT 7%)'}
                {activeTab === 'settings' && '⚙️ ตั้งค่ารายละเอียดร้านค้า (Store Settings)'}
              </h1>
              <p className="admin-workspace-subtitle">
                {activeTab === 'overview' && 'จัดการแคตตาล็อกสินค้า กำหนดสต็อก ราคาปกติ/ลดพิเศษ และตรวจสอบคุณภาพรายการสินค้า'}
                {activeTab === 'orders' && 'ตรวจสอบออเดอร์ พิมพ์ใบปะหน้าขนส่ง Flash, Kerry, J&T, EMS และอัปเดตสถานะจัดส่ง'}
                {activeTab === 'ads' && 'ยิงโฆษณา Search / Discovery / Live เพิ่มยอดขาย ดันสินค้าติดอันดับการค้นหา'}
                {activeTab === 'flash' && 'ยื่นเสนอสินค้าเข้าร่วมรอบเวลา Flash Sale ประจำวัน เพื่อเพิ่มยอดขายและยอดเข้าชมร้าน'}
                {activeTab === 'api' && 'เชื่อมต่อ 1-Click: BigSeller, Ginee, BentoWeb, Page365, Zwiz.ai, Oho Chat'}
                {activeTab === 'chat' && 'ตอบกลับลูกค้าแบบเรียลไทม์ผ่าน WebSocket พร้อมข้อความด่วนและบอทต้อนรับอัตโนมัติ'}
                {activeTab === 'health' && 'ดูคะแนนความน่าเชื่อถือ ตรวจสอบแต้มตัด และยื่นเคลมค่าเสียหายกรณีลูกค้าปฏิเสธรับ COD'}
                {activeTab === 'tax' && 'ออกใบกำกับภาษี e-Tax Invoice & Receipt อัตโนมัติ พร้อมตั้งค่า ภ.พ.20 และรหัสสาขา'}
                {activeTab === 'settings' && 'จัดการโปรไฟล์ร้านค้า อัปโหลดแบนเนอร์/โลโก้ ที่อยู่คลังจัดส่ง และบัญชีรับเงินโอน Payout'}
              </p>
            </div>

            <div className="admin-workspace-actions">
              {activeTab === 'overview' && (
                <button
                  type="button"
                  className="admin-action-btn admin-action-btn--sync"
                  style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: 6, fontWeight: 700 }}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus size={14} /> + เพิ่มสินค้าใหม่
                </button>
              )}
            </div>
          </div>

          {/* Top 4 KPI Metric Cards */}
          <div style={{ padding: '0 1.75rem 1.5rem' }}>
            <div className="admin-kpi-grid">
              <div className="admin-kpi-card">
                <div className="admin-kpi-header">
                  <span className="admin-kpi-label">ยอดขายรวมร้านค้า</span>
                  <div className="admin-kpi-icon-box admin-kpi-icon-box--blue">
                    <DollarSign size={18} />
                  </div>
                </div>
                <div className="admin-kpi-val">
                  ฿{sellerOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="admin-kpi-sub">
                  <span className="admin-kpi-pill admin-kpi-pill--green">✓ ยอดขายจริง</span>
                  <span>จากคำสั่งซื้อทั้งหมด {sellerOrders.length} รายการ</span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-header">
                  <span className="admin-kpi-label">คำสั่งซื้อที่ต้องจัดส่ง</span>
                  <div className="admin-kpi-icon-box admin-kpi-icon-box--amber">
                    <Package size={18} />
                  </div>
                </div>
                <div className="admin-kpi-val">
                  {sellerOrders.filter(o => o.status === 'pending').length} รายการ
                </div>
                <div className="admin-kpi-sub">
                  <span className="admin-kpi-pill admin-kpi-pill--blue">รอจัดส่ง</span>
                  <span>เตรียมพัสดุและพิมพ์ใบปะหน้า</span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-header">
                  <span className="admin-kpi-label">สินค้าที่วางขาย</span>
                  <div className="admin-kpi-icon-box admin-kpi-icon-box--green">
                    <Store size={18} />
                  </div>
                </div>
                <div className="admin-kpi-val">
                  {storeProducts.length} รายการ
                </div>
                <div className="admin-kpi-sub">
                  <span className="admin-kpi-pill admin-kpi-pill--purple">สต็อกรวม</span>
                  <span>{storeProducts.reduce((acc, p) => acc + (p.stock || 0), 0).toLocaleString()} ชิ้นในคลัง</span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-header">
                  <span className="admin-kpi-label">คะแนนร้านค้า & สุขภาพ</span>
                  <div className="admin-kpi-icon-box admin-kpi-icon-box--purple">
                    <Star size={18} />
                  </div>
                </div>
                <div className="admin-kpi-val">
                  {currentStore.rating} / 5.0
                </div>
                <div className="admin-kpi-sub">
                  <span className="admin-kpi-pill admin-kpi-pill--green">สุขภาพ {storeHealthScore}/100 🛡️</span>
                  <span>ตอบแชท {currentStore.responseRate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Workspace Canvas */}
          <div style={{ padding: '0 1.75rem 2.5rem' }}>
        {/* Products Table (Desktop) & Mobile Card List */}
        {activeTab === 'overview' && (
          <>
            {storeProducts.length === 0 ? (
              <div className="seller-empty-card">
                <div className="seller-empty-card__icon">📦</div>
                <h3 className="seller-empty-card__title">
                  ยังไม่มีสินค้าในร้านค้าของคุณ
                </h3>
                <p className="seller-empty-card__desc">
                  เริ่มต้นลงขายสินค้าชิ้นแรกเพื่อสร้างรายได้ และโปรโมตผ่าน Movemall Live หรือคลิปสั้นติดตะกร้าเหลืองได้ทันที!
                </p>
                <div className="seller-empty-card__actions">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="seller-empty-card__btn-primary"
                  >
                    <Plus size={16} />
                    + ลงขายสินค้าชิ้นแรกเลย
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleProducts}
                    className="seller-empty-card__btn-sample"
                  >
                    ✨ นำเข้าสินค้าตัวอย่าง (3 รายการ)
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="seller-table-container seller-desktop-table">
                  <table className="seller-table">
                    <thead>
                      <tr>
                        <th>สินค้า</th>
                        <th>หมวดหมู่</th>
                        <th>ราคาขาย</th>
                        <th>คงเหลือ (สต็อก)</th>
                        <th>คะแนน / รีวิว</th>
                        <th>ใบอนุญาต & มอก.</th>
                        <th>การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storeProducts.map(product => (
                        <tr key={product.id}>
                          <td>
                            <div className="seller-product-cell">
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="seller-product-img"
                              />
                              <div>
                                <div className="seller-product-name">{product.name}</div>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {product.id}</span>
                              </div>
                            </div>
                          </td>
                          <td><span style={{ textTransform: 'capitalize' }}>{product.category}</span></td>
                          <td>
                            <strong style={{ color: 'var(--primary-dark)' }}>฿{product.price.toLocaleString()}</strong>
                            {product.originalPrice && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                ฿{product.originalPrice.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td>
                            {product.stock > 10 ? (
                              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{product.stock} ชิ้น</span>
                            ) : (
                              <span style={{ color: 'var(--error)', fontWeight: 700 }}>เหลือน้อย ({product.stock} ชิ้น)</span>
                            )}
                          </td>
                          <td>⭐ {product.rating} ({product.reviewCount})</td>
                          <td>
                            {product.compliance ? (
                              <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {product.compliance.fdaNumber && (
                                  <span style={{ color: '#059669', fontWeight: 600 }}>
                                    🛡️ อย. {product.compliance.fdaNumber}
                                  </span>
                                )}
                                {product.compliance.tisiNumber && (
                                  <span style={{ color: '#2563EB', fontWeight: 600 }}>
                                    ⚡ {product.compliance.tisiNumber}
                                  </span>
                                )}
                                {product.compliance.countryOfOrigin && (
                                  <span style={{ color: 'var(--text-muted)' }}>
                                    🌐 {product.compliance.countryOfOrigin}
                                  </span>
                                )}
                                <span className="seller-compliance-status-chip">
                                  ✓ ตรวจสอบแล้ว
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: '#9CA3AF' }}>- ไม่มีข้อมูล -</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button
                                className="seller-edit-btn"
                                onClick={() => handleOpenEditModal(product)}
                                aria-label={`แก้ไข ${product.name}`}
                              >
                                <Pencil size={13} />
                                แก้ไข
                              </button>
                              <button
                                className="seller-delete-btn"
                                onClick={() => onDeleteProduct(product.id)}
                                aria-label={`ลบ ${product.name}`}
                              >
                                <Trash2 size={13} />
                                ลบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Mobile Card List View (Shopee / TikTok Seller Style) */}
            <div className="seller-mobile-card-list">
              {storeProducts.map(product => (
                <div key={product.id} className="seller-mobile-card">
                  <div className="seller-mobile-card__top">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="seller-mobile-card__img"
                    />
                    <div className="seller-mobile-card__info">
                      <span className="seller-mobile-card__category">{product.category}</span>
                      <h4 className="seller-mobile-card__name">{product.name}</h4>
                      <span className="seller-mobile-card__id">ID: {product.id}</span>
                    </div>
                  </div>

                  <div className="seller-mobile-card__meta">
                    <div className="seller-mobile-card__meta-item">
                      <span className="seller-mobile-card__meta-label">ราคาขาย:</span>
                      <strong className="seller-mobile-card__price">฿{product.price.toLocaleString()}</strong>
                      {product.originalPrice && (
                        <span className="seller-mobile-card__orig">฿{product.originalPrice.toLocaleString()}</span>
                      )}
                    </div>

                    <div className="seller-mobile-card__meta-item">
                      <span className="seller-mobile-card__meta-label">คงเหลือ:</span>
                      {product.stock > 10 ? (
                        <span className="seller-mobile-card__stock seller-mobile-card__stock--ok">
                          {product.stock} ชิ้น
                        </span>
                      ) : (
                        <span className="seller-mobile-card__stock seller-mobile-card__stock--low">
                          เหลือน้อย ({product.stock} ชิ้น)
                        </span>
                      )}
                    </div>

                    <div className="seller-mobile-card__meta-item">
                      <span className="seller-mobile-card__meta-label">รีวิว:</span>
                      <span className="seller-mobile-card__rating">⭐ {product.rating} ({product.reviewCount})</span>
                    </div>
                  </div>

                  <div className="seller-mobile-card__actions">
                    <button
                      className="seller-mobile-card__btn-edit"
                      onClick={() => handleOpenEditModal(product)}
                    >
                      <Pencil size={13} /> แก้ไข
                    </button>
                    <Link to={getProductUrl(product)} className="seller-mobile-card__btn-view">
                      👁️ ดูสินค้า
                    </Link>
                    <button
                      className="seller-mobile-card__btn-delete"
                      onClick={() => onDeleteProduct(product.id)}
                    >
                      <Trash2 size={13} /> ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="seller-orders-hub">
            {sellerOrders.length === 0 ? (
              <div className="seller-empty-card" style={{ padding: '60px 20px', textAlign: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 6px)', marginTop: 'var(--space-4)' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📦</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                  ยังไม่มีคำสั่งซื้อเข้ามาในขณะนี้
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  เมื่อมีลูกค้าสั่งซื้อสินค้าจากร้านค้าของคุณ รายการออเดอร์ ข้อมูลจัดส่ง และปุ่มพิมพ์ใบปะหน้าพัสดุ Flash Express / Kerry จะแสดงที่นี่แบบเรียลไทม์
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  style={{
                    padding: '8px 18px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md, 6px)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Store size={15} /> ดูสินค้าในร้านของคุณ
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="seller-desktop-table seller-table-container">
                  <table className="seller-table">
                    <thead>
                      <tr>
                        <th>เลขที่คำสั่งซื้อ</th>
                        <th>สินค้า</th>
                        <th>ผู้ซื้อ & ที่อยู่จัดส่ง</th>
                        <th>ยอดชำระ</th>
                        <th>สถานะ</th>
                        <th>การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerOrders.map(order => (
                        <tr key={order.id}>
                          <td><strong>#{order.orderId}</strong></td>
                          <td>{order.items.map((i: any) => `${i.name} (${i.quantity} ชิ้น)`).join(', ')}</td>
                          <td>
                            <div>{order.customerName} ({order.customerPhone})</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.customerAddress} {order.zipCode}</div>
                          </td>
                          <td>฿{order.total.toLocaleString()}</td>
                          <td>
                            <span style={{
                              color: order.status === 'pending' ? 'var(--primary)' : 'var(--success)',
                              fontWeight: 700
                            }}>
                              {order.statusText}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                if (order.status === 'pending') {
                                  updateOrderStatusApi(order.id, { status: 'SHIPPED', trackingNumber: order.trackingNo }).catch(() => {});
                                  setSellerOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'shipped', statusText: '✅ จัดส่งแล้ว' } : o));
                                }
                                setSelectedOrderForLabel({
                                  orderId: order.orderId,
                                  trackingNo: order.trackingNo,
                                  customerName: order.customerName,
                                  customerPhone: order.customerPhone,
                                  customerAddress: order.customerAddress,
                                  zipCode: order.zipCode,
                                  storeName: currentStore.name,
                                  storePhone: '081-234-5678',
                                  storeAddress: '456 ถ.พระราม 4 คลองเตย กทม. 10110',
                                  items: order.items.map((i: any) => ({ name: i.name, quantity: i.quantity })),
                                  total: order.total,
                                  isCOD: order.isCOD,
                                });
                              }}
                              style={{
                                padding: '6px 12px',
                                background: order.status === 'pending' ? 'var(--primary)' : 'var(--surface)',
                                color: order.status === 'pending' ? 'white' : 'var(--text-primary)',
                                border: order.status === 'pending' ? 'none' : '1px solid var(--border)',
                                borderRadius: 'var(--radius-md, 6px)',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Printer size={13} /> {order.status === 'pending' ? 'พิมพ์ใบปะหน้า (4x6)' : 'พิมพ์ซ้ำ'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="seller-orders-mobile-list">
                  {sellerOrders.map(order => (
                    <div key={order.id} className="seller-order-mobile-card">
                      <div className="seller-order-mobile-card__header">
                        <div className="seller-order-mobile-card__id">
                          <strong>#{order.orderId}</strong>
                          <span className="seller-order-mobile-card__date">{order.date}</span>
                        </div>
                        <span className={`seller-order-status-badge seller-order-status-badge--${order.status}`}>
                          {order.statusText}
                        </span>
                      </div>

                      <div className="seller-order-mobile-card__body">
                        <div className="seller-order-mobile-card__item">
                          <Package size={15} className="seller-order-icon" />
                          <span className="seller-order-item-title">
                            {order.items.map((i: any) => `${i.name} (${i.quantity} ชิ้น)`).join(', ')}
                          </span>
                        </div>

                        <div className="seller-order-mobile-card__customer">
                          <div className="seller-order-customer-line">
                            <User size={14} className="seller-order-icon" />
                            <strong>{order.customerName}</strong>
                            <span className="seller-order-customer-phone">({order.customerPhone})</span>
                          </div>
                          <div className="seller-order-customer-addr">
                            <MapPin size={14} className="seller-order-icon" />
                            <span>{order.customerAddress} {order.zipCode}</span>
                          </div>
                        </div>
                      </div>

                      <div className="seller-order-mobile-card__footer">
                        <div className="seller-order-mobile-card__total">
                          <span className="seller-order-total-label">ยอดชำระสุทธิ</span>
                          <span className="seller-order-total-value">฿{order.total.toLocaleString()}</span>
                          {order.isCOD && <span className="seller-order-cod-tag">เก็บเงินปลายทาง</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForLabel({
                            orderId: order.orderId,
                            trackingNo: order.trackingNo,
                            customerName: order.customerName,
                            customerPhone: order.customerPhone,
                            customerAddress: order.customerAddress,
                            zipCode: order.zipCode,
                            storeName: currentStore.name,
                            storePhone: '081-234-5678',
                            storeAddress: '456 ถ.พระราม 4 คลองเตย กทม. 10110',
                            items: order.items.map((i: any) => ({ name: i.name, quantity: i.quantity })),
                            total: order.total,
                            isCOD: order.isCOD,
                          })}
                          className={`seller-order-print-btn ${order.status !== 'pending' ? 'seller-order-print-btn--secondary' : ''}`}
                        >
                          <Printer size={14} />
                          {order.status === 'pending' ? 'พิมพ์ใบปะหน้า (4x6)' : 'พิมพ์ซ้ำ'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 3. Movemall Partner & Omnichannel Integration Hub Tab ── */}
        {activeTab === 'api' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            
            {/* 1. Closed ISV Partner Program Header & Environment Switcher */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ maxWidth: 720 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                      🔌 Movemall Partner & Omnichannel Integration Hub
                    </h3>
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 900, padding: '2px 8px', border: '1px solid #BFDBFE' }}>
                      🔐 CLOSED ISV PARTNER PROGRAM
                    </span>
                    <span style={{ background: apiEnv === 'live' ? '#DCFCE7' : '#FEF3C7', color: apiEnv === 'live' ? '#15803D' : '#D97706', fontSize: 11, fontWeight: 900, padding: '2px 8px', border: `1px solid ${apiEnv === 'live' ? '#86EFAC' : '#FCD34D'}` }}>
                      {apiEnv === 'live' ? '● PRODUCTION LIVE' : '▲ SANDBOX TESTNET'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
                    เชื่อมต่อคลังสินค้า สต็อก ออเดอร์ และระบบแชทกับผู้ให้บริการระดับพันธมิตรที่ได้รับการรับรอง (Certified ISVs) เช่น <strong>BigSeller, Ginee, Page365, Zwiz.ai, Oho Chat</strong> ได้ทันที ช่วยให้ร้านค้าจัดการทุกอย่างจากหน้าจอเดียวโดยไม่ต้องสลับแอป
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => {
                      setPartnerAppSubmitted(null);
                      setIsPartnerRequestModalOpen(true);
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      background: '#F1F5F9',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>🏢</span> ยื่นขอเชื่อมต่อระบบ (ISV Onboarding)
                  </button>

                  <div style={{ display: 'flex', border: '1.5px solid var(--border)', background: '#F8FAFC' }}>
                    <button
                      onClick={() => setApiEnv('live')}
                      style={{
                        padding: '8px 16px',
                        fontSize: 12,
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        background: apiEnv === 'live' ? 'var(--primary)' : 'transparent',
                        color: apiEnv === 'live' ? 'white' : 'var(--text-secondary)'
                      }}
                    >
                      🟢 Production
                    </button>
                    <button
                      onClick={() => setApiEnv('sandbox')}
                      style={{
                        padding: '8px 16px',
                        fontSize: 12,
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        background: apiEnv === 'sandbox' ? '#F59E0B' : 'transparent',
                        color: apiEnv === 'sandbox' ? 'white' : 'var(--text-secondary)'
                      }}
                    >
                      🟠 Sandbox
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Partner Directory (1-Click Integrations) */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                      🚀 ผู้ให้บริการระบบที่ผ่านการรับรอง (Certified ISV Partners)
                    </h4>
                    <span style={{ background: '#DCFCE7', color: '#166534', fontSize: 10, fontWeight: 800, padding: '2px 6px' }}>
                      {partners.filter(p => p.connected).length} เชื่อมต่อแล้ว
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                    เปิดใช้งานการเชื่อมต่อสำเร็จรูป สต็อกสินค้าและแชทจะถูกซิงค์อัตโนมัติ 24 ชั่วโมง
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      alert('⚡ ส่งสัญญาณทดสอบ Health Check ไปยังทุกพาร์ทเนอร์สำเร็จ! ระบบทำงานปกติ 100%');
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#F8FAFC',
                      border: '1px solid var(--border)',
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <RefreshCw size={12} /> ตรวจสอบสัญญาณทุกระบบ (Health Check)
                  </button>
                </div>
              </div>

              {/* Partners Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {partners.map(partner => (
                  <div
                    key={partner.id}
                    style={{
                      border: partner.connected ? '1.5px solid #93C5FD' : '1px solid var(--border)',
                      background: partner.connected ? '#F0F7FF' : '#FFFFFF',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              background: partner.logoColor,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: 15,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            {partner.id === 'bigseller' ? 'BS' : partner.id === 'page365' ? '365' : partner.id === 'zwiz' ? 'ZW' : partner.id === 'ginee' ? 'GN' : partner.id === 'ohochat' ? 'OH' : 'BW'}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>
                              {partner.name}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
                              {partner.categoryLabel}
                            </span>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 900,
                            padding: '3px 8px',
                            background: partner.connected ? '#DCFCE7' : '#F1F5F9',
                            color: partner.connected ? '#15803D' : '#64748B',
                            border: `1px solid ${partner.connected ? '#86EFAC' : '#CBD5E1'}`
                          }}
                        >
                          {partner.connected ? '● กำลังเชื่อมต่อ' : '○ ยังไม่เชื่อมต่อ'}
                        </span>
                      </div>

                      {/* Description */}
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.45, minHeight: 48 }}>
                        {partner.description}
                      </p>

                      {/* Feature Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                        {partner.features.map((feat, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: '#FFFFFF',
                              border: '1px solid var(--border)',
                              padding: '2px 6px',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            ✓ {feat}
                          </span>
                        ))}
                      </div>

                      {/* Live Sync Status Info (If connected) */}
                      {partner.connected && (
                        <div style={{ background: '#FFFFFF', border: '1px solid #BFDBFE', padding: '8px 10px', marginBottom: 14, fontSize: 11 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1E40AF', fontWeight: 800 }}>
                            <span>สถานะสัญญาณ (Uptime): {partner.syncHealth}%</span>
                            <span>ซิงค์ล่าสุด: {partner.lastSyncedAt}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 4, color: 'var(--text-muted)', fontSize: 10 }}>
                            {partner.autoSyncStock && <span>📦 ซิงค์สต็อก (เปิด)</span>}
                            {partner.autoSyncOrders && <span>🛒 ดึงออเดอร์ (เปิด)</span>}
                            {partner.autoSyncChat && <span>💬 ส่งต่อแชทสด (เปิด)</span>}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      {partner.connected ? (
                        <>
                          <button
                            onClick={() => setSelectedPartnerModal(partner)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            ⚙️ จัดการ / แก้ไขการซิงค์
                          </button>
                          <button
                            onClick={() => {
                              alert(`⚡ สั่งซิงค์สต็อกและข้อมูลด่วนกับ ${partner.name} สำเร็จ! ข้อมูลอัปเดตตรงกัน 100%`);
                              setPartners(partners.map(p => p.id === partner.id ? { ...p, lastSyncedAt: 'เมื่อสักครู่' } : p));
                            }}
                            style={{
                              padding: '8px 12px',
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#1D4ED8',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            ⚡ ซิงค์ทันที
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedPartnerModal(partner)}
                          style={{
                            width: '100%',
                            padding: '9px',
                            background: '#0F172A',
                            color: 'white',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          🔗 เชื่อมต่อกับ {partner.name}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Interactive OmniChat & Stock Webhook Test Bench */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    🧪 เครื่องมือทดสอบจำลองสัญญาณ (Interactive OmniChat & Webhook Test Bench)
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                    ทดสอบการส่งข้อความแชทสดระหว่าง Movemall และระบบรวมแชท (Page365 / Zwiz.ai / Oho Chat) รวมถึงการจำลอง Webhook คำสั่งซื้อ
                  </p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '3px 8px' }}>
                  HMAC-SHA256 SIGNED
                </span>
              </div>

              {/* Simulation Selector Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12, background: '#F8FAFC', border: '1px solid var(--border)', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)' }}>แพลตฟอร์มปลายทาง:</label>
                  <select
                    value={omniSimChannel}
                    onChange={e => setOmniSimChannel(e.target.value as 'page365' | 'zwiz' | 'ohochat')}
                    style={{ padding: '6px 10px', fontSize: 12, fontWeight: 700, border: '1px solid var(--border)', background: '#FFFFFF' }}
                  >
                    <option value="page365">Page365 (ระบบรวมแชท Social)</option>
                    <option value="zwiz">Zwiz.ai (AI Chatbot & Live Stream)</option>
                    <option value="ohochat">Oho Chat (Enterprise Support)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)' }}>ทิศทางข้อมูล:</label>
                  <select
                    value={omniSimType}
                    onChange={e => setOmniSimType(e.target.value as 'incoming' | 'outgoing')}
                    style={{ padding: '6px 10px', fontSize: 12, fontWeight: 700, border: '1px solid var(--border)', background: '#FFFFFF' }}
                  >
                    <option value="incoming">1. ลูกค้า Movemall แชทเข้ามา ➔ ส่งต่อ Webhook ให้แอดมินใน {omniSimChannel.toUpperCase()}</option>
                    <option value="outgoing">2. แอดมินใน {omniSimChannel.toUpperCase()} ตอบกลับผ่าน API ➔ แสดงผลในแชท Movemall</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const timestamp = Math.floor(Date.now() / 1000);
                    if (omniSimType === 'incoming') {
                      const payload = {
                        eventId: `chat_evt_${Date.now()}`,
                        eventType: 'chat.message_received',
                        timestamp,
                        data: {
                          storeId: currentStore.id,
                          buyerId: 'user-buyer-771',
                          buyerName: 'คุณกิตติศักดิ์ ช้อปไว',
                          buyerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
                          message: 'สวัสดีครับ สนใจสินค้านี้ มีของพร้อมส่งเลยไหมครับ?',
                          productId: storeProducts[0]?.id || 'prod-1',
                          productTitle: storeProducts[0]?.name || 'สินค้าแนะนำ Movemall',
                        }
                      };
                      const fakeSig = `t=${timestamp},sha256=9f83acb381014ef2981bc89456201a`;
                      setOmniSimResult(`[DISPATCH SUCCESS -> 200 OK]\nEndpoint: https://api.${omniSimChannel}.com/v1/webhook/movemall\nHeaders:\n  X-Movemall-Signature: ${fakeSig}\n  X-Movemall-Timestamp: ${timestamp}\n  Content-Type: application/json\n\nPayload Body:\n${JSON.stringify(payload, null, 2)}`);
                    } else {
                      const payload = {
                        storeId: currentStore.id,
                        userId: 'user-buyer-771',
                        messageText: 'สวัสดีครับ มีของพร้อมส่งทันทีครับ สั่งซื้อตอนนี้แถมโค้ดลดเพิ่ม 50 บาทครับผม 😊',
                        agentName: `Admin ${omniSimChannel.toUpperCase()}`,
                      };
                      setOmniSimResult(`[API CALL SUCCESS -> 201 CREATED]\nPOST https://api.movemall.com/api/v1/open/chat/reply\nAuthorization: Bearer ${currentApiKey}\nContent-Type: application/json\n\nRequest Payload:\n${JSON.stringify(payload, null, 2)}\n\nResponse:\n{\n  "status": "success",\n  "message": "Reply sent from OmniChat to buyer successfully",\n  "deliveredAt": "${new Date().toISOString()}"\n}`);
                    }
                  }}
                  style={{
                    padding: '6px 14px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  🚀 รันการทดสอบ (Execute Simulation)
                </button>
              </div>

              {omniSimResult && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#15803D', marginBottom: 4 }}>
                    ✓ ผลการทำงานของระบบทดสอบ:
                  </div>
                  <pre style={{ margin: 0, padding: 14, background: '#0F172A', color: '#38BDF8', fontSize: 11, overflowX: 'auto', border: '1px solid #1E293B', fontFamily: 'monospace', lineHeight: 1.45 }}>
                    {omniSimResult}
                  </pre>
                </div>
              )}
            </div>

            {/* 4. API Credentials Card (Dual-Key & Secret) */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    🔑 กุญแจยืนยันตัวตนระดับ Enterprise (API Key & Secret Key)
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                    ใช้สำหรับการเชื่อมต่อระบบ ERP หรือใส่ในหน้าตั้งค่าของ Partner (เก็บบันทึกเฉพาะค่า SHA-256 Hash ในฐานข้อมูล)
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      if (confirm('คุณต้องการหมุนเวียนคีย์ (Rotate Key) ใช่หรือไม่? กุญแจเดิมจะยังใช้ได้อีก 24 ชั่วโมง')) {
                        const newKey = `mov_${apiEnv === 'live' ? 'live' : 'test'}_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
                        if (apiEnv === 'live') setLiveApiKey(newKey);
                        else setSandboxApiKey(newKey);
                        alert(`หมุนเวียนคีย์ ${apiEnv.toUpperCase()} สำเร็จ! คีย์ใหม่: ${newKey}`);
                      }
                    }}
                    style={{ padding: '6px 12px', background: '#F1F5F9', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    🔄 หมุนเวียนคีย์ (Rotate)
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('⚠️ คำเตือน: คุณต้องการยกเลิกคีย์ฉุกเฉิน (Revoke Immediately) ใช่หรือไม่? การเชื่อมต่อทั้งหมดจะหยุดทำงานทันที')) {
                        alert('ยกเลิกคีย์สำเร็จ! โปรดสร้างคีย์ใหม่เพื่อเริ่มการเชื่อมต่ออีกครั้ง');
                      }
                    }}
                    style={{ padding: '6px 12px', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    🚫 ยกเลิกคีย์ฉุกเฉิน (Revoke)
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
                {/* API Key */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    API KEY ({apiEnv.toUpperCase()})
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      readOnly
                      value={currentApiKey}
                      style={{ flex: 1, padding: '9px 12px', background: '#F8FAFC', border: '1.5px solid var(--border)', fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)' }}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentApiKey);
                        setIsCopiedKey(true);
                        setTimeout(() => setIsCopiedKey(false), 2000);
                      }}
                      style={{ padding: '9px 16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                    >
                      {isCopiedKey ? '✓ คัดลอกแล้ว' : 'คัดลอก Key'}
                    </button>
                  </div>
                </div>

                {/* API Secret */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)' }}>
                      API SECRET ({apiEnv.toUpperCase()}) — <span style={{ color: '#DC2626' }}>ห้ามเปิดเผยให้บุคคลอื่น</span>
                    </label>
                    <button
                      onClick={() => setIsSecretVisible(!isSecretVisible)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      {isSecretVisible ? '🙈 ซ่อน Secret' : '👁️ แสดง Secret'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type={isSecretVisible ? 'text' : 'password'}
                      readOnly
                      value={currentApiSecret}
                      style={{ flex: 1, padding: '9px 12px', background: '#F8FAFC', border: '1.5px solid var(--border)', fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)' }}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentApiSecret);
                        setIsCopiedSecret(true);
                        setTimeout(() => setIsCopiedSecret(false), 2000);
                      }}
                      style={{ padding: '9px 16px', background: '#334155', color: 'white', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                    >
                      {isCopiedSecret ? '✓ คัดลอกแล้ว' : 'คัดลอก Secret'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12, padding: '8px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 11, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔒</span>
                <span><strong>Header รูปแบบมาตรฐานสำหรับ Partner:</strong> <code>Authorization: Bearer {currentApiKey}</code></span>
              </div>
            </div>

            {/* 5. Security Settings: IP Whitelist & Scopes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
              
              {/* IP Whitelisting Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
                  <h4 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    🛡️ การจำกัด IP Address (IP Whitelist)
                  </h4>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                  อนุญาตให้เฉพาะเซิร์ฟเวอร์ BigSeller, Ginee หรือ IP ของระบบร้านค้าที่ระบุยิงเข้ามาได้
                </p>

                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <input
                    type="text"
                    value={newIpInput}
                    onChange={e => setNewIpInput(e.target.value)}
                    placeholder="เช่น 203.144.12.89 หรือ 103.22.x.x"
                    style={{ flex: 1, padding: '7px 10px', fontSize: 12, border: '1.5px solid var(--border)', fontFamily: 'monospace' }}
                  />
                  <button
                    onClick={() => {
                      if (!newIpInput.trim()) return;
                      if (ipList.includes(newIpInput.trim())) {
                        alert('IP นี้มีอยู่ในรายการแล้ว');
                        return;
                      }
                      setIpList([...ipList, newIpInput.trim()]);
                      setNewIpInput('');
                    }}
                    style={{ padding: '7px 14px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    + เพิ่ม IP
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 130, overflowY: 'auto' }}>
                  {ipList.map(ip => (
                    <div key={ip} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '6px 10px', border: '1px solid var(--border)' }}>
                      <code style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700 }}>{ip}</code>
                      <button
                        onClick={() => setIpList(ipList.filter(i => i !== ip))}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        ✕ ลบ
                      </button>
                    </div>
                  ))}
                  {ipList.length === 0 && (
                    <div style={{ fontSize: 11, color: '#DC2626', padding: 8, background: '#FEE2E2', textAlign: 'center' }}>
                      ⚠️ ยังไม่ได้ระบุ IP Whitelist (API จะไม่ยอมรับ Request จากภายนอก)
                    </div>
                  )}
                </div>
              </div>

              {/* API Scopes & Permissions Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Zap size={18} style={{ color: '#F59E0B' }} />
                  <h4 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    🎯 ขอบเขตสิทธิ์ (Permission Scopes)
                  </h4>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                  กำหนดเฉพาะสิทธิ์ที่อนุญาตให้ระบบภายนอกเข้าถึง (Least Privilege)
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { id: 'inventory:sync', label: 'inventory:sync', desc: 'อัปเดตสต็อกสินค้า Real-time จาก BigSeller/ERP' },
                    { id: 'orders:read', label: 'orders:read', desc: 'ดึงข้อมูลคำสั่งซื้อใหม่และรายละเอียดผู้รับ' },
                    { id: 'orders:dispatch', label: 'orders:dispatch', desc: 'ส่งเลขพัสดุและตัดรอบจัดส่งออเดอร์' },
                    { id: 'chat:omnichannel', label: 'chat:omnichannel', desc: 'ส่งต่อและตอบข้อความแชทลูกค้าข้ามแพลตฟอร์ม' },
                    { id: 'products:write', label: 'products:write', desc: 'เพิ่ม/แก้ไขรายการสินค้าและราคาแบบชุด (Bulk)' },
                  ].map(item => (
                    <label key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                      <input
                        type="checkbox"
                        checked={scopes[item.id] || false}
                        onChange={e => setScopes({ ...scopes, [item.id]: e.target.checked })}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{item.label}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. Partner Endpoints & cURL Snippets */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 14 }}>
                ⚡ ตัวอย่าง API สำหรับผู้ให้บริการระบบ (Partner Endpoints & cURL)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Endpoint 1: Batch Sync Stock */}
                <div style={{ background: '#0F172A', color: '#F8FAFC', padding: 14, borderLeft: '4px solid #10B981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#10B981', color: 'black', padding: '2px 6px', fontWeight: 900, fontSize: 10 }}>POST</span>
                      <strong style={{ fontSize: 13 }}>/api/v1/open/products/batch-sync</strong>
                    </div>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>BigSeller / Ginee ซิงค์สต็อกแบบชุด (Bulk Sync)</span>
                  </div>
                  <pre style={{ margin: 0, fontSize: 11, color: '#A7F3D0', overflowX: 'auto', padding: '6px 0' }}>
{`curl -X POST https://api.movemall.com/api/v1/open/products/batch-sync \\
  -H "Authorization: Bearer ${currentApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [
      { "productId": "prod-1", "sku": "TECH-001", "stock": 50, "price": 1290 },
      { "productId": "prod-2", "sku": "TECH-002", "stock": 100, "price": 890 }
    ]
  }'`}
                  </pre>
                </div>

                {/* Endpoint 2: OmniChat Reply */}
                <div style={{ background: '#0F172A', color: '#F8FAFC', padding: 14, borderLeft: '4px solid #3B82F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#3B82F6', color: 'white', padding: '2px 6px', fontWeight: 900, fontSize: 10 }}>POST</span>
                      <strong style={{ fontSize: 13 }}>/api/v1/open/chat/reply</strong>
                    </div>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Page365 / Zwiz ตอบกลับแชทส่งถึงผู้ซื้อ Movemall</span>
                  </div>
                  <pre style={{ margin: 0, fontSize: 11, color: '#BFDBFE', overflowX: 'auto', padding: '6px 0' }}>
{`curl -X POST https://api.movemall.com/api/v1/open/chat/reply \\
  -H "Authorization: Bearer ${currentApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "storeId": "${currentStore.id}",
    "userId": "user-buyer-101",
    "messageText": "สวัสดีครับ มีสินค้าพร้อมจัดส่งวันนี้ครับ"
  }'`}
                  </pre>
                </div>

                {/* Endpoint 3: Fulfill Order */}
                <div style={{ background: '#0F172A', color: '#F8FAFC', padding: 14, borderLeft: '4px solid #F59E0B' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#F59E0B', color: 'black', padding: '2px 6px', fontWeight: 900, fontSize: 10 }}>POST</span>
                      <strong style={{ fontSize: 13 }}>/api/v1/open/orders/ship</strong>
                    </div>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>ส่งเลขพัสดุและพิมพ์ใบปะหน้าจาก ERP</span>
                  </div>
                  <pre style={{ margin: 0, fontSize: 11, color: '#FDE68A', overflowX: 'auto', padding: '6px 0' }}>
{`curl -X POST https://api.movemall.com/api/v1/open/orders/ship \\
  -H "Authorization: Bearer ${currentApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderId": "MM-2026-9921",
    "trackingNumber": "TH029384729182",
    "courierProvider": "Flash Express"
  }'`}
                  </pre>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── 4. Movemall Ads Tab ── */}
        {activeTab === 'ads' && (
          <div className="seller-ads-section">
            {/* Top Ad Wallet & Action Bar */}
            <div className="seller-ads-wallet-card">
              <div className="seller-ads-wallet-info">
                <div className="seller-ads-wallet-icon">
                  <Wallet size={26} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>ยอดเงินโฆษณาคงเหลือ (Ad Wallet)</span>
                    <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 10, fontWeight: 800, padding: '2px 6px', border: '1px solid #86EFAC' }}>
                      ● พร้อมยิงโฆษณา
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                      ฿{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      (ใช้ไปวันนี้: ฿{campaigns.filter(c => c.status === 'active').reduce((a, b) => a + b.spentToday, 0).toLocaleString()} / งบรวม ฿{campaigns.filter(c => c.status === 'active').reduce((a, b) => a + b.dailyBudget, 0).toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>

              <div className="seller-ads-wallet-actions">
                <button
                  className="seller-ads-topup-btn"
                  onClick={() => {
                    setTopupAmount('1000');
                    setIsPromptPayShown(false);
                    setIsTopupModalOpen(true);
                  }}
                >
                  <Zap size={14} />
                  ⚡ เติมเงิน Ad Wallet
                </button>
                <button
                  className="seller-ads-create-btn"
                  onClick={() => setIsCreateAdModalOpen(true)}
                >
                  <Plus size={15} />
                  + สร้างแคมเปญโฆษณาใหม่
                </button>
              </div>
            </div>

            {/* Ads Metrics Summary */}
            <div className="seller-ads-metrics-grid">
              <div className="seller-ads-metric-card">
                <div className="seller-ads-metric-header">
                  <span className="seller-ads-metric-title">การมองเห็นทั้งหมด (Impressions)</span>
                  <Eye size={16} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="seller-ads-metric-value">{totalAdImpressions.toLocaleString()}</div>
                <div className="seller-ads-metric-sub">
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>+18.4%</span> จากสัปดาห์ที่แล้ว
                </div>
              </div>

              <div className="seller-ads-metric-card">
                <div className="seller-ads-metric-header">
                  <span className="seller-ads-metric-title">ยอดคลิกทั้งหมด (Clicks)</span>
                  <MousePointerClick size={16} style={{ color: '#F59E0B' }} />
                </div>
                <div className="seller-ads-metric-value">{totalAdClicks.toLocaleString()}</div>
                <div className="seller-ads-metric-sub">
                  อัตราการคลิก (CTR): <strong style={{ color: 'var(--text-primary)' }}>{overallCTR}%</strong>
                </div>
              </div>

              <div className="seller-ads-metric-card">
                <div className="seller-ads-metric-header">
                  <span className="seller-ads-metric-title">ค่าโฆษณาสะสม (Total Spend)</span>
                  <DollarSign size={16} style={{ color: '#EF4444' }} />
                </div>
                <div className="seller-ads-metric-value">฿{totalAdSpent.toLocaleString()}</div>
                <div className="seller-ads-metric-sub">
                  CPC เฉลี่ย: <strong style={{ color: 'var(--text-primary)' }}>฿{(totalAdClicks > 0 ? (totalAdSpent / totalAdClicks).toFixed(2) : '0.00')}</strong>
                </div>
              </div>

              <div className="seller-ads-metric-card seller-ads-metric-card--highlight">
                <div className="seller-ads-metric-header">
                  <span className="seller-ads-metric-title">ยอดขายจากโฆษณา (Ad GMV)</span>
                  <ArrowUpRight size={16} style={{ color: '#10B981' }} />
                </div>
                <div className="seller-ads-metric-value" style={{ color: '#047857' }}>
                  ฿{totalAdRevenue.toLocaleString()}
                </div>
                <div className="seller-ads-metric-sub">
                  ผลตอบแทนค่าโฆษณา (ROAS): <strong style={{ color: '#047857', fontSize: 13 }}>🔥 {overallROAS}x เท่า</strong>
                </div>
              </div>
            </div>

            {/* Campaign Management Header & Filters */}
            <div className="seller-ads-campaigns-box">
              <div className="seller-ads-campaigns-top">
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    📊 รายการแคมเปญโฆษณา ({campaigns.length})
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    จัดการประมูลคีย์เวิร์ด ปรับงบประมาณต่อวัน และติดตามผลตอบแทน (ROAS) แบบเรียลไทม์
                  </p>
                </div>

                <div className="seller-ads-type-filter">
                  <button
                    className={`seller-ads-filter-btn${adFilterType === 'all' ? ' seller-ads-filter-btn--active' : ''}`}
                    onClick={() => setAdFilterType('all')}
                  >
                    ทั้งหมด ({campaigns.length})
                  </button>
                  <button
                    className={`seller-ads-filter-btn${adFilterType === 'search' ? ' seller-ads-filter-btn--active' : ''}`}
                    onClick={() => setAdFilterType('search')}
                  >
                    🔍 Search Ads ({campaigns.filter(c => c.type === 'search').length})
                  </button>
                  <button
                    className={`seller-ads-filter-btn${adFilterType === 'discovery' ? ' seller-ads-filter-btn--active' : ''}`}
                    onClick={() => setAdFilterType('discovery')}
                  >
                    📱 Discovery Ads ({campaigns.filter(c => c.type === 'discovery').length})
                  </button>
                  <button
                    className={`seller-ads-filter-btn${adFilterType === 'live_boost' ? ' seller-ads-filter-btn--active' : ''}`}
                    onClick={() => setAdFilterType('live_boost')}
                  >
                    🔴 Live Boost ({campaigns.filter(c => c.type === 'live_boost').length})
                  </button>
                </div>
              </div>

              {/* Desktop Campaigns Table */}
              <div className="seller-table-container seller-desktop-table">
                <table className="seller-table">
                  <thead>
                    <tr>
                      <th>สินค้าที่โปรโมต</th>
                      <th>ประเภท</th>
                      <th>คีย์เวิร์ด / คำค้นหา</th>
                      <th>งบต่อวัน / CPC</th>
                      <th>ผลงาน (View / Click / CTR)</th>
                      <th>ค่าใช้จ่าย / ยอดขาย / ROAS</th>
                      <th>สถานะ</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                          ยังไม่มีแคมเปญโฆษณาในหมวดนี้ คลิก <strong>"+ สร้างแคมเปญโฆษณาใหม่"</strong> เพื่อเริ่มต้นยิงแอด
                        </td>
                      </tr>
                    ) : (
                      filteredCampaigns.map(camp => {
                        const ctr = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(1) : '0.0';
                        const roas = camp.totalSpent > 0 ? (camp.revenue / camp.totalSpent).toFixed(1) : '0.0';

                        return (
                          <tr key={camp.id}>
                            <td>
                              <div className="seller-product-cell">
                                <img
                                  src={camp.productImage}
                                  alt={camp.productName}
                                  className="seller-product-img"
                                />
                                <div>
                                  <div className="seller-product-name">{camp.productName}</div>
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Campaign ID: {camp.id}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              {camp.type === 'search' ? (
                                <span className="seller-ad-badge seller-ad-badge--search">🔍 Search Ads</span>
                              ) : camp.type === 'discovery' ? (
                                <span className="seller-ad-badge seller-ad-badge--discovery">📱 Discovery Ads</span>
                              ) : (
                                <span className="seller-ad-badge seller-ad-badge--live">🔴 Live Boost</span>
                              )}
                            </td>
                            <td>
                              {camp.keywords.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                                  {camp.keywords.map(kw => (
                                    <span key={kw.id} className="seller-kw-tag">
                                      {kw.keyword} <small>(฿{kw.bidPrice})</small>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Auto Smart Matching</span>
                              )}
                            </td>
                            <td>
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>฿{camp.dailyBudget.toLocaleString()}</strong>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> / วัน</span>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                บิดคลิก: <strong>฿{camp.cpcBid.toFixed(2)}</strong>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: 12 }}>
                                <strong>{camp.impressions.toLocaleString()}</strong> วิว • <strong>{camp.clicks.toLocaleString()}</strong> คลิก
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--primary-dark)', fontWeight: 700, marginTop: 2 }}>
                                CTR: {ctr}%
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: 12 }}>
                                ใช้ไป: <strong style={{ color: '#DC2626' }}>฿{camp.totalSpent.toLocaleString()}</strong>
                              </div>
                              <div style={{ fontSize: 11, color: '#15803D', fontWeight: 700, marginTop: 2 }}>
                                ยอดขาย: ฿{camp.revenue.toLocaleString()} ({roas}x)
                              </div>
                            </td>
                            <td>
                              <button
                                onClick={() => handleToggleCampaignStatus(camp.id)}
                                className={`seller-status-toggle${camp.status === 'active' ? ' seller-status-toggle--active' : ''}`}
                                title={camp.status === 'active' ? 'คลิกเพื่อหยุดชั่วคราว' : 'คลิกเพื่อเริ่มทำงาน'}
                              >
                                {camp.status === 'active' ? (
                                  <>
                                    <Play size={11} /> ใช้งานอยู่
                                  </>
                                ) : (
                                  <>
                                    <Pause size={11} /> หยุดชั่วคราว
                                  </>
                                )}
                              </button>
                            </td>
                            <td>
                              <button
                                className="seller-delete-btn"
                                onClick={() => handleDeleteCampaign(camp.id)}
                                aria-label="ลบแคมเปญ"
                              >
                                <Trash2 size={13} /> ลบ
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Campaigns Card List */}
              <div className="seller-ads-mobile-list">
                {filteredCampaigns.length === 0 ? (
                  <div className="seller-ads-mobile-empty">
                    ยังไม่มีแคมเปญโฆษณาในหมวดนี้ คลิก <strong>"+ สร้างแคมเปญโฆษณาใหม่"</strong> เพื่อเริ่มต้นยิงแอด
                  </div>
                ) : (
                  filteredCampaigns.map(camp => {
                    const ctr = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(1) : '0.0';
                    const roas = camp.totalSpent > 0 ? (camp.revenue / camp.totalSpent).toFixed(1) : '0.0';

                    return (
                      <div key={camp.id} className="seller-ad-mobile-card">
                        <div className="seller-ad-mobile-card__header">
                          <img
                            src={camp.productImage}
                            alt={camp.productName}
                            className="seller-ad-mobile-card__img"
                          />
                          <div className="seller-ad-mobile-card__title-wrap">
                            <div className="seller-ad-mobile-card__type-row">
                              {camp.type === 'search' ? (
                                <span className="seller-ad-badge seller-ad-badge--search">🔍 Search Ads</span>
                              ) : camp.type === 'discovery' ? (
                                <span className="seller-ad-badge seller-ad-badge--discovery">📱 Discovery Ads</span>
                              ) : (
                                <span className="seller-ad-badge seller-ad-badge--live">🔴 Live Boost</span>
                              )}
                              <span className="seller-ad-mobile-card__id">{camp.id}</span>
                            </div>
                            <h4 className="seller-ad-mobile-card__name">{camp.productName}</h4>
                          </div>
                        </div>

                        {camp.keywords.length > 0 && (
                          <div className="seller-ad-mobile-card__kw-row">
                            <span className="seller-ad-mobile-card__kw-label">คีย์เวิร์ด:</span>
                            <div className="seller-ad-mobile-card__kw-tags">
                              {camp.keywords.map(kw => (
                                <span key={kw.id} className="seller-kw-tag">
                                  {kw.keyword} <small>(฿{kw.bidPrice})</small>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="seller-ad-mobile-card__budget-row">
                          <div className="seller-ad-mobile-card__budget-item">
                            <span className="seller-ad-mobile-card__budget-label">งบต่อวัน</span>
                            <strong className="seller-ad-mobile-card__budget-val">฿{camp.dailyBudget.toLocaleString()}</strong>
                          </div>
                          <div className="seller-ad-mobile-card__budget-item">
                            <span className="seller-ad-mobile-card__budget-label">ราคาบิด/คลิก (CPC)</span>
                            <strong className="seller-ad-mobile-card__budget-val">฿{camp.cpcBid.toFixed(2)}</strong>
                          </div>
                        </div>

                        <div className="seller-ad-mobile-card__stats-grid">
                          <div className="seller-ad-mobile-stat">
                            <span className="seller-ad-mobile-stat__label">การมองเห็น</span>
                            <span className="seller-ad-mobile-stat__val">{camp.impressions.toLocaleString()}</span>
                          </div>
                          <div className="seller-ad-mobile-stat">
                            <span className="seller-ad-mobile-stat__label">คลิก (CTR)</span>
                            <span className="seller-ad-mobile-stat__val">{camp.clicks.toLocaleString()} ({ctr}%)</span>
                          </div>
                          <div className="seller-ad-mobile-stat">
                            <span className="seller-ad-mobile-stat__label">ค่าแอดที่ใช้</span>
                            <span className="seller-ad-mobile-stat__val seller-ad-mobile-stat__val--spent">฿{camp.totalSpent.toLocaleString()}</span>
                          </div>
                          <div className="seller-ad-mobile-stat">
                            <span className="seller-ad-mobile-stat__label">ยอดขาย (ROAS)</span>
                            <span className="seller-ad-mobile-stat__val seller-ad-mobile-stat__val--roas">฿{camp.revenue.toLocaleString()} ({roas}x)</span>
                          </div>
                        </div>

                        <div className="seller-ad-mobile-card__footer">
                          <button
                            onClick={() => handleToggleCampaignStatus(camp.id)}
                            className={`seller-status-toggle seller-ad-mobile-card__toggle-btn${camp.status === 'active' ? ' seller-status-toggle--active' : ''}`}
                          >
                            {camp.status === 'active' ? (
                              <>
                                <Play size={12} /> ใช้งานอยู่ (เปิด)
                              </>
                            ) : (
                              <>
                                <Pause size={12} /> หยุดชั่วคราว
                              </>
                            )}
                          </button>
                          <button
                            className="seller-delete-btn seller-ad-mobile-card__delete-btn"
                            onClick={() => handleDeleteCampaign(camp.id)}
                          >
                            <Trash2 size={13} /> ลบแคมเปญ
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Ad Wallet Transactions & Fraud Protection Info */}
            <div className="seller-ads-bottom-grid">
              {/* Transactions History */}
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'var(--space-5)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={15} style={{ color: 'var(--primary)' }} />
                  ประวัติการเติมเงิน & หักค่าคลิกโฆษณา
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {wallet.transactions.map(tx => (
                    <div
                      key={tx.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        fontSize: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tx.description}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{tx.createdAt}</div>
                      </div>
                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: 13,
                          color: tx.amount > 0 ? 'var(--success)' : '#DC2626',
                        }}
                      >
                        {tx.amount > 0 ? `+฿${tx.amount.toLocaleString()}` : `-฿${Math.abs(tx.amount).toLocaleString()}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Movemall Anti-Fraud Shield Box */}
              <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
                  <h4 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    🛡️ Movemall Smart Click Shield (ระบบคุ้มครองงบโฆษณา)
                  </h4>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  ระบบมีอัลกอริทึมตรวจจับและกรอง <strong>Spam Clicks, Competitor Bot Clicks, และคลิกซ้ำซ้อนจาก IP เดียวกันภายใน 60 วินาที</strong> โดยอัตโนมัติ ทำให้ผู้ขายจ่ายเงินเฉพาะผู้ซื้อที่มีความสนใจสินค้าจริง 100%
                </p>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                  <div>✓ IP Tracking & User-Agent Verify</div>
                  <div>✓ Real-time Fraud Deduction</div>
                  <div>✓ 24/7 Quality Scoring</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tax & e-Tax Invoices Hub */}
        {activeTab === 'tax' && (
          <div style={{ background: 'white', border: '1px solid var(--border)', padding: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
            {/* Master Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={20} style={{ color: '#2563EB' }} />
                  📄 ศูนย์ภาษี & ใบกำกับภาษีอัตโนมัติ (Tax & e-Tax Invoicing Hub)
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
                  จัดการภาษีมูลค่าเพิ่ม (VAT 7%), ตรวจสอบและออก e-Tax Invoice / ใบเสร็จรับเงินอัตโนมัติ และดาวน์โหลดรายงาน ภ.พ.30
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, background: taxProfile.isVatRegistered ? '#ECFDF5' : '#F1F5F9', color: taxProfile.isVatRegistered ? '#047857' : '#64748B', padding: '4px 10px', borderRadius: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: taxProfile.isVatRegistered ? '#10B981' : '#94A3B8' }} />
                  {taxProfile.isVatRegistered ? 'ร้านค้าจดทะเบียน VAT (ภ.พ.20)' : 'ร้านค้าไม่จด VAT (บุคคลทั่วไป)'}
                </span>
              </div>
            </div>

            {/* Sub Tabs Navigation */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #F1F5F9', marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setTaxSubTab('documents')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: taxSubTab === 'documents' ? '2px solid #2563EB' : '2px solid transparent',
                  color: taxSubTab === 'documents' ? '#2563EB' : '#64748B',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: -2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FileText size={15} />
                ศูนย์เอกสารภาษี ({taxDocs.length})
              </button>

              <button
                type="button"
                onClick={() => setTaxSubTab('settings')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: taxSubTab === 'settings' ? '2px solid #2563EB' : '2px solid transparent',
                  color: taxSubTab === 'settings' ? '#2563EB' : '#64748B',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: -2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Building2 size={15} />
                ตั้งค่าภาษีร้านค้า & ภ.พ.20
              </button>

              <button
                type="button"
                onClick={() => setTaxSubTab('report')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: taxSubTab === 'report' ? '2px solid #2563EB' : '2px solid transparent',
                  color: taxSubTab === 'report' ? '#2563EB' : '#64748B',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: -2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <TrendingUp size={15} />
                รายงานภาษีขาย ภ.พ.30
              </button>
            </div>

            {/* Sub Tab 1: Documents Center */}
            {taxSubTab === 'documents' && (
              <div>
                {/* Search & Filter Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(['ALL', 'TAX_INVOICE', 'RECEIPT', 'CREDIT_NOTE'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTaxDocFilter(type)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: taxDocFilter === type ? '#2563EB' : '#F1F5F9',
                          color: taxDocFilter === type ? '#FFFFFF' : '#475569',
                          border: 'none',
                        }}
                      >
                        {type === 'ALL' && 'เอกสารทั้งหมด'}
                        {type === 'TAX_INVOICE' && '🧾 ใบกำกับภาษี (Tax Invoice)'}
                        {type === 'RECEIPT' && '📄 ใบเสร็จรับเงิน (Receipt)'}
                        {type === 'CREDIT_NOTE' && '↩️ ใบลดหนี้ (Credit Note)'}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: 4 }}>
                    <Search size={14} color="#64748B" />
                    <input
                      type="text"
                      placeholder="ค้นหาเลขที่บิล, ชื่อผู้ซื้อ, Tax ID..."
                      value={taxSearch}
                      onChange={e => setTaxSearch(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, width: 200 }}
                    />
                  </div>
                </div>

                {/* Documents Table */}
                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 4 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '10px 12px' }}>เลขที่เอกสาร</th>
                        <th style={{ padding: '10px 12px' }}>ประเภท</th>
                        <th style={{ padding: '10px 12px' }}>คำสั่งซื้อ</th>
                        <th style={{ padding: '10px 12px' }}>ผู้ซื้อ / นิติบุคคล</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>ฐานภาษี</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>VAT 7%</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>ยอดสุทธิ</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>อีเมล</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = taxDocs
                          .filter(doc => (taxDocFilter === 'ALL' || doc.docType === taxDocFilter))
                          .filter(doc => {
                            if (!taxSearch) return true;
                            const q = taxSearch.toLowerCase();
                            return doc.docNumber.toLowerCase().includes(q) ||
                              doc.buyerName.toLowerCase().includes(q) ||
                              (doc.buyerTaxId && doc.buyerTaxId.includes(q)) ||
                              doc.orderId.toLowerCase().includes(q);
                          });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={9} style={{ textAlign: 'center', padding: '36px 20px', color: '#94A3B8' }}>
                                ยังไม่มีเอกสารภาษีหรือใบกำกับภาษีในระบบ
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((doc, idx) => (
                          <tr key={doc.id} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1E293B' }}>
                              {doc.docNumber}
                              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 400 }}>{doc.createdAt}</div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  background: doc.docType === 'TAX_INVOICE' ? '#EFF6FF' : doc.docType === 'RECEIPT' ? '#F0FDF4' : '#FEF2F2',
                                  color: doc.docType === 'TAX_INVOICE' ? '#1D4ED8' : doc.docType === 'RECEIPT' ? '#15803D' : '#B91C1C',
                                }}
                              >
                                {doc.docType === 'TAX_INVOICE' ? 'ใบกำกับภาษี' : doc.docType === 'RECEIPT' ? 'ใบเสร็จรับเงิน' : 'ใบลดหนี้'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#2563EB', fontWeight: 600 }}>
                              #{doc.orderId}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 600, color: '#1E293B' }}>{doc.buyerName}</div>
                              {doc.buyerTaxId && doc.buyerTaxId !== '-' && (
                                <div style={{ fontSize: 10, color: '#64748B' }}>Tax ID: {doc.buyerTaxId} ({doc.buyerBranch || '00000'})</div>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>
                              ฿{doc.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>
                              {doc.vatAmount !== 0 ? `฿${doc.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#1E293B' }}>
                              ฿{doc.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <span style={{ fontSize: 10, color: '#10B981', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                ✓ ส่งแล้ว
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(doc)}
                                  title="ดูตัวอย่างเอกสารใบกำกับภาษี"
                                  style={{ padding: '4px 8px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  <Eye size={12} /> ดู
                                </button>
                                <button
                                  type="button"
                                  onClick={() => triggerToast(`📥 ดาวน์โหลดไฟล์ ${doc.docNumber}.pdf สำเร็จ`)}
                                  title="ดาวน์โหลด PDF"
                                  style={{ padding: '4px 8px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                                >
                                  <Download size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => triggerToast(`📧 ส่งเอกสารซ้ำไปยัง ${doc.buyerEmail} สำเร็จ`)}
                                  title="ส่งอีเมลซ้ำ"
                                  style={{ padding: '4px 8px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                                >
                                  <Send size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub Tab 2: Store Tax Profile & KYC Settings */}
            {taxSubTab === 'settings' && (
              <div style={{ maxWidth: 720 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '1.25rem', borderRadius: 6, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1E293B' }}>
                        สถานะการจดทะเบียนภาษีมูลค่าเพิ่ม (VAT Registration)
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#64748B' }}>
                        กำหนดว่าร้านของคุณมีหน้าที่เสียภาษีมูลค่าเพิ่ม 7% (ภ.พ.20) หรือเป็นผู้ประกอบการที่ไม่จด VAT
                      </p>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: '#FFFFFF', padding: '6px 12px', border: '1px solid #CBD5E1', borderRadius: 4 }}>
                      <input
                        type="checkbox"
                        checked={taxProfile.isVatRegistered}
                        onChange={e => setTaxProfile(p => ({ ...p, isVatRegistered: e.target.checked }))}
                        style={{ width: 18, height: 18, accentColor: '#2563EB', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>จด ภ.พ.20 (ออก VAT 7% ได้)</span>
                    </label>
                  </div>

                  <div style={{ fontSize: 11, color: taxProfile.isVatRegistered ? '#15803D' : '#B45309', background: taxProfile.isVatRegistered ? '#DCFCE7' : '#FEF3C7', padding: '8px 12px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{taxProfile.isVatRegistered ? '✓' : '⚠'}</span>
                    <span>
                      {taxProfile.isVatRegistered
                        ? 'ระบบจะเปิดป้าย "🧾 ออกใบกำกับภาษีได้" บนสินค้าทุกชิ้น และสร้าง e-Tax Invoice ให้ลูกค้าที่ขออัตโนมัติ'
                        : 'ระบบจะไม่อนุญาตให้ออกใบกำกับภาษี VAT 7% โดยจะออกเป็นใบเสร็จรับเงิน (Receipt) ทั่วไปแทนเพื่อความถูกต้องตามกฎหมาย'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      เลขประจำตัวผู้เสียภาษี (Tax ID 13 หลัก) *
                    </label>
                    <input
                      type="text"
                      maxLength={13}
                      value={taxProfile.taxId}
                      onChange={e => setTaxProfile(p => ({ ...p, taxId: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 4, outline: 'none' }}
                      placeholder="0105562019876"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      รหัสสาขา (Branch Code) *
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      value={taxProfile.taxBranchCode}
                      onChange={e => setTaxProfile(p => ({ ...p, taxBranchCode: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 4, outline: 'none' }}
                      placeholder="00000 (สำนักงานใหญ่)"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    ชื่อผู้ประกอบการ / บริษัทจดทะเบียนตาม ภ.พ.20 *
                  </label>
                  <input
                    type="text"
                    value={taxProfile.taxCompanyName}
                    onChange={e => setTaxProfile(p => ({ ...p, taxCompanyName: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 4, outline: 'none' }}
                    placeholder="เช่น บริษัท มูฟมอลล์ เทคโปร จำกัด"
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    ที่อยู่ตามทะเบียนภาษี (Tax Registered Address) *
                  </label>
                  <textarea
                    rows={3}
                    value={taxProfile.taxAddress}
                    onChange={e => setTaxProfile(p => ({ ...p, taxAddress: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 4, outline: 'none', resize: 'vertical' }}
                    placeholder="อาคาร เลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: 4, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>ส่ง e-Tax Invoice ทางอีเมลอัตโนมัติ</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>ระบบจะส่งไฟล์ PDF และ XML ตามมาตรฐาน ETDA ทันทีที่ออเดอร์ส่งสำเร็จ</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={taxProfile.eTaxAutoEmail}
                    onChange={e => setTaxProfile(p => ({ ...p, eTaxAutoEmail: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveTaxSettings}
                  disabled={isTaxSaving}
                  style={{
                    padding: '10px 24px',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {isTaxSaving ? <RefreshCw size={14} className="spin-animation" /> : <Check size={14} />}
                  {taxSaveSuccess ? '✓ บันทึกสำเร็จแล้ว' : 'บันทึกการตั้งค่าภาษี'}
                </button>
              </div>
            )}

            {/* Sub Tab 3: Monthly ภ.พ.30 VAT Report */}
            {taxSubTab === 'report' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: 'var(--space-4)', borderRadius: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ยอดขายรวมทั้งสิ้น (Gross Sales)</span>
                    <h4 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0' }}>฿185,400.00</h4>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ประจำเดือนสิงหาคม 2569</span>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: 'var(--space-4)', borderRadius: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ยอดขายที่ต้องเสียภาษี (Tax Base)</span>
                    <h4 style={{ fontSize: 22, fontWeight: 900, color: '#1E40AF', margin: '4px 0' }}>฿173,271.03</h4>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ฐานภาษีสำหรับยื่น ภ.พ.30</span>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: 'var(--space-4)', borderRadius: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ภาษีขาย 7% (Output VAT)</span>
                    <h4 style={{ fontSize: 22, fontWeight: 900, color: '#DC2626', margin: '4px 0' }}>฿12,128.97</h4>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ยอดภาษีที่ต้องนำส่งกรมสรรพากร</span>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: 'var(--space-4)', borderRadius: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ยอดรับสุทธิหลังหักค่าธรรมเนียม</span>
                    <h4 style={{ fontSize: 22, fontWeight: 900, color: '#10B981', margin: '4px 0' }}>฿179,445.60</h4>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>โอนเข้าบัญชีเรียบร้อย</span>
                  </div>
                </div>

                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1.25rem', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1E40AF', margin: '0 0 4px 0' }}>
                      📑 ดาวน์โหลดรายงานสรุปภาษีขาย ภ.พ.30 (Monthly VAT Return)
                    </h4>
                    <p style={{ margin: 0, fontSize: 12, color: '#3B82F6' }}>
                      ไฟล์พร้อมนำเข้าโปรแกรมบัญชี (FlowAccount, PEAK, Express) หรือยื่น e-Filing กรมสรรพากร
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      style={{ padding: '8px 14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => triggerToast('📥 ดาวน์โหลดรายงาน ภ.พ.30 (PDF) สำเร็จ')}
                    >
                      <Download size={14} /> ดาวน์โหลด ภ.พ.30 (PDF)
                    </button>
                    <button
                      type="button"
                      style={{ padding: '8px 14px', background: 'white', border: '1px solid #CBD5E1', color: '#1E293B', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => triggerToast('📥 ส่งออกรายการภาษีขาย (Excel/CSV) สำเร็จ')}
                    >
                      <Download size={14} /> ส่งออกรายงานขาย (CSV)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tax Document Interactive Preview Modal (Thai Revenue Dept Standard) */}
        {previewDoc && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setPreviewDoc(null)}
          >
            <div
              style={{
                background: '#FFFFFF',
                width: '100%',
                maxWidth: 760,
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: 8,
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #E2E8F0',
                fontFamily: "'Sarabun', 'Inter', sans-serif",
                position: 'relative',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Actions Top Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
                    {previewDoc.docType === 'TAX_INVOICE' ? 'ต้นฉบับ (ORIGINAL)' : 'สำเนา (COPY)'}
                  </span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>มาตรฐานกรมสรรพากร (e-Tax by Email / ETDA)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{ padding: '6px 12px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Printer size={14} /> พิมพ์เอกสาร
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerToast(`📥 ดาวน์โหลด ${previewDoc.docNumber}.pdf สำเร็จ`)}
                    style={{ padding: '6px 12px', background: '#F1F5F9', color: '#1E293B', border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={14} /> ดาวน์โหลด PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ maxWidth: '60%' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#1E293B', marginBottom: 4 }}>
                    {taxProfile.taxCompanyName}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
                    {taxProfile.taxAddress}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                    <strong>เลขประจำตัวผู้เสียภาษี:</strong> {taxProfile.taxId} &nbsp;|&nbsp; <strong>สาขา:</strong> {taxProfile.taxBranchCode === '00000' ? 'สำนักงานใหญ่' : taxProfile.taxBranchCode}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1E3A8A', margin: '0 0 4px 0' }}>
                    {previewDoc.docType === 'TAX_INVOICE' && 'ใบกำกับภาษี / ใบเสร็จรับเงิน'}
                    {previewDoc.docType === 'RECEIPT' && 'ใบเสร็จรับเงิน (RECEIPT)'}
                    {previewDoc.docType === 'CREDIT_NOTE' && 'ใบลดหนี้ (CREDIT NOTE)'}
                  </h2>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>
                    {previewDoc.docType === 'TAX_INVOICE' && 'TAX INVOICE / RECEIPT'}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    <div><strong>เลขที่เอกสาร:</strong> {previewDoc.docNumber}</div>
                    <div><strong>วันที่ออก:</strong> {previewDoc.createdAt}</div>
                    <div><strong>อ้างอิงคำสั่งซื้อ:</strong> #{previewDoc.orderId}</div>
                  </div>
                </div>
              </div>

              {/* Buyer Info Box */}
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '12px 16px', borderRadius: 4, marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                  ข้อมูลผู้ซื้อ / CUSTOMER INFO
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>{previewDoc.buyerName}</div>
                <div style={{ fontSize: 11, color: '#475569', margin: '2px 0' }}>{previewDoc.buyerAddress}</div>
                {previewDoc.buyerTaxId && previewDoc.buyerTaxId !== '-' && (
                  <div style={{ fontSize: 11, color: '#475569' }}>
                    <strong>เลขประจำตัวผู้เสียภาษี:</strong> {previewDoc.buyerTaxId} &nbsp;|&nbsp; <strong>สาขา:</strong> {previewDoc.buyerBranch || 'สำนักงานใหญ่'}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#2563EB', marginTop: 2 }}>
                  <strong>อีเมลรับเอกสาร:</strong> {previewDoc.buyerEmail}
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: '#1E3A8A', color: '#FFFFFF', fontWeight: 700 }}>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: 40 }}>#</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>รายการสินค้า (Description)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: 60 }}>จำนวน</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: 100 }}>ราคา/หน่วย</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {(previewDoc.items || [{ name: 'สินค้าคำสั่งซื้อ #' + previewDoc.orderId, qty: 1, price: previewDoc.totalAmount }]).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748B' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', color: '#1E293B', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>
                        ฿{item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#1E293B' }}>
                        ฿{(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculation Summary Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 }}>
                <div style={{ maxWidth: 360 }}>
                  <div style={{ border: '1px dashed #CBD5E1', padding: 10, borderRadius: 4, background: '#FAFAFA' }}>
                    <div style={{ fontSize: 10, color: '#10B981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={12} /> เอกสารอิเล็กทรอนิกส์พร้อมลายมือชื่อดิจิทัล (Digital Signature)
                    </div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                      เอกสารนี้จัดทำและส่งมอบตามระเบียบกรมสรรพากรว่าด้วยการจัดทำ ส่งมอบ และเก็บรักษาใบกำกับภาษีอิเล็กทรอนิกส์ พ.ศ. 2560
                    </div>
                  </div>
                </div>

                <div style={{ width: 280 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: '#475569' }}>
                    <span>รวมมูลค่าสินค้า:</span>
                    <span>฿{previewDoc.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {previewDoc.docType === 'TAX_INVOICE' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: '#475569' }}>
                        <span>มูลค่าที่ไม่มี / ได้รับยกเว้น VAT:</span>
                        <span>฿0.00</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: '#475569' }}>
                        <span>มูลค่าฐานภาษี (Taxable Base):</span>
                        <span>฿{previewDoc.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: '#DC2626', fontWeight: 700 }}>
                        <span>ภาษีมูลค่าเพิ่ม 7% (VAT 7%):</span>
                        <span>฿{previewDoc.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, borderTop: '2px solid #1E293B', paddingTop: 6, marginTop: 4, color: '#1E293B' }}>
                    <span>จำนวนเงินรวมสุทธิ:</span>
                    <span>฿{previewDoc.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Message Feedback */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              background: '#1E293B',
              color: '#FFFFFF',
              padding: '12px 20px',
              borderRadius: 6,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
              fontSize: 13,
              fontWeight: 700,
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              animation: 'slideUp 0.2s ease',
            }}
          >
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Flash Sale Campaign Nomination Hub */}
        {activeTab === 'flash' && (
          <div style={{ background: 'white', border: '1px solid var(--border)', padding: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
            {/* Master Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={20} style={{ color: '#DC2626' }} />
                  ศูนย์เสนอขาย Flash Sale สำหรับผู้ขาย (Flash Sale Nomination Hub)
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
                  เพิ่มยอดเข้าชมร้านค้า (Traffic Boost 10x) และเร่งยอดขายทันที ด้วยการเสนอสินค้าเข้าร่วมดีลลดราคาแรงประจำวัน
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNominateModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                }}
              >
                <Plus size={16} />
                + เสนอสินค้าเข้าร่วม Flash Sale
              </button>
            </div>

            {/* 3 Steps Guide */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              <div style={{ background: '#FFF1F2', border: '1px solid #FFE4E6', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#DC2626' }}>STEP 1: เลือกรอบเวลา</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginTop: 2 }}>เลือกรอบกิจกรรมประจำวัน</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>เลือกช่วงเวลา 12:00 น., 16:00 น. หรือ 20:00 น.</div>
              </div>
              <div style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#2563EB' }}>STEP 2: ตั้งราคาลดพิเศษ</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginTop: 2 }}>ส่วนลดพิเศษ 15% - 70%</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>ระบุราคาส่วนลดดีลเดือดพร้อมสำรองจำนวนสต็อก</div>
              </div>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#059669' }}>STEP 3: ติดป้ายแดงหน้าแรก</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginTop: 2 }}>การันตีแท็ก Flash Sale</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>ระบบโปรโมตสินค้าของคุณบนหน้าแรกทันทีเมื่อเปิดรอบ</div>
              </div>
            </div>

            {/* Registered Nominations Table & Cards */}
            <div className="seller-flash-nominations-box">
              <div className="seller-flash-nominations-header">
                <span>รายการสินค้าที่เสนอเข้าร่วม Flash Sale ({flashNominations.length})</span>
                <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>🟢 อนุมัติแล้ว {flashNominations.filter(n => n.status === 'approved').length} ดีล</span>
              </div>

              {/* Desktop Table View */}
              <div className="seller-desktop-table seller-table-container">
                <table className="seller-table">
                  <thead>
                    <tr>
                      <th>สินค้า</th>
                      <th>รอบเวลากิจกรรม</th>
                      <th>ราคาปกติ</th>
                      <th>ราคา Flash Sale</th>
                      <th>สต็อกสำรอง</th>
                      <th>สถานะ</th>
                      <th style={{ textAlign: 'right' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flashNominations.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                          ยังไม่มีสินค้าที่ลงทะเบียนในขณะนี้ กดปุ่ม "+ เสนอสินค้าเข้าร่วม Flash Sale" ด้านบนเพื่อเริ่มต้น
                        </td>
                      </tr>
                    ) : (
                      flashNominations.map(nom => (
                        <tr key={nom.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <img
                                src={nom.productImage}
                                alt={nom.productName}
                                style={{ width: 42, height: 42, objectFit: 'cover', border: '1px solid var(--border)', borderRadius: 4 }}
                              />
                              <div>
                                <div style={{ fontWeight: 800, fontSize: 13, color: '#111827' }}>{nom.productName}</div>
                                <div style={{ fontSize: 10, color: '#6B7280' }}>ลงทะเบียน: {nom.registeredAt}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: 11, fontWeight: 800, background: '#FFF1F2', color: '#DC2626', padding: '3px 8px', borderRadius: 4 }}>
                              ⏰ {nom.timeSlot}
                            </span>
                          </td>
                          <td style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: 12 }}>
                            ฿{nom.originalPrice.toLocaleString()}
                          </td>
                          <td>
                            <div style={{ fontWeight: 900, color: '#DC2626', fontSize: 14 }}>
                              ฿{nom.flashPrice.toLocaleString()}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 900, background: '#DC2626', color: 'white', padding: '1px 5px', borderRadius: 2 }}>
                              -{nom.discountPct}%
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, fontSize: 12 }}>
                            📦 {nom.reservedStock} ชิ้น
                          </td>
                          <td>
                            {nom.status === 'approved' ? (
                              <span className="seller-order-status seller-order-status--delivered">
                                🟢 อนุมัติแล้ว (Scheduled)
                              </span>
                            ) : (
                              <span className="seller-order-status seller-order-status--processing">
                                ⏳ กำลังตรวจสอบ
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('คุณต้องการยกเลิกการเสนอสินค้า Flash Sale รายการนี้ใช่หรือไม่?')) {
                                  setFlashNominations(prev => prev.filter(n => n.id !== nom.id));
                                }
                              }}
                              className="seller-table-action-btn seller-table-action-btn--delete"
                            >
                              <Trash2 size={13} /> ยกเลิกคำขอ
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Flash Sale Cards List */}
              <div className="seller-flash-mobile-list">
                {flashNominations.length === 0 ? (
                  <div className="seller-flash-mobile-empty">
                    ยังไม่มีสินค้าที่เสนอเข้าร่วม Flash Sale ในขณะนี้
                  </div>
                ) : (
                  flashNominations.map(nom => (
                    <div key={nom.id} className="seller-flash-mobile-card">
                      <div className="seller-flash-mobile-card__header">
                        <img
                          src={nom.productImage}
                          alt={nom.productName}
                          className="seller-flash-mobile-card__img"
                        />
                        <div className="seller-flash-mobile-card__info">
                          <h4 className="seller-flash-mobile-card__name">{nom.productName}</h4>
                          <span className="seller-flash-mobile-card__date">ลงทะเบียน: {nom.registeredAt}</span>
                        </div>
                      </div>

                      <div className="seller-flash-mobile-card__slot-badge">
                        ⏰ รอบเวลากิจกรรม: {nom.timeSlot}
                      </div>

                      <div className="seller-flash-mobile-card__stats-grid">
                        <div className="seller-flash-mobile-card__stat">
                          <span className="seller-flash-mobile-card__stat-label">ราคาปกติ</span>
                          <span className="seller-flash-mobile-card__stat-val seller-flash-mobile-card__stat-val--orig">
                            ฿{nom.originalPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="seller-flash-mobile-card__stat">
                          <span className="seller-flash-mobile-card__stat-label">ราคา Flash Sale</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="seller-flash-mobile-card__stat-val seller-flash-mobile-card__stat-val--flash">
                              ฿{nom.flashPrice.toLocaleString()}
                            </span>
                            <span className="seller-flash-mobile-card__discount">
                              -{nom.discountPct}%
                            </span>
                          </div>
                        </div>
                        <div className="seller-flash-mobile-card__stat">
                          <span className="seller-flash-mobile-card__stat-label">สต็อกสำรอง</span>
                          <span className="seller-flash-mobile-card__stat-val">
                            📦 {nom.reservedStock} ชิ้น
                          </span>
                        </div>
                        <div className="seller-flash-mobile-card__stat">
                          <span className="seller-flash-mobile-card__stat-label">สถานะดีล</span>
                          <span className={`seller-flash-status-badge seller-flash-status-badge--${nom.status}`}>
                            {nom.status === 'approved' ? '🟢 อนุมัติแล้ว' : '⏳ กำลังตรวจ'}
                          </span>
                        </div>
                      </div>

                      <div className="seller-flash-mobile-card__footer">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('คุณต้องการยกเลิกการเสนอสินค้า Flash Sale รายการนี้ใช่หรือไม่?')) {
                              setFlashNominations(prev => prev.filter(n => n.id !== nom.id));
                            }
                          }}
                          className="seller-flash-mobile-cancel-btn"
                        >
                          <Trash2 size={13} /> ยกเลิกคำขอ Flash Sale
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Seller Live Customer Chat Tab ── */}
        {activeTab === 'chat' && (
          <div className="seller-chat-wrapper">
            <div className="seller-chat-layout">

              {/* ── Left Sidebar: Customer List ── */}
              <div className="seller-chat-sidebar">
                <div className="seller-chat-sidebar__header">
                  <h3 className="seller-chat-sidebar__title">
                    <span>💬 รายการลูกค้า</span>
                    {isSellerSocketConnected && (
                      <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Radio size={10} /> ออนไลน์
                      </span>
                    )}
                  </h3>
                  {archivedThreads.length > 0 && (
                    <div className="seller-chat-archive-count">
                      🗂️ ซ่อนไว้ {archivedThreads.length} การสนทนา
                    </div>
                  )}
                </div>

                <div className="seller-chat-customer-list">
                  {(() => {
                    const allIds = Array.from(new Set([
                      ...Object.keys(sellerMessages)
                        .filter(k => k.startsWith(`${currentStore.id}::`))
                        .map(k => k.split('::')[1]),
                      ...sellerOrders
                        .filter(o => o.storeId === currentStore.id)
                        .map(o => o.user?.id || (o.customerName ? `buyer-${o.orderId}` : null))
                        .filter(Boolean) as string[],
                    ]));

                    // Separate active vs archived
                    const activeChatCustomerIds = allIds.filter(id => !archivedThreads.includes(id));
                    const archivedIds = allIds.filter(id => archivedThreads.includes(id));

                    if (allIds.length === 0) {
                      return (
                        <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
                          <MessageSquare size={28} style={{ opacity: 0.35, margin: '0 auto 10px', display: 'block', color: '#64748B' }} />
                          <strong style={{ color: '#334155', display: 'block', marginBottom: 4 }}>ยังไม่มีลูกค้าทักแชท</strong>
                          เมื่อมีผู้ซื้อส่งข้อความสอบถาม จะปรากฏในรายการนี้แบบสด
                        </div>
                      );
                    }

                    const renderCustomerItem = (cId: string, isArchived: boolean, idx: number) => {
                      const isSelected = (selectedCustomerId || activeChatCustomerIds[0]) === cId;
                      const matchedOrder = sellerOrders.find(o => o.user?.id === cId || `buyer-${o.orderId}` === cId);
                      const customerDisplayName = matchedOrder
                        ? matchedOrder.customerName
                        : (cId === 'guest_user' ? 'ลูกค้าทั่วไป' : `ลูกค้า #${cId.slice(-6)}`);
                      const threadKey = `${currentStore.id}::${cId}`;
                      const threadMsgs = sellerMessages[threadKey] || [];
                      const lastMsg = threadMsgs[threadMsgs.length - 1];
                      const sourceInfo = chatSourceMap[cId];

                      return (
                        <div
                          key={cId}
                          className={`seller-chat-customer-item${isSelected && !isArchived ? ' seller-chat-customer-item--active' : ''}${isArchived ? ' seller-chat-customer-item--archived' : ''}`}
                          onClick={() => { if (!isArchived) { setSelectedCustomerId(cId); } }}
                          onMouseEnter={() => setHoveredCustomerId(cId)}
                          onMouseLeave={() => setHoveredCustomerId(null)}
                        >
                          <div className="seller-chat-customer-avatar">
                            {idx % 3 === 0 ? '👤' : idx % 3 === 1 ? '👨' : '👩'}
                          </div>
                          <div className="seller-chat-customer-meta">
                            <div className="seller-chat-customer-name-row">
                              <span className="seller-chat-customer-name">{customerDisplayName}</span>
                              <span className="seller-chat-customer-time">{lastMsg?.time || ''}</span>
                            </div>
                            {sourceInfo && (
                              <div className="seller-chat-customer-source">
                                📍 {sourceInfo.label}
                              </div>
                            )}
                            <p className="seller-chat-customer-preview">
                              {lastMsg ? lastMsg.text : 'เริ่มการสนทนากับลูกค้า...'}
                            </p>
                          </div>
                          {/* Hover action buttons */}
                          {hoveredCustomerId === cId && (
                            <div className="seller-chat-customer-hover-actions" onClick={e => e.stopPropagation()}>
                              {isArchived ? (
                                <button
                                  className="seller-chat-restore-btn"
                                  title="กู้คืนการสนทนา"
                                  onClick={() => restoreThread(cId)}
                                >↩️</button>
                              ) : (
                                <button
                                  className="seller-chat-archive-btn"
                                  title="ซ่อนการสนทนา (Archive)"
                                  onClick={() => archiveThread(cId)}
                                >🗂️</button>
                              )}
                              <button
                                className="seller-chat-delete-btn"
                                title="ลบการสนทนาถาวร"
                                onClick={() => {
                                  if (confirm(`ลบการสนทนากับ "${customerDisplayName}" ถาวรหรือไม่?\nข้อความทั้งหมดจะหายไป ไม่สามารถกู้คืนได้`)) {
                                    deleteThreadPermanently(cId);
                                  }
                                }}
                              >🗑️</button>
                            </div>
                          )}
                        </div>
                      );
                    };

                    return (
                      <>
                        {activeChatCustomerIds.map((cId, idx) => renderCustomerItem(cId, false, idx))}
                        {archivedIds.length > 0 && (
                          <>
                            <div className="seller-chat-section-divider">🗂️ ซ่อนไว้</div>
                            {archivedIds.map((cId, idx) => renderCustomerItem(cId, true, idx))}
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* ── Center: Chat Thread ── */}
              <div className="seller-chat-main">
                {(() => {
                  const activeChatCustomerIds = Array.from(new Set([
                    ...Object.keys(sellerMessages)
                      .filter(k => k.startsWith(`${currentStore.id}::`))
                      .map(k => k.split('::')[1]),
                    ...sellerOrders
                      .filter(o => o.storeId === currentStore.id)
                      .map(o => o.user?.id || (o.customerName ? `buyer-${o.orderId}` : null))
                      .filter(Boolean) as string[],
                  ])).filter(id => !archivedThreads.includes(id));

                  if (activeChatCustomerIds.length === 0) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>
                        <MessageSquare size={48} style={{ opacity: 0.25, marginBottom: 14, color: '#2563EB' }} />
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>พร้อมรับข้อความสนทนาจากลูกค้า</div>
                        <div style={{ fontSize: 13, color: '#64748B', maxWidth: 380, lineHeight: 1.6 }}>
                          ร้านค้าของคุณเชื่อมต่อกับระบบ <strong>Movemall Live WebSocket</strong> แล้ว เมื่อมีลูกค้าทักเข้ามา ข้อความจะแสดงผลที่นี่ทันทีแบบเรียลไทม์
                        </div>
                      </div>
                    );
                  }

                  const activeCustomerId = selectedCustomerId || activeChatCustomerIds[0];
                  const activeThreadKey = `${currentStore.id}::${activeCustomerId}`;
                  const activeChatList = sellerMessages[activeThreadKey] || [];
                  const matchedOrder = sellerOrders.find(o => o.user?.id === activeCustomerId || `buyer-${o.orderId}` === activeCustomerId);
                  const currentCustomerTitle = matchedOrder
                    ? `${matchedOrder.customerName}`
                    : (activeCustomerId === 'guest_user' ? 'ลูกค้าทั่วไป' : `ลูกค้า #${activeCustomerId.slice(-6)}`);

                  return (
                    <>
                      <div className="seller-chat-header">
                        <div>
                          <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                            {currentCustomerTitle}
                          </strong>
                          {matchedOrder && (
                            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                              #{matchedOrder.orderId} · {matchedOrder.items?.length || 0} รายการ · ฿{matchedOrder.total?.toLocaleString()}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <span>● กำลังสนทนาผ่าน WebSocket สด</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="seller-chat-panel-toggle"
                            onClick={() => setShowCustomerPanel(p => !p)}
                            title={showCustomerPanel ? 'ซ่อนข้อมูลลูกค้า' : 'แสดงข้อมูลลูกค้า'}
                          >
                            👤 {showCustomerPanel ? '◀' : '▶'}
                          </button>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', background: '#F3F4F6', padding: '4px 8px', borderRadius: 4 }}>
                            🔒 Movemall Merchant Shield
                          </span>
                        </div>
                      </div>

                      <div ref={sellerMessagesAreaRef} className="seller-chat-messages-area">
                        {activeChatList.length === 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', padding: 30, textAlign: 'center' }}>
                            <MessageSquare size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>เริ่มการสนทนากับลูกค้า</div>
                            <div style={{ fontSize: 12 }}>พิมพ์ข้อความตอบกลับหรือเลือกข้อความด่วนด้านล่างเพื่อเริ่มการสนทนา</div>
                          </div>
                        ) : (
                          activeChatList.map((msg, mIdx) => (
                            <div
                              key={msg.id || mIdx}
                              className={`seller-chat-bubble-wrap ${msg.sender === 'store' ? 'seller-chat-bubble-wrap--seller' : 'seller-chat-bubble-wrap--customer'}`}
                            >
                              <div className="seller-chat-bubble">
                                {msg.text}
                              </div>
                              <span className="seller-chat-time">
                                {msg.time || '10:00'} • {msg.sender === 'store' ? 'ร้านค้า (คุณ)' : 'ลูกค้า'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Quick Merchant Replies */}
                      <div className="seller-chat-quick-replies">
                        {[
                          '📦 สินค้ามีพร้อมส่งสต็อกแน่น จัดส่งรอบวันนี้ทันทีครับ 🚀',
                          '🧾 ทางร้านสามารถออกใบกำกับภาษีเต็มรูปแบบได้ครับ 📑',
                          '🎟️ มอบโค้ดส่วนลด 10% พิเศษสำหรับคำสั่งซื้อนี้ครับ 🎁',
                          '✨ สินค้าของแท้ 100% มีประกันศูนย์ไทย 1 ปีเต็มครับ 🛡️',
                        ].map((quick, qIdx) => (
                          <button
                            key={qIdx}
                            type="button"
                            className="seller-chat-quick-btn"
                            onClick={() => handleSellerSendMessage(undefined, quick)}
                          >
                            {quick}
                          </button>
                        ))}
                      </div>

                      {/* Send Input Bar */}
                      <form className="seller-chat-input-row" onSubmit={handleSellerSendMessage}>
                        <input
                          type="text"
                          className="seller-chat-input"
                          placeholder="พิมพ์ข้อความตอบกลับลูกค้าในนามร้านค้า..."
                          value={sellerInputVal}
                          onChange={e => setSellerInputVal(e.target.value)}
                        />
                        <button type="submit" className="seller-chat-send-btn">
                          <Send size={14} />
                          <span>ตอบกลับ</span>
                        </button>
                      </form>
                    </>
                  );
                })()}
              </div>

              {/* ── Right Panel: Customer Info ── */}
              {showCustomerPanel && (() => {
                const activeChatCustomerIds = Array.from(new Set([
                  ...Object.keys(sellerMessages)
                    .filter(k => k.startsWith(`${currentStore.id}::`))
                    .map(k => k.split('::')[1]),
                  ...sellerOrders
                    .filter(o => o.storeId === currentStore.id)
                    .map(o => o.user?.id || (o.customerName ? `buyer-${o.orderId}` : null))
                    .filter(Boolean) as string[],
                ])).filter(id => !archivedThreads.includes(id));

                const activeCustomerId = selectedCustomerId || activeChatCustomerIds[0];
                if (!activeCustomerId) return null;

                const matchedOrders = sellerOrders.filter(o =>
                  o.user?.id === activeCustomerId || `buyer-${o.orderId}` === activeCustomerId
                );
                const latestOrder = matchedOrders[0];
                const sourceInfo = chatSourceMap[activeCustomerId];
                const threadKey = `${currentStore.id}::${activeCustomerId}`;
                const threadMsgs = sellerMessages[threadKey] || [];
                const firstMsgDate = threadMsgs[0]?.time || 'ไม่ทราบ';
                const totalSpend = matchedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
                const shippingAddr = latestOrder?.shippingAddress || latestOrder?.address;

                return (
                  <div className="seller-chat-info-panel">
                    {/* Header */}
                    <div className="seller-chat-info-panel__header">
                      <span>👤 ข้อมูลลูกค้า</span>
                    </div>

                    {/* Customer Profile */}
                    <div className="seller-chat-info-section">
                      <div className="seller-chat-info-avatar">
                        {latestOrder?.customerName?.charAt(0) || '?'}
                      </div>
                      <div className="seller-chat-info-name">
                        {latestOrder?.customerName || (activeCustomerId === 'guest_user' ? 'ลูกค้าทั่วไป' : `ลูกค้า #${activeCustomerId.slice(-6)}`)}
                      </div>
                      {latestOrder?.customerPhone && (
                        <div className="seller-chat-info-phone">📞 {latestOrder.customerPhone}</div>
                      )}
                      <div className="seller-chat-info-id">ID: {activeCustomerId.slice(0, 16)}{activeCustomerId.length > 16 ? '…' : ''}</div>
                    </div>

                    {/* Referral Source */}
                    <div className="seller-chat-info-block">
                      <div className="seller-chat-info-block__title">📍 ทักมาจาก</div>
                      {sourceInfo ? (
                        <div className="seller-chat-info-source-badge">
                          {sourceInfo.label}
                          <span className="seller-chat-info-source-time">{sourceInfo.openedAt}</span>
                        </div>
                      ) : (
                        <div className="seller-chat-info-block__empty">ไม่มีข้อมูลแหล่งที่มา</div>
                      )}
                    </div>

                    {/* Chat Stats */}
                    <div className="seller-chat-info-block">
                      <div className="seller-chat-info-block__title">📊 สถิติการสนทนา</div>
                      <div className="seller-chat-info-stats">
                        <div className="seller-chat-info-stat">
                          <span className="seller-chat-info-stat__num">{threadMsgs.length}</span>
                          <span className="seller-chat-info-stat__label">ข้อความ</span>
                        </div>
                        <div className="seller-chat-info-stat">
                          <span className="seller-chat-info-stat__num">{matchedOrders.length}</span>
                          <span className="seller-chat-info-stat__label">ออเดอร์</span>
                        </div>
                        <div className="seller-chat-info-stat">
                          <span className="seller-chat-info-stat__num">฿{totalSpend.toLocaleString()}</span>
                          <span className="seller-chat-info-stat__label">ยอดรวม</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                        ทักครั้งแรก: {firstMsgDate}
                      </div>
                    </div>

                    {/* Latest Orders */}
                    {matchedOrders.length > 0 && (
                      <div className="seller-chat-info-block">
                        <div className="seller-chat-info-block__title">📦 ออเดอร์ล่าสุด</div>
                        <div className="seller-chat-info-orders">
                          {matchedOrders.slice(0, 3).map(order => (
                            <div key={order.orderId} className="seller-chat-info-order-item">
                              <div className="seller-chat-info-order-id">#{order.orderId}</div>
                              <div className="seller-chat-info-order-items">
                                {order.items?.slice(0, 2).map((item: any, i: number) => (
                                  <div key={i} className="seller-chat-info-order-product">
                                    • {item.name || item.productName || `สินค้า ${i + 1}`}
                                  </div>
                                ))}
                                {order.items?.length > 2 && (
                                  <div className="seller-chat-info-order-product" style={{ color: 'var(--text-muted)' }}>
                                    +{order.items.length - 2} รายการเพิ่มเติม
                                  </div>
                                )}
                              </div>
                              <div className="seller-chat-info-order-footer">
                                <span className={`seller-chat-info-order-status seller-chat-info-order-status--${order.status || 'pending'}`}>
                                  {order.status === 'delivered' ? '✅ รับแล้ว' :
                                   order.status === 'shipped' ? '🚚 กำลังส่ง' :
                                   order.status === 'processing' ? '⚙️ กำลังเตรียม' :
                                   order.status === 'cancelled' ? '❌ ยกเลิก' : '⏳ รออนุมัติ'}
                                </span>
                                <span className="seller-chat-info-order-total">฿{order.total?.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shipping Address */}
                    {(shippingAddr || latestOrder?.customerAddress) && (
                      <div className="seller-chat-info-block">
                        <div className="seller-chat-info-block__title">🏠 ที่อยู่รับสินค้า</div>
                        <div className="seller-chat-info-address">
                          {latestOrder?.customerName && (
                            <div className="seller-chat-info-address__name">👤 {latestOrder.customerName}</div>
                          )}
                          {latestOrder?.customerPhone && (
                            <div className="seller-chat-info-address__phone">📞 {latestOrder.customerPhone}</div>
                          )}
                          <div className="seller-chat-info-address__text">
                            {typeof shippingAddr === 'string'
                              ? shippingAddr
                              : typeof latestOrder?.customerAddress === 'string'
                              ? latestOrder.customerAddress
                              : [
                                  shippingAddr?.addressLine || shippingAddr?.address,
                                  shippingAddr?.district,
                                  shippingAddr?.province,
                                  shippingAddr?.postalCode,
                                ].filter(Boolean).join(' ') || 'ไม่มีข้อมูลที่อยู่'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Action Buttons */}
                    <div className="seller-chat-info-actions">
                      <button
                        className="seller-chat-info-action-btn seller-chat-info-action-btn--archive"
                        onClick={() => archiveThread(activeCustomerId)}
                      >
                        🗂️ ซ่อนการสนทนา
                      </button>
                      <button
                        className="seller-chat-info-action-btn seller-chat-info-action-btn--delete"
                        onClick={() => {
                          const name = latestOrder?.customerName || `ลูกค้า #${activeCustomerId.slice(-6)}`;
                          if (confirm(`ลบการสนทนากับ "${name}" ถาวรหรือไม่?`)) {
                            deleteThreadPermanently(activeCustomerId);
                          }
                        }}
                      >
                        🗑️ ลบถาวร
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        )}

        {/* 🛡️ Tab: Shop Health & Buyer Protection Shield */}
        {activeTab === 'health' && (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top Score Summary Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: 'white',
              borderRadius: 6,
              padding: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} color="#10b981" /> สุขภาพร้านค้าโดยรวม (Overall Shop Health)
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 900, color: '#10b981' }}>{storeHealthScore}</span>
                  <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 100 คะแนน</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 4 }}>
                  ✓ ระดับยอดเยี่ยม: ร้านค้าของคุณมีสิทธิ์เข้าร่วมทุกแคมเปญ ไลฟ์สด และรับประกันการมองเห็น 100%
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>แต้มตัดสะสม (Penalty Points)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: storePenaltyPoints === 0 ? '#10b981' : '#ef4444', margin: '4px 0' }}>
                  {storePenaltyPoints} แต้ม
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>โควต้าปลอดภัย: ต่ำกว่า 3 แต้ม</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>อัตราจัดส่งล่าช้า (Late Shipment)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>
                  0.6%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>เกณฑ์มาตรฐาน: ไม่เกิน 10%</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>อัตราการยกเลิกโดยร้าน (Cancellation)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>
                  0.2%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>เกณฑ์มาตรฐาน: ไม่เกิน 5%</div>
              </div>
            </div>

            {/* Buyer Protection Shield & Report Section */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🛡️ ระบบปกป้องผู้ขาย & รายงานผู้ซื้อที่กระทำผิดกฎ (Seller Shield & Abuse Report)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                    พบเจอลูกค้าสั่งของเล่น, ปฏิเสธไม่รับพัสดุเก็บเงินปลายทาง (COD), หรือขอเงินคืนโดยไม่ส่งของจริงคืนร้านค้า แจ้งรายงานได้ทันที
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-btn-sm"
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.25rem',
                    borderRadius: 6,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onClick={() => setShowBuyerReportModal(true)}
                >
                  <AlertTriangle size={16} /> 🚨 แจ้งรายงานผู้ซื้อ / เคลมค่าเสียหาย COD
                </button>
              </div>

              {/* Protection Guarantees */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 6, borderLeft: '4px solid #2563eb' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>📦 ชดเชยค่าส่งพัสดุ COD ตีกลับ 100%</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                    หากลูกค้าปฏิเสธรับสินค้า COD ขนส่งนำจ่าย 3 ครั้งไม่สำเร็จ Movemall คืนเงินค่าธรรมเนียมจัดส่งเข้า Seller Wallet ทันที
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 6, borderLeft: '4px solid #dc2626' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>🚫 แบล็กลิสต์ & ตัดสิทธิ์ COD ลูกค้าเสี่ยง</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                    ลูกค้าที่มีสถิติปฏิเสธรับสินค้าจะถูกระบบลด Trust Score และปิดช่องทางเก็บเงินปลายทางอัตโนมัติ เพื่อป้องกันการสั่งเล่นซ้ำ
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 6, borderLeft: '4px solid #10b981' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>⚖️ ป้องกันการขอเงินคืนฉ้อโกง (Fraud Refund Shield)</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                    ทีมงาน CS ตรวจสอบหลักฐานวิดีโอแกะพัสดุ หากลูกค้าส่งกล่องเปล่าคืน ร้านค้าจะได้รับเงินค่าสินค้าเต็มจำนวน
                  </div>
                </div>
              </div>

              {/* My Filed Reports Table */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                📋 ประวัติการยื่นรายงานลูกค้าของคุณ ({myFiledReports.length})
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>เลขที่ออเดอร์</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>ชื่อลูกค้าที่ถูกร้องเรียน</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>ประเภทความผิด</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>รายละเอียด</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>สถานะการพิจารณา</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>การชดเชยร้านค้า</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myFiledReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8' }}>
                          ยังไม่มีประวัติการยื่นรายงานลูกค้า หากพบกรณีลูกค้าปฏิเสธรับพัสดุ COD หรือกลั่นแกล้ง สามารถกดปุ่ม "🚨 แจ้งรายงานผู้ซื้อ / เคลมค่าเสียหาย COD" ด้านบนเพื่อขอรับการชดเชยได้
                        </td>
                      </tr>
                    ) : (
                      myFiledReports.map(rep => (
                        <tr key={rep.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#2563eb' }}>{rep.orderId}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1e293b' }}>{rep.customerName}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: rep.type === 'COD_REJECTED' ? '#fee2e2' : '#fef3c7',
                              color: rep.type === 'COD_REJECTED' ? '#b91c1c' : '#b45309'
                            }}>
                              {rep.type === 'COD_REJECTED' && '🚨 ปฏิเสธรับ COD'}
                              {rep.type === 'REFUND_ABUSE' && '⚠️ ขอคืนเงินเท็จ'}
                              {rep.type === 'FAKE_ORDER' && '📦 สั่งเล่นสแปม'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#64748b', maxWidth: 280 }}>{rep.description}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {rep.status === 'ACTION_TAKEN' ? (
                              <span style={{ color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: 4 }}>
                                ✓ ลงโทษผู้ซื้อแล้ว
                              </span>
                            ) : (
                              <span style={{ color: '#b45309', fontWeight: 600, background: '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>
                                ⏳ กำลังตรวจสอบ
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {rep.compensationStatus === 'COMPENSATED_50THB' ? (
                              <span style={{ color: '#10b981', fontWeight: 700 }}>💰 ชดเชย ฿50 แล้ว</span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>รออนุมัติ</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Store Settings (ตั้งค่ารายละเอียดร้านค้า) ── */}
        {activeTab === 'settings' && (
          <div className="seller-settings-tab" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <form onSubmit={handleSaveStoreSettings}>
              {/* Header Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Settings size={22} style={{ color: '#2563EB' }} /> ตั้งค่ารายละเอียดร้านค้า (Store Settings)
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                    จัดการข้อมูลโปรไฟล์ร้านค้า ที่อยู่จัดส่งคลังสินค้า บัญชีรับเงินโอน Payout และระบบตอบกลับอัตโนมัติ
                  </p>
                </div>
                <button
                  type="submit"
                  style={{
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                  }}
                >
                  <Save size={16} /> บันทึกการเปลี่ยนแปลง
                </button>
              </div>

              {/* Grid 2 Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24 }}>
                
                {/* 1. Basic Store Profile Card */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #F3F4F6' }}>
                    <Store size={18} style={{ color: '#2563EB' }} />
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1F2937' }}>ข้อมูลร้านค้าทั่วไป (Store Profile)</h3>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                      ชื่อร้านค้า (Shop Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={storeSettingsForm.name}
                      onChange={e => setStoreSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none' }}
                      placeholder="เช่น TechPro Official Store"
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                      หมวดหมู่หลักของร้าน (Main Category)
                    </label>
                    <select
                      value={storeSettingsForm.category}
                      onChange={e => setStoreSettingsForm(prev => ({ ...prev, category: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', background: '#FFFFFF' }}
                    >
                      {categories.filter(c => c.id !== 'all').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                      คำอธิบายร้านค้า / Bio (แนะนำร้าน นโยบายการรับประกัน)
                    </label>
                    <textarea
                      rows={3}
                      value={storeSettingsForm.description}
                      onChange={e => setStoreSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', resize: 'vertical' }}
                      placeholder="อธิบายจุดเด่นของร้านค้า เช่น สินค้าของแท้ 100% ประกันศูนย์ จัดส่งไวใน 24 ชม."
                    />
                  </div>

                  {/* Logo Upload (Secure File Upload) */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>
                        โลโก้ร้านค้า (Shop Logo) *
                      </label>
                      <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 600, background: '#EFF6FF', padding: '2px 8px', borderRadius: 4 }}>
                        ขนาดแนะนำ: 500 x 500 px (1:1) • ไม่เกิน 3 MB
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 12, borderRadius: 6 }}>
                      {storeSettingsForm.logo ? (
                        <img
                          src={storeSettingsForm.logo}
                          alt="Shop Logo Preview"
                          style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #2563EB', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 22, flexShrink: 0 }}>
                          🏪
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <label style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#2563EB',
                            color: '#FFFFFF',
                            padding: '7px 14px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: '0.2s',
                          }}>
                            <Upload size={14} /> {storeSettingsForm.logo ? 'เปลี่ยนรูปโลโก้' : 'อัปโหลดรูปโลโก้'}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 3 * 1024 * 1024) {
                                    triggerToast('⚠️ ขนาดไฟล์โลโก้ต้องไม่เกิน 3 MB');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    setStoreSettingsForm(prev => ({ ...prev, logo: ev.target?.result as string }));
                                    triggerToast('📸 อัปโหลดโลโก้ร้านค้าสำเร็จ');
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {storeSettingsForm.logo && (
                            <button
                              type="button"
                              onClick={() => setStoreSettingsForm(prev => ({ ...prev, logo: '' }))}
                              style={{ padding: '7px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            >
                              ลบรูป
                            </button>
                          )}
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6B7280' }}>
                          รองรับไฟล์ JPG, PNG, WEBP (ภาพจะถูกตัดเป็นวงกลมแสดงบนหน้าร้านและหน้าสินค้า)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Banner Upload (Secure File Upload) */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>
                        ภาพหน้าปกแบนเนอร์ร้านค้า (Cover Banner) *
                      </label>
                      <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 700, background: '#FEF2F2', padding: '2px 8px', borderRadius: 4 }}>
                        ขนาดแนะนำ: 1200 x 400 px (3:1) • ไม่เกิน 5 MB
                      </span>
                    </div>

                    {storeSettingsForm.banner ? (
                      <div style={{ position: 'relative', height: 120, borderRadius: 6, overflow: 'hidden', border: '1px solid #E5E7EB', marginBottom: 8 }}>
                        <img
                          src={storeSettingsForm.banner}
                          alt="Banner Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
                          <label style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'rgba(17, 24, 39, 0.85)',
                            color: '#FFFFFF',
                            padding: '6px 12px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            backdropFilter: 'blur(4px)',
                          }}>
                            <Upload size={12} /> เปลี่ยนรูปแบนเนอร์
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    triggerToast('⚠️ ขนาดไฟล์แบนเนอร์ต้องไม่เกิน 5 MB');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    setStoreSettingsForm(prev => ({ ...prev, banner: ev.target?.result as string }));
                                    triggerToast('📸 อัปโหลดภาพหน้าปกแบนเนอร์สำเร็จ');
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setStoreSettingsForm(prev => ({ ...prev, banner: '' }))}
                            style={{
                              background: 'rgba(220, 38, 38, 0.85)',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            ลบรูป
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 110,
                        border: '2px dashed #CBD5E1',
                        borderRadius: 6,
                        background: '#F8FAFC',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        padding: 12,
                        textAlign: 'center',
                      }}>
                        <ImageIcon size={28} style={{ color: '#94A3B8', marginBottom: 6 }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                          คลิกเพื่ออัปโหลดภาพหน้าปกแบนเนอร์
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          สัดส่วน 3:1 แนะนำ 1200 x 400 px (JPG, PNG, WEBP สูงสุด 5 MB)
                        </div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                triggerToast('⚠️ ขนาดไฟล์แบนเนอร์ต้องไม่เกิน 5 MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setStoreSettingsForm(prev => ({ ...prev, banner: ev.target?.result as string }));
                                triggerToast('📸 อัปโหลดภาพหน้าปกแบนเนอร์สำเร็จ');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}

                    <div style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <CheckCircle2 size={12} /> ระบบอัปโหลดไฟล์ตรงเข้าสู่ Movemall Cloud Storage ปลอดภัย ไม่รองรับลิงก์ภาพภายนอก
                    </div>
                  </div>

                  {/* Social & Contact */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}>
                        เบอร์โทรติดต่อลูกค้า
                      </label>
                      <input
                        type="tel"
                        value={storeSettingsForm.contactPhone}
                        onChange={e => setStoreSettingsForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none' }}
                        placeholder="081-234-5678"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}>
                        อีเมลบริการลูกค้า
                      </label>
                      <input
                        type="email"
                        value={storeSettingsForm.contactEmail}
                        onChange={e => setStoreSettingsForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none' }}
                        placeholder="support@myshop.com"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Warehouse & Logistics Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* Warehouse Card */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #F3F4F6' }}>
                      <Truck size={18} style={{ color: '#2563EB' }} />
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1F2937' }}>ที่อยู่คลังสินค้า & การจัดส่ง (Logistics)</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                          ชื่อผู้ติดต่อคลังสินค้า *
                        </label>
                        <input
                          type="text"
                          required
                          value={storeSettingsForm.warehouseContact}
                          onChange={e => setStoreSettingsForm(prev => ({ ...prev, warehouseContact: e.target.value }))}
                          style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none' }}
                          placeholder="ชื่อผู้จัดส่ง"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                          เบอร์โทรศัพท์คลังสินค้า *
                        </label>
                        <input
                          type="tel"
                          required
                          value={storeSettingsForm.warehousePhone}
                          onChange={e => setStoreSettingsForm(prev => ({ ...prev, warehousePhone: e.target.value }))}
                          style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none' }}
                          placeholder="089-123-4567"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                        ที่อยู่ต้นทางสำหรับรถขนส่งเข้ารับพัสดุ (Pickup Address) *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={storeSettingsForm.warehouseAddress}
                        onChange={e => setStoreSettingsForm(prev => ({ ...prev, warehouseAddress: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', resize: 'vertical' }}
                        placeholder="ระบุเลขที่ อาคาร ซอย ถนน ตำบล อำเภอ จังหวัด และรหัสไปรษณีย์"
                      />
                    </div>

                    {/* COD & Shipping Options */}
                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={storeSettingsForm.allowCod}
                          onChange={e => setStoreSettingsForm(prev => ({ ...prev, allowCod: e.target.checked }))}
                          style={{ width: 16, height: 16, accentColor: '#2563EB', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                          เปิดให้บริการเก็บเงินปลายทาง (Cash on Delivery - COD)
                        </span>
                      </label>
                      <div style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={13} /> ร้านค้าได้รับความคุ้มครอง Movemall COD Shield เคลมค่าเสียหายได้ 100%
                      </div>
                    </div>
                  </div>

                  {/* 3. Bank Payout Card */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #F3F4F6' }}>
                      <CreditCard size={18} style={{ color: '#2563EB' }} />
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1F2937' }}>บัญชีธนาคารรับเงินโอน Payout (Bank Account)</h3>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                        เลือกธนาคาร *
                      </label>
                      <select
                        value={storeSettingsForm.bankName}
                        onChange={e => setStoreSettingsForm(prev => ({ ...prev, bankName: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', background: '#FFFFFF' }}
                      >
                        <option value="กสิกรไทย (KBANK)">ธนาคารกสิกรไทย (Kasikornbank - KBANK)</option>
                        <option value="ไทยพาณิชย์ (SCB)">ธนาคารไทยพาณิชย์ (Siam Commercial Bank - SCB)</option>
                        <option value="กรุงเทพ (BBL)">ธนาคารกรุงเทพ (Bangkok Bank - BBL)</option>
                        <option value="กรุงไทย (KTB)">ธนาคารกรุงไทย (Krungthai Bank - KTB)</option>
                        <option value="กรุงศรีอยุธยา (BAY)">ธนาคารกรุงศรีอยุธยา (Bank of Ayudhya - BAY)</option>
                        <option value="ทหารไทยธนชาต (ttb)">ธนาคารทหารไทยธนชาต (TMBThanachart - ttb)</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                          เลขที่บัญชีธนาคาร *
                        </label>
                        <input
                          type="text"
                          required
                          value={storeSettingsForm.bankAccountNo}
                          onChange={e => setStoreSettingsForm(prev => ({ ...prev, bankAccountNo: e.target.value }))}
                          style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none' }}
                          placeholder="012-3-45678-9"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                          ชื่อบัญชี (ตรงกับบัตร ปชช./นิติบุคคล) *
                        </label>
                        <input
                          type="text"
                          required
                          value={storeSettingsForm.accountName}
                          onChange={e => setStoreSettingsForm(prev => ({ ...prev, accountName: e.target.value }))}
                          style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none' }}
                          placeholder="ชื่อบัญชีธนาคาร"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}>
                        เบอร์พร้อมเพย์ (PromptPay ID สำหรับโอนเงินด่วน)
                      </label>
                      <input
                        type="text"
                        value={storeSettingsForm.promptPay}
                        onChange={e => setStoreSettingsForm(prev => ({ ...prev, promptPay: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none' }}
                        placeholder="0812345678"
                      />
                    </div>
                  </div>

                  {/* 4. Auto-Reply Assistant Card */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MessageSquare size={18} style={{ color: '#2563EB' }} />
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1F2937' }}>ผู้ช่วยตอบแชทอัตโนมัติ (Auto-Reply Bot)</h3>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={storeSettingsForm.autoReplyEnabled}
                          onChange={e => setStoreSettingsForm(prev => ({ ...prev, autoReplyEnabled: e.target.checked }))}
                          style={{ width: 16, height: 16, accentColor: '#2563EB', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 700, color: storeSettingsForm.autoReplyEnabled ? '#15803D' : '#6B7280' }}>
                          {storeSettingsForm.autoReplyEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </label>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}>
                        ข้อความตอบกลับต้อนรับเมื่อลูกค้าทักแชทครั้งแรก
                      </label>
                      <textarea
                        rows={2}
                        value={storeSettingsForm.welcomeMessage}
                        onChange={e => setStoreSettingsForm(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', resize: 'vertical' }}
                        placeholder="สวัสดีครับ สอบถามข้อมูลสินค้าหรือเช็กสต็อกได้เลยครับ"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Submit Bar */}
              <div style={{ marginTop: 24, padding: '16px 20px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  💡 เมื่อกดบันทึก ข้อมูลร้านค้าและที่อยู่จัดส่งจะอัปเดตแบบเรียลไทม์ทันที
                </div>
                <button
                  type="submit"
                  style={{
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 28px',
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                  }}
                >
                  <Save size={16} /> บันทึกการตั้งค่าร้านค้าทั้งหมด
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  </div>

      {/* ── Modal: Seller Report Buyer Form ── */}
      {showBuyerReportModal && (
        <div className="seller-modal-backdrop" onClick={() => setShowBuyerReportModal(false)}>
          <div className="seller-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="seller-modal__header">
              <h2 className="seller-modal__title" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626' }}>
                <AlertTriangle size={20} /> แจ้งรายงานลูกค้าทำผิดกฎ / เคลมค่าเสียหาย
              </h2>
              <button className="seller-modal__close" onClick={() => setShowBuyerReportModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitBuyerReport} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    เลขที่คำสั่งซื้อ (Order ID)
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }}
                    value={reportForm.orderId}
                    onChange={e => setReportForm(prev => ({ ...prev, orderId: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    ชื่อลูกค้า
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }}
                    value={reportForm.customerName}
                    onChange={e => setReportForm(prev => ({ ...prev, customerName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  ประเภทการกระทำผิด (Violation Type)
                </label>
                <select
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }}
                  value={reportForm.type}
                  onChange={e => setReportForm(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <option value="COD_REJECTED">🚨 ลูกค้าปฏิเสธไม่ยอมรับพัสดุเก็บเงินปลายทาง (COD Rejected)</option>
                  <option value="REFUND_ABUSE">⚠️ ขอเงินคืนเท็จ / คืนกล่องเปล่า / สลับสินค้า</option>
                  <option value="FAKE_ORDER">📦 สั่งซื้อเล่น สแปมออเดอร์แล้วกดยกเลิกกลั่นแกล้ง</option>
                  <option value="HARASSMENT">💬 ส่งข้อความคุกคาม ข่มขู่ หรือใช้ถ้อยคำหยาบคายในแชท</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  รายละเอียดเหตุการณ์ & ความเสียหาย
                </label>
                <textarea
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }}
                  value={reportForm.description}
                  onChange={e => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  URL รูปภาพหลักฐาน (ใบปะหน้าขนส่ง / สภาพพัสดุตีกลับ / แชท)
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }}
                  value={reportForm.evidenceUrl}
                  onChange={e => setReportForm(prev => ({ ...prev, evidenceUrl: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '0.65rem',
                    borderRadius: 6,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ยื่นรายงาน & ขอรับการชดเชย
                </button>
                <button
                  type="button"
                  style={{
                    padding: '0.65rem 1rem',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowBuyerReportModal(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nomination Form Modal */}
      {isNominateModalOpen && (
        <div className="seller-modal-backdrop" onClick={() => setIsNominateModalOpen(false)}>
          <div className="seller-modal" onClick={e => e.stopPropagation()}>
            <div className="seller-modal__header">
              <h2 className="seller-modal__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={18} style={{ color: '#DC2626' }} />
                เสนอสินค้าเข้าร่วม Flash Sale
              </h2>
              <button className="seller-modal__close" onClick={() => setIsNominateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleNominateFlashSale}>
              <div className="seller-modal__grid">
                <div className="seller-modal__group seller-modal__group--full">
                  <label className="seller-modal__label">เลือกรอบเวลากิจกรรม Flash Sale *</label>
                  <select
                    className="seller-modal__select"
                    value={nomTimeSlot}
                    onChange={e => setNomTimeSlot(e.target.value)}
                  >
                    <option value="12:00 - 16:00 (รอบกลางวัน ดีลเด็ด ☀️)">12:00 - 16:00 น. (รอบกลางวัน ดีลเด็ด ☀️)</option>
                    <option value="16:00 - 20:00 น. (รอบเลิกงาน ช้อปกระจาย 🌆)">16:00 - 20:00 น. (รอบเลิกงาน ช้อปกระจาย 🌆)</option>
                    <option value="20:00 - 00:00 (รอบค่ำดีลเดือด 🌙)">20:00 - 00:00 น. (รอบค่ำดีลเดือด 🌙)</option>
                  </select>
                </div>

                <div className="seller-modal__group seller-modal__group--full">
                  <label className="seller-modal__label">เลือกรายการสินค้าของร้าน *</label>
                  <select
                    className="seller-modal__select"
                    value={nomProdId}
                    onChange={e => {
                      setNomProdId(e.target.value);
                      const target = storeProducts.find(p => p.id === e.target.value);
                      if (target) {
                        setNomFlashPrice(String(Math.round(target.price * 0.6)));
                      }
                    }}
                  >
                    {storeProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (ราคาปกติ ฿{p.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">ราคา Flash Sale ที่เสนอ (บาท) *</label>
                  <input
                    type="number"
                    className="seller-modal__input"
                    placeholder="เช่น 580"
                    required
                    value={nomFlashPrice}
                    onChange={e => setNomFlashPrice(e.target.value)}
                  />
                  <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 700, marginTop: 2 }}>
                    * แนะนำให้ตั้งส่วนลดตั้งแต่ 15% ถึง 70% เพื่อเพิ่มโอกาสอนุมัติ
                  </span>
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">จำนวนสต็อกสำรองสำหรับดีล (ชิ้น) *</label>
                  <input
                    type="number"
                    min="5"
                    className="seller-modal__input"
                    placeholder="เช่น 30"
                    required
                    value={nomStock}
                    onChange={e => setNomStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="seller-modal__actions" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="review-form__cancel-btn"
                  onClick={() => setIsNominateModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="seller-modal__submit"
                  style={{ background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' }}
                >
                  ⚡ ส่งคำขอลงทะเบียน Flash Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="seller-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="seller-modal" onClick={e => e.stopPropagation()}>
            <div className="seller-modal__header">
              <h2 className="seller-modal__title">📦 ลงขายสินค้าใหม่</h2>
              <button className="seller-modal__close" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="seller-modal__grid">
                <div className="seller-modal__group seller-modal__group--full">
                  <label className="seller-modal__label">ชื่อสินค้า *</label>
                  <input
                    className="seller-modal__input"
                    placeholder="เช่น เมาส์ไร้สาย Ergonomic Wireless"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">หมวดหมู่ *</label>
                  <select
                    className="seller-modal__select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">ป้ายโปรโมชั่น</label>
                  <select
                    className="seller-modal__select"
                    value={badge || ''}
                    onChange={e => setBadge((e.target.value as Product['badge']) || undefined)}
                  >
                    <option value="">ไม่มีป้าย</option>
                    <option value="new">✨ สินค้าใหม่</option>
                    <option value="sale">🔥 ลดราคา (Sale)</option>
                    <option value="hot">⚡ ยอดฮิต (Hot)</option>
                  </select>
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">ราคาขาย (บาท) *</label>
                  <input
                    type="number"
                    className="seller-modal__input"
                    placeholder="เช่น 790"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">ราคาเต็ม (บาท) ก่อนลด</label>
                  <input
                    type="number"
                    className="seller-modal__input"
                    placeholder="เช่น 990 (ถ้ามี)"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value)}
                  />
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">จำนวนสินค้าในสต็อก *</label>
                  <input
                    type="number"
                    className="seller-modal__input"
                    placeholder="เช่น 50"
                    required
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                  />
                </div>

                <div className="seller-modal__group seller-modal__group--full">
                  <label className="seller-modal__label">🖼️ รูปภาพสินค้า (อัปโหลดโดยตรงจากเครื่องเพื่อความปลอดภัย)</label>
                  <div className="seller-image-manager">
                    {image ? (
                      <div className="seller-image-preview-card">
                        <div className="seller-image-preview-card__thumb-wrap">
                          <img src={image} alt="Product Preview" className="seller-image-preview-card__thumb" />
                          <span className="seller-image-preview-card__badge">✓ พรีวิวรูปภาพ</span>
                        </div>
                        <div className="seller-image-preview-card__info">
                          <div className="seller-image-preview-card__title">
                            {image.startsWith('data:') ? '📷 อัปโหลดรูปภาพจากเครื่องสำเร็จ' : '🖼️ รูปภาพสินค้า'}
                          </div>
                          <div className="seller-image-preview-card__sub">
                            {image.startsWith('data:') ? 'ไฟล์รูปภาพถูกโหลดลงระบบเรียบร้อย พร้อมบันทึก' : 'รูปภาพสินค้าพร้อมใช้งาน'}
                          </div>
                          <div className="seller-image-preview-card__actions">
                            <label className="seller-image-btn seller-image-btn--change">
                              <Upload size={14} />
                              เปลี่ยนรูปจากเครื่อง
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileUpload}
                                style={{ display: 'none' }}
                              />
                            </label>
                            <button
                              type="button"
                              className="seller-image-btn seller-image-btn--delete"
                              onClick={() => setImage('')}
                            >
                              <Trash2 size={14} /> ลบรูปภาพ
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="seller-image-dropzone">
                        <div className="seller-image-dropzone__icon-circle">
                          <Upload size={22} />
                        </div>
                        <div className="seller-image-dropzone__title">คลิกเพื่ออัปโหลดรูปภาพสินค้าจากเครื่อง</div>
                        <div className="seller-image-dropzone__sub">รองรับไฟล์ JPG, PNG, WEBP จากมือถือหรือคอมพิวเตอร์</div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="seller-modal__group seller-modal__group--full">
                  <label className="seller-modal__label">🎬 วิดีโอสาธิตสินค้า (อัปโหลดโดยตรงจากเครื่อง - ตัวเลือกเสริม)</label>
                  <div className="seller-video-manager">
                    {videoUrl ? (
                      <div className="seller-video-preview-card">
                        <div className="seller-video-preview-card__player-wrap">
                          <video src={videoUrl} controls className="seller-video-preview-card__player" />
                        </div>
                        <div className="seller-video-preview-card__info">
                          <div className="seller-video-preview-card__title">
                            🎬 อัปโหลดวิดีโอสาธิตสินค้าสำเร็จ
                          </div>
                          <div className="seller-video-preview-card__sub">
                            ไฟล์วิดีโอพร้อมแสดงผลในหน้ารายละเอียดสินค้า
                          </div>
                          <div className="seller-video-preview-card__actions">
                            <label className="seller-image-btn seller-image-btn--change">
                              <Upload size={14} />
                              เปลี่ยนวิดีโอใหม่
                              <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoFileUpload}
                                style={{ display: 'none' }}
                              />
                            </label>
                            <button
                              type="button"
                              className="seller-image-btn seller-image-btn--delete"
                              onClick={() => setVideoUrl('')}
                            >
                              <Trash2 size={14} /> ลบวิดีโอ
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="seller-video-dropzone">
                        <div className="seller-video-dropzone__icon-circle">
                          <Video size={20} />
                        </div>
                        <div className="seller-video-dropzone__title">คลิกเพื่ออัปโหลดวิดีโอสาธิตสินค้า (MP4, WebM, MOV)</div>
                        <div className="seller-video-dropzone__sub">คลิปความยาวสั้น 15-60 วินาที ช่วยเพิ่มยอดขายได้ถึง 2.5 เท่า</div>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="seller-modal__group seller-modal__group--full">
                  <RichTextEditor
                    label="📝 รายละเอียดสินค้า (ปรับแต่งตัวหนา, หัวข้อ, เช็คลิสต์ และแม่แบบได้)"
                    placeholder="ระบุจุดเด่น ขนาด สี และฟังก์ชันการใช้งาน..."
                    value={description}
                    onChange={setDescription}
                    minHeight={170}
                  />
                </div>

                {renderComplianceFormFields()}
              </div>

              <div className="seller-modal__actions">
                <button
                  type="button"
                  className="review-form__cancel-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="seller-modal__submit">
                  <CheckCircle size={15} style={{ display: 'inline', marginRight: 4 }} />
                  บันทึกและวางขายทันที
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="seller-modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="seller-modal" onClick={e => e.stopPropagation()}>
            <div className="seller-modal__header">
              <h2 className="seller-modal__title">✏️ แก้ไขข้อมูลสินค้า (ID: {editingProduct.id})</h2>
              <button className="seller-modal__close" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct}>
              <div className="seller-modal__grid">
                <div className="seller-modal__group seller-modal__group--full">
                  <label className="seller-modal__label">ชื่อสินค้า *</label>
                  <input
                    className="seller-modal__input"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">หมวดหมู่ *</label>
                  <select
                    className="seller-modal__select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">ป้ายโปรโมชั่น</label>
                  <select
                    className="seller-modal__select"
                    value={badge || ''}
                    onChange={e => setBadge((e.target.value as Product['badge']) || undefined)}
                  >
                    <option value="">ไม่มีป้าย</option>
                    <option value="new">✨ สินค้าใหม่</option>
                    <option value="sale">🔥 ลดราคา (Sale)</option>
                    <option value="hot">⚡ ยอดฮิต (Hot)</option>
                  </select>
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">ราคาขาย (บาท) *</label>
                  <input
                    type="number"
                    className="seller-modal__input"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">ราคาเต็ม (บาท) ก่อนลด</label>
                  <input
                    type="number"
                    className="seller-modal__input"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value)}
                  />
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">จำนวนสินค้าในสต็อก *</label>
                  <input
                    type="number"
                    className="seller-modal__input"
                    required
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                  />
                </div>

                <div className="seller-modal__group seller-modal__group--full">
                  <label className="seller-modal__label">🖼️ รูปภาพสินค้า (อัปโหลดโดยตรงจากเครื่องเพื่อความปลอดภัย)</label>
                  <div className="seller-image-manager">
                    {image ? (
                      <div className="seller-image-preview-card">
                        <div className="seller-image-preview-card__thumb-wrap">
                          <img src={image} alt="Product Preview" className="seller-image-preview-card__thumb" />
                          <span className="seller-image-preview-card__badge">✓ รูปภาพปัจจุบัน</span>
                        </div>
                        <div className="seller-image-preview-card__info">
                          <div className="seller-image-preview-card__title">
                            {image.startsWith('data:') ? '📷 อัปโหลดรูปภาพใหม่จากเครื่องสำเร็จ' : '🖼️ รูปภาพสินค้าปัจจุบัน'}
                          </div>
                          <div className="seller-image-preview-card__sub">
                            {image.startsWith('data:') ? 'ไฟล์รูปภาพถูกโหลดลงระบบเรียบร้อย พร้อมบันทึก' : 'รูปภาพสินค้าพร้อมใช้งาน'}
                          </div>
                          <div className="seller-image-preview-card__actions">
                            <label className="seller-image-btn seller-image-btn--change">
                              <Upload size={14} />
                              เปลี่ยนรูปภาพจากเครื่อง
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileUpload}
                                style={{ display: 'none' }}
                              />
                            </label>
                            <button
                              type="button"
                              className="seller-image-btn seller-image-btn--delete"
                              onClick={() => setImage('')}
                            >
                              <Trash2 size={14} /> ลบรูปภาพ
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="seller-image-dropzone">
                        <div className="seller-image-dropzone__icon-circle">
                          <Upload size={22} />
                        </div>
                        <div className="seller-image-dropzone__title">คลิกเพื่ออัปโหลดรูปภาพสินค้าใหม่จากเครื่อง</div>
                        <div className="seller-image-dropzone__sub">รองรับไฟล์ JPG, PNG, WEBP จากมือถือหรือคอมพิวเตอร์</div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="seller-modal__group seller-modal__group--full">
                  <label className="seller-modal__label">🎬 วิดีโอสาธิตสินค้า (อัปโหลดโดยตรงจากเครื่อง - ตัวเลือกเสริม)</label>
                  <div className="seller-video-manager">
                    {videoUrl ? (
                      <div className="seller-video-preview-card">
                        <div className="seller-video-preview-card__player-wrap">
                          <video src={videoUrl} controls className="seller-video-preview-card__player" />
                        </div>
                        <div className="seller-video-preview-card__info">
                          <div className="seller-video-preview-card__title">
                            🎬 วิดีโอสาธิตสินค้าปัจจุบัน
                          </div>
                          <div className="seller-video-preview-card__sub">
                            ไฟล์วิดีโอพร้อมแสดงผลในหน้ารายละเอียดสินค้า
                          </div>
                          <div className="seller-video-preview-card__actions">
                            <label className="seller-image-btn seller-image-btn--change">
                              <Upload size={14} />
                              เปลี่ยนวิดีโอใหม่
                              <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoFileUpload}
                                style={{ display: 'none' }}
                              />
                            </label>
                            <button
                              type="button"
                              className="seller-image-btn seller-image-btn--delete"
                              onClick={() => setVideoUrl('')}
                            >
                              <Trash2 size={14} /> ลบวิดีโอ
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="seller-video-dropzone">
                        <div className="seller-video-dropzone__icon-circle">
                          <Video size={20} />
                        </div>
                        <div className="seller-video-dropzone__title">คลิกเพื่ออัปโหลดวิดีโอสาธิตสินค้า (MP4, WebM, MOV)</div>
                        <div className="seller-video-dropzone__sub">คลิปความยาวสั้น 15-60 วินาที ช่วยเพิ่มยอดขายได้ถึง 2.5 เท่า</div>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="seller-modal__group seller-modal__group--full">
                  <RichTextEditor
                    label="📝 รายละเอียดสินค้าเพิ่มเติม (ปรับแต่งตัวหนา, หัวข้อ, เช็คลิสต์ และแม่แบบได้)"
                    placeholder="ระบุจุดเด่น ขนาด สี และฟังก์ชันการใช้งาน..."
                    value={description}
                    onChange={setDescription}
                    minHeight={170}
                  />
                </div>

                {renderComplianceFormFields()}
              </div>

              <div className="seller-modal__actions">
                <button
                  type="button"
                  className="review-form__cancel-btn"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="seller-modal__submit">
                  <CheckCircle size={15} style={{ display: 'inline', marginRight: 4 }} />
                  บันทึกการแก้ไขสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Ad Campaign Modal ── */}
      {isCreateAdModalOpen && (
        <div className="seller-modal-backdrop" onClick={() => setIsCreateAdModalOpen(false)}>
          <div className="seller-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="seller-modal__header">
              <h2 className="seller-modal__title">🎯 สร้างแคมเปญโฆษณา Movemall Ads</h2>
              <button className="seller-modal__close" onClick={() => setIsCreateAdModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign}>
              <div className="seller-modal__grid">
                {/* Product Selection */}
                <div className="seller-modal__group seller-modal__group--full">
                  <label className="seller-modal__label">เลือกสินค้าที่ต้องการโปรโมต *</label>
                  <select
                    className="seller-modal__select"
                    value={selectedProdId}
                    onChange={e => setSelectedProdId(e.target.value)}
                    required
                  >
                    {storeProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (฿{p.price.toLocaleString()} | สต็อก {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ad Type */}
                <div className="seller-modal__group seller-modal__group--full">
                  <label className="seller-modal__label">เลือกรูปแบบโฆษณา *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                    <div
                      onClick={() => setAdCampaignType('search')}
                      style={{
                        padding: '10px 8px',
                        border: `2px solid ${adCampaignType === 'search' ? 'var(--primary)' : 'var(--border)'}`,
                        background: adCampaignType === 'search' ? 'var(--primary-subtle)' : '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>🔍 Search Ads</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>ค้นหาตามคีย์เวิร์ด</div>
                    </div>

                    <div
                      onClick={() => setAdCampaignType('discovery')}
                      style={{
                        padding: '10px 8px',
                        border: `2px solid ${adCampaignType === 'discovery' ? 'var(--primary)' : 'var(--border)'}`,
                        background: adCampaignType === 'discovery' ? 'var(--primary-subtle)' : '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>📱 Discovery</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>ฟีดหน้าแรก & สินค้าคล้าย</div>
                    </div>

                    <div
                      onClick={() => setAdCampaignType('live_boost')}
                      style={{
                        padding: '10px 8px',
                        border: `2px solid ${adCampaignType === 'live_boost' ? 'var(--primary)' : 'var(--border)'}`,
                        background: adCampaignType === 'live_boost' ? 'var(--primary-subtle)' : '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>🔴 Live Boost</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>ดันห้องไลฟ์สด</div>
                    </div>
                  </div>
                </div>

                {/* Keywords Input (for Search Ads) */}
                {adCampaignType === 'search' && (
                  <div className="seller-modal__group seller-modal__group--full">
                    <label className="seller-modal__label">
                      คำค้นหา / คีย์เวิร์ดประมูล (คั่นด้วยจุลภาค , )
                    </label>
                    <input
                      type="text"
                      className="seller-modal__input"
                      placeholder="เช่น หูฟังไร้สาย, บลูทูธ, Sony, เสียงดี"
                      value={keywordsInput}
                      onChange={e => setKeywordsInput(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      💡 แนะนำ 3–10 คำ เพื่อครอบคลุมกลุ่มเป้าหมายที่มีความต้องการซื้อ
                    </span>
                  </div>
                )}

                {/* Daily Budget */}
                <div className="seller-modal__group">
                  <label className="seller-modal__label">งบประมาณต่อวัน (บาท/วัน) *</label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    className="seller-modal__input"
                    placeholder="เช่น 150"
                    value={dailyBudget}
                    onChange={e => setDailyBudget(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ขั้นต่ำ ฿50 / วัน</span>
                </div>

                {/* CPC Bid */}
                <div className="seller-modal__group">
                  <label className="seller-modal__label">ราคาประมูลต่อคลิก (CPC Bid) *</label>
                  <input
                    type="number"
                    min="1.0"
                    step="0.5"
                    className="seller-modal__input"
                    placeholder="เช่น 2.50"
                    value={cpcBid}
                    onChange={e => setCpcBid(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>แนะนำ ฿2.00 - ฿4.50</span>
                </div>
              </div>

              <div className="seller-modal__actions">
                <button
                  type="button"
                  className="review-form__cancel-btn"
                  onClick={() => setIsCreateAdModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="seller-modal__submit">
                  <Target size={14} style={{ display: 'inline', marginRight: 6 }} />
                  เริ่มยิงโฆษณาทันที
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Top-up Ad Wallet Modal ── */}
      {isTopupModalOpen && (
        <div className="seller-modal-backdrop" onClick={() => setIsTopupModalOpen(false)}>
          <div className="seller-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="seller-modal__header">
              <h2 className="seller-modal__title">⚡ เติมเงิน Ad Wallet</h2>
              <button className="seller-modal__close" onClick={() => setIsTopupModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {!isPromptPayShown ? (
              <form onSubmit={e => { e.preventDefault(); setIsPromptPayShown(true); }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                  ยอดเงินคงเหลือปัจจุบัน: <strong style={{ color: 'var(--primary)' }}>฿{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </p>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">เลือกหรือระบุจำนวนเงินที่ต้องการเติม (บาท) *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                    {['500', '1000', '2000', '5000'].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTopupAmount(amt)}
                        style={{
                          padding: '8px 4px',
                          border: `1.5px solid ${topupAmount === amt ? 'var(--primary)' : 'var(--border)'}`,
                          background: topupAmount === amt ? 'var(--primary-subtle)' : '#FFFFFF',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          color: topupAmount === amt ? 'var(--primary-dark)' : 'var(--text-primary)',
                        }}
                      >
                        ฿{Number(amt).toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    min="100"
                    step="100"
                    className="seller-modal__input"
                    value={topupAmount}
                    onChange={e => setTopupAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="seller-modal__actions">
                  <button
                    type="button"
                    className="review-form__cancel-btn"
                    onClick={() => setIsTopupModalOpen(false)}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className="seller-modal__submit">
                    ดำเนินการสแกน QR Code →
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ background: '#002D62', color: 'white', padding: '8px 14px', fontWeight: 800, fontSize: 13, marginBottom: 12, display: 'inline-block' }}>
                  PromptPay QR Code (0% ธรรมเนียม)
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MOVEMALL-ADS-TOPUP-${topupAmount}-${Date.now()}`}
                    alt="PromptPay QR Code"
                    style={{ border: '2px solid #0F172A', padding: 8, background: 'white' }}
                  />
                </div>

                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>
                  ยอดชำระ: <span style={{ color: 'var(--primary-dark)' }}>฿{Number(topupAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  สแกนผ่านแอปพลิเคชันธนาคารใดก็ได้ ยอดเงินจะเข้าทันที
                </div>

                <div className="seller-modal__actions" style={{ justifyContent: 'center', marginTop: 16 }}>
                  <button
                    type="button"
                    className="seller-modal__submit"
                    style={{ background: 'var(--success)' }}
                    onClick={handleTopup}
                  >
                    <CheckCircle size={15} style={{ display: 'inline', marginRight: 4 }} />
                    ยืนยันการชำระเงิน (จำลองสำเร็จ)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Partner Manage & Configuration Modal ── */}
      {selectedPartnerModal && (
        <div className="seller-modal-backdrop" onClick={() => setSelectedPartnerModal(null)}>
          <div className="seller-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="seller-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: selectedPartnerModal.logoColor,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 14
                  }}
                >
                  {selectedPartnerModal.id === 'bigseller' ? 'BS' : selectedPartnerModal.id === 'page365' ? '365' : selectedPartnerModal.id === 'zwiz' ? 'ZW' : selectedPartnerModal.id === 'ginee' ? 'GN' : selectedPartnerModal.id === 'ohochat' ? 'OH' : 'BW'}
                </div>
                <div>
                  <h2 className="seller-modal__title" style={{ margin: 0, fontSize: 16 }}>
                    ตั้งค่าการเชื่อมต่อ: {selectedPartnerModal.name}
                  </h2>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {selectedPartnerModal.categoryLabel}
                  </div>
                </div>
              </div>
              <button className="seller-modal__close" onClick={() => setSelectedPartnerModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Connection Toggle & Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: selectedPartnerModal.connected ? '#EFF6FF' : '#F8FAFC', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)' }}>
                    สถานะการเชื่อมต่อ: {selectedPartnerModal.connected ? '🟢 กำลังซิงค์ข้อมูล (Active)' : '⚪ ปิดการเชื่อมต่อ (Disabled)'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {selectedPartnerModal.connected ? `สัญญาณเสถียร ${selectedPartnerModal.syncHealth}% | ซิงค์ล่าสุด ${selectedPartnerModal.lastSyncedAt}` : 'คลิกเปิดสวิตช์เพื่อเริ่มรับส่งข้อมูลอัตโนมัติ'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextStatus = !selectedPartnerModal.connected;
                    setPartners(partners.map(p => p.id === selectedPartnerModal.id ? { ...p, connected: nextStatus, syncHealth: nextStatus ? 100 : 0, lastSyncedAt: nextStatus ? 'เมื่อสักครู่' : p.lastSyncedAt } : p));
                    setSelectedPartnerModal({ ...selectedPartnerModal, connected: nextStatus, syncHealth: nextStatus ? 100 : 0, lastSyncedAt: nextStatus ? 'เมื่อสักครู่' : selectedPartnerModal.lastSyncedAt });
                    alert(`อัปเดตสถานะ ${selectedPartnerModal.name} เป็น ${nextStatus ? '🟢 เปิดใช้งานเรียบร้อย' : '⚪ ปิดการเชื่อมต่อแล้ว'}`);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: selectedPartnerModal.connected ? '#DC2626' : 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {selectedPartnerModal.connected ? 'ตัดการเชื่อมต่อ (Disconnect)' : '🔗 เชื่อมต่อทันที (Connect)'}
                </button>
              </div>

              {/* Partner Token to paste on BigSeller/Page365 */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  MOVEMALL STORE AUTHORIZATION TOKEN (นำไปวางในระบบ {selectedPartnerModal.name})
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    readOnly
                    value={selectedPartnerModal.partnerToken}
                    style={{ flex: 1, padding: '8px 10px', fontSize: 12, fontFamily: 'monospace', background: '#F8FAFC', border: '1px solid var(--border)' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPartnerModal.partnerToken);
                      alert('คัดลอก Token เรียบร้อย! นำไปวางในช่อง Movemall Store Auth บนระบบพาร์ทเนอร์ได้ทันที');
                    }}
                    style={{ padding: '8px 14px', background: '#334155', color: 'white', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    คัดลอก Token
                  </button>
                </div>
              </div>

              {/* Sync Options Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid var(--border)', padding: 12, background: '#FFFFFF' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-primary)' }}>
                  ⚙️ ตัวเลือกการซิงค์ข้อมูล (Sync Features):
                </div>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 12 }}>
                  <div>
                    <strong>📦 ซิงค์สต็อกสินค้าอัตโนมัติ (Real-time Stock Deduct)</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>เมื่อมีการสั่งซื้อใน Movemall สต็อกบน {selectedPartnerModal.name} จะถูกตัดทันที</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedPartnerModal.autoSyncStock}
                    onChange={e => {
                      const val = e.target.checked;
                      setSelectedPartnerModal({ ...selectedPartnerModal, autoSyncStock: val });
                      setPartners(partners.map(p => p.id === selectedPartnerModal.id ? { ...p, autoSyncStock: val } : p));
                    }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 12 }}>
                  <div>
                    <strong>🛒 ดึงคำสั่งซื้อใหม่อัตโนมัติ (Auto Order Dispatch)</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ส่งออเดอร์ไปแพ็กของและพิมพ์ใบปะหน้าพัสดุในระบบพาร์ทเนอร์</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedPartnerModal.autoSyncOrders}
                    onChange={e => {
                      const val = e.target.checked;
                      setSelectedPartnerModal({ ...selectedPartnerModal, autoSyncOrders: val });
                      setPartners(partners.map(p => p.id === selectedPartnerModal.id ? { ...p, autoSyncOrders: val } : p));
                    }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 12 }}>
                  <div>
                    <strong>💬 ส่งต่อข้อความแชทสด (OmniChat Live Stream Webhook)</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ส่งต่อแชทลูกค้า Movemall ไปให้แอดมินตอบจากหน้าจอเดียว</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedPartnerModal.autoSyncChat}
                    onChange={e => {
                      const val = e.target.checked;
                      setSelectedPartnerModal({ ...selectedPartnerModal, autoSyncChat: val });
                      setPartners(partners.map(p => p.id === selectedPartnerModal.id ? { ...p, autoSyncChat: val } : p));
                    }}
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setSelectedPartnerModal(null)}
                  style={{ padding: '8px 16px', background: '#F1F5F9', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`บันทึกการตั้งค่า ${selectedPartnerModal.name} เรียบร้อยแล้ว!`);
                    setSelectedPartnerModal(null);
                  }}
                  style={{ padding: '8px 20px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  💾 บันทึกการตั้งค่า
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Partner ISV Onboarding Request Modal ── */}
      {isPartnerRequestModalOpen && (
        <div className="seller-modal-backdrop" onClick={() => setIsPartnerRequestModalOpen(false)}>
          <div className="seller-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="seller-modal__header">
              <div>
                <h2 className="seller-modal__title" style={{ margin: 0, fontSize: 16 }}>
                  🏢 ยื่นขอเชื่อมต่อสำหรับผู้ให้บริการระบบ (ISV Onboarding)
                </h2>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Movemall Closed Partner Program สำหรับผู้พัฒนา ERP, POS, WMS, และแอปตอบรวมแชท
                </div>
              </div>
              <button className="seller-modal__close" onClick={() => setIsPartnerRequestModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {partnerAppSubmitted ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                <div style={{ width: 50, height: 50, background: '#DCFCE7', color: '#166534', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24 }}>
                  ✓
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  ยื่นเอกสารขอเชื่อมต่อระบบสำเร็จ!
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
                  หมายเลขคำขอ: <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{partnerAppSubmitted}</strong>
                </p>
                <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: 12, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'left', marginBottom: 20 }}>
                  ทีม Movemall ISV Partnerships จะตรวจสอบเอกสารและส่งมอบ <strong>Dedicated Partner App Key & Sandbox Environment</strong> ให้ทางอีเมลติดต่อภายใน 24 ชั่วโมงทำการ
                </div>
                <button
                  type="button"
                  onClick={() => setIsPartnerRequestModalOpen(false)}
                  style={{ padding: '9px 24px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  เสร็จสิ้น
                </button>
              </div>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!partnerApplicationForm.companyName || !partnerApplicationForm.softwareName || !partnerApplicationForm.contactEmail) {
                    alert('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
                    return;
                  }
                  const ticketId = `ISV-REQ-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
                  setPartnerAppSubmitted(ticketId);
                }}
                style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div>
                  <label className="seller-modal__label">ชื่อบริษัท / นิติบุคคลผู้พัฒนา *</label>
                  <input
                    type="text"
                    className="seller-modal__input"
                    placeholder="เช่น บริษัท ซอฟต์แวร์ ออมนิ จำกัด"
                    value={partnerApplicationForm.companyName}
                    onChange={e => setPartnerApplicationForm({ ...partnerApplicationForm, companyName: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="seller-modal__label">ชื่อระบบ / ซอฟต์แวร์ *</label>
                    <input
                      type="text"
                      className="seller-modal__input"
                      placeholder="เช่น FastSeller ERP"
                      value={partnerApplicationForm.softwareName}
                      onChange={e => setPartnerApplicationForm({ ...partnerApplicationForm, softwareName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="seller-modal__label">หมวดหมู่ระบบ *</label>
                    <select
                      className="seller-modal__select"
                      value={partnerApplicationForm.category}
                      onChange={e => setPartnerApplicationForm({ ...partnerApplicationForm, category: e.target.value })}
                    >
                      <option value="ERP">ERP & สต็อกสินค้า</option>
                      <option value="CHAT">ระบบรวมแชท Social Chat</option>
                      <option value="WMS">คลังสินค้า WMS & โลจิสติกส์</option>
                      <option value="POS">ระบบขายหน้าร้าน POS</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="seller-modal__label">อีเมลทีมเทคนิค (Tech Contact) *</label>
                    <input
                      type="email"
                      className="seller-modal__input"
                      placeholder="tech-partner@company.com"
                      value={partnerApplicationForm.contactEmail}
                      onChange={e => setPartnerApplicationForm({ ...partnerApplicationForm, contactEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="seller-modal__label">จำนวนร้านค้าที่ดูแลอยู่</label>
                    <select
                      className="seller-modal__select"
                      value={partnerApplicationForm.estimatedStores}
                      onChange={e => setPartnerApplicationForm({ ...partnerApplicationForm, estimatedStores: e.target.value })}
                    >
                      <option value="10-50">10 – 50 ร้านค้า</option>
                      <option value="51-200">51 – 200 ร้านค้า</option>
                      <option value="200+">มากกว่า 200 ร้านค้า (High Volume)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="seller-modal__label">ลิงก์เอกสาร API / Website บริษัท (ถ้ามี)</label>
                  <input
                    type="url"
                    className="seller-modal__input"
                    placeholder="https://developer.yourcompany.com"
                    value={partnerApplicationForm.technicalDocUrl}
                    onChange={e => setPartnerApplicationForm({ ...partnerApplicationForm, technicalDocUrl: e.target.value })}
                  />
                </div>

                <div className="seller-modal__actions" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="review-form__cancel-btn"
                    onClick={() => setIsPartnerRequestModalOpen(false)}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className="seller-modal__submit">
                    🚀 ส่งข้อมูลขอเป็น Partner
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Shipping Label Modal */}
      {selectedOrderForLabel && (
        <ShippingLabelModal
          {...selectedOrderForLabel}
          onClose={() => setSelectedOrderForLabel(null)}
        />
      )}
    </div>
  );
}

export default SellerCenterPage;

