import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { allMarketplaceProducts } from './productsData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Full Movemall Database Seeding to Supabase PostgreSQL...');

  // 1. Create Default Users (Password: movemall1234)
  const passwordHash = await bcrypt.hash('movemall1234', 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'note.shinnawat@gmail.com' },
    update: { role: 'SUPER_ADMIN' },
    create: {
      email: 'note.shinnawat@gmail.com',
      phone: '0810000000',
      passwordHash,
      name: 'Note Shinnawat (Super Admin)',
      role: 'SUPER_ADMIN',
      coinsBalance: 99999,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@movemall.com' },
    update: { role: 'SUPER_ADMIN' },
    create: {
      email: 'admin@movemall.com',
      phone: '0810000001',
      passwordHash,
      name: 'Movemall Administrator',
      role: 'SUPER_ADMIN',
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
      coinsBalance: 500,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    },
  });

  // 2. Create Stores (8 Category Stores)
  const storesToSeed = [
    {
      id: 'store-techpro',
      ownerId: sellerUser1.id,
      name: 'TechPro Official Store',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80',
      banner: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
      isMall: true,
      isVerified: true,
      rating: 4.9,
      followers: 58200,
      description: 'ตัวแทนจำหน่ายอุปกรณ์ไอทีและอิเล็กทรอนิกส์ของแท้ 100% ประกันศูนย์ไทย จัดส่งรวดเร็วทุกวัน',
    },
    {
      id: 'store-fashionista',
      ownerId: sellerUser2.id,
      name: 'Fashionista Studio',
      logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      banner: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
      isMall: false,
      isVerified: true,
      rating: 4.8,
      followers: 24500,
      description: 'เสื้อผ้าและแฟชั่นมินิมอล ใส่สบาย ดีไซน์นำสมัย คุณภาพเกรดพรีเมียมในราคาสบายกระเป๋า',
    },
    {
      id: 'store-beautyglow',
      ownerId: sellerUser1.id,
      name: 'BeautyGlow Official',
      logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&q=80',
      banner: 'linear-gradient(135deg, #9D174D 0%, #F43F5E 100%)',
      isMall: true,
      isVerified: true,
      rating: 4.9,
      followers: 89000,
      description: 'สกินแคร์และเครื่องสำอางชั้นนำ นำเข้าจากเกาหลีและญี่ปุ่น ของแท้ 100% มีใบรับรอง',
    },
    {
      id: 'store-sportmax',
      ownerId: sellerUser2.id,
      name: 'SportMax Thailand',
      logo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&q=80',
      banner: 'linear-gradient(135deg, #C2410C 0%, #F97316 100%)',
      isMall: false,
      isVerified: true,
      rating: 4.7,
      followers: 15300,
      description: 'อุปกรณ์กีฬาและรองเท้าวิ่ง รองเท้าออกกำลังกายแบรนด์แท้ รองรับทุกกิจกรรมสปอร์ต',
    },
    {
      id: 'store-homepro',
      ownerId: sellerUser1.id,
      name: 'HomeLiving Official Store',
      logo: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=150&q=80',
      banner: 'linear-gradient(135deg, #475569 0%, #64748B 100%)',
      isMall: true,
      isVerified: true,
      rating: 4.8,
      followers: 42000,
      description: 'เฟอร์นิเจอร์และของใช้ในบ้านสไตล์มินิมอล คุณภาพมาตรฐานสากล',
    },
    {
      id: 'store-supermarket',
      ownerId: sellerUser2.id,
      name: 'Movemall Fresh Mart',
      logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&q=80',
      banner: 'linear-gradient(135deg, #15803D 0%, #22C55E 100%)',
      isMall: true,
      isVerified: true,
      rating: 4.9,
      followers: 67000,
      description: 'อาหารสด ขนมนำเข้า วัตถุดิบพรีเมียม จัดส่งรวดเร็วรักษาความสด',
    },
    {
      id: 'store-mombaby',
      ownerId: sellerUser1.id,
      name: 'Mom & Kids Club',
      logo: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=150&q=80',
      banner: 'linear-gradient(135deg, #BE185D 0%, #F472B6 100%)',
      isMall: true,
      isVerified: true,
      rating: 4.9,
      followers: 38000,
      description: 'สินค้าแม่และเด็กปลอดภัย 100% ผ่านการทดสอบจากกุมารแพทย์',
    },
    {
      id: 'store-petcare',
      ownerId: sellerUser2.id,
      name: 'Pet Paradise Official',
      logo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&q=80',
      banner: 'linear-gradient(135deg, #D97706 0%, #FBBF24 100%)',
      isMall: false,
      isVerified: true,
      rating: 4.8,
      followers: 29000,
      description: 'อาหารสัตว์เลี้ยง ของเล่น และอุปกรณ์ดูแลน้องหมาน้องแมวครบวงจร',
    },
  ];

  for (const s of storesToSeed) {
    await prisma.store.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }
  console.log(`✅ Seeded ${storesToSeed.length} Stores`);

  // 3. Create All 160 Products
  console.log(`📦 Seeding ${allMarketplaceProducts.length} Products...`);
  let prodCount = 0;
  for (const prod of allMarketplaceProducts) {
    const storeId = prod.storeId || 'store-techpro';
    await prisma.product.upsert({
      where: { id: prod.id },
      update: {
        storeId,
        name: prod.name,
        description: prod.description || '',
        price: prod.price,
        originalPrice: prod.originalPrice || null,
        category: prod.category,
        brand: prod.brand || 'Movemall',
        images: prod.images || [],
        stock: prod.stock || 50,
        salesCount: prod.salesCount || prod.reviewCount || 100,
        rating: prod.rating || 4.8,
        badge: prod.badge || null,
      },
      create: {
        id: prod.id,
        storeId,
        name: prod.name,
        description: prod.description || '',
        price: prod.price,
        originalPrice: prod.originalPrice || null,
        category: prod.category,
        brand: prod.brand || 'Movemall',
        images: prod.images || [],
        stock: prod.stock || 50,
        salesCount: prod.salesCount || prod.reviewCount || 100,
        rating: prod.rating || 4.8,
        badge: prod.badge || null,
      },
    });
    prodCount++;
  }
  console.log(`✅ Seeded ${prodCount} Products into Supabase DB!`);

  // 4. Create Vouchers
  const vouchers = [
    {
      code: 'MOVENEW50',
      discountType: 'percentage',
      value: 50,
      minSpend: 0,
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      claimsCount: 3420,
    },
    {
      code: 'FREESHIP',
      discountType: 'free_shipping',
      value: 45,
      minSpend: 199,
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      claimsCount: 8900,
    },
    {
      code: 'MALLSUPER15',
      discountType: 'percentage',
      value: 15,
      minSpend: 1000,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      claimsCount: 1250,
    },
    {
      code: 'PAYDAY30',
      discountType: 'percentage',
      value: 30,
      minSpend: 500,
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      claimsCount: 5600,
    },
  ];

  for (const v of vouchers) {
    await prisma.voucher.upsert({
      where: { code: v.code },
      update: v,
      create: v,
    });
  }
  console.log(`✅ Seeded ${vouchers.length} Vouchers`);

  // 5. Create Live Stream Sessions
  const liveSessions = [
    {
      id: 'live-1',
      storeId: 'store-techpro',
      title: '🔥 มหกรรม Flash Sale ไอทีลด 70% แจกคูปองลับในไลฟ์!',
      streamUrl: '/videos/live-streamer-1.mp4',
      coverImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
      pinnedProductId: 'el-1',
      viewersCount: 2450,
      likesCount: 15800,
      isLive: true,
    },
    {
      id: 'live-2',
      storeId: 'store-fashionista',
      title: '✨ สตรีทแวร์คอลเลกชันใหม่ แจกโค้ดส่งฟรี ฿0 ทุกออเดอร์',
      streamUrl: '/videos/live-streamer-2.mp4',
      coverImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80',
      pinnedProductId: 'fa-1',
      viewersCount: 1820,
      likesCount: 12400,
      isLive: true,
    },
    {
      id: 'live-3',
      storeId: 'store-beautyglow',
      title: '💄 แกะกล่องสกินแคร์เกาหลีผิวฉ่ำวาว ลดกระหน่ำ 50%',
      streamUrl: '/videos/live-streamer-3.mp4',
      coverImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80',
      pinnedProductId: 'bt-1',
      viewersCount: 3100,
      likesCount: 28900,
      isLive: true,
    },
    {
      id: 'live-4',
      storeId: 'store-sportmax',
      title: '👟 รองเท้าวิ่งมาราธอนรุ่นท็อป ลดเพิ่ม 300 บาทเฉพาะในไลฟ์',
      streamUrl: '/videos/live-streamer-4.mp4',
      coverImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
      pinnedProductId: 'sp-1',
      viewersCount: 950,
      likesCount: 6400,
      isLive: true,
    },
  ];

  for (const ls of liveSessions) {
    await prisma.liveSession.upsert({
      where: { id: ls.id },
      update: ls,
      create: ls,
    });
  }
  console.log(`✅ Seeded ${liveSessions.length} Live Sessions`);

  // 6. Seed Sample Product Reviews
  const sampleReviews = [
    {
      id: 'rev-seed-1',
      userId: demoBuyer.id,
      productId: 'el-1',
      rating: 5,
      comment: 'สินค้าของแท้ 100% สภาพกล่องคมกริบ จัดส่งเร็วมาก ประทับใจสุดๆ แนะนำร้านนี้เลยครับ!',
      likes: 12,
    },
    {
      id: 'rev-seed-2',
      userId: demoBuyer.id,
      productId: 'fa-1',
      rating: 5,
      comment: 'เนื้อผ้าดีมาก สวมใส่สบาย ตรงปกตามที่ไลฟ์สดเป๊ะๆ มีโค้ดลดราคาคุ้มค่ามาก',
      likes: 8,
    },
    {
      id: 'rev-seed-3',
      userId: demoBuyer.id,
      productId: 'bt-1',
      rating: 5,
      comment: 'แพ็คสินค้าแน่นหนา มีบับเบิ้ลกันกระแทกอย่างดี วันหมดอายุอีกยาวนาน ของแท้แน่นอน',
      likes: 15,
    },
    {
      id: 'rev-seed-4',
      userId: demoBuyer.id,
      productId: 'sp-1',
      rating: 5,
      comment: 'รองเท้าเบา นุ่ม กระชับเท้า วิ่ง 10k สบายๆ ไม่เจ็บเท้า จัดส่งภายใน 1 วัน',
      likes: 20,
    },
  ];

  for (const rev of sampleReviews) {
    await prisma.review.upsert({
      where: { id: rev.id },
      update: rev,
      create: rev,
    });
  }
  console.log(`✅ Seeded ${sampleReviews.length} Verified Reviews`);

  console.log('\n🎉 ALL REAL MOVEMALL DATA SEEDED TO SUPABASE POSTGRESQL SUCCESSFULLY!');
  console.log(`👤 Super Admin: note.shinnawat@gmail.com (Password: movemall1234)`);
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
