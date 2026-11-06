import express from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import prisma from '../db.js';
import { signToken, authenticate } from '../middleware/auth.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' }
});

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  department: u.department ? { id: u.department.id, name: u.department.name, code: u.department.code } : null,
  canReceiveVisits: u.canReceiveVisits
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      include: { department: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) return res.status(401).json({ error: 'Email atau password salah' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error('[Auth] login error:', err.message);
    res.status(500).json({ error: 'Gagal memproses login' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
