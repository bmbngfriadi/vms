import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pino from 'pino';
import QRCode from 'qrcode';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const AUTH_DIR = process.env.WA_AUTH_PATH || '/app/baileys_auth';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Service state
let sock = null;
let connectionStatus = 'DISCONNECTED'; // CONNECTED, CONNECTING, SCAN_QR, DISCONNECTED
let currentQrCodeDataUrl = null;
let connectedPhoneNumber = null;
let isReconnecting = false;

const logger = pino({ level: 'info' });

async function initBaileys() {
  if (isReconnecting) return;
  isReconnecting = true;

  try {
    console.log(`[Baileys Service] Initializing Baileys engine from persistent volume: ${AUTH_DIR}`);
    connectionStatus = 'CONNECTING';

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 15000,
      browser: ['PT Cemindo Gemilang Plant Batam VMS', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = 'SCAN_QR';
        try {
          currentQrCodeDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 320,
            color: { dark: '#0f172a', light: '#ffffff' }
          });
          console.log('[Baileys Service] QR Code pairing ready for scanning via WhatsApp Web');
        } catch (qrErr) {
          console.error('[Baileys Service] Failed to generate QR data URL:', qrErr);
        }
      }

      if (connection === 'open') {
        connectionStatus = 'CONNECTED';
        currentQrCodeDataUrl = null;
        const jid = sock?.user?.id || '';
        connectedPhoneNumber = jid.split(':')[0] || jid.split('@')[0] || null;
        console.log(`[Baileys Service] WhatsApp Connected successfully as: ${connectedPhoneNumber}`);
        isReconnecting = false;
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[Baileys Service] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);

        connectionStatus = 'DISCONNECTED';
        currentQrCodeDataUrl = null;
        connectedPhoneNumber = null;
        isReconnecting = false;

        if (shouldReconnect) {
          setTimeout(() => initBaileys(), 3000);
        }
      }
    });
  } catch (err) {
    console.error('[Baileys Service] Error during initialization:', err);
    connectionStatus = 'DISCONNECTED';
    isReconnecting = false;
    setTimeout(() => initBaileys(), 5000);
  }
}

function formatJid(phone) {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  if (!clean.endsWith('@s.whatsapp.net')) clean = `${clean}@s.whatsapp.net`;
  return clean;
}

// ==============================================================================
// REST ENDPOINTS
// ==============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PT Cemindo Gemilang WhatsApp Service',
    connectionStatus,
    connectedPhoneNumber,
    timestamp: new Date().toISOString()
  });
});

app.get('/status', (req, res) => {
  res.json({
    status: connectionStatus,
    isConnected: connectionStatus === 'CONNECTED',
    qrCode: currentQrCodeDataUrl,
    phoneNumber: connectedPhoneNumber,
    sessionPath: AUTH_DIR,
    timestamp: new Date().toISOString()
  });
});

app.post('/restart', async (req, res) => {
  try {
    console.log('[Baileys Service] Restart requested via API');
    if (sock) {
      try { sock.end(); } catch (e) {}
    }
    isReconnecting = false;
    initBaileys();
    res.json({ message: 'WhatsApp Service restarted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restart WhatsApp Service: ' + err.message });
  }
});

app.post('/send-text', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    if (connectionStatus !== 'CONNECTED' || !sock) {
      return res.status(503).json({
        error: 'WhatsApp client is currently not connected. Please scan QR in WhatsApp Settings.',
        connectionStatus
      });
    }

    const jid = formatJid(phone);
    const sent = await sock.sendMessage(jid, { text: message });

    res.json({
      success: true,
      messageId: sent.key.id,
      recipient: phone,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Baileys Service] Failed to send text message:', err);
    res.status(500).json({ error: err.message || 'Failed to send WhatsApp message' });
  }
});

app.post('/send-image', async (req, res) => {
  try {
    const { phone, imageBufferBase64, caption, qrText } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (connectionStatus !== 'CONNECTED' || !sock) {
      return res.status(503).json({
        error: 'WhatsApp client is currently not connected. Please scan QR in WhatsApp Settings.',
        connectionStatus
      });
    }

    let imageBuffer = null;
    if (imageBufferBase64) {
      imageBuffer = Buffer.from(imageBufferBase64, 'base64');
    } else if (qrText) {
      imageBuffer = await QRCode.toBuffer(qrText, {
        width: 450,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
    }

    if (!imageBuffer) {
      return res.status(400).json({ error: 'Image buffer or qrText is required' });
    }

    const jid = formatJid(phone);
    const sent = await sock.sendMessage(jid, {
      image: imageBuffer,
      caption: caption || ''
    });

    res.json({
      success: true,
      messageId: sent.key.id,
      recipient: phone,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Baileys Service] Failed to send image message:', err);
    res.status(500).json({ error: err.message || 'Failed to send WhatsApp image' });
  }
});

// Start Express and Baileys
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`📡 VMS WHATSAPP BAILEYS SERVICE STARTED ON PORT: ${PORT}`);
  console.log(`📁 AUTH SESSION PATH: ${AUTH_DIR}`);
  console.log(`=======================================================`);
  initBaileys();
});

