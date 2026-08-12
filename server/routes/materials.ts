import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET Material Master Catalog
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { category, search, lowStock } = req.query;
    
    const where: any = {};
    if (category) {
      where.category = category;
    }

    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { name: { contains: q } },
        { materialCode: { contains: q } },
        { category: { contains: q } },
        { supplierName: { contains: q } }
      ];
    }

    let materials = await prisma.material.findMany({ where });

    if (lowStock === 'true') {
      materials = materials.filter(m => m.currentStock < m.reorderLevel);
    }

    return res.json(materials);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Create Material Master Item
router.post('/', authenticateToken, authorizeRoles('Admin', 'Project Manager', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    if (!body.name || !body.category || !body.unit || !body.reorderLevel) {
      return res.status(400).json({ error: 'Name, Category, Unit, and Reorder Level are required.' });
    }

    const code = body.materialCode || 'MAT-' + Date.now().toString().slice(-6);

    const newMat = await prisma.material.create({
      data: {
        materialCode: code,
        name: body.name,
        category: body.category,
        unit: body.unit,
        specification: body.specification || '',
        minStockLevel: Number(body.minStockLevel) || 0,
        reorderLevel: Number(body.reorderLevel) || 0,
        currentStock: Number(body.currentStock) || 0,
        supplierName: body.supplierName || 'General Supplier',
        unitRate: Number(body.unitRate) || 0,
        remarks: body.remarks
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Created Material Master Item ${newMat.materialCode} (${newMat.name})`,
        module: 'Materials',
        recordId: newMat.id
      }
    });

    return res.status(201).json(newMat);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT Update Material Master Item
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id, createdAt, updatedAt, ...updateData } = req.body;
    
    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: updateData
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Updated Material Master Item ${material.materialCode}`,
        module: 'Materials',
        recordId: material.id
      }
    });

    return res.json(material);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET Central Inventory Summary & Stock Movement History
router.get('/inventory', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const materials = await prisma.material.findMany();
    const dispatches = await prisma.materialDispatch.findMany();
    const consumptions = await prisma.materialConsumption.findMany();

    const inventoryList = materials.map(m => {
      const totalDispatched = dispatches
        .filter(d => d.materialId === m.id && d.status !== 'Cancelled')
        .reduce((acc, d) => acc + (d.quantity || 0), 0);

      const totalConsumed = consumptions
        .filter(c => c.materialId === m.id)
        .reduce((acc, c) => acc + (c.quantityConsumed || 0), 0);

      const isLowStock = m.currentStock < m.reorderLevel;

      return {
        ...m,
        totalDispatched,
        totalConsumed,
        isLowStock
      };
    });

    return res.json(inventoryList);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Dispatch Material to Site
router.post('/dispatch', authenticateToken, authorizeRoles('Site Supervisor', 'Project Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, siteId, materialId, batchNumber, dispatchDate, quantity, vehicleNumber, driverName, remarks } = req.body;

    if (!projectId || !materialId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Project ID, Material ID, and positive Dispatch Quantity are required.' });
    }

    const material = await prisma.material.findUnique({ where: { id: materialId } });
    if (!material) {
      return res.status(404).json({ error: 'Material not found.' });
    }

    // Prevent stock from becoming negative unless authorized
    if (material.currentStock < quantity && req.user?.role !== 'Admin' && req.user?.role !== 'Super Admin') {
      return res.status(400).json({
        error: `Insufficient central stock! Current available: ${material.currentStock} ${material.unit}. Requested dispatch: ${quantity} ${material.unit}.`
      });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const site = siteId ? await prisma.projectSite.findUnique({ where: { id: siteId } }) : null;

    // Decrement central stock
    await prisma.material.update({
      where: { id: materialId },
      data: { currentStock: material.currentStock - Number(quantity) }
    });

    const newDispatch = await prisma.materialDispatch.create({
      data: {
        dispatchCode: 'DSP-' + Date.now().toString().slice(-6),
        projectId,
        projectName: project?.projectName,
        siteId,
        siteName: site?.siteName,
        materialId,
        materialName: material.name,
        batchNumber: batchNumber || 'BATCH-' + Date.now().toString().slice(-4),
        dispatchDate: dispatchDate || new Date().toISOString().split('T')[0],
        quantity: Number(quantity),
        unit: material.unit,
        vehicleNumber: vehicleNumber || 'VEH-001',
        driverName: driverName || 'Driver',
        issuedById: req.user!.id,
        issuedByName: req.user!.name,
        status: 'In Transit',
        remarks
      }
    });

    // Check if material crossed low stock threshold
    if ((material.currentStock - Number(quantity)) < material.reorderLevel) {
      const existingAlert = await prisma.stockAlert.findFirst({
        where: { materialId: material.id, status: 'Active' }
      });
      
      if (!existingAlert) {
        await prisma.stockAlert.create({
          data: {
            projectId,
            materialId: material.id,
            materialName: material.name,
            currentStock: material.currentStock - Number(quantity),
            reorderLevel: material.reorderLevel,
            suggestedReorderQty: material.reorderLevel * 2,
            alertDate: new Date().toISOString(),
            status: 'Active'
          }
        });

        await prisma.appNotification.create({
          data: {
            title: `Low Stock Alert: ${material.name}`,
            message: `Current stock ${material.currentStock - Number(quantity)} ${material.unit} is at or below reorder level (${material.reorderLevel} ${material.unit}). Suggested reorder: ${material.reorderLevel * 2} ${material.unit}.`,
            priority: 'High',
            type: 'Stock',
            relatedModule: 'materials',
            relatedId: material.id
          }
        });

        // WhatsApp Notification to Supervisor and Super Admin
        console.log(`[WHATSAPP ALERT SENT] TO: Supervisor & Super Admin`);
        console.log(`[WHATSAPP MESSAGE]: 🚨 Low Stock Alert! Material ${material.name} has dropped to ${material.currentStock - Number(quantity)} ${material.unit}. Please arrange for reorder.`);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Dispatched ${quantity} ${material.unit} of ${material.name} to ${project?.projectName || 'Site'}`,
        module: 'Material Dispatch',
        recordId: newDispatch.id
      }
    });

    return res.status(201).json(newDispatch);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Site Material Receiving Confirmation
router.post('/receive', authenticateToken, authorizeRoles('Site Supervisor', 'Project Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { dispatchId, receivedQuantity, damagedQuantity, receivedDate, remarks } = req.body;

    if (!dispatchId || receivedQuantity === undefined) {
      return res.status(400).json({ error: 'Dispatch ID and Received Quantity are required.' });
    }

    const dispatch = await prisma.materialDispatch.findUnique({ where: { id: dispatchId } });
    if (!dispatch) {
      return res.status(404).json({ error: 'Dispatch record not found.' });
    }

    const recQty = Number(receivedQuantity);
    const dmgQty = Number(damagedQuantity || 0);
    const accQty = recQty - dmgQty;

    const newReceipt = await prisma.materialReceipt.create({
      data: {
        receiptCode: 'RCP-' + Date.now().toString().slice(-6),
        dispatchId,
        projectId: dispatch.projectId,
        materialId: dispatch.materialId,
        receivedQuantity: recQty,
        damagedQuantity: dmgQty,
        acceptedQuantity: accQty,
        receivedDate: receivedDate || new Date().toISOString().split('T')[0],
        receivedById: req.user!.id,
        receivedByName: req.user!.name,
        remarks
      }
    });

    await prisma.materialDispatch.update({
      where: { id: dispatchId },
      data: {
        status: 'Received',
        receivedById: req.user!.id
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Confirmed receipt of ${accQty} ${dispatch.unit} for dispatch ${dispatch.dispatchCode} (Damaged: ${dmgQty})`,
        module: 'Material Receiving',
        recordId: newReceipt.id
      }
    });

    return res.status(201).json(newReceipt);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Record Material Consumption at Site
router.post('/consume', authenticateToken, authorizeRoles('Site Supervisor', 'Project Manager', 'Admin', 'Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, siteId, materialId, consumptionDate, quantityConsumed, workCategory, remarks } = req.body;

    if (!projectId || !materialId || !quantityConsumed || quantityConsumed <= 0 || !workCategory) {
      return res.status(400).json({ error: 'Project, Material, Quantity Consumed, and Work Category are required.' });
    }

    const material = await prisma.material.findUnique({ where: { id: materialId } });
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const site = siteId ? await prisma.projectSite.findUnique({ where: { id: siteId } }) : null;

    const newConsumption = await prisma.materialConsumption.create({
      data: {
        projectId,
        projectName: project?.projectName,
        siteId,
        siteName: site?.siteName,
        materialId,
        materialName: material?.name,
        consumptionDate: consumptionDate || new Date().toISOString().split('T')[0],
        quantityConsumed: Number(quantityConsumed),
        unit: material?.unit || 'Units',
        workCategory,
        supervisorId: req.user!.id,
        supervisorName: req.user!.name,
        remarks
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Logged consumption of ${quantityConsumed} ${material?.unit} ${material?.name} for ${workCategory}`,
        module: 'Material Consumption',
        recordId: newConsumption.id
      }
    });

    return res.status(201).json(newConsumption);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET Stock Alerts List
router.get('/alerts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const alerts = await prisma.stockAlert.findMany();
    return res.json(alerts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
