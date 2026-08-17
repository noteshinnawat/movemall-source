import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaWriteGlobal: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var prismaReadGlobal: PrismaClient | undefined;
}

// ── 1. Write Client (Primary / Master) ──
// ใช้สำหรับคำสั่ง INSERT, UPDATE, DELETE, Transactions (Checkout, Payment)
export const prismaWrite =
  globalThis.prismaWriteGlobal ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || process.env.DATABASE_URL_DIRECT,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// ── 2. Read Client (Read Replica via PgBouncer) ──
// ใช้สำหรับดึง Catalog สินค้า, ข้อมูลร้าน, ค้นหา, ดูรีวิว
export const prismaRead =
  globalThis.prismaReadGlobal ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL_REPLICA || process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaWriteGlobal = prismaWrite;
  globalThis.prismaReadGlobal = prismaRead;
}
