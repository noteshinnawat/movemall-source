import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Movemall Live Chat WebSocket Server:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Chat WebSocket connection warning:', err.message);
    });
  }
  return socket;
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
  userId: string;
  text: string;
  sender: 'me' | 'store';
  customerId?: string;
}): void {
  const s = getChatSocket();
  s.emit('send_chat_message', data);
}

export function emitTypingStatus(data: {
  storeId: string;
  userId: string;
  isTyping: boolean;
  sender: 'me' | 'store';
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
