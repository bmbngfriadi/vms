import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';

const AUTH_PATH = process.env.WA_AUTH_PATH || './wa_auth';
const logger = pino({ level: 'silent' });

export const wa = {
  sock: null,
  status: 'DISCONNECTED', // DISCONNECTED | CONNECTING | QR | CONNECTED
  qrDataUrl: null,
  qrRaw: null,
  phone: null,
  lastError: null
};

/**
 * Hanya boleh ada SATU socket aktif. Setiap socket diberi nomor generasi;
 * event dari socket lama diabaikan agar tidak memicu koneksi ganda
 * (penyebab error 440 "Stream Errored (conflict)").
 */
let generation = 0;
let reconnectTimer = null;
let reconnectAttempt = 0;
let opening = false;

const RECONNECT_BASE_MS = 3000;
const RECONNECT_MAX_MS = 60000;

export function normalizePhone(input) {
  if (!input) return null;
  let d = String(input).replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('0')) d = `62${d.slice(1)}`;
  else if (d.startsWith('8')) d = `62${d}`;
  if (!d.startsWith('62')) return null;
  if (d.length < 10 || d.length > 15) return null;
  return d;
}

export function toJid(phone) {
  const p = normalizePhone(phone);
  return p ? `${p}@s.whatsapp.net` : null;
}

async function setQr(qr) {
  wa.qrRaw = qr;
  wa.status = 'QR';
  try {
    wa.qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 320 });
  } catch {
    wa.qrDataUrl = null;
  }
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

/** Lepas semua listener lalu tutup socket, supaya penutupan tidak memicu reconnect. */
function teardownSocket(sock) {
  if (!sock) return;
  try {
    sock.ev.removeAllListeners('connection.update');
  } catch {
    /* ignore */
  }
  try {
    sock.ev.removeAllListeners('creds.update');
  } catch {
    /* ignore */
  }
  try {
    sock.end(undefined);
  } catch {
    /* ignore */
  }
}

function scheduleReconnect(reason) {
  if (reconnectTimer) return;
  const attempt = reconnectAttempt;
  reconnectAttempt = Math.min(reconnectAttempt + 1, 10);
  const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** Math.min(attempt, 4));
  console.warn(`[WA] Menjadwalkan sambung ulang dalam ${Math.round(delay / 1000)}s — ${reason}`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startWhatsApp().catch((e) => console.error('[WA] Reconnect gagal:', e.message));
  }, delay);
}

export async function startWhatsApp() {
  if (opening || wa.sock) return;
  opening = true;
  const gen = ++generation;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));

    // Dibatalkan (mis. logout/restart) selama menunggu state
    if (gen !== generation) return;

    const sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['VMS Cemindo Batam', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false
    });

    wa.sock = sock;
    wa.status = 'CONNECTING';

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
      handleUpdate(update, gen, sock).catch((e) => console.error('[WA] update error:', e.message));
    });
  } catch (err) {
    wa.status = 'DISCONNECTED';
    wa.lastError = err.message;
    scheduleReconnect('gagal membuka koneksi');
  } finally {
    opening = false;
  }
}

async function handleUpdate(update, gen, sock) {
  // Abaikan event dari socket yang sudah tidak berlaku
  if (gen !== generation) return;

  const { connection, lastDisconnect, qr } = update;

  if (qr) await setQr(qr);

  if (connection === 'open') {
    wa.status = 'CONNECTED';
    wa.qrDataUrl = null;
    wa.qrRaw = null;
    wa.lastError = null;
    reconnectAttempt = 0;
    wa.phone = sock.user?.id ? String(sock.user.id).split(':')[0].split('@')[0] : null;
    console.log(`[WA] Terhubung sebagai ${wa.phone}`);
    return;
  }

  if (connection === 'close') {
    const code = lastDisconnect?.error?.output?.statusCode;
    const loggedOut = code === DisconnectReason.loggedOut;

    teardownSocket(sock);
    if (wa.sock === sock) wa.sock = null;
    wa.phone = null;

    if (loggedOut) {
      wa.status = 'DISCONNECTED';
      wa.qrDataUrl = null;
      wa.lastError = 'Sesi WhatsApp telah dihentikan. Scan QR untuk menghubungkan kembali.';
      console.warn('[WA] Logged out — perlu scan QR ulang');
      return;
    }

    wa.status = 'CONNECTING';
    if (code === 440) {
      // Beri jeda lebih panjang: sesi lama di server butuh waktu dilepas
      reconnectAttempt = Math.max(reconnectAttempt, 2);
      wa.lastError = 'Sesi bentrok: sesi WhatsApp ini sedang dipakai proses lain.';
    } else if (code === 428) {
      wa.lastError = 'Koneksi ditutup oleh server, mencoba menyambung ulang…';
    } else {
      wa.lastError = lastDisconnect?.error?.message || `Koneksi ditutup (${code ?? 'tidak diketahui'})`;
    }

    console.warn(`[WA] Koneksi terputus (${code ?? 'unknown'})`);
    scheduleReconnect(wa.lastError);
  }
}

/** Restart manual: tutup socket lama, beri jeda agar server melepas sesi, lalu buka satu socket baru. */
export async function restartWhatsApp() {
  clearReconnectTimer();
  reconnectAttempt = 0;
  generation += 1; // batalkan seluruh handler socket lama

  const old = wa.sock;
  wa.sock = null;
  teardownSocket(old);

  wa.status = 'CONNECTING';
  wa.qrDataUrl = null;
  wa.lastError = null;

  await new Promise((r) => setTimeout(r, 2000));
  await startWhatsApp();
}

export async function logoutWhatsApp() {
  clearReconnectTimer();
  reconnectAttempt = 0;
  generation += 1;

  const old = wa.sock;
  wa.sock = null;

  try {
    if (old) await old.logout();
  } catch {
    /* ignore */
  }
  teardownSocket(old);

  wa.status = 'DISCONNECTED';
  wa.qrDataUrl = null;
  wa.qrRaw = null;
  wa.phone = null;
  wa.lastError = null;
}

/** Dipakai tombol "Muat ulang QR": hanya menyambung bila memang sedang tidak terhubung. */
export async function reconnectIfNeeded() {
  if (wa.status === 'CONNECTED' || wa.sock) return false;
  clearReconnectTimer();
  reconnectAttempt = 0;
  await startWhatsApp();
  return true;
}

function assertConnected() {
  if (wa.status !== 'CONNECTED' || !wa.sock) {
    throw new Error('WhatsApp gateway belum terhubung');
  }
}

export async function sendText(phone, text) {
  assertConnected();
  const jid = toJid(phone);
  if (!jid) throw new Error(`Nomor tidak valid: ${phone}`);
  return wa.sock.sendMessage(jid, { text });
}

export async function sendImage(phone, buffer, caption) {
  assertConnected();
  const jid = toJid(phone);
  if (!jid) throw new Error(`Nomor tidak valid: ${phone}`);
  return wa.sock.sendMessage(jid, { image: buffer, caption });
}
