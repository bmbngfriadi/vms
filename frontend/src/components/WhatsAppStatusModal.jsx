import React, { useEffect, useState } from 'react';
import { vmsApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { MessageSquare, RefreshCw, X, CheckCircle, AlertTriangle, Smartphone, Send } from 'lucide-react';

export default function WhatsAppStatusModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('Halo! Ini adalah tes pesan notifikasi dari VMS PT Cemindo Gemilang Tbk - Plant Batam.');
  const [testResult, setTestResult] = useState(null);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    loadStatus();
    const interval = setInterval(loadStatus, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const data = await vmsApi.getWhatsAppStatus();
      setStatusData(data);
    } catch (e) {
      console.warn('Error fetching WA status:', e);
    }
  };

  const handleRestart = async () => {
    try {
      setRestarting(true);
      await vmsApi.restartWhatsApp();
      setTimeout(() => {
        setRestarting(false);
        loadStatus();
      }, 3000);
    } catch (e) {
      setRestarting(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testPhone) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await vmsApi.sendTestWhatsApp(testPhone, testMsg);
      setTestResult({ success: true, message: 'Message successfully sent!' });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.error || err.message
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (!isOpen) return null;

  const isConnected = statusData?.status === 'CONNECTED';
  const isScanQr = statusData?.status === 'SCAN_QR' && statusData?.qrDataUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t('waStatusTitle')}</h3>
              <p className="text-[11px] text-slate-400">@whiskeysockets/baileys native client</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Content */}
        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-5">
          {/* Status banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isScanQr
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {isConnected ? (
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              )}
              <div>
                <p className="font-bold text-xs">
                  {isConnected
                    ? t('waStatusConnected')
                    : isScanQr
                    ? t('waStatusScanQr')
                    : t('waStatusConnecting')}
                </p>
                {statusData?.user && (
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {t('waActiveNumber')}: <span className="font-mono font-semibold">{statusData.user}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleRestart}
              disabled={restarting}
              className="p-2 rounded-lg bg-white shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              title="Restart Baileys connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${restarting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reconnect</span>
            </button>
          </div>

          {/* QR Code view if waiting for scan */}
          {isScanQr && (
            <div className="flex flex-col items-center bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                <Smartphone className="w-4 h-4 text-cemindo-red" />
                <span>Scan with WhatsApp on Phone</span>
              </div>
              <img
                src={statusData.qrDataUrl}
                alt="WhatsApp QR Code"
                className="w-56 h-56 rounded-lg bg-white p-2 shadow-md border border-slate-200"
              />
              <p className="text-[11px] text-slate-500 text-center max-w-xs mt-3">
                {t('waScanInstructions')}
              </p>
            </div>
          )}

          {/* Test message sender form */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h4 className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-cemindo-red" />
              <span>Send WhatsApp Test Notification</span>
            </h4>
            <form onSubmit={handleSendTest} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Recipient Number (WhatsApp)
                </label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-cemindo-red"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Message Content
                </label>
                <textarea
                  rows={2}
                  value={testMsg}
                  onChange={(e) => setTestMsg(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-cemindo-red"
                />
              </div>
              <button
                type="submit"
                disabled={sendingTest || !isConnected}
                className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingTest ? 'Sending...' : 'Send WhatsApp Message'}
              </button>
              {testResult && (
                <div
                  className={`p-2 rounded-lg text-[11px] font-medium ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}

