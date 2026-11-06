import React, { useState, useEffect } from 'react';
import { vmsApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import {
  MessageSquare,
  RefreshCw,
  Send,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Users,
  FileText,
  List,
  Plus,
  Trash2,
  Edit2,
  X,
  RotateCcw,
  QrCode,
  HardDrive
} from 'lucide-react';

export default function WhatsAppSettings() {
  const { t } = useLanguage();

  // Active tab: 'ENGINE', 'RECIPIENTS', 'TEMPLATES', 'LOGS'
  const [activeTab, setActiveTab] = useState('ENGINE');

  // Engine State
  const [statusData, setStatusData] = useState(null);
  const [restarting, setRestarting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState(
    'PT Cemindo Gemilang Tbk – Plant Batam: Uji coba koneksi WhatsApp Gateway VMS.'
  );
  const [sendQrImageTest, setSendQrImageTest] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Management Recipients State
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipientModalOpen, setRecipientModalOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [recipientForm, setRecipientForm] = useState({
    name: '',
    phone: '',
    title: '',
    department: 'Management',
    notes: '',
    isActive: true
  });

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    templateBody: '',
    isQrImage: false,
    isActive: true
  });

  // Message Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logStatusFilter, setLogStatusFilter] = useState('ALL');
  const [retryingLogId, setRetryingLogId] = useState(null);

  useEffect(() => {
    loadEngineStatus();
    const interval = setInterval(loadEngineStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'RECIPIENTS') loadRecipients();
    if (activeTab === 'TEMPLATES') loadTemplates();
    if (activeTab === 'LOGS') loadLogs();
  }, [activeTab, logStatusFilter]);

  const loadEngineStatus = async () => {
    try {
      const data = await vmsApi.getWhatsAppStatus();
      setStatusData(data);
    } catch (e) {
      console.warn('Failed to load WA status:', e);
    }
  };

  const loadRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const data = await vmsApi.getManagementRecipients();
      setRecipients(data || []);
    } catch (e) {
      console.warn('Failed to load recipients:', e);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await vmsApi.getNotificationTemplates();
      setTemplates(data || []);
    } catch (e) {
      console.warn('Failed to load templates:', e);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const params = {};
      if (logStatusFilter !== 'ALL') params.status = logStatusFilter;
      const data = await vmsApi.getWhatsAppLogs(params);
      setLogs(data || []);
    } catch (e) {
      console.warn('Failed to load logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRestart = async () => {
    try {
      setRestarting(true);
      await vmsApi.restartWhatsApp();
      setTimeout(() => {
        setRestarting(false);
        loadEngineStatus();
      }, 3000);
    } catch (e) {
      setRestarting(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testPhone) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await vmsApi.sendTestWhatsApp(testPhone, testMessage, sendQrImageTest);
      setTestResult({
        success: true,
        message: 'Pesan uji coba berhasil diproses ke WhatsApp!'
      });
      loadEngineStatus();
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.error || err.message
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Recipient Handlers
  const handleOpenRecipientModal = (recipient = null) => {
    if (recipient) {
      setEditingRecipient(recipient);
      setRecipientForm({
        name: recipient.name,
        phone: recipient.phone,
        title: recipient.title || '',
        department: recipient.department || 'Management',
        notes: recipient.notes || '',
        isActive: recipient.isActive
      });
    } else {
      setEditingRecipient(null);
      setRecipientForm({
        name: '',
        phone: '',
        title: '',
        department: 'Management',
        notes: '',
        isActive: true
      });
    }
    setRecipientModalOpen(true);
  };

  const handleSaveRecipient = async (e) => {
    e.preventDefault();
    try {
      if (editingRecipient) {
        await vmsApi.updateManagementRecipient(editingRecipient.id, recipientForm);
      } else {
        await vmsApi.createManagementRecipient(recipientForm);
      }
      setRecipientModalOpen(false);
      loadRecipients();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan penerima');
    }
  };

  const handleDeleteRecipient = async (id) => {
    if (!window.confirm('Hapus nomor Management ini dari daftar penerima notifikasi?')) return;
    try {
      await vmsApi.deleteManagementRecipient(id);
      loadRecipients();
    } catch (err) {
      alert('Gagal menghapus penerima');
    }
  };

  const handleToggleRecipientStatus = async (id, currentStatus) => {
    try {
      await vmsApi.toggleManagementRecipientStatus(id, !currentStatus);
      loadRecipients();
    } catch (e) {
      console.warn(e);
    }
  };

  // Template Handlers
  const handleOpenTemplateModal = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      templateBody: template.templateBody,
      isQrImage: template.isQrImage,
      isActive: template.isActive
    });
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate) return;
    try {
      await vmsApi.updateNotificationTemplate(editingTemplate.id, templateForm);
      setEditingTemplate(null);
      loadTemplates();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memperbarui template');
    }
  };

  const handleInsertPlaceholder = (placeholder) => {
    setTemplateForm((prev) => ({
      ...prev,
      templateBody: `${prev.templateBody} {${placeholder}}`
    }));
  };

  // Log Retry Handler
  const handleRetryLog = async (id) => {
    setRetryingLogId(id);
    try {
      await vmsApi.retryWhatsAppLog(id);
      setTimeout(loadLogs, 1500);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal melakukan retry');
    } finally {
      setRetryingLogId(null);
    }
  };

  const isConnected = statusData?.status === 'CONNECTED';
  const isScanQr = statusData?.status === 'SCAN_QR' && statusData?.qrDataUrl;

  const placeholdersList = [
    'guestName',
    'company',
    'phone',
    'purpose',
    'department',
    'picName',
    'visitCode',
    'time',
    'date',
    'officerName',
    'duration',
    'badgeNumber',
    'vehiclePlate',
    'reason'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Direct Baileys WhatsApp Engine (@whiskeysockets/baileys)</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t('menuWhatsApp')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Layanan WhatsApp Gateway mandiri terintegrasi Redis & BullMQ. Bebas gateway pihak ketiga. Sesi tersimpan aman permanen di Docker Volume.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            disabled={restarting}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${restarting ? 'animate-spin' : ''}`} />
            <span>{t('waRestartBtn')}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('ENGINE')}
          className={`py-2.5 px-4 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ENGINE'
              ? 'bg-cemindo-red text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>{t('tab_waEngine')}</span>
        </button>

        <button
          onClick={() => setActiveTab('RECIPIENTS')}
          className={`py-2.5 px-4 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'RECIPIENTS'
              ? 'bg-cemindo-red text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('tab_waRecipients')}</span>
        </button>

        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`py-2.5 px-4 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'TEMPLATES'
              ? 'bg-cemindo-red text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t('tab_waTemplates')}</span>
        </button>

        <button
          onClick={() => setActiveTab('LOGS')}
          className={`py-2.5 px-4 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'LOGS'
              ? 'bg-cemindo-red text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <List className="w-4 h-4" />
          <span>{t('tab_waLogs')}</span>
        </button>
      </div>

      {/* ============================================================================== */}
      {/* TAB 1: BAILEYS ENGINE & PAIRING QR */}
      {/* ============================================================================== */}
      {activeTab === 'ENGINE' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Status Koneksi Baileys
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isConnected
                      ? 'bg-emerald-500 animate-pulse'
                      : isScanQr
                      ? 'bg-amber-500 animate-ping'
                      : 'bg-red-500'
                  }`}
                />
                <span className="font-extrabold text-slate-900 text-sm">
                  {isConnected
                    ? t('waStatusConnected')
                    : isScanQr
                    ? t('waStatusScanQr')
                    : t('waStatusDisconnected')}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Auto-Reconnect: <strong className="text-emerald-700">Aktif (Heartbeat Standby)</strong>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('waActiveNumber')}
              </span>
              <div className="mt-2 font-mono font-extrabold text-slate-900 text-sm">
                {statusData?.user?.id
                  ? statusData.user.id.split(':')[0]
                  : 'Belum Terhubung'}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Nama Device: {statusData?.user?.name || 'PT Cemindo Gemilang VMS'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Docker Session Storage
              </span>
              <div className="mt-2 flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                <HardDrive className="w-4 h-4 text-emerald-600" />
                <span>Docker Volume: vms_wa_auth</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Path: <code className="font-mono text-[9px] bg-slate-100 px-1 py-0.5 rounded">/app/baileys_auth</code> (Permanen)
              </p>
            </div>
          </div>

          {/* QR Pairing / Connected Display */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            {isConnected ? (
              <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-emerald-900">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    WhatsApp Gateway Siap Mengirim Notifikasi
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    Sesi autentikasi WhatsApp Plant Batam aktif. Seluruh notifikasi Walk-In, Pre-Register, Check-In (gambar QR Code), Check-Out, dan penolakan/pembatalan dikirimkan secara otomatis via antrean BullMQ Redis.
                  </p>
                </div>
              </div>
            ) : isScanQr ? (
              <div className="flex flex-col md:flex-row items-center gap-8 p-4">
                <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-md">
                  <img
                    src={statusData.qrDataUrl}
                    alt="WhatsApp Pairing QR"
                    className="w-64 h-64 object-contain"
                  />
                  <p className="text-center text-[10px] text-slate-400 mt-2 font-mono">
                    Perbarui otomatis saat expired
                  </p>
                </div>
                <div className="space-y-3 max-w-md text-xs text-slate-700">
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider">
                    Langkah Pairing Perangkat
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Pindai QR Code Menggunakan Aplikasi WhatsApp
                  </h3>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 leading-relaxed">
                    <li>Buka aplikasi WhatsApp di HP operasional atau nomor resmi perusahaan.</li>
                    <li>Ketuk <strong>Menu</strong> (Android) atau <strong>Pengaturan</strong> (iPhone).</li>
                    <li>Pilih <strong>Perangkat Tertaut (Linked Devices)</strong>.</li>
                    <li>Ketuk <strong>Tautkan Perangkat (Link a Device)</strong>.</li>
                    <li>Arahkan kamera HP ke QR Code di sebelah kiri.</li>
                  </ol>
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    💡 Kredensial akan disimpan permanen ke Docker Volume sehingga tidak perlu scan ulang setiap kali container direstart.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <p className="text-xs text-slate-500">
                  Menghubungkan ke soket WhatsApp... Jika QR belum muncul, klik tombol <strong>Restart Baileys Client</strong> di atas.
                </p>
              </div>
            )}
          </div>

          {/* Test Message Box (Text & QR Image) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 mb-1 flex items-center gap-2">
              <Send className="w-4 h-4 text-cemindo-red" />
              <span>Kirim Pesan Uji Coba (Test WhatsApp Message)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Uji coba pengiriman pesan langsung dari server ke nomor WhatsApp tertentu untuk memverifikasi soket Baileys.
            </p>

            {testResult && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <form onSubmit={handleSendTest} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Tujuan (Format: 62812xxxxxxxx atau 0812...)
                  </label>
                  <input
                    type="tel"
                    required
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="e.g. 6281234567890"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendQrImageTest}
                      onChange={(e) => setSendQrImageTest(e.target.checked)}
                      className="rounded text-cemindo-red focus:ring-cemindo-red w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Lampirkan Gambar QR Code Uji Coba (Test QR Image)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Pesan Uji Coba
                </label>
                <input
                  type="text"
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={testLoading}
                className="py-2.5 px-5 bg-cemindo-red hover:bg-cemindo-darkred text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testLoading ? 'Mengirim...' : 'Kirim Pesan Uji Coba'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 2: MANAGEMENT RECIPIENTS (Tahap 8) */}
      {/* ============================================================================== */}
      {activeTab === 'RECIPIENTS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {t('tab_waRecipients')}
              </h2>
              <p className="text-xs text-slate-500">
                Kelola daftar nomor WhatsApp pimpinan & Management yang menerima notifikasi otomatis saat tamu Check-In dan Check-Out.
              </p>
            </div>
            <button
              onClick={() => handleOpenRecipientModal()}
              className="py-2.5 px-4 bg-cemindo-red hover:bg-cemindo-darkred text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addRecipient')}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider bg-slate-50">
                  <th className="py-3 px-3">Nama Pejabat</th>
                  <th className="py-3 px-3">Nomor WhatsApp</th>
                  <th className="py-3 px-3">Jabatan / Posisi</th>
                  <th className="py-3 px-3">Departemen</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingRecipients ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      Memuat daftar penerima...
                    </td>
                  </tr>
                ) : recipients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      Belum ada nomor Management terdaftar. Klik tombol Tambah di atas.
                    </td>
                  </tr>
                ) : (
                  recipients.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {r.name}
                        {r.notes && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {r.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                        {r.phone}
                      </td>
                      <td className="py-3 px-3 text-slate-700">{r.title || '-'}</td>
                      <td className="py-3 px-3 text-slate-600">{r.department || '-'}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleRecipientStatus(r.id, r.isActive)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                            r.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {r.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setTestPhone(r.phone);
                            setActiveTab('ENGINE');
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                          title="Kirim Pesan Uji Coba"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => handleOpenRecipientModal(r)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                          title="Ubah Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecipient(r.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 3: NOTIFICATION TEMPLATES (Tahap 8) */}
      {/* ============================================================================== */}
      {activeTab === 'TEMPLATES' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900">
              {t('tab_waTemplates')}
            </h2>
            <p className="text-xs text-slate-500">
              Format teks notifikasi otomatis untuk setiap peristiwa kunjungan. Klik tombol ubah untuk menyesuaikan susunan kalimat template.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingTemplates ? (
              <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
                Memuat template notifikasi...
              </div>
            ) : (
              templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {tpl.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {tpl.isQrImage && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            <QrCode className="w-3 h-3" />
                            <span>Gambar QR</span>
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {tpl.category}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-xs text-slate-900 mb-1">
                      {tpl.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-3">
                      {tpl.description}
                    </p>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                      {tpl.templateBody}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() => handleOpenTemplateModal(tpl)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{t('editTemplate')}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 4: MESSAGE LOGS & IDEMPOTENCY QUEUE (Tahap 7) */}
      {/* ============================================================================== */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {t('tab_waLogs')}
              </h2>
              <p className="text-xs text-slate-500">
                Riwayat pesan terkirim, status pengiriman, pencatatan Idempotency Key, dan fitur pengiriman ulang jika gagal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700"
              >
                <option value="ALL">Semua Status</option>
                <option value="SENT">Berhasil (SENT)</option>
                <option value="FAILED">Gagal (FAILED)</option>
                <option value="PENDING">Antrean (PENDING)</option>
              </select>
              <button
                onClick={loadLogs}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                title="Segarkan Log"
              >
                <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider bg-slate-50">
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Penerima</th>
                  <th className="py-3 px-3">Tipe / Idempotency Key</th>
                  <th className="py-3 px-3">Cuplikan Pesan</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingLogs ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      Memuat riwayat pesan...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      Belum ada riwayat pesan dalam kriteria filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {log.recipient}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">{log.type}</span>
                        {log.idempotencyKey && (
                          <span className="font-mono text-[9px] text-slate-400 block truncate max-w-[180px]">
                            {log.idempotencyKey}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-xs truncate">
                        {log.message}
                        {log.lastError && (
                          <span className="block text-[10px] text-red-600 font-semibold truncate">
                            Error: {log.lastError}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            log.status === 'SENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.status}
                        </span>
                        {log.retryCount > 0 && (
                          <span className="block text-[9px] text-slate-400 mt-0.5">
                            Retry: {log.retryCount}x
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {log.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetryLog(log.id)}
                            disabled={retryingLogId === log.id}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 ml-auto transition disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3 h-3 ${retryingLogId === log.id ? 'animate-spin' : ''}`} />
                            <span>{t('retryBtn')}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL: ADD / EDIT MANAGEMENT RECIPIENT */}
      {/* ============================================================================== */}
      {recipientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingRecipient ? t('editRecipient') : t('addRecipient')}
              </h3>
              <button
                onClick={() => setRecipientModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipient} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('recipientName')} *
                </label>
                <input
                  type="text"
                  required
                  value={recipientForm.name}
                  onChange={(e) => setRecipientForm({ ...recipientForm, name: e.target.value })}
                  placeholder="e.g. Ir. Bambang Trihatmojo"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('recipientPhone')} *
                </label>
                <input
                  type="tel"
                  required
                  value={recipientForm.phone}
                  onChange={(e) => setRecipientForm({ ...recipientForm, phone: e.target.value })}
                  placeholder="6281234567890"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('recipientTitle')}
                  </label>
                  <input
                    type="text"
                    value={recipientForm.title}
                    onChange={(e) => setRecipientForm({ ...recipientForm, title: e.target.value })}
                    placeholder="e.g. Plant GM"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('recipientDept')}
                  </label>
                  <input
                    type="text"
                    value={recipientForm.department}
                    onChange={(e) => setRecipientForm({ ...recipientForm, department: e.target.value })}
                    placeholder="e.g. Executive"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={recipientForm.notes}
                  onChange={(e) => setRecipientForm({ ...recipientForm, notes: e.target.value })}
                  placeholder="Penerima laporan prioritas..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recipientForm.isActive}
                    onChange={(e) => setRecipientForm({ ...recipientForm, isActive: e.target.checked })}
                    className="rounded text-cemindo-red focus:ring-cemindo-red w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Aktif menerima notifikasi laporan kunjungan
                  </span>
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecipientModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-cemindo-red text-white"
                >
                  Simpan Penerima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL: EDIT NOTIFICATION TEMPLATE */}
      {/* ============================================================================== */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <span className="font-mono text-[10px] text-slate-400 font-bold block">
                  {editingTemplate.code}
                </span>
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingTemplate.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama / Keterangan Template
                </label>
                <input
                  type="text"
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Format Isi Pesan Template
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Klik variabel untuk menyisipkan
                  </span>
                </div>

                {/* Variable Pills */}
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-100 rounded-xl mb-2">
                  {placeholdersList.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleInsertPlaceholder(p)}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-[10px] font-mono text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition"
                      title={`Sisipkan {${p}}`}
                    >
                      +{`{${p}}`}
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  rows={8}
                  value={templateForm.templateBody}
                  onChange={(e) => setTemplateForm({ ...templateForm, templateBody: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono leading-relaxed"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-cemindo-red text-white"
                >
                  Simpan Perubahan Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
