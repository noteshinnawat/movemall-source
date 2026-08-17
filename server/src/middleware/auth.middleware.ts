import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'movemall_super_secure_jwt_secret_key_2026_at_least_32_chars!';

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email?: string; role: string };
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
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
