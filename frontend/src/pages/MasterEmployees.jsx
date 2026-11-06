import React, { useState, useEffect } from 'react';
import { vmsApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Users,
  Plus,
  Edit2,
  KeyRound,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Power,
  ShieldCheck,
  Phone,
  Building
} from 'lucide-react';

export default function MasterEmployees() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'HOST_PIC',
    departmentId: '',
    isActive: true,
    canReceiveVisits: true
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadDepartments();
    loadUsers();
  }, [roleFilter, departmentFilter]);

  const loadDepartments = async () => {
    try {
      const data = await vmsApi.getDepartments();
      setDepartments(data || []);
      if (data?.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: data[0].id }));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (departmentFilter !== 'ALL') params.departmentId = departmentFilter;
      if (search) params.search = search;

      const data = await vmsApi.getUsers(params);
      setUsers(data || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      phone: '628',
      password: '',
      role: 'HOST_PIC',
      departmentId: departments[0]?.id || '',
      isActive: true,
      canReceiveVisits: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      employeeId: u.employeeId || '',
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      password: '',
      role: u.role,
      departmentId: u.departmentId || (departments[0]?.id || ''),
      isActive: u.isActive,
      canReceiveVisits: u.canReceiveVisits
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (editingUser) {
        await vmsApi.updateUser(editingUser.id, formData);
        setMessage({ type: 'success', text: `Employee ${formData.name} successfully updated.` });
      } else {
        await vmsApi.createUser(formData);
        setMessage({ type: 'success', text: `New employee ${formData.name} successfully created.` });
      }
      setIsModalOpen(false);
      loadUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to save employee data'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!passwordTargetUser || !newPassword) return;
    setSaving(true);
    try {
      await vmsApi.resetUserPassword(passwordTargetUser.id, newPassword);
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setMessage({ type: 'success', text: `Password reset successfully for ${passwordTargetUser.name}` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u) => {
    try {
      await vmsApi.toggleUserStatus(u.id, !u.isActive);
      loadUsers();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <Users className="w-4 h-4 text-cemindo-red" />
            <span>Master Data Management</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t('menuMasterEmployees')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee directory, Security team accounts, PIC visitor eligibility, and WhatsApp phone numbers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="py-2.5 px-4 bg-cemindo-red hover:bg-cemindo-darkred text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('action_addEmployee')}</span>
          </button>
          <button
            onClick={loadUsers}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title={t('action_refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Employee ID, Name, WhatsApp, Email..."
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Role Filter</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">{t('role_ADMIN')}</option>
              <option value="SECURITY">{t('role_SECURITY')}</option>
              <option value="HOST_PIC">{t('role_HOST_PIC')}</option>
              <option value="MANAGEMENT">{t('role_MANAGEMENT')}</option>
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
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">WhatsApp (62...)</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Host Eligible</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {u.employeeId || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {u.department?.name || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {u.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{u.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {t(`role_${u.role}`)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.canReceiveVisits
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {u.canReceiveVisits ? 'Yes (PIC)' : 'No'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {u.isActive ? t('status_ACTIVE') : t('status_INACTIVE')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title={t('action_editEmployee')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setPasswordTargetUser(u);
                            setNewPassword('');
                            setIsPasswordModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg ${
                            u.isActive
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              {editingUser ? t('action_editEmployee') : t('action_addEmployee')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter official employee credentials, department, and international WhatsApp number
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('lbl_employeeId')}
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="e.g. CG-BATAM-104"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('lbl_fullName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Budi Santoso"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('lbl_email')} *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@cemindo.com"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('lbl_phoneNumber')} (628...)
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="6281234567890"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">International format e.g. 62812xxxxxxxx</p>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('lbl_destinationDept')}
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('lbl_role')}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="HOST_PIC">{t('role_HOST_PIC')}</option>
                    <option value="SECURITY">{t('role_SECURITY')}</option>
                    <option value="MANAGEMENT">{t('role_MANAGEMENT')}</option>
                    <option value="ADMIN">{t('role_ADMIN')}</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canReceiveVisits}
                    onChange={(e) => setFormData({ ...formData, canReceiveVisits: e.target.checked })}
                    className="rounded text-cemindo-red focus:ring-cemindo-red w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {t('lbl_canReceiveVisits')}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-cemindo-red focus:ring-cemindo-red w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {t('lbl_statusActive')}
                  </span>
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  {t('action_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-cemindo-red hover:bg-cemindo-darkred text-white shadow-sm"
                >
                  {saving ? t('loading') : t('action_saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {isPasswordModalOpen && passwordTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="font-extrabold text-sm text-slate-900 mb-1">
              Reset Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter new password for employee <span className="font-bold text-slate-900">{passwordTargetUser.name}</span>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password (min 5 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={5}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700"
                >
                  {t('action_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-cemindo-red hover:bg-cemindo-darkred text-white"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

