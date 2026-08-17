import { Router, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';
import crypto from 'crypto';

const router = Router();

// ── 1. Get Seller & Creator Available Balance ──
router.get('/balance', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    res.json({
      userId,
      availableBalance: 48500.00, // THB
      pendingSettlement: 12400.00,
      totalEarned: 184900.00,
      withholdingTaxRate: '3%', // Thai Revenue Dept e-Withholding Tax standard
      bankAccount: {
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

// ── 2. Request Payout / Transfer to Bank Account ──
router.post('/request', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { amount, payoutMethod = 'PROMPTPAY' } = req.body;

    if (!amount || Number(amount) < 100) {
      res.status(400).json({ error: 'Minimum payout amount is ฿100' });
      return;
    }

    const requestedAmount = Number(amount);
    const withholdingTax = requestedAmount * 0.03; // 3% WHT
    const netPayout = requestedAmount - withholdingTax;
    const payoutId = `PO-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const payoutTransaction = {
      payoutId,
      userId,
      requestedAmount,
      withholdingTax,
      netPayout,
      payoutMethod,
      status: 'PROCESSING',
      estimatedArrival: 'ภายใน 24 ชั่วโมงทำการ (Direct PromptPay Transfer)',
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      message: 'Payout request submitted successfully',
      payout: payoutTransaction,
    });
  } catch (error) {
    console.error('Request Payout Error:', error);
    res.status(500).json({ error: 'Failed to submit payout request' });
  }
});

export default router;
