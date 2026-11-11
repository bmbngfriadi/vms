const APP_URL = process.env.PUBLIC_APP_URL || 'http://localhost';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━';

/**
 * 1. Tamu walk-in: barcode awal (check-in) untuk ditunjukkan ke security.
 */
export function guestWalkInPass({ name, company, visitNumber, department, passUrl }) {
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🎫 *PENDAFTARAN KUNJUNGAN BERHASIL*
${DIVIDER}

Halo, *${name}*!
Pendaftaran kedatangan Anda di *PT Cemindo Gemilang Tbk - Plant Batam* telah kami terima.

📋 *RINCIAN KUNJUNGAN:*
🔖 *No. Registrasi* : *${visitNumber}*
🏢 *Instansi*       : ${company || 'Pribadi / Perorangan'}
🏛️ *Departemen*     : ${department}

📌 *PANDUAN POS SECURITY:*
1️⃣ Tunjukkan *gambar QR Code terlampir* kepada petugas Security di Pos Utama.
2️⃣ Petugas akan memvalidasi data dan menyerahkan *Badge Tamu*.
3️⃣ Wajib mematuhi standar Keselamatan & Kesehatan Kerja (K3) selama berada di kawasan pabrik.

🔗 *Akses Pass Digital Cadangan:*
${passUrl}

⚠️ _QR Code ini bersifat unik dan hanya berlaku untuk 1 kali validasi masuk._
${DIVIDER}
_Pesan Otomatis • Safety & Security Department_`;
}

/**
 * 2. Tamu pre-registered: barcode dikirim saat PIC membuat janji temu.
 */
export function guestPreRegisteredPass({ name, company, visitNumber, department, picName, date, time, passUrl }) {
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
📅 *UNDANGAN KUNJUNGAN RESMI*
${DIVIDER}

Halo, *${name}*!
Anda telah dijadwalkan berkunjung ke kawasan industri *PT Cemindo Gemilang Tbk - Plant Batam*.

📋 *RINCIAN JADWAL:*
🔖 *No. Kunjungan* : *${visitNumber}*
📆 *Hari/Tanggal*  : ${fmtDate(date)}
⏰ *Waktu Rencana* : ${time || '09:00'} WIB
🏛️ *Departemen*    : ${department}
👤 *Tuan Rumah*    : ${picName || '-'}
🏢 *Instansi Tamu* : ${company || '-'}

📌 *PETUNJUK KEDATANGAN:*
• Tunjukkan *gambar QR Code terlampir* kepada petugas Security saat tiba di gerbang pabrik.
• Harap hadir tepat waktu sesuai perkiraan jadwal kunjungan.
• Gunakan pakaian kerja rapi, sepatu tertutup, dan patuhi standar K3 pabrik.

🔗 *Akses Pass Undangan Cadangan:*
${passUrl}

${DIVIDER}
_Pesan Otomatis • Safety & Security Department_`;
}

/**
 * 3. Tamu sudah check-in: barcode baru untuk check-out.
 */
export function guestCheckOutPass({ name, visitNumber, checkInAt, passUrl }) {
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
✅ *VALIDASI CHECK-IN BERHASIL*
${DIVIDER}

Halo, *${name}*!
Kedatangan Anda telah berhasil divalidasi oleh petugas Security. Selamat beraktivitas di area pabrik.

📋 *STATUS KUNJUNGAN:*
🔖 *No. Kunjungan* : *${visitNumber}*
🕒 *Waktu Masuk*   : *${fmtTime(checkInAt)} WIB*
📍 *Lokasi Area*   : Kawasan Pabrik Plant Batam

⚠️ *PANDUAN KELUAR (CHECK-OUT):*
• *Simpan gambar QR Code terlampir ini dengan baik.*
• Barcode ini *WAJIB* ditunjukkan kepada petugas Security saat Anda akan keluar meninggalkan kawasan pabrik.
• Kembalikan Badge Tamu kepada petugas Security sebelum meninggalkan gerbang.

🔗 *Akses Pass Keluar Cadangan:*
${passUrl}

${DIVIDER}
_Pesan Otomatis • Safety & Security Department_`;
}

/**
 * 4. Tamu sudah check-out (konfirmasi).
 */
export function guestCheckedOut({ name, visitNumber, checkInAt, checkOutAt }) {
  const mins = Math.max(0, Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000));
  const dur = `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🚪 *CHECK-OUT SELESAI*
${DIVIDER}

Halo, *${name}*!
Kunjungan Anda di *PT Cemindo Gemilang Tbk - Plant Batam* telah resmi selesai.

📋 *RINGKASAN KUNJUNGAN:*
🔖 *No. Kunjungan* : *${visitNumber}*
🕒 *Waktu Masuk*   : ${fmtTime(checkInAt)} WIB
⏱️ *Waktu Keluar*  : ${fmtTime(checkOutAt)} WIB
⏳ *Total Durasi*  : *${dur}*

🙏 *Terima kasih atas kunjungan Anda.*
Semoga urusan dan pertemuan Anda berjalan lancar. Utamakan selalu keselamatan dalam perjalanan.

${DIVIDER}
_Pesan Otomatis • Safety & Security Department_`;
}

/**
 * 5. PIC / tuan rumah: tamunya sudah masuk.
 */
export function picGuestArrived({ picName, guestName, company, department, visitNumber, checkInAt, badge }) {
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🔔 *NOTIFIKASI: TAMU ANDA TELAH TIBA*
${DIVIDER}

Halo, *${picName}*!
Tamu kunjungan Anda telah menyelesaikan proses registrasi di Pos Security dan saat ini berada di area pabrik:

📋 *RINCIAN DATA TAMU:*
👤 *Nama Tamu*     : *${guestName}*
🏢 *Instansi*      : ${company || 'Pribadi / Perorangan'}
🏛️ *Departemen*    : ${department}
🔖 *No. Kunjungan* : ${visitNumber}
🏷️ *No. Badge*     : *${badge || '-'}*
🕒 *Waktu Masuk*   : *${fmtTime(checkInAt)} WIB*

📢 *Tindakan Anda:*
Mohon segera menemui atau berkoordinasi dengan tamu Anda di area lobi resepsionis.

${DIVIDER}
_Pesan Otomatis • Visitor Management System_`;
}

/**
 * 6. PIC / tuan rumah: tamunya sudah keluar.
 */
export function picGuestDeparted({ picName, guestName, company, visitNumber, checkInAt, checkOutAt }) {
  const mins = Math.max(0, Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000));
  const dur = `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
👋 *NOTIFIKASI: TAMU TELAH CHECK-OUT*
${DIVIDER}

Halo, *${picName}*!
Kunjungan tamu Anda telah selesai dan tamu telah meninggalkan kawasan pabrik:

📋 *RINCIAN KUNJUNGAN:*
👤 *Nama Tamu*     : *${guestName}*
🏢 *Instansi*      : ${company || 'Pribadi / Perorangan'}
🔖 *No. Kunjungan* : ${visitNumber}
🕒 *Waktu Masuk*   : ${fmtTime(checkInAt)} WIB
⏱️ *Waktu Keluar*  : ${fmtTime(checkOutAt)} WIB
⏳ *Total Durasi*  : ${dur}

Seluruh data kunjungan telah diarsipkan ke dalam sistem.

${DIVIDER}
_Pesan Otomatis • Visitor Management System_`;
}

/**
 * 7. Management: ringkasan tamu masuk.
 */
export function managementArrival({ guestName, company, department, picName, visitNumber, checkInAt, count }) {
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
📊 *LAPORAN MONITORING: TAMU MASUK*
${DIVIDER}

Pemberitahuan operasional kedatangan tamu di area pabrik:

📋 *DETAIL KUNJUNGAN:*
🔖 *No. Kunjungan* : *${visitNumber}*
👤 *Nama Tamu*     : *${guestName}*
🏢 *Instansi*      : ${company || 'Pribadi / Perorangan'}
👥 *Jumlah Rombongan*: ${count || 1} orang
🏛️ *Departemen*    : ${department}
🎯 *PIC Dituju*    : ${picName || '-'}
🕒 *Waktu Masuk*   : *${fmtTime(checkInAt)} WIB*
📍 *Lokasi*        : Pos Gerbang Utama

${DIVIDER}
_Pesan Otomatis • Management Monitoring Feed_`;
}

/**
 * 8. Management: ringkasan tamu keluar.
 */
export function managementDeparture({ guestName, company, department, picName, visitNumber, checkInAt, checkOutAt }) {
  const mins = Math.max(0, Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000));
  const dur = `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
📈 *LAPORAN MONITORING: TAMU KELUAR*
${DIVIDER}

Pemberitahuan operasional tamu telah check-out dari kawasan pabrik:

📋 *DETAIL KUNJUNGAN:*
🔖 *No. Kunjungan* : *${visitNumber}*
👤 *Nama Tamu*     : *${guestName}*
🏢 *Instansi*      : ${company || 'Pribadi / Perorangan'}
🏛️ *Departemen*    : ${department}
🎯 *PIC Dituju*    : ${picName || '-'}
🕒 *Waktu Masuk*   : ${fmtTime(checkInAt)} WIB
⏱️ *Waktu Keluar*  : ${fmtTime(checkOutAt)} WIB
⏳ *Durasi Total*  : *${dur}*

${DIVIDER}
_Pesan Otomatis • Management Monitoring Feed_`;
}

export { APP_URL };
