// ── Customer Violation Reports (แจ้งสินค้าปลอม / ร้านค้ามิจฉาชีพ) ──
// ย้ายออกมาจาก admin.routes.ts เพราะเป็น endpoint ที่ผู้ซื้อทั่วไปเป็นผู้เรียก
// การวางไว้ใต้ /api/admin เดิมทำให้ดูเหมือนได้รับการป้องกันแบบ endpoint ผู้ดูแลระบบ
// ทั้งที่ความจริงไม่มี requireRole กำกับ — และ frontend ก็เรียก /api/reports ซึ่งยังไม่มีอยู่จริง

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';
import { addViolationReport } from './admin.routes.js';

const router = Router();

const reportSchema = z.object({
  reporterType: z.enum(['BUYER', 'SELLER']).default('BUYER'),
  reportedType: z.enum(['STORE', 'PRODUCT']).default('STORE'),
  reportedId: z.string().max(200).optional(),
  reportedName: z.string().max(300).optional(),
  storeName: z.string().max(300).optional(),
  orderId: z.string().max(100).optional(),
  type: z.string().max(100).default('FAKE_PRODUCT'),
  description: z.string().max(5000).default(''),
  evidenceUrl: z.string().url().max(1000).nullable().optional(),
  requestRefund: z.boolean().default(true),
});

// ต้องล็อกอินก่อนแจ้งเรื่อง เพื่อให้ติดตามผู้แจ้งได้และกันการยิงสแปมแบบไม่ระบุตัวตน
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'ข้อมูลการแจ้งเรื่องไม่ถูกต้อง',
        details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
      return;
    }

    const d = parsed.data;
    const report = addViolationReport({
      id: `rep-${Date.now().toString(36)}`,
      reporterName: d.reporterType === 'BUYER' ? 'ผู้ซื้อทั่วไป' : 'ร้านค้าบนระบบ',
      reporterType: d.reporterType,
      // เก็บผู้แจ้งจริงจาก JWT ไม่ใช่จากข้อมูลที่ client ส่งมา
      reporterUserId: req.user?.userId ?? null,
      reportedName: d.reportedName || d.storeName || 'ไม่ระบุ',
      reportedType: d.reportedType,
      orderId: d.orderId || null,
      type: d.type,
      description: d.description,
      evidenceUrl: d.evidenceUrl ?? null,
      requestRefund: d.requestRefund,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('Submit Report Error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

export default router;
