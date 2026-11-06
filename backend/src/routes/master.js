import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { authenticate, allow } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// DEPARTMENTS
// ============================================================

router.get('/departments', authenticate, async (req, res) => {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { users: true, visits: true } } }
  });
  res.json(departments);
});

router.post('/departments', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { name, code } = req.body || {};
    if (!name || !code) return res.status(400).json({ error: 'Nama dan kode departemen wajib diisi' });

    const dept = await prisma.department.create({
      data: { name: name.trim(), code: code.trim().toUpperCase() }
    });
    res.status(201).json(dept);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Nama atau kode departemen sudah dipakai' });
    res.status(500).json({ error: 'Gagal menyimpan departemen' });
  }
});

router.put('/departments/:id', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { name, code, isActive } = req.body || {};
    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(code ? { code: code.trim().toUpperCase() } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {})
      }
    });
    res.json(dept);
  } catch {
    res.status(500).json({ error: 'Gagal memperbarui departemen' });
  }
});

// ============================================================
// USERS / PIC
// ============================================================

// Daftar PIC untuk dipilih Security saat validasi (punya nomor WhatsApp)
router.get('/pics', authenticate, async (req, res) => {
  const { departmentId } = req.query;
  const pics = await prisma.user.findMany({
    where: {
      isActive: true,
      canReceiveVisits: true,
      ...(departmentId ? { departmentId } : {})
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      department: { select: { id: true, name: true } }
    },
    orderBy: { name: 'asc' }
  });
  res.json(pics);
});

router.get('/users', authenticate, allow(['ADMIN']), async (req, res) => {
  const users = await prisma.user.findMany({
    include: { department: { select: { id: true, name: true } } },
    orderBy: [{ role: 'asc' }, { name: 'asc' }]
  });
  res.json(users.map(({ password, ...u }) => u));
});

router.post('/users', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { name, email, phone, password, role, departmentId, canReceiveVisits } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
    }
    if (role === 'PIC' && !phone) {
      return res.status(400).json({ error: 'PIC wajib memiliki nomor WhatsApp untuk notifikasi' });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).replace(/\D/g, '') : null,
        password: await bcrypt.hash(String(password), 10),
        role: role || 'PIC',
        departmentId: departmentId || null,
        canReceiveVisits: canReceiveVisits !== false
      },
      include: { department: { select: { id: true, name: true } } }
    });
    const { password: _p, ...safe } = user;
    res.status(201).json(safe);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email sudah terdaftar' });
    res.status(500).json({ error: 'Gagal menyimpan user' });
  }
});

router.put('/users/:id', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { name, phone, role, departmentId, isActive, canReceiveVisits, password } = req.body || {};
    const data = {
      ...(name ? { name: name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone ? String(phone).replace(/\D/g, '') : null } : {}),
      ...(role ? { role } : {}),
      ...(departmentId !== undefined ? { departmentId: departmentId || null } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
      ...(typeof canReceiveVisits === 'boolean' ? { canReceiveVisits } : {})
    };
    if (password) data.password = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      include: { department: { select: { id: true, name: true } } }
    });
    const { password: _p, ...safe } = user;
    res.json(safe);
  } catch {
    res.status(500).json({ error: 'Gagal memperbarui user' });
  }
});

export default router;
