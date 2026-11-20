import express from 'express';
import prisma from '../db.js';
import { authenticate, requireFeature } from '../middleware/auth.js';
import { normalizeGuestNames } from './visits.js';

const router = express.Router();

const VISIT_INCLUDE = {
  visitor: true,
  department: { select: { id: true, name: true, code: true } },
  picUser: { select: { id: true, name: true, phone: true } },
  checkInBy: { select: { id: true, name: true } },
  checkOutBy: { select: { id: true, name: true } },
  inductionBy: { select: { id: true, name: true } },
  tokens: { orderBy: { createdAt: 'desc' } }
};

function formatSheVisit(v) {
  const normalizedGuests = normalizeGuestNames(
    v.guestNames,
    v.visitor?.fullName,
    v.badgeNumber,
    v.numberOfVisitors
  );

  return {
    id: v.id,
    visitNumber: v.visitNumber,
    visitorName: v.visitor?.fullName || '-',
    phone: v.visitor?.phone || '-',
    company: v.visitor?.company || '-',
    identityNumber: v.visitor?.identityNumber || '-',
    department: v.department?.name || '-',
    picName: v.picUser?.name || v.picNameManual || '-',
    purpose: v.purpose,
    destinationArea: v.destinationArea || 'OFFICE',
    workDescription: v.workDescription || null,
    requiresInduction: !!v.requiresInduction,
    inductionStatus: v.inductionStatus || 'NOT_REQUIRED',
    inductionAt: v.inductionAt,
    inductionBy: v.inductionBy ? { id: v.inductionBy.id, name: v.inductionBy.name } : null,
    inductionNotes: v.inductionNotes,
    numberOfVisitors: v.numberOfVisitors || (normalizedGuests.length > 0 ? normalizedGuests.length : 1),
    guestNames: normalizedGuests,
    badgeNumber: v.badgeNumber,
    vehiclePlate: v.vehiclePlate,
    status: v.status,
    visitType: v.visitType,
    checkInAt: v.checkInAt,
    checkOutAt: v.checkOutAt,
    createdAt: v.createdAt
  };
}

// ============================================================
// 1. STATISTIK RINGKASAN K3 / SHE
// ============================================================
router.get('/stats', authenticate, requireFeature('page.she_induction', 'Akses ditolak'), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [waitingAggr, inductedAggr, activeAggr, officeAggr] = await Promise.all([
      // Tamu lapangan yang belum induction (antrean)
      prisma.visit.aggregate({
        where: {
          requiresInduction: true,
          inductionStatus: 'WAITING_INDUCTION',
          status: { in: ['WAITING_VALIDATION', 'APPROVED', 'CHECKED_IN'] }
        },
        _sum: { numberOfVisitors: true }
      }),
      // Tamu lapangan yang sudah induction hari ini
      prisma.visit.aggregate({
        where: {
          requiresInduction: true,
          inductionStatus: 'INDUCTED',
          inductionAt: { gte: startOfDay }
        },
        _sum: { numberOfVisitors: true }
      }),
      // Tamu lapangan yang saat ini aktif di dalam pabrik (Headcount Live K3)
      prisma.visit.aggregate({
        where: {
          requiresInduction: true,
          status: 'CHECKED_IN'
        },
        _sum: { numberOfVisitors: true }
      }),
      // Tamu kantor hari ini (pembanding)
      prisma.visit.aggregate({
        where: {
          requiresInduction: false,
          createdAt: { gte: startOfDay }
        },
        _sum: { numberOfVisitors: true }
      })
    ]);

    res.json({
      waitingInduction: waitingAggr._sum?.numberOfVisitors || 0,
      inductedToday: inductedAggr._sum?.numberOfVisitors || 0,
      activeInPlant: activeAggr._sum?.numberOfVisitors || 0,
      officeVisitorsToday: officeAggr._sum?.numberOfVisitors || 0
    });
  } catch (err) {
    console.error('[SHE Stats] error:', err.message);
    res.status(500).json({ error: 'Gagal memuat statistik SHE' });
  }
});

// ============================================================
// 2. DAFTAR KUNJUNGAN TAMU LAPANGAN / SHE
// ============================================================
router.get('/visits', authenticate, requireFeature('page.she_induction', 'Akses ditolak'), async (req, res) => {
  try {
    const { tab = 'waiting', search, date } = req.query;
    const where = {
      requiresInduction: true
    };

    if (tab === 'waiting') {
      where.inductionStatus = 'WAITING_INDUCTION';
      where.status = { in: ['WAITING_VALIDATION', 'APPROVED', 'CHECKED_IN'] };
    } else if (tab === 'inducted') {
      where.inductionStatus = 'INDUCTED';
    }

    if (date) {
      const s = new Date(date);
      s.setHours(0, 0, 0, 0);
      const e = new Date(date);
      e.setHours(23, 59, 59, 999);
      where.createdAt = { gte: s, lte: e };
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { visitNumber: { contains: q, mode: 'insensitive' } },
        { visitor: { fullName: { contains: q, mode: 'insensitive' } } },
        { visitor: { company: { contains: q, mode: 'insensitive' } } },
        { workDescription: { contains: q, mode: 'insensitive' } },
        { purpose: { contains: q, mode: 'insensitive' } }
      ];
    }

    const rows = await prisma.visit.findMany({
      where,
      include: VISIT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    const totalPeople = rows.reduce((acc, r) => acc + (r.numberOfVisitors || 1), 0);

    res.json({
      data: rows.map(formatSheVisit),
      totalPeople,
      totalVisits: rows.length
    });
  } catch (err) {
    console.error('[SHE Visits] error:', err.message);
    res.status(500).json({ error: 'Gagal memuat data tamu SHE' });
  }
});

// ============================================================
// 3. AKSI VERIFIKASI SELESAI SAFETY INDUCTION
// ============================================================
router.post(
  '/visits/:id/induct',
  authenticate,
  requireFeature('she.induction_action', 'Anda tidak memiliki hak verifikasi Safety Induction'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes, checklist = [] } = req.body || {};

      const existing = await prisma.visit.findUnique({
        where: { id },
        include: { visitor: true }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Data kunjungan tidak ditemukan' });
      }

      if (!existing.requiresInduction) {
        return res.status(400).json({ error: 'Kunjungan ini tidak tercatat sebagai tamu area lapangan/pekerjaan' });
      }

      const checklistStr = Array.isArray(checklist) && checklist.length > 0 ? ` [Checklist: ${checklist.join(', ')}]` : '';
      const finalNotes = (notes ? String(notes).trim() : 'Safety induction telah diberikan dan APD diverifikasi.') + checklistStr;

      const updated = await prisma.visit.update({
        where: { id },
        data: {
          inductionStatus: 'INDUCTED',
          inductionAt: new Date(),
          inductionById: req.user.id,
          inductionNotes: finalNotes
        },
        include: VISIT_INCLUDE
      });

      res.json({
        message: 'Safety Induction berhasil diverifikasi',
        visit: formatSheVisit(updated)
      });
    } catch (err) {
      console.error('[SHE Induct] error:', err.message);
      res.status(500).json({ error: 'Gagal memproses verifikasi induction' });
    }
  }
);

// ============================================================
// 4. RESET STATUS INDUCTION KEMBALI KE MENUNGGU (JIKA KELIRU)
// ============================================================
router.post(
  '/visits/:id/reset',
  authenticate,
  requireFeature('she.induction_action', 'Anda tidak memiliki hak verifikasi Safety Induction'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const updated = await prisma.visit.update({
        where: { id },
        data: {
          inductionStatus: 'WAITING_INDUCTION',
          inductionAt: null,
          inductionById: null,
          inductionNotes: null
        },
        include: VISIT_INCLUDE
      });

      res.json({
        message: 'Status induction dikembalikan ke antrean menunggu',
        visit: formatSheVisit(updated)
      });
    } catch (err) {
      console.error('[SHE Reset] error:', err.message);
      res.status(500).json({ error: 'Gagal mereset status induction' });
    }
  }
);

// ============================================================
// 5. PENGATURAN NOTIFIKASI SHE
// ============================================================
router.get('/settings', authenticate, requireFeature('page.she_induction', 'Akses ditolak'), async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'she_notification_phone' }
    });

    const sheUsers = await prisma.user.findMany({
      where: { isActive: true, department: { code: 'SHE' } },
      select: { id: true, name: true, phone: true, email: true }
    });

    res.json({
      notificationPhone: setting?.value || '',
      sheOfficers: sheUsers
    });
  } catch (err) {
    console.error('[SHE Settings] error:', err.message);
    res.status(500).json({ error: 'Gagal memuat pengaturan SHE' });
  }
});

router.post(
  '/settings',
  authenticate,
  requireFeature('page.she_induction', 'Akses ditolak'),
  async (req, res) => {
    try {
      const { notificationPhone } = req.body || {};
      const val = notificationPhone ? String(notificationPhone).trim() : '';

      await prisma.setting.upsert({
        where: { key: 'she_notification_phone' },
        update: { value: val },
        create: { key: 'she_notification_phone', value: val }
      });

      res.json({ message: 'Pengaturan notifikasi SHE berhasil disimpan', notificationPhone: val });
    } catch (err) {
      console.error('[SHE Settings save] error:', err.message);
      res.status(500).json({ error: 'Gagal menyimpan pengaturan SHE' });
    }
  }
);

export default router;
