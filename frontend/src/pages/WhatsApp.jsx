import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Power,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  QrCode
} from 'lucide-react';
import { endpoints, errMsg, fmtDateTime } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { useDialog } from '../lib/dialog.jsx';

export default function WhatsApp() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { confirm, alert: customAlert } = useDialog();
  const isAdmin = user.role === 'ADMIN';

  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('Tes koneksi WhatsApp dari Visitor Management System.');
  const [testResult, setTestResult] = useState(null);
  const [newRecipient, setNewRecipient] = useState({ name: '', phone: '', title: '' });

  const loadStatus = () =>
    endpoints
      .waStatus()
      .then(setStatus)
      .catch((e) => setError(errMsg(e, 'Gagal memuat status WhatsApp')));

  const loadAll = () => {
    loadStatus();
    endpoints.waLogs().then(setLogs).catch(() => {});
    endpoints.recipients().then(setRecipients).catch(() => {});
  };

  useEffect(() => {
    loadAll();
    const id = setInterval(loadStatus, 6000);
    return () => clearInterval(id);
  }, []);

  const reconnect = async () => {
    setBusy(true);
    setError('');
    try {
      await endpoints.waReconnect();
      await loadStatus();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const hardRestart = async () => {
    const ok = await confirm({
      title: 'Restart Gateway WhatsApp',
      message: 'Restart gateway WhatsApp? Sesi aktif akan ditutup sementara lalu disambung ulang secara otomatis.',
      confirmText: 'Ya, Restart',
      cancelText: 'Batal',
      icon: 'refresh'
    });
    if (!ok) return;

    setBusy(true);
    setError('');
    try {
      await endpoints.waRestart();
      await loadStatus();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    const ok = await confirm({
      title: 'Putuskan Sesi WhatsApp',
      message: 'Putuskan sesi WhatsApp saat ini? Anda harus scan kode QR lagi untuk menyambungkan kembali perangkat.',
      confirmText: 'Ya, Putuskan Sesi',
      cancelText: 'Batal',
      danger: true,
      icon: 'alert'
    });
    if (!ok) return;

    setBusy(true);
    setError('');
    try {
      await endpoints.waLogout();
      await loadStatus();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async (e) => {
    e.preventDefault();
    setBusy(true);
    setTestResult(null);
    try {
      await endpoints.waSendTest({ phone: testPhone, message: testMsg });
      setTestResult({ ok: true, msg: 'Pesan terkirim!' });
      endpoints.waLogs().then(setLogs);
    } catch (err) {
      setTestResult({ ok: false, msg: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const addRecipient = async (e) => {
    e.preventDefault();
    try {
      await endpoints.addRecipient(newRecipient);
      setNewRecipient({ name: '', phone: '', title: '' });
      endpoints.recipients().then(setRecipients);
    } catch (err) {
      customAlert({
        title: 'Gagal Menambah Penerima',
        message: errMsg(err),
        type: 'error'
      });
    }
  };

  const removeRecipient = async (id) => {
    const ok = await confirm({
      title: 'Hapus Penerima Notifikasi',
      message: 'Hapus kontak penerima notifikasi ini dari daftar siaran otomatis?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      danger: true,
      icon: 'trash'
    });
    if (!ok) return;

    try {
      await endpoints.deleteRecipient(id);
      endpoints.recipients().then(setRecipients);
    } catch (err) {
      customAlert({
        title: 'Gagal Menghapus Penerima',
        message: errMsg(err),
        type: 'error'
      });
    }
  };

  const connected = status?.connected;
  const STATUS_LABEL = {
    CONNECTED: 'Terhubung',
    QR: 'Menunggu Scan QR',
    CONNECTING: 'Menghubungkan…',
    DISCONNECTED: 'Terputus'
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t('wa.title', 'WhatsApp Gateway')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('wa.subtitle', 'Koneksi perangkat WhatsApp untuk pengiriman barcode dan notifikasi otomatis.')}
        </p>
      </div>

      {error && <div className="card p-4 text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Status Koneksi</h2>
            <span
              className={`badge border ${
                connected
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50'
                  : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/50'
              }`}
            >
              {connected ? t('wa.status_connected', 'Terhubung') : STATUS_LABEL[status?.status] || 'Memuat'}
            </span>
          </div>

          {connected ? (
            <div className="mt-4 flex items-start gap-2">
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 mt-0.5" size={17} />
              <div>
                <div className="text-sm text-slate-700 dark:text-slate-200">Perangkat aktif</div>
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">{status?.phone || '-'}</div>
              </div>
            </div>
          ) : status?.qrDataUrl ? (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Buka WhatsApp di HP → Perangkat Tertaut → Tautkan Perangkat, lalu scan QR ini.
              </p>
              <div className="inline-block p-2 bg-white rounded-lg border border-slate-200 dark:border-slate-700">
                <img
                  src={status.qrDataUrl}
                  alt="QR WhatsApp"
                  className="mx-auto w-52 h-52 rounded"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                QR diperbarui otomatis setiap ±20 detik.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <AlertCircle className="text-amber-500 mt-0.5 shrink-0" size={16} />
              <p className="text-xs leading-relaxed">
                {status?.lastError
                  ? `Koneksi terputus: ${status.lastError}`
                  : 'Menunggu QR dari server…'}
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                className="btn-ghost flex-1 text-xs py-2.5 px-3 min-h-[42px] rounded-xl font-bold justify-center"
                onClick={connected ? loadStatus : reconnect}
                disabled={busy}
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                {connected ? 'Muat ulang' : t('wa.btn_reconnect', 'Muat ulang QR')}
              </button>

              {!connected && status?.lastError && (
                <button
                  className="btn-ghost text-xs py-2.5 px-3 min-h-[42px] rounded-xl font-bold justify-center"
                  onClick={hardRestart}
                  disabled={busy}
                >
                  <RotateCcw size={15} /> {t('wa.btn_restart', 'Sambung ulang')}
                </button>
              )}

              {connected && (
                <button
                  className="btn-danger text-xs py-2.5 px-4 min-h-[42px] rounded-xl font-bold justify-center"
                  onClick={logout}
                  disabled={busy}
                >
                  <Power size={15} /> {t('wa.btn_logout', 'Putuskan Sesi')}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t('wa.recipients_title', 'Penerima Notifikasi Management')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Nomor-nomor ini menerima laporan setiap tamu masuk dan keluar.
          </p>

          <div className="mt-4 space-y-2">
            {recipients.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 bg-slate-50/50 dark:bg-slate-800/40"
              >
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {r.title ? `${r.title} · ` : ''}
                    {r.phone}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                    onClick={() => removeRecipient(r.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
            {recipients.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-2">Belum ada penerima terdaftar.</p>
            )}
          </div>

          {isAdmin && (
            <form onSubmit={addRecipient} className="mt-4 grid sm:grid-cols-4 gap-2.5">
              <input
                className="input sm:col-span-1"
                placeholder="Nama Lengkap"
                value={newRecipient.name}
                onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="62812xxxxxxx"
                value={newRecipient.phone}
                onChange={(e) => setNewRecipient({ ...newRecipient, phone: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Jabatan"
                value={newRecipient.title}
                onChange={(e) => setNewRecipient({ ...newRecipient, title: e.target.value })}
              />
              <button className="btn-primary py-2.5 min-h-[42px] rounded-xl font-bold justify-center" type="submit">
                <Plus size={16} /> Tambah
              </button>
            </form>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t('wa.test_send', 'Kirim Pesan Uji Coba')}
          </h2>
          <form onSubmit={sendTest} className="mt-3 grid sm:grid-cols-4 gap-2.5">
            <input
              className="input"
              placeholder="Nomor tujuan (0812…)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              required
            />
            <input
              className="input sm:col-span-2"
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
            />
            <button
              className="btn-primary py-2.5 min-h-[42px] rounded-xl font-bold justify-center"
              type="submit"
              disabled={busy}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Kirim
            </button>
          </form>
          {testResult && (
            <p className={`text-xs mt-2 ${testResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {testResult.msg}
            </p>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t('wa.logs_title', 'Riwayat Pengiriman Notifikasi')}
          </h2>
          <button
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline min-h-[32px] px-2"
            onClick={() => endpoints.waLogs().then(setLogs)}
          >
            Muat ulang
          </button>
        </div>

        {/* ================= CARD LIST LOG NOTIFIKASI KHUSUS MOBILE (< md) ================= */}
        <div className="md:hidden p-3 space-y-2.5">
          {logs.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
              Belum ada riwayat pengiriman.
            </div>
          )}
          {logs.map((l) => (
            <div
              key={l.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {l.type}
                </span>
                <span
                  className={`badge border ${
                    l.status === 'SENT'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50'
                      : l.status === 'FAILED'
                      ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/50'
                      : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/50'
                  }`}
                >
                  {l.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">
                    Penerima
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {l.recipient}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">
                    Waktu
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                    {fmtDateTime(l.createdAt)}
                  </span>
                </div>
              </div>

              {(l.error || l.message) && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                  {l.error ? (
                    <span className="text-red-500 font-medium">Error: {l.error}</span>
                  ) : (
                    <span>{l.message?.slice(0, 100)}...</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ================= TABEL DESKTOP (hidden md:block) ================= */}
        <div className="hidden md:block overflow-x-auto max-h-[420px]">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0">
              <tr>
                <th className="th">Waktu</th>
                <th className="th">Tipe</th>
                <th className="th">Penerima</th>
                <th className="th">Status</th>
                <th className="th">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="td text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{fmtDateTime(l.createdAt)}</td>
                  <td className="td text-xs font-mono">{l.type}</td>
                  <td className="td text-xs font-mono">{l.recipient}</td>
                  <td className="td">
                    <span
                      className={`badge border ${
                        l.status === 'SENT'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50'
                          : l.status === 'FAILED'
                          ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/50'
                          : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/50'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="td text-xs text-slate-500 dark:text-slate-400 max-w-[280px] truncate">
                    {l.error || l.message?.slice(0, 80)}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td className="td text-center py-8 text-slate-400 dark:text-slate-500" colSpan={5}>
                    Belum ada riwayat pengiriman.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4 flex gap-3 text-xs text-slate-500 dark:text-slate-400">
        <QrCode size={16} className="shrink-0 mt-0.5 text-slate-400 dark:text-slate-500" />
        <p className="leading-relaxed">
          Notifikasi otomatis dikirim saat tamu check-in (barcode check-out ke tamu, info ke PIC dan
          management) dan saat check-out (konfirmasi ke tamu, PIC, dan management). Pastikan sesi
          WhatsApp selalu terhubung.
        </p>
      </div>
    </div>
  );
}
