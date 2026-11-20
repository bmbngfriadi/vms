import express from 'express';
import prisma from '../db.js';
import { authenticate, requireFeature } from '../middleware/auth.js';
import { normalizeGuestNames } from './visits.js';
import * as msg from '../wa/messages.js';
import { notify } from '../wa/notify.js';

const router = express.Router();

const VISIT_INCLUDE = {
  visitor: true,
  department: { select: { id: true, name: true, code: true } },
  picUser: { select: { id: true, name: true, phone: true } },
  checkInBy: { select: { id: true, name: true } },
  checkOutBy: { select: { id: true, name: true } },
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

    const [activeAggr, todayAggr, waitingAggr, checkedOutAggr, officeAggr] = await Promise.all([
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
      })
    ]);

    res.json({
      activeInPlant: activeAggr._sum?.numberOfVisitors || 0,
      todayWork: todayAggr._sum?.numberOfVisitors || 0,
      waitingCheckIn: waitingAggr._sum?.numberOfVisitors || 0,
      checkedOutToday: checkedOutAggr._sum?.numberOfVisitors || 0,
      officeVisitorsToday: officeAggr._sum?.numberOfVisitors || 0
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
        badge: visit.badgeNumber
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
// 4. PENGATURAN NOMOR NOTIFIKASI SHE
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
