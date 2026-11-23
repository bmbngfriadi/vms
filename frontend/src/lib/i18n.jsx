import React, { createContext, useContext, useState, useEffect } from 'react';

// Pemetaan frasa umum langsung (Exact / Normalized Phrase Matcher)
const PHRASE_ID_TO_EN = {
  // Menu & Modul
  'informasi tamu she': 'SHE Induction Data',
  'informasi tamu she (pekerjaan lapangan)': 'SHE Induction Data (Field Work)',
  'data induction she': 'SHE Induction Data',
  'data kunjungan': 'Visitor Records',
  'scan barcode': 'Scan Barcode',
  'scan barcode kunjungan': 'Scan Visitor Pass Barcode',
  'manajemen fitur': 'Feature Management',
  'master data': 'Master Data',
  'profil saya': 'My Profile',
  'keluar sistem': 'Sign Out',
  'mode terang': 'Light Mode',
  'mode gelap': 'Dark Mode',
  'registrasi tamu (walk-in)': 'Guest Registration (Walk-in)',

  // SHE Induction
  'papan informasi kedatangan tamu pekerjaan pabrik yang butuh safety induction oleh tim she':
    'HSE Safety Induction monitoring board for plant work visitors by SHE Team',
  'papan pemantauan dan verifikasi safety induction k3 bagi tamu pekerjaan pabrik':
    'HSE Safety Induction monitoring & verification board for plant work visitors',
  'total tamu pekerjaan': 'Total Field Visitors',
  'sedang aktif di pabrik': 'Currently Inside Plant',
  'tamu pekerjaan hari ini': "Today's Field Visitors",
  'menunggu masuk': 'Waiting Check-In',
  'tamu office hari ini': 'Office Visitors Today',
  'sudah di induction': 'Induction Completed',
  'butuh di induction': 'Needs Safety Induction',
  'butuh induction she': 'Needs SHE Induction',
  'ter-induction': 'Inducted',
  'sudah induction': 'Inducted',
  'induction selesai': 'Induction Done',
  'ubah ke belum induction': 'Revert to Not Inducted',
  'tandai sudah di induction': 'Mark as Inducted',
  'pengaturan wa she': 'SHE WhatsApp Settings',
  'pengaturan notifikasi k3 / she': 'HSE / SHE Notification Settings',
  'sedang di pabrik': 'Inside Plant',
  'hari ini': 'Today',
  'semua riwayat': 'All History',
  'headcount tamu di lapangan': 'Active field visitors headcount',
  'total sesi pekerjaan hari ini': 'Total field work sessions today',
  'terjadwal / belum check-in': 'Scheduled / not checked in',
  'tanpa pekerjaan fisik (no induction)': 'No physical work (no induction)',
  'tanpa pekerjaan fisik': 'No physical work',
  'rincian pekerjaan di area pabrik / lapangan:': 'Work Details in Plant / Field Area:',
  'status pelaksanaan safety induction:': 'Safety Induction Execution Status:',
  'daftar seluruh tamu': 'All Visitors List',
  'daftar nama seluruh tamu': 'All Visitors Name List',
  'nomor badge setiap tamu': 'Badge Number for Each Visitor',
  'catatan security (opsional)': 'Security Notes (Optional)',
  'nomor polisi': 'License Plate',
  'nomor polisi kendaraan': 'Vehicle License Plate',
  'foto identitas (ktp / sim)': 'Identity Photo (ID Card / Driver License)',
  'ketuk untuk melihat foto penuh & periksa': 'Tap to view full photo & inspect',
  'klik untuk melihat ukuran penuh': 'Click to view full size',

  // Tombol Aksi Kritis
  'konfirmasi check-in (tamu masuk)': 'CONFIRM CHECK-IN (GUEST ENTRY)',
  'konfirmasi check-out (tamu keluar)': 'CONFIRM CHECK-OUT (GUEST EXIT)',
  'tampilkan gambar barcode tamu': 'Show Guest Barcode Image',
  'detail & salin': 'Details & Copy',
  'simpan perubahan': 'Save Changes',
  'batal': 'Cancel',
  'hapus': 'Delete',
  'simpan': 'Save',
  'kembali': 'Back',
  'tutup': 'Close',
  'segarkan': 'Refresh',
  'terapkan filter': 'Apply Filter',
  'unduh laporan excel (.xlsx)': 'Download Excel Report (.xlsx)',
  'unduh excel (.xlsx)': 'Download Excel (.xlsx)',
  'buat janji temu (pre-reg)': 'New Appointment (Pre-Reg)',
  'daftarkan tamu pre-reg': 'Pre-Register Guest',
  'buka scanner barcode': 'Open Barcode Scanner',

  // Area & K3 Pass Notice
  'area kantor (office)': 'Office Area',
  'area pabrik / lapangan': 'Plant / Field Area',
  'wajib induction k3': 'HSE Induction Required',
  'perlu safety induction tim she': 'Requires SHE Safety Induction',
  'tamu memiliki agenda pekerjaan di area operasional pabrik. silakan ikuti safety induction bersama tim k3 / she sebelum memulai pekerjaan.':
    'Guest has scheduled work in the plant operational area. Please undergo Safety Induction with HSE / SHE Team before starting work.',
  'sudah melakukan safety induction she': 'Safety Induction Completed',
  'tamu telah diverifikasi dan menyelesaikan safety induction k3 bersama tim she.':
    'Guest has been verified and completed Safety Induction with SHE Team.',
  'rencana pekerjaan': 'Planned Work',
  'rencana kerja': 'Work Plan',

  // Dialog & Konfirmasi
  'konfirmasi tindakan': 'Action Confirmation',
  'apakah anda yakin ingin memproses check-in untuk tamu ini?':
    'Are you sure you want to confirm check-in for this guest?',
  'apakah anda yakin ingin memproses check-out untuk tamu ini? pastikan kartu badge fisik telah dikembalikan ke pos security.':
    'Are you sure you want to confirm check-out for this guest? Please ensure physical badge cards have been returned to security post.',
  'ya, konfirmasi check-in': 'Yes, Confirm Check-In',
  'ya, konfirmasi check-out': 'Yes, Confirm Check-Out',
  'apakah anda yakin ingin keluar dari sistem visitor management?':
    'Are you sure you want to sign out from the Visitor Management system?',
  'ya, keluar': 'Yes, Sign Out',

  // Search & Filter
  'cari tamu / instansi / pekerjaan...': 'Search guest / company / work...',
  'cari no. kunjungan, nama tamu, perusahaan...': 'Search visit no, guest name, company...',
  'tidak ada data tamu pekerjaan pada filter ini.': 'No field guest data found for this filter.',
  'tidak ada data pada periode ini.': 'No data found for this period.',
  'semua status': 'All Statuses',
  'reset filter': 'Reset Filter'
};

// Kamus leksikal otomatis untuk kata-kata per kata
const LEXICON_ID_TO_EN = {
  'masuk': 'entry',
  'keluar': 'exit',
  'daftar': 'register',
  'simpan': 'save',
  'batal': 'cancel',
  'hapus': 'delete',
  'ubah': 'edit',
  'tambah': 'add',
  'cari': 'search',
  'unduh': 'download',
  'laporan': 'report',
  'pengaturan': 'settings',
  'kunjungan': 'visits',
  'tamu': 'visitor',
  'profil': 'profile',
  'kata sandi': 'password',
  'departemen': 'department',
  'petugas': 'officer',
  'status': 'status',
  'keperluan': 'purpose',
  'waktu': 'time',
  'tanggal': 'date',
  'durasi': 'duration',
  'nomor': 'number',
  'identitas': 'identity',
  'kamera': 'camera',
  'foto': 'photo',
  'berhasil': 'success',
  'gagal': 'failed',
  'aktif': 'active',
  'nonaktif': 'inactive',
  'menunggu': 'waiting',
  'disetujui': 'approved',
  'ditolak': 'rejected',
  'dibatalkan': 'cancelled',
  'fitur': 'features',
  'pengguna': 'users',
  'selesai': 'completed',
  'semua': 'all',
  'terapkan': 'apply',
  'rincian': 'details',
  'aksi': 'action',
  'terjadwal': 'scheduled',
  'pabrik': 'plant',
  'tutup': 'close',
  'kembali': 'back',
  'pekerjaan': 'work',
  'lapangan': 'field',
  'kantor': 'office',
  'area': 'area',
  'keselamatan': 'safety',
  'kesehatan': 'health',
  'lingkungan': 'environment',
  'keamanan': 'security',
  'kartu': 'card',
  'rombongan': 'group',
  'orang': 'people',
  'sesi': 'session',
  'instansi': 'company',
  'perusahaan': 'company',
  'kendaraan': 'vehicle',
  'polisi': 'plate',
  'catatan': 'notes',
  'opsional': 'optional',
  'wajib': 'mandatory',
  'langkah': 'step',
  'validasi': 'validation',
  'konfirmasi': 'confirmation',
  'kirim': 'send',
  'ulang': 'resend',
  'salin': 'copy',
  'notifikasi': 'notification',
  'tujuan': 'destination',
  'penanggung': 'person-in',
  'jawab': 'charge',
  'peringatan': 'warning',
  'segarkan': 'refresh',
  'riwayat': 'history',
  'seluruh': 'all',
  'bawaan': 'default',
  'khusus': 'custom',
  'terkunci': 'locked',
  'informasi': 'information',
  'data': 'data',
  'hari': 'day',
  'ini': 'today',
  'butuh': 'needs',
  'sudah': 'already',
  'belum': 'not yet'
};

const DICTIONARY = {
  id: {
    // Navigation & Shell
    'nav.dashboard': 'Dashboard',
    'nav.scan': 'Scan Barcode',
    'nav.visits': 'Data Kunjungan',
    'nav.visits_short': 'Kunjungan',
    'nav.she': 'Data Induction SHE',
    'nav.reports': 'Laporan',
    'nav.master': 'Master Data',
    'nav.whatsapp': 'WhatsApp Gateway',
    'nav.features': 'Manajemen Fitur',
    'nav.profile': 'Profil Saya',
    'nav.profile_short': 'Profil',
    'nav.logout': 'Keluar Sistem',
    'nav.logout_btn': 'Keluar Sistem',
    'nav.register_guest': 'Registrasi Tamu (Walk-in)',
    'nav.mode_light': 'Mode Terang',
    'nav.mode_dark': 'Mode Gelap',

    // App Branding
    'app.title': 'PT CEMINDO GEMILANG Tbk',
    'app.subtitle': 'Visitor Management · Batam',
    'app.welcome': 'Selamat Datang',
    'app.install': 'Install Aplikasi',
    'app.install_prompt': 'Pasang aplikasi VMS di perangkat Anda untuk akses cepat seperti aplikasi native.',

    // Common Actions
    'action.save': 'Simpan',
    'action.cancel': 'Batal',
    'action.delete': 'Hapus',
    'action.edit': 'Ubah',
    'action.add': 'Tambah',
    'action.search': 'Cari...',
    'action.filter': 'Filter',
    'action.export': 'Unduh Laporan Excel (.xlsx)',
    'action.close': 'Tutup',
    'action.back': 'Kembali',
    'action.refresh': 'Segarkan',
    'action.confirm': 'Konfirmasi',
    'action.apply': 'Terapkan',
    'action.reset': 'Reset',
    'action.change_photo': 'Ganti Foto',
    'action.retake_photo': 'Foto Ulang',
    'action.open_camera': 'Buka Kamera Langsung',
    'action.choose_file': 'Pilih dari File / Galeri',

    // Modul Data Induction SHE
    'she.title': 'Data Induction SHE',
    'she.subtitle': 'Papan pemantauan dan verifikasi Safety Induction K3 bagi tamu pekerjaan pabrik',
    'she.total_work': 'Total Tamu Pekerjaan',
    'she.inducted': 'Sudah di Induction',
    'she.pending_induction': 'Butuh di Induction',
    'she.active_in_plant': 'Sedang Aktif di Pabrik',
    'she.today_work': 'Tamu Pekerjaan Hari Ini',
    'she.waiting_entry': 'Menunggu Masuk',
    'she.office_today': 'Tamu Office Hari Ini',
    'she.headcount_active': 'Headcount aktif di lapangan',
    'she.waiting_desc': 'Terjadwal / belum check-in',
    'she.office_desc': 'Tanpa pekerjaan fisik (no induction)',
    'she.tab_active': 'Sedang di Pabrik',
    'she.tab_pending': 'Butuh Induction',
    'she.tab_inducted': 'Sudah Induction',
    'she.tab_today': 'Hari Ini',
    'she.tab_waiting': 'Menunggu Masuk',
    'she.tab_all': 'Semua Riwayat',
    'she.col_visit_no': 'No. Kunjungan',
    'she.col_guest_team': 'Nama Tamu & Rombongan',
    'she.col_company': 'Instansi',
    'she.col_pic_dept': 'PIC & Departemen',
    'she.col_work_desc': 'Pekerjaan Lapangan',
    'she.col_status': 'Status Tamu',
    'she.col_induction': 'Induction K3',
    'she.col_action': 'Aksi',
    'she.btn_settings': 'Pengaturan WA SHE',
    'she.btn_mark_inducted': 'Sudah di Induction',
    'she.btn_mark_pending': 'Ubah ke Belum Induction',
    'she.btn_inducted_done': 'Ter-Induction',
    'she.btn_finish_induction': 'Induction Selesai',
    'she.badge_inducted': 'Sudah di Induction',
    'she.badge_needs_induction': 'Butuh Induction SHE',
    'she.btn_detail_copy': 'Detail & Salin',
    'she.btn_send_wa': 'Kirim WA',
    'she.btn_detail': 'Detail',

    // Common Words
    'common.visitors': 'Tamu',
    'common.sessions': 'sesi kedatangan',
    'common.sessions_done': 'sesi selesai verifikasi',
    'common.sessions_pending': 'sesi belum induction',
    'common.people': 'orang',
    'common.status': 'Status',
    'common.in': 'Masuk',
    'common.out': 'Keluar',

    // Pass & Scan Security
    'pass.checkin_btn': 'KONFIRMASI CHECK-IN (TAMU MASUK)',
    'pass.checkout_btn': 'KONFIRMASI CHECK-OUT (TAMU KELUAR)',
    'pass.area_office': 'Area Kantor (Office)',
    'pass.area_plant': 'Area Pabrik / Lapangan',
    'pass.k3_notice_title': 'Perlu Safety Induction Tim SHE',
    'pass.k3_notice_desc': 'Tamu memiliki agenda pekerjaan di area operasional pabrik. Silakan ikuti Safety Induction bersama Tim K3 / SHE sebelum memulai pekerjaan.',
    'pass.k3_inducted_title': 'Sudah Melakukan Safety Induction SHE',
    'pass.k3_inducted_desc': 'Tamu telah diverifikasi dan menyelesaikan Safety Induction K3 bersama Tim SHE.',

    // Auth & Login
    'login.title': 'Masuk ke sistem',
    'login.subtitle': 'Gunakan akun internal yang telah terdaftar.',
    'login.identifier_label': 'Email / Username / No. HP',
    'login.identifier_placeholder': 'nama@cemindo.com, username, atau 0812xxxx',
    'login.password_label': 'Kata Sandi',
    'login.password_placeholder': '••••••••',
    'login.btn_submit': 'Masuk ke Sistem',
    'login.submitting': 'Memproses...',
    'login.forgot_password': 'Lupa kata sandi akun Anda?',
    'login.guest_prompt': 'Tamu tanpa janji? Daftarkan kunjungan Anda di sini →',
    'login.tab_all': 'Fleksibel (Semua)',
    'login.tab_email': 'Email',
    'login.tab_username': 'Username',
    'login.tab_phone': 'Nomor WhatsApp',

    // Forgot Password
    'forgot.title': 'Lupa Kata Sandi',
    'forgot.desc': 'Masukkan Email, Username, atau No. WhatsApp Anda. Kode verifikasi OTP akan dikirimkan langsung ke nomor WhatsApp terdaftar.',
    'forgot.btn_send_otp': 'Kirim Kode OTP ke WhatsApp',
    'forgot.otp_label': 'Kode OTP 6 Digit',
    'forgot.otp_placeholder': '123456',
    'forgot.new_password_label': 'Kata Sandi Baru (Min. 6 Karakter)',
    'forgot.confirm_password_label': 'Konfirmasi Kata Sandi Baru',
    'forgot.btn_verify_reset': 'Verifikasi OTP & Pasang Sandi Baru',
    'forgot.back_to_login': 'Kembali ke Halaman Masuk',

    // Profile Page
    'profile.title': 'Profil Pengguna',
    'profile.subtitle': 'Kelola informasi akun Anda dan perbarui kata sandi secara mandiri.',
    'profile.info_card': 'Informasi Pribadi',
    'profile.name': 'Nama Lengkap',
    'profile.username': 'Username',
    'profile.email': 'Alamat Email',
    'profile.phone': 'Nomor WhatsApp',
    'profile.role': 'Peran Sistem (Role)',
    'profile.department': 'Departemen',
    'profile.security_card': 'Ubah Kata Sandi',
    'profile.current_password': 'Kata Sandi Saat Ini',
    'profile.new_password': 'Kata Sandi Baru',
    'profile.confirm_password': 'Ulangi Kata Sandi Baru',
    'profile.btn_update_info': 'Simpan Perubahan Profil',
    'profile.btn_change_password': 'Perbarui Kata Sandi',
    'profile.active_features': 'Hak Fitur yang Anda Miliki',

    // Statuses
    'status.WAITING_VALIDATION': 'Menunggu Validasi',
    'status.APPROVED': 'Terjadwal',
    'status.CHECKED_IN': 'Di Dalam Pabrik',
    'status.CHECKED_OUT': 'Selesai',
    'status.REJECTED': 'Ditolak',
    'status.CANCELLED': 'Dibatalkan',
    'type.WALK_IN': 'Walk-In',
    'type.PRE_REGISTERED': 'Janji Temu',

    // Form Registration
    'register.title': 'Formulir Kunjungan Tamu',
    'register.subtitle': 'Isi data berikut sebelum memasuki kawasan pabrik. Petugas Security akan memvalidasi kedatangan Anda.',
    'register.badge': 'Pendaftaran Tamu',
    'register.section_guest': 'Data Tamu',
    'register.section_purpose': 'Tujuan Kunjungan',
    'register.section_other': 'Informasi Tambahan',
    'register.full_name': 'Nama Lengkap (sesuai KTP) *',
    'register.phone': 'Nomor WhatsApp *',
    'register.phone_hint': 'Barcode & notifikasi dikirim ke nomor ini.',
    'register.identity_photo': 'Foto Identitas (KTP/SIM/Paspor) *',
    'register.identity_photo_desc': 'Wajib melampirkan foto KTP, SIM, atau Paspor yang jelas.',
    'register.identity_number': 'No. Identitas (KTP/SIM/Paspor)',
    'register.identity_number_hint': '',
    'register.company': 'Perusahaan / Instansi',
    'register.company_placeholder': '',
    'register.identity_placeholder': '',
    'register.department': 'Departemen Tujuan *',
    'register.pic': 'PIC / Orang yang Dituju *',
    'register.purpose': 'Keperluan Kunjungan *',
    'register.purpose_placeholder': '',
    'register.visitors_count': 'Jumlah Orang',
    'register.vehicle_plate': 'Nomor Polisi Kendaraan',
    'register.btn_submit': 'Kirim & Dapatkan Barcode',
    'register.submitting': 'Mengirim formulir…',
    'register.required_tag': 'Wajib Diisi',
    'register.can_edit': 'Dapat Dikoreksi',
    'register.photo_btn_camera': 'Buka Kamera Langsung',
    'register.photo_btn_file': 'Pilih dari File / Galeri',
    'register.photo_hint': 'Foto KTP, SIM, atau Paspor asli yang jelas dan tidak buram.',
    'register.retake_photo': 'Foto Ulang',
    'register.change_file': 'Ganti File',
    'register.delete_photo': 'Hapus',
    'register.ocr_scanning': 'Memindai dan membaca NIK dari foto KTP secara otomatis...',
    'register.ocr_success': 'NIK Terbaca Otomatis:',
    'register.ocr_success_hint': 'Nomor telah otomatis diisikan ke kolom No. Identitas di bawah. Silakan verifikasi/koreksi bila perlu.',
    'register.ocr_warn': 'Foto berhasil disimpan. Silakan periksa dan ketik nomor identitas Anda secara manual.',
    'register.select_dept_placeholder': '— Pilih departemen —',
    'register.select_pic_placeholder': '— Pilih PIC —',
    'register.select_dept_first': '— Pilih departemen terlebih dahulu —',
    'register.loading_pic': 'Memuat PIC…',
    'register.no_active_pic': '— Tidak ada PIC aktif —',
    'register.no_pic_warning': 'Departemen ini belum memiliki PIC aktif. Hubungi petugas Security.',
    'register.success_title': 'Pendaftaran Berhasil',
    'register.success_subtitle': 'Tunjukkan barcode berikut kepada petugas Security di pos gerbang.',
    'register.visit_number_label': 'No. Kunjungan',
    'register.success_note': 'Simpan halaman ini. Barcode juga dikirim ke WhatsApp Anda. Setelah Security memvalidasi, barcode baru untuk keluar akan muncul otomatis di halaman pass.',
    'register.btn_open_pass': 'Buka Halaman Pass',
    'camera.modal_title': 'Arahkan KTP / Identitas',
    'camera.guideline_title': 'KTP / SIM',
    'camera.guideline_pos': 'Posisi Rata',
    'camera.guideline_hint': 'Pastikan tulisan NIK terlihat jelas & tidak silau',
    'camera.btn_cancel': 'Batal',
    'camera.btn_capture': 'Ambil Foto',
    'camera.btn_file': 'Dari File',
    'camera.switch_cam': 'Ganti kamera depan / belakang',

    // Dashboard
    'dashboard.title': 'Dashboard Kunjungan',
    'dashboard.subtitle': 'Ringkasan aktivitas tamu dan operasional pabrik hari ini.',
    'dashboard.today_visitors': 'Tamu Hari Ini',
    'dashboard.inside_plant': 'Di Dalam Pabrik',
    'dashboard.completed_today': 'Selesai Hari Ini',
    'dashboard.waiting_validation': 'Menunggu Validasi',
    'dashboard.recent_activity': 'Aktivitas Kunjungan Terkini',
    'dashboard.btn_quick_register': 'Daftarkan Tamu Pre-Reg',
    'dashboard.btn_scan': 'Buka Scanner Barcode',

    // Visits Page
    'visits.title': 'Data Kunjungan Tamu',
    'visits.subtitle': 'Daftar seluruh tamu pabrik baik walk-in maupun janji temu.',
    'visits.btn_preregister': 'Buat Janji Temu (Pre-Reg)',
    'visits.search_placeholder': 'Cari no. kunjungan, nama tamu, perusahaan...',
    'visits.filter_all_status': 'Semua Status',
    'visits.filter_reset': 'Reset Filter',
    'visits.col_number': 'No. Kunjungan',
    'visits.col_visitor': 'Tamu',
    'visits.col_dept': 'Departemen',
    'visits.col_pic': 'PIC',
    'visits.col_type': 'Tipe',
    'visits.col_status': 'Status',
    'visits.col_in': 'Masuk',
    'visits.col_out': 'Keluar',
    'visits.col_action': 'Aksi',
    'visits.btn_validate': 'Validasi',
    'visits.btn_checkin': 'Check-In',
    'visits.btn_checkout': 'Check-Out',
    'visits.btn_cancel': 'Batalkan',
    'visits.btn_export': 'Unduh Excel (.xlsx)',
    'visits.empty': 'Belum ada data kunjungan yang cocok.',

    // Master Page
    'master.title': 'Master Data',
    'master.subtitle': 'Kelola departemen dan akun pengguna sistem.',
    'master.tab_departments': 'Departemen',
    'master.tab_users': 'Pengguna & PIC',
    'master.btn_add_dept': 'Tambah Departemen',
    'master.btn_add_user': 'Tambah Pengguna',
    'master.col_name': 'Nama',
    'master.col_username': 'Username',
    'master.col_email': 'Email',
    'master.col_role': 'Role',
    'master.col_dept': 'Departemen',
    'master.col_phone': 'WhatsApp',
    'master.col_status': 'Status',
    'master.active': 'Aktif',
    'master.inactive': 'Nonaktif',
    'master.username_hint': 'Digunakan untuk login selain email.',

    // Reports Page
    'reports.title': 'Laporan Kunjungan',
    'reports.subtitle': 'Rekapitulasi data tamu berdasarkan periode dan status.',
    'reports.from_date': 'Dari tanggal',
    'reports.to_date': 'Sampai tanggal',
    'reports.status': 'Status',
    'reports.btn_apply': 'Terapkan Filter',
    'reports.btn_download_excel': 'Unduh Laporan Excel (.xlsx)',
    'reports.stat_total': 'Total Kunjungan',
    'reports.stat_onsite': 'Masih di Dalam',
    'reports.stat_duration': 'Rata-rata Durasi',
    'reports.details': 'Rincian Data',
    'reports.empty': 'Tidak ada data pada periode ini.',

    // Scan Page
    'scan.title': 'Scan Barcode Kunjungan',
    'scan.subtitle': 'Arahkan kamera ke QR Code tamu untuk Check-in atau Check-out.',
    'scan.btn_start': 'Nyalakan Kamera',
    'scan.btn_stop': 'Matikan Kamera',
    'scan.manual_search': 'Cari Manual Nomor Kunjungan',

    // WhatsApp Page
    'wa.title': 'WhatsApp Gateway',
    'wa.subtitle': 'Monitoring koneksi Baileys dan log notifikasi sistem.',
    'wa.status_connected': 'Terhubung',
    'wa.status_disconnected': 'Terputus',
    'wa.btn_reconnect': 'Muat Ulang QR',
    'wa.btn_restart': 'Restart Gateway',
    'wa.btn_logout': 'Putuskan Sesi',
    'wa.test_send': 'Kirim Pesan Uji Coba',
    'wa.logs_title': 'Riwayat Pengiriman Notifikasi',
    'wa.recipients_title': 'Penerima Notifikasi Manajemen'
  },
  en: {
    // Navigation & Shell
    'nav.dashboard': 'Dashboard',
    'nav.scan': 'Scan Barcode',
    'nav.visits': 'Visitor Records',
    'nav.visits_short': 'Visits',
    'nav.she': 'SHE Induction Data',
    'nav.reports': 'Reports',
    'nav.master': 'Master Data',
    'nav.whatsapp': 'WhatsApp Gateway',
    'nav.features': 'Feature Management',
    'nav.profile': 'My Profile',
    'nav.profile_short': 'Profile',
    'nav.logout': 'Sign Out',
    'nav.logout_btn': 'Sign Out',
    'nav.register_guest': 'Guest Registration (Walk-in)',
    'nav.mode_light': 'Light Mode',
    'nav.mode_dark': 'Dark Mode',

    // App Branding
    'app.title': 'PT CEMINDO GEMILANG Tbk',
    'app.subtitle': 'Visitor Management · Batam',
    'app.welcome': 'Welcome',
    'app.install': 'Install App',
    'app.install_prompt': 'Install VMS app on your device for fast, native-like access.',

    // Common Actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.add': 'Add',
    'action.search': 'Search...',
    'action.filter': 'Filter',
    'action.export': 'Download Excel Report (.xlsx)',
    'action.close': 'Close',
    'action.back': 'Back',
    'action.refresh': 'Refresh',
    'action.confirm': 'Confirm',
    'action.apply': 'Apply',
    'action.reset': 'Reset',
    'action.change_photo': 'Change Photo',
    'action.retake_photo': 'Retake Photo',
    'action.open_camera': 'Open Camera Directly',
    'action.choose_file': 'Choose from File / Gallery',

    // Modul Data Induction SHE
    'she.title': 'SHE Induction Data',
    'she.subtitle': 'Safety Induction K3 verification and monitoring dashboard for factory field visitors',
    'she.total_work': 'Total Field Visitors',
    'she.inducted': 'Induction Completed',
    'she.pending_induction': 'Needs Safety Induction',
    'she.active_in_plant': 'Currently Inside Plant',
    'she.today_work': "Today's Field Visitors",
    'she.waiting_entry': 'Waiting Check-In',
    'she.office_today': 'Office Visitors Today',
    'she.headcount_active': 'Active headcount inside plant',
    'she.waiting_desc': 'Scheduled / not checked in',
    'she.office_desc': 'Without physical work (no induction)',
    'she.tab_active': 'Inside Plant',
    'she.tab_pending': 'Needs Induction',
    'she.tab_inducted': 'Inducted',
    'she.tab_today': 'Today',
    'she.tab_waiting': 'Waiting Entry',
    'she.tab_all': 'All History',
    'she.col_visit_no': 'Visit No.',
    'she.col_guest_team': 'Visitor & Team Names',
    'she.col_company': 'Company',
    'she.col_pic_dept': 'PIC & Department',
    'she.col_work_desc': 'Field Work Description',
    'she.col_status': 'Visitor Status',
    'she.col_induction': 'HSE Induction',
    'she.col_action': 'Action',
    'she.btn_settings': 'SHE WA Settings',
    'she.btn_mark_inducted': 'Mark as Inducted',
    'she.btn_mark_pending': 'Revert to Not Inducted',
    'she.btn_inducted_done': 'Inducted',
    'she.btn_finish_induction': 'Finish Induction',
    'she.badge_inducted': 'Induction Completed',
    'she.badge_needs_induction': 'Needs SHE Induction',
    'she.btn_detail_copy': 'Details & Copy',
    'she.btn_send_wa': 'Send WA',
    'she.btn_detail': 'Details',

    // Common Words
    'common.visitors': 'Visitors',
    'common.sessions': 'arrival sessions',
    'common.sessions_done': 'verified sessions',
    'common.sessions_pending': 'uninducted sessions',
    'common.people': 'people',
    'common.status': 'Status',
    'common.in': 'Entry',
    'common.out': 'Exit',

    // Pass & Scan Security
    'pass.checkin_btn': 'CONFIRM CHECK-IN (GUEST ENTRY)',
    'pass.checkout_btn': 'CONFIRM CHECK-OUT (GUEST EXIT)',
    'pass.area_office': 'Office Area',
    'pass.area_plant': 'Plant / Field Area',
    'pass.k3_notice_title': 'Requires SHE Safety Induction',
    'pass.k3_notice_desc': 'Guest has scheduled work in the plant operational area. Please undergo Safety Induction with HSE / SHE Team before starting work.',
    'pass.k3_inducted_title': 'Safety Induction Completed',
    'pass.k3_inducted_desc': 'Guest has been verified and completed Safety Induction with SHE Team.',

    // Auth & Login
    'login.title': 'Sign in to system',
    'login.subtitle': 'Use your registered internal account.',
    'login.identifier_label': 'Email / Username / Phone',
    'login.identifier_placeholder': 'name@cemindo.com, username, or 0812xxxx',
    'login.password_label': 'Password',
    'login.password_placeholder': '••••••••',
    'login.btn_submit': 'Sign In to System',
    'login.submitting': 'Signing in...',
    'login.forgot_password': 'Forgot your account password?',
    'login.guest_prompt': 'Walk-in visitor? Register your arrival here →',
    'login.tab_all': 'Smart (All)',
    'login.tab_email': 'Email',
    'login.tab_username': 'Username',
    'login.tab_phone': 'WhatsApp Phone',

    // Forgot Password
    'forgot.title': 'Reset Password',
    'forgot.desc': 'Enter your registered Email, Username, or WhatsApp number. A 6-digit OTP verification code will be sent to your WhatsApp.',
    'forgot.btn_send_otp': 'Send OTP Code to WhatsApp',
    'forgot.otp_label': '6-Digit OTP Code',
    'forgot.otp_placeholder': '123456',
    'forgot.new_password_label': 'New Password (Min. 6 Chars)',
    'forgot.confirm_password_label': 'Confirm New Password',
    'forgot.btn_verify_reset': 'Verify OTP & Set New Password',
    'forgot.back_to_login': 'Back to Sign In',

    // Profile Page
    'profile.title': 'User Profile',
    'profile.subtitle': 'Manage your personal account details and independently update your password.',
    'profile.info_card': 'Personal Information',
    'profile.name': 'Full Name',
    'profile.username': 'Username',
    'profile.email': 'Email Address',
    'profile.phone': 'WhatsApp Number',
    'profile.role': 'System Role',
    'profile.department': 'Department',
    'profile.security_card': 'Change Password',
    'profile.current_password': 'Current Password',
    'profile.new_password': 'New Password',
    'profile.confirm_password': 'Confirm New Password',
    'profile.btn_update_info': 'Save Profile Changes',
    'profile.btn_change_password': 'Update Password',
    'profile.active_features': 'Your Active System Privileges',

    // Statuses
    'status.WAITING_VALIDATION': 'Waiting Validation',
    'status.APPROVED': 'Scheduled',
    'status.CHECKED_IN': 'Inside Plant',
    'status.CHECKED_OUT': 'Completed',
    'status.REJECTED': 'Rejected',
    'status.CANCELLED': 'Cancelled',
    'type.WALK_IN': 'Walk-In',
    'type.PRE_REGISTERED': 'Pre-Registered',

    // Form Registration
    'register.title': 'Visitor Registration Form',
    'register.subtitle': 'Fill in the form before entering plant premises. Security personnel will validate your visit.',
    'register.badge': 'Visitor Registration',
    'register.section_guest': 'Guest Details',
    'register.section_purpose': 'Visit Purpose',
    'register.section_other': 'Additional Details',
    'register.full_name': 'Full Name (as in ID) *',
    'register.phone': 'WhatsApp Number *',
    'register.phone_hint': 'Pass barcode & notifications will be sent to this number.',
    'register.identity_photo': 'Identity Photo (KTP / Driver License / Passport) *',
    'register.identity_photo_desc': 'Clear original ID photo is required.',
    'register.identity_number': 'Identity Number (NIK / SIM / Passport)',
    'register.identity_number_hint': '',
    'register.company': 'Company / Institution',
    'register.company_placeholder': '',
    'register.identity_placeholder': '',
    'register.department': 'Target Department *',
    'register.pic': 'Host PIC / Visited Person *',
    'register.purpose': 'Visit Purpose *',
    'register.purpose_placeholder': '',
    'register.visitors_count': 'Number of Visitors',
    'register.vehicle_plate': 'Vehicle License Plate',
    'register.btn_submit': 'Submit & Get Visitor Barcode',
    'register.submitting': 'Submitting form…',
    'register.required_tag': 'Required',
    'register.can_edit': 'Editable',
    'register.photo_btn_camera': 'Open Camera Directly',
    'register.photo_btn_file': 'Choose from File / Gallery',
    'register.photo_hint': 'Clear and non-blurry original ID photo.',
    'register.retake_photo': 'Retake Photo',
    'register.change_file': 'Change File',
    'register.delete_photo': 'Delete',
    'register.ocr_scanning': 'Scanning and reading ID number automatically...',
    'register.ocr_success': 'ID Number Detected:',
    'register.ocr_success_hint': 'The number has been automatically filled in below. Please verify or correct if needed.',
    'register.ocr_warn': 'Photo saved. Please check and type your identity number manually.',
    'register.select_dept_placeholder': '— Select department —',
    'register.select_pic_placeholder': '— Select PIC —',
    'register.select_dept_first': '— Select department first —',
    'register.loading_pic': 'Loading PICs…',
    'register.no_active_pic': '— No active PIC —',
    'register.no_pic_warning': 'This department has no active PIC. Please contact Security.',
    'register.success_title': 'Registration Successful',
    'register.success_subtitle': 'Show the following barcode to the Security officer at the gate.',
    'register.visit_number_label': 'Visit Number',
    'register.success_note': 'Save this page. Barcode has also been sent to your WhatsApp. Once Security validates your arrival, a checkout barcode will appear automatically.',
    'register.btn_open_pass': 'Open Visitor Pass',
    'camera.modal_title': 'Align ID Card / Passport',
    'camera.guideline_title': 'ID / Driver License',
    'camera.guideline_pos': 'Keep Level',
    'camera.guideline_hint': 'Ensure ID number is clear & glare-free',
    'camera.btn_cancel': 'Cancel',
    'camera.btn_capture': 'Take Photo',
    'camera.btn_file': 'From File',
    'camera.switch_cam': 'Switch front / rear camera',

    // Dashboard
    'dashboard.title': 'Visits Dashboard',
    'dashboard.subtitle': 'Today’s visitor summary and factory operational activity.',
    'dashboard.today_visitors': "Today's Visitors",
    'dashboard.inside_plant': 'Inside Plant',
    'dashboard.completed_today': 'Completed Today',
    'dashboard.waiting_validation': 'Pending Validation',
    'dashboard.recent_activity': 'Recent Visit Activities',
    'dashboard.btn_quick_register': 'Pre-Register Guest',
    'dashboard.btn_scan': 'Open QR Scanner',

    // Visits Page
    'visits.title': 'Visitor Records',
    'visits.subtitle': 'All factory guests both walk-in and pre-registered.',
    'visits.btn_preregister': 'New Appointment (Pre-Reg)',
    'visits.search_placeholder': 'Search visit no, visitor name, company...',
    'visits.filter_all_status': 'All Statuses',
    'visits.filter_reset': 'Reset Filters',
    'visits.col_number': 'Visit No.',
    'visits.col_visitor': 'Visitor',
    'visits.col_dept': 'Department',
    'visits.col_pic': 'Host PIC',
    'visits.col_type': 'Type',
    'visits.col_status': 'Status',
    'visits.col_in': 'Check-In',
    'visits.col_out': 'Check-Out',
    'visits.col_action': 'Action',
    'visits.btn_validate': 'Validate',
    'visits.btn_checkin': 'Check-In',
    'visits.btn_checkout': 'Check-Out',
    'visits.btn_cancel': 'Cancel',
    'visits.btn_export': 'Download Excel (.xlsx)',
    'visits.empty': 'No matching visits found.',

    // Master Page
    'master.title': 'Master Data',
    'master.subtitle': 'Manage departments and system user accounts.',
    'master.tab_departments': 'Departments',
    'master.tab_users': 'Users & PIC',
    'master.btn_add_dept': 'Add Department',
    'master.btn_add_user': 'Add User',
    'master.col_name': 'Name',
    'master.col_username': 'Username',
    'master.col_email': 'Email',
    'master.col_role': 'Role',
    'master.col_dept': 'Department',
    'master.col_phone': 'WhatsApp',
    'master.col_status': 'Status',
    'master.active': 'Active',
    'master.inactive': 'Inactive',
    'master.username_hint': 'Used for login as alternative to email.',

    // Reports Page
    'reports.title': 'Visit Reports',
    'reports.subtitle': 'Visitor recap based on date period and status.',
    'reports.from_date': 'From Date',
    'reports.to_date': 'To Date',
    'reports.status': 'Status',
    'reports.btn_apply': 'Apply Filter',
    'reports.btn_download_excel': 'Download Excel Report (.xlsx)',
    'reports.stat_total': 'Total Visits',
    'reports.stat_onsite': 'Still Inside',
    'reports.stat_duration': 'Average Duration',
    'reports.details': 'Data Details',
    'reports.empty': 'No data found in this period.',

    // Scan Page
    'scan.title': 'Scan Visitor Pass',
    'scan.subtitle': 'Point camera to guest QR code for Check-in or Check-out.',
    'scan.btn_start': 'Start Camera',
    'scan.btn_stop': 'Stop Camera',
    'scan.manual_search': 'Manual Visit Number Search',

    // WhatsApp Page
    'wa.title': 'WhatsApp Gateway',
    'wa.subtitle': 'Baileys connection monitoring and system notification logs.',
    'wa.status_connected': 'Connected',
    'wa.status_disconnected': 'Disconnected',
    'wa.btn_reconnect': 'Reload QR',
    'wa.btn_restart': 'Restart Gateway',
    'wa.btn_logout': 'Disconnect Session',
    'wa.test_send': 'Send Test Message',
    'wa.logs_title': 'Notification Delivery Logs',
    'wa.recipients_title': 'Management Notification Recipients'
  }
};

const I18nContext = createContext({
  lang: 'id',
  setLang: () => { },
  toggleLang: () => { },
  t: (key, fallback) => fallback || key
});

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('vms_lang') || 'id';
    } catch {
      return 'id';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vms_lang', lang);
    } catch { }
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'id' ? 'en' : 'id'));
  };

  /**
   * Translates a key or fallback phrase.
   * Priority:
   * 1. Exact key match in DICTIONARY[lang]
   * 2. If lang === 'id', return fallback || key
   * 3. Exact phrase match in PHRASE_ID_TO_EN
   * 4. Match in DICTIONARY.id value -> corresponding DICTIONARY.en
   * 5. Smart lexical & word-by-word substitution via LEXICON_ID_TO_EN
   */
  const t = (key, fallback) => {
    if (!key) return '';

    // 1. Cek langsung di kamus eksplisit berdasarkan key
    const currentDict = DICTIONARY[lang] || DICTIONARY.id;
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }

    const textToTranslate = String(fallback || key);

    // Jika bahasa Indonesia (bahasa asal), kembalikan teks aslinya
    if (lang === 'id') {
      return textToTranslate;
    }

    const normalized = textToTranslate.trim().toLowerCase();

    // 2. Cek kamus frasa terpadu (Phrase Matcher)
    if (PHRASE_ID_TO_EN[normalized]) {
      return PHRASE_ID_TO_EN[normalized];
    }

    // 3. Cek apakah fallback string itu sendiri terdaftar sebagai value di kamus bahasa Indonesia
    for (const [k, val] of Object.entries(DICTIONARY.id)) {
      if (val.toLowerCase() === normalized) {
        if (DICTIONARY.en[k]) return DICTIONARY.en[k];
      }
    }

    // 4. Terjemahan leksikal otomatis untuk bahasa Inggris jika belum ada di kamus
    const words = textToTranslate.split(/(\s+|[,.:;?!()\-]+)/);
    const translatedWords = words.map((w) => {
      const lower = w.toLowerCase().trim();
      if (!lower) return w;
      if (LEXICON_ID_TO_EN[lower]) {
        const match = LEXICON_ID_TO_EN[lower];
        if (w[0] === w[0].toUpperCase()) {
          return match.charAt(0).toUpperCase() + match.slice(1);
        }
        return match;
      }
      return w;
    });

    return translatedWords.join('');
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
