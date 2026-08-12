import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all notifications
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  return res.json(db.get.notifications);
});

// PUT Mark notification as read
router.put('/:id/read', authenticateToken, (req: AuthRequest, res: Response) => {
  const notif = db.get.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    db.saveData();
  }
  return res.json({ success: true });
});

// PUT Mark ALL notifications as read
router.put('/read-all', authenticateToken, (req: AuthRequest, res: Response) => {
  db.get.notifications.forEach(n => { n.isRead = true; });
  db.saveData();
  return res.json({ success: true });
});

export default router;
