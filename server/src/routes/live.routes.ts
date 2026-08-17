import { Router, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';
import crypto from 'crypto';

const router = Router();

// ── 1. Create Live Streaming Session (Generate RTMP & WebRTC Stream Key) ──
router.post('/create-session', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { title, storeId, pinnedProductIds } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Live stream title is required' });
      return;
    }

    const sessionId = `live_${Date.now()}`;
    const streamKey = `sk_live_${crypto.randomBytes(12).toString('hex')}`;
    const rtmpIngestUrl = `rtmp://live.movemall.io/app/${streamKey}`;
    const hlsPlaybackUrl = `https://stream.movemall.io/live/${sessionId}/index.m3u8`;

    const liveSession = {
      id: sessionId,
      storeId: storeId || `store_${userId}`,
      title,
      streamKey,
      rtmpIngestUrl,
      hlsPlaybackUrl,
      pinnedProductIds: pinnedProductIds || [],
      viewerCount: 1,
      likesCount: 0,
      status: 'LIVE',
      startedAt: new Date().toISOString(),
    };

    res.status(201).json({
      message: 'Live stream session created',
      session: liveSession,
    });
  } catch (error) {
    console.error('Create Live Session Error:', error);
    res.status(500).json({ error: 'Failed to create live session' });
  }
});

// ── 2. Get All Active Live Streams ──
router.get('/active-streams', async (_req, res: Response) => {
  try {
    const mockLiveStreams = [
      {
        id: 'live_01',
        storeName: 'Apple Flagship Store',
        title: '🔴 สด! เปิดตัว iPhone 16 Pro Max ลดพิเศษ ฿4,000 ในไลฟ์เท่านั้น',
        viewers: 14200,
        thumbnail: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
        hlsPlaybackUrl: 'https://stream.movemall.io/live/live_01/index.m3u8',
        pinnedProduct: {
          id: 'apple-01',
          name: 'iPhone 16 Pro Max (256GB) - Desert Titanium',
          price: 48900,
          originalPrice: 52900,
        },
      },
      {
        id: 'live_02',
        storeName: 'Sony Official Store',
        title: '🎧 หูฟังตัดเสียงรบกวน WH-1000XM5 แจกโค้ดลด 50% ทุก 10 นาที!',
        viewers: 8640,
        thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        hlsPlaybackUrl: 'https://stream.movemall.io/live/live_02/index.m3u8',
        pinnedProduct: {
          id: 'sony-01',
          name: 'Sony WH-1000XM5 Wireless Headphones',
          price: 11990,
          originalPrice: 14990,
        },
      },
    ];

    res.json({ liveStreams: mockLiveStreams });
  } catch (error) {
    console.error('Get Active Streams Error:', error);
    res.status(500).json({ error: 'Failed to fetch active live streams' });
  }
});

export default router;
