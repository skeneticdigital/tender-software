import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET Documents with search and related filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { relatedType, relatedId, category, search } = req.query;
    
    const where: any = {};
    if (relatedType) where.relatedType = relatedType;
    if (relatedId) where.relatedId = relatedId;
    if (category) where.category = category;

    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { fileName: { contains: q } },
        { category: { contains: q } },
        { relatedName: { contains: q } }
      ];
    }

    const docs = await prisma.appDocument.findMany({ where, orderBy: { uploadDate: 'desc' } });
    return res.json(docs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Upload / Attach Document
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { relatedType, relatedId, relatedName, category, fileName, fileType, fileSize, fileUrl } = req.body;

    if (!relatedType || !relatedId || !fileName || !category) {
      return res.status(400).json({ error: 'Related Type, Related ID, File Name, and Category are required.' });
    }

    const newDoc = await prisma.appDocument.create({
      data: {
        relatedType,
        relatedId,
        relatedName: relatedName || 'Related Record',
        category,
        fileName,
        fileType: fileType || 'pdf',
        fileSize: fileSize || '1.5 MB',
        fileUrl: fileUrl || '#',
        uploadedBy: req.user?.name || 'User',
        uploadDate: new Date().toISOString()
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Uploaded document '${fileName}' under ${category}`,
        module: 'Documents',
        recordId: newDoc.id
      }
    });

    return res.status(201).json(newDoc);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
