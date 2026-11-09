import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, AlertTriangle, LogIn } from 'lucide-react';

export default function PublicScan() {
  const scannerRef = useRef(null);
  const startingRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const stop = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (!scanner) return;
    try {
      await scanner.stop();
    } catch {
      /* scanner already stopped */
    }
    try {
      scanner.clear();
    } catch {
      /* elemen sudah dibersihkan */
    }
  };

  const redirectFromCode = async (decoded) => {
    await stop();
    const code = String(decoded || '').trim();
    if (!code) return;

    try {
      const parsed = new URL(code);
      if (parsed.pathname.startsWith('/pass/')) {
        window.location.href = parsed.pathname;
        return;
      }
    } catch {
      /* token mentah */
    }

    // Kompatibilitas barcode lama yang hanya berisi token.
    window.location.href = `/pass/${encodeURIComponent(code)}`;
  };

  const start = async () => {
    if (startingRef.current || scannerRef.current) return;
    startingRef.current = true;
    setError('');
    try {
      const scanner = new Html5Qrcode('public-qr-reader', { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 250, height: 250 } },
        redirectFromCode,
        () => {}
      );
      setScanning(true);
    } catch {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      try {
        await scanner?.stop();
      } catch {
        /* belum berjalan */
      }
      try {
        scanner?.clear();
      } catch {
        /* tidak ada yang perlu dibersihkan */
      }
      setScanning(false);
      setError('Kamera tidak dapat diakses. Buka halaman melalui HTTPS dan izinkan akses kamera.');
    } finally {
      startingRef.current = false;
    }
  };

  useEffect(() => () => {
    if (scannerRef.current) scannerRef.current.stop().catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Scan Visitor Pass</div>
              <div className="text-xs text-slate-500">PT Cemindo Gemilang · Plant Batam</div>
            </div>
          </div>
          <a href="/login" className="btn-ghost text-xs shrink-0">
            <LogIn size={14} /> Login
          </a>
        </div>

        <div className="card p-5">
          <h1 className="text-lg font-semibold text-slate-900">Scan Barcode Tamu</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tidak perlu login. Arahkan kamera ke barcode tamu dan halaman pass akan terbuka otomatis.
          </p>

          {/* html5-qrcode memiliki isi container ini sepenuhnya — jangan render
              anak React di dalam #public-qr-reader (penyebab error removeChild). */}
          <div
            className={`relative mt-5 rounded-lg overflow-hidden bg-black ${
              scanning ? '' : 'h-72'
            }`}
          >
            <div id="public-qr-reader" className="w-full" />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-white/60">
                <div>
                  <Camera size={34} className="mx-auto mb-3" />
                  <p className="text-sm">Kamera belum aktif</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 flex gap-2 text-xs text-red-700">
              <AlertTriangle size={15} className="shrink-0" /> {error}
            </div>
          )}

          <button className="btn-primary w-full mt-4 py-2.5" onClick={scanning ? stop : start}>
            {scanning ? <CameraOff size={17} /> : <Camera size={17} />}
            {scanning ? 'Hentikan Kamera' : 'Aktifkan Kamera'}
          </button>
        </div>

        <p className="text-[11px] text-center text-slate-400 mt-4">
          Untuk validasi check-in/check-out, gunakan menu Scan Barcode setelah login.
        </p>
      </div>
    </div>
  );
}
