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

export default router;
