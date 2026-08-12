import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/:reportType', authenticateToken, (req: AuthRequest, res: Response) => {
  const { reportType } = req.params;
  const { startDate, endDate, projectId, status, category } = req.query;

  const filterByDate = (dateStr?: string) => {
    if (!dateStr) return true;
    const itemDate = new Date(dateStr);
    if (startDate && new Date(startDate as string) > itemDate) return false;
    if (endDate && new Date(endDate as string) < itemDate) return false;
    return true;
  };

  switch (reportType) {
    case 'tenders':
    case 'tender-win-loss': {
      let tenders = db.get.tenders.filter(t => filterByDate(t.submissionDate));
      if (status) tenders = tenders.filter(t => t.tenderStatus === status);
      const summary = {
        total: tenders.length,
        won: tenders.filter(t => t.tenderStatus === 'Won').length,
        lost: tenders.filter(t => t.tenderStatus === 'Lost').length,
        totalQuoted: tenders.reduce((acc, t) => acc + (t.quotedAmount || 0), 0),
        totalAwarded: tenders.filter(t => t.tenderStatus === 'Won').reduce((acc, t) => acc + (t.awardedAmount || 0), 0)
      };
      return res.json({ type: reportType, summary, data: tenders });
    }

    case 'emd': {
      let emds = db.get.emdTransactions.filter(e => filterByDate(e.paymentDate));
      if (status) emds = emds.filter(e => e.refundStatus === status);
      const summary = {
        totalEmdAmount: emds.reduce((acc, e) => acc + e.emdAmount, 0),
        refundedAmount: emds.reduce((acc, e) => acc + e.refundAmount, 0),
        pendingRefundAmount: emds.filter(e => e.refundStatus === 'Refund Pending').reduce((acc, e) => acc + e.emdAmount, 0)
      };
      return res.json({ type: reportType, summary, data: emds });
    }

    case 'security-deposits': {
      let sds = db.get.securityDeposits.filter(s => filterByDate(s.depositDate));
      if (status) sds = sds.filter(s => s.status === status);
      return res.json({ type: reportType, data: sds });
    }

    case 'projects':
    case 'project-financial':
    case 'profitability': {
      let projects = db.get.projects.filter(p => filterByDate(p.startDate));
      if (status) projects = projects.filter(p => p.status === status);

      const enriched = projects.map(p => {
        const bills = db.get.bills.filter(b => b.projectId === p.id);
        const totalBilled = bills.reduce((acc, b) => acc + b.netPayable, 0);
        const totalCollected = bills.reduce((acc, b) => acc + b.paymentReceivedAmount, 0);
        const outstanding = bills.reduce((acc, b) => acc + b.outstandingAmount, 0);

        const consumptions = db.get.materialConsumptions.filter(c => c.projectId === p.id);
        const estMaterialCost = consumptions.reduce((acc, c) => {
          const mat = db.get.materials.find(m => m.id === c.materialId);
          return acc + (c.quantityConsumed * (mat?.unitRate || 100));
        }, 0);

        return {
          ...p,
          totalBilled,
          totalCollected,
          outstanding,
          estMaterialCost,
          grossMarginPct: totalBilled > 0 ? ((totalBilled - estMaterialCost) / totalBilled) * 100 : 0
        };
      });

      return res.json({ type: reportType, data: enriched });
    }

    case 'material-stock': {
      let materials = db.get.materials;
      if (category) materials = materials.filter(m => m.category === category);
      return res.json({ type: reportType, data: materials });
    }

    case 'material-consumption': {
      let consumptions = db.get.materialConsumptions.filter(c => filterByDate(c.consumptionDate));
      if (projectId) consumptions = consumptions.filter(c => c.projectId === projectId);
      return res.json({ type: reportType, data: consumptions });
    }

    case 'billing':
    case 'outstanding': {
      let bills = db.get.bills.filter(b => filterByDate(b.billDate));
      if (projectId) bills = bills.filter(b => b.projectId === projectId);
      if (status) bills = bills.filter(b => b.status === status);
      const summary = {
        totalBilled: bills.reduce((acc, b) => acc + b.netPayable, 0),
        totalCollected: bills.reduce((acc, b) => acc + b.paymentReceivedAmount, 0),
        totalOutstanding: bills.reduce((acc, b) => acc + b.outstandingAmount, 0)
      };
      return res.json({ type: reportType, summary, data: bills });
    }

    case 'payments': {
      let payments = db.get.payments.filter(p => filterByDate(p.paymentDate));
      if (projectId) payments = payments.filter(p => p.projectId === projectId);
      return res.json({ type: reportType, data: payments });
    }

    case 'deductions': {
      const billDeductions = db.get.billDeductions;
      return res.json({ type: reportType, data: billDeductions });
    }

    case 'retention': {
      let retentions = db.get.retentions.filter(r => filterByDate(r.retentionDate));
      if (status) retentions = retentions.filter(r => r.status === status);
      return res.json({ type: reportType, data: retentions });
    }

    default:
      return res.status(400).json({ error: 'Unknown report type' });
  }
});

export default router;
