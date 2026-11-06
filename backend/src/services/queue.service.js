import { Queue, Worker } from 'bullmq';
import crypto from 'crypto';
import { redisConnectionOptions } from '../config/redis.js';
import { sendWhatsAppMessage, sendWhatsAppQrImage, formatPhoneNumber } from './whatsapp.service.js';
import prisma from '../config/database.js';

export const QUEUE_NAME = 'whatsapp-notifications';

export const waQueue = new Queue(QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100,
    removeOnFail: 200
  }
});

/**
 * Enqueue WhatsApp notification with Idempotency Key protection
 */
export async function enqueueWhatsAppNotification({
  type,
  recipient,
  message,
  qrText,
  isQrImage = false,
  visitId,
  visitPassId,
  idempotencyKey
}) {
  try {
    const formattedPhone = formatPhoneNumber(recipient) || recipient;
    const actualVisitId = visitId || visitPassId || null;

    // Generate deterministically safe idempotency key if not provided
    const key =
      idempotencyKey ||
      `${type || 'GEN'}_${actualVisitId || 'NONE'}_${formattedPhone}_${crypto
        .createHash('md5')
        .update(message || '')
        .digest('hex')
        .slice(0, 10)}`;

    // Check if message with this idempotency key was already SENT
    const existing = await prisma.notificationLog.findUnique({
      where: { idempotencyKey: key }
    });

    if (existing && existing.status === 'SENT') {
      console.log(`[BullMQ] Idempotent duplicate blocked for key ${key} (${type} to ${formattedPhone})`);
      return { skipped: true, reason: 'ALREADY_SENT', key };
    }

    // Upsert or create initial PENDING log
    let logRecord;
    if (existing) {
      logRecord = await prisma.notificationLog.update({
        where: { idempotencyKey: key },
        data: {
          status: 'PENDING',
          message: isQrImage ? `[QR Image] ${message}` : message,
          visitId: actualVisitId
        }
      });
    } else {
      logRecord = await prisma.notificationLog.create({
        data: {
          idempotencyKey: key,
          recipient: formattedPhone,
          message: isQrImage ? `[QR Image] ${message}` : message,
          type: type || 'GENERIC',
          status: 'PENDING',
          visitId: actualVisitId
        }
      });
    }

    const job = await waQueue.add(
      type || 'send-wa',
      {
        logId: logRecord.id,
        idempotencyKey: key,
        type,
        recipient: formattedPhone,
        message,
        qrText,
        isQrImage,
        visitId: actualVisitId,
        createdAt: new Date().toISOString()
      },
      { jobId: key } // BullMQ built-in deduplication by jobId
    );

    return job;
  } catch (err) {
    console.error('[BullMQ] Enqueue error:', err);
    return null;
  }
}

// In-process fallback Worker only active when NOT in dedicated microservice mode
export let waWorker = null;

if (!process.env.WA_SERVICE_URL) {
  waWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { logId, idempotencyKey, recipient, message, qrText, isQrImage, type } = job.data;
      console.log(`[BullMQ Worker] Processing job ${job.id} (${type}) for ${recipient}`);

      // Check if already sent
      if (logId) {
        const currentLog = await prisma.notificationLog.findUnique({ where: { id: logId } });
        if (currentLog?.status === 'SENT') {
          console.log(`[BullMQ Worker] Message ${logId} already SENT, skipping.`);
          return { success: true, skipped: true };
        }
      }

      try {
        let result;
        if (isQrImage && qrText) {
          result = await sendWhatsAppQrImage(recipient, qrText, message);
        } else {
          result = await sendWhatsAppMessage(recipient, message);
        }

        const status = result?.success ? 'SENT' : 'FAILED';

        if (logId) {
          await prisma.notificationLog.update({
            where: { id: logId },
            data: {
              status,
              response: JSON.stringify(result),
              retryCount: { increment: 1 },
              lastError: result?.success ? null : (result?.status || 'Baileys not connected')
            }
          });
        }

        return result;
      } catch (error) {
        console.error(`[BullMQ Worker] Job ${job.id} failed:`, error.message);
        if (logId) {
          await prisma.notificationLog.update({
            where: { id: logId },
            data: {
              status: 'FAILED',
              lastError: error.message,
              retryCount: { increment: 1 }
            }
          });
        }
        throw error;
      }
    },
    {
      connection: redisConnectionOptions,
      concurrency: 2
    }
  );

  waWorker.on('completed', (job) => {
    console.log(`[BullMQ Worker] Job ${job.id} finished successfully`);
  });

  waWorker.on('failed', (job, err) => {
    console.warn(`[BullMQ Worker] Job ${job?.id} failed with ${err.message}`);
  });
}
