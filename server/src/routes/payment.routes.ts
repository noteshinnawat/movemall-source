import { Router, Response } from 'express';
import { prismaWrite, prismaRead } from '../config/database.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';
import { OrderStatus } from '@prisma/client';
import { PAYMENT_WEBHOOK_SECRET } from '../config/env.js';
import crypto from 'crypto';

const router = Router();

// ── 1. Generate PromptPay Dynamic QR Code (Payload with CRC16 Checksum) ──
router.post('/promptpay/create', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const order = await prismaRead.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.userId !== req.user?.userId) {
      res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้' });
      return;
    }

    // ยอดเงินต้องมาจากออเดอร์ในฐานข้อมูลเท่านั้น ไม่รับค่าจาก request body
    // มิฉะนั้นผู้ซื้อสร้าง QR ยอด 1 บาทสำหรับออเดอร์หลักหมื่นได้
    const amount = Number(order.totalAmount);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 Minutes TTL
    const transactionId = `txn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // PromptPay Standard Tag Format (EMVCo EMV-compliant simulation)
    const promptPayPayload = `00020101021229370016A000000677010111011300668912345675802TH5303764540${Number(amount).toFixed(2).length}${Number(amount).toFixed(2)}6304`;

    res.json({
      orderId,
      transactionId,
      amount: Number(amount),
      currency: 'THB',
      payload: promptPayPayload,
      expiresAt: expiresAt.toISOString(),
      qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(promptPayPayload)}`,
    });
  } catch (error) {
    console.error('PromptPay Create Error:', error);
    res.status(500).json({ error: 'Failed to generate PromptPay QR' });
  }
});

// ── 2. Payment Gateway Webhook (Omise / GB Prime Pay / Stripe HMAC Verified) ──
// ⚠️ endpoint นี้เปิดสาธารณะ (ไม่มี JWT) เพราะผู้ให้บริการชำระเงินเป็นผู้เรียก
//    ความปลอดภัยทั้งหมดจึงอยู่ที่ลายเซ็น HMAC — ต้องบังคับตรวจเสมอ ห้ามข้ามเด็ดขาด
router.post('/webhook', async (req, res: Response) => {
  try {
    const signature = req.headers['x-payment-signature'];

    if (!PAYMENT_WEBHOOK_SECRET) {
      console.error('Payment Webhook: ยังไม่ได้ตั้ง PAYMENT_WEBHOOK_SECRET จึงปฏิเสธทุก request');
      res.status(503).json({ error: 'Webhook verification is not configured' });
      return;
    }

    if (!signature || typeof signature !== 'string') {
      res.status(401).json({ error: 'Missing X-Payment-Signature header' });
      return;
    }

    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      res.status(400).json({ error: 'Unable to read request body for signature verification' });
      return;
    }

    const expected = crypto.createHmac('sha256', PAYMENT_WEBHOOK_SECRET).update(rawBody).digest('hex');
    const received = signature.trim().replace(/^sha256=/, '');

    // เทียบแบบ constant-time เพื่อไม่ให้เวลาที่ใช้เทียบรั่วข้อมูลลายเซ็นที่ถูกต้อง
    const expectedBuf = Buffer.from(expected, 'utf8');
    const receivedBuf = Buffer.from(received, 'utf8');
    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      console.warn('Payment Webhook: ลายเซ็นไม่ถูกต้อง — ปฏิเสธ request');
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    const { event, data } = req.body ?? {};

    if (event === 'charge.complete' || event === 'payment.success') {
      const { orderId, transactionId, amount } = data ?? {};

      if (!orderId) {
        res.status(400).json({ error: 'Missing orderId in webhook payload' });
        return;
      }

      const order = await prismaRead.order.findUnique({
        where: { id: orderId },
        include: { payment: true },
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // กัน replay: ถ้าชำระเงินสำเร็จไปแล้วให้ตอบ 200 แล้วจบ ไม่ทำรายการซ้ำ
      if (order.payment?.status === 'successful') {
        res.json({ received: true, alreadyProcessed: true, timestamp: new Date().toISOString() });
        return;
      }

      // ยอดที่ผู้ให้บริการแจ้งมาต้องตรงกับยอดของออเดอร์ (กันการจ่ายน้อยกว่าที่สั่ง)
      const paidAmount = Number(amount);
      const orderAmount = Number(order.totalAmount);
      if (!Number.isFinite(paidAmount) || Math.abs(paidAmount - orderAmount) > 0.01) {
        console.warn(`Payment Webhook: ยอดไม่ตรง (ออเดอร์ ${orderAmount} / แจ้งมา ${amount}) order=${orderId}`);
        res.status(400).json({ error: 'Paid amount does not match order total' });
        return;
      }

      await prismaWrite.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PAID },
        });

        await tx.paymentTransaction.upsert({
          where: { orderId },
          create: {
            orderId,
            providerRef: transactionId || `txn_${Date.now()}`,
            amount: paidAmount,
            status: 'successful',
            paidAt: new Date(),
          },
          update: {
            providerRef: transactionId || undefined,
            status: 'successful',
            paidAt: new Date(),
          },
        });
      });
    }

    res.json({ received: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Payment Webhook Error:', error);
    res.status(500).json({ error: 'Failed to process payment webhook' });
  }
});

// ── 3. Bank Transfer Slip Verification (Automated PromptPay Slip OCR) ──
// ⚠️ ปิดใช้งานชั่วคราว: เดิมโค้ดฮาร์ดโค้ด isValid = true และไม่ตรวจว่าออเดอร์เป็นของผู้เรียก
//    ทำให้ผู้ใช้คนใดก็ได้เปลี่ยนออเดอร์ของใครก็ได้เป็น PAID โดยไม่ต้องโอนเงินจริง
//    จะเปิดใช้อีกครั้งเมื่อต่อ SlipOK / EasySlip ของจริงแล้วเท่านั้น
router.post('/verify-slip', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { orderId } = req.body;

    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const order = await prismaRead.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // ตรวจสิทธิ์ก่อนเสมอ แม้ตัว provider จะยังไม่พร้อมใช้งาน
    if (order.userId !== userId) {
      res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้' });
      return;
    }

    const slipProviderConfigured = Boolean(process.env.SLIP_VERIFY_API_KEY);
    if (!slipProviderConfigured) {
      res.status(503).json({
        error: 'ระบบตรวจสอบสลิปอัตโนมัติยังไม่เปิดให้บริการ กรุณาชำระผ่าน PromptPay QR หรือติดต่อฝ่ายบริการลูกค้า',
      });
      return;
    }

    // TODO: เรียก API ของผู้ให้บริการตรวจสลิปจริง แล้วเทียบยอด/เลขอ้างอิง/เวลาโอน
    //       กับ order.totalAmount ก่อนเปลี่ยนสถานะเป็น PAID
    //       ห้ามเปลี่ยนสถานะออเดอร์จนกว่าจะได้ผลยืนยันจาก provider
    res.status(503).json({ error: 'Slip verification provider is not implemented yet' });
  } catch (error) {
    console.error('Slip Verification Error:', error);
    res.status(500).json({ error: 'Failed to verify transfer slip' });
  }
});

// ── 4. Refund Order ──
router.post('/refund', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, reason } = req.body;
    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const order = await prismaRead.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // ── ตรวจสิทธิ์: เจ้าของออเดอร์ หรือแอดมินฝ่ายการเงินเท่านั้น ──
    // เดิมผู้ใช้ที่ล็อกอินคนใดก็ได้สั่งคืนเงินออเดอร์ของใครก็ได้
    const requesterRole = req.user?.role ?? '';
    const isFinanceAdmin = ['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'].includes(requesterRole);
    if (order.userId !== req.user?.userId && !isFinanceAdmin) {
      res.status(403).json({ error: 'ไม่มีสิทธิ์ขอคืนเงินสำหรับคำสั่งซื้อนี้' });
      return;
    }

    // ── กันการคืนเงินซ้ำ ──
    // เดิมไม่ตรวจสถานะ ทำให้เรียกซ้ำแล้วได้เหรียญคืนและสต็อกเพิ่มทุกครั้งแบบไม่จำกัด
    if (order.status === OrderStatus.CANCELLED) {
      res.status(409).json({ error: 'คำสั่งซื้อนี้ถูกยกเลิก/คืนเงินไปแล้ว' });
      return;
    }

    // ออเดอร์ที่ส่งของแล้วต้องให้แอดมินเป็นผู้พิจารณา ลูกค้ายกเลิกเองไม่ได้
    const shippedStates: OrderStatus[] = [OrderStatus.SHIPPED, OrderStatus.DELIVERED];
    if (shippedStates.includes(order.status) && !isFinanceAdmin) {
      res.status(409).json({ error: 'คำสั่งซื้อจัดส่งแล้ว กรุณาติดต่อฝ่ายบริการลูกค้าเพื่อขอคืนเงิน' });
      return;
    }

    // Atomic Refund & Restock
    await prismaWrite.$transaction(async (tx) => {
      // ล็อกด้วยเงื่อนไขสถานะ: ถ้ามี request ซ้อนเข้ามาพร้อมกัน จะมีเพียงรายการเดียวที่ผ่าน
      const cancelled = await tx.order.updateMany({
        where: { id: orderId, status: { not: OrderStatus.CANCELLED } },
        data: { status: OrderStatus.CANCELLED },
      });

      if (cancelled.count === 0) {
        throw new Error('ORDER_ALREADY_REFUNDED');
      }

      // Restock inventory
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            salesCount: { decrement: item.quantity },
          },
        });
      }

      // Refund Coins if used
      if (order.coinsUsed > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { coinsBalance: { increment: order.coinsUsed } },
        });

        await tx.coinLedger.create({
          data: {
            userId: order.userId,
            amount: order.coinsUsed,
            source: `refund_order:${orderId.slice(0, 8)}`,
          },
        });
      }
    });

    res.json({
      message: 'Order refunded successfully and stock replenished',
      orderId,
      refundReason: reason || 'Customer requested refund',
    });
  } catch (error) {
    if ((error as Error).message === 'ORDER_ALREADY_REFUNDED') {
      res.status(409).json({ error: 'คำสั่งซื้อนี้ถูกคืนเงินไปแล้ว' });
      return;
    }
    console.error('Refund Error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

export default router;
