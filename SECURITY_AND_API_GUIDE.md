# 🛡️ Movemall — Enterprise Security, Encryption & API Protection Guide

> 📌 **สำหรับทีมพัฒนา Backend, DevOps และผู้เชื่อมต่อ Open API**:
> เอกสารฉบับนี้รวบรวมมาตรฐานความปลอดภัย (Security Standards), นโยบายการเข้ารหัสข้อมูล (Encryption Policy), สถาปัตยกรรม API Protection, และกระบวนการขอ/จัดการ API Key ของ Movemall

---

## 📑 สารบัญ (Table of Contents)
1. [🔐 นโยบายการเข้ารหัสข้อมูล (Data Encryption & Protection)](#1-นโยบายการเข้ารหัสข้อมูล)
2. [🛡️ สถาปัตยกรรมความปลอดภัยของ API (API Security Standards)](#2-สถาปัตยกรรมความปลอดภัยของ-api)
3. [🔑 ระบบ Open API สำหรับร้านค้าและพาร์ทเนอร์ (API Key Management)](#3-ระบบ-open-api-สำหรับร้านค้าและพาร์ทเนอร์)
4. [📋 ขั้นตอนและกระบวนการขอใช้งาน API (API Request & Onboarding Flow)](#4-ขั้นตอนและกระบวนการขอใช้งาน-api)
5. [💻 โค้ดตัวอย่างการตรวจสอบความปลอดภัย (Implementation Code Examples)](#5-โค้ดตัวอย่างการตรวจสอบความปลอดภัย)

---

## 🔐 1. นโยบายการเข้ารหัสข้อมูล

```
  Data in Transit                      Data at Rest
┌──────────────────┐               ┌───────────────────────────────────────┐
│ TLS 1.3 / HTTPS  │ ──(Network)──▶│  • Passwords: Argon2id (Salted)       │
│ HSTS Preload     │               │  • PII (บัตร/บัญชี): AES-256-GCM (KMS) │
│ Cert Pinning     │               │  • API Keys: SHA-256 Hashed in DB     │
└──────────────────┘               └───────────────────────────────────────┘
```

### 1.1 Data in Transit (ระหว่างการรับ-ส่ง)
- **บังคับใช้ TLS 1.3 / HTTPS 100%**: ปิด Cipher Suite เก่าและยกเลิก TLS 1.0, 1.1 ทั้งหมด
- **HTTP Strict Transport Security (HSTS)**:
  ```http
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  ```
- **Perfect Forward Secrecy (PFS)**: กุญแจ Session ถูกสร้างใหม่เสมอ ป้องกันการดักฟังย้อนหลัง

### 1.2 Data at Rest (ข้อมูลที่บันทึกลงดิสก์/ฐานข้อมูล)
- **รหัสผ่าน (Passwords)**: ใช้ `Argon2id` (หรือ `Bcrypt` Cost $\ge 12$) + Random Salt ห้ามเก็บ Plaintext เด็ดขาด
- **ข้อมูลส่วนบุคคลที่มีความอ่อนไหว (PII)**: เลขบัตรประชาชน, เลขบัญชีธนาคาร, ข้อมูลบัตรเครดิต
  - เข้ารหัสระดับคอลัมน์ด้วย **AES-256-GCM** (Envelope Encryption ผ่าน AWS KMS / Google Cloud KMS)
  - ทำ **Data Masking** ในระดับ API Response และ Frontend Display (เช่น `081-xxx-9999`)
- **การจัดเก็บ Secrets & Environment Variables**:
  - ห้าม Commit `.env` หรือ Private Key ลงใน Git
  - ใช้ Secret Manager (AWS Secrets Manager, GCP Secret Manager หรือ HashiCorp Vault)

---

## 🛡️ 2. สถาปัตยกรรมความปลอดภัยของ API

### 2.1 Authentication & Authorization Matrix
| กลุ่มผู้ใช้ | รูปแบบ Auth | อายุ Token | วิธีจัดเก็บ |
|---|---|---|---|
| **ผู้ซื้อ / ผู้ขายทั่วไป (App & Web)** | JWT (RS256) | Access: 15 นาที<br>Refresh: 30 วัน | Access Token ใน Memory<br>Refresh Token ใน `HttpOnly, Secure Cookie` |
| **Open API (ERP / Partner Server)** | API Key + API Secret | กำหนดวันหมดอายุได้ | เก็บเฉพาะ `SHA-256 Hash` ในฐานข้อมูล |
| **Payment & Logistics Webhooks** | HMAC-SHA256 Signature | มีผลใน 5 นาที | ตรวจสอบผ่าน Header `X-Movemall-Signature` |

### 2.2 การป้องกันการโจมตีและการควบคุมทราฟฟิก (Traffic Controls)
1. **Rate Limiting (Redis Sliding Window)**:
   - สมาชิกทั่วไป: `120 requests/นาที`
   - จุดเสี่ยงสูง (Login, OTP, Payment): `5 requests/นาที`
   - Open API Tier: `1,000 - 5,000 requests/นาที` (ขึ้นกับแพ็กเกจร้านค้า)
2. **Idempotency Keys (ป้องกันการสั่งซื้อ/ตัดเงินซ้ำ)**:
   - Request ที่มีผลต่อยอดเงิน (`POST /v1/checkout`, `POST /v1/orders`) ต้องแนบ Header:
     ```http
     Idempotency-Key: 7b56d3c9-94d8-4a6f-b2e1-88f5c9e2b10a
     ```
   - เซิร์ฟเวอร์จะแคชผลลัพธ์ไว้ใน Redis เป็นเวลา 24 ชั่วโมง หากมีคำขอซ้ำ Key เดิม จะส่งผลลัพธ์เดิมกลับทันทีโดยไม่ประมวลผลซ้ำ
3. **Webhook Security & Replay Attack Defense**:
   - Webhook ทุกตัวต้องมี Signature ตรวจสอบผ่าน `X-Movemall-Signature` และ `X-Movemall-Timestamp`
   - ปฏิเสธ Request ที่มี Timestamp ต่างจากเวลาปัจจุบันเกิน 300 วินาที (5 นาที)

---

## 🔑 3. ระบบ Open API สำหรับร้านค้าและพาร์ทเนอร์

### 3.1 รูปแบบและ Prefix ของ API Key
- **Production Key**: `mov_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Sandbox/Test Key**: `mov_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3.2 กฎการรักษาความปลอดภัยของกุญแจ (Key Security Rules)
1. **One-Time Secret Reveal**: กุญแจ Secret Key จะถูกเปิดเผยให้ร้านค้าเห็นเพียงครั้งเดียวตอนสร้างเท่านั้น
2. **Database Hashing**: ฐานข้อมูลจะจัดเก็บเฉพาะ `SHA-256(apiKey)` เท่านั้น จะไม่มีการเก็บ Key ดั้งเดิมใน DB
3. **IP Whitelisting**: ร้านค้าสามารถระบุ IP Addresses ของเครื่องเซิร์ฟเวอร์ที่อนุญาตให้เรียก API ได้ หาก Request มาจาก IP อื่นจะถูกปฏิเสธด้วย `403 Forbidden`
4. **Fine-Grained Scopes**: กำหนดสิทธิ์แบบ Least Privilege เช่น:
   - `products:read` / `products:write`
   - `inventory:sync`
   - `orders:read` / `orders:dispatch`
   - `finance:reports`

---

## 📋 4. ขั้นตอนและกระบวนการขอใช้งาน API

```
+-----------------------------------------------------------------------------------+
| 1. สมัครขอสิทธิ์ Open API ใน Seller Centre (ระบุวัตถุประสงค์ & ซอฟต์แวร์ ERP)      |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| 2. ยืนยันตัวตน KYC / เอกสารนิติบุคคล & ระบุ Server IP Whitelist                   |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| 3. รับ Sandbox Key (`mov_test_...`) เพื่อทดสอบระบบในสภาพแวดล้อมจำลอง (Testnet)     |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| 4. ยื่นขอเปิด Production Key (`mov_live_...`) และบันทึก Secret ทันที              |
+-----------------------------------------------------------------------------------+
```

---

## 💻 5. โค้ดตัวอย่างการตรวจสอบความปลอดภัย

### 5.1 การตรวจสอบ HMAC Webhook Signature (Node.js/TypeScript)
```typescript
import crypto from 'crypto';

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  timestampHeader: string,
  webhookSecret: string
): boolean {
  // 1. ป้องกัน Replay Attack (ตรวจสอบเวลาไม่เกิน 5 นาที)
  const currentTime = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestampHeader, 10);
  if (Math.abs(currentTime - requestTime) > 300) {
    return false; // หมดอายุหรือถูกดักส่งซ้ำ
  }

  // 2. คำนวณ HMAC-SHA256
  const payloadToSign = `${timestampHeader}.${rawBody}`;
  const computedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payloadToSign)
    .digest('hex');

  // 3. เปรียบเทียบแบบ Timing-Safe ป้องกัน Timing Attacks
  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(computedSignature)
  );
}
```

### 5.2 การ Hash API Key ก่อนบันทึกลง Database
```typescript
import crypto from 'crypto';

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}
```
