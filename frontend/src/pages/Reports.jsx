import React, { useState, useEffect } from 'react';
import { vmsApi } from '../services/api';
import { exportToExcel } from '../services/excelExport';
import { useLanguage } from '../i18n/LanguageContext';
import StatusBadge from '../components/StatusBadge';
import {
  FileBarChart,
  Download,
  Printer,
  Search,
  RefreshCw,
  Building,
  FileSpreadsheet,
  Calendar,
  Filter,
  RotateCcw,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function Reports() {
  const { t } = useLanguage();

  const [visits, setVisits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tahap 11 Required Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guestName, setGuestName] = useState('');
  const [company, setCompany] = useState('');
  const [departmentId, setDepartmentId] = useState('ALL');
  const [hostId, setHostId] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [visitType, setVisitType] = useState('ALL');
  const [quickSearch, setQuickSearch] = useState('');

  useEffect(() => {
    loadMasterData();
    loadReports();
  }, []);

  const loadMasterData = async () => {
    try {
      const [deptData, hostData] = await Promise.all([
        vmsApi.getDepartments(),
        vmsApi.getHosts()
      ]);
      setDepartments(deptData || []);
      setHosts(hostData || []);
    } catch (e) {
      console.warn('Failed to load master filters:', e);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (guestName.trim()) params.fullName = guestName.trim();
      if (company.trim()) params.company = company.trim();
      if (departmentId !== 'ALL') params.departmentId = departmentId;
      if (hostId !== 'ALL') params.hostId = hostId;
      if (status !== 'ALL') params.status = status;
      if (visitType !== 'ALL') params.visitType = visitType;
      if (quickSearch.trim()) params.search = quickSearch.trim();

      const data = await vmsApi.getVisitors(params);
      setVisits(data || []);
    } catch (e) {
      console.warn('Failed to fetch reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setGuestName('');
    setCompany('');
    setDepartmentId('ALL');
    setHostId('ALL');
    setStatus('ALL');
    setVisitType('ALL');
    setQuickSearch('');
    setTimeout(() => {
      vmsApi.getVisitors().then((data) => setVisits(data || []));
    }, 50);
  };

  const handleExportExcel = () => {
    exportToExcel(visits, 'Laporan_Kunjungan_VMS_Plant_Batam');
  };

  // Quick summary stats of current filtered result
  const countCheckedIn = visits.filter((v) => v.status === 'CHECKED_IN').length;
  const countCheckedOut = visits.filter((v) => v.status === 'CHECKED_OUT').length;
  const countWalkIn = visits.filter((v) => v.visitType === 'WALK_IN').length;
  const countPreRegistered = visits.filter((v) => v.visitType === 'PRE_REGISTERED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-cemindo-red border border-red-100 text-[11px] font-bold uppercase tracking-wider mb-2">
            <FileBarChart className="w-3.5 h-3.5" />
            <span>Tahap 11: Laporan Kunjungan & Export Excel</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('menuReports')}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Laporan lengkap audit pergerakan tamu di Pos Security PT Cemindo Gemilang Tbk – Plant Batam dengan filter multi-kriteria dan ekspor format resmi Excel (.xlsx).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={visits.length === 0}
            className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            title="Download Excel Report"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Hardcopy</span>
          </button>
          <button
            onClick={loadReports}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Card (Tahap 11 Mandatory Criteria) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cemindo-red" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Kriteria Filter Laporan
            </h2>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>

        {/* Row 1: Date Range & Quick Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Tanggal Awal (Start Date)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Tanggal Akhir (End Date)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Nama Tamu
            </label>
            <input
              type="text"
              placeholder="Contoh: Budi Gunawan"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Nama Perusahaan / Asal Instansi
            </label>
            <input
              type="text"
              placeholder="Contoh: PT Batam Teknik"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
            />
          </div>
        </div>

        {/* Row 2: Department, PIC, Status, Visit Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Department Tujuan
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
            >
              <option value="ALL">Semua Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Nama PIC / User yang Dituju
            </label>
            <select
              value={hostId}
              onChange={(e) => setHostId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
            >
              <option value="ALL">Semua Karyawan / PIC</option>
              {hosts.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.department ? `(${h.department.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Status Kunjungan
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
            >
              <option value="ALL">Semua Status</option>
              <option value="CHECKED_IN">Checked-In (Sedang di Pabrik)</option>
              <option value="CHECKED_OUT">Checked-Out (Selesai Kunjungan)</option>
              <option value="PENDING_VALIDATION">Menunggu Validasi Security</option>
              <option value="PENDING_APPROVAL">Menunggu Persetujuan PIC</option>
              <option value="APPROVED">Disetujui PIC (Menunggu Kedatangan)</option>
              <option value="CANCELLED">Dibatalkan</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Jenis Kunjungan
            </label>
            <select
              value={visitType}
              onChange={(e) => setVisitType(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
            >
              <option value="ALL">Semua Jenis Kunjungan</option>
              <option value="WALK_IN">Walk-In (Tanpa Janji)</option>
              <option value="PRE_REGISTERED">Pre-Registered (Ada Janji)</option>
            </select>
          </div>
        </div>

        {/* Row 3: Action Bar & Search Input */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode pass, nomor polisi, WA..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadReports()}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
            />
          </div>

          <button
            onClick={loadReports}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Search className="w-4 h-4 text-red-400" />
            <span>Terapkan Filter Laporan</span>
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Hasil Filter</span>
          <p className="text-xl font-extrabold text-slate-900 mt-0.5">{visits.length} <span className="text-xs font-normal text-slate-500">kunjungan</span></p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sedang di Pabrik (On-Site)</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{countCheckedIn} <span className="text-xs font-normal text-slate-500">tamu</span></p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telah Check-Out</span>
          <p className="text-xl font-extrabold text-slate-700 mt-0.5">{countCheckedOut} <span className="text-xs font-normal text-slate-500">tamu</span></p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Komposisi Kunjungan</span>
          <p className="text-xs font-bold text-slate-800 mt-1">
            Walk-In: <span className="text-amber-700 font-extrabold">{countWalkIn}</span> • Pre-Reg: <span className="text-blue-700 font-extrabold">{countPreRegistered}</span>
          </p>
        </div>
      </div>

      {/* Main Report Table (Tahap 11 Columns) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden" id="report-table">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Daftar Rekapitulasi Tamu ({visits.length} Baris Data)
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            Format resmi sesuai standar pelaporan PT Cemindo Gemilang Tbk
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cemindo-red mx-auto mb-2"></div>
            <span>Memuat data laporan kunjungan...</span>
          </div>
        ) : visits.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Tidak ada catatan kunjungan yang cocok dengan filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">No. Registrasi</th>
                  <th className="py-3 px-3">Nama Tamu & KTP</th>
                  <th className="py-3 px-3">Perusahaan & WA</th>
                  <th className="py-3 px-3">Department & PIC</th>
                  <th className="py-3 px-3">Keperluan Kunjungan</th>
                  <th className="py-3 px-3">Jenis & Tanggal</th>
                  <th className="py-3 px-3">Waktu Check-In</th>
                  <th className="py-3 px-3">Waktu Check-Out</th>
                  <th className="py-3 px-3">Durasi</th>
                  <th className="py-3 px-3">Petugas Security</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {visits.map((v, index) => {
                  const checkInDisplay = v.checkInTime
                    ? new Date(v.checkInTime).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-';
                  const checkOutDisplay = v.checkOutTime
                    ? new Date(v.checkOutTime).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-';
                  const expectedDisplay = v.expectedDate
                    ? new Date(v.expectedDate).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '-';

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {v.visitCode}
                        {v.visitorBadgeNumber && (
                          <span className="block text-[10px] text-cemindo-red font-semibold">
                            Badge: #{v.visitorBadgeNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{v.fullName}</p>
                        {v.identityNumber && (
                          <p className="text-[10px] font-mono text-slate-400">
                            NIK: {v.identityNumber}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-slate-800 font-semibold">{v.company}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {v.phoneNumber}
                        </p>
                        {v.vehiclePlateNumber && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            Pol: {v.vehiclePlateNumber}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {v.destinationDepartment?.name || '-'}
                        </span>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                          PIC: {v.hostNameManual || v.host?.name || '-'}
                        </p>
                      </td>
                      <td className="py-3 px-3 max-w-[200px]">
                        <p className="text-slate-700 line-clamp-2">{v.purpose}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          v.visitType === 'WALK_IN' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {v.visitType === 'WALK_IN' ? 'Walk-In' : 'Pre-Reg'}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{expectedDisplay}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-800">
                        {checkInDisplay}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {checkOutDisplay}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {v.durationFormatted || '-'}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-600">
                        <p className="font-medium">In: {v.securityCheckInBy?.name || '-'}</p>
                        <p className="text-slate-400">Out: {v.securityCheckOutBy?.name || '-'}</p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={v.status} size="xs" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
