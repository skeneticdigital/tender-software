import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET Bills List
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, status, search } = req.query;
    
    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { billNumber: { contains: q } },
        { clientName: { contains: q } },
        { projectName: { contains: q } }
      ];
    }

    const bills = await prisma.bill.findMany({ where, orderBy: { createdAt: 'desc' } });
    return res.json(bills);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET Bill Details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: req.params.id }
    });

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const items = await prisma.billItem.findMany({ where: { billId: bill.id } });
    const deductions = await prisma.billDeduction.findMany({ where: { billId: bill.id } });
    const payments = await prisma.payment.findMany({ where: { billId: bill.id } });
    const retention = await prisma.retention.findFirst({ where: { billId: bill.id } });

    return res.json({
      ...bill,
      items,
      deductions,
      payments,
      retention
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Create Bill
router.post('/', authenticateToken, authorizeRoles('Accounts Manager', 'Project Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, billNumber, billDate, billingPeriod, workDescription, items, customDeductions, paymentDueDate, gstRate = 18 } = req.body;

    if (!projectId || !billNumber || !billDate || !paymentDueDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Project, Bill Number, Bill Date, Payment Due Date, and at least one Bill Item are required.' });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const existingBill = await prisma.bill.findUnique({ where: { billNumber } });
    if (existingBill) {
      return res.status(400).json({ error: `Bill with number '${billNumber}' already exists.` });
    }

    // 1. Calculate Gross Amount
    const processedItems = items.map((item: any, idx: number) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return {
        description: item.description || 'Work Item',
        boqItem: item.boqItem || `ITEM-${idx + 1}`,
        quantity: qty,
        unit: item.unit || 'Units',
        rate,
        amount: qty * rate
      };
    });

    const grossAmount = processedItems.reduce((acc: number, item: any) => acc + item.amount, 0);
    const gstAmount = (grossAmount * Number(gstRate)) / 100;
    const grossWithTax = grossAmount + gstAmount;

    // 2. Calculate Deductions
    const activeDeductionTypes = await prisma.deductionType.findMany({ where: { isActive: true } });
    const processedDeductions: any[] = [];
    let totalDeductions = 0;
    let retentionAmount = 0;

    if (customDeductions && Array.isArray(customDeductions)) {
      customDeductions.forEach((d: any) => {
        const pct = Number(d.percentage) || 0;
        const fixed = Number(d.fixedAmount) || 0;
        const calcAmount = fixed > 0 ? fixed : (grossAmount * pct) / 100;

        processedDeductions.push({
          deductionTypeId: d.deductionTypeId,
          deductionName: d.deductionName || 'Deduction',
          percentage: pct,
          fixedAmount: fixed,
          calculatedAmount: calcAmount
        });

        totalDeductions += calcAmount;
        if (d.deductionName?.toLowerCase().includes('retention')) {
          retentionAmount += calcAmount;
        }
      });
    } else {
      activeDeductionTypes.forEach((dt) => {
        const pct = dt.defaultPercentage || 0;
        const fixed = dt.fixedAmount || 0;
        const calcAmount = fixed > 0 ? fixed : (grossAmount * pct) / 100;

        processedDeductions.push({
          deductionTypeId: dt.id,
          deductionName: dt.name,
          percentage: pct,
          fixedAmount: fixed,
          calculatedAmount: calcAmount
        });

        totalDeductions += calcAmount;
        if (dt.name.toLowerCase().includes('retention')) {
          retentionAmount += calcAmount;
        }
      });
    }

    const netPayable = grossWithTax - totalDeductions;

    // Create everything in a transaction
    const newBill = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.create({
        data: {
          billNumber,
          projectId,
          projectName: project.projectName,
          clientName: project.client,
          billDate,
          billingPeriod: billingPeriod || 'Current Billing Period',
          workDescription: workDescription || '',
          grossAmount,
          gstAmount,
          grossWithTax,
          totalDeductions,
          retentionAmount,
          netPayable,
          submittedDate: new Date().toISOString().split('T')[0],
          paymentDueDate,
          paymentReceivedAmount: 0,
          outstandingAmount: netPayable,
          status: 'Submitted'
        }
      });

      await tx.billItem.createMany({
        data: processedItems.map((item: any) => ({ ...item, billId: bill.id }))
      });

      if (processedDeductions.length > 0) {
        await tx.billDeduction.createMany({
          data: processedDeductions.map((d: any) => ({ ...d, billId: bill.id }))
        });
      }

      if (retentionAmount > 0) {
        const plannedReleaseDate = new Date(project.plannedCompletionDate);
        plannedReleaseDate.setFullYear(plannedReleaseDate.getFullYear() + 1);

        await tx.retention.create({
          data: {
            projectId: project.id,
            projectName: project.projectName,
            billId: bill.id,
            billNumber: bill.billNumber,
            retentionPercentage: grossAmount > 0 ? (retentionAmount / grossAmount) * 100 : 5,
            retentionAmount,
            retentionDate: billDate,
            expectedReleaseDate: plannedReleaseDate.toISOString().split('T')[0],
            status: 'Held',
            remarks: `Retention withheld from Bill ${bill.billNumber}`
          }
        });
      }

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          userName: req.user!.name,
          userRole: req.user!.role,
          action: `Created Bill ${bill.billNumber} Net Payable ₹${netPayable.toLocaleString('en-IN')}`,
          module: 'Billing',
          recordId: bill.id
        }
      });

      return bill;
    });

    return res.status(201).json({
      ...newBill,
      items: processedItems,
      deductions: processedDeductions
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Record Payment against Bill
router.post('/payment', authenticateToken, authorizeRoles('Accounts Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { billId, amountReceived, paymentDate, paymentMethod, bankName, transactionRef, remarks } = req.body;

    if (!billId || !amountReceived || Number(amountReceived) <= 0 || !paymentDate || !bankName || !transactionRef) {
      return res.status(400).json({ error: 'Bill, valid Amount Received, Payment Date, Bank Name, and Transaction Reference are required.' });
    }

    const bill = await prisma.bill.findUnique({ where: { id: billId } });
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const amt = Number(amountReceived);
    if (amt > bill.outstandingAmount + 10) {
      return res.status(400).json({
        error: `Payment amount (₹${amt.toLocaleString('en-IN')}) cannot exceed current outstanding amount (₹${bill.outstandingAmount.toLocaleString('en-IN')}).`
      });
    }

    const newPayment = await prisma.$transaction(async (tx) => {
      const pay = await tx.payment.create({
        data: {
          billId: bill.id,
          billNumber: bill.billNumber,
          projectId: bill.projectId,
          projectName: bill.projectName,
          invoiceAmount: bill.netPayable,
          amountReceived: amt,
          balance: bill.outstandingAmount - amt,
          paymentDate,
          paymentMethod: paymentMethod || 'NEFT/RTGS',
          bankName,
          transactionRef,
          remarks
        }
      });

      const paymentReceivedAmount = bill.paymentReceivedAmount + amt;
      const outstandingAmount = Math.max(0, bill.netPayable - paymentReceivedAmount);
      const status = outstandingAmount <= 1 ? 'Paid' : 'Partially Paid';

      await tx.bill.update({
        where: { id: bill.id },
        data: {
          paymentReceivedAmount,
          outstandingAmount,
          paymentReceivedDate: paymentDate,
          status
        }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          userName: req.user!.name,
          userRole: req.user!.role,
          action: `Recorded Payment ₹${amt.toLocaleString('en-IN')} against Bill ${bill.billNumber}`,
          module: 'Billing',
          recordId: bill.id
        }
      });

      return pay;
    });

    return res.status(201).json(newPayment);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET Payments List
router.get('/payments/list', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(payments);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET Retentions List
router.get('/retentions/list', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const retentions = await prisma.retention.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(retentions);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT Update Retention Status
router.put('/retentions/:id', authenticateToken, authorizeRoles('Accounts Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, actualReleaseDate, remarks } = req.body;
    
    const ret = await prisma.retention.update({
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
        action: `Updated Retention Status to '${ret.status}' for Bill ${ret.billNumber}`,
        module: 'Retention',
        recordId: ret.id
      }
    });

    return res.json(ret);
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Retention record not found' });
    }
    return res.status(500).json({ error: err.message });
  }
});

export default router;
