import { Router, Request, Response } from 'express';
import { prismaRead, prismaWrite } from '../config/database.js';
import { getCachedOrFetch, invalidateCachePattern } from '../config/redis.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';
import {
  assertProductOwner,
  resolveWritableStoreId,
  respondIfOwnershipError,
} from '../middleware/ownership.middleware.js';

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

      const formattedProducts = products.map((p) => ({
        ...p,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      }));

      return {
        products: formattedProducts,
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

// ── 2. Get Single Product Details (Supports raw ID & SEO Slugs e.g. iphone-15-pro-i.p1) ──
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const rawStr = Array.isArray(rawId) ? rawId[0] : rawId;
    const id = rawStr.includes('-i.') ? rawStr.split('-i.').pop()! : rawStr;

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
      res.status(404).json({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
      return;
    }

    const formattedProduct = {
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
    };

    res.json({ product: formattedProduct });
  } catch (error) {
    console.error('Fetch Product Detail Error:', error);
    res.status(500).json({ error: 'Failed to fetch product detail' });
  }
});

// ── 3. Create Product (Merchant / Brand Owner) ──
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description = '',
      price,
      originalPrice,
      category,
      brand,
      images,
      stock = 100,
      badge,
      storeId,
    } = req.body;

    if (!name || !price || !category) {
      res.status(400).json({ error: 'Name, price, and category are required' });
      return;
    }

    // สินค้าต้องถูกสร้างเข้าร้านที่ผู้เรียกเป็นเจ้าของเท่านั้น
    // เดิมถ้าไม่ระบุ storeId จะ fallback ไปที่ร้านแรกที่เจอในฐานข้อมูล (ร้านของคนอื่น)
    const targetStoreId = await resolveWritableStoreId(req, storeId);

    const store = await prismaRead.store.findUnique({ where: { id: targetStoreId } });
    const productBadge = badge || (store?.isMall ? 'mall' : 'new');

    const product = await prismaWrite.product.create({
      data: {
        storeId: targetStoreId,
        name,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        category,
        brand: brand || store?.name || null,
        images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'],
        stock: parseInt(stock, 10) || 100,
        badge: productBadge,
      },
    });

    await invalidateCachePattern('products:*');

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    if (respondIfOwnershipError(error, res)) return;
    console.error('Create Product Error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ── 4. Update Product ──
router.put('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    await assertProductOwner(req, id);

    const { name, description, price, originalPrice, category, brand, images, stock, badge } = req.body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice ? parseFloat(originalPrice) : null;
    if (category !== undefined) updateData.category = category;
    if (brand !== undefined) updateData.brand = brand;
    if (images !== undefined) updateData.images = images;
    if (stock !== undefined) updateData.stock = parseInt(stock, 10);
    if (badge !== undefined) updateData.badge = badge;

    const product = await prismaWrite.product.update({
      where: { id },
      data: updateData,
    });

    await invalidateCachePattern('products:*');
    await invalidateCachePattern(`product:detail:${id}`);

    res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    if (respondIfOwnershipError(error, res)) return;
    console.error('Update Product Error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ── 5. Delete Product ──
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    await assertProductOwner(req, id);

    await prismaWrite.product.delete({
      where: { id },
    });

    await invalidateCachePattern('products:*');
    await invalidateCachePattern(`product:detail:${id}`);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    if (respondIfOwnershipError(error, res)) return;
    console.error('Delete Product Error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ── 6. Get Product Reviews from Database ──
router.get('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const reviews = await prismaRead.review.findMany({
      where: { productId: id },
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
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Fetch Product Reviews Error:', error);
    res.status(500).json({ error: 'Failed to fetch product reviews' });
  }
});

// ── 7. Submit Product Review to Database ──
router.post('/:id/reviews', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const productId = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user?.userId;
    const { rating, comment, images } = req.body;

    if (!rating || !comment) {
      res.status(400).json({ error: 'Rating and comment are required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const review = await prismaWrite.review.create({
      data: {
        productId,
        userId,
        rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    await invalidateCachePattern(`product:detail:${productId}`);

    res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    console.error('Submit Product Review Error:', error);
    res.status(500).json({ error: 'Failed to submit product review' });
  }
});

export default router;
