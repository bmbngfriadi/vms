import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logActivity } from '../services/activity.service.js';

const router = express.Router();

// GET /api/settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const map = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil pengaturan sistem' });
  }
});

// PUT /api/settings/:key
router.put('/:key', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Nilai pengaturan tidak boleh kosong' });
    }

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });

    await logActivity({
      userId: req.user.id,
      action: 'SETTING_UPDATED',
      description: `Updated system setting: ${key} = ${value}`,
      req
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan pengaturan sistem' });
  }
});

export default router;

