const APP_URL = process.env.PUBLIC_APP_URL || 'http://localhost';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

// Panjang divider 17 karakter pas untuk bubble chat WhatsApp di mobile tanpa wrap/offside
const DIVIDER = '─────────────────';
const FOOTER = '_Pesan Otomatis, Visitor Management System_';

export function formatGuestFieldWA(guestNames, fallbackName = '', badgeNumber = '') {
  let list = [];
  if (Array.isArray(guestNames) && guestNames.length > 0) {
    list = guestNames.map((g, idx) => {
      if (typeof g === 'string') {
        return { name: g.trim(), badge: idx === 0 ? (badgeNumber || '') : '', isLeader: idx === 0 };
      }
      return {
        name: (g?.name || '').trim(),
        badge: g?.badge || (idx === 0 ? (badgeNumber || '') : ''),
        isLeader: g?.isLeader !== undefined ? g.isLeader : idx === 0
      };
    }).filter((item) => item.name);
  } else if (fallbackName) {
    list = [{ name: String(fallbackName).trim(), badge: badgeNumber || '', isLeader: true }];
  }

  if (list.length === 0) {
    return `• Nama Tamu: *${fallbackName || '-'}*`;
  }

  if (list.length === 1) {
    const item = list[0];
    const badgePart = item.badge ? ` (No. Badge: *${item.badge}*)` : '';
    return `• Nama Tamu: *${item.name}*${badgePart}`;
  }

  const lines = list.map((item, idx) => {
    const leaderTag = idx === 0 || item.isLeader ? ' (Penanggung Jawab)' : '';
    const badgePart = item.badge ? ` — No. Badge: *${item.badge}*` : '';
    return `  ${idx + 1}. *${item.name}*${leaderTag}${badgePart}`;
  });

  return `• Nama Tamu (${list.length} orang):\n${lines.join('\n')}`;
}

export function formatBadgeList(guestNames, fallbackBadge = '') {
  if (Array.isArray(guestNames) && guestNames.length > 0) {
    const badges = guestNames
      .map((g) => (typeof g === 'object' ? g?.badge : null))
      .filter(Boolean);
    if (badges.length > 0) return badges.join(', ');
  }
  return fallbackBadge || '-';
}

/**
 * 1. Tamu walk-in: barcode awal (check-in) untuk ditunjukkan ke security.
 */
export function guestWalkInPass({ name, company, visitNumber, department, purpose, guestNames }) {
  const guestField = formatGuestFieldWA(guestNames, name);
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🟢 *PENDAFTARAN KUNJUNGAN (WALK-IN)*
${DIVIDER}

Halo, *${name}*!
Pendaftaran kedatangan Anda di kawasan pabrik *PT Cemindo Gemilang Tbk - Plant Batam* telah berhasil.

📋 *RINCIAN KUNJUNGAN:*
• No. Registrasi: *${visitNumber}*
${guestField}
• Instansi: ${company || 'Pribadi / Perorangan'}
• Departemen: ${department}
• Keperluan: ${purpose || '-'}

📌 *PANDUAN POS SECURITY:*
1. Tunjukkan *gambar QR Code terlampir* kepada petugas Security di POS 1.
2. Petugas akan memindai QR Code dan menyerahkan *Badge Tamu*.
3. Wajib mematuhi standar Keselamatan & Kesehatan Kerja (K3) selama berada di kawasan pabrik.

⚠️ _QR Code ini bersifat unik dan hanya berlaku untuk 1 kali validasi masuk._
${DIVIDER}
${FOOTER}`;
}

/**
 * 2. Tamu pre-registered: barcode dikirim saat PIC membuat janji temu.
 */
export function guestPreRegisteredPass({ name, company, visitNumber, department, picName, purpose, date, time, guestNames }) {
  const guestField = formatGuestFieldWA(guestNames, name);
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
📅 *UNDANGAN KUNJUNGAN RESMI*
${DIVIDER}

Halo, *${name}*!
Anda telah dijadwalkan berkunjung ke kawasan pabrik *PT Cemindo Gemilang Tbk - Plant Batam*.

📋 *RINCIAN JADWAL:*
• No. Kunjungan: *${visitNumber}*
${guestField}
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
export function guestCheckOutPass({ name, visitNumber, checkInAt, purpose, guestNames, badge }) {
  const guestField = formatGuestFieldWA(guestNames, name, badge);
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
${guestField}
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
export function guestCheckedOut({ name, visitNumber, checkInAt, checkOutAt, purpose, guestNames, badge }) {
  const mins = Math.max(0, Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000));
  const dur = `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
  const guestField = formatGuestFieldWA(guestNames, name, badge);
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
${guestField}
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
export function picGuestArrived({ picName, guestName, company, department, visitNumber, checkInAt, badge, purpose, guestNames }) {
  const guestField = formatGuestFieldWA(guestNames, guestName, badge);
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
${guestField}
• Instansi: ${company || 'Pribadi / Perorangan'}
• Departemen: ${department}
• PIC Dituju: *${picName}*
• Keperluan: ${purpose || '-'}
• Waktu Masuk: *${fmtTime(checkInAt)} WIB*

📢 *Tindakan Anda:*
Mohon segera menemui atau berkoordinasi dengan tamu Anda di area lobi resepsionis.

${DIVIDER}
${FOOTER}`;
}

/**
 * 6. PIC: tamunya sudah keluar.
 */
export function picGuestDeparted({ picName, guestName, company, department, visitNumber, checkInAt, checkOutAt, purpose, guestNames, badge }) {
  const mins = Math.max(0, Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000));
  const dur = `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
  const guestField = formatGuestFieldWA(guestNames, guestName, badge);
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
${guestField}
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
export function managementArrival({ guestName, company, department, picName, visitNumber, checkInAt, count, purpose, guestNames, badge }) {
  const guestField = formatGuestFieldWA(guestNames, guestName, badge);
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🟢 *MONITORING: TAMU MASUK PABRIK*
${DIVIDER}

Pemberitahuan operasional kedatangan tamu di kawasan pabrik:

📋 *DETAIL KUNJUNGAN:*
• Status: 🟢 *Masuk Kawasan Pabrik*
• No. Kunjungan: *${visitNumber}*
${guestField}
• Instansi: ${company || 'Pribadi / Perorangan'}
• Jumlah Orang: ${count || 1} orang
• Departemen: ${department}
• PIC Dituju: ${picName || '-'}
• Keperluan: ${purpose || '-'}
• Waktu Masuk: *${fmtTime(checkInAt)} WIB*
• Lokasi Area: POS 1

${DIVIDER}
${FOOTER}`;
}

/**
 * 8. Management: ringkasan tamu keluar.
 */
export function managementDeparture({ guestName, company, department, picName, visitNumber, checkInAt, checkOutAt, count, purpose, guestNames, badge }) {
  const mins = Math.max(0, Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000));
  const dur = `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
  const guestField = formatGuestFieldWA(guestNames, guestName, badge);
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — Visitor Management*
${DIVIDER}
🔴 *MONITORING: TAMU TELAH KELUAR*
${DIVIDER}

Pemberitahuan operasional tamu telah check-out dari kawasan pabrik:

📋 *DETAIL KUNJUNGAN:*
• Status: 🔴 *Telah Check-Out (Keluar)*
• No. Kunjungan: *${visitNumber}*
${guestField}
• Instansi: ${company || 'Pribadi / Perorangan'}
• Jumlah Orang: ${count || 1} orang
• Departemen: ${department}
• PIC Dituju: ${picName || '-'}
• Keperluan: ${purpose || '-'}
• Waktu Masuk: ${fmtTime(checkInAt)} WIB
• Waktu Keluar: *${fmtTime(checkOutAt)} WIB*
• Durasi Total: *${dur}*
• Lokasi Area: POS 1

${DIVIDER}
${FOOTER}`;
}

/**
 * 9. Tim SHE: Pemberitahuan Tamu Masuk Butuh Safety Induction (Pekerjaan Lapangan / Masuk Pabrik).
 */
export function sheInductionAlert({
  visitNumber,
  guestName,
  guestNames,
  company,
  department,
  picName,
  purpose,
  workDescription,
  checkInAt,
  badge
}) {
  const guestField = formatGuestFieldWA(guestNames, guestName, badge);
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — K3 / Safety Health & Environment (SHE)*
${DIVIDER}
⚠️ *NOTIFIKASI K3: BUTUH SAFETY INDUCTION*
${DIVIDER}

Pemberitahuan kepada Tim SHE:
Tamu dengan tujuan *Pekerjaan Lapangan / Area Pabrik* telah tiba dan memerlukan *Safety Induction K3* sebelum memasuki area kerja:

📋 *DETAIL KUNJUNGAN:*
• No. Kunjungan: *${visitNumber}*
${guestField}
• Instansi / Perusahaan: ${company || 'Pribadi / Perorangan'}
• Departemen Tujuan: ${department || '-'}
• PIC Dituju: *${picName || '-'}*
• Keperluan: ${purpose || '-'}
• Rencana Pekerjaan: *${workDescription || 'Pekerjaan di Area Pabrik / Lapangan'}*
• Lokasi Masuk: POS 1 Security
• Waktu Check-In: *${fmtTime(checkInAt)} WIB*
• Status K3: 🟡 *Wajib Safety Induction (Sistem SHE)*

📢 *Tindakan Tim SHE:*
Mohon petugas SHE segera melakukan briefing / Safety Induction dan verifikasi kelengkapan APD tamu di Pos / Ruang Induction SHE.

${DIVIDER}
${FOOTER}`;
}

/**
 * 10. Tim SHE: Pemberitahuan Tamu Pekerjaan Lapangan Telah Keluar Pabrik (Check-Out).
 */
export function sheDepartureAlert({
  visitNumber,
  guestName,
  guestNames,
  company,
  department,
  picName,
  purpose,
  workDescription,
  checkInAt,
  checkOutAt,
  badge
}) {
  const mins = Math.max(0, Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000));
  const dur = `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
  const guestField = formatGuestFieldWA(guestNames, guestName, badge);
  return `🏭 *PT CEMINDO GEMILANG Tbk*
📍 *Plant Batam — K3 / Safety Health & Environment (SHE)*
${DIVIDER}
🔴 *INFORMASI K3: TAMU PEKERJAAN TELAH KELUAR PABRIK*
${DIVIDER}

Pemberitahuan kepada Tim SHE:
Tamu yang melakukan pekerjaan di area pabrik telah menyelesaikan kunjungan dan resmi keluar (check-out) melalui Pos Security:

📋 *DETAIL KUNJUNGAN:*
• No. Kunjungan: *${visitNumber}*
${guestField}
• Instansi / Perusahaan: ${company || 'Pribadi / Perorangan'}
• Departemen Tujuan: ${department || '-'}
• PIC Dituju: *${picName || '-'}*
• Keperluan: ${purpose || '-'}
• Rencana Pekerjaan: *${workDescription || 'Pekerjaan di Area Pabrik / Lapangan'}*
• Waktu Masuk: ${fmtTime(checkInAt)} WIB
• Waktu Keluar: *${fmtTime(checkOutAt)} WIB*
• Total Durasi di Pabrik: *${dur}*
• Status: 🔴 *Telah Meninggalkan Pabrik*

Data headcount lapangan telah diperbarui secara otomatis di sistem VMS.

${DIVIDER}
${FOOTER}`;
}

export { APP_URL };
