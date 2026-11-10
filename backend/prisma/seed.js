import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  ['Human Resources & General Affairs', 'HRGA'],
  ['Information Technology', 'IT'],
  ['Production', 'PROD'],
  ['Maintenance', 'MAINT'],
  ['Quality Control', 'QC'],
  ['Logistic', 'LOG'],
  ['Finance', 'FIN'],
  ['Procurement', 'PROC'],
  ['Safety, Health & Environment', 'SHE']
];

const USERS = [
  { name: 'Administrator Sistem', username: 'admin', email: 'admin@cemindo.com', password: 'admin123', role: 'ADMIN', dept: 'IT', phone: '6281200000001' },
  { name: 'Agus Pratama', username: 'security.agus', email: 'security.agus@cemindo.com', password: 'security123', role: 'SECURITY', dept: 'HRGA', phone: '6281200000002' },
  { name: 'Bambang Sugiarto', username: 'security.bambang', email: 'security.bambang@cemindo.com', password: 'security123', role: 'SECURITY', dept: 'HRGA', phone: '6281200000003' },
  { name: 'Budi Santoso', username: 'pic.production', email: 'pic.production@cemindo.com', password: 'pic123', role: 'PIC', dept: 'PROD', phone: '6281200000011' },
  { name: 'Ahmad Fauzi', username: 'pic.it', email: 'pic.it@cemindo.com', password: 'pic123', role: 'PIC', dept: 'IT', phone: '6281200000012' },
  { name: 'Siti Rahmawati', username: 'pic.hrga', email: 'pic.hrga@cemindo.com', password: 'pic123', role: 'PIC', dept: 'HRGA', phone: '6281200000013' },
  { name: 'Hendra Gunawan', username: 'pic.she', email: 'pic.she@cemindo.com', password: 'pic123', role: 'PIC', dept: 'SHE', phone: '6281200000014' },
  { name: 'Rina Kartika', username: 'pic.logistic', email: 'pic.logistic@cemindo.com', password: 'pic123', role: 'PIC', dept: 'LOG', phone: '6281200000015' },
  { name: 'Ir. Wahyu Hidayat', username: 'management', email: 'management@cemindo.com', password: 'management123', role: 'MANAGEMENT', dept: null, phone: '6281200000021' }
];

async function main() {
  console.log('Seeding master data...');

  const deptIds = {};
  for (const [name, code] of DEPARTMENTS) {
    const dept = await prisma.department.upsert({
      where: { code },
      update: { name },
      create: { name, code }
    });
    deptIds[code] = dept.id;
  }

  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        username: u.username,
        role: u.role,
        phone: u.phone,
        departmentId: u.dept ? deptIds[u.dept] : null,
        isActive: true
      },
      create: {
        name: u.name,
        username: u.username,
        email: u.email,
        phone: u.phone,
        password: await bcrypt.hash(u.password, 10),
        role: u.role,
        departmentId: u.dept ? deptIds[u.dept] : null
      }
    });
  }

  const existingRecipients = await prisma.managementRecipient.count();
  if (existingRecipients === 0) {
    await prisma.managementRecipient.createMany({
      data: [
        { name: 'Ir. Wahyu Hidayat', phone: '6281200000021', title: 'Plant General Manager' },
        { name: 'Dewi Anggraini', phone: '6281200000022', title: 'HRGA Manager' }
      ]
    });
  }

  await prisma.setting.upsert({
    where: { key: 'plant_name' },
    update: {},
    create: { key: 'plant_name', value: 'PT Cemindo Gemilang Tbk - Plant Batam' }
  });

  console.log(`Selesai. ${DEPARTMENTS.length} departemen, ${USERS.length} user.`);
  console.log('Akun awal: admin@cemindo.com / admin123 — SEGERA GANTI setelah login pertama.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
