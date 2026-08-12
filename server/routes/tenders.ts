import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all tenders with search and filter
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, department, category, minVal, maxVal } = req.query;
    
    const where: any = {};
    if (status) where.tenderStatus = status;
    if (department) where.department = department;
    if (category) where.projectCategory = category;
    
    if (minVal || maxVal) {
      where.estimatedValue = {};
      if (minVal) where.estimatedValue.gte = Number(minVal);
      if (maxVal) where.estimatedValue.lte = Number(maxVal);
    }

    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { name: { contains: q } },
        { refNumber: { contains: q } },
        { clientName: { contains: q } },
        { location: { contains: q } }
      ];
    }

    const tenders = await prisma.tender.findMany({ where, orderBy: { createdAt: 'desc' } });

    // Calculate financial fields dynamically for each tender
    const enriched = tenders.map(t => {
      const quoteDiff = (t.quotedAmount || 0) - (t.estimatedValue || 0);
      const quoteVariancePct = t.estimatedValue > 0 ? (quoteDiff / t.estimatedValue) * 100 : 0;
      const awardDiff = (t.awardedAmount || 0) - (t.quotedAmount || 0);

      return {
        ...t,
        quoteDiff,
        quoteVariancePct,
        awardDiff
      };
    });

    return res.json(enriched);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET single tender analytics
router.get('/analytics', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenders = await prisma.tender.findMany();
    const completed = tenders.filter(t => ['Won', 'Lost'].includes(t.tenderStatus));
    const won = tenders.filter(t => t.tenderStatus === 'Won');
    const lost = tenders.filter(t => t.tenderStatus === 'Lost');

    const winRate = completed.length > 0 ? (won.length / completed.length) * 100 : 0;
    const totalQuotedValue = tenders.reduce((acc, t) => acc + (t.quotedAmount || 0), 0);
    const totalAwardedValue = won.reduce((acc, t) => acc + (t.awardedAmount || t.quotedAmount || 0), 0);

    // Client-wise performance
    const clientMap: Record<string, { total: number; won: number; lost: number; quotedVal: number }> = {};
    tenders.forEach(t => {
      if (!clientMap[t.clientName]) {
        clientMap[t.clientName] = { total: 0, won: 0, lost: 0, quotedVal: 0 };
      }
      clientMap[t.clientName].total++;
      if (t.tenderStatus === 'Won') clientMap[t.clientName].won++;
      if (t.tenderStatus === 'Lost') clientMap[t.clientName].lost++;
      clientMap[t.clientName].quotedVal += t.quotedAmount || 0;
    });

    const clientPerformance = Object.entries(clientMap).map(([client, data]) => ({
      client,
      total: data.total,
      won: data.won,
      lost: data.lost,
      quotedVal: data.quotedVal
    }));

    // Category-wise stats
    const categoryMap: Record<string, { total: number; won: number; value: number }> = {};
    tenders.forEach(t => {
      if (!categoryMap[t.projectCategory]) {
        categoryMap[t.projectCategory] = { total: 0, won: 0, value: 0 };
      }
      categoryMap[t.projectCategory].total++;
      if (t.tenderStatus === 'Won') categoryMap[t.projectCategory].won++;
      categoryMap[t.projectCategory].value += t.quotedAmount || 0;
    });

    const categoryPerformance = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      total: data.total,
      won: data.won,
      value: data.value
    }));

    return res.json({
      totalTenders: tenders.length,
      wonCount: won.length,
      lostCount: lost.length,
      winRate,
      totalQuotedValue,
      totalAwardedValue,
      clientPerformance,
      categoryPerformance
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET single tender details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tender = await prisma.tender.findUnique({
      where: { id: req.params.id }
    });
    
    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    const emd = await prisma.emdTransaction.findFirst({ where: { tenderId: tender.id } });
    const docs = await prisma.appDocument.findMany({ where: { relatedType: 'Tender', relatedId: tender.id } });
    const project = await prisma.project.findFirst({ where: { tenderId: tender.id } });

    const quoteDiff = (tender.quotedAmount || 0) - (tender.estimatedValue || 0);
    const quoteVariancePct = tender.estimatedValue > 0 ? (quoteDiff / tender.estimatedValue) * 100 : 0;
    const awardDiff = (tender.awardedAmount || 0) - (tender.quotedAmount || 0);

    return res.json({
      ...tender,
      quoteDiff,
      quoteVariancePct,
      awardDiff,
      emd,
      documents: docs,
      project
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Create Tender
router.post('/', authenticateToken, authorizeRoles('Tender Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    if (!body.refNumber || !body.name || !body.clientName || !body.submissionDate || !body.estimatedValue) {
      return res.status(400).json({ error: 'Please provide all required fields (Ref Number, Name, Client, Submission Date, Estimated Value)' });
    }

    // Check duplicate refNumber
    const existing = await prisma.tender.findFirst({
      where: { refNumber: body.refNumber }
    });
    
    if (existing) {
      return res.status(400).json({ error: `Tender with Reference Number '${body.refNumber}' already exists.` });
    }

    const emdRequired = body.emdRequired !== false;
    const emdAmount = Number(body.emdAmount) || 0;

    const newTender = await prisma.$transaction(async (tx) => {
      const tender = await tx.tender.create({
        data: {
          refNumber: body.refNumber,
          name: body.name,
          clientName: body.clientName,
          department: body.department || 'Public Works',
          departmentType: body.departmentType || 'State Gov',
          tenderType: body.tenderType || 'Item Rate',
          projectCategory: body.projectCategory || 'Building',
          location: body.location || 'Site Location',
          submissionDate: body.submissionDate,
          openingDate: body.openingDate || body.submissionDate,
          estimatedValue: Number(body.estimatedValue) || 0,
          quotedAmount: Number(body.quotedAmount) || 0,
          tenderFee: Number(body.tenderFee) || 0,
          emdRequired,
          emdAmount,
          emdPaymentDate: body.emdPaymentDate,
          emdBankAccount: body.emdBankAccount,
          tenderStatus: body.tenderStatus || 'Draft',
          competitorInfo: body.competitorInfo,
          remarks: body.remarks,
          createdBy: req.user?.id || 'u-001'
        }
      });

      if (emdRequired && emdAmount > 0 && body.emdPaymentDate) {
        await tx.emdTransaction.create({
          data: {
            tenderId: tender.id,
            tenderName: tender.name,
            refNumber: tender.refNumber,
            clientName: tender.clientName,
            emdAmount: tender.emdAmount,
            paymentDate: body.emdPaymentDate,
            bankAccount: body.emdBankAccount || 'Corporate Bank Account',
            transactionRef: 'TRX-' + Date.now(),
            paymentMethod: 'Bank Guarantee',
            emdType: 'Standard EMD',
            expectedRefundDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
            refundAmount: 0,
            refundStatus: 'Paid'
          }
        });
      }

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          userName: req.user!.name,
          userRole: req.user!.role,
          action: `Created Tender ${tender.refNumber}`,
          module: 'Tenders',
          recordId: tender.id
        }
      });
      
      return tender;
    });

    return res.status(201).json(newTender);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT Update Tender
router.put('/:id', authenticateToken, authorizeRoles('Tender Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const existingTender = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!existingTender) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    const oldStatus = existingTender.tenderStatus;
    const body = req.body;
    
    const updatedTender = await prisma.$transaction(async (tx) => {
      const tender = await tx.tender.update({
        where: { id: req.params.id },
        data: {
          ...body,
          estimatedValue: body.estimatedValue ? Number(body.estimatedValue) : undefined,
          quotedAmount: body.quotedAmount ? Number(body.quotedAmount) : undefined,
          tenderFee: body.tenderFee ? Number(body.tenderFee) : undefined,
          emdAmount: body.emdAmount ? Number(body.emdAmount) : undefined,
          awardedAmount: body.awardedAmount ? Number(body.awardedAmount) : undefined
        }
      });

      if (tender.tenderStatus === 'Lost' && oldStatus !== 'Lost') {
        const emd = await tx.emdTransaction.findFirst({ where: { tenderId: tender.id } });
        if (emd && emd.refundStatus === 'Paid') {
          const resultDate = tender.resultDate ? new Date(tender.resultDate) : new Date();
          const expectedRefund = new Date(resultDate.getTime() + 60 * 24 * 3600 * 1000);
          
          await tx.emdTransaction.update({
            where: { id: emd.id },
            data: {
              refundStatus: 'Refund Pending',
              expectedRefundDate: expectedRefund.toISOString().split('T')[0]
            }
          });

          await tx.appNotification.create({
            data: {
              title: 'EMD Refund Schedule Created',
              message: `EMD of ₹${(emd.emdAmount / 100000).toFixed(2)} Lakhs for lost tender ${tender.refNumber} expected refund by ${expectedRefund.toISOString().split('T')[0]}`,
              priority: 'High',
              category: 'EMD',
              link: '/emd',
              relatedId: emd.id
            }
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          userName: req.user!.name,
          userRole: req.user!.role,
          action: `Updated Tender ${tender.refNumber}`,
          module: 'Tenders',
          recordId: tender.id
        }
      });

      return tender;
    });

    return res.json(updatedTender);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Convert Tender to Project
router.post('/:id/convert-project', authenticateToken, authorizeRoles('Tender Manager', 'Project Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const tender = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    if (tender.tenderStatus !== 'Won') {
      return res.status(400).json({ error: 'Only WON tenders can be converted to a Project.' });
    }

    const existingProject = await prisma.project.findFirst({ where: { tenderId: tender.id } });
    if (existingProject) {
      return res.status(400).json({ error: `Project '${existingProject.projectName}' already created for this tender.` });
    }

    const { contractNumber, startDate, plannedCompletionDate, projectManagerId, siteSupervisorId, remarks } = req.body;

    if (!contractNumber || !startDate || !plannedCompletionDate) {
      return res.status(400).json({ error: 'Contract Number, Start Date, and Planned Completion Date are required.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          tenderId: tender.id,
          projectName: tender.name,
          tenderRef: tender.refNumber,
          client: tender.clientName,
          contractNumber,
          location: tender.location,
          startDate,
          plannedCompletionDate,
          contractValue: tender.awardedAmount || tender.quotedAmount || tender.estimatedValue,
          awardedAmount: tender.awardedAmount || tender.quotedAmount || tender.estimatedValue,
          projectManagerId: projectManagerId || 'u-003',
          siteSupervisorId: siteSupervisorId || 'u-004',
          status: 'Active',
          completionPercentage: 0,
          remarks: remarks || `Converted from Won Tender ${tender.refNumber}`
        }
      });

      const emd = await tx.emdTransaction.findFirst({ where: { tenderId: tender.id } });
      if (emd && emd.refundStatus === 'Paid') {
        await tx.emdTransaction.update({
          where: { id: emd.id },
          data: {
            refundStatus: 'Converted to Security Deposit',
            convertedTo: `SD-${newProject.id}`,
            actualRefundDate: new Date().toISOString().split('T')[0]
          }
        });

        await tx.securityDeposit.create({
          data: {
            projectId: newProject.id,
            projectName: newProject.projectName,
            tenderId: tender.id,
            depositType: 'Performance Guarantee',
            amount: emd.emdAmount,
            depositDate: new Date().toISOString().split('T')[0],
            bank: emd.bankAccount,
            refNumber: emd.transactionRef,
            expectedReleaseDate: plannedCompletionDate,
            status: 'Active',
            remarks: 'Converted from Tender EMD upon project award.'
          }
        });
      }

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          userName: req.user!.name,
          userRole: req.user!.role,
          action: `Converted Tender ${tender.refNumber} to Project ${newProject.contractNumber}`,
          module: 'Projects',
          recordId: newProject.id
        }
      });

      await tx.appNotification.create({
        data: {
          title: 'New Project Created',
          message: `Project ${newProject.projectName} created from Won Tender ${tender.refNumber}`,
          priority: 'Medium',
          category: 'Project',
          link: '/projects',
          relatedId: newProject.id
        }
      });

      return newProject;
    });

    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
