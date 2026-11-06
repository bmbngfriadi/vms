import express from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import prisma from '../config/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { logActivity } from '../services/activity.service.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per 15 minutes
  message: { error: 'Terlalu banyak percobaan login yang gagal. Silakan tunggu 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { department: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Your account has been deactivated. Please contact System Administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    const safeUser = {
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      canReceiveVisits: user.canReceiveVisits,
      department: user.department
    };

    // Audit log
    await logActivity({
      userId: user.id,
      action: 'USER_LOGIN',
      description: `${user.name} (${user.role}) logged in successfully`,
      req
    });

    res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  const safeUser = {
    id: req.user.id,
    employeeId: req.user.employeeId,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role,
    isActive: req.user.isActive,
    canReceiveVisits: req.user.canReceiveVisits,
    department: req.user.department
  };
  res.json({ user: safeUser });
});

// GET /api/auth/hosts-by-department/:deptId
// Returns only active employees belonging to the department who can receive visits
router.get('/hosts-by-department/:deptId', async (req, res) => {
  try {
    const { deptId } = req.params;
    const hosts = await prisma.user.findMany({
      where: {
        departmentId: deptId,
        isActive: true,
        canReceiveVisits: true
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        department: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(hosts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hosts for department' });
  }
});

// GET /api/auth/hosts (General active host list)
router.get('/hosts', async (req, res) => {
  try {
    const { departmentId } = req.query;
    const where = {
      isActive: true,
      canReceiveVisits: true
    };
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const hosts = await prisma.user.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(hosts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hosts' });
  }
});

export default router;
