import crypto from 'crypto';

/**
 * Generate cryptographically secure random token
 * E.g. VMS-IN-a8f3b2c9... or VMS-OUT-e7d1c5a2...
 */
export function generateSecureToken(type = 'IN') {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  return `VMS-${type}-${randomBytes}`;
}

/**
 * Compute SHA-256 hash of a QR code token to store securely in database
 */
export function hashToken(token) {
  if (!token || typeof token !== 'string') return null;
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Compute expiration time for a visit pass QR code
 * Default: End of the expected visit day (23:59:59) or +24 hours
 */
export function calculateTokenExpiration(expectedDate, hoursValid = 24) {
  const baseDate = expectedDate ? new Date(expectedDate) : new Date();
  // Set to end of day 23:59:59.999
  const expiration = new Date(baseDate);
  expiration.setHours(23, 59, 59, 999);

  // If already past end of day, give at least 24 hours from now
  const minExpiration = new Date(Date.now() + hoursValid * 3600 * 1000);
  return expiration > minExpiration ? expiration : minExpiration;
}

