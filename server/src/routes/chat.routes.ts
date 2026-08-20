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

// ── 3. รายการห้องแชทของผู้ซื้อที่ล็อกอินอยู่ ──
//
// เดิมฝั่งผู้ซื้อไม่มี endpoint นี้ หน้าแชทจึงต้องเดารายชื่อห้องจาก static store list
// ทำให้โชว์ทุกร้านในระบบเป็นห้องแชท แทนที่จะเป็นร้านที่เคยคุยกันจริง
router.get('/my-conversations', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = identityOf(req);

    let messages: any[] = [];
    let unreadRows: any[] = [];
    try {
      [messages, unreadRows] = await Promise.all([
        prismaRead.chatMessage.findMany({
          where: { OR: [{ senderId: userId }, { recipientId: userId }] },
          orderBy: { createdAt: 'desc' },
          take: 300,
        }),
        // นับ unread แยกจากหน้าต่าง 300 ข้อความล่าสุด เพื่อไม่ให้ตกหล่นเมื่อแชทยาว
        prismaRead.chatMessage.groupBy({
          by: ['storeId'],
          where: { recipientId: userId, isRead: false },
          _count: { _all: true },
        }),
      ]);
    } catch (dbErr) {
      console.warn('Prisma DB query bypassed for my-conversations:', (dbErr as Error).message);
    }

    const unreadByStore = new Map<string, number>();
    for (const row of unreadRows) {
      if (row.storeId) unreadByStore.set(row.storeId, row._count?._all || 0);
    }

    // จัดกลุ่มตามร้าน โดยข้อความถูกเรียงใหม่→เก่ามาแล้ว ตัวแรกที่เจอจึงเป็นข้อความล่าสุด
    const convMap = new Map<string, any>();
    for (const msg of messages) {
      if (!msg.storeId || convMap.has(msg.storeId)) continue;
      convMap.set(msg.storeId, {
        storeId: msg.storeId,
        lastMessage: msg.text,
        lastMessageFromMe: msg.senderId === userId,
        lastMessageAt: msg.createdAt,
        lastMessageTime: new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        unreadCount: unreadByStore.get(msg.storeId) || 0,
      });
    }

    // เติมชื่อ/โลโก้ร้านจาก DB — ร้านที่ไม่มีระเบียนจริงจะได้ค่า null แล้วให้ client เติมเอง
    const storeIds = Array.from(convMap.keys());
    if (storeIds.length > 0) {
      try {
        const storeRows = await prismaRead.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, name: true, logo: true, isVerified: true, isMall: true },
        });
        for (const store of storeRows) {
          const conv = convMap.get(store.id);
          if (conv) {
            conv.storeName = store.name;
            conv.storeLogo = store.logo;
            conv.isVerified = store.isVerified;
            conv.isMall = store.isMall;
          }
        }
      } catch (dbErr) {
        console.warn('Store lookup bypassed for my-conversations:', (dbErr as Error).message);
      }
    }

    const conversations = Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Fetch My Conversations Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// ── 4. ทำเครื่องหมายว่าอ่านข้อความในห้องนี้แล้ว ──
//
// อัปเดตได้เฉพาะข้อความที่ส่งถึงตัวเอง จึงไม่ต้องตรวจ ownership เพิ่ม
// (ยิงด้วย storeId ของคนอื่นก็ไม่มีแถวไหนเข้าเงื่อนไข)
router.patch('/conversations/:storeId/read', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = identityOf(req);
    const storeId = String(req.params.storeId || '');

    if (!storeId) {
      res.status(400).json({ error: 'storeId is required' });
      return;
    }

    let updated = 0;
    try {
      const result = await prismaWrite.chatMessage.updateMany({
        where: { storeId, recipientId: userId, isRead: false },
        data: { isRead: true },
      });
      updated = result.count;
    } catch (dbErr) {
      console.warn('Prisma Write bypassed for mark-as-read:', (dbErr as Error).message);
    }

    res.json({ success: true, storeId, markedAsRead: updated });
  } catch (error) {
    console.error('Mark Conversation Read Error:', error);
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

// ── 5. List Conversations for Seller / Admin ──
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
