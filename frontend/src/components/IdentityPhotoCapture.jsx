import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  SwitchCamera
} from 'lucide-react';
import { endpoints } from '../lib/api.js';
import { useI18n } from '../lib/i18n.jsx';

/**
 * Kompres gambar ke ukuran maksimal 1280px dan format JPEG quality 0.85
 * untuk mempercepat proses OCR dan upload jaringan.
 */
function compressImage(file, maxWidth = 1280, maxHeight = 1280, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function IdentityPhotoCapture({
  value,
  onChange,
  onNikDetected,
  label,
  required = true
}) {
  const { t } = useI18n();
  const [preview, setPreview] = useState(value || '');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState(null); // { type: 'success'|'warn'|'error', msg: string, nik?: string }
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (belakang) atau 'user' (depan)
  const [, setCameraError] = useState('');

  const fileInputRef = useRef(null);
  const cameraFallbackInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Sinkronisasi value dari parent
  useEffect(() => {
    if (value && value !== preview) {
      setPreview(value);
    }
  }, [value]);

  // Hentikan stream kamera jika modal ditutup atau unmount
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCameraError('');
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Mulai streaming video kamera
  const startCamera = async (mode = facingMode) => {
    setCameraError('');
    setCameraOpen(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Browser tidak mendukung WebRTC camera, gunakan fallback capture native input
      setCameraOpen(false);
      cameraFallbackInputRef.current?.click();
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('[Camera] getUserMedia gagal, beralih ke input kamera native:', err.message);
      setCameraOpen(false);
      // Fallback ke input kamera langsung di browser smartphone
      cameraFallbackInputRef.current?.click();
    }
  };

  const switchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Jepret foto dari stream video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    stopCamera();
    handleNewPhoto(dataUrl);
  };

  // Proses gambar yang baru diupload / difoto
  const handleNewPhoto = async (dataUrl) => {
    setPreview(dataUrl);
    onChange(dataUrl);
    setOcrStatus(null);
    setOcrLoading(true);

    try {
      const res = await endpoints.ocrId(dataUrl);
      if (res && res.nik) {
        setOcrStatus({
          type: 'success',
          msg: res.nik,
          nik: res.nik
        });
        if (onNikDetected) {
          onNikDetected(res.nik);
        }
      } else {
        setOcrStatus({
          type: 'warn',
          msg: t('register.ocr_warn', 'Foto berhasil disimpan. Silakan periksa dan ketik nomor identitas Anda secara manual.')
        });
      }
    } catch (err) {
      console.warn('[OCR Client error]', err);
      setOcrStatus({
        type: 'warn',
        msg: t('register.ocr_warn', 'Foto berhasil disimpan. Silakan periksa dan ketik nomor identitas Anda secara manual.')
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      handleNewPhoto(compressed);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  const removePhoto = () => {
    setPreview('');
    onChange('');
    setOcrStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayLabel = label || t('register.identity_photo', 'Foto Identitas (KTP/SIM/Paspor) *');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label mb-0">{displayLabel}</label>
        {required && !preview && (
          <span className="text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded">
            {t('register.required_tag', 'Wajib Diisi')}
          </span>
        )}
      </div>

      {/* Input file tersembunyi */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
      {/* Input kamera native tersembunyi (fallback mobile browser) */}
      <input
        ref={cameraFallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Jika BELUM ada foto: tampilkan 2 tombol terpisah dengan desain modern mobile native */}
      {!preview ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 sm:p-4 bg-slate-50/80 dark:bg-slate-900/60 transition-colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* Tombol 1: Buka Kamera Langsung */}
            <button
              type="button"
              onClick={() => startCamera('environment')}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 text-white px-4 py-3 sm:py-2.5 text-xs font-bold hover:bg-brand-600 active:scale-[0.98] shadow-sm transition-all text-center"
            >
              <Camera size={18} strokeWidth={2.2} />
              <span>{t('register.photo_btn_camera', 'Buka Kamera Langsung')}</span>
            </button>

            {/* Tombol 2: Upload File / Galeri */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-3 sm:py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-[0.98] shadow-sm transition-all text-center"
            >
              <Upload size={18} strokeWidth={2.2} className="text-slate-500 dark:text-slate-400" />
              <span>{t('register.photo_btn_file', 'Pilih dari File / Galeri')}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-3 leading-relaxed">
            {t('register.photo_hint', 'Foto KTP, SIM, atau Paspor asli yang jelas dan tidak buram. Sistem akan membaca nomor identitas secara otomatis.')}
          </p>
        </div>
      ) : (
        /* Jika SUDAH ada foto: tampilkan preview, kontrol aksi, dan status OCR */
        <div className="card p-3 space-y-3 bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="relative rounded-lg overflow-hidden bg-slate-900/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[140px] max-h-56">
            <img
              src={preview}
              alt="Foto Identitas"
              className="w-full h-auto max-h-56 object-contain"
            />
          </div>

          {/* Status Pembacaan NIK OCR */}
          {ocrLoading && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 text-xs text-brand-700 dark:text-brand-300 animate-pulse font-medium">
              <Loader2 size={16} className="animate-spin text-brand-600 dark:text-brand-400 shrink-0" />
              <span>{t('register.ocr_scanning', 'Memindai dan membaca NIK dari foto KTP secara otomatis...')}</span>
            </div>
          )}

          {!ocrLoading && ocrStatus?.type === 'success' && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="leading-tight">
                <span className="font-bold">{t('register.ocr_success', 'NIK Terbaca Otomatis:')}</span>{' '}
                <span className="font-mono font-bold tracking-wider">{ocrStatus.nik}</span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {t('register.ocr_success_hint', 'Nomor telah otomatis diisikan ke kolom No. Identitas di bawah. Silakan verifikasi/koreksi bila perlu.')}
                </p>
              </div>
            </div>
          )}

          {!ocrLoading && ocrStatus?.type === 'warn' && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <span className="text-[11.5px] leading-tight">{ocrStatus.msg}</span>
            </div>
          )}

          {/* Tombol Aksi: Ganti Foto / Hapus Foto */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startCamera('environment')}
                className="btn-ghost text-xs px-2.5 py-1.5 inline-flex items-center gap-1.5 rounded-lg"
                title={t('register.retake_photo', 'Foto Ulang')}
              >
                <Camera size={14} />
                <span>{t('register.retake_photo', 'Foto Ulang')}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-ghost text-xs px-2.5 py-1.5 inline-flex items-center gap-1.5 rounded-lg"
                title={t('register.change_file', 'Ganti File')}
              >
                <Upload size={14} />
                <span>{t('register.change_file', 'Ganti File')}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={removePhoto}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 px-2 py-1.5 rounded-lg inline-flex items-center gap-1 font-medium transition-colors"
            >
              <Trash2 size={14} />
              <span>{t('register.delete_photo', 'Hapus')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Kamera Interaktif Langsung */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full border border-slate-800 flex flex-col max-h-[92vh]">
            {/* Header Modal Kamera */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-brand-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {t('camera.modal_title', 'Arahkan KTP / Identitas')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={switchCamera}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                  title={t('camera.switch_cam', 'Ganti kamera depan / belakang')}
                >
                  <SwitchCamera size={16} />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Video Viewport & Bingkai Penyelaras KTP */}
            <div className="relative bg-black flex items-center justify-center overflow-hidden aspect-[4/3] sm:aspect-[16/10]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Garis Bingkai Pembantu KTP */}
              <div className="absolute inset-x-6 inset-y-6 sm:inset-x-10 sm:inset-y-8 border-2 border-brand-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2.5 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                <div className="flex justify-between text-[10px] text-brand-300 font-mono font-semibold uppercase">
                  <span>{t('camera.guideline_title', 'KTP / SIM')}</span>
                  <span>{t('camera.guideline_pos', 'Posisi Rata')}</span>
                </div>
                <div className="text-center text-[10.5px] sm:text-[11px] text-white/95 bg-slate-900/85 py-1 px-3 rounded-full mx-auto backdrop-blur-xs font-medium">
                  {t('camera.guideline_hint', 'Pastikan tulisan NIK terlihat jelas & tidak silau')}
                </div>
              </div>
            </div>

            {/* Footer Kontrol Pengambilan Foto */}
            <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={stopCamera}
                className="btn-ghost text-xs text-slate-300 border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl px-3 py-2"
              >
                {t('camera.btn_cancel', 'Batal')}
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                className="btn-primary px-5 sm:px-6 py-2.5 text-xs font-bold shadow-lg flex items-center gap-2 rounded-xl"
              >
                <Camera size={18} />
                <span>{t('camera.btn_capture', 'Ambil Foto')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  fileInputRef.current?.click();
                }}
                className="btn-ghost text-xs text-slate-300 border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl px-3 py-2"
              >
                {t('camera.btn_file', 'Dari File')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
