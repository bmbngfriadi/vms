import React, { useState, useEffect } from 'react';
import { vmsApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Ban,
  Plus,
  Search,
  ShieldAlert,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Building,
  Phone,
  CreditCard,
  UserCheck
} from 'lucide-react';

export default function VisitorBlacklist() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    identityNumber: '',
    phoneNumber: '',
    company: '',
    reason: '',
    isActive: true
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Delete modal
  const [deleteModalEntry, setDeleteModalEntry] = useState(null);

  useEffect(() => {
    loadBlacklist();
  }, []);

  const loadBlacklist = async () => {
    try {
      setLoading(true);
      const data = await vmsApi.getBlacklist();
      setBlacklist(data || []);
    } catch (err) {
      console.warn('Failed to load blacklist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingEntry(null);
    setFormData({
      fullName: '',
      identityNumber: '',
      phoneNumber: '',
      company: '',
      reason: '',
      isActive: true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    setFormData({
      fullName: entry.fullName || '',
      identityNumber: entry.identityNumber || '',
      phoneNumber: entry.phoneNumber || '',
      company: entry.company || '',
      reason: entry.reason || '',
      isActive: Boolean(entry.isActive)
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setFormError('Nama lengkap tamu wajib diisi.');
      return;
    }
    if (!formData.reason.trim()) {
      setFormError('Alasan pemblokiran / blacklist wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      if (editingEntry) {
        await vmsApi.updateBlacklist(editingEntry.id, formData);
        showToast('Data blacklist berhasil diperbarui.');
      } else {
        await vmsApi.createBlacklist(formData);
        showToast('Tamu berhasil ditambahkan ke daftar Blacklist.');
      }

      setIsModalOpen(false);
      loadBlacklist();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Gagal menyimpan data blacklist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (entry) => {
    try {
      const nextStatus = !entry.isActive;
      await vmsApi.toggleBlacklistStatus(entry.id, nextStatus);
      showToast(nextStatus ? 'Status blacklist diaktifkan.' : 'Status blacklist dinonaktifkan.');
      loadBlacklist();
    } catch (err) {
      alert('Gagal mengubah status blacklist');
    }
  };

  const handleDelete = async () => {
    if (!deleteModalEntry) return;
    try {
      await vmsApi.deleteBlacklist(deleteModalEntry.id);
      showToast('Data blacklist telah dihapus.');
      setDeleteModalEntry(null);
      loadBlacklist();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus data');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const filteredList = blacklist.filter((item) => {
    const matchSearch =
      !search.trim() ||
      item.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      item.company?.toLowerCase().includes(search.toLowerCase()) ||
      item.identityNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.phoneNumber?.includes(search) ||
      item.reason?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && item.isActive) ||
      (statusFilter === 'INACTIVE' && !item.isActive);

    return matchSearch && matchStatus;
  });

  const activeBlacklistCount = blacklist.filter((b) => b.isActive).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-cemindo-red border border-red-100 text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Tahap 12: Plant Security & Visitor Blacklist</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Daftar Blacklist Tamu</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Tamu yang terdaftar aktif dalam daftar ini otomatis diblokir oleh sistem saat mendaftar di pos masuk (Walk-In) maupun saat PIC membuat janji temu (Pre-Registration).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {(user?.role === 'ADMIN' || user?.role === 'SECURITY') && (
            <button
              onClick={handleOpenAddModal}
              className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tamu ke Blacklist</span>
            </button>
          )}
          <button
            onClick={loadBlacklist}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh Data"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Security Advisory Card */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Prosedur Keamanan Pabrik (K3 & Security Plant Batam):</p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Pencocokan nama dilakukan secara otomatis berdasarkan kesamaan nama lengkap, nomor KTP/SIM, atau 8 digit terakhir nomor WhatsApp. Tamu blacklist tidak diizinkan memasuki kawasan pabrik tanpa persetujuan tertulis dari Plant Head & Danru Security.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, perusahaan, NIK, alasan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Hanya Status Aktif ({activeBlacklistCount})</option>
            <option value="INACTIVE">Nonaktif / Riwayat</option>
          </select>
        </div>
      </div>

      {/* Blacklist Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Daftar Blacklist ({filteredList.length} Orang Terdaftar)
          </h2>
          <span className="text-[11px] text-red-600 font-bold">
            {activeBlacklistCount} Pemblokiran Aktif
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
            <span>Memuat data blacklist...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Tidak ada data blacklist yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Tamu & KTP</th>
                  <th className="py-3 px-3">Perusahaan & Kontak</th>
                  <th className="py-3 px-3">Alasan Pemblokiran / K3 Violation</th>
                  <th className="py-3 px-3">Didaftarkan Oleh</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredList.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{entry.fullName}</p>
                      {entry.identityNumber && (
                        <p className="text-[10px] font-mono text-slate-500">
                          NIK: {entry.identityNumber}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{entry.company || '-'}</p>
                      {entry.phoneNumber && (
                        <p className="text-[10px] text-slate-500 font-mono">
                          WA: {entry.phoneNumber}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 max-w-[280px]">
                      <div className="p-2 rounded-xl bg-red-50/70 border border-red-100 text-red-900 text-[11px] leading-relaxed">
                        {entry.reason}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      <p className="font-semibold text-slate-700">
                        {entry.createdBy?.name || 'Administrator'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(entry.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(entry)}
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                          entry.isActive
                            ? 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200'
                        }`}
                        title="Klik untuk beralih status aktif/nonaktif"
                      >
                        {entry.isActive ? 'BLOCKED / AKTIF' : 'NONAKTIF'}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(entry)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="Ubah Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => setDeleteModalEntry(entry)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  {editingEntry ? 'Ubah Catatan Blacklist' : 'Tambah Tamu ke Daftar Blacklist'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap Tamu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rudi Irawan"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nomor KTP / SIM / Paspor
                  </label>
                  <input
                    type="text"
                    placeholder="16 digit NIK"
                    value={formData.identityNumber}
                    onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="62812xxxx"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Perusahaan / Asal Instansi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PT Sumber Material Logistik"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alasan Pemblokiran / Pelanggaran K3 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan alasan detail pemblokiran (contoh: Pelanggaran K3 Berat Golden Rules, pencurian, dokumen palsu, atau masalah ketertiban)."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Aktifkan Pemblokiran Sekarang (Otomatis ditolak di gerbang)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data Blacklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 mb-1">
              Hapus dari Blacklist?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Apakah Anda yakin ingin menghapus <strong>{deleteModalEntry.fullName}</strong> dari daftar blacklist? Tindakan ini akan dicatat dalam Audit Log sistem.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeleteModalEntry(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

