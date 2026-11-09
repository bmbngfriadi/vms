/**
 * Registri fitur VMS.
 *
 * SATU-SATUNYA tempat mendefinisikan fitur yang bisa diatur per user.
 * Halaman "Manajemen Fitur" membaca daftar ini lewat API, jadi fitur baru
 * otomatis muncul di halaman tersebut tanpa perlu menyentuh UI-nya.
 *
 * Aturan:
 * - `defaultRoles`: siapa yang mendapat fitur ini bila tidak ada pengaturan khusus.
 * - `locked`: hanya mengikuti role, tidak bisa diubah dari halaman fitur
 *   (dipakai untuk halaman Manajemen Fitur sendiri agar admin tidak terkunci).
 */

export const FEATURES = [
  {
    key: 'page.dashboard',
    label: 'Dashboard',
    group: 'Halaman',
    description: 'Ringkasan statistik & kunjungan terbaru.',
    defaultRoles: ['ADMIN', 'SECURITY', 'PIC', 'MANAGEMENT']
  },
  {
    key: 'page.scan',
    label: 'Scan Barcode',
    group: 'Halaman',
    description: 'Halaman pemindai barcode untuk validasi masuk/keluar.',
    defaultRoles: ['ADMIN', 'SECURITY']
  },
  {
    key: 'page.visits',
    label: 'Data Kunjungan',
    group: 'Halaman',
    description: 'Daftar seluruh kunjungan beserta detailnya.',
    defaultRoles: ['ADMIN', 'SECURITY', 'PIC', 'MANAGEMENT']
  },
  {
    key: 'page.reports',
    label: 'Laporan',
    group: 'Halaman',
    description: 'Rekap kunjungan per periode.',
    defaultRoles: ['ADMIN', 'SECURITY', 'MANAGEMENT']
  },
  {
    key: 'page.master',
    label: 'Master Data',
    group: 'Halaman',
    description: 'Kelola departemen, user, dan PIC.',
    defaultRoles: ['ADMIN']
  },
  {
    key: 'page.whatsapp',
    label: 'WhatsApp',
    group: 'Halaman',
    description: 'Status sesi WhatsApp, log notifikasi, dan penerima management.',
    defaultRoles: ['ADMIN', 'MANAGEMENT']
  },
  {
    key: 'page.features',
    label: 'Manajemen Fitur',
    group: 'Halaman',
    description: 'Halaman pengaturan hak fitur untuk seluruh user.',
    defaultRoles: ['ADMIN'],
    locked: true
  },

  {
    key: 'visit.create',
    label: 'Buat janji temu',
    group: 'Data Kunjungan',
    description: 'Membuat kunjungan baru / pra-registrasi tamu.',
    defaultRoles: ['ADMIN', 'PIC']
  },
  {
    key: 'visit.edit',
    label: 'Edit data kunjungan',
    group: 'Data Kunjungan',
    description: 'Mengubah data tamu, departemen, PIC, jadwal, dan status kunjungan.',
    defaultRoles: ['ADMIN']
  },
  {
    key: 'visit.delete',
    label: 'Hapus data kunjungan',
    group: 'Data Kunjungan',
    description: 'Menghapus kunjungan beserta token barcode-nya secara permanen.',
    defaultRoles: ['ADMIN']
  },
  {
    key: 'visit.cancel',
    label: 'Batalkan kunjungan',
    group: 'Data Kunjungan',
    description: 'Membatalkan kunjungan yang belum check-in.',
    defaultRoles: ['ADMIN', 'PIC']
  },
  {
    key: 'report.export',
    label: 'Unduh laporan CSV',
    group: 'Laporan',
    description: 'Mengekspor data kunjungan ke berkas CSV.',
    defaultRoles: ['ADMIN', 'SECURITY', 'MANAGEMENT']
  }
];

const BY_KEY = new Map(FEATURES.map((f) => [f.key, f]));

export const FEATURE_KEYS = FEATURES.map((f) => f.key);

export const isKnownFeature = (key) => BY_KEY.has(key);

/** Nilai bawaan sebuah fitur untuk role tertentu. */
export function defaultFor(key, role) {
  const f = BY_KEY.get(key);
  return !!f && f.defaultRoles.includes(role);
}

/**
 * Status efektif sebuah fitur: override per user menang, kecuali fitur locked.
 */
export function isEnabled(key, role, overrides = {}) {
  const f = BY_KEY.get(key);
  if (!f) return false;
  if (f.locked) return f.defaultRoles.includes(role);
  const override = overrides[key];
  if (typeof override === 'boolean') return override;
  return f.defaultRoles.includes(role);
}

/** Peta { featureKey: boolean } untuk satu user. */
export function resolveFeatures(role, overrides = {}) {
  return Object.fromEntries(FEATURE_KEYS.map((k) => [k, isEnabled(k, role, overrides)]));
}

/** Ubah baris UserFeature dari database menjadi objek { key: enabled }. */
export function overridesFromRows(rows = []) {
  return Object.fromEntries(
    rows.filter((r) => isKnownFeature(r.featureKey)).map((r) => [r.featureKey, r.enabled])
  );
}