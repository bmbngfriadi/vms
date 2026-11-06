import express from 'express';
import {
  getWhatsAppStatus,
  restartWhatsApp,
  sendWhatsAppMessage,
  sendWhatsAppQrImage
} from '../services/whatsapp.service.js';
import { enqueueWhatsAppNotification } from '../services/queue.service.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logActivity } from '../services/activity.service.js';
import prisma from '../config/database.js';

const router = express.Router();

// ==============================================================================
// 1. WHATSAPP STATUS & ENGINE CONTROL (Tahap 7)
// ==============================================================================

// GET /api/whatsapp/status
router.get('/status', authenticateToken, async (req, res) => {
  const status = await getWhatsAppStatus();
  res.json(status);
});

// POST /api/whatsapp/restart
router.post('/restart', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    await restartWhatsApp();
    await logActivity({
      userId: req.user.id,
      action: 'WHATSAPP_RESTART',
      description: `Admin ${req.user.name} triggered Baileys WhatsApp client restart`,
      req
    });
    res.json({ message: 'WhatsApp service restart triggered' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restart WhatsApp service' });
  }
});

// POST /api/whatsapp/send-test
router.post('/send-test', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { phone, message, sendQrImage = false } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Nomor WhatsApp penerima wajib diisi' });
    }

    const testText = message || 'PT Cemindo Gemilang Tbk – Plant Batam: Uji coba koneksi WhatsApp Gateway VMS.';
    let result;

    if (sendQrImage) {
      result = await sendWhatsAppQrImage(
        phone,
        `VMS-TEST-${Date.now()}`,
        `🧪 *TEST QR CODE WHATSAPP*\n${testText}`
      );
    } else {
      result = await sendWhatsAppMessage(phone, testText);
    }

    await prisma.notificationLog.create({
      data: {
        recipient: phone,
        message: sendQrImage ? `[TEST QR] ${testText}` : testText,
        type: 'MANUAL_TEST',
        status: result?.success ? 'SENT' : 'FAILED',
        response: JSON.stringify(result)
      }
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/whatsapp/logs
router.get('/logs', authenticateToken, requireRole(['ADMIN', 'MANAGEMENT']), async (req, res) => {
  try {
    const { status, type, limit = 50 } = req.query;
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (type && type !== 'ALL') where.type = type;

    const logs = await prisma.notificationLog.findMany({
      where,
      take: parseInt(limit, 10) || 50,
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil riwayat pesan WhatsApp' });
  }
});

// POST /api/whatsapp/logs/:id/retry
router.post('/logs/:id/retry', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const log = await prisma.notificationLog.findUnique({ where: { id } });
    if (!log) {
      return res.status(404).json({ error: 'Data log pesan tidak ditemukan' });
    }

    // Re-queue with new attempt
    await enqueueWhatsAppNotification({
      type: `${log.type}_RETRY`,
      recipient: log.recipient,
      message: log.message.replace(/^\[QR Image\]\s*/, ''),
      visitId: log.visitId
    });

    res.json({ message: 'Pengiriman ulang (retry) telah dijadwalkan ke antrean BullMQ.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal melakukan retry pesan' });
  }
});

// ==============================================================================
// 2. MANAGEMENT RECIPIENTS CRUD (Tahap 8)
// ==============================================================================

// GET /api/whatsapp/management-recipients
router.get('/management-recipients', authenticateToken, requireRole(['ADMIN', 'MANAGEMENT']), async (req, res) => {
  try {
    const recipients = await prisma.managementRecipient.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(recipients);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat daftar nomor Management' });
  }
});

// POST /api/whatsapp/management-recipients
router.post('/management-recipients', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, phone, title, department, notes, isActive = true } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Nama dan nomor WhatsApp wajib diisi' });
    }

    // Clean phone number (e.g. 0812 -> 62812)
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
    if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;

    const recipient = await prisma.managementRecipient.create({
      data: {
        name: name.trim(),
        phone: cleaned,
        title: title ? title.trim() : null,
        department: department ? department.trim() : null,
        notes: notes ? notes.trim() : null,
        isActive: Boolean(isActive)
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'MANAGEMENT_RECIPIENT_ADDED',
      description: `Added management notification recipient: ${recipient.name} (${recipient.phone})`,
      req
    });

    res.status(201).json(recipient);
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambahkan nomor Management' });
  }
});

// PUT /api/whatsapp/management-recipients/:id
router.put('/management-recipients/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, title, department, notes, isActive } = req.body;

    let cleaned = phone ? phone.replace(/\D/g, '') : undefined;
    if (cleaned) {
      if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
      if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
    }

    const updated = await prisma.managementRecipient.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        phone: cleaned,
        title: title !== undefined ? (title ? title.trim() : null) : undefined,
        department: department !== undefined ? (department ? department.trim() : null) : undefined,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui nomor Management' });
  }
});

// DELETE /api/whatsapp/management-recipients/:id
router.delete('/management-recipients/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.managementRecipient.delete({ where: { id } });
    res.json({ message: 'Nomor Management berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus nomor Management' });
  }
});

// PATCH /api/whatsapp/management-recipients/:id/status
router.patch('/management-recipients/:id/status', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await prisma.managementRecipient.update({
      where: { id },
      data: { isActive: Boolean(isActive) }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah status penerima Management' });
  }
});

// ==============================================================================
// 3. NOTIFICATION TEMPLATES CRUD (Tahap 8)
// ==============================================================================

// GET /api/whatsapp/templates
router.get('/templates', authenticateToken, requireRole(['ADMIN', 'MANAGEMENT']), async (req, res) => {
  try {
    const templates = await prisma.notificationTemplate.findMany({
      orderBy: { code: 'asc' }
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat template notifikasi' });
  }
});

// PUT /api/whatsapp/templates/:id
router.put('/templates/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, templateBody, isQrImage, isActive } = req.body;

    const updated = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        templateBody: templateBody !== undefined ? templateBody : undefined,
        isQrImage: isQrImage !== undefined ? Boolean(isQrImage) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'NOTIFICATION_TEMPLATE_UPDATED',
      description: `Updated notification template: ${updated.code} (${updated.name})`,
      req
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui template notifikasi' });
  }
});

export default router;
