import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all users
router.get('/', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        status: true,
        accessibleModules: true,
        avatar: true,
        createdAt: true
      }
    });
    const parsedUsers = users.map((u) => ({
      ...u,
      accessibleModules: u.accessibleModules ? JSON.parse(u.accessibleModules) : []
    }));
    return res.json(parsedUsers);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST Create new User
router.post('/', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, department, phone, accessibleModules } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, Email, Password, and Role are required.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: hash,
        role,
        department: department || 'General',
        phone: phone || '',
        status: 'Active',
        accessibleModules: accessibleModules ? JSON.stringify(accessibleModules) : '["dashboard"]'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Created User ${newUser.name} (${newUser.role})`,
        module: 'Users',
        recordId: newUser.id
      }
    });

    const { passwordHash, ...userWithoutPassword } = newUser;
    return res.status(201).json(userWithoutPassword);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT Update User Role / Status
router.put('/:id', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { role, status, name, department, phone, accessibleModules } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role && { role }),
        ...(status && { status }),
        ...(name && { name }),
        ...(department && { department }),
        ...(phone && { phone }),
        ...(accessibleModules && { accessibleModules: JSON.stringify(accessibleModules) })
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: `Updated User details for ${user.email}`,
        module: 'Users',
        recordId: user.id
      }
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(500).json({ error: err.message });
  }
});

export default router;
