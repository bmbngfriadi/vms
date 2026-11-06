import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { vmsApi } from '../services/api';
import { exportToExcel } from '../services/excelExport';
import StatsCard from '../components/StatsCard';
import QrScannerModal from '../components/QrScannerModal';
import QrBadgeModal from '../components/QrBadgeModal';
import PreRegisterModal from '../components/PreRegisterModal';
import EmergencyListModal from '../components/EmergencyListModal';
import SystemSettingsModal from '../components/SystemSettingsModal';
import StatusBadge from '../components/StatusBadge';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  Users,
  Building2,
  Clock,
  CheckCircle,
  QrCode,
  UserPlus,
  RefreshCw,
  LogOut,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Download,
  Calendar,
  CalendarCheck,
  Ban,
  XCircle,
  AlertOctagon,
  Sliders,
  ShieldAlert,
  FileBarChart,
  MessageSquare,
  History,
  TrendingUp,
  UserCheck,
  Building,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [onSiteVisits, setOnSiteVisits] = useState([]);
  const [pendingVisits, setPendingVisits] = useState([]);
  const [recentVisits, setRecentVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);
  const [isPreRegisterOpen, setIsPreRegisterOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [cancelModalVisit, setCancelModalVisit] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sumData, onSiteData, pendingData, recentData] = await Promise.all([
        vmsApi.getSummary(),
        vmsApi.getVisitors({ status: 'CHECKED_IN' }),
        vmsApi.getVisitors({ status: 'PENDING_VALIDATION' }),
        vmsApi.getVisitors({ limit: 10 })
      ]);
      setSummary(sumData);
      setOnSiteVisits(onSiteData || []);
      setPendingVisits(pendingData || []);
      setRecentVisits(recentData || []);
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    setIsScannerOpen(false);
    try {
      const code = decodedText.trim();
      const visit = await vmsApi.getVisitorByCode(code);
      setSelectedVisit(visit);
      setIsBadgeOpen(true);
    } catch (e) {
      alert(`Scanned code not recognized: ${decodedText}`);
    }
  };

  const handleFastCheckOut = async (visit) => {
    try {
      await vmsApi.checkOutVisitor({ id: visit.id });
      setActionMessage(`${visit.fullName} berhasil Check-Out oleh ${user.name}.`);
      setTimeout(() => setActionMessage(''), 4000);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memproses Check-Out');
    }
  };

  const handleApprove = async (visitId) => {
    try {
      await vmsApi.approveVisitor(visitId);
      setActionMessage('Kunjungan berhasil disetujui.');
      setTimeout(() => setActionMessage(''), 4000);
      loadDashboardData();
    } catch (err) {
      alert('Gagal menyetujui kunjungan');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalVisit) return;
    try {
      await vmsApi.cancelVisitor(cancelModalVisit.id, cancelReason);
      setCancelModalVisit(null);
      setCancelReason('');
      setActionMessage(t('msg_cancelledSuccess'));
      setTimeout(() => setActionMessage(''), 4000);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membatalkan kunjungan');
    }
  };

  const handleExportExcel = () => {
    exportToExcel(onSiteVisits.length > 0 ? onSiteVisits : recentVisits, `VMS_PT_Cemindo_Gemilang_Batam_${user.role}`);
  };

  const isSecurity = user?.role === 'SECURITY';
  const isHost = user?.role === 'HOST_PIC';
  const isManagement = user?.role === 'MANAGEMENT';
  const isAdmin = user?.role === 'ADMIN';

  // Compute Overstay items from onSiteVisits
  const overstayHours = summary?.overstayThresholdHours || 8;
  const overstayVisits = onSiteVisits.filter((v) => {
    if (!v.checkInTime) return false;
    const diffHours = (new Date() - new Date(v.checkInTime)) / (1000 * 60 * 60);
    return diffHours > overstayHours;
  });

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER & ACTION BAR */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Plant Batam Visitor Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {t('welcomeBack')}, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            {isManagement
              ? 'Dashboard Eksekutif: Rekapitulasi pergerakan tamu, analisis harian & bulanan PT Cemindo Gemilang Tbk – Plant Batam.'
              : isSecurity
              ? 'Pos Keamanan: Validasi kedatangan, check-in, check-out, dan pengawasan personil luar di dalam pabrik.'
              : isHost
              ? 'PIC Departemen: Pengelolaan tamu janji temu, konfirmasi kedatangan, dan riwayat kunjungan.'
              : 'Pusat Kendali Administrator: Pengaturan sistem, integrasi WhatsApp, master data, dan audit trail.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Emergency Roll-Call Button (Available to Security, Management, Admin) */}
          {(isSecurity || isManagement || isAdmin) && (
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-700/40 transition"
              title="Daftar Evakuasi Darurat (Muster Point Roll-Call)"
            >
              <AlertOctagon className="w-4 h-4 animate-pulse" />
              <span>Emergency Roll-Call</span>
            </button>
          )}

          {/* Admin System Settings Modal */}
          {isAdmin && (
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
              title="Pengaturan Sistem & Batas Overstay"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Pengaturan</span>
            </button>
          )}

          {/* Pre-Register Button for PIC or Admin */}
          {(isHost || isAdmin) && (
            <button
              onClick={() => setIsPreRegisterOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{t('btnRegisterVisitorBig')}</span>
            </button>
          )}

          {/* Security / Admin QR Scanner */}
          {(isSecurity || isAdmin) && (
            <button
              onClick={() => navigate('/scanner')}
              className="py-2.5 px-4 rounded-xl bg-cemindo-red hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition"
            >
              <QrCode className="w-4 h-4" />
              <span>{t('btnScanQrBig')}</span>
            </button>
          )}

          {/* Excel Export */}
          {(isManagement || isAdmin) && (
            <button
              onClick={handleExportExcel}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export</span>
            </button>
          )}

          <button
            onClick={loadDashboardData}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition"
            title={t('action_refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 12: OVERSTAY ALERT BANNER (If visitors exceed configured hours) */}
      {/* ========================================================================= */}
      {overstayVisits.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-5 shadow-sm animate-fadeIn">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-amber-900">
                  PERINGATAN OVERSTAY: {overstayVisits.length} Tamu Berada di Pabrik Melebihi Batas Waktu ({overstayHours} Jam)
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Petugas Security dan PIC terkait dimohon segera melakukan konfirmasi dan memastikan tamu menyelesaikan urusan serta melakukan Check-Out.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {overstayVisits.slice(0, 5).map((ov) => (
                    <span
                      key={ov.id}
                      className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-[11px] font-bold text-amber-900 shadow-xs"
                    >
                      {ov.fullName} ({ov.company}) – {ov.destinationDepartment?.name}
                    </span>
                  ))}
                  {overstayVisits.length > 5 && (
                    <span className="px-2 py-1 text-[11px] font-bold text-amber-800">
                      +{overstayVisits.length - 5} lainnya
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-sm"
            >
              Lihat Detail
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROLE A: DASHBOARD MANAGEMENT (Macro Stats, Trends, Dept Breakdown) */}
      {/* ========================================================================= */}
      {(isManagement || isAdmin) && (
        <div className="space-y-6">
          {/* Management Top 7 KPI Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cemindo-red" />
                <span>Statistik Utama Kunjungan Pabrik Batam (Management)</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">
                Bulan: <strong>{summary?.currentMonthLabel || 'Bulan Ini'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {/* 1. Total Tamu Hari Ini */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tamu Hari Ini</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{summary?.totalToday ?? 0}</p>
                <span className="text-[10px] text-slate-500 mt-1">Registrasi hari ini</span>
              </div>

              {/* 2. Total Tamu Bulan Ini */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tamu Bulan Ini</span>
                <p className="text-2xl font-black text-purple-700 mt-1">{summary?.totalThisMonth ?? 0}</p>
                <span className="text-[10px] text-slate-500 mt-1">Akumulasi bulan ini</span>
              </div>

              {/* 3. Sedang Berada di Pabrik */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between bg-emerald-50/20">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Sedang di Pabrik</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">{summary?.currentlyOnSite ?? 0}</p>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1">Active Headcount</span>
              </div>

              {/* 4. Total Tamu Check-In */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-In Hari Ini</span>
                <p className="text-2xl font-black text-blue-700 mt-1">{summary?.checkedInToday ?? 0}</p>
                <span className="text-[10px] text-slate-500 mt-1">Masuk pos gerbang</span>
              </div>

              {/* 5. Total Tamu Check-Out */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-Out Hari Ini</span>
                <p className="text-2xl font-black text-slate-700 mt-1">{summary?.checkedOutToday ?? 0}</p>
                <span className="text-[10px] text-slate-500 mt-1">Selesai kunjungan</span>
              </div>

              {/* 6. Tamu Walk-In */}
              <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between bg-amber-50/20">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Tamu Walk-In</span>
                <p className="text-2xl font-black text-amber-700 mt-1">{summary?.walkInToday ?? 0}</p>
                <span className="text-[10px] text-slate-500 mt-1">Total: {summary?.walkInTotal ?? 0}</span>
              </div>

              {/* 7. Tamu Pre-Registered */}
              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between bg-blue-50/20">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Pre-Registered</span>
                <p className="text-2xl font-black text-blue-700 mt-1">{summary?.preRegisteredToday ?? 0}</p>
                <span className="text-[10px] text-slate-500 mt-1">Total: {summary?.preRegisteredTotal ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Daily Trend Chart (14 Days) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cemindo-red" />
                  <span>Grafik Tren Kunjungan Harian (14 Hari Terakhir)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan komposisi tamu Walk-In (tanpa janji) dan Pre-Registered (ada janji temu)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500"></span>
                  <span className="text-slate-600">Walk-In</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-600"></span>
                  <span className="text-slate-600">Pre-Registered</span>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-2">
              <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 items-end h-44 border-b border-slate-200 pb-2">
                {summary?.dailyTrend?.map((day, idx) => {
                  const maxVal = Math.max(...summary.dailyTrend.map((d) => d.total), 10);
                  const totalHeight = Math.min(100, Math.round((day.total / maxVal) * 100));
                  const walkInPct = day.total > 0 ? (day.walkIn / day.total) * 100 : 0;
                  const preRegPct = day.total > 0 ? (day.preRegistered / day.total) * 100 : 0;

                  return (
                    <div key={idx} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition">
                        {day.total}
                      </span>
                      <div
                        className="w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col-reverse transition-all bg-slate-100"
                        style={{ height: `${Math.max(totalHeight, 6)}%` }}
                        title={`${day.date}: ${day.total} Tamu (Walk-In: ${day.walkIn}, Pre-Reg: ${day.preRegistered})`}
                      >
                        <div
                          style={{ height: `${walkInPct}%` }}
                          className="bg-amber-500 w-full"
                        ></div>
                        <div
                          style={{ height: `${preRegPct}%` }}
                          className="bg-blue-600 w-full"
                        ></div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 mt-2 truncate w-full text-center">
                        {day.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Department Breakdown Stats */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cemindo-red" />
              <span>Grafik Kunjungan Berdasarkan Department</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribusi tamu dan headcount aktif per divisi operasional PT Cemindo Gemilang Plant Batam
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {summary?.departmentStats?.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between"
                >
                  <div>
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                      {dept.code}
                    </span>
                    <p className="text-xs font-extrabold text-slate-800 truncate mt-0.5">
                      {dept.name}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">On-Site:</span>
                    <span className="font-bold text-emerald-700">
                      {dept.currentlyOnSite} pax
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROLE B: DASHBOARD SECURITY (Large Scan Button, Gate Headcount, Direct Fast-Action) */}
      {/* ========================================================================= */}
      {isSecurity && (
        <div className="space-y-6">
          {/* BIG SCANNER BUTTON (Designed for Guard Post Mobile Screen) */}
          <div className="bg-gradient-to-r from-red-600 via-cemindo-red to-red-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white font-extrabold text-xs tracking-wider uppercase">
                  POS SECURITY UTAMA
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-2">
                  Gerbang Akses Masuk & Keluar Plant Batam
                </h2>
                <p className="text-xs sm:text-sm text-red-100 mt-1 max-w-lg">
                  Pindai QR Code tamu langsung menggunakan kamera HP depan/belakang untuk validasi Check-In atau Check-Out.
                </p>
              </div>

              <button
                onClick={() => navigate('/scanner')}
                className="w-full sm:w-auto py-5 px-8 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl text-base sm:text-lg font-black flex items-center justify-center gap-3 shadow-2xl transition transform active:scale-95"
              >
                <QrCode className="w-7 h-7 text-cemindo-red animate-pulse" />
                <span>{t('btnScanQrBig')}</span>
              </button>
            </div>
          </div>

          {/* Security KPI Grid (4 Metrics: Menunggu Validasi, Sudah Check-In, Belum Check-Out, Overstay) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatsCard
              title={t('stat_waitingValidation')}
              value={summary?.pendingValidationCount ?? 0}
              icon={Clock}
              color="amber"
              subtitle="Tamu di pos gerbang"
            />
            <StatsCard
              title={t('stat_checkedInCount')}
              value={summary?.checkedInToday ?? 0}
              icon={CheckCircle}
              color="blue"
              subtitle="Hari ini"
            />
            <StatsCard
              title={t('stat_notCheckedOutCount')}
              value={summary?.currentlyOnSite ?? 0}
              icon={ShieldCheck}
              color="emerald"
              subtitle="Berada di pabrik"
            />
            <StatsCard
              title={t('stat_overstayAlert')}
              value={overstayVisits.length}
              icon={AlertTriangle}
              color="red"
              subtitle={`Batas: > ${overstayHours} jam`}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROLE C: DASHBOARD PIC (Host Pre-Register, Scheduled Today, Arrival Logs) */}
      {/* ========================================================================= */}
      {isHost && (
        <div className="space-y-6">
          {/* Big PIC Register Button */}
          <div className="bg-slate-800 rounded-3xl p-6 sm:p-7 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-700">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                DEPARTEMEN: {user.department?.name || 'PIC INTERNAL'}
              </span>
              <h2 className="text-lg sm:text-xl font-black mt-1">
                Pendaftaran Tamu Janji Temu (Pre-Registration)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Daftarkan tamu yang akan berkunjung ke Anda untuk menerbitkan QR Code resmi masuk pabrik.
              </p>
            </div>
            <button
              onClick={() => setIsPreRegisterOpen(true)}
              className="w-full sm:w-auto py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition"
            >
              <CalendarCheck className="w-5 h-5" />
              <span>{t('btnRegisterVisitorBig')}</span>
            </button>
          </div>

          {/* PIC 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatsCard
              title={t('stat_todayArrivals')}
              value={summary?.picStats?.picTodayScheduled ?? 0}
              icon={Calendar}
              color="blue"
              subtitle="Jadwal hari ini"
            />
            <StatsCard
              title={t('stat_checkedInCount')}
              value={summary?.picStats?.picCheckedIn ?? 0}
              icon={ShieldCheck}
              color="emerald"
              subtitle="Sedang bertemu Anda"
            />
            <StatsCard
              title="Tamu Selesai Kunjungan"
              value={summary?.picStats?.picCheckedOut ?? 0}
              icon={CheckCircle}
              color="slate"
              subtitle="Sudah check-out"
            />
            <StatsCard
              title="Total Riwayat Tamu Anda"
              value={summary?.picStats?.picTotal ?? 0}
              icon={Users}
              color="purple"
              subtitle="Semua waktu"
            />
          </div>

          {/* Incoming Visits Awaiting Action */}
          {pendingVisits.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-900">
                    Permohonan Kunjungan Menunggu Persetujuan Anda ({pendingVisits.length})
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/visitors')}
                  className="text-xs font-bold text-amber-800 hover:underline"
                >
                  {t('viewAll')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingVisits.slice(0, 4).map((v) => (
                  <div key={v.id} className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{v.fullName}</p>
                      <p className="text-[11px] text-slate-600 font-medium">{v.company} • {v.destinationDepartment?.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{v.visitCode} • {v.expectedTime}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleApprove(v.id)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        {t('action_approve')}
                      </button>
                      <button
                        onClick={() => {
                          setCancelModalVisit(v);
                          setCancelReason('');
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        title={t('action_cancelVisit')}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROLE D: DASHBOARD ADMINISTRATOR (Command Center Modules) */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cemindo-red" />
              <span>Command Center Administrator (Pusat Kendali Aplikasi)</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              Akses cepat seluruh modul manajemen sistem
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Master Department */}
            <button
              onClick={() => navigate('/master/departments')}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Master Department</p>
                <p className="text-[10px] text-slate-500">Kelola 9 divisi plant</p>
              </div>
            </button>

            {/* Master Karyawan / PIC */}
            <button
              onClick={() => navigate('/master/employees')}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Master Karyawan</p>
                <p className="text-[10px] text-slate-500">User & nomor WA PIC</p>
              </div>
            </button>

            {/* WhatsApp Gateway */}
            <button
              onClick={() => navigate('/whatsapp')}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Gateway WhatsApp</p>
                <p className="text-[10px] text-slate-500">Baileys QR & template</p>
              </div>
            </button>

            {/* Visitor Blacklist */}
            <button
              onClick={() => navigate('/blacklist')}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Blacklist Tamu</p>
                <p className="text-[10px] text-slate-500">Blokir tamu bermasalah</p>
              </div>
            </button>

            {/* Reports & Excel */}
            <button
              onClick={() => navigate('/reports')}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <FileBarChart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Laporan & Export</p>
                <p className="text-[10px] text-slate-500">Filter lengkap & Excel</p>
              </div>
            </button>

            {/* Activity Audit Logs */}
            <button
              onClick={() => navigate('/activity-logs')}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <History className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Audit Trail</p>
                <p className="text-[10px] text-slate-500">Log aktivitas sistem</p>
              </div>
            </button>

            {/* Emergency Evacuation List */}
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="p-3.5 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-left transition flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-900">Emergency Roll-Call</p>
                <p className="text-[10px] text-red-700">Muster point evakuasi</p>
              </div>
            </button>

            {/* System Settings */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Pengaturan Sistem</p>
                <p className="text-[10px] text-slate-500">Batas overstay & KTP</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACTIVE ON-SITE VISITORS TABLE (Tamu yang Masih Berada di Pabrik) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Daftar Tamu yang Masih Berada di Pabrik ({onSiteVisits.length} Orang)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Personil eksternal aktif di dalam area PT Cemindo Gemilang Plant Batam yang telah Check-In dan belum Check-Out
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <button
              onClick={() => navigate('/visitors')}
              className="text-xs font-bold text-cemindo-red hover:underline"
            >
              {t('viewAll')}
            </button>
          </div>
        </div>

        {onSiteVisits.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Tidak ada tamu yang sedang berada di dalam kawasan pabrik.
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Tamu & Perusahaan</th>
                  <th className="py-2.5 px-3">Department & PIC</th>
                  <th className="py-2.5 px-3">Badge & Kendaraan</th>
                  <th className="py-2.5 px-3">Waktu Check-In & Security</th>
                  <th className="py-2.5 px-3">Durasi Berada</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {onSiteVisits.map((v) => {
                  const checkInDate = v.checkInTime ? new Date(v.checkInTime) : new Date();
                  const diffHours = (new Date() - checkInDate) / (1000 * 60 * 60);
                  const isOverstay = diffHours > overstayHours;

                  return (
                    <tr key={v.id} className={isOverstay ? 'bg-amber-50/60' : 'hover:bg-slate-50/80 transition'}>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{v.fullName}</p>
                        <p className="text-[11px] text-slate-500">{v.company}</p>
                        <span className="font-mono text-[10px] text-slate-400">{v.visitCode}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {v.destinationDepartment?.name}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">PIC: {v.hostNameManual || v.host?.name}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800">{v.visitorBadgeNumber ? `Badge #${v.visitorBadgeNumber}` : '-'}</p>
                        <p className="font-mono text-[10px] text-slate-500">{v.vehiclePlateNumber || 'Tanpa kendaraan'}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-slate-800 font-semibold">
                          {v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'} WIB
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Oleh: {v.securityCheckInBy?.name || 'Pos Security'}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOverstay
                              ? 'bg-red-600 text-white animate-pulse'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {v.durationFormatted || `${Math.floor(diffHours)} jam`}
                          {isOverstay ? ' (OVERSTAY)' : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedVisit(v);
                              setIsBadgeOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="Lihat QR Pass"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(isSecurity || isAdmin) && (
                            <button
                              onClick={() => handleFastCheckOut(v)}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold shadow-sm transition"
                            >
                              Check-Out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. RECENT VISITS (Daftar Tamu Terbaru) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Daftar Kunjungan Terbaru</span>
          </h2>
          <button
            onClick={() => navigate('/reports')}
            className="text-xs font-bold text-cemindo-red hover:underline"
          >
            Lihat Laporan Lengkap
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Kode Pass</th>
                <th className="py-2.5 px-3">Nama Tamu & Perusahaan</th>
                <th className="py-2.5 px-3">Department & PIC</th>
                <th className="py-2.5 px-3">Jenis</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentVisits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{v.visitCode}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-slate-900">{v.fullName}</p>
                    <p className="text-[11px] text-slate-500">{v.company}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-slate-800">{v.destinationDepartment?.name}</p>
                    <p className="text-[10px] text-slate-500">PIC: {v.hostNameManual || v.host?.name}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      v.visitType === 'WALK_IN' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {v.visitType === 'WALK_IN' ? 'Walk-In' : 'Pre-Reg'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={v.status} size="xs" />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedVisit(v);
                        setIsBadgeOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal Cancel Visit */}
      {cancelModalVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-5">
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>{t('action_cancelVisit')}</span>
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Apakah Anda yakin ingin membatalkan jadwal kunjungan untuk <strong className="text-slate-900">{cancelModalVisit.fullName}</strong> ({cancelModalVisit.visitCode})?
            </p>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Alasan pembatalan (contoh: Tugas mendadak / Dijadwal ulang)"
              className="w-full text-xs p-3 border rounded-xl mb-4 focus:outline-none focus:ring-1 focus:ring-cemindo-red"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setCancelModalVisit(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                {t('action_cancel')}
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm"
              >
                Konfirmasi Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* QR Badge Modal */}
      <QrBadgeModal
        isOpen={isBadgeOpen}
        onClose={() => setIsBadgeOpen(false)}
        visit={selectedVisit}
      />

      {/* Pre-Register Modal */}
      <PreRegisterModal
        isOpen={isPreRegisterOpen}
        onClose={() => setIsPreRegisterOpen(false)}
        onSuccess={(newVisit) => {
          setSelectedVisit(newVisit);
          setIsBadgeOpen(true);
          loadDashboardData();
        }}
      />

      {/* Emergency Visitor List Modal (Muster Point Roll-Call) */}
      <EmergencyListModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />

      {/* System Settings Modal (Overstay Hours Threshold) */}
      <SystemSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onUpdated={loadDashboardData}
      />
    </div>
  );
}
