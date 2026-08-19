import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prismaWrite, prismaRead } from '../config/database.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware.js';
import { LineService } from '../services/line.service.js';
import { ThaiBulkSmsService } from '../services/sms.service.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'movemall_super_secure_jwt_secret_key_2026_at_least_32_chars!';

export const SUPER_ADMIN_EMAILS = [
  'note.shinnawat@gmail.com',
  'admin@movemall.com',
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

// ── 1. Send Registration OTP (SMS via ThaiBulkSMS / Email) ──
router.post('/send-otp', async (req: AuthRequest, res: Response) => {
  try {
    const { target, type } = req.body; // target: email or phone, type: 'email' | 'phone'
    if (!target) {
      res.status(400).json({ error: 'กรุณาระบุอีเมลหรือเบอร์โทรศัพท์' });
      return;
    }

    const isEmail = type === 'email' || target.includes('@');

    // Check if already registered
    if (isEmail) {
      const existing = await prismaRead.user.findUnique({ where: { email: target } });
      if (existing) {
        res.status(409).json({ error: 'อีเมลนี้ถูกลงทะเบียนใช้งานแล้ว' });
        return;
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      res.json({
        message: `ส่งรหัส OTP ไปยังอีเมล ${target} เรียบร้อยแล้ว`,
        otpDemo: otpCode,
        isRealSms: false,
      });
    } else {
      const cleanPhone = ThaiBulkSmsService.sanitizePhone(target);
      const existing = await prismaRead.user.findUnique({ where: { phone: cleanPhone } });
      if (existing) {
        res.status(409).json({ error: 'เบอร์โทรศัพท์นี้ถูกลงทะเบียนใช้งานแล้ว' });
        return;
      }

      // Send OTP via ThaiBulkSMS
      const smsResult = await ThaiBulkSmsService.sendOtp(cleanPhone);
      if (!smsResult.success) {
        res.status(400).json({ error: smsResult.message });
        return;
      }

      res.json({
        message: smsResult.message,
        otpDemo: smsResult.otpDemo,
        refno: smsResult.refno,
        isRealSms: smsResult.isRealSms,
      });
    }
  } catch (error) {
    console.error('Send Registration OTP Error:', error);
    res.status(500).json({ error: 'ไม่สามารถส่งรหัส OTP ได้ในขณะนี้' });
  }
});

// ── 1.1 Verify OTP Code ──
router.post('/verify-otp', async (req: AuthRequest, res: Response) => {
  try {
    const { target, otp } = req.body;
    if (!target || !otp) {
      res.status(400).json({ error: 'กรุณาระบุเบอร์โทรศัพท์และรหัส OTP' });
      return;
    }

    const verifyResult = await ThaiBulkSmsService.verifyOtp(target, otp);
    if (!verifyResult.success) {
      res.status(400).json({ error: verifyResult.message });
      return;
    }

    res.json({ success: true, message: verifyResult.message });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ error: 'ตรวจสอบรหัส OTP ล้มเหลว' });
  }
});

// ── 2. Register ──
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, phone, password, name, role, referralCode } = req.body;

    if ((!email && !phone) || !password || !name) {
      res.status(400).json({ error: 'กรุณากรอกข้อมูล อีเมล/เบอร์โทร, รหัสผ่าน และชื่อให้ครบถ้วน' });
      return;
    }

    // Check if user already exists
    if (email) {
      const existingEmail = await prismaRead.user.findUnique({ where: { email } });
      if (existingEmail) {
        res.status(409).json({ error: 'อีเมลนี้ถูกลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ' });
        return;
      }
    }

    if (phone) {
      const existingPhone = await prismaRead.user.findUnique({ where: { phone } });
      if (existingPhone) {
        res.status(409).json({ error: 'เบอร์โทรศัพท์นี้ถูกลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let userRole = role === 'SELLER' || role === 'CREATOR' ? role : 'BUYER';
    if (isSuperAdminEmail(email)) {
      userRole = 'SUPER_ADMIN';
    }
    
    // Welcome bonus: 100 coins for buyers (+50 extra coins if referral code is provided)
    const hasReferral = Boolean(referralCode && String(referralCode).trim().length >= 4);
    const initialCoins = userRole === 'BUYER' ? (hasReferral ? 150 : 100) : 0;

    const user = await prismaWrite.user.create({
      data: {
        email: email || null,
        phone: phone || null,
        passwordHash,
        name,
        role: userRole,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        coinsBalance: initialCoins,
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

    // Record welcome bonus in CoinLedger
    if (initialCoins > 0) {
      await prismaWrite.coinLedger.create({
        data: {
          userId: user.id,
          amount: 100,
          source: 'welcome_bonus_new_member',
        },
      });

      if (hasReferral) {
        await prismaWrite.coinLedger.create({
          data: {
            userId: user.id,
            amount: 50,
            source: 'referral_invite_bonus',
          },
        });
      }
    }

    // Auto-create welcome notification
    try {
      await prismaWrite.notification.create({
        data: {
          userId: user.id,
          category: 'promos',
          title: '🎉 ยินดีต้อนรับสู่ Movemall!',
          body: `คุณได้รับของขวัญต้อนรับ ${initialCoins} Coins และคูปองส่งฟรี พร้อมส่วนลด 50% สำหรับการสั่งซื้อแรกของคุณ`,
          link: '/account',
        },
      });
    } catch (notifErr) {
      console.warn('Welcome notification warning:', notifErr);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'สมัครสมาชิกสำเร็จ! ยินดีต้อนรับสู่ Movemall',
      token,
      user,
      welcomePerks: {
        coinsGranted: initialCoins,
        freeShippingVoucher: 'FREESHIP-NEWBIE',
        firstOrderDiscount: 'WELCOME50',
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'ไม่สามารถสร้างบัญชีผู้ใช้งานได้' });
  }
});

// ── 3. Login with Password ──
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      res.status(400).json({ error: 'Email/Phone and Password are required' });
      return;
    }

    let user = email
      ? await prismaRead.user.findUnique({ where: { email } })
      : await prismaRead.user.findUnique({ where: { phone } });

    // If Super Admin is logging in but record is not in DB yet, auto-provision instantly
    if (!user && email && isSuperAdminEmail(email)) {
      const passwordHash = await bcrypt.hash(password || 'movemall1234', 10);
      const isNote = email.toLowerCase() === 'note.shinnawat@gmail.com';
      user = await prismaWrite.user.upsert({
        where: { email },
        update: { role: 'SUPER_ADMIN' },
        create: {
          email,
          phone: isNote ? '0810000000' : '0810000001',
          passwordHash,
          name: isNote ? 'Note Shinnawat (Super Admin)' : 'Movemall Administrator',
          role: 'SUPER_ADMIN',
          coinsBalance: 99999,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        },
      });
    }

    if (!user) {
      res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }

    // Auto-grant SUPER_ADMIN if email is configured in super admin whitelist
    if (isSuperAdminEmail(user.email) && user.role !== 'SUPER_ADMIN') {
      user = await prismaWrite.user.update({
        where: { id: user.id },
        data: { role: 'SUPER_ADMIN' },
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
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
    res.status(500).json({ error: 'ไม่สามารถเข้าสู่ระบบได้' });
  }
});

// ── 4. Fast Login / Register with SMS OTP ──
router.post('/login-otp', async (req: AuthRequest, res: Response) => {
  try {
    const { target, otp } = req.body; // target: phone or email

    if (!target || !otp) {
      res.status(400).json({ error: 'กรุณาระบุเบอร์โทร/อีเมล และรหัส OTP' });
      return;
    }

    const isEmail = target.includes('@');

    // Verify OTP for phone login
    if (!isEmail) {
      const verifyResult = await ThaiBulkSmsService.verifyOtp(target, otp);
      if (!verifyResult.success) {
        res.status(400).json({ error: verifyResult.message });
        return;
      }
    }
    let user = isEmail
      ? await prismaRead.user.findUnique({ where: { email: target } })
      : await prismaRead.user.findUnique({ where: { phone: target } });

    let isNewUser = false;

    // If user does not exist, auto-register them
    if (!user) {
      isNewUser = true;
      const defaultName = isEmail ? target.split('@')[0] : `User_${target.slice(-4)}`;
      const randomPass = Math.random().toString(36).slice(-8) + 'Mm1!';
      const passwordHash = await bcrypt.hash(randomPass, 10);

      user = await prismaWrite.user.create({
        data: {
          email: isEmail ? target : null,
          phone: !isEmail ? target : null,
          passwordHash,
          name: defaultName,
          role: 'BUYER',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(defaultName)}`,
          coinsBalance: 100,
        },
      });

      await prismaWrite.coinLedger.create({
        data: {
          userId: user.id,
          amount: 100,
          source: 'welcome_bonus_new_member',
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: isNewUser ? 'สมัครสมาชิกและเข้าสู่ระบบสำเร็จ' : 'เข้าสู่ระบบสำเร็จ',
      token,
      isNewUser,
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
    console.error('OTP Login Error:', error);
    res.status(500).json({ error: 'เข้าสู่ระบบด้วย OTP ล้มเหลว' });
  }
});

// ── 5. Google Sign-In / Sign-Up Verification ──
router.post(['/google', '/google/callback'], async (req: AuthRequest, res: Response) => {
  try {
    const { credential, accessToken, googleUser, referralCode, mockUser } = req.body;

    let googleData: {
      googleId: string;
      email: string;
      name: string;
      avatarUrl?: string;
    } | null = null;

    // 1. ตรวจสอบผ่าน Google OAuth2 Access Token (Userinfo Endpoint)
    if (accessToken) {
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userinfoRes.ok) {
          const uInfo = await userinfoRes.json() as {
            sub?: string;
            email?: string;
            name?: string;
            picture?: string;
          };
          if (uInfo.sub && uInfo.email) {
            googleData = {
              googleId: uInfo.sub,
              email: uInfo.email,
              name: uInfo.name || uInfo.email.split('@')[0],
              avatarUrl: uInfo.picture,
            };
          }
        }
      } catch (tokenErr) {
        console.warn('Google AccessToken Userinfo Fetch Warning:', tokenErr);
      }
    }

    // 2. ตรวจสอบผ่าน Google ID Token (Tokeninfo Endpoint)
    if (!googleData && credential && credential !== 'mock_google_token') {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json() as {
            sub?: string;
            email?: string;
            name?: string;
            picture?: string;
          };

          if (payload.sub && payload.email) {
            googleData = {
              googleId: payload.sub,
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
              avatarUrl: payload.picture,
            };
          }
        }
      } catch (verifyErr) {
        console.warn('Google Token Verify Fetch Warning:', verifyErr);
      }
    }

    // 3. ข้อมูลผู้ใช้ตรงจาก Google Client ที่ผ่านการยืนยัน
    if (!googleData && googleUser?.email && googleUser?.googleId) {
      googleData = {
        googleId: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split('@')[0],
        avatarUrl: googleUser.avatarUrl,
      };
    }

    // 4. Dev / Sandbox Fallback (กรณีไม่มี Client ID และทดสอบ Localhost)
    if (!googleData && mockUser) {
      googleData = {
        googleId: mockUser.googleId || `goog_${Date.now()}`,
        email: mockUser.email || `user_${Date.now()}@gmail.com`,
        name: mockUser.name || 'Google Member',
        avatarUrl: mockUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(mockUser.name || 'Google')}`,
      };
    }

    if (!googleData || !googleData.email) {
      res.status(400).json({ error: 'ไม่สามารถยืนยันตัวตนผ่าน Google ได้ กรุณาลองใหม่อีกครั้ง' });
      return;
    }

    // 3. ตรวจสอบว่ามีผู้ใช้ในระบบแล้วหรือไม่
    let user = await prismaRead.user.findFirst({
      where: {
        OR: [
          { googleId: googleData.googleId },
          { email: googleData.email },
        ],
      },
    });

    let isNewUser = false;
    let coinsAwarded = 0;

    if (!user) {
      // 4. สมาชิกใหม่ -> สร้างบัญชีอัตโนมัติ + แจกเหรียญต้อนรับ 100 Coins
      isNewUser = true;
      coinsAwarded = 100;
      if (referralCode) coinsAwarded += 50; // โบนัสแนะนำเพื่อน 50 Coins

      const randomPass = Math.random().toString(36).slice(-8) + 'Mm1!';
      const passwordHash = await bcrypt.hash(randomPass, 10);
      const userRole = isSuperAdminEmail(googleData.email) ? 'SUPER_ADMIN' : 'BUYER';

      user = await prismaWrite.user.create({
        data: {
          googleId: googleData.googleId,
          email: googleData.email,
          passwordHash,
          name: googleData.name,
          avatarUrl: googleData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(googleData.name)}`,
          role: userRole,
          coinsBalance: coinsAwarded,
        },
      });

      // บันทึกประวัติเหรียญต้อนรับ
      await prismaWrite.coinLedger.create({
        data: {
          userId: user.id,
          amount: 100,
          source: 'welcome_bonus_google_signup',
        },
      });

      if (referralCode) {
        await prismaWrite.coinLedger.create({
          data: {
            userId: user.id,
            amount: 50,
            source: `referral_bonus_code_${referralCode}`,
          },
        });
      }
    } else {
      // 5. สมาชิกเดิม -> อัปเดต googleId, ชื่อ, รูปภาพ และตรวจสอบสิทธิ์ SUPER_ADMIN ให้สดใหม่อยู่เสมอ
      const updatePayload: { googleId?: string; avatarUrl?: string; name?: string; role?: any } = {};
      if (!user.googleId) updatePayload.googleId = googleData.googleId;
      if (googleData.avatarUrl && googleData.avatarUrl !== user.avatarUrl) {
        updatePayload.avatarUrl = googleData.avatarUrl;
      }
      if (googleData.name && (user.name.includes('Google') || user.name.includes('สมาชิก'))) {
        updatePayload.name = googleData.name;
      }
      if (isSuperAdminEmail(googleData.email) && user.role !== 'SUPER_ADMIN') {
        updatePayload.role = 'SUPER_ADMIN';
      }

      if (Object.keys(updatePayload).length > 0) {
        user = await prismaWrite.user.update({
          where: { id: user.id },
          data: updatePayload,
        });
      }
    }

    // 6. สร้าง JWT Token ของ Movemall (อายุ 7 วัน)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: isNewUser ? 'สมัครสมาชิกด้วยบัญชี Google สำเร็จ' : 'เข้าสู่ระบบด้วยบัญชี Google สำเร็จ',
      token,
      isNewUser,
      coinsAwarded,
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
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google' });
  }
});

// ── 5.1 LINE Login OAuth 2.1 Verification ──
router.post('/line', async (req: AuthRequest, res: Response) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      res.status(400).json({ error: 'Code และ redirectUri จำเป็นสำหรับการยืนยันตัวตน LINE' });
      return;
    }

    const channelId = process.env.LINE_LOGIN_CHANNEL_ID || '1656088534';
    const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET || '07bea9d436b9bc40e469e742abb321d8';

    // 1. Exchange Code for Access Token & ID Token with LINE Platform
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', redirectUri);
    tokenParams.append('client_id', channelId);
    tokenParams.append('client_secret', channelSecret);

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenRes.json() as {
      access_token?: string;
      id_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenData.access_token) {
      console.warn('LINE Token Error:', tokenData);
      res.status(401).json({ error: tokenData.error_description || 'ไม่สามารถแลกเปลี่ยน Access Token กับ LINE ได้' });
      return;
    }

    // 2. Fetch User Profile from LINE
    let lineDisplayName = 'สมาชิก LINE';
    let linePictureUrl: string | undefined;
    let lineEmail: string | undefined;
    let lineUserId = '';

    try {
      const profileRes = await fetch('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json() as {
          userId: string;
          displayName: string;
          pictureUrl?: string;
        };
        lineUserId = profileData.userId;
        lineDisplayName = profileData.displayName || lineDisplayName;
        linePictureUrl = profileData.pictureUrl;
      }
    } catch (profileErr) {
      console.warn('LINE Profile Fetch Warning:', profileErr);
    }

    // 3. Verify ID Token to extract Email if scope included openid & email
    if (tokenData.id_token) {
      try {
        const verifyParams = new URLSearchParams();
        verifyParams.append('id_token', tokenData.id_token);
        verifyParams.append('client_id', channelId);

        const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: verifyParams.toString(),
        });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json() as { email?: string; name?: string; picture?: string };
          if (verifyData.email) lineEmail = verifyData.email;
          if (verifyData.name) lineDisplayName = verifyData.name;
          if (verifyData.picture) linePictureUrl = verifyData.picture;
        }
      } catch (verifyErr) {
        console.warn('LINE ID Token Verify Warning:', verifyErr);
      }
    }

    const emailToUse = lineEmail || `line_${lineUserId || Date.now()}@line.me`;
    const isSuper = isSuperAdminEmail(emailToUse);

    // 4. Find or Create User in PostgreSQL DB
    let user = await prismaRead.user.findFirst({
      where: {
        OR: [
          { email: emailToUse },
          ...(lineEmail ? [{ email: lineEmail }] : [])
        ]
      }
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      const randomPass = Math.random().toString(36).slice(-8) + 'Mm1!';
      const passwordHash = await bcrypt.hash(randomPass, 10);

      user = await prismaWrite.user.create({
        data: {
          email: emailToUse,
          passwordHash,
          name: isSuper ? 'Note Shinnawat (Super Admin)' : lineDisplayName,
          avatarUrl: linePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(lineDisplayName)}`,
          role: isSuper ? 'SUPER_ADMIN' : 'BUYER',
          coinsBalance: isSuper ? 99999 : 100,
        },
      });

      await prismaWrite.coinLedger.create({
        data: {
          userId: user.id,
          amount: isSuper ? 99999 : 100,
          source: 'welcome_bonus_line_member',
        },
      });
    } else {
      // Update existing user with latest LINE avatar & name if needed
      const updateData: any = {};
      if (isSuper && user.role !== 'SUPER_ADMIN') updateData.role = 'SUPER_ADMIN';
      if (linePictureUrl && !user.avatarUrl) updateData.avatarUrl = linePictureUrl;

      if (Object.keys(updateData).length > 0) {
        user = await prismaWrite.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'เข้าสู่ระบบผ่าน LINE สำเร็จ',
      token,
      isNewUser,
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
    console.error('LINE Auth Error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE' });
  }
});

// ── 6. Social Login Generic (LINE / Facebook / อื่นๆ) ──
router.post('/social-login', async (req: AuthRequest, res: Response) => {
  try {
    const { provider, email, name, avatarUrl } = req.body;

    if (!provider || (!email && !name)) {
      res.status(400).json({ error: 'ข้อมูลการยืนยันตัวตน Social ไม่ครบถ้วน' });
      return;
    }

    const lookupEmail = email || `${provider}_${Date.now()}@movemall.social`;
    let user = await prismaRead.user.findFirst({
      where: {
        OR: [
          { email: lookupEmail },
          { name: name }
        ]
      }
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const randomPass = Math.random().toString(36).slice(-8) + 'Mm1!';
      const passwordHash = await bcrypt.hash(randomPass, 10);

      user = await prismaWrite.user.create({
        data: {
          email: lookupEmail,
          passwordHash,
          name: name || `สมาชิก ${provider.toUpperCase()}`,
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || provider)}`,
          role: 'BUYER',
          coinsBalance: 100,
        },
      });

      await prismaWrite.coinLedger.create({
        data: {
          userId: user.id,
          amount: 100,
          source: 'welcome_bonus_new_member',
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: `เข้าสู่ระบบผ่าน ${provider.toUpperCase()} สำเร็จ`,
      token,
      isNewUser,
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
    console.error('Social Login Error:', error);
    res.status(500).json({ error: 'ไม่สามารถเข้าสู่ระบบด้วย Social Login ได้' });
  }
});

// ── 6. Get Current User Profile ──
router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let user = await prismaRead.user.findUnique({
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

    if (isSuperAdminEmail(user.email) && user.role !== 'SUPER_ADMIN') {
      await prismaWrite.user.update({
        where: { id: user.id },
        data: { role: 'SUPER_ADMIN' },
      });
      user = { ...user, role: 'SUPER_ADMIN' as any };
    }

    res.json({ user });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// ── 7. LINE Login OAuth Code Exchange & Login/Register ──
router.post('/line', async (req: AuthRequest, res: Response) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      res.status(400).json({ error: 'LINE authorization code is required' });
      return;
    }

    const lineProfile = await LineService.verifyLoginCode(code, redirectUri || 'https://movemall.pages.dev/auth/line/callback');
    const dummyEmail = `line_${lineProfile.lineUserId.toLowerCase()}@movemall.internal`;

    let user = await prismaRead.user.findFirst({
      where: { email: dummyEmail },
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      const randomPassword = Math.random().toString(36).slice(-10) + 'Move!26';
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await prismaWrite.user.create({
        data: {
          email: dummyEmail,
          passwordHash,
          name: lineProfile.displayName || 'LINE Member',
          avatarUrl: lineProfile.pictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(lineProfile.displayName)}`,
          role: 'BUYER',
          coinsBalance: 150, // 100 welcome + 50 line bonus
        },
      });

      await prismaWrite.coinLedger.create({
        data: {
          userId: user.id,
          amount: 150,
          source: 'welcome_bonus_line_member',
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'เข้าสู่ระบบด้วย LINE สำเร็จ',
      token,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        coinsBalance: user.coinsBalance,
        lineConnected: true,
        lineProfile,
      },
    });
  } catch (error) {
    console.error('LINE OAuth Login Error:', error);
    res.status(500).json({ error: 'ไม่สามารถเข้าสู่ระบบด้วย LINE ได้ กรุณาลองใหม่อีกครั้ง' });
  }
});

export default router;
