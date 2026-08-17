// src/data/reviews.ts — Mock Customer Reviews

export interface ProductReview {
  id: string;
  productId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  images?: string[];
  video?: string;
  verified: boolean;
  helpfulCount: number;
}

export interface StoreReview {
  id: string;
  userName: string;
  userRole: string;
  rating: number;
  comment: string;
  productName: string;
  date: string;
}

export const mockProductReviews: Record<string, ProductReview[]> = {
  p1: [
    {
      id: 'r1',
      productId: 'p1',
      userName: 'กิตติพงษ์ ส.',
      rating: 5,
      date: '14 ส.ค. 2026',
      title: 'เสียงดีมาก คุ้มราคาที่สุด',
      comment: 'ระบบตัดเสียงรบกวน ANC ทำงานได้ดีเกินคาด แบตเตอรี่อึดมาก ใช้งานทั้งวันไม่ต้องชาร์จเลย แนะนำมากๆ ครับ',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80',
      ],
      video: '/videos/live-streamer-1.mp4',
      verified: true,
      helpfulCount: 24,
    },
    {
      id: 'r2',
      productId: 'p1',
      userName: 'นภัสสร ด.',
      rating: 5,
      date: '10 ส.ค. 2026',
      title: 'จัดส่งเร็ว แพ็กเกจแน่นหนา',
      comment: 'สั่งเมื่อวาน วันนี้ของถึงแล้ว หูฟังน้ำหนักเบา ใส่สบายไม่เจ็บหู เบสแน่นสะใจ',
      images: [
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80',
      ],
      verified: true,
      helpfulCount: 12,
    },
    {
      id: 'r3',
      productId: 'p1',
      userName: 'ธนวัฒน์ พ.',
      rating: 4,
      date: '02 ส.ค. 2026',
      title: 'โดยรวมดี คุ้มค่า',
      comment: 'ไมโครโฟนตอนคุยโทรศัพท์ชัดเจนดีมาก การเชื่อมต่อ Bluetooth ไวและเสถียรครับ',
      verified: true,
      helpfulCount: 5,
    },
  ],
  p2: [
    {
      id: 'r4',
      productId: 'p2',
      userName: 'อรทัย ว.',
      rating: 5,
      date: '15 ส.ค. 2026',
      title: 'หน้าจอสวย คมชัด ฟังก์ชันครบ',
      comment: 'ใช้วัดการออกกำลังกายและอัตราการเต้นหัวใจแม่นยำมาก แบตอยู่ได้หลายวัน ดีไซน์พรีเมียม',
      verified: true,
      helpfulCount: 19,
    },
    {
      id: 'r5',
      productId: 'p2',
      userName: 'ชัชวาล ร.',
      rating: 5,
      date: '08 ส.ค. 2026',
      title: 'GPS แม่นยำ กันน้ำจริง',
      comment: 'ใส่ว่ายน้ำและวิ่งเทรล สัญญาณ GPS จับเร็วมาก ประทับใจสุดๆ',
      verified: true,
      helpfulCount: 8,
    },
  ],
  p6: [
    {
      id: 'r6',
      productId: 'p6',
      userName: 'พีรภัทร ม.',
      rating: 5,
      date: '12 ส.ค. 2026',
      title: 'นุ่ม เด้ง สบายเท้ามาก',
      comment: 'ใส่วิ่ง 10km ไม่ปวดข้อเท้าเลย ระบายอากาศดีเยี่ยม ขนาดพอดีเป๊ะตามตารางไซส์',
      verified: true,
      helpfulCount: 31,
    },
  ],
};

export const mockStoreReviews: StoreReview[] = [
  {
    id: 'sr1',
    userName: 'คุณสมชาย (กรุงเทพฯ)',
    userRole: 'ลูกค้าประจำ',
    rating: 5,
    comment: 'สั่งของจาก Movemall ประจำเลยครับ สินค้าตรงปกทุกชิ้น ส่งเร็ว แพ็กสินค้ามาอย่างดีมาก บริการประทับใจ',
    productName: 'หูฟังไร้สาย Premium Pro X',
    date: '3 วันที่แล้ว',
  },
  {
    id: 'sr2',
    userName: 'คุณมนัสนันท์ (เชียงใหม่)',
    userRole: 'ลูกค้าที่ยืนยันแล้ว',
    rating: 5,
    comment: 'ชอบที่มีระบบเก็บเงินปลายทางและส่งฟรี มีปัญหาทักแอดมินตอบไวมาก ซื้อของสบายใจค่ะ',
    productName: 'ครีมกันแดด SPF 50+',
    date: '5 วันที่แล้ว',
  },
  {
    id: 'sr3',
    userName: 'คุณวรวิทย์ (ภูเก็ต)',
    userRole: 'ลูกค้าที่ยืนยันแล้ว',
    rating: 5,
    comment: 'สินค้าคุณภาพแท้ 100% ราคาดีกว่าที่อื่นเยอะมาก มีโค้ดส่วนลดให้ตลอด แนะนำเพื่อนๆ มาช้อปกันครับ',
    productName: 'สมาร์ทวอทช์ Series 8 Ultra',
    date: '1 สัปดาห์ที่แล้ว',
  },
];

const GENERIC_REVIEW_TEMPLATES = [
  {
    userName: 'กิตติศักดิ์ พ.',
    rating: 5,
    date: 'เมื่อวานนี้',
    title: 'สินค้าคุณภาพดี คุ้มค่ามาก',
    comment: 'ได้รับของตรงตามปก ใช้งานได้ดีมาก บรรจุหีบห่อเรียบร้อย จัดส่งรวดเร็ว มีกันกระแทกอย่างดี แนะนำเลยครับ',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&q=80'],
    video: '/videos/live-streamer-2.mp4',
    helpfulCount: 28,
  },
  {
    userName: 'ศิริพร ม.',
    rating: 5,
    date: '3 วันที่แล้ว',
    title: 'ส่งไวมาก ของแท้แน่นอน',
    comment: 'ประทับใจการบริการของร้านมาก ตอบแชทไว สินค้าของแท้ 100% เช็คประกันได้ตามปกติ',
    images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&q=80'],
    helpfulCount: 15,
  },
  {
    userName: 'ธีรภัทร ช.',
    rating: 5,
    date: '5 วันที่แล้ว',
    title: 'ดีงามเกินราคา',
    comment: 'วัสดุพรีเมียม งานประกอบแน่นหนา ไม่มีรอยตำหนิ ใช้งานสะดวกมาก คุ้มค่าเงินที่จ่ายไปครับ',
    helpfulCount: 9,
  },
  {
    userName: 'พิมพ์ชนก ร.',
    rating: 5,
    date: '1 สัปดาห์ที่แล้ว',
    title: 'สีสวยถูกใจ ตรงปก',
    comment: 'สีสวยหรูดูแพงมาก ขนาดกำลังดี น้ำหนักเบา ใช้งานง่าย ให้ 5 ดาวไม่หักเลยค่ะ',
    images: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80'],
    helpfulCount: 19,
  },
  {
    userName: 'วรพล ท.',
    rating: 4,
    date: '1 สัปดาห์ที่แล้ว',
    title: 'โดยรวมดีมาก ใช้งานราบรื่น',
    comment: 'คุณภาพสินค้าดีมาก หัก 1 ดาวเรื่องขนส่งมาช้ากว่ากำหนดไป 1 วัน แต่สินค้าด้านในปลอดภัยดีครับ',
    helpfulCount: 7,
  },
  {
    userName: 'สุชาดา น.',
    rating: 5,
    date: '2 สัปดาห์ที่แล้ว',
    title: 'ซื้อซ้ำรอบที่สองแล้ว',
    comment: 'ใช้ดีจนต้องสั่งเพิ่มให้คุณแม่ แนะนำร้านนี้เลย ของแท้ราคาดี มีโค้ดส่งฟรีด้วย',
    images: ['https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500&q=80'],
    helpfulCount: 12,
  },
  {
    userName: 'อรรถพล ก.',
    rating: 4,
    date: '2 สัปดาห์ที่แล้ว',
    title: 'คุ้มราคา ฟังก์ชันครบ',
    comment: 'เทียบกับรุ่นอื่นในเรทราคานี้ ถือว่าตัวนี้ทำได้ดีกว่าเยอะ ใช้งานลื่นไหลไม่มีสะดุด',
    helpfulCount: 4,
  },
  {
    userName: 'ณัฐนันท์ จ.',
    rating: 5,
    date: '3 สัปดาห์ที่แล้ว',
    title: 'แพ็กมาแน่นหนา สินค้าไม่มีรอย',
    comment: 'ห่อบับเบิ้ลมาหนามาก กล่องไม่บุบเลย ของใหม่แกะกล่อง ประกันศูนย์เต็ม',
    images: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&q=80'],
    helpfulCount: 8,
  },
  {
    userName: 'ชลธิชา ส.',
    rating: 3,
    date: '3 สัปดาห์ที่แล้ว',
    title: 'พอใช้ได้ตามราคา',
    comment: 'ตัวสินค้าใช้งานได้ปกติตามมาตรฐาน ไม่ได้ว้าวมาก แต่สมเหตุสมผลกับราคาที่จ่ายครับ',
    helpfulCount: 3,
  },
  {
    userName: 'ภาณุเดช ว.',
    rating: 5,
    date: '1 เดือนที่แล้ว',
    title: 'ยอดเยี่ยมมากครับ',
    comment: 'ได้รับของเร็ว ใช้งานได้ตามสเปกทุกอย่าง ตอบโจทย์การใช้งานประจำวันมาก',
    helpfulCount: 6,
  },
  {
    userName: 'กมลชนก ป.',
    rating: 4,
    date: '1 เดือนที่แล้ว',
    title: 'สวยงาม ใช้งานง่าย',
    comment: 'คู่มืออ่านเข้าใจง่าย เซ็ตอัปไม่ถึง 5 นาทีก็พร้อมใช้ สวยงามเรียบหรู',
    images: ['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80'],
    helpfulCount: 5,
  },
  {
    userName: 'ประวิทย์ ศ.',
    rating: 2,
    date: '1 เดือนที่แล้ว',
    title: 'กล่องยับไปนิดนึง',
    comment: 'กล่องพัสดุภายนอกมีรอยบุบจากการขนส่ง แต่ตัวสินค้าด้านในไม่เสียหาย ใช้งานได้ปกติครับ',
    helpfulCount: 2,
  },
  {
    userName: 'อนุชา ข.',
    rating: 5,
    date: '2 เดือนที่แล้ว',
    title: '10/10 ไม่หัก',
    comment: 'ดีจริงตามรีวิว แนะนำให้กดซื้อช่วงมีคูปองลดราคา คุ้มค่าที่สุด',
    helpfulCount: 14,
  },
  {
    userName: 'ธิดารัตน์ บ.',
    rating: 1,
    date: '2 เดือนที่แล้ว',
    title: 'สั่งผิดสี',
    comment: 'กดสั่งผิดสีเอง ร้านค้าช่วยดำเนินการเปลี่ยนให้รวดเร็วมาก บริการหลังการขายดีเยี่ยม',
    helpfulCount: 1,
  },
];

export function getProductReviews(productId: string): ProductReview[] {
  const specific = mockProductReviews[productId];
  if (specific && specific.length >= 8) return specific;

  const base = specific || [];
  const baseIds = new Set(base.map(r => r.id));

  const generated = GENERIC_REVIEW_TEMPLATES.map((tmpl, idx) => ({
    id: `rev-${productId}-${idx}`,
    productId,
    userName: tmpl.userName,
    rating: tmpl.rating,
    date: tmpl.date,
    title: tmpl.title,
    comment: tmpl.comment,
    images: tmpl.images,
    video: tmpl.video,
    verified: true,
    helpfulCount: tmpl.helpfulCount,
  })).filter(r => !baseIds.has(r.id));

  return [...base, ...generated];
}

