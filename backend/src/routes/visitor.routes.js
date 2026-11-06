import express from 'express';
import rateLimit from 'express-rate-limit';
import prisma from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateQrDataUrl } from '../services/qrcode.service.js';
import { enqueueWhatsAppNotification } from '../services/queue.service.js';
import { logActivity } from '../services/activity.service.js';
import {
  generateSecureToken,
  hashToken,
  calculateTokenExpiration
} from '../services/security.service.js';
import {
  getRenderedNotification,
  getActiveManagementRecipients
} from '../services/template.service.js';

const router = express.Router();

// ==============================================================================
// RATE LIMITERS (Tahap 15 Keamanan Aplikasi)
// ==============================================================================

const walkInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 walk-in submissions per IP
  message: { error: 'Terlalu banyak permintaan pendaftaran tamu dari perangkat Anda. Silakan coba kembali dalam beberapa menit.' },
  standardHeaders: true,
  legacyHeaders: false
});

const scanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // max 60 QR scan verifications per minute per IP
  message: { error: 'Aktivitas verifikasi QR melebihi batas kecepatan. Mohon tunggu sejenak.' },
  standardHeaders: true,
  legacyHeaders: false
});

function generateVisitCode() {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `VMS-${yearMonth}-${randomSuffix}`;
}

/**
 * Format visit record with relations into normalized API response (Tahap 13 & 15)
 * Masks NIK/identityNumber if caller is not ADMIN or SECURITY.
 */
function formatVisitResponse(visit, user = null) {
  if (!visit) return null;
  const qrTokens = visit.qrTokens || [];
  const checkInTokenObj =
    qrTokens.find((t) => t.type === 'CHECK_IN' && !t.isUsed) ||
    qrTokens.find((t) => t.type === 'CHECK_IN');
  const checkOutTokenObj =
    qrTokens.find((t) => t.type === 'CHECK_OUT' && !t.isUsed) ||
    qrTokens.find((t) => t.type === 'CHECK_OUT');

  // Compute duration
  let durationFormatted = '-';
  let durationMinutes = null;
  if (visit.checkInAt) {
    const start = new Date(visit.checkInAt);
    const end = visit.checkOutAt
      ? new Date(visit.checkOutAt)
      : visit.status === 'CHECKED_IN'
      ? new Date()
      : null;
    if (end) {
      const diffMs = Math.max(0, end - start);
      durationMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      durationFormatted = `${hours}j ${mins}m`;
    }
  }

  // Tahap 15 PII Masking: Mask identity number for non-privileged roles
  let identityNumber = visit.visitor?.identityNumber || null;
  if (identityNumber && user && user.role !== 'ADMIN' && user.role !== 'SECURITY') {
    identityNumber =
      identityNumber.length > 6
        ? `${identityNumber.slice(0, 4)}******${identityNumber.slice(-2)}`
        : '******';
  }

  return {
    id: visit.id,
    visitCode: visit.visitNumber,
    visitNumber: visit.visitNumber,
    visitType: visit.visitType,
    visitorId: visit.visitorId,
    fullName: visit.visitor?.fullName || '-',
    identityNumber,
    phoneNumber: visit.visitor?.phoneNumber || '-',
    email: visit.visitor?.email || null,
    company: visit.visitor?.company || '-',
    purpose: visit.purpose,
    destinationDepartmentId: visit.departmentId,
    destinationDepartment: visit.department,
    hostId: visit.picUserId,
    host: visit.picUser,
    hostNameManual: visit.hostNameManual,
    createdById: visit.createdById,
    createdBy: visit.createdByUser,
    vehicleType: visit.vehicleType,
    vehiclePlateNumber: visit.vehiclePlateNumber,
    visitorBadgeNumber: visit.visitorBadgeNumber,
    expectedDate: visit.scheduledDate,
    expectedTime: visit.expectedArrivalTime,
    numberOfVisitors: visit.numberOfVisitors,
    safetyInductionAgreed: visit.safetyInductionAgreed,
    status: visit.status,
    rejectionReason: visit.rejectionReason,
    cancellationReason: visit.cancellationReason,
    cancelledAt: visit.cancelledAt,
    notes: visit.notes,
    checkInTime: visit.checkInAt,
    checkInAt: visit.checkInAt,
    securityCheckInBy: visit.checkInByUser,
    checkOutTime: visit.checkOutAt,
    checkOutAt: visit.checkOutAt,
    securityCheckOutBy: visit.checkOutByUser,
    checkInToken: checkInTokenObj?.token || null,
    checkOutToken: checkOutTokenObj?.token || null,
    qrCodeData: checkInTokenObj?.qrDataUrl || checkOutTokenObj?.qrDataUrl || null,
    durationMinutes,
    durationFormatted,
    createdAt: visit.createdAt,
    updatedAt: visit.updatedAt
  };
}

/**
 * Dispatch notification to all active Management recipients using template (Tahap 8)
 */
async function notifyManagement(templateCode, variables, visitId) {
  try {
    const mgmtList = await getActiveManagementRecipients();
    const { message } = await getRenderedNotification(templateCode, variables);

    for (const m of mgmtList) {
      if (m.phone) {
        enqueueWhatsAppNotification({
          type: 'MANAGEMENT_ALERT',
          recipient: m.phone,
          message,
          visitId,
          idempotencyKey: `MGMT_${templateCode}_${visitId}_${m.phone}`
        });
      }
    }
  } catch (err) {
    console.warn('[Management Alert] Error dispatching alerts to management:', err);
  }
}

// ==============================================================================
// TAHAP 4 & 13: WALK-IN REGISTRATION (Tamu Tanpa Janji)
// ==============================================================================
router.post('/walk-in', walkInLimiter, async (req, res) => {
  try {
    const {
      fullName,
      company,
      phoneNumber,
      identityNumber,
      purpose,
      destinationDepartmentId,
      hostId,
      vehicleType,
      vehiclePlateNumber
    } = req.body;

    if (!fullName || !company || !phoneNumber || !purpose || !destinationDepartmentId || !hostId) {
      return res.status(400).json({ error: 'Mohon lengkapi seluruh field wajib dengan benar.' });
    }

    const dept = await prisma.department.findUnique({
      where: { id: destinationDepartmentId }
    });
    if (!dept || !dept.isActive) {
      return res.status(400).json({ error: 'Departemen tujuan tidak valid atau nonaktif.' });
    }

    const hostUser = await prisma.user.findUnique({ where: { id: hostId } });
    if (!hostUser || !hostUser.isActive || !hostUser.canReceiveVisits) {
      return res.status(400).json({
        error: 'Karyawan / PIC yang dipilih saat ini tidak dapat menerima kunjungan.'
      });
    }

    // Tahap 12: Check Visitor Blacklist
    const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
    const blacklisted = await prisma.visitorBlacklist.findFirst({
      where: {
        isActive: true,
        OR: [
          { fullName: { equals: fullName.trim(), mode: 'insensitive' } },
          ...(cleanPhone ? [{ phoneNumber: { contains: cleanPhone.slice(-8) } }] : []),
          ...(identityNumber ? [{ identityNumber: identityNumber.trim() }] : [])
        ]
      }
    });

    if (blacklisted) {
      return res.status(403).json({
        error: `AKSES DITOLAK: Nama atau identitas Anda terdaftar dalam daftar Blacklist PT Cemindo Gemilang Tbk – Plant Batam. Alasan: ${blacklisted.reason}`
      });
    }

    const now = new Date();
    const visitCode = generateVisitCode();

    // Secure token and hash (Tahap 9 & 13)
    const checkInToken = generateSecureToken('IN');
    const checkInTokenHash = hashToken(checkInToken);
    const checkInExpiresAt = calculateTokenExpiration(now, 24);
    const qrDataUrl = await generateQrDataUrl(checkInToken);

    // Tahap 13: Find or Create Visitor profile (Memisahkan tamu dari kunjungan)
    let visitor = await prisma.visitor.findFirst({
      where: {
        OR: [
          { phoneNumber: phoneNumber.trim() },
          ...(identityNumber ? [{ identityNumber: identityNumber.trim() }] : [])
        ]
      }
    });

    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: {
          fullName: fullName.trim(),
          company: company.trim(),
          phoneNumber: phoneNumber.trim(),
          identityNumber: identityNumber ? identityNumber.trim() : null
        }
      });
    } else {
      // Update profile info if changed
      visitor = await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          fullName: fullName.trim(),
          company: company.trim(),
          identityNumber: identityNumber ? identityNumber.trim() : visitor.identityNumber
        }
      });
    }

    // Create Visit transaction (Tahap 13)
    const visit = await prisma.visit.create({
      data: {
        visitorId: visitor.id,
        visitNumber: visitCode,
        visitType: 'WALK_IN',
        departmentId: destinationDepartmentId,
        picUserId: hostUser.id,
        hostNameManual: hostUser.name,
        purpose: purpose.trim(),
        scheduledDate: now,
        expectedArrivalTime: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        vehicleType: vehicleType || 'NONE',
        vehiclePlateNumber: vehiclePlateNumber ? vehiclePlateNumber.trim().toUpperCase() : null,
        status: 'PENDING_VALIDATION',
        qrTokens: {
          create: {
            token: checkInToken,
            tokenHash: checkInTokenHash,
            type: 'CHECK_IN',
            expiresAt: checkInExpiresAt,
            qrDataUrl
          }
        },
        visitLogs: {
          create: {
            action: 'SUBMITTED',
            notes: 'Walk-in visitor self-registration submitted at gate'
          }
        }
      },
      include: {
        visitor: true,
        department: true,
        picUser: true,
        qrTokens: true
      }
    });

    // Kirim notifikasi WA otomatis kepada PIC menggunakan template (Tahap 8)
    if (hostUser.phone) {
      const { message: picMsg } = await getRenderedNotification('WALK_IN_SUBMIT_PIC', {
        guestName: fullName,
        company,
        phone: phoneNumber,
        purpose,
        date: now.toLocaleDateString('id-ID'),
        time: visit.expectedArrivalTime,
        picName: hostUser.name,
        department: dept.name,
        visitCode
      });

      enqueueWhatsAppNotification({
        type: 'WALKIN_REQUEST_PIC',
        recipient: hostUser.phone,
        message: picMsg,
        visitId: visit.id,
        idempotencyKey: `WALKIN_PIC_${visit.id}`
      });
    }

    res.status(201).json({
      message: 'Pendaftaran berhasil. Silakan tunjukkan QR Code ini ke petugas Security di pos masuk.',
      visit: formatVisitResponse(visit, null),
      checkInToken,
      qrDataUrl
    });
  } catch (error) {
    console.error('Walk-in error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat mendaftarkan kunjungan.' });
  }
});

// Alias for general /register endpoint
router.post('/register', walkInLimiter, async (req, res) => {
  req.url = '/walk-in';
  return router.handle(req, res);
});

// ==============================================================================
// TAHAP 5 & 13: PRE-REGISTERED VISITOR (Pendaftaran oleh PIC / Janji Temu)
// ==============================================================================
router.post('/pre-register', authenticateToken, requireRole(['ADMIN', 'HOST_PIC']), async (req, res) => {
  try {
    const {
      fullName,
      company,
      phoneNumber,
      identityNumber,
      expectedDate,
      expectedTime,
      purpose,
      vehicleType,
      vehiclePlateNumber,
      numberOfVisitors
    } = req.body;

    if (!fullName || !company || !phoneNumber || !expectedDate || !purpose) {
      return res.status(400).json({ error: 'Mohon lengkapi seluruh field wajib registrasi janji temu.' });
    }

    // Tahap 12: Check Visitor Blacklist
    const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
    const blacklisted = await prisma.visitorBlacklist.findFirst({
      where: {
        isActive: true,
        OR: [
          { fullName: { equals: fullName.trim(), mode: 'insensitive' } },
          ...(cleanPhone ? [{ phoneNumber: { contains: cleanPhone.slice(-8) } }] : []),
          ...(identityNumber ? [{ identityNumber: identityNumber.trim() }] : [])
        ]
      }
    });

    if (blacklisted) {
      return res.status(403).json({
        error: `REGISTRASI DITOLAK: Calon tamu (${fullName}) terdaftar dalam daftar Blacklist PT Cemindo Gemilang Tbk – Plant Batam. Alasan: ${blacklisted.reason}`
      });
    }

    const hostUser = req.user;
    if (!hostUser.departmentId) {
      return res.status(400).json({ error: 'Akun Anda belum memiliki departemen terdaftar.' });
    }

    const visitCode = generateVisitCode();
    const expDateObj = new Date(expectedDate);

    // Cryptographically secure token and hash with expiration (Tahap 9 & 13)
    const checkInToken = generateSecureToken('IN');
    const checkInTokenHash = hashToken(checkInToken);
    const checkInExpiresAt = calculateTokenExpiration(expDateObj, 24);
    const qrDataUrl = await generateQrDataUrl(checkInToken);

    // Find or create Visitor profile
    let visitor = await prisma.visitor.findFirst({
      where: {
        OR: [
          { phoneNumber: phoneNumber.trim() },
          ...(identityNumber ? [{ identityNumber: identityNumber.trim() }] : [])
        ]
      }
    });

    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: {
          fullName: fullName.trim(),
          company: company.trim(),
          phoneNumber: phoneNumber.trim(),
          identityNumber: identityNumber ? identityNumber.trim() : null
        }
      });
    } else {
      visitor = await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          fullName: fullName.trim(),
          company: company.trim()
        }
      });
    }

    // Create Visit transaction (Tahap 13)
    const visit = await prisma.visit.create({
      data: {
        visitorId: visitor.id,
        visitNumber: visitCode,
        visitType: 'PRE_REGISTERED',
        departmentId: hostUser.departmentId,
        picUserId: hostUser.id,
        hostNameManual: hostUser.name,
        createdById: hostUser.id,
        purpose: purpose.trim(),
        scheduledDate: expDateObj,
        expectedArrivalTime: expectedTime || '09:00',
        numberOfVisitors: numberOfVisitors ? parseInt(numberOfVisitors, 10) : 1,
        vehicleType: vehicleType || 'CAR',
        vehiclePlateNumber: vehiclePlateNumber ? vehiclePlateNumber.trim().toUpperCase() : null,
        status: 'APPROVED',
        qrTokens: {
          create: {
            token: checkInToken,
            tokenHash: checkInTokenHash,
            type: 'CHECK_IN',
            expiresAt: checkInExpiresAt,
            qrDataUrl
          }
        },
        visitLogs: {
          create: {
            action: 'SUBMITTED',
            performedById: hostUser.id,
            notes: `Pre-registration created by PIC ${hostUser.name}`
          }
        }
      },
      include: {
        visitor: true,
        department: true,
        picUser: true,
        qrTokens: true
      }
    });

    // Kirim QR Code Check-in kepada tamu melalui WhatsApp sebagai gambar via template (Tahap 8)
    const { message: guestCaption } = await getRenderedNotification('PRE_REGISTER_GUEST', {
      guestName: fullName,
      company,
      date: expDateObj.toLocaleDateString('id-ID'),
      time: visit.expectedArrivalTime,
      picName: hostUser.name,
      department: hostUser.department?.name,
      visitCode
    });

    enqueueWhatsAppNotification({
      type: 'PREREGISTER_GUEST_QR',
      recipient: phoneNumber,
      message: guestCaption,
      qrText: checkInToken,
      isQrImage: true,
      visitId: visit.id,
      idempotencyKey: `PREREG_QR_${visit.id}`
    });

    await logActivity({
      userId: hostUser.id,
      action: 'PRE_REGISTER_CREATED',
      description: `PIC ${hostUser.name} created pre-registration pass ${visitCode} for ${fullName} (${company}) on ${expDateObj.toLocaleDateString()}`,
      req
    });

    res.status(201).json({
      message: 'Registrasi janji temu berhasil dibuat. QR Code Check-in telah dikirim ke WhatsApp tamu.',
      visit: formatVisitResponse(visit, hostUser),
      checkInToken,
      qrDataUrl
    });
  } catch (error) {
    console.error('Pre-register error:', error);
    res.status(500).json({ error: 'Gagal membuat registrasi janji temu.' });
  }
});

// ==============================================================================
// VERIFY SCANNED QR CODE (Tahap 9 & 13)
// ==============================================================================
router.post('/verify-scan', scanLimiter, authenticateToken, requireRole(['ADMIN', 'SECURITY']), async (req, res) => {
  try {
    const { token, mode } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token QR Code tidak boleh kosong' });
    }

    const cleanToken = token.trim();
    const tokenHash = hashToken(cleanToken);

    // 1. Look for matching QrToken
    const matchedToken = await prisma.qrToken.findFirst({
      where: {
        OR: [{ token: cleanToken }, { tokenHash }]
      },
      include: {
        visit: {
          include: {
            visitor: true,
            department: true,
            picUser: { select: { id: true, employeeId: true, name: true, phone: true } },
            checkInByUser: { select: { id: true, employeeId: true, name: true } },
            checkOutByUser: { select: { id: true, employeeId: true, name: true } },
            qrTokens: true
          }
        }
      }
    });

    let visit = matchedToken ? matchedToken.visit : null;

    // 2. Fallback: Search by visitNumber
    if (!visit) {
      visit = await prisma.visit.findFirst({
        where: { visitNumber: cleanToken.toUpperCase() },
        include: {
          visitor: true,
          department: true,
          picUser: { select: { id: true, employeeId: true, name: true, phone: true } },
          checkInByUser: { select: { id: true, employeeId: true, name: true } },
          checkOutByUser: { select: { id: true, employeeId: true, name: true } },
          qrTokens: true
        }
      });
    }

    if (!visit) {
      return res.status(404).json({ error: 'QR Code atau data kunjungan tidak ditemukan di sistem.' });
    }

    // Determine token type and status
    const isCheckOutToken = matchedToken?.type === 'CHECK_OUT';
    const now = new Date();
    const warnings = [];

    let canCheckIn = false;
    let canCheckOut = false;

    if (visit.status === 'PENDING_VALIDATION' || visit.status === 'APPROVED') {
      canCheckIn = true;
    } else if (visit.status === 'CHECKED_IN') {
      canCheckOut = true;
    }

    if (matchedToken) {
      if (matchedToken.isUsed) {
        warnings.push('PERINGATAN: QR Code ini sudah pernah digunakan sebelumnya (Single-Use Violation).');
        canCheckIn = false;
        canCheckOut = false;
      }
      if (matchedToken.expiresAt && now > new Date(matchedToken.expiresAt)) {
        warnings.push('PERINGATAN: QR Code telah kadaluarsa (Token Expired).');
        canCheckIn = false;
        canCheckOut = false;
      }
    }

    res.json({
      visit: formatVisitResponse(visit, req.user),
      scanType: isCheckOutToken && visit.status === 'CHECKED_IN' ? 'CHECK_OUT' : 'CHECK_IN',
      canCheckIn,
      canCheckOut,
      warnings
    });
  } catch (error) {
    console.error('Verify scan error:', error);
    res.status(500).json({ error: 'Gagal memverifikasi QR Code.' });
  }
});

// ==============================================================================
// TAHAP 4, 5 & 13: SECURITY VALIDATE CHECK-IN (DATABASE TRANSACTION ACID)
// ==============================================================================
router.post('/:id/validate-checkin', authenticateToken, requireRole(['ADMIN', 'SECURITY']), async (req, res) => {
  try {
    const { id } = req.params;
    const { visitorBadgeNumber, notes } = req.body;
    const checkInTime = new Date();

    // Generate new dedicated Check-Out Token with hash and expiration (Tahap 9 & 13)
    const checkOutToken = generateSecureToken('OUT');
    const checkOutTokenHash = hashToken(checkOutToken);
    const checkOutExpiresAt = calculateTokenExpiration(checkInTime, 24);
    const checkOutQrData = await generateQrDataUrl(checkOutToken);

    // ACID DATABASE TRANSACTION to prevent race conditions and double check-in (Tahap 13)
    const txResult = await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({
        where: { id },
        include: { visitor: true, qrTokens: true, department: true, picUser: true }
      });

      if (!visit) {
        throw new Error('Data kunjungan tidak ditemukan');
      }

      if (visit.status === 'CHECKED_IN') {
        throw new Error('Tamu sudah tercatat Check-In di lokasi sebelumnya.');
      }

      if (visit.status === 'CHECKED_OUT') {
        throw new Error('Kunjungan ini telah selesai dan Check-Out.');
      }

      if (visit.status === 'CANCELLED') {
        throw new Error('Kunjungan ini telah dibatalkan.');
      }

      // Mark check-in QR token as used
      await tx.qrToken.updateMany({
        where: { visitId: id, type: 'CHECK_IN' },
        data: { isUsed: true, usedAt: checkInTime }
      });

      // Create new dedicated Check-Out QR token
      await tx.qrToken.create({
        data: {
          visitId: id,
          token: checkOutToken,
          tokenHash: checkOutTokenHash,
          type: 'CHECK_OUT',
          expiresAt: checkOutExpiresAt,
          qrDataUrl: checkOutQrData
        }
      });

      // Update visit status and officer
      const updated = await tx.visit.update({
        where: { id },
        data: {
          status: 'CHECKED_IN',
          checkInAt: checkInTime,
          checkInById: req.user.id,
          visitorBadgeNumber: visitorBadgeNumber || visit.visitorBadgeNumber,
          notes: notes || visit.notes
        },
        include: {
          visitor: true,
          department: true,
          picUser: true,
          checkInByUser: { select: { id: true, employeeId: true, name: true } },
          qrTokens: true
        }
      });

      // Record audit in visit_logs (Tahap 13)
      await tx.visitLog.create({
        data: {
          visitId: id,
          action: 'CHECKED_IN',
          performedById: req.user.id,
          notes: `Checked in by Security ${req.user.name} at gate. Badge #${visitorBadgeNumber || '-'}`,
          ipAddress: req.ip
        }
      });

      return updated;
    });

    const timeStr = checkInTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const officerName = req.user.name;

    const templateVars = {
      guestName: txResult.visitor.fullName,
      company: txResult.visitor.company,
      time: timeStr,
      officerName,
      badgeNumber: visitorBadgeNumber || '-',
      vehiclePlate: txResult.vehiclePlateNumber || '-',
      department: txResult.department?.name,
      picName: txResult.hostNameManual || txResult.picUser?.name,
      visitCode: txResult.visitNumber
    };

    // 1. Notifikasi WhatsApp ke PIC via Template (Tahap 8)
    if (txResult.picUser?.phone) {
      const { message: picMsg } = await getRenderedNotification('CHECK_IN_PIC', templateVars);
      enqueueWhatsAppNotification({
        type: 'CHECKIN_ALERT_PIC',
        recipient: txResult.picUser.phone,
        message: picMsg,
        visitId: txResult.id,
        idempotencyKey: `CHECKIN_PIC_${txResult.id}`
      });
    }

    // 2. Notifikasi WhatsApp ke Management via Template & Recipients table (Tahap 8)
    notifyManagement('CHECK_IN_MANAGEMENT', templateVars, txResult.id);

    // 3. Notifikasi WhatsApp ke Tamu DISERTAI GAMBAR QR CODE CHECK-OUT (Tahap 7 & 8)
    const { message: guestCaption } = await getRenderedNotification('CHECK_IN_GUEST_PASS', templateVars);
    enqueueWhatsAppNotification({
      type: 'CHECKOUT_QR_IMAGE_GUEST',
      recipient: txResult.visitor.phoneNumber,
      message: guestCaption,
      qrText: checkOutToken,
      isQrImage: true,
      visitId: txResult.id,
      idempotencyKey: `CHECKIN_GUEST_QR_${txResult.id}`
    });

    await logActivity({
      userId: req.user.id,
      action: 'VISIT_CHECK_IN',
      description: `Visitor ${txResult.visitor.fullName} (${txResult.visitNumber}) validated & checked in by Security ${officerName} (Badge: ${visitorBadgeNumber || '-'}). Check-out QR sent to guest.`,
      req
    });

    res.json({
      message: 'Check-In berhasil. QR Code Check-Out telah dikirimkan ke WhatsApp tamu dalam bentuk gambar.',
      visit: formatVisitResponse(txResult, req.user),
      checkOutToken,
      qrCodeData: checkOutQrData
    });
  } catch (error) {
    console.error('Validate check-in error:', error);
    res.status(400).json({ error: error.message || 'Gagal memproses Check-In.' });
  }
});

// ==============================================================================
// TAHAP 6 & 13: SECURITY VALIDATE CHECK-OUT (DATABASE TRANSACTION ACID)
// ==============================================================================
router.post('/:id/validate-checkout', authenticateToken, requireRole(['ADMIN', 'SECURITY']), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const checkOutTime = new Date();

    // ACID DATABASE TRANSACTION to prevent race conditions and duplicate check-out (Tahap 13)
    const txResult = await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({
        where: { id },
        include: { visitor: true, department: true, picUser: true, qrTokens: true }
      });

      if (!visit) {
        throw new Error('Data kunjungan tidak ditemukan');
      }

      if (visit.status !== 'CHECKED_IN') {
        throw new Error(`Status kunjungan saat ini adalah ${visit.status}. Tamu hanya dapat Check-Out jika statusnya sedang CHECKED_IN.`);
      }

      // Mark all QR tokens for this visit as used permanently (Tahap 9 Single-use QR)
      await tx.qrToken.updateMany({
        where: { visitId: id },
        data: { isUsed: true, usedAt: checkOutTime }
      });

      // Update visit status and officer
      const updated = await tx.visit.update({
        where: { id },
        data: {
          status: 'CHECKED_OUT',
          checkOutAt: checkOutTime,
          checkOutById: req.user.id,
          notes: notes ? `${visit.notes || ''}\n[Check-Out Note]: ${notes}` : visit.notes
        },
        include: {
          visitor: true,
          department: true,
          picUser: true,
          checkInByUser: { select: { id: true, name: true } },
          checkOutByUser: { select: { id: true, name: true } },
          qrTokens: true
        }
      });

      // Record audit in visit_logs (Tahap 13)
      await tx.visitLog.create({
        data: {
          visitId: id,
          action: 'CHECKED_OUT',
          performedById: req.user.id,
          notes: `Checked out by Security ${req.user.name}. Pass permanently invalidated.`,
          ipAddress: req.ip
        }
      });

      return updated;
    });

    const timeOutStr = checkOutTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const officerName = req.user.name;

    // Hitung durasi kunjungan
    let durationText = '-';
    if (txResult.checkInAt) {
      const diffMs = checkOutTime - new Date(txResult.checkInAt);
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      durationText = hours > 0 ? `${hours} jam ${mins} menit` : `${mins} menit`;
    }

    const templateVars = {
      guestName: txResult.visitor.fullName,
      company: txResult.visitor.company,
      time: timeOutStr,
      checkOutTime: timeOutStr,
      duration: durationText,
      officerName,
      department: txResult.department?.name,
      picName: txResult.hostNameManual || txResult.picUser?.name,
      visitCode: txResult.visitNumber
    };

    // 1. Notifikasi WhatsApp ke PIC (Tahap 8)
    if (txResult.picUser?.phone) {
      const { message: picMsg } = await getRenderedNotification('CHECK_OUT_PIC', templateVars);
      enqueueWhatsAppNotification({
        type: 'CHECKOUT_ALERT_PIC',
        recipient: txResult.picUser.phone,
        message: picMsg,
        visitId: txResult.id,
        idempotencyKey: `CHECKOUT_PIC_${txResult.id}`
      });
    }

    // 2. Notifikasi WhatsApp ke Management (Tahap 8)
    notifyManagement('CHECK_OUT_MANAGEMENT', templateVars, txResult.id);

    // 3. Notifikasi WhatsApp ucapan terima kasih ke Tamu (Tahap 8)
    const { message: guestMsg } = await getRenderedNotification('CHECK_OUT_GUEST', templateVars);
    enqueueWhatsAppNotification({
      type: 'CHECKOUT_CONFIRM_GUEST',
      recipient: txResult.visitor.phoneNumber,
      message: guestMsg,
      visitId: txResult.id,
      idempotencyKey: `CHECKOUT_GUEST_${txResult.id}`
    });

    await logActivity({
      userId: req.user.id,
      action: 'VISIT_CHECK_OUT',
      description: `Visitor ${txResult.visitor.fullName} (${txResult.visitNumber}) checked out by ${officerName} (Duration: ${durationText}). Pass invalidated permanently.`,
      req
    });

    res.json({
      message: 'Check-Out berhasil diproses. QR Code telah dinonaktifkan secara permanen.',
      visit: formatVisitResponse(txResult, req.user)
    });
  } catch (error) {
    console.error('Validate check-out error:', error);
    res.status(400).json({ error: error.message || 'Gagal memproses Check-Out.' });
  }
});

// Reject Walk-in by Security
router.post('/:id/reject-walkin', authenticateToken, requireRole(['ADMIN', 'SECURITY']), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const updated = await prisma.visit.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'Tidak disetujui Security / PIC'
      },
      include: { visitor: true, department: true, picUser: true, qrTokens: true }
    });

    await prisma.visitLog.create({
      data: {
        visitId: id,
        action: 'REJECTED',
        performedById: req.user.id,
        notes: `Rejected by Security ${req.user.name}. Reason: ${reason || '-'}`,
        ipAddress: req.ip
      }
    });

    // Invalidate QR tokens
    await prisma.qrToken.updateMany({
      where: { visitId: id },
      data: { isUsed: true }
    });

    res.json({ message: 'Kunjungan telah ditolak', visit: formatVisitResponse(updated, req.user) });
  } catch (error) {
    res.status(500).json({ error: 'Gagal menolak kunjungan' });
  }
});

// Cancel Visit by PIC or Admin
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { visitor: true, picUser: true }
    });

    if (!visit) return res.status(404).json({ error: 'Kunjungan tidak ditemukan' });

    if (visit.status === 'CHECKED_IN' || visit.status === 'CHECKED_OUT') {
      return res.status(400).json({ error: 'Kunjungan yang sudah Check-In tidak dapat dibatalkan.' });
    }

    if (req.user.role === 'HOST_PIC' && visit.picUserId !== req.user.id && visit.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Anda tidak berhak membatalkan kunjungan ini.' });
    }

    const updated = await prisma.visit.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason || 'Dibatalkan oleh PIC',
        cancelledAt: new Date()
      },
      include: { visitor: true, department: true, picUser: true, qrTokens: true }
    });

    await prisma.visitLog.create({
      data: {
        visitId: id,
        action: 'CANCELLED',
        performedById: req.user.id,
        notes: `Cancelled by ${req.user.name}. Reason: ${reason || '-'}`,
        ipAddress: req.ip
      }
    });

    // Invalidate QR tokens
    await prisma.qrToken.updateMany({
      where: { visitId: id },
      data: { isUsed: true }
    });

    res.json({ message: 'Kunjungan berhasil dibatalkan', visit: formatVisitResponse(updated, req.user) });
  } catch (error) {
    res.status(500).json({ error: 'Gagal membatalkan kunjungan' });
  }
});

// ==============================================================================
// TAHAP 11 & 13: GENERAL QUERIES & MULTI-FILTER REPORTS
// ==============================================================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      departmentId,
      date,
      startDate,
      endDate,
      search,
      fullName,
      company,
      hostId,
      visitType,
      page = 1,
      limit = 100
    } = req.query;

    const andConditions = [];

    // Role-based restrictions: PIC only sees visits they host or created
    if (req.user.role === 'HOST_PIC') {
      andConditions.push({
        OR: [{ picUserId: req.user.id }, { createdById: req.user.id }]
      });
    }

    if (status && status !== 'ALL') andConditions.push({ status });
    if (visitType && visitType !== 'ALL') andConditions.push({ visitType });
    if (departmentId && departmentId !== 'ALL') andConditions.push({ departmentId });
    if (hostId && hostId !== 'ALL') andConditions.push({ picUserId: hostId });

    if (fullName && fullName.trim()) {
      andConditions.push({
        visitor: { fullName: { contains: fullName.trim(), mode: 'insensitive' } }
      });
    }
    if (company && company.trim()) {
      andConditions.push({
        visitor: { company: { contains: company.trim(), mode: 'insensitive' } }
      });
    }

    // Date filtering: single date OR date range
    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      andConditions.push({ scheduledDate: { gte: s, lte: e } });
    } else if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      andConditions.push({ scheduledDate: { gte: s } });
    } else if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      andConditions.push({ scheduledDate: { lte: e } });
    } else if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      andConditions.push({ scheduledDate: { gte: startOfDay, lte: endOfDay } });
    }

    if (search && search.trim()) {
      const q = search.trim();
      andConditions.push({
        OR: [
          { visitor: { fullName: { contains: q, mode: 'insensitive' } } },
          { visitor: { company: { contains: q, mode: 'insensitive' } } },
          { visitor: { phoneNumber: { contains: q, mode: 'insensitive' } } },
          { visitNumber: { contains: q, mode: 'insensitive' } },
          { vehiclePlateNumber: { contains: q, mode: 'insensitive' } }
        ]
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const visits = await prisma.visit.findMany({
      where,
      take: parseInt(limit, 10),
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      orderBy: { createdAt: 'desc' },
      include: {
        visitor: true,
        department: true,
        picUser: { select: { id: true, name: true, phone: true, employeeId: true } },
        checkInByUser: { select: { id: true, name: true } },
        checkOutByUser: { select: { id: true, name: true } },
        qrTokens: true
      }
    });

    const response = visits.map((v) => formatVisitResponse(v, req.user));
    res.json(response);
  } catch (error) {
    console.error('Visits query error:', error);
    res.status(500).json({ error: 'Gagal memuat data kunjungan' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        visitor: true,
        department: true,
        picUser: true,
        checkInByUser: true,
        checkOutByUser: true,
        qrTokens: true,
        visitLogs: {
          orderBy: { createdAt: 'desc' },
          include: { performedBy: { select: { id: true, name: true, employeeId: true } } }
        }
      }
    });

    if (!visit) return res.status(404).json({ error: 'Kunjungan tidak ditemukan' });
    res.json(formatVisitResponse(visit, req.user));
  } catch (error) {
    res.status(500).json({ error: 'Gagal memuat detail kunjungan' });
  }
});

router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const visit = await prisma.visit.findUnique({
      where: { visitNumber: code.toUpperCase() },
      include: {
        visitor: true,
        department: true,
        picUser: true,
        checkInByUser: true,
        checkOutByUser: true,
        qrTokens: true
      }
    });

    if (!visit) return res.status(404).json({ error: 'Kunjungan tidak ditemukan' });
    res.json(formatVisitResponse(visit, null));
  } catch (error) {
    res.status(500).json({ error: 'Gagal memuat kunjungan via kode' });
  }
});

export default router;
