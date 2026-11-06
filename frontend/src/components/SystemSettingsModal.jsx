import React, { useState, useEffect } from 'react';
import { vmsApi } from '../services/api';
import {
  Sliders,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Layers
} from 'lucide-react';

export default function SystemSettingsModal({ isOpen, onClose, onUpdated }) {
  const [settings, setSettings] = useState({
    overstay_hours: '8',
    require_ktp_walkin: 'true',
    max_active_visitors_daily: '500'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await vmsApi.getSystemSettings();
      setSettings((prev) => ({
        ...prev,
        ...res
      }));
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');

      await Promise.all([
        vmsApi.updateSystemSetting('overstay_hours', settings.overstay_hours),
        vmsApi.updateSystemSetting('require_ktp_walkin', settings.require_ktp_walkin),
        vmsApi.updateSystemSetting('max_active_visitors_daily', settings.max_active_visitors_daily)
      ]);

      setToast('Pengaturan sistem berhasil disimpan.');
      if (onUpdated) onUpdated();
      setTimeout(() => {
        setToast('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan pengaturan sistem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cemindo-red" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Pengaturan Sistem & Batas Waktu (Tahap 10 & 12)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {toast && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{toast}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Batas Waktu Kunjungan Normal (Overstay Alert Threshold)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="72"
                step="0.5"
                required
                value={settings.overstay_hours}
                onChange={(e) => setSettings({ ...settings, overstay_hours: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
              />
              <span className="font-bold text-slate-600 whitespace-nowrap">Jam</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Jika tamu berada di area pabrik melebihi batas waktu ini, sistem otomatis memberikan tanda peringatan Overstay Alert pada Security Scanner dan Dashboard.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Kewajiban Pengisian Nomor KTP / Identitas di Form Walk-In</span>
            </label>
            <select
              value={settings.require_ktp_walkin}
              onChange={(e) => setSettings({ ...settings, require_ktp_walkin: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
            >
              <option value="true">Wajib (Strict Security Compliance)</option>
              <option value="false">Opsional (Opsional Administrator)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Kapasitas Maksimal Tamu Harian Pabrik</span>
            </label>
            <input
              type="number"
              min="50"
              max="5000"
              value={settings.max_active_visitors_daily}
              onChange={(e) => setSettings({ ...settings, max_active_visitors_daily: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-cemindo-red"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

