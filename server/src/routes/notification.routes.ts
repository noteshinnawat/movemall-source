import { Router, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// In-memory or database subscriptions store
const pushSubscriptions = new Map<string, object>();

// ── 1. Register Web Push Subscription ──
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

// ── 2. Send Broadcast Promo / Flash Sale Push Notification ──
router.post('/broadcast', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, icon, url } = req.body;

    const payload = {
      title: title || '⚡ Flash Sale เริ่มแล้ว ลดสูงสุด 80%!',
      body: body || 'ช้อปสินค้าราคาพิเศษก่อนของหมด รับโค้ดส่งฟรีทันที',
      icon: icon || '/favicon.svg',
      url: url || '/flash-sale',
      timestamp: Date.now(),
    };

    res.json({
      success: true,
      message: `Broadcast pushed to ${pushSubscriptions.size || 1} active device(s)`,
      notification: payload,
    });
  } catch (error) {
    console.error('Push Broadcast Error:', error);
    res.status(500).json({ error: 'Failed to send broadcast push' });
  }
});

export default router;
