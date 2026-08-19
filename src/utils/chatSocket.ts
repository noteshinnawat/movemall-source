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
const LOCAL_STORAGE_CHAT_KEY = 'movemall_chat_messages_v1';

export function getStoredChatHistory(): Record<string, any[]> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredChatHistory(history: Record<string, any[]>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save chat history to localStorage', e);
  }
}
