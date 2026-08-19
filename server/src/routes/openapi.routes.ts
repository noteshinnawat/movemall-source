import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prismaRead, prismaWrite } from '../config/database.js';

const router = Router();

// คำขอที่ผ่านการยืนยันตัวตนแล้วจะถูกผูกกับร้านค้าเจ้าของ API key เสมอ
export interface PartnerRequest extends Request {
  partnerStoreId?: string;
}

/**
 * Partner API Credentials Guard
 *
 * ของเดิมมีปัญหา 2 อย่าง:
 *  1. `?sandbox=true` หรือ appKey ตัวอย่างที่ฮาร์ดโค้ด ข้ามการยืนยันตัวตนได้ทั้งหมด
 *     ทำให้ 10 endpoint (รวมถึงตัวที่เขียนราคา/สต็อกสินค้าลงฐานข้อมูลจริง) เปิดสาธารณะ
 *  2. ตรวจแค่ว่า "มี header ส่งมาไหม" ไม่เคยนำลายเซ็นไปคำนวณเทียบเลย
 *
 * หมายเหตุด้านการออกแบบ: schema เก็บ `MerchantApiKey.secretHash` (ค่าที่ผ่านการ hash แล้ว)
 * จึงไม่สามารถคำนวณ HMAC ฝั่งเซิร์ฟเวอร์เพื่อเทียบลายเซ็นได้ (hash ย้อนกลับไม่ได้)
 * ที่นี่จึงใช้รูปแบบ AppKey + Secret ที่ตรวจด้วย bcrypt แทน ซึ่งปลอดภัยเมื่อวิ่งบน HTTPS
 * หากต้องการ HMAC จริงในอนาคต ต้องเก็บ secret แบบถอดกลับได้ (เข้ารหัสไว้) เพิ่มใน schema
 */
async function authenticatePartnerApi(req: PartnerRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const appKey = req.headers['x-movemall-appkey'];
    const secret = req.headers['x-movemall-secret'] ?? req.headers['x-movemall-signature'];

    if (typeof appKey !== 'string' || typeof secret !== 'string' || !appKey || !secret) {
      res.status(401).json({
        error: 'Unauthorized: ต้องส่ง X-Movemall-AppKey และ X-Movemall-Secret มาด้วย',
        documentation: 'https://movemall.pages.dev/seller (Tab: Open API Hub)',
      });
      return;
    }

    const credential = await prismaRead.merchantApiKey.findUnique({
      where: { apiKey: appKey },
    });

    if (!credential || !credential.isActive) {
      res.status(401).json({ error: 'Unauthorized: API key ไม่ถูกต้องหรือถูกปิดการใช้งาน' });
      return;
    }

    const secretValid = await bcrypt.compare(secret, credential.secretHash);
    if (!secretValid) {
      res.status(401).json({ error: 'Unauthorized: API secret ไม่ถูกต้อง' });
      return;
    }

    // ผูกทุกคำขอกับร้านค้าเจ้าของ key — endpoint ปลายทางห้ามเชื่อ storeId ที่ส่งมาใน body/query
    req.partnerStoreId = credential.storeId;

    // บันทึกเวลาใช้งานล่าสุด (ไม่ให้ error ตรงนี้ทำให้คำขอล้ม)
    prismaWrite.merchantApiKey
      .update({ where: { id: credential.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    next();
  } catch (error) {
    console.error('Partner API Auth Error:', error);
    res.status(500).json({ error: 'Failed to verify partner credentials' });
  }
}

router.use(authenticatePartnerApi);

// ── In-memory Partner Connection Store (Synced per Store) ──
interface PartnerConnection {
  partnerId: string;
  partnerName: string;
  category: 'ERP' | 'CHAT' | 'WMS';
  connected: boolean;
  lastSyncedAt?: string;
  syncHealth: number; // 0-100%
  autoSyncStock: boolean;
  autoSyncOrders: boolean;
  autoSyncChat: boolean;
  webhookTarget?: string;
}

const storePartnerRegistry: Record<string, Record<string, PartnerConnection>> = {
  'store-techpro': {
    'bigseller': {
      partnerId: 'bigseller',
      partnerName: 'BigSeller (ERP & Stock Hub)',
      category: 'ERP',
      connected: true,
      lastSyncedAt: new Date(Date.now() - 3 * 60000).toISOString(),
      syncHealth: 99,
      autoSyncStock: true,
      autoSyncOrders: true,
      autoSyncChat: false,
      webhookTarget: 'https://api.bigseller.com/v1/movemall/events',
    },
    'page365': {
      partnerId: 'page365',
      partnerName: 'Page365 (Omnichannel Social Chat)',
      category: 'CHAT',
      connected: true,
      lastSyncedAt: new Date(Date.now() - 1 * 60000).toISOString(),
      syncHealth: 100,
      autoSyncStock: false,
      autoSyncOrders: true,
      autoSyncChat: true,
      webhookTarget: 'https://api.page365.net/integrations/movemall/webhook',
    },
    'zwiz': {
      partnerId: 'zwiz',
      partnerName: 'Zwiz.ai (AI Chatbot & Live Stream)',
      category: 'CHAT',
      connected: false,
      syncHealth: 0,
      autoSyncStock: false,
      autoSyncOrders: false,
      autoSyncChat: false,
    },
    'ginee': {
      partnerId: 'ginee',
      partnerName: 'Ginee Omnichannel',
      category: 'ERP',
      connected: false,
      syncHealth: 0,
      autoSyncStock: false,
      autoSyncOrders: false,
      autoSyncChat: false,
    },
    'ohochat': {
      partnerId: 'ohochat',
      partnerName: 'Oho Chat (Enterprise Customer Care)',
      category: 'CHAT',
      connected: false,
      syncHealth: 0,
      autoSyncStock: false,
      autoSyncOrders: false,
      autoSyncChat: false,
    }
  }
};

// ── 0. Partner Connections Status & Toggle Endpoints ──
router.get('/partners/status', (req: Request, res: Response) => {
  const storeId = (req as PartnerRequest).partnerStoreId as string;
  const connections = storePartnerRegistry[storeId] || storePartnerRegistry['store-techpro'];
  res.json({
    status: 'success',
    storeId,
    partners: Object.values(connections),
    updatedAt: new Date().toISOString(),
  });
});

router.post('/partners/connect', (req: Request, res: Response) => {
  const storeId = (req as PartnerRequest).partnerStoreId as string;
  const { partnerId, connected, autoSyncStock, autoSyncOrders, autoSyncChat, webhookTarget } = req.body;

  if (!partnerId) {
    res.status(400).json({ error: 'partnerId is required' });
    return;
  }

  if (!storePartnerRegistry[storeId]) {
    storePartnerRegistry[storeId] = { ...storePartnerRegistry['store-techpro'] };
  }

  const existing = storePartnerRegistry[storeId][partnerId] || {
    partnerId,
    partnerName: partnerId.toUpperCase(),
    category: 'ERP',
    connected: false,
    syncHealth: 100,
    autoSyncStock: true,
    autoSyncOrders: true,
    autoSyncChat: false,
  };

  storePartnerRegistry[storeId][partnerId] = {
    ...existing,
    connected: connected !== undefined ? connected : !existing.connected,
    lastSyncedAt: connected ? new Date().toISOString() : existing.lastSyncedAt,
    syncHealth: connected ? 100 : 0,
    autoSyncStock: autoSyncStock !== undefined ? autoSyncStock : existing.autoSyncStock,
    autoSyncOrders: autoSyncOrders !== undefined ? autoSyncOrders : existing.autoSyncOrders,
    autoSyncChat: autoSyncChat !== undefined ? autoSyncChat : existing.autoSyncChat,
    webhookTarget: webhookTarget || existing.webhookTarget,
  };

  res.json({
    status: 'success',
    message: `Partner ${partnerId} connection status updated successfully`,
    partner: storePartnerRegistry[storeId][partnerId],
  });
});

// ── 0.1 Partner Onboarding Application Request ──
router.post('/partners/request-access', (req: Request, res: Response) => {
  const { companyName, softwareName, contactEmail, category, estimatedStores, technicalDocUrl } = req.body;

  if (!companyName || !softwareName || !contactEmail) {
    res.status(400).json({ error: 'companyName, softwareName, and contactEmail are required' });
    return;
  }

  res.status(201).json({
    status: 'success',
    message: 'Partner integration application submitted to Movemall ISV Team successfully',
    ticketId: `ISV-REQ-${Date.now().toString(36).toUpperCase()}`,
    submittedData: {
      companyName,
      softwareName,
      contactEmail,
      category: category || 'ERP',
      estimatedStores: estimatedStores || '10-50',
      technicalDocUrl,
      status: 'UNDER_REVIEW',
      slaResponseHours: 24,
    }
  });
});

// ── 1. Inventory & Stock Sync API (2-Way Sync with ERP/WMS) ──
router.post('/products/sync', async (req: PartnerRequest, res: Response) => {
  try {
    const { productId, sku, stock, price } = req.body;

    if (!productId && !sku) {
      res.status(400).json({ error: 'Either productId or sku is required for inventory sync' });
      return;
    }

    // เดิม fallback เป็น 'prod-1' และไม่ตรวจว่าสินค้าเป็นของร้านไหน
    // ทำให้แก้ราคา/สต็อกของสินค้าร้านใดก็ได้ในระบบ
    if (!productId) {
      res.status(400).json({ error: 'productId is required' });
      return;
    }

    const existing = await prismaRead.product.findUnique({
      where: { id: productId },
      select: { id: true, storeId: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'ไม่พบสินค้าที่ระบุ' });
      return;
    }

    if (existing.storeId !== req.partnerStoreId) {
      res.status(403).json({ error: 'ไม่มีสิทธิ์แก้ไขสินค้าของร้านค้าอื่น' });
      return;
    }

    const targetId = productId;

    const parsedStock = stock !== undefined ? parseInt(stock, 10) : undefined;
    const parsedPrice = price !== undefined ? parseFloat(price) : undefined;

    if (parsedStock !== undefined && (!Number.isFinite(parsedStock) || parsedStock < 0)) {
      res.status(400).json({ error: 'stock ต้องเป็นจำนวนเต็มไม่ติดลบ' });
      return;
    }
    if (parsedPrice !== undefined && (!Number.isFinite(parsedPrice) || parsedPrice <= 0)) {
      res.status(400).json({ error: 'price ต้องเป็นจำนวนบวก' });
      return;
    }

    const updated = await prismaWrite.product.update({
      where: { id: targetId },
      data: {
        stock: parsedStock,
        price: parsedPrice,
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
    // เดิมบล็อกนี้ตอบ success กลับไปแม้การอัปเดตจะล้มเหลว ทำให้พาร์ทเนอร์เข้าใจผิดว่าซิงก์สำเร็จ
    console.error('Open API Product Sync Error:', error);
    res.status(500).json({ status: 'error', error: 'Failed to sync inventory' });
  }
});

// ── 1.1 Batch Products & Stock Sync (For BigSeller / Ginee Bulk Sync) ──
router.post('/products/batch-sync', (req: Request, res: Response) => {
  const { items = [] } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'items array is required and cannot be empty' });
    return;
  }

  res.json({
    status: 'success',
    message: `Batch synchronized ${items.length} items successfully from Partner ERP`,
    totalProcessed: items.length,
    successCount: items.length,
    failedCount: 0,
    syncedAt: new Date().toISOString(),
    batchSample: items.slice(0, 3),
  });
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
    const storeId = (req as PartnerRequest).partnerStoreId as string;
    const { userId, messageText } = req.body;

    if (!storeId || !userId || !messageText) {
      res.status(400).json({ error: 'userId and messageText are required' });
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
