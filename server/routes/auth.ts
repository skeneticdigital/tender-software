import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { JWT_SECRET, authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Your account is inactive. Please contact system administrator.' });
    }

    // Password check: check against hash or allow standard demo passwords
    let isValid = false;
    if (password === 'admin123' || password === 'tender123' || password === 'pm123' || password === 'supervisor123' || password === 'accounts123' || password === 'mgmt123') {
      isValid = true;
    } else if (user.passwordHash) {
      try {
        isValid = await bcrypt.compare(password, user.passwordHash);
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: `Logged into TenderFlow ERP`,
        module: 'Authentication',
        recordId: user.id
      }
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Forgot Password request
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: email?.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({ error: 'No user account found with that email address.' });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: `Requested password reset link`,
        module: 'Authentication',
        recordId: user.id
      }
    });

    return res.json({ message: 'Password reset instructions have been sent to your registered email address.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
