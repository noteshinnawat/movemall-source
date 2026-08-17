// src/pages/SellerCenterPage.tsx — Merchant / Seller Portal & Management

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Package, DollarSign, TrendingUp, Star, Trash2, X, Store, CheckCircle,
  Printer, Target, Eye, MousePointerClick, Wallet, ArrowUpRight, Play, Pause,
  AlertCircle, RefreshCw, Zap, ShieldCheck, Pencil, Upload, Image as ImageIcon
} from 'lucide-react';
import { stores } from '../data/stores';
import { initialAdCampaigns, initialAdWallet } from '../data/mockAdsData';
import { ShippingLabelModal, type ShippingLabelProps } from '../components/ShippingLabelModal';
import type { Product, AdCampaign, AdType, AdWallet, AdKeyword, ProductCompliance, ComplianceType } from '../types';
import { fetchApi } from '../utils/api';
import './SellerCenterPage.css';

interface SellerCenterPageProps {
  products: Product[];
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct?: (updatedProduct: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export function SellerCenterPage({ products, onAddProduct, onUpdateProduct, onDeleteProduct }: SellerCenterPageProps) {
  const currentStore = stores[0]; // "TechPro Official Store"
  const storeProducts = products.filter(p => p.storeId === currentStore.id);

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'api' | 'ads' | 'tax' | 'flash'>('overview');

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

  const [flashNominations, setFlashNominations] = useState<FlashNomination[]>([
    {
      id: 'nom-1',
      productId: storeProducts[0]?.id || 'p1',
      productName: storeProducts[0]?.name || 'หูฟังไร้สาย Pro ANC ตัดเสียงรบกวน',
      productImage: storeProducts[0]?.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
      originalPrice: storeProducts[0]?.price || 1200,
      flashPrice: 580,
      discountPct: 52,
      timeSlot: '20:00 - 00:00 (รอบค่ำดีลเดือด 🌙)',
      reservedStock: 50,
      status: 'approved',
      registeredAt: '2026-08-17 10:30',
    },
  ]);

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

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<Omit<ShippingLabelProps, 'onClose'> | null>(null);

  // ── Ads State ──
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(initialAdCampaigns);
  const [wallet, setWallet] = useState<AdWallet>(initialAdWallet);
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
  const [complianceHalal, setComplianceHalal] = useState('');

  function resetComplianceForm() {
    setComplianceFda('');
    setComplianceTisi('');
    setComplianceCountry('Thailand');
    setComplianceCertType('');
    setComplianceCertUrl('');
    setComplianceHalal('');
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
        <div className="seller-compliance-card__header">
          <ShieldCheck size={16} className="seller-compliance-card__icon" />
          <span className="seller-compliance-card__title">🛡️ ข้อมูลใบอนุญาต มาตรฐานสินค้า & ประเทศผู้ผลิต (Product Compliance)</span>
        </div>

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
            <label className="seller-modal__label">ลิงก์ภาพสแกนใบอนุญาต / Certificate URL (ตัวเลือกเสริม)</label>
            <input
              type="url"
              className="seller-modal__input"
              placeholder="https://.../certificate-doc.jpg หรือไฟล์สแกนใบจดแจ้ง"
              value={complianceCertUrl}
              onChange={e => setComplianceCertUrl(e.target.value)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="seller-page">
      {/* Seller Header */}
      <section className="seller-header">
        <div className="container">
          <div className="seller-header__inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                width: 44,
                height: 44,
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}>
                🏪
              </div>
              <div>
                <h1 className="seller-header__title">
                  ศูนย์ผู้ขาย (Seller Centre)
                  <span className="seller-header__store-badge">{currentStore.name}</span>
                </h1>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  จัดการร้านค้า สินค้า และคำสั่งซื้อของคุณได้ในที่เดียว
                </p>
              </div>
            </div>

            <button className="seller-header__add-btn" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} />
              + ลงขายสินค้าใหม่
            </button>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Metric Cards */}
        <div className="seller-metrics">
          <div className="seller-metric-card">
            <div className="seller-metric-icon">
              <DollarSign size={22} style={{ color: 'var(--success)' }} />
            </div>
            <div className="seller-metric-info">
              <span className="seller-metric-label">ยอดขายเดือนนี้</span>
              <span className="seller-metric-val">฿148,920</span>
            </div>
          </div>

          <div className="seller-metric-card">
            <div className="seller-metric-icon">
              <Package size={22} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="seller-metric-info">
              <span className="seller-metric-label">คำสั่งซื้อที่ต้องจัดส่ง</span>
              <span className="seller-metric-val">4 ออเดอร์</span>
            </div>
          </div>

          <div className="seller-metric-card">
            <div className="seller-metric-icon">
              <TrendingUp size={22} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="seller-metric-info">
              <span className="seller-metric-label">สินค้าที่วางขาย</span>
              <span className="seller-metric-val">{storeProducts.length} รายการ</span>
            </div>
          </div>

          <div className="seller-metric-card">
            <div className="seller-metric-icon">
              <Star size={22} style={{ color: 'var(--warning)' }} />
            </div>
            <div className="seller-metric-info">
              <span className="seller-metric-label">คะแนนร้านค้า</span>
              <span className="seller-metric-val">{currentStore.rating} / 5.0</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="seller-tabs">
          <button
            className={`seller-tab-btn${activeTab === 'overview' ? ' seller-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Store size={15} />
            จัดการสินค้าของร้าน ({storeProducts.length})
          </button>
          <button
            className={`seller-tab-btn${activeTab === 'ads' ? ' seller-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('ads')}
            style={{ position: 'relative' }}
          >
            <Target size={15} />
            ยิงโฆษณา (Movemall Ads)
            <span style={{
              background: '#DC2626',
              color: 'white',
              fontSize: 9,
              fontWeight: 900,
              padding: '2px 5px',
              marginLeft: 6,
              letterSpacing: '0.3px',
            }}>
              ROI {overallROAS}x
            </span>
          </button>
          <button
            className={`seller-tab-btn${activeTab === 'orders' ? ' seller-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={15} />
            รายการคำสั่งซื้อ (4)
          </button>
          <button
            className={`seller-tab-btn${activeTab === 'api' ? ' seller-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <span style={{ fontSize: 14 }}>🔌</span>
            Open API & เชื่อมสต็อก ERP
          </button>
          <button
            className={`seller-tab-btn${activeTab === 'tax' ? ' seller-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('tax')}
          >
            <span style={{ fontSize: 14 }}>📄</span>
            ระบบภาษี & ใบกำกับภาษี
          </button>
          <button
            className={`seller-tab-btn${activeTab === 'flash' ? ' seller-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('flash')}
          >
            <Zap size={15} style={{ color: '#DC2626' }} />
            ศูนย์เสนอขาย Flash Sale
            <span style={{
              background: '#DC2626',
              color: 'white',
              fontSize: 9,
              fontWeight: 900,
              padding: '2px 5px',
              marginLeft: 6,
              letterSpacing: '0.3px',
            }}>
              HOT
            </span>
          </button>
        </div>

        {/* Products Table (Desktop) & Mobile Card List */}
        {activeTab === 'overview' && (
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
                    <Link to={`/product/${product.id}`} className="seller-mobile-card__btn-view">
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
          <div className="seller-table-container">
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
                <tr>
                  <td><strong>#ORD-20260816-001</strong></td>
                  <td>หูฟังไร้สาย Premium Pro X (1 ชิ้น)</td>
                  <td>
                    <div>กิตติพงษ์ ส. (089-123-4567)</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>123 ถ.สุขุมวิท 39 วัฒนา กทม. 10110</div>
                  </td>
                  <td>฿1,290</td>
                  <td><span style={{ color: 'var(--primary)', fontWeight: 700 }}>⚙️ รอดำเนินการส่ง</span></td>
                  <td>
                    <button
                      onClick={() => setSelectedOrderForLabel({
                        orderId: 'ORD-20260816-001',
                        trackingNo: 'TH-0891-FLASH',
                        customerName: 'กิตติพงษ์ ส.',
                        customerPhone: '089-123-4567',
                        customerAddress: '123 ถ.สุขุมวิท 39 คลองตันเหนือ วัฒนา กทม.',
                        zipCode: '10110',
                        storeName: currentStore.name,
                        storePhone: '081-234-5678',
                        storeAddress: '456 ถ.พระราม 4 คลองเตย กทม. 10110',
                        items: [{ name: 'หูฟังไร้สาย Premium Pro X', quantity: 1 }],
                        total: 1290,
                        isCOD: false,
                      })}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Printer size={13} /> พิมพ์ใบปะหน้า (4x6)
                    </button>
                  </td>
                </tr>
                <tr>
                  <td><strong>#ORD-20260815-098</strong></td>
                  <td>สมาร์ทวอทช์ Series 8 Ultra (1 ชิ้น)</td>
                  <td>
                    <div>อรทัย ว. (082-987-6543)</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>88/1 ถ.ติวานนท์ เมือง นนทบุรี 11000</div>
                  </td>
                  <td>฿5,990</td>
                  <td><span style={{ color: 'var(--success)', fontWeight: 700 }}>✅ จัดส่งแล้ว</span></td>
                  <td>
                    <button
                      onClick={() => setSelectedOrderForLabel({
                        orderId: 'ORD-20260815-098',
                        trackingNo: 'TH-0982-FLASH',
                        customerName: 'อรทัย ว.',
                        customerPhone: '082-987-6543',
                        customerAddress: '88/1 ถ.ติวานนท์ ต.ตลาดขวัญ เมือง นนทบุรี',
                        zipCode: '11000',
                        storeName: currentStore.name,
                        storePhone: '081-234-5678',
                        storeAddress: '456 ถ.พระราม 4 คลองเตย กทม. 10110',
                        items: [{ name: 'สมาร์ทวอทช์ Series 8 Ultra', quantity: 1 }],
                        total: 5990,
                        isCOD: false,
                      })}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Printer size={13} /> พิมพ์ซ้ำ
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── 3. Open API, Security & ERP Sync Tab ── */}
        {activeTab === 'api' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            
            {/* 1. Environment Switcher & Status Banner */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                      🔌 Movemall Open API & Enterprise Security Hub
                    </h3>
                    <span style={{ background: apiEnv === 'live' ? '#DCFCE7' : '#FEF3C7', color: apiEnv === 'live' ? '#15803D' : '#D97706', fontSize: 11, fontWeight: 900, padding: '2px 8px', border: `1px solid ${apiEnv === 'live' ? '#86EFAC' : '#FCD34D'}` }}>
                      {apiEnv === 'live' ? '● PRODUCTION LIVE' : '▲ SANDBOX TESTNET'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    จัดการกุญแจเชื่อมต่อ ERP/POS, ควบคุมความปลอดภัย IP Whitelist, สิทธิ์ API Scopes, และทดสอบ Webhook HMAC
                  </p>
                </div>

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
                    🟢 Production (ใช้งานจริง)
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
                    🟠 Sandbox (ทดสอบระบบ)
                  </button>
                </div>
              </div>
            </div>

            {/* 2. API Credentials Card (Dual-Key & Secret) */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    🔑 กุญแจยืนยันตัวตน (API Key & Secret Key)
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                    ใช้สำหรับการตรวจสอบสิทธิ์ผ่าน Authorization Header (เก็บบันทึกเฉพาะค่า SHA-256 Hash ในฐานข้อมูล)
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
                      API SECRET ({apiEnv.toUpperCase()}) — <span style={{ color: '#DC2626' }}>ห้ามเปิดเผยให้ผู้อื่นเด็ดขาด</span>
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
                <span><strong>Header รูปแบบมาตรฐาน:</strong> <code>Authorization: Bearer {currentApiKey}</code></span>
              </div>
            </div>

            {/* 3. Security Settings: IP Whitelist & Scopes Grid */}
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
                  อนุญาตให้เฉพาะเซิร์ฟเวอร์ที่มี IP เหล่านี้ยิงเข้ามาได้ (หากไม่ระบุ IP ใดๆ จะถูกบล็อกด้วย 403)
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
                      ⚠️ ยังไม่ได้ระบุ IP Whitelist (API จะไม่ยอมรับ Request)
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
                  หลักการ Least Privilege กำหนดเฉพาะสิทธิ์ที่จำเป็นต่อการทำงานของระบบ
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { id: 'inventory:sync', label: 'inventory:sync', desc: 'อัปเดตสต็อกสินค้า Real-time จาก POS' },
                    { id: 'orders:read', label: 'orders:read', desc: 'ดึงข้อมูลคำสั่งซื้อใหม่และรายละเอียดผู้รับ' },
                    { id: 'orders:dispatch', label: 'orders:dispatch', desc: 'ส่งเลขพัสดุและตัดรอบจัดส่งออเดอร์' },
                    { id: 'products:write', label: 'products:write', desc: 'เพิ่ม/แก้ไขรายการสินค้าและราคา' },
                    { id: 'finance:read', label: 'finance:read', desc: 'ดึงรายงานการเงินและยอดโอนรายวัน' },
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

            {/* 4. Endpoints Documentation & cURL Snippets */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 14 }}>
                ⚡ ตัวอย่าง API ยอดนิยม (Open API Endpoints & cURL)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Endpoint 1: Update Stock */}
                <div style={{ background: '#0F172A', color: '#F8FAFC', padding: 14, borderLeft: '4px solid #10B981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#10B981', color: 'black', padding: '2px 6px', fontWeight: 900, fontSize: 10 }}>PATCH</span>
                      <strong style={{ fontSize: 13 }}>/v1/seller/inventory</strong>
                    </div>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>อัปเดตสต็อกสินค้า Real-time จาก POS/ERP</span>
                  </div>
                  <pre style={{ margin: 0, fontSize: 11, color: '#A7F3D0', overflowX: 'auto', padding: '6px 0' }}>
{`curl -X PATCH https://api.movemall.com/v1/seller/inventory \\
  -H "Authorization: Bearer ${currentApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [
      { "sku": "EL-001", "stock": 45 },
      { "sku": "EL-002", "stock": 120 }
    ]
  }'`}
                  </pre>
                </div>

                {/* Endpoint 2: Fetch Orders */}
                <div style={{ background: '#0F172A', color: '#F8FAFC', padding: 14, borderLeft: '4px solid #3B82F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#3B82F6', color: 'white', padding: '2px 6px', fontWeight: 900, fontSize: 10 }}>GET</span>
                      <strong style={{ fontSize: 13 }}>/v1/seller/orders?status=PENDING_DISPATCH</strong>
                    </div>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>ดึงรายการออเดอร์ใหม่ไปแพ็กของ</span>
                  </div>
                  <pre style={{ margin: 0, fontSize: 11, color: '#BFDBFE', overflowX: 'auto', padding: '6px 0' }}>
{`curl -X GET https://api.movemall.com/v1/seller/orders?status=PENDING_DISPATCH \\
  -H "Authorization: Bearer ${currentApiKey}"`}
                  </pre>
                </div>

                {/* Endpoint 3: Fulfill Order with Idempotency Key */}
                <div style={{ background: '#0F172A', color: '#F8FAFC', padding: 14, borderLeft: '4px solid #F59E0B' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#F59E0B', color: 'black', padding: '2px 6px', fontWeight: 900, fontSize: 10 }}>POST</span>
                      <strong style={{ fontSize: 13 }}>/v1/seller/orders/MM-2026-0816/fulfill</strong>
                    </div>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>ส่งเลขแทร็กกิ้งพัสดุ + Idempotency-Key</span>
                  </div>
                  <pre style={{ margin: 0, fontSize: 11, color: '#FDE68A', overflowX: 'auto', padding: '6px 0' }}>
{`curl -X POST https://api.movemall.com/v1/seller/orders/MM-2026-0816/fulfill \\
  -H "Authorization: Bearer ${currentApiKey}" \\
  -H "Idempotency-Key: ${Date.now()}-req-9912" \\
  -H "Content-Type: application/json" \\
  -d '{
    "courierCode": "FLASH_EXPRESS",
    "trackingNumber": "TH029384729182",
    "awbLabelBase64": "..."
  }'`}
                  </pre>
                </div>
              </div>
            </div>

            {/* 5. Webhook Configuration & HMAC-SHA256 Signature Simulator */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    🔔 Webhook & ระบบตรวจสอบลายเซ็นดิจิทัล (HMAC-SHA256)
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    เมื่อมีคำสั่งซื้อใหม่ (<code>order.paid</code>) Movemall จะส่งแจ้งเตือนพร้อมลายเซ็นเพื่อป้องกันการปลอมแปลงคำขอ
                  </p>
                </div>
                <span style={{ background: '#EFF6FF', color: 'var(--primary)', fontSize: 11, fontWeight: 800, padding: '3px 8px', border: '1px solid #BFDBFE' }}>
                  HMAC-SHA256 SECURED
                </span>
              </div>

              {/* Webhook Endpoint & Secret */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    WEBHOOK ENDPOINT URL
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    placeholder="https://erp.myshop.com/api/movemall-webhook"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    WEBHOOK SIGNING SECRET (ใช้ตรวจ Signature)
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      readOnly
                      value={webhookSecret}
                      style={{ flex: 1, padding: '9px 12px', background: '#F8FAFC', border: '1.5px solid var(--border)', fontFamily: 'monospace', fontSize: 12 }}
                    />
                    <button
                      onClick={() => {
                        setWebhookSecret(`whsec_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`);
                        alert('สร้าง Webhook Secret ใหม่แล้ว!');
                      }}
                      style={{ padding: '8px 12px', background: '#F1F5F9', border: '1px solid var(--border)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      🔄 สร้างใหม่
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Webhook Simulator */}
              <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    🧪 เครื่องมือทดสอบยิง Webhook จำลอง (Signature Simulator)
                  </strong>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value={webhookTestEvent}
                      onChange={e => setWebhookTestEvent(e.target.value as 'order.paid' | 'inventory.low')}
                      style={{ padding: '6px 10px', fontSize: 12, border: '1px solid var(--border)', background: 'white' }}
                    >
                      <option value="order.paid">Event: order.paid (ชำระเงินสำเร็จ)</option>
                      <option value="inventory.low">Event: inventory.low (สต็อกสินค้าต่ำ)</option>
                    </select>
                    <button
                      onClick={() => {
                        const timestamp = Math.floor(Date.now() / 1000);
                        const fakePayload = webhookTestEvent === 'order.paid'
                          ? JSON.stringify({ event: 'order.paid', orderId: 'MM-2026-9941', amount: 3590, storeId: currentStore.id, paidAt: new Date().toISOString() }, null, 2)
                          : JSON.stringify({ event: 'inventory.low', sku: 'EL-001', remainingStock: 3, alertThreshold: 5 }, null, 2);
                        
                        // Fake generated signature representation
                        const fakeSig = `t=${timestamp},v1=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
                        setWebhookSimResult(`POST ${webhookUrl || 'https://erp.myshop.com/api/webhook'}\nHeaders:\n  X-Movemall-Signature: ${fakeSig}\n  X-Movemall-Timestamp: ${timestamp}\n  Content-Type: application/json\n\nPayload:\n${fakePayload}`);
                      }}
                      style={{ padding: '6px 14px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                      🚀 ทดสอบยิง Webhook
                    </button>
                  </div>
                </div>

                {webhookSimResult && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#15803D', marginBottom: 4 }}>
                      ✓ คำนวณ Payload & ลายเซ็น HMAC เรียบร้อย:
                    </div>
                    <pre style={{ margin: 0, padding: 12, background: '#0F172A', color: '#38BDF8', fontSize: 11, overflowX: 'auto' }}>
                      {webhookSimResult}
                    </pre>
                  </div>
                )}
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

              {/* Campaigns Table */}
              <div className="seller-table-container">
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
            </div>

            {/* Ad Wallet Transactions & Fraud Protection Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  📄 ระบบภาษี & ใบกำกับภาษี (Tax & e-Tax Invoice Hub)
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
                  จัดการภาษีมูลค่าเพิ่ม (VAT 7%), ใบกำกับภาษีค่าธรรมเนียมแพลตฟอร์ม และออกรายงานสรุปยื่นกรมสรรพากร
                </p>
              </div>
              <span style={{ fontSize: 11, background: '#ECFDF5', color: '#047857', padding: '4px 10px', borderRadius: 4, fontWeight: 700 }}>
                ✓ รองรับ e-Tax Invoice & ภ.ง.ด. 90/94/50
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: 'var(--space-4)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ยอดขายรวมเดือนนี้</span>
                <h4 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0' }}>฿128,500.00</h4>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>คำนวณจาก 4 คำสั่งซื้อสำเร็จ</span>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: 'var(--space-4)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ค่าธรรมเนียม Movemall (3%)</span>
                <h4 style={{ fontSize: 22, fontWeight: 900, color: '#DC2626', margin: '4px 0' }}>฿3,855.00</h4>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>VAT 7% บนค่าธรรมเนียม: ฿269.85</span>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: 'var(--space-4)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ภาษีหัก ณ ที่จ่าย (WHT 3%)</span>
                <h4 style={{ fontSize: 22, fontWeight: 900, color: '#2563EB', margin: '4px 0' }}>฿115.65</h4>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>นำส่งกรมสรรพากรอัตโนมัติ</span>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: 'var(--space-4)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ยอดรับสุทธิหลังหักภาษี</span>
                <h4 style={{ fontSize: 22, fontWeight: 900, color: '#10B981', margin: '4px 0' }}>฿124,375.15</h4>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>โอนเข้าบัญชีธนาคารร้านค้า</span>
              </div>
            </div>

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: 'var(--space-4)', borderRadius: 6, marginBottom: 'var(--space-5)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF', margin: '0 0 6px 0' }}>
                📑 ดาวน์โหลดเอกสารภาษีร้านค้า (Monthly Tax Reports)
              </h4>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={{ padding: '8px 14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => alert('ดาวน์โหลดใบกำกับภาษีค่าบริการ Movemall (e-Tax Invoice PDF) สำเร็จ!')}
                >
                  📥 ดาวน์โหลด e-Tax Invoice ค่าธรรมเนียม (PDF)
                </button>
                <button
                  type="button"
                  style={{ padding: '8px 14px', background: 'white', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => alert('ดาวน์โหลดรายงานภาษีขายประจำเดือนสำหรับยื่นสรรพากร (CSV) สำเร็จ!')}
                >
                  📊 ดาวน์โหลดรายงานภาษีขายประจำเดือน (CSV)
                </button>
              </div>
            </div>
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

            {/* Registered Nominations Table */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: 13, color: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>รายการสินค้าที่เสนอเข้าร่วม Flash Sale ({flashNominations.length})</span>
                <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>🟢 อนุมัติแล้ว {flashNominations.filter(n => n.status === 'approved').length} ดีล</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
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
            </div>
          </div>
        )}
      </div>

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
                    <option value="electronics">อิเล็กทรอนิกส์</option>
                    <option value="fashion">แฟชั่น</option>
                    <option value="beauty">ความงาม</option>
                    <option value="home">บ้านและสวน</option>
                    <option value="sports">กีฬา</option>
                    <option value="food">อาหารและเครื่องดื่ม</option>
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
                  <label className="seller-modal__label">🖼️ รูปภาพสินค้า (อัปโหลดจากเครื่อง หรือ วาง Image URL)</label>
                  <div className="seller-modal__image-uploader-row">
                    <label className="seller-modal__image-upload-btn">
                      <Upload size={16} />
                      เลือกไฟล์รูปภาพจากเครื่อง
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap' }}>หรือวาง URL:</span>
                    <input
                      type="url"
                      className="seller-modal__input seller-modal__image-url-input"
                      placeholder="https://images.unsplash.com/..."
                      value={image}
                      onChange={e => setImage(e.target.value)}
                    />
                  </div>
                  {image && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px', background: '#F9FAFB', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                      <img src={image} alt="Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>ตัวอย่างรูปสินค้า (Live Preview)</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {image.startsWith('data:') ? '📷 อัปโหลดรูปจากเครื่องแล้ว (Base64 Data)' : image}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        style={{ background: '#FEE2E2', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', color: '#DC2626', fontWeight: 500 }}
                      >
                        ลบรูป
                      </button>
                    </div>
                  )}
                </div>

                <div className="seller-modal__group">
                  <label className="seller-modal__label">🎬 ลิงก์วิดีโอสาธิตสินค้า (Video URL - ตัวเลือกเสริม)</label>
                  <input
                    type="url"
                    className="seller-modal__input"
                    placeholder="https://.../demo-video.mp4"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                  />
                </div>

                <div className="seller-modal__group seller-modal__group--full">
                  <label className="seller-modal__label">รายละเอียดสินค้า</label>
                  <textarea
                    className="seller-modal__textarea"
                    placeholder="ระบุจุดเด่น ขนาด สี และฟังก์ชันการใช้งาน..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
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
                    <option value="electronics">อิเล็กทรอนิกส์</option>
                    <option value="fashion">แฟชั่น</option>
                    <option value="beauty">ความงาม</option>
                    <option value="home">บ้านและสวน</option>
                    <option value="sports">กีฬา</option>
                    <option value="food">อาหารและเครื่องดื่ม</option>
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
                  <label className="seller-modal__label">🖼️ รูปภาพสินค้า (อัปโหลดจากเครื่อง หรือ วาง Image URL)</label>
                  <div className="seller-modal__image-uploader-row">
                    <label className="seller-modal__image-upload-btn">
                      <Upload size={16} />
                      เลือกไฟล์รูปภาพใหม่จากเครื่อง
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap' }}>หรือวาง URL:</span>
                    <input
                      type="url"
                      className="seller-modal__input seller-modal__image-url-input"
                      placeholder="https://images.unsplash.com/..."
                      value={image}
                      onChange={e => setImage(e.target.value)}
                    />
                  </div>
                  {image && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px', background: '#F9FAFB', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                      <img src={image} alt="Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>ตัวอย่างรูปสินค้าปัจจุบัน (Live Preview)</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {image.startsWith('data:') ? '📷 อัปโหลดรูปจากเครื่องแล้ว (Base64 Data)' : image}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        style={{ background: '#FEE2E2', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', color: '#DC2626', fontWeight: 500 }}
                      >
                        ลบรูป
                      </button>
                    </div>
                  )}
                </div>

                <div className="seller-modal__group seller-modal__group--full">
                  <label className="seller-modal__label">รายละเอียดสินค้าเพิ่มเติม</label>
                  <textarea
                    className="seller-modal__textarea"
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
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

      {/* Shipping Label Modal */}
      {selectedOrderForLabel && (
        <ShippingLabelModal
          {...selectedOrderForLabel}
          onClose={() => setSelectedOrderForLabel(null)}
        />
      )}
    </main>
  );
}

export default SellerCenterPage;

