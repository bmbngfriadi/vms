import prisma from '../db.js';
import { sendText, sendImage, normalizePhone, wa } from './client.js';

/**
 * Antrian pengiriman WhatsApp sederhana (in-process, tanpa Redis/BullMQ).
 * Setiap pesan dicatat ke notification_logs agar bisa diaudit & dikirim ulang.
 */
const queue = [];
let running = false;

const MAX_ATTEMPTS = 3;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function drain() {
  if (running) return;
  running = true;

  while (queue.length > 0) {
    const job = queue.shift();

    // Gateway belum terhubung: catat langsung sebagai gagal, tanpa retry sia-sia.
    if (wa.status !== 'CONNECTED') {
      try {
        await prisma.notificationLog.create({
          data: {
            visitId: job.visitId || null,
            recipient: job.recipient,
            type: job.type,
            message: job.message,
            status: 'FAILED',
            error: `Gateway WhatsApp belum terhubung (status: ${wa.status})`,
            attempts: 1
          }
        });
      } catch (e) {
        console.error('[Notify] Gagal menulis log notifikasi:', e.message);
      }
      continue;
    }

    let attempt = 0;
    let lastError = null;
    let sent = false;

    while (attempt < MAX_ATTEMPTS && !sent) {
      attempt += 1;
      try {
        if (job.imageBuffer) {
          await sendImage(job.recipient, job.imageBuffer, job.message);
        } else {
          await sendText(job.recipient, job.message);
        }
        sent = true;
      } catch (err) {
        lastError = err.message || String(err);
        if (attempt < MAX_ATTEMPTS) await sleep(1500 * attempt);
      }
    }

    try {
      await prisma.notificationLog.create({
        data: {
          visitId: job.visitId || null,
          recipient: job.recipient,
          type: job.type,
          message: job.message,
          status: sent ? 'SENT' : 'FAILED',
          error: sent ? null : lastError,
          attempts: attempt
        }
      });
    } catch (e) {
      console.error('[Notify] Gagal menulis log notifikasi:', e.message);
    }

    if (!sent) {
      console.warn(`[Notify] GAGAL kirim ${job.type} ke ${job.recipient}: ${lastError}`);
    }
  }

  running = false;
}

/**
 * Kirim pesan WhatsApp secara asinkron (tidak memblokir response HTTP).
 */
export function notify({ visitId, recipient, type, message, imageBuffer }) {
  const phone = normalizePhone(recipient);
  if (!phone) {
    console.warn(`[Notify] Nomor tidak valid, pesan ${type} dilewati: ${recipient}`);
    return false;
  }

  queue.push({ visitId, recipient: phone, type, message, imageBuffer });
  drain().catch((e) => console.error('[Notify] Queue error:', e.message));
  return true;
}

/** Kirim banyak pesan sekaligus. */
export function notifyMany(items) {
  items.forEach((item) => notify(item));
}
