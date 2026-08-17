# Movemall — Backend Architecture Blueprint & Implementation Guide

> 📌 **สำหรับ AI Agents และทีมพัฒนา**:
> เอกสารฉบับนี้คือคู่มือสถาปัตยกรรมระบบหลังบ้าน (Backend Blueprint) ที่ออกแบบตรงตาม Frontend ของ Movemall ทั้งหมด
> เมื่อพร้อมพัฒนา backend สามารถทำตามขั้นตอนและ Schema ในเอกสารนี้ได้ทันที

---

## 🛠️ 1. สรุป Tech Stack แนะนำสำหรับ Backend

- **Runtime & Language**: Node.js (TypeScript) / Express หรือ NestJS
- **Database**: PostgreSQL (Relational Database รองรับ ACID Transaction ทางการเงิน)
- **ORM / Query Builder**: Prisma ORM (Type-safe Database Client)
- **In-Memory Cache & Message Broker**: Redis (แคชสินค้า, จัดการ Session, Rate Limiting)
- **Real-Time Communication**: Socket.io / WebSocket (แชทสด, คอมเมนต์ไลฟ์, พิกัดรถส่งของ GPS)
- **Payment Gateway**: Omise API / Stripe / GB Prime Pay (สร้าง PromptPay QR Code + Webhook ตรวจสอบยอดเงิน)
- **Cloud Storage**: AWS S3 / Cloudflare R2 / Firebase Storage (อัปโหลดรูปสินค้าและสลิป)

---

## 🗄️ 2. Prisma Database Schema (schema.prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ── 1. ผู้ใช้งาน & สมาชิก ──
enum Role {
  BUYER
  SELLER
  CREATOR
  ADMIN
}

model User {
  id            String         @id @default(uuid())
  email         String?        @unique
  phone         String?        @unique
  passwordHash  String
  name          String
  avatarUrl     String?
  role          Role           @default(BUYER)
  coinsBalance  Int            @default(0)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  stores        Store[]
  orders        Order[]
  wishlists     WishlistItem[]
  coinLedgers   CoinLedger[]
  voucherClaims VoucherClaim[]
  notifications Notification[]
  reviews       Review[]
  affiliateLogs AffiliateReferral[]
  sentMessages  ChatMessage[]  @relation("SentMessages")
}

// ── 2. ร้านค้า (Multi-Vendor) ──
model Store {
  id          String    @id @default(uuid())
  ownerId     String
  name        String
  logo        String?
  banner      String?
  description String?
  isMall      Boolean   @default(false)
  isVerified  Boolean   @default(false)
  rating      Float     @default(5.0)
  followers   Int       @default(0)
  createdAt   DateTime  @default(now())

  owner       User      @relation(fields: [ownerId], references: [id])
  products    Product[]
  vouchers    Voucher[]
  liveStreams LiveSession[]
}

// ── 3. สินค้า & หมวดหมู่ ──
model Product {
  id            String    @id @default(uuid())
  storeId       String
  name          String
  description   String
  price         Decimal   @db.Decimal(10, 2)
  originalPrice Decimal?  @db.Decimal(10, 2)
  category      String
  brand         String?
  images        String[]
  stock         Int       @default(100)
  salesCount    Int       @default(0)
  rating        Float     @default(5.0)
  badge         String?   // 'mall', 'sale', 'hot', 'new'
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  store         Store     @relation(fields: [storeId], references: [id])
  orderItems    OrderItem[]
  reviews       Review[]
  wishlists     WishlistItem[]
}

// ── 4. คำสั่งซื้อ & การชำระเงิน ──
enum OrderStatus {
  PENDING
  PAID
  PREPARING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentMethod {
  PROMPTPAY
  CREDIT_CARD
  COD
}

model Order {
  id            String        @id @default(uuid())
  userId        String
  totalAmount   Decimal       @db.Decimal(10, 2)
  shippingCost  Decimal       @default(0) @db.Decimal(10, 2)
  discountAmount Decimal      @default(0) @db.Decimal(10, 2)
  coinsUsed     Int           @default(0)
  paymentMethod PaymentMethod
  status        OrderStatus   @default(PENDING)
  shippingAddress Json
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  user          User          @relation(fields: [userId], references: [id])
  items         OrderItem[]
  tracking      TrackingLog?
  payment       PaymentTransaction?
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal  @db.Decimal(10, 2)

  order     Order    @relation(fields: [orderId], references: [id])
  product   Product  @relation(fields: [productId], references: [id])
}

model PaymentTransaction {
  id            String   @id @default(uuid())
  orderId       String   @unique
  providerRef   String?  // Transaction ID จาก Omise / Stripe
  qrCodeUrl     String?
  amount        Decimal  @db.Decimal(10, 2)
  status        String   // 'pending', 'successful', 'failed'
  paidAt        DateTime?
  createdAt     DateTime @default(now())

  order         Order    @relation(fields: [orderId], references: [id])
}

// ── 5. การติดตามพัสดุ & GPS ──
model TrackingLog {
  id              String   @id @default(uuid())
  orderId         String   @unique
  trackingNumber  String   @unique
  courierProvider String   // 'Flash Express', 'SPX', 'Kerry'
  driverName      String?
  driverPhone     String?
  vehiclePlate    String?
  currentLat      Float?
  currentLng      Float?
  estimatedDelivery DateTime?
  timeline        Json     // บันทึกไทม์ไลน์ 4 สเต็ป
  updatedAt       DateTime @updatedAt

  order           Order    @relation(fields: [orderId], references: [id])
}

// ── 6. ระบบ Movemall PayLater (BNPL) ──
model PayLaterAccount {
  id              String         @id @default(uuid())
  userId          String         @unique
  creditLimit     Decimal        @default(15000.00) @db.Decimal(10, 2)
  availableCredit Decimal        @default(15000.00) @db.Decimal(10, 2)
  usedCredit      Decimal        @default(0.00) @db.Decimal(10, 2)
  kycStatus       String         @default("VERIFIED") // PENDING / VERIFIED / REJECTED
  createdAt       DateTime       @default(now())

  transactions    PayLaterTx[]
  bills           PayLaterBill[]
}

model PayLaterTx {
  id               String          @id @default(uuid())
  accountId        String
  orderId          String
  principalAmount  Decimal         @db.Decimal(10, 2)
  installmentMonths Int            // 1, 3, 6 เดือน
  monthlyAmount    Decimal         @db.Decimal(10, 2)
  status           String          @default("ACTIVE")
  createdAt        DateTime        @default(now())

  account          PayLaterAccount @relation(fields: [accountId], references: [id])
}

model PayLaterBill {
  id          String          @id @default(uuid())
  accountId   String
  billMonth   String          // "2026-09"
  totalDue    Decimal         @db.Decimal(10, 2)
  dueDate     DateTime        // วันที่ 5 ของเดือนถัดไป
  status      String          @default("UNPAID") // UNPAID / PAID / OVERDUE
  paidAt      DateTime?

  account     PayLaterAccount @relation(fields: [accountId], references: [id])
}

// ── 7. ระบบ Merchant Open API & Webhooks ──
model MerchantApiKey {
  id          String    @id @default(uuid())
  storeId     String
  apiKey      String    @unique // "mm_live_sk_..."
  secretHash  String
  webhookUrl  String?
  isActive    Boolean   @default(true)
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())
}

// ── 8. ไลฟ์สดช้อปปิ้ง (Live Streaming) ──
model LiveSession {
  id          String   @id @default(uuid())
  storeId     String
  title       String
  streamUrl   String
  coverImage  String
  pinnedProductId String?
  viewersCount Int     @default(0)
  likesCount  Int      @default(0)
  isLive      Boolean  @default(true)
  createdAt   DateTime @default(now())

  store       Store    @relation(fields: [storeId], references: [id])
  comments    LiveComment[]
}

model LiveComment {
  id          String   @id @default(uuid())
  sessionId   String
  userName    String
  text        String
  createdAt   DateTime @default(now())

  session     LiveSession @relation(fields: [sessionId], references: [id])
}

// ── 7. Gamification & เหรียญ Coins ──
model CoinLedger {
  id          String   @id @default(uuid())
  userId      String
  amount      Int      // บวกเมื่อได้รับ, ลบเมื่อใช้
  source      String   // 'daily_checkin', 'lucky_spin', 'order_discount'
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}

// ── 8. คูปอง & ส่วนลด ──
model Voucher {
  id          String   @id @default(uuid())
  storeId     String?
  code        String   @unique
  discountType String  // 'fixed', 'percentage', 'free_shipping'
  value       Decimal  @db.Decimal(10, 2)
  minSpend    Decimal  @default(0) @db.Decimal(10, 2)
  expiryDate  DateTime
  claimsCount Int      @default(0)

  store       Store?   @relation(fields: [storeId], references: [id])
  claims      VoucherClaim[]
}

model VoucherClaim {
  id        String   @id @default(uuid())
  userId    String
  voucherId String
  isUsed    Boolean  @default(false)
  claimedAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  voucher   Voucher  @relation(fields: [voucherId], references: [id])
}

// ── 9. แชท & การแจ้งเตือน ──
model ChatMessage {
  id          String   @id @default(uuid())
  senderId    String
  recipientId String
  storeId     String?
  text        String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())

  sender      User     @relation("SentMessages", fields: [senderId], references: [id])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  category  String   // 'orders', 'promos', 'live', 'vouchers'
  title     String
  body      String
  link      String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}

model Review {
  id        String   @id @default(uuid())
  userId    String
  productId String
  rating    Int
  comment   String
  likes     Int      @default(0)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  product   Product  @relation(fields: [productId], references: [id])
}

model WishlistItem {
  id        String   @id @default(uuid())
  userId    String
  productId String

  user      User     @relation(fields: [userId], references: [id])
  product   Product  @relation(fields: [productId], references: [id])
}

model AffiliateReferral {
  id          String   @id @default(uuid())
  creatorId   String
  orderId     String?
  commission  Decimal  @db.Decimal(10, 2)
  status      String   // 'pending', 'paid'
  createdAt   DateTime @default(now())

  creator     User     @relation(fields: [creatorId], references: [id])
}
```

---

## 📡 3. รายการ REST API Endpoints ที่ต้องสร้าง

### 1. ระบบยืนยันตัวตน (Authentication)
- `POST /api/auth/register` — สมัครสมาชิก
- `POST /api/auth/login` — เข้าสู่ระบบ (รับ JWT Token)
- `GET /api/auth/me` — ข้อมูลผู้ใช้และยอดเหรียญ Coins

### 2. สินค้า & ร้านค้า (Products & Stores)
- `GET /api/products` — ดึงสินค้า (รองรับ Search, Category, Price Filter, Pagination)
- `GET /api/products/:id` — รายละเอียดสินค้า + รีวิว
- `POST /api/seller/products` — ร้านค้าลงขายสินค้าใหม่
- `GET /api/stores/:id` — ข้อมูลร้านค้าและสินค้าในร้าน
- `GET /api/brands` — ข้อมูลแบรนด์ทางการ (Mall)

## 🗜️ 6. ระบบประมวลผลและบีบอัดสื่อ (Media Compression & Transcoding Pipeline)

เพื่อป้องกันการสิ้นเปลืองพื้นที่ Cloud Storage (AWS S3 / Cloudflare R2) และเพิ่มความเร็วในการโหลดเว็บ:

### 1. 🖼️ รูปภาพสินค้าและรูปรีวิว (Image Pipeline via `sharp`):
- **แปลงเป็นฟอร์แมต WebP อัตโนมัติ 100%**: คุณภาพ Quality 80% (ลดขนาดไฟล์ลง ~80%)
- **ระบบ Multi-Resolution Generation**: บันทึกแยกเป็น 3 ขนาด:
  - **Thumbnail**: 150x150 px (สำหรับแสดงในตะกร้า, แชท, รายการออเดอร์)
  - **Medium**: 500x500 px (สำหรับแสดงในการ์ดสินค้าหน้าแคตตาล็อก)
  - **Full Resolution**: 1200x1200 px (สำหรับหน้า Zoom Product Detail)
- **Metadata Stripping**: ลบข้อมูล EXIF/GPS ส่วนตัวออกจากรูปภาพก่อนจัดเก็บ

```typescript
// ตัวอย่าง Image Processing ด้วย Sharp
import sharp from 'sharp';

export async function processAndUploadImage(buffer: Buffer, filename: string) {
  const webpBuffer = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();
    
  return uploadToS3(webpBuffer, `${filename}.webp`, 'image/webp');
}
```

### 2. 🎥 วิดีโอรีวิวและวิดีโอสินค้า (Video Pipeline via `fluent-ffmpeg`):
- **จำกัดความยาว (Max Duration)**: วิดีโอรีวิวไม่เกิน 60 วินาที / วิดีโอสินค้าไม่เกิน 3 นาที
- **Transcoding Spec**:
  - **Video Codec**: H.264 (libx264) โปรไฟล์ Main
  - **Resolution**: สูงสุด 720p (1280x720) 30fps
  - **Audio Codec**: AAC (128 kbps)
  - **CRF (Constant Rate Factor)**: 24 (ให้ภาพคมชัดระดับสูงโดยประหยัด Bitrate ได้มากกว่า 70%)
- **Poster Generation**: สร้างรูปหน้าปก Thumbnail จากวินาทีที่ 1 ของวิดีโออัตโนมัติ

---

### 3. คำสั่งซื้อ & ชำระเงิน (Orders & Payments)
- `POST /api/orders/checkout` — สร้างออเดอร์และตัดสต็อก (Atomic Transaction)
- `GET /api/orders/my-orders` — ประวัติคำสั่งซื้อของฉัน
- `POST /api/payments/promptpay/create-qr` — สร้าง PromptPay QR Code
- `POST /api/payments/webhook` — Webhook ธนาคารแจ้งเตือนเมื่อเงินเข้า

### 4. ติดตามพัสดุ (Logistics Tracking)
- `GET /api/tracking/:orderId` — ดึงไทม์ไลน์สถานะพัสดุและพิกัด GPS คนขับ

### 5. มินิเกมส์ & เช็คอิน (Gamification)
- `POST /api/games/lucky-spin` — หมุนวงล้อ (จำกัด 1 ครั้ง/วัน)
- `POST /api/games/daily-checkin` — เช็คอินรับ Coins ประจำวัน
- `GET /api/vouchers` — รวมคูปองส่วนลดและกดเก็บโค้ด

### 6. การแจ้งเตือน & ข้อความ (Notifications & Chat)
- `GET /api/notifications` — ดึงรายการแจ้งเตือน 4 หมวด
- `PUT /api/notifications/read-all` — ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว
- `GET /api/chat/rooms` & `POST /api/chat/send` — แชทคุยกับร้าน

---

## ⚡ 4. WebSocket Events (Real-time Events)

- `live:join` / `live:leave` — เข้า/ออกจากห้องไลฟ์
- `live:comment:send` ➔ `live:comment:new` — บรอดแคสต์คอมเมนต์ในไลฟ์สด
- `live:heart:send` ➔ `live:heart:new` — บรอดแคสต์เอฟเฟกต์หัวใจ
- `tracking:driver:gps_update` — รับพิกัด GPS จากคนขับและส่งไปยังแผนที่ผู้ซื้อ
- `notification:push` — ยิงแจ้งเตือนเด้งสดไปยังหน้าจอผู้ใช้

---

## 🚀 5. ขั้นตอนการเริ่มพัฒนา (Step-by-Step for Incoming AI)

1. **สร้างโฟลเดอร์ `server/`** ใน root directory
2. ติดตั้ง `npm init -y && npm install express prisma @prisma/client cors dotenv jsonwebtoken bcryptjs socket.io`
3. วางไฟล์ `schema.prisma` จากด้านบน และรัน `npx prisma db push`
4. สร้าง Express Router เชื่อมต่อ Database และสร้าง Controller ตามหัวข้อที่ 3
5. เปลี่ยน endpoint ใน Frontend จาก mock state ให้เรียกผ่าน `fetch('/api/...')`
