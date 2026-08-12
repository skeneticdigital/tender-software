import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all settings and deduction types
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const deductionTypes = await prisma.deductionType.findMany();
    
    return res.json({
      settings,
      deductionTypes
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT Update Settings
router.put('/', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { settings, deductionTypes } = req.body;

    await prisma.$transaction(async (tx) => {
      if (settings && Array.isArray(settings)) {
        for (const s of settings) {
          const existing = await tx.systemSetting.findFirst({ where: { key: s.key } });
          if (existing) {
            await tx.systemSetting.update({
              where: { id: existing.id },
              data: { value: s.value }
            });
          } else {
            await tx.systemSetting.create({
              data: { key: s.key, value: s.value, description: 'Custom setting' }
            });
          }
        }
      }

      if (deductionTypes && Array.isArray(deductionTypes)) {
        for (const dt of deductionTypes) {
          if (dt.id) {
            await tx.deductionType.update({
              where: { id: dt.id },
              data: {
                name: dt.name,
                defaultPercentage: dt.defaultPercentage,
                fixedAmount: dt.fixedAmount,
                calculationBase: dt.calculationBase,
                isActive: dt.isActive
              }
            });
          } else {
            await tx.deductionType.create({
              data: {
                name: dt.name,
                defaultPercentage: dt.defaultPercentage || 0,
                fixedAmount: dt.fixedAmount || 0,
                calculationBase: dt.calculationBase || 'Gross',
                isActive: dt.isActive !== false
              }
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          userName: req.user!.name,
          userRole: req.user!.role,
          action: 'Updated System Settings and Deduction Configuration',
          module: 'Settings',
          recordId: 'SYSTEM'
        }
      });
    });

    const updatedSettings = await prisma.systemSetting.findMany();
    const updatedDeductionTypes = await prisma.deductionType.findMany();

    return res.json({ success: true, settings: updatedSettings, deductionTypes: updatedDeductionTypes });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Execute Raw SQL Query
router.post('/query', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req: AuthRequest, res: Response) => {
  const { query } = req.body;
  
  if (!query) return res.status(400).json({ error: 'Query is required.' });

  // Safety check to only allow SELECT queries, unless authorized
  const qUpper = query.trim().toUpperCase();
  const isSelect = qUpper.startsWith('SELECT') || qUpper.startsWith('SHOW') || qUpper.startsWith('DESCRIBE');
  
  if (!isSelect && req.user?.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Only SELECT queries are allowed for safety reasons.' });
  }

  try {
    const result = await prisma.$queryRawUnsafe(query);
    
    // For queries that don't return rows (like INSERT/UPDATE), Prisma returns a number (rows affected)
    if (typeof result === 'number') {
      return res.json([{ _rowsAffected: result }]);
    }
    
    // Convert BigInt to string to avoid JSON serialization errors
    const sanitizedResult = JSON.parse(JSON.stringify(result, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return res.json(sanitizedResult);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Database query failed' });
  }
});

export default router;
