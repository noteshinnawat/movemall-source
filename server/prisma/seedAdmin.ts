// ── ตั้งค่าผู้ดูแลระบบ (Super Admin) ด้วยมือ ──
// แทนที่พฤติกรรมเดิมที่เลื่อนขั้นให้อัตโนมัติตอนล็อกอิน ซึ่งเปิดช่องให้ยึดสิทธิ์แอดมินได้
//
// วิธีใช้:
//   npm run seed:admin -- <email> [password]
//
// - ถ้ามีบัญชีอีเมลนี้อยู่แล้ว: เลื่อน role เป็น SUPER_ADMIN (ไม่แตะรหัสผ่าน)
// - ถ้ายังไม่มี: สร้างบัญชีใหม่ ต้องระบุ password ด้วย
//
// สคริปต์นี้รันได้เฉพาะคนที่เข้าถึง server และ DATABASE_URL ได้เท่านั้น
// จึงไม่เป็นช่องทางให้ผู้ใช้ภายนอกยกระดับสิทธิ์ตัวเอง

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !email.includes('@')) {
    console.error('❌ กรุณาระบุอีเมล: npm run seed:admin -- <email> [password]');
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existing) {
    if (existing.role === 'SUPER_ADMIN') {
      console.log(`ℹ️  ${normalizedEmail} เป็น SUPER_ADMIN อยู่แล้ว ไม่มีอะไรต้องเปลี่ยน`);
      return;
    }
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'SUPER_ADMIN' },
    });
    console.log(`✅ เลื่อนขั้น ${updated.email} จาก ${existing.role} เป็น SUPER_ADMIN แล้ว`);
    return;
  }

  if (!password) {
    console.error(
      `❌ ยังไม่มีบัญชี ${normalizedEmail} ในระบบ\n` +
      '   หากต้องการสร้างใหม่ ให้ระบุรหัสผ่านด้วย: npm run seed:admin -- <email> <password>'
    );
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('❌ รหัสผ่านผู้ดูแลระบบต้องยาวอย่างน้อย 12 ตัวอักษร');
    process.exit(1);
  }

  const created = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      name: 'Movemall Administrator',
      role: 'SUPER_ADMIN',
      coinsBalance: 0,
    },
  });

  console.log(`✅ สร้างบัญชี SUPER_ADMIN สำเร็จ: ${created.email}`);
  console.log('   ⚠️ กรุณาเปลี่ยนรหัสผ่านทันทีหลังเข้าสู่ระบบครั้งแรก');
}

main()
  .catch((e) => {
    console.error('❌ Seed Admin Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
