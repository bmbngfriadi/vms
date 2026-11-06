import prisma from '../config/database.js';

/**
 * Replace placeholders like {guestName}, {company}, etc. in template body
 */
export function interpolateTemplate(templateString, variables = {}) {
  if (!templateString) return '';
  return templateString.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : '';
  });
}

/**
 * Get formatted notification message by template code
 */
export async function getRenderedNotification(code, variables = {}) {
  try {
    const template = await prisma.notificationTemplate.findUnique({
      where: { code }
    });

    if (template && template.isActive && template.templateBody) {
      return {
        message: interpolateTemplate(template.templateBody, variables),
        isQrImage: template.isQrImage
      };
    }
  } catch (err) {
    console.warn(`[Template Service] Could not fetch template ${code}:`, err.message);
  }

  // Built-in fallback
  return {
    message: `Notifikasi Kunjungan PT Cemindo Gemilang Tbk - Plant Batam: ${variables.guestName || ''} (${variables.company || ''})`,
    isQrImage: false
  };
}

/**
 * Query all active Management recipients (from ManagementRecipient model + User with role MANAGEMENT)
 * Returns deduplicated array of { name, phone }
 */
export async function getActiveManagementRecipients() {
  const recipients = new Map();

  try {
    // 1. From ManagementRecipient table
    const explicitRecipients = await prisma.managementRecipient.findMany({
      where: { isActive: true }
    });
    for (const r of explicitRecipients) {
      if (r.phone) {
        recipients.set(r.phone.trim(), {
          name: r.name,
          phone: r.phone.trim(),
          source: 'MANAGEMENT_RECIPIENT_TABLE'
        });
      }
    }

    // 2. From User table with role MANAGEMENT
    const mgmtUsers = await prisma.user.findMany({
      where: { role: 'MANAGEMENT', isActive: true, phone: { not: null } }
    });
    for (const u of mgmtUsers) {
      if (u.phone && !recipients.has(u.phone.trim())) {
        recipients.set(u.phone.trim(), {
          name: u.name,
          phone: u.phone.trim(),
          source: 'USER_ACCOUNT'
        });
      }
    }
  } catch (err) {
    console.warn('[Management Alert] Error querying management recipients:', err.message);
  }

  return Array.from(recipients.values());
}

