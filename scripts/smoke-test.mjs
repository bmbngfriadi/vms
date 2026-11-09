/**
 * Smoke test end-to-end VMS.
 * Jalankan: node scripts/smoke-test.mjs [baseUrl]
 * Default baseUrl: http://localhost/api
 */

const BASE = process.argv[2] || 'http://localhost/api';

let pass = 0;
let fail = 0;

function ok(name, cond, extra = '') {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

const section = (t) => console.log(`\n${t}`);

async function main() {
  console.log(`Smoke test terhadap ${BASE}\n`);

  section('1. Kesehatan & autentikasi');
  const health = await call('GET', '/health');
  ok('GET /health', health.status === 200 && health.data.status === 'ok');

  const badLogin = await call('POST', '/auth/login', {
    body: { email: 'admin@cemindo.com', password: 'salah' }
  });
  ok('Login password salah ditolak', badLogin.status === 401);

  const admin = await call('POST', '/auth/login', {
    body: { email: 'admin@cemindo.com', password: 'admin123' }
  });
  ok('Login admin', admin.status === 200 && !!admin.data.token, JSON.stringify(admin.data).slice(0, 120));
  const adminToken = admin.data.token;

  const sec = await call('POST', '/auth/login', {
    body: { email: 'security.agus@cemindo.com', password: 'security123' }
  });
  ok('Login security', sec.status === 200);
  const secToken = sec.data.token;

  const pic = await call('POST', '/auth/login', {
    body: { email: 'pic.production@cemindo.com', password: 'pic123' }
  });
  ok('Login PIC', pic.status === 200);
  const picToken = pic.data.token;
  const picId = pic.data.user.id;

  const unauth = await call('GET', '/visits');
  ok('Akses tanpa token ditolak', unauth.status === 401);

  const picForbidden = await call('POST', '/visits/scan', { token: picToken, body: { code: 'x' } });
  ok('PIC tidak boleh scan', picForbidden.status === 403);

  section('2. Master data publik');
  const depts = await call('GET', '/public/departments');
  ok('Daftar departemen publik', depts.status === 200 && depts.data.length === 9, `n=${depts.data?.length}`);
  const dept = depts.data.find((d) => d.code === 'PROD') || depts.data[0];

  section('3. Alur WALK-IN: daftar → barcode → scan → check-in');
  const reg = await call('POST', '/public/register', {
    body: {
      fullName: 'Tamu Uji Walk In',
      phone: '081298765432',
      company: 'PT Mitra Uji',
      identityNumber: '2171012345670001',
      departmentId: dept.id,
      picUserId: picId,
      purpose: 'Uji fungsi sistem',
      numberOfVisitors: 2,
      vehiclePlate: 'bp 1234 xy'
    }
  });
  ok('Registrasi walk-in', reg.status === 201, JSON.stringify(reg.data).slice(0, 200));
  ok('Nomor kunjungan terbentuk', /^VMS-\d{8}-\d{4}$/.test(reg.data.visitNumber || ''), reg.data.visitNumber);
  ok('Barcode PNG terbentuk', (reg.data.qrDataUrl || '').startsWith('data:image/png;base64,'));
  ok('Status awal menunggu validasi', reg.data.visit.status === 'WAITING_VALIDATION');
  ok('Nomor kendaraan dinormalisasi', reg.data.visit.vehiclePlate === 'BP 1234 XY', reg.data.visit.vehiclePlate);
  const walkInId = reg.data.visit.id;
  const walkInToken = reg.data.passToken;

  const badPhone = await call('POST', '/public/register', {
    body: {
      fullName: 'X',
      phone: '123',
      departmentId: dept.id,
      picUserId: picId,
      purpose: 'Z'
    }
  });
  ok('Nomor WA tidak valid ditolak', badPhone.status === 400);

  const pass1 = await call('GET', `/public/pass/${walkInToken}`);
  ok('Halaman pass publik', pass1.status === 200 && pass1.data.action === 'CHECK_IN');
  ok('Pass tidak membocorkan NIK', pass1.data.identityNumber === undefined);
  ok('Pass tidak membocorkan nomor HP', pass1.data.phone === undefined);

  const badToken = await call('GET', '/public/pass/token-ngawur-123');
  ok('Token pass salah ditolak', badToken.status === 404);

  const scan1 = await call('POST', '/visits/scan', { token: secToken, body: { code: walkInToken } });
  ok('Security scan barcode', scan1.status === 200, JSON.stringify(scan1.data).slice(0, 160));
  ok('Aksi terdeteksi CHECK_IN', scan1.data.action === 'CHECK_IN');
  ok('Security melihat nomor tamu', !!scan1.data.visit.phone);

  const scanAsUrl = await call('POST', '/visits/scan', {
    token: secToken,
    body: { code: `http://localhost/pass/${walkInToken}` }
  });
  ok('Scan menerima URL penuh', scanAsUrl.status === 200 && scanAsUrl.data.visit.id === walkInId);

  const scanByNumber = await call('POST', '/visits/scan', {
    token: secToken,
    body: { code: reg.data.visitNumber }
  });
  ok('Scan menerima nomor kunjungan manual', scanByNumber.status === 200);

  const pics = await call('GET', `/master/pics?departmentId=${dept.id}`, { token: secToken });
  ok('Daftar PIC per departemen', pics.status === 200 && pics.data.length > 0);

  ok('PIC walk-in sudah dipilih dari form', scan1.data.visit.picUser?.id === picId);

  const checkIn = await call('POST', `/visits/${walkInId}/check-in`, {
    token: secToken,
    body: { badgeNumber: 'B-0912' }
  });
  ok('Check-in berhasil', checkIn.status === 200, JSON.stringify(checkIn.data).slice(0, 200));
  ok('Status menjadi CHECKED_IN', checkIn.data.status === 'CHECKED_IN');
  ok('PIC tercatat', checkIn.data.picUser?.id === picId);
  ok('Badge tercatat', checkIn.data.badgeNumber === 'B-0912');
  ok('Barcode check-out diterbitkan', !!checkIn.data.guestPassUrl);

  const doubleCheckIn = await call('POST', `/visits/${walkInId}/check-in`, {
    token: secToken,
    body: { picUserId: picId }
  });
  ok('Check-in ganda ditolak', doubleCheckIn.status === 409);

  const oldTokenScan = await call('POST', '/visits/scan', { token: secToken, body: { code: walkInToken } });
  ok(
    'Barcode check-in lama diberi peringatan',
    oldTokenScan.data.warnings?.length > 0,
    JSON.stringify(oldTokenScan.data.warnings)
  );
  ok('Barcode lama tidak bisa check-in lagi', oldTokenScan.data.action === 'CHECK_OUT');

  section('4. Alur CHECK-OUT');
  const outToken = checkIn.data.guestPassUrl.split('/').pop();
  const pass2 = await call('GET', `/public/pass/${outToken}`);
  ok('Pass menampilkan barcode check-out', pass2.status === 200 && pass2.data.action === 'CHECK_OUT');

  const checkOut = await call('POST', `/visits/${walkInId}/check-out`, { token: secToken });
  ok('Check-out berhasil', checkOut.status === 200);
  ok('Status menjadi CHECKED_OUT', checkOut.data.status === 'CHECKED_OUT');
  ok('Durasi terhitung', typeof checkOut.data.durationMinutes === 'number');

  const doubleOut = await call('POST', `/visits/${walkInId}/check-out`, { token: secToken });
  ok('Check-out ganda ditolak', doubleOut.status === 409);

  const pass3 = await call('GET', `/public/pass/${outToken}`);
  ok('Pass selesai tanpa barcode aktif', pass3.status === 200 && pass3.data.qrDataUrl === null);

  section('5. Alur PRE-REGISTERED (janji temu oleh PIC)');
  const pre = await call('POST', '/visits', {
    token: picToken,
    body: {
      fullName: 'Tamu Janji Temu',
      phone: '081211112222',
      company: 'PT Vendor Janji',
      departmentId: dept.id,
      purpose: 'Meeting teknis',
      scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      expectedTime: '10:30',
      numberOfVisitors: 1
    }
  });
  ok('PIC membuat janji temu', pre.status === 201, JSON.stringify(pre.data).slice(0, 200));
  ok('Status APPROVED', pre.data.status === 'APPROVED');
  ok('PIC otomatis terisi', pre.data.picUser?.id === picId);

  const preToken = pre.data.passUrl.split('/').pop();
  const preScan = await call('POST', '/visits/scan', { token: secToken, body: { code: preToken } });
  ok('Scan barcode janji temu', preScan.status === 200 && preScan.data.action === 'CHECK_IN');

  const preIn = await call('POST', `/visits/${pre.data.id}/check-in`, {
    token: secToken,
    body: { picUserId: picId, badgeNumber: 'B-0913' }
  });
  ok('Check-in janji temu', preIn.status === 200 && preIn.data.status === 'CHECKED_IN');

  const preOut = await call('POST', `/visits/${pre.data.id}/check-out`, { token: secToken });
  ok('Check-out janji temu', preOut.status === 200 && preOut.data.status === 'CHECKED_OUT');

  section('6. Penolakan & pembatalan');
  const reg2 = await call('POST', '/public/register', {
    body: {
      fullName: 'Tamu Ditolak',
      phone: '081233334444',
      departmentId: dept.id,
      picUserId: picId,
      purpose: 'Uji tolak'
    }
  });
  const reject = await call('POST', `/visits/${reg2.data.visit.id}/reject`, {
    token: secToken,
    body: { reason: 'Tidak ada keperluan jelas' }
  });
  ok('Security menolak tamu', reject.status === 200 && reject.data.status === 'REJECTED');

  const scanRejected = await call('POST', '/visits/scan', {
    token: secToken,
    body: { code: reg2.data.passToken }
  });
  ok('Tamu ditolak tidak bisa masuk', scanRejected.data.action === 'BLOCKED');

  const cancel = await call('POST', `/visits/${pre.data.id}/cancel`, {
    token: picToken,
    body: { reason: 'Uji batal' }
  });
  ok('Kunjungan selesai tidak bisa dibatalkan', cancel.status === 409);

  section('7. Otorisasi data PIC');
  const picList = await call('GET', '/visits', { token: picToken });
  ok(
    'PIC hanya melihat kunjungannya',
    picList.status === 200 && picList.data.data.every((v) => v.picUser?.id === picId || v.picUserId === picId)
  );

  const secList = await call('GET', '/visits', { token: secToken });
  ok('Security melihat semua kunjungan', secList.status === 200 && secList.data.total >= 3);

  section('8. Dashboard, laporan, WhatsApp');
  const stats = await call('GET', '/visits/stats/summary', { token: adminToken });
  ok('Statistik dashboard', stats.status === 200 && typeof stats.data.todayTotal === 'number');
  ok('Tren 7 hari tersedia', Array.isArray(stats.data.trend));

  const csv = await fetch(`${BASE}/visits/export/csv`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const csvText = await csv.text();
  ok('Export CSV', csv.status === 200 && csvText.includes('No. Kunjungan'), `len=${csvText.length}`);

  const waStatus = await call('GET', '/wa/status', { token: adminToken });
  ok('Status WhatsApp dapat dibaca', waStatus.status === 200 && !!waStatus.data.status, waStatus.data.status);

  const logs = await call('GET', '/wa/logs', { token: adminToken });
  ok('Log notifikasi tercatat', logs.status === 200 && logs.data.length > 0, `n=${logs.data?.length}`);

  const types = [...new Set((logs.data || []).map((l) => l.type))];
  ok(
    'Semua jenis notifikasi terpicu',
    ['GUEST_WALKIN_PASS', 'GUEST_CHECKIN_PASS', 'PIC_ARRIVAL', 'MGMT_ARRIVAL', 'GUEST_CHECKOUT', 'PIC_DEPARTURE', 'MGMT_DEPARTURE'].every(
      (t) => types.includes(t)
    ),
    types.join(',')
  );

  const recipients = await call('GET', '/wa/recipients', { token: adminToken });
  ok('Penerima management tersedia', recipients.status === 200 && recipients.data.length >= 1);

  section('9. Master data admin');
  const users = await call('GET', '/master/users', { token: adminToken });
  ok('Daftar user', users.status === 200 && users.data.length >= 9);
  ok('Password tidak bocor di API', users.data.every((u) => u.password === undefined));

  const picUsers = await call('GET', '/master/users', { token: picToken });
  ok('PIC tidak boleh akses master user', picUsers.status === 403);

  console.log(`\n${'='.repeat(52)}`);
  console.log(`HASIL: ${pass} lulus, ${fail} gagal`);
  console.log('='.repeat(52));
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('\nSmoke test error:', e.message);
  process.exit(1);
});
