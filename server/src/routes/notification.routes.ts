import { Router, Response } from 'express';
import { prismaWrite, prismaRead } from '../config/database.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.middleware.js';
import { io } from '../app.js';

const router = Router();

// In-memory or database subscriptions store for Web Push
const pushSubscriptions = new Map<string, object>();

export interface CreateNotificationParams {
  userId: string;
  category: 'orders' | 'promos' | 'live' | 'vouchers';
  title: string;
  body: string;
  link: string;
}

/**
 * Helper function to create notification and emit real-time WebSocket event
 */
export async function sendNotificationToUser(params: CreateNotificationParams) {
  try {
    const notification = await prismaWrite.notification.create({
      data: {
        userId: params.userId,
        category: params.category,
        title: params.title,
        body: params.body,
        link: params.link,
        isRead: false,
      },
    });

    const unreadCount = await prismaRead.notification.count({
      where: { userId: params.userId, isRead: false },
    });

    // Real-time Push via Socket.io to user room
    if (io) {
      io.to(`user:${params.userId}`).emit('notification:new', notification);
      io.to(`user:${params.userId}`).emit('notification:count', { unreadCount });
    }

    return notification;
  } catch (error) {
    console.error('Send Notification Error:', error);
    return null;
  }
}

// ── 1. Get User Notifications (Paginated + Category filter + unreadCount) ──
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { category } = req.query;

    const whereCondition: { userId: string; category?: string } = { userId };
    if (category && typeof category === 'string' && category !== 'all') {
      whereCondition.category = category;
    }

    const [notifications, unreadCount] = await Promise.all([
      prismaRead.notification.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prismaRead.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ── 2. Get Unread Count Only ──
router.get('/unread-count', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const unreadCount = await prismaRead.notification.count({
      where: { userId, isRead: false },
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({ error: 'Failed to count unread notifications' });
  }
});

// ── 3. Mark Single Notification as Read ──
router.patch('/:id/read', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!userId || !id) {
      res.status(400).json({ error: 'Notification ID is required' });
      return;
    }

    await prismaWrite.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    const unreadCount = await prismaRead.notification.count({
      where: { userId, isRead: false },
    });

    if (io) {
      io.to(`user:${userId}`).emit('notification:count', { unreadCount });
    }

    res.json({ success: true, id, unreadCount });
  } catch (error) {
    console.error('Mark Read Error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// ── 4. Mark All Notifications as Read ──
router.patch('/read-all', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { category } = req.body;

    const whereCondition: { userId: string; isRead: boolean; category?: string } = {
      userId,
      isRead: false,
    };

    if (category && category !== 'all') {
      whereCondition.category = category;
    }

    await prismaWrite.notification.updateMany({
      where: whereCondition,
      data: { isRead: true },
    });

    const unreadCount = await prismaRead.notification.count({
      where: { userId, isRead: false },
    });

    if (io) {
      io.to(`user:${userId}`).emit('notification:count', { unreadCount });
    }

    res.json({ success: true, unreadCount: 0 });
  } catch (error) {
    console.error('Mark All Read Error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// ── 5. Create System Notification ──
router.post('/create', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { targetUserId, category, title, body, link } = req.body;
    const userId = targetUserId || req.user?.userId;

    if (!userId || !title || !body) {
      res.status(400).json({ error: 'targetUserId, title, and body are required' });
      return;
    }

    const notification = await sendNotificationToUser({
      userId,
      category: category || 'promos',
      title,
      body,
      link: link || '/notifications',
    });

    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error('Create Notification Error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// ── 6. Register Web Push Subscription ──
router.post('/subscribe', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'guest';
    const { subscription } = req.body;

    if (!subscription) {
      res.status(400).json({ error: 'Push subscription object is required' });
      return;
    }

    pushSubscriptions.set(userId, subscription);

    res.status(201).json({
      message: 'Push subscription registered successfully',
      registeredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Push Subscribe Error:', error);
    res.status(500).json({ error: 'Failed to register push subscription' });
  }
});

// ── 7. Send Broadcast Promo Push Notification ──
// เดิมมีแค่ authenticateJWT — ผู้ใช้ทั่วไปยิง push แจ้งเตือนถึงผู้ใช้ทุกคนบนแพลตฟอร์มได้
router.post('/broadcast', authenticateJWT, requireRole('SUPER_ADMIN', 'ADMIN', 'MARKETING_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, icon, url } = req.body;

    const payload = {
      title: title || '⚡ Flash Sale เริ่มแล้ว ลดสูงสุด 80%!',
      body: body || 'ช้อปสินค้าราคาพิเศษก่อนของหมด รับโค้ดส่งฟรีทันที',
      icon: icon || '/favicon.svg',
      url: url || '/flash-sale',
      timestamp: Date.now(),
    };

    if (io) {
      io.emit('notification:broadcast', payload);
    }

    res.json({
      success: true,
      message: `Broadcast pushed to active users`,
      notification: payload,
    });
  } catch (error) {
    console.error('Push Broadcast Error:', error);
    res.status(500).json({ error: 'Failed to send broadcast push' });
  }
});

export default router;
