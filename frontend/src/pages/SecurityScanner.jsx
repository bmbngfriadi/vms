import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { vmsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import QrScannerModal from '../components/QrScannerModal';
import QrBadgeModal from '../components/QrBadgeModal';
import EmergencyListModal from '../components/EmergencyListModal';
import StatusBadge from '../components/StatusBadge';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  Camera,
  Search,
  CheckCircle,
  LogOut,
  LogIn,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
  Car,
  Clock,
  Printer,
  RefreshCw,
  Phone,
  MessageSquare,
  XCircle,
  ArrowLeft,
  QrCode,
  X,
  Building,
  UserCheck,
  AlertOctagon,
  Download,
  Copy,
  Check
} from 'lucide-react';

export default function SecurityScanner() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Mode: 'CHECK_IN' (Validasi Masuk) vs 'CHECK_OUT' (Gerbang Keluar)
  const [activeTab, setActiveTab] = useState('CHECK_IN');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchedVisit, setSearchedVisit] = useState(null);
  const [scanWarnings, setScanWarnings] = useState([]);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [canCheckOut, setCanCheckOut] = useState(false);

  const [badgeNumber, setBadgeNumber] = useState('');
  const [securityNotes, setSecurityNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Modals for confirmation (Tahap 16)
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);
  const [isPermanentQrOpen, setIsPermanentQrOpen] = useState(false);
  const [permanentQrDataUrl, setPermanentQrDataUrl] = useState('');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const inputRef = useRef(null);

  // Generate permanent QR code for gate registration
  useEffect(() => {
    const regUrl = `${window.location.origin}/visitor/register`;
    QRCode.toDataURL(regUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then(setPermanentQrDataUrl)
      .catch(console.warn);
  }, []);

  useEffect(() => {
    loadRecentLogs();
  }, [activeTab]);

  const loadRecentLogs = async () => {
    try {
      const visits = await vmsApi.getVisitors();
      setRecentLogs(visits.slice(0, 10));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleReset = () => {
    setSearchedVisit(null);
    setSearchQuery('');
    setScanWarnings([]);
    setCanCheckIn(false);
    setCanCheckOut(false);
    setBadgeNumber('');
    setSecurityNotes('');
    setRejectionReason('');
    setAlertMsg(null);
  };

  const processVerifyScan = async (token) => {
    if (!token || !token.trim()) return;

    setLoading(true);
    setAlertMsg(null);

    try {
      const data = await vmsApi.verifyScan(token.trim(), activeTab);
      setSearchedVisit(data.visit);
      setScanWarnings(data.warnings || []);
      setCanCheckIn(data.canCheckIn);
      setCanCheckOut(data.canCheckOut);
      setBadgeNumber(data.visit.visitorBadgeNumber || '');

      // Switch active tab if scan type requires check-out
      if (data.scanType === 'CHECK_OUT' && activeTab !== 'CHECK_OUT') {
        setActiveTab('CHECK_OUT');
      }

      setAlertMsg({
        type: data.warnings?.length ? 'warning' : 'success',
        text: data.warnings?.length
          ? data.warnings.join(' | ')
          : `QR Code Terverifikasi: ${data.visit.fullName} (${data.visit.company})`
      });
    } catch (err) {
      setSearchedVisit(null);
      setScanWarnings([]);
      setCanCheckIn(false);
      setCanCheckOut(false);
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.error || `Data QR tidak ditemukan di sistem: "${token}"`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    processVerifyScan(searchQuery);
  };

  const handleScanSuccess = (decodedText) => {
    setIsScannerOpen(false);
    setSearchQuery(decodedText.trim());
    processVerifyScan(decodedText.trim());
  };

  // Open confirmation modal for Check-In
  const handleOpenCheckInModal = () => {
    if (!searchedVisit) return;
    setIsCheckInModalOpen(true);
  };

  // Execute Check-In inside transaction
  const handleConfirmCheckIn = async () => {
    if (!searchedVisit) return;
    setLoading(true);
    try {
      const res = await vmsApi.validateCheckIn(searchedVisit.id, {
        visitorBadgeNumber: badgeNumber,
        notes: securityNotes
      });
      setSearchedVisit(res.visit);
      setCanCheckIn(false);
      setCanCheckOut(true);
      setIsCheckInModalOpen(false);
      setAlertMsg({
        type: 'success',
        text: `CHECKED IN BERHASIL! QR Code Check-Out telah dibuat & dikirimkan ke WhatsApp tamu. Notifikasi kedatangan dikirim ke PIC & Management. (Petugas Gate: ${user?.name})`
      });
      loadRecentLogs();
    } catch (err) {
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.error || 'Gagal memproses Check-In.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Open confirmation modal for Check-Out
  const handleOpenCheckOutModal = () => {
    if (!searchedVisit) return;
    setIsCheckOutModalOpen(true);
  };

  // Execute Check-Out inside transaction
  const handleConfirmCheckOut = async () => {
    if (!searchedVisit) return;
    setLoading(true);
    try {
      const res = await vmsApi.validateCheckOut(searchedVisit.id, {
        notes: securityNotes
      });
      setSearchedVisit(res.visit);
      setCanCheckIn(false);
      setCanCheckOut(false);
      setIsCheckOutModalOpen(false);
      setAlertMsg({
        type: 'success',
        text: `CHECKED OUT BERHASIL! QR Code telah dinonaktifkan secara permanen. Notifikasi terima kasih telah dikirim ke WhatsApp tamu, PIC, dan Management. (Petugas Gate: ${user?.name})`
      });
      loadRecentLogs();
    } catch (err) {
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.error || 'Gagal memproses Check-Out.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Open confirmation modal for Reject
  const handleOpenRejectModal = () => {
    if (!searchedVisit) return;
    setIsRejectModalOpen(true);
  };

  // Execute Reject
  const handleConfirmReject = async () => {
    if (!searchedVisit) return;
    setLoading(true);
    try {
      const res = await vmsApi.rejectWalkIn(searchedVisit.id, rejectionReason);
      setSearchedVisit(res.visit);
      setCanCheckIn(false);
      setIsRejectModalOpen(false);
      setRejectionReason('');
      setAlertMsg({
        type: 'warning',
        text: `Kunjungan telah DITOLAK. Notifikasi pembatalan dikirim ke nomor WhatsApp tamu.`
      });
      loadRecentLogs();
    } catch (err) {
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.error || 'Gagal menolak kunjungan.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      {/* ========================================================================= */}
      {/* 1. MOBILE-FIRST HERO SCANNER BUTTON (Designed for Gate Phone Viewport) */}
      {/* ========================================================================= */}
      <div className="block sm:hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 text-white shadow-xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pos Security Gate</span>
          </div>
          <span className="text-[11px] font-bold text-slate-300">{user?.name?.split(' ')[0]}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="w-full py-4 px-4 rounded-2xl bg-cemindo-red hover:bg-red-700 text-white text-base font-black uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg shadow-red-600/40 active:scale-95 transition"
        >
          <Camera className="w-6 h-6 animate-pulse text-white" />
          <span>SCAN QR CODE (KAMERA HP)</span>
        </button>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => setIsPermanentQrOpen(true)}
            className="py-2.5 px-3 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-bold flex items-center justify-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-cemindo-red" />
            <span>QR Pos Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEmergencyOpen(true)}
            className="py-2.5 px-3 rounded-xl bg-red-800 text-white font-bold flex items-center justify-center gap-1.5"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Roll-Call</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP / TABLET HEADER BANNER */}
      {/* ========================================================================= */}
      <div className="hidden sm:flex bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Main Gate Security Workstation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {t('menuSecurityScanner')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Petugas Jaga: <strong className="text-white font-bold">{user?.name}</strong> {user?.employeeId ? `[NIK: ${user.employeeId}]` : ''}. Seluruh aktivitas Check-In & Check-Out terhubung dengan database audit trail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Emergency Muster Button */}
          <button
            type="button"
            onClick={() => setIsEmergencyOpen(true)}
            className="py-3 px-3.5 rounded-2xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition"
            title="Daftar Evakuasi Darurat (Muster Point Roll-Call)"
          >
            <AlertOctagon className="w-4 h-4 text-white animate-pulse" />
            <span>Roll-Call</span>
          </button>

          {/* Permanent Walk-in QR Poster Button */}
          <button
            type="button"
            onClick={() => setIsPermanentQrOpen(true)}
            className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
            title="Tampilkan QR Code Registrasi Walk-In Pos Masuk"
          >
            <QrCode className="w-4 h-4 text-cemindo-red" />
            <span>QR Pos Masuk</span>
          </button>

          {/* Large Scanner Button */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="py-3 px-6 rounded-2xl bg-cemindo-red hover:bg-red-700 text-white text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2.5 shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5 active:scale-95"
          >
            <Camera className="w-5 h-5" />
            <span>{t('action_scanQr')} (HP)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODE SELECTOR TABS: CHECK-IN vs CHECK-OUT */}
      {/* ========================================================================= */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setActiveTab('CHECK_IN');
            handleReset();
          }}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'CHECK_IN'
              ? 'bg-cemindo-red text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>{t('tab_checkInMode')} (Validasi Masuk)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('CHECK_OUT');
            handleReset();
          }}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'CHECK_OUT'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span>{t('tab_checkOutMode')} (Gerbang Keluar)</span>
        </button>
      </div>

      {/* Alert Notification */}
      {alertMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-fadeIn ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : alertMsg.type === 'warning'
              ? 'bg-amber-50 border border-amber-300 text-amber-900'
              : 'bg-red-50 border border-red-300 text-red-900'
          }`}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : alertMsg.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-relaxed font-bold">{alertMsg.text}</span>
          <button
            onClick={() => setAlertMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Warnings Banner */}
      {scanWarnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs space-y-1.5 shadow-sm">
          <div className="font-black flex items-center gap-2 text-amber-950 uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Peringatan Sistem Keamanan Pos Security:</span>
          </div>
          {scanWarnings.map((w, idx) => (
            <p key={idx} className="font-semibold pl-6 leading-relaxed">
              • {w}
            </p>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MANUAL SEARCH BAR (Input Token QR / Kode Kunjungan) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'CHECK_IN'
                  ? 'Ketik / Scan Token QR Check-In atau Kode Pass (e.g. VMS-IN-... atau VMS-202611-...)'
                  : 'Ketik / Scan Token QR Check-Out (e.g. VMS-OUT-...)'
              }
              className="w-full pl-10 pr-4 py-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red font-mono"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="sm:hidden flex-1 py-3 px-4 bg-cemindo-red text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Buka Kamera</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition"
            >
              <Search className="w-4 h-4" />
              <span>Verifikasi</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 5. VERIFIED VISITOR DETAIL CARD (Tahap 16: Professional Industrial Look) */}
      {/* ========================================================================= */}
      {searchedVisit && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-300 shadow-xl animate-fadeIn space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-white tracking-wider">
                  {searchedVisit.visitCode}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {searchedVisit.visitType === 'WALK_IN' ? '🚶 Tamu Walk-In (Tanpa Janji)' : '📅 Tamu Pre-Registered (Janji Temu)'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {searchedVisit.fullName}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                {searchedVisit.company} • WhatsApp:{' '}
                <span className="font-mono text-slate-900 font-extrabold">{searchedVisit.phoneNumber}</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <StatusBadge status={searchedVisit.status} size="md" />
              <button
                type="button"
                onClick={() => setIsBadgeOpen(true)}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                title="Lihat / Cetak Pas Kunjungan"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* 1. Keperluan Kunjungan */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Keperluan Kunjungan (Purpose)
              </span>
              <p className="font-bold text-slate-900 text-sm mt-1 leading-snug">
                {searchedVisit.purpose}
              </p>
              {searchedVisit.identityNumber && (
                <p className="text-[11px] text-slate-600 mt-2 font-mono font-semibold">
                  NIK/KTP: <span className="text-slate-900">{searchedVisit.identityNumber}</span>
                </p>
              )}
            </div>

            {/* 2. Department & PIC yang Dituju + Contact Actions */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Department & PIC yang Dituju
              </span>
              <p className="font-extrabold text-slate-900 text-sm mt-1">
                {searchedVisit.destinationDepartment?.name || '-'}
              </p>
              <p className="text-slate-700 text-xs font-semibold mt-0.5">
                PIC: <strong className="text-slate-900">{searchedVisit.hostNameManual || searchedVisit.host?.name || '-'}</strong>
              </p>

              {/* Direct Call / WhatsApp Actions for Security Officer */}
              {searchedVisit.host?.phone ? (
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={`tel:${searchedVisit.host.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Hubungi PIC</span>
                  </a>
                  <a
                    href={`https://wa.me/${searchedVisit.host.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 text-slate-100 hover:bg-slate-900 shadow-2xs transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              ) : (
                <p className="text-[11px] text-amber-700 mt-2 font-semibold">
                  (Nomor WhatsApp PIC belum terdaftar di master karyawan)
                </p>
              )}
            </div>

            {/* 3. Waktu & Kendaraan */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Jadwal & Akses Gerbang
              </span>
              <p className="text-slate-700 text-xs mt-1">
                Jadwal: <strong className="text-slate-900">{new Date(searchedVisit.expectedDate).toLocaleDateString('id-ID')} pk {searchedVisit.expectedTime}</strong>
              </p>
              <p className="text-slate-700 text-xs mt-0.5 font-mono">
                Plat: <strong className="text-slate-900">{searchedVisit.vehiclePlateNumber || 'Tanpa Kendaraan'}</strong>
              </p>
              {searchedVisit.checkInTime && (
                <p className="text-emerald-800 text-xs mt-1.5 font-bold">
                  ✓ Check-In: pk {new Date(searchedVisit.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </p>
              )}
              {searchedVisit.durationFormatted && searchedVisit.durationFormatted !== '-' && (
                <p className="text-slate-600 text-xs mt-0.5 font-medium">
                  Durasi di Pabrik: <strong className="text-slate-900">{searchedVisit.durationFormatted}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Validation Guidance Note per Tahap 4 */}
          {searchedVisit.status === 'PENDING_VALIDATION' && (
            <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-xs text-amber-950 flex items-start gap-3">
              <Phone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-950 font-bold uppercase tracking-wide">
                  Instruksi Validasi Pos Security (Standar Operasional):
                </strong>
                <span className="leading-relaxed font-medium">
                  Security wajib mengonfirmasi kedatangan tamu kepada PIC ({searchedVisit.host?.name || 'Department'}). Tekan tombol <strong>"Hubungi PIC"</strong> di atas. Setelah PIC memberikan konfirmasi, klik tombol <strong>"CHECKED IN"</strong> di bawah untuk mencatat badge dan mengizinkan tamu masuk.
                </span>
              </div>
            </div>
          )}

          {/* Check-Out Guidance Note per Tahap 6 */}
          {searchedVisit.status === 'CHECKED_IN' && activeTab === 'CHECK_OUT' && (
            <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-300 text-xs text-blue-950 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-blue-950 font-bold uppercase tracking-wide">
                  Pemeriksaan Gerbang Keluar:
                </strong>
                <span className="leading-relaxed font-medium">
                  Pastikan <strong>Kartu Visitor Badge #{searchedVisit.visitorBadgeNumber || '...'}</strong> telah diserahkan kembali ke pos jaga. Menekan tombol <strong>"CHECKED OUT"</strong> akan menonaktifkan QR Code secara permanen dan merekam waktu keluar.
                </span>
              </div>
            </div>
          )}

          {/* Badge & Notes Inputs (Shown before Check-In) */}
          {searchedVisit.status !== 'CHECKED_OUT' && searchedVisit.status !== 'REJECTED' && (
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nomor Kartu / Visitor Badge <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: VISITOR-088"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-bold focus:bg-white focus:ring-2 focus:ring-cemindo-red"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Catatan Tambahan Petugas Security (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Barang bawaan tas perkakas / APD lengkap"
                  value={securityNotes}
                  onChange={(e) => setSecurityNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-cemindo-red"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ACTION BUTTONS (Large Touch Buttons for Mobile & Desktop) */}
          {/* ========================================================================= */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('btn_kembali')}</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Check-In Mode Actions */}
              {activeTab === 'CHECK_IN' && searchedVisit.status !== 'CHECKED_IN' && searchedVisit.status !== 'CHECKED_OUT' && (
                <>
                  {/* REJECTED Button */}
                  <button
                    type="button"
                    onClick={handleOpenRejectModal}
                    disabled={loading}
                    className="py-3.5 px-5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{t('btn_rejected')}</span>
                  </button>

                  {/* CHECKED IN Button (Prominent Emerald) */}
                  <button
                    type="button"
                    onClick={handleOpenCheckInModal}
                    disabled={loading || !canCheckIn}
                    className="py-4 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-black uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-40"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>{t('btn_checkedIn')}</span>
                  </button>
                </>
              )}

              {/* Check-Out Mode Actions (Prominent Dark/Red) */}
              {(activeTab === 'CHECK_OUT' || searchedVisit.status === 'CHECKED_IN') && searchedVisit.status !== 'CHECKED_OUT' && (
                <button
                  type="button"
                  onClick={handleOpenCheckOutModal}
                  disabled={loading || searchedVisit.status !== 'CHECKED_IN'}
                  className="py-4 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base font-black uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-slate-900/30 transition transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-40"
                >
                  <LogOut className="w-5 h-5 text-cemindo-red" />
                  <span>{t('btn_checkedOut')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. RECENT GATE ACTIVITY LOG TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Daftar Aktivitas Kunjungan Terkini (Main Gate Pos Jaga)
            </h3>
            <p className="text-[11px] text-slate-500">Klik salah satu data untuk memuat info kunjungan</p>
          </div>
          <button
            onClick={loadRecentLogs}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => {
                setSearchedVisit(log);
                setSearchQuery(log.visitCode);
                setBadgeNumber(log.visitorBadgeNumber || '');
                setCanCheckIn(log.status === 'PENDING_VALIDATION' || log.status === 'APPROVED');
                setCanCheckOut(log.status === 'CHECKED_IN');
              }}
              className="py-3 px-3 hover:bg-slate-50 rounded-2xl cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-500">{log.visitCode}</span>
                  <span className="text-[10px] text-slate-400 font-medium">({log.visitType === 'WALK_IN' ? 'Walk-In' : 'Janji Temu'})</span>
                </div>
                <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">{log.fullName} ({log.company})</p>
                <p className="text-[11px] text-slate-500">
                  Dept: <strong className="text-slate-700">{log.destinationDepartment?.name}</strong> • PIC: {log.host?.name || log.hostNameManual || '-'}
                </p>
              </div>
              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1">
                <StatusBadge status={log.status} size="xs" />
                <span className="text-[10px] text-slate-400 font-medium">
                  {log.checkInTime ? `In: pk ${new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : `Jadwal: ${log.expectedTime}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. CONFIRMATION MODALS (Tahap 16: Modal Konfirmasi Tindakan Penting) */}
      {/* ========================================================================= */}

      {/* A. Modal Konfirmasi Check-In */}
      <ConfirmationModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onConfirm={handleConfirmCheckIn}
        title="Konfirmasi Check-In Tamu"
        type="success"
        confirmText="Ya, Proses Check-In"
        cancelText="Batal"
        isLoading={loading}
      >
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Tamu:</span>
              <strong className="text-slate-900">{searchedVisit?.fullName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Perusahaan:</span>
              <strong className="text-slate-900">{searchedVisit?.company}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department Tujuan:</span>
              <strong className="text-slate-900">{searchedVisit?.destinationDepartment?.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PIC yang Dituju:</span>
              <strong className="text-slate-900">{searchedVisit?.host?.name || searchedVisit?.hostNameManual}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Akses Kendaraan:</span>
              <strong className="text-slate-900">{searchedVisit?.vehiclePlateNumber || 'Jalan Kaki'}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Nomor Visitor Badge Fisik yang Diserahkan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
              placeholder="Contoh: VISITOR-088"
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Setelah Check-In dikonfirmasi, sistem akan secara otomatis membuat token QR Check-Out dan mengirimkan notifikasi ke nomor WhatsApp tamu, PIC, dan Management.
          </p>
        </div>
      </ConfirmationModal>

      {/* B. Modal Konfirmasi Check-Out */}
      <ConfirmationModal
        isOpen={isCheckOutModalOpen}
        onClose={() => setIsCheckOutModalOpen(false)}
        onConfirm={handleConfirmCheckOut}
        title="Konfirmasi Check-Out Tamu"
        type="checkout"
        confirmText="Ya, Selesaikan Kunjungan"
        cancelText="Batal"
        isLoading={loading}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Tamu:</span>
              <strong className="text-slate-900">{searchedVisit?.fullName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Perusahaan:</span>
              <strong className="text-slate-900">{searchedVisit?.company}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu Masuk:</span>
              <strong className="text-slate-900">
                {searchedVisit?.checkInTime ? new Date(searchedVisit.checkInTime).toLocaleTimeString('id-ID') : '-'} WIB
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Durasi di Pabrik:</span>
              <strong className="text-emerald-700 font-black">{searchedVisit?.durationFormatted || '-'}</strong>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="font-semibold">
              Pastikan kartu visitor fisik <strong>#{searchedVisit?.visitorBadgeNumber || 'Badge'}</strong> telah diterima kembali di pos security.
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Menekan tombol konfirmasi akan menonaktifkan QR Code Check-Out secara permanen dan mengirimkan notifikasi kepulangan ke WhatsApp PIC dan Management.
          </p>
        </div>
      </ConfirmationModal>

      {/* C. Modal Konfirmasi Penolakan Kunjungan */}
      <ConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        title="Tolak Kunjungan Tamu"
        type="danger"
        confirmText="Konfirmasi Tolak"
        cancelText="Batal"
        isLoading={loading}
        confirmDisabled={!rejectionReason.trim()}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Kunjungan atas nama <strong>{searchedVisit?.fullName}</strong> ({searchedVisit?.company}) akan ditolak. Masukkan alasan penolakan di bawah ini:
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: PIC sedang di luar kantor / Janji temu dibatalkan"
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['PIC sedang tugas luar kota', 'Tidak ada janji temu terkonfirmasi', 'Area pabrik sedang pemeliharaan (shutdown)'].map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRejectionReason(r)}
                className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                + {r}
              </button>
            ))}
          </div>
        </div>
      </ConfirmationModal>

      {/* ========================================================================= */}
      {/* 8. PERMANENT GATE QR POSTER MODAL (Tahap 4 & 16: QR Code Besar & Jelas) */}
      {/* ========================================================================= */}
      {isPermanentQrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cemindo-red" />
                <h3 className="font-bold text-sm">QR Code Registrasi Tamu</h3>
              </div>
              <button
                onClick={() => setIsPermanentQrOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cemindo-red block">
                PT CEMINDO GEMILANG TBK
              </span>
              <h2 className="text-base font-black text-slate-900">PLANT BATAM – MAIN GATE</h2>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                Scan QR Code ini menggunakan kamera HP untuk mendaftar mandiri tanpa login
              </p>

              {/* Large High Contrast QR Container */}
              <div className="p-4 bg-white border-2 border-slate-900 rounded-3xl shadow-inner mb-3">
                {permanentQrDataUrl ? (
                  <img
                    src={permanentQrDataUrl}
                    alt="Gate QR Code"
                    className="w-56 h-56 object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                    Membuat QR Code...
                  </div>
                )}
              </div>

              <p className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 py-1.5 px-3 rounded-lg break-all">
                {window.location.origin}/visitor/register
              </p>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-cemindo-red hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Poster QR</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPermanentQrOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODALS: Camera Scanner, Badge, Emergency Muster */}
      {/* ========================================================================= */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      <QrBadgeModal
        isOpen={isBadgeOpen}
        onClose={() => setIsBadgeOpen(false)}
        visit={searchedVisit}
      />

      <EmergencyListModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </div>
  );
}
