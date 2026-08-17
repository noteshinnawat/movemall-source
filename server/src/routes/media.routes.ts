import { Router, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';
import crypto from 'crypto';

const router = Router();

// ── 1. Get Presigned S3 / Cloudflare R2 Upload URL for 60s Videos & Images ──
router.post('/upload-url', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { filename, fileType, fileCategory } = req.body; // 'video' | 'image'

    if (!filename || !fileType) {
      res.status(400).json({ error: 'Filename and fileType are required' });
      return;
    }

    const fileExt = filename.split('.').pop() || (fileCategory === 'video' ? 'mp4' : 'jpg');
    const uniqueKey = `uploads/${fileCategory || 'media'}/${userId || 'guest'}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${fileExt}`;

    // Cloudflare R2 / S3 Presigned URL simulation
    const bucketEndpoint = process.env.R2_PUBLIC_URL || 'https://assets.movemall.io';
    const uploadUrl = `${bucketEndpoint}/${uniqueKey}?mock_presigned_signature=${crypto.randomBytes(16).toString('hex')}`;
    const publicUrl = `${bucketEndpoint}/${uniqueKey}`;

    res.json({
      uploadUrl,
      publicUrl,
      key: uniqueKey,
      expiresIn: 3600, // 1 hour
      headers: {
        'Content-Type': fileType,
      },
    });
  } catch (error) {
    console.error('Presigned URL Error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// ── 2. Complete Video Upload & Register Creator Video Metadata ──
router.post('/video-complete', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { title, videoUrl, duration, taggedProductIds, category } = req.body;

    if (!videoUrl || !title) {
      res.status(400).json({ error: 'Title and videoUrl are required' });
      return;
    }

    const videoRecord = {
      id: `vid-${Date.now()}`,
      creatorId: userId,
      title,
      videoUrl,
      thumbnailUrl: `${videoUrl.replace(/\.[^/.]+$/, '')}_thumb.jpg`,
      duration: duration || 30, // seconds
      taggedProductIds: taggedProductIds || [],
      category: category || 'recommend',
      views: 0,
      likes: 0,
      shares: 0,
      status: 'READY',
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      message: 'Video published successfully to Creator Feed',
      video: videoRecord,
    });
  } catch (error) {
    console.error('Video Complete Error:', error);
    res.status(500).json({ error: 'Failed to register video' });
  }
});

export default router;
