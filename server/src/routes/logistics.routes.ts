import { Router, Response } from 'express';
import { prismaWrite, prismaRead } from '../config/database.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';
import { io } from '../app.js';

const router = Router();

// ── 1. Book Courier Shipment (Flash Express / J&T / Kerry) ──
router.post('/book-shipment', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, courierProvider = 'Flash Express' } = req.body;
    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const trackingNumber = `TH-${courierProvider.slice(0, 2).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const tracking = await prismaWrite.trackingLog.upsert({
      where: { orderId },
      create: {
        orderId,
        trackingNumber,
        courierProvider,
        timeline: [
          {
            time: new Date().toISOString(),
            status: 'SHIPMENT_BOOKED',
            location: 'Movemall Fulfillment Hub',
            description: `Courier ${courierProvider} assigned. Pickup scheduled.`,
          },
        ],
      },
      update: {
        trackingNumber,
        courierProvider,
      },
    });

    res.status(201).json({
      message: 'Shipment booked successfully',
      tracking,
    });
  } catch (error) {
    console.error('Book Shipment Error:', error);
    res.status(500).json({ error: 'Failed to book shipment' });
  }
});

// ── 2. Real-time GPS Location Dispatch for Delivery Van ──
router.post('/update-gps', async (req, res: Response) => {
  try {
    const { orderId, latitude, longitude, driverName, etaMinutes } = req.body;
    if (!orderId || !latitude || !longitude) {
      res.status(400).json({ error: 'Order ID, latitude, and longitude are required' });
      return;
    }

    const gpsUpdate = {
      orderId,
      latitude,
      longitude,
      driverName: driverName || 'นายสมชาย มุ่งมั่น (Flash Express)',
      etaMinutes: etaMinutes || 15,
      timestamp: new Date().toISOString(),
    };

    // Broadcast GPS location via Socket.io to tracking room
    io.emit(`tracking:${orderId}:gps`, gpsUpdate);

    res.json({ success: true, gps: gpsUpdate });
  } catch (error) {
    console.error('GPS Update Error:', error);
    res.status(500).json({ error: 'Failed to broadcast GPS' });
  }
});

// ── 3. Get Tracking Details ──
router.get('/:orderId', async (req, res: Response) => {
  try {
    const rawId = req.params.orderId;
    const orderId = Array.isArray(rawId) ? rawId[0] : rawId;

    const tracking = await prismaRead.trackingLog.findUnique({
      where: { orderId },
    });

    if (!tracking) {
      // Fallback default simulation for demo tracking
      res.json({
        tracking: {
          orderId,
          trackingNumber: `MM-EXPRESS-${orderId.slice(0, 6)}`,
          courierProvider: 'Flash Express',
          status: 'IN_TRANSIT',
          driver: {
            name: 'นายสมชาย มุ่งมั่น',
            phone: '081-234-5678',
            vehiclePlate: '1กข 9999 กทม.',
          },
          currentCoords: { lat: 13.7563, lng: 100.5018 },
          timeline: [
            { time: '14:30', status: 'พัสดุถึงสาขาปลายทาง (บางนา)', location: 'Hub BKK-04' },
            { time: '12:00', status: 'กำลังจัดส่งพัสดุโดยพนักงาน', location: 'On the way' },
          ],
        },
      });
      return;
    }

    res.json({ tracking });
  } catch (error) {
    console.error('Fetch Tracking Error:', error);
    res.status(500).json({ error: 'Failed to fetch tracking' });
  }
});

export default router;
