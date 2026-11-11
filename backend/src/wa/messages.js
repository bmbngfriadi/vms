const APP_URL = process.env.PUBLIC_APP_URL || 'http://localhost';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

// Panjang divider 17 karakter pas untuk bubble chat WhatsApp di mobile tanpa wrap/offside
const DIVIDER = '─────────────────';
const FOOTER = '_Pesan Otomatis, Visitor Management System_';

/**
 * 1. Tamu walk-in: barcode awal (check-in) untuk ditunjukkan ke security.
 */
export function guestWalkInPass({ name, company, visitNumber, department, purpose }) {
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🟢 *PENDAFTARAN KUNJUNGAN (WALK-IN)*
${DIVIDER}

Halo, *${name}*!
Pendaftaran kedatangan Anda di kawasan industri *PT Cemindo Gemilang Tbk - Plant Batam* telah berhasil.

📋 *RINCIAN KUNJUNGAN:*
• No. Registrasi: *${visitNumber}*
• Nama Tamu: *${name}*
• Instansi: ${company || 'Pribadi / Perorangan'}
• Departemen: ${department}
• Keperluan: ${purpose || '-'}

📌 *PANDUAN POS SECURITY:*
1. Tunjukkan *gambar QR Code terlampir* kepada petugas Security di Pos Utama.
2. Petugas akan memindai QR Code dan menyerahkan *Badge Tamu*.
3. Wajib mematuhi standar Keselamatan & Kesehatan Kerja (K3) selama berada di kawasan pabrik.

⚠️ _QR Code ini bersifat unik dan hanya berlaku untuk 1 kali validasi masuk._
${DIVIDER}
${FOOTER}`;
}

/**
 * 2. Tamu pre-registered: barcode dikirim saat PIC membuat janji temu.
 */
export function guestPreRegisteredPass({ name, company, visitNumber, department, picName, purpose, date, time }) {
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
📅 *UNDANGAN KUNJUNGAN RESMI*
${DIVIDER}

Halo, *${name}*!
Anda telah dijadwalkan berkunjung ke kawasan industri *PT Cemindo Gemilang Tbk - Plant Batam*.

📋 *RINCIAN JADWAL:*
• No. Kunjungan: *${visitNumber}*
• Hari, Tanggal: ${fmtDate(date)}
• Waktu Rencana: ${time || '09:00'} WIB
• Departemen: ${department}
• PIC Dituju: ${picName || '-'}
• Keperluan: ${purpose || '-'}
• Instansi: ${company || 'Pribadi / Perorangan'}

📌 *PETUNJUK KEDATANGAN:*
1. Tunjukkan *gambar QR Code terlampir* kepada petugas Security saat tiba di gerbang pabrik.
2. Harap hadir tepat waktu sesuai perkiraan jadwal kunjungan.
3. Gunakan pakaian kerja rapi, sepatu tertutup, dan patuhi standar K3 pabrik.

${DIVIDER}
${FOOTER}`;
}

/**
 * 3. Tamu sudah check-in: barcode baru untuk check-out.
 */
export function guestCheckOutPass({ name, visitNumber, checkInAt, purpose }) {
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🟢 *VALIDASI CHECK-IN BERHASIL (MASUK)*
${DIVIDER}

Halo, *${name}*!
Kedatangan Anda telah berhasil divalidasi oleh petugas Security. Selamat beraktivitas di area pabrik PT Cemindo Gemilang Tbk.

📋 *STATUS KUNJUNGAN:*
• Status: 🟢 *Di Dalam Pabrik (Check-In)*
• No. Kunjungan: *${visitNumber}*
• Waktu Masuk: *${fmtTime(checkInAt)} WIB*
• Keperluan: ${purpose || '-'}
• Lokasi: Kawasan Pabrik Plant Batam

⚠️ *PANDUAN KELUAR (CHECK-OUT):*
1. *Simpan gambar QR Code terlampir ini dengan baik.*
2. Barcode ini *WAJIB* ditunjukkan kepada petugas Security saat Anda akan keluar meninggalkan kawasan pabrik.
3. Kembalikan Badge Tamu kepada petugas Security sebelum meninggalkan gerbang.

${DIVIDER}
${FOOTER}`;
}

/**
 * 4. Tamu sudah check-out (konfirmasi).
 */
export function guestCheckedOut({ name, visitNumber, checkInAt, checkOutAt, purpose }) {
  const mins = Math.max(0, Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000));
  const dur = `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🔴 *CHECK-OUT SELESAI (KELUAR)*
${DIVIDER}

Halo, *${name}*!
Kunjungan Anda di *PT Cemindo Gemilang Tbk - Plant Batam* telah resmi selesai.

📋 *RINGKASAN KUNJUNGAN:*
• Status: 🔴 *Telah Check-Out (Keluar)*
• No. Kunjungan: *${visitNumber}*
• Keperluan: ${purpose || '-'}
• Waktu Masuk: ${fmtTime(checkInAt)} WIB
• Waktu Keluar: *${fmtTime(checkOutAt)} WIB*
• Total Durasi: *${dur}*

🙏 *Terima kasih atas kunjungan Anda.*
Semoga urusan dan pertemuan Anda berjalan lancar. Utamakan selalu keselamatan dalam perjalanan.

${DIVIDER}
${FOOTER}`;
}

/**
 * 5. PIC: tamunya sudah masuk.
 */
export function picGuestArrived({ picName, guestName, company, department, visitNumber, checkInAt, badge, purpose }) {
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🟢 *NOTIFIKASI: TAMU TELAH TIBA (MASUK)*
${DIVIDER}

Halo, *${picName}*!
Tamu kunjungan Anda telah menyelesaikan validasi di Pos Security dan saat ini telah memasuki kawasan pabrik:

📋 *RINCIAN DATA TAMU:*
• Status: 🟢 *Di Dalam Pabrik (Masuk)*
• No. Kunjungan: *${visitNumber}*
• Nama Tamu: *${guestName}*
• Instansi: ${company || 'Pribadi / Perorangan'}
• Departemen: ${department}
• PIC Dituju: *${picName}*
• Keperluan: ${purpose || '-'}
• No. Badge: *${badge || '-'}*
• Waktu Masuk: *${fmtTime(checkInAt)} WIB*

📢 *Tindakan Anda:*
Mohon segera menemui atau berkoordinasi dengan tamu Anda di area lobi resepsionis.

${DIVIDER}
${FOOTER}`;
}

/**
 * 6. PIC: tamunya sudah keluar.
 */
export function picGuestDeparted({ picName, guestName, company, department, visitNumber, checkInAt, checkOutAt, purpose }) {
  const mins = Math.max(0, Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000));
  const dur = `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🔴 *NOTIFIKASI: TAMU TELAH KELUAR PABRIK*
${DIVIDER}

Halo, *${picName}*!
Kunjungan tamu Anda telah selesai dan tamu telah resmi meninggalkan kawasan pabrik:

📋 *RINCIAN KUNJUNGAN:*
• Status: 🔴 *Telah Keluar Pabrik*
• No. Kunjungan: *${visitNumber}*
• Nama Tamu: *${guestName}*
• Instansi: ${company || 'Pribadi / Perorangan'}
• Departemen: ${department || '-'}
• PIC Dituju: *${picName}*
• Keperluan: ${purpose || '-'}
• Waktu Masuk: ${fmtTime(checkInAt)} WIB
• Waktu Keluar: *${fmtTime(checkOutAt)} WIB*
• Total Durasi: *${dur}*

Seluruh riwayat kunjungan telah diarsipkan ke dalam sistem.

${DIVIDER}
${FOOTER}`;
}

/**
 * 7. Management: ringkasan tamu masuk.
 */
export function managementArrival({ guestName, company, department, picName, visitNumber, checkInAt, count, purpose }) {
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🟢 *MONITORING: TAMU MASUK PABRIK*
${DIVIDER}

Pemberitahuan operasional kedatangan tamu di kawasan industri:

📋 *DETAIL KUNJUNGAN:*
• Status: 🟢 *Masuk Kawasan Pabrik*
• No. Kunjungan: *${visitNumber}*
• Nama Tamu: *${guestName}*
• Instansi: ${company || 'Pribadi / Perorangan'}
• Jumlah Orang: ${count || 1} orang
• Departemen: ${department}
• PIC Dituju: ${picName || '-'}
• Keperluan: ${purpose || '-'}
• Waktu Masuk: *${fmtTime(checkInAt)} WIB*
• Lokasi Area: Pos Gerbang Utama

${DIVIDER}
${FOOTER}`;
}

/**
 * 8. Management: ringkasan tamu keluar.
 */
export function managementDeparture({ guestName, company, department, picName, visitNumber, checkInAt, checkOutAt, count, purpose }) {
  const mins = Math.max(0, Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000));
  const dur = `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🔴 *MONITORING: TAMU TELAH KELUAR*
${DIVIDER}

Pemberitahuan operasional tamu telah check-out dari kawasan industri:

📋 *DETAIL KUNJUNGAN:*
• Status: 🔴 *Telah Check-Out (Keluar)*
• No. Kunjungan: *${visitNumber}*
• Nama Tamu: *${guestName}*
• Instansi: ${company || 'Pribadi / Perorangan'}
• Jumlah Orang: ${count || 1} orang
• Departemen: ${department}
• PIC Dituju: ${picName || '-'}
• Keperluan: ${purpose || '-'}
• Waktu Masuk: ${fmtTime(checkInAt)} WIB
• Waktu Keluar: *${fmtTime(checkOutAt)} WIB*
• Durasi Total: *${dur}*

${DIVIDER}
${FOOTER}`;
}

export { APP_URL };
