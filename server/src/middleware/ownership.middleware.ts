// ── Tenant Isolation Helpers ──
// ตรวจว่าผู้เรียก API เป็นเจ้าของทรัพยากรที่กำลังจะแก้ไขจริงหรือไม่
//
// ปัญหาเดิม: หลาย endpoint ตรวจแค่ว่า "ล็อกอินอยู่ไหม" (authenticateJWT) แล้วลงมือแก้ข้อมูลเลย
// ทำให้ผู้ใช้ทั่วไปแก้/ลบสินค้าของร้านอื่น และอ่าน-แก้ข้อมูลภาษีของร้านอื่นได้ (IDOR)
//
// สายความเป็นเจ้าของในฐานข้อมูล: Product.storeId → Store.ownerId → User.id

import { Response } from 'express';
import { prismaRead } from '../config/database.js';
import { AuthRequest } from './auth.middleware.js';

/** role ที่ดูแลทั้งแพลตฟอร์ม — ข้ามการตรวจความเป็นเจ้าของร้านได้ */
const PLATFORM_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export function isPlatformAdmin(role?: string): boolean {
  return Boolean(role && PLATFORM_ADMIN_ROLES.includes(role));
}

export class OwnershipError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'OwnershipError';
  }
}

/**
 * แปลง error ที่เกิดจากการตรวจสิทธิ์ให้เป็น HTTP response
 * ใช้ในบล็อก catch: `if (respondIfOwnershipError(error, res)) return;`
 */
export function respondIfOwnershipError(error: unknown, res: Response): boolean {
  if (error instanceof OwnershipError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

/** คืนร้านค้าที่ผู้ใช้คนนี้เป็นเจ้าของ (ผู้ใช้ 1 คนมีได้หลายร้าน จึงคืนเป็น list ของ id) */
export async function getOwnedStoreIds(userId: string): Promise<string[]> {
  const stores = await prismaRead.store.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  return stores.map(s => s.id);
}

/** ตรวจว่าผู้เรียกเป็นเจ้าของร้านนี้ — ไม่ใช่แล้ว throw OwnershipError */
export async function assertStoreOwner(req: AuthRequest, storeId: string): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) throw new OwnershipError(401, 'Unauthorized');

  if (isPlatformAdmin(req.user?.role)) return;

  const store = await prismaRead.store.findUnique({
    where: { id: storeId },
    select: { ownerId: true },
  });

  if (!store) throw new OwnershipError(404, 'ไม่พบร้านค้าที่ระบุ');
  if (store.ownerId !== userId) {
    throw new OwnershipError(403, 'ไม่มีสิทธิ์จัดการข้อมูลของร้านค้านี้');
  }
}

/** ตรวจว่าผู้เรียกเป็นเจ้าของร้านที่ขายสินค้าชิ้นนี้ — คืนข้อมูลสินค้ากลับไปใช้ต่อได้ */
export async function assertProductOwner(req: AuthRequest, productId: string) {
  const userId = req.user?.userId;
  if (!userId) throw new OwnershipError(401, 'Unauthorized');

  const product = await prismaRead.product.findUnique({
    where: { id: productId },
    select: { id: true, storeId: true, store: { select: { ownerId: true } } },
  });

  if (!product) throw new OwnershipError(404, 'ไม่พบสินค้าที่ระบุ');

  if (isPlatformAdmin(req.user?.role)) return product;

  if (product.store.ownerId !== userId) {
    throw new OwnershipError(403, 'ไม่มีสิทธิ์จัดการสินค้าของร้านค้าอื่น');
  }

  return product;
}

/**
 * หาว่าจะสร้างสินค้าเข้าร้านไหน
 * - ถ้าระบุ storeId มา ต้องเป็นร้านของผู้เรียกเอง
 * - ถ้าไม่ระบุ ใช้ร้านแรกที่ผู้เรียกเป็นเจ้าของ
 * เดิมโค้ด fallback ไปที่ "ร้านแรกที่เจอในฐานข้อมูล" ทำให้ยัดสินค้าเข้าร้านคนอื่นได้
 */
export async function resolveWritableStoreId(req: AuthRequest, requestedStoreId?: string): Promise<string> {
  const userId = req.user?.userId;
  if (!userId) throw new OwnershipError(401, 'Unauthorized');

  if (requestedStoreId) {
    await assertStoreOwner(req, requestedStoreId);
    return requestedStoreId;
  }

  const ownedStoreIds = await getOwnedStoreIds(userId);
  if (ownedStoreIds.length > 0) return ownedStoreIds[0];

  if (isPlatformAdmin(req.user?.role)) {
    const anyStore = await prismaRead.store.findFirst({ select: { id: true } });
    if (anyStore) return anyStore.id;
  }

  throw new OwnershipError(403, 'บัญชีนี้ยังไม่มีร้านค้า กรุณาเปิดร้านก่อนเพิ่มสินค้า');
}
