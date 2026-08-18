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
| **ศูนย์ผู้ขาย, พาร์ทเนอร์ ERP, รวมแชท & Ads** | `/seller` | แดชบอร์ดสถิติ, จัดการสินค้า/ออเดอร์, พิมพ์ใบปะหน้า, **แท็บ 🔌 Movemall Partner & Omnichannel Integration Hub (เชื่อมต่อ 1-Click: BigSeller, Ginee, BentoWeb, Page365, Zwiz.ai, Oho Chat, ระบบยื่นขอเชื่อมต่อ ISV Onboarding, สลับ Sandbox/Live Key, IP Whitelisting, Scopes Permissions, และ OmniChat & Webhook HMAC-SHA256 Simulator)**, **แท็บ 🎯 Movemall Ads (ยิงโฆษณา Search/Discovery/Live, Ad Wallet, ROAS Tracker, Smart Click Shield)** |
| **กล่องข้อความแชทสด (Chat)** | `/chat` | แชทระหว่างผู้ซื้อและร้านค้า เลือกร้านค้าอัตโนมัติตาม URL params, บอทตอบกลับอัตโนมัติใน 1.2 วินาที |
| **ระบบหลังบ้าน & REST API Hub** | `server/` (Port 4000) | **Express + Prisma + PostgreSQL + Redis + Socket.io (17 Endpoints): Auth, Products, Stores, Orders (Atomic Transaction), Chat, Ads, Admin, Open API, Tax, Payment (PromptPay QR/Webhook/Refund), Media (S3/R2 Presigned URLs), Live Ingest, AI Lens Search, Logistics GPS, Notifications, Payout)** |
| **ระบบชำระเงิน, พร้อมเพย์ & BNPL** | `/checkout` | **Movemall PayLater (ผ่อน 0% สูงสุด 3 เดือน วงเงิน ฿15,000)**, **แลกเหรียญ Movemall Coins ลดเงินสด**, PromptPay QR จริง 5 นาที, เชื่อมต่อ `POST /api/orders` |
| **ศูนย์การแจ้งเตือน & Realtime Sync** | `/notifications`, Navbar 🔔 | **ศูนย์รวมการแจ้งเตือนเชื่อมต่อฐานข้อมูลจริง (Prisma Database): แจ้งเตือนออเดอร์เมื่อสั่งซื้อสำเร็จ, แจ้งเตือนของขวัญต้อนรับ & Coins, ตัวกรองหมวดหมู่, อัปเดตสถานะอ่านแล้ว/อ่านทั้งหมด, และซิงค์ตัวเลข Badge 🔔 สีแดงบน Navbar แบบ Realtime** |
| **ศูนย์ควบคุมส่วนกลาง (Super Admin Hub)** | `/admin` | **ระบบ Super Admin 7 แผนกงาน: ภาพรวม GMV/Orders, อนุมัติตราป้ายแดง 👑 Mall, อนุมัติการเงิน/ถอนเงิน Payout ร้านค้า, จัดการข้อพิพาทคืนเงิน (Disputes), ฝ่ายตรวจไลฟ์ & คลิป, กำหนดสิทธิ์ RBAC, และ 🎯 Deep Marketing Campaign Hub (สร้างแคมเปญ Super Brand Day / PayDay / Double Digit, เครื่องมือยิง Push Notification บรอดแคสต์ทั่วทั้งแอปแบบ Realtime, และตัวสร้างคูปองส่วนลดกลาง)** |
| **นายหน้า & ครีเอเตอร์ (Affiliate & Creator Hub)** | `/affiliate` | **ระบบนายหน้าครบวงจร: Onboarding Landing Page, แบบฟอร์มสมัคร 4 ขั้นตอน (บุคคลธรรมดา/นิติบุคคล, ตรวจเลขบัตร 13 หลัก, ผูกโซเชียลมีเดีย, ผูกบัญชีธนาคารรับเงิน, e-Withholding Tax 3%), มอบรหัส `CREATOR-THxxxx` + โบนัส ฿500, Creator Dashboard, ระบบถอนเงินหักภาษี 3%, เครื่องมือสร้างลิงก์ป้ายยาเฉพาะตัว และปักตะกร้าเหลืองในคลิปสั้น** |
| **สมัครสมาชิก & เข้าสู่ระบบ (Auth & Google Sign-In)** | `/register`, `/login` | **ระบบสมัครสมาชิกครบวงจร: สลับเบอร์โทรศัพท์ (SMS OTP) / อีเมล (Email OTP), สมัครด้วย Google (Google OAuth / GIS Verification), Password Strength Meter, สิทธิ์ต้อนรับ 3 ต่อ (100 Coins + ส่งฟรี + ลด 50%), โค้ดแนะนำเพื่อน (+50 Coins), Social Sign-Up, และป๊อปอัปเฉลิมฉลองพร้อม Auto-login** |
| **ระบบระงับผู้ใช้-ร้านค้า & ความน่าเชื่อถือ (Trust & Anti-Fraud Shield)** | `/admin`, `/seller`, `/account`, `/checkout` | **ระบบระงับและปกป้องความเป็นธรรม: คะแนนความน่าเชื่อถือผู้ซื้อ (Buyer Trust Score 0-100), ตรวจจับประวัติไม่รับพัสดุ COD / สั่งเล่น / ขอเงินคืนเท็จ, ตัดสิทธิ์ COD อัตโนมัติในหน้า Checkout, ระบบแต้มตัดและสุขภาพร้านค้า (Shop Health 0-100), สั่งพักไลฟ์สด/ซ่อนการค้นหา, ศูนย์รับเรื่องร้องเรียนฉ้อโกงใน Super Admin Hub และฟีเจอร์ร้านค้าเคลมค่าเสียหาย COD 100%** |
| **ระบบลูกค้ารายงานร้านค้าปลอม & มิจฉาชีพ (Customer Anti-Counterfeit & Scam Protection)** | `/product/:id`, `/store/:id`, `/orders`, `/admin` | **ระบบคุ้มครองผู้ซื้อครบวงจร: ปุ่ม 🚩 รายงานสินค้า/ร้านค้าในหน้ารายละเอียดสินค้า หน้าร้านค้า และประวัติออเดอร์, แบบฟอร์มแจ้งสินค้าปลอม/เลียนแบบ/ไม่ตรงปก/มิจฉาชีพโอนเงินนอกระบบ/สินค้าไม่มี อย.-มอก., แนบภาพหลักฐาน & ขอรับเงินคืน 100%-200% ตามการันตี Movemall Money-Back, และระบบซิงค์แจ้งเตือน Super Admin อนุมัติคืนเงินและสั่งแบนร้านค้าทันที** |
| **ระบบ AI ตรวจสอบ อย. / มอก. และความตรงปก (AI Compliance & FDA/TISI Auditor)** | `/admin`, `/seller`, `/product/:id` | **ระบบ AI Compliance Engine 4 เลเยอร์: ตรวจสอบเลข อย. และ มอก. เชื่อมต่อฐานข้อมูลภาครัฐ เช็กสถานะ ACTIVE/EXPIRED/REVOKED, AI Multimodal OCR สแกนรูปถ่ายกล่อง/ฉลากสินค้าจริง, AI Semantic Entity Matching คำนวณคะแนนความตรงปก Match Score % (ตรวจจับการสวมสิทธิ์ อย.), ปุ่ม ⚡ รัน Batch AI Scan สินค้าทั้งระบบใน Super Admin Hub พร้อมปุ่มสั่งซ่อนสินค้าทันที (Auto-Suppress), และตราสัญลักษณ์ Movemall AI Verified Badge ในหน้ารายละเอียดสินค้า** |
| **โครงสร้าง URL และ SEO อัจฉริยะ (SEO-Friendly URLs & Rich Snippets)** | `/product/:slug-i.:id`, ทั่วทั้งเว็บ | **ระบบ Slug มาตรฐาน Shopee/Lazada: แปลงชื่อภาษาไทย/อังกฤษเป็น SEO Slug อัตโนมัติ (`/product/{slug}-i.{id}`), รองรับ Dynamic Meta Tags, Open Graph, Twitter Cards, Canonical URL Sync, Schema.org JSON-LD (Product + BreadcrumbList) และ Backward-Compatible กับ URL เก่าแบบไร้รอยต่อ** |
| **PWA & Mobile Optimization** | ทั่วทั้งเว็บ | `MobileBottomNav` 5 ปุ่ม, **ปรับตำแหน่ง Pop-up ปลอดภัยไม่ชนกัน (Ticker ด้านบนซ้าย, Live PiP ด้านล่างขวา)**, ซ่อน Footer 4 คอลัมน์บนมือถือ |


---

## 📁 4. โครงสร้างไฟล์และโค้ดปัจจุบัน (Directory Structure)

```
movemall-source/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma     # PostgreSQL Data Models & Composite Indexes
│   │   └── seed.ts           # Seeder สต็อกสินค้าและร้านค้าตัวอย่าง
│   ├── src/
│   │   ├── config/           # Database (Prisma Read/Write) & Redis Client
│   │   ├── middleware/       # JWT Auth & Security Middlewares
│   │   ├── routes/
│   │   │   ├── admin.routes.ts        # สถิติภาพรวมและผู้ดูแลระบบ
│   │   │   ├── ads.routes.ts          # Movemall Ads & Smart Click Shield
│   │   │   ├── auth.routes.ts         # Register, Login (JWT), /me Profile
│   │   │   ├── chat.routes.ts         # ดึงและบันทึกประวัติแชท
│   │   │   ├── lens.routes.ts         # AI Visual Lens Search Endpoint
│   │   │   ├── live.routes.ts         # RTMP/WebRTC Stream Keys & Active Channels
│   │   │   ├── logistics.routes.ts    # Courier Booking, GPS Tracking Broadcast
│   │   │   ├── media.routes.ts        # Presigned S3/R2 URLs & Video Registry
│   │   │   ├── notification.routes.ts # Web Push Subscriptions & Broadcast
│   │   │   ├── openapi.routes.ts      # Open API Hub & HMAC Webhooks
│   │   │   ├── order.routes.ts        # Atomic Orders, Stock Deduct, Coin Ledger
│   │   │   ├── payment.routes.ts      # PromptPay QR, Webhooks, Slip Verify, Refund
│   │   │   ├── payout.routes.ts       # Creator/Seller Payout & 3% WHT
│   │   │   ├── product.routes.ts      # Product CRUD, Search & Redis Caching
│   │   │   ├── store.routes.ts        # Multi-Vendor Store Registry
│   │   │   ├── tax.routes.ts          # VAT 7% & 3% Withholding Tax
│   │   │   └── user.routes.ts         # Profile, Address, Coins, OTP Verifications
│   │   └── app.ts                     # Express App & Socket.io Server (Port 4000)
│   ├── docker-compose.yml
│   └── package.json
├── src/
│   ├── components/
│   │   ├── Navbar.tsx / .css
│   │   ├── Footer.tsx / .css
│   │   ├── ProductCard.tsx / .css
│   │   ├── ReviewsSection.tsx / .css
│   │   ├── Toast.tsx / .css
│   │   ├── LiveActivityTicker.tsx / .css
│   │   ├── FloatingLiveWidget.tsx / .css
│   │   ├── MobileBottomNav.tsx / .css
│   │   └── PWAInstallPrompt.tsx / .css
│   ├── pages/
│   │   ├── HomePage.tsx / .css
│   │   ├── ShopPage.tsx / .css
│   │   ├── ProductDetailPage.tsx / .css
│   │   ├── BrandMallPage.tsx / .css
│   │   ├── LiveStreamPage.tsx / .css
│   │   ├── VideoFeedPage.tsx / .css
│   │   ├── VideoStudioPage.tsx / .css
│   │   ├── GamesPage.tsx / .css
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
│   ├── utils/
│   │   └── api.ts            # Centralized API Fetch Client (JWT Auth)
│   ├── types/
│   │   └── index.ts          # TypeScript Definitions
│   ├── App.tsx               # Master Router & State Manager
│   ├── index.css
│   └── main.tsx
├── package.json
├── BACKEND_BLUEPRINT.md
├── SECURITY_AND_API_GUIDE.md
└── AGENTS.md
```

---

## 🚀 5. สถานะระบบปัจจุบัน & แนวทางเปิดให้บริการจริง (Deployment Readiness)

1. **✅ Full-Stack Ready (0 TypeScript Errors)**: ทั้งฝั่ง Frontend (`Vite 8`) และ Backend (`Express + TypeScript 5.8`) ทำการ Compile ผ่าน 100%
2. **✅ Atomic Operations & Security**: การสั่งซื้อสินค้า หักสต็อก แลกเหรียญ และคืนเงินทำงานด้วย ACID Transactions ผ่าน Prisma
3. **🔑 สำหรับการขึ้น Production จริง**:
   - นำ API Key จาก Gateway ชำระเงินจริง (Omise, Stripe, หรือ GB Prime Pay) ใส่ใน `server/.env`
   - ผูก Cloudflare R2 / AWS S3 Credentials สำหรับ Bucket ไฟล์มีเดีย
   - ใส่ VAPID Keys สำหรับ Web Push Notifications

---

*อัปเดตล่าสุด: 2026-08-17 | สถานะระบบ: React 19 + Express 4.21 + PostgreSQL + Redis (ทำงานสมบูรณ์ 0 TypeScript errors)*
