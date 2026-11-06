import React, { useState, useEffect } from 'react';
import { vmsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { CalendarCheck, X, Send, AlertCircle, Building, User, Car, ShieldCheck } from 'lucide-react';

export default function PreRegisterModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    identityNumber: '',
    phoneNumber: '',
    email: '',
    company: '',
    purpose: '',
    destinationDepartmentId: user?.departmentId || '',
    hostId: user?.id || '',
    vehicleType: 'CAR',
    vehiclePlateNumber: '',
    expectedDate: new Date().toISOString().split('T')[0],
    expectedTime: '10:00',
    numberOfVisitors: 1,
    safetyInductionAgreed: true,
    createdById: user?.id
  });

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  const loadDepartments = async () => {
    try {
      const depts = await vmsApi.getDepartments({ activeOnly: 'true' });
      setDepartments(depts || []);
      if (!formData.destinationDepartmentId && depts?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          destinationDepartmentId: user?.departmentId || depts[0].id
        }));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await vmsApi.preRegisterVisitor(formData);
      if (onSuccess) onSuccess(res.visit);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to pre-register visitor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cemindo-red/10 text-cemindo-red">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {t('menuPreRegister')}
              </h3>
              <p className="text-[11px] text-slate-500">
                Host PIC Pre-Registration for Scheduled Appointments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('lbl_fullName')} *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Hendra Gunawan"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('lbl_identityNumber')} <span className="text-slate-400 font-normal">({t('action_cancel') === 'Batal' ? 'Opsional' : 'Optional'})</span>
              </label>
              <input
                type="text"
                value={formData.identityNumber}
                onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                placeholder="NIK KTP / SIM / Passport"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('lbl_phoneNumber')} (WhatsApp) *
              </label>
              <input
                type="text"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="081234567890"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('lbl_company')} *
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Vendor / Contractor Company"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('lbl_purpose')} *
            </label>
            <input
              type="text"
              required
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="e.g. Silo Maintenance Inspection / Project Discussion"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('lbl_expectedDate')} *
              </label>
              <input
                type="date"
                required
                value={formData.expectedDate}
                onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('lbl_expectedTime')}
              </label>
              <input
                type="time"
                value={formData.expectedTime}
                onChange={(e) => setFormData({ ...formData, expectedTime: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('lbl_vehiclePlate')}
              </label>
              <input
                type="text"
                value={formData.vehiclePlateNumber}
                onChange={(e) => setFormData({ ...formData, vehiclePlateNumber: e.target.value })}
                placeholder="BP 1234 XY"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Pre-registered by host <strong>{user?.name}</strong>. The guest will automatically receive an invitation and digital QR pass on WhatsApp upon submission.
            </span>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              {t('action_cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-cemindo-red hover:bg-cemindo-darkred text-white flex items-center gap-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? t('loading') : 'Send Pre-Registration Pass'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

