import express from 'express';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import prisma from '../db.js';
import { authenticate, allow } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// DEPARTMENTS
// ============================================================

router.get('/departments', authenticate, async (req, res) => {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { users: true, visits: true } } }
  });
  res.json(departments);
});

router.post('/departments', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { name, code } = req.body || {};
    if (!name || !code) return res.status(400).json({ error: 'Nama dan kode departemen wajib diisi' });

    const dept = await prisma.department.create({
      data: { name: name.trim(), code: code.trim().toUpperCase() }
    });
    res.status(201).json(dept);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Nama atau kode departemen sudah dipakai' });
    res.status(500).json({ error: 'Gagal menyimpan departemen' });
  }
});

router.put('/departments/:id', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { name, code, isActive } = req.body || {};
    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(code ? { code: code.trim().toUpperCase() } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {})
      }
    });
    res.json(dept);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Nama atau kode departemen sudah dipakai' });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Departemen tidak ditemukan' });
    res.status(500).json({ error: 'Gagal memperbarui departemen' });
  }
});

router.delete('/departments/:id', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { users: true, visits: true } } }
    });
    if (!department) return res.status(404).json({ error: 'Departemen tidak ditemukan' });
    if (department._count.users > 0 || department._count.visits > 0) {
      return res.status(409).json({
        error: `Departemen masih digunakan oleh ${department._count.users} pengguna dan ${department._count.visits} kunjungan. Pindahkan pengguna atau nonaktifkan departemen.`
      });
    }
    await prisma.department.delete({ where: { id: department.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Master] delete department:', err.message);
    res.status(500).json({ error: 'Gagal menghapus departemen' });
  }
});

// ============================================================
// USERS / PIC
// ============================================================

// Daftar PIC untuk dipilih Security saat validasi (punya nomor WhatsApp)
async function listPics(req, res) {
  const { departmentId } = req.query;
  const pics = await prisma.user.findMany({
    where: {
      isActive: true,
      canReceiveVisits: true,
      role: { in: ['PIC', 'ADMIN', 'MANAGEMENT'] },
      phone: { not: null },
      ...(departmentId ? { departmentId } : {})
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      department: { select: { id: true, name: true } }
    },
    orderBy: { name: 'asc' }
  });
  res.json(pics);
}

// Publik untuk dropdown form tamu; data sensitif tidak disertakan.
router.get('/pics/public', async (req, res) => {
  const { departmentId } = req.query;
  if (!departmentId) return res.json([]);
  const pics = await prisma.user.findMany({
    where: {
      isActive: true,
      canReceiveVisits: true,
      role: { in: ['PIC', 'ADMIN', 'MANAGEMENT'] },
      departmentId
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
  res.json(pics);
});

router.get('/pics', authenticate, listPics);

router.get('/users', authenticate, allow(['ADMIN']), async (req, res) => {
  const users = await prisma.user.findMany({
    include: { department: { select: { id: true, name: true } } },
    orderBy: [{ role: 'asc' }, { name: 'asc' }]
  });
  res.json(users.map(({ password, ...u }) => u));
});

router.post('/users', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { name, username, email, phone, password, role, departmentId, canReceiveVisits } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
    }
    if (role === 'PIC' && !phone) {
      return res.status(400).json({ error: 'PIC wajib memiliki nomor WhatsApp untuk notifikasi' });
    }

    const cleanUsername = username ? String(username).trim().toLowerCase() : null;

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername || null,
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).replace(/\D/g, '') : null,
        password: await bcrypt.hash(String(password), 10),
        role: role || 'PIC',
        departmentId: departmentId || null,
        canReceiveVisits: canReceiveVisits !== false
      },
      include: { department: { select: { id: true, name: true } } }
    });
    const { password: _p, ...safe } = user;
    res.status(201).json(safe);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email atau Username sudah terdaftar' });
    res.status(500).json({ error: 'Gagal menyimpan user' });
  }
});

router.put('/users/:id', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { name, username, email, phone, role, departmentId, isActive, canReceiveVisits, password } = req.body || {};
    const cleanUsername = username !== undefined ? (username ? String(username).trim().toLowerCase() : null) : undefined;
    const data = {
      ...(name ? { name: name.trim() } : {}),
      ...(cleanUsername !== undefined ? { username: cleanUsername } : {}),
      ...(email ? { email: String(email).trim().toLowerCase() } : {}),
      ...(phone !== undefined ? { phone: phone ? String(phone).replace(/\D/g, '') : null } : {}),
      ...(role ? { role } : {}),
      ...(departmentId !== undefined ? { departmentId: departmentId || null } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
      ...(typeof canReceiveVisits === 'boolean' ? { canReceiveVisits } : {})
    };
    if (password) data.password = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      include: { department: { select: { id: true, name: true } } }
    });
    const { password: _p, ...safe } = user;
    res.json(safe);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email atau Username sudah digunakan' });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    res.status(500).json({ error: 'Gagal memperbarui user' });
  }
});

router.delete('/users/:id', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Akun yang sedang digunakan tidak dapat dihapus' });
    }
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    await prisma.$transaction(async (tx) => {
      await tx.visit.updateMany({
        where: { picUserId: target.id },
        data: { picUserId: null, picNameManual: target.name }
      });
      await tx.visit.updateMany({ where: { checkInById: target.id }, data: { checkInById: null } });
      await tx.visit.updateMany({ where: { checkOutById: target.id }, data: { checkOutById: null } });
      await tx.user.delete({ where: { id: target.id } });
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Master] delete user:', err.message);
    res.status(500).json({ error: 'Gagal menghapus pengguna' });
  }
});

// ============================================================
// TEMPLATE & BULK IMPORT: USERS / PIC
// ============================================================

router.get('/users/template', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VMS PT Cemindo Gemilang Tbk';
    const sheet = workbook.addWorksheet('Data Pengguna & PIC');

    // Title Block
    sheet.mergeCells('A1:J1');
    const title = sheet.getCell('A1');
    title.value = 'PT CEMINDO GEMILANG TBK — TEMPLATE IMPORT PENGGUNA & PIC';
    title.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } }; // Merah Cemindo
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:J2');
    const sub = sheet.getCell('A2');
    sub.value = 'Petunjuk: Kolom dengan tanda (*) wajib diisi. Data yang sudah ada (Email/Username cocok) otomatis tertimpa (diperbarui).';
    sub.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF475569' } };
    sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    sub.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    sheet.getRow(3).height = 8;

    // Headers
    const headers = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Nama Lengkap *', key: 'name', width: 26 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Email *', key: 'email', width: 28 },
      { header: 'Role * (PIC/SECURITY/MANAGEMENT/ADMIN)', key: 'role', width: 34 },
      { header: 'Departemen (Kode atau Nama)', key: 'department', width: 26 },
      { header: 'No WhatsApp (08xxxx)', key: 'phone', width: 20 },
      { header: 'Password (Kosongkan bila tdk diubah)', key: 'password', width: 26 },
      { header: 'Status (AKTIF / NONAKTIF)', key: 'status', width: 22 },
      { header: 'Terima Tamu (YA / TIDAK)', key: 'canReceive', width: 22 }
    ];

    const hRow = sheet.getRow(4);
    hRow.height = 25;
    headers.forEach((h, idx) => {
      sheet.getColumn(idx + 1).width = h.width;
      const cell = hRow.getCell(idx + 1);
      cell.value = h.header;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate-800
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      };
    });

    // Contoh baris data awal
    const sampleData = [
      [1, 'Bambang Friadi', 'bambang.friadi', 'bambang.friadi@cemindo.com', 'ADMIN', 'IT', '081363331467', 'cemindo123', 'AKTIF', 'YA'],
      [2, 'Agus Jatmiko Utomo', 'agus.jatmiko', 'agus.jatmiko@cemindo.com', 'PIC', 'Finance', '081270001122', 'cemindo123', 'AKTIF', 'YA'],
      [3, 'Security Pos Utama', 'security.gate', 'security.gate@cemindo.com', 'SECURITY', 'Security', '081270003344', 'cemindo123', 'AKTIF', 'TIDAK'],
      [4, 'Bernardus Fernando', 'bernardus.saputra', 'bernardus.saputra@cemindo.com', 'PIC', 'HRGA', '081363335566', '', 'AKTIF', 'YA']
    ];

    sampleData.forEach((row, rIdx) => {
      const dataRow = sheet.getRow(5 + rIdx);
      dataRow.height = 22;
      row.forEach((val, cIdx) => {
        const cell = dataRow.getCell(cIdx + 1);
        cell.value = val;
        cell.font = { name: 'Arial', size: 9.5 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: cIdx === 0 || cIdx === 4 || cIdx === 8 || cIdx === 9 ? 'center' : 'left'
        };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Template_Master_Pengguna_PIC.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('[Master] generate user template:', err.message);
    res.status(500).json({ error: 'Gagal membuat template Excel' });
  }
});

router.post('/users/import', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { fileData, defaultPassword = 'cemindo123' } = req.body || {};
    if (!fileData) {
      return res.status(400).json({ error: 'File Excel wajib diunggah' });
    }

    const base64Clean = fileData.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return res.status(400).json({ error: 'Worksheet Excel tidak ditemukan' });
    }

    const getVal = (row, col) => {
      const c = row.getCell(col);
      if (!c || c.value === null || c.value === undefined) return '';
      if (typeof c.value === 'object') {
        if (c.value.result !== undefined) return String(c.value.result).trim();
        if (c.value.text !== undefined) return String(c.value.text).trim();
        if (Array.isArray(c.value.richText)) return c.value.richText.map((t) => t.text).join('').trim();
      }
      return String(c.value).trim();
    };

    let headerRowIdx = 4;
    for (let r = 1; r <= 10; r++) {
      const row = sheet.getRow(r);
      const text = `${getVal(row, 1)} ${getVal(row, 2)} ${getVal(row, 3)} ${getVal(row, 4)}`.toLowerCase();
      if (text.includes('email') || text.includes('nama')) {
        headerRowIdx = r;
        break;
      }
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors = [];
    const validRoles = ['PIC', 'SECURITY', 'MANAGEMENT', 'ADMIN'];

    const allDepts = await prisma.department.findMany();
    const deptMap = new Map();
    allDepts.forEach((d) => {
      deptMap.set(d.name.toLowerCase(), d.id);
      deptMap.set(d.code.toLowerCase(), d.id);
    });

    const totalRows = sheet.rowCount;

    for (let r = headerRowIdx + 1; r <= totalRows; r++) {
      const row = sheet.getRow(r);
      const name = getVal(row, 2);
      const usernameRaw = getVal(row, 3);
      const emailRaw = getVal(row, 4);
      const roleRaw = getVal(row, 5).toUpperCase();
      const deptRaw = getVal(row, 6);
      const phoneRaw = getVal(row, 7);
      const passRaw = getVal(row, 8);
      const statusRaw = getVal(row, 9).toUpperCase();
      const canReceiveRaw = getVal(row, 10).toUpperCase();

      if (!name && !emailRaw && !usernameRaw) continue;

      if (!name || !emailRaw) {
        errors.push(`Baris ${r}: Nama dan Email wajib diisi`);
        continue;
      }

      const email = emailRaw.toLowerCase();
      const username = usernameRaw ? usernameRaw.toLowerCase().replace(/[^a-z0-9._-]/g, '') : null;
      const phone = phoneRaw ? phoneRaw.replace(/\D/g, '') : null;
      const role = validRoles.includes(roleRaw) ? roleRaw : 'PIC';
      const isActive = statusRaw === 'NONAKTIF' || statusRaw === 'TIDAK' || statusRaw === 'FALSE' ? false : true;
      const canReceiveVisits = canReceiveRaw === 'TIDAK' || canReceiveRaw === 'FALSE' ? false : true;

      let departmentId = null;
      if (deptRaw) {
        const key = deptRaw.toLowerCase();
        if (deptMap.has(key)) {
          departmentId = deptMap.get(key);
        } else {
          try {
            const newCode = deptRaw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'DEPT';
            let uniqueCode = newCode;
            let counter = 1;
            while (deptMap.has(uniqueCode.toLowerCase())) {
              uniqueCode = `${newCode}${counter++}`;
            }
            const createdDept = await prisma.department.create({
              data: { name: deptRaw.trim(), code: uniqueCode }
            });
            departmentId = createdDept.id;
            deptMap.set(createdDept.name.toLowerCase(), createdDept.id);
            deptMap.set(createdDept.code.toLowerCase(), createdDept.id);
          } catch (e) {
            const f = await prisma.department.findFirst({
              where: { OR: [{ name: deptRaw.trim() }, { code: deptRaw.trim().toUpperCase() }] }
            });
            if (f) departmentId = f.id;
          }
        }
      }

      try {
        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              { email },
              ...(username ? [{ username }] : [])
            ]
          }
        });

        if (existing) {
          // UPDATE / TIMPA DATA LAMA
          const updateData = {
            name: name.trim(),
            email,
            phone: phone || existing.phone,
            role,
            departmentId: departmentId !== null ? departmentId : existing.departmentId,
            isActive,
            canReceiveVisits
          };

          if (username) updateData.username = username;
          if (passRaw && passRaw.trim().length >= 4) {
            updateData.password = await bcrypt.hash(passRaw.trim(), 10);
          }

          await prisma.user.update({
            where: { id: existing.id },
            data: updateData
          });
          updatedCount++;
        } else {
          // CREATE DATA BARU
          const initialPass = passRaw && passRaw.trim().length >= 4 ? passRaw.trim() : defaultPassword;
          await prisma.user.create({
            data: {
              name: name.trim(),
              username: username || null,
              email,
              phone: phone || null,
              password: await bcrypt.hash(initialPass, 10),
              role,
              departmentId,
              isActive,
              canReceiveVisits
            }
          });
          createdCount++;
        }
      } catch (rowErr) {
        console.error(`[Master Import] Baris ${r} error:`, rowErr.message);
        errors.push(`Baris ${r} (${email}): ${rowErr.message.includes('Unique constraint') ? 'Email atau Username sudah dipakai user lain' : rowErr.message}`);
      }
    }

    res.json({
      ok: true,
      total: createdCount + updatedCount,
      created: createdCount,
      updated: updatedCount,
      errors
    });
  } catch (err) {
    console.error('[Master] import users:', err.message);
    res.status(500).json({ error: 'Gagal memproses file import: ' + err.message });
  }
});

// ============================================================
// TEMPLATE & BULK IMPORT: DEPARTMENTS
// ============================================================

router.get('/departments/template', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VMS PT Cemindo Gemilang Tbk';
    const sheet = workbook.addWorksheet('Data Departemen');

    sheet.mergeCells('A1:C1');
    const title = sheet.getCell('A1');
    title.value = 'PT CEMINDO GEMILANG TBK — TEMPLATE IMPORT DEPARTEMEN';
    title.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 28;

    const headers = [
      { header: 'No', width: 6 },
      { header: 'Nama Departemen *', width: 30 },
      { header: 'Kode Departemen *', width: 20 },
      { header: 'Status (AKTIF / NONAKTIF)', width: 24 }
    ];

    const hRow = sheet.getRow(3);
    hRow.height = 25;
    headers.forEach((h, idx) => {
      sheet.getColumn(idx + 1).width = h.width;
      const cell = hRow.getCell(idx + 1);
      cell.value = h.header;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const samples = [
      [1, 'Information Technology', 'IT', 'AKTIF'],
      [2, 'Human Resources & General Affairs', 'HRGA', 'AKTIF'],
      [3, 'Finance & Accounting', 'FIN', 'AKTIF'],
      [4, 'Production & Operation', 'PROD', 'AKTIF']
    ];

    samples.forEach((row, rIdx) => {
      const dataRow = sheet.getRow(4 + rIdx);
      dataRow.height = 22;
      row.forEach((val, cIdx) => {
        const cell = dataRow.getCell(cIdx + 1);
        cell.value = val;
        cell.font = { name: 'Arial', size: 9.5 };
        cell.alignment = { vertical: 'middle', horizontal: cIdx === 0 || cIdx === 2 || cIdx === 3 ? 'center' : 'left' };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Template_Master_Departemen.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('[Master] generate dept template:', err.message);
    res.status(500).json({ error: 'Gagal membuat template Excel' });
  }
});

router.post('/departments/import', authenticate, allow(['ADMIN']), async (req, res) => {
  try {
    const { fileData } = req.body || {};
    if (!fileData) {
      return res.status(400).json({ error: 'File Excel wajib diunggah' });
    }

    const base64Clean = fileData.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) return res.status(400).json({ error: 'Worksheet tidak ditemukan' });

    const getVal = (row, col) => {
      const c = row.getCell(col);
      if (!c || c.value === null || c.value === undefined) return '';
      if (typeof c.value === 'object') {
        if (c.value.result !== undefined) return String(c.value.result).trim();
        if (c.value.text !== undefined) return String(c.value.text).trim();
      }
      return String(c.value).trim();
    };

    let createdCount = 0;
    let updatedCount = 0;
    const errors = [];

    for (let r = 4; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      const name = getVal(row, 2);
      const code = getVal(row, 3).toUpperCase();
      const statusRaw = getVal(row, 4).toUpperCase();

      if (!name && !code) continue;
      if (!name || !code) {
        errors.push(`Baris ${r}: Nama dan Kode departemen wajib diisi`);
        continue;
      }

      const isActive = statusRaw === 'NONAKTIF' || statusRaw === 'TIDAK' ? false : true;

      try {
        const existing = await prisma.department.findFirst({
          where: {
            OR: [{ name: name.trim() }, { code: code.trim() }]
          }
        });

        if (existing) {
          await prisma.department.update({
            where: { id: existing.id },
            data: { name: name.trim(), code: code.trim(), isActive }
          });
          updatedCount++;
        } else {
          await prisma.department.create({
            data: { name: name.trim(), code: code.trim(), isActive }
          });
          createdCount++;
        }
      } catch (rowErr) {
        errors.push(`Baris ${r} (${name}): ${rowErr.message}`);
      }
    }

    res.json({
      ok: true,
      total: createdCount + updatedCount,
      created: createdCount,
      updated: updatedCount,
      errors
    });
  } catch (err) {
    console.error('[Master] import depts:', err.message);
    res.status(500).json({ error: 'Gagal memproses file import: ' + err.message });
  }
});

export default router;
