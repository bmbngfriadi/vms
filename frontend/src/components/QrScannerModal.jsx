import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle, FlipHorizontal } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const { t } = useLanguage();
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = rear, 'user' = front
  const scannerRef = useRef(null);
  const scannerContainerId = 'qr-reader-region';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    startScanner(facingMode);

    return () => {
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const startScanner = async (mode = 'environment') => {
    setError(null);
    setIsScanning(true);

    try {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {
          // ignore
        }
      }

      // Small timeout to allow modal DOM rendering
      await new Promise((resolve) => setTimeout(resolve, 200));

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: mode },
        config,
        (decodedText) => {
          stopScanner();
          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }
        },
        (errorMessage) => {
          // ignore continuous scanning frame errors
        }
      );
    } catch (err) {
      console.error('Camera Scanner Error:', err);
      setError(err?.message || t('scannerCameraPermission'));
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error clearing scanner:', e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cemindo-red" />
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">{t('scannerTitle')}</h3>
              <p className="text-[10px] text-slate-400">
                {facingMode === 'environment' ? `📷 ${t('cameraFacingRear')}` : `🤳 ${t('cameraFacingFront')}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleCamera}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title={t('switchCamera')}
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-cemindo-red" />
              <span className="hidden sm:inline">{t('switchCamera')}</span>
            </button>
            <button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col items-center">
          <p className="text-xs text-slate-500 text-center mb-3">
            {t('scannerSubtitle')}
          </p>

          {error && (
            <div className="w-full mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Scanner view port */}
          <div className="w-full relative rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[280px]">
            <div id={scannerContainerId} className="w-full"></div>
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none border-2 border-cemindo-red/40 rounded-xl flex items-center justify-center">
              <div className="w-52 h-52 border-2 border-dashed border-red-500/80 rounded-lg animate-pulse" />
            </div>
          </div>

          <div className="w-full mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleToggleCamera}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-cemindo-red" />
              <span>{t('switchCamera')}</span>
            </button>
            <button
              type="button"
              onClick={() => startScanner(facingMode)}
              disabled={isScanning}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('action_refresh')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

