import express from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import prisma from '../db.js';
import { signToken, authenticate, featuresFor } from '../middleware/auth.js';
import { normalizePhone } from '../wa/client.js';
import { notify } from '../wa/notify.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' }
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak permintaan reset password. Coba lagi dalam 15 menit.' }
});

export const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  username: u.username || null,
  email: u.email,
  phone: u.phone,
  role: u.role,
  department: u.department ? { id: u.department.id, name: u.department.name, code: u.department.code } : null,
  canReceiveVisits: u.canReceiveVisits,
  features: featuresFor(u)
});

// ============================================================
// LOGIN (Mendukung Email, Username, atau Nomor WhatsApp / HP)
// ============================================================

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { identifier, email, username, phone, password } = req.body || {};
    const inputId = String(identifier || email || username || phone || '').trim();

    if (!inputId || !password) {
      return res.status(400).json({ error: 'Email, Username, atau No. HP serta password wajib diisi' });
    }

    const cleanPhone = normalizePhone(inputId);
    const searchConditions = [
      { email: inputId.toLowerCase() },
      { username: inputId.toLowerCase() }
    ];
    if (cleanPhone) {
      searchConditions.push({ phone: cleanPhone });
    }
    searchConditions.push({ phone: inputId });

    const user = await prisma.user.findFirst({
      where: {
        OR: searchConditions
      },
      include: { department: true, featureOverrides: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Akun atau kata sandi salah' });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) return res.status(401).json({ error: 'Akun atau kata sandi salah' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error('[Auth] login error:', err.message);
    res.status(500).json({ error: 'Gagal memproses login' });
  }
});

// ============================================================
// SELF RESET PASSWORD VIA WHATSAPP (Minta OTP)
// ============================================================

router.post('/forgot-password', forgotLimiter, async (req, res) => {
  try {
    const { identifier } = req.body || {};
    const inputId = String(identifier || '').trim();

    if (!inputId) {
      return res.status(400).json({ error: 'Silakan masukkan Email, Username, atau No. WhatsApp Anda' });
    }

    const cleanPhone = normalizePhone(inputId);
    const searchConditions = [
      { email: inputId.toLowerCase() },
      { username: inputId.toLowerCase() }
    ];
    if (cleanPhone) searchConditions.push({ phone: cleanPhone });
    searchConditions.push({ phone: inputId });

    const user = await prisma.user.findFirst({
      where: {
        OR: searchConditions,
        isActive: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Akun dengan data tersebut tidak ditemukan dalam sistem.' });
    }

    if (!user.phone) {
      return res.status(400).json({
        error: 'Akun Anda belum memiliki nomor WhatsApp terdaftar. Silakan hubungi Administrator Sistem.'
      });
    }

    const targetPhone = normalizePhone(user.phone) || user.phone;

    // Generate 6-digit OTP acak
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    // Batalkan token sebelumnya yang belum dipakai
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true }
    });

    // Buat data token baru
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        otp,
        expiresAt
      }
    });

    // Kirim OTP melalui WhatsApp Gateway
    const waText =
      `🏭 *PT CEMINDO GEMILANG Tbk*\n` +
      `📍 *Plant Batam — Security & Authentication*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔐 *KODE KEAMANAN (OTP) RESET SANDI*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Halo, *${user.name}*!\n` +
      `Permintaan untuk mengatur ulang kata sandi akun sistem VMS Anda telah diterima.\n\n` +
      `🔑 *KODE VERIFIKASI ANDA:*\n` +
      `┏━━━━━━━━━━━━━━┓\n` +
      `   👉   *${otp}*   👈\n` +
      `┗━━━━━━━━━━━━━━┛\n\n` +
      `⏳ *Masa Berlaku Kode:* 15 Menit\n\n` +
      `⚠️ *PERINGATAN KEAMANAN:*\n` +
      `• *JANGAN* membagikan kode OTP ini kepada siapapun, termasuk pihak Security atau IT Support.\n` +
      `• Jika Anda tidak merasa melakukan permintaan ini, abaikan pesan ini. Akun Anda tetap aman.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Pesan Otomatis • IT & Security Department_`;

    notify({
      recipient: targetPhone,
      type: 'PASSWORD_RESET',
      message: waText
    });

    const maskedPhone =
      targetPhone.length > 6
        ? `${targetPhone.slice(0, 4)}••••${targetPhone.slice(-3)}`
        : targetPhone;

    res.json({
      ok: true,
      message: `Kode verifikasi OTP telah dikirimkan ke WhatsApp Anda (${maskedPhone}).`,
      phoneHint: maskedPhone
    });
  } catch (err) {
    console.error('[Auth] forgot-password error:', err.message);
    res.status(500).json({ error: 'Gagal memproses permintaan reset kata sandi' });
  }
});

// ============================================================
// SELF RESET PASSWORD VIA WHATSAPP (Verifikasi OTP & Pasang Password Baru)
// ============================================================

router.post('/reset-password', forgotLimiter, async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body || {};
    const inputId = String(identifier || '').trim();
    const inputOtp = String(otp || '').trim();
    const pass = String(newPassword || '').trim();

    if (!inputId || !inputOtp || !pass) {
      return res.status(400).json({ error: 'Identitas, kode OTP, dan kata sandi baru wajib diisi' });
    }

    if (pass.length < 6) {
      return res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter' });
    }

    const cleanPhone = normalizePhone(inputId);
    const searchConditions = [
      { email: inputId.toLowerCase() },
      { username: inputId.toLowerCase() }
    ];
    if (cleanPhone) searchConditions.push({ phone: cleanPhone });
    searchConditions.push({ phone: inputId });

    const user = await prisma.user.findFirst({
      where: { OR: searchConditions, isActive: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Akun tidak ditemukan' });
    }

    // Cari entri reset password yang cocok dan masih aktif
    const resetEntry = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        otp: inputOtp,
        isUsed: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!resetEntry) {
      return res.status(400).json({ error: 'Kode OTP salah atau telah kadaluarsa. Silakan minta kode baru.' });
    }

    const hashedPassword = await bcrypt.hash(pass, 10);

    // Update password dan tandai OTP telah digunakan
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      }),
      prisma.passwordReset.update({
        where: { id: resetEntry.id },
        data: { isUsed: true }
      })
    ]);

    // Kirim notifikasi konfirmasi ke WhatsApp
    if (user.phone) {
      const nowStr = new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      });
      notify({
        recipient: user.phone,
        type: 'PASSWORD_RESET_SUCCESS',
        message:
          `🏭 *PT CEMINDO GEMILANG Tbk*\n` +
          `📍 *Plant Batam — Security & Authentication*\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🛡️ *KATA SANDI BERHASIL DIPERBARUI*\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Halo, *${user.name}*!\n` +
          `Kata sandi akun Visitor Management System (VMS) Anda telah berhasil diperbarui.\n\n` +
          `📋 *RINCIAN AKTIVITAS:*\n` +
          `👤 *Nama Akun* : ${user.name}\n` +
          `🕒 *Waktu*     : ${nowStr} WIB\n` +
          `📍 *Sistem*    : VMS Plant Batam\n\n` +
          `⚠️ *Jika Anda TIDAK merasa melakukan perubahan ini:*\n` +
          `Segera hubungi Administrator Sistem atau Departemen IT untuk mengamankan akun Anda.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `_Pesan Otomatis • IT & Security Department_`
      });
    }

    res.json({ ok: true, message: 'Kata sandi Anda berhasil diperbarui. Silakan masuk menggunakan kata sandi baru.' });
  } catch (err) {
    console.error('[Auth] reset-password error:', err.message);
    res.status(500).json({ error: 'Gagal mengatur ulang kata sandi' });
  }
});

// ============================================================
// PROFILE PENGGUNA TERAUTENTIKASI
// ============================================================

router.get('/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, username } = req.body || {};
    const updateData = {};

    if (name) updateData.name = String(name).trim();

    if (phone !== undefined) {
      const clean = normalizePhone(phone);
      if (phone && !clean) {
        return res.status(400).json({ error: 'Nomor WhatsApp tidak valid. Gunakan format contoh: 08123456789' });
      }
      updateData.phone = clean || null;
    }

    if (username !== undefined) {
      const cleanUser = String(username || '').trim().toLowerCase();
      if (cleanUser && cleanUser !== req.user.username) {
        // Periksa duplikasi username
        const exists = await prisma.user.findUnique({ where: { username: cleanUser } });
        if (exists && exists.id !== req.user.id) {
          return res.status(400).json({ error: 'Username ini sudah digunakan oleh akun lain' });
        }
      }
      updateData.username = cleanUser || null;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      include: { department: true, featureOverrides: true }
    });

    res.json({ ok: true, message: 'Profil berhasil diperbarui', user: publicUser(updated) });
  } catch (err) {
    console.error('[Auth] update profile error:', err.message);
    res.status(500).json({ error: 'Gagal memperbarui data profil' });
  }
});

router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Kata sandi saat ini dan kata sandi baru wajib diisi' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const ok = await bcrypt.compare(String(currentPassword), user.password);
    if (!ok) {
      return res.status(400).json({ error: 'Kata sandi saat ini salah' });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword).trim(), 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ ok: true, message: 'Kata sandi berhasil diubah.' });
  } catch (err) {
    console.error('[Auth] change password error:', err.message);
    res.status(500).json({ error: 'Gagal mengubah kata sandi' });
  }
});

export default router;
