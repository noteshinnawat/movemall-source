import { Router, Response } from 'express';
import { prismaWrite, prismaRead } from '../config/database.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { invalidateCachePattern } from '../config/redis.js';

const router = Router();

// ── 1. Create New Order (Atomic Transaction) ──
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      items,
      paymentMethod,
      shippingAddress,
      coinsUsed = 0,
      discountAmount = 0,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Order must contain at least 1 item' });
      return;
    }

    if (!paymentMethod || !shippingAddress) {
      res.status(400).json({ error: 'Payment method and shipping address are required' });
      return;
    }

    // Atomic Prisma Transaction
    const result = await prismaWrite.$transaction(async (tx) => {
      // 1. Verify user & coin balance if coinsUsed > 0
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      if (coinsUsed > 0 && user.coinsBalance < coinsUsed) {
        throw new Error('Insufficient Coins balance');
      }

      // 2. Fetch products & verify stock
      const productIds = items.map((i: { productId: string }) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      const orderItemData = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product ID ${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Product "${product.name}" is out of stock`);
        }

        const itemTotal = Number(product.price) * item.quantity;
        subtotal += itemTotal;

        orderItemData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });
      }

      // 3. Calculate final amounts
      const shippingCost = subtotal > 500 ? 0 : 45; // Free shipping over 500
      const coinDiscount = coinsUsed * 1; // 1 Coin = 1 THB
      const totalAmount = Math.max(0, subtotal + shippingCost - discountAmount - coinDiscount);

      // 4. Create Order record
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingCost,
          discountAmount: discountAmount + coinDiscount,
          coinsUsed,
          paymentMethod: paymentMethod as PaymentMethod,
          status: paymentMethod === 'COD' || paymentMethod === 'PAYLATER' ? OrderStatus.PAID : OrderStatus.PENDING,
          shippingAddress: shippingAddress || {},
          items: {
            create: orderItemData,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 5. Decrement stock & Increment sales count
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity },
          },
        });
      }

      // 6. Deduct Coins if used
      if (coinsUsed > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            coinsBalance: { decrement: coinsUsed },
          },
        });

        await tx.coinLedger.create({
          data: {
            userId,
            amount: -coinsUsed,
            source: `order_discount:${order.id.slice(0, 8)}`,
          },
        });
      }

      // 7. Create initial tracking log
      await tx.trackingLog.create({
        data: {
          orderId: order.id,
          trackingNumber: `MM-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          courierProvider: 'Flash Express',
          timeline: [
            {
              time: new Date().toISOString(),
              status: 'ORDER_PLACED',
              location: 'Movemall Warehouse (BKK)',
              description: 'Order created successfully. Preparing items for shipment.',
            },
          ],
        },
      });

      return order;
    });

    // Invalidate product cache
    await invalidateCachePattern('products:*');
    await invalidateCachePattern('product:detail:*');

    res.status(201).json({
      message: 'Order created successfully',
      order: result,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(400).json({ error: (error as Error).message || 'Failed to create order' });
  }
});

// ── 2. Get User Orders ──
router.get('/my-orders', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const orders = await prismaRead.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                price: true,
              },
            },
          },
        },
      },
    });

    res.json({ orders });
  } catch (error) {
    console.error('Fetch My Orders Error:', error);
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

// ── 3. Get Single Order Detail ──
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user?.userId;

    const order = await prismaRead.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        tracking: true,
        payment: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Verify ownership unless admin
    if (order.userId !== userId && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: Access denied' });
      return;
    }

    res.json({ order });
  } catch (error) {
    console.error('Fetch Order Detail Error:', error);
    res.status(500).json({ error: 'Failed to fetch order detail' });
  }
});

export default router;
