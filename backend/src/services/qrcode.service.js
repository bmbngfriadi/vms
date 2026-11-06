import QRCode from 'qrcode';

export async function generateQrDataUrl(text, options = {}) {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      color: {
        dark: '#1e293b', // slate-800
        light: '#ffffff'
      },
      width: 320,
      ...options
    };
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (err) {
    console.error('[QRCode] Failed to generate QR code data URL:', err);
    throw err;
  }
}

export async function generateQrSvg(text, options = {}) {
  try {
    return await QRCode.toString(text, { type: 'svg', margin: 2, ...options });
  } catch (err) {
    console.error('[QRCode] Failed to generate SVG:', err);
    throw err;
  }
}

