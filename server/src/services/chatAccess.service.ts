// ── สิทธิ์การเข้าถึงห้องแชท ──
//
// ใช้ร่วมกันทั้งฝั่ง REST (chat.routes.ts) และ WebSocket (app.ts)
// เพื่อให้กฎการตัดสินใจมีที่มาที่เดียว ไม่หลุดกันคนละทาง
//
// หลักการ: ตัวตนของผู้เรียกมาจาก JWT เท่านั้น ห้ามเชื่อ userId/senderRole
// ที่ client ส่งมา เพราะปลอมได้ฟรี (ช่องโหว่ IDOR เดิม)

import { prismaRead } from '../config/database.js';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'CS_ADMIN', 'MODERATOR']);

export interface ChatIdentity {
  userId: string;
  role: string;
}

/** แอดมินแพลตฟอร์มดูแลแชททุกร้านได้ (งาน CS / ตรวจสอบการทุจริต) */
export function isPlatformAdmin(identity: ChatIdentity): boolean {
  return ADMIN_ROLES.has((identity.role || '').toUpperCase());
}

/**
 * ผู้เรียกมีสิทธิ์พูดในนามร้านนี้หรือไม่
 *
 * ต้องเป็นเจ้าของร้านตามข้อมูลใน DB จริง — role SELLER อย่างเดียวไม่พอ
 * เพราะ seller คนหนึ่งไม่ควรอ่านหรือตอบแชทของร้านคนอื่น
 *
 * ถ้าหา store ไม่เจอใน DB จะตอบ false เสมอ (deny by default)
 */
export async function canActAsStore(identity: ChatIdentity, storeId: string): Promise<boolean> {
  if (!storeId) return false;
  if (isPlatformAdmin(identity)) return true;

  try {
    const store = await prismaRead.store.findFirst({
      where: { id: storeId, ownerId: identity.userId },
      select: { id: true },
    });
    return Boolean(store);
  } catch (err) {
    // DB ล่ม/ไม่พร้อม — ปฏิเสธไว้ก่อน ดีกว่าปล่อยผ่านแล้วข้อมูลรั่ว
    console.warn('canActAsStore check failed, denying access:', (err as Error).message);
    return false;
  }
}

/**
 * ผู้เรียกเข้าถึงห้องสนทนา (storeId ↔ customerId) นี้ได้หรือไม่
 *
 * ผ่านได้ 2 ทาง: เป็นลูกค้าเจ้าของห้องเอง หรือเป็นเจ้าของร้านปลายทาง
 */
export async function canAccessThread(
  identity: ChatIdentity,
  storeId: string,
  customerId: string
): Promise<boolean> {
  if (customerId === identity.userId) return true;
  return canActAsStore(identity, storeId);
}
