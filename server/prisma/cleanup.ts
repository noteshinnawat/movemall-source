/**
 * 🧹 Movemall Database Cleanup Script
 * ลบข้อมูลทั้งหมดออกจากฐานข้อมูล
 *
 * ⚠️  สคริปต์นี้ลบข้อมูลทุกตารางแบบกู้คืนไม่ได้
 *     และ server/.env ชี้ไปยังฐานข้อมูล production โดยตรง
 *     จึงมีด่านยืนยันก่อนลบเสมอ
 *
 * วิธีใช้ (จาก server/):
 *   npx tsx prisma/cleanup.ts
 *     → แสดงเป้าหมายและจำนวนข้อมูล แล้วให้พิมพ์ชื่อฐานข้อมูลยืนยัน
 *
 *   npx tsx prisma/cleanup.ts --i-understand=<ชื่อฐานข้อมูล>
 *     → สำหรับรันใน CI/script ที่ไม่มีการโต้ตอบ
 *
 *   เพิ่ม --allow-production เมื่อ NODE_ENV=production
 */

import { PrismaClient } from '@prisma/client';
import readline from 'node:readline/promises';
import 'dotenv/config';

const prisma = new PrismaClient();

/** ดึงชื่อฐานข้อมูลและโฮสต์จาก connection string โดยไม่เปิดเผยรหัสผ่าน */
function describeTarget(): { host: string; database: string; masked: string } {
  const url = process.env.DATABASE_URL || process.env.DATABASE_URL_DIRECT || '';
  if (!url) {
    console.error('❌ ไม่พบ DATABASE_URL — ไม่ทราบว่าจะลบข้อมูลจากที่ไหน');
    process.exit(1);
  }
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      database: u.pathname.replace(/^\//, '') || '(default)',
      masked: `${u.protocol}//***:***@${u.host}${u.pathname}`,
    };
  } catch {
    console.error('❌ อ่าน DATABASE_URL ไม่ได้');
    process.exit(1);
  }
}

/**
 * ด่านยืนยันก่อนลบ
 * เดิมสคริปต์นี้ลบทันทีที่รัน ไม่มีคำถามใด ๆ — พิมพ์คำสั่งผิดครั้งเดียว
 * ข้อมูล production หายทั้งหมด
 */
async function confirmOrExit(target: ReturnType<typeof describeTarget>): Promise<void> {
  const args = process.argv.slice(2);
  const understand = args.find(a => a.startsWith('--i-understand='))?.split('=')[1];
  const allowProduction = args.includes('--allow-production');

  if (process.env.NODE_ENV === 'production' && !allowProduction) {
    console.error('\n❌ NODE_ENV=production — ต้องใส่ --allow-production ด้วยจึงจะลบได้\n');
    process.exit(1);
  }

  // ── แสดงเป้าหมายและปริมาณข้อมูลที่กำลังจะหาย ──
  const [users, stores, products, orders] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.product.count(),
    prisma.order.count(),
  ]);

  console.log('⚠️  กำลังจะลบข้อมูลทั้งหมดจากฐานข้อมูลนี้:');
  console.log(`     ${target.masked}`);
  console.log(`     โฮสต์: ${target.host}`);
  console.log(`     ฐานข้อมูล: ${target.database}\n`);
  console.log('   ข้อมูลที่จะหายไปแบบกู้คืนไม่ได้:');
  console.log(`     ผู้ใช้ ${users} | ร้านค้า ${stores} | สินค้า ${products} | คำสั่งซื้อ ${orders}\n`);

  if (understand !== undefined) {
    if (understand === target.database) {
      console.log('   ✔ ยืนยันผ่าน --i-understand แล้ว ดำเนินการต่อ\n');
      return;
    }
    console.error(`❌ --i-understand=${understand} ไม่ตรงกับชื่อฐานข้อมูล "${target.database}" — ยกเลิก\n`);
    process.exit(1);
  }

  if (!process.stdin.isTTY) {
    console.error('❌ ไม่ได้รันในโหมดโต้ตอบ และไม่ได้ใส่ --i-understand=<ชื่อฐานข้อมูล> — ยกเลิกเพื่อความปลอดภัย\n');
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`   พิมพ์ชื่อฐานข้อมูล "${target.database}" เพื่อยืนยันการลบ (หรือกด Enter เพื่อยกเลิก): `);
  rl.close();

  if (answer.trim() !== target.database) {
    console.log('\n   ยกเลิกแล้ว ไม่มีข้อมูลใดถูกลบ\n');
    process.exit(0);
  }
  console.log('');
}

async function cleanup() {
  console.log('🧹 Movemall Database Full Cleanup\n');

  const target = describeTarget();
  await confirmOrExit(target);

  console.log('🧹 เริ่มลบข้อมูล...\n');

  // ลบตามลำดับ dependency (child → parent)
  // Tables ที่มี FK ชี้ไปยังตารางอื่นต้องลบก่อน

  const steps: Array<{ label: string; fn: () => Promise<{ count: number }> }> = [
    // ── Leaf tables (ไม่มีใครอ้างอิง) ──
    { label: 'StorePenaltyLog',      fn: () => prisma.storePenaltyLog.deleteMany() },
    { label: 'UserViolationReport',  fn: () => prisma.userViolationReport.deleteMany() },
    { label: 'LiveComment',          fn: () => prisma.liveComment.deleteMany() },
    { label: 'AffiliateReferral',    fn: () => prisma.affiliateReferral.deleteMany() },
    { label: 'ChatMessage',          fn: () => prisma.chatMessage.deleteMany() },
    { label: 'Notification',         fn: () => prisma.notification.deleteMany() },
    { label: 'WishlistItem',         fn: () => prisma.wishlistItem.deleteMany() },
    { label: 'Review',               fn: () => prisma.review.deleteMany() },
    { label: 'CoinLedger',           fn: () => prisma.coinLedger.deleteMany() },
    { label: 'VoucherClaim',         fn: () => prisma.voucherClaim.deleteMany() },
    { label: 'TaxDocument',          fn: () => prisma.taxDocument.deleteMany() },
    { label: 'AdWalletTx',           fn: () => prisma.adWalletTx.deleteMany() },
    { label: 'AdCampaign',           fn: () => prisma.adCampaign.deleteMany() },
    { label: 'AdWallet',             fn: () => prisma.adWallet.deleteMany() },
    { label: 'MerchantApiKey',       fn: () => prisma.merchantApiKey.deleteMany() },
    { label: 'PayLaterTx',           fn: () => prisma.payLaterTx.deleteMany() },
    { label: 'PayLaterBill',         fn: () => prisma.payLaterBill.deleteMany() },
    { label: 'PayLaterAccount',      fn: () => prisma.payLaterAccount.deleteMany() },

    // ── Order-related ──
    { label: 'TrackingLog',          fn: () => prisma.trackingLog.deleteMany() },
    { label: 'PaymentTransaction',   fn: () => prisma.paymentTransaction.deleteMany() },
    { label: 'OrderItem',            fn: () => prisma.orderItem.deleteMany() },
    { label: 'Order',                fn: () => prisma.order.deleteMany() },

    // ── Store-related ──
    { label: 'LiveSession',          fn: () => prisma.liveSession.deleteMany() },
    { label: 'Voucher',              fn: () => prisma.voucher.deleteMany() },
    { label: 'Product',              fn: () => prisma.product.deleteMany() },
    { label: 'Store',                fn: () => prisma.store.deleteMany() },

    // ── Users (ลบเป็นอันดับสุดท้าย) ──
    { label: 'User',                 fn: () => prisma.user.deleteMany() },
  ];

  for (const step of steps) {
    try {
      const result = await step.fn();
      if (result.count > 0) {
        console.log(`  ✅ ${step.label}: ลบ ${result.count} รายการ`);
      } else {
        console.log(`  ⬚  ${step.label}: ไม่มีข้อมูล`);
      }
    } catch (err: any) {
      console.error(`  ❌ ${step.label}: ${err.message}`);
    }
  }

  console.log('\n🎉 Cleanup เสร็จสมบูรณ์! ฐานข้อมูลว่างเปล่าแล้ว');
}

cleanup()
  .catch((e) => {
    console.error('❌ Cleanup Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
