import prisma from '../config/database.js';

export async function logActivity({ userId, action, description, req }) {
  try {
    const ipAddress =
      req?.headers['x-forwarded-for'] ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      null;

    return await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action,
        description,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : null
      }
    });
  } catch (err) {
    console.warn('[ActivityLog] Failed to log activity:', err.message);
    return null;
  }
}

