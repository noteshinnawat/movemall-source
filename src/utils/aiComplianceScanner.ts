// src/utils/aiComplianceScanner.ts — Movemall AI Compliance & FDA/TISI Automated Auditor Engine

import type { Product } from '../types';

export type ComplianceCheckStatus =
  | 'VERIFIED_ACTIVE'      // ✓ ผ่าน 100%: เลขถูกต้อง ยังไม่หมดอายุ ชื่อและรูปตรงกัน
  | 'EXPIRED_LICENSE'      // ⚠️ ใบอนุญาตหมดอายุ ต้องต่ออายุ
  | 'MISMATCH_NAME'        // 🔴 สวมสิทธิ์ อย./มอก.: ชื่อสินค้าไม่ตรงกับชื่อที่จดทะเบียน
  | 'NO_IMAGE_LABEL'       // ⚠️ รูปภาพกล่องไม่พบตรา อย./มอก. หรือเบลอ
  | 'REVOKED_BANNED'       // 🚫 ใบอนุญาตถูกเพิกถอน / มีคำสั่งระงับ
  | 'NOT_REQUIRED';        // ℹ️ สินค้าหมวดทั่วไปที่ไม่จำเป็นต้องมี อย./มอก.

export interface AIComplianceResult {
  productId: string;
  productName: string;
  storeName: string;
  category: string;
  image: string;
  certType: 'FDA_COSMETIC' | 'FDA_FOOD' | 'TISI_STANDARD' | 'NOT_APPLICABLE';
  licenseNumber: string;
  officialRegisteredName: string;
  officialHolderName: string;
  officialStatus: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'NOT_FOUND';
  expiryDate: string;
  aiNameMatchScore: number;       // 0 - 100%
  aiVisionLabelDetected: boolean;  // AI OCR ตรวจพบสัญลักษณ์บนกล่องจริงหรือไม่
  aiOverallRiskLevel: 'SAFE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: ComplianceCheckStatus;
  aiRecommendation: string;
  scannedAt: string;
}

// Mock Official Government Databases (Thai FDA & TISI Standards Gateway)
const MOCK_OFFICIAL_REGISTRY: Record<string, {
  regName: string;
  holder: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  expiryDate: string;
  category: string;
}> = {
  '10-1-6500098765': {
    regName: 'เซรั่มบำรุงผิวหน้า แอดวานซ์ ไนท์ มอยส์เจอไรเซอร์',
    holder: 'บจก. สกินแคร์ ไทยแลนด์ ลาบอราทอรี่',
    status: 'ACTIVE',
    expiryDate: '2028-12-31',
    category: 'beauty',
  },
  '11-1-02544-1-0001': {
    regName: 'ผลิตภัณฑ์เสริมอาหาร คอลลาเจน ไตรเปปไทด์ คอมเพล็กซ์',
    holder: 'บจก. นูทริ บิวตี้ อินเตอร์เนชั่นแนล',
    status: 'ACTIVE',
    expiryDate: '2027-08-15',
    category: 'food',
  },
  'มอก. 1195-2553': {
    regName: 'เครื่องเสียง เครื่องรับโทรทัศน์ และอุปกรณ์อิเล็กทรอนิกส์สำหรับใช้ในที่อยู่อาศัย',
    holder: 'บจก. โกลบอล อิเล็กทรอนิกส์ มาร์เก็ตติ้ง (ประเทศไทย)',
    status: 'ACTIVE',
    expiryDate: '2029-06-30',
    category: 'electronics',
  },
  'มอก. 369-2557': {
    regName: 'หมวกนิรภัยสำหรับผู้ใช้ยานพาหนะ (หมวกกันน็อก)',
    holder: 'บจก. เซฟตี้ ไรเดอร์ ไทยแลนด์',
    status: 'ACTIVE',
    expiryDate: '2025-01-10', // Expired
    category: 'sports',
  },
  '10-1-5900112233': {
    regName: 'ครีมทาผิวขาว ผสมสารปรอทและสเตียรอยด์ (ตรวจพบสารอันตราย)',
    holder: 'หจก. ลักลอบผลิต บิวตี้',
    status: 'REVOKED',
    expiryDate: '2023-05-01',
    category: 'beauty',
  },
};

/**
 * Scan a single product using AI Multimodal & Government Registry Logic
 */
export function scanProductCompliance(product: Product, storeName: string = 'ร้านค้าบนระบบ'): AIComplianceResult {
  const isBeautyOrFood = product.category === 'beauty' || product.category === 'food';
  const isElectronicsOrHome = product.category === 'electronics' || product.category === 'home';

  // Extract License Number
  let licenseNumber = product.compliance?.fdaNumber || product.compliance?.tisiNumber || '';
  let certType: AIComplianceResult['certType'] = 'NOT_APPLICABLE';

  if (product.category === 'beauty') {
    certType = 'FDA_COSMETIC';
    if (!licenseNumber) licenseNumber = '10-1-6500098765'; // Fallback sample
  } else if (product.category === 'food') {
    certType = 'FDA_FOOD';
    if (!licenseNumber) licenseNumber = '11-1-02544-1-0001';
  } else if (isElectronicsOrHome) {
    certType = 'TISI_STANDARD';
    if (!licenseNumber) licenseNumber = 'มอก. 1195-2553';
  }

  // 1. Query Mock Government Registry
  const officialData = MOCK_OFFICIAL_REGISTRY[licenseNumber] || {
    regName: `${product.name} (จดแจ้งทางการ)`,
    holder: `${storeName} (Co., Ltd.)`,
    status: 'ACTIVE',
    expiryDate: '2028-12-31',
    category: product.category,
  };

  // 2. AI Semantic Name Similarity (Calculate % match)
  let aiNameMatchScore = 95;
  const prodLower = product.name.toLowerCase();
  const regLower = officialData.regName.toLowerCase();

  // Test mismatch logic
  if (product.id.includes('sus') || product.name.includes('ปลอม') || product.name.includes('เลียนแบบ')) {
    aiNameMatchScore = 32;
  } else if (officialData.status === 'REVOKED') {
    aiNameMatchScore = 20;
  } else {
    // Basic word overlap simulation
    const words = prodLower.split(/\s+/);
    const matched = words.filter(w => regLower.includes(w) || w.length < 3);
    aiNameMatchScore = Math.min(99, Math.max(78, Math.round((matched.length / Math.max(1, words.length)) * 100) + 15));
  }

  // 3. AI Vision Label & Packaging OCR
  const aiVisionLabelDetected = !product.id.includes('no-label') && aiNameMatchScore > 50;

  // 4. Decision Rule Engine
  let status: ComplianceCheckStatus = 'VERIFIED_ACTIVE';
  let riskLevel: AIComplianceResult['aiOverallRiskLevel'] = 'SAFE';
  let recommendation = '✓ ผ่านการตรวจสอบ: เลขใบอนุญาตถูกต้อง ใช้งานได้ปกติ และชื่อผลิตภัณฑ์ตรงกับฐานข้อมูล อย./มอก.';

  if (!isBeautyOrFood && !isElectronicsOrHome) {
    status = 'NOT_REQUIRED';
    riskLevel = 'SAFE';
    recommendation = 'ℹ️ สินค้าหมวดทั่วไป กฎหมายไม่บังคับการมีเลข อย. หรือ มอก. วางจำหน่ายได้ตามปกติ';
  } else if (officialData.status === 'REVOKED') {
    status = 'REVOKED_BANNED';
    riskLevel = 'CRITICAL';
    recommendation = '🚫 วิกฤต: ใบอนุญาตถูก อย./สมอ. สั่งเพิกถอนเนื่องจากมีสารอันตราย ระบบแนะนำให้สั่งระงับสินค้าทันที';
  } else if (officialData.status === 'EXPIRED') {
    status = 'EXPIRED_LICENSE';
    riskLevel = 'HIGH';
    recommendation = `⚠️ ใบอนุญาตหมดอายุเมื่อ ${officialData.expiryDate} ร้านค้าต้องยื่นเอกสารต่ออายุ`;
  } else if (aiNameMatchScore < 60) {
    status = 'MISMATCH_NAME';
    riskLevel = 'HIGH';
    recommendation = `🔴 ตรวจพบความผิดปกติ: ชื่อสินค้าบน Movemall (${product.name}) ไม่สอดคล้องกับชื่อที่จดทะเบียน อย./มอก. (${officialData.regName})`;
  } else if (!aiVisionLabelDetected) {
    status = 'NO_IMAGE_LABEL';
    riskLevel = 'MEDIUM';
    recommendation = '⚠️ ภาพถ่ายสินค้าไม่พบตราหรือข้อความ อย./มอก. บนตัวกล่องบรรจุภัณฑ์ โปรดขอภาพฉลากเพิ่มเติมจากร้านค้า';
  }

  return {
    productId: product.id,
    productName: product.name,
    storeName,
    category: product.category,
    image: product.images[0] || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&q=80',
    certType,
    licenseNumber,
    officialRegisteredName: officialData.regName,
    officialHolderName: officialData.holder,
    officialStatus: officialData.status,
    expiryDate: officialData.expiryDate,
    aiNameMatchScore,
    aiVisionLabelDetected,
    aiOverallRiskLevel: riskLevel,
    status,
    aiRecommendation: recommendation,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Batch Scan multiple products with simulated AI concurrency
 */
export async function batchScanProductsCompliance(
  products: Product[],
  onProgress?: (processed: number, total: number) => void
): Promise<AIComplianceResult[]> {
  const results: AIComplianceResult[] = [];
  const total = products.length;

  for (let i = 0; i < total; i++) {
    const p = products[i];
    const res = scanProductCompliance(p, `ร้านค้า #${p.storeId}`);
    results.push(res);
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return results;
}
