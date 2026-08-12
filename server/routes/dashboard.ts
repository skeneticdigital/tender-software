import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const tenders = db.get.tenders;
  const projects = db.get.projects;
  const bills = db.get.bills;
  const emds = db.get.emdTransactions;
  const retentions = db.get.retentions;
  const stockAlerts = db.get.stockAlerts.filter(a => a.status === 'Active');
  const materials = db.get.materials;
  const notifications = db.get.notifications;

  // KPIs
  const totalTenders = tenders.length;
  const activeTenders = tenders.filter(t => ['Preparing', 'Submitted', 'Under Evaluation'].includes(t.tenderStatus)).length;
  const wonTenders = tenders.filter(t => t.tenderStatus === 'Won').length;
  const lostTenders = tenders.filter(t => t.tenderStatus === 'Lost').length;
  const totalTenderValue = tenders.reduce((acc, t) => acc + (t.quotedAmount || t.estimatedValue || 0), 0);

  const activeProjects = projects.filter(p => ['Active', 'Not Started', 'Near Completion'].includes(p.status)).length;
  const totalProjectValue = projects.reduce((acc, p) => acc + (p.contractValue || 0), 0);

  const totalBilling = bills.reduce((acc, b) => acc + (b.netPayable || 0), 0);
  const totalCollection = bills.reduce((acc, b) => acc + (b.paymentReceivedAmount || 0), 0);
  const outstandingAmount = bills.reduce((acc, b) => acc + (b.outstandingAmount || 0), 0);

  const emdPendingRefund = emds
    .filter(e => ['Refund Pending', 'Paid'].includes(e.refundStatus) && (!e.actualRefundDate || e.refundAmount < e.emdAmount))
    .reduce((acc, e) => acc + (e.emdAmount - (e.refundAmount || 0)), 0);

  const retentionAmountHeld = retentions
    .filter(r => r.status === 'Held' || r.status === 'Due Soon' || r.status === 'Overdue')
    .reduce((acc, r) => acc + (r.retentionAmount || 0), 0);

  const lowStockAlertsCount = materials.filter(m => m.currentStock <= m.reorderLevel).length;

  // Charts
  const tenderWinLoss = [
    { name: 'Won', value: wonTenders, color: '#10B981' },
    { name: 'Lost', value: lostTenders, color: '#EF4444' },
    { name: 'Under Evaluation', value: tenders.filter(t => t.tenderStatus === 'Under Evaluation').length, color: '#F59E0B' },
    { name: 'Submitted / Prep', value: tenders.filter(t => ['Submitted', 'Preparing'].includes(t.tenderStatus)).length, color: '#3B82F6' },
  ];

  const projectStatusSummary = [
    { name: 'Active', count: projects.filter(p => p.status === 'Active').length },
    { name: 'Near Completion', count: projects.filter(p => p.status === 'Near Completion').length },
    { name: 'Completed', count: projects.filter(p => p.status === 'Completed').length },
    { name: 'Not Started', count: projects.filter(p => p.status === 'Not Started').length },
  ];

  // Monthly Billing vs Collection Chart
  const monthlyBilling = [
    { month: 'Apr 2026', billed: 38000000, collected: 35000000 },
    { month: 'May 2026', billed: 52000000, collected: 48000000 },
    { month: 'Jun 2026', billed: 45000000, collected: 48150000 },
    { month: 'Jul 2026', billed: 185000000, collected: 68150000 },
    { month: 'Aug 2026', billed: 62000000, collected: 20000000 }
  ];

  // Action Required Section
  const now = new Date();
  const actionItems: Array<{
    id: string;
    type: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    title: string;
    description: string;
    dueDate?: string;
    linkModule: string;
    linkId: string;
  }> = [];

  // 1. Upcoming Tender Deadlines (< 14 days)
  tenders.forEach(t => {
    if (['Preparing', 'Submitted'].includes(t.tenderStatus)) {
      const subDate = new Date(t.submissionDate);
      const diffDays = Math.ceil((subDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays <= 14) {
        actionItems.push({
          id: `act-t-${t.id}`,
          type: 'Tender Deadline',
          priority: diffDays <= 3 ? 'Critical' : 'High',
          title: `Tender Submission Due in ${diffDays} day(s)`,
          description: `${t.name} (${t.clientName}) - Submission deadline ${t.submissionDate.split('T')[0]}`,
          dueDate: t.submissionDate.split('T')[0],
          linkModule: 'tenders',
          linkId: t.id
        });
      }
    }
  });

  // 2. EMD Overdue Refunds
  emds.forEach(e => {
    if (e.refundStatus === 'Refund Pending') {
      actionItems.push({
        id: `act-emd-${e.id}`,
        type: 'EMD Refund Overdue',
        priority: 'Critical',
        title: `EMD Refund Pending: ₹${(e.emdAmount / 100000).toFixed(2)} Lakhs`,
        description: `EMD for ${e.tenderName} (${e.clientName}) is pending refund. Expected: ${e.expectedRefundDate}`,
        dueDate: e.expectedRefundDate,
        linkModule: 'emd',
        linkId: e.id
      });
    }
  });

  // 3. Overdue Bills
  bills.forEach(b => {
    if (['Submitted', 'Under Review', 'Approved', 'Partially Paid'].includes(b.status) && b.outstandingAmount > 0) {
      const dueDate = new Date(b.paymentDueDate);
      if (dueDate < now) {
        actionItems.push({
          id: `act-bill-${b.id}`,
          type: 'Overdue Bill Payment',
          priority: 'Critical',
          title: `Bill ${b.billNumber} Overdue Payment`,
          description: `Outstanding balance of ₹${(b.outstandingAmount / 100000).toFixed(2)} Lakhs from ${b.clientName}`,
          dueDate: b.paymentDueDate,
          linkModule: 'billing',
          linkId: b.id
        });
      }
    }
  });

  // 4. Low Stock Materials
  materials.filter(m => m.currentStock <= m.reorderLevel).forEach(m => {
    actionItems.push({
      id: `act-mat-${m.id}`,
      type: 'Low Stock Alert',
      priority: m.currentStock <= m.minStockLevel ? 'Critical' : 'High',
      title: `Low Stock: ${m.name}`,
      description: `Current stock ${m.currentStock} ${m.unit} is at or below reorder level (${m.reorderLevel} ${m.unit})`,
      linkModule: 'materials',
      linkId: m.id
    });
  });

  // 5. Retention Release Due Soon
  retentions.filter(r => r.status === 'Due Soon' || r.status === 'Overdue').forEach(r => {
    actionItems.push({
      id: `act-ret-${r.id}`,
      type: 'Retention Release',
      priority: r.status === 'Overdue' ? 'Critical' : 'High',
      title: `Retention Release ${r.status}: ₹${(r.retentionAmount / 100000).toFixed(2)} Lakhs`,
      description: `Retention money held for ${r.projectName || 'Project'} due for release on ${r.expectedReleaseDate}`,
      dueDate: r.expectedReleaseDate,
      linkModule: 'retention',
      linkId: r.id
    });
  });

  return res.json({
    kpis: {
      totalTenders,
      activeTenders,
      wonTenders,
      lostTenders,
      totalTenderValue,
      activeProjects,
      totalProjectValue,
      totalBilling,
      totalCollection,
      outstandingAmount,
      emdPendingRefund,
      retentionAmountHeld,
      lowStockAlertsCount
    },
    charts: {
      tenderWinLoss,
      projectStatusSummary,
      monthlyBilling
    },
    actionItems,
    recentActivities: db.get.auditLogs.slice(0, 10),
    recentNotifications: notifications.filter(n => !n.isRead).slice(0, 5)
  });
});

export default router;
