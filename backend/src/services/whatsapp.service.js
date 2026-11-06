import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { generateQrDataUrl } from './qrcode.service.js';

let sock = null;
let connectionStatus = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, SCAN_QR, CONNECTED
let currentQrCodeRaw = null;
let currentQrDataUrl = null;
let connectedUser = null;

const authFolder = process.env.WA_AUTH_PATH || path.resolve(process.cwd(), 'baileys_auth');

if (!fs.existsSync(authFolder)) {
  fs.mkdirSync(authFolder, { recursive: true });
}

const logger = pino({ level: process.env.NODE_ENV === 'development' ? 'info' : 'warn' });

export async function initWhatsApp() {
  try {
    connectionStatus = 'CONNECTING';
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger,
      auth: state,
      browser: ['PT Cemindo Gemilang VMS', 'Chrome', '1.0.0'],
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQrCodeRaw = qr;
        try {
          currentQrDataUrl = await generateQrDataUrl(qr);
        } catch (err) {
          console.error('[Baileys] Error creating QR Data URL:', err);
        }
        connectionStatus = 'SCAN_QR';
        console.log('[Baileys] QR Code ready for scanning. Scan via WhatsApp web interface.');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.warn(`[Baileys] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
        connectionStatus = 'DISCONNECTED';
        currentQrCodeRaw = null;
        currentQrDataUrl = null;
        connectedUser = null;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('[Baileys] Session logged out. Clearing auth credentials.');
          try {
            fs.rmSync(authFolder, { recursive: true, force: true });
            fs.mkdirSync(authFolder, { recursive: true });
          } catch (e) {
            console.error('[Baileys] Failed to clear auth directory:', e);
          }
          setTimeout(() => initWhatsApp(), 5000);
        } else if (shouldReconnect) {
          setTimeout(() => initWhatsApp(), 5000);
        }
      } else if (connection === 'open') {
        connectionStatus = 'CONNECTED';
        currentQrCodeRaw = null;
        currentQrDataUrl = null;
        connectedUser = sock?.user?.id || 'Connected';
        console.log(`[Baileys] WhatsApp connected successfully as: ${connectedUser}`);
      }
    });

    return sock;
  } catch (error) {
    console.error('[Baileys] Init error:', error);
    connectionStatus = 'DISCONNECTED';
    return null;
  }
}

export function formatPhoneNumber(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export async function sendWhatsAppMessage(phoneNumber, message) {
  const formatted = formatPhoneNumber(phoneNumber);
  if (!formatted) {
    throw new Error(`Invalid phone number: ${phoneNumber}`);
  }

  // Microservice delegation if configured
  if (process.env.WA_SERVICE_URL) {
    try {
      const res = await fetch(`${process.env.WA_SERVICE_URL}/send-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted, message })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('[Baileys Microservice] sendWhatsAppMessage failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  const jid = `${formatted}@s.whatsapp.net`;

  if (connectionStatus !== 'CONNECTED' || !sock) {
    console.warn(`[Baileys] WhatsApp not connected (Status: ${connectionStatus}). Message logged.`);
    return {
      success: false,
      status: 'QUEUED_NOT_CONNECTED',
      message: 'WhatsApp client is currently not connected.'
    };
  }

  try {
    const result = await sock.sendMessage(jid, { text: message });
    return {
      success: true,
      messageId: result?.key?.id,
      jid
    };
  } catch (err) {
    console.error(`[Baileys] Failed to send message to ${jid}:`, err);
    throw err;
  }
}

/**
 * Send WhatsApp Image with Caption (e.g. for QR Code Check-In / Check-Out)
 */
export async function sendWhatsAppImage(phoneNumber, imageBuffer, caption) {
  const formatted = formatPhoneNumber(phoneNumber);
  if (!formatted) {
    throw new Error(`Invalid phone number: ${phoneNumber}`);
  }

  // Microservice delegation if configured
  if (process.env.WA_SERVICE_URL) {
    try {
      const res = await fetch(`${process.env.WA_SERVICE_URL}/send-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formatted,
          caption,
          imageBufferBase64: imageBuffer ? imageBuffer.toString('base64') : null
        })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('[Baileys Microservice] sendWhatsAppImage failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  const jid = `${formatted}@s.whatsapp.net`;

  if (connectionStatus !== 'CONNECTED' || !sock) {
    console.warn(`[Baileys] WhatsApp not connected. Image notification skipped.`);
    return {
      success: false,
      status: 'NOT_CONNECTED'
    };
  }

  try {
    const result = await sock.sendMessage(jid, {
      image: imageBuffer,
      caption: caption || ''
    });
    return {
      success: true,
      messageId: result?.key?.id,
      jid
    };
  } catch (err) {
    console.error(`[Baileys] Failed to send image to ${jid}:`, err);
    throw err;
  }
}

/**
 * Generate QR code as PNG image buffer and send via WhatsApp
 */
export async function sendWhatsAppQrImage(phoneNumber, qrText, caption) {
  // Microservice delegation if configured
  if (process.env.WA_SERVICE_URL) {
    try {
      const res = await fetch(`${process.env.WA_SERVICE_URL}/send-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          qrText,
          caption
        })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('[Baileys Microservice] sendWhatsAppQrImage failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  try {
    const qrBuffer = await QRCode.toBuffer(qrText, {
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    return await sendWhatsAppImage(phoneNumber, qrBuffer, caption);
  } catch (err) {
    console.error('[Baileys] Failed to generate/send QR image:', err);
    // Fallback to sending text if image fails
    return await sendWhatsAppMessage(phoneNumber, `${caption}\n\n*Kode Token QR:* ${qrText}`);
  }
}

export async function getWhatsAppStatus() {
  if (process.env.WA_SERVICE_URL) {
    try {
      const res = await fetch(`${process.env.WA_SERVICE_URL}/status`);
      const data = await res.json();
      return {
        status: data.status,
        user: data.phoneNumber,
        hasQr: !!data.qrCode,
        qrDataUrl: data.qrCode,
        timestamp: data.timestamp
      };
    } catch (err) {
      return {
        status: 'DISCONNECTED',
        user: null,
        hasQr: false,
        qrDataUrl: null,
        error: 'WhatsApp microservice unreachable: ' + err.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  return {
    status: connectionStatus,
    user: connectedUser,
    hasQr: !!currentQrDataUrl,
    qrDataUrl: currentQrDataUrl,
    timestamp: new Date().toISOString()
  };
}

export async function restartWhatsApp() {
  if (process.env.WA_SERVICE_URL) {
    try {
      const res = await fetch(`${process.env.WA_SERVICE_URL}/restart`, { method: 'POST' });
      return await res.json();
    } catch (err) {
      console.error('[Baileys Microservice] restartWhatsApp failed:', err.message);
      throw err;
    }
  }

  if (sock) {
    try {
      sock.end();
    } catch (e) {
      // ignore
    }
  }
  return initWhatsApp();
}
