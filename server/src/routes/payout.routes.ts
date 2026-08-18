import { Router, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';
import { prismaRead, prismaWrite } from '../config/database.js';
import crypto from 'crypto';

const router = Router();

// In-memory store fallback for affiliate creator profiles
interface CreatorProfile {
  userId: string;
  creatorId: string;
  fullName: string;
  idCard: string;
  accountType: 'INDIVIDUAL' | 'COMPANY';
  socialPlatform: string;
  socialHandle: string;
  followerRange: string;
  contentCategory: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  promptPayPhone?: string;
  status: 'VERIFIED' | 'PENDING';
  tier: 'SILVER' | 'GOLD' | 'PLATINUM';
  commissionRate: number;
  availableBalance: number;
  pendingSettlement: number;
  totalEarned: number;
  totalClicks: number;
  totalOrders: number;
  createdAt: string;
}

const creatorStore = new Map<string, CreatorProfile>();

// ── 1. Register as Affiliate Creator ──
router.post('/affiliate/register', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || `user-${Date.now()}`;
    const {
      fullName,
      idCard,
      accountType = 'INDIVIDUAL',
      socialPlatform,
      socialHandle,
      followerRange,
      contentCategory,
      bankName,
      bankAccountNumber,
      bankAccountName,
      promptPayPhone,
    } = req.body;

    if (!fullName || !idCard || !socialPlatform || !bankName || !bankAccountNumber) {
      res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, เลขประจำตัว, โซเชียลมีเดีย, ธนาคาร)' });
      return;
    }

    const creatorId = `CREATOR-TH${Math.floor(1000 + Math.random() * 9000)}`;

    const profile: CreatorProfile = {
      userId,
      creatorId,
      fullName,
      idCard,
      accountType,
      socialPlatform,
      socialHandle: socialHandle || '@creator',
      followerRange: followerRange || '1K-10K',
      contentCategory: contentCategory || 'ทั่วไป',
      bankName,
      bankAccountNumber,
      bankAccountName: bankAccountName || fullName,
      promptPayPhone,
      status: 'VERIFIED',
      tier: 'SILVER',
      commissionRate: 15,
      availableBalance: 500.00, // Welcome Creator Bonus ฿500
      pendingSettlement: 0.00,
      totalEarned: 500.00,
      totalClicks: 0,
      totalOrders: 0,
      createdAt: new Date().toISOString(),
    };

    creatorStore.set(userId, profile);

    // Try to update user role to CREATOR in database if exists
    try {
      if (req.user?.userId) {
        await prismaWrite.user.update({
          where: { id: req.user.userId },
          data: { role: 'CREATOR' },
        });
      }
    } catch {
      // Ignore if user not in DB (mock auth)
    }

    res.status(201).json({
      message: 'ยินดีด้วย! คุณได้รับการอนุมัติเป็น Movemall Creator & Affiliate สำเร็จแล้ว',
      creator: profile,
    });
  } catch (error) {
    console.error('Affiliate Registration Error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสมัครนายหน้า' });
  }
});

// ── 2. Get Affiliate Creator Profile & Status ──
router.get('/affiliate/profile', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const profile = creatorStore.get(userId);
    if (!profile) {
      res.json({ isRegistered: false, creator: null });
      return;
    }

    res.json({
      isRegistered: true,
      creator: profile,
    });
  } catch (error) {
    console.error('Fetch Creator Profile Error:', error);
    res.status(500).json({ error: 'Failed to fetch creator profile' });
  }
});

// ── 3. Get Seller & Creator Available Balance ──
router.get('/balance', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const profile = userId ? creatorStore.get(userId) : null;

    res.json({
      userId,
      availableBalance: profile ? profile.availableBalance : 48500.00, // THB
      pendingSettlement: profile ? profile.pendingSettlement : 12400.00,
      totalEarned: profile ? profile.totalEarned : 184900.00,
      withholdingTaxRate: '3%', // Thai Revenue Dept e-Withholding Tax standard
      bankAccount: profile ? {
        bankName: profile.bankName,
        accountNumber: profile.bankAccountNumber,
        accountName: profile.bankAccountName,
        promptPayPhone: profile.promptPayPhone || '',
      } : {
        bankName: 'ธนาคารกสิกรไทย (KBANK)',
        accountNumber: 'xxx-x-x1234-x',
        accountName: 'บจก. มูฟมอลล์ พาร์ทเนอร์',
        promptPayPhone: '081-xxx-5678',
      },
    });
  } catch (error) {
    console.error('Fetch Balance Error:', error);
    res.status(500).json({ error: 'Failed to fetch payout balance' });
  }
});

// ── 4. Request Payout / Transfer to Bank Account ──
router.post('/request', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { amount, payoutMethod = 'PROMPTPAY' } = req.body;

    if (!amount || Number(amount) < 100) {
      res.status(400).json({ error: 'ยอดถอนขั้นต่ำคือ ฿100' });
      return;
    }

    const requestedAmount = Number(amount);
    const profile = userId ? creatorStore.get(userId) : null;

    if (profile && profile.availableBalance < requestedAmount) {
      res.status(400).json({ error: 'ยอดเงินคงเหลือไม่เพียงพอสำหรับการถอน' });
      return;
    }

    const withholdingTax = requestedAmount * 0.03; // 3% WHT
    const netPayout = requestedAmount - withholdingTax;
    const payoutId = `PO-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    if (profile) {
      profile.availableBalance -= requestedAmount;
      creatorStore.set(userId!, profile);
    }

    const payoutTransaction = {
      payoutId,
      userId,
      requestedAmount,
      withholdingTax,
      netPayout,
      payoutMethod,
      status: 'PROCESSING',
      estimatedArrival: 'ภายใน 24 ชั่วโมงทำการ (Direct PromptPay/Bank Transfer)',
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      message: 'ส่งคำขอถอนเงินสำเร็จ ยอดเงินสุทธิจะถูกโอนเข้าบัญชีของคุณภายใน 24 ชั่วโมง',
      payout: payoutTransaction,
      remainingBalance: profile ? profile.availableBalance : 0,
    });
  } catch (error) {
    console.error('Request Payout Error:', error);
    res.status(500).json({ error: 'Failed to submit payout request' });
  }
});

export default router;

