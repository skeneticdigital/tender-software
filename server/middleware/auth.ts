import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { User } from '@prisma/client';

export const JWT_SECRET = process.env.JWT_SECRET || 'tenderflow-secret-key-2026-production';

export interface AuthRequest extends Request {
  user?: User;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token provided, allow demo mode as fallback or return 401
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = await prisma.user.findFirst({ where: { id: decoded.id, status: 'Active' } });
    if (!user) {
      return res.status(401).json({ error: 'User not found or account inactive' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role === 'Super Admin') {
      return next(); // Super Admin always bypasses role checks
    }
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: `Access denied. Role '${req.user.role}' is not authorized for this operation.` });
  };
}
