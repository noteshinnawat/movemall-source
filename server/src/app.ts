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

// ── Middleware Security & Performance ──
app.use(helmet());
app.use(compression()); // Gzip/Brotli compression ลด bandwidth ~70%
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── WebSocket Server ──
export const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
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

// ── Socket.io Live Chat Room Handlers ──
io.on('connection', (socket) => {
  console.log(`🔌 WebSocket Client connected: ${socket.id}`);

  socket.on('join_chat', (data: { storeId: string; userId: string }) => {
    const room = `chat:${data.storeId}:${data.userId}`;
    socket.join(room);
    console.log(`💬 User ${data.userId} joined chat room ${room}`);
  });

  socket.on('send_chat_message', (data: { storeId: string; userId: string; text: string; sender: 'me' | 'store' }) => {
    const room = `chat:${data.storeId}:${data.userId}`;
    io.to(room).emit('receive_chat_message', {
      id: `msg-${Date.now()}`,
      sender: data.sender,
      text: data.text,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on('disconnect', () => {
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
    ],
  });
});

// ── Register REST API Routers ──
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);

const PORT = Number(process.env.PORT) || 4000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Movemall Server running on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/healthz`);
  });
}

export default app;
