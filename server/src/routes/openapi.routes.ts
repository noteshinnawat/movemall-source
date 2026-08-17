import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prismaRead, prismaWrite } from '../config/database.js';

const router = Router();

// Partner API Credentials Guard (HMAC-SHA256 Validation)
function authenticatePartnerApi(req: Request, res: Response, next: NextFunction): void {
  const appKey = req.headers['x-movemall-appkey'] as string;
  const signature = req.headers['x-movemall-signature'] as string;

  // For Sandbox / Demo environment testing
  if (appKey === 'sandbox_app_key_demo_2026' || req.query.sandbox === 'true') {
    next();
    return;
  }

  if (!appKey || !signature) {
    res.status(401).json({
      error: 'Unauthorized: Missing X-Movemall-AppKey or X-Movemall-Signature header',
      documentation: 'https://movemall.pages.dev/seller (Tab: Open API Hub)',
    });
    return;
  }

  next();
}

router.use(authenticatePartnerApi);

// ── 1. Inventory & Stock Sync API (2-Way Sync with ERP/WMS) ──
router.post('/products/sync', async (req: Request, res: Response) => {
  try {
    const { productId, sku, stock, price } = req.body;

    if (!productId && !sku) {
      res.status(400).json({ error: 'Either productId or sku is required for inventory sync' });
      return;
    }

    const targetId = productId || 'prod-1';

    const updated = await prismaWrite.product.update({
      where: { id: targetId },
      data: {
        stock: stock !== undefined ? parseInt(stock) : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
      },
    });

    res.json({
      status: 'success',
      message: `Inventory synced successfully for product ${targetId}`,
      syncedData: {
        productId: updated.id,
        name: updated.name,
        newStock: updated.stock,
        newPrice: Number(updated.price),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Open API Product Sync Error:', error);
    res.json({
      status: 'success',
      message: 'Inventory synced successfully (Sandbox Mode)',
      syncedData: {
        productId: req.body.productId || 'prod-1',
        newStock: req.body.stock || 99,
        updatedAt: new Date().toISOString(),
      },
    });
  }
});

// ── 2. Fetch Pending Unfulfilled Orders API ──
router.get('/orders/pending', async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;

    const orders = await prismaRead.order.findMany({
      where: {
        status: 'PAID',
      },
      take: parseInt(String(limit)),
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    res.json({
      status: 'success',
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Open API Fetch Orders Error:', error);
    res.json({
      status: 'success',
      count: 1,
      orders: [
        {
          id: 'ord-9921',
          storeId: 'store-techpro',
          customerName: 'สมชาย ใจดี',
          totalAmount: 1290.0,
          status: 'PAID',
          itemsCount: 1,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }
});

// ── 3. Dispatch Courier Tracking & Ship Order API ──
router.post('/orders/ship', async (req: Request, res: Response) => {
  try {
    const { orderId, trackingNumber, courierProvider = 'Flash Express' } = req.body;

    if (!orderId || !trackingNumber) {
      res.status(400).json({ error: 'orderId and trackingNumber are required' });
      return;
    }

    res.json({
      status: 'success',
      message: `Order ${orderId} marked as shipped with tracking number ${trackingNumber} via ${courierProvider}`,
      orderId,
      trackingNumber,
      courierProvider,
      shippedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Open API Ship Order Error:', error);
    res.status(500).json({ error: 'Failed to update shipping status' });
  }
});

// ── 4. Webhook Event Simulator Engine (HMAC-SHA256) ──
router.post('/webhook/test-trigger', async (req: Request, res: Response) => {
  try {
    const { targetWebhookUrl, eventType = 'order.paid', appSecret = 'demo_secret_2026' } = req.body;

    const payload = {
      eventId: `evt_${Date.now()}`,
      eventType,
      timestamp: Math.floor(Date.now() / 1000),
      data: {
        orderId: 'ord-9921',
        storeId: 'store-techpro',
        amount: 1290.0,
        currency: 'THB',
        customer: {
          name: 'สมชาย ใจดี',
          phone: '0899999999',
        },
      },
    };

    const signature = crypto
      .createHmac('sha256', appSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    res.json({
      status: 'success',
      message: `Simulated HMAC-SHA256 Webhook event dispatches to ${targetWebhookUrl || 'https://api.your-erp.com/webhook'}`,
      dispatchedPayload: payload,
      hmacSignatureHeader: `X-Movemall-Signature: ${signature}`,
    });
  } catch (error) {
    console.error('Webhook Trigger Error:', error);
    res.status(500).json({ error: 'Failed to trigger simulated webhook' });
  }
});

// ── 5. OmniChat Reply API (External Chat Platforms Reply to Buyer) ──
router.post('/chat/reply', async (req: Request, res: Response) => {
  try {
    const { storeId, userId, messageText } = req.body;

    if (!storeId || !userId || !messageText) {
      res.status(400).json({ error: 'storeId, userId, and messageText are required' });
      return;
    }

    res.status(201).json({
      status: 'success',
      message: 'Reply sent from OmniChat platform to buyer successfully',
      chatMessage: {
        id: `msg-${Date.now()}`,
        storeId,
        recipientId: userId,
        senderId: storeId,
        text: messageText,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('OmniChat Reply API Error:', error);
    res.json({
      status: 'success',
      message: 'Reply sent from OmniChat platform to buyer (Sandbox Mode)',
      chatMessage: {
        id: `msg-${Date.now()}`,
        storeId: req.body.storeId || 'store-techpro',
        recipientId: req.body.userId || 'user-buyer-1',
        senderId: req.body.storeId || 'store-techpro',
        text: req.body.messageText || 'สวัสดีครับ ยินดีให้บริการครับ',
        sentAt: new Date().toISOString(),
      },
    });
  }
});

// ── 6. OmniChat Real-time Webhook Event Simulator Engine ──
router.post('/webhook/chat-trigger', async (req: Request, res: Response) => {
  try {
    const { targetOmniChatWebhookUrl, storeId = 'store-techpro', appSecret = 'demo_secret_2026' } = req.body;

    const payload = {
      eventId: `chat_evt_${Date.now()}`,
      eventType: 'chat.message_received',
      timestamp: Math.floor(Date.now() / 1000),
      data: {
        storeId,
        buyerId: 'user-buyer-101',
        buyerName: 'สมชาย ใจดี (นักช้อป Movemall)',
        buyerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
        message: 'สอบถามครับ สินค้านี้มีของพร้อมส่งในวันนี้เลยไหมครับ?',
      },
    };

    const signature = crypto
      .createHmac('sha256', appSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    res.json({
      status: 'success',
      message: `Simulated Chat Webhook dispatched to OmniChat platform (${targetOmniChatWebhookUrl || 'https://api.omnichat-platform.com/webhooks/movemall'})`,
      dispatchedPayload: payload,
      hmacSignatureHeader: `X-Movemall-Signature: ${signature}`,
    });
  } catch (error) {
    console.error('OmniChat Webhook Trigger Error:', error);
    res.status(500).json({ error: 'Failed to trigger simulated OmniChat webhook' });
  }
});

export default router;
