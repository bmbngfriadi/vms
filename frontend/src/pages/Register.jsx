import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  QrCode,
  ArrowRight,
  Loader2,
  LogIn,
  Sun,
  Moon,
  Globe,
  User,
  Briefcase,
  FileCheck2,
  Building2,
  Sparkles,
  ShieldCheck,
  Eye,
  RefreshCw
} from 'lucide-react';
import { endpoints, errMsg } from '../lib/api.js';
import IdentityPhotoCapture from '../components/IdentityPhotoCapture.jsx';
import PhotoPreviewModal from '../components/PhotoPreviewModal.jsx';
import { useTheme } from '../lib/theme.jsx';
import { useI18n } from '../lib/i18n.jsx';

const EMPTY = {
  fullName: '',
  phone: '',
  company: '',
  identityNumber: '',
  identityPhoto: '',
  departmentId: '',
  picUserId: '',
  purpose: '',
  numberOfVisitors: 1,
  vehiclePlate: ''
};

export default function Register() {
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const [departments, setDepartments] = useState([]);
  const [pics, setPics] = useState([]);
  const [picsLoading, setPicsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Status auto-lookup tamu berulang (returning visitor)
  const [returningVisitor, setReturningVisitor] = useState(null);
  const [useExistingPhoto, setUseExistingPhoto] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState(false);

  useEffect(() => {
    endpoints
      .publicDepartments()
      .then(setDepartments)
      .catch(() => setError(t('register.error_load_dept', 'Gagal memuat daftar departemen. Periksa koneksi.')));
  }, [t]);

  // Auto-lookup database: jika nama lengkap dan nomor WhatsApp cocok dengan database,
  // tampilkan foto identitas dan data KTP tamu yang tersimpan tanpa perlu foto ulang.
  useEffect(() => {
    const trimmedName = (form.fullName || '').trim().toLowerCase();
    const cleanPhone = (form.phone || '').replace(/\D/g, '');

    if (trimmedName.length < 3 || cleanPhone.length < 8) {
      if (returningVisitor) {
        setReturningVisitor(null);
        setUseExistingPhoto(false);
        setForm((curr) => ({ ...curr, identityPhoto: '' }));
      }
      return;
    }

    const timer = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await endpoints.publicLookupVisitor({
          fullName: form.fullName,
          phone: form.phone
        });

        if (res?.found && res?.visitor?.identityPhoto) {
          setReturningVisitor(res.visitor);
          setUseExistingPhoto(true);
          setForm((curr) => ({
            ...curr,
            identityPhoto: res.visitor.identityPhoto,
            identityNumber: curr.identityNumber || res.visitor.identityNumber || '',
            company: curr.company || res.visitor.company || ''
          }));
        } else {
          // Jika nama atau nomor WA tidak cocok dengan database
          if (returningVisitor) {
            setReturningVisitor(null);
            setUseExistingPhoto(false);
            setForm((curr) => ({
              ...curr,
              identityPhoto: ''
            }));
          }
        }
      } catch (err) {
        console.error('[LookupVisitor Error]', err);
      } finally {
        setLookupLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [form.fullName, form.phone]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const selectDepartment = async (e) => {
    const departmentId = e.target.value;
    setForm((current) => ({ ...current, departmentId, picUserId: '' }));
    setPics([]);
    if (!departmentId) return;
    setPicsLoading(true);
    try {
      setPics(await endpoints.publicPics(departmentId));
    } catch {
      setError(t('register.error_load_pic', 'Gagal memuat daftar PIC. Silakan pilih departemen kembali.'));
    } finally {
      setPicsLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.identityPhoto) {
      setError(t('register.photo_required_alert', 'Foto identitas (KTP/SIM/Paspor) wajib dilampirkan.'));
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const data = await endpoints.publicRegister({
        ...form,
        numberOfVisitors: Number(form.numberOfVisitors) || 1
      });
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errMsg(err, t('register.error_submit', 'Gagal mengirim formulir pendaftaran')));
    } finally {
      setLoading(false);
    }
  };

  // ================= TAMPILAN HASIL REGISTRASI SUKSES (QR PASS) =================
  if (result) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-6 sm:py-10 px-3 sm:px-4 text-slate-800 dark:text-slate-100 transition-colors flex flex-col justify-center items-center">
        <div className="max-w-md w-full mx-auto space-y-4">
          {/* Header Brand */}
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img src="/logo.png" alt="PT Cemindo Gemilang Tbk" className="h-8 w-auto" />
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                PT CEMINDO GEMILANG Tbk
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Plant Batam · {t('register.badge', 'Visitor Pass')}
              </div>
            </div>
          </div>

          <div className="card p-5 sm:p-7 text-center rounded-2xl shadow-md border-slate-200 dark:border-slate-800">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={30} />
            </div>

            <h1 className="mt-4 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {t('register.success_title', 'Pendaftaran Berhasil')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {t('register.success_subtitle', 'Tunjukkan barcode berikut kepada petugas Security di pos gerbang.')}
            </p>

            <div className="mt-5 inline-block p-3.5 bg-white rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <img src={result.qrDataUrl} alt="Barcode kunjungan" className="w-52 h-52 sm:w-60 sm:h-60 mx-auto" />
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                {t('register.visit_number_label', 'No. Kunjungan')}
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                {result.visitNumber}
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 text-left">
              <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-200 leading-relaxed flex items-start gap-1.5">
                <Sparkles size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {t(
                    'register.success_note',
                    'Simpan barcode ini atau periksa gambar barcode yang telah dikirimkan ke WhatsApp Anda. Tunjukkan barcode kepada petugas Security di Pos Utama saat tiba.'
                  )}
                </span>
              </p>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setForm(EMPTY);
                  setReturningVisitor(null);
                  setUseExistingPhoto(false);
                }}
                className="btn-secondary w-full py-3 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center justify-center gap-2"
              >
                <span>← {t('register.btn_register_another', 'Daftarkan Tamu Lain')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= TAMPILAN FORMULIR PENDAFTARAN TAMU =================
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-3 sm:py-6 px-3 sm:px-4 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-2xl mx-auto">
        {/* ================= HEADER BRANDING PROPORSIONAL MOBILE ================= */}
        <header className="mb-3 sm:mb-5 flex items-center justify-between gap-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="bg-white dark:bg-slate-800 p-1 sm:p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img src="/logo.png" alt="PT Cemindo Gemilang Tbk" className="h-7 sm:h-8 w-auto" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                PT Cemindo Gemilang Tbk
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Plant Batam · {t('register.badge', 'Pendaftaran Tamu')}
              </div>
            </div>
          </div>

          {/* Quick Actions (Bahasa, Theme, Login) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleLang}
              className="btn-ghost text-xs px-2 py-1.5 sm:px-2.5 rounded-lg flex items-center gap-1"
              title={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
            >
              <Globe size={13} className="shrink-0" />
              <span className="font-bold text-[11px] sm:text-xs">{lang.toUpperCase()}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="btn-ghost text-xs p-1.5 sm:p-2 rounded-lg"
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
            </button>

            <Link
              to="/login"
              className="btn-ghost text-xs px-2 py-1.5 sm:px-2.5 rounded-lg flex items-center gap-1 text-brand-600 dark:text-brand-400 font-bold hover:text-brand-700"
              title={t('nav.login', 'Masuk')}
            >
              <LogIn size={13} />
              <span className="hidden xs:inline text-[11px] sm:text-xs">{t('nav.login', 'Masuk')}</span>
            </Link>
          </div>
        </header>

        {/* ================= KARTU FORMULIR GAYA NATIVE MOBILE ================= */}
        <div className="card rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Judul Formulir */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {t('register.title', 'Formulir Kunjungan Tamu')}
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {t('register.subtitle', 'Isi data berikut sebelum memasuki kawasan pabrik. Petugas Security akan memvalidasi kedatangan Anda.')}
            </p>
          </div>

          <form onSubmit={submit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* ================= SECTION 1: DATA TAMU ================= */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <User size={15} className="text-brand-500" />
                <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {t('register.section_guest', 'Data Tamu')}
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="label">{t('register.full_name', 'Nama Lengkap (sesuai KTP) *')}</label>
                  <input
                    className="input text-sm py-2.5 px-3 rounded-xl"
                    value={form.fullName}
                    onChange={set('fullName')}
                    placeholder=""
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0">{t('register.phone', 'Nomor WhatsApp *')}</label>
                    {lookupLoading && (
                      <span className="text-[11px] text-brand-600 dark:text-brand-400 flex items-center gap-1 font-medium">
                        <Loader2 size={12} className="animate-spin" />
                        Mengecek data tamu...
                      </span>
                    )}
                    {!lookupLoading && returningVisitor && useExistingPhoto && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck size={13} />
                        Tamu Terdaftar Ditemukan
                      </span>
                    )}
                  </div>
                  <input
                    className="input text-sm py-2.5 px-3 rounded-xl font-mono"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder=""
                    inputMode="tel"
                    required
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {t('register.phone_hint', 'Barcode & notifikasi dikirim ke nomor ini.')}
                  </p>
                </div>

                {/* Kolom Foto Identitas (Otomatis terisi jika tamu berulang dengan Nama & WhatsApp cocok) */}
                <div className="sm:col-span-2">
                  {returningVisitor && useExistingPhoto ? (
                    <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 sm:p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-200">
                            Data Identitas Ditemukan
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                          Tamu Terdaftar
                        </span>
                      </div>

                      <div className="flex items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoModal(true)}
                            className="relative group shrink-0 cursor-pointer overflow-hidden rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-xs"
                            title="Klik untuk melihat foto lebih besar"
                          >
                            <img
                              src={form.identityPhoto || returningVisitor.identityPhoto}
                              alt="Foto Identitas Tersimpan"
                              className="w-16 h-12 sm:w-20 sm:h-14 object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye size={15} />
                            </div>
                          </button>

                          <div className="min-w-0">
                            <p className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white truncate">
                              {form.fullName}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                              {form.identityNumber ? `No. Identitas: ${form.identityNumber}` : 'Foto Identitas Tersedia'}
                            </p>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                              ✓ Foto KTP otomatis digunakan, tidak perlu foto manual lagi
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoModal(true)}
                            className="btn-ghost text-xs p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1"
                            title="Lihat foto"
                          >
                            <Eye size={14} />
                            <span className="hidden sm:inline">Lihat</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUseExistingPhoto(false);
                              setForm((curr) => ({ ...curr, identityPhoto: '' }));
                            }}
                            className="btn-ghost text-xs p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1"
                            title="Foto Ulang atau Ganti Foto"
                          >
                            <RefreshCw size={14} />
                            <span className="hidden sm:inline">Foto Ulang</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {returningVisitor && !useExistingPhoto && (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200">
                          <span>Mengambil / mengunggah foto baru untuk tamu ini.</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUseExistingPhoto(true);
                              setForm((curr) => ({
                                ...curr,
                                identityPhoto: returningVisitor.identityPhoto,
                                identityNumber: curr.identityNumber || returningVisitor.identityNumber || ''
                              }));
                            }}
                            className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
                          >
                            ← Gunakan Foto Tersimpan
                          </button>
                        </div>
                      )}
                      <IdentityPhotoCapture
                        value={form.identityPhoto}
                        onChange={(photo) => setForm((curr) => ({ ...curr, identityPhoto: photo }))}
                        onNikDetected={(detectedNik) => {
                          setForm((curr) => ({
                            ...curr,
                            identityNumber: detectedNik
                          }));
                        }}
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0">
                      {t('register.identity_number', 'No. Identitas (KTP/SIM/Paspor)')}
                    </label>
                    {form.identityNumber && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                        {t('register.can_edit', 'Dapat Dikoreksi')}
                      </span>
                    )}
                  </div>
                  <input
                    className="input font-mono text-sm py-2.5 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50"
                    value={form.identityNumber}
                    onChange={set('identityNumber')}
                    placeholder=""
                  />
                </div>

                <div>
                  <label className="label">{t('register.company', 'Perusahaan / Instansi')}</label>
                  <input
                    className="input text-sm py-2.5 px-3 rounded-xl"
                    value={form.company}
                    onChange={set('company')}
                    placeholder=""
                  />
                </div>
              </div>
            </div>

            {/* ================= SECTION 2: TUJUAN KUNJUNGAN ================= */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <Briefcase size={15} className="text-brand-500" />
                <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {t('register.section_purpose', 'Tujuan Kunjungan')}
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="label">{t('register.department', 'Departemen Tujuan *')}</label>
                  <select
                    className="input text-sm py-2.5 px-3 rounded-xl"
                    value={form.departmentId}
                    onChange={selectDepartment}
                    required
                  >
                    <option value="">{t('register.select_dept_placeholder', '— Pilih departemen —')}</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">{t('register.pic', 'PIC / Orang yang Dituju *')}</label>
                  <select
                    className="input text-sm py-2.5 px-3 rounded-xl"
                    value={form.picUserId}
                    onChange={set('picUserId')}
                    disabled={!form.departmentId || picsLoading}
                    required
                  >
                    <option value="">
                      {!form.departmentId
                        ? t('register.select_dept_first', '— Pilih departemen terlebih dahulu —')
                        : picsLoading
                        ? t('register.loading_pic', 'Memuat PIC…')
                        : pics.length === 0
                        ? t('register.no_active_pic', '— Tidak ada PIC aktif —')
                        : t('register.select_pic_placeholder', '— Pilih PIC —')}
                    </option>
                    {pics.map((pic) => (
                      <option key={pic.id} value={pic.id}>
                        {pic.name}
                      </option>
                    ))}
                  </select>
                  {form.departmentId && !picsLoading && pics.length === 0 && (
                    <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-1">
                      {t('register.no_pic_warning', 'Departemen ini belum memiliki PIC aktif. Hubungi petugas Security.')}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="label">{t('register.purpose', 'Keperluan Kunjungan *')}</label>
                  <textarea
                    className="input min-h-[76px] text-sm py-2.5 px-3 rounded-xl"
                    value={form.purpose}
                    onChange={set('purpose')}
                    placeholder=""
                    required
                  />
                </div>
              </div>
            </div>

            {/* ================= SECTION 3: LAINNYA ================= */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <Building2 size={15} className="text-brand-500" />
                <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {t('register.section_other', 'Informasi Tambahan')}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="label">{t('register.visitors_count', 'Jumlah Orang')}</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="input text-sm py-2.5 px-3 rounded-xl"
                    value={form.numberOfVisitors}
                    onChange={set('numberOfVisitors')}
                  />
                </div>

                <div>
                  <label className="label">{t('register.vehicle_plate', 'Nomor Polisi Kendaraan')}</label>
                  <input
                    className="input text-sm py-2.5 px-3 rounded-xl uppercase font-mono"
                    value={form.vehiclePlate}
                    onChange={set('vehiclePlate')}
                    placeholder=""
                  />
                </div>
              </div>
            </div>

            {/* Kotak Error Alert */}
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Tombol Submit Full Width Gaya Native Mobile */}
            <button
              type="submit"
              className="btn-primary w-full py-3.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-brand-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{t('register.submitting', 'Mengirim formulir…')}</span>
                </>
              ) : (
                <>
                  <FileCheck2 size={18} />
                  <span>{t('register.btn_submit', 'Kirim & Dapatkan Barcode')}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Hak Cipta */}
        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 mt-4 sm:mt-6 pb-4">
          © {new Date().getFullYear()} PT Cemindo Gemilang Tbk — Visitor Management System
        </p>
      </div>

      {/* Modal Preview Foto Identitas KTP */}
      {previewPhotoModal && (
        <PhotoPreviewModal
          photoUrl={form.identityPhoto || returningVisitor?.identityPhoto}
          visitorName={form.fullName}
          identityNumber={form.identityNumber}
          onClose={() => setPreviewPhotoModal(false)}
        />
      )}
    </div>
  );
}
