# Movemall — Agent Collaboration Guide & Project Blueprint

> 📌 **สำหรับ AI Agents ทุกตัว (Antigravity, Claude, Codex, Cursor, etc.) ที่เข้ามาทำงานในโปรเจกต์นี้**:
> กรุณาอ่านเอกสารนี้เป็นอันดับแรกก่อนเริ่มแก้ไขโค้ด เพื่อให้เข้าใจสถาปัตยกรรม ทิศทาง และข้อกำหนดอย่างถูกต้องตรงกัน

---

## 🎯 1. วิสัยทัศน์และทิศทางของโปรเจกต์ (Project Vision & Direction)

**Movemall** คือ **Interactive & Entertainment Social Marketplace** รุ่นใหม่ที่ผสานจุดเด่นของ:
1. 🛍️ **Shopee / Lazada**: มาร์เก็ตเพลสครบวงจร มีสินค้าครบทุกหมวดหมู่ (160+ รายการ) มีระบบร้านค้าแยก (Multi-Vendor), ศูนย์ผู้ขาย (Seller Centre), Flash Sale, และศูนย์รวมโค้ดส่วนลด
2. 🔴 **TikTok Shop / Shopee Live**: ระบบช้อปปิ้งผ่านไลฟ์สด (Live Stream Shopping) มีคอมเมนต์สด, ปุ่มส่งหัวใจ, และปักหมุดสินค้าลดพิเศษในไลฟ์พร้อมกดซื้อใส่ตะกร้าทันที
3. 🛡️ **Shopee Mall / LazMall**: โซนรวมแบรนด์ดังระดับโลกของแท้ 100% (Apple, Samsung, Nike, Dyson, ฯลฯ) พร้อมการันตี 3 ต่อ (คืนเงิน 2 เท่า, คืนฟรี 30 วัน, ส่งฟรี)
4. 🎮 **Gamification & Daily Rewards**: วงล้อหมุนลุ้นโชค Lucky Wheel, เช็คอิน 7 วันรับเหรียญ Coins นำไปใช้ลดราคาสินค้าได้จริง
5. 📱 **Mobile-First PWA**: ทำงานแบบ Progressive Web App ติดตั้งลงหน้าจอมือถือได้ พร้อมแถบเมนูด้านล่าง (Mobile Bottom Nav)

---

## 🎨 2. แนวทางการออกแบบและดีไซน์ (Design System Rules)

*อ้างอิงตามความต้องการล่าสุดของผู้ใช้งาน (Clean Flat Minimalist & Strict Rectangular Design)*:

- **Theme**: Flat Clean Light Theme (พื้นหลังขาว สะอาดตา อ่านง่าย ไม่ซับซ้อน)
- **Border Radius**: `border-radius: 6px` (`var(--radius-md)`) **ปรับขอบมนเท่า Product Card ทั้งหมด** บนการ์ด ปุ่ม แบดจ์ อินพุต ไดอะล็อก และกล่องป๊อปอัป (ยกเว้นรูปโปรไฟล์/อวตารร้านค้าที่ใช้ `50%` วงกลม)
- **Color Palette (โทนสีหลัก)**:
  - Background: `#FFFFFF` (ขาวบริสุทธิ์) / Surface: `#F9FAFB`
  - Text: `#111827` (Slate 900) / Text Muted: `#6B7280`
  - Primary Brand: `#2563EB` (Royal Blue)
  - Mall & Flash Sale Accent: `#DC2626` / `#EF4444` (Vivid Red)
  - Success: `#10B981` / Warning: `#F59E0B`
  - Border: `#E5E7EB` (เทาอ่อน เรียบง่าย)
- **Styling Tech**: ใช้ **Vanilla CSS เท่านั้น** (ไม่ใช้ Tailwind CSS) ตามกฎของโปรเจกต์

---

## 🏗️ 3. สรุปสิ่งที่พัฒนาเสร็จสมบูรณ์แล้ว (Accomplished Features)

| ระบบ / ฟีเจอร์ | หน้า (Route) | คำอธิบาย & คอมโพเนนต์ที่เกี่ยวข้อง |
|---|:---:|---|
| **หน้าแรก (Home & AI Feed)** | `/` | Hero Banners, **MOVEMALL LIVE 4 ช่องเล็กวางเหนือหมวดหมู่สินค้า**, Flash Sale Countdown, Games Rewards Strip, **ฟีดแนะนำสินค้าอัจฉริยะ 4 แท็บ (✨ สำหรับคุณ AI Personalized, 🔥 ขายดี, ⚡ ดีลลดแรง, 👑 Mall)** |
| **แคตตาล็อกสินค้า (Shop)** | `/shop` | สินค้าตัวอย่าง 160 รายการ (8 หมวดหมู่ x 20 ชิ้น), ระบบค้นหา, ตัวกรองราคา/หมวด/แบรนด์, เรียงลำดับ |
| **แบรนด์ดังทางการ (Mall)** | `/mall` | การันตี 3 ต่อ, Super Brand Day, ไดเรกทอรีแบรนด์ (Apple, Samsung, Nike...), ดีล Mall ป้ายแดง |
| **ไลฟ์สดสไตล์ TikTok (Live)** | `/live` | สตรีมมิ่งสด 6 ช่อง สไลด์ขึ้น/ลงแบบ TikTok, แชทสด, หัวใจ ❤️, **ตะกร้าสีเหลืองปักหมุดพร้อมแสงวิบวับ & ป้ายแจ้งเตือนกำลังสั่งซื้อสด** |
| **วิดีโอสั้นติดตะกร้า (Short Video Feed)** | `/video` | **ฟีดรับชมคลิปสั้นโซเชียลมีเดียแนวตั้ง 9:16 สไตล์ TikTok/Shopee Video, แถบตะกร้าสีเหลือง (Yellow Basket) สั่งซื้อทันที, แอนิเมชันหัวใจ ❤️, กล่องคอมเมนต์สด, แชร์คลิป** |
| **สตูดิโอสร้างคลิป (Creator Studio)** | `/video/create`, `/creator/studio` | **ระบบอัปโหลดคลิป, บังคับเวลาคลิปไม่เกิน 60s (Trimmer), ระบบบีบอัดลดขนาดวิดีโออัจฉริยะ (Video Compressor ลดขนาด ~80%), เลือกสินค้าติดตะกร้าเหลือง, คำนวณค่าคอมมิชชั่น, พรีวิว 9:16 และโพสต์ลงฟีดทันที** |
| **หน้าร้านค้า & ไลฟ์สด (Store)** | `/store/:id` | โปรไฟล์ร้านค้า, คูปองร้าน, สินค้า, **แบนเนอร์แจ้งเตือนไลฟ์สดของร้านค้าทันทีเมื่อร้านกำลัง Live**, ปุ่มเปิดห้องแชทจริง |
| **ระบบค้นหาด้วยรูปภาพ (AI Visual Lens)** | ทั่วทั้งเว็บ / Modal | **Movemall AI Lens: อัปโหลดรูปภาพ, ถ่ายสดผ่านกล้อง/เว็บแคม, ตัวอย่างภาพ Demo ยอดนิยม, เลเซอร์สแกน AI Sweep FX, ตรวจจับวัตถุและ Bounding Box อัจฉริยะ, สรุปโทนสีเด่น, คำนวณ Visual Match Score % และสั่งซื้อสินค้าได้ทันที** |
| **หน้ารายละเอียดสินค้า (Detail)** | `/product/:id` | สเปกสินค้า, แกลเลอรีรูป, รีวิว, **ปุ่ม 🔍 ค้นหาภาพคล้ายกันด้วย AI Visual Search**, **แถบแจ้งเตือน 🔴 LIVE ร้านค้ากำลังถ่ายทอดสดพร้อมโค้ดลด 50%**, ปุ่มแชทคุยกับร้าน |
| **ศูนย์ผู้ขาย, Open API & Movemall Ads** | `/seller` | แดชบอร์ดสถิติ, จัดการสินค้า/ออเดอร์, พิมพ์ใบปะหน้า, **แท็บ 🔌 Open API & Enterprise Security Hub (สลับ Sandbox/Live Key, IP Whitelisting, Scopes Permissions, และ Webhook HMAC-SHA256 Simulator)**, **แท็บ 🎯 Movemall Ads (ยิงโฆษณา Search/Discovery/Live, Ad Wallet, ROAS Tracker, Smart Click Shield)** |
| **กล่องข้อความแชทสด (Chat)** | `/chat` | แชทระหว่างผู้ซื้อและร้านค้า เลือกร้านค้าอัตโนมัติตาม URL params, บอทตอบกลับอัตโนมัติใน 1.2 วินาที |
| **ระบบชำระเงิน, พร้อมเพย์ & BNPL** | `/checkout` | **Movemall PayLater (ผ่อน 0% สูงสุด 3 เดือน วงเงิน ฿15,000)**, **แลกเหรียญ Movemall Coins ลดเงินสด**, PromptPay QR จริง 5 นาที |
| **ศูนย์รวมเกมส์ & เหรียญ (Games)** | `/games` | วงล้อหมุนลุ้นโชค (Lucky Spin), เช็คอิน 7 วันรับ Coins, เปิดการ์ดลุ้นคูปอง (Mystery Cards) |
| **Flash Sale Hub** | `/flash-sale` | นับเวลาถอยหลัง Real-time, แถบเลือกช่วงเวลา (12:00, 18:00, 21:00, 00:00), Progress Bar สินค้าที่ขายแล้ว |
| **ศูนย์คูปองส่วนลด** | `/vouchers` | รวมโค้ดส่งฟรี โค้ดลดแบรนด์ โค้ดลูกค้าใหม่ และปุ่ม "เก็บโค้ดทั้งหมด" |
| **นายหน้า & Affiliate Hub** | `/affiliate` | แดชบอร์ดรายได้ค่าคอมมิชชั่น, เครื่องมือสร้างลิงก์ป้ายยา, **เครื่องมืออัปโหลดคลิปวิดีโอป้ายยาติดตะกร้าเหลือง** |
| **ติดตามพัสดุ & แผนที่สด** | `/tracking`, `/tracking/:orderId` | ไทม์ไลน์ 4 ขั้นตอน, แผนที่ GPS พิกัดรถส่งของเคลื่อนที่สด, ข้อมูลคนขับ & เบอร์ติดต่อ |
| **ศูนย์ข้อมูล กฎหมาย & PDPA** | `/help`, `/privacy`, `/terms` | รวม FAQ, นโยบายความเป็นส่วนตัวตาม PDPA มาตรา 23, ข้อกำหนดการใช้งาน, แบนเนอร์ Cookie Consent |
| **PWA & Mobile Optimization** | ทั่วทั้งเว็บ | `MobileBottomNav` 5 ปุ่ม, **ปรับตำแหน่ง Pop-up ปลอดภัยไม่ชนกัน (Ticker ด้านบนซ้าย, Live PiP ด้านล่างขวา)**, ซ่อน Footer 4 คอลัมน์บนมือถือ |

---

## 📁 4. โครงสร้างไฟล์และโค้ดปัจจุบัน (Directory Structure)

```
movemall-source/
├── public/
│   ├── favicon.svg
│   ├── manifest.json         # PWA Manifest
│   └── sw.js                 # PWA Service Worker
├── src/
│   ├── components/
│   │   ├── Navbar.tsx / .css
│   │   ├── Footer.tsx / .css
│   │   ├── ProductCard.tsx / .css
│   │   ├── ReviewsSection.tsx / .css
│   │   ├── Toast.tsx / .css
│   │   ├── LiveActivityTicker.tsx / .css    # Realtime Buyer Activity Toasts
│   │   ├── FloatingLiveWidget.tsx / .css    # Floating PiP Live stream
│   │   ├── MobileBottomNav.tsx / .css       # Mobile Bottom Navigation
│   │   └── PWAInstallPrompt.tsx / .css      # Add to Home Screen Banner
│   ├── pages/
│   │   ├── HomePage.tsx / .css
│   │   ├── ShopPage.tsx / .css
│   │   ├── ProductDetailPage.tsx / .css
│   │   ├── BrandMallPage.tsx / .css         # Official Brand Mall
│   │   ├── LiveStreamPage.tsx / .css        # Live Stream Shopping
│   │   ├── GamesPage.tsx / .css             # Gamification Hub
│   │   ├── FlashSalePage.tsx / .css
│   │   ├── VouchersPage.tsx / .css
│   │   ├── StorePage.tsx / .css
│   │   ├── SellerCenterPage.tsx / .css
│   │   ├── HelpCenterPage.tsx / .css
│   │   ├── StoresDirectoryPage.tsx / .css
│   │   ├── ChatPage.tsx / .css
│   │   ├── LoginPage.tsx / .css
│   │   ├── CartPage.tsx / .css
│   │   ├── CheckoutPage.tsx / .css
│   │   ├── OrderSuccessPage.tsx / .css
│   │   ├── WishlistPage.tsx / .css
│   │   └── OrdersPage.tsx / .css
│   ├── data/
│   │   ├── products.ts           # Categories & active product catalogue
│   │   ├── mockProductsData.ts   # 160 realistic products (20 per 8 categories)
│   │   ├── brands.ts             # Famous Brands data
│   │   ├── stores.ts             # Multi-vendor stores data
│   │   └── reviews.ts            # Product & store reviews data
│   ├── hooks/
│   │   ├── useCart.ts
│   │   ├── useWishlist.ts
│   │   └── useToast.ts
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces (Product, Store, Cart, Review, etc.)
│   ├── App.tsx                   # Master router & state manager
│   ├── index.css                 # Global CSS variables & rectangular design resets
│   └── main.tsx
├── package.json
├── BACKEND_BLUEPRINT.md          # สถาปัตยกรรมและ Schema ระบบหลังบ้าน
├── SECURITY_AND_API_GUIDE.md     # คู่มือความปลอดภัย การเข้ารหัส และ Open API
└── AGENTS.md                     # เอกสารแนะนำและคู่มือการพัฒนาสำหรับ AI
```

---

## 🚀 5. ทิศทางและแผนงานในอนาคต (Future Roadmap & Next Milestones)

> 📘 **แผนพัฒนาระบบหลังบ้านและความปลอดภัยฉบับสมบูรณ์**:
> - ดูสถาปัตยกรรม Backend & Prisma Schema ได้ที่ **[BACKEND_BLUEPRINT.md](file:///Users/Jakkatorn-msi/antigravity/movemall-source/BACKEND_BLUEPRINT.md)**
> - ดูมาตรฐานความปลอดภัยและการเข้ารหัสข้อมูลได้ที่ **[SECURITY_AND_API_GUIDE.md](file:///Users/Jakkatorn-msi/antigravity/movemall-source/SECURITY_AND_API_GUIDE.md)**

หากต้องการเริ่มพัฒนาระบบหลังบ้านจริง สามารถทำตามลำดับใน [BACKEND_BLUEPRINT.md](file:///Users/Jakkatorn-msi/antigravity/movemall-source/BACKEND_BLUEPRINT.md) ได้ทันที:

1. **🔗 Database & Auth Integration (Phase 1)**:
   - รัน Prisma ORM ด้วย `schema.prisma` บน PostgreSQL
   - ระบบ JWT Auth + Role-Based Access Control (Buyer, Seller, Creator, Admin)
2. **📦 Core Marketplace APIs (Phase 2)**:
   - CRUD สินค้า, จัดการสต็อก, ตะกร้าสินค้า, และ Atomic Checkout Transaction
3. **💳 Payment Gateway Integration (Phase 3)**:
   - เชื่อมต่อ Omise / Stripe / GB Prime Pay เพื่อรับ Webhook การสแกน PromptPay QR Code
4. **⚡ Real-time WebSockets & Live Services (Phase 4)**:
   - ระบบแชทสด, คอมเมนต์ไลฟ์สตรีม, และส่งพิกัดรถขนส่ง GPS แบบเรียลไทม์
5. **🔔 Push Notification & Service Worker (Phase 5)**:
   - ระบบแจ้งเตือนโปรโมชั่นและสถานะออเดอร์ผ่าน Web Push API บนมือถือ

---

*อัปเดตล่าสุด: 2026-08-16 | สถานะระบบ: React 19 + TypeScript + Vite 8 (ทำงานสมบูรณ์ 0 TypeScript errors)*
