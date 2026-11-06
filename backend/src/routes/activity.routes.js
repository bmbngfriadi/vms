import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/activity-logs (Admin & Management)
router.get('/', authenticateToken, requireRole(['ADMIN', 'MANAGEMENT']), async (req, res) => {
  try {
    const { action, userId, limit } = req.query;

    const where = {};
    if (action && action !== 'ALL') where.action = action;
    if (userId) where.userId = userId;

    const logs = await prisma.activityLog.findMany({
      where,
      take: limit ? parseInt(limit, 10) : 100,
      include: {
        user: {
          select: { id: true, employeeId: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(logs);
  } catch (err) {
    console.error('Fetch activity logs error:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;

