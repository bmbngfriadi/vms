import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vmsApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import StatusBadge from '../components/StatusBadge';
import QRCode from 'qrcode';
import {
  Factory,
  ShieldCheck,
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Clock,
  Car
} from 'lucide-react';

export default function PublicPassView() {
  const { code } = useParams();
  const { t } = useLanguage();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (code) {
      loadPass();
    }
  }, [code]);

  const loadPass = async () => {
    try {
      setLoading(true);
      const data = await vmsApi.getVisitorByCode(code);
      setVisit(data);

      // Secure token encoding: Use active checkIn/checkOut token if available
      const tokenToEncode =
        data.status === 'CHECKED_IN' && data.checkOutToken
          ? data.checkOutToken
          : data.checkInToken || data.visitCode;

      const qr = await QRCode.toDataURL(tokenToEncode, {
        width: 320,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
      setQrDataUrl(qr);
    } catch (err) {
      setError(err.response?.data?.error || 'Visitor pass not found');
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    const activeToken =
      visit?.status === 'CHECKED_IN' && visit?.checkOutToken
        ? visit.checkOutToken
        : visit?.checkInToken || visit?.visitCode;
    if (activeToken) {
      navigator.clipboard.writeText(activeToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      {/* Top Navbar */}
      <div className="max-w-md mx-auto flex items-center justify-between mb-4 no-print">
        <Link to="/" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Beranda VMS</span>
        </Link>
        <LanguageToggle />
      </div>

      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">{t('loading')}</div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">{error}</p>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center">
            {/* Plant Header */}
            <div className="w-full text-center pb-3 border-b-2 border-cemindo-red mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cemindo-red block">
                PT CEMINDO GEMILANG TBK
              </span>
              <h2 className="text-base font-black text-slate-900">PLANT BATAM</h2>
              <p className="text-[10px] text-slate-500 font-semibold">Visitor Digital Gate Pass</p>
            </div>

            {/* Visitor Info */}
            <div className="text-center mb-3">
              <span className="inline-block px-3 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider mb-1.5">
                {visit.visitorBadgeNumber ? `Badge #${visit.visitorBadgeNumber}` : 'DIGITAL PASS'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {visit.fullName}
              </h3>
              <p className="text-xs font-bold text-slate-600 mt-0.5">
                {visit.company}
              </p>
              <div className="mt-2">
                <StatusBadge status={visit.status} size="sm" />
              </div>
            </div>

            {/* High Contrast Large QR Box (Easy to scan under sun/gate cameras) */}
            <div className="p-4 bg-white border-2 border-slate-900 rounded-3xl shadow-md mb-4 text-center">
              <img src={qrDataUrl} alt="QR Code" className="w-60 h-60 mx-auto object-contain" />
              <p className="font-mono text-sm font-black tracking-widest text-slate-900 mt-2">
                {visit.visitCode}
              </p>
            </div>

            {/* Status Guide for Visitor */}
            {visit.status === 'PENDING_VALIDATION' && (
              <div className="w-full mb-4 p-3 bg-amber-50 border border-amber-300 rounded-2xl text-center text-xs text-amber-950">
                <span className="font-bold block uppercase text-[11px]">⏳ Tunjukkan di Pos Jaga</span>
                <p className="text-[11px] mt-0.5 text-amber-900 font-medium leading-relaxed">
                  Tunjukkan layar QR ini kepada Petugas Security di pintu gerbang utama PT Cemindo Gemilang Plant Batam.
                </p>
              </div>
            )}

            {visit.status === 'CHECKED_IN' && (
              <div className="w-full mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-center text-xs text-emerald-950">
                <span className="font-bold block uppercase text-[11px]">✅ QR Pass Sedang Aktif</span>
                <p className="text-[11px] mt-0.5 text-emerald-900 font-medium leading-relaxed">
                  Gunakan QR ini saat Anda hendak keluar dari area pabrik melalui pos security.
                </p>
              </div>
            )}

            {/* Details Card */}
            <div className="w-full bg-slate-50 rounded-2xl p-4 text-xs space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Department Tujuan:</span>
                <strong className="text-slate-900">{visit.destinationDepartment?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PIC yang Dituju:</span>
                <strong className="text-slate-900">{visit.hostNameManual || visit.host?.name || '-'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jadwal Kedatangan:</span>
                <strong className="text-slate-800">{new Date(visit.expectedDate).toLocaleDateString('id-ID')} pk {visit.expectedTime}</strong>
              </div>
              {visit.vehiclePlateNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Plat Kendaraan:</span>
                  <strong className="font-mono text-slate-900">{visit.vehiclePlateNumber}</strong>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full grid grid-cols-2 gap-2.5 mt-4 no-print">
              <button
                type="button"
                onClick={copyToken}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedToken ? 'Tersalin' : 'Salin Token'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Pass</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
