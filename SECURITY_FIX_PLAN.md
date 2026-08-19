# 🔐 Movemall — แผนแก้ไขความปลอดภัย (Security Remediation Plan)

> จัดลำดับตามความรุนแรง: ยึดบัญชี → เงิน → ข้อมูลข้ามร้าน → การป้องกันเชิงโครงสร้าง
> อ้างอิงผลตรวจโค้ดวันที่ 2026-08-19 (audit ฝั่ง static analysis ยังไม่ได้ยิงทดสอบกับเซิร์ฟเวอร์จริง)

**กฎระหว่างแก้:** ห้าม deploy ขึ้น production จนกว่า Phase 0 และ Phase 1 จะผ่านครบ — ช่องโหว่ในสองเฟสนี้ทำให้ยึดสิทธิ์ SUPER_ADMIN และสั่งของฟรีได้โดยไม่ต้องล็อกอิน

---

## Phase 0 — หยุดการยึดบัญชีและสิทธิ์แอดมิน ✅ เสร็จแล้ว (2026-08-19)

> ยืนยันด้วยการยิงทดสอบกับเซิร์ฟเวอร์ที่รันจริงและฐานข้อมูล Supabase จริง
> งานเพิ่มเติมที่พบระหว่างทาง: dotenv ไม่เคยถูก import, LINE channel secret ฮาร์ดโค้ด,
> ปุ่ม Facebook login เป็นของปลอม (ล็อกอินเข้าบัญชีกลางร่วมกัน), ลบบัญชี admin@movemall.com
> ที่ถูกสร้างโดย auto-provision เดิมออกจากฐานข้อมูลแล้ว

เป้าหมาย: ปิดทุกทางที่ออก JWT ให้คนที่ไม่ได้พิสูจน์ตัวตน และทุกทางที่เลื่อนขั้นตัวเองเป็นแอดมิน

### 0.1 ปิด `/api/auth/social-login` — `server/src/routes/auth.routes.ts:729`
ตอนนี้รับแค่ `email` จาก body แล้วออก JWT ตาม role ของ user นั้น = สวมรอยเป็นแอดมินได้ทันที

- ทางเลือกที่แนะนำ: **ลบ endpoint นี้ทิ้ง** แล้วให้ทุก social login ไปที่ `/api/auth/google` หรือ `/api/auth/line` ที่ verify token จริง
- ถ้ายังต้องรองรับ provider อื่น: ต้องรับ `accessToken`/`idToken` แล้ว verify กับ provider ก่อนเสมอ ห้ามรับ `email` ตรงจาก client
- แก้ฝั่งเรียกใช้: `src/pages/RegisterPage.tsx:334`

### 0.2 ตัดช่องทางที่ไม่ verify ใน `/api/auth/google` — `auth.routes.ts:437-455`
- **ลบ step 3** ที่รับ `googleUser` จาก body ตรงๆ (ปลอดภัยที่จะลบ เพราะ `src/utils/googleAuth.ts:138` ส่ง `accessToken` มาคู่กันเสมอในโฟลว์จริง)
- **ล้อม step 4 (`mockUser`)** ด้วย `if (process.env.NODE_ENV !== 'production')` หรือลบทิ้ง
- เพิ่มการตรวจ `aud` จาก tokeninfo ว่าตรงกับ `GOOGLE_CLIENT_ID` ของแอป (กัน token จากแอป Google อื่น)
- ทำแบบเดียวกันกับ `/api/auth/line` — และลบ route `/line` ที่ประกาศซ้ำที่บรรทัด 844 (โค้ดตาย ทับกับบรรทัด 565)

### 0.3 ยกเลิก auto-provision SUPER_ADMIN ตอน login — `auth.routes.ts:227-247`
บล็อกนี้สร้างบัญชี SUPER_ADMIN ใหม่ด้วย**รหัสผ่านที่ผู้โจมตีพิมพ์มาเอง** ถ้าอีเมล whitelist ยังไม่มีในฐานข้อมูล

- **ลบบล็อกทั้งหมด** — ล็อกอินต้องเจอ user ในฐานข้อมูลเท่านั้น
- **ลบบล็อกเลื่อนขั้นอัตโนมัติที่บรรทัด 259** ด้วย (`isSuperAdminEmail(user.email)` → set SUPER_ADMIN)
- ย้าย `SUPER_ADMIN_EMAILS` ที่ฮาร์ดโค้ดออกจากโค้ด ไปเป็น env var
- ตั้งแอดมินคนแรกผ่าน **seed script / migration ที่รันด้วยมือ** เท่านั้น ไม่ใช่ผ่าน login path

### 0.4 ปิดช่องเลื่อนขั้นผ่านการแก้อีเมลตัวเอง — `server/src/routes/user.routes.ts:59`
- ตัด `email` และ `phone` ออกจาก `PUT /api/user/profile` (เหลือแค่ `name`, `avatarUrl`)
- การเปลี่ยนอีเมล/เบอร์ต้องผ่าน endpoint แยกที่ verify OTP จริงเท่านั้น
- ต่อให้ทำ 0.3 แล้ว ข้อนี้ก็ยังต้องแก้ เพราะเป็นการยึดบัญชีข้ามคน (แก้อีเมลไปชนของคนอื่น)

### 0.5 บังคับให้ต้องมี JWT_SECRET — `server/src/middleware/auth.middleware.ts:12` + อีก 3 ไฟล์
ค่า fallback ที่ฮาร์ดโค้ดตรงกับค่าใน `.env.example` = ปลอม token เป็น SUPER_ADMIN ได้ถ้าลืมตั้ง env

- สร้าง `server/src/config/env.ts` ที่ทำ fail-fast: ไม่มี `JWT_SECRET` หรือสั้นกว่า 32 ตัวอักษร → `process.exit(1)` ตอนบูต
- ให้ `auth.middleware.ts`, `auth.routes.ts:10`, `store.routes.ts:7`, `chat.routes.ts:8` import จากที่เดียวกัน ห้ามมี `|| 'ค่า default'` เหลืออยู่
- **หลัง deploy: หมุน (rotate) JWT_SECRET ใหม่** เพราะค่าเดิมหลุดอยู่ในประวัติ git → token เก่าทั้งหมดจะถูกยกเลิกไปด้วย ซึ่งเป็นสิ่งที่ต้องการ

### 0.6 หยุดส่ง OTP กลับมาใน response — `auth.routes.ts:44` และ `:64`
- ลบ `otpDemo` ออกจาก response ใน production (คงไว้ได้เฉพาะ `NODE_ENV !== 'production'`)
- แก้ฝั่ง UI ที่พึ่งค่านี้: `src/pages/RegisterPage.tsx:123` และ `:751`

**การตรวจรับ Phase 0:**
- `POST /api/auth/social-login` ด้วยอีเมลแอดมิน → ต้องได้ 404/401 ไม่ใช่ token
- `POST /api/auth/google` ด้วย `{"googleUser":{...}}` เปล่าๆ → ต้องได้ 400
- ล็อกอินด้วยอีเมล whitelist ที่ไม่มีในฐานข้อมูล → ต้องได้ 401 และ**ต้องไม่มีบัญชีใหม่ถูกสร้าง**
- ยิง `PUT /api/user/profile {"email":"admin@..."}` → อีเมลต้องไม่เปลี่ยน
- ลบ `JWT_SECRET` ออกจาก env แล้วสตาร์ตเซิร์ฟเวอร์ → ต้อง exit ทันที ไม่ใช่รันต่อ

---

## Phase 1 — ปิดช่องโหว่ด้านการเงิน ✅ เสร็จแล้ว (2026-08-19)

> ยืนยันด้วยการยิงทดสอบ 13 เคสกับเซิร์ฟเวอร์และฐานข้อมูลจริง (ล้างข้อมูลทดสอบครบแล้ว)
> พบเพิ่มระหว่างทางและแก้ไปด้วย: `/promptpay/create` รับยอดเงินจาก client และไม่ตรวจเจ้าของออเดอร์,
> `/refund` เรียกซ้ำได้ไม่จำกัด (ฟาร์มเหรียญ) และผู้ใช้คนใดก็ได้สั่งคืนเงินออเดอร์ของคนอื่น

### 1.1 บังคับตรวจลายเซ็น payment webhook — `server/src/routes/payment.routes.ts:46`
ตอนนี้ `if (signature)` แปลว่า**ไม่ส่ง header มาเลย = ผ่าน** ใครก็เปลี่ยนออเดอร์เป็น PAID ได้โดยไม่ต้องล็อกอิน

- เปลี่ยนเป็น: ไม่มี signature → 401 ทันที
- ตรวจด้วย `crypto.timingSafeEqual` (กัน timing attack) แทนการเทียบ `!==`
- ลบ fallback secret `'movemall_webhook_secret_2026'` → fail-fast แบบเดียวกับ 0.5
- ใช้ **raw body** ในการคำนวณ HMAC (ต้องตั้ง `express.raw()` เฉพาะ route นี้ — `JSON.stringify(req.body)` ไม่การันตีว่าไบต์ตรงกับที่ provider เซ็นมา)
- เพิ่มตรวจ `amount` ว่าตรงกับ `order.totalAmount` ก่อนเปลี่ยนสถานะ
- กัน replay: ถ้า `paymentTransaction.status` เป็น `successful` อยู่แล้ว ให้ตอบ 200 แล้วจบ ไม่ทำซ้ำ

### 1.2 แก้ `/verify-slip` — `payment.routes.ts:97`
- ตอนนี้ฮาร์ดโค้ด `isValid = true` และไม่เช็กเจ้าของออเดอร์ → ผู้ใช้ใดก็ได้ mark ออเดอร์ใครก็ได้เป็น PAID
- เพิ่มเช็ก `order.userId === req.user.userId`
- ถ้ายังไม่ได้ต่อ SlipOK/EasySlip จริง ให้ **ปิด endpoint นี้ไปก่อน** (503) ดีกว่าปล่อยให้ผ่านตลอด
- ตรวจ `/refund` (`payment.routes.ts:132`) ด้วยเกณฑ์เดียวกัน: ต้องเช็กเจ้าของ + ต้องจำกัดสิทธิ์ให้เฉพาะแอดมินการเงินอนุมัติ

### 1.3 ตรวจยอดเงินฝั่งเซิร์ฟเวอร์ — `server/src/routes/order.routes.ts:24-80`
- **ห้ามรับ `discountAmount` จาก client** — ให้เซิร์ฟเวอร์คำนวณจากคูปอง/voucher ที่ตรวจสอบแล้วเท่านั้น
- **แก้บั๊กหักซ้ำ**: ตอนนี้ `src/pages/CheckoutPage.tsx:93` ส่งทั้ง `coinsUsed` และ `discountAmount: coinDiscount` แล้วเซิร์ฟเวอร์หักทั้งคู่ → ส่วนลดเหรียญถูกหัก 2 เท่า แก้โดยให้เซิร์ฟเวอร์ใช้ `coinsUsed` อย่างเดียว แล้วเอา `discountAmount` ออกจาก payload ฝั่ง frontend
- validate `items[].quantity` ว่าเป็นจำนวนเต็มบวก (`> 0`, มีเพดานเช่น ≤ 999) — ตอนนี้ค่าติดลบทำให้สต็อกเพิ่มและยอดลด
- validate `coinsUsed` ว่าเป็นจำนวนเต็ม ≥ 0 และไม่เกิน subtotal
- เพิ่ม zod schema ให้ทั้ง endpoint (`zod` ติดตั้งอยู่แล้วใน `server/package.json` แต่แทบไม่ได้ใช้)

**การตรวจรับ Phase 1:**
- ยิง webhook แบบไม่มี header → 401 และสถานะออเดอร์ไม่เปลี่ยน
- สั่งซื้อด้วย `discountAmount: 999999` → ยอดต้องเป็นราคาเต็ม
- สั่งซื้อด้วย `quantity: -5` → 400 และสต็อกไม่ขยับ
- ใช้เหรียญ 100 → ยอดต้องลด 100 บาท (ไม่ใช่ 200)

---

## Phase 2 — แยกขอบเขตข้อมูลระหว่างร้าน (Tenant Isolation) ✅ เสร็จแล้ว (2026-08-19)

> ยืนยันด้วยการยิงทดสอบ 14 เคส (T14–T27) ด้วยผู้ขาย 2 รายคนละร้าน — ล้างข้อมูลทดสอบครบแล้ว
> พบเพิ่มระหว่างทางและแก้ไปด้วย:
> - `ThaiBulkSmsService.verifyOtp` มีรหัสลัด `123456` ที่ผ่านเสมอทุก environment → ใช้ล็อกอิน
>   ผ่าน `/api/auth/login-otp` เป็นเจ้าของเบอร์ใดก็ได้ (ระดับวิกฤต ควรอยู่ Phase 0)
> - `/api/v1/open/products/sync` เขียนราคา/สต็อกของสินค้าใดก็ได้ลง DB จริง โดยเข้าถึงได้แบบไม่ยืนยันตัวตน
> - `POST /api/products` ยัดสินค้าเข้าร้านคนอื่นได้ (หรือ fallback ไปร้านแรกในระบบ)
> - ฟีเจอร์แจ้งร้านค้าปลอมพังอยู่ — frontend เรียก `/api/reports` ที่ไม่เคยมี route จริง

โครงสร้างข้อมูลรองรับอยู่แล้ว: `Product.storeId → Store.ownerId → User.id`

### 2.0 สร้าง helper กลางก่อน (ทำครั้งเดียว ใช้ได้ทุกจุด)
`server/src/middleware/ownership.middleware.ts` — ฟังก์ชัน `assertStoreOwner(userId, storeId)` และ `assertProductOwner(userId, productId)` ที่ throw 403 ถ้าไม่ใช่เจ้าของ (ยกเว้น role ADMIN/SUPER_ADMIN)

### 2.1 ปิด IDOR สินค้า — `server/src/routes/product.routes.ts:258`, `:295`
เพิ่ม `assertProductOwner` ใน `PUT /:id` และ `DELETE /:id` — ตอนนี้ผู้ใช้ทั่วไปลบสินค้าทั้งเว็บได้

### 2.2 ปิด IDOR ข้อมูลภาษี — `server/src/routes/tax.routes.ts:92`, `:54`
เพิ่ม `assertStoreOwner` ใน `GET/PUT /store/:storeId/settings` (เลขประจำตัวผู้เสียภาษีของร้านคนอื่นอ่านและแก้ได้อยู่ตอนนี้)

### 2.3 ปิดช่อง Partner API — `server/src/routes/openapi.routes.ts:8-27`
- ลบ bypass `?sandbox=true` และ appkey `'sandbox_app_key_demo_2026'` ออกจากโค้ด production
- **คำนวณ HMAC จริง** เทียบกับ `MerchantApiKey.secretHash` (โมเดลมีอยู่แล้วใน schema) — ตอนนี้แค่เช็กว่ามี header
- ผูก `storeId` จาก API key เข้ากับทุก query ใน 10 endpoint นั้น

### 2.4 ใส่ requireRole ที่ตกหล่น — `server/src/routes/admin.routes.ts:790`, `:876`
`POST /reports` และ `POST /compliance/verify` ไม่มี `requireRole` ต่างจากอีก 21 endpoint ในไฟล์เดียวกัน
(หมายเหตุ: `/reports` อาจตั้งใจให้ผู้ใช้ทั่วไปแจ้งเรื่องได้ — ถ้าใช่ ให้ย้ายออกจาก `/api/admin` ไปเป็น `/api/reports` แทน เพื่อไม่ให้สับสน)

### 2.5 จำกัดสิทธิ์ broadcast — `server/src/routes/notification.routes.ts:231`
เพิ่ม `requireRole('SUPER_ADMIN','ADMIN','MARKETING_ADMIN')` — ตอนนี้ผู้ใช้ทั่วไปยิง push ทั้งแพลตฟอร์มได้

### 2.6 ตรวจ OTP จริงตอนยืนยันอีเมล/เบอร์ — `server/src/routes/user.routes.ts:113`, `:172`
รับ `otp` มาแต่ไม่เคยเทียบ แล้วแจก 50 เหรียญทุกครั้ง → ฟาร์มเหรียญได้ไม่จำกัด
- เรียก `ThaiBulkSmsService.verifyOtp()` จริง (มี `otpStore` อยู่แล้วใน `server/src/services/sms.service.ts:11`)
- ให้เหรียญได้ครั้งเดียวต่อบัญชี — เช็กจาก `CoinLedger.source` ก่อนแจก

**การตรวจรับ Phase 2:** สร้างผู้ใช้ 2 คน 2 ร้าน แล้วลองให้ A แก้/ลบสินค้าและข้อมูลภาษีของ B → ต้องได้ 403 ทุกครั้ง

---

## Phase 3 — การป้องกันเชิงโครงสร้าง ✅ เสร็จแล้ว (2026-08-19) — มีข้อยกเว้น 2 ข้อ

> ยืนยันด้วยการทดสอบ T28–T32 กับเซิร์ฟเวอร์จริง
> **ข้อยกเว้นที่ยังไม่ได้ทำ (ต้องตัดสินใจเพิ่ม):**
> 1. **refresh token ใน httpOnly cookie** — ทำไม่ได้ตามที่วางแผนไว้ เพราะ frontend (pages.dev) กับ
>    backend (railway.app) อยู่คนละโดเมน cookie จึงเป็น third-party ที่ Safari/Firefox บล็อกโดยค่าเริ่มต้น
>    ทางเลือก: ย้าย API ไปอยู่ subdomain เดียวกับ frontend (เช่น api.movemall.com) แล้วค่อยทำ cookie
> 2. **อายุ access token ยังเป็น 7 วัน** — ลดลงไม่ได้จนกว่าจะมี refresh flow มิฉะนั้นผู้ใช้จะหลุดทุกชั่วโมง
>    (ตั้งค่าได้แล้วผ่าน `JWT_EXPIRES_IN` และมี `jti` ฝังใน token พร้อมสำหรับการเพิกถอน)
>
> พบเพิ่มระหว่างทางและแก้ไปด้วย:
> - rate limiter รุ่นแรกที่ผมเขียน ทำให้ **ทุก API ตอบ 500 เมื่อ Redis ล่ม** (ทดสอบแล้วเจอจริง) แก้เป็น fallback ไป memory
> - keyGenerator ใช้ `req.ip` ตรง ๆ ทำให้ผู้ใช้ IPv6 เลี่ยง limit ได้ แก้เป็นใช้ `ipKeyGenerator` (นับเป็นบล็อก /64)
> - ถอด `sharp`, `bullmq`, `@socket.io/redis-adapter` ที่ไม่ถูก import ที่ไหนเลย ออกไป — ปิดช่องโหว่ high 4 รายการ

### 3.1 Rate limiting (ตอนนี้ไม่มีเลยทั้งระบบ)
- ติดตั้ง `express-rate-limit` + `rate-limit-redis` (Redis มีอยู่แล้วที่ `server/src/config/redis.ts`)
- เข้มเป็นพิเศษที่: `/api/auth/login` (เช่น 5 ครั้ง/15 นาที ต่อ IP+บัญชี), `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/payment/*`
- ตั้ง `app.set('trust proxy', 1)` ให้ถูกต้อง มิฉะนั้นจะนับ IP ผิดเมื่ออยู่หลัง nginx/Cloudflare

### 3.2 ปิด CORS ให้แคบลง — `server/src/app.ts:34`
ลบ `return callback(null, true)` บรรทัดสุดท้ายที่ทำให้ allowlist ด้านบนไม่มีผล → ให้ origin ที่ไม่อยู่ในลิสต์ถูกปฏิเสธ
(เงื่อนไข `origin.includes('movemall')` ก็หลวมเกินไป — `movemall.evil.com` ผ่านได้ ควรใช้การเทียบ hostname แบบตรงตัว)

### 3.3 อายุ token และการเพิกถอน
- ลด access token จาก 7 วัน เหลือ 15-60 นาที + เพิ่ม refresh token
- เก็บ refresh token ใน `httpOnly` cookie แทน localStorage (ปัจจุบัน token อยู่ใน localStorage ที่ `src/utils/api.ts:18` = XSS ขโมยได้)
- ทำ token revocation list ใน Redis สำหรับกรณีแบน/ออกจากระบบทุกอุปกรณ์

### 3.4 Route guard ฝั่ง frontend
`/admin` และ `/seller` ใน `src/App.tsx` ไม่มีการตรวจ role เลย — เพิ่ม `<ProtectedRoute requiredRole=...>`
(เป็นเรื่อง UX/การป้องกันชั้นนอก ไม่ใช่ security boundary จริง — ของจริงอยู่ที่ API ใน Phase 0-2)

### 3.5 ทำความสะอาดและตั้งค่า
- เปลี่ยนค่าใน `server/.env.example` ให้เป็น placeholder ไม่ใช่รหัสที่ดูเหมือนใช้จริง (`MoveMallSecure2026!`)
- ตรวจว่า secret ทุกตัวบน production ถูกหมุนใหม่หลังจบ Phase 0
- เพิ่ม `npm audit` / dependency scan เข้า CI
- ตั้ง `helmet` ให้ระบุ CSP (ตอนนี้ใช้ค่า default)

---

## สรุปลำดับการลงมือ

| เฟส | สิ่งที่ปิด | ไฟล์หลักที่แตะ | ปล่อย production ได้ไหมถ้ายังไม่ทำ |
|---|---|---|---|
| **0** | ยึดบัญชี / สิทธิ์แอดมิน | `auth.routes.ts`, `auth.middleware.ts`, `user.routes.ts`, `config/env.ts` | ✅ ปิดแล้ว |
| **1** | สั่งของฟรี / ปลอมการชำระเงิน | `payment.routes.ts`, `order.routes.ts`, `CheckoutPage.tsx` | ✅ ปิดแล้ว |
| **2** | เข้าถึงข้อมูลข้ามร้าน | `product.routes.ts`, `tax.routes.ts`, `openapi.routes.ts`, `notification.routes.ts`, `admin.routes.ts`, `ownership.middleware.ts` | ✅ ปิดแล้ว |
| **3** | brute-force, XSS, การตั้งค่า | `app.ts`, `rateLimit.middleware.ts`, `tokenRevocation.service.ts`, `ProtectedRoute.tsx` | ✅ ปิดแล้ว (เว้น cookie/refresh) |

**ข้อควรระวังตอนแก้:** Phase 0 จะทำให้ token ที่ออกไปแล้วทั้งหมดใช้ไม่ได้ (จากการหมุน JWT_SECRET) — ผู้ใช้ทุกคนต้องล็อกอินใหม่ ซึ่งเป็นผลที่ต้องการ ไม่ใช่บั๊ก
