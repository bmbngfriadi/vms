import express from 'express';
import prisma from '../db.js';
import { authenticate, requireFeature } from '../middleware/auth.js';
import { normalizeGuestNames } from './visits.js';
import * as msg from '../wa/messages.js';
import { notify } from '../wa/notify.js';

const router = express.Router();

function requestBaseUrl(req) {
  const appUrl = (process.env.PUBLIC_APP_URL || 'http://localhost').replace(/\/+$/, '');
  if (appUrl && !/localhost|127\.0\.0\.1/i.test(appUrl)) return appUrl;
  if (req?.get('host')) return `${req.protocol}://${req.get('host')}`;
  return appUrl;
}

const sheInductionUrl = (visitNumber, req = null) =>
  `${requestBaseUrl(req)}/she?search=${encodeURIComponent(visitNumber)}`;

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
    departmentCode: v.department?.code || '',
    picName: v.picUser?.name || v.picNameManual || '-',
    picPhone: v.picUser?.phone || null,
    purpose: v.purpose,
    destinationArea: v.destinationArea || 'OFFICE',
    workDescription: v.workDescription || null,
    requiresInduction: !!v.requiresInduction,
    inductionStatus: v.inductionStatus || (v.requiresInduction ? 'PENDING' : 'NOT_REQUIRED'),
    inductionAt: v.inductionAt,
    inductionByName: v.inductionBy?.name || null,
    inductionNotes: v.inductionNotes || null,
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
// 1. STATISTIK RINGKASAN TAMU PEKERJAAN (SHE)
// ============================================================
router.get('/stats', authenticate, requireFeature('page.she_induction', 'Akses ditolak'), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [activeAggr, todayAggr, waitingAggr, checkedOutAggr, officeAggr, totalWorkAggr, inductedAggr, pendingAggr] = await Promise.all([
      // Tamu pekerjaan yang saat ini berada di pabrik (Live Headcount Pabrik)
      prisma.visit.aggregate({
        where: {
          requiresInduction: true,
          status: 'CHECKED_IN'
        },
        _sum: { numberOfVisitors: true }
      }),
      // Total tamu pekerjaan hari ini
      prisma.visit.aggregate({
        where: {
          requiresInduction: true,
          createdAt: { gte: startOfDay }
        },
        _sum: { numberOfVisitors: true }
      }),
      // Tamu pekerjaan terjadwal yang belum check-in
      prisma.visit.aggregate({
        where: {
          requiresInduction: true,
          status: { in: ['WAITING_VALIDATION', 'APPROVED'] }
        },
        _sum: { numberOfVisitors: true }
      }),
      // Tamu pekerjaan yang sudah selesai check-out hari ini
      prisma.visit.aggregate({
        where: {
          requiresInduction: true,
          status: 'CHECKED_OUT',
          checkOutAt: { gte: startOfDay }
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
      }),
      // Total keseluruhan tamu yang datang dan melakukan pekerjaan (All-time pernah masuk / aktif)
      prisma.visit.aggregate({
        where: {
          requiresInduction: true,
          status: { in: ['CHECKED_IN', 'CHECKED_OUT'] }
        },
        _sum: { numberOfVisitors: true },
        _count: { id: true }
      }),
      // Total tamu pekerjaan yang sudah di-induction K3
      prisma.visit.aggregate({
        where: {
          requiresInduction: true,
          inductionStatus: 'COMPLETED'
        },
        _sum: { numberOfVisitors: true },
        _count: { id: true }
      }),
      // Total tamu pekerjaan yang butuh / belum di-induction K3
      prisma.visit.aggregate({
        where: {
          requiresInduction: true,
          inductionStatus: { not: 'COMPLETED' }
        },
        _sum: { numberOfVisitors: true },
        _count: { id: true }
      })
    ]);

    res.json({
      activeInPlant: activeAggr._sum?.numberOfVisitors || 0,
      todayWork: todayAggr._sum?.numberOfVisitors || 0,
      waitingCheckIn: waitingAggr._sum?.numberOfVisitors || 0,
      checkedOutToday: checkedOutAggr._sum?.numberOfVisitors || 0,
      officeVisitorsToday: officeAggr._sum?.numberOfVisitors || 0,
      totalWorkVisitors: totalWorkAggr._sum?.numberOfVisitors || 0,
      totalWorkSessions: totalWorkAggr._count?.id || 0,
      totalInductedVisitors: inductedAggr._sum?.numberOfVisitors || 0,
      totalInductedSessions: inductedAggr._count?.id || 0,
      totalPendingVisitors: pendingAggr._sum?.numberOfVisitors || 0,
      totalPendingSessions: pendingAggr._count?.id || 0
    });
  } catch (err) {
    console.error('[SHE Stats] error:', err.message);
    res.status(500).json({ error: 'Gagal memuat statistik SHE' });
  }
});

// ============================================================
// 2. DAFTAR KUNJUNGAN TAMU PEKERJAAN PABRIK (SHE)
// ============================================================
router.get('/visits', authenticate, requireFeature('page.she_induction', 'Akses ditolak'), async (req, res) => {
  try {
    const { tab = 'active', search, date } = req.query;
    const where = {
      requiresInduction: true
    };

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    if (tab === 'active') {
      where.status = 'CHECKED_IN';
    } else if (tab === 'pending') {
      where.inductionStatus = { not: 'COMPLETED' };
    } else if (tab === 'inducted') {
      where.inductionStatus = 'COMPLETED';
    } else if (tab === 'today') {
      where.createdAt = { gte: startOfDay };
    } else if (tab === 'waiting') {
      where.status = { in: ['WAITING_VALIDATION', 'APPROVED'] };
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
// 3. KIRIM ULANG NOTIFIKASI WHATSAPP KE TIM SHE
// ============================================================
router.post(
  '/visits/:id/resend-wa',
  authenticate,
  requireFeature('page.she_induction', 'Akses ditolak'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const visit = await prisma.visit.findUnique({
        where: { id },
        include: {
          visitor: true,
          department: true,
          picUser: true
        }
      });

      if (!visit) {
        return res.status(404).json({ error: 'Data kunjungan tidak ditemukan' });
      }

      if (!visit.requiresInduction) {
        return res.status(400).json({ error: 'Kunjungan ini tidak berstatus tamu pekerjaan lapangan' });
      }

      const sheUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          department: { code: 'SHE' },
          phone: { not: null }
        },
        select: { phone: true, name: true }
      });

      const sheSetting = await prisma.setting.findUnique({
        where: { key: 'she_notification_phone' }
      });

      const recipients = new Set();
      if (sheSetting?.value) {
        sheSetting.value.split(',').map((p) => p.trim()).filter(Boolean).forEach((p) => recipients.add(p));
      }
      sheUsers.forEach((u) => {
        if (u.phone) recipients.add(u.phone);
      });

      if (recipients.size === 0) {
        return res.status(400).json({
          error: 'Belum ada nomor WhatsApp Tim SHE yang terdaftar. Silakan atur di Pengaturan WA SHE.'
        });
      }

      const messageText = msg.sheInductionAlert({
        visitNumber: visit.visitNumber,
        guestName: visit.visitor?.fullName,
        guestNames: visit.guestNames,
        company: visit.visitor?.company,
        department: visit.department?.name,
        picName: visit.picUser?.name || visit.picNameManual,
        purpose: visit.purpose,
        workDescription: visit.workDescription,
        checkInAt: visit.checkInAt || visit.createdAt,
        badge: visit.badgeNumber,
        sheUrl: sheInductionUrl(visit.visitNumber, req)
      });

      let sentCount = 0;
      recipients.forEach((phone) => {
        notify({
          visitId: visit.id,
          recipient: phone,
          type: 'SHE_INDUCTION_ALERT',
          message: messageText
        });
        sentCount++;
      });

      res.json({
        ok: true,
        message: `Notifikasi WhatsApp berhasil dikirim ke ${sentCount} nomor Tim SHE.`
      });
    } catch (err) {
      console.error('[SHE Resend WA] error:', err.message);
      res.status(500).json({ error: 'Gagal mengirim ulang notifikasi WhatsApp' });
    }
  }
);

// ============================================================
// 4. UPDATE STATUS INDUCTION K3
// ============================================================
router.post(
  '/visits/:id/induction',
  authenticate,
  requireFeature('page.she_induction', 'Akses ditolak'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status = 'COMPLETED', notes } = req.body;

      const visit = await prisma.visit.findUnique({
        where: { id },
        include: { visitor: true }
      });

      if (!visit) {
        return res.status(404).json({ error: 'Data kunjungan tidak ditemukan' });
      }

      const isCompleted = status === 'COMPLETED';

      const updated = await prisma.visit.update({
        where: { id },
        data: {
          inductionStatus: isCompleted ? 'COMPLETED' : 'PENDING',
          inductionAt: isCompleted ? new Date() : null,
          inductionById: isCompleted ? req.user.id : null,
          inductionNotes: notes !== undefined ? notes : visit.inductionNotes
        },
        include: VISIT_INCLUDE
      });

      res.json({
        ok: true,
        message: isCompleted
          ? `Status Safety Induction untuk ${visit.visitor?.fullName || 'tamu'} berhasil ditandai SUDAH DI-INDUCTION.`
          : `Status Safety Induction untuk ${visit.visitor?.fullName || 'tamu'} dikembalikan ke BELUM INDUCTION.`,
        visit: formatSheVisit(updated)
      });
    } catch (err) {
      console.error('[SHE Induction Toggle] error:', err.message);
      res.status(500).json({ error: 'Gagal memperbarui status induction K3' });
    }
  }
);

// ============================================================
// 5. PENGATURAN NOMOR NOTIFIKASI SHE
// ============================================================
router.get('/settings', authenticate, requireFeature('page.she_induction', 'Akses ditolak'), async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'she_notification_phone' }
    });

    const sheUsers = await prisma.user.findMany({
      where: {
        department: { code: 'SHE' },
        isActive: true
      },
      select: { id: true, name: true, phone: true }
    });

    res.json({
      notificationPhone: setting?.value || '',
      sheOfficers: sheUsers
    });
  } catch (err) {
    console.error('[SHE Settings] error:', err.message);
    res.status(500).json({ error: 'Gagal memuat pengaturan notifikasi SHE' });
  }
});

router.post('/settings', authenticate, requireFeature('page.she_induction', 'Akses ditolak'), async (req, res) => {
  try {
    const { notificationPhone } = req.body || {};
    const val = typeof notificationPhone === 'string' ? notificationPhone.trim() : '';

    await prisma.setting.upsert({
      where: { key: 'she_notification_phone' },
      update: { value: val },
      create: { key: 'she_notification_phone', value: val }
    });

    res.json({ ok: true, notificationPhone: val });
  } catch (err) {
    console.error('[SHE Save Settings] error:', err.message);
    res.status(500).json({ error: 'Gagal menyimpan pengaturan notifikasi SHE' });
  }
});

export default router;
