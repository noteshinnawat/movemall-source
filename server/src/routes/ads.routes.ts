import { Router, Response } from 'express';
import { prismaRead, prismaWrite } from '../config/database.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// ── 1. Fetch Ad Wallet & Transactions ──
router.get('/wallet', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { storeId = 'store-techpro' } = req.query;
    const targetStoreId = Array.isArray(storeId) ? (storeId[0] as string) : (storeId as string);

    let wallet = await prismaRead.adWallet.findUnique({
      where: { storeId: targetStoreId },
      include: {
        txs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!wallet) {
      wallet = await prismaWrite.adWallet.create({
        data: {
          storeId: targetStoreId,
          balance: 1000.0,
          totalSpent: 0.0,
        },
        include: {
          txs: true,
        },
      });
    }

    res.json({ wallet });
  } catch (error) {
    console.error('Fetch Ad Wallet Error:', error);
    res.status(500).json({ error: 'Failed to fetch Ad Wallet' });
  }
});

// ── 2. Top-Up Ad Wallet Credit ──
router.post('/wallet/topup', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { storeId = 'store-techpro', amount } = req.body;
    if (!amount || parseFloat(amount) <= 0) {
      res.status(400).json({ error: 'Top-up amount must be greater than 0' });
      return;
    }

    const topupVal = parseFloat(amount);

    const wallet = await prismaWrite.$transaction(async (tx) => {
      const updatedWallet = await tx.adWallet.upsert({
        where: { storeId },
        update: { balance: { increment: topupVal } },
        create: { storeId, balance: topupVal, totalSpent: 0.0 },
      });

      await tx.adWalletTx.create({
        data: {
          walletId: updatedWallet.id,
          amount: topupVal,
          type: 'topup',
          description: `Top-up Ad Wallet via PromptPay QR ฿${topupVal.toLocaleString()}`,
        },
      });

      return updatedWallet;
    });

    res.json({
      message: 'Ad Wallet top-up successful',
      wallet,
    });
  } catch (error) {
    console.error('Top-Up Ad Wallet Error:', error);
    res.status(500).json({ error: 'Failed to top-up Ad Wallet' });
  }
});

// ── 3. Fetch Ad Campaigns ──
router.get('/campaigns', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { storeId = 'store-techpro', type } = req.query;
    const targetStoreId = Array.isArray(storeId) ? (storeId[0] as string) : (storeId as string);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { storeId: targetStoreId };
    if (type && type !== 'all') {
      where.type = type;
    }

    const campaigns = await prismaRead.adCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ campaigns });
  } catch (error) {
    console.error('Fetch Ad Campaigns Error:', error);
    res.status(500).json({ error: 'Failed to fetch ad campaigns' });
  }
});

// ── 4. Create New Sponsored Ad Campaign ──
router.post('/campaigns', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const {
      storeId = 'store-techpro',
      productId,
      name,
      type = 'search',
      dailyBudget,
      cpcBid,
      keywords,
    } = req.body;

    if (!productId || !name || !dailyBudget || !cpcBid) {
      res.status(400).json({ error: 'Product, name, daily budget, and CPC bid are required' });
      return;
    }

    const campaign = await prismaWrite.adCampaign.create({
      data: {
        storeId,
        productId,
        name,
        type,
        dailyBudget: parseFloat(dailyBudget),
        cpcBid: parseFloat(cpcBid),
        keywords: Array.isArray(keywords) ? keywords : [keywords].filter(Boolean),
        status: 'active',
        impressions: Math.floor(100 + Math.random() * 500),
        clicks: Math.floor(10 + Math.random() * 50),
        totalSpent: parseFloat(cpcBid) * 10,
        revenue: parseFloat(cpcBid) * 10 * 4.5,
      },
    });

    res.status(201).json({
      message: 'Ad campaign launched successfully',
      campaign,
    });
  } catch (error) {
    console.error('Create Ad Campaign Error:', error);
    res.status(500).json({ error: 'Failed to launch ad campaign' });
  }
});

// ── 5. Toggle Campaign Status (Pause / Active) ──
router.put('/campaigns/:id/toggle', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const existing = await prismaRead.adCampaign.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const nextStatus = existing.status === 'active' ? 'paused' : 'active';

    const campaign = await prismaWrite.adCampaign.update({
      where: { id },
      data: { status: nextStatus },
    });

    res.json({
      message: `Campaign status updated to ${nextStatus}`,
      campaign,
    });
  } catch (error) {
    console.error('Toggle Ad Campaign Error:', error);
    res.status(500).json({ error: 'Failed to toggle campaign status' });
  }
});

export default router;
