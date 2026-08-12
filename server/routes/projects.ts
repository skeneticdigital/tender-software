import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all projects with search & filter
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, status } = req.query;
    
    const where: any = {};
    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { projectName: { contains: q } },
        { contractNumber: { contains: q } },
        { client: { contains: q } },
        { location: { contains: q } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const projects = await prisma.project.findMany({ where });

    // Enriched with bills and retentions
    const enriched = await Promise.all(projects.map(async (p) => {
      const bills = await prisma.bill.findMany({ where: { projectId: p.id } });
      const retentions = await prisma.retention.findMany({ where: { projectId: p.id } });

      const totalBilled = bills.reduce((acc, b) => acc + (b.netPayable || 0), 0);
      const totalCollected = bills.reduce((acc, b) => acc + (b.paymentReceivedAmount || 0), 0);
      const outstanding = bills.reduce((acc, b) => acc + (b.outstandingAmount || 0), 0);
      const retentionHeld = retentions.reduce((acc, r) => acc + (r.retentionAmount || 0), 0);

      return {
        ...p,
        totalBilled,
        totalCollected,
        outstanding,
        retentionHeld
      };
    }));

    return res.json(enriched);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET single project details with all tabs data
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [
      sites, bills, dispatches, receipts, consumptions,
      payments, retentions, documents, activities
    ] = await Promise.all([
      prisma.projectSite.findMany({ where: { projectId: project.id } }),
      prisma.bill.findMany({ where: { projectId: project.id } }),
      prisma.materialDispatch.findMany({ where: { projectId: project.id } }),
      prisma.materialReceipt.findMany({ where: { projectId: project.id } }),
      prisma.materialConsumption.findMany({ where: { projectId: project.id } }),
      prisma.payment.findMany({ where: { projectId: project.id } }),
      prisma.retention.findMany({ where: { projectId: project.id } }),
      prisma.appDocument.findMany({ where: { relatedType: 'Project', relatedId: project.id } }),
      prisma.auditLog.findMany({ 
        where: { 
          OR: [
            { recordId: project.id },
            { action: { contains: project.projectName } },
            { action: { contains: project.contractNumber } }
          ]
        }
      })
    ]);

    const totalBilled = bills.reduce((acc, b) => acc + (b.netPayable || 0), 0);
    const totalCollected = bills.reduce((acc, b) => acc + (b.paymentReceivedAmount || 0), 0);
    const outstanding = bills.reduce((acc, b) => acc + (b.outstandingAmount || 0), 0);
    const totalDeductions = bills.reduce((acc, b) => acc + (b.totalDeductions || 0), 0);
    const retentionHeld = retentions.reduce((acc, r) => acc + (r.retentionAmount || 0), 0);

    const totalDispatchedQty = dispatches.reduce((acc, d) => acc + (d.quantity || 0), 0);
    const totalConsumedQty = consumptions.reduce((acc, c) => acc + (c.quantityConsumed || 0), 0);

    return res.json({
      ...project,
      sites,
      financialSummary: {
        contractValue: project.contractValue,
        awardedAmount: project.awardedAmount,
        totalBilled,
        totalCollected,
        outstanding,
        totalDeductions,
        retentionHeld
      },
      materialSummary: {
        totalDispatchedQty,
        totalConsumedQty,
        siteBalanceQty: totalDispatchedQty - totalConsumedQty
      },
      bills, dispatches, receipts, consumptions, payments, retentions, documents, activities
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Create Project
router.post('/', authenticateToken, authorizeRoles('Project Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    if (!body.projectName || !body.contractNumber || !body.client || !body.startDate || !body.plannedCompletionDate) {
      return res.status(400).json({ error: 'Required fields missing.' });
    }

    const newProject = await prisma.project.create({
      data: {
        tenderId: body.tenderId,
        projectName: body.projectName,
        tenderRef: body.tenderRef || 'DIRECT',
        client: body.client,
        contractNumber: body.contractNumber,
        location: body.location || 'Site Location',
        startDate: body.startDate,
        plannedCompletionDate: body.plannedCompletionDate,
        actualCompletionDate: body.actualCompletionDate,
        contractValue: Number(body.contractValue) || 0,
        awardedAmount: Number(body.awardedAmount) || Number(body.contractValue) || 0,
        projectManagerId: body.projectManagerId || req.user?.id,
        siteSupervisorId: body.siteSupervisorId,
        status: body.status || 'Active',
        completionPercentage: Number(body.completionPercentage) || 0,
        remarks: body.remarks
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Created Project ${newProject.contractNumber} (${newProject.projectName})`,
        module: 'Projects',
        recordId: newProject.id
      }
    });

    return res.status(201).json(newProject);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT Update Project
router.put('/:id', authenticateToken, authorizeRoles('Project Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id, createdAt, updatedAt, ...updateData } = req.body;
    
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: updateData
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Updated Project ${project.contractNumber}`,
        module: 'Projects',
        recordId: project.id
      }
    });

    return res.json(project);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
