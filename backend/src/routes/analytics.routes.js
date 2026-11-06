import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

function formatOnSiteItem(v, overstayThresholdHours, now) {
  const checkInDate = v.checkInAt ? new Date(v.checkInAt) : new Date();
  const diffMs = Math.max(0, now - checkInDate);
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  const isOverstay = diffMins > overstayThresholdHours * 60;

  return {
    id: v.id,
    visitCode: v.visitNumber,
    visitNumber: v.visitNumber,
    visitType: v.visitType,
    fullName: v.visitor?.fullName || '-',
    identityNumber: v.visitor?.identityNumber || null,
    phoneNumber: v.visitor?.phoneNumber || '-',
    company: v.visitor?.company || '-',
    purpose: v.purpose,
    destinationDepartment: v.department,
    destinationDepartmentId: v.departmentId,
    host: v.picUser,
    hostId: v.picUserId,
    hostNameManual: v.hostNameManual,
    visitorBadgeNumber: v.visitorBadgeNumber,
    vehiclePlateNumber: v.vehiclePlateNumber,
    checkInTime: v.checkInAt,
    checkInAt: v.checkInAt,
    securityCheckInBy: v.checkInByUser,
    status: v.status,
    durationMinutes: diffMins,
    durationFormatted: `${hours} jam ${mins} menit`,
    isOverstay,
    overstayThresholdHours,
    createdAt: v.createdAt
  };
}

router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const now = new Date();

    // Date ranges
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch Overstay Threshold Hours from System Settings (Tahap 12 & 13)
    const overstaySetting = await prisma.systemSetting.findUnique({
      where: { key: 'overstay_hours' }
    });
    const overstayThresholdHours = overstaySetting ? parseFloat(overstaySetting.value) || 8 : 8;

    // Queries in parallel
    const [
      totalToday,
      totalThisMonth,
      currentlyOnSiteCount,
      pendingValidationCount,
      checkedInToday,
      checkedOutToday,
      walkInToday,
      preRegisteredToday,
      walkInTotal,
      preRegisteredTotal,
      totalAllTime,
      departments,
      onSiteVisitsRaw,
      recentVisitsRaw
    ] = await Promise.all([
      // Total visits expected or arrived today
      prisma.visit.count({
        where: { scheduledDate: { gte: startOfToday, lte: endOfToday } }
      }),
      // Total visits this month
      prisma.visit.count({
        where: { scheduledDate: { gte: startOfMonth, lte: endOfMonth } }
      }),
      // Live on-site count
      prisma.visit.count({
        where: { status: 'CHECKED_IN' }
      }),
      // Pending validation count
      prisma.visit.count({
        where: { status: 'PENDING_VALIDATION' }
      }),
      // Checked in today
      prisma.visit.count({
        where: { checkInAt: { gte: startOfToday, lte: endOfToday } }
      }),
      // Checked out today
      prisma.visit.count({
        where: {
          status: 'CHECKED_OUT',
          checkOutAt: { gte: startOfToday, lte: endOfToday }
        }
      }),
      // Walk-in today
      prisma.visit.count({
        where: {
          visitType: 'WALK_IN',
          createdAt: { gte: startOfToday, lte: endOfToday }
        }
      }),
      // Pre-registered today
      prisma.visit.count({
        where: {
          visitType: 'PRE_REGISTERED',
          scheduledDate: { gte: startOfToday, lte: endOfToday }
        }
      }),
      // Walk-in all time
      prisma.visit.count({ where: { visitType: 'WALK_IN' } }),
      // Pre-registered all time
      prisma.visit.count({ where: { visitType: 'PRE_REGISTERED' } }),
      // Cumulative all time
      prisma.visit.count(),
      // Stats by department
      prisma.department.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          _count: { select: { visits: true } },
          visits: {
            where: { status: 'CHECKED_IN' },
            select: { id: true }
          }
        },
        orderBy: { name: 'asc' }
      }),
      // All currently on-site visitors (Emergency & On-Site list)
      prisma.visit.findMany({
        where: { status: 'CHECKED_IN' },
        orderBy: { checkInAt: 'asc' },
        include: {
          visitor: true,
          department: { select: { id: true, name: true, code: true } },
          picUser: { select: { id: true, name: true, phone: true } },
          checkInByUser: { select: { id: true, name: true } },
          qrTokens: true
        }
      }),
      // Recent visits (latest 10)
      prisma.visit.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          visitor: true,
          department: { select: { id: true, name: true, code: true } },
          picUser: { select: { id: true, name: true, phone: true } },
          checkInByUser: { select: { id: true, name: true } },
          checkOutByUser: { select: { id: true, name: true } },
          qrTokens: true
        }
      })
    ]);

    // Calculate overstay and formatted durations for on-site visitors (Tahap 12)
    const onSiteVisits = onSiteVisitsRaw.map((v) =>
      formatOnSiteItem(v, overstayThresholdHours, now)
    );

    const overstayCount = onSiteVisits.filter((v) => v.isOverstay).length;

    // Daily Trend over last 14 days
    const dailyTrend = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayVisits = await prisma.visit.findMany({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
        select: { visitType: true }
      });

      const dayLabel = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      dailyTrend.push({
        date: dayLabel,
        total: dayVisits.length,
        walkIn: dayVisits.filter((v) => v.visitType === 'WALK_IN').length,
        preRegistered: dayVisits.filter((v) => v.visitType === 'PRE_REGISTERED').length
      });
    }

    const departmentStats = departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      totalVisits: d._count.visits,
      currentlyOnSite: d.visits.length
    }));

    // PIC Specific metrics if logged in as HOST_PIC
    let picStats = null;
    if (req.user.role === 'HOST_PIC') {
      const userId = req.user.id;
      const [picTodayScheduled, picCheckedIn, picCheckedOut, picTotal] = await Promise.all([
        prisma.visit.count({
          where: {
            OR: [{ picUserId: userId }, { createdById: userId }],
            scheduledDate: { gte: startOfToday, lte: endOfToday },
            status: { in: ['APPROVED', 'PENDING_VALIDATION'] }
          }
        }),
        prisma.visit.count({
          where: {
            OR: [{ picUserId: userId }, { createdById: userId }],
            status: 'CHECKED_IN'
          }
        }),
        prisma.visit.count({
          where: {
            OR: [{ picUserId: userId }, { createdById: userId }],
            status: 'CHECKED_OUT',
            checkOutAt: { gte: startOfToday, lte: endOfToday }
          }
        }),
        prisma.visit.count({
          where: {
            OR: [{ picUserId: userId }, { createdById: userId }]
          }
        })
      ]);

      picStats = {
        picTodayScheduled,
        picCheckedIn,
        picCheckedOut,
        picTotal
      };
    }

    // Format recent visits
    const formattedRecentVisits = recentVisitsRaw.map((v) => ({
      id: v.id,
      visitCode: v.visitNumber,
      visitNumber: v.visitNumber,
      visitType: v.visitType,
      fullName: v.visitor?.fullName || '-',
      company: v.visitor?.company || '-',
      phoneNumber: v.visitor?.phoneNumber || '-',
      destinationDepartment: v.department,
      host: v.picUser,
      hostNameManual: v.hostNameManual,
      status: v.status,
      checkInTime: v.checkInAt,
      checkOutTime: v.checkOutAt,
      createdAt: v.createdAt
    }));

    res.json({
      totalToday,
      totalThisMonth,
      currentlyOnSite: currentlyOnSiteCount,
      pendingValidationCount,
      checkedInToday,
      checkedOutToday,
      walkInToday,
      preRegisteredToday,
      walkInTotal,
      preRegisteredTotal,
      totalAllTime,
      departmentStats,
      dailyTrend,
      onSiteVisits,
      recentVisits: formattedRecentVisits,
      overstayCount,
      overstayThresholdHours,
      picStats,
      currentMonthLabel: now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    });
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ error: 'Failed to generate analytics summary' });
  }
});

// GET /api/analytics/emergency-list (Tahap 12 & 13: Emergency Muster Point Roll-Call)
router.get('/emergency-list', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const overstaySetting = await prisma.systemSetting.findUnique({
      where: { key: 'overstay_hours' }
    });
    const overstayThresholdHours = overstaySetting ? parseFloat(overstaySetting.value) || 8 : 8;

    const onSiteVisitsRaw = await prisma.visit.findMany({
      where: { status: 'CHECKED_IN' },
      orderBy: { checkInAt: 'asc' },
      include: {
        visitor: true,
        department: true,
        picUser: { select: { id: true, name: true, phone: true } },
        checkInByUser: { select: { id: true, name: true } }
      }
    });

    const emergencyList = onSiteVisitsRaw.map((v) =>
      formatOnSiteItem(v, overstayThresholdHours, now)
    );

    res.json({
      totalHeadcount: emergencyList.length,
      timestamp: now.toISOString(),
      plant: 'PT Cemindo Gemilang Tbk – Plant Batam',
      emergencyList
    });
  } catch (err) {
    console.error('Emergency list error:', err);
    res.status(500).json({ error: 'Gagal memuat Emergency Visitor List' });
  }
});

export default router;
