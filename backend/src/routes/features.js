import express from 'express';
import prisma from '../db.js';
import { authenticate, allow } from '../middleware/auth.js';
import {
  FEATURES,
  FEATURE_KEYS,
  isKnownFeature,
  defaultFor,
  isEnabled,
  resolveFeatures,
  overridesFromRows
} from '../lib/features.js';

const router = express.Router();

const ROLES = ['ADMIN', 'SECURITY', 'PIC', 'MANAGEMENT'];

const catalog = () => FEATURES.map((f) => ({ ...f, locked: !!f.locked }));

// Katalog fitur + hak efektif user yang sedang login.
// Dipakai frontend untuk menyusun menu dan menyembunyikan aksi.
router.get('/', authenticate, async (req, res) => {
  try {
    const overrides = overridesFromRows(req.user.featureOverrides || []);
    res.json({ features: catalog(), mine: resolveFeatures(req.user.role, overrides) });
  } catch (err) {
    console.error('[Features] catalog error:', err.message);
    res.status(500).json({ error: 'Gagal memuat daftar fitur' });
  }
});

// Matriks seluruh user x fitur. Hanya ADMIN.
router.get('/users', authenticate, allow(['ADMIN']), async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      include: {
        department: { select: { id: true, name: true, code: true } },
        featureOverrides: true
      }
    });

    res.json({
      features: catalog(),
      roles: ROLES,
      users: users.map((u) => {
        const overrides = overridesFromRows(u.featureOverrides);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          department: u.department,
          overrides,
          features: resolveFeatures(u.role, overrides)
        };
      })
    });
  } catch (err) {
    console.error('[Features] users error:', err.message);
    res.status(500).json({ error: 'Gagal memuat hak fitur user' });
  }
});

// Simpan hak fitur satu user. Body: { overrides: { [key]: true|false|null } }
// null = hapus pengaturan khusus, kembali ke bawaan role.
router.put('/users/:userId', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { userId } = req.params;
    const input = req.body?.overrides;

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return res.status(400).json({ error: 'Format data tidak valid' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const lockedKeys = FEATURES.filter((f) => f.locked).map((f) => f.key);
    const unknown = Object.keys(input).filter((k) => !isKnownFeature(k));
    if (unknown.length) {
      return res.status(400).json({ error: `Fitur tidak dikenal: ${unknown.join(', ')}` });
    }
    if (lockedKeys.some((k) => typeof input[k] === 'boolean')) {
      return res.status(400).json({ error: 'Fitur terkunci tidak dapat diubah' });
    }

    const ops = [];
    for (const key of FEATURE_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
      const value = input[key];
      if (value === null) {
        ops.push(prisma.userFeature.deleteMany({ where: { userId, featureKey: key } }));
      } else if (typeof value === 'boolean') {
        // Membuang override yang sama dengan nilai bawaan role agar tabel tetap bersih.
        if (value === defaultFor(key, user.role)) {
          ops.push(prisma.userFeature.deleteMany({ where: { userId, featureKey: key } }));
        } else {
          ops.push(
            prisma.userFeature.upsert({
              where: { userId_featureKey: { userId, featureKey: key } },
              create: { userId, featureKey: key, enabled: value },
              update: { enabled: value }
            })
          );
        }
      }
    }

    if (ops.length) await prisma.$transaction(ops);

    const saved = await prisma.userFeature.findMany({ where: { userId } });
    const overrides = overridesFromRows(saved);

    res.json({
      user: { id: user.id, name: user.name, role: user.role },
      overrides,
      features: resolveFeatures(user.role, overrides)
    });
  } catch (err) {
    console.error('[Features] update error:', err.message);
    res.status(500).json({ error: 'Gagal menyimpan hak fitur' });
  }
});

export default router;

// Dipakai modul lain bila perlu cek langsung tanpa middleware.
export { isEnabled };