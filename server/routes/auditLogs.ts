import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { module, search } = req.query;
    
    const where: any = {};
    if (module) {
      where.module = module;
    }

    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { userName: { contains: q } },
        { action: { contains: q } },
        { module: { contains: q } }
      ];
    }

    const logs = await prisma.auditLog.findMany({ where, orderBy: { timestamp: 'desc' } });
    return res.json(logs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
