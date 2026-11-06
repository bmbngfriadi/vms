import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Copy, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import StatusBadge from './StatusBadge';

export default function QrBadgeModal({ isOpen, onClose, visit }) {
  const { t } = useLanguage();
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (visit) {
      if (visit.qrCodeData && visit.qrCodeData.startsWith('data:image')) {
        setQrDataUrl(visit.qrCodeData);
      } else {
        // Use token instead of raw personal info
        const tokenToEncode =
          visit.status === 'CHECKED_IN' && visit.checkOutToken
            ? visit.checkOutToken
            : visit.checkInToken || visit.visitCode;

        QRCode.toDataURL(tokenToEncode, {
          width: 240,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' }
        })
          .then(setQrDataUrl)
          .catch(console.error);
      }
    }
  }, [visit]);

  if (!isOpen || !visit) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
        {/* Actions header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <ShieldCheck className="w-4 h-4 text-cemindo-red" />
            <span>Visitor Pass Badge</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Print Pass"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Badge Content */}
        <div className="p-6 flex flex-col items-center bg-white text-slate-800" id="printable-badge">
          {/* Header Bar */}
          <div className="w-full text-center pb-3 border-b-2 border-cemindo-red mb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cemindo-red block">
              PT CEMINDO GEMILANG TBK
            </span>
            <h2 className="text-sm font-bold text-slate-900">PLANT BATAM</h2>
            <p className="text-[10px] text-slate-500">Visitor Identification & Gate Pass</p>
          </div>

          {/* Visitor Name & Company */}
          <div className="text-center mb-3">
            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider mb-1">
              {visit.visitorBadgeNumber ? `Badge #${visit.visitorBadgeNumber}` : 'VISITOR'}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
              {visit.fullName}
            </h3>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              {visit.company}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm mb-3">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Pass" className="w-44 h-44 object-contain" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
            <p className="text-center font-mono text-xs font-extrabold tracking-widest text-slate-900 mt-2">
              {visit.visitCode}
            </p>
          </div>

          {/* Validation Status Notice */}
          {visit.status === 'PENDING_VALIDATION' && (
            <div className="w-full mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-amber-900 uppercase block">
                ⏳ Menunggu Validasi Security
              </span>
              <p className="text-[10px] text-amber-800 mt-0.5">
                Tunjukkan QR Code ini pada layar HP kepada Petugas Security di Pos Gerbang Masuk. Notifikasi telah dikirim ke WhatsApp PIC.
              </p>
            </div>
          )}

          {visit.status === 'CHECKED_IN' && (
            <div className="w-full mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-900 uppercase block">
                ✅ QR Code Check-Out
              </span>
              <p className="text-[10px] text-emerald-800 mt-0.5">
                Simpan QR Code ini. Tunjukkan kepada Petugas Security saat Anda keluar dari area pabrik.
              </p>
            </div>
          )}

          {/* Visit Details Table */}
          <div className="w-full bg-slate-50 rounded-xl p-3 text-[11px] space-y-1.5 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Destination:</span>
              <span className="font-bold text-slate-800 text-right">
                {visit.destinationDepartment?.name || 'Plant Area'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Host / PIC:</span>
              <span className="font-semibold text-slate-800 text-right">
                {visit.hostNameManual || visit.host?.name || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span className="font-medium text-slate-700">
                {new Date(visit.expectedDate).toLocaleDateString()} {visit.expectedTime || ''}
              </span>
            </div>
            {visit.vehiclePlateNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Plate:</span>
                <span className="font-mono font-bold text-slate-800">
                  {visit.vehiclePlateNumber}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500">Status:</span>
              <StatusBadge status={visit.status} size="xs" />
            </div>
          </div>

          {/* Safety Compliance Stamp */}
          <div className="mt-4 pt-3 border-t border-slate-200 w-full flex items-center justify-center gap-1.5 text-[10px] text-emerald-700 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>HSE Plant Induction Verified • Safety First</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-cemindo-red hover:bg-cemindo-darkred text-white flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            {t('action_printBadge')}
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}

