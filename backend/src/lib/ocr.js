import { createWorker } from 'tesseract.js';

let workerInstance = null;
let workerInitPromise = null;

async function getWorker() {
  if (workerInstance) return workerInstance;
  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = (async () => {
    try {
      // Inisialisasi Tesseract dengan bahasa Indonesia dan Inggris
      const worker = await createWorker('ind+eng');
      workerInstance = worker;
      return worker;
    } catch (err) {
      console.warn('[OCR] Gagal inisialisasi ind+eng, mencoba fallback eng...', err.message);
      const worker = await createWorker('eng');
      workerInstance = worker;
      return worker;
    } finally {
      workerInitPromise = null;
    }
  })();

  return workerInitPromise;
}

/**
 * Normalisasi dan ekstraksi Nomor Identitas (NIK KTP 16-digit, SIM, atau Paspor)
 * dari teks hasil OCR dengan toleransi kesalahan optik huruf-angka.
 */
export function parseIdentityNumber(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. Ekstraksi langsung setelah kata kunci NIK (16 digit)
  const mNikExact = text.match(/(?:NIK|N\s*I\s*K)\D*([0-9]{16})/i);
  if (mNikExact) return { number: mNikExact[1], type: 'KTP' };

  // 2. Baris NIK dengan noise OCR (misal O, D terbaca bukan 0; l, I terbaca bukan 1; B terbaca bukan 8)
  const mNikNoisy = text.match(/(?:NIK|N\s*I\s*K)\D*([0-9OolIDBSG]{16})/i);
  if (mNikNoisy) {
    const cleaned = mNikNoisy[1]
      .replace(/[Ool]/g, '0')
      .replace(/[I|!]/g, '1')
      .replace(/D/g, '0')
      .replace(/B/g, '8')
      .replace(/S/g, '5')
      .replace(/G/g, '6');
    if (/^[0-9]{16}$/.test(cleaned)) {
      return { number: cleaned, type: 'KTP' };
    }
  }

  // 3. Standalone 16 digit angka di seluruh teks
  const m16 = text.match(/\b([1-9][0-9]{15})\b/);
  if (m16) return { number: m16[1], type: 'KTP' };

  // 4. Deteksi Paspor (1 huruf + 7-8 digit angka, misal A1234567 atau B12345678)
  const mPassport = text.match(/\b([A-Z][0-9]{7,8})\b/i);
  if (mPassport) return { number: mPassport[1].toUpperCase(), type: 'PASSPORT' };

  // 5. Deteksi SIM (12-14 digit angka)
  const mSim = text.match(/\b([0-9]{12,14})\b/);
  if (mSim) return { number: mSim[1], type: 'SIM' };

  return null;
}

/**
 * Proses pembacaan OCR dari data gambar (Buffer atau data:image base64)
 */
export async function recognizeIdentityImage(imageData) {
  try {
    const worker = await getWorker();

    let imageInput = imageData;
    // Jika format data:image/..., ubah ke buffer jika diperlukan atau gunakan langsung
    if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
      const base64Data = imageData.split(',')[1];
      imageInput = Buffer.from(base64Data, 'base64');
    }

    const { data } = await worker.recognize(imageInput);
    const rawText = data?.text || '';
    const parsed = parseIdentityNumber(rawText);

    return {
      success: true,
      nik: parsed ? parsed.number : null,
      idType: parsed ? parsed.type : null,
      rawText: rawText.slice(0, 500) // batas preview teks
    };
  } catch (err) {
    console.error('[OCR Error]', err);
    return {
      success: false,
      nik: null,
      idType: null,
      error: err.message
    };
  }
}

