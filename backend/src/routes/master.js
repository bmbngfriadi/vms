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
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Nama atau kode departemen sudah dipakai' });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Departemen tidak ditemukan' });
    res.status(500).json({ error: 'Gagal memperbarui departemen' });
  }
});

router.delete('/departments/:id', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { users: true, visits: true } } }
    });
    if (!department) return res.status(404).json({ error: 'Departemen tidak ditemukan' });
    if (department._count.users > 0 || department._count.visits > 0) {
      return res.status(409).json({
        error: `Departemen masih digunakan oleh ${department._count.users} pengguna dan ${department._count.visits} kunjungan. Pindahkan pengguna atau nonaktifkan departemen.`
      });
    }
    await prisma.department.delete({ where: { id: department.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Master] delete department:', err.message);
    res.status(500).json({ error: 'Gagal menghapus departemen' });
  }
});

// ============================================================
// USERS / PIC
// ============================================================

// Daftar PIC untuk dipilih Security saat validasi (punya nomor WhatsApp)
async function listPics(req, res) {
  const { departmentId } = req.query;
  const pics = await prisma.user.findMany({
    where: {
      isActive: true,
      role: 'PIC',
      canReceiveVisits: true,
      phone: { not: null },
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
}

// Publik untuk dropdown form tamu; data sensitif tidak disertakan.
router.get('/pics/public', async (req, res) => {
  const { departmentId } = req.query;
  if (!departmentId) return res.json([]);
  const pics = await prisma.user.findMany({
    where: { isActive: true, canReceiveVisits: true, departmentId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
  res.json(pics);
});

router.get('/pics', authenticate, listPics);

router.get('/users', authenticate, allow(['ADMIN']), async (req, res) => {
  const users = await prisma.user.findMany({
    include: { department: { select: { id: true, name: true } } },
    orderBy: [{ role: 'asc' }, { name: 'asc' }]
  });
  res.json(users.map(({ password, ...u }) => u));
});

router.post('/users', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { name, username, email, phone, password, role, departmentId, canReceiveVisits } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
    }
    if (role === 'PIC' && !phone) {
      return res.status(400).json({ error: 'PIC wajib memiliki nomor WhatsApp untuk notifikasi' });
    }

    const cleanUsername = username ? String(username).trim().toLowerCase() : null;

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername || null,
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
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email atau Username sudah terdaftar' });
    res.status(500).json({ error: 'Gagal menyimpan user' });
  }
});

router.put('/users/:id', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { name, username, email, phone, role, departmentId, isActive, canReceiveVisits, password } = req.body || {};
    const cleanUsername = username !== undefined ? (username ? String(username).trim().toLowerCase() : null) : undefined;
    const data = {
      ...(name ? { name: name.trim() } : {}),
      ...(cleanUsername !== undefined ? { username: cleanUsername } : {}),
      ...(email ? { email: String(email).trim().toLowerCase() } : {}),
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
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email atau Username sudah digunakan' });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    res.status(500).json({ error: 'Gagal memperbarui user' });
  }
});

router.delete('/users/:id', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Akun yang sedang digunakan tidak dapat dihapus' });
    }
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    await prisma.$transaction(async (tx) => {
      await tx.visit.updateMany({
        where: { picUserId: target.id },
        data: { picUserId: null, picNameManual: target.name }
      });
      await tx.visit.updateMany({ where: { checkInById: target.id }, data: { checkInById: null } });
      await tx.visit.updateMany({ where: { checkOutById: target.id }, data: { checkOutById: null } });
      await tx.user.delete({ where: { id: target.id } });
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Master] delete user:', err.message);
    res.status(500).json({ error: 'Gagal menghapus pengguna' });
  }
});

export default router;
