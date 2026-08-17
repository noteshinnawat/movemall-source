import { Router, Response } from 'express';
import { prismaRead, prismaWrite } from '../config/database.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// ── 1. Fetch Conversation Messages (User & Store) ──
router.get('/messages', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { storeId } = req.query;

    if (!userId || !storeId) {
      res.status(400).json({ error: 'storeId is required' });
      return;
    }

    const targetStoreId = Array.isArray(storeId) ? (storeId[0] as string) : (storeId as string);

    const messages = await prismaRead.chatMessage.findMany({
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

    res.json({ messages });
  } catch (error) {
    console.error('Fetch Chat Messages Error:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// ── 2. Send New Chat Message ──
router.post('/messages', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user?.userId;
    const { recipientId, storeId, text } = req.body;

    if (!senderId || !text || !text.trim()) {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    const message = await prismaWrite.chatMessage.create({
      data: {
        senderId,
        recipientId: recipientId || 'store-admin',
        storeId: storeId || null,
        text: text.trim(),
      },
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    console.error('Send Chat Message Error:', error);
    res.status(500).json({ error: 'Failed to send chat message' });
  }
});

export default router;
