import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all EMD Transactions
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    
    const where: any = {};
    if (status) {
      where.refundStatus = status;
    }

    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { tenderName: { contains: q } },
        { refNumber: { contains: q } },
        { clientName: { contains: q } },
        { transactionRef: { contains: q } }
      ];
    }

    const emds = await prisma.emdTransaction.findMany({ where, orderBy: { createdAt: 'desc' } });
    return res.json(emds);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET Security Deposits
router.get('/security-deposits', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    
    const where: any = {};
    if (status) {
      where.status = status;
    }

    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { projectName: { contains: q } },
        { refNumber: { contains: q } },
        { bank: { contains: q } }
      ];
    }

    const sds = await prisma.securityDeposit.findMany({ where, orderBy: { createdAt: 'desc' } });
    return res.json(sds);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Create EMD Transaction
router.post('/', authenticateToken, authorizeRoles('Tender Manager', 'Accounts Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    if (!body.tenderId || !body.emdAmount || !body.paymentDate || !body.bankAccount) {
      return res.status(400).json({ error: 'Tender ID, EMD Amount, Payment Date, and Bank Account are required.' });
    }

    const tender = await prisma.tender.findUnique({ where: { id: body.tenderId } });

    const newEmd = await prisma.emdTransaction.create({
      data: {
        tenderId: body.tenderId,
        tenderName: tender?.name || body.tenderName || 'Tender',
        refNumber: tender?.refNumber || body.refNumber || 'REF',
        clientName: tender?.clientName || body.clientName || 'Client',
        emdAmount: Number(body.emdAmount),
        paymentDate: body.paymentDate,
        bankAccount: body.bankAccount,
        transactionRef: body.transactionRef || 'TRX-' + Date.now(),
        paymentMethod: body.paymentMethod || 'Bank Guarantee',
        emdType: body.emdType || 'Standard EMD',
        expectedRefundDate: body.expectedRefundDate || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
        refundAmount: 0,
        refundStatus: 'Paid',
        remarks: body.remarks
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Recorded EMD Payment ₹${newEmd.emdAmount} for ${newEmd.refNumber}`,
        module: 'EMD',
        recordId: newEmd.id
      }
    });

    return res.status(201).json(newEmd);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT Update EMD Refund Status
router.put('/:id', authenticateToken, authorizeRoles('Tender Manager', 'Accounts Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { refundStatus, actualRefundDate, refundAmount, remarks } = req.body;

    const emd = await prisma.emdTransaction.update({
      where: { id: req.params.id },
      data: {
        ...(refundStatus && { refundStatus }),
        ...(actualRefundDate && { actualRefundDate }),
        ...(refundAmount !== undefined && { refundAmount: Number(refundAmount) }),
        ...(remarks !== undefined && { remarks })
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Updated EMD Refund Status to '${emd.refundStatus}' for ${emd.refNumber}`,
        module: 'EMD',
        recordId: emd.id
      }
    });

    return res.json(emd);
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'EMD transaction not found' });
    }
    return res.status(500).json({ error: err.message });
  }
});

// POST Create Security Deposit
router.post('/security-deposits', authenticateToken, authorizeRoles('Accounts Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    if (!body.projectId || !body.amount || !body.depositDate || !body.expectedReleaseDate) {
      return res.status(400).json({ error: 'Project ID, Amount, Deposit Date, and Expected Release Date are required.' });
    }

    const project = await prisma.project.findUnique({ where: { id: body.projectId } });

    const newSd = await prisma.securityDeposit.create({
      data: {
        projectId: body.projectId,
        projectName: project?.projectName || body.projectName || 'Project',
        tenderId: body.tenderId,
        depositType: body.depositType || 'Performance Guarantee',
        amount: Number(body.amount),
        depositDate: body.depositDate,
        bank: body.bank || 'Bank',
        refNumber: body.refNumber || 'REF-' + Date.now(),
        expectedReleaseDate: body.expectedReleaseDate,
        status: 'Active',
        remarks: body.remarks
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Created Security Deposit ₹${newSd.amount} for ${newSd.projectName}`,
        module: 'Security Deposit',
        recordId: newSd.id
      }
    });

    return res.status(201).json(newSd);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT Update Security Deposit Release
router.put('/security-deposits/:id', authenticateToken, authorizeRoles('Accounts Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, actualReleaseDate, remarks } = req.body;

    const sd = await prisma.securityDeposit.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(actualReleaseDate && { actualReleaseDate }),
        ...(remarks !== undefined && { remarks })
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Updated Security Deposit Status to '${sd.status}' for ${sd.projectName}`,
        module: 'Security Deposit',
        recordId: sd.id
      }
    });

    return res.json(sd);
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Security deposit not found' });
    }
    return res.status(500).json({ error: err.message });
  }
});

export default router;
