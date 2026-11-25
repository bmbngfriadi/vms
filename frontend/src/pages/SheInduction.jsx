import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
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
  CheckCircle2,
  ShieldCheck,
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

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-10 card w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
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
    </div>,
    document.body
  );
}

// Modal Detail Tamu Pekerjaan & Salin Teks
function GuestDetailModal({ visit, onClose, onResendWa, onToggleInduction }) {
  const [copied, setCopied] = useState(false);
  const [updatingInduction, setUpdatingInduction] = useState(false);
  const guests = visit.guestNames || [];

  const copyText = () => {
    const isInductedText = visit.inductionStatus === 'COMPLETED' ? 'Sudah di Induction' : 'Butuh Induction SHE';
    const lines = [
      `*INFORMASI TAMU PEKERJAAN PABRIK*`,
      `No. Kunjungan: ${visit.visitNumber}`,
      `Instansi: ${visit.company || 'Pribadi'}`,
      `PIC Dituju: ${visit.picName} (${visit.department})`,
      `Rencana Pekerjaan: ${visit.workDescription || visit.purpose || '-'}`,
      `Waktu Masuk: ${visit.checkInAt ? fmtDateTime(visit.checkInAt) : '-'}`,
      `Status Kunjungan: ${visit.status}`,
      `Status Induction K3: ${isInductedText}`,
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

  const handleInductionAction = async (targetStatus) => {
    setUpdatingInduction(true);
    try {
      await onToggleInduction(visit, targetStatus);
    } finally {
      setUpdatingInduction(false);
    }
  };

  const isInducted = visit.inductionStatus === 'COMPLETED';

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      {/* Click backdrop to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
              <HardHat size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Detail Tamu Pekerjaan Pabrik
              </h2>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                PT Cemindo Gemilang Tbk · Informasi K3 & Safety Induction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Konten Scrollable Modal */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Card Info Utama Kunjungan (Grid 2 Kolom) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs sm:text-sm font-bold text-brand-600 dark:text-brand-400">
                  {visit.visitNumber}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase">
                  {visit.visitType || 'WALK_IN'}
                </span>
              </div>
              <StatusBadge status={visit.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <span className="text-slate-400 text-[10.5px] uppercase font-bold block mb-0.5">
                  Nama Penanggung Jawab:
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {visit.visitorName}
                </span>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {visit.company || 'Pribadi'} · {visit.phone || '-'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10.5px] uppercase font-bold block mb-0.5">
                  PIC & Departemen Dituju:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {visit.picName}
                </span>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Departemen: {visit.department}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-400 text-[10.5px] uppercase font-bold block mb-0.5">
                  Waktu Kedatangan (Masuk):
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {visit.checkInAt ? `${fmtDateTime(visit.checkInAt)} WIB` : 'Belum Check-In'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-400 text-[10.5px] uppercase font-bold block mb-0.5">
                  Waktu Kepulangan (Keluar):
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {visit.checkOutAt ? `${fmtDateTime(visit.checkOutAt)} WIB` : 'Masih Berada di Kawasan Pabrik'}
                </span>
              </div>
            </div>
          </div>

          {/* Rincian Pekerjaan Lapangan */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <ShieldAlert size={15} />
              <span>Rincian Pekerjaan di Area Pabrik / Lapangan:</span>
            </div>
            <p className="text-xs sm:text-[13px] text-amber-950 dark:text-amber-100 font-medium leading-relaxed italic bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
              {visit.workDescription || visit.purpose || 'Pekerjaan di Area Pabrik / Lapangan'}
            </p>
          </div>

          {/* Card Status Safety Induction K3 (Interaktif) */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isInducted
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Status Pelaksanaan Safety Induction:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {isInducted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                      <CheckCircle2 size={14} /> Sudah di Induction
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                      <ShieldAlert size={14} /> Butuh Induction SHE
                    </span>
                  )}
                  {isInducted && visit.inductionAt && (
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                      ({fmtDateTime(visit.inductionAt)})
                    </span>
                  )}
                </div>
                {isInducted && visit.inductionByName && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Diverifikasi oleh: <b>{visit.inductionByName}</b>
                  </p>
                )}
              </div>

              {/* Action Button Induction */}
              <div>
                {isInducted ? (
                  <button
                    type="button"
                    disabled={updatingInduction}
                    onClick={() => handleInductionAction('PENDING')}
                    className="btn-ghost text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-1.5"
                  >
                    {updatingInduction ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    <span>Ubah ke Belum Induction</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updatingInduction}
                    onClick={() => handleInductionAction('COMPLETED')}
                    className="btn-success text-xs py-2 px-4 rounded-xl font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all min-h-[38px]"
                  >
                    {updatingInduction ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    <span>Tandai Sudah di Induction</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Daftar Nama Tamu & Badge */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users size={15} className="text-brand-500" />
                <span>Daftar Seluruh Tamu & Badge ({guests.length > 0 ? guests.length : 1} orang):</span>
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              {guests.length > 0 ? (
                guests.map((g, idx) => (
                  <div key={idx} className="p-2.5 sm:p-3 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                        {g.name} {g.isLeader ? <span className="text-[10px] bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold px-1.5 py-0.5 rounded ml-1">Penanggung Jawab</span> : ''}
                      </span>
                    </div>
                    <div>
                      {g.badge ? (
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-brand-700 dark:text-brand-300 border border-slate-200 dark:border-slate-700">
                          Badge: {g.badge}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {visit.visitorName} (Penanggung Jawab)
                  </span>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-brand-700 dark:text-brand-300 border border-slate-200 dark:border-slate-700">
                    Badge: {visit.badgeNumber || '-'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
            <span>
              Catat dan lakukan modul Safety Induction untuk tamu di atas pada sistem terpisah milik Tim SHE sebelum tamu memulai aktivitas di lapangan.
            </span>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={() => onResendWa(visit)}
            className="btn-ghost text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold"
            title="Kirim ulang notifikasi WhatsApp ke Tim SHE"
          >
            <Send size={13} />
            <span>Kirim Notif WA SHE</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyText}
              className="btn-ghost text-xs py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 font-bold"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Tersalin!' : 'Salin Info'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary text-xs py-2 px-5 rounded-xl font-bold"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function SheInduction() {
  const { can } = useAuth();
  const { t } = useI18n();
  const { alert: customAlert } = useDialog();
  const [searchParams] = useSearchParams();

  const querySearch = searchParams.get('search') || searchParams.get('visit') || searchParams.get('v') || '';
  const queryTab = searchParams.get('tab') || (querySearch ? 'all' : 'active');

  const [stats, setStats] = useState({
    activeInPlant: 0,
    todayWork: 0,
    waitingCheckIn: 0,
    checkedOutToday: 0,
    officeVisitorsToday: 0,
    totalWorkVisitors: 0,
    totalWorkSessions: 0,
    totalInductedVisitors: 0,
    totalInductedSessions: 0,
    totalPendingVisitors: 0,
    totalPendingSessions: 0
  });

  const [tab, setTab] = useState(queryTab);
  const [search, setSearch] = useState(querySearch);
  const [date, setDate] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  const loadStats = () => {
    setStatsLoading(true);
    endpoints
      .sheStats()
      .then(setStats)
      .catch(() => { })
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

  // Otomatis buka modal detail kunjungan jika dibuka via tautan notifikasi WA
  useEffect(() => {
    if (querySearch && !hasAutoOpened && rows.length > 0) {
      const match = rows.find(
        (r) =>
          r.visitNumber?.toLowerCase() === querySearch.toLowerCase() ||
          r.visitorName?.toLowerCase().includes(querySearch.toLowerCase())
      );
      if (match) {
        setSelectedVisit(match);
        setHasAutoOpened(true);
      }
    }
  }, [querySearch, rows, hasAutoOpened]);

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

  const handleToggleInduction = async (visit, targetStatus) => {
    try {
      const res = await endpoints.sheUpdateInduction(visit.id, { status: targetStatus });
      setRows((prev) =>
        prev.map((r) => (r.id === visit.id ? { ...r, ...res.visit } : r))
      );
      if (selectedVisit && selectedVisit.id === visit.id) {
        setSelectedVisit((prev) => ({ ...prev, ...res.visit }));
      }
      loadStats();
      customAlert({
        title: targetStatus === 'COMPLETED' ? 'Induction Selesai' : 'Status Diperbarui',
        message: res.message || 'Status Safety Induction berhasil diperbarui.',
        type: 'success'
      });
    } catch (err) {
      customAlert({
        title: 'Gagal Memperbarui Status',
        message: errMsg(err, 'Gagal mengubah status induction K3'),
        type: 'error'
      });
    }
  };

  const totalPeopleInRows = rows.reduce((acc, r) => acc + (r.numberOfVisitors || 1), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs">
              <HardHat size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {t('she.title', 'Data Induction SHE')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('she.subtitle', 'Papan pemantauan dan verifikasi Safety Induction K3 bagi tamu pekerjaan pabrik')}
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
            className="btn-ghost text-xs py-2 px-3 rounded-xl min-h-[38px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
            title={t('action.refresh', 'Segarkan Data')}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{t('action.refresh', 'Refresh')}</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="btn-ghost text-xs py-2 px-3 rounded-xl min-h-[38px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
            title="Pengaturan Nomor WhatsApp Tujuan Notifikasi SHE"
          >
            <Settings size={15} />
            <span className="hidden sm:inline">{t('she.btn_settings', 'Pengaturan WA SHE')}</span>
          </button>
        </div>
      </div>

      {/* Kartu Statistik Lengkap */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          icon={Users}
          label={t('she.total_work', 'Total Tamu Pekerjaan')}
          value={`${stats.totalWorkVisitors || 0} ${t('common.visitors', 'Tamu')}`}
          tone="brand"
          subtext={`${stats.totalWorkSessions || 0} ${t('common.sessions', 'sesi kedatangan')}`}
        />
        <StatCard
          icon={CheckCircle2}
          label={t('she.inducted', 'Sudah di Induction')}
          value={`${stats.totalInductedVisitors || 0} ${t('common.visitors', 'Tamu')}`}
          tone="emerald"
          subtext={`${stats.totalInductedSessions || 0} ${t('common.sessions_done', 'sesi selesai')}`}
        />
        <StatCard
          icon={ShieldAlert}
          label={t('she.pending_induction', 'Butuh di Induction')}
          value={`${stats.totalPendingVisitors || 0} ${t('common.visitors', 'Tamu')}`}
          tone="amber"
          subtext={`${stats.totalPendingSessions || 0} ${t('common.sessions_pending', 'sesi belum induction')}`}
        />
        <StatCard
          icon={HardHat}
          label={t('she.active_in_plant', 'Sedang Aktif di Pabrik')}
          value={`${stats.activeInPlant || 0} ${t('common.visitors', 'Tamu')}`}
          tone="blue"
          subtext={t('she.headcount_active', 'Headcount di lapangan')}
        />
        <StatCard
          icon={Clock}
          label={t('she.waiting_entry', 'Menunggu Masuk')}
          value={`${stats.waitingCheckIn || 0} ${t('common.visitors', 'Tamu')}`}
          tone="slate"
          subtext={t('she.waiting_desc', 'Terjadwal / belum check-in')}
        />
        <StatCard
          icon={Building2}
          label={t('she.office_today', 'Tamu Office Hari Ini')}
          value={`${stats.officeVisitorsToday || 0} ${t('common.visitors', 'Tamu')}`}
          tone="slate"
          subtext={t('she.office_desc', 'Tanpa pekerjaan fisik')}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="card p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Tab Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${tab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              {t('she.tab_active', 'Sedang di Pabrik')} ({stats.activeInPlant})
            </button>
            <button
              onClick={() => setTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${tab === 'pending'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              {t('she.tab_pending', 'Butuh Induction')} ({stats.totalPendingSessions || 0})
            </button>
            <button
              onClick={() => setTab('inducted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${tab === 'inducted'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              {t('she.tab_inducted', 'Sudah Induction')} ({stats.totalInductedSessions || 0})
            </button>
            <button
              onClick={() => setTab('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${tab === 'today'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              {t('she.tab_today', 'Hari Ini')} ({stats.todayWork})
            </button>
            <button
              onClick={() => setTab('waiting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${tab === 'waiting'
                  ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              {t('she.tab_waiting', 'Menunggu Masuk')} ({stats.waitingCheckIn})
            </button>
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${tab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              {t('she.tab_all', 'Semua Riwayat')}
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
          <span>Daftar Tamu Pekerjaan Pabrik ({rows.length} sesi kunjungan · Total {totalPeopleInRows} Tamu)</span>
          {loading && <Loader2 size={14} className="animate-spin text-brand-500" />}
        </div>

        {/* ================= MOBILE VIEW (< md) ================= */}
        <div className="md:hidden p-3 space-y-3">
          {!loading && rows.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              Tidak ada data tamu pekerjaan pada filter ini.
            </div>
          )}

          {rows.map((v) => {
            const isInducted = v.inductionStatus === 'COMPLETED';
            return (
              <div
                key={v.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                    {v.visitNumber}
                  </span>
                  {isInducted ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/80 flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-emerald-600" /> {t('she.badge_inducted', 'Sudah di Induction')}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/80 flex items-center gap-1">
                      <ShieldAlert size={11} /> {t('she.badge_needs_induction', 'Butuh Induction SHE')}
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>{v.visitorName}</span>
                    {v.numberOfVisitors > 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold">
                        +{v.numberOfVisitors - 1} ({v.numberOfVisitors} {t('common.people', 'orang')})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {v.company} · PIC: {v.picName} ({v.department})
                  </div>
                </div>

                {v.workDescription && (
                  <div className="text-xs p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                    <span className="text-[10px] uppercase font-bold block opacity-75">{t('she.col_work_desc', 'Pekerjaan Lapangan')}:</span>
                    <span className="italic">{v.workDescription}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    {t('common.status', 'Status')}: <StatusBadge status={v.status} />
                  </div>
                  {v.checkInAt && <div>{t('common.in', 'Masuk')}: {fmtTime(v.checkInAt)} WIB</div>}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleResendWa(v)}
                      className="btn-ghost text-xs py-1.5 px-2.5 rounded-lg flex items-center gap-1 text-slate-600 dark:text-slate-300"
                      title="Kirim ulang pesan WA ke Tim SHE"
                    >
                      <Send size={12} />
                      <span>{t('she.btn_send_wa', 'Kirim WA')}</span>
                    </button>
                    <button
                      onClick={() => setSelectedVisit(v)}
                      className="btn-ghost text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1"
                    >
                      <Info size={13} />
                      <span>{t('she.btn_detail', 'Detail')}</span>
                    </button>
                  </div>

                  <div>
                    {isInducted ? (
                      <button
                        onClick={() => handleToggleInduction(v, 'PENDING')}
                        className="btn-ghost text-xs py-1.5 px-2 rounded-lg text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1"
                        title="Klik untuk membatalkan status induction"
                      >
                        <Check size={12} strokeWidth={2.5} />
                        <span>{t('she.btn_inducted_done', 'Sudah Induction')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleInduction(v, 'COMPLETED')}
                        className="btn-success text-xs py-1.5 px-3 rounded-lg font-bold flex items-center gap-1 shadow-2xs"
                        title="Tandai tamu ini sudah di-induction K3"
                      >
                        <CheckCircle2 size={13} />
                        <span>{t('she.btn_finish_induction', 'Induction Selesai')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= DESKTOP VIEW (hidden md:block) ================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10">
              <tr>
                <th className="th">{t('she.col_visit_no', 'No. Kunjungan')}</th>
                <th className="th">{t('she.col_guest_team', 'Nama Tamu & Rombongan')}</th>
                <th className="th">{t('she.col_company', 'Instansi')}</th>
                <th className="th">{t('she.col_pic_dept', 'PIC & Departemen')}</th>
                <th className="th">{t('she.col_work_desc', 'Pekerjaan Lapangan')}</th>
                <th className="th">{t('she.col_status', 'Status Tamu')}</th>
                <th className="th">{t('she.col_induction', 'Induction K3')}</th>
                <th className="th text-right">{t('she.col_action', 'Aksi')}</th>
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
                const isInducted = v.inductionStatus === 'COMPLETED';

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
                      {isInducted ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/80 shadow-2xs">
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                          {t('she.badge_inducted', 'Sudah di Induction')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200/80 shadow-2xs">
                          <ShieldAlert size={12} />
                          {t('she.badge_needs_induction', 'Butuh Induction SHE')}
                        </span>
                      )}
                    </td>
                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Tombol aksi cepat Induction K3 */}
                        {isInducted ? (
                          <button
                            onClick={() => handleToggleInduction(v, 'PENDING')}
                            className="btn-ghost text-xs py-1 px-2.5 rounded-lg text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-semibold flex items-center gap-1"
                            title="Sudah di-induction. Klik untuk membatalkan."
                          >
                            <Check size={12} strokeWidth={2.5} />
                            <span>{t('she.btn_inducted_done', 'Ter-Induction')}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleInduction(v, 'COMPLETED')}
                            className="btn-success text-xs py-1 px-2.5 rounded-lg font-bold flex items-center gap-1 shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                            title="Tandai tamu ini sudah menyelesaikan Safety Induction K3"
                          >
                            <CheckCircle2 size={13} />
                            <span>{t('she.btn_finish_induction', 'Induction Selesai')}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleResendWa(v)}
                          className="btn-ghost text-xs p-1.5 rounded-lg text-slate-500 hover:text-brand-600"
                          title="Kirim ulang notifikasi WhatsApp ke Tim SHE"
                        >
                          <Send size={14} />
                        </button>
                        <button
                          onClick={() => setSelectedVisit(v)}
                          className="btn-ghost text-xs py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600"
                        >
                          {t('she.btn_detail_copy', 'Detail & Salin')}
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
          onToggleInduction={handleToggleInduction}
        />
      )}

      {/* Modal Pengaturan WA SHE */}
      {showSettings && <SheSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
