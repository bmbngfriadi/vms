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
  lastError: null,
  started: false
};

let reconnectTimer = null;
let reconnectAttempt = 0;

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

export async function startWhatsApp() {
  if (wa.started && wa.sock) return;
  wa.started = true;
  wa.status = 'CONNECTING';

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));

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

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) await setQr(qr);

    if (connection === 'open') {
      wa.status = 'CONNECTED';
      wa.qrDataUrl = null;
      wa.qrRaw = null;
      wa.lastError = null;
      reconnectAttempt = 0;
      wa.phone = sock.user?.id ? sock.user.id.split(':')[0].split('@')[0] : null;
      console.log(`[WA] Connected as ${wa.phone}`);
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      wa.status = loggedOut ? 'DISCONNECTED' : 'CONNECTING';
      wa.phone = null;
      wa.lastError = lastDisconnect?.error?.message || String(code || 'closed');
      console.warn(`[WA] Connection closed (${code || 'unknown'}). loggedOut=${loggedOut}`);

      if (!loggedOut) {
        const delay = Math.min(30000, 2000 * 2 ** Math.min(reconnectAttempt++, 4));
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          wa.sock = null;
          wa.started = false;
          startWhatsApp().catch((e) => console.error('[WA] Reconnect failed:', e.message));
        }, delay);
      }
    }
  });
}

export async function logoutWhatsApp() {
  try {
    if (wa.sock) await wa.sock.logout();
  } catch {
    /* ignore */
  }
  wa.sock = null;
  wa.started = false;
  wa.status = 'DISCONNECTED';
  wa.qrDataUrl = null;
  wa.phone = null;
}

export async function restartWhatsApp() {
  clearTimeout(reconnectTimer);
  try {
    if (wa.sock) wa.sock.end(undefined);
  } catch {
    /* ignore */
  }
  wa.sock = null;
  wa.started = false;
  wa.status = 'CONNECTING';
  await startWhatsApp();
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
