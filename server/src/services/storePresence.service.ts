// ── สถานะออนไลน์ของร้านค้า ──
//
// ร้าน "ออนไลน์" เมื่อมี socket ของเจ้าของร้าน (หรือแอดมิน) เข้าห้อง seller อยู่
// อย่างน้อยหนึ่งตัว — วัดจากการเชื่อมต่อจริง ไม่ใช่ข้อความตกแต่งที่ hardcode ไว้
//
// ข้อจำกัดที่รับไว้: เก็บใน memory ของ process เดียว ถ้าขยายเป็นหลาย instance
// ผู้ซื้อจะเห็นเฉพาะร้านที่ออนไลน์อยู่บน instance เดียวกับตัวเอง
// การทำให้ครบต้องย้าย registry ไป Redis พร้อม pub/sub ข้าม instance

/** storeId → เซ็ตของ socket ฝั่งร้านที่กำลังเชื่อมต่อ */
const storeSockets = new Map<string, Set<string>>();

/** socketId → เซ็ตของร้านที่ socket นั้นดูแลอยู่ (เผื่อดูแลหลายร้าน) */
const socketStores = new Map<string, Set<string>>();

/**
 * บันทึกว่าร้านนี้มีคนเฝ้าอยู่
 * คืน true เมื่อเป็นการเปลี่ยนสถานะจากออฟไลน์เป็นออนไลน์ (ต้องประกาศให้ผู้ซื้อรู้)
 */
export function markStoreOnline(storeId: string, socketId: string): boolean {
  const sockets = storeSockets.get(storeId) || new Set<string>();
  const wasOffline = sockets.size === 0;

  sockets.add(socketId);
  storeSockets.set(storeId, sockets);

  const stores = socketStores.get(socketId) || new Set<string>();
  stores.add(storeId);
  socketStores.set(socketId, stores);

  return wasOffline;
}

/**
 * ถอด socket ที่หลุดออกจากทุกร้านที่ดูแลอยู่
 * คืนรายชื่อร้านที่เพิ่งกลายเป็นออฟไลน์ (ไม่เหลือใครเฝ้าแล้ว)
 */
export function markSocketOffline(socketId: string): string[] {
  const stores = socketStores.get(socketId);
  if (!stores) return [];

  const nowOffline: string[] = [];
  for (const storeId of stores) {
    const sockets = storeSockets.get(storeId);
    if (!sockets) continue;

    sockets.delete(socketId);
    if (sockets.size === 0) {
      storeSockets.delete(storeId);
      nowOffline.push(storeId);
    }
  }

  socketStores.delete(socketId);
  return nowOffline;
}

export function isStoreOnline(storeId: string): boolean {
  return (storeSockets.get(storeId)?.size || 0) > 0;
}
