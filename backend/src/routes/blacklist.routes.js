import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logActivity } from '../services/activity.service.js';

const router = express.Router();

// GET /api/blacklist
router.get('/', authenticateToken, requireRole(['ADMIN', 'SECURITY', 'MANAGEMENT']), async (req, res) => {
  try {
    const list = await prisma.visitorBlacklist.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, employeeId: true }
        }
      }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat daftar Blacklist' });
  }
});

// POST /api/blacklist
router.post('/', authenticateToken, requireRole(['ADMIN', 'SECURITY']), async (req, res) => {
  try {
    const { fullName, identityNumber, phoneNumber, company, reason, isActive = true } = req.body;
    if (!fullName || !reason) {
      return res.status(400).json({ error: 'Nama lengkap dan alasan blacklist wajib diisi' });
    }

    const entry = await prisma.visitorBlacklist.create({
      data: {
        fullName: fullName.trim(),
        identityNumber: identityNumber ? identityNumber.trim() : null,
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
        company: company ? company.trim() : null,
        reason: reason.trim(),
        isActive: Boolean(isActive),
        createdById: req.user.id
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'BLACKLIST_ADDED',
      description: `Added visitor to blacklist: ${fullName} (${company || '-'}) - Reason: ${reason}`,
      req
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambahkan daftar Blacklist' });
  }
});

// PUT /api/blacklist/:id
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'SECURITY']), async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, identityNumber, phoneNumber, company, reason, isActive } = req.body;

    const updated = await prisma.visitorBlacklist.update({
      where: { id },
      data: {
        fullName: fullName ? fullName.trim() : undefined,
        identityNumber: identityNumber !== undefined ? (identityNumber ? identityNumber.trim() : null) : undefined,
        phoneNumber: phoneNumber !== undefined ? (phoneNumber ? phoneNumber.trim() : null) : undefined,
        company: company !== undefined ? (company ? company.trim() : null) : undefined,
        reason: reason ? reason.trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui data Blacklist' });
  }
});

// DELETE /api/blacklist/:id
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.visitorBlacklist.delete({ where: { id } });
    res.json({ message: 'Data Blacklist berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus data Blacklist' });
  }
});

// PATCH /api/blacklist/:id/status
router.patch('/:id/status', authenticateToken, requireRole(['ADMIN', 'SECURITY']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await prisma.visitorBlacklist.update({
      where: { id },
      data: { isActive: Boolean(isActive) }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah status Blacklist' });
  }
});

export default router;

