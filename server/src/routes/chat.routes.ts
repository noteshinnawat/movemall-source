import { Router, Response } from 'express';
import { prismaRead, prismaWrite } from '../config/database.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';
import { canAccessThread, canActAsStore, ChatIdentity } from '../services/chatAccess.service.js';
import { io } from '../app.js';

const router = Router();

// แชททุกเส้นทางต้องล็อกอิน — เดิมรับ x-user-id จาก client ตรง ๆ
// ทำให้ใครก็ตั้ง header เป็น id คนอื่นแล้วอ่าน/ส่งแชทแทนเขาได้ (IDOR)
router.use(authenticateJWT);

function identityOf(req: AuthRequest): ChatIdentity {
  return { userId: req.user!.userId, role: req.user!.role };
}

// ── 1. Fetch Conversation Messages (User & Store) ──
router.get('/messages', async (req: AuthRequest, res: Response) => {
  try {
    const identity = identityOf(req);
    const { storeId } = req.query;

    if (!storeId) {
      res.status(400).json({ error: 'storeId is required' });
      return;
    }

    const targetStoreId = Array.isArray(storeId) ? (storeId[0] as string) : (storeId as string);

    // เจ้าของร้านระบุ customerId เพื่อเปิดห้องของลูกค้ารายนั้นได้
    // ผู้ซื้อทั่วไปอ่านได้เฉพาะห้องของตัวเอง แม้จะส่ง customerId มาก็ตาม
    const requestedCustomerId = (req.query.customerId as string) || identity.userId;
    if (!(await canAccessThread(identity, targetStoreId, requestedCustomerId))) {
      res.status(403).json({ error: 'Forbidden: ไม่มีสิทธิ์เข้าถึงห้องสนทนานี้' });
      return;
    }
    const threadUserId = requestedCustomerId;

    let messages: any[] = [];
    try {
      messages = await prismaRead.chatMessage.findMany({
        where: {
          storeId: targetStoreId,
          OR: [
            { senderId: threadUserId },
            { recipientId: threadUserId },
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
      userId: threadUserId,
      messages: messages.map(m => ({
        id: m.id,
        sender: m.senderId === identity.userId ? 'me' : 'store',
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
router.post('/messages', async (req: AuthRequest, res: Response) => {
  try {
    const identity = identityOf(req);
    const senderId = identity.userId;
    const { recipientId, storeId, text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }
    if (!storeId) {
      res.status(400).json({ error: 'storeId is required' });
      return;
    }

    const targetStoreId = storeId as string;

    // บทบาทผู้ส่งตัดสินจากความเป็นเจ้าของร้านจริง ไม่ใช่จาก senderRole ที่ client ส่งมา
    const actingAsStore = await canActAsStore(identity, targetStoreId);

    // ร้านตอบลูกค้า → ต้องระบุว่าตอบใคร; ลูกค้าส่งหาร้าน → ปลายทางคือร้านเสมอ
    const targetRecipientId = actingAsStore ? (recipientId as string) : targetStoreId;
    if (actingAsStore && !targetRecipientId) {
      res.status(400).json({ error: 'recipientId is required when replying as a store' });
      return;
    }
    if (!actingAsStore && recipientId && recipientId !== targetStoreId) {
      res.status(403).json({ error: 'Forbidden: ส่งข้อความได้เฉพาะถึงร้านค้าปลายทางเท่านั้น' });
      return;
    }

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
      sender: actingAsStore ? 'store' : 'me',
      senderId,
      recipientId: targetRecipientId,
      storeId: targetStoreId,
      text: text.trim(),
      time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      createdAt: now.toISOString(),
    };

    // Emit to real-time Socket.io rooms (only if requested via REST-only client)
    if (io && req.query.broadcast === 'true') {
      const customerId = actingAsStore ? targetRecipientId : senderId;
      const room = `chat:${targetStoreId}:${customerId}`;
      const sellerRoom = `seller:${targetStoreId}`;
      io.to(room).emit('receive_chat_message', payload);
      if (!actingAsStore) {
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
router.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const identity = identityOf(req);
    const { storeId } = req.query;
    if (!storeId) {
      res.status(400).json({ error: 'storeId is required' });
      return;
    }

    const targetStoreId = Array.isArray(storeId) ? (storeId[0] as string) : (storeId as string);

    // รายชื่อลูกค้าทั้งร้านเป็นข้อมูลของผู้ขาย — เดิมเปิดให้ใครก็ดึงได้
    if (!(await canActAsStore(identity, targetStoreId))) {
      res.status(403).json({ error: 'Forbidden: เฉพาะเจ้าของร้านเท่านั้น' });
      return;
    }

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
      // ข้อความจากลูกค้ามี recipientId = storeId ส่วนข้อความจากร้านมี recipientId = ลูกค้า
      const customerId = msg.recipientId === targetStoreId ? msg.senderId : msg.recipientId;
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
