import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Movemall Database Seeding to Supabase...');

  // 1. Create Default Users (Password: movemall1234)
  const passwordHash = await bcrypt.hash('movemall1234', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@movemall.com' },
    update: {},
    create: {
      email: 'admin@movemall.com',
      phone: '0810000001',
      passwordHash,
      name: 'Movemall Administrator',
      role: 'ADMIN',
      coinsBalance: 5000,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    },
  });

  const sellerUser1 = await prisma.user.upsert({
    where: { email: 'techpro@seller.movemall.com' },
    update: {},
    create: {
      email: 'techpro@seller.movemall.com',
      phone: '0810000002',
      passwordHash,
      name: 'TechPro Official Admin',
      role: 'SELLER',
      coinsBalance: 1200,
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80',
    },
  });

  const sellerUser2 = await prisma.user.upsert({
    where: { email: 'fashion@seller.movemall.com' },
    update: {},
    create: {
      email: 'fashion@seller.movemall.com',
      phone: '0810000003',
      passwordHash,
      name: 'Fashionista Studio Admin',
      role: 'SELLER',
      coinsBalance: 800,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    },
  });

  const demoBuyer = await prisma.user.upsert({
    where: { email: 'buyer@demo.com' },
    update: {},
    create: {
      email: 'buyer@demo.com',
      phone: '0899999999',
      passwordHash,
      name: 'สมชาย นักช้อป',
      role: 'BUYER',
      coinsBalance: 250,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    },
  });

  // 2. Create Stores
  const techStore = await prisma.store.upsert({
    where: { id: 'store-techpro' },
    update: {},
    create: {
      id: 'store-techpro',
      ownerId: sellerUser1.id,
      name: 'TechPro Official Store',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80',
      banner: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
      isMall: true,
      isVerified: true,
      rating: 4.9,
      followers: 58200,
      description: 'ตัวแทนจำหน่ายอุปกรณ์ไอทีและอิเล็กทรอนิกส์ของแท้ 100% ประกันศูนย์ไทย',
    },
  });

  const fashionStore = await prisma.store.upsert({
    where: { id: 'store-fashionista' },
    update: {},
    create: {
      id: 'store-fashionista',
      ownerId: sellerUser2.id,
      name: 'Fashionista Studio',
      logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      banner: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
      isMall: false,
      isVerified: true,
      rating: 4.8,
      followers: 24500,
      description: 'เสื้อผ้าและแฟชั่นมินิมอล ใส่สบาย ดีไซน์นำสมัย คุณภาพเกรดพรีเมียม',
    },
  });

  const beautyStore = await prisma.store.upsert({
    where: { id: 'store-beautyglow' },
    update: {},
    create: {
      id: 'store-beautyglow',
      ownerId: sellerUser1.id,
      name: 'BeautyGlow Official',
      logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&q=80',
      banner: 'linear-gradient(135deg, #9D174D 0%, #F43F5E 100%)',
      isMall: true,
      isVerified: true,
      rating: 4.9,
      followers: 89000,
      description: 'สกินแคร์และเครื่องสำอางชั้นนำ นำเข้าจากเกาหลีและญี่ปุ่น ของแท้ 100%',
    },
  });

  const sportStore = await prisma.store.upsert({
    where: { id: 'store-sportmax' },
    update: {},
    create: {
      id: 'store-sportmax',
      ownerId: sellerUser2.id,
      name: 'SportMax Thailand',
      logo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&q=80',
      banner: 'linear-gradient(135deg, #C2410C 0%, #F97316 100%)',
      isMall: false,
      isVerified: true,
      rating: 4.7,
      followers: 15300,
      description: 'อุปกรณ์กีฬาและรองเท้าวิ่ง รองเท้าออกกำลังกายแบรนด์แท้',
    },
  });

  // 3. Create Sample Products
  const sampleProducts = [
    {
      id: 'el-1',
      storeId: techStore.id,
      name: 'หูฟังไร้สาย Pro ANC ตัดเสียงรบกวน Bluetooth 5.3',
      price: 1290,
      originalPrice: 2490,
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'],
      category: 'electronics',
      brand: 'Apple',
      rating: 4.9,
      stock: 50,
      salesCount: 1840,
      description: 'หูฟังไร้สายคุณภาพระดับพรีเมียม ตัดเสียงรบกวน Active Noise Cancelling แบตเตอรี่ใช้งานได้ 30 ชั่วโมง',
      badge: 'sale',
    },
    {
      id: 'el-2',
      storeId: techStore.id,
      name: 'สมาร์ทวอทช์ Series 8 Ultra วัดสุขภาพ GPS ในตัว',
      price: 3990,
      originalPrice: 5990,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'],
      category: 'electronics',
      brand: 'Samsung',
      rating: 4.8,
      stock: 28,
      salesCount: 920,
      description: 'สมาร์ทวอทช์หน้าจอ AMOLED 2.0 นิ้ว วัดค่าออกซิเจนในเลือด SpO2 หัวใจ อุณหภูมิร่างกาย กันน้ำลึก 50 เมตร',
      badge: 'hot',
    },
    {
      id: 'fa-1',
      storeId: fashionStore.id,
      name: 'เสื้อฮู้ดดี้ Oversized สไตล์สตรีท ผ้านุ่มใส่สบาย',
      price: 590,
      originalPrice: 990,
      images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80'],
      category: 'fashion',
      brand: 'Nike',
      rating: 4.8,
      stock: 65,
      salesCount: 3120,
      description: 'เสื้อฮู้ดดี้ทรงโอเวอร์ไซส์ ผลิตจากผ้าฝ้ายผสมพรีเมียม หนานุ่ม ไม่ย้วย ดีไซน์มินิมอลแมทช์ง่าย',
      badge: 'hot',
    },
    {
      id: 'be-1',
      storeId: beautyStore.id,
      name: 'เซรั่มบำรุงผิวหน้า Advanced Niacinamide 10% + Zinc 1%',
      price: 490,
      originalPrice: 790,
      images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80'],
      category: 'beauty',
      brand: "L'Oreal",
      rating: 4.9,
      stock: 120,
      salesCount: 5400,
      description: 'เซรั่มสูตรเข้มข้นช่วยลดรอยสิว กระชับรูขุมขน ปรับผิวให้กระจ่างใสอย่างเป็นธรรมชาติ',
      badge: 'mall',
    },
    {
      id: 'sp-1',
      storeId: sportStore.id,
      name: 'รองเท้าวิ่ง Air Cushion Pro ซับแรงกระแทก น้ำหนักเบา',
      price: 1890,
      originalPrice: 2890,
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'],
      category: 'sports',
      brand: 'Nike',
      rating: 4.9,
      stock: 35,
      salesCount: 2280,
      description: 'รองเท้าวิ่งสำหรับถนนและลู่ เทคโนโลยี Air Cushion ซัพพอร์ตเท้าและลดแรงกระแทกได้ดีเยี่ยม',
      badge: 'sale',
    },
  ];

  for (const prod of sampleProducts) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: {},
      create: prod,
    });
  }

  // 4. Create Vouchers
  await prisma.voucher.upsert({
    where: { code: 'MOVENEW50' },
    update: {},
    create: {
      code: 'MOVENEW50',
      discountType: 'percentage',
      value: 50,
      minSpend: 0,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      claimsCount: 340,
    },
  });

  await prisma.voucher.upsert({
    where: { code: 'FREESHIP' },
    update: {},
    create: {
      code: 'FREESHIP',
      discountType: 'free_shipping',
      value: 40,
      minSpend: 199,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      claimsCount: 890,
    },
  });

  // 5. Create Live Stream Sessions
  await prisma.liveSession.upsert({
    where: { id: 'live-1' },
    update: {},
    create: {
      id: 'live-1',
      storeId: techStore.id,
      title: '🔥 มหกรรม Flash Sale ไอทีลด 70% แจกคูปองลับในไลฟ์!',
      streamUrl: '/videos/live-streamer-1.mp4',
      coverImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
      pinnedProductId: 'el-1',
      viewersCount: 2450,
      likesCount: 15800,
      isLive: true,
    },
  });

  console.log('✅ Database Seeded Successfully to Supabase!');
  console.log(`👤 Admin: admin@movemall.com (Password: movemall1234)`);
  console.log(`👤 Buyer: buyer@demo.com (Password: movemall1234)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
