import React, { createContext, useContext, useState, useEffect } from 'react';

// Kamus leksikal otomatis untuk kata-kata umum jika key baru belum terdaftar secara eksplisit
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
  'menunggu': 'waiting',
  'disetujui': 'approved',
  'ditolak': 'rejected',
  'dibatalkan': 'cancelled',
  'fitur': 'features',
  'pengguna': 'users',
  'selesai': 'done'
};

const DICTIONARY = {
  id: {
    // Navigation & Shell
    'nav.dashboard': 'Dashboard',
    'nav.scan': 'Scan Barcode',
    'nav.visits': 'Data Kunjungan',
    'nav.reports': 'Laporan',
    'nav.master': 'Master Data',
    'nav.whatsapp': 'WhatsApp Gateway',
    'nav.features': 'Manajemen Fitur',
    'nav.profile': 'Profil Saya',
    'nav.logout': 'Keluar Sistem',
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
    'action.export': 'Ekspor Excel / CSV',
    'action.close': 'Tutup',
    'action.back': 'Kembali',
    'action.refresh': 'Segarkan',
    'action.confirm': 'Konfirmasi',
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
    'status.APPROVED': 'Disetujui',
    'status.CHECKED_IN': 'Checked In (Di Pabrik)',
    'status.CHECKED_OUT': 'Checked Out (Keluar)',
    'status.REJECTED': 'Ditolak',
    'status.CANCELLED': 'Dibatalkan',

    // Form Registration
    'register.title': 'Formulir Kunjungan Tamu',
    'register.subtitle': 'Isi data berikut sebelum memasuki kawasan pabrik. Petugas Security akan memvalidasi kedatangan Anda.',
    'register.full_name': 'Nama Lengkap (sesuai KTP) *',
    'register.phone': 'Nomor WhatsApp *',
    'register.phone_hint': 'Barcode & notifikasi dikirim ke nomor ini.',
    'register.identity_photo': 'Foto Identitas (KTP/SIM/Paspor) *',
    'register.identity_photo_desc': 'Wajib melampirkan foto KTP, SIM, atau Paspor yang jelas. Sistem akan membaca nomor identitas secara otomatis.',
    'register.identity_number': 'No. Identitas (KTP/SIM/Paspor)',
    'register.identity_number_hint': 'Terbaca otomatis dari foto. Anda dapat mengoreksi nomor jika diperlukan.',
    'register.company': 'Perusahaan / Instansi',
    'register.department': 'Departemen Tujuan *',
    'register.pic': 'PIC / Orang yang Dituju *',
    'register.purpose': 'Keperluan Kunjungan *',
    'register.visitors_count': 'Jumlah Orang',
    'register.vehicle_plate': 'Nomor Polisi Kendaraan',
    'register.btn_submit': 'Kirim & Dapatkan Barcode'
  },
  en: {
    // Navigation & Shell
    'nav.dashboard': 'Dashboard',
    'nav.scan': 'Scan Barcode',
    'nav.visits': 'Visit Records',
    'nav.reports': 'Reports',
    'nav.master': 'Master Data',
    'nav.whatsapp': 'WhatsApp Gateway',
    'nav.features': 'Feature Matrix',
    'nav.profile': 'My Profile',
    'nav.logout': 'Sign Out',
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
    'action.export': 'Export Excel / CSV',
    'action.close': 'Close',
    'action.back': 'Back',
    'action.refresh': 'Refresh',
    'action.confirm': 'Confirm',
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
    'status.APPROVED': 'Approved',
    'status.CHECKED_IN': 'Checked In (On Site)',
    'status.CHECKED_OUT': 'Checked Out (Departed)',
    'status.REJECTED': 'Rejected',
    'status.CANCELLED': 'Cancelled',

    // Form Registration
    'register.title': 'Visitor Registration Form',
    'register.subtitle': 'Fill in the form before entering plant premises. Security personnel will validate your visit.',
    'register.full_name': 'Full Name (as in ID) *',
    'register.phone': 'WhatsApp Number *',
    'register.phone_hint': 'Pass barcode & arrival notifications will be sent to this number.',
    'register.identity_photo': 'Identity Photo (KTP / Driver License / Passport) *',
    'register.identity_photo_desc': 'Clear photo is required. The system automatically scans your identity number.',
    'register.identity_number': 'Identity Number (NIK / SIM / Passport)',
    'register.identity_number_hint': 'Auto-scanned from photo. You may verify and edit if needed.',
    'register.company': 'Company / Institution',
    'register.department': 'Target Department *',
    'register.pic': 'Host PIC / Visited Person *',
    'register.purpose': 'Visit Purpose *',
    'register.visitors_count': 'Number of Visitors',
    'register.vehicle_plate': 'Vehicle License Plate',
    'register.btn_submit': 'Submit & Get Visitor Pass'
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
   * If a key or string is not yet explicitly in the dictionary,
   * it automatically uses intelligent lexical translation so that
   * ANY newly added feature or page automatically translates!
   */
  const t = (key, fallback) => {
    if (!key) return '';

    // 1. Cek langsung di kamus eksplisit
    const currentDict = DICTIONARY[lang] || DICTIONARY.id;
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }

    const textToTranslate = fallback || key;

    // Jika bahasa Indonesia (bahasa asal), kembalikan teks aslinya
    if (lang === 'id') {
      return textToTranslate;
    }

    // 2. Terjemahan leksikal otomatis untuk bahasa Inggris jika belum ada di kamus
    // Memecah kata-kata dan mencocokkan leksikon
    const words = String(textToTranslate).split(/(\s+|[,.:;?!()\-]+)/);
    const translatedWords = words.map((w) => {
      const lower = w.toLowerCase().trim();
      if (!lower) return w;
      if (LEXICON_ID_TO_EN[lower]) {
        // Pertahankan huruf kapital awal jika ada
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

