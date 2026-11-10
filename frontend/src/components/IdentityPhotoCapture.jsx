import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  SwitchCamera
} from 'lucide-react';
import { endpoints } from '../lib/api.js';

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
  label = 'Foto Identitas (KTP/SIM/Paspor) *',
  required = true
}) {
  const [preview, setPreview] = useState(value || '');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState(null); // { type: 'success'|'warn'|'error', msg: string, nik?: string }
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (belakang) atau 'user' (depan)
  const [cameraError, setCameraError] = useState('');

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
          msg: `NIK berhasil dibaca otomatis: ${res.nik}`,
          nik: res.nik
        });
        if (onNikDetected) {
          onNikDetected(res.nik);
        }
      } else {
        setOcrStatus({
          type: 'warn',
          msg: 'Foto berhasil disimpan. NIK tidak terdeteksi otomatis, silakan periksa dan ketik nomor identitas Anda secara manual.'
        });
      }
    } catch (err) {
      console.warn('[OCR Client error]', err);
      setOcrStatus({
        type: 'warn',
        msg: 'Foto berhasil disimpan. Silakan masukkan nomor identitas secara manual.'
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
      alert('Gagal memproses file foto: ' + err.message);
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label mb-0">{label}</label>
        {required && !preview && (
          <span className="text-[11px] font-semibold text-red-500">Wajib Diisi</span>
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
      {/* Input kamera native tersembunyi (fallback) */}
      <input
        ref={cameraFallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Jika BELUM ada foto: tampilkan 2 tombol terpisah */}
      {!preview ? (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50/70 hover:bg-slate-50 transition-colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tombol 1: Buka Kamera Langsung */}
            <button
              type="button"
              onClick={() => startCamera('environment')}
              className="flex items-center justify-center gap-2.5 rounded-md bg-brand-500 text-white px-4 py-3 text-xs font-bold hover:bg-brand-600 active:bg-brand-700 shadow-sm transition-all"
            >
              <Camera size={18} strokeWidth={2.2} />
              <span>Buka Kamera Langsung</span>
            </button>

            {/* Tombol 2: Upload File / Galeri */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2.5 rounded-md bg-white border border-slate-300 text-slate-700 px-4 py-3 text-xs font-bold hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-all"
            >
              <Upload size={18} strokeWidth={2.2} className="text-slate-500" />
              <span>Pilih dari File / Galeri</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 text-center mt-3 leading-relaxed">
            Foto KTP, SIM, atau Paspor asli yang jelas dan tidak buram. Sistem akan membaca nomor identitas secara otomatis.
          </p>
        </div>
      ) : (
        /* Jika SUDAH ada foto: tampilkan preview, kontrol aksi, dan status OCR */
        <div className="card p-3 space-y-3 bg-white shadow-sm border-slate-200">
          <div className="relative rounded-md overflow-hidden bg-slate-900/5 border border-slate-200 flex items-center justify-center min-h-[140px] max-h-56">
            <img
              src={preview}
              alt="Foto Identitas"
              className="w-full h-auto max-h-56 object-contain"
            />
          </div>

          {/* Status Pembacaan NIK OCR */}
          {ocrLoading && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-brand-50 border border-brand-200 text-xs text-brand-700 animate-pulse font-medium">
              <Loader2 size={16} className="animate-spin text-brand-600 shrink-0" />
              <span>Memindai dan membaca NIK dari foto KTP secara otomatis...</span>
            </div>
          )}

          {!ocrLoading && ocrStatus?.type === 'success' && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              <div className="leading-tight">
                <span className="font-bold">NIK Terbaca Otomatis:</span>{' '}
                <span className="font-mono font-bold tracking-wider">{ocrStatus.nik}</span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Nomor telah otomatis diisikan ke kolom No. Identitas di bawah. Silakan verifikasi/koreksi bila perlu.
                </p>
              </div>
            </div>
          )}

          {!ocrLoading && ocrStatus?.type === 'warn' && (
            <div className="flex items-start gap-2.5 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <span className="text-[11.5px] leading-tight">{ocrStatus.msg}</span>
            </div>
          )}

          {/* Tombol Aksi: Ganti Foto / Hapus Foto */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startCamera('environment')}
                className="btn-ghost text-xs px-2.5 py-1.5 inline-flex items-center gap-1.5"
                title="Ambil foto ulang dengan kamera"
              >
                <Camera size={14} /> Foto Ulang
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-ghost text-xs px-2.5 py-1.5 inline-flex items-center gap-1.5"
                title="Pilih file lain dari galeri"
              >
                <Upload size={14} /> Ganti File
              </button>
            </div>

            <button
              type="button"
              onClick={removePhoto}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded inline-flex items-center gap-1 font-medium transition-colors"
            >
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </div>
      )}

      {/* Modal Kamera Interaktif Langsung */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl max-w-lg w-full border border-slate-800 flex flex-col max-h-[92vh]">
            {/* Header Modal Kamera */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-brand-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Arahkan KTP / Identitas</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={switchCamera}
                  className="p-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                  title="Ganti kamera depan / belakang"
                >
                  <SwitchCamera size={16} />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
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
              <div className="absolute inset-x-6 inset-y-6 sm:inset-x-10 sm:inset-y-8 border-2 border-brand-400/80 rounded-lg pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between text-[10px] text-brand-300 font-mono font-semibold uppercase">
                  <span>KTP / SIM</span>
                  <span>Posisi Rata</span>
                </div>
                <div className="text-center text-[11px] text-white/90 bg-slate-900/80 py-1 px-3 rounded-full mx-auto backdrop-blur-xs font-medium">
                  Pastikan tulisan NIK terlihat jelas & tidak silau
                </div>
              </div>
            </div>

            {/* Footer Kontrol Pengambilan Foto */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={stopCamera}
                className="btn-ghost text-xs text-slate-300 border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                className="btn-primary px-6 py-2.5 text-xs font-bold shadow-lg flex items-center gap-2"
              >
                <Camera size={18} />
                <span>Ambil Foto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  fileInputRef.current?.click();
                }}
                className="btn-ghost text-xs text-slate-300 border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white"
              >
                Dari File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

