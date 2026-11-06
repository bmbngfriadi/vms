import React, { useState, useEffect } from 'react';
import { vmsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import QrBadgeModal from '../components/QrBadgeModal';
import PreRegisterModal from '../components/PreRegisterModal';
import StatusBadge from '../components/StatusBadge';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  LogIn,
  LogOut,
  Calendar,
  Building,
  RefreshCw,
  Clock,
  Printer,
  Ban,
  CalendarCheck
} from 'lucide-react';

export default function VisitorManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [visits, setVisits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);
  const [isPreRegisterOpen, setIsPreRegisterOpen] = useState(false);
  const [rejectModalVisit, setRejectModalVisit] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cancelModalVisit, setCancelModalVisit] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadDepartments();
    loadVisits();
  }, [statusFilter, departmentFilter, dateFilter]);

  const loadDepartments = async () => {
    try {
      const data = await vmsApi.getDepartments();
      setDepartments(data || []);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadVisits = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (departmentFilter !== 'ALL') params.departmentId = departmentFilter;
      if (dateFilter) params.date = dateFilter;
      if (search) params.search = search;

      const data = await vmsApi.getVisitors(params);
      setVisits(data || []);
    } catch (err) {
      console.warn('Failed to load visits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadVisits();
  };

  const handleApprove = async (id) => {
    try {
      await vmsApi.approveVisitor(id);
      loadVisits();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalVisit) return;
    try {
      await vmsApi.rejectVisitor(rejectModalVisit.id, rejectionReason);
      setRejectModalVisit(null);
      setRejectionReason('');
      loadVisits();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject');
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelModalVisit) return;
    try {
      await vmsApi.cancelVisitor(cancelModalVisit.id, cancelReason);
      setCancelModalVisit(null);
      setCancelReason('');
      loadVisits();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel');
    }
  };

  const handleCheckIn = async (v) => {
    try {
      await vmsApi.checkInVisitor({ id: v.id });
      loadVisits();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to check in');
    }
  };

  const handleCheckOut = async (v) => {
    try {
      await vmsApi.checkOutVisitor({ id: v.id });
      loadVisits();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to check out');
    }
  };

  const isSecurity = user?.role === 'SECURITY' || user?.role === 'ADMIN';
  const isHost = user?.role === 'HOST_PIC' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t('menuVisitorManagement')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isHost && user?.role === 'HOST_PIC'
              ? 'Authorized visits assigned to your department / hosted by you'
              : 'Manage registrations, host authorizations, security approvals, and visitor badges'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={() => setIsPreRegisterOpen(true)}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{t('menuPreRegister')}</span>
            </button>
          )}
          <button
            onClick={loadVisits}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title={t('action_refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('action_search')}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
          >
            {t('action_filter')}
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
            >
              <option value="ALL">{t('status_ALL')}</option>
              <option value="PENDING_VALIDATION">{t('status_PENDING_VALIDATION') || 'Menunggu Validasi'}</option>
              <option value="APPROVED">{t('status_APPROVED')}</option>
              <option value="CHECKED_IN">{t('status_CHECKED_IN')}</option>
              <option value="CHECKED_OUT">{t('status_CHECKED_OUT')}</option>
              <option value="CANCELLED">{t('status_CANCELLED')}</option>
              <option value="REJECTED">{t('status_REJECTED')}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Expected Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Visitor Passes Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Visit Code</th>
                <th className="py-3.5 px-4">Visitor Details</th>
                <th className="py-3.5 px-4">Department & Host PIC</th>
                <th className="py-3.5 px-4">Schedule & Vehicle</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                visits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {v.visitCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{v.fullName}</p>
                      <p className="text-[11px] text-slate-500">{v.company}</p>
                      <p className="text-[10px] text-slate-400 font-mono">WA: {v.phoneNumber}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        {v.destinationDepartment?.name}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        PIC: {v.hostNameManual || v.host?.name || '-'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-800">
                        {new Date(v.expectedDate).toLocaleDateString()} {v.expectedTime}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{v.vehiclePlateNumber || 'No vehicle'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={v.status} size="xs" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedVisit(v);
                            setIsBadgeOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title="View Pass & QR"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Host Approval & Cancellation Actions */}
                        {isHost && v.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleApprove(v.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-sm"
                            >
                              {t('action_approve')}
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalVisit(v);
                                setRejectionReason('');
                              }}
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-bold"
                            >
                              {t('action_reject')}
                            </button>
                          </>
                        )}

                        {/* PIC can cancel registration before Check-in */}
                        {isHost && (v.status === 'PENDING_APPROVAL' || v.status === 'APPROVED') && (
                          <button
                            onClick={() => {
                              setCancelModalVisit(v);
                              setCancelReason('');
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title={t('action_cancelVisit')}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Security Check-In & Check-Out */}
                        {isSecurity && (
                          <>
                            {v.status === 'APPROVED' && (
                              <button
                                onClick={() => handleCheckIn(v)}
                                className="px-2.5 py-1 bg-cemindo-red hover:bg-cemindo-darkred text-white rounded-lg text-[10px] font-bold"
                              >
                                {t('action_checkIn')}
                              </button>
                            )}
                            {v.status === 'CHECKED_IN' && (
                              <button
                                onClick={() => handleCheckOut(v)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold"
                              >
                                {t('action_checkOut')}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Rejection (Tahap 16: ConfirmationModal) */}
      <ConfirmationModal
        isOpen={!!rejectModalVisit}
        onClose={() => setRejectModalVisit(null)}
        onConfirm={handleRejectConfirm}
        title="Tolak Permintaan Kunjungan"
        type="danger"
        confirmText="Konfirmasi Tolak"
        cancelText="Batal"
        confirmDisabled={!rejectionReason.trim()}
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Masukkan alasan penolakan untuk kunjungan <strong>{rejectModalVisit?.visitCode}</strong> ({rejectModalVisit?.fullName} - {rejectModalVisit?.company}):
          </p>
          <textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Contoh: PIC sedang dinas luar / Jadwal tidak memungkinkan"
            className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </ConfirmationModal>

      {/* Modal Cancel Registration (Tahap 16: ConfirmationModal) */}
      <ConfirmationModal
        isOpen={!!cancelModalVisit}
        onClose={() => setCancelModalVisit(null)}
        onConfirm={handleCancelConfirm}
        title="Batalkan Registrasi Kunjungan"
        type="warning"
        confirmText="Konfirmasi Batalkan"
        cancelText="Kembali"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Apakah Anda yakin ingin membatalkan registrasi tamu <strong>{cancelModalVisit?.fullName}</strong> ({cancelModalVisit?.visitCode})?
          </p>
          <textarea
            rows={2}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Alasan pembatalan kunjungan (opsional)"
            className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </ConfirmationModal>

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
          loadVisits();
        }}
      />
    </div>
  );
}
