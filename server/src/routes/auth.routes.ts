import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prismaWrite, prismaRead } from '../config/database.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'movemall_super_secure_jwt_secret_key_2026_at_least_32_chars!';

// ── 1. Register ──
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, phone, password, name, role } = req.body;

    if ((!email && !phone) || !password || !name) {
      res.status(400).json({ error: 'Email/Phone, Password, and Name are required' });
      return;
    }

    // Check if user already exists
    if (email) {
      const existingEmail = await prismaRead.user.findUnique({ where: { email } });
      if (existingEmail) {
        res.status(409).json({ error: 'Email is already registered' });
        return;
      }
    }

    if (phone) {
      const existingPhone = await prismaRead.user.findUnique({ where: { phone } });
      if (existingPhone) {
        res.status(409).json({ error: 'Phone number is already registered' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === 'SELLER' || role === 'CREATOR' ? role : 'BUYER';

    const user = await prismaWrite.user.create({
      data: {
        email: email || null,
        phone: phone || null,
        passwordHash,
        name,
        role: userRole,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        avatarUrl: true,
        coinsBalance: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// ── 2. Login ──
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      res.status(400).json({ error: 'Email/Phone and Password are required' });
      return;
    }

    const user = email
      ? await prismaRead.user.findUnique({ where: { email } })
      : await prismaRead.user.findUnique({ where: { phone } });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        coinsBalance: user.coinsBalance,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ── 3. Get Current User Profile ──
router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prismaRead.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        avatarUrl: true,
        coinsBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;
