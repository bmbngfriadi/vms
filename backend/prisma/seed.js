import { PrismaClient, UserRole, VisitStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('🏭 PT CEMINDO GEMILANG TBK – PLANT BATAM VMS');
  console.log('📦 TAHAP 13: RELATIONAL DATABASE SEEDING');
  console.log('================================================================');

  // 1. ROLES (Tahap 13: Role table)
  const roleDefs = [
    { name: 'ADMIN', description: 'System Administrator with full access to master data, users, and audit logs' },
    { name: 'SECURITY', description: 'Plant Security Officer for gate validation, QR scanning, check-in, check-out' },
    { name: 'HOST_PIC', description: 'Department Host / PIC for pre-registering visitors and confirming visits' },
    { name: 'MANAGEMENT', description: 'Executive Management with read-only access to plant headcount, analytics, and reports' }
  ];

  const roles = {};
  for (const r of roleDefs) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r
    });
    roles[r.name] = roleRecord;
  }
  console.log('✅ Roles seeded:', Object.keys(roles).length);

  // 2. MASTER DEPARTMENTS (9 Departments requested)
  const deptsTarget = [
    { code: 'HRGA', name: 'HRGA', description: 'Human Resources & General Affairs', isActive: true },
    { code: 'IT', name: 'IT', description: 'Information Technology & Automation', isActive: true },
    { code: 'PROD', name: 'Production', description: 'Cement Grinding & Packing Operations', isActive: true },
    { code: 'MAINT', name: 'Maintenance', description: 'Mechanical & Electrical Maintenance', isActive: true },
    { code: 'QC', name: 'Quality Control', description: 'Quality Assurance & Cement Testing Lab', isActive: true },
    { code: 'LOG', name: 'Logistic', description: 'Logistics, Port Jetty & Warehouse Distribution', isActive: true },
    { code: 'FIN', name: 'Finance', description: 'Finance & Accounting', isActive: true },
    { code: 'PROC', name: 'Procurement', description: 'Procurement & Material Management', isActive: true },
    { code: 'SHE', name: 'SHE', description: 'Safety, Health & Environment', isActive: true }
  ];

  const depts = {};
  for (const dept of deptsTarget) {
    const d = await prisma.department.upsert({
      where: { name: dept.name },
      update: { code: dept.code, description: dept.description, isActive: dept.isActive },
      create: dept
    });
    depts[dept.name] = d;
  }
  console.log('✅ Departments seeded:', Object.keys(depts).length);

  // 3. USERS / EMPLOYEES
  const salt = await bcrypt.genSalt(10);
  const hashPassword = async (pass) => bcrypt.hash(pass, salt);

  const usersData = [
    // Administrator
    {
      employeeId: 'CG-BATAM-001',
      name: 'System Administrator',
      email: 'admin@cemindo.com',
      password: await hashPassword('admin123'),
      phone: '6281234567890',
      role: UserRole.ADMIN,
      roleId: roles['ADMIN'].id,
      isActive: true,
      canReceiveVisits: true,
      departmentId: depts['HRGA'].id
    },
    // Security Officers (Individual accounts)
    {
      employeeId: 'CG-SEC-01',
      name: 'Agus Pratama (Danru Security)',
      email: 'security.agus@cemindo.com',
      password: await hashPassword('security123'),
      phone: '6281234567891',
      role: UserRole.SECURITY,
      roleId: roles['SECURITY'].id,
      isActive: true,
      canReceiveVisits: false,
      departmentId: depts['SHE'].id
    },
    {
      employeeId: 'CG-SEC-02',
      name: 'Bambang Sugiarto (Security Gate 1)',
      email: 'security.bambang@cemindo.com',
      password: await hashPassword('security123'),
      phone: '6281234567892',
      role: UserRole.SECURITY,
      roleId: roles['SECURITY'].id,
      isActive: true,
      canReceiveVisits: false,
      departmentId: depts['SHE'].id
    },
    {
      employeeId: 'CG-SEC-03',
      name: 'Rian Hidayat (Security Gate 2)',
      email: 'security.rian@cemindo.com',
      password: await hashPassword('security123'),
      phone: '6281234567893',
      role: UserRole.SECURITY,
      roleId: roles['SECURITY'].id,
      isActive: true,
      canReceiveVisits: false,
      departmentId: depts['SHE'].id
    },
    {
      employeeId: 'CG-SEC-00',
      name: 'Pos Security Utama (Main Gate)',
      email: 'security@cemindo.com',
      password: await hashPassword('security123'),
      phone: '6281234567894',
      role: UserRole.SECURITY,
      roleId: roles['SECURITY'].id,
      isActive: true,
      canReceiveVisits: false,
      departmentId: depts['SHE'].id
    },
    // Department PICs
    {
      employeeId: 'CG-PRD-01',
      name: 'Budi Santoso',
      email: 'pic.production@cemindo.com',
      password: await hashPassword('pic123'),
      phone: '6281234567895',
      role: UserRole.HOST_PIC,
      roleId: roles['HOST_PIC'].id,
      isActive: true,
      canReceiveVisits: true,
      departmentId: depts['Production'].id
    },
    {
      employeeId: 'CG-IT-01',
      name: 'Ahmad Fauzi',
      email: 'pic.it@cemindo.com',
      password: await hashPassword('pic123'),
      phone: '6281234567896',
      role: UserRole.HOST_PIC,
      roleId: roles['HOST_PIC'].id,
      isActive: true,
      canReceiveVisits: true,
      departmentId: depts['IT'].id
    },
    {
      employeeId: 'CG-HR-01',
      name: 'Siti Rahmawati',
      email: 'pic.hrga@cemindo.com',
      password: await hashPassword('pic123'),
      phone: '6281234567897',
      role: UserRole.HOST_PIC,
      roleId: roles['HOST_PIC'].id,
      isActive: true,
      canReceiveVisits: true,
      departmentId: depts['HRGA'].id
    },
    {
      employeeId: 'CG-SHE-01',
      name: 'Hendra Gunawan (SHE Officer)',
      email: 'pic.she@cemindo.com',
      password: await hashPassword('pic123'),
      phone: '6281234567898',
      role: UserRole.HOST_PIC,
      roleId: roles['HOST_PIC'].id,
      isActive: true,
      canReceiveVisits: true,
      departmentId: depts['SHE'].id
    },
    // Plant Management
    {
      employeeId: 'CG-MGT-01',
      name: 'Ir. Wahyu Hidayat (Plant Manager)',
      email: 'management.wahyu@cemindo.com',
      password: await hashPassword('management123'),
      phone: '6281234567899',
      role: UserRole.MANAGEMENT,
      roleId: roles['MANAGEMENT'].id,
      isActive: true,
      canReceiveVisits: true,
      departmentId: depts['Production'].id
    },
    {
      employeeId: 'CG-MGT-00',
      name: 'Executive Management',
      email: 'management@cemindo.com',
      password: await hashPassword('management123'),
      phone: '6281234567800',
      role: UserRole.MANAGEMENT,
      roleId: roles['MANAGEMENT'].id,
      isActive: true,
      canReceiveVisits: false,
      departmentId: depts['HRGA'].id
    }
  ];

  const seededUsers = {};
  for (const u of usersData) {
    const userRecord = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        employeeId: u.employeeId,
        name: u.name,
        phone: u.phone,
        role: u.role,
        roleId: u.roleId,
        isActive: u.isActive,
        canReceiveVisits: u.canReceiveVisits,
        departmentId: u.departmentId
      },
      create: u
    });
    seededUsers[u.email] = userRecord;
  }
  console.log('✅ Users/Employees seeded:', Object.keys(seededUsers).length);

  // 4. MANAGEMENT RECIPIENTS (Tahap 8 & 13)
  const mgmtRecipients = [
    { name: 'Ir. Wahyu Hidayat', phone: '6281234567899', title: 'Plant General Manager', department: 'Management', isActive: true },
    { name: 'Hendra Gunawan', phone: '6281234567898', title: 'SHE & Safety Manager', department: 'SHE', isActive: true },
    { name: 'Agus Pratama', phone: '6281234567891', title: 'Danru Security', department: 'Security', isActive: true }
  ];

  for (const m of mgmtRecipients) {
    const existing = await prisma.managementRecipient.findFirst({ where: { phone: m.phone } });
    if (!existing) {
      await prisma.managementRecipient.create({ data: m });
    }
  }
  console.log('✅ Management Recipients synchronized');

  // 5. NOTIFICATION TEMPLATES (10 Templates)
  const templates = [
    {
      code: 'WALK_IN_SUBMIT_PIC',
      name: 'Notifikasi Tamu Walk-In ke PIC',
      category: 'PIC',
      description: 'Dikirim saat tamu walk-in mendaftar di pos security via QR permanen',
      templateBody: `*PT CEMINDO GEMILANG TBK - PLANT BATAM*\n_Pemberitahuan Permintaan Kunjungan Tamu (Walk-In)_\n\nYth. Bapak/Ibu *{{picName}}* ({{department}}),\n\nAda tamu yang ingin berkunjung kepada Anda dengan rincian sbb:\n\n👤 *Nama Tamu:* {{guestName}}\n🏢 *Perusahaan:* {{company}}\n📞 *No. WhatsApp:* {{phone}}\n🎯 *Keperluan:* {{purpose}}\n⏰ *Waktu Registrasi:* {{time}} WIB\n📌 *Kode Kunjungan:* {{visitCode}}\n\n⚠️ *Status:* Menunggu Validasi Security di Pos Masuk.\n_Pesan ini merupakan pemberitahuan awal dan bukan persetujuan masuk pabrik._`
    },
    {
      code: 'CHECK_IN_PIC',
      name: 'Konfirmasi Tamu Check-In ke PIC',
      category: 'PIC',
      description: 'Dikirim ke PIC saat tamu telah divalidasi dan Check-In oleh Security',
      templateBody: `*PT CEMINDO GEMILANG TBK - PLANT BATAM*\n_Tamu Telah Masuk (Checked-In)_\n\nYth. *{{picName}}*,\n\nTamu Anda telah berhasil divalidasi oleh Security Gate dan saat ini memasuki area pabrik:\n\n👤 *Nama:* {{guestName}}\n🏢 *Perusahaan:* {{company}}\n⏰ *Waktu Check-In:* {{checkInTime}} WIB\n🏷️ *No. Badge:* #{{badgeNumber}}\n👮 *Petugas Security:* {{securityName}}\n\nMohon temui tamu di lobi/ruang pertemuan yang telah ditentukan. Patuhi K3 Golden Rules.`
    },
    {
      code: 'CHECK_IN_MANAGEMENT',
      name: 'Notifikasi Check-In ke Management',
      category: 'MANAGEMENT',
      description: 'Dikirim ke seluruh kontak Management saat tamu Check-In',
      templateBody: `*PT CEMINDO GEMILANG TBK - PLANT BATAM*\n_Executive Alert: Tamu Masuk Area Pabrik_\n\nInformasi kedatangan tamu di Plant Batam:\n\n👤 *Tamu:* {{guestName}} ({{company}})\n🏢 *Department Tujuan:* {{department}}\n👤 *PIC:* {{picName}}\n🎯 *Keperluan:* {{purpose}}\n⏰ *Waktu Check-In:* {{checkInTime}} WIB\n🏷️ *Badge #:* {{badgeNumber}}\n\n_Sistem Monitoring Keamanan & K3 Plant Batam_`
    },
    {
      code: 'CHECK_IN_GUEST_PASS',
      name: 'Tiket QR Check-Out ke Tamu',
      category: 'GUEST',
      description: 'Kirim konfirmasi check-in beserta gambar QR Check-out ke WhatsApp tamu',
      isQrImage: true,
      templateBody: `*PT CEMINDO GEMILANG TBK - PLANT BATAM*\n_Selamat Datang di Kawasan Industri Semen Merah Putih_\n\nYth. *{{guestName}}* ({{company}}),\n\nAnda telah terdaftar aktif (CHECKED-IN) di Pos Security Plant Batam.\n\n📌 *No. Registrasi:* {{visitCode}}\n🏷️ *Badge Visitor:* #{{badgeNumber}}\n🏢 *PIC:* {{picName}} ({{department}})\n\n⚠️ *PENTING - KESELAMATAN & KELUAR PABRIK:*\n1. Gunakan APD wajib sesuai area kerja (Helm, Rompi, Safety Shoes).\n2. Dilarang merokok di luar area designated smoking.\n3. Simpan gambar QR Code terlampir untuk proses *CHECK-OUT* di gerbang keluar saat selesai berkunjung.`
    },
    {
      code: 'CHECK_OUT_PIC',
      name: 'Konfirmasi Tamu Check-Out ke PIC',
      category: 'PIC',
      description: 'Dikirim ke PIC saat tamu telah meninggalkan pabrik',
      templateBody: `*PT CEMINDO GEMILANG TBK - PLANT BATAM*\n_Tamu Telah Meninggalkan Pabrik (Checked-Out)_\n\nYth. *{{picName}}*,\n\nTamu Anda atas nama *{{guestName}}* ({{company}}) telah menyelesaikan kunjungan dan resmi Check-Out di pos gerbang pada pk {{checkOutTime}} WIB.\n\nDurasi kunjungan: {{duration}}.\nTerima kasih.`
    },
    {
      code: 'CHECK_OUT_MANAGEMENT',
      name: 'Notifikasi Check-Out ke Management',
      category: 'MANAGEMENT',
      description: 'Laporan kepulangan tamu ke jajaran Management',
      templateBody: `*PT CEMINDO GEMILANG TBK - PLANT BATAM*\n_Executive Alert: Tamu Keluar (Checked-Out)_\n\n👤 *Tamu:* {{guestName}} ({{company}})\n🏢 *Dept:* {{department}} (PIC: {{picName}})\n⏰ *Waktu Keluar:* {{checkOutTime}} WIB\n⏱️ *Total Durasi:* {{duration}}\n👮 *Petugas Gate:* {{securityName}}`
    },
    {
      code: 'CHECK_OUT_GUEST',
      name: 'Ucapan Terima Kasih Check-Out ke Tamu',
      category: 'GUEST',
      description: 'Dikirim ke WhatsApp tamu setelah Check-Out sukses',
      templateBody: `*PT CEMINDO GEMILANG TBK - PLANT BATAM*\n_Terima Kasih Atas Kunjungan Anda_\n\nYth. *{{guestName}}*,\n\nProses Check-Out Anda di Pos Security telah selesai pada pk {{checkOutTime}} WIB. QR Pass kunjungan Anda otomatis dinonaktifkan.\n\nTerima kasih atas kepatuhan Anda terhadap standar Keselamatan & Keamanan di Plant Batam. Semoga selamat sampai tujuan.`
    },
    {
      code: 'PRE_REGISTER_GUEST',
      name: 'Tiket QR Pre-Registration ke Tamu',
      category: 'GUEST',
      description: 'Kirim QR code check-in saat PIC mendaftarkan janji temu',
      isQrImage: true,
      templateBody: `*PT CEMINDO GEMILANG TBK - PLANT BATAM*\n_Undangan Kunjungan Pabrik (Pre-Registration)_\n\nYth. *{{guestName}}*,\n\nBapak/Ibu *{{picName}}* ({{department}}) telah mendaftarkan jadwal kunjungan Anda:\n\n📅 *Tanggal:* {{date}}\n⏰ *Perkiraan Tiba:* {{time}} WIB\n🏢 *Tujuan:* {{department}}\n🎯 *Keperluan:* {{purpose}}\n📌 *Kode Kunjungan:* {{visitCode}}\n\nSilakan tunjukkan QR Code terlampir kepada Petugas Security di pos gerbang Plant Batam saat Anda tiba.`
    },
    {
      code: 'VISIT_REJECTED_GUEST',
      name: 'Pemberitahuan Kunjungan Ditolak',
      category: 'GUEST',
      description: 'Dikirim ke tamu jika permintaan kunjungan tidak disetujui',
      templateBody: `*PT CEMINDO GEMILANG TBK - PLANT BATAM*\n_Pemberitahuan Permohonan Kunjungan_\n\nYth. *{{guestName}}*,\n\nMohon maaf, permohonan kunjungan Anda (Kode: {{visitCode}}) untuk bertemu {{picName}} saat ini *TIDAK DAPAT DISETUJUI*.\n\nAlasan: {{reason}}\n\nSilakan hubungi PIC terkait untuk konfirmasi lebih lanjut. Terima kasih.`
    },
    {
      code: 'VISIT_CANCELLED_GUEST',
      name: 'Pemberitahuan Pembatalan Kunjungan',
      category: 'GUEST',
      description: 'Dikirim ke tamu jika jadwal dibatalkan oleh PIC',
      templateBody: `*PT CEMINDO GEMILANG TBK - PLANT BATAM*\n_Pemberitahuan Pembatalan Kunjungan_\n\nYth. *{{guestName}}*,\n\nJadwal kunjungan Anda ke PT Cemindo Gemilang Plant Batam (Kode: {{visitCode}}) telah dibatalkan oleh PIC ({{picName}}).\n\nAlasan: {{reason}}`
    }
  ];

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { code: t.code },
      update: t,
      create: t
    });
  }
  console.log('✅ Notification Templates seeded: 10');

  // 6. SYSTEM SETTINGS (Tahap 10, 12 & 13)
  const settingsData = [
    { key: 'overstay_hours', value: '8' },
    { key: 'require_ktp_walkin', value: 'true' },
    { key: 'max_active_visitors_daily', value: '500' },
    { key: 'company_name', value: 'PT Cemindo Gemilang Tbk – Plant Batam' },
    { key: 'app_version', value: '2.0.0' }
  ];

  for (const s of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s
    });
  }
  console.log('✅ System Settings seeded');

  // 7. VISITOR BLACKLIST (Tahap 12 & 13)
  const adminUser = seededUsers['admin@cemindo.com'];
  const blacklistSamples = [
    {
      fullName: 'Rudi Irawan',
      identityNumber: '2171012304850001',
      phoneNumber: '6281234500001',
      company: 'CV Logistik Prima Abadi',
      reason: 'Pelanggaran K3 Berat (Golden Rules): Membawa bahan peledak/kembang api ke area silo klinker dan menolak arahan safety officer.',
      isActive: true,
      createdById: adminUser.id
    }
  ];

  for (const b of blacklistSamples) {
    const existing = await prisma.visitorBlacklist.findFirst({ where: { fullName: b.fullName } });
    if (!existing) {
      await prisma.visitorBlacklist.create({ data: b });
    }
  }
  console.log('✅ Visitor Blacklist seeded');

  // 8. SAMPLE VISITORS & VISITS (Memisahkan profil Tamu dari Kunjungan per Tahap 13)
  const sampleVisitorData = [
    {
      fullName: 'Dr. Ir. Hendro Wibowo',
      identityNumber: '2171098765432001',
      phoneNumber: '628117788990',
      email: 'hendro.wibowo@sucofindo.co.id',
      company: 'PT Sucofindo (Persero) Batam',
      notes: 'Auditor Kalibrasi Timbangan & Mutu Semen'
    },
    {
      fullName: 'Bambang Irawan',
      identityNumber: '2171055443322002',
      phoneNumber: '628127766554',
      email: 'bambang@schneider-electric.com',
      company: 'Schneider Electric Batam',
      notes: 'Teknisi PLC Otomasi Packing Plant'
    },
    {
      fullName: 'Dewi Lestari',
      identityNumber: '2171011223344003',
      phoneNumber: '628136655443',
      email: 'dewi.lestari@pt-batam-energi.com',
      company: 'PT Batam Energi Sejahtera',
      notes: 'Vendor Pemeliharaan Trafo Listrik 20kV'
    }
  ];

  const now = new Date();
  const sampleVisitors = [];

  for (const vData of sampleVisitorData) {
    let v = await prisma.visitor.findFirst({ where: { phoneNumber: vData.phoneNumber } });
    if (!v) {
      v = await prisma.visitor.create({ data: vData });
    }
    sampleVisitors.push(v);
  }

  // Create sample visits for today and past days
  const secAgus = seededUsers['security.agus@cemindo.com'];
  const picBudi = seededUsers['pic.production@cemindo.com'];
  const picAhmad = seededUsers['pic.it@cemindo.com'];

  // Visit 1: Active Checked-In right now (On-site)
  const visit1Code = 'VMS-202611-1001';
  let visit1 = await prisma.visit.findUnique({ where: { visitNumber: visit1Code } });
  if (!visit1) {
    const checkInTime = new Date(now.getTime() - 2.5 * 3600 * 1000); // 2.5 hours ago
    visit1 = await prisma.visit.create({
      data: {
        visitorId: sampleVisitors[0].id,
        visitNumber: visit1Code,
        departmentId: depts['Quality Control'].id,
        picUserId: picBudi.id,
        visitType: 'PRE_REGISTERED',
        purpose: 'Audit Tahunan Kalibrasi Lab Uji Kuat Tekan Semen SNI',
        scheduledDate: now,
        expectedArrivalTime: '08:30',
        status: VisitStatus.CHECKED_IN,
        createdById: picBudi.id,
        checkInAt: checkInTime,
        checkInById: secAgus.id,
        visitorBadgeNumber: '042',
        vehicleType: 'CAR',
        vehiclePlateNumber: 'BP 1892 YZ',
        qrTokens: {
          create: [
            {
              token: 'VMS-IN-TEST-TOKEN-001',
              tokenHash: 'hash-checkin-001',
              type: 'CHECK_IN',
              isUsed: true,
              usedAt: checkInTime
            },
            {
              token: 'VMS-OUT-TEST-TOKEN-001',
              tokenHash: 'hash-checkout-001',
              type: 'CHECK_OUT',
              isUsed: false,
              expiresAt: new Date(now.getTime() + 20 * 3600 * 1000)
            }
          ]
        },
        visitLogs: {
          create: [
            { action: 'SUBMITTED', performedById: picBudi.id, notes: 'Pre-registered by host' },
            { action: 'CHECKED_IN', performedById: secAgus.id, notes: 'Checked in at Main Gate by Agus Pratama. Badge #042' }
          ]
        }
      }
    });
  }

  // Visit 2: Completed Checked-Out today
  const visit2Code = 'VMS-202611-1002';
  let visit2 = await prisma.visit.findUnique({ where: { visitNumber: visit2Code } });
  if (!visit2) {
    const inTime = new Date(now.getTime() - 5 * 3600 * 1000);
    const outTime = new Date(now.getTime() - 1 * 3600 * 1000);
    visit2 = await prisma.visit.create({
      data: {
        visitorId: sampleVisitors[1].id,
        visitNumber: visit2Code,
        departmentId: depts['IT'].id,
        picUserId: picAhmad.id,
        visitType: 'WALK_IN',
        purpose: 'Perbaikan Modul SCADA PLC Siemens Silo Semen #2',
        scheduledDate: now,
        expectedArrivalTime: '09:00',
        status: VisitStatus.CHECKED_OUT,
        checkInAt: inTime,
        checkInById: secAgus.id,
        checkOutAt: outTime,
        checkOutById: secAgus.id,
        visitorBadgeNumber: '018',
        vehicleType: 'MOTORCYCLE',
        vehiclePlateNumber: 'BP 4521 AA',
        qrTokens: {
          create: [
            { token: 'VMS-IN-TEST-002', tokenHash: 'hash-in-002', type: 'CHECK_IN', isUsed: true, usedAt: inTime },
            { token: 'VMS-OUT-TEST-002', tokenHash: 'hash-out-002', type: 'CHECK_OUT', isUsed: true, usedAt: outTime }
          ]
        },
        visitLogs: {
          create: [
            { action: 'SUBMITTED', notes: 'Walk-in submission at gate' },
            { action: 'CHECKED_IN', performedById: secAgus.id, notes: 'Validated at Main Gate' },
            { action: 'CHECKED_OUT', performedById: secAgus.id, notes: 'Checked out at Main Gate. Badge returned.' }
          ]
        }
      }
    });
  }

  // Visit 3: Pending Validation at gate
  const visit3Code = 'VMS-202611-1003';
  let visit3 = await prisma.visit.findUnique({ where: { visitNumber: visit3Code } });
  if (!visit3) {
    visit3 = await prisma.visit.create({
      data: {
        visitorId: sampleVisitors[2].id,
        visitNumber: visit3Code,
        departmentId: depts['Maintenance'].id,
        picUserId: picBudi.id,
        visitType: 'WALK_IN',
        purpose: 'Survei Pengukuran Tegangan Gardu Trafo 20kV Plant Batam',
        scheduledDate: now,
        expectedArrivalTime: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: VisitStatus.PENDING_VALIDATION,
        vehicleType: 'CAR',
        vehiclePlateNumber: 'BP 9988 BB',
        qrTokens: {
          create: [
            {
              token: 'VMS-IN-TEST-003',
              tokenHash: 'hash-in-003',
              type: 'CHECK_IN',
              isUsed: false,
              expiresAt: new Date(now.getTime() + 24 * 3600 * 1000)
            }
          ]
        },
        visitLogs: {
          create: [{ action: 'SUBMITTED', notes: 'Walk-in submitted, awaiting Security review' }]
        }
      }
    });
  }

  console.log('✅ Sample Visitors & Visits seeded with relational QrToken and VisitLog');
  console.log('================================================================');
  console.log('🎉 TAHAP 13 SEEDING COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
