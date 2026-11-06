import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logActivity } from '../services/activity.service.js';

const router = express.Router();

// GET /api/departments (Supports activeOnly filter for guest dropdown)
router.get('/', async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const where = {};
    if (activeOnly === 'true') {
      where.isActive = true;
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        _count: {
          select: { visits: true, users: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(departments);
  } catch (error) {
    console.error('Fetch departments error:', error);
    res.status(500).json({ error: 'Failed to retrieve departments' });
  }
});

// GET /api/departments/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          where: { isActive: true },
          select: {
            id: true,
            employeeId: true,
            name: true,
            phone: true,
            role: true,
            canReceiveVisits: true
          }
        }
      }
    });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// POST /api/departments (Admin only)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required' });
    }

    const dept = await prisma.department.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description ? description.trim() : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'DEPARTMENT_CREATED',
      description: `Created department ${dept.name} (${dept.code})`,
      req
    });

    res.status(201).json(dept);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Department code or name already exists' });
    }
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PUT /api/departments/:id (Admin only)
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        code: code ? code.trim().toUpperCase() : undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'DEPARTMENT_UPDATED',
      description: `Updated department ${updated.name} (${updated.code}, Active: ${updated.isActive})`,
      req
    });

    res.json(updated);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Department code or name conflict' });
    }
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// PATCH /api/departments/:id/status (Toggle Active / Inactive)
router.patch('/:id/status', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updated = await prisma.department.update({
      where: { id },
      data: { isActive: Boolean(isActive) }
    });

    await logActivity({
      userId: req.user.id,
      action: 'DEPARTMENT_STATUS_TOGGLED',
      description: `Set department ${updated.name} to ${updated.isActive ? 'ACTIVE' : 'INACTIVE'}`,
      req
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle department status' });
  }
});

export default router;
