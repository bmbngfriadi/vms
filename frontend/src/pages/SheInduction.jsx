import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  HardHat,
  Building2,
  Search,
  CheckCircle2,
  Clock,
  Users,
  Loader2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  FileText,
  Phone,
  Settings,
  X,
  Printer
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

// Modal Verifikasi Safety Induction
function InductModal({ visit, onClose, onSuccess }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checks, setChecks] = useState({
    briefing: true,
    evakuasi: true,
    larangan: true,
    helm: true,
    rompi: true,
    sepatu: true
  });

  const toggleCheck = (k) => setChecks((c) => ({ ...c, [k]: !c[k] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const checklistLabels = [];
    if (checks.briefing) checklistLabels.push('Briefing K3 & Bahaya Pabrik');
    if (checks.evakuasi) checklistLabels.push('Jalur & Titik Kumpul Evakuasi');
    if (checks.larangan) checklistLabels.push('Larangan Merokok & Kamera');
    if (checks.helm) checklistLabels.push('Helm Safety');
    if (checks.rompi) checklistLabels.push('Rompi Reflektif');
    if (checks.sepatu) checklistLabels.push('Sepatu Safety');

    try {
      await endpoints.sheInduct(visit.id, {
        notes,
        checklist: checklistLabels
      });
      onSuccess();
    } catch (err) {
      setError(errMsg(err, 'Gagal memproses verifikasi induction'));
    } finally {
      setBusy(false);
    }
  };

  const guests = Array.isArray(visit.guestNames) ? visit.guestNames : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="card w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-6">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-500/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <HardHat size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Verifikasi Safety Induction K3
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pemberian briefing keselamatan sebelum tamu memasuki pabrik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Rincian Tamu */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                {visit.visitNumber}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Wajib Induction
              </span>
            </div>
            <div className="text-xs">
              <span className="text-slate-400 block text-[10px]">Nama Tamu / Rombongan:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {visit.visitorName} ({visit.numberOfVisitors} orang)
              </span>
              <span className="text-slate-500 dark:text-slate-400 block text-xs mt-0.5">
                {visit.company || 'Pribadi'} · PIC: {visit.picName} ({visit.department})
              </span>
            </div>
            {visit.workDescription && (
              <div className="text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Rencana Pekerjaan:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 italic">
                  {visit.workDescription}
                </span>
              </div>
            )}
            {guests.length > 1 && (
              <div className="text-[11px] pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                <span className="font-semibold block mb-0.5">Daftar Anggota Rombongan:</span>
                <div className="space-y-0.5">
                  {guests.map((g, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span>{idx + 1}. {g.name} {g.isLeader ? '(PJ)' : ''}</span>
                      {g.badge && <span className="font-mono text-slate-500">Badge: {g.badge}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Checklist Standar K3 Pabrik */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckSquare size={14} className="text-brand-500" />
              <span>Checklist Kelayakan K3 PT Cemindo Gemilang Tbk:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checks.briefing}
                  onChange={() => toggleCheck('briefing')}
                  className="rounded text-brand-600"
                />
                <span className="text-[11.5px] text-slate-700 dark:text-slate-300 font-medium">
                  Briefing Bahaya & Aturan K3
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checks.evakuasi}
                  onChange={() => toggleCheck('evakuasi')}
                  className="rounded text-brand-600"
                />
                <span className="text-[11.5px] text-slate-700 dark:text-slate-300 font-medium">
                  Titik Kumpul & Alarm Evakuasi
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checks.larangan}
                  onChange={() => toggleCheck('larangan')}
                  className="rounded text-brand-600"
                />
                <span className="text-[11.5px] text-slate-700 dark:text-slate-300 font-medium">
                  Larangan Merokok & No Kamera
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checks.helm}
                  onChange={() => toggleCheck('helm')}
                  className="rounded text-brand-600"
                />
                <span className="text-[11.5px] text-slate-700 dark:text-slate-300 font-medium">
                  Helm Keselamatan (Safety Helmet)
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checks.rompi}
                  onChange={() => toggleCheck('rompi')}
                  className="rounded text-brand-600"
                />
                <span className="text-[11.5px] text-slate-700 dark:text-slate-300 font-medium">
                  Rompi Reflektif (Hi-Vis Vest)
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checks.sepatu}
                  onChange={() => toggleCheck('sepatu')}
                  className="rounded text-brand-600"
                />
                <span className="text-[11.5px] text-slate-700 dark:text-slate-300 font-medium">
                  Sepatu Safety (Steel Toe Shoes)
                </span>
              </label>
            </div>
          </div>

          {/* Catatan Khusus SHE */}
          <div>
            <label className="label text-xs">Catatan Khusus SHE / No. Paspor K3 (Opsional):</label>
            <input
              type="text"
              className="input text-xs"
              placeholder="Contoh: Diberikan induction K3, APD lengkap, didampingi staf maintenance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-ghost text-xs" disabled={busy}>
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5"
              disabled={busy}
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>Verifikasi Selesai Induction</span>
            </button>
          </div>
        </form>
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
      <div className="card w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
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
              placeholder="Contoh: 081234567890 atau pisahkan koma"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Setiap kali tamu pekerjaan pabrik/lapangan check-in di pos security, notifikasi otomatis dikirim ke nomor ini.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Staf / Petugas Terdaftar di Departemen SHE ({officers.length}):
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {officers.map((o) => (
                <div key={o.id} className="text-xs flex justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/60">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{o.name}</span>
                  <span className="font-mono text-slate-500 text-[11px]">{o.phone || 'Belum ada WA'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-ghost text-xs">
              Tutup
            </button>
            <button type="submit" className="btn-primary text-xs font-bold" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SheInduction() {
  const { can } = useAuth();
  const { t } = useI18n();
  const { confirm, alert: customAlert } = useDialog();
  const canInduct = can('she.induction_action');

  const [stats, setStats] = useState({
    waitingInduction: 0,
    inductedToday: 0,
    activeInPlant: 0,
    officeVisitorsToday: 0
  });

  const [tab, setTab] = useState('waiting');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inductingVisit, setInductingVisit] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

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

  const handleReset = async (v) => {
    const ok = await confirm({
      title: 'Reset Status Induction?',
      message: `Kembalikan status kunjungan ${v.visitNumber} (${v.visitorName}) ke status Menunggu Induction?`,
      confirmText: 'Ya, Reset',
      cancelText: 'Batal',
      danger: true
    });
    if (!ok) return;

    try {
      await endpoints.sheReset(v.id);
      loadStats();
      loadVisits();
    } catch (err) {
      customAlert({
        title: 'Gagal Reset',
        message: errMsg(err, 'Gagal mereset status'),
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
              <ShieldAlert size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Safety Induction & Monitoring K3 (SHE)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pusat verifikasi induksi keselamatan tamu area pabrik dan monitoring headcount lapangan
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="btn-ghost text-xs py-2 px-3 rounded-xl min-h-[38px] font-semibold text-slate-700 dark:text-slate-300"
            title="Pengaturan Notifikasi WA Tim SHE"
          >
            <Settings size={15} />
            <span className="hidden sm:inline">Pengaturan WA SHE</span>
          </button>
        </div>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Clock}
          label="Menunggu Induction"
          value={stats.waitingInduction}
          tone="amber"
          subtext="Antrean tamu butuh briefing"
        />
        <StatCard
          icon={ShieldCheck}
          label="Selesai Induction Hari Ini"
          value={stats.inductedToday}
          tone="emerald"
          subtext="Tamu telah diverifikasi K3"
        />
        <StatCard
          icon={HardHat}
          label="Aktif di Area Pabrik"
          value={stats.activeInPlant}
          tone="brand"
          subtext="Live headcount di plant"
        />
        <StatCard
          icon={Building2}
          label="Tamu Office Hari Ini"
          value={stats.officeVisitorsToday}
          tone="slate"
          subtext="Tanpa pekerjaan fisik"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="card p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Tab Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 w-full sm:w-auto">
            <button
              onClick={() => setTab('waiting')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'waiting'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Antrean Menunggu ({stats.waitingInduction})
            </button>
            <button
              onClick={() => setTab('inducted')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'inducted'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Sudah Di-Induksi
            </button>
            <button
              onClick={() => setTab('all')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semua Lapangan
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari tamu / instansi / PIC..."
                className="input pl-8 text-xs py-2 h-9 rounded-xl w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <input
              type="date"
              className="input text-xs py-1.5 h-9 rounded-xl w-36 shrink-0"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              title="Filter per tanggal"
            />
            {date && (
              <button
                onClick={() => setDate('')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
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
              Tidak ada data tamu pada filter ini.
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
                {v.inductionStatus === 'INDUCTED' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/80">
                    Selesai Induction
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/80">
                    Menunggu Induction
                  </span>
                )}
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
                <div className="text-xs p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                  <span className="text-[10px] uppercase font-bold block opacity-75">Pekerjaan Lapangan:</span>
                  <span className="italic">{v.workDescription}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  Status Kunjungan: <StatusBadge status={v.status} />
                </div>
                {v.checkInAt && <div>Masuk: {fmtTime(v.checkInAt)} WIB</div>}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                {v.inductionStatus === 'WAITING_INDUCTION' ? (
                  canInduct && (
                    <button
                      onClick={() => setInductingVisit(v)}
                      className="btn-primary text-xs py-1.5 px-3 rounded-lg font-bold flex items-center gap-1 w-full justify-center"
                    >
                      <HardHat size={14} /> Beri Safety Induction
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="text-[10.5px] text-emerald-600 font-medium">
                      Oleh: {v.inductionBy?.name || 'Petugas SHE'}
                    </span>
                    {canInduct && (
                      <button
                        onClick={() => handleReset(v)}
                        className="text-[10.5px] text-slate-400 hover:text-red-600"
                      >
                        Reset Status
                      </button>
                    )}
                  </div>
                )}
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
                <th className="th">Instansi / Perusahaan</th>
                <th className="th">PIC & Departemen</th>
                <th className="th">Rencana Pekerjaan Lapangan</th>
                <th className="th">Status Tamu</th>
                <th className="th">Status Induction SHE</th>
                <th className="th text-right">Aksi K3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="td text-center py-10 text-slate-400" colSpan={8}>
                    Tidak ada data tamu pada filter ini.
                  </td>
                </tr>
              )}

              {rows.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="td font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                    {v.visitNumber}
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
                    {v.phone && <div className="text-[11px] text-slate-500 font-mono">{v.phone}</div>}
                  </td>
                  <td className="td text-xs text-slate-700 dark:text-slate-300">{v.company || '-'}</td>
                  <td className="td text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{v.picName}</div>
                    <div className="text-[11px] text-slate-500">{v.department}</div>
                  </td>
                  <td className="td text-xs">
                    <div className="max-w-xs text-slate-800 dark:text-slate-200 italic line-clamp-2">
                      {v.workDescription || v.purpose || '-'}
                    </div>
                  </td>
                  <td className="td">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="td">
                    {v.inductionStatus === 'INDUCTED' ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80">
                          <CheckCircle2 size={12} /> Selesai Induction
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Oleh: {v.inductionBy?.name || 'Petugas SHE'}
                          {v.inductionAt && ` · ${fmtTime(v.inductionAt)}`}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200/80">
                        <Clock size={12} /> Menunggu Induction
                      </span>
                    )}
                  </td>
                  <td className="td text-right">
                    {v.inductionStatus === 'WAITING_INDUCTION' ? (
                      canInduct && (
                        <button
                          onClick={() => setInductingVisit(v)}
                          className="btn-primary text-xs py-1.5 px-3 rounded-xl font-bold inline-flex items-center gap-1.5"
                        >
                          <HardHat size={14} /> Beri Induction
                        </button>
                      )
                    ) : (
                      canInduct && (
                        <button
                          onClick={() => handleReset(v)}
                          className="text-xs text-slate-400 hover:text-red-600 transition-colors"
                          title="Reset status induction kembali ke menunggu"
                        >
                          Reset
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Verifikasi Induction */}
      {inductingVisit && (
        <InductModal
          visit={inductingVisit}
          onClose={() => setInductingVisit(null)}
          onSuccess={() => {
            setInductingVisit(null);
            loadStats();
            loadVisits();
          }}
        />
      )}

      {/* Modal Pengaturan WA SHE */}
      {showSettings && <SheSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
