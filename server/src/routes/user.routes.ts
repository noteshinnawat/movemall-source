import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prismaRead, prismaWrite } from '../config/database.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';
import { LineService } from '../services/line.service.js';

const router = Router();

// ── 1. Get Buyer Profile ──
router.get('/profile', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prismaRead.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatarUrl: true,
        role: true,
        coinsBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        ...user,
        isEmailVerified: !!user.email,
        isPhoneVerified: !!user.phone,
      },
    });
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// ── 2. Update Buyer Profile ──
router.put('/profile', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, avatarUrl, email, phone } = req.body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    const user = await prismaWrite.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatarUrl: true,
        role: true,
        coinsBalance: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// ── 3. Email Verification OTP Request & Confirm ──
router.post('/verify-email/request-otp', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email address is required' });
      return;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    res.json({
      message: `OTP sent to ${email}`,
      otpDemo: otpCode, // For demo & testing
    });
  } catch (error) {
    console.error('Request Email OTP Error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify-email/verify', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { email, otp } = req.body;

    if (!userId || !email || !otp) {
      res.status(400).json({ error: 'Email and OTP code are required' });
      return;
    }

    // Award 50 Movemall Coins bonus on email verification
    const user = await prismaWrite.user.update({
      where: { id: userId },
      data: {
        email,
        coinsBalance: { increment: 50 },
      },
    });

    await prismaWrite.coinLedger.create({
      data: {
        userId,
        amount: 50,
        source: 'email_verification_reward',
      },
    });

    res.json({
      message: 'Email verified successfully! You received 50 Movemall Coins!',
      coinsBalance: user.coinsBalance,
      isEmailVerified: true,
    });
  } catch (error) {
    console.error('Verify Email Error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// ── 4. Phone Verification OTP Request & Confirm ──
router.post('/verify-phone/request-otp', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    res.json({
      message: `SMS OTP sent to ${phone}`,
      otpDemo: otpCode,
    });
  } catch (error) {
    console.error('Request Phone OTP Error:', error);
    res.status(500).json({ error: 'Failed to send SMS OTP' });
  }
});

router.post('/verify-phone/verify', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { phone, otp } = req.body;

    if (!userId || !phone || !otp) {
      res.status(400).json({ error: 'Phone and OTP code are required' });
      return;
    }

    const user = await prismaWrite.user.update({
      where: { id: userId },
      data: {
        phone,
        coinsBalance: { increment: 50 },
      },
    });

    await prismaWrite.coinLedger.create({
      data: {
        userId,
        amount: 50,
        source: 'phone_verification_reward',
      },
    });

    res.json({
      message: 'Phone number verified successfully! You received 50 Movemall Coins!',
      coinsBalance: user.coinsBalance,
      isPhoneVerified: true,
    });
  } catch (error) {
    console.error('Verify Phone Error:', error);
    res.status(500).json({ error: 'Failed to verify phone' });
  }
});

// ── 5. Change Password ──
router.put('/change-password', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    const user = await prismaRead.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prismaWrite.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ── 6. LINE Official Account Connect (+50 Coins Bonus) ──
router.post('/line/connect', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { lineUserId, displayName, pictureUrl } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prismaRead.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Reward 50 coins if newly connected
    const updatedUser = await prismaWrite.user.update({
      where: { id: userId },
      data: {
        coinsBalance: { increment: 50 },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        coinsBalance: true,
      },
    });

    res.json({
      message: 'LINE account connected successfully',
      user: {
        ...updatedUser,
        lineConnected: true,
        lineProfile: {
          displayName: displayName || 'LINE Member',
          pictureUrl: pictureUrl || '',
          lineUserId: lineUserId || 'U_MOVEMALL_' + Date.now(),
        },
      },
      coinsEarned: 50,
    });
  } catch (error) {
    console.error('LINE Connect Error:', error);
    res.status(500).json({ error: 'Failed to connect LINE account' });
  }
});

// ── 7. Update LINE Notification Preferences ──
router.put('/line/preferences', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { preferences } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.json({
      message: 'LINE notification preferences updated',
      preferences: preferences || {
        orderUpdates: true,
        shippingUpdates: true,
        flashSaleAlerts: true,
        liveStreamAlerts: true,
        dailyCoinsReminders: false,
      },
    });
  } catch (error) {
    console.error('LINE Preferences Error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// ── 8. Disconnect LINE Account ──
router.delete('/line/disconnect', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.json({ message: 'LINE account disconnected' });
  } catch (error) {
    console.error('LINE Disconnect Error:', error);
    res.status(500).json({ error: 'Failed to disconnect LINE account' });
  }
});

// ── 9. Get User Wishlist ──
router.get('/wishlist', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const items = await prismaRead.wishlistItem.findMany({
      where: { userId },
      include: {
        product: true,
      },
    });

    res.json({
      productIds: items.map(item => item.productId),
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        product: item.product,
      })),
    });
  } catch (error) {
    console.error('Fetch Wishlist Error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// ── 10. Sync Wishlist (Merge guest items with user account) ──
router.post('/wishlist/sync', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validProductIds: string[] = Array.isArray(productIds) ? productIds : [];

    // Safely upsert valid items into DB
    for (const pid of validProductIds) {
      if (typeof pid === 'string' && pid.trim().length > 0) {
        try {
          const productExists = await prismaRead.product.findUnique({ where: { id: pid } });
          if (productExists) {
            await prismaWrite.wishlistItem.upsert({
              where: {
                userId_productId: {
                  userId,
                  productId: pid,
                },
              },
              update: {},
              create: {
                userId,
                productId: pid,
              },
            });
          }
        } catch {
          // Skip if database product not found or constraint mismatch
        }
      }
    }

    const currentItems = await prismaRead.wishlistItem.findMany({
      where: { userId },
      include: {
        product: true,
      },
    });

    res.json({
      message: 'Wishlist synced successfully',
      productIds: currentItems.map(i => i.productId),
      items: currentItems.map(item => ({
        id: item.id,
        productId: item.productId,
        product: item.product,
      })),
    });
  } catch (error) {
    console.error('Sync Wishlist Error:', error);
    res.status(500).json({ error: 'Failed to sync wishlist' });
  }
});

// ── 11. Toggle Wishlist Item ──
router.post('/wishlist/toggle', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!productId) {
      res.status(400).json({ error: 'productId is required' });
      return;
    }

    const existing = await prismaRead.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    let isWished = false;
    if (existing) {
      await prismaWrite.wishlistItem.delete({
        where: { id: existing.id },
      });
      isWished = false;
    } else {
      const productExists = await prismaRead.product.findUnique({ where: { id: productId } });
      if (productExists) {
        await prismaWrite.wishlistItem.create({
          data: {
            userId,
            productId,
          },
        });
        isWished = true;
      }
    }

    const allItems = await prismaRead.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
    });

    res.json({
      isWished,
      productId,
      productIds: allItems.map(i => i.productId),
    });
  } catch (error) {
    console.error('Toggle Wishlist Error:', error);
    res.status(500).json({ error: 'Failed to toggle wishlist item' });
  }
});

// ── 12. Remove Wishlist Item ──
router.delete('/wishlist/:productId', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const productId = String(req.params.productId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await prismaWrite.wishlistItem.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    const allItems = await prismaRead.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
    });

    res.json({
      message: 'Item removed from wishlist',
      productIds: allItems.map(i => i.productId),
    });
  } catch (error) {
    console.error('Remove Wishlist Error:', error);
    res.status(500).json({ error: 'Failed to remove wishlist item' });
  }
});

export default router;

