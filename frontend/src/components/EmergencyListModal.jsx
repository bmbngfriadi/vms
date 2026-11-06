import React, { useState, useEffect } from 'react';
import { vmsApi } from '../services/api';
import {
  AlertOctagon,
  Printer,
  X,
  Phone,
  Building,
  User,
  Clock,
  ShieldAlert,
  Download,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function EmergencyListModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadEmergencyList();
    }
  }, [isOpen]);

  const loadEmergencyList = async () => {
    try {
      setLoading(true);
      const res = await vmsApi.getEmergencyList();
      setData(res);
    } catch (err) {
      console.warn('Failed to fetch emergency list:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const list = data?.emergencyList || [];
  const overstayCount = list.filter((v) => v.isOverstay).length;
  const printDate = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border-2 border-red-600">
        {/* Top Emergency Header */}
        <div className="bg-red-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <AlertOctagon className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white text-red-700 font-extrabold text-[10px] tracking-wider uppercase">
                  EMERGENCY HEADCOUNT
                </span>
                <span className="text-xs text-red-100">Muster Point Roll-Call</span>
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5">
                Daftar Tamu Masih di Area Pabrik (Emergency Visitor List)
              </h2>
              <p className="text-[11px] text-red-100">
                PT Cemindo Gemilang Tbk – Plant Batam | Data real-time seluruh personil non-karyawan yang belum Check-Out
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="py-2 px-3.5 bg-white text-red-800 hover:bg-red-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              title="Cetak Daftar Evakuasi untuk Danru K3"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Roll-Call</span>
            </button>
            <button
              onClick={loadEmergencyList}
              className="p-2 bg-red-800 hover:bg-red-900 text-white rounded-xl transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Headcount Bar */}
        <div className="bg-red-50 p-4 border-b border-red-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
                Total Headcount Tamu Aktif:
              </span>
              <p className="text-2xl font-black text-red-800">
                {list.length} <span className="text-xs font-bold">Jiwa / Orang</span>
              </p>
            </div>

            {overstayCount > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-bold text-[11px]">
                  {overstayCount} Tamu Berada di Atas Batas Waktu Normal (Overstay)
                </span>
              </div>
            )}
          </div>

          <div className="text-right text-[11px] text-slate-500 font-mono">
            Waktu Cetak / Audit: <strong className="text-slate-800">{printDate} WIB</strong>
          </div>
        </div>

        {/* Visitor Table for Evacuation Roll Call */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5" id="emergency-print-area">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
              <span>Mengambil data tamu on-site...</span>
            </div>
          ) : list.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500">
              <ShieldAlert className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-800">Kondisi Area Bersih / Clean Area</p>
              <p className="text-slate-400 mt-1">Saat ini tidak ada tamu luar yang tercatat berada di dalam area pabrik.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-2.5 px-3 border border-slate-200">No</th>
                    <th className="py-2.5 px-3 border border-slate-200">Pass / Badge</th>
                    <th className="py-2.5 px-3 border border-slate-200">Nama Lengkap Tamu</th>
                    <th className="py-2.5 px-3 border border-slate-200">Perusahaan & Kontak WA</th>
                    <th className="py-2.5 px-3 border border-slate-200">Department Tujuan</th>
                    <th className="py-2.5 px-3 border border-slate-200">PIC yang Bertanggung Jawab</th>
                    <th className="py-2.5 px-3 border border-slate-200">Waktu Masuk</th>
                    <th className="py-2.5 px-3 border border-slate-200">Durasi di Pabrik</th>
                    <th className="py-2.5 px-3 border border-slate-200 text-center">Evakuasi (Roll-Call)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {list.map((v, i) => (
                    <tr
                      key={v.id}
                      className={v.isOverstay ? 'bg-amber-50/60 font-semibold' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2.5 px-3 border border-slate-200 text-center text-slate-500 font-mono">
                        {i + 1}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200 font-mono">
                        <span className="font-bold text-slate-900">{v.visitCode}</span>
                        {v.visitorBadgeNumber && (
                          <span className="block text-[10px] text-red-600 font-bold">
                            Badge #{v.visitorBadgeNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200">
                        <p className="font-extrabold text-slate-900">{v.fullName}</p>
                        {v.identityNumber && (
                          <p className="text-[10px] font-mono text-slate-500">
                            NIK: {v.identityNumber}
                          </p>
                        )}
                        {v.vehiclePlateNumber && (
                          <p className="text-[10px] font-mono text-slate-600">
                            Kendaraan: {v.vehiclePlateNumber}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200">
                        <p className="text-slate-800 font-bold">{v.company}</p>
                        <p className="text-[10px] text-slate-600 font-mono">
                          WA: {v.phoneNumber}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold">
                          {v.destinationDepartment?.name || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200">
                        <p className="font-bold text-slate-900">
                          {v.hostNameManual || v.host?.name || '-'}
                        </p>
                        {v.host?.phone && (
                          <p className="text-[10px] text-slate-500 font-mono">
                            Telp: {v.host.phone}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200 font-semibold text-emerald-800">
                        {v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WIB
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.isOverstay
                              ? 'bg-red-600 text-white animate-pulse'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {v.durationFormatted}
                          {v.isOverstay ? ' (OVERSTAY)' : ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200 text-center">
                        <div className="w-6 h-6 border-2 border-slate-400 rounded mx-auto"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Safety Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Prosedur Tanggap Darurat K3 PT Cemindo Gemilang Tbk – Plant Batam</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
          >
            Tutup Jendela
          </button>
        </div>
      </div>
    </div>
  );
}

