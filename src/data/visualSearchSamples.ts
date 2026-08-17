// src/data/visualSearchSamples.ts
// Demo images and metadata for Visual Search (Movemall AI Lens)

export interface VisualSample {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  dominantColors: string[];
  detectedObjects: {
    id: string;
    label: string;
    category: string;
    confidence: number;
    box: { top: number; left: number; width: number; height: number }; // Percentage (%)
    suggestedKeywords: string[];
  }[];
}

export const VISUAL_SEARCH_SAMPLES: VisualSample[] = [
  {
    id: 'sample-sneakers',
    title: 'รองเท้าผ้าใบสปอร์ต (Nike Sneaker)',
    category: 'sports',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    dominantColors: ['#DC2626', '#111827', '#FFFFFF'],
    detectedObjects: [
      {
        id: 'obj-1',
        label: 'รองเท้าวิ่ง / สปอร์ตสนีกเกอร์',
        category: 'sports',
        confidence: 0.98,
        box: { top: 20, left: 15, width: 70, height: 60 },
        suggestedKeywords: ['Nike', 'รองเท้าผ้าใบ', 'Air Max', 'รองเท้าวิ่ง', 'สีแดง'],
      },
      {
        id: 'obj-2',
        label: 'เชือกรองเท้า & โลโก้แบรนด์',
        category: 'fashion',
        confidence: 0.91,
        box: { top: 35, left: 35, width: 30, height: 25 },
        suggestedKeywords: ['อุปกรณ์กีฬา', 'เชือกรองเท้า', 'สปอร์ต'],
      },
    ],
  },
  {
    id: 'sample-headphones',
    title: 'หูฟังไร้สายครอบหู (Sony Headphones)',
    category: 'electronics',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    dominantColors: ['#1F2937', '#D97706', '#E5E7EB'],
    detectedObjects: [
      {
        id: 'obj-1',
        label: 'หูฟังไร้สาย Over-Ear / ตัดเสียงรบกวน',
        category: 'electronics',
        confidence: 0.99,
        box: { top: 15, left: 20, width: 60, height: 70 },
        suggestedKeywords: ['Sony', 'หูฟัง', 'Bluetooth', 'Noise Cancelling', 'WH-1000XM5'],
      },
    ],
  },
  {
    id: 'sample-smartwatch',
    title: 'สมาร์ทวอทช์ & นาฬิกาสุขภาพ (Apple Watch)',
    category: 'electronics',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    dominantColors: ['#FFFFFF', '#D1D5DB', '#111827'],
    detectedObjects: [
      {
        id: 'obj-1',
        label: 'สมาร์ทวอทช์ / นาฬิกาข้อมือ',
        category: 'electronics',
        confidence: 0.97,
        box: { top: 22, left: 28, width: 44, height: 56 },
        suggestedKeywords: ['Smart Watch', 'Apple Watch', 'นาฬิกาอัจฉริยะ', 'วัดชีพจร'],
      },
    ],
  },
  {
    id: 'sample-keyboard',
    title: 'คีย์บอร์ดเกมมิ่ง (Mechanical Keyboard)',
    category: 'electronics',
    thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
    dominantColors: ['#1E1B4B', '#3B82F6', '#6366F1'],
    detectedObjects: [
      {
        id: 'obj-1',
        label: 'แมคคานิคอลคีย์บอร์ด RGB',
        category: 'electronics',
        confidence: 0.96,
        box: { top: 18, left: 10, width: 80, height: 64 },
        suggestedKeywords: ['Mechanical Keyboard', 'RGB', 'Gaming', 'ไร้สาย', 'คีย์บอร์ด'],
      },
    ],
  },
  {
    id: 'sample-skincare',
    title: 'เซรั่มบำรุงผิว & สกินแคร์ (Beauty Serum)',
    category: 'beauty',
    thumbnail: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80',
    dominantColors: ['#F3E8FF', '#A855F7', '#FFFFFF'],
    detectedObjects: [
      {
        id: 'obj-1',
        label: 'เซรั่มบำรุงผิวหน้า / ดรอปเปอร์',
        category: 'beauty',
        confidence: 0.95,
        box: { top: 15, left: 30, width: 40, height: 70 },
        suggestedKeywords: ['เซรั่ม', 'สกินแคร์', 'หน้าใส', 'Moisturizer', 'บำรุงผิว'],
      },
    ],
  },
  {
    id: 'sample-backpack',
    title: 'กระเป๋าเป้สะพายหลัง (Travel Backpack)',
    category: 'fashion',
    thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    dominantColors: ['#78350F', '#D97706', '#1F2937'],
    detectedObjects: [
      {
        id: 'obj-1',
        label: 'กระเป๋าเป้เดินทาง / แล็ปท็อป',
        category: 'fashion',
        confidence: 0.94,
        box: { top: 12, left: 22, width: 56, height: 76 },
        suggestedKeywords: ['กระเป๋าเป้', 'Backpack', 'กันน้ำ', 'ใส่โน้ตบุ๊ก', 'แฟชั่น'],
      },
    ],
  },
];
