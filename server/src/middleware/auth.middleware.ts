import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { isTokenRevoked } from '../services/tokenRevocation.service.js';

interface JwtPayload {
  userId: string;
  email?: string;
  role: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    role: string;
  };
  /** ข้อมูลของ token ใบที่ใช้เรียก — ใช้ตอน logout เพื่อเพิกถอนใบนั้น */
  tokenMeta?: { jti?: string; exp?: number };
}

export async function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token format', code: 'AUTH_REQUIRED' });
    return;
  }

  const token = authHeader.split(' ')[1];

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    res.status(403).json({ error: 'Forbidden: Invalid or expired token', code: 'AUTH_REQUIRED' });
    return;
  }

  // ตรวจบัญชีดำ: token ที่ถูกเพิกถอน (logout / เปลี่ยนรหัสผ่าน / ถูกแบน) ต้องใช้ไม่ได้
  if (await isTokenRevoked(decoded.jti, decoded.userId, decoded.iat)) {
    res.status(401).json({ error: 'Session ถูกยกเลิกแล้ว กรุณาเข้าสู่ระบบใหม่', code: 'AUTH_REQUIRED' });
    return;
  }

  req.user = decoded;
  req.tokenMeta = { jti: decoded.jti, exp: decoded.exp };
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
      return;
    }

    // SUPER_ADMIN and ADMIN have access to all routes by default
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({ error: `Forbidden: Access restricted to ${allowedRoles.join(', ')} roles` });
  };
}
