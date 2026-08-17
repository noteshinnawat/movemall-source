import { Router, Request, Response } from 'express';
import { prismaRead } from '../config/database.js';
import { getCachedOrFetch } from '../config/redis.js';

const router = Router();

// ── 1. Get Product Catalogue ──
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      search,
      brand,
      badge,
      minPrice,
      maxPrice,
      sortBy = 'popular',
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Cache key for common catalogue queries
    const cacheKey = `products:c=${category || 'all'}:s=${search || ''}:b=${brand || ''}:bg=${badge || ''}:sb=${sortBy}:p=${pageNum}:l=${limitNum}`;

    const result = await getCachedOrFetch(cacheKey, 60, async () => {
      // Build Prisma Where Clause
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      if (category && category !== 'all') {
        where.category = { equals: category as string, mode: 'insensitive' };
      }

      if (brand) {
        where.brand = { equals: brand as string, mode: 'insensitive' };
      }

      if (badge && badge !== 'all') {
        where.badge = { equals: badge as string, mode: 'insensitive' };
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
          { category: { contains: search as string, mode: 'insensitive' } },
          { brand: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice as string);
        if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
      }

      // OrderBy Sorting Strategy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let orderBy: any = { salesCount: 'desc' };

      switch (sortBy) {
        case 'sales':
          orderBy = { salesCount: 'desc' };
          break;
        case 'price-low':
          orderBy = { price: 'asc' };
          break;
        case 'price-high':
          orderBy = { price: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'rating':
          orderBy = { rating: 'desc' };
          break;
        case 'popular':
        default:
          orderBy = [{ salesCount: 'desc' }, { rating: 'desc' }];
          break;
      }

      const [products, totalCount] = await Promise.all([
        prismaRead.product.findMany({
          where,
          orderBy,
          skip,
          take: limitNum,
          include: {
            store: {
              select: {
                id: true,
                name: true,
                logo: true,
                isMall: true,
                isVerified: true,
                rating: true,
              },
            },
          },
        }),
        prismaRead.product.count({ where }),
      ]);

      return {
        products,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Fetch Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch products catalogue' });
  }
});

// ── 2. Get Single Product Details ──
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const cacheKey = `product:detail:${id}`;

    const product = await getCachedOrFetch(cacheKey, 120, async () => {
      return await prismaRead.product.findUnique({
        where: { id },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              logo: true,
              banner: true,
              description: true,
              isMall: true,
              isVerified: true,
              rating: true,
              followers: true,
            },
          },
          reviews: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ product });
  } catch (error) {
    console.error('Fetch Product Detail Error:', error);
    res.status(500).json({ error: 'Failed to fetch product detail' });
  }
});

export default router;
