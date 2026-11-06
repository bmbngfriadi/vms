import express from 'express';
import prisma from '../db.js';
import { authenticate, allow } from '../middleware/auth.js';
import { wa, restartWhatsApp, logoutWhatsApp, sendText } from '../wa/client.js';
import { notify } from '../wa/notify.js';

const router = express.Router();

router.get('/status', authenticate, (_req, res) => {
  res.json({
    status: wa.status,
    connected: wa.status === 'CONNECTED',
    phone: wa.phone,
    qrDataUrl: wa.qrDataUrl,
    lastError: wa.lastError
  });
});

router.post('/reconnect', authenticate, allow(['ADMIN']), async (_req, res) => {
  await restartWhatsApp();
  res.json({ ok: true, status: wa.status });
});

router.post('/logout', authenticate, allow(['ADMIN']), async (_req, res) => {
  await logoutWhatsApp();
  res.json({ ok: true, status: wa.status });
});

router.post('/test', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { phone, message } = req.body || {};
    if (!phone) return res.status(400).json({ error: 'Nomor tujuan wajib diisi' });
    await sendText(phone, message || 'Tes koneksi WhatsApp dari Visitor Management System.');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/logs', authenticate, allow(['ADMIN', 'MANAGEMENT']), async (req, res) => {
  const take = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const logs = await prisma.notificationLog.findMany({
    orderBy: { createdAt: 'desc' },
    take
  });
  res.json(logs);
});

router.post('/logs/:id/resend', authenticate, allow(['ADMIN']), async (req, res) => {
  const log = await prisma.notificationLog.findUnique({ where: { id: req.params.id } });
  if (!log) return res.status(404).json({ error: 'Log tidak ditemukan' });
  notify({ visitId: log.visitId, recipient: log.recipient, type: log.type, message: log.message });
  res.json({ ok: true });
});

// ------------------------------------------------------------
// Penerima notifikasi Management
// ------------------------------------------------------------

router.get('/recipients', authenticate, async (_req, res) => {
  const rows = await prisma.managementRecipient.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(rows);
});

router.post('/recipients', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { name, phone, title } = req.body || {};
    if (!name || !phone) return res.status(400).json({ error: 'Nama dan nomor WhatsApp wajib diisi' });
    const row = await prisma.managementRecipient.create({
      data: { name: name.trim(), phone: String(phone).replace(/\D/g, ''), title: title || null }
    });
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: 'Gagal menambah penerima' });
  }
});

router.put('/recipients/:id', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { name, phone, title, isActive } = req.body || {};
    const row = await prisma.managementRecipient.update({
      where: { id: req.params.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(phone ? { phone: String(phone).replace(/\D/g, '') } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {})
      }
    });
    res.json(row);
  } catch {
    res.status(500).json({ error: 'Gagal memperbarui penerima' });
  }
});

router.delete('/recipients/:id', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    await prisma.managementRecipient.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Gagal menghapus penerima' });
  }
});

export default router;
