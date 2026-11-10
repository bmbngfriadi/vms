import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogIn,
  ShieldCheck,
  KeyRound,
  Mail,
  User,
  Phone,
  MessageCircle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Globe,
  Loader2
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { endpoints, errMsg } from '../lib/api.js';
import { useTheme } from '../lib/theme.jsx';
import { useI18n } from '../lib/i18n.jsx';

export default function Login() {
  const { login, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const navigate = useNavigate();

  // Mode: 'login' | 'forgot_otp' | 'reset_password'
  const [view, setView] = useState('login');

  // Login form
  const [loginType, setLoginType] = useState('all'); // 'all' | 'email' | 'username' | 'phone'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password form
  const [forgotId, setForgotId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [phoneHint, setPhoneHint] = useState('');

  if (user) navigate('/', { replace: true });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errMsg(err, t('login.failed', 'Gagal masuk. Periksa akun dan kata sandi Anda.')));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setForgotMsg('');
    setLoading(true);
    try {
      const res = await endpoints.forgotPassword(forgotId);
      setPhoneHint(res.phoneHint || '');
      setForgotMsg(res.message);
      setView('reset_password');
    } catch (err) {
      setError(errMsg(err, 'Gagal mengirim kode OTP ke WhatsApp'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError(t('forgot.password_too_short', 'Kata sandi minimal 6 karakter'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('forgot.password_mismatch', 'Konfirmasi kata sandi tidak cocok'));
      return;
    }

    setLoading(true);
    try {
      const res = await endpoints.resetPassword({
        identifier: forgotId,
        otp,
        newPassword
      });
      alert(res.message || 'Kata sandi berhasil diperbarui.');
      setView('login');
      setIdentifier(forgotId);
      setPassword('');
      setError('');
    } catch (err) {
      setError(errMsg(err, 'Gagal memperbarui kata sandi'));
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    if (loginType === 'email') return 'admin@cemindo.com';
    if (loginType === 'username') return 'admin / security.agus';
    if (loginType === 'phone') return '0812xxxxxxxx';
    return t('login.identifier_placeholder', 'Email, username, atau no. WhatsApp');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Kolom Kiri: Branding Perusahaan Industri */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-500 p-12 relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2 shrink-0 shadow-md">
              <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
            </div>
            <div>
              <div className="text-white font-bold tracking-wide text-sm leading-tight">
                PT CEMINDO GEMILANG Tbk
              </div>
              <div className="text-brand-100 text-xs mt-0.5">Plant Batam · Kepulauan Riau</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            Visitor Management
            <br />
            System
          </h1>
          <p className="text-white/80 text-sm max-w-md leading-relaxed">
            Platform operasional gerbang industri untuk pendaftaran tamu, validasi Security, dan pemantauan
            kunjungan pabrik secara terpadu dan aman.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs text-white/70">
            <ShieldCheck size={16} />
            <span>Sistem Otentikasi Terintegrasi WhatsApp Gateway & Audit Log</span>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-white/60">
          © {new Date().getFullYear()} PT Cemindo Gemilang Tbk — Versi Enterprise
        </div>

        {/* Pola latar belakang industrial halus */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* Kolom Kanan: Form Login / Reset Password */}
      <div className="flex flex-col justify-between p-6 sm:p-10 relative">
        {/* Toggle Bar: Bahasa & Dark/Light Mode di Pojok Kanan Atas */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={toggleLang}
            className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1.5 rounded-md"
            title="Ganti Bahasa (ID / EN)"
          >
            <Globe size={14} />
            <span className="font-bold">{lang === 'id' ? 'ID' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn-ghost text-xs p-2 rounded-md"
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
          >
            {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-600" />}
          </button>
        </div>

        <div className="w-full max-w-sm mx-auto my-auto py-4">
          {/* Mobile Header Logo */}
          <div className="lg:hidden mb-6 text-center">
            <div className="inline-block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 shadow-sm mb-2">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto mx-auto" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">PT CEMINDO GEMILANG Tbk</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Visitor Management · Plant Batam</div>
          </div>

          {/* ================= VIEW 1: FORM LOGIN ================= */}
          {view === 'login' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('login.title', 'Masuk ke sistem')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
                {t('login.subtitle', 'Gunakan akun internal yang telah terdaftar.')}
              </p>

              {/* Tabs Pemilihan Pengenal (Email / Username / No. HP) */}
              <div className="flex p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg mb-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLoginType('all')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    loginType === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {t('login.tab_all', 'Smart')}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('email')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    loginType === 'email'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('username')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    loginType === 'username'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Username
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('phone')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    loginType === 'phone'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  WhatsApp
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label">
                    {loginType === 'email'
                      ? 'Email'
                      : loginType === 'username'
                      ? 'Username'
                      : loginType === 'phone'
                      ? 'Nomor WhatsApp'
                      : t('login.identifier_label', 'Email / Username / No. HP')}
                  </label>
                  <div className="relative">
                    <input
                      type={loginType === 'email' ? 'email' : 'text'}
                      className="input pl-9"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={getPlaceholder()}
                      autoComplete="username"
                      required
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      {loginType === 'email' ? (
                        <Mail size={15} />
                      ) : loginType === 'username' ? (
                        <User size={15} />
                      ) : loginType === 'phone' ? (
                        <Phone size={15} />
                      ) : (
                        <KeyRound size={15} />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">{t('login.password_label', 'Kata Sandi')}</label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot_otp');
                        setForgotId(identifier);
                        setError('');
                      }}
                      className="text-[11px] font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors"
                    >
                      {t('login.forgot_password', 'Lupa kata sandi?')}
                    </button>
                  </div>
                  <input
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.password_placeholder', '••••••••')}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold" disabled={loading}>
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <LogIn size={16} />
                  )}
                  <span>{loading ? t('login.submitting', 'Memproses...') : t('login.btn_submit', 'Masuk ke Sistem')}</span>
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
                <a
                  href="/register"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  {t('login.guest_prompt', 'Tamu? Daftarkan kunjungan Anda di sini →')}
                </a>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: MINTA OTP RESET VIA WA ================= */}
          {view === 'forgot_otp' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <ArrowLeft size={14} /> {t('forgot.back_to_login', 'Kembali ke Halaman Masuk')}
              </button>

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('forgot.title', 'Lupa Kata Sandi')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t(
                    'forgot.desc',
                    'Masukkan Email, Username, atau No. WhatsApp Anda. Kode verifikasi OTP akan dikirimkan langsung ke nomor WhatsApp terdaftar.'
                  )}
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4 pt-2">
                <div>
                  <label className="label">{t('login.identifier_label', 'Email / Username / No. HP')}</label>
                  <input
                    className="input"
                    value={forgotId}
                    onChange={(e) => setForgotId(e.target.value)}
                    placeholder="nama@cemindo.com, username, atau 0812xxxx"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold" disabled={loading}>
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <MessageCircle size={16} />
                  )}
                  <span>{loading ? 'Mengirim OTP...' : t('forgot.btn_send_otp', 'Kirim Kode OTP ke WhatsApp')}</span>
                </button>
              </form>
            </div>
          )}

          {/* ================= VIEW 3: VERIFIKASI OTP & BUAT PASSWORD BARU ================= */}
          {view === 'reset_password' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setView('forgot_otp');
                  setError('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <ArrowLeft size={14} /> Minta Ulang OTP
              </button>

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Verifikasi OTP & Reset Sandi
                </h2>
                {forgotMsg && (
                  <div className="mt-2 p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                    <span>{forgotMsg}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4 pt-1">
                <div>
                  <label className="label">{t('forgot.otp_label', 'Kode OTP 6 Digit')}</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="input font-mono text-center tracking-widest text-lg font-bold"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Periksa pesan WhatsApp yang baru masuk.</p>
                </div>

                <div>
                  <label className="label">{t('forgot.new_password_label', 'Kata Sandi Baru')}</label>
                  <input
                    type="password"
                    className="input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>

                <div>
                  <label className="label">{t('forgot.confirm_password_label', 'Konfirmasi Kata Sandi Baru')}</label>
                  <input
                    type="password"
                    className="input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold" disabled={loading}>
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <KeyRound size={16} />
                  )}
                  <span>{loading ? 'Menyimpan...' : t('forgot.btn_verify_reset', 'Verifikasi & Simpan Sandi')}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 pt-4">
          Visitor Management System · PT Cemindo Gemilang Tbk
        </div>
      </div>
    </div>
  );
}
