/**
 * 🧹 Movemall Database Cleanup Script
 * ลบข้อมูล mock/seed ทั้งหมดออกจาก production database
 *
 * วิธีใช้ (จาก server/):
 *   npx tsx prisma/cleanup.ts
 *
 * ⚠️  สคริปต์นี้จะลบข้อมูลทุกอย่างใน database!
 *     ใช้กับ production เมื่อต้องการเริ่มต้นใหม่เท่านั้น
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Starting Movemall Database Full Cleanup...\n');

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
