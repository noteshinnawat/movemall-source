import { Router, Request, Response } from 'express';
import { prismaRead } from '../config/database.js';
import { getCachedOrFetch } from '../config/redis.js';

const router = Router();

// ── 1. Get List of Stores / Brands ──
router.get('/', async (req: Request, res: Response) => {
  try {
    const { isMall, search } = req.query;

    const cacheKey = `stores:mall=${isMall || 'all'}:s=${search || ''}`;

    const stores = await getCachedOrFetch(cacheKey, 300, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};
      if (isMall === 'true') {
        where.isMall = true;
      }
      if (search) {
        where.name = { contains: search as string, mode: 'insensitive' };
      }

      return await prismaRead.store.findMany({
        where,
        orderBy: [{ rating: 'desc' }, { followers: 'desc' }],
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
    });

    res.json({ stores });
  } catch (error) {
    console.error('Fetch Stores Error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// ── 2. Get Single Store Details & Store Products ──
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const cacheKey = `store:detail:${id}`;

    const store = await getCachedOrFetch(cacheKey, 180, async () => {
      return await prismaRead.store.findUnique({
        where: { id },
        include: {
          products: {
            take: 20,
            orderBy: { salesCount: 'desc' },
          },
          vouchers: {
            where: {
              expiryDate: { gte: new Date() },
            },
          },
        },
      });
    });

    if (!store) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }

    res.json({ store });
  } catch (error) {
    console.error('Fetch Store Detail Error:', error);
    res.status(500).json({ error: 'Failed to fetch store detail' });
  }
});

// ── 3. Register New Merchant Store (Buyer upgrades to Seller) ──
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      logo,
      banner,
      sellerType = 'individual',
      idCardNo,
      taxId,
      bankName,
      bankAccountNo,
      accountName,
      addressLine,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Store name is required' });
      return;
    }

    // Generate a unique store ID
    const newStoreId = `store-${Date.now()}`;
    const isMallRequest = sellerType === 'corporate';

    res.status(201).json({
      message: 'Store registered successfully! Welcome to Movemall Seller Centre.',
      store: {
        id: newStoreId,
        name,
        description: description || 'ร้านค้าทางการในระบบ Movemall',
        logo: logo || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=300&q=80',
        banner: banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
        isMall: isMallRequest,
        isVerified: true,
        rating: 5.0,
        followers: 1,
        sellerType,
        idCardNo,
        taxId,
        bankName: bankName || 'ธนาคารกสิกรไทย (KBANK)',
        bankAccountNo: bankAccountNo || 'xxx-x-x1234-x',
        accountName: accountName || name,
        addressLine: addressLine || 'กรุงเทพมหานคร',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Register Store Error:', error);
    res.status(500).json({ error: 'Failed to register store' });
  }
});

export default router;
