import React, { createContext, useContext, useState, useEffect } from 'react';

// Kamus leksikal otomatis untuk kata-kata umum jika kalimat belum terdaftar secara eksplisit
const LEXICON_ID_TO_EN = {
  'masuk': 'login',
  'keluar': 'logout',
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
  'kembali': 'back'
};

const DICTIONARY = {
  id: {
    // Navigation & Shell
    'nav.dashboard': 'Dashboard',
    'nav.scan': 'Scan Barcode',
    'nav.visits': 'Data Kunjungan',
    'nav.visits_short': 'Kunjungan',
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
    'app.title': 'PT CEMINDO GEMILANG',
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
    'register.identity_photo_desc': 'Wajib melampirkan foto KTP, SIM, atau Paspor yang jelas. Sistem akan membaca nomor identitas secara otomatis.',
    'register.identity_number': 'No. Identitas (KTP/SIM/Paspor)',
    'register.identity_number_hint': 'Terbaca otomatis dari foto. Tamu dapat mengoreksi nomor jika diperlukan.',
    'register.company': 'Perusahaan / Instansi',
    'register.company_placeholder': 'PT Contoh / Pribadi',
    'register.identity_placeholder': 'Nomor identitas (otomatis terisi dari foto)',
    'register.department': 'Departemen Tujuan *',
    'register.pic': 'PIC / Orang yang Dituju *',
    'register.purpose': 'Keperluan Kunjungan *',
    'register.purpose_placeholder': 'Contoh: Meeting teknis, pengiriman material, maintenance alat',
    'register.visitors_count': 'Jumlah Orang',
    'register.vehicle_plate': 'Nomor Polisi Kendaraan',
    'register.btn_submit': 'Kirim & Dapatkan Barcode',
    'register.submitting': 'Mengirim formulir…',
    'register.required_tag': 'Wajib Diisi',
    'register.can_edit': 'Dapat Dikoreksi',
    'register.photo_btn_camera': 'Buka Kamera Langsung',
    'register.photo_btn_file': 'Pilih dari File / Galeri',
    'register.photo_hint': 'Foto KTP, SIM, atau Paspor asli yang jelas dan tidak buram. Sistem akan membaca nomor identitas secara otomatis.',
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
    'nav.visits': 'Visit Records',
    'nav.visits_short': 'Visits',
    'nav.reports': 'Reports',
    'nav.master': 'Master Data',
    'nav.whatsapp': 'WhatsApp Gateway',
    'nav.features': 'Feature Matrix',
    'nav.profile': 'My Profile',
    'nav.profile_short': 'Profile',
    'nav.logout': 'Sign Out',
    'nav.logout_btn': 'Sign Out',
    'nav.register_guest': 'Guest Registration (Walk-in)',
    'nav.mode_light': 'Light Mode',
    'nav.mode_dark': 'Dark Mode',

    // App Branding
    'app.title': 'PT CEMINDO GEMILANG',
    'app.subtitle': 'Visitor Management · Batam',
    'app.welcome': 'Welcome',
    'app.install': 'Install Application',
    'app.install_prompt': 'Install the VMS app on your device for fast native-like access.',

    // Common Actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.add': 'Add New',
    'action.search': 'Search...',
    'action.filter': 'Filter',
    'action.export': 'Download Excel (.xlsx)',
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

    // Auth & Login
    'login.title': 'Sign In to System',
    'login.subtitle': 'Use your registered corporate internal credentials.',
    'login.identifier_label': 'Email / Username / Phone Number',
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
    'register.identity_photo_desc': 'Clear original ID photo is required. The system will detect your identity number automatically.',
    'register.identity_number': 'Identity Number (NIK / SIM / Passport)',
    'register.identity_number_hint': 'Auto-scanned from photo. Guests can edit or correct the number if needed.',
    'register.company': 'Company / Institution',
    'register.company_placeholder': 'e.g. PT Acme / Personal',
    'register.identity_placeholder': 'Identity number (auto-filled from photo)',
    'register.department': 'Target Department *',
    'register.pic': 'Host PIC / Visited Person *',
    'register.purpose': 'Visit Purpose *',
    'register.purpose_placeholder': 'e.g. Technical meeting, goods delivery, machine maintenance',
    'register.visitors_count': 'Number of Visitors',
    'register.vehicle_plate': 'Vehicle License Plate',
    'register.btn_submit': 'Submit & Get Visitor Barcode',
    'register.submitting': 'Submitting form…',
    'register.required_tag': 'Required',
    'register.can_edit': 'Editable',
    'register.photo_btn_camera': 'Open Camera Directly',
    'register.photo_btn_file': 'Choose from File / Gallery',
    'register.photo_hint': 'Clear and non-blurry original ID photo. The system will detect your identity number automatically.',
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
  setLang: () => {},
  toggleLang: () => {},
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
    } catch {}
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'id' ? 'en' : 'id'));
  };

  /**
   * Translates a key or fallback phrase.
   * If a key is not directly in the dictionary, checks whether the string itself
   * matches a known phrase, or uses lexical translation so that
   * ANY newly added feature or page automatically translates!
   */
  const t = (key, fallback) => {
    if (!key) return '';

    // 1. Cek langsung di kamus eksplisit berdasarkan key
    const currentDict = DICTIONARY[lang] || DICTIONARY.id;
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }

    const textToTranslate = fallback || key;

    // Jika bahasa Indonesia (bahasa asal), kembalikan teks aslinya
    if (lang === 'id') {
      return textToTranslate;
    }

    // Cek apakah fallback string itu sendiri terdaftar sebagai key atau value di kamus
    for (const [k, val] of Object.entries(DICTIONARY.id)) {
      if (val.toLowerCase() === textToTranslate.toLowerCase()) {
        if (DICTIONARY.en[k]) return DICTIONARY.en[k];
      }
    }

    // 2. Terjemahan leksikal otomatis untuk bahasa Inggris jika belum ada di kamus
    const words = String(textToTranslate).split(/(\s+|[,.:;?!()\-]+)/);
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
