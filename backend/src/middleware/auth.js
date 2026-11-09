import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { resolveFeatures, overridesFromRows } from '../lib/features.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/** Peta hak fitur efektif untuk satu user (override per user > bawaan role). */
export function featuresFor(user) {
  return resolveFeatures(user.role, overridesFromRows(user.featureOverrides || []));
}

/** Attach req.user from the Bearer token. */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        department: { select: { id: true, name: true, code: true } },
        featureOverrides: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Akun tidak aktif atau tidak ditemukan' });
    }

    user.features = featuresFor(user);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesi berakhir, silakan login kembali' });
  }
}

/** Role gate: allow(['ADMIN', 'SECURITY']) */
export function allow(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk aksi ini' });
    }
    next();
  };
}

/**
 * Gate berbasis fitur: requireFeature('visit.edit').
 * Bawaan mengikuti role, tapi bisa diubah per user dari halaman Manajemen Fitur.
 * Pasang setelah authenticate().
 */
export function requireFeature(key, message = 'Fitur ini tidak aktif untuk akun Anda') {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi' });
    const enabled = req.user.features ? req.user.features[key] : false;
    if (!enabled) return res.status(403).json({ error: message });
    next();
  };
}
