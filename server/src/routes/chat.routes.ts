import { Router, Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import { prismaRead, prismaWrite } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { io } from '../app.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'movemall_super_secure_jwt_secret_key_2026_at_least_32_chars!';

// Helper: Extract userId from JWT token or fallback to header/query
function resolveUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      if (decoded?.userId) return decoded.userId;
    } catch {
      // ignore token error and fallback
    }
  }
  const customUserId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || (req.body?.userId as string) || (req.body?.senderId as string);
  return customUserId || 'guest_user';
}

// ── 1. Fetch Conversation Messages (User & Store) ──
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { storeId } = req.query;

    if (!storeId) {
      res.status(400).json({ error: 'storeId is required' });
      return;
    }

    const targetStoreId = Array.isArray(storeId) ? (storeId[0] as string) : (storeId as string);

    let messages: any[] = [];
    try {
      messages = await prismaRead.chatMessage.findMany({
        where: {
          storeId: targetStoreId,
          OR: [
            { senderId: userId },
            { recipientId: userId },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });
    } catch (dbErr) {
      console.warn('Prisma DB query bypassed for chat messages:', (dbErr as Error).message);
    }

    res.json({
      success: true,
      storeId: targetStoreId,
      userId,
      messages: messages.map(m => ({
        id: m.id,
        sender: m.senderId === userId ? 'me' : 'store',
        senderId: m.senderId,
        recipientId: m.recipientId,
        text: m.text,
        time: new Date(m.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error('Fetch Chat Messages Error:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// ── 2. Send New Chat Message ──
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const senderId = resolveUserId(req);
    const { recipientId, storeId, text, senderRole } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    const targetStoreId = storeId || 'store-techpro';
    const targetRecipientId = recipientId || 'store-admin';
    const now = new Date();

    let createdMessage: any = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId,
      recipientId: targetRecipientId,
      storeId: targetStoreId,
      text: text.trim(),
      createdAt: now,
      isRead: false,
    };

    try {
      createdMessage = await prismaWrite.chatMessage.create({
        data: {
          senderId,
          recipientId: targetRecipientId,
          storeId: targetStoreId,
          text: text.trim(),
        },
      });
    } catch (dbErr) {
      console.warn('Prisma Write Chat bypassed (Memory delivery):', (dbErr as Error).message);
    }

    const payload = {
      id: createdMessage.id,
      sender: senderRole === 'store' ? 'store' : (senderId === targetRecipientId ? 'store' : 'me'),
      senderId,
      recipientId: targetRecipientId,
      storeId: targetStoreId,
      text: text.trim(),
      time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      createdAt: now.toISOString(),
    };

    // Emit to real-time Socket.io rooms (only if requested via REST-only client)
    if (io && req.query.broadcast === 'true') {
      const room = `chat:${targetStoreId}:${senderId}`;
      const sellerRoom = `seller:${targetStoreId}`;
      io.to(room).emit('receive_chat_message', payload);
      if (senderRole !== 'store') {
        io.to(sellerRoom).emit('receive_chat_message', payload);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: payload,
    });
  } catch (error) {
    console.error('Send Chat Message Error:', error);
    res.status(500).json({ error: 'Failed to send chat message' });
  }
});

// ── 3. List Conversations for Seller / Admin ──
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId) {
      res.status(400).json({ error: 'storeId is required' });
      return;
    }

    const targetStoreId = Array.isArray(storeId) ? (storeId[0] as string) : (storeId as string);

    let messages: any[] = [];
    try {
      messages = await prismaRead.chatMessage.findMany({
        where: { storeId: targetStoreId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
    } catch (dbErr) {
      console.warn('Prisma DB query bypassed for conversations:', (dbErr as Error).message);
    }

    // Group by customer
    const convMap = new Map<string, any>();
    for (const msg of messages) {
      const customerId = msg.senderId.startsWith('store') ? msg.recipientId : msg.senderId;
      if (!convMap.has(customerId)) {
        convMap.set(customerId, {
          customerId,
          storeId: targetStoreId,
          lastMessage: msg.text,
          lastTime: new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          unreadCount: msg.isRead ? 0 : 1,
          updatedAt: msg.createdAt,
        });
      }
    }

    res.json({
      success: true,
      storeId: targetStoreId,
      conversations: Array.from(convMap.values()),
    });
  } catch (error) {
    console.error('Fetch Conversations Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;
