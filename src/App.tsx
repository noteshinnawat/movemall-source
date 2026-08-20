import { useState, useEffect, lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { LiveActivityTicker } from './components/LiveActivityTicker';
import { FloatingLiveWidget } from './components/FloatingLiveWidget';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { BackToTopButton } from './components/BackToTopButton';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { VisualSearchModal } from './components/VisualSearchModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { resetChatSocket } from './utils/chatSocket';
import { API_BASE_URL, createProductApi, updateProductApi, deleteProductApi } from './utils/api';
import { UI_COPY } from './uiCopy';

// Helper to safely retry module imports without causing browser reload loops
function lazyRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      // Retry once in memory after a short delay
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        return await componentImport();
      } catch (retryError) {
        console.error('Failed to load page module:', retryError);
        throw retryError;
      }
    }
  });
}

// Lazy-loaded pages (Code Splitting) — โหลดเฉพาะเมื่อผู้ใช้เปิดหน้านั้น พร้อมระบบ Auto-Retry อัจฉริยะ
const HomePage         = lazyRetry(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ShopPage         = lazyRetry(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })));
const ProductDetailPage = lazyRetry(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage         = lazyRetry(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage     = lazyRetry(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazyRetry(() => import('./pages/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));
const WishlistPage     = lazyRetry(() => import('./pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const OrdersPage       = lazyRetry(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const StorePage        = lazyRetry(() => import('./pages/StorePage').then(m => ({ default: m.StorePage })));
const SellerCenterPage = lazyRetry(() => import('./pages/SellerCenterPage').then(m => ({ default: m.SellerCenterPage })));
const HelpCenterPage   = lazyRetry(() => import('./pages/HelpCenterPage').then(m => ({ default: m.HelpCenterPage })));
const VouchersPage     = lazyRetry(() => import('./pages/VouchersPage').then(m => ({ default: m.VouchersPage })));
const FlashSalePage    = lazyRetry(() => import('./pages/FlashSalePage').then(m => ({ default: m.FlashSalePage })));
const StoresDirectoryPage = lazyRetry(() => import('./pages/StoresDirectoryPage').then(m => ({ default: m.StoresDirectoryPage })));
const ChatPage         = lazyRetry(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })));
const LoginPage        = lazyRetry(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage     = lazyRetry(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const LiveStreamPage   = lazyRetry(() => import('./pages/LiveStreamPage').then(m => ({ default: m.LiveStreamPage })));
const VideoFeedPage    = lazyRetry(() => import('./pages/VideoFeedPage').then(m => ({ default: m.VideoFeedPage })));
const VideoStudioPage  = lazyRetry(() => import('./pages/VideoStudioPage').then(m => ({ default: m.VideoStudioPage })));
const GamesPage        = lazyRetry(() => import('./pages/GamesPage').then(m => ({ default: m.GamesPage })));
const BrandMallPage    = lazyRetry(() => import('./pages/BrandMallPage').then(m => ({ default: m.BrandMallPage })));
const TrackingPage     = lazyRetry(() => import('./pages/TrackingPage').then(m => ({ default: m.TrackingPage })));
const NotificationsPage = lazyRetry(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const ComparePage      = lazyRetry(() => import('./pages/ComparePage').then(m => ({ default: m.ComparePage })));
const AffiliatePage    = lazyRetry(() => import('./pages/AffiliatePage').then(m => ({ default: m.AffiliatePage })));
const PrivacyPolicyPage = lazyRetry(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage        = lazyRetry(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const AccountPage      = lazyRetry(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const AdminPortalPage  = lazyRetry(() => import('./pages/AdminPortalPage').then(m => ({ default: m.AdminPortalPage })));
const SellerRegisterPage = lazyRetry(() => import('./pages/SellerRegisterPage').then(m => ({ default: m.SellerRegisterPage })));
const LineCallbackPage   = lazyRetry(() => import('./pages/LineCallbackPage').then(m => ({ default: m.LineCallbackPage })));
import { products as initialProducts } from './data/products';
import { useCart } from './hooks/useCart';
import { useWishlist } from './hooks/useWishlist';
import { useToast } from './hooks/useToast';
import type { Product, VideoClip } from './types';
import './App.css';

function AppLayout({
  productList,
  setProductList,
  customClips,
  cart,
  wishlist,
  toasts,
  removeToast,
  handleAddToCart,
  handleToggleWishlist,
  handlePublishClip,
  handleAddProduct,
  handleDeleteProduct,
  handleUpdateProduct,
  addToast,
}: any) {
  const location = useLocation();

  // Global Route Change: Always scroll window to top (0, 0) instantly
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname, location.search]);

  // สลับบัญชี/ออกจากระบบ: ตัด socket เดิมทิ้ง ไม่ให้ค้างด้วย token ของ session ก่อนหน้า
  useEffect(() => {
    window.addEventListener('movemall_auth_change', resetChatSocket);
    return () => window.removeEventListener('movemall_auth_change', resetChatSocket);
  }, []);

  const isProductDetailPage = location.pathname.startsWith('/product/');
  const isChatPage = location.pathname.startsWith('/chat');
  const isLivePage = location.pathname.startsWith('/live');
  const isVideoFeedPage = location.pathname.startsWith('/video') || location.pathname.startsWith('/creator');
  const isCheckoutPage = location.pathname.startsWith('/checkout');
  const isSellerPage = location.pathname.startsWith('/seller');
  const isAdminPage = location.pathname.startsWith('/admin') || isSellerPage;
  
  // Clean full-screen pages where floating popups and footer should be suppressed
  const isDistractionFreePage = isChatPage || isLivePage || isVideoFeedPage || isCheckoutPage || isAdminPage;

  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [visualSearchInitialImage, setVisualSearchInitialImage] = useState<string | null>(null);

  function handleOpenVisualSearch(initialImg?: string | null) {
    setVisualSearchInitialImage(initialImg || null);
    setIsVisualSearchOpen(true);
  }

  return (
    <>
      {!isAdminPage && <PWAInstallPrompt />}
      {!isChatPage && location.pathname !== '/video' && !isAdminPage && (
        <Navbar
          cartCount={cart.totalItems}
          wishlistCount={wishlist.count}
          onOpenVisualSearch={() => handleOpenVisualSearch()}
          className={isProductDetailPage ? 'navbar--desktop-only' : ''}
        />
      )}

      {/* Movemall AI Lens Visual Search Modal */}
      <VisualSearchModal
        isOpen={isVisualSearchOpen}
        onClose={() => {
          setIsVisualSearchOpen(false);
          setVisualSearchInitialImage(null);
        }}
        initialImage={visualSearchInitialImage}
        onAddToCart={p => handleAddToCart(p)}
      />

      <div style={{ flex: 1 }}>
        <ErrorBoundary>
          <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>กำลังโหลด...</span>
            </div>
          }>
        <Routes>
          {/* Home */}
          <Route
            path="/"
            element={
              <HomePage
                products={productList}
                onAddToCart={p => handleAddToCart(p)}
                isWishlisted={id => wishlist.isWished(id)}
                onToggleWishlist={p => handleToggleWishlist(p)}
              />
            }
          />

          {/* Shop */}
          <Route
            path="/shop"
            element={
              <ShopPage
                products={productList}
                onAddToCart={p => handleAddToCart(p)}
                isWishlisted={id => wishlist.isWished(id)}
                onToggleWishlist={p => handleToggleWishlist(p)}
              />
            }
          />

          {/* Official Brand Mall */}
          <Route
            path="/mall"
            element={
              <BrandMallPage
                products={productList}
                onAddToCart={p => handleAddToCart(p)}
                isWishlisted={id => wishlist.isWished(id)}
                onToggleWishlist={p => handleToggleWishlist(p)}
              />
            }
          />

          {/* Live Streaming Shopping */}
          <Route
            path="/live"
            element={<LiveStreamPage products={productList} onAddToCart={p => handleAddToCart(p)} cartCount={cart.totalItems} />}
          />

          {/* Movemall Short Video Clips Social Feed (TikTok Style) */}
          <Route
            path="/video"
            element={
              <VideoFeedPage
                onAddToCart={p => handleAddToCart(p)}
                customClips={customClips}
              />
            }
          />

          {/* Short Video Creator Studio with Yellow Basket & Compression */}
          <Route
            path="/video/create"
            element={
              <VideoStudioPage
                onPublishClip={c => handlePublishClip(c)}
              />
            }
          />
          <Route
            path="/creator/studio"
            element={
              <VideoStudioPage
                onPublishClip={c => handlePublishClip(c)}
              />
            }
          />

          {/* Gamification Hub */}
          <Route
            path="/games"
            element={
              <GamesPage
                onRewardWon={msg => addToast(msg, 'success', '🎁')}
              />
            }
          />

          {/* Flash Sale Hub */}
          <Route
            path="/flash-sale"
            element={<FlashSalePage products={productList} onAddToCart={p => handleAddToCart(p)} />}
          />

          {/* Vouchers & Promotions */}
          <Route path="/vouchers" element={<VouchersPage />} />

          {/* Notifications Hub */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Live Parcel Tracking */}
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/tracking/:orderId" element={<TrackingPage />} />

          {/* Product Comparison Tool */}
          <Route
            path="/compare"
            element={<ComparePage onAddToCart={p => handleAddToCart(p)} />}
          />

          {/* Creator & Affiliate Program */}
          <Route
            path="/affiliate"
            element={
              <AffiliatePage
                onCopySuccess={msg => addToast(msg, 'success', '🔗')}
                onPublishClip={handlePublishClip}
              />
            }
          />

          {/* Stores Directory */}
          <Route path="/stores" element={<StoresDirectoryPage />} />

          {/* Chat Inbox — ต้องล็อกอิน เพราะห้องแชทผูกกับตัวตนที่เซิร์ฟเวอร์ยืนยันได้ */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* Login / Authentication */}
          <Route
            path="/login"
            element={
              <LoginPage
                onLoginSuccess={name => {
                  addToast(`ยินดีต้อนรับ ${name}`, 'success', '👋');
                }}
              />
            }
          />

          {/* Customer Registration */}
          <Route
            path="/register"
            element={
              <RegisterPage
                onRegisterSuccess={() => {
                  addToast('สมัครสำเร็จ รับ Coins แล้ว', 'success', '🎁');
                }}
              />
            }
          />

          {/* LINE OAuth Callback */}
          <Route path="/auth/line/callback" element={<LineCallbackPage />} />

          {/* Customer Account & Verification Portal */}
          <Route path="/account" element={<AccountPage />} />

          {/* Super Admin Portal (7 Departments) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'CATALOG_ADMIN', 'FINANCE_ADMIN', 'CS_ADMIN', 'MARKETING_ADMIN', 'LOGISTICS_ADMIN', 'MODERATOR']}>
                <AdminPortalPage products={productList} />
              </ProtectedRoute>
            }
          />

          {/* Product Detail */}
          <Route
            path="/product/:id"
            element={
              <ProductDetailPage
                products={productList}
                onAddToCart={(p, qty) => handleAddToCart(p, qty)}
                isWishlisted={id => wishlist.isWished(id)}
                onToggleWishlist={p => handleToggleWishlist(p)}
                cartCount={cart.totalItems}
                onOpenVisualSearchWithImage={img => handleOpenVisualSearch(img)}
              />
            }
          />

          {/* Marketplace Store Page */}
          <Route
            path="/store/:id"
            element={
              <StorePage
                allProducts={productList}
                onAddToCart={p => handleAddToCart(p)}
                isWishlisted={id => wishlist.isWished(id)}
                onToggleWishlist={p => handleToggleWishlist(p)}
              />
            }
          />

          {/* Marketplace Seller Center & Registration */}
          <Route path="/seller/register" element={<SellerRegisterPage />} />
          <Route
            path="/seller"
            element={
              <ProtectedRoute allowedRoles={['SELLER', 'CREATOR', 'SUPER_ADMIN', 'ADMIN']} fallbackPath="/seller/register">
              <SellerCenterPage
                products={productList}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
              />
              </ProtectedRoute>
            }
          />

          {/* Cart */}
          <Route
            path="/cart"
            element={
              <CartPage
                items={cart.items}
                subtotal={cart.subtotal}
                shipping={cart.shipping}
                total={cart.total}
                onUpdateQty={cart.updateQty}
                onRemove={productId => {
                  cart.removeItem(productId);
                  addToast(UI_COPY.cart.removed, 'info', '🗑️');
                }}
                onClear={() => {
                  cart.clearCart();
                  addToast(UI_COPY.cart.cleared, 'info', '🗑️');
                }}
                onAddToCart={(p, qty) => handleAddToCart(p, qty)}
                isWishlisted={id => wishlist.isWished(id)}
                onToggleWishlist={p => handleToggleWishlist(p)}
              />
            }
          />

          {/* Checkout */}
          <Route
            path="/checkout"
            element={
              <CheckoutPage
                items={cart.items}
                subtotal={cart.subtotal}
                total={cart.total}
                onClear={cart.clearCart}
              />
            }
          />

          {/* Order Success */}
          <Route path="/order/success" element={<OrderSuccessPage />} />

          {/* Wishlist */}
          <Route
            path="/wishlist"
            element={
              <WishlistPage
                items={wishlist.items}
                onAddToCart={p => handleAddToCart(p)}
              />
            }
          />

          {/* Orders */}
          <Route path="/orders" element={<OrdersPage />} />

          {/* Help & Information Pages */}
          <Route path="/help" element={<HelpCenterPage initialTab="help" />} />
          <Route path="/how-to-order" element={<HelpCenterPage initialTab="how-to-order" />} />
          <Route path="/shipping" element={<HelpCenterPage initialTab="shipping" />} />
          <Route path="/returns" element={<HelpCenterPage initialTab="returns" />} />
          <Route path="/contact" element={<HelpCenterPage initialTab="contact" />} />


          {/* PDPA & Legal Routes */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* 404 Not Found */}
          <Route
            path="*"
            element={
              <div style={{
                paddingTop: 'calc(var(--navbar-height) + var(--space-12))',
                minHeight: '70vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 16,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 48 }}>🔍</div>
                <h1 style={{ fontSize: 24, fontWeight: 800 }}>404 — ไม่พบหน้าที่ต้องการ</h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 400, fontSize: 14 }}>
                  หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบ หรือ URL ไม่ถูกต้อง
                </p>
                <Link
                  to="/"
                  style={{
                    marginTop: 8,
                    padding: '10px 20px',
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: 0,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  กลับสู่หน้าหลัก
                </Link>
              </div>
            }
          />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </div>

      {!isDistractionFreePage && <Footer />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {!isDistractionFreePage && <LiveActivityTicker />}
      {!isDistractionFreePage && <FloatingLiveWidget />}
      {!isProductDetailPage && !isLivePage && !isChatPage && !isAdminPage && <MobileBottomNav cartCount={cart.totalItems} />}
      {!isLivePage && !isVideoFeedPage && !isAdminPage && <BackToTopButton />}
      {!isAdminPage && <CookieConsentBanner />}
    </>
  );
}

function App() {
  const [productList, setProductList] = useState<Product[]>(() => {
    try {
      const savedCustom = localStorage.getItem('movemall_user_custom_products');
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const customIds = new Set(parsed.map((p: Product) => p.id));
          return [...parsed, ...initialProducts.filter(p => !customIds.has(p.id))];
        }
      }
    } catch {
      // Ignore parse error
    }
    return initialProducts;
  });
  const [customClips, setCustomClips] = useState<VideoClip[]>([]);
  const cart = useCart();
  const wishlist = useWishlist(productList);
  const { toasts, addToast, removeToast } = useToast();

  // ── Sync Products Live from Supabase / Railway Backend ──
  useEffect(() => {
    async function loadProductsLive() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products?limit=200`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.products) && data.products.length > 0) {
            setProductList(prev => {
              const liveIds = new Set(data.products.map((p: Product) => p.id));
              const customUserCreated = prev.filter(p => !liveIds.has(p.id) && (p.id.startsWith('p-custom-') || p.storeId?.startsWith('store-custom-')));
              return [...data.products, ...customUserCreated];
            });
            console.log(`[Movemall DB] ✅ Synced ${data.products.length} products live from Supabase PostgreSQL Database!`);
          }
        }
      } catch {
        console.info('[Movemall DB] Backend offline or using local product cache');
      }
    }

    loadProductsLive();
  }, []);

  function handleAddToCart(product: Product, qty = 1) {
    cart.addItem(product, qty);
    addToast(UI_COPY.cart.added(qty), 'success', '🛒');
  }

  function handleToggleWishlist(product: Product) {
    const isWishedNow = wishlist.isWished(product.id);
    wishlist.toggle(product);
    if (!isWishedNow) {
      addToast(UI_COPY.wishlist.added, 'info', '❤️');
    } else {
      addToast(UI_COPY.wishlist.removed, 'info', '🤍');
    }
  }

  function handlePublishClip(newClip: VideoClip) {
    setCustomClips(prev => [newClip, ...prev]);
    addToast('เผยแพร่วิดีโอแล้ว', 'success', '🎬');
  }

  async function handleAddProduct(newProduct: Product) {
    setProductList(prev => {
      const updated = [newProduct, ...prev];
      try {
        const customProds = updated.filter(p => p.storeId?.startsWith('store-') || p.id.startsWith('p-custom-'));
        localStorage.setItem('movemall_user_custom_products', JSON.stringify(customProds));
      } catch {
        // Ignore storage full
      }
      return updated;
    });

    try {
      await createProductApi({
        name: newProduct.name,
        description: newProduct.description || '',
        price: newProduct.price,
        originalPrice: newProduct.originalPrice,
        category: newProduct.category,
        brand: newProduct.name.split(' ')[0] || 'ทั่วไป',
        images: newProduct.images?.length > 0 ? newProduct.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'],
        stock: newProduct.stock || 100,
        badge: newProduct.badge || 'new',
        storeId: newProduct.storeId || undefined,
      });
      console.log('[Movemall API] ✅ Product saved to Supabase DB successfully');
    } catch (err) {
      console.warn('[Movemall API] Could not persist product to DB API, saved locally:', err);
    }
    addToast('ลงขายสินค้าแล้ว', 'success', '📦');
  }

  async function handleDeleteProduct(id: string) {
    setProductList(prev => {
      const updated = prev.filter(p => p.id !== id);
      try {
        const customProds = updated.filter(p => p.storeId?.startsWith('store-') || p.id.startsWith('p-custom-'));
        localStorage.setItem('movemall_user_custom_products', JSON.stringify(customProds));
      } catch {
        // Ignore
      }
      return updated;
    });

    try {
      await deleteProductApi(id);
      console.log('[Movemall API] ✅ Product deleted from DB successfully');
    } catch (err) {
      console.warn('[Movemall API] Could not delete product from DB API:', err);
    }
    addToast('ลบสินค้าออกจากร้านค้าแล้ว', 'info', '🗑️');
  }

  async function handleUpdateProduct(updatedProduct: Product) {
    setProductList(prev => {
      const updated = prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      try {
        const customProds = updated.filter(p => p.storeId?.startsWith('store-') || p.id.startsWith('p-custom-'));
        localStorage.setItem('movemall_user_custom_products', JSON.stringify(customProds));
      } catch {
        // Ignore
      }
      return updated;
    });

    try {
      await updateProductApi(updatedProduct.id, {
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        originalPrice: updatedProduct.originalPrice,
        category: updatedProduct.category,
        stock: updatedProduct.stock,
        badge: updatedProduct.badge,
        images: updatedProduct.images,
      });
      console.log('[Movemall API] ✅ Product updated in DB successfully');
    } catch (err) {
      console.warn('[Movemall API] Could not update product on DB API:', err);
    }
    addToast('อัปเดตสินค้าแล้ว', 'success', '✏️');
  }

  return (
    <BrowserRouter>
      <AppLayout
        productList={productList}
        setProductList={setProductList}
        customClips={customClips}
        cart={cart}
        wishlist={wishlist}
        toasts={toasts}
        removeToast={removeToast}
        handleAddToCart={handleAddToCart}
        handleToggleWishlist={handleToggleWishlist}
        handlePublishClip={handlePublishClip}
        handleAddProduct={handleAddProduct}
        handleDeleteProduct={handleDeleteProduct}
        handleUpdateProduct={handleUpdateProduct}
        addToast={addToast}
      />
    </BrowserRouter>
  );
}

export default App;
