# 🎨 Movemall Design System & CSS Guide

ยินดีต้อนรับสู่ระบบ CSS และ Design System ของ **Movemall** โครงสร้างนี้ถูกออกแบบตามแนวคิด **Modular & Utility-First Architecture** เพื่อให้เรียกใช้ง่าย สวยงาม สะอาดตา และไม่เขียนโค้ดซ้ำซ้อน

---

## 📁 โครงสร้างไฟล์ (File Structure)

```
src/styles/
├── variables.css      # 🎨 Design Tokens (สี, Spacing, Shadows, Z-index)
├── base.css           # 🌐 CSS Resets, Typography defaults, Custom Scrollbars
├── utilities.css      # ⚡ Utility Classes (Flex, Grid, Spacing, Typography, Display)
├── components.css     # 🧩 Component UI Classes (Buttons, Badges, Cards, Forms, Modals)
├── animations.css     # ✨ Keyframes & Animation utilities
└── README.md          # 📖 คู่มือ Cheatsheet อ้างอิงฉบับนี้
```

---

## 📐 กฎการออกแบบหลัก (Core Design Principles)

1. **Strict 0px Border-Radius**: ทุกปุ่ม การ์ด แบดจ์ อินพุต หรือไดอะล็อก จะต้องมีขอบเหลี่ยมตรง (`border-radius: 0px`) เสมอ
2. **Flat Clean Light Theme**: พื้นหลังสะอาดตา สบายตา ลายเส้นชัดเจน
3. **No Tailwind CSS**: ใช้ Vanilla CSS Class ส่วนกลางเหล่านี้เท่านั้น

---

## 🛠️ คู่มือการเรียกใช้คลาส (Class Cheatsheet)

### 1. ปุ่ม (Buttons — `.btn`)

| คลาส | ตัวอย่างการใช้งาน | คำอธิบาย |
|---|---|---|
| `.btn.btn-primary` | `<button className="btn btn-primary">ยืนยัน</button>` | ปุ่มสีน้ำเงินหลักของแบรนด์ |
| `.btn.btn-accent` | `<button className="btn btn-accent">ซื้อเลย</button>` | ปุ่มสีส้มสดสำหรับ CTA/สั่งซื้อด่วน |
| `.btn.btn-secondary` | `<button className="btn btn-secondary">ยกเลิก</button>` | ปุ่มพื้นขาวขอบเทา |
| `.btn.btn-outline` | `<button className="btn btn-outline">ดูข้อมูล</button>` | ปุ่มขอบน้ำเงินโปร่งใส |
| `.btn.btn-danger` | `<button className="btn btn-danger">ลบ</button>` | ปุ่มสีแดงแจ้งเตือน/ลบ |
| `.btn.btn-sm` / `.btn-lg` | `<button className="btn btn-primary btn-sm">เล็ก</button>` | ขนาดปุ่ม (xs, sm, md, lg) |
| `.btn.btn-block` | `<button className="btn btn-primary btn-block">เต็มแถว</button>` | ขยายเต็มความกว้าง 100% |

### 2. ป้ายกำกับ (Badges — `.badge`)

| คลาส | ตัวอย่างการใช้งาน | คำอธิบาย |
|---|---|---|
| `.badge.badge-mall` | `<span className="badge badge-mall">MALL</span>` | ป้ายแบรนด์ทางการสีแดง |
| `.badge.badge-live` | `<span className="badge badge-live">🔴 LIVE</span>` | ป้ายไลฟ์สดพร้อมแสงกะพริบ |
| `.badge.badge-discount` | `<span className="badge badge-discount">-50%</span>` | ป้ายส่วนลดสีแดงอ่อน |
| `.badge.badge-primary` | `<span className="badge badge-primary">ใหม่</span>` | ป้ายสถานะสีน้ำเงิน |
| `.badge.badge-success` | `<span className="badge badge-success">พร้อมส่ง</span>` | ป้ายสถานะสีเขียว |

### 3. การจัดวางเลย์เอาต์ (Flex & Grid Utilities)

| คลาส | คำอธิบาย |
|---|---|
| `.flex`, `.flex-col`, `.flex-wrap` | สร้าง Flexbox แนวนอน / แนวตั้ง / หลายบรรทัด |
| `.flex-center` | จัดกึ่งกลางทั้งแนวตั้งและแนวนอน (`items-center justify-center`) |
| `.items-center`, `.items-start` | จัดแนวตั้ง (`align-items`) |
| `.justify-between`, `.justify-center` | จัดแนวนอน (`justify-content`) |
| `.gap-1` ถึง `.gap-8` | ระยะห่างระหว่างไอเทม (4px, 8px, 12px, 16px, 20px, 24px, 32px) |
| `.grid-2`, `.grid-3`, `.grid-4` | แสดงผลเป็นตาราง Grid 2, 3, 4 คอลัมน์เท่าๆ กัน |
| `.grid-auto-fit` | Grid ที่ปรับจำนวนคอลัมน์อัตโนมัติตามขนาดหน้าจอ |

### 4. การ์ดและกล่องข้อมูล (Cards — `.card`)

```tsx
<div className="card card-hover">
  <div className="card-header">หัวข้อการ์ด</div>
  <div className="card-body">เนื้อหาภายในการ์ด</div>
  <div className="card-footer">ส่วนท้ายการ์ด</div>
</div>
```

### 5. กล่องป้อนข้อมูล (Forms — `.form-*`)

```tsx
<div className="form-group">
  <label className="form-label">ชื่อผู้รับ</label>
  <input type="text" className="form-input" placeholder="กรอกชื่อ-นามสกุล" />
  <span className="form-helper-text">กรุณากรอกตามบัตรประชาชน</span>
</div>
```

### 6. ตัวหนังสือและสี (Typography & Text)

| คลาส | คำอธิบาย |
|---|---|
| `.text-xs`, `.text-sm`, `.text-base`, `.text-lg`, `.text-xl`, `.text-2xl` | ขนาดตัวอักษรตั้งแต่ 11px ถึง 24px |
| `.font-medium`, `.font-semibold`, `.font-bold` | ความหนาตัวอักษร 500, 600, 700 |
| `.text-primary`, `.text-secondary`, `.text-muted` | สีตัวอักษรตาม Design Tokens |
| `.text-danger`, `.text-success`, `.text-warning` | สีข้อความสถานะ |
| `.truncate` | ตัดคำยาวเกินให้เป็นจุดไข่ปลา `...` ใน 1 บรรทัด |
| `.line-clamp-2` | ตัดคำยาวเกินให้แสดงไม่เกิน 2 บรรทัด |

---

## 💡 ตัวอย่างการนำไปใช้จริงใน Component (.tsx)

```tsx
import React from 'react';

export function ProductSummary({ title, price, originalPrice, discount, onBuy }) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      {/* Header with badges */}
      <div className="flex items-center justify-between">
        <span className="badge badge-mall">MALL</span>
        <span className="badge badge-discount">-{discount}%</span>
      </div>

      {/* Title with truncation */}
      <h3 className="text-md font-bold line-clamp-2">{title}</h3>

      {/* Prices */}
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-danger">฿{price.toLocaleString()}</span>
        <span className="text-sm text-muted line-through">฿{originalPrice.toLocaleString()}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-2">
        <button className="btn btn-secondary flex-1">ใส่ตะกร้า</button>
        <button className="btn btn-accent flex-1" onClick={onBuy}>ซื้อตอนนี้</button>
      </div>
    </div>
  );
}
```
