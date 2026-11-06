import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const REDIS_HOST = process.env.REDIS_HOST || 'vms-redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const WA_SERVICE_URL = process.env.WA_SERVICE_URL || 'http://whatsapp-service:5001';

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null
};

console.log('================================================================');
console.log('⚡ PT CEMINDO GEMILANG TBK - PLANT BATAM');
console.log('🚀 BULLMQ NOTIFICATION WORKER SERVICE INITIALIZING');
console.log(`📡 Connected to Redis: ${REDIS_HOST}:${REDIS_PORT}`);
console.log(`🔗 WhatsApp Service Gateway: ${WA_SERVICE_URL}`);
console.log('================================================================');

const worker = new Worker(
  'whatsapp-notifications',
  async (job) => {
    const {
      type,
      recipient,
      message,
      qrText,
      isQrImage,
      visitPassId,
      visitId,
      idempotencyKey
    } = job.data;

    const actualVisitId = visitId || visitPassId || null;

    console.log(`[Worker] Processing Job ${job.id} [${type}] to ${recipient} (Attempt: ${job.attemptsMade + 1})`);

    // 1. Check Idempotency Key in notification_logs to prevent duplicate sends
    if (idempotencyKey) {
      const existing = await prisma.notificationLog.findUnique({
        where: { idempotencyKey }
      });
      if (existing && existing.status === 'SENT') {
        console.log(`[Worker] Skipping duplicate job: ${idempotencyKey} already SENT successfully.`);
        return { status: 'SKIPPED_DUPLICATE', id: existing.id };
      }
    }

    // 2. Dispatch to dedicated whatsapp-service
    try {
      let waResponse;
      if (isQrImage || qrText) {
        waResponse = await axios.post(`${WA_SERVICE_URL}/send-image`, {
          phone: recipient,
          qrText: qrText || '',
          caption: message
        }, { timeout: 30000 });
      } else {
        waResponse = await axios.post(`${WA_SERVICE_URL}/send-text`, {
          phone: recipient,
          message
        }, { timeout: 30000 });
      }

      // 3. Upsert NotificationLog as SENT
      if (idempotencyKey) {
        await prisma.notificationLog.upsert({
          where: { idempotencyKey },
          update: {
            status: 'SENT',
            response: JSON.stringify(waResponse.data),
            retryCount: job.attemptsMade
          },
          create: {
            idempotencyKey,
            recipient,
            message,
            type: type || 'GENERAL_ALERT',
            status: 'SENT',
            response: JSON.stringify(waResponse.data),
            retryCount: job.attemptsMade,
            visitId: actualVisitId
          }
        });
      } else {
        await prisma.notificationLog.create({
          data: {
            recipient,
            message,
            type: type || 'GENERAL_ALERT',
            status: 'SENT',
            response: JSON.stringify(waResponse.data),
            retryCount: job.attemptsMade,
            visitId: actualVisitId
          }
        });
      }

      console.log(`[Worker] ✅ Notification dispatched successfully to ${recipient} [Job ${job.id}]`);
      return waResponse.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      console.warn(`[Worker] ❌ Failed to dispatch notification to ${recipient}: ${errMsg}`);

      if (idempotencyKey) {
        await prisma.notificationLog.upsert({
          where: { idempotencyKey },
          update: {
            status: 'FAILED',
            lastError: String(errMsg),
            retryCount: job.attemptsMade + 1
          },
          create: {
            idempotencyKey,
            recipient,
            message,
            type: type || 'GENERAL_ALERT',
            status: 'FAILED',
            lastError: String(errMsg),
            retryCount: job.attemptsMade + 1,
            visitId: actualVisitId
          }
        });
      }

      throw err; // Allow BullMQ retry mechanism
    }
  },
  {
    connection,
    concurrency: 5
  }
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed.`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with reason: ${err.message}`);
});

process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received. Gracefully closing BullMQ worker...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

