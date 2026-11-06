const APP_URL = process.env.PUBLIC_APP_URL || 'http://localhost';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

/**
 * 1. Tamu walk-in: barcode awal (check-in) untuk ditunjukkan ke security.
 */
export function guestWalkInPass({ name, visitNumber, department, passUrl }) {
  return `*PENDAFTARAN KUNJUNGAN DITERIMA*

Halo ${name},

Pendaftaran kunjungan Anda ke *PT Cemindo Gemilang Tbk - Plant Batam* telah kami terima.

No. Kunjungan : ${visitNumber}
Departemen    : ${department}

*Tunjukkan barcode pada tautan berikut kepada petugas Security di pos gerbang untuk validasi:*
${passUrl}

Barcode ini hanya dapat digunakan satu kali. Mohon jangan membagikan tautan ini kepada orang lain.

_Pesan otomatis - Visitor Management System_`;
}

/**
 * 2. Tamu pre-registered: barcode dikirim saat PIC membuat janji temu.
 */
export function guestPreRegisteredPass({ name, visitNumber, department, picName, date, time, passUrl }) {
  return `*UNDANGAN KUNJUNGAN - PT CEMINDO GEMILANG TBK*

Halo ${name},

Anda dijadwalkan berkunjung ke *Plant Batam*.

No. Kunjungan : ${visitNumber}
Hari/Tanggal  : ${fmtDate(date)}
Perkiraan Jam : ${time || '-'}
Departemen    : ${department}
PIC / Tuan Rumah : ${picName || '-'}

*Tunjukkan barcode pada tautan berikut kepada petugas Security saat tiba:*
${passUrl}

Barcode hanya dapat digunakan satu kali.

_Pesan otomatis - Visitor Management System_`;
}

/**
 * 3. Tamu sudah check-in: barcode baru untuk check-out.
 */
export function guestCheckOutPass({ name, visitNumber, checkInAt, passUrl }) {
  return `*ANDA TELAH CHECK-IN*

Halo ${name},

Kedatangan Anda telah divalidasi oleh petugas Security.
Waktu masuk : ${fmtTime(checkInAt)} WIB

*Simpan barcode berikut. Barcode ini WAJIB ditunjukkan saat Anda keluar dari area pabrik:*
${passUrl}

Pastikan Anda melakukan check-out sebelum meninggalkan kawasan.

_Pesan otomatis - Visitor Management System_`;
}

/**
 * 4. Tamu sudah check-out (konfirmasi).
 */
export function guestCheckedOut({ name, visitNumber, checkInAt, checkOutAt }) {
  const mins = Math.max(0, Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000));
  const dur = `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
  return `*CHECK-OUT BERHASIL*

Halo ${name},

Kunjungan Anda (${visitNumber}) telah selesai.
Masuk  : ${fmtTime(checkInAt)} WIB
Keluar : ${fmtTime(checkOutAt)} WIB
Durasi : ${dur}

Terima kasih atas kunjungan Anda ke PT Cemindo Gemilang Tbk - Plant Batam.

_Pesan otomatis - Visitor Management System_`;
}

/**
 * 5. PIC / tuan rumah: tamunya sudah masuk.
 */
export function picGuestArrived({ picName, guestName, company, department, visitNumber, checkInAt, badge }) {
  return `*TAMU ANDA TELAH TIBA*

Halo ${picName},

Tamu berikut telah check-in dan saat ini berada di area pabrik:

Nama       : ${guestName}
Perusahaan : ${company || '-'}
Departemen : ${department}
No. Kunjungan : ${visitNumber}
Jam Masuk  : ${fmtTime(checkInAt)} WIB
No. Badge  : ${badge || '-'}

Mohon segera menemui tamu Anda di area resepsionis / lobi.

_Pesan otomatis - Visitor Management System_`;
}

/**
 * 6. PIC / tuan rumah: tamunya sudah keluar.
 */
export function picGuestDeparted({ picName, guestName, company, visitNumber, checkInAt, checkOutAt }) {
  return `*TAMU ANDA TELAH CHECK-OUT*

Halo ${picName},

Kunjungan berikut telah selesai:

Nama       : ${guestName}
Perusahaan : ${company || '-'}
No. Kunjungan : ${visitNumber}
Masuk  : ${fmtTime(checkInAt)} WIB
Keluar : ${fmtTime(checkOutAt)} WIB

_Pesan otomatis - Visitor Management System_`;
}

/**
 * 7. Management: ringkasan tamu masuk.
 */
export function managementArrival({ guestName, company, department, picName, visitNumber, checkInAt, count }) {
  return `*LAPORAN TAMU MASUK*

Nama       : ${guestName}
Perusahaan : ${company || '-'}
Departemen : ${department}
PIC        : ${picName || '-'}
No. Kunjungan : ${visitNumber}
Jumlah     : ${count || 1} orang
Jam Masuk  : ${fmtTime(checkInAt)} WIB

_Pesan otomatis - Visitor Management System_`;
}

/**
 * 8. Management: ringkasan tamu keluar.
 */
export function managementDeparture({ guestName, company, department, picName, visitNumber, checkInAt, checkOutAt }) {
  const mins = Math.max(0, Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000));
  return `*LAPORAN TAMU KELUAR*

Nama       : ${guestName}
Perusahaan : ${company || '-'}
Departemen : ${department}
PIC        : ${picName || '-'}
No. Kunjungan : ${visitNumber}
Masuk  : ${fmtTime(checkInAt)} WIB
Keluar : ${fmtTime(checkOutAt)} WIB
Durasi : ${Math.floor(mins / 60)} jam ${mins % 60} menit

_Pesan otomatis - Visitor Management System_`;
}

export { APP_URL };
