import prisma from '../config/db.js';

/**
 * Log a security or system operation to the database audit trail.
 * 
 * @param {Object} params
 * @param {string} params.action - Name of the action being audit-logged
 * @param {number} [params.userId] - Optional database user ID
 * @param {string} [params.userEmail] - Optional user email address
 * @param {string} params.tenantId - UUID of the isolated tenant
 * @param {string} [params.ipAddress] - Request source IP address
 * @param {Object|string} [params.details] - Arbitrary additional metadata
 */
export const logAudit = async ({ action, userId, userEmail, tenantId, ipAddress, details }) => {
  try {
    if (!tenantId) {
      console.warn('[Audit Logger] Skipping log: tenantId is missing for action:', action);
      return;
    }

    let serializedDetails = null;
    if (details) {
      if (typeof details === 'object') {
        serializedDetails = JSON.stringify(details);
      } else {
        serializedDetails = String(details);
      }
    }

    await prisma.auditLog.create({
      data: {
        action,
        userId: userId ? parseInt(userId, 10) : null,
        userEmail: userEmail || null,
        tenantId,
        ipAddress: ipAddress || null,
        details: serializedDetails
      }
    });
  } catch (error) {
    console.error('[Audit Logger Error] Failed to write audit log:', error.message);
  }
};
