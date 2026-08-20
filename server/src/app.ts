// โหลดและตรวจสอบ environment เป็นอันดับแรกสุด — ถ้า secret ไม่ครบให้ดับตั้งแต่ตอนบูต
import './config/env.js';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Server as SocketIOServer } from 'socket.io';
import { prismaRead } from './config/database.js';
import { redis } from './config/redis.js';

const app = express();
const server = http.createServer(app);

// อยู่หลัง reverse proxy (nginx / Railway / Cloudflare) — ต้องเชื่อ X-Forwarded-For
// เพื่อให้ rate limiting นับ IP ของผู้ใช้จริง ไม่ใช่ IP ของ proxy เพียงตัวเดียว
// ตั้งเป็น 1 ชั้น (ไม่ใช่ true) เพื่อไม่ให้ผู้เรียกปลอม header มาเปลี่ยน IP ตัวเองได้
app.set('trust proxy', 1);

// ── Middleware Security & Performance ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // API ตอบเป็น JSON เท่านั้น จึงไม่ต้องอนุญาต script/style จากที่ใด
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
}));
app.use(compression()); // Gzip/Brotli compression ลด bandwidth ~70%
// Flexible CORS configuration (Cloudflare Pages, Localhost & Custom Domains)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// เทียบ origin แบบเจาะจง hostname — เดิมใช้ origin.includes('movemall')
// ซึ่งทำให้โดเมนอย่าง movemall.evil.com ผ่านได้ด้วย
function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }

  // โดเมนพรีวิวของ Cloudflare Pages (เช่น abc123.movemall.pages.dev)
  if (hostname === 'movemall.pages.dev' || hostname.endsWith('.movemall.pages.dev')) return true;

  // โดเมนจริงของแบรนด์และ subdomain ทั้งหมด
  if (hostname === 'movemall.com' || hostname.endsWith('.movemall.com')) return true;

  return false;
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // คำขอที่ไม่มี origin (curl, server-to-server, mobile app) ไม่ถูกบล็อกโดย CORS อยู่แล้ว
    // เพราะ CORS เป็นกลไกของเบราว์เซอร์ — การป้องกันจริงอยู่ที่ JWT และลายเซ็น webhook
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) return callback(null, true);

    console.warn(`CORS: ปฏิเสธ origin ที่ไม่อยู่ในรายการอนุญาต — ${origin}`);
    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
// เก็บ raw body ไว้สำหรับตรวจลายเซ็น HMAC ของ webhook
// ต้องใช้ไบต์ดิบที่ผู้ให้บริการเซ็นมาจริง ๆ — JSON.stringify(req.body) ให้ผลต่างกันได้
// (ลำดับคีย์, ช่องว่าง, การ escape unicode) ทำให้ลายเซ็นที่ถูกต้องถูกปฏิเสธ
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── WebSocket Server ──
export const io = new SocketIOServer(server, {
  cors: corsOptions,
  pingInterval: 25000,
  pingTimeout: 20000,
});

io.on('connection', (socket) => {
  console.log(`🔌 WebSocket Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket Client disconnected: ${socket.id}`);
  });
});

// ── Health Check & Kubernetes Probes ──
app.get('/healthz', async (_req, res) => {
  let redisStatus = 'offline';
  try {
    // 1. Check Database connection (Supabase PostgreSQL)
    await prismaRead.$queryRaw`SELECT 1`;
    
    // 2. Check Redis connection (Optional)
    try {
      await redis.ping();
      redisStatus = 'connected';
    } catch {
      redisStatus = 'offline (cache bypassed)';
    }

    res.status(200).json({
      status: 'healthy',
      database: 'connected (Supabase PostgreSQL)',
      redis: redisStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/readyz', (_req, res) => {
  res.status(200).json({
    status: 'ready',
    memoryUsage: process.memoryUsage(),
  });
});

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import storeRoutes from './routes/store.routes.js';
import orderRoutes from './routes/order.routes.js';
import chatRoutes from './routes/chat.routes.js';
import userRoutes from './routes/user.routes.js';
import adsRoutes from './routes/ads.routes.js';
import adminRoutes from './routes/admin.routes.js';
import openApiRoutes from './routes/openapi.routes.js';
import taxRoutes from './routes/tax.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import mediaRoutes from './routes/media.routes.js';
import liveRoutes from './routes/live.routes.js';
import lensRoutes from './routes/lens.routes.js';
import logisticsRoutes from './routes/logistics.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import payoutRoutes from './routes/payout.routes.js';
import reportRoutes from './routes/report.routes.js';
import {
  globalLimiter,
  authLimiter,
  otpLimiter,
  paymentLimiter,
  webhookLimiter,
} from './middleware/rateLimit.middleware.js';
import { verifyTurnstile } from './middleware/turnstile.middleware.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config/env.js';
import { isTokenRevoked } from './services/tokenRevocation.service.js';
import { canActAsStore, ChatIdentity } from './services/chatAccess.service.js';
import { markStoreOnline, markSocketOffline, isStoreOnline } from './services/storePresence.service.js';

// ── Socket.io Live Chat Room Handlers ──
//
// ทุก connection ต้องแนบ JWT มาตั้งแต่ handshake — เดิมใครก็ต่อเข้ามา
// แล้ว join_chat ด้วย userId ของคนอื่นเพื่อดักอ่านแชทได้ หรือส่งข้อความ
// โดยอ้าง sender: 'store' เพื่อปลอมเป็นร้านค้าได้
io.use(async (socket, next) => {
  const raw =
    (socket.handshake.auth?.token as string | undefined) ||
    (socket.handshake.headers.authorization as string | undefined);

  if (!raw) {
    next(new Error('UNAUTHORIZED'));
    return;
  }

  const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      jti?: string;
      iat?: number;
    };

    if (await isTokenRevoked(decoded.jti, decoded.userId, decoded.iat)) {
      next(new Error('SESSION_REVOKED'));
      return;
    }

    socket.data.identity = { userId: decoded.userId, role: decoded.role };
    next();
  } catch {
    next(new Error('UNAUTHORIZED'));
  }
});

io.on('connection', (socket) => {
  const identity = socket.data.identity as ChatIdentity;
  console.log(`🔌 WebSocket Client connected: ${socket.id} (user ${identity.userId})`);

  /**
   * ระบุว่าห้องที่ผู้เรียกขอเข้าถึงเป็นของลูกค้าคนไหน
   * คืน null เมื่อไม่มีสิทธิ์ — ผู้ซื้อได้ห้องของตัวเองเสมอ
   * ส่วนเจ้าของร้านระบุ customerId เพื่อเข้าห้องของลูกค้าได้
   */
  async function resolveThreadCustomerId(storeId: string, requestedCustomerId?: string): Promise<string | null> {
    if (!storeId) return null;
    if (!requestedCustomerId || requestedCustomerId === identity.userId) {
      return identity.userId;
    }
    return (await canActAsStore(identity, storeId)) ? requestedCustomerId : null;
  }

  // Customer or Seller joins specific conversation room
  socket.on('join_chat', async (data: { storeId: string; userId?: string; customerId?: string }) => {
    if (!data?.storeId) return;

    const customerId = await resolveThreadCustomerId(data.storeId, data.customerId || data.userId);
    if (!customerId) {
      socket.emit('chat_error', { code: 'FORBIDDEN_ROOM', message: 'ไม่มีสิทธิ์เข้าห้องสนทนานี้' });
      return;
    }

    const room = `chat:${data.storeId}:${customerId}`;
    socket.join(room);

    // สมัครรับสถานะออนไลน์ของร้านนี้ แล้วส่งสถานะปัจจุบันให้ทันที
    // ไม่ต้องรอให้ร้านเปลี่ยนสถานะก่อนถึงจะรู้
    socket.join(`presence:${data.storeId}`);
    socket.emit('store_presence', { storeId: data.storeId, isOnline: isStoreOnline(data.storeId) });

    console.log(`💬 Client ${socket.id} (user ${identity.userId}) joined chat room ${room}`);
  });

  // Seller joins store broadcast channel to monitor incoming customer messages
  socket.on('join_seller_room', async (data: { storeId: string }) => {
    if (!data?.storeId) return;

    if (!(await canActAsStore(identity, data.storeId))) {
      socket.emit('chat_error', { code: 'FORBIDDEN_STORE', message: 'ไม่ใช่เจ้าของร้านนี้' });
      return;
    }

    const room = `seller:${data.storeId}`;
    socket.join(room);

    // ร้านเพิ่งกลับมาออนไลน์ — บอกผู้ซื้อทุกคนที่เปิดห้องกับร้านนี้อยู่
    if (markStoreOnline(data.storeId, socket.id)) {
      io.to(`presence:${data.storeId}`).emit('store_presence', { storeId: data.storeId, isOnline: true });
    }

    console.log(`🏪 Seller ${socket.id} joined store room ${room}`);
  });

  // Typing status indicator
  socket.on('typing_status', async (data: { storeId: string; userId?: string; customerId?: string; isTyping: boolean }) => {
    if (!data?.storeId) return;

    const customerId = await resolveThreadCustomerId(data.storeId, data.customerId || data.userId);
    if (!customerId) return;

    const actingAsStore = customerId !== identity.userId;
    const room = `chat:${data.storeId}:${customerId}`;
    socket.to(room).emit('user_typing', {
      storeId: data.storeId,
      userId: customerId,
      isTyping: Boolean(data.isTyping),
      sender: actingAsStore ? 'store' : 'me',
    });
  });

  // Send message through WebSocket
  socket.on('send_chat_message', async (data: { id?: string; storeId: string; userId?: string; text: string; customerId?: string }) => {
    if (!data?.text || !data.text.trim() || !data?.storeId) return;

    const customerId = await resolveThreadCustomerId(data.storeId, data.customerId || data.userId);
    if (!customerId) {
      socket.emit('chat_error', { code: 'FORBIDDEN_ROOM', message: 'ไม่มีสิทธิ์ส่งข้อความในห้องนี้' });
      return;
    }

    // บทบาทผู้ส่งมาจากสิทธิ์จริง ไม่ใช่จากค่า sender ที่ client ส่งมา
    const actingAsStore = customerId !== identity.userId;
    const room = `chat:${data.storeId}:${customerId}`;
    const sellerRoom = `seller:${data.storeId}`;

    const msgPayload = {
      id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: actingAsStore ? 'store' : 'me',
      senderId: identity.userId,
      recipientId: actingAsStore ? customerId : data.storeId,
      storeId: data.storeId,
      customerId,
      text: data.text.trim(),
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };

    // Broadcast only to OTHER sockets in the room (prevents duplicate self-echo)
    socket.to(room).emit('receive_chat_message', msgPayload);
    if (!actingAsStore) {
      socket.to(sellerRoom).emit('receive_chat_message', msgPayload);
    }

    // ไม่บันทึกลง DB ที่นี่ — client ทุกตัวยิง POST /api/chat/messages คู่กันอยู่แล้ว
    // เดิมเขียนทั้งสองทางทำให้ข้อความเดียวถูกบันทึกซ้ำ 2 แถว (เพิ่งเห็นตอนต่อ DB จริง
    // เพราะก่อนหน้านี้การเขียนล้มเหลวเงียบ ๆ) ช่องทางนี้จึงเหลือหน้าที่กระจายสัญญาณอย่างเดียว
    // และ REST เป็นแหล่งบันทึกทางเดียว ซึ่งทนกว่าเมื่อ socket หลุด
  });

  socket.on('disconnect', () => {
    // ร้านที่ไม่เหลือ socket เฝ้าแล้ว ถือว่าออฟไลน์
    for (const storeId of markSocketOffline(socket.id)) {
      io.to(`presence:${storeId}`).emit('store_presence', { storeId, isOnline: false });
    }
    console.log(`🔌 WebSocket Client disconnected: ${socket.id}`);
  });
});

// ── Base API Info ──
app.get('/api/info', (_req, res) => {
  res.json({
    name: 'Movemall High-Concurrency API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      '/api/auth',
      '/api/products',
      '/api/stores',
      '/api/orders',
      '/api/chat',
      '/api/user',
      '/api/ads',
      '/api/admin',
      '/api/v1/open',
      '/api/tax',
      '/api/payment',
      '/api/media',
      '/api/live',
      '/api/lens',
      '/api/logistics',
      '/api/notifications',
      '/api/payout',
    ],
  });
});

// ── Rate Limiting (ต้องมาก่อน route ทั้งหมด) ──
app.use('/api', globalLimiter);

// เส้นทางที่เป็นเป้าหมายการโจมตีแบบเดาซ้ำ — จำกัดเข้มเป็นพิเศษ
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/login-otp', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/user/verify-email/request-otp', otpLimiter);
app.use('/api/user/verify-phone/request-otp', otpLimiter);
app.use('/api/payment/webhook', webhookLimiter);
app.use('/api/payment', paymentLimiter);

// ── Turnstile (กันบอทที่กระจาย IP ซึ่ง rate limit จับไม่ได้) ──
// วางไว้บน endpoint ที่บอทได้ประโยชน์จากการยิงซ้ำ: สร้างบัญชี, เดารหัสผ่าน
// และโดยเฉพาะ send-otp ที่ทุกครั้งมีค่าส่ง SMS จริง
app.use('/api/auth/send-otp', verifyTurnstile);
app.use('/api/auth/register', verifyTurnstile);
app.use('/api/auth/login', verifyTurnstile);
app.use('/api/auth/login-otp', verifyTurnstile);

// ── Register REST API Routers ──
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/open', openApiRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/lens', lensRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payout', payoutRoutes);
app.use('/api/reports', reportRoutes);

const PORT = Number(process.env.PORT) || 4000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Movemall Server running on port ${PORT} (0.0.0.0:${PORT})`);
    console.log(`📡 Health Check: http://0.0.0.0:${PORT}/healthz`);
  });
}

export default app;
