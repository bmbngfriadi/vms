import React, { useCallback, useEffect, useState } from 'react';
import {
  HardHat,
  Building2,
  Search,
  Clock,
  Users,
  Loader2,
  Calendar,
  AlertTriangle,
  FileText,
  Phone,
  Settings,
  X,
  Share2,
  Send,
  Copy,
  Check,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';
import { endpoints, errMsg, fmtDateTime, fmtTime, todayISO } from '../lib/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { useDialog } from '../lib/dialog.jsx';

function StatCard({ icon: Icon, label, value, tone = 'brand', subtext }) {
  const tones = {
    brand: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 border-brand-200/80 dark:border-brand-900/60',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-900/60',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-900/60',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200/80 dark:border-blue-900/60',
    slate: 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800'
  };

  return (
    <div className="card p-4 flex items-center justify-between gap-3 border transition-shadow hover:shadow-xs">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
          {value}
        </div>
        {subtext && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {subtext}
          </div>
        )}
      </div>
      <div className={`p-3 rounded-2xl border shrink-0 ${tones[tone]}`}>
        <Icon size={22} strokeWidth={2.2} />
      </div>
    </div>
  );
}

// Modal Pengaturan WhatsApp SHE
function SheSettingsModal({ onClose }) {
  const [phone, setPhone] = useState('');
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    endpoints
      .sheSettings()
      .then((d) => {
        setPhone(d.notificationPhone || '');
        setOfficers(d.sheOfficers || []);
      })
      .catch((e) => setErr(errMsg(e, 'Gagal memuat pengaturan')))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    setMsg('');

    try {
      await endpoints.sheSaveSettings({ notificationPhone: phone });
      setMsg('Pengaturan notifikasi berhasil disimpan!');
      setTimeout(() => onClose(), 1200);
    } catch (e) {
      setErr(errMsg(e, 'Gagal menyimpan pengaturan'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-brand-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Pengaturan Notifikasi K3 / SHE
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {err && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">{err}</div>}
          {msg && <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs">{msg}</div>}

          <div>
            <label className="label text-xs">
              Nomor WhatsApp Tujuan Notifikasi SHE (Koordinator / Grup WA):
            </label>
            <input
              type="text"
              className="input text-xs"
              placeholder="Contoh: 081234567890 (bisa lebih dari satu, pisahkan koma)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Setiap kali tamu dengan tujuan pekerjaan pabrik check-in di Pos Security, sistem akan otomatis mengirim pemberitahuan WA ke nomor ini agar tim SHE dapat melakukan proses Safety Induction di sistem SHE.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Staf / Petugas Terdaftar di Departemen SHE ({officers.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Otomatis Terkirim</span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {officers.length === 0 ? (
                <div className="text-xs text-slate-400 italic p-2">Belum ada user dengan departemen SHE.</div>
              ) : (
                officers.map((o) => (
                  <div key={o.id} className="text-xs flex justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/60">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{o.name}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{o.phone || 'Belum ada nomor WA'}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-ghost text-xs">
              Tutup
            </button>
            <button type="submit" className="btn-primary text-xs font-bold" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Detail Tamu Pekerjaan & Salin Teks
function GuestDetailModal({ visit, onClose, onResendWa }) {
  const [copied, setCopied] = useState(false);
  const guests = visit.guestNames || [];

  const copyText = () => {
    const lines = [
      `*INFORMASI TAMU PEKERJAAN PABRIK (PERLU INDUCTION SHE)*`,
      `No. Kunjungan: ${visit.visitNumber}`,
      `Instansi: ${visit.company || 'Pribadi'}`,
      `PIC Dituju: ${visit.picName} (${visit.department})`,
      `Rencana Pekerjaan: ${visit.workDescription || visit.purpose || '-'}`,
      `Waktu Masuk: ${visit.checkInAt ? fmtDateTime(visit.checkInAt) : '-'}`,
      `Status: ${visit.status}`,
      ``,
      `*Daftar Nama Tamu & Badge:*`
    ];

    if (guests.length > 0) {
      guests.forEach((g, idx) => {
        lines.push(`${idx + 1}. ${g.name} ${g.isLeader ? '(PJ)' : ''} — Badge: ${g.badge || '-'}`);
      });
    } else {
      lines.push(`1. ${visit.visitorName} — Badge: ${visit.badgeNumber || '-'}`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="card w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardHat size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Detail Tamu Pekerjaan Pabrik
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Header Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                {visit.visitNumber}
              </span>
              <StatusBadge status={visit.status} />
            </div>

            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {visit.visitorName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {visit.company || 'Pribadi'} · {visit.phone || '-'}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs flex justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">PIC Dituju:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {visit.picName} ({visit.department})
                </span>
              </div>
              {visit.checkInAt && (
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Masuk:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {fmtTime(visit.checkInAt)} WIB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Rincian Pekerjaan */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <ShieldAlert size={14} />
              <span>Rincian Pekerjaan Lapangan:</span>
            </div>
            <p className="text-xs text-amber-950 dark:text-amber-100 font-medium leading-relaxed italic">
              {visit.workDescription || visit.purpose || 'Pekerjaan di Area Pabrik / Lapangan'}
            </p>
          </div>

          {/* Daftar Nama Tamu & Badge */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-brand-500" />
                <span>Daftar Seluruh Tamu & Badge ({guests.length > 0 ? guests.length : 1} orang):</span>
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {guests.length > 0 ? (
                guests.map((g, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {g.name} {g.isLeader ? <span className="text-[10px] text-brand-600 font-bold ml-1">(PJ)</span> : ''}
                      </span>
                    </div>
                    <div>
                      {g.badge ? (
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          Badge: {g.badge}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-2.5 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {visit.visitorName} (Penanggung Jawab)
                  </span>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    Badge: {visit.badgeNumber || '-'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <Info size={16} className="shrink-0 mt-0.5" />
            <span>
              Catat dan lakukan modul Safety Induction untuk tamu di atas pada sistem terpisah milik Tim SHE sebelum tamu memulai aktivitas di lapangan.
            </span>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <button
            onClick={() => onResendWa(visit)}
            className="btn-ghost text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium"
            title="Kirim ulang notifikasi WhatsApp ke Tim SHE"
          >
            <Send size={13} />
            <span>Kirim Notif WA SHE</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={copyText}
              className="btn-ghost text-xs py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 font-bold"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Tersalin!' : 'Salin Info'}</span>
            </button>
            <button onClick={onClose} className="btn-primary text-xs py-1.5 px-4 font-bold">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SheInduction() {
  const { can } = useAuth();
  const { t } = useI18n();
  const { alert: customAlert } = useDialog();

  const [stats, setStats] = useState({
    activeInPlant: 0,
    todayWork: 0,
    waitingCheckIn: 0,
    checkedOutToday: 0,
    officeVisitorsToday: 0
  });

  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const loadStats = () => {
    setStatsLoading(true);
    endpoints
      .sheStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  };

  const loadVisits = useCallback(() => {
    setLoading(true);
    endpoints
      .sheVisits({ tab, search: search || undefined, date: date || undefined })
      .then((d) => {
        setRows(d.data || []);
        setError('');
      })
      .catch((e) => setError(errMsg(e, 'Gagal memuat data tamu SHE')))
      .finally(() => setLoading(false));
  }, [tab, search, date]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadVisits, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadVisits, search]);

  const handleResendWa = async (v) => {
    try {
      const res = await endpoints.sheResendWa(v.id);
      customAlert({
        title: 'Notifikasi Terkirim',
        message: res.message || 'Notifikasi WhatsApp berhasil dikirim ke nomor Tim SHE.',
        type: 'success'
      });
    } catch (err) {
      customAlert({
        title: 'Gagal Mengirim Notifikasi',
        message: errMsg(err, 'Gagal mengirim pesan WhatsApp'),
        type: 'error'
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <HardHat size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Informasi Tamu SHE (Pekerjaan Lapangan)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Papan informasi kedatangan tamu pekerjaan pabrik yang butuh Safety Induction oleh Tim SHE
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadStats();
              loadVisits();
            }}
            className="btn-ghost text-xs py-2 px-3 rounded-xl min-h-[38px] font-semibold text-slate-700 dark:text-slate-300"
            title="Segarkan Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="btn-ghost text-xs py-2 px-3 rounded-xl min-h-[38px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
            title="Pengaturan Nomor WhatsApp Tujuan Notifikasi SHE"
          >
            <Settings size={15} />
            <span className="hidden sm:inline">Pengaturan WA SHE</span>
          </button>
        </div>
      </div>


      {/* Kartu Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={HardHat}
          label="Sedang Aktif di Pabrik"
          value={stats.activeInPlant}
          tone="brand"
          subtext="Headcount tamu di lapangan"
        />
        <StatCard
          icon={Calendar}
          label="Tamu Pekerjaan Hari Ini"
          value={stats.todayWork}
          tone="amber"
          subtext="Total sesi pekerjaan hari ini"
        />
        <StatCard
          icon={Clock}
          label="Menunggu Masuk"
          value={stats.waitingCheckIn}
          tone="blue"
          subtext="Terjadwal / belum check-in"
        />
        <StatCard
          icon={Building2}
          label="Tamu Office Hari Ini"
          value={stats.officeVisitorsToday}
          tone="slate"
          subtext="Tanpa pekerjaan fisik (no induction)"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="card p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Tab Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                tab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Sedang di Pabrik ({stats.activeInPlant})
            </button>
            <button
              onClick={() => setTab('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                tab === 'today'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Hari Ini ({stats.todayWork})
            </button>
            <button
              onClick={() => setTab('waiting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                tab === 'waiting'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Menunggu Masuk ({stats.waitingCheckIn})
            </button>
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                tab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semua Riwayat
            </button>
          </div>

          {/* Search & Date Filter */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari tamu / instansi / pekerjaan..."
                className="input pl-9 text-xs py-2 h-9 rounded-xl w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-40 shrink-0">
              <input
                type="date"
                className="input text-xs py-1.5 h-9 rounded-xl w-full"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                title="Filter per tanggal"
              />
            </div>
            {date && (
              <button
                onClick={() => setDate('')}
                className="btn-ghost text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 h-9 text-slate-600 dark:text-slate-300"
                title="Hapus filter tanggal"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="card p-4 text-xs text-red-600 dark:text-red-400">{error}</div>}

      {/* Tabel Data & Card List */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Daftar Tamu Pekerjaan Pabrik ({rows.length} sesi kunjungan)</span>
          {loading && <Loader2 size={14} className="animate-spin text-brand-500" />}
        </div>

        {/* ================= MOBILE VIEW (< md) ================= */}
        <div className="md:hidden p-3 space-y-3">
          {!loading && rows.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              Tidak ada data tamu pekerjaan pada filter ini.
            </div>
          )}

          {rows.map((v) => (
            <div
              key={v.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                  {v.visitNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/80 flex items-center gap-1">
                  <ShieldAlert size={11} /> Perlu Induction SHE
                </span>
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                  <span>{v.visitorName}</span>
                  {v.numberOfVisitors > 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold">
                      +{v.numberOfVisitors - 1} ({v.numberOfVisitors} orang)
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {v.company} · PIC: {v.picName} ({v.department})
                </div>
              </div>

              {v.workDescription && (
                <div className="text-xs p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                  <span className="text-[10px] uppercase font-bold block opacity-75">Pekerjaan Lapangan:</span>
                  <span className="italic">{v.workDescription}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  Status: <StatusBadge status={v.status} />
                </div>
                {v.checkInAt && <div>Masuk: {fmtTime(v.checkInAt)} WIB</div>}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleResendWa(v)}
                  className="btn-ghost text-xs py-1.5 px-2.5 rounded-lg flex items-center gap-1 text-slate-600 dark:text-slate-300"
                  title="Kirim ulang pesan WA ke Tim SHE"
                >
                  <Send size={12} />
                  <span>Kirim WA</span>
                </button>

                <button
                  onClick={() => setSelectedVisit(v)}
                  className="btn-primary text-xs py-1.5 px-3 rounded-lg font-bold flex items-center gap-1"
                >
                  <Info size={13} />
                  <span>Detail & Salin</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ================= DESKTOP VIEW (hidden md:block) ================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10">
              <tr>
                <th className="th">No. Kunjungan</th>
                <th className="th">Nama Tamu & Rombongan</th>
                <th className="th">Instansi</th>
                <th className="th">PIC & Departemen</th>
                <th className="th">Pekerjaan Lapangan</th>
                <th className="th">Status Tamu</th>
                <th className="th">Induction K3</th>
                <th className="th text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="td text-center py-10 text-slate-400" colSpan={8}>
                    Tidak ada data tamu pekerjaan pada filter ini.
                  </td>
                </tr>
              )}

              {rows.map((v) => {
                const guests = v.guestNames || [];
                return (
                  <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="td font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                      <div>{v.visitNumber}</div>
                      {v.checkInAt && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          Masuk: {fmtTime(v.checkInAt)} WIB
                        </div>
                      )}
                    </td>
                    <td className="td">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                        <span>{v.visitorName}</span>
                        {v.numberOfVisitors > 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold">
                            +{v.numberOfVisitors - 1} ({v.numberOfVisitors} orang)
                          </span>
                        )}
                      </div>
                      {/* Daftar Badge per orang jika ada */}
                      {guests.length > 0 ? (
                        <div className="text-[10.5px] text-slate-500 mt-0.5 space-y-0.5">
                          {guests.slice(0, 2).map((g, idx) => (
                            <div key={idx} className="truncate max-w-[200px]">
                              {idx + 1}. {g.name} {g.badge ? `(Badge: ${g.badge})` : ''}
                            </div>
                          ))}
                          {guests.length > 2 && (
                            <div className="text-[10px] text-brand-600 font-semibold">
                              +{guests.length - 2} tamu lainnya (lihat detail)
                            </div>
                          )}
                        </div>
                      ) : (
                        v.badgeNumber && (
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            Badge: {v.badgeNumber}
                          </div>
                        )
                      )}
                    </td>
                    <td className="td text-xs text-slate-700 dark:text-slate-300">{v.company || '-'}</td>
                    <td className="td text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{v.picName}</div>
                      <div className="text-[11px] text-slate-500">{v.department}</div>
                    </td>
                    <td className="td text-xs">
                      <div className="max-w-xs text-slate-800 dark:text-slate-200 italic line-clamp-2" title={v.workDescription || v.purpose}>
                        {v.workDescription || v.purpose || '-'}
                      </div>
                    </td>
                    <td className="td">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="td">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200/80">
                        <ShieldAlert size={12} /> Butuh Induction SHE
                      </span>
                    </td>
                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleResendWa(v)}
                          className="btn-ghost text-xs p-1.5 rounded-lg text-slate-500 hover:text-brand-600"
                          title="Kirim ulang notifikasi WhatsApp ke Tim SHE"
                        >
                          <Send size={14} />
                        </button>
                        <button
                          onClick={() => setSelectedVisit(v)}
                          className="btn-ghost text-xs py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:border-brand-500"
                        >
                          Detail & Salin
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail & Salin Data Tamu */}
      {selectedVisit && (
        <GuestDetailModal
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onResendWa={(v) => handleResendWa(v)}
        />
      )}

      {/* Modal Pengaturan WA SHE */}
      {showSettings && <SheSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
