import { useState, useEffect, lazy, Suspense } from 'react';
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

// Lazy-loaded pages (Code Splitting) — โหลดเฉพาะเมื่อผู้ใช้เปิดหน้านั้น
const HomePage         = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ShopPage         = lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage         = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage     = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));
const WishlistPage     = lazy(() => import('./pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const OrdersPage       = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const StorePage        = lazy(() => import('./pages/StorePage').then(m => ({ default: m.StorePage })));
const SellerCenterPage = lazy(() => import('./pages/SellerCenterPage').then(m => ({ default: m.SellerCenterPage })));
const HelpCenterPage   = lazy(() => import('./pages/HelpCenterPage').then(m => ({ default: m.HelpCenterPage })));
const VouchersPage     = lazy(() => import('./pages/VouchersPage').then(m => ({ default: m.VouchersPage })));
const FlashSalePage    = lazy(() => import('./pages/FlashSalePage').then(m => ({ default: m.FlashSalePage })));
const StoresDirectoryPage = lazy(() => import('./pages/StoresDirectoryPage').then(m => ({ default: m.StoresDirectoryPage })));
const ChatPage         = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })));
const LoginPage        = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const LiveStreamPage   = lazy(() => import('./pages/LiveStreamPage').then(m => ({ default: m.LiveStreamPage })));
const VideoFeedPage    = lazy(() => import('./pages/VideoFeedPage').then(m => ({ default: m.VideoFeedPage })));
const VideoStudioPage  = lazy(() => import('./pages/VideoStudioPage').then(m => ({ default: m.VideoStudioPage })));
const GamesPage        = lazy(() => import('./pages/GamesPage').then(m => ({ default: m.GamesPage })));
const BrandMallPage    = lazy(() => import('./pages/BrandMallPage').then(m => ({ default: m.BrandMallPage })));
const TrackingPage     = lazy(() => import('./pages/TrackingPage').then(m => ({ default: m.TrackingPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const ComparePage      = lazy(() => import('./pages/ComparePage').then(m => ({ default: m.ComparePage })));
const AffiliatePage    = lazy(() => import('./pages/AffiliatePage').then(m => ({ default: m.AffiliatePage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage        = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const AccountPage      = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const AdminPortalPage  = lazy(() => import('./pages/AdminPortalPage').then(m => ({ default: m.AdminPortalPage })));
const SellerRegisterPage = lazy(() => import('./pages/SellerRegisterPage').then(m => ({ default: m.SellerRegisterPage })));
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
  addToast,
}: any) {
  const location = useLocation();

  // Global Route Change: Always scroll window to top (0, 0) instantly
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname, location.search]);

  const isProductDetailPage = location.pathname.startsWith('/product/');
  const isChatPage = location.pathname.startsWith('/chat');
  const isLivePage = location.pathname.startsWith('/live');
  const isVideoFeedPage = location.pathname.startsWith('/video') || location.pathname.startsWith('/creator');
  const isCheckoutPage = location.pathname.startsWith('/checkout');
  
  // Clean full-screen pages where floating popups and footer should be suppressed
  const isDistractionFreePage = isChatPage || isProductDetailPage || isLivePage || isVideoFeedPage || isCheckoutPage;

  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [visualSearchInitialImage, setVisualSearchInitialImage] = useState<string | null>(null);

  function handleOpenVisualSearch(initialImg?: string | null) {
    setVisualSearchInitialImage(initialImg || null);
    setIsVisualSearchOpen(true);
  }

  return (
    <>
      <PWAInstallPrompt />
      {!isProductDetailPage && location.pathname !== '/video' && (
        <Navbar
          cartCount={cart.totalItems}
          wishlistCount={wishlist.count}
          onOpenVisualSearch={() => handleOpenVisualSearch()}
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
                onAddToCart={p => handleAddToCart(p)}
                isWishlisted={id => wishlist.isWished(id)}
                onToggleWishlist={p => handleToggleWishlist(p)}
              />
            }
          />

          {/* Live Streaming Shopping */}
          <Route
            path="/live"
            element={<LiveStreamPage onAddToCart={p => handleAddToCart(p)} cartCount={cart.totalItems} />}
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
            element={<FlashSalePage onAddToCart={p => handleAddToCart(p)} />}
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
              />
            }
          />

          {/* Stores Directory */}
          <Route path="/stores" element={<StoresDirectoryPage />} />

          {/* Chat Inbox */}
          <Route path="/chat" element={<ChatPage />} />

          {/* Login / Authentication */}
          <Route
            path="/login"
            element={
              <LoginPage
                onLoginSuccess={name => {
                  addToast(`ยินดีต้อนรับคุณ ${name} เข้าสู่ระบบ!`, 'success', '👋');
                }}
              />
            }
          />

          {/* Customer Account & Verification Portal */}
          <Route path="/account" element={<AccountPage />} />

          {/* Super Admin Portal (7 Departments) */}
          <Route path="/admin" element={<AdminPortalPage products={productList} />} />

          {/* Product Detail */}
          <Route
            path="/product/:id"
            element={
              <ProductDetailPage
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
              <SellerCenterPage
                products={productList}
                onAddProduct={handleAddProduct}
                onDeleteProduct={handleDeleteProduct}
              />
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
                  addToast('ลบสินค้าออกจากตะกร้าแล้ว', 'info', '🗑️');
                }}
                onClear={() => {
                  cart.clearCart();
                  addToast('ล้างตะกร้าสินค้าทั้งหมดแล้ว', 'info', '🗑️');
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

          {/* Account Profile */}
          <Route
            path="/account"
            element={
              <main style={{ paddingTop: 'calc(var(--navbar-height) + var(--space-8))', minHeight: '80vh' }}>
                <div className="container" style={{ maxWidth: 640 }}>
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 0,
                    padding: 'var(--space-8)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                      <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 0,
                        background: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                      }}>
                        👤
                      </div>
                      <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800 }}>ผู้ใช้งาน Movemall</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>user@movemall.local</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <Link
                        to="/seller"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-3) var(--space-4)',
                          background: 'var(--primary-subtle)',
                          borderRadius: 0,
                          border: '1px solid var(--primary-light)',
                          fontWeight: 700,
                          fontSize: 13,
                          color: 'var(--primary-dark)',
                        }}
                      >
                        <span>🏪 ศูนย์ผู้ขาย (Seller Centre)</span>
                        <span>เข้าสู่แดชบอร์ด →</span>
                      </Link>

                      <Link
                        to="/games"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-3) var(--space-4)',
                          background: 'var(--surface-hover)',
                          borderRadius: 0,
                          border: '1px solid var(--border)',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <span>🎮 เล่นเกมหมุนวงล้อ & เช็คอิน</span>
                        <span style={{ color: 'var(--primary)' }}>เล่นเกม →</span>
                      </Link>

                      <Link
                        to="/vouchers"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-3) var(--space-4)',
                          background: 'var(--surface-hover)',
                          borderRadius: 0,
                          border: '1px solid var(--border)',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <span>🎟️ โค้ดส่วนลดของฉัน</span>
                        <span style={{ color: 'var(--primary)' }}>ดูโค้ด →</span>
                      </Link>

                      <Link
                        to="/chat"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-3) var(--space-4)',
                          background: 'var(--surface-hover)',
                          borderRadius: 0,
                          border: '1px solid var(--border)',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <span>💬 กล่องข้อความแชท</span>
                        <span style={{ color: 'var(--primary)' }}>เปิดแชท →</span>
                      </Link>

                      <Link
                        to="/orders"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-3) var(--space-4)',
                          background: 'var(--surface-hover)',
                          borderRadius: 0,
                          border: '1px solid var(--border)',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <span>📦 ประวัติการสั่งซื้อ</span>
                        <span style={{ color: 'var(--primary)' }}>ดูทั้งหมด →</span>
                      </Link>

                      <Link
                        to="/wishlist"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-3) var(--space-4)',
                          background: 'var(--surface-hover)',
                          borderRadius: 0,
                          border: '1px solid var(--border)',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <span>❤️ สินค้าที่บันทึกไว้ ({wishlist.count})</span>
                        <span style={{ color: 'var(--primary)' }}>ดูทั้งหมด →</span>
                      </Link>

                      <Link
                        to="/cart"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-3) var(--space-4)',
                          background: 'var(--surface-hover)',
                          borderRadius: 0,
                          border: '1px solid var(--border)',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <span>🛒 ตะกร้าสินค้า ({cart.totalItems})</span>
                        <span style={{ color: 'var(--primary)' }}>ดูทั้งหมด →</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </main>
            }
          />

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
      </div>

      {!isDistractionFreePage && <Footer />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {!isDistractionFreePage && <LiveActivityTicker />}
      {!isDistractionFreePage && <FloatingLiveWidget />}
      {!isProductDetailPage && !isLivePage && <MobileBottomNav cartCount={cart.totalItems} />}
      {!isLivePage && !isVideoFeedPage && <BackToTopButton />}
      <CookieConsentBanner />
    </>
  );
}

function App() {
  const [productList, setProductList] = useState<Product[]>(initialProducts);
  const [customClips, setCustomClips] = useState<VideoClip[]>([]);
  const cart = useCart();
  const wishlist = useWishlist();
  const { toasts, addToast, removeToast } = useToast();

  function handleAddToCart(product: Product, qty = 1) {
    cart.addItem(product, qty);
    addToast(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว (${qty} ชิ้น)`, 'success', '🛒');
  }

  function handleToggleWishlist(product: Product) {
    const isWishedNow = wishlist.isWished(product.id);
    wishlist.toggle(product);
    if (!isWishedNow) {
      addToast(`บันทึก "${product.name}" ใน Wishlist แล้ว`, 'info', '❤️');
    } else {
      addToast(`ลบ "${product.name}" ออกจาก Wishlist แล้ว`, 'info', '🤍');
    }
  }

  function handlePublishClip(newClip: VideoClip) {
    setCustomClips(prev => [newClip, ...prev]);
    addToast('🎉 เผยแพร่วิดีโอสั้นติดตะกร้าเหลืองสำเร็จแล้ว! พร้อมสร้างรายได้ทันที', 'success', '🎬');
  }

  function handleAddProduct(newProduct: Product) {
    setProductList(prev => [newProduct, ...prev]);
    addToast(`ลงขายสินค้า "${newProduct.name}" สำเร็จแล้ว!`, 'success', '📦');
  }

  function handleDeleteProduct(id: string) {
    setProductList(prev => prev.filter(p => p.id !== id));
    addToast('ลบสินค้าออกจากร้านค้าแล้ว', 'info', '🗑️');
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
        addToast={addToast}
      />
    </BrowserRouter>
  );
}

export default App;
