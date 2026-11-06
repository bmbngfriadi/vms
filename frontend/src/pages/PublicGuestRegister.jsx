import React, { useState, useEffect } from 'react';
import { vmsApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import QrBadgeModal from '../components/QrBadgeModal';
import {
  Factory,
  ShieldCheck,
  Send,
  User,
  CreditCard,
  Phone,
  Building,
  FileText,
  Calendar,
  Clock,
  Car,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicGuestRegister() {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState([]);
  const [departmentHosts, setDepartmentHosts] = useState([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successVisit, setSuccessVisit] = useState(null);
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);
  const [error, setError] = useState('');

  const [isPermanentQrOpen, setIsPermanentQrOpen] = useState(false);
  const [permanentQrDataUrl, setPermanentQrDataUrl] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    identityNumber: '',
    phoneNumber: '',
    email: '',
    company: '',
    purpose: '',
    destinationDepartmentId: '',
    hostId: '',
    vehicleType: 'NONE',
    vehiclePlateNumber: '',
    expectedDate: new Date().toISOString().split('T')[0],
    expectedTime: '09:00',
    numberOfVisitors: 1,
    safetyInductionAgreed: true
  });

  useEffect(() => {
    loadActiveDepartments();
  }, []);

  const loadActiveDepartments = async () => {
    try {
      // Only fetch active departments for registration
      const deptsData = await vmsApi.getDepartments({ activeOnly: 'true' });
      const activeDepts = (deptsData || []).filter((d) => d.isActive);
      setDepartments(activeDepts);

      if (activeDepts.length > 0) {
        const initialDeptId = activeDepts[0].id;
        setFormData((prev) => ({ ...prev, destinationDepartmentId: initialDeptId }));
        loadHostsForDepartment(initialDeptId);
      }
    } catch (err) {
      console.warn('Failed to load active departments:', err);
    }
  };

  const loadHostsForDepartment = async (deptId) => {
    if (!deptId) {
      setDepartmentHosts([]);
      return;
    }
    setLoadingHosts(true);
    try {
      // Rule: Dropdown PIC only shows employees who:
      // 1. Belong to that Department
      // 2. Are Active
      // 3. Are authorized to receive visits (canReceiveVisits = true)
      const hosts = await vmsApi.getHostsByDepartment(deptId);
      setDepartmentHosts(hosts || []);
      setFormData((prev) => ({
        ...prev,
        hostId: hosts?.length > 0 ? hosts[0].id : ''
      }));
    } catch (err) {
      console.warn('Failed to load hosts for department:', err);
      setDepartmentHosts([]);
    } finally {
      setLoadingHosts(false);
    }
  };

  const handleDepartmentChange = (e) => {
    const newDeptId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      destinationDepartmentId: newDeptId,
      hostId: ''
    }));
    loadHostsForDepartment(newDeptId);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.safetyInductionAgreed) {
      setError('You must agree to the PT Cemindo Gemilang Plant Safety & HSE regulations.');
      return;
    }

    setLoading(true);
    try {
      const res = await vmsApi.registerWalkIn(formData);
      setSuccessVisit(res.visit);
      setIsBadgeOpen(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cemindo-red flex items-center justify-center text-white shadow-md">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
              PT CEMINDO GEMILANG TBK
            </h1>
            <p className="text-xs text-cemindo-red font-bold">Plant Batam – Visitor Gate Registration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            to="/login"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
          >
            {t('login')}
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Digital Visitor Pass</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {t('menuPublicRegister')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Please register your visit before entering PT Cemindo Gemilang Tbk – Plant Batam operational area. Your digital pass and QR code will be generated immediately.
          </p>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Section 1: Visitor Identity */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-cemindo-red" />
              <span>1. Visitor Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('lbl_fullName')} *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Ahmad Fauzi"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('lbl_identityNumber')} <span className="text-slate-400 font-normal">({t('action_cancel') === 'Batal' ? 'Opsional' : 'Optional'})</span>
                </label>
                <input
                  type="text"
                  name="identityNumber"
                  value={formData.identityNumber}
                  onChange={handleChange}
                  placeholder="e.g. 2171012304900001"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('lbl_phoneNumber')} *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="081234567890"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red"
                />
                <p className="text-[10px] text-slate-500 mt-1">{t('lbl_phoneNumber_hint')}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('lbl_company')} *
                </label>
                <input
                  type="text"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. PT Batam Engineering / Vendor"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Destination & Host (Dynamic Linked PIC from Master Data) */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-cemindo-red" />
              <span>2. Destination Department & Host PIC</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('lbl_destinationDept')} *
                </label>
                <select
                  name="destinationDepartmentId"
                  required
                  value={formData.destinationDepartmentId}
                  onChange={handleDepartmentChange}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red font-semibold text-slate-800"
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
                  {t('lbl_hostPic')} *
                </label>
                <select
                  name="hostId"
                  required
                  value={formData.hostId}
                  onChange={handleChange}
                  disabled={loadingHosts || departmentHosts.length === 0}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red font-semibold text-slate-800 disabled:opacity-50"
                >
                  {loadingHosts ? (
                    <option value="">Loading PIC list...</option>
                  ) : departmentHosts.length === 0 ? (
                    <option value="">No active PIC available for this department</option>
                  ) : (
                    departmentHosts.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} {h.employeeId ? `[${h.employeeId}]` : ''}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  * PIC contact and WhatsApp notification are automatically retrieved from database.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('lbl_purpose')} *
                </label>
                <textarea
                  name="purpose"
                  required
                  rows={2}
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="e.g. Silo Maintenance Calibration / Equipment Delivery / Official Meeting"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Schedule & Vehicle */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Car className="w-4 h-4 text-cemindo-red" />
              <span>3. Schedule & Vehicle Access</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('lbl_expectedDate')} *
                </label>
                <input
                  type="date"
                  name="expectedDate"
                  required
                  value={formData.expectedDate}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('lbl_expectedTime')}
                </label>
                <input
                  type="time"
                  name="expectedTime"
                  value={formData.expectedTime}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('lbl_numberOfVisitors')}
                </label>
                <input
                  type="number"
                  name="numberOfVisitors"
                  min="1"
                  max="50"
                  value={formData.numberOfVisitors}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('lbl_vehicleType')}
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red"
                >
                  <option value="NONE">{t('veh_NONE')}</option>
                  <option value="CAR">{t('veh_CAR')}</option>
                  <option value="MOTORCYCLE">{t('veh_MOTORCYCLE')}</option>
                  <option value="TRUCK">{t('veh_TRUCK')}</option>
                  <option value="WALK_IN">{t('veh_WALK_IN')}</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('lbl_vehiclePlate')}
                </label>
                <input
                  type="text"
                  name="vehiclePlateNumber"
                  value={formData.vehiclePlateNumber}
                  onChange={handleChange}
                  placeholder="e.g. BP 1234 XY"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red uppercase font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Safety Induction Acceptance */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5">
            <h4 className="font-extrabold text-xs text-amber-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>{t('safetyTitle')}</span>
            </h4>
            <ul className="text-[11px] text-amber-800 space-y-1.5 list-disc pl-4 mb-3">
              <li>{t('safetyRule1')}</li>
              <li>{t('safetyRule2')}</li>
              <li>{t('safetyRule3')}</li>
            </ul>
            <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-amber-200">
              <input
                type="checkbox"
                name="safetyInductionAgreed"
                checked={formData.safetyInductionAgreed}
                onChange={handleChange}
                required
                className="mt-0.5 rounded text-cemindo-red focus:ring-cemindo-red w-4 h-4"
              />
              <span className="text-xs font-bold text-amber-950">
                {t('safetyAgree')}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-cemindo-red hover:bg-cemindo-darkred text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? t('loading') : t('action_submit')}</span>
          </button>
        </form>
      </div>

      {/* Success Badge Modal */}
      <QrBadgeModal
        isOpen={isBadgeOpen}
        onClose={() => setIsBadgeOpen(false)}
        visit={successVisit}
      />
    </div>
  );
}
