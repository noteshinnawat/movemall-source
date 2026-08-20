import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket: Socket | null = null;

/**
 * เซิร์ฟเวอร์บังคับ JWT ตั้งแต่ handshake — ไม่มี token ก็ต่อไม่ติด
 * (เดิมต่อได้โดยไม่ยืนยันตัวตน แล้ว join ห้องแชทของคนอื่นได้)
 */
export function getChatSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      auth: (cb) => cb({ token: localStorage.getItem('movemall_jwt_token') || '' }),
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Movemall Live Chat WebSocket Server:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Chat WebSocket connection warning:', err.message);
    });

    socket.on('chat_error', (err: { code?: string; message?: string }) => {
      console.warn('⚠️ Chat permission denied:', err?.code, err?.message);
    });
  }
  return socket;
}

/**
 * ตัดการเชื่อมต่อเดิมทิ้งเมื่อสถานะล็อกอินเปลี่ยน
 * เพื่อไม่ให้ socket ยังถือ token ของ session ก่อนหน้าอยู่
 */
export function resetChatSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinChatRoom(storeId: string, userId: string): void {
  const s = getChatSocket();
  if (s.connected) {
    s.emit('join_chat', { storeId, userId });
  } else {
    s.once('connect', () => {
      s.emit('join_chat', { storeId, userId });
    });
  }
}

export function joinSellerChatRoom(storeId: string): void {
  const s = getChatSocket();
  if (s.connected) {
    s.emit('join_seller_room', { storeId });
  } else {
    s.once('connect', () => {
      s.emit('join_seller_room', { storeId });
    });
  }
}

export function emitChatMessage(data: {
  id?: string;
  storeId: string;
  userId?: string;
  text: string;
  customerId?: string;
}): void {
  const s = getChatSocket();
  s.emit('send_chat_message', data);
}

export function emitTypingStatus(data: {
  storeId: string;
  userId?: string;
  customerId?: string;
  isTyping: boolean;
}): void {
  const s = getChatSocket();
  s.emit('typing_status', data);
}

// LocalStorage Persistence Helpers
//
// cache ผูกกับบัญชีที่ล็อกอินอยู่เสมอ — เดิมใช้คีย์เดียวทั้งเครื่องและไม่เคยล้าง
// ทำให้ห้องแชท (รวมข้อความ mock ที่เคย seed ไว้) ของบัญชีก่อนหน้าโผล่ข้ามผู้ใช้
const CHAT_HISTORY_PREFIX = 'movemall_chat_messages_v2_';

/** คีย์รุ่นเก่าที่ไม่ผูกกับผู้ใช้ ต้องทิ้งทุกครั้งที่เจอ */
const LEGACY_CHAT_HISTORY_KEY = 'movemall_chat_messages_v1';

function historyKey(ownerId: string): string {
  return `${CHAT_HISTORY_PREFIX}${ownerId}`;
}

function purgeLegacyChatHistory(): void {
  try {
    localStorage.removeItem(LEGACY_CHAT_HISTORY_KEY);
  } catch {
    // storage ใช้ไม่ได้ — ไม่มีอะไรให้ล้างอยู่แล้ว
  }
}

export function getStoredChatHistory(ownerId: string): Record<string, any[]> {
  purgeLegacyChatHistory();
  if (!ownerId) return {};
  try {
    const raw = localStorage.getItem(historyKey(ownerId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredChatHistory(ownerId: string, history: Record<string, any[]>): void {
  if (!ownerId) return;
  try {
    localStorage.setItem(historyKey(ownerId), JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save chat history to localStorage', e);
  }
}

/** ล้าง cache แชททั้งหมดในเครื่อง ใช้ตอนสลับบัญชี/ออกจากระบบ */
export function clearAllStoredChatHistory(): void {
  purgeLegacyChatHistory();
  try {
    // ตัวเลข unread บน Navbar ก็เป็นของบัญชีเดิม ต้องรีเซ็ตพร้อมกัน
    localStorage.removeItem('movemall_chat_unread_count');
    window.dispatchEvent(new Event('movemall_chat_change'));
  } catch {
    // storage ใช้ไม่ได้
  }
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CHAT_HISTORY_PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch {
    // storage ใช้ไม่ได้
  }
}
