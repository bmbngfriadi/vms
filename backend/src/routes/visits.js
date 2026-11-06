import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import QRCode from 'qrcode';
import prisma from '../db.js';
import { authenticate, allow } from '../middleware/auth.js';
import { normalizePhone } from '../wa/client.js';
import { notify } from '../wa/notify.js';
import * as msg from '../wa/messages.js';

const router = express.Router();
export const publicRouter = express.Router();

const APP_URL = (process.env.PUBLIC_APP_URL || 'http://localhost').replace(/\/$/, '');

// ============================================================
// HELPERS
// ============================================================

const newToken = () => crypto.randomBytes(24).toString('base64url');
const passUrl = (token) => `${APP_URL}/pass/${token}`;

async function qrDataUrl(text) {
  return QRCode.toDataURL(text, { margin: 1, width: 480, errorCorrectionLevel: 'M' });
}

async function generateVisitNumber() {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  for (let i = 0; i < 8; i += 1) {
    const num = `VMS-${ym}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const exists = await prisma.visit.findUnique({ where: { visitNumber: num }, select: { id: true } });
    if (!exists) return num;
  }
  return `VMS-${ym}-${Date.now().toString().slice(-6)}`;
}

const VISIT_INCLUDE = {
  visitor: true,
  department: { select: { id: true, name: true, code: true } },
  picUser: { select: { id: true, name: true, phone: true } },
  checkInBy: { select: { id: true, name: true } },
  checkOutBy: { select: { id: true, name: true } },
  tokens: { orderBy: { createdAt: 'desc' } }
};

const activeToken = (visit, type) => {
  const list = (visit.tokens || []).filter((t) => t.type === type && !t.isUsed);
  return list.length ? list[0] : null;
};

function formatVisit(visit, viewer) {
  if (!visit) return null;
  const canSeeContact = ['ADMIN', 'SECURITY'].includes(viewer?.role);
  const checkInToken = activeToken(visit, 'CHECK_IN');
  const checkOutToken = activeToken(visit, 'CHECK_OUT');

  let durationMinutes = null;
  if (visit.checkInAt) {
    const end = visit.checkOutAt ? new Date(visit.checkOutAt) : new Date();
    durationMinutes = Math.max(0, Math.floor((end - new Date(visit.checkInAt)) / 60000));
  }

  return {
    id: visit.id,
    visitNumber: visit.visitNumber,
    visitType: visit.visitType,
    status: visit.status,
    visitorName: visit.visitor?.fullName || '-',
    company: visit.visitor?.company || null,
    phone: canSeeContact ? visit.visitor?.phone : null,
    identityNumber: canSeeContact ? visit.visitor?.identityNumber : null,
    department: visit.department,
    picUser: visit.picUser,
    picNameManual: visit.picNameManual,
    picName: visit.picUser?.name || visit.picNameManual || '-',
    purpose: visit.purpose,
    scheduledDate: visit.scheduledDate,
    expectedTime: visit.expectedTime,
    numberOfVisitors: visit.numberOfVisitors,
    vehiclePlate: visit.vehiclePlate,
    badgeNumber: visit.badgeNumber,
    checkInAt: visit.checkInAt,
    checkOutAt: visit.checkOutAt,
    checkInBy: visit.checkInBy?.name || null,
    checkOutBy: visit.checkOutBy?.name || null,
    cancelReason: visit.cancelReason,
    note: visit.note,
    durationMinutes,
    passToken: (checkOutToken || checkInToken)?.token || null,
    createdAt: visit.createdAt
  };
}

async function managementRecipients() {
  return prisma.managementRecipient.findMany({ where: { isActive: true } });
}

/** Susun seluruh notifikasi untuk sebuah kunjungan. */
async function notifyCheckIn(visit) {
  const guest = visit.visitor;
  const dept = visit.department?.name || '-';
  const picName = visit.picUser?.name || visit.picNameManual || '-';

  const outToken = activeToken(visit, 'CHECK_OUT');
  if (outToken && guest?.phone) {
    notify({
      visitId: visit.id,
      recipient: guest.phone,
      type: 'GUEST_CHECKIN_PASS',
      message: msg.guestCheckOutPass({
        name: guest.fullName,
        visitNumber: visit.visitNumber,
        checkInAt: visit.checkInAt,
        passUrl: passUrl(outToken.token)
      })
    });
  }

  if (visit.picUser?.phone) {
    notify({
      visitId: visit.id,
      recipient: visit.picUser.phone,
      type: 'PIC_ARRIVAL',
      message: msg.picGuestArrived({
        picName,
        guestName: guest.fullName,
        company: guest.company,
        department: dept,
        visitNumber: visit.visitNumber,
        checkInAt: visit.checkInAt,
        badge: visit.badgeNumber
      })
    });
  }

  const mgmt = await managementRecipients();
  mgmt.forEach((m) => {
    notify({
      visitId: visit.id,
      recipient: m.phone,
      type: 'MGMT_ARRIVAL',
      message: msg.managementArrival({
        guestName: guest.fullName,
        company: guest.company,
        department: dept,
        picName,
        visitNumber: visit.visitNumber,
        checkInAt: visit.checkInAt,
        count: visit.numberOfVisitors
      })
    });
  });
}

async function notifyCheckOut(visit) {
  const guest = visit.visitor;
  const dept = visit.department?.name || '-';
  const picName = visit.picUser?.name || visit.picNameManual || '-';

  if (guest?.phone) {
    notify({
      visitId: visit.id,
      recipient: guest.phone,
      type: 'GUEST_CHECKOUT',
      message: msg.guestCheckedOut({
        name: guest.fullName,
        visitNumber: visit.visitNumber,
        checkInAt: visit.checkInAt,
        checkOutAt: visit.checkOutAt
      })
    });
  }

  if (visit.picUser?.phone) {
    notify({
      visitId: visit.id,
      recipient: visit.picUser.phone,
      type: 'PIC_DEPARTURE',
      message: msg.picGuestDeparted({
        picName,
        guestName: guest.fullName,
        company: guest.company,
        visitNumber: visit.visitNumber,
        checkInAt: visit.checkInAt,
        checkOutAt: visit.checkOutAt
      })
    });
  }

  const mgmt = await managementRecipients();
  mgmt.forEach((m) => {
    notify({
      visitId: visit.id,
      recipient: m.phone,
      type: 'MGMT_DEPARTURE',
      message: msg.managementDeparture({
        guestName: guest.fullName,
        company: guest.company,
        department: dept,
        picName,
        visitNumber: visit.visitNumber,
        checkInAt: visit.checkInAt,
        checkOutAt: visit.checkOutAt
      })
    });
  });
}

// ============================================================
// PUBLIC: master data untuk form tamu
// ============================================================

publicRouter.get('/departments', async (_req, res) => {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' }
  });
  res.json(departments);
});

// ============================================================
// PUBLIC: pendaftaran tamu walk-in (tanpa janji)
// ============================================================

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak pendaftaran dari perangkat ini. Silakan coba lagi nanti.' }
});

publicRouter.post('/register', registerLimiter, async (req, res) => {
  try {
    const { fullName, phone, company, identityNumber, departmentId, picName, purpose, numberOfVisitors, vehiclePlate } =
      req.body || {};

    if (!fullName || !phone || !departmentId || !picName || !purpose) {
      return res.status(400).json({ error: 'Nama, nomor WhatsApp, departemen, PIC, dan keperluan wajib diisi' });
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid. Contoh: 081234567890' });
    }

    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept || !dept.isActive) {
      return res.status(400).json({ error: 'Departemen tujuan tidak valid' });
    }

    let visitor = await prisma.visitor.findFirst({ where: { phone: cleanPhone } });
    if (visitor) {
      visitor = await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          fullName: fullName.trim(),
          company: company ? company.trim() : visitor.company,
          identityNumber: identityNumber ? String(identityNumber).trim() : visitor.identityNumber
        }
      });
    } else {
      visitor = await prisma.visitor.create({
        data: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          company: company ? company.trim() : null,
          identityNumber: identityNumber ? String(identityNumber).trim() : null
        }
      });
    }

    const visitNumber = await generateVisitNumber();
    const token = newToken();

    const visit = await prisma.visit.create({
      data: {
        visitNumber,
        visitorId: visitor.id,
        visitType: 'WALK_IN',
        status: 'WAITING_VALIDATION',
        departmentId: dept.id,
        picNameManual: picName.trim(),
        purpose: purpose.trim(),
        scheduledDate: new Date(),
        numberOfVisitors: Number(numberOfVisitors) > 0 ? Number(numberOfVisitors) : 1,
        vehiclePlate: vehiclePlate ? String(vehiclePlate).trim().toUpperCase() : null,
        tokens: { create: { token, type: 'CHECK_IN' } }
      },
      include: VISIT_INCLUDE
    });

    const dataUrl = await qrDataUrl(token);
    const url = passUrl(token);

    notify({
      visitId: visit.id,
      recipient: cleanPhone,
      type: 'GUEST_WALKIN_PASS',
      message: msg.guestWalkInPass({
        name: visitor.fullName,
        visitNumber: visit.visitNumber,
        department: dept.name,
        passUrl: url
      })
    });

    res.status(201).json({
      visitNumber: visit.visitNumber,
      passToken: token,
      passUrl: url,
      qrDataUrl: dataUrl,
      visit: formatVisit(visit, null)
    });
  } catch (err) {
    console.error('[Register] error:', err);
    res.status(500).json({ error: 'Gagal memproses pendaftaran tamu' });
  }
});

// ============================================================
// PUBLIC: halaman pass tamu (berdasarkan token acak, bukan nomor kunjungan)
// ============================================================

publicRouter.get('/pass/:token', async (req, res) => {
  try {
    const tokenRow = await prisma.qrToken.findUnique({
      where: { token: req.params.token },
      include: { visit: { include: VISIT_INCLUDE } }
    });

    if (!tokenRow) return res.status(404).json({ error: 'Pass tidak ditemukan' });

    const visit = tokenRow.visit;
    const current = activeToken(visit, 'CHECK_OUT') || activeToken(visit, 'CHECK_IN');

    if (!current) {
      return res.json({
        visitNumber: visit.visitNumber,
        visitorName: visit.visitor.fullName,
        company: visit.visitor.company,
        department: visit.department.name,
        picName: visit.picUser?.name || visit.picNameManual,
        status: visit.status,
        checkInAt: visit.checkInAt,
        checkOutAt: visit.checkOutAt,
        action: visit.status === 'CHECKED_OUT' ? 'DONE' : 'NONE',
        qrDataUrl: null
      });
    }

    const action = current.type === 'CHECK_OUT' ? 'CHECK_OUT' : 'CHECK_IN';

    res.json({
      visitNumber: visit.visitNumber,
      visitorName: visit.visitor.fullName,
      company: visit.visitor.company,
      department: visit.department.name,
      picName: visit.picUser?.name || visit.picNameManual,
      status: visit.status,
      action,
      qrDataUrl: await qrDataUrl(current.token),
      checkInAt: visit.checkInAt,
      checkOutAt: visit.checkOutAt
    });
  } catch (err) {
    console.error('[Pass] error:', err.message);
    res.status(500).json({ error: 'Gagal memuat pass' });
  }
});

// ============================================================
// PIC / ADMIN: pendaftaran tamu dengan janji (pre-registration)
// ============================================================

router.post('/', authenticate, allow(['ADMIN', 'PIC']), async (req, res) => {
  try {
    const { fullName, phone, company, identityNumber, departmentId, picUserId, purpose, scheduledDate, expectedTime, numberOfVisitors, vehiclePlate } =
      req.body || {};

    if (!fullName || !phone || !purpose || !scheduledDate) {
      return res.status(400).json({ error: 'Nama tamu, nomor WhatsApp, keperluan, dan tanggal wajib diisi' });
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) return res.status(400).json({ error: 'Nomor WhatsApp tamu tidak valid' });

    // PIC hanya boleh membuat janji untuk dirinya sendiri; ADMIN boleh memilih PIC lain
    const resolvedPicId = req.user.role === 'ADMIN' ? picUserId || req.user.id : req.user.id;
    const pic = await prisma.user.findUnique({ where: { id: resolvedPicId } });
    if (!pic || !pic.isActive) return res.status(400).json({ error: 'PIC tidak valid' });
    if (!pic.phone) return res.status(400).json({ error: 'PIC belum memiliki nomor WhatsApp' });

    const deptId = departmentId || pic.departmentId;
    if (!deptId) return res.status(400).json({ error: 'Departemen tujuan wajib dipilih' });
    const dept = await prisma.department.findUnique({ where: { id: deptId } });
    if (!dept || !dept.isActive) return res.status(400).json({ error: 'Departemen tujuan tidak valid' });

    let visitor = await prisma.visitor.findFirst({ where: { phone: cleanPhone } });
    if (visitor) {
      visitor = await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          fullName: fullName.trim(),
          company: company ? company.trim() : visitor.company,
          identityNumber: identityNumber ? String(identityNumber).trim() : visitor.identityNumber
        }
      });
    } else {
      visitor = await prisma.visitor.create({
        data: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          company: company ? company.trim() : null,
          identityNumber: identityNumber ? String(identityNumber).trim() : null
        }
      });
    }

    const visitNumber = await generateVisitNumber();
    const token = newToken();
    const when = new Date(scheduledDate);

    const visit = await prisma.visit.create({
      data: {
        visitNumber,
        visitorId: visitor.id,
        visitType: 'PRE_REGISTERED',
        status: 'APPROVED',
        departmentId: dept.id,
        picUserId: pic.id,
        purpose: purpose.trim(),
        scheduledDate: when,
        expectedTime: expectedTime || '09:00',
        numberOfVisitors: Number(numberOfVisitors) > 0 ? Number(numberOfVisitors) : 1,
        vehiclePlate: vehiclePlate ? String(vehiclePlate).trim().toUpperCase() : null,
        tokens: { create: { token, type: 'CHECK_IN' } }
      },
      include: VISIT_INCLUDE
    });

    const url = passUrl(token);
    notify({
      visitId: visit.id,
      recipient: cleanPhone,
      type: 'GUEST_PREREGISTER_PASS',
      message: msg.guestPreRegisteredPass({
        name: visitor.fullName,
        visitNumber: visit.visitNumber,
        department: dept.name,
        picName: pic.name,
        date: when,
        time: visit.expectedTime,
        passUrl: url
      })
    });

    res.status(201).json({ ...formatVisit(visit, req.user), passUrl: url, qrDataUrl: await qrDataUrl(token) });
  } catch (err) {
    console.error('[PreRegister] error:', err);
    res.status(500).json({ error: 'Gagal membuat janji kunjungan' });
  }
});

// ============================================================
// SECURITY: scan barcode
// ============================================================

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak scan. Mohon tunggu sebentar.' }
});

router.post('/scan', authenticate, allow(['ADMIN', 'SECURITY']), scanLimiter, async (req, res) => {
  try {
    const raw = String(req.body?.code || '').trim();
    if (!raw) return res.status(400).json({ error: 'Kode barcode kosong' });

    // QR bisa berisi URL pass (?token=) atau token mentah
    let token = raw;
    try {
      if (raw.startsWith('http')) token = new URL(raw).pathname.split('/').pop();
    } catch {
      /* pakai raw */
    }

    let tokenRow = await prisma.qrToken.findUnique({
      where: { token },
      include: { visit: { include: VISIT_INCLUDE } }
    });

    let visit = tokenRow?.visit || null;

    // Fallback: security mengetik nomor kunjungan secara manual
    if (!visit) {
      visit = await prisma.visit.findUnique({ where: { visitNumber: raw.toUpperCase() }, include: VISIT_INCLUDE });
    }

    if (!visit) return res.status(404).json({ error: 'Barcode tidak dikenali atau kunjungan tidak ditemukan' });

    const warnings = [];
    let action = 'NONE';

    if (visit.status === 'WAITING_VALIDATION' || visit.status === 'APPROVED') {
      action = 'CHECK_IN';
    } else if (visit.status === 'CHECKED_IN') {
      action = 'CHECK_OUT';
      if (tokenRow && tokenRow.type === 'CHECK_IN') {
        warnings.push('Barcode yang dipindai adalah barcode check-in, bukan barcode check-out.');
      }
    } else if (visit.status === 'CHECKED_OUT') {
      action = 'DONE';
      warnings.push('Tamu ini sudah menyelesaikan check-out.');
    } else if (visit.status === 'REJECTED' || visit.status === 'CANCELLED') {
      action = 'BLOCKED';
      warnings.push(`Kunjungan berstatus ${visit.status} — tamu tidak boleh masuk.`);
    }

    if (tokenRow?.isUsed) warnings.push('Barcode ini sudah pernah dipakai.');
    if (tokenRow?.expiresAt && new Date() > new Date(tokenRow.expiresAt)) {
      warnings.push('Barcode sudah kedaluwarsa.');
    }

    res.json({ visit: formatVisit(visit, req.user), action, warnings });
  } catch (err) {
    console.error('[Scan] error:', err);
    res.status(500).json({ error: 'Gagal memverifikasi barcode' });
  }
});

// ============================================================
// SECURITY: check-in (validasi + pilih PIC + notifikasi WhatsApp)
// ============================================================

router.post('/:id/check-in', authenticate, allow(['ADMIN', 'SECURITY']), async (req, res) => {
  try {
    const { picUserId, badgeNumber, note } = req.body || {};

    const existing = await prisma.visit.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Kunjungan tidak ditemukan' });

    if (!['WAITING_VALIDATION', 'APPROVED'].includes(existing.status)) {
      return res.status(409).json({
        error:
          existing.status === 'CHECKED_IN'
            ? 'Tamu sudah tercatat check-in'
            : `Kunjungan berstatus ${existing.status} tidak dapat di-check-in`
      });
    }

    // PIC wajib dipilih agar notifikasi WhatsApp dapat dikirim
    const picId = picUserId || existing.picUserId;
    if (!picId) return res.status(400).json({ error: 'PIC / user yang dituju wajib dipilih' });

    const pic = await prisma.user.findUnique({ where: { id: picId } });
    if (!pic || !pic.isActive) return res.status(400).json({ error: 'PIC tidak valid atau tidak aktif' });
    if (!pic.phone) return res.status(400).json({ error: `PIC ${pic.name} belum memiliki nomor WhatsApp` });

    const checkOutToken = newToken();
    const now = new Date();

    const visit = await prisma.$transaction(async (tx) => {
      await tx.qrToken.updateMany({
        where: { visitId: existing.id, type: 'CHECK_IN', isUsed: false },
        data: { isUsed: true, usedAt: now }
      });

      await tx.qrToken.create({
        data: { visitId: existing.id, token: checkOutToken, type: 'CHECK_OUT' }
      });

      return tx.visit.update({
        where: { id: existing.id },
        data: {
          status: 'CHECKED_IN',
          checkInAt: now,
          checkInById: req.user.id,
          picUserId: pic.id,
          badgeNumber: badgeNumber ? String(badgeNumber).trim() : null,
          note: note || existing.note
        },
        include: VISIT_INCLUDE
      });
    });

    await notifyCheckIn(visit);

    res.json({
      ...formatVisit(visit, req.user),
      guestPassUrl: passUrl(checkOutToken),
      picNotified: pic.name
    });
  } catch (err) {
    console.error('[CheckIn] error:', err);
    res.status(500).json({ error: 'Gagal memproses check-in' });
  }
});

// ============================================================
// SECURITY: check-out
// ============================================================

router.post('/:id/check-out', authenticate, allow(['ADMIN', 'SECURITY']), async (req, res) => {
  try {
    const existing = await prisma.visit.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Kunjungan tidak ditemukan' });
    if (existing.status !== 'CHECKED_IN') {
      return res.status(409).json({ error: 'Tamu belum check-in atau sudah check-out' });
    }

    const now = new Date();

    const visit = await prisma.$transaction(async (tx) => {
      await tx.qrToken.updateMany({
        where: { visitId: existing.id, type: 'CHECK_OUT', isUsed: false },
        data: { isUsed: true, usedAt: now }
      });

      return tx.visit.update({
        where: { id: existing.id },
        data: { status: 'CHECKED_OUT', checkOutAt: now, checkOutById: req.user.id },
        include: VISIT_INCLUDE
      });
    });

    await notifyCheckOut(visit);
    res.json(formatVisit(visit, req.user));
  } catch (err) {
    console.error('[CheckOut] error:', err);
    res.status(500).json({ error: 'Gagal memproses check-out' });
  }
});

// ============================================================
// SECURITY: tolak tamu walk-in
// ============================================================

router.post('/:id/reject', authenticate, allow(['ADMIN', 'SECURITY']), async (req, res) => {
  try {
    const { reason } = req.body || {};
    const existing = await prisma.visit.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Kunjungan tidak ditemukan' });
    if (!['WAITING_VALIDATION', 'APPROVED'].includes(existing.status)) {
      return res.status(409).json({ error: 'Kunjungan ini tidak dapat ditolak' });
    }

    const visit = await prisma.visit.update({
      where: { id: existing.id },
      data: { status: 'REJECTED', cancelReason: reason || 'Ditolak oleh Security' },
      include: VISIT_INCLUDE
    });
    res.json(formatVisit(visit, req.user));
  } catch {
    res.status(500).json({ error: 'Gagal menolak kunjungan' });
  }
});

// ============================================================
// PIC / ADMIN: batalkan janji sebelum tamu datang
// ============================================================

router.post('/:id/cancel', authenticate, allow(['ADMIN', 'PIC']), async (req, res) => {
  try {
    const { reason } = req.body || {};
    const existing = await prisma.visit.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Kunjungan tidak ditemukan' });
    if (req.user.role === 'PIC' && existing.picUserId !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya dapat membatalkan janji kunjungan Anda sendiri' });
    }
    if (!['WAITING_VALIDATION', 'APPROVED'].includes(existing.status)) {
      return res.status(409).json({ error: 'Kunjungan yang sudah check-in tidak dapat dibatalkan' });
    }

    const visit = await prisma.visit.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED', cancelReason: reason || 'Dibatalkan oleh PIC' },
      include: VISIT_INCLUDE
    });
    res.json(formatVisit(visit, req.user));
  } catch {
    res.status(500).json({ error: 'Gagal membatalkan kunjungan' });
  }
});

// ============================================================
// LIST & DETAIL
// ============================================================

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, date, search, departmentId, page = 1, limit = 25 } = req.query;
    const take = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 200);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {};

    if (req.user.role === 'PIC') where.picUserId = req.user.id;
    if (status && status !== 'ALL') where.status = status;
    if (departmentId) where.departmentId = departmentId;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { visitNumber: { contains: q, mode: 'insensitive' } },
        { visitor: { fullName: { contains: q, mode: 'insensitive' } } },
        { visitor: { company: { contains: q, mode: 'insensitive' } } },
        { visitor: { phone: { contains: q } } }
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: VISIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      prisma.visit.count({ where })
    ]);

    res.json({
      data: rows.map((v) => formatVisit(v, req.user)),
      total,
      page: Math.max(parseInt(page, 10) || 1, 1),
      pages: Math.ceil(total / take) || 1
    });
  } catch (err) {
    console.error('[Visits] list error:', err.message);
    res.status(500).json({ error: 'Gagal memuat daftar kunjungan' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  const visit = await prisma.visit.findUnique({ where: { id: req.params.id }, include: VISIT_INCLUDE });
  if (!visit) return res.status(404).json({ error: 'Kunjungan tidak ditemukan' });
  if (req.user.role === 'PIC' && visit.picUserId !== req.user.id) {
    return res.status(403).json({ error: 'Anda tidak memiliki akses ke kunjungan ini' });
  }
  res.json(formatVisit(visit, req.user));
});

// ============================================================
// DASHBOARD
// ============================================================

router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const scope = req.user.role === 'PIC' ? { picUserId: req.user.id } : {};

    const [waiting, onsite, checkedOutToday, todayTotal, byDepartment, recent, trend] = await Promise.all([
      prisma.visit.count({ where: { ...scope, status: { in: ['WAITING_VALIDATION', 'APPROVED'] } } }),
      prisma.visit.count({ where: { ...scope, status: 'CHECKED_IN' } }),
      prisma.visit.count({ where: { ...scope, status: 'CHECKED_OUT', checkOutAt: { gte: startOfDay } } }),
      prisma.visit.count({ where: { ...scope, createdAt: { gte: startOfDay } } }),
      prisma.visit.groupBy({
        by: ['departmentId'],
        _count: { _all: true },
        where: { ...scope, createdAt: { gte: startOfDay } }
      }),
      prisma.visit.findMany({
        where: scope,
        include: VISIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: 8
      }),
      prisma.$queryRaw`
        SELECT to_char((created_at AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
        FROM visits
        WHERE created_at >= NOW() - INTERVAL '6 days'
        GROUP BY 1 ORDER BY 1 ASC
      `
    ]);

    const departments = await prisma.department.findMany({ select: { id: true, name: true } });
    const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

    res.json({
      waiting,
      onsite,
      checkedOutToday,
      todayTotal,
      byDepartment: byDepartment
        .map((d) => ({ name: deptMap[d.departmentId] || '-', count: d._count._all }))
        .sort((a, b) => b.count - a.count),
      trend,
      recent: recent.map((v) => formatVisit(v, req.user))
    });
  } catch (err) {
    console.error('[Stats] error:', err.message);
    res.status(500).json({ error: 'Gagal memuat statistik' });
  }
});

// ============================================================
// EXPORT (CSV)
// ============================================================

router.get('/export/csv', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const where = {};

    if (req.user.role === 'PIC') where.picUserId = req.user.id;
    if (status && status !== 'ALL') where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        where.createdAt.gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        where.createdAt.lte = e;
      }
    }

    const rows = await prisma.visit.findMany({
      where,
      include: VISIT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 5000
    });

    const header = [
      'No. Kunjungan',
      'Nama Tamu',
      'Perusahaan',
      'No. WhatsApp',
      'Departemen',
      'PIC',
      'Keperluan',
      'Jumlah',
      'Tipe',
      'Status',
      'Masuk',
      'Keluar',
      'Durasi (menit)',
      'Security In',
      'Security Out'
    ];

    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map((v) =>
      [
        v.visitNumber,
        v.visitor.fullName,
        v.visitor.company || '',
        v.visitor.phone,
        v.department?.name || '',
        v.picUser?.name || v.picNameManual || '',
        v.purpose,
        v.numberOfVisitors,
        v.visitType,
        v.status,
        v.checkInAt ? new Date(v.checkInAt).toLocaleString('id-ID') : '',
        v.checkOutAt ? new Date(v.checkOutAt).toLocaleString('id-ID') : '',
        v.checkInAt && v.checkOutAt
          ? Math.floor((new Date(v.checkOutAt) - new Date(v.checkInAt)) / 60000)
          : '',
        v.checkInBy?.name || '',
        v.checkOutBy?.name || ''
      ]
        .map(esc)
        .join(',')
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-tamu-${Date.now()}.csv"`);
    res.send(`\uFEFF${header.map(esc).join(',')}\n${lines.join('\n')}`);
  } catch (err) {
    console.error('[Export] error:', err.message);
    res.status(500).json({ error: 'Gagal membuat laporan' });
  }
});

export default router;
