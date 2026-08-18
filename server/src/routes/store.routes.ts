import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prismaRead, prismaWrite } from '../config/database.js';
import { getCachedOrFetch, redis } from '../config/redis.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'movemall_super_secure_jwt_secret_key_2026_at_least_32_chars!';

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
            take: 50,
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

// ── 3. Register New Merchant Store (Buyer upgrades to Seller in PostgreSQL) ──
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
      isVatRegistered = false,
      taxCompanyName,
      taxBranchCode = '00000',
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Store name is required' });
      return;
    }

    // Resolve ownerId from JWT if available
    let ownerId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        if (decoded?.userId) {
          ownerId = decoded.userId;
        }
      } catch {
        // Token invalid or expired
      }
    }

    // Fallback: Find an existing user or create default user if missing
    if (!ownerId) {
      const firstUser = await prismaRead.user.findFirst({
        where: { role: { in: ['BUYER', 'SELLER'] } },
      });
      if (firstUser) {
        ownerId = firstUser.id;
      }
    }

    if (!ownerId) {
      const newUser = await prismaWrite.user.create({
        data: {
          name: name,
          email: `seller_${Date.now()}@movemall.com`,
          passwordHash: '$2b$10$e8w9b6baf30movemallhash',
          role: 'SELLER',
        },
      });
      ownerId = newUser.id;
    }

    const isMallRequest = sellerType === 'corporate';

    // Persist real record in PostgreSQL database
    const createdStore = await prismaWrite.store.create({
      data: {
        ownerId: ownerId,
        name: name.trim(),
        description: description || 'ร้านค้าทางการในระบบ Movemall',
        logo: logo || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=300&q=80',
        banner: banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
        isMall: isMallRequest,
        isVerified: true,
        isVatRegistered: Boolean(isVatRegistered),
        taxId: taxId || idCardNo || null,
        taxCompanyName: taxCompanyName || name,
        taxBranchCode: taxBranchCode || '00000',
        taxAddress: addressLine || null,
        rating: 5.0,
        followers: 1,
      },
    });

    // Upgrade User Role to SELLER in Database
    await prismaWrite.user.update({
      where: { id: ownerId },
      data: { role: 'SELLER' },
    });

    // Invalidate Redis stores caches
    try {
      await redis.del('stores:mall=all:s=');
      await redis.del('stores:mall=true:s=');
      await redis.del('stores:mall=false:s=');
    } catch {
      // Redis optional
    }

    res.status(201).json({
      message: 'Store registered and saved to PostgreSQL successfully! Welcome to Movemall Seller Centre.',
      store: {
        ...createdStore,
        sellerType,
        idCardNo,
        bankName: bankName || 'ธนาคารกสิกรไทย (KBANK)',
        bankAccountNo: bankAccountNo || 'xxx-x-x1234-x',
        accountName: accountName || name,
        addressLine: addressLine || 'กรุงเทพมหานคร',
      },
    });
  } catch (error) {
    console.error('Register Store Error:', error);
    res.status(500).json({ error: 'Failed to register store in database' });
  }
});

export default router;
