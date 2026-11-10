import React, { useState, useEffect } from 'react';
import {
  UserRound,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Phone,
  Mail,
  UserCheck,
  Lock
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { endpoints, errMsg } from '../lib/api.js';
import { useI18n } from '../lib/i18n.jsx';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();

  // State profil
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // State ubah password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    try {
      const res = await endpoints.updateProfile({
        name,
        username,
        phone
      });
      await refreshUser();
      setProfileSuccess(res.message || 'Profil berhasil diperbarui');
    } catch (err) {
      setProfileError(errMsg(err, 'Gagal memperbarui profil'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 6) {
      setPassError('Kata sandi baru minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Konfirmasi kata sandi baru tidak cocok');
      return;
    }

    setPassLoading(true);
    try {
      const res = await endpoints.changePassword({
        currentPassword,
        newPassword
      });
      setPassSuccess(res.message || 'Kata sandi berhasil diubah');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(errMsg(err, 'Gagal mengubah kata sandi'));
    } finally {
      setPassLoading(false);
    }
  };

  const featureKeys = Object.entries(user?.features || {}).filter(([_, enabled]) => enabled);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Halaman */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('profile.title', 'Profil Pengguna')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('profile.subtitle', 'Kelola informasi akun Anda dan perbarui kata sandi secara mandiri.')}
        </p>
      </div>

      {/* Kartu Ringkasan Akun */}
      <div className="card p-5 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-brand-500">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
            <UserRound size={28} strokeWidth={2} />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {user?.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              @{user?.username || 'user'} · {user?.email}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="badge bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-900">
                {user?.role}
              </span>
              {user?.department && (
                <span className="badge bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  {user.department.name} ({user.department.code})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ================= FORM 1: INFORMASI PROFIL ================= */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <UserCheck size={18} className="text-brand-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('profile.info_card', 'Informasi Pribadi')}
            </h2>
          </div>

          {profileSuccess && (
            <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle size={15} className="text-red-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="label">{t('profile.name', 'Nama Lengkap')}</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama personel"
                required
              />
            </div>

            <div>
              <label className="label">{t('profile.username', 'Username')}</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username (opsional)"
              />
              <p className="text-[11px] text-slate-400 mt-1">Dapat digunakan sebagai alternatif login.</p>
            </div>

            <div>
              <label className="label">{t('profile.email', 'Alamat Email (Terkunci)')}</label>
              <input
                className="input bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div>
              <label className="label">{t('profile.phone', 'Nomor WhatsApp')}</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
              />
              <p className="text-[11px] text-slate-400 mt-1">Digunakan untuk menerima OTP & notifikasi sistem.</p>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 sm:py-2.5 text-sm font-bold mt-3 rounded-xl min-h-[44px] shadow-sm"
              disabled={profileLoading}
            >
              {profileLoading ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
              <span>{profileLoading ? 'Menyimpan...' : t('profile.btn_update_info', 'Simpan Perubahan Profil')}</span>
            </button>
          </form>
        </div>

        {/* ================= FORM 2: UBAH KATA SANDI ================= */}
        <div className="card p-5 space-y-4 rounded-2xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Lock size={18} className="text-brand-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('profile.security_card', 'Ubah Kata Sandi')}
            </h2>
          </div>

          {passSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          {passError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle size={15} className="text-red-600 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
            <div>
              <label className="label">{t('profile.current_password', 'Kata Sandi Saat Ini')}</label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama"
                required
              />
            </div>

            <div>
              <label className="label">{t('profile.new_password', 'Kata Sandi Baru')}</label>
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
              <label className="label">{t('profile.confirm_password', 'Ulangi Kata Sandi Baru')}</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 sm:py-2.5 text-sm font-bold mt-3 rounded-xl min-h-[44px] shadow-sm"
              disabled={passLoading}
            >
              {passLoading ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
              <span>{passLoading ? 'Menyimpan...' : t('profile.btn_change_password', 'Perbarui Kata Sandi')}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Kartu Hak Akses / Fitur Aktif */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {t('profile.active_features', 'Hak Fitur yang Anda Miliki')}
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Hak akses ini ditentukan oleh peran ({user?.role}) dan konfigurasi khusus oleh Administrator.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {featureKeys.map(([k]) => (
            <span
              key={k}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              ✓ {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

